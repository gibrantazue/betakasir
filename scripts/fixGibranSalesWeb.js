// Script menggunakan Firebase Web SDK (tidak perlu admin key)
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config dari src/config/firebase.ts
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

async function fixGibranSales() {
  console.log('🔍 DEBUG & FIX SALES GIBRAN (Web SDK)');
  console.log('================================\n');

  try {
    // 1. CEK DATA SALES
    console.log('1️⃣ Cek data sales...');
    const salesRef = doc(db, 'sales', SALES_UID);
    const salesDoc = await getDoc(salesRef);
    
    if (!salesDoc.exists()) {
      console.log('❌ Sales document tidak ditemukan!');
      console.log('📝 Membuat sales document baru...');
      
      await setDoc(salesRef, {
        email: SALES_EMAIL,
        referralCode: REFERRAL_CODE,
        createdAt: serverTimestamp(),
        totalCommission: 0,
        totalReferrals: 0
      });
      
      console.log('✅ Sales document berhasil dibuat!\n');
    } else {
      console.log('✅ Sales document ditemukan:');
      console.log(JSON.stringify(salesDoc.data(), null, 2));
      console.log('');
    }

    // 2. CEK SEMUA SELLERS DENGAN KODE REFERRAL INI
    console.log('2️⃣ Mencari sellers dengan kode referral:', REFERRAL_CODE);
    const sellersQuery = query(
      collection(db, 'sellers'),
      where('referralCode', '==', REFERRAL_CODE)
    );
    const sellersSnapshot = await getDocs(sellersQuery);

    console.log(`📊 Ditemukan ${sellersSnapshot.size} seller(s)\n`);

    if (sellersSnapshot.empty) {
      console.log('⚠️ Tidak ada seller yang menggunakan kode referral ini');
      console.log('💡 Pastikan seller sudah register dengan kode:', REFERRAL_CODE);
      return;
    }

    // 3. PROSES SETIAP SELLER
    let totalCommission = 0;
    let totalReferrals = 0;
    const commissions = [];

    for (const sellerDoc of sellersSnapshot.docs) {
      const sellerData = sellerDoc.data();
      const sellerUid = sellerDoc.id;
      
      console.log(`\n📦 Processing Seller: ${sellerData.email || sellerUid}`);
      console.log(`   UID: ${sellerUid}`);
      console.log(`   Referral Code: ${sellerData.referralCode}`);
      console.log(`   Sales UID: ${sellerData.salesUid || 'TIDAK ADA'}`);

      // FIX: Update salesUid jika belum ada
      if (!sellerData.salesUid || sellerData.salesUid !== SALES_UID) {
        console.log(`   🔧 Fixing salesUid...`);
        await updateDoc(doc(db, 'sellers', sellerUid), {
          salesUid: SALES_UID
        });
        console.log(`   ✅ salesUid updated!`);
      }

      // CEK SUBSCRIPTION
      const subscriptionRef = doc(db, 'subscriptions', sellerUid);
      const subscriptionDoc = await getDoc(subscriptionRef);
      
      if (!subscriptionDoc.exists()) {
        console.log(`   ⚠️ Subscription tidak ditemukan`);
        continue;
      }

      const subscription = subscriptionDoc.data();
      console.log(`   📋 Subscription Plan: ${subscription.plan}`);
      console.log(`   💰 Price: Rp ${subscription.price?.toLocaleString('id-ID') || 0}`);
      console.log(`   📅 Start: ${subscription.startDate?.toDate?.()?.toLocaleDateString('id-ID') || 'N/A'}`);
      console.log(`   📅 End: ${subscription.endDate?.toDate?.()?.toLocaleDateString('id-ID') || 'N/A'}`);

      // CEK APAKAH SUDAH ADA KOMISI
      const commissionsQuery = query(
        collection(db, 'commissions'),
        where('salesUid', '==', SALES_UID),
        where('sellerUid', '==', sellerUid)
      );
      const existingCommission = await getDocs(commissionsQuery);

      if (!existingCommission.empty) {
        console.log(`   ℹ️ Komisi sudah ada (${existingCommission.size} record)`);
        existingCommission.forEach(doc => {
          const comm = doc.data();
          console.log(`      - Rp ${comm.amount?.toLocaleString('id-ID')} (${comm.status})`);
          if (comm.status === 'paid') {
            totalCommission += comm.amount || 0;
          }
        });
        totalReferrals++;
        continue;
      }

      // HITUNG KOMISI (10% dari harga subscription)
      const commissionAmount = Math.floor((subscription.price || 0) * 0.10);
      
      if (commissionAmount > 0) {
        console.log(`   💵 Komisi: Rp ${commissionAmount.toLocaleString('id-ID')} (10%)`);
        
        // BUAT KOMISI BARU
        const commissionData = {
          salesUid: SALES_UID,
          salesEmail: SALES_EMAIL,
          sellerUid: sellerUid,
          sellerEmail: sellerData.email || '',
          amount: commissionAmount,
          plan: subscription.plan,
          status: 'pending',
          createdAt: serverTimestamp(),
          paidAt: null,
          referralCode: REFERRAL_CODE
        };

        const commissionRef = await addDoc(collection(db, 'commissions'), commissionData);
        console.log(`   ✅ Komisi berhasil dibuat! ID: ${commissionRef.id}`);
        
        commissions.push({
          id: commissionRef.id,
          ...commissionData
        });

        totalCommission += commissionAmount;
        totalReferrals++;
      } else {
        console.log(`   ⚠️ Komisi = 0 (subscription price tidak valid)`);
      }
    }

    // 4. UPDATE TOTAL DI SALES DOCUMENT
    console.log('\n4️⃣ Update total komisi di sales document...');
    await updateDoc(salesRef, {
      totalCommission: totalCommission,
      totalReferrals: totalReferrals,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Sales document updated!\n');

    // 5. SUMMARY
    console.log('================================');
    console.log('📊 SUMMARY');
    console.log('================================');
    console.log(`Sales: ${SALES_EMAIL}`);
    console.log(`UID: ${SALES_UID}`);
    console.log(`Kode Referral: ${REFERRAL_CODE}`);
    console.log(`Total Referrals: ${totalReferrals}`);
    console.log(`Total Komisi: Rp ${totalCommission.toLocaleString('id-ID')}`);
    console.log(`\nKomisi yang dibuat: ${commissions.length}`);
    
    if (commissions.length > 0) {
      console.log('\n📝 Detail Komisi Baru:');
      commissions.forEach((comm, index) => {
        console.log(`${index + 1}. Rp ${comm.amount.toLocaleString('id-ID')} - ${comm.sellerEmail} (${comm.status})`);
      });
    }

    console.log('\n✅ SELESAI!');
    console.log('💡 Cek di Sales Dashboard untuk melihat komisi');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the script
fixGibranSales()
  .then(() => {
    console.log('\n👋 Script selesai!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
