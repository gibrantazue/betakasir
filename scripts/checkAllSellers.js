// Script untuk cek semua sellers dan kode referral mereka
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBJ7Kd9rTJE8FvyyVbF-o0RgnSgormwmnY",
  authDomain: "betakasir.firebaseapp.com",
  projectId: "betakasir",
  storageBucket: "betakasir.firebasestorage.app",
  messagingSenderId: "424861148877",
  appId: "1:424861148877:web:f064ebd57c9035b976ab84"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAllSellers() {
  console.log('🔍 CEK SEMUA SELLERS');
  console.log('================================\n');

  try {
    const sellersSnapshot = await getDocs(collection(db, 'sellers'));
    
    console.log(`📊 Total Sellers: ${sellersSnapshot.size}\n`);

    if (sellersSnapshot.empty) {
      console.log('⚠️ Tidak ada seller di database');
      return;
    }

    console.log('📋 DAFTAR SELLERS:\n');
    
    sellersSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.email || 'No Email'}`);
      console.log(`   UID: ${doc.id}`);
      console.log(`   Referral Code: ${data.referralCode || 'TIDAK ADA'}`);
      console.log(`   Sales UID: ${data.salesUid || 'TIDAK ADA'}`);
      console.log(`   Created: ${data.createdAt?.toDate?.()?.toLocaleDateString('id-ID') || 'N/A'}`);
      console.log('');
    });

    // Group by referral code
    const byReferralCode = {};
    sellersSnapshot.forEach(doc => {
      const data = doc.data();
      const code = data.referralCode || 'NO_CODE';
      if (!byReferralCode[code]) {
        byReferralCode[code] = [];
      }
      byReferralCode[code].push({
        email: data.email,
        uid: doc.id
      });
    });

    console.log('================================');
    console.log('📊 GROUP BY REFERRAL CODE:');
    console.log('================================\n');
    
    Object.keys(byReferralCode).forEach(code => {
      console.log(`${code}: ${byReferralCode[code].length} seller(s)`);
      byReferralCode[code].forEach(seller => {
        console.log(`   - ${seller.email || seller.uid}`);
      });
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllSellers()
  .then(() => {
    console.log('✅ Selesai!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
