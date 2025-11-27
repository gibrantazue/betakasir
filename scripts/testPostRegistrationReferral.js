// Script untuk test Post-Registration Referral
// Assign kode referral GIBR9885 ke seller yang sudah ada

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc, setDoc, addDoc, collection, increment, Timestamp } = require('firebase/firestore');

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
const REFERRAL_CODE = 'GIBR9885';

// Pilih seller yang mau dikasih kode referral
const TEST_SELLER = {
  uid: 'XmaWbi5CVOVnVHDFgEczHbkFTWD2', // gibranperon@gmail.com
  email: 'gibranperon@gmail.com',
  name: 'Gibran Peron'
};

async function testPostRegistrationReferral() {
  console.log('🧪 TEST POST-REGISTRATION REFERRAL');
  console.log('================================\n');

  try {
    // 1. CEK SALES USER
    console.log('1️⃣ Cek sales user...');
    const salesDoc = await getDoc(doc(db, 'sales', SALES_UID));
    
    if (!salesDoc.exists()) {
      console.log('❌ Sales document tidak ditemukan!');
      console.log('📝 Membuat sales document...');
      
      await setDoc(doc(db, 'sales', SALES_UID), {
        email: SALES_EMAIL,
        referralCode: REFERRAL_CODE,
        createdAt: Timestamp.now(),
        totalCommission: 0,
        totalReferrals: 0
      });
      
      console.log('✅ Sales document dibuat!\n');
    } else {
      console.log('✅ Sales document ditemukan');
      console.log(JSON.stringify(salesDoc.data(), null, 2));
      console.log('');
    }

    // 2. CEK SELLER
    console.log('2️⃣ Cek seller:', TEST_SELLER.email);
    const sellerDoc = await getDoc(doc(db, 'sellers', TEST_SELLER.uid));
    
    if (!sellerDoc.exists()) {
      console.log('❌ Seller tidak ditemukan!');
      return;
    }

    const sellerData = sellerDoc.data();
    console.log('📊 Seller data:');
    console.log(`   Email: ${sellerData.email}`);
    console.log(`   Referral Code: ${sellerData.referralCode || 'TIDAK ADA'}`);
    console.log(`   Sales UID: ${sellerData.salesUid || 'TIDAK ADA'}`);
    console.log('');

    // 3. CEK APAKAH SUDAH PUNYA REFERRAL
    if (sellerData.referralCode) {
      console.log('⚠️ Seller sudah punya kode referral:', sellerData.referralCode);
      console.log('💡 Kalau mau ganti, hapus dulu referral yang lama\n');
      return;
    }

    // 4. APPLY REFERRAL CODE
    console.log('3️⃣ Menerapkan kode referral:', REFERRAL_CODE);
    
    await updateDoc(doc(db, 'sellers', TEST_SELLER.uid), {
      referralCode: REFERRAL_CODE,
      salesUid: SALES_UID,
      referredAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Kode referral diterapkan!\n');

    // 5. CEK SUBSCRIPTION
    console.log('4️⃣ Cek subscription seller...');
    const subscriptionDoc = await getDoc(doc(db, 'subscriptions', TEST_SELLER.uid));
    
    if (!subscriptionDoc.exists()) {
      console.log('⚠️ Subscription tidak ditemukan');
      console.log('💡 Komisi akan dibuat nanti waktu seller upgrade\n');
      
      console.log('================================');
      console.log('✅ SELESAI!');
      console.log('================================');
      console.log(`Seller: ${TEST_SELLER.email}`);
      console.log(`Kode Referral: ${REFERRAL_CODE}`);
      console.log(`Sales: ${SALES_EMAIL}`);
      console.log(`Status: Menunggu upgrade ke paid plan`);
      return;
    }

    const subscription = subscriptionDoc.data();
    console.log(`📋 Subscription Plan: ${subscription.plan}`);
    console.log(`💰 Price: Rp ${subscription.price?.toLocaleString('id-ID') || 0}`);
    console.log('');

    // 6. TRIGGER KOMISI JIKA PAID PLAN
    if (subscription.plan !== 'free' && subscription.price > 0) {
      console.log('5️⃣ Seller sudah pakai paid plan, membuat komisi retroaktif...');
      
      const commissionAmount = Math.floor(subscription.price * 0.10); // 10%
      
      // Cek apakah sudah ada komisi
      const referralId = `${SALES_UID}_${TEST_SELLER.uid}`;
      const referralDoc = await getDoc(doc(db, 'referrals', referralId));
      
      if (referralDoc.exists()) {
        console.log('⚠️ Komisi sudah ada, skip\n');
      } else {
        // Buat referral data
        await setDoc(doc(db, 'referrals', referralId), {
          salesUid: SALES_UID,
          salesEmail: SALES_EMAIL,
          sellerUid: TEST_SELLER.uid,
          sellerEmail: TEST_SELLER.email,
          sellerName: TEST_SELLER.name,
          referralCode: REFERRAL_CODE,
          plan: subscription.plan,
          commissionAmount: commissionAmount,
          commissionStatus: 'pending',
          createdAt: Timestamp.now()
        });
        
        console.log('✅ Referral data dibuat!');
        
        // Buat commission record
        const commissionRef = await addDoc(collection(db, 'commissions'), {
          salesUid: SALES_UID,
          salesEmail: SALES_EMAIL,
          sellerUid: TEST_SELLER.uid,
          sellerEmail: TEST_SELLER.email,
          amount: commissionAmount,
          plan: subscription.plan,
          status: 'pending',
          referralCode: REFERRAL_CODE,
          createdAt: Timestamp.now(),
          paidAt: null
        });
        
        console.log('✅ Commission dibuat! ID:', commissionRef.id);
        
        // Update sales stats
        await updateDoc(doc(db, 'sales', SALES_UID), {
          totalCommission: increment(commissionAmount),
          totalReferrals: increment(1),
          updatedAt: Timestamp.now()
        });
        
        console.log('✅ Sales stats updated!\n');
        
        console.log('================================');
        console.log('✅ KOMISI RETROAKTIF BERHASIL!');
        console.log('================================');
        console.log(`Seller: ${TEST_SELLER.email}`);
        console.log(`Plan: ${subscription.plan}`);
        console.log(`Komisi: Rp ${commissionAmount.toLocaleString('id-ID')}`);
        console.log(`Sales: ${SALES_EMAIL}`);
        console.log(`Status: Pending`);
      }
    } else {
      console.log('⏭️ Seller masih pakai Free plan');
      console.log('💡 Komisi akan dibuat nanti waktu seller upgrade\n');
      
      console.log('================================');
      console.log('✅ SELESAI!');
      console.log('================================');
      console.log(`Seller: ${TEST_SELLER.email}`);
      console.log(`Kode Referral: ${REFERRAL_CODE}`);
      console.log(`Sales: ${SALES_EMAIL}`);
      console.log(`Status: Menunggu upgrade ke paid plan`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the script
testPostRegistrationReferral()
  .then(() => {
    console.log('\n👋 Script selesai!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
