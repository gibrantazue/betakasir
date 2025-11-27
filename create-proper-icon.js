// Script untuk membuat icon.ico yang proper
// Windows membutuhkan .ico dengan multiple sizes: 16x16, 32x32, 48x48, 256x256

const fs = require('fs');
const path = require('path');

console.log('Checking logo files...');

// Check logo.ico
const logoIcoPath = path.join(__dirname, 'public', 'logo.ico');
if (fs.existsSync(logoIcoPath)) {
  const stats = fs.statSync(logoIcoPath);
  console.log(`Logo.ico size: ${stats.size} bytes`);
  
  // Read first few bytes to check ICO format
  const buffer = fs.readFileSync(logoIcoPath);
  const header = buffer.slice(0, 6);
  
  console.log('ICO Header:', header);
  console.log('First 2 bytes (should be 0,0):', header[0], header[1]);
  console.log('Next 2 bytes (should be 1,0 for ICO):', header[2], header[3]);
  console.log('Image count:', header[4] + (header[5] << 8));
  
  if (header[0] === 0 && header[1] === 0 && header[2] === 1 && header[3] === 0) {
    console.log('✅ Valid ICO format');
  } else {
    console.log('❌ Invalid ICO format - this might be the problem!');
  }
} else {
  console.log('❌ logo.ico not found');
}

console.log('\n📝 SOLUTION:');
console.log('1. Go to: https://convertio.co/png-ico/');
console.log('2. Upload: public/logo.png');
console.log('3. Select sizes: 16x16, 32x32, 48x48, 256x256');
console.log('4. Download the converted .ico file');
console.log('5. Replace public/logo.ico with the new file');
console.log('6. Run: npm run build-electron');
