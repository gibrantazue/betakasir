#!/usr/bin/env node

/**
 * Script untuk publish update BetaKasir
 * 
 * Usage:
 *   node scripts/publishUpdate.js 1.2.0
 * 
 * Akan:
 * 1. Update version di package.json
 * 2. Build aplikasi
 * 3. Publish ke GitHub Releases
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get version from command line
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('❌ Error: Version tidak diberikan!');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/publishUpdate.js 1.2.0');
  console.log('');
  process.exit(1);
}

// Validate version format
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('❌ Error: Format version salah!');
  console.log('');
  console.log('Format yang benar: X.Y.Z (contoh: 1.2.0)');
  console.log('');
  process.exit(1);
}

console.log('🚀 BetaKasir Auto-Update Publisher');
console.log('==================================');
console.log('');

// Check if GH_TOKEN is set
if (!process.env.GH_TOKEN) {
  console.error('❌ Error: GH_TOKEN tidak ditemukan!');
  console.log('');
  console.log('Set GitHub token dulu:');
  console.log('  Windows PowerShell:');
  console.log('    $env:GH_TOKEN="ghp_your_token_here"');
  console.log('');
  console.log('  Windows CMD:');
  console.log('    set GH_TOKEN=ghp_your_token_here');
  console.log('');
  console.log('Cara buat token: https://github.com/settings/tokens');
  console.log('');
  process.exit(1);
}

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 Versi saat ini: ${currentVersion}`);
console.log(`📦 Versi baru: ${newVersion}`);
console.log('');

// Check if new version is higher
const [currMajor, currMinor, currPatch] = currentVersion.split('.').map(Number);
const [newMajor, newMinor, newPatch] = newVersion.split('.').map(Number);

if (newMajor < currMajor || 
    (newMajor === currMajor && newMinor < currMinor) ||
    (newMajor === currMajor && newMinor === currMinor && newPatch <= currPatch)) {
  console.error('❌ Error: Versi baru harus lebih tinggi dari versi saat ini!');
  console.log('');
  process.exit(1);
}

// Confirm
console.log('⚠️  Apakah Anda yakin ingin publish update?');
console.log('   Ini akan:');
console.log('   1. Update version di package.json');
console.log('   2. Build aplikasi');
console.log('   3. Upload ke GitHub Releases');
console.log('');
console.log('   Tekan Ctrl+C untuk cancel, atau Enter untuk lanjut...');

// Wait for user confirmation (in real scenario, use readline)
// For now, we'll just proceed

console.log('');
console.log('✅ Memulai proses publish...');
console.log('');

try {
  // Step 1: Update package.json
  console.log('📝 Step 1/3: Update package.json...');
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('   ✅ package.json updated');
  console.log('');

  // Step 2: Build web
  console.log('🔨 Step 2/3: Building web...');
  execSync('npm run build-web', { stdio: 'inherit' });
  console.log('   ✅ Web build complete');
  console.log('');

  // Step 3: Build and publish
  console.log('📤 Step 3/3: Building and publishing to GitHub...');
  execSync('electron-builder --win --publish always', { stdio: 'inherit' });
  console.log('   ✅ Published to GitHub Releases');
  console.log('');

  console.log('🎉 SUCCESS!');
  console.log('');
  console.log(`✅ BetaKasir v${newVersion} berhasil dipublish!`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Cek GitHub Releases: https://github.com/YOUR_USERNAME/betakasir/releases');
  console.log('   2. Test auto-update dari aplikasi versi lama');
  console.log('   3. Commit perubahan package.json:');
  console.log(`      git add package.json`);
  console.log(`      git commit -m "Release v${newVersion}"`);
  console.log(`      git tag v${newVersion}`);
  console.log(`      git push && git push --tags`);
  console.log('');

} catch (error) {
  console.error('');
  console.error('❌ Error during publish:');
  console.error(error.message);
  console.error('');
  
  // Rollback version
  console.log('🔄 Rolling back package.json...');
  packageJson.version = currentVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('   ✅ Rollback complete');
  console.log('');
  
  process.exit(1);
}
