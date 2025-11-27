/**
 * Upload Changelog v1.1.9, v1.2.0, dan v1.2.1 ke Firestore
 * 
 * Script ini akan upload 3 changelog terbaru:
 * - v1.2.1 - Patch Update
 * - v1.2.0 - Realtime Update & Pro Plan
 * - v1.1.9 - AI Knows App Version
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Changelog data
const changelogs = [
  {
    id: 'v1.2.1',
    version: '1.2.1',
    date: '2025-11-23',
    title: 'Patch Update',
    description: 'Version synchronization update dengan fitur zoom control untuk desktop app.',
    type: 'patch',
    changes: [
      {
        category: 'feature',
        text: 'Zoom control untuk desktop (Ctrl +/-/0)'
      },
      {
        category: 'feature',
        text: 'Smooth zoom dengan increment 0.5 per press'
      },
      {
        category: 'improvement',
        text: 'Version synchronization across all files'
      },
      {
        category: 'improvement',
        text: 'Updated package.json version to 1.2.1'
      },
      {
        category: 'improvement',
        text: 'Updated app.json version to 1.2.1'
      },
      {
        category: 'improvement',
        text: 'Documentation updates'
      },
      {
        category: 'bugfix',
        text: 'Bug fixes dan improvements'
      }
    ]
  },
  {
    id: 'v1.2.0',
    version: '1.2.0',
    date: '2025-11-22',
    title: 'Realtime Update & Pro Plan',
    description: 'Update v1.2.0 membawa sistem notifikasi update realtime dan rebranding Business Plan menjadi Pro Plan.',
    type: 'minor',
    changes: [
      {
        category: 'feature',
        text: 'Realtime Update Notification System'
      },
      {
        category: 'feature',
        text: 'Smart version comparison otomatis'
      },
      {
        category: 'feature',
        text: 'In-screen notification card tanpa popup'
      },
      {
        category: 'feature',
        text: 'Admin control panel untuk update notifications'
      },
      {
        category: 'feature',
        text: 'WhatsApp integration untuk upgrade'
      },
      {
        category: 'improvement',
        text: 'Business Plan → Pro Plan rebranding'
      },
      {
        category: 'improvement',
        text: 'Better update UX dengan always visible notification'
      },
      {
        category: 'bugfix',
        text: 'Fixed Alert.alert() tidak bekerja di web browser'
      },
      {
        category: 'bugfix',
        text: 'Fixed version comparison dengan semantic versioning'
      }
    ]
  },
  {
    id: 'v1.1.9',
    version: '1.1.9',
    date: '2025-01-22',
    title: 'AI Knows App Version',
    description: 'AI Assistant sekarang otomatis mengetahui versi aplikasi dan changelog terbaru! Plus perbaikan tombol Cek Update.',
    type: 'minor',
    changes: [
      {
        category: 'feature',
        text: 'AI Assistant sekarang tahu versi aplikasi saat ini'
      },
      {
        category: 'feature',
        text: 'AI dapat menjawab pertanyaan tentang changelog terbaru'
      },
      {
        category: 'feature',
        text: 'Auto-inject version info ke AI context'
      },
      {
        category: 'feature',
        text: 'Version display otomatis sync dari GitHub Releases'
      },
      {
        category: 'improvement',
        text: 'Fallback ke hardcoded version jika offline'
      },
      {
        category: 'improvement',
        text: 'Caching untuk performa optimal'
      },
      {
        category: 'bugfix',
        text: 'Fixed tombol "Cek Update" sekarang trigger electron auto-updater'
      },
      {
        category: 'bugfix',
        text: 'Improved version comparison accuracy'
      }
    ]
  }
];

async function uploadChangelogs() {
  console.log('🚀 Starting changelog upload...\n');

  try {
    for (const changelog of changelogs) {
      console.log(`📝 Uploading ${changelog.id}...`);
      
      await db.collection('changelogs').doc(changelog.id).set({
        ...changelog,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ ${changelog.id} uploaded successfully!`);
      console.log(`   Title: ${changelog.title}`);
      console.log(`   Date: ${changelog.date}`);
      console.log(`   Changes: ${changelog.changes.length} items\n`);
    }

    console.log('🎉 All changelogs uploaded successfully!\n');
    console.log('Summary:');
    console.log('✅ v1.2.1 - Patch Update');
    console.log('✅ v1.2.0 - Realtime Update & Pro Plan');
    console.log('✅ v1.1.9 - AI Knows App Version');
    console.log('\nChangelogs are now available in:');
    console.log('- Settings → Changelog (for all users)');
    console.log('- Admin → Kelola Changelog (for admin)');

  } catch (error) {
    console.error('❌ Error uploading changelogs:', error);
    throw error;
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the upload
uploadChangelogs();
