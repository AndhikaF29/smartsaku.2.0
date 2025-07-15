const fs = require('fs');
const path = require('path');

// Directories to check
const directories = [
    'src/templates',
    'src/assets',
    'src/js',
    'src/css'
];

// Function to ensure directories exist
function checkDirectories() {
    for (const dir of directories) {
        const fullPath = path.join(__dirname, dir);
        if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️ Directory doesn't exist: ${dir}`);
            console.log(`Creating ${dir}...`);
            fs.mkdirSync(fullPath, { recursive: true });
        } else {
            console.log(`✓ Directory exists: ${dir}`);
        }
    }
}

// Check if home.html exists
function checkHomeFile() {
    const homeFile = path.join(__dirname, 'src/templates/home.html');
    if (fs.existsSync(homeFile)) {
        console.log('✓ Home file exists: src/templates/home.html');
    } else {
        console.error('❌ ERROR: home.html not found in src/templates/');
    }
}

// Main function
function main() {
    console.log('--- SmartSaku Path Verification ---');
    checkDirectories();
    checkHomeFile();
    console.log('----------------------------------');
}

main();