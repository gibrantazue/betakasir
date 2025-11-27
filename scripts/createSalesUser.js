/**
 * Script untuk membuat Sales User baru
 * 
 * Usage:
 * node scripts/createSalesUser.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'firebase-admin-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// Generate kode referral unik
function generateReferralCode(name) {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}${randomNum}`;
}

// Cek apakah kode sudah dipakai
async function isReferralCodeExists(code) {
  const snapshot = await db.collection('salesUsers')
    .where('referralCode', '==', code)
    .get();
  return !snapshot.empty;
}

// Buat sales user baru
async function createSalesUser(email, password, displayName) {
  try {
    console.log('\n🚀 Membuat sales user baru...\n');

    // 1. Create auth user
    console.log('📝 Step 1: Membuat auth user...');
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true, // Auto verify untuk sales
    });
    console.log('✅ Auth user created:', userRecord.uid);

    // 2. Generate referral code unik
    console.log('\n📝 Step 2: Generate kode referral...');
    let referralCode = generateReferralCode(displayName);
    let codeExists = await isReferralCodeExists(referralCode);
    
    // Jika kode sudah ada, generate ulang
    while (codeExists) {
      console.log(`⚠️  Kode ${referralCode} sudah dipakai, generate ulang...`);
      referralCode = generateReferralCode(displayName);
      codeExists = await isReferralCodeExists(referralCode);
    }
    console.log('✅ Kode referral:', referralCode);

    // 3. Create user document
    console.log('\n📝 Step 3: Membuat user document...');
    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      role: 'sales',
      emailVerified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ User document created');

    // 4. Create sales user document
    console.log('\n📝 Step 4: Membuat sales user document...');
    await db.collection('salesUsers').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      referralCode,
      totalReferrals: 0,
      totalCommission: 0,
      totalCommissionPaid: 0,
      totalCommissionPending: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Sales user document created');

    // Success summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SALES USER BERHASIL DIBUAT!');
    console.log('='.repeat(50));
    console.log('\n📋 Detail:');
    console.log('   UID:', userRecord.uid);
    console.log('   Email:', email);
    console.log('   Nama:', displayName);
    console.log('   Kode Referral:', referralCode);
    console.log('   Password:', password);
    console.log('\n💡 Login Info:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('\n🔗 Share kode ini ke customer:');
    console.log('   ' + referralCode);
    console.log('\n✅ Done!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nDetail:', error);
    process.exit(1);
  }
}

// Buat multiple sales sekaligus
async function createMultipleSales(salesList) {
  console.log(`\n🚀 Membuat ${salesList.length} sales users...\n`);
  
  for (let i = 0; i < salesList.length; i++) {
    const sales = salesList[i];
    console.log(`\n[${ i + 1}/${salesList.length}] Processing: ${sales.name}`);
    console.log('-'.repeat(50));
    
    try {
      await createSalesUser(sales.email, sales.password, sales.name);
    } catch (error) {
      console.error(`❌ Failed to create ${sales.name}:`, error.message);
    }
  }
  
  console.log('\n🎉 Semua sales berhasil dibuat!\n');
  process.exit(0);
}

// ============================================
// KONFIGURASI - Edit bagian ini
// ============================================

// Opsi 1: Buat 1 sales user
const SINGLE_SALES = {
  email: 'sales1@betakasir.com',
  password: 'sales123',
  name: 'Sales Demo'
};

// Opsi 2: Buat multiple sales sekaligus
const MULTIPLE_SALES = [
  { email: 'john@sales.com', password: 'sales123', name: 'John Doe' },
  { email: 'mary@sales.com', password: 'sales123', name: 'Mary Jane' },
  { email: 'bob@sales.com', password: 'sales123', name: 'Bob Smith' },
];

// ============================================
// JALANKAN - Pilih mode
// ============================================

// Mode 1: Buat 1 sales (uncomment baris ini)
createSalesUser(SINGLE_SALES.email, SINGLE_SALES.password, SINGLE_SALES.name);

// Mode 2: Buat multiple sales (uncomment baris ini, comment baris di atas)
// createMultipleSales(MULTIPLE_SALES);
