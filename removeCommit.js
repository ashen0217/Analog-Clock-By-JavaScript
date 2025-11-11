import simpleGit from "simple-git";
import moment from "moment";

const git = simpleGit();

/**
 * Remove commits based on x and y coordinates
 * @param {number} x - Week position (0-54)
 * @param {number} y - Day position (0-6, where 0 is Sunday)
 * @param {boolean} force - Force removal even if it affects other commits
 */
const removeCommitByCoordinates = async (x, y, force = false) => {
    try {
        // Validate coordinates
        if (x < 0 || x > 54) {
            throw new Error("X coordinate must be between 0 and 54 (weeks)");
        }
        if (y < 0 || y > 6) {
            throw new Error("Y coordinate must be between 0 and 6 (days)");
        }

        // Calculate the target date based on x and y coordinates
        // This matches the logic from commitGit.js
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
        const commitsToRemove = log.all.filter(commit => {
            const commitDate = moment(commit.date).format("YYYY-MM-DD");
            return commitDate === targetDateStr;
        });

        if (commitsToRemove.length === 0) {
            console.log(`No commits found for coordinates x:${x}, y:${y} on ${targetDateStr}`);
            return;
        }

        console.log(`Found ${commitsToRemove.length} commit(s) to remove:`);
        commitsToRemove.forEach(commit => {
            console.log(`- ${commit.hash.substring(0, 7)}: ${commit.message}`);
        });

        if (!force) {
            console.log("Use force=true to proceed with removal");
            return;
        }

        // Remove commits using interactive rebase
        for (const commit of commitsToRemove) {
            await removeCommitByHash(commit.hash);
        }

        console.log(`Successfully removed commits for coordinates x:${x}, y:${y}`);

    } catch (error) {
        console.error("Error removing commits:", error.message);
    }
};

/**
 * Remove a specific commit by its hash
 * @param {string} commitHash - The hash of the commit to remove
 */
const removeCommitByHash = async (commitHash) => {
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
 * Remove multiple commits based on coordinate ranges
 * @param {Array} coordinates - Array of {x, y} coordinate objects
 * @param {boolean} force - Force removal
 */
const removeMultipleCommitsByCoordinates = async (coordinates, force = false) => {
    console.log(`Removing commits for ${coordinates.length} coordinate pairs`);
    
    for (const coord of coordinates) {
        await removeCommitByCoordinates(coord.x, coord.y, force);
    }
};

/**
 * Remove commits in a rectangular area
 * @param {number} startX - Starting x coordinate
 * @param {number} endX - Ending x coordinate  
 * @param {number} startY - Starting y coordinate
 * @param {number} endY - Ending y coordinate
 * @param {boolean} force - Force removal
 */
const removeCommitsInArea = async (startX, endX, startY, endY, force = false) => {
    const coordinates = [];
    
    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            coordinates.push({ x, y });
        }
    }
    
    console.log(`Removing commits in area: x(${startX}-${endX}), y(${startY}-${endY})`);
    await removeMultipleCommitsByCoordinates(coordinates, force);
};

/**
 * Preview what commits would be removed for given coordinates
 * @param {number} x - Week position
 * @param {number} y - Day position
 */
const previewRemoval = async (x, y) => {
    await removeCommitByCoordinates(x, y, false);
};

/**
 * Restore removed commits from reflog (if recently removed)
 * @param {number} steps - Number of steps back in reflog to restore
 */
const restoreFromReflog = async (steps = 1) => {
    try {
        console.log(`Restoring from reflog (${steps} steps back)`);
        await git.raw(['reset', '--hard', `HEAD@{${steps}}`]);
        console.log("Commits restored successfully");
    } catch (error) {
        console.error("Error restoring commits:", error.message);
    }
};

// Example usage:
// Remove single commit by coordinates
// removeCommitByCoordinates(10, 3, true);

// Remove multiple commits
// removeMultipleCommitsByCoordinates([
//     { x: 10, y: 3 },
//     { x: 15, y: 2 },
//     { x: 20, y: 4 }
// ], true);

// Remove commits in an area
// removeCommitsInArea(10, 15, 2, 4, true);

// Preview what would be removed
// previewRemoval(10, 3);

export {
    removeCommitByCoordinates,
    removeCommitByHash,
    removeMultipleCommitsByCoordinates,
    removeCommitsInArea,
    previewRemoval,
    restoreFromReflog
};