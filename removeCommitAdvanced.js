import simpleGit from "simple-git";
import moment from "moment";
import readline from "readline";

const git = simpleGit();

/**
 * Create readline interface for user confirmation
 */
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Prompt user for confirmation
 * @param {string} message - The confirmation message
 * @returns {Promise<boolean>} - True if user confirms
 */
const askConfirmation = (message) => {
    return new Promise((resolve) => {
        rl.question(`${message} (y/N): `, (answer) => {
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
};

/**
 * Advanced commit removal based on x and y coordinates with safety checks
 * @param {number} x - Week position (0-54)
 * @param {number} y - Day position (0-6)
 * @param {Object} options - Configuration options
 */
const removeCommitByCoordinates = async (x, y, options = {}) => {
    const {
        force = false,
        interactive = true,
        dryRun = false,
        backup = true
    } = options;

    try {
        // Validate coordinates
        if (x < 0 || x > 54) {
            throw new Error("X coordinate must be between 0 and 54 (weeks)");
        }
        if (y < 0 || y > 6) {
            throw new Error("Y coordinate must be between 0 and 6 (days)");
        }

        // Create backup branch if requested
        if (backup && !dryRun) {
            const backupBranchName = `backup-before-removal-${Date.now()}`;
            await git.checkoutLocalBranch(backupBranchName);
            await git.checkout('main'); // or current branch
            console.log(`✓ Created backup branch: ${backupBranchName}`);
        }

        // Calculate target date based on coordinates
        const targetDate = moment()
            .subtract(1, "y")
            .add(1, "d")
            .add(x, "w")
            .add(y, "d");

        const targetDateStr = targetDate.format("YYYY-MM-DD");
        
        console.log(`🎯 Targeting commits on ${targetDateStr} (coordinates: x=${x}, y=${y})`);

        // Get commit history
        const log = await git.log(['--all', '--pretty=format:%H|%s|%ad', '--date=short']);
        
        // Find matching commits
        const matchingCommits = [];
        const logEntries = log.latest ? [log.latest, ...log.all] : log.all;
        
        logEntries.forEach(commit => {
            if (commit.date && commit.date.includes(targetDateStr)) {
                matchingCommits.push(commit);
            }
        });

        if (matchingCommits.length === 0) {
            console.log(`❌ No commits found for coordinates x:${x}, y:${y} on ${targetDateStr}`);
            if (backup) {
                await cleanupBackupBranch();
            }
            return;
        }

        console.log(`\n📋 Found ${matchingCommits.length} commit(s) to remove:`);
        matchingCommits.forEach((commit, index) => {
            console.log(`  ${index + 1}. ${commit.hash.substring(0, 8)}: ${commit.message}`);
        });

        if (dryRun) {
            console.log("\n🔍 DRY RUN - No commits will actually be removed");
            return matchingCommits;
        }

        // Interactive confirmation
        if (interactive && !force) {
            const confirmed = await askConfirmation(
                `\n⚠️  This will permanently remove ${matchingCommits.length} commit(s). Continue?`
            );
            if (!confirmed) {
                console.log("❌ Operation cancelled by user");
                if (backup) {
                    await cleanupBackupBranch();
                }
                return;
            }
        }

        // Remove commits using filter-branch for safer removal
        await removeCommitsUsingFilter(matchingCommits, targetDateStr);

        console.log(`✅ Successfully removed commits for coordinates x:${x}, y:${y}`);
        
        if (backup) {
            console.log(`📁 Backup available in branch: backup-before-removal-*`);
        }

    } catch (error) {
        console.error("❌ Error removing commits:", error.message);
        throw error;
    } finally {
        rl.close();
    }
};

/**
 * Remove commits using git filter-branch for safer removal
 * @param {Array} commits - Array of commit objects to remove
 * @param {string} targetDate - Target date string
 */
const removeCommitsUsingFilter = async (commits, targetDate) => {
    try {
        console.log("🔄 Removing commits using git filter-branch...");
        
        // Create a script to filter out specific commits
        const commitHashes = commits.map(c => c.hash);
        
        // Use filter-branch to exclude specific commits
        const filterCommand = [
            'filter-branch',
            '--force',
            '--commit-filter',
            `
            if [ "$GIT_COMMIT" = "${commitHashes.join('" ] || [ "$GIT_COMMIT" = "')}" ]; then
                skip_commit "$@";
            else
                git commit-tree "$@";
            fi
            `,
            'HEAD'
        ];

        await git.raw(filterCommand);
        
        console.log("✅ Filter-branch completed successfully");

        // Force push if on remote
        try {
            await git.push(['-f', 'origin', 'main']);
            console.log("✅ Changes pushed to remote repository");
        } catch (pushError) {
            console.log("⚠️  Could not push to remote (this is normal if working locally)");
        }

    } catch (error) {
        console.error("❌ Error during filter-branch:", error.message);
        // Fallback to rebase method
        await removeCommitsUsingRebase(commits);
    }
};

/**
 * Fallback method using interactive rebase
 * @param {Array} commits - Array of commits to remove
 */
const removeCommitsUsingRebase = async (commits) => {
    console.log("🔄 Falling back to rebase method...");
    
    for (const commit of commits) {
        try {
            // Use rebase to remove specific commit
            await git.raw(['rebase', '--onto', `${commit.hash}^`, commit.hash]);
            console.log(`✅ Removed commit: ${commit.hash.substring(0, 8)}`);
        } catch (error) {
            console.error(`❌ Failed to remove commit ${commit.hash.substring(0, 8)}: ${error.message}`);
        }
    }
};

/**
 * Clean up backup branches
 */
const cleanupBackupBranch = async () => {
    try {
        const branches = await git.branchLocal();
        const backupBranches = branches.all.filter(branch => 
            branch.includes('backup-before-removal')
        );
        
        if (backupBranches.length > 5) {
            console.log("🧹 Cleaning up old backup branches...");
            const oldBranches = backupBranches.slice(0, -5);
            for (const branch of oldBranches) {
                await git.deleteLocalBranch(branch);
            }
        }
    } catch (error) {
        console.log("⚠️  Could not clean up backup branches:", error.message);
    }
};

/**
 * Remove commits in a pattern (useful for creating shapes in contribution graph)
 * @param {Array} pattern - Array of {x, y} coordinates
 * @param {Object} options - Configuration options
 */
const removeCommitPattern = async (pattern, options = {}) => {
    console.log(`🎨 Removing commits in pattern (${pattern.length} coordinates)`);
    
    const { dryRun = false } = options;
    
    if (dryRun) {
        console.log("🔍 DRY RUN - Preview of commits that would be removed:");
    }
    
    for (const coord of pattern) {
        await removeCommitByCoordinates(coord.x, coord.y, { 
            ...options, 
            interactive: false,
            backup: false 
        });
    }
};

/**
 * Predefined patterns for common shapes
 */
const patterns = {
    // Create a heart shape
    heart: [
        {x: 1, y: 1}, {x: 2, y: 0}, {x: 3, y: 1},
        {x: 5, y: 1}, {x: 6, y: 0}, {x: 7, y: 1},
        {x: 0, y: 2}, {x: 4, y: 2}, {x: 8, y: 2},
        {x: 1, y: 3}, {x: 7, y: 3},
        {x: 2, y: 4}, {x: 6, y: 4},
        {x: 3, y: 5}, {x: 5, y: 5},
        {x: 4, y: 6}
    ],
    
    // Create a smiley face
    smiley: [
        {x: 2, y: 1}, {x: 6, y: 1}, // eyes
        {x: 1, y: 4}, {x: 2, y: 5}, {x: 3, y: 5}, 
        {x: 4, y: 5}, {x: 5, y: 5}, {x: 6, y: 5}, {x: 7, y: 4} // smile
    ],
    
    // Create initials 'AC' (Analog Clock)
    ac: [
        // A
        {x: 1, y: 0}, {x: 1, y: 1}, {x: 1, y: 2}, {x: 1, y: 3}, {x: 1, y: 4}, {x: 1, y: 5}, {x: 1, y: 6},
        {x: 2, y: 0}, {x: 3, y: 0}, {x: 4, y: 1}, {x: 4, y: 2}, {x: 4, y: 3}, {x: 2, y: 3}, {x: 3, y: 3},
        
        // C
        {x: 6, y: 0}, {x: 7, y: 0}, {x: 8, y: 0}, {x: 6, y: 1}, {x: 6, y: 2}, {x: 6, y: 3},
        {x: 6, y: 4}, {x: 6, y: 5}, {x: 6, y: 6}, {x: 7, y: 6}, {x: 8, y: 6}
    ]
};

// Example usage functions
const examples = {
    // Remove single commit
    removeSingle: () => removeCommitByCoordinates(10, 3, { force: true }),
    
    // Preview removal
    preview: () => removeCommitByCoordinates(10, 3, { dryRun: true }),
    
    // Remove with confirmation
    removeInteractive: () => removeCommitByCoordinates(10, 3, { interactive: true }),
    
    // Remove pattern
    removeHeart: () => removeCommitPattern(patterns.heart, { force: true }),
    
    // Preview pattern
    previewHeart: () => removeCommitPattern(patterns.heart, { dryRun: true })
};

export {
    removeCommitByCoordinates,
    removeCommitPattern,
    patterns,
    examples
};

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.length >= 2) {
        const x = parseInt(args[0]);
        const y = parseInt(args[1]);
        const dryRun = args.includes('--dry-run');
        const force = args.includes('--force');
        
        removeCommitByCoordinates(x, y, { dryRun, force, interactive: !force });
    } else {
        console.log(`
Usage: node removeCommitAdvanced.js <x> <y> [options]

Options:
  --dry-run    Preview what would be removed without making changes
  --force      Skip confirmation prompts

Examples:
  node removeCommitAdvanced.js 10 3 --dry-run
  node removeCommitAdvanced.js 10 3 --force
  node removeCommitAdvanced.js 10 3
        `);
    }
}