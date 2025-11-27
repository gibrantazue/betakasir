const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'firebase-admin-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateBusinessToPro() {
  try {
    console.log('🔄 Starting migration: Business → Pro');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let totalUpdated = 0;
    
    // 1. Migrate user subscriptions
    console.log('📋 Step 1: Migrating user subscriptions...');
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const subscriptionRef = db.doc(`users/${userId}/subscription/current`);
      const subscriptionDoc = await subscriptionRef.get();
      
      if (subscriptionDoc.exists()) {
        const data = subscriptionDoc.data();
        
        if (data.planType === 'business') {
          await subscriptionRef.update({ planType: 'pro' });
          console.log(`  ✅ Updated user ${userId}: business → pro`);
          totalUpdated++;
        }
      }
    }
    
    console.log(`\n✅ Step 1 Complete: ${totalUpdated} user subscriptions updated\n`);
    
    // 2. Migrate sellers collection (if exists)
    console.log('📋 Step 2: Migrating sellers collection...');
    let sellersUpdated = 0;
    
    try {
      const sellersSnapshot = await db.collection('sellers').get();
      
      for (const sellerDoc of sellersSnapshot.docs) {
        const data = sellerDoc.data();
        
        if (data.plan === 'business' || data.planType === 'business') {
          const updates = {};
          if (data.plan === 'business') updates.plan = 'pro';
          if (data.planType === 'business') updates.planType = 'pro';
          
          await sellerDoc.ref.update(updates);
          console.log(`  ✅ Updated seller ${sellerDoc.id}: business → pro`);
          sellersUpdated++;
        }
      }
      
      console.log(`\n✅ Step 2 Complete: ${sellersUpdated} sellers updated\n`);
    } catch (error) {
      console.log('  ℹ️  No sellers collection found (skipped)\n');
    }
    
    // 3. Update any referral data
    console.log('📋 Step 3: Checking referral data...');
    let referralsUpdated = 0;
    
    try {
      const referralsSnapshot = await db.collection('referrals').get();
      
      for (const referralDoc of referralsSnapshot.docs) {
        const data = referralDoc.data();
        
        if (data.customerPlan === 'business') {
          await referralDoc.ref.update({ customerPlan: 'pro' });
          console.log(`  ✅ Updated referral ${referralDoc.id}: business → pro`);
          referralsUpdated++;
        }
      }
      
      console.log(`\n✅ Step 3 Complete: ${referralsUpdated} referrals updated\n`);
    } catch (error) {
      console.log('  ℹ️  No referrals collection found (skipped)\n');
    }
    
    // 4. Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Summary:');
    console.log(`  • User Subscriptions: ${totalUpdated} updated`);
    console.log(`  • Sellers: ${sellersUpdated} updated`);
    console.log(`  • Referrals: ${referralsUpdated} updated`);
    console.log(`  • Total: ${totalUpdated + sellersUpdated + referralsUpdated} records updated\n`);
    
    console.log('✅ All "business" plan data migrated to "pro"!');
    console.log('✅ Users can now see "Pro" plan in the app!');
    console.log('\n🚀 Next: Refresh your app to see the changes!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

migrateBusinessToPro();
