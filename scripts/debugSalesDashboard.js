// Script untuk debug Sales Dashboard
// Cek kenapa referral tidak muncul

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

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

async function debugSalesDashboard() {
  console.log('🔍 DEBUG SALES DASHBOARD');
  console.log('================================\n');

  try {
    // 1. CEK COLLECTION `sales`
    console.log('1️⃣ Cek collection `sales`...');
    const salesDoc = await getDoc(doc(db, 'sales', SALES_UID));
    
    if (salesDoc.exists()) {
      console.log('✅ Document ditemukan di `sales`:');
      console.log(JSON.stringify(salesDoc.data(), null, 2));
    } else {
      console.log('❌ Document TIDAK ditemukan di `sales`');
    }
    console.log('');

    // 2. CEK COLLECTION `salesUsers`
    console.log('2️⃣ Cek collection `salesUsers`...');
    const salesUsersDoc = await getDoc(doc(db, 'salesUsers', SALES_UID));
    
    if (salesUsersDoc.exists()) {
      console.log('✅ Document ditemukan di `salesUsers`:');
      console.log(JSON.stringify(salesUsersDoc.data(), null, 2));
    } else {
      console.log('❌ Document TIDAK ditemukan di `salesUsers`');
    }
    console.log('');

    // 3. CEK COLLECTION `referrals` dengan query
    console.log('3️⃣ Cek collection `referrals` dengan query...');
    const referralsQuery = query(
      collection(db, 'referrals'),
      where('salesUid', '==', SALES_UID)
    );
    const referralsSnapshot = await getDocs(referralsQuery);
    
    console.log(`📊 Total referrals: ${referralsSnapshot.size}`);
    
    if (referralsSnapshot.empty) {
      console.log('❌ Tidak ada referrals!');
    } else {
      console.log('✅ Referrals ditemukan:');
      referralsSnapshot.forEach((doc, index) => {
        console.log(`\n${index + 1}. Document ID: ${doc.id}`);
        console.log(JSON.stringify(doc.data(), null, 2));
      });
    }
    console.log('');

    // 4. CEK COLLECTION `commissions` dengan query
    console.log('4️⃣ Cek collection `commissions` dengan query...');
    const commissionsQuery = query(
      collection(db, 'commissions'),
      where('salesUid', '==', SALES_UID)
    );
    const commissionsSnapshot = await getDocs(commissionsQuery);
    
    console.log(`📊 Total commissions: ${commissionsSnapshot.size}`);
    
    if (commissionsSnapshot.empty) {
      console.log('❌ Tidak ada commissions!');
    } else {
      console.log('✅ Commissions ditemukan:');
      commissionsSnapshot.forEach((doc, index) => {
        console.log(`\n${index + 1}. Document ID: ${doc.id}`);
        console.log(JSON.stringify(doc.data(), null, 2));
      });
    }
    console.log('');

    // 5. SUMMARY
    console.log('================================');
    console.log('📊 SUMMARY');
    console.log('================================');
    console.log(`Sales UID: ${SALES_UID}`);
    console.log(`Collection 'sales': ${salesDoc.exists() ? '✅ Ada' : '❌ Tidak ada'}`);
    console.log(`Collection 'salesUsers': ${salesUsersDoc.exists() ? '✅ Ada' : '❌ Tidak ada'}`);
    console.log(`Collection 'referrals': ${referralsSnapshot.size} document(s)`);
    console.log(`Collection 'commissions': ${commissionsSnapshot.size} document(s)`);
    console.log('');

    // 6. DIAGNOSIS
    console.log('🔍 DIAGNOSIS:');
    if (!salesUsersDoc.exists()) {
      console.log('❌ MASALAH: Document tidak ada di collection `salesUsers`');
      console.log('💡 SOLUSI: Sales Dashboard baca dari `salesUsers`, bukan `sales`');
      console.log('💡 ACTION: Buat document di `salesUsers` atau ubah query di SalesDashboardScreen');
    } else if (referralsSnapshot.empty) {
      console.log('❌ MASALAH: Tidak ada referrals di collection `referrals`');
      console.log('💡 SOLUSI: Buat referral data');
    } else {
      console.log('✅ Data lengkap! Coba refresh Sales Dashboard');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the script
debugSalesDashboard()
  .then(() => {
    console.log('\n👋 Script selesai!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
