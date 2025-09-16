# WebxRide Examples System

This document explains how examples get into the examples page in WebxRide.

## Overview

The examples system automatically generates an index page that lists all available examples. When you add a new example folder with an `index.html` file, it automatically appears on the examples page.

## How It Works

### 1. **Directory Structure**
Examples are stored in `public/examples/` with this structure:
```
public/examples/
├── index.html (auto-generated)
├── farmscene_example/
│   └── index.html
├── basic_3d_scene/
│   └── index.html
└── your_new_example/
    └── index.html
```

### 2. **Automatic Index Generation**
The system uses `scripts/generate-examples-index.cjs` to automatically:
- Scan the `public/examples/` directory
- Find all folders containing `index.html` files
- Generate a beautiful index page with links to all examples
- Convert folder names to display names (e.g., "farmscene_example" → "Farm Scene Example")

### 3. **File Watching**
The `scripts/watch-all-templates.cjs` script monitors the examples directory and automatically regenerates the index when:
- New example folders are added
- Example folders are removed
- `index.html` files are modified

## How to Add Examples

### **Method 1: Manual Creation**
1. Create a new folder in `public/examples/` (e.g., `my_awesome_example/`)
2. Add an `index.html` file inside that folder
3. The examples index will automatically update

### **Method 2: Using the Generator Script**
```bash
# Generate the examples index manually
node scripts/generate-examples-index.cjs

# Watch for changes and auto-regenerate
node scripts/watch-all-templates.cjs
```

### **Method 3: Using the Watcher**
```bash
# Start the watcher (runs continuously)
node scripts/watch-all-templates.cjs
```
Then add your example folders - the index will update automatically!

## Example Requirements

For an example to appear in the index:

1. **Must be a folder** in `public/examples/`
2. **Must contain an `index.html` file**
3. **The `index.html` should be a complete, standalone web page**

## Example Types

Examples can be any type of web content:
- **A-Frame 3D scenes** (like the farm scene)
- **Basic HTML/CSS/JS** projects
- **Interactive web experiences**
- **Educational demonstrations**
- **Template showcases**

## Naming Conventions

- **Folder names**: Use lowercase with underscores (e.g., `my_example_name`)
- **Display names**: Automatically converted to title case (e.g., "My Example Name")
- **Descriptive names**: Make them clear and meaningful

## Current Examples

- **Farm Scene Example**: Complex A-Frame 3D scene with 3D models
- **Basic 3D Scene**: Simple A-Frame scene with basic shapes

## Accessing Examples

- **Examples Index**: `http://localhost:5173/examples/`
- **Individual Examples**: `http://localhost:5173/examples/example_name/`

## Technical Details

### **Index Generator Script**
- **File**: `scripts/generate-examples-index.cjs`
- **Function**: Scans directory and generates HTML index
- **Output**: `public/examples/index.html`

### **Watcher Script**
- **File**: `scripts/watch-all-templates.cjs`
- **Function**: Monitors multiple directories for changes
- **Triggers**: File system events (create, modify, delete)

### **Styling**
The examples index uses the same dark theme as the main WebxRide application with:
- Dark background (`#0f172a`)
- Blue accents (`#38bdf8`)
- Yellow highlights (`#fbbf24`)
- Responsive design

## Best Practices

1. **Keep examples self-contained** - all assets should be in the example folder
2. **Use descriptive names** - make it clear what the example demonstrates
3. **Include documentation** - add README files or comments in your examples
4. **Test your examples** - make sure they work before adding them
5. **Keep them simple** - examples should be easy to understand and modify

## Troubleshooting

### **Example not appearing?**
- Check that the folder contains an `index.html` file
- Run `node scripts/generate-examples-index.cjs` manually
- Check the console for any errors

### **Index not updating?**
- Make sure the watcher is running: `node scripts/watch-all-templates.cjs`
- Check file permissions
- Restart the watcher if needed

### **Styling issues?**
- Examples should be self-contained
- Don't rely on external CSS that might not be available
- Use inline styles or include all necessary CSS files 