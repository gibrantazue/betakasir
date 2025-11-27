// Script to fix absolute paths in index.html to relative paths
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'web-build', 'index.html');

// Read index.html
let html = fs.readFileSync(indexPath, 'utf8');

// Replace absolute paths with relative paths
html = html.replace(/src="\/_expo\//g, 'src="./_expo/');
html = html.replace(/href="\/_expo\//g, 'href="./_expo/');

// Write back
fs.writeFileSync(indexPath, html, 'utf8');

console.log('✅ Fixed paths in index.html');
