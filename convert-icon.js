// Script untuk memastikan icon digunakan dengan benar
// Electron di Windows membutuhkan .ico dengan multiple sizes

const fs = require('fs');
const path = require('path');

console.log('Checking icon files...');

// Check if logo.ico exists
const logoPath = path.join(__dirname, 'public', 'logo.ico');
const electronIconPath = path.join(__dirname, 'electron', 'icon.ico');

if (fs.existsSync(logoPath)) {
  const stats = fs.statSync(logoPath);
  console.log(`✅ public/logo.ico exists (${stats.size} bytes)`);
  
  // Copy to electron folder
  fs.copyFileSync(logoPath, electronIconPath);
  console.log(`✅ Copied to electron/icon.ico`);
} else {
  console.log('❌ public/logo.ico not found');
}

// Check electron icon
if (fs.existsSync(electronIconPath)) {
  const stats = fs.statSync(electronIconPath);
  console.log(`✅ electron/icon.ico exists (${stats.size} bytes)`);
} else {
  console.log('❌ electron/icon.ico not found');
}
