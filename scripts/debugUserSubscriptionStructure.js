const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugUserSubscription() {
  try {
    console.log('🔍 Debugging User Subscription Structure...\n');

    // Get specific users from console log
    const testEmails = [
      'gibranperon@gmail.com',
      'gibran@sales.com',
      'tazue39@gmail.com'
    ];

    for (const email of testEmails) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📧 Checking: ${email}`);
      console.log('='.repeat(60));

      const userQuery = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (userQuery.empty) {
        console.log('❌ User not found\n');
        continue;
      }

      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();

      console.log('\n📊 Full User Data Structure:');
      console.log(JSON.stringify(userData, null, 2));

      console.log('\n🔍 Subscription Fields Check:');
      console.log('  - subscription:', userData.subscription || 'NOT FOUND');
      console.log('  - subscription.plan:', userData.subscription?.plan || 'NOT FOUND');
      console.log('  - subscription.planType:', userData.subscription?.planType || 'NOT FOUND');
      console.log('  - subscriptionPlan:', userData.subscriptionPlan || 'NOT FOUND');
      console.log('  - plan:', userData.plan || 'NOT FOUND');
      console.log('  - planType:', userData.planType || 'NOT FOUND');

      console.log('\n📋 Other Relevant Fields:');
      console.log('  - role:', userData.role || 'NOT FOUND');
      console.log('  - referralCode:', userData.referralCode || 'NOT FOUND');
      console.log('  - referredBy:', userData.referredBy || 'NOT FOUND');
      console.log('  - createdAt:', userData.createdAt || 'NOT FOUND');

      // Check if there's a separate subscription document
      console.log('\n🔍 Checking for separate subscription document...');
      const subscriptionDoc = await db.collection('subscriptions')
        .doc(userDoc.id)
        .get();

      if (subscriptionDoc.exists) {
        console.log('✅ Found subscription document:');
        console.log(JSON.stringify(subscriptionDoc.data(), null, 2));
      } else {
        console.log('❌ No separate subscription document found');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Debug complete!');
    console.log('='.repeat(60));

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugUserSubscription();
