// Script untuk memperbaiki semua path yang salah
const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/templates/register.html',
    'src/templates/dashboard.html',
    'src/templates/chat.html',
    'src/templates/transaksi.html'
];

const fixes = [
    // Fix imports
    { from: '/SmartSaku/src/services/', to: '../services/' },
    { from: '/SmartSaku/src/utils/', to: '../utils/' },
    { from: '/SmartSaku/src/js/', to: '../js/' },

    // Fix navigation links
    { from: '/SmartSaku/src/templates/', to: './' },
    { from: '/SmartSaku/', to: '/' },

    // Fix redirect URLs  
    { from: 'window.location.href = "/SmartSaku/src/templates/', to: 'window.location.href = "/' },
    { from: '.html"', to: '"' }
];

filesToFix.forEach(filePath => {
    try {
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');

            fixes.forEach(fix => {
                content = content.replaceAll(fix.from, fix.to);
            });

            fs.writeFileSync(filePath, content);
            console.log(`✅ Fixed: ${filePath}`);
        } else {
            console.log(`⚠️ File not found: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
});

console.log('🚀 Path fixing completed!');