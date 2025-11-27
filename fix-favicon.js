const fs = require('fs');
const path = require('path');

// Copy logo.ico to web-build as favicon.ico
const source = path.join(__dirname, 'public', 'logo.ico');
const dest = path.join(__dirname, 'web-build', 'favicon.ico');

try {
  fs.copyFileSync(source, dest);
  console.log('✅ Favicon replaced with logo.ico');
} catch (error) {
  console.error('❌ Error replacing favicon:', error.message);
}
