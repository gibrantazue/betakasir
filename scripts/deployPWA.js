#!/usr/bin/env node

/**
 * Script untuk deploy BetaKasir PWA ke Firebase Hosting
 * Usage: node scripts/deployPWA.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 BetaKasir PWA Deployment Script\n');

// Check if web-build exists
const webBuildPath = path.join(__dirname, '..', 'web-build');

function runCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} - Success!`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - Failed!`);
    console.error(error.message);
    return false;
  }
}

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n');
  
  // Check if firebase-tools installed
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI installed');
  } catch {
    console.log('❌ Firebase CLI not installed');
    console.log('\n📥 Installing Firebase CLI...');
    runCommand('npm install -g firebase-tools', 'Install Firebase CLI');
  }

  // Check if logged in to Firebase
  try {
    execSync('firebase projects:list', { stdio: 'pipe' });
    console.log('✅ Logged in to Firebase');
  } catch {
    console.log('❌ Not logged in to Firebase');
    console.log('\n🔐 Please login to Firebase:');
    runCommand('firebase login', 'Firebase Login');
  }
}

function buildWeb() {
  console.log('\n🏗️  Building web version...\n');
  
  if (!runCommand('npm run build-web', 'Build Web')) {
    process.exit(1);
  }

  // Check if build successful
  if (!fs.existsSync(webBuildPath)) {
    console.error('❌ web-build folder not found!');
    process.exit(1);
  }

  console.log('✅ Web build completed successfully!');
}

function checkIcons() {
  console.log('\n🎨 Checking icons...\n');
  
  const icon192 = path.join(__dirname, '..', 'public', 'icon-192.png');
  const icon512 = path.join(__dirname, '..', 'public', 'icon-512.png');

  if (fs.existsSync(icon192)) {
    console.log('✅ icon-192.png found');
  } else {
    console.log('⚠️  icon-192.png not found - PWA install might not work properly');
  }

  if (fs.existsSync(icon512)) {
    console.log('✅ icon-512.png found');
  } else {
    console.log('⚠️  icon-512.png not found - Create 512x512 icon for better PWA support');
  }
}

function initFirebase() {
  const firebaseJsonPath = path.join(__dirname, '..', 'firebase.json');
  
  if (fs.existsSync(firebaseJsonPath)) {
    console.log('\n✅ firebase.json already exists');
    return;
  }

  console.log('\n⚙️  Initializing Firebase Hosting...\n');
  console.log('Please select:');
  console.log('  - Public directory: web-build');
  console.log('  - Single-page app: Yes');
  console.log('  - Automatic builds: No');
  console.log('  - Overwrite index.html: No\n');
  
  runCommand('firebase init hosting', 'Initialize Firebase Hosting');
}

function deploy() {
  console.log('\n🚀 Deploying to Firebase Hosting...\n');
  
  if (!runCommand('firebase deploy --only hosting', 'Deploy to Firebase')) {
    process.exit(1);
  }

  console.log('\n✨ Deployment successful!\n');
  console.log('📱 Your PWA is now live!');
  console.log('\n📋 Next steps:');
  console.log('  1. Test the PWA on your phone');
  console.log('  2. Try "Add to Home Screen" on iOS Safari');
  console.log('  3. Share the URL with your users');
  console.log('\n💡 Tip: Setup custom domain in Firebase Console for professional URL');
}

// Main execution
async function main() {
  try {
    checkPrerequisites();
    checkIcons();
    buildWeb();
    initFirebase();
    deploy();
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

main();
