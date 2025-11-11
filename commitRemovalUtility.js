import { 
    removeCommitByCoordinates, 
    removeCommitPattern, 
    patterns 
} from './removeCommitAdvanced.js';

/**
 * Utility script for removing commits by coordinates
 * This provides simple examples and common use cases
 */

console.log("🚀 Commit Removal Utility for Analog Clock Project");
console.log("================================================\n");

// Example 1: Preview what would be removed at specific coordinates
async function previewRemoval() {
    console.log("1️⃣  Preview removal at coordinates (10, 3):");
    await removeCommitByCoordinates(10, 3, { dryRun: true });
    console.log("");
}

// Example 2: Remove commits interactively (with confirmation)
async function removeWithConfirmation() {
    console.log("2️⃣  Remove commits at coordinates (25, 1) with confirmation:");
    await removeCommitByCoordinates(25, 1, { 
        interactive: true,
        backup: true 
    });
    console.log("");
}

// Example 3: Force remove without confirmation
async function forceRemove() {
    console.log("3️⃣  Force remove commits at coordinates (30, 4):");
    await removeCommitByCoordinates(30, 4, { 
        force: true,
        backup: true 
    });
    console.log("");
}

// Example 4: Remove commits to create a heart pattern
async function createHeartPattern() {
    console.log("4️⃣  Create heart pattern by removing specific commits:");
    await removeCommitPattern(patterns.heart, { 
        dryRun: true  // Change to false to actually remove
    });
    console.log("");
}

// Example 5: Custom pattern removal
async function customPattern() {
    console.log("5️⃣  Remove commits in custom pattern (diagonal line):");
    const diagonal = [];
    for (let i = 0; i < 7; i++) {
        diagonal.push({ x: i * 2, y: i });
    }
    
    await removeCommitPattern(diagonal, { 
        dryRun: true  // Change to false to actually remove
    });
    console.log("");
}

// Example 6: Clean up specific area
async function cleanupArea() {
    console.log("6️⃣  Clean up rectangular area:");
    const areaPattern = [];
    
    // Remove commits in a 5x3 rectangle starting at (10, 2)
    for (let x = 10; x < 15; x++) {
        for (let y = 2; y < 5; y++) {
            areaPattern.push({ x, y });
        }
    }
    
    await removeCommitPattern(areaPattern, { 
        dryRun: true  // Change to false to actually remove
    });
    console.log("");
}

// Main execution
async function main() {
    try {
        // Run examples (all in preview mode for safety)
        await previewRemoval();
        await removeWithConfirmation();
        await forceRemove();
        await createHeartPattern();
        await customPattern();
        await cleanupArea();
        
        console.log("✅ All examples completed!");
        console.log("\n📝 To actually remove commits, change dryRun: true to dryRun: false");
        console.log("⚠️  Always create backups before removing commits!");
        
    } catch (error) {
        console.error("❌ Error running examples:", error.message);
    }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { 
    previewRemoval, 
    removeWithConfirmation, 
    forceRemove, 
    createHeartPattern, 
    customPattern, 
    cleanupArea 
};