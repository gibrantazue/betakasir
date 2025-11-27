#!/usr/bin/env node

/**
 * Script untuk build iOS dengan EAS
 * Usage: node scripts/buildIOS.js [profile]
 * Profiles: development, preview, production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const profile = process.argv[2] || 'preview';
const validProfiles = ['development', 'preview', 'production'];

console.log('🍎 BetaKasir iOS Build Script\n');

if (!validProfiles.includes(profile)) {
  console.error(`❌ Invalid profile: ${profile}`);
  console.log(`Valid profiles: ${validProfiles.join(', ')}`);
  process.exit(1);
}

function runCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} - Success!`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - Failed!`);
    return false;
  }
}

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n');
  
  // Check if eas-cli installed
  try {
    execSync('eas --version', { stdio: 'pipe' });
    console.log('✅ EAS CLI installed');
  } catch {
    console.log('❌ EAS CLI not installed');
    console.log('\n📥 Installing EAS CLI...');
    if (!runCommand('npm install -g eas-cli', 'Install EAS CLI')) {
      process.exit(1);
    }
  }

  // Check if logged in to Expo
  try {
    execSync('eas whoami', { stdio: 'pipe' });
    console.log('✅ Logged in to Expo');
  } catch {
    console.log('❌ Not logged in to Expo');
    console.log('\n🔐 Please login to Expo:');
    if (!runCommand('eas login', 'Expo Login')) {
      process.exit(1);
    }
  }

  // Check app.json
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  if (!fs.existsSync(appJsonPath)) {
    console.error('❌ app.json not found!');
    process.exit(1);
  }
  console.log('✅ app.json found');

  // Check eas.json
  const easJsonPath = path.join(__dirname, '..', 'eas.json');
  if (!fs.existsSync(easJsonPath)) {
    console.error('❌ eas.json not found!');
    console.log('\n⚙️  Run: eas build:configure');
    process.exit(1);
  }
  console.log('✅ eas.json found');
}

function showBuildInfo() {
  console.log(`\n📋 Build Information:`);
  console.log(`   Profile: ${profile}`);
  console.log(`   Platform: iOS`);
  
  if (profile === 'development') {
    console.log(`   Type: Development build (for testing on simulator)`);
  } else if (profile === 'preview') {
    console.log(`   Type: Preview build (for TestFlight internal testing)`);
  } else {
    console.log(`   Type: Production build (for App Store submission)`);
  }
  
  console.log('\n⏱️  Build will take 10-20 minutes...');
  console.log('☁️  Building on EAS cloud (no Mac needed!)\n');
}

function build() {
  const command = `eas build --platform ios --profile ${profile}`;
  
  console.log(`\n🏗️  Starting iOS build...\n`);
  console.log(`Command: ${command}\n`);
  
  if (!runCommand(command, 'Build iOS')) {
    console.error('\n❌ Build failed!');
    console.log('\n💡 Common issues:');
    console.log('  - Apple Developer account not configured');
    console.log('  - Bundle identifier mismatch');
    console.log('  - EAS credits exhausted (upgrade plan)');
    console.log('\n📚 Check: https://docs.expo.dev/build/setup/');
    process.exit(1);
  }

  console.log('\n✨ Build completed successfully!\n');
  console.log('📱 Next steps:');
  
  if (profile === 'development') {
    console.log('  1. Download the .app file');
    console.log('  2. Drag to iOS Simulator');
    console.log('  3. Test the app');
  } else if (profile === 'preview') {
    console.log('  1. Download the .ipa file');
    console.log('  2. Upload to TestFlight:');
    console.log('     eas submit --platform ios --profile production');
    console.log('  3. Invite testers in App Store Connect');
  } else {
    console.log('  1. Submit to App Store:');
    console.log('     eas submit --platform ios --profile production');
    console.log('  2. Fill app information in App Store Connect');
    console.log('  3. Submit for review');
  }
  
  console.log('\n📚 Full guide: See DEPLOYMENT_GUIDE_PWA_IOS.md');
}

function showCostInfo() {
  console.log('\n💰 Cost Information:\n');
  console.log('  EAS Build:');
  console.log('    - Free tier: Limited builds per month');
  console.log('    - Paid tier: Unlimited builds ($29/month)');
  console.log('\n  Apple Developer:');
  console.log('    - Required for TestFlight & App Store');
  console.log('    - Cost: $99/year');
  console.log('\n  Alternative: Use PWA (100% free!)');
  console.log('    - Run: node scripts/deployPWA.js\n');
}

// Main execution
async function main() {
  try {
    showCostInfo();
    
    console.log('❓ Do you want to continue with iOS build?');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    checkPrerequisites();
    showBuildInfo();
    build();
  } catch (error) {
    if (error.message !== 'canceled') {
      console.error('\n❌ Build failed:', error.message);
    }
    process.exit(1);
  }
}

main();
