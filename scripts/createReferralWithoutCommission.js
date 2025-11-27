// Script untuk buat referral data tanpa komisi
// Untuk seller yang sudah isi kode referral tapi belum upgrade

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, updateDoc, increment, Timestamp } = require('firebase/firestore');

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

const SALES_UID = 'yfQYH7H6k4hhLhsFK7dILtlchYF2';
const SALES_EMAIL = 'gibran@sales.com';
const SALES_NAME = 'Gibran';
const REFERRAL_CODE = 'GIBR9885';

const SELLER_UID = 'XmaWbi5CVOVnVHDFgEczHbkFTWD2';
const SELLER_EMAIL = 'gibranperon@gmail.com';
const SELLER_NAME = 'Gibran Peron';

async function createReferralWithoutCommission() {
  console.log('📝 BUAT REFERRAL DATA (TANPA KOMISI)');
  console.log('================================\n');

  try {
    // 1. CEK APAKAH REFERRAL SUDAH ADA
    const referralId = `${SALES_UID}_${SELLER_UID}`;
    const referralDoc = await getDoc(doc(db, 'referrals', referralId));
    
    if (referralDoc.exists()) {
      console.log('⚠️ Referral sudah ada!');
      console.log(JSON.stringify(referralDoc.data(), null, 2));
      return;
    }

    console.log('1️⃣ Membuat referral data...');
    
    // 2. BUAT REFERRAL DATA (tanpa komisi, karena seller belum upgrade)
    const referralData = {
      id: referralId,
      salesUid: SALES_UID,
      salesName: SALES_NAME,
      salesEmail: SALES_EMAIL,
      referralCode: REFERRAL_CODE,
      customerUid: SELLER_UID,
      customerName: SELLER_NAME,
      customerEmail: SELLER_EMAIL,
      customerPlan: 'free', // Masih free
      commissionAmount: 0, // Belum ada komisi
      commissionStatus: 'pending', // Pending sampai upgrade
      createdAt: Timestamp.now(),
      note: 'Menunggu seller upgrade ke paid plan'
    };

    await setDoc(doc(db, 'referrals', referralId), referralData);
    console.log('✅ Referral data dibuat!');
    console.log(JSON.stringify(referralData, null, 2));
    console.log('');

    // 3. UPDATE SALES STATS (totalReferrals +1, tapi totalCommission masih 0)
    console.log('2️⃣ Update sales stats...');
    await updateDoc(doc(db, 'sales', SALES_UID), {
      totalReferrals: increment(1),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Sales stats updated!');
    console.log('');

    // 4. SUMMARY
    console.log('================================');
    console.log('✅ SELESAI!');
    console.log('================================');
    console.log(`Sales: ${SALES_EMAIL}`);
    console.log(`Seller: ${SELLER_EMAIL}`);
    console.log(`Kode Referral: ${REFERRAL_CODE}`);
    console.log(`Status: Menunggu seller upgrade`);
    console.log(`Komisi: Rp 0 (akan dibuat setelah upgrade)`);
    console.log('');
    console.log('💡 Sekarang seller akan muncul di Sales Dashboard!');
    console.log('💡 Komisi akan otomatis dibuat waktu seller upgrade ke Basic/Business');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the script
createReferralWithoutCommission()
  .then(() => {
    console.log('\n👋 Script selesai!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
