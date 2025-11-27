const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * Script untuk menghapus kode referral lama dari semua akun sellers
 * Membersihkan field: referralCode, referredBy, referredAt
 */
async function cleanupOldReferralCodes() {
  try {
    console.log('🧹 Starting cleanup of old referral codes...\n');

    // 1. Get all users (sellers) yang punya referral code
    const usersSnapshot = await db.collection('users')
      .where('referralCode', '!=', null)
      .get();

    console.log(`📊 Found ${usersSnapshot.size} sellers with referral codes\n`);

    if (usersSnapshot.empty) {
      console.log('✅ No referral codes to clean up!');
      return;
    }

    // 2. List semua sellers yang akan dibersihkan
    console.log('📋 Sellers yang akan dibersihkan:');
    console.log('─'.repeat(60));
    
    const sellersToClean = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      sellersToClean.push({
        uid: doc.id,
        email: data.email,
        displayName: data.displayName,
        referralCode: data.referralCode,
        referredBy: data.referredBy,
      });
      
      console.log(`👤 ${data.displayName || data.email}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Kode: ${data.referralCode}`);
      console.log(`   Referred By: ${data.referredBy || 'N/A'}`);
      console.log('');
    });

    console.log('─'.repeat(60));
    console.log(`\n⚠️  Total: ${sellersToClean.length} sellers akan dibersihkan\n`);

    // 3. Konfirmasi
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      readline.question('Lanjutkan cleanup? (yes/no): ', resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Cleanup dibatalkan');
      return;
    }

    console.log('\n🚀 Starting cleanup process...\n');

    // 4. Cleanup setiap seller
    let successCount = 0;
    let errorCount = 0;

    for (const seller of sellersToClean) {
      try {
        // Remove referral fields
        await db.collection('users').doc(seller.uid).update({
          referralCode: admin.firestore.FieldValue.delete(),
          referredBy: admin.firestore.FieldValue.delete(),
          referredAt: admin.firestore.FieldValue.delete(),
        });

        console.log(`✅ Cleaned: ${seller.displayName || seller.email}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error cleaning ${seller.email}:`, error.message);
        errorCount++;
      }
    }

    // 5. Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Success: ${successCount} sellers`);
    console.log(`❌ Errors: ${errorCount} sellers`);
    console.log(`📊 Total: ${sellersToClean.length} sellers`);
    console.log('═'.repeat(60));

    if (successCount > 0) {
      console.log('\n✅ Cleanup completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Sellers sekarang bisa input kode referral baru di Settings');
      console.log('2. Admin bisa monitor di Sales Management');
      console.log('3. totalReferrals di salesPeople akan mulai dari 0');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the script
cleanupOldReferralCodes()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
