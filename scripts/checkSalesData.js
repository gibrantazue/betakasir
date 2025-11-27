/**
 * Script untuk cek data sales, referrals, dan commissions
 * Untuk debug kenapa data tidak muncul di Sales Dashboard
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkSalesData(salesUid) {
  try {
    console.log('🔍 Checking sales data for UID:', salesUid);
    console.log('');
    
    // 1. Check sales user
    console.log('📋 Step 1: Checking salesUsers document...');
    const salesDoc = await db.collection('salesUsers').doc(salesUid).get();
    
    if (!salesDoc.exists) {
      console.error('❌ Sales user not found!');
      return;
    }
    
    const salesData = salesDoc.data();
    console.log('✅ Sales user found:', {
      name: salesData.displayName,
      email: salesData.email,
      referralCode: salesData.referralCode,
      totalReferrals: salesData.totalReferrals,
      totalCommission: salesData.totalCommission
    });
    console.log('');
    
    // 2. Check referrals
    console.log('📋 Step 2: Checking referrals collection...');
    const referralsSnapshot = await db.collection('referrals')
      .where('salesUid', '==', salesUid)
      .get();
    
    console.log(`Found ${referralsSnapshot.size} referral(s)`);
    
    if (referralsSnapshot.empty) {
      console.log('⚠️ No referrals found for this sales user');
    } else {
      referralsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\nReferral #${index + 1}:`);
        console.log('  ID:', doc.id);
        console.log('  Customer:', data.customerName);
        console.log('  Email:', data.customerEmail);
        console.log('  Plan:', data.customerPlan);
        console.log('  Commission:', data.commissionAmount);
        console.log('  Status:', data.commissionStatus);
        console.log('  Removed:', data.removed || false);
        console.log('  Created:', data.createdAt?.toDate());
      });
    }
    console.log('');
    
    // 3. Check commissions
    console.log('📋 Step 3: Checking commissions collection...');
    const commissionsSnapshot = await db.collection('commissions')
      .where('salesUid', '==', salesUid)
      .get();
    
    console.log(`Found ${commissionsSnapshot.size} commission(s)`);
    
    if (commissionsSnapshot.empty) {
      console.log('⚠️ No commissions found for this sales user');
    } else {
      commissionsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\nCommission #${index + 1}:`);
        console.log('  ID:', doc.id);
        console.log('  Customer:', data.customerName);
        console.log('  Amount:', data.amount);
        console.log('  Status:', data.status);
        console.log('  Type:', data.type);
        console.log('  Created:', data.createdAt?.toDate());
        if (data.paidAt) {
          console.log('  Paid:', data.paidAt?.toDate());
        }
      });
    }
    console.log('');
    
    // 4. Summary
    console.log('📊 Summary:');
    console.log('  Sales UID:', salesUid);
    console.log('  Referral Code:', salesData.referralCode);
    console.log('  Total Referrals (from salesUsers):', salesData.totalReferrals);
    console.log('  Total Referrals (from query):', referralsSnapshot.size);
    console.log('  Total Commissions (from query):', commissionsSnapshot.size);
    console.log('');
    
    if (salesData.totalReferrals > 0 && referralsSnapshot.empty) {
      console.log('⚠️ WARNING: salesUsers shows referrals but query returns empty!');
      console.log('   This might be a Firestore index issue or data mismatch.');
    }
    
    if (referralsSnapshot.size > 0 && commissionsSnapshot.empty) {
      console.log('⚠️ WARNING: Referrals exist but no commissions found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.code === 9) {
      console.log('');
      console.log('🔥 FIRESTORE INDEX ERROR!');
      console.log('   You need to create a composite index.');
      console.log('   Click the link in the error above to create it automatically.');
    }
  }
}

// Main execution
const salesUid = process.argv[2];

if (!salesUid) {
  console.error('❌ Usage: node checkSalesData.js <salesUid>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/checkSalesData.js yKwYmVUoMdPkLbdYKdBJdcHhY2');
  console.log('');
  console.log('To find your sales UID:');
  console.log('  1. Login as sales user');
  console.log('  2. Open browser console');
  console.log('  3. Type: localStorage.getItem("userUid")');
  process.exit(1);
}

checkSalesData(salesUid)
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
