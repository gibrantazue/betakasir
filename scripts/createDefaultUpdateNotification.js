const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'firebase-admin-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createDefaultUpdateNotification() {
  try {
    console.log('🔧 Creating default update notification document...');
    
    const defaultData = {
      latestVersion: '1.1.10',
      upToDateMessage: 'Aplikasi Anda sudah menggunakan versi terbaru! 🎉',
      updateAvailableMessage: 'Update baru tersedia! Dapatkan fitur terbaru sekarang.',
      whatsappNumber: '6281340078956',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('appSettings').doc('app-update-notification').set(defaultData);
    
    console.log('✅ Default update notification created successfully!');
    console.log('📊 Data:', defaultData);
    
    // Verify
    const doc = await db.collection('appSettings').doc('app-update-notification').get();
    if (doc.exists) {
      console.log('✅ Verified! Document exists in Firestore');
      console.log('📄 Document data:', doc.data());
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating default update notification:', error);
    process.exit(1);
  }
}

createDefaultUpdateNotification();
