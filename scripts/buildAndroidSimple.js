#!/usr/bin/env node

/**
 * Script sederhana untuk trigger build Android
 * Download manual dari dashboard Expo
 */

const { execSync } = require('child_process');

console.log('\n🚀 Memulai build APK Android...\n');
console.log('📊 Dashboard: https://expo.dev/accounts/gibranargantara/projects/betakasir/builds\n');

try {
  // Trigger build via web dashboard
  console.log('Silakan build via dashboard Expo:');
  console.log('1. Buka: https://expo.dev/accounts/gibranargantara/projects/betakasir');
  console.log('2. Klik "Builds" di sidebar');
  console.log('3. Klik "Create a build"');
  console.log('4. Pilih Platform: Android, Profile: preview');
  console.log('5. Klik "Build"');
  console.log('\nSetelah selesai (15-30 menit):');
  console.log('6. Download APK');
  console.log('7. Simpan ke folder dist/\n');
  
  // Open dashboard
  const platform = process.platform;
  const url = 'https://expo.dev/accounts/gibranargantara/projects/betakasir/builds';
  
  if (platform === 'win32') {
    execSync(`start ${url}`);
  } else if (platform === 'darwin') {
    execSync(`open ${url}`);
  } else {
    execSync(`xdg-open ${url}`);
  }
  
  console.log('✓ Dashboard dibuka di browser\n');
  
} catch (error) {
  console.error('Error:', error.message);
}
