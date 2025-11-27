const rcedit = require('rcedit');
const path = require('path');
const fs = require('fs');

// Path ke executable dan icon
const exePath = path.join(__dirname, 'dist', 'win-unpacked', 'BetaKasir.exe');
const iconPath = path.join(__dirname, 'icon.ico');

console.log('🔧 Embedding icon ke executable...');
console.log('Executable:', exePath);
console.log('Icon:', iconPath);

// Cek apakah file ada
if (!fs.existsSync(exePath)) {
  console.error('❌ Executable tidak ditemukan:', exePath);
  process.exit(1);
}

if (!fs.existsSync(iconPath)) {
  console.error('❌ Icon tidak ditemukan:', iconPath);
  process.exit(1);
}

// Embed icon ke executable
rcedit(exePath, {
  icon: iconPath,
  'version-string': {
    'CompanyName': 'BetaKasir Team',
    'FileDescription': 'BetaKasir - Sistem Kasir Modern',
    'ProductName': 'BetaKasir',
    'InternalName': 'BetaKasir',
    'OriginalFilename': 'BetaKasir.exe',
    'LegalCopyright': 'Copyright © 2025 BetaKasir Team'
  }
})
.then(() => {
  console.log('✅ Icon berhasil di-embed ke executable!');
  console.log('✅ Metadata executable berhasil diupdate!');
})
.catch((err) => {
  console.error('❌ Error embedding icon:', err);
  process.exit(1);
});
