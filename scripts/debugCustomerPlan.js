const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugCustomerPlan() {
  try {
    console.log('🔍 Debugging Customer Plan Display Issue\n');
    console.log('═'.repeat(60));
    
    // 1. Check specific user
    const targetEmail = 'gibranperon@gmail.com';
    console.log(`\n📧 Checking user: ${targetEmail}\n`);
    
    const usersSnapshot = await db.collection('users')
      .where('email', '==', targetEmail)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ User not found!');
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('📊 User Data Structure:');
    console.log('─'.repeat(60));
    console.log(`UID: ${userDoc.id}`);
    console.log(`Email: ${userData.email}`);
    console.log(`Display Name: ${userData.displayName || 'N/A'}`);
    console.log(`\n🔑 Checking subscription field:`);
    console.log(`subscription exists: ${!!userData.subscription}`);
    
    if (userData.subscription) {
      console.log(`subscription.plan: ${userData.subscription.plan}`);
      console.log(`subscription.status: ${userData.subscription.status}`);
      console.log(`subscription.startDate: ${userData.subscription.startDate}`);
      console.log(`subscription.endDate: ${userData.subscription.endDate}`);
    } else {
      console.log('❌ subscription field NOT FOUND!');
    }
    
    console.log(`\n🔍 Checking old fields:`);
    console.log(`subscriptionPlan: ${userData.subscriptionPlan || 'N/A'}`);
    console.log(`plan: ${userData.plan || 'N/A'}`);
    
    console.log(`\n🏷️  Referral Info:`);
    console.log(`referralCode: ${userData.referralCode || 'N/A'}`);
    console.log(`referredBy: ${userData.referredBy || 'N/A'}`);
    
    // 2. Check all users with referral codes
    console.log('\n' + '═'.repeat(60));
    console.log('\n📋 All Users with Referral Codes:\n');
    
    const allUsersWithReferral = await db.collection('users')
      .where('referralCode', '!=', null)
      .get();
    
    console.log(`Found ${allUsersWithReferral.size} users with referral codes\n`);
    
    allUsersWithReferral.forEach(doc => {
      const data = doc.data();
      const plan = data.subscription?.plan || data.subscriptionPlan || data.plan || 'unknown';
      
      console.log(`👤 ${data.displayName || data.email}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Referral Code: ${data.referralCode}`);
      console.log(`   Plan (subscription.plan): ${data.subscription?.plan || 'NOT FOUND'}`);
      console.log(`   Plan (subscriptionPlan): ${data.subscriptionPlan || 'NOT FOUND'}`);
      console.log(`   Plan (plan): ${data.plan || 'NOT FOUND'}`);
      console.log(`   ✅ Detected Plan: ${plan}`);
      console.log('');
    });
    
    // 3. Recommendation
    console.log('═'.repeat(60));
    console.log('\n💡 RECOMMENDATION:\n');
    
    const hasSubscriptionField = allUsersWithReferral.docs.some(doc => 
      doc.data().subscription?.plan
    );
    
    const hasSubscriptionPlanField = allUsersWithReferral.docs.some(doc => 
      doc.data().subscriptionPlan
    );
    
    const hasPlanField = allUsersWithReferral.docs.some(doc => 
      doc.data().plan
    );
    
    console.log(`Users with subscription.plan: ${hasSubscriptionField ? '✅ YES' : '❌ NO'}`);
    console.log(`Users with subscriptionPlan: ${hasSubscriptionPlanField ? '✅ YES' : '❌ NO'}`);
    console.log(`Users with plan: ${hasPlanField ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n📝 Next Steps:');
    if (!hasSubscriptionField && hasSubscriptionPlanField) {
      console.log('1. Data menggunakan field "subscriptionPlan" bukan "subscription.plan"');
      console.log('2. Perlu update kode untuk menggunakan "subscriptionPlan"');
    } else if (!hasSubscriptionField && hasPlanField) {
      console.log('1. Data menggunakan field "plan" bukan "subscription.plan"');
      console.log('2. Perlu update kode untuk menggunakan "plan"');
    } else if (!hasSubscriptionField) {
      console.log('1. Data tidak punya field subscription sama sekali');
      console.log('2. Perlu migrate data atau update struktur database');
    }
    
    console.log('\n═'.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCustomerPlan()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  });
