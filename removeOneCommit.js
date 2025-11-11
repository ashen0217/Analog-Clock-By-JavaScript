import simpleGit from "simple-git";
import moment from "moment";

const git = simpleGit();


/**
 * Remove ONLY ONE commit based on x and y coordinates
 * @param {number} x - Week position (0-54)
 * @param {number} y - Day position (0-6, where 0 is Sunday)
 * @param {boolean} force - Force removal without confirmation
 */
const removeSingleCommitByCoordinates = async (x, y, force = false) => {
    try {
        // Validate coordinates
        if (x < 0 || x > 54) {
            throw new Error("X coordinate must be between 0 and 54 (weeks)");
        }
        if (y < 0 || y > 6) {
            throw new Error("Y coordinate must be between 0 and 6 (days)");
        }

        // Calculate the target date based on x and y coordinates
        const targetDate = moment()
            .subtract(1, "y")
            .add(1, "d")
            .add(x, "w")
            .add(y, "d");

        const targetDateStr = targetDate.format("YYYY-MM-DD");
        
        console.log(`Looking for commits on ${targetDateStr} (x:${x}, y:${y})`);

        // Get commit history
        const log = await git.log();
        
        // Find commits that match the target date
        const matchingCommits = log.all.filter(commit => {
            const commitDate = moment(commit.date).format("YYYY-MM-DD");
            return commitDate === targetDateStr;
        });

        if (matchingCommits.length === 0) {
            console.log(`No commits found for coordinates x:${x}, y:${y} on ${targetDateStr}`);
            return;
        }

        // Take only the FIRST commit (most recent)
        const commitToRemove = matchingCommits[0];
        
        console.log(`Found ${matchingCommits.length} commit(s) on this date.`);
        console.log(`Will remove ONLY the first one:`);
        console.log(`- ${commitToRemove.hash.substring(0, 7)}: ${commitToRemove.message}`);
        
        if (matchingCommits.length > 1) {
            console.log(`Note: ${matchingCommits.length - 1} other commit(s) will remain on this date.`);
        }

        if (!force) {
            console.log("Use force=true to proceed with removal");
            return;
        }

        // Remove the single commit
        await removeSingleCommitByHash(commitToRemove.hash);

        console.log(`Successfully removed 1 commit for coordinates x:${x}, y:${y}`);

    } catch (error) {
        console.error("Error removing commit:", error.message);
    }
};

/**
 * Remove a specific commit by its hash
 * @param {string} commitHash - The hash of the commit to remove
 */
const removeSingleCommitByHash = async (commitHash) => {
    try {
        console.log(`Removing commit: ${commitHash}`);
        
        // Use git rebase to remove the specific commit
        await git.raw(['rebase', '--onto', `${commitHash}^`, commitHash]);
        
        console.log(`Commit ${commitHash} removed successfully`);
    } catch (error) {
        console.error(`Error removing commit ${commitHash}:`, error.message);
        throw error;
    }
};

/**
 * Preview what single commit would be removed
 * @param {number} x - Week position
 * @param {number} y - Day position
 */
const previewSingleRemoval = async (x, y) => {
    await removeSingleCommitByCoordinates(x, y, false);
};

/**
 * Remove one commit from each coordinate pair
 * @param {Array} coordinates - Array of {x, y} coordinate objects
 * @param {boolean} force - Force removal
 */
const removeSingleCommitsFromCoordinates = async (coordinates, force = false) => {
    console.log(`Removing 1 commit from each of ${coordinates.length} coordinate pairs`);
    
    for (const coord of coordinates) {
        await removeSingleCommitByCoordinates(coord.x, coord.y, force);
    }
};

// Command line usage if run directly
if (process.argv.length >= 4) {
    const x = parseInt(process.argv[2]);
    const y = parseInt(process.argv[3]);
    const forceFlag = process.argv.includes('--force') || process.argv.includes('-f');
    const previewFlag = process.argv.includes('--preview') || process.argv.includes('-p');
    
    if (previewFlag) {
        previewSingleRemoval(x, y);
    } else {
        removeSingleCommitByCoordinates(x, y, forceFlag);
    }
}



// Example usage:
// Preview: node removeSingleCommit.js 10 3 --preview
// Remove: node removeSingleCommit.js 10 3 --force


// Add this debug function before the main functions

/**
 * Debug function to show date calculations and actual commits
 */
const debugCommitDates = async (x, y) => {
    console.log("=== DEBUG MODE ===");
    
    // Show the calculated date
    const targetDate = moment()
        .subtract(1, "y")
        .add(1, "d")
        .add(x, "w")
        .add(y, "d");
    
    console.log(`Input coordinates: x=${x}, y=${y}`);
    console.log(`Calculated target date: ${targetDate.format("YYYY-MM-DD")}`);
    console.log(`Today's date: ${moment().format("YYYY-MM-DD")}`);
    
    // Get all commits and their dates
    const log = await git.log();
    console.log("\n=== ALL RECENT COMMITS ===");
    
    log.all.slice(0, 20).forEach((commit, index) => {
        const commitDate = moment(commit.date).format("YYYY-MM-DD");
        const isMatch = commitDate === targetDate.format("YYYY-MM-DD");
        console.log(`${index + 1}. ${commitDate} ${isMatch ? '← MATCH!' : ''} - ${commit.hash.substring(0, 7)}: ${commit.message.substring(0, 50)}`);
    });
    
    // Find commits around October 29th
    console.log("\n=== COMMITS AROUND OCT 29 ===");
    const oct29Commits = log.all.filter(commit => {
        const commitDate = moment(commit.date).format("YYYY-MM-DD");
        return commitDate.includes("2024-10-29") || commitDate.includes("2025-10-29");
    });
    
    if (oct29Commits.length > 0) {
        oct29Commits.forEach(commit => {
            console.log(`Found: ${moment(commit.date).format("YYYY-MM-DD")} - ${commit.hash.substring(0, 7)}: ${commit.message}`);
        });
    } else {
        console.log("No commits found on 2024-10-29 or 2025-10-29");
    }
};

// Add this at the bottom before exports
if (process.argv.includes('--debug')) {
    const x = parseInt(process.argv[2]);
    const y = parseInt(process.argv[3]);
    debugCommitDates(x, y);
}


// Add this function after the debugCommitDates function

/**
 * Find coordinates for a specific date
 * @param {string} targetDateStr - Date in YYYY-MM-DD format
 */
const findCoordinatesForDate = async (targetDateStr) => {
    console.log(`=== FINDING COORDINATES FOR ${targetDateStr} ===`);
    
    // Try different coordinate combinations to find the target date
    for (let x = 0; x <= 54; x++) {
        for (let y = 0; y <= 6; y++) {
            const calculatedDate = moment()
                .subtract(1, "y")
                .add(1, "d")
                .add(x, "w")
                .add(y, "d")
                .format("YYYY-MM-DD");
                
            if (calculatedDate === targetDateStr) {
                console.log(`Found coordinates: x=${x}, y=${y} for date ${targetDateStr}`);
                return { x, y };
            }
        }
    }
    
    console.log(`No coordinates found for date ${targetDateStr}`);
    return null;
};

/**
 * Remove commit by actual date instead of coordinates
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {boolean} force - Force removal
 */
const removeCommitByDate = async (dateStr, force = false) => {
    try {
        console.log(`Looking for commits on ${dateStr}`);
        
        // Get commit history
        const log = await git.log();
        
        // Find commits that match the target date
        const matchingCommits = log.all.filter(commit => {
            const commitDate = moment(commit.date).format("YYYY-MM-DD");
            return commitDate === dateStr;
        });

        if (matchingCommits.length === 0) {
            console.log(`No commits found on ${dateStr}`);
            return;
        }

        // Take only the FIRST commit (most recent)
        const commitToRemove = matchingCommits[0];
        
        console.log(`Found ${matchingCommits.length} commit(s) on ${dateStr}.`);
        console.log(`Will remove ONLY the first one:`);
        console.log(`- ${commitToRemove.hash.substring(0, 7)}: ${commitToRemove.message}`);
        
        if (!force) {
            console.log("Use --force flag to proceed with removal");
            return;
        }

        // Remove the single commit
        await removeSingleCommitByHash(commitToRemove.hash);
        console.log(`Successfully removed commit on ${dateStr}`);

    } catch (error) {
        console.error("Error removing commit:", error.message);
    }
};

// Update command line handling
if (process.argv.length >= 4) {
    const firstArg = process.argv[2];
    
    // Check if first argument looks like a date (YYYY-MM-DD)
    if (firstArg.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Date format detected
        const dateStr = firstArg;
        const forceFlag = process.argv.includes('--force') || process.argv.includes('-f');
        const findFlag = process.argv.includes('--find-coords');
        
        if (findFlag) {
            findCoordinatesForDate(dateStr);
        } else {
            removeCommitByDate(dateStr, forceFlag);
        }
    } else {
        // Coordinate format
        const x = parseInt(process.argv[2]);
        const y = parseInt(process.argv[3]);
        const forceFlag = process.argv.includes('--force') || process.argv.includes('-f');
        const previewFlag = process.argv.includes('--preview') || process.argv.includes('-p');
        const debugFlag = process.argv.includes('--debug');
        
        if (debugFlag) {
            debugCommitDates(x, y);
        } else if (previewFlag) {
            previewSingleRemoval(x, y);
        } else {
            removeSingleCommitByCoordinates(x, y, forceFlag);
        }
    }
}
export {
    removeSingleCommitByCoordinates,
    removeSingleCommitByHash,
    previewSingleRemoval,
    removeSingleCommitsFromCoordinates
};