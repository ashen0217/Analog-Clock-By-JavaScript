# Commit Removal by X,Y Coordinates

This module provides functionality to remove Git commits based on x and y axis coordinates, designed to work with the analog clock contribution graph project.

## 📋 Overview

The coordinate system works as follows:

- **X-axis**: Represents weeks (0-54, where 0 is the first week of the year)
- **Y-axis**: Represents days (0-6, where 0 is Sunday, 1 is Monday, etc.)

## 🚀 Quick Start

### Basic Usage

```javascript
import { removeCommitByCoordinates } from "./removeCommitAdvanced.js";

// Preview what would be removed (safe, no changes made)
await removeCommitByCoordinates(10, 3, { dryRun: true });

// Remove with interactive confirmation
await removeCommitByCoordinates(10, 3, { interactive: true });

// Force remove without confirmation (dangerous!)
await removeCommitByCoordinates(10, 3, { force: true });
```

### Command Line Usage

```bash
# Preview removal
node removeCommitAdvanced.js 10 3 --dry-run

# Remove with confirmation
node removeCommitAdvanced.js 10 3

# Force remove without confirmation
node removeCommitAdvanced.js 10 3 --force

# Run utility examples
npm run preview-removal
```

## 📁 Files

- **`removeCommit.js`** - Basic commit removal functionality
- **`removeCommitAdvanced.js`** - Advanced version with safety features
- **`commitRemovalUtility.js`** - Examples and utility functions
- **`commitGit.js`** - Original commit generation script

## 🛠 Functions

### `removeCommitByCoordinates(x, y, options)`

Remove commits at specific coordinates.

**Parameters:**

- `x` (number): Week position (0-54)
- `y` (number): Day position (0-6)
- `options` (object):
  - `force` (boolean): Skip confirmations
  - `interactive` (boolean): Ask for confirmation
  - `dryRun` (boolean): Preview only, no changes
  - `backup` (boolean): Create backup branch

### `removeCommitPattern(pattern, options)`

Remove commits following a specific pattern.

**Parameters:**

- `pattern` (array): Array of `{x, y}` coordinate objects
- `options` (object): Same as above

## 🎨 Predefined Patterns

```javascript
import { patterns, removeCommitPattern } from "./removeCommitAdvanced.js";

// Remove commits to create a heart shape
await removeCommitPattern(patterns.heart, { dryRun: true });

// Remove commits to create a smiley face
await removeCommitPattern(patterns.smiley, { dryRun: true });

// Remove commits to spell "AC" (Analog Clock)
await removeCommitPattern(patterns.ac, { dryRun: true });
```

## ⚠️ Safety Features

### 1. Automatic Backups

```javascript
// Creates backup branch before removal
await removeCommitByCoordinates(x, y, { backup: true });
```

### 2. Dry Run Mode

```javascript
// Preview what would be removed without making changes
await removeCommitByCoordinates(x, y, { dryRun: true });
```

### 3. Interactive Confirmation

```javascript
// Asks for user confirmation before removal
await removeCommitByCoordinates(x, y, { interactive: true });
```

### 4. Coordinate Validation

- X coordinates must be between 0-54
- Y coordinates must be between 0-6
- Invalid coordinates throw errors

## 🔧 Advanced Examples

### Remove Diagonal Line

```javascript
const diagonal = [];
for (let i = 0; i < 10; i++) {
  diagonal.push({ x: i * 2, y: i % 7 });
}
await removeCommitPattern(diagonal, { dryRun: true });
```

### Remove Rectangular Area

```javascript
const rectangle = [];
for (let x = 10; x < 20; x++) {
  for (let y = 2; y < 5; y++) {
    rectangle.push({ x, y });
  }
}
await removeCommitPattern(rectangle, { dryRun: true });
```

### Custom Pattern

```javascript
const customShape = [
  { x: 5, y: 1 },
  { x: 6, y: 1 },
  { x: 7, y: 1 },
  { x: 5, y: 2 },
  { x: 7, y: 2 },
  { x: 5, y: 3 },
  { x: 6, y: 3 },
  { x: 7, y: 3 },
];
await removeCommitPattern(customShape, { interactive: true });
```

## 🔄 Recovery

### Restore from Backup

```javascript
// List backup branches
git branch | grep backup-before-removal

// Restore from backup
git checkout backup-before-removal-1699123456789
git checkout -b restored-main
```

### Restore from Reflog

```javascript
import { restoreFromReflog } from "./removeCommit.js";

// Restore last state
await restoreFromReflog(1);

// Restore from 3 steps back
await restoreFromReflog(3);
```

## 🚨 Important Warnings

1. **Always use `dryRun: true` first** to preview changes
2. **Create backups** before removing commits
3. **Be cautious with `force: true`** - it skips all safety checks
4. **Test on a copy** of your repository first
5. **Understand Git history** - removing commits can affect other commits

## 📊 Coordinate Reference

```
Week (X):  0  1  2  3  4  5  6  7  8  9 10 11 ...54
Day (Y):
  0 (Sun) [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]
  1 (Mon) [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]
  2 (Tue) [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]
  3 (Wed) [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]
  4 (Thu) [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]
  5 (Fri) [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]
  6 (Sat) [ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ][ ]
```

## 🎯 Use Cases

1. **Fix mistakes** in contribution graph patterns
2. **Clean up test commits** during development
3. **Create artistic patterns** by selective removal
4. **Optimize contribution graphs** for better visualization
5. **Remove commits from specific time periods**

## ⚙️ Configuration

The coordinate calculation matches your original `commitGit.js`:

```javascript
const date = moment()
  .subtract(1, "y")
  .add(1, "d")
  .add(x, "w")
  .add(y, "d")
  .format("YYYY-MM-DD HH:mm:ss");
```

This ensures perfect alignment with your existing commit generation logic.
