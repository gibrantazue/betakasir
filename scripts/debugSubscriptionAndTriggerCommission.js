/**
 * Script untuk debug subscription dan trigger komisi manual
 * Untuk seller yang sudah input kode referral tapi komisi belum ter-trigger
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

async function debugAndTriggerCommission(sellerUid) {
  try {
    console.log('🔍 Debugging seller:', sellerUid);
    console.log('');
    
    // 1. Get seller data
    console.log('📋 Step 1: Checking seller data...');
    const sellerDoc = await db.collection('users').doc(sellerUid).get();
    if (!sellerDoc.exists) {
      console.error('❌ Seller not found in users collection');
      return;
    }
    
    const sellerData = sellerDoc.data();
    console.log('✅ Seller found:', {
      name: sellerData.displayName,
      email: sellerData.email,
      referredBy: sellerData.referredBy || 'NONE',
      referralCode: sellerData.referralCode || 'NONE'
    });
    console.log('');
    
    if (!sellerData.referredBy || !sellerData.referralCode) {
      console.error('❌ Seller does not have referral info');
      return;
    }
    
    // 2. Check subscription
    console.log('📋 Step 2: Checking subscription...');
    const subscriptionDoc = await db.collection('subscriptions').doc(sellerUid).get();
    
    if (!subscriptionDoc.exists) {
      console.log('⚠️ No subscription document found in subscriptions collection');
      console.log('   Trying to get from users document...');
      
      // Check if subscription data is in users document
      if (sellerData.subscription) {
        console.log('✅ Subscription found in users document:', {
          planType: sellerData.subscription.planType,
          status: sellerData.subscription.status
        });
      } else {
        console.error('❌ No subscription data found anywhere');
        return;
      }
    } else {
      const subscriptionData = subscriptionDoc.data();
      console.log('✅ Subscription found:', {
        planType: subscriptionData.planType,
        status: subscriptionData.status,
        startDate: subscriptionData.startDate?.toDate(),
        endDate: subscriptionData.endDate?.toDate()
      });
    }
    console.log('');
    
    // 3. Determine plan type
    let planType = 'free';
    if (subscriptionDoc.exists()) {
      planType = subscriptionDoc.data().planType || 'free';
    } else if (sellerData.subscription) {
      planType = sellerData.subscription.planType || 'free';
    }
    
    if (planType === 'free') {
      console.log('⏭️ Seller on free plan, no commission needed');
      return;
    }
    
    console.log('💰 Seller on paid plan:', planType);
    console.log('');
    
    // 4. Check if referral already exists
    console.log('📋 Step 3: Checking existing referral...');
    const referralId = `${sellerData.referredBy}_${sellerUid}`;
    const referralDoc = await db.collection('referrals').doc(referralId).get();
    
    if (referralDoc.exists()) {
      console.log('⚠️ Referral already exists:', referralId);
      const referralData = referralDoc.data();
      console.log('   Status:', referralData.commissionStatus);
      console.log('   Amount:', referralData.commissionAmount);
      console.log('');
      console.log('❌ Commission already created, no need to trigger again');
      return;
    }
    
    console.log('✅ No existing referral found, proceeding to create...');
    console.log('');
    
    // 5. Get sales user info
    console.log('📋 Step 4: Getting sales user info...');
    const salesDoc = await db.collection('salesUsers').doc(sellerData.referredBy).get();
    if (!salesDoc.exists) {
      console.error('❌ Sales user not found');
      return;
    }
    
    const salesData = salesDoc.data();
    console.log('✅ Sales user found:', {
      name: salesData.displayName,
      email: salesData.email,
      referralCode: salesData.referralCode
    });
    console.log('');
    
    // 6. Create commission
    console.log('📋 Step 5: Creating commission...');
    const commissionAmount = 50000; // Fixed Rp 50k
    
    const batch = db.batch();
    
    // Create referral data
    const referralRef = db.collection('referrals').doc(referralId);
    batch.set(referralRef, {
      id: referralId,
      salesUid: sellerData.referredBy,
      salesName: salesData.displayName,
      salesEmail: salesData.email,
      referralCode: sellerData.referralCode,
      customerUid: sellerUid,
      customerName: sellerData.displayName,
      customerEmail: sellerData.email,
      customerPlan: planType,
      commissionAmount,
      commissionStatus: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Create commission record
    const commissionId = `comm_${Date.now()}_${sellerUid}`;
    const commissionRef = db.collection('commissions').doc(commissionId);
    batch.set(commissionRef, {
      id: commissionId,
      salesUid: sellerData.referredBy,
      salesName: salesData.displayName,
      customerUid: sellerUid,
      customerName: sellerData.displayName,
      amount: commissionAmount,
      type: 'subscription',
      status: 'pending',
      referralCode: sellerData.referralCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Update sales user stats
    const salesUserRef = db.collection('salesUsers').doc(sellerData.referredBy);
    batch.update(salesUserRef, {
      totalReferrals: admin.firestore.FieldValue.increment(1),
      totalCommission: admin.firestore.FieldValue.increment(commissionAmount),
      totalCommissionPending: admin.firestore.FieldValue.increment(commissionAmount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    await batch.commit();
    
    console.log('✅ Commission created successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('   Seller:', sellerData.displayName);
    console.log('   Sales:', salesData.displayName);
    console.log('   Plan:', planType);
    console.log('   Commission: Rp', commissionAmount.toLocaleString('id-ID'));
    console.log('   Status: pending');
    console.log('');
    console.log('🎉 Done! Check Sales Dashboard to see the new referral.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Main execution
const sellerUid = process.argv[2];

if (!sellerUid) {
  console.error('❌ Usage: node debugSubscriptionAndTriggerCommission.js <sellerUid>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/debugSubscriptionAndTriggerCommission.js GibRue80h0gfJqnb3Qmb');
  process.exit(1);
}

debugAndTriggerCommission(sellerUid)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
