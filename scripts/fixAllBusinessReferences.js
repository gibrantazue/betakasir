const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'firebase-admin-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixAllBusinessReferences() {
  try {
    console.log('🔧 FIXING: Mengubah SEMUA "business" → "pro"...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let totalFixed = 0;
    const batch = db.batch();
    let batchCount = 0;
    
    // Helper function to commit batch
    async function commitBatch() {
      if (batchCount > 0) {
        await batch.commit();
        console.log(`  ✅ Committed ${batchCount} updates`);
        batchCount = 0;
      }
    }
    
    // Helper function to replace business with pro in object
    function replaceBusinessWithPro(obj) {
      const newObj = {};
      let hasChanges = false;
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          if (value.toLowerCase() === 'business') {
            newObj[key] = 'pro';
            hasChanges = true;
          } else {
            newObj[key] = value;
          }
        } else if (typeof value === 'object' && value !== null && !value.toDate) {
          const result = replaceBusinessWithPro(value);
          newObj[key] = result.obj;
          if (result.hasChanges) hasChanges = true;
        } else {
          newObj[key] = value;
        }
      }
      
      return { obj: newObj, hasChanges };
    }
    
    // 1. Fix users and subscriptions
    console.log('📋 Fixing users collection...');
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Check and fix user document
      const userResult = replaceBusinessWithPro(userData);
      if (userResult.hasChanges) {
        batch.update(db.doc(`users/${userId}`), userResult.obj);
        batchCount++;
        totalFixed++;
        console.log(`  ✅ Fixed users/${userId}`);
        
        if (batchCount >= 500) await commitBatch();
      }
      
      // Check and fix subscription subcollection
      const subscriptionSnapshot = await db.collection(`users/${userId}/subscription`).get();
      for (const subDoc of subscriptionSnapshot.docs) {
        const subData = subDoc.data();
        const subResult = replaceBusinessWithPro(subData);
        
        if (subResult.hasChanges) {
          batch.update(db.doc(`users/${userId}/subscription/${subDoc.id}`), subResult.obj);
          batchCount++;
          totalFixed++;
          console.log(`  ✅ Fixed users/${userId}/subscription/${subDoc.id}`);
          
          if (batchCount >= 500) await commitBatch();
        }
      }
    }
    
    await commitBatch();
    
    // 2. Fix sellers
    console.log('\\n📋 Fixing sellers collection...');
    try {
      const sellersSnapshot = await db.collection('sellers').get();
      for (const sellerDoc of sellersSnapshot.docs) {
        const sellerData = sellerDoc.data();
        const sellerResult = replaceBusinessWithPro(sellerData);
        
        if (sellerResult.hasChanges) {
          batch.update(db.doc(`sellers/${sellerDoc.id}`), sellerResult.obj);
          batchCount++;
          totalFixed++;
          console.log(`  ✅ Fixed sellers/${sellerDoc.id}`);
          
          if (batchCount >= 500) await commitBatch();
        }
      }
      await commitBatch();
    } catch (error) {
      console.log('  ℹ️  No sellers collection');
    }
    
    // 3. Fix referrals
    console.log('\\n📋 Fixing referrals collection...');
    try {
      const referralsSnapshot = await db.collection('referrals').get();
      for (const referralDoc of referralsSnapshot.docs) {
        const referralData = referralDoc.data();
        const referralResult = replaceBusinessWithPro(referralData);
        
        if (referralResult.hasChanges) {
          batch.update(db.doc(`referrals/${referralDoc.id}`), referralResult.obj);
          batchCount++;
          totalFixed++;
          console.log(`  ✅ Fixed referrals/${referralDoc.id}`);
          
          if (batchCount >= 500) await commitBatch();
        }
      }
      await commitBatch();
    } catch (error) {
      console.log('  ℹ️  No referrals collection');
    }
    
    // 4. Fix plans collection
    console.log('\\n📋 Fixing plans collection...');
    try {
      const plansSnapshot = await db.collection('plans').get();
      for (const planDoc of plansSnapshot.docs) {
        const planData = planDoc.data();
        const planResult = replaceBusinessWithPro(planData);
        
        if (planResult.hasChanges) {
          batch.update(db.doc(`plans/${planDoc.id}`), planResult.obj);
          batchCount++;
          totalFixed++;
          console.log(`  ✅ Fixed plans/${planDoc.id}`);
          
          if (batchCount >= 500) await commitBatch();
        }
      }
      await commitBatch();
    } catch (error) {
      console.log('  ℹ️  No plans collection');
    }
    
    // 5. Fix settings/content
    console.log('\\n📋 Fixing settings/content...');
    try {
      const contentSnapshot = await db.collection('settings').doc('content').get();
      if (contentSnapshot.exists) {
        const contentData = contentSnapshot.data();
        const contentResult = replaceBusinessWithPro(contentData);
        
        if (contentResult.hasChanges) {
          await db.collection('settings').doc('content').update(contentResult.obj);
          totalFixed++;
          console.log(`  ✅ Fixed settings/content`);
        }
      }
    } catch (error) {
      console.log('  ℹ️  No settings/content');
    }
    
    // Summary
    console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (totalFixed > 0) {
      console.log('🎉 FIX COMPLETE!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
      console.log(`📊 Total Fixed: ${totalFixed} documents\\n`);
      console.log('✅ All "business" references changed to "pro"!\\n');
      console.log('🔄 Next Steps:');
      console.log('   1. Hard refresh app (Ctrl+Shift+R)');
      console.log('   2. Clear browser cache');
      console.log('   3. Verify "Pro" appears everywhere\\n');
    } else {
      console.log('ℹ️  NO CHANGES NEEDED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
      console.log('✅ All data already uses "pro"!\\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllBusinessReferences();
