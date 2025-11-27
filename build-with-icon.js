const builder = require('electron-builder');
const path = require('path');
const fs = require('fs');

console.log('🔨 Building BetaKasir with custom icon...\n');

// Verify icon exists
const iconPath = path.join(__dirname, 'icon.ico');
if (!fs.existsSync(iconPath)) {
  console.error('❌ Icon file not found:', iconPath);
  process.exit(1);
}

console.log('✅ Icon file found:', iconPath);
console.log('📦 Icon size:', fs.statSync(iconPath).size, 'bytes\n');

// Build configuration
const config = {
  appId: 'com.betakasir.app',
  productName: 'BetaKasir',
  copyright: 'Copyright © 2025 BetaKasir',
  directories: {
    buildResources: '.',
    output: 'dist'
  },
  files: [
    'index.js',
    'electron/**/*',
    'web-build/**/*',
    'assets/**/*',
    'package.json'
  ],
  extraResources: [
    {
      from: 'icon.ico',
      to: 'icon.ico'
    },
    {
      from: 'electron/icon.ico',
      to: 'electron/icon.ico'
    }
  ],
  asar: false,
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    icon: iconPath,
    signAndEditExecutable: false
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'BetaKasir',
    installerIcon: iconPath,
    uninstallerIcon: iconPath,
    installerHeaderIcon: iconPath,
    deleteAppDataOnUninstall: false
  }
};

console.log('🚀 Starting electron-builder...\n');

builder.build({
  targets: builder.Platform.WINDOWS.createTarget(),
  config: config
})
.then(() => {
  console.log('\n✅ Build completed successfully!');
  console.log('📦 Installer location: dist\\BetaKasir Setup 1.0.0.exe');
  console.log('\n📝 Next steps:');
  console.log('1. Check icon in: dist\\win-unpacked\\BetaKasir.exe');
  console.log('2. If icon is correct, install the application');
  console.log('3. Clear icon cache and restart computer');
})
.catch((error) => {
  console.error('\n❌ Build failed:', error);
  process.exit(1);
});
