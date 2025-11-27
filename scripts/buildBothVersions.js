#!/usr/bin/env node

/**
 * Build v1.1.7 dan v1.1.8 untuk test auto-update
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 BUILD v1.1.7 & v1.1.8 untuk Test Auto-Update\n');

// Step 1: Build v1.1.7
console.log('📦 Step 1: Build v1.1.7 (Current Version)...\n');
try {
  execSync('npm run build-electron', { stdio: 'inherit' });
  console.log('\n✅ v1.1.7 berhasil di-build!');
  console.log('📁 Location: dist/BetaKasir Setup 1.1.7.exe\n');
} catch (error) {
  console.error('❌ Error building v1.1.7:', error.message);
  process.exit(1);
}

// Rename v1.1.7 installer
const v117Path = path.join(__dirname, '../dist/BetaKasir Setup 1.1.7.exe');
const v117BackupPath = path.join(__dirname, '../dist/BetaKasir-Setup-1.1.7-BACKUP.exe');
if (fs.existsSync(v117Path)) {
  fs.copyFileSync(v117Path, v117BackupPath);
  console.log('💾 Backup v1.1.7 saved: BetaKasir-Setup-1.1.7-BACKUP.exe\n');
}

// Step 2: Update ke v1.1.8
console.log('📝 Step 2: Update version ke 1.1.8...\n');

// Update package.json
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.version = '1.1.8';
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('✅ package.json updated to 1.1.8');

// Update updateService.ts
const updateServicePath = path.join(__dirname, '../src/services/updateService.ts');
let updateServiceContent = fs.readFileSync(updateServicePath, 'utf8');
updateServiceContent = updateServiceContent.replace(
  /export const CURRENT_VERSION = '1\.1\.7';/,
  "export const CURRENT_VERSION = '1.1.8';"
);
updateServiceContent = updateServiceContent.replace(
  /export const CURRENT_BUILD_NUMBER = 8;/,
  'export const CURRENT_BUILD_NUMBER = 9;'
);
fs.writeFileSync(updateServicePath, updateServiceContent);
console.log('✅ updateService.ts updated to 1.1.8\n');

// Step 3: Build v1.1.8
console.log('📦 Step 3: Build v1.1.8 (Test Version)...\n');
try {
  execSync('npm run build-electron', { stdio: 'inherit' });
  console.log('\n✅ v1.1.8 berhasil di-build!');
  console.log('📁 Location: dist/BetaKasir Setup 1.1.8.exe\n');
} catch (error) {
  console.error('❌ Error building v1.1.8:', error.message);
  process.exit(1);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('✅ BUILD SELESAI!');
console.log('='.repeat(60));
console.log('\n📦 Files yang dihasilkan:');
console.log('1. dist/BetaKasir-Setup-1.1.7-BACKUP.exe (Install ini dulu)');
console.log('2. dist/BetaKasir Setup 1.1.8.exe (Upload ke GitHub)\n');

console.log('📋 Next Steps:');
console.log('1. Install v1.1.7 dari BACKUP file');
console.log('2. Upload v1.1.8 ke GitHub Releases');
console.log('3. Upload changelog ke Firebase');
console.log('4. Test auto-update dari 1.1.7 ke 1.1.8');
console.log('5. Test "Cek Update" di v1.1.8 (sudah terbaru)\n');

console.log('🎯 Test Commands:');
console.log('- Install: dist/BetaKasir-Setup-1.1.7-BACKUP.exe');
console.log('- Settings → Informasi Aplikasi → Cek Update');
console.log('- Update ke v1.1.8 → Auto-restart dalam 2 detik ✅\n');
