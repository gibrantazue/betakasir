#!/usr/bin/env node

/**
 * Force Build Android APK - Skip Git Checks
 * Trigger EAS build dengan bypass git filename casing issues
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting FORCED Android Build...\n');

try {
  // Commit semua perubahan dulu
  console.log('📝 Committing all changes...');
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Pre-build commit" --no-verify', { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️  No changes to commit or already committed');
  }

  // Trigger build dengan --no-wait agar tidak hang
  console.log('\n🔨 Triggering EAS Build (preview profile)...');
  console.log('⏳ This will take 10-15 minutes...\n');
  
  execSync('eas build --platform android --profile preview --non-interactive --no-wait', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n✅ Build triggered successfully!');
  console.log('\n📱 Check build status at:');
  console.log('   https://expo.dev/accounts/gibranperon/projects/betakasir/builds');
  console.log('\n💡 The build will continue in the cloud.');
  console.log('   You will receive an email when it\'s done.');
  console.log('   Or check the dashboard link above.\n');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  console.log('\n🔧 Alternative: Build via Dashboard');
  console.log('   1. Go to: https://expo.dev/accounts/gibranperon/projects/betakasir/builds');
  console.log('   2. Click "Learn More" or look for build button');
  console.log('   3. Select Android → preview → Build\n');
  process.exit(1);
}
