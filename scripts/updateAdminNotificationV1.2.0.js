const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'firebase-admin-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateAdminNotificationV120() {
  try {
    console.log('🔔 Setting up Update Notification for v1.2.0...');
    
    const updateNotificationData = {
      latestVersion: '1.2.0',
      upToDateMessage: 'Aplikasi Anda sudah menggunakan versi terbaru v1.2.0! 🎉\n\nFitur baru:\n✅ Realtime Update Notification\n✅ Pro Plan (dulu Business Plan)\n✅ Smart version comparison',
      updateAvailableMessage: 'Update v1.2.0 tersedia! 🚀\n\nFitur baru yang menanti:\n🔔 Realtime Update Notification System\n🎨 Business Plan → Pro Plan\n⚡ Smart version comparison\n🎯 In-screen notification card\n💬 WhatsApp integration\n\nUpgrade sekarang untuk mendapatkan fitur terbaru!',
      whatsappNumber: '6281340078956',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Update notification settings
    await db.collection('appSettings').doc('app-update-notification').set(updateNotificationData);
    
    console.log('✅ Update notification settings configured!');
    console.log('📊 Configuration:');
    console.log('- Latest Version:', updateNotificationData.latestVersion);
    console.log('- WhatsApp Number:', updateNotificationData.whatsappNumber);
    console.log('- Up to Date Message:', updateNotificationData.upToDateMessage.substring(0, 50) + '...');
    console.log('- Update Available Message:', updateNotificationData.updateAvailableMessage.substring(0, 50) + '...');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Build aplikasi dengan versi 1.2.0');
    console.log('2. Test update notification system');
    console.log('3. User dengan versi lama akan melihat notifikasi update');
    console.log('4. User dengan versi 1.2.0 akan melihat "sudah terbaru"');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up update notification:', error);
    process.exit(1);
  }
}

updateAdminNotificationV120();
