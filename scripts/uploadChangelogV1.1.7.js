const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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

    // Upload to Firestore
    await db.collection('changelogs').doc('v1.1.7').set(changelogData);
    
    console.log('✅ Changelog v1.1.7 berhasil diupload ke Firestore!\n');
    console.log('📊 Data yang diupload:');
    console.log('   Version:', changelogData.version);
    console.log('   Title:', changelogData.title);
    console.log('   Features:', changelogData.features.length, 'categories');
    console.log('   Improvements:', changelogData.improvements.length, 'items');
    console.log('   Bug Fixes:', changelogData.bugFixes.length, 'items');
    console.log('   Status:', changelogData.status);
    console.log('\n✅ DONE! Changelog siap ditampilkan di aplikasi.\n');

  } catch (error) {
    console.error('❌ Error uploading changelog:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

uploadChangelog();
