/**
 * Script untuk publish test update ke Firestore
 * 
 * Cara pakai:
 * node scripts/publishTestUpdate.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
// Pastikan file serviceAccountKey.json ada di root project
try {
  const serviceAccount = require('../serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.log('\n📝 Cara setup:');
  console.log('1. Buka Firebase Console');
  console.log('2. Project Settings > Service Accounts');
  console.log('3. Generate New Private Key');
  console.log('4. Save as serviceAccountKey.json di root project');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Publish test update version
 */
async function publishTestUpdate() {
  try {
    console.log('\n🚀 Publishing test update...\n');
    
    const testVersion = {
      version: '1.1.0',
      buildNumber: 2,
      releaseDate: new Date().toISOString(),
      downloadUrl: {
        windows: 'https://example.com/BetaKasir-Setup-1.1.0.exe',
        mac: 'https://example.com/BetaKasir-1.1.0.dmg',
        android: 'https://example.com/BetaKasir-1.1.0.apk',
        web: 'https://betakasir.com',
      },
      changelog: [
        '✨ Fitur baru: Testing sistem auto-update',
        '🐛 Perbaikan: Bug fixes dan improvements',
        '⚡ Peningkatan: Performance optimization',
        '🎨 UI/UX: Tampilan lebih modern',
        '🔒 Security: Enhanced security features',
      ],
      mandatory: false,
      minVersion: '1.0.0',
      publishedAt: new Date().toISOString(),
    };
    
    // Publish to Firestore
    await db.collection('appSettings').doc('latestVersion').set(testVersion);
    
    console.log('✅ Test update published successfully!\n');
    console.log('📋 Version Info:');
    console.log('   Version:', testVersion.version);
    console.log('   Build:', testVersion.buildNumber);
    console.log('   Mandatory:', testVersion.mandatory);
    console.log('   Release Date:', new Date(testVersion.releaseDate).toLocaleString('id-ID'));
    console.log('\n📝 Changelog:');
    testVersion.changelog.forEach(change => {
      console.log('   •', change);
    });
    console.log('\n🎯 Next Steps:');
    console.log('   1. Reload aplikasi BetaKasir');
    console.log('   2. Modal update akan muncul otomatis');
    console.log('   3. Test tombol "Update Now"');
    console.log('   4. Verifikasi semua fitur bekerja');
    console.log('\n✅ Done!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error publishing test update:', error);
    process.exit(1);
  }
}

/**
 * Publish mandatory update (force update)
 */
async function publishMandatoryUpdate() {
  try {
    console.log('\n🚨 Publishing MANDATORY update...\n');
    
    const mandatoryVersion = {
      version: '1.2.0',
      buildNumber: 3,
      releaseDate: new Date().toISOString(),
      downloadUrl: {
        windows: 'https://example.com/BetaKasir-Setup-1.2.0.exe',
        web: 'https://betakasir.com',
      },
      changelog: [
        '🔒 CRITICAL: Security patch (wajib update)',
        '🐛 Perbaikan: Bug kritis',
        '⚡ Peningkatan: Stability improvements',
      ],
      mandatory: true, // ⚠️ FORCE UPDATE
      minVersion: '1.0.0',
      publishedAt: new Date().toISOString(),
    };
    
    await db.collection('appSettings').doc('latestVersion').set(mandatoryVersion);
    
    console.log('✅ Mandatory update published!\n');
    console.log('⚠️  WARNING: This is a MANDATORY update');
    console.log('   Users CANNOT skip this update');
    console.log('\n📋 Version Info:');
    console.log('   Version:', mandatoryVersion.version);
    console.log('   Mandatory:', mandatoryVersion.mandatory);
    console.log('\n✅ Done!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error publishing mandatory update:', error);
    process.exit(1);
  }
}

/**
 * Clear update (remove from Firestore)
 */
async function clearUpdate() {
  try {
    console.log('\n🗑️  Clearing update...\n');
    
    await db.collection('appSettings').doc('latestVersion').delete();
    
    console.log('✅ Update cleared!');
    console.log('   Modal will not appear anymore\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing update:', error);
    process.exit(1);
  }
}

/**
 * Check current version in Firestore
 */
async function checkCurrentVersion() {
  try {
    console.log('\n🔍 Checking current version in Firestore...\n');
    
    const doc = await db.collection('appSettings').doc('latestVersion').get();
    
    if (!doc.exists) {
      console.log('❌ No version found in Firestore');
      console.log('   Run: node scripts/publishTestUpdate.js test');
      console.log('');
      process.exit(0);
    }
    
    const data = doc.data();
    
    console.log('✅ Current version in Firestore:\n');
    console.log('   Version:', data.version);
    console.log('   Build:', data.buildNumber);
    console.log('   Mandatory:', data.mandatory);
    console.log('   Release Date:', new Date(data.releaseDate).toLocaleString('id-ID'));
    console.log('   Published At:', new Date(data.publishedAt).toLocaleString('id-ID'));
    console.log('\n📝 Changelog:');
    data.changelog.forEach(change => {
      console.log('   •', change);
    });
    console.log('\n📥 Download URLs:');
    Object.entries(data.downloadUrl).forEach(([platform, url]) => {
      console.log(`   ${platform}:`, url);
    });
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking version:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2] || 'test';

console.log('🎯 BetaKasir - Auto Update Publisher\n');

switch (command) {
  case 'test':
    publishTestUpdate();
    break;
  case 'mandatory':
    publishMandatoryUpdate();
    break;
  case 'clear':
    clearUpdate();
    break;
  case 'check':
    checkCurrentVersion();
    break;
  default:
    console.log('❌ Unknown command:', command);
    console.log('\n📝 Available commands:');
    console.log('   node scripts/publishTestUpdate.js test       - Publish test update (optional)');
    console.log('   node scripts/publishTestUpdate.js mandatory  - Publish mandatory update (force)');
    console.log('   node scripts/publishTestUpdate.js check      - Check current version');
    console.log('   node scripts/publishTestUpdate.js clear      - Clear update from Firestore');
    console.log('');
    process.exit(1);
}
