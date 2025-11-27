const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadChangelog() {
  try {
    console.log('🚀 Starting upload changelog v1.2.1...\n');

    const changelogData = {
      version: '1.2.1',
      title: 'Patch Update',
      description: 'Version synchronization update',
      date: '2025-11-23',
      type: 'patch',
      changes: [
        {
          category: 'Version Update',
          emoji: '🔧',
          items: [
            'Updated package.json version to 1.2.1',
            'Updated app.json version to 1.2.1',
            'Synchronized version across all configuration files',
            'Updated documentation to reflect current version'
          ]
        },
        {
          category: 'Documentation',
          emoji: '📝',
          items: [
            'Created CHANGELOG_V1.2.1.md',
            'Updated CHANGELOG.md with v1.2.1 entry',
            'Updated README.md version badge',
            'Created VERSION_UPDATE_1.2.1.md guide'
          ]
        }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Upload to Firestore
    await db.collection('changelogs').doc('v1.2.1').set(changelogData);
    console.log('✅ Changelog v1.2.1 uploaded successfully!\n');

    // Update latest changelog reference
    await db.collection('appSettings').doc('latestChangelog').set({
      version: '1.2.1',
      title: 'Patch Update',
      date: '2025-11-23',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Latest changelog reference updated!\n');

    // Update app version
    await db.collection('appSettings').doc('appVersion').set({
      version: '1.2.1',
      buildNumber: 12,
      releaseDate: '2025-11-23',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ App version updated to 1.2.1!\n');

    // Update notification for users
    await db.collection('appSettings').doc('app-update-notification').update({
      latestVersion: '1.2.1',
      updateAvailableMessage: 'Update v1.2.1 tersedia! Patch update untuk sinkronisasi versi.',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Update notification configured!\n');

    console.log('🎉 All done! Changelog v1.2.1 is now live in Firestore.\n');
    console.log('📱 Users will see the update notification in Settings screen.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading changelog:', error);
    process.exit(1);
  }
}

uploadChangelog();
