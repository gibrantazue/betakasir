const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const SALES_UID = 'yfQYH7H6k4hhLhsFK7dILtlchYF2';
const SALES_EMAIL = 'gibran@sales.com';
const REFERRAL_CODE = 'GIBR9885';

async function debugAndFixGibranSales() {
  console.log('🔍 DEBUG & FIX SALES GIBRAN');
  console.log('================================\n');

  try {
    // 1. CEK DATA SALES
    console.log('1️⃣ Cek data sales...');
    const salesDoc = await db.collection('sales').doc(SALES_UID).get();
    
    if (!salesDoc.exists) {
      console.log('❌ Sales document tidak ditemukan!');
      console.log('📝 Membuat sales document baru...');
      
      await db.collection('sales').doc(SALES_UID).set({
        email: SALES_EMAIL,
        referralCode: REFERRAL_CODE,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
    const sellersSnapshot = await db.collection('sellers')
      .where('referralCode', '==', REFERRAL_CODE)
      .get();

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
        await db.collection('sellers').doc(sellerUid).update({
          salesUid: SALES_UID
        });
        console.log(`   ✅ salesUid updated!`);
      }

      // CEK SUBSCRIPTION
      const subscriptionDoc = await db.collection('subscriptions').doc(sellerUid).get();
      
      if (!subscriptionDoc.exists) {
        console.log(`   ⚠️ Subscription tidak ditemukan`);
        continue;
      }

      const subscription = subscriptionDoc.data();
      console.log(`   📋 Subscription Plan: ${subscription.plan}`);
      console.log(`   💰 Price: Rp ${subscription.price?.toLocaleString('id-ID') || 0}`);
      console.log(`   📅 Start: ${subscription.startDate?.toDate?.()?.toLocaleDateString('id-ID') || 'N/A'}`);
      console.log(`   📅 End: ${subscription.endDate?.toDate?.()?.toLocaleDateString('id-ID') || 'N/A'}`);

      // CEK APAKAH SUDAH ADA KOMISI
      const existingCommission = await db.collection('commissions')
        .where('salesUid', '==', SALES_UID)
        .where('sellerUid', '==', sellerUid)
        .get();

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
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          paidAt: null,
          referralCode: REFERRAL_CODE
        };

        const commissionRef = await db.collection('commissions').add(commissionData);
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
    await db.collection('sales').doc(SALES_UID).update({
      totalCommission: totalCommission,
      totalReferrals: totalReferrals,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
    console.error('❌ Error:', error);
  }
}

// Run the script
debugAndFixGibranSales()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
