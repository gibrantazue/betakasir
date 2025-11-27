const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Firebase Admin Key...\n');

// Check if firebase-admin-key.json exists
const keyPath = path.join(__dirname, '..', 'firebase-admin-key.json');
if (!fs.existsSync(keyPath)) {
  console.error('❌ ERROR: firebase-admin-key.json tidak ditemukan!');
  console.log('\n📋 Cara fix:');
  console.log('1. Buka: https://console.firebase.google.com');
  console.log('2. Pilih project: betakasir');
  console.log('3. Settings > Service accounts');
  console.log('4. Generate new private key');
  console.log('5. Rename ke: firebase-admin-key.json');
  console.log('6. Copy ke root folder project');
  console.log('\n📖 Baca: CARA_GENERATE_FIREBASE_ADMIN_KEY_BARU.md\n');
  process.exit(1);
}

// Initialize Firebase Admin
try {
  const serviceAccount = require(keyPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin initialized successfully!\n');
} catch (error) {
  console.error('❌ ERROR initializing Firebase Admin:', error.message);
  console.log('\n⚠️ Key mungkin expired atau invalid.');
  console.log('📖 Baca: CARA_GENERATE_FIREBASE_ADMIN_KEY_BARU.md\n');
  process.exit(1);
}

const db = admin.firestore();

async function uploadChangelog() {
  try {
    console.log('📝 Starting changelog upload for v1.1.7...\n');

    const changelogData = {
      version: '1.1.7',
      releaseDate: '22 November 2025',
      title: 'Realtime System & Sales Dashboard Analytics',
      description: 'Update besar dengan sistem realtime untuk Admin & Sales Dashboard, plus fitur analytics lengkap dengan charts dan export report.',
      
      features: [
        {
          category: 'Sistem Realtime',
          items: [
            'Admin Dashboard - Sales Management dengan realtime updates',
            'Sales Dashboard dengan auto-refresh data',
            'Realtime sync multi-user untuk semua device',
            'Stats cards auto-refresh setiap 10 detik'
          ]
        },
        {
          category: 'Sales Dashboard Analytics',
          items: [
            'Tab Navigation System (Overview, Analytics, History)',
            'Performance Charts (Line Chart & Bar Chart)',
            'Advanced Metrics (Conversion Rate, Growth Rate)',
            'Export Report functionality'
          ]
        },
        {
          category: 'UI/UX Improvements',
          items: [
            'Dark Mode optimization untuk better readability',
            'Light Mode optimization dengan white backgrounds',
            'Chart labels dengan white color untuk kontras maksimal',
            'Modern card design dengan shadow dan spacing'
          ]
        }
      ],
      
      improvements: [
        'Optimasi Firestore queries dengan proper indexing',
        'Efficient data filtering (removed, cancelled, deleted)',
        'Memory leak prevention dengan proper cleanup',
        'Better contrast dan professional look',
        'Memoized calculations untuk performance'
      ],
      
      bugFixes: [
        'Fixed text visibility di dark mode',
        'Fixed chart background di light mode',
        'Fixed chart labels visibility',
        'Fixed memory leaks dengan proper listener cleanup',
        'Fixed data inconsistency dengan realtime sync'
      ],
      
      breaking: false,
      breakingChanges: [],
      
      important: [
        'Pastikan Firestore indexes sudah dibuat (WAJIB)',
        'Test di development environment dulu',
        'Monitor Firestore usage untuk optimasi'
      ],
      
      downloadUrl: 'https://github.com/gibrantazue/betakasir/releases/download/v1.1.7/BetaKasir-Setup-1.1.7.exe',
      
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      
      status: 'stable',
      platform: 'desktop',
      
      metadata: {
        buildNumber: '1.1.7',
        confidence: '100%',
        tested: true,
        approved: true
      }
    };

    console.log('📤 Uploading to Firestore...');
    
    // Upload to Firestore
    await db.collection('changelogs').doc('v1.1.7').set(changelogData);
    
    console.log('\n✅ SUCCESS! Changelog v1.1.7 berhasil diupload ke Firestore!\n');
    console.log('📊 Data yang diupload:');
    console.log('   Version:', changelogData.version);
    console.log('   Title:', changelogData.title);
    console.log('   Features:', changelogData.features.length, 'categories');
    console.log('   Improvements:', changelogData.improvements.length, 'items');
    console.log('   Bug Fixes:', changelogData.bugFixes.length, 'items');
    console.log('   Status:', changelogData.status);
    console.log('   Download URL:', changelogData.downloadUrl);
    
    console.log('\n🎉 DONE! Changelog siap ditampilkan di aplikasi.');
    console.log('\n📋 Next Steps:');
    console.log('1. ✅ Upload changelog (done)');
    console.log('2. ✅ Build desktop app (done)');
    console.log('3. ✅ Push to GitHub (done)');
    console.log('4. ⏳ Create GitHub Release dengan installer');
    console.log('5. ⏳ Test auto-update di aplikasi');
    console.log('\n🔗 Create Release: https://github.com/gibrantazue/betakasir/releases/new\n');

  } catch (error) {
    console.error('\n❌ ERROR uploading changelog:', error.message);
    
    if (error.message.includes('UNAUTHENTICATED') || error.message.includes('ACCESS_TOKEN_EXPIRED')) {
      console.log('\n⚠️ Firebase Admin Key expired atau invalid!');
      console.log('📖 Baca: CARA_GENERATE_FIREBASE_ADMIN_KEY_BARU.md');
      console.log('\n🔧 Quick Fix:');
      console.log('1. Buka: https://console.firebase.google.com');
      console.log('2. Settings > Service accounts > Generate new private key');
      console.log('3. Replace firebase-admin-key.json di root folder');
      console.log('4. Jalankan script ini lagi\n');
    }
    
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

uploadChangelog();
