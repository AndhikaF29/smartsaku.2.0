const fs = require('fs');
const path = require('path');

// Function to copy directory recursively
function copyDir(src, dest) {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    // Read source directory
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        // Handle directories vs files
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Ensure the templates directory exists in the dist folder
const templatesDir = path.join(__dirname, 'dist', 'src', 'templates');
if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
}

// Copy home.html to the templates directory in dist
const srcHomePath = path.join(__dirname, 'src', 'templates', 'home.html');
const destHomePath = path.join(templatesDir, 'home.html');

if (fs.existsSync(srcHomePath)) {
    fs.copyFileSync(srcHomePath, destHomePath);
    console.log('Successfully copied home.html to dist/src/templates/');
} else {
    console.error('Error: home.html not found in src/templates/');
    process.exit(1);
}

// Copy any other necessary directories/files
const srcAssetsPath = path.join(__dirname, 'src', 'assets');
const destAssetsPath = path.join(__dirname, 'dist', 'src', 'assets');

if (fs.existsSync(srcAssetsPath)) {
    copyDir(srcAssetsPath, destAssetsPath);
    console.log('Successfully copied assets directory to dist/src/assets/');
}

console.log('Deployment preparation complete!');