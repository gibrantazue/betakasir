/**
 * Script untuk publish update v1.2.0 ke Firestore
 * Otomatis masukin data ke Firebase
 * 
 * Cara pakai:
 * node scripts/publishUpdateV1.2.0.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBJ7Kd9rTJE8FvyyVbF-o0RgnSgormwmnY",
  authDomain: "betakasir.firebaseapp.com",
  projectId: "betakasir",
  storageBucket: "betakasir.firebasestorage.app",
  messagingSenderId: "424861148877",
  appId: "1:424861148877:web:f064ebd57c9035b976ab84",
  measurementId: "G-P3GM97YQCZ"
};

// Initialize Firebase
console.log('🔥 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data update v1.2.0
const updateData = {
  version: '1.2.0',
  buildNumber: 3,
  releaseDate: new Date().toISOString(),
  downloadUrl: {
    windows: 'https://example.com/BetaKasir-Setup-1.2.0.exe',
    web: 'https://betakasir.com',
    android: 'https://example.com/BetaKasir-1.2.0.apk'
  },
  changelog: [
    '🚀 Test Update System - Notifikasi update bekerja!',
    '🤖 AI Assistant - Improvements & bug fixes',
    '👥 Employee Management - Enhanced features',
    '🐛 Bug Fixes - Minor fixes & improvements',
    '⚡ Performance - Faster loading & better UX'
  ],
  mandatory: false,
  minVersion: '1.0.0',
  publishedAt: new Date().toISOString()
};

// Publish to Firestore
async function publishUpdate() {
  try {
    console.log('\n📤 Publishing update to Firestore...\n');
    
    const docRef = doc(db, 'appSettings', 'latestVersion');
    await setDoc(docRef, updateData);
    
    console.log('✅ Update published successfully!\n');
    console.log('📋 Version Info:');
    console.log('   Version:', updateData.version);
    console.log('   Build:', updateData.buildNumber);
    console.log('   Mandatory:', updateData.mandatory);
    console.log('   Release Date:', new Date(updateData.releaseDate).toLocaleString('id-ID'));
    console.log('\n📝 Changelog:');
    updateData.changelog.forEach(change => {
      console.log('   •', change);
    });
    console.log('\n🎯 Next Steps:');
    console.log('   1. Buka aplikasi BetaKasir');
    console.log('   2. Refresh browser (F5)');
    console.log('   3. Modal update akan muncul!');
    console.log('\n✅ Done!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error publishing update:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Pastikan Firebase config sudah benar');
    console.log('   2. Pastikan Firestore sudah diaktifkan');
    console.log('   3. Pastikan koneksi internet OK');
    console.log('\n📝 Edit file ini dan ganti firebaseConfig dengan config Anda\n');
    process.exit(1);
  }
}

// Run
console.log('🚀 BetaKasir - Auto Update Publisher v1.2.0\n');
publishUpdate();
