/**
 * Script untuk trigger komisi retroaktif
 * Untuk seller yang sudah input kode referral tapi belum dapat komisi
 * karena sudah paid plan sebelum input kode
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

async function triggerRetroactiveCommission(sellerUid) {
  try {
    console.log('🔍 Checking seller:', sellerUid);
    
    // 1. Get seller data
    const sellerDoc = await db.collection('users').doc(sellerUid).get();
    if (!sellerDoc.exists) {
      console.error('❌ Seller not found');
      return;
    }
    
    const sellerData = sellerDoc.data();
    const { referredBy, referralCode, displayName, email } = sellerData;
    
    if (!referredBy || !referralCode) {
      console.error('❌ Seller tidak punya referral');
      return;
    }
    
    console.log('✅ Seller has referral:', { referredBy, referralCode });
    
    // 2. Get subscription data
    const subscriptionDoc = await db.collection('subscriptions').doc(sellerUid).get();
    if (!subscriptionDoc.exists) {
      console.error('❌ Subscription not found');
      return;
    }
    
    const subscription = subscriptionDoc.data();
    const { planType } = subscription;
    
    if (planType === 'free') {
      console.log('⏭️ Seller on free plan, no commission needed');
      return;
    }
    
    console.log('✅ Seller on paid plan:', planType);
    
    // 3. Check if referral already exists
    const referralId = `${referredBy}_${sellerUid}`;
    const referralDoc = await db.collection('referrals').doc(referralId).get();
    
    if (referralDoc.exists) {
      console.log('⏭️ Referral already exists, skipping');
      return;
    }
    
    console.log('🎯 Creating retroactive commission...');
    
    // 4. Get sales user info
    const salesDoc = await db.collection('salesUsers').doc(referredBy).get();
    if (!salesDoc.exists) {
      console.error('❌ Sales user not found');
      return;
    }
    
    const salesData = salesDoc.data();
    const { displayName: salesName, email: salesEmail } = salesData;
    
    // 5. Calculate commission (Rp 50.000 for paid plans)
    const commissionAmount = 50000;
    
    const batch = db.batch();
    
    // 6. Create referral data
    const referralRef = db.collection('referrals').doc(referralId);
    batch.set(referralRef, {
      id: referralId,
      salesUid: referredBy,
      salesName,
      salesEmail,
      referralCode,
      customerUid: sellerUid,
      customerName: displayName,
      customerEmail: email,
      customerPlan: planType,
      commissionAmount,
      commissionStatus: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // 7. Create commission record
    const commissionId = `comm_${Date.now()}_${sellerUid}`;
    const commissionRef = db.collection('commissions').doc(commissionId);
    batch.set(commissionRef, {
      id: commissionId,
      salesUid: referredBy,
      salesName,
      customerUid: sellerUid,
      customerName: displayName,
      amount: commissionAmount,
      type: 'subscription',
      status: 'pending',
      referralCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // 8. Update sales user stats
    const salesUserRef = db.collection('salesUsers').doc(referredBy);
    batch.update(salesUserRef, {
      totalReferrals: admin.firestore.FieldValue.increment(1),
      totalCommission: admin.firestore.FieldValue.increment(commissionAmount),
      totalCommissionPending: admin.firestore.FieldValue.increment(commissionAmount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    await batch.commit();
    
    console.log('✅ Retroactive commission created successfully!');
    console.log('📊 Details:', {
      seller: displayName,
      sales: salesName,
      plan: planType,
      commission: `Rp ${commissionAmount.toLocaleString('id-ID')}`,
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Main execution
const sellerUid = process.argv[2];

if (!sellerUid) {
  console.error('❌ Usage: node triggerRetroactiveCommission.js <sellerUid>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/triggerRetroactiveCommission.js abc123xyz');
  process.exit(1);
}

triggerRetroactiveCommission(sellerUid)
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
