const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'firebase-admin-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadChangelogV120() {
  try {
    console.log('🚀 Uploading Changelog v1.2.0 to Firestore...');
    
    // Read changelog file
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG_V1.2.0.md');
    const changelogContent = fs.readFileSync(changelogPath, 'utf8');
    
    const changelogData = {
      version: '1.2.0',
      title: 'BetaKasir v1.2.0 - Realtime Update & Pro Plan',
      date: '2025-11-22',
      type: 'minor',
      content: changelogContent,
      summary: 'Update v1.2.0 membawa sistem notifikasi update realtime dan rebranding Business Plan menjadi Pro Plan',
      highlights: [
        'Realtime Update Notification System',
        'Business Plan → Pro Plan rebranding',
        'Smart version comparison',
        'In-screen notification card',
        'Admin control panel untuk update notifications',
        'WhatsApp integration untuk upgrade',
        'Bug fixes untuk web platform'
      ],
      features: [
        {
          title: 'Realtime Update Notification System',
          description: 'Sistem notifikasi update yang powerful dengan admin control panel',
          type: 'new'
        },
        {
          title: 'Pro Plan Rebranding',
          description: 'Business Plan berganti nama menjadi Pro Plan dengan fitur yang sama',
          type: 'improvement'
        },
        {
          title: 'Smart Version Comparison',
          description: 'Otomatis bandingkan versi user dengan versi terbaru dari Firestore',
          type: 'new'
        },
        {
          title: 'In-Screen Notification Card',
          description: 'Update notification tampil langsung di Settings tanpa popup',
          type: 'new'
        },
        {
          title: 'WhatsApp Integration',
          description: 'Tombol upgrade langsung buka WhatsApp ke admin support',
          type: 'new'
        }
      ],
      bugFixes: [
        {
          title: 'Fixed Alert.alert() on Web',
          description: 'Update notification sekarang muncul di semua platform',
          impact: 'high'
        },
        {
          title: 'Fixed Version Comparison',
          description: 'Sistem bisa detect update dengan benar menggunakan semantic versioning',
          impact: 'medium'
        }
      ],
      technicalChanges: [
        'Added updateNotificationService.ts',
        'Added useUpdateNotification.ts hook',
        'Added AdminUpdateNotificationScreen.tsx',
        'Updated subscription types (business → pro)',
        'Updated version to 1.2.0',
        'Added Firestore realtime listeners'
      ],
      migration: {
        required: false,
        breaking: false,
        notes: 'No breaking changes. Business plan users automatically become Pro plan users.'
      },
      statistics: {
        newFiles: 6,
        modifiedFiles: 8,
        linesAdded: 800,
        linesRemoved: 50,
        bugFixes: 3
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Upload to Firestore
    await db.collection('changelogs').doc('v1.2.0').set(changelogData);
    
    console.log('✅ Changelog v1.2.0 uploaded successfully!');
    console.log('📊 Data uploaded:');
    console.log('- Version:', changelogData.version);
    console.log('- Title:', changelogData.title);
    console.log('- Features:', changelogData.features.length);
    console.log('- Bug Fixes:', changelogData.bugFixes.length);
    console.log('- Technical Changes:', changelogData.technicalChanges.length);
    
    // Also update latest changelog pointer
    await db.collection('appSettings').doc('latestChangelog').set({
      version: '1.2.0',
      title: changelogData.title,
      date: changelogData.date,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Latest changelog pointer updated!');
    
    // Update version in appSettings
    await db.collection('appSettings').doc('appVersion').set({
      currentVersion: '1.2.0',
      buildNumber: 11,
      releaseDate: '2025-11-22',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ App version updated in Firestore!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading changelog:', error);
    process.exit(1);
  }
}

uploadChangelogV120();
