// Fix "business" → "pro" in Firestore using Firebase Web SDK
// This script uses client-side SDK, no Admin Key needed!

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBJ7Kd9rTJE8FvyyVbF-o0RgnSgormwmnY",
  authDomain: "betakasir.firebaseapp.com",
  projectId: "betakasir",
  storageBucket: "betakasir.firebasestorage.app",
  messagingSenderId: "424861148877",
  appId: "1:424861148877:web:f064ebd57c9035b976ab84"
};

console.log('🔥 Initializing Firebase Web SDK...\n');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function getCredentials() {
  // Check if credentials provided via command line args
  const args = process.argv.slice(2);
  if (args.length >= 2) {
    return {
      email: args[0],
      password: args[1]
    };
  }

  // Check environment variables
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    return {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    };
  }

  // Prompt for credentials
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const email = await new Promise(resolve => {
    readline.question('Email admin: ', resolve);
  });

  const password = await new Promise(resolve => {
    readline.question('Password: ', (answer) => {
      resolve(answer);
    });
  });

  readline.close();

  return { email, password };
}

async function fixBusinessToPro() {
  try {
    console.log('📋 Step 1: Login dengan akun admin...');
    
    const { email, password } = await getCredentials();

    console.log(`\n🔐 Logging in as: ${email}`);
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Login berhasil!\n');

    let totalFixed = 0;

    // Fix sellers collection
    console.log('📋 Step 2: Checking sellers collection...');
    const sellersRef = collection(db, 'sellers');
    const sellersSnapshot = await getDocs(sellersRef);
    
    let sellersFixed = 0;
    const batch = writeBatch(db);

    sellersSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Check if has subscription with business plan
      if (data.subscription && data.subscription.planType === 'business') {
        console.log(`  📝 Found seller: ${docSnap.id}`);
        console.log(`     Email: ${data.email || 'N/A'}`);
        console.log(`     Plan: business → pro`);
        
        const sellerRef = doc(db, 'sellers', docSnap.id);
        batch.update(sellerRef, {
          'subscription.planType': 'pro'
        });
        
        sellersFixed++;
      }
    });

    if (sellersFixed > 0) {
      console.log(`\n💾 Updating ${sellersFixed} sellers...`);
      await batch.commit();
      console.log(`✅ Fixed ${sellersFixed} sellers!\n`);
      totalFixed += sellersFixed;
    } else {
      console.log('✅ No sellers with "business" plan found\n');
    }

    // Fix users collection
    console.log('📋 Step 3: Checking users collection...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let usersFixed = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // Check subscription subcollection
      const subscriptionRef = collection(db, 'users', userId, 'subscription');
      const subscriptionSnapshot = await getDocs(subscriptionRef);
      
      for (const subDoc of subscriptionSnapshot.docs) {
        const subData = subDoc.data();
        
        if (subData.planType === 'business') {
          console.log(`  📝 Found user: ${userId}`);
          console.log(`     Subscription: ${subDoc.id}`);
          console.log(`     Plan: business → pro`);
          
          const subDocRef = doc(db, 'users', userId, 'subscription', subDoc.id);
          await updateDoc(subDocRef, {
            planType: 'pro'
          });
          
          usersFixed++;
        }
      }
    }

    if (usersFixed > 0) {
      console.log(`✅ Fixed ${usersFixed} user subscriptions!\n`);
      totalFixed += usersFixed;
    } else {
      console.log('✅ No users with "business" plan found\n');
    }

    // Fix referrals collection (if exists)
    console.log('📋 Step 4: Checking referrals collection...');
    try {
      const referralsRef = collection(db, 'referrals');
      const referralsSnapshot = await getDocs(referralsRef);
      
      let referralsFixed = 0;
      const referralBatch = writeBatch(db);

      referralsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        if (data.customerPlan === 'business') {
          console.log(`  📝 Found referral: ${docSnap.id}`);
          console.log(`     Plan: business → pro`);
          
          const referralRef = doc(db, 'referrals', docSnap.id);
          referralBatch.update(referralRef, {
            customerPlan: 'pro'
          });
          
          referralsFixed++;
        }
      });

      if (referralsFixed > 0) {
        console.log(`\n💾 Updating ${referralsFixed} referrals...`);
        await referralBatch.commit();
        console.log(`✅ Fixed ${referralsFixed} referrals!\n`);
        totalFixed += referralsFixed;
      } else {
        console.log('✅ No referrals with "business" plan found\n');
      }
    } catch (error) {
      console.log('⚠️  Referrals collection not found or empty\n');
    }

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Total documents fixed: ${totalFixed}`);
    console.log(`   - Sellers: ${sellersFixed}`);
    console.log(`   - Users: ${usersFixed}`);
    console.log('═══════════════════════════════════════\n');

    if (totalFixed > 0) {
      console.log('🎯 Next steps:');
      console.log('1. Refresh your app (Ctrl+Shift+R)');
      console.log('2. Verify "Pro Plan" displays correctly');
      console.log('3. Test all features\n');
    } else {
      console.log('✅ All data already correct! No changes needed.\n');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      console.error('\n💡 Email atau password salah!');
      console.error('   Coba lagi dengan kredensial yang benar.\n');
    } else if (error.code === 'auth/user-not-found') {
      console.error('\n💡 User tidak ditemukan!');
      console.error('   Pastikan email sudah terdaftar.\n');
    } else {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Make sure email/password is correct');
      console.error('2. Make sure account has admin access');
      console.error('3. Check Firestore rules allow read/write');
      console.error('4. Try running script again\n');
    }
    
    process.exit(1);
  }
}

// Usage info
console.log('🚀 Fix "business" → "pro" Migration Script\n');
console.log('Usage:');
console.log('  node scripts/fixBusinessToProFirestore.js [email] [password]');
console.log('  or just run and enter credentials when prompted\n');

// Run the migration
fixBusinessToPro();
