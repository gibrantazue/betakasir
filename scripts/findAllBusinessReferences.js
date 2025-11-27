const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'firebase-admin-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function findAllBusinessReferences() {
  try {
    console.log('🔍 DEEP SCAN: Mencari SEMUA referensi "business" di Firestore...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let totalFound = 0;
    const findings = [];
    
    // 1. Check ALL users and their subcollections
    console.log('📋 Scanning users collection...');
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Check user document itself
      const userStr = JSON.stringify(userData).toLowerCase();
      if (userStr.includes('business')) {
        findings.push({
          type: 'User Document',
          path: `users/${userId}`,
          data: userData
        });
        totalFound++;
        console.log(`  ⚠️  Found in users/${userId}`);
      }
      
      // Check subscription subcollection
      const subscriptionSnapshot = await db.collection(`users/${userId}/subscription`).get();
      for (const subDoc of subscriptionSnapshot.docs) {
        const subData = subDoc.data();
        const subStr = JSON.stringify(subData).toLowerCase();
        if (subStr.includes('business')) {
          findings.push({
            type: 'Subscription',
            path: `users/${userId}/subscription/${subDoc.id}`,
            data: subData
          });
          totalFound++;
          console.log(`  ⚠️  Found in users/${userId}/subscription/${subDoc.id}`);
        }
      }
    }
    
    // 2. Check sellers collection
    console.log('\\n📋 Scanning sellers collection...');
    try {
      const sellersSnapshot = await db.collection('sellers').get();
      for (const sellerDoc of sellersSnapshot.docs) {
        const sellerData = sellerDoc.data();
        const sellerStr = JSON.stringify(sellerData).toLowerCase();
        if (sellerStr.includes('business')) {
          findings.push({
            type: 'Seller',
            path: `sellers/${sellerDoc.id}`,
            data: sellerData
          });
          totalFound++;
          console.log(`  ⚠️  Found in sellers/${sellerDoc.id}`);
        }
      }
    } catch (error) {
      console.log('  ℹ️  No sellers collection');
    }
    
    // 3. Check referrals collection
    console.log('\\n📋 Scanning referrals collection...');
    try {
      const referralsSnapshot = await db.collection('referrals').get();
      for (const referralDoc of referralsSnapshot.docs) {
        const referralData = referralDoc.data();
        const referralStr = JSON.stringify(referralData).toLowerCase();
        if (referralStr.includes('business')) {
          findings.push({
            type: 'Referral',
            path: `referrals/${referralDoc.id}`,
            data: referralData
          });
          totalFound++;
          console.log(`  ⚠️  Found in referrals/${referralDoc.id}`);
        }
      }
    } catch (error) {
      console.log('  ℹ️  No referrals collection');
    }
    
    // 4. Check plans collection (if exists)
    console.log('\\n📋 Scanning plans collection...');
    try {
      const plansSnapshot = await db.collection('plans').get();
      for (const planDoc of plansSnapshot.docs) {
        const planData = planDoc.data();
        const planStr = JSON.stringify(planData).toLowerCase();
        if (planStr.includes('business')) {
          findings.push({
            type: 'Plan',
            path: `plans/${planDoc.id}`,
            data: planData
          });
          totalFound++;
          console.log(`  ⚠️  Found in plans/${planDoc.id}`);
        }
      }
    } catch (error) {
      console.log('  ℹ️  No plans collection');
    }
    
    // 5. Check settings/content collection
    console.log('\\n📋 Scanning settings/content collection...');
    try {
      const contentSnapshot = await db.collection('settings').doc('content').get();
      if (contentSnapshot.exists) {
        const contentData = contentSnapshot.data();
        const contentStr = JSON.stringify(contentData).toLowerCase();
        if (contentStr.includes('business')) {
          findings.push({
            type: 'Settings Content',
            path: 'settings/content',
            data: contentData
          });
          totalFound++;
          console.log(`  ⚠️  Found in settings/content`);
        }
      }
    } catch (error) {
      console.log('  ℹ️  No settings/content');
    }
    
    // Summary
    console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (totalFound > 0) {
      console.log(`⚠️  FOUND ${totalFound} REFERENCES TO "BUSINESS"!`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
      
      console.log('📊 Detailed Findings:\\n');
      findings.forEach((finding, index) => {
        console.log(`${index + 1}. ${finding.type}`);
        console.log(`   Path: ${finding.path}`);
        console.log(`   Data:`, JSON.stringify(finding.data, null, 2));
        console.log('');
      });
      
      console.log('🔧 To fix all these, run:');
      console.log('   node scripts/fixAllBusinessReferences.js\\n');
    } else {
      console.log('✅ NO "BUSINESS" REFERENCES FOUND!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
      console.log('🤔 If you still see "Business" in the app:');
      console.log('   1. Clear browser cache (Ctrl+Shift+R)');
      console.log('   2. Check localStorage in DevTools');
      console.log('   3. Try incognito mode');
      console.log('   4. Check if using correct Firebase project\\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findAllBusinessReferences();
