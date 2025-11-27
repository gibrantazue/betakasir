const rcedit = require('rcedit');
const path = require('path');
const fs = require('fs');

exports.default = async function(context) {
  // Only for Windows
  if (context.electronPlatformName !== 'win32') {
    return;
  }

  const exePath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const iconPath = path.join(context.packager.projectDir, 'icon.ico');

  console.log('');
  console.log('🔧 [AfterPack] Embedding icon ke executable...');
  console.log('   Executable:', exePath);
  console.log('   Icon:', iconPath);

  if (!fs.existsSync(exePath)) {
    console.error('   ❌ Executable tidak ditemukan');
    return;
  }

  if (!fs.existsSync(iconPath)) {
    console.error('   ❌ Icon tidak ditemukan');
    return;
  }

  try {
    await rcedit(exePath, {
      icon: iconPath,
      'version-string': {
        'CompanyName': 'BetaKasir Team',
        'FileDescription': 'BetaKasir - Sistem Kasir Modern',
        'ProductName': 'BetaKasir',
        'InternalName': 'BetaKasir',
        'OriginalFilename': 'BetaKasir.exe',
        'LegalCopyright': 'Copyright © 2025 BetaKasir Team'
      }
    });
    
    console.log('   ✅ Icon berhasil di-embed!');
    console.log('   ✅ Metadata executable berhasil diupdate!');
    console.log('');
  } catch (err) {
    console.error('   ❌ Error embedding icon:', err);
  }
};
