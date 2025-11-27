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
    console.log('🚀 Starting upload changelog v1.1.9...\n');

    const changelogData = {
      version: '1.1.9',
      title: 'AI Knows App Version',
      description: 'AI Assistant sekarang otomatis mengetahui versi aplikasi dan changelog terbaru! Plus perbaikan tombol Cek Update.',
      date: '2025-01-22',
      type: 'feature',
      changes: [
        {
          category: 'AI Enhancement',
          emoji: '🤖',
          items: [
            'AI Assistant sekarang tahu versi aplikasi saat ini',
            'AI dapat menjawab pertanyaan tentang changelog terbaru',
            'Auto-inject version info ke AI context',
            'AI dapat menjelaskan fitur-fitur baru',
            'AI dapat menyebutkan bug fixes yang sudah dilakukan'
          ]
        },
        {
          category: 'Version Auto-Sync',
          emoji: '🔄',
          items: [
            'Version display otomatis sync dari GitHub Releases',
            'Fallback ke hardcoded version jika offline',
            'Caching untuk performa optimal',
            'Display di 3 tempat: Settings, Footer, About'
          ]
        },
        {
          category: 'Bug Fixes',
          emoji: '🐛',
          items: [
            'Fixed tombol "Cek Update" sekarang trigger electron auto-updater',
            'Sebelumnya membuka browser, sekarang download & install otomatis',
            'Improved version comparison accuracy',
            'Fixed changelog fetch performance'
          ]
        },
        {
          category: 'Technical Improvements',
          emoji: '⚡',
          items: [
            'New function: getAppVersionInfo() di aiContextService',
            'Version fetch < 500ms (with cache: < 1ms)',
            'Changelog fetch < 300ms',
            'Total overhead < 1 second'
          ]
        }
      ],
      features: [
        {
          title: 'AI Knows Version',
          description: 'AI Assistant dapat menjawab pertanyaan tentang versi aplikasi dan changelog',
          type: 'new'
        },
        {
          title: 'Version Auto-Sync',
          description: 'Version display otomatis sync dari GitHub dengan fallback offline',
          type: 'new'
        },
        {
          title: 'Smart Check Update',
          description: 'Tombol Cek Update sekarang langsung download & install',
          type: 'improvement'
        }
      ],
      bugFixes: [
        {
          title: 'Fixed Check Update Button',
          description: 'Tombol sekarang trigger electron auto-updater, bukan buka browser',
          impact: 'high'
        },
        {
          title: 'Improved Version Comparison',
          description: 'Version comparison lebih akurat dengan semantic versioning',
          impact: 'medium'
        }
      ],
      benefits: {
        forUsers: [
          'AI lebih informatif tentang aplikasi',
          'Bisa tanya versi & fitur kapan saja',
          'Tidak perlu cek Settings manual'
        ],
        forDevelopers: [
          'AI auto-update knowledge base',
          'Tidak perlu update AI prompt manual',
          'Changelog otomatis tersedia untuk AI'
        ],
        forBusiness: [
          'User lebih aware tentang fitur baru',
          'Meningkatkan adoption fitur baru',
          'Better user engagement'
        ]
      },
      examples: [
        {
          question: 'Versi berapa aplikasi ini?',
          answer: 'Aplikasi BetaKasir saat ini versi 1.1.9, dirilis pada 22 Januari 2025.'
        },
        {
          question: 'Fitur apa yang baru?',
          answer: 'Di versi 1.1.9 ada fitur baru: AI Assistant sekarang tahu versi aplikasi, Version auto-sync dari GitHub, Fix tombol Cek Update, dan masih banyak lagi!'
        },
        {
          question: 'Ada update apa?',
          answer: 'Update terbaru v1.1.9 fokus pada: 1. AI Enhancement - AI tahu versi & changelog, 2. Version Auto-Sync - Sync otomatis dari GitHub, 3. Bug Fixes - Perbaikan tombol Cek Update'
        }
      ],
      technicalChanges: [
        'Added getAppVersionInfo() in aiContextService.ts',
        'Updated geminiService.ts to inject version info',
        'Added version caching mechanism',
        'Updated electron auto-updater integration',
        'Improved error handling for offline mode'
      ],
      migration: {
        required: false,
        breaking: false,
        notes: 'No breaking changes. All existing features continue to work.'
      },
      statistics: {
        newFiles: 8,
        modifiedFiles: 5,
        linesAdded: 450,
        linesRemoved: 30,
        bugFixes: 2,
        newFeatures: 2
      },
      performance: {
        versionFetch: '< 500ms',
        versionFetchCached: '< 1ms',
        changelogFetch: '< 300ms',
        totalOverhead: '< 1 second',
        accuracy: '100%'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Upload to Firestore
    await db.collection('changelogs').doc('v1.1.9').set(changelogData);
    console.log('✅ Changelog v1.1.9 uploaded successfully!\n');

    console.log('📊 Data uploaded:');
    console.log('- Version:', changelogData.version);
    console.log('- Title:', changelogData.title);
    console.log('- Changes:', changelogData.changes.length, 'categories');
    console.log('- Features:', changelogData.features.length);
    console.log('- Bug Fixes:', changelogData.bugFixes.length);
    console.log('- Examples:', changelogData.examples.length);
    console.log('\n🎉 All done! Changelog v1.1.9 is now live in Firestore.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading changelog:', error);
    process.exit(1);
  }
}

uploadChangelog();
