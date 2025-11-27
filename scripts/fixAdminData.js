// Script untuk melengkapi data admin di Firestore
// Jalankan: node scripts/fixAdminData.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase config (dari src/config/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyBJ7Kd9rTJE8FvyyVbF-o0RgnSgormwmnY",
  authDomain: "betakasir.firebaseapp.com",
  projectId: "betakasir",
  storageBucket: "betakasir.firebasestorage.app",
  messagingSenderId: "424861148877",
  appId: "1:424861148877:web:f064ebd57c9035b976ab84"
};

const ADMIN_EMAIL = 'betakasir@admin.com';
const ADMIN_PASSWORD = 'betakasir123';

async function fixAdminData() {
  try {
    console.log('🔧 Fixing admin data...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Login as admin to get UID
    console.log('🔐 Logging in as admin...');
    const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const uid = userCredential.user.uid;
    
    console.log('✅ Logged in! UID:', uid);
    
    // Create/update user document
    console.log('📝 Creating/updating user document...');
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      email: ADMIN_EMAIL,
      displayName: 'BetaKasir Admin',
      role: 'admin',
      emailVerified: true,
      createdAt: new Date().toISOString(),
    }, { merge: true });
    
    console.log('✅ User document created/updated');
    
    // Create/update subscription
    console.log('📝 Creating/updating subscription...');
    const subRef = doc(db, 'users', uid, 'subscription', 'current');
    await setDoc(subRef, {
      userId: uid,
      planType: 'enterprise',
      status: 'active',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2025-12-31T23:59:59.999Z',
      autoRenew: false,
    }, { merge: true });
    
    console.log('✅ Subscription created/updated');
    
    // Verify
    console.log('\n🔍 Verifying data...');
    const userDoc = await getDoc(userRef);
    const subDoc = await getDoc(subRef);
    
    console.log('\n📊 User data:');
    console.log(userDoc.data());
    
    console.log('\n📊 Subscription data:');
    console.log(subDoc.data());
    
    console.log('\n🎉 Admin data fixed successfully!');
    console.log('\n📋 You can now login with:');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Possible solutions:');
    console.error('1. Check Firebase config in this script');
    console.error('2. Make sure user exists in Firebase Authentication');
    console.error('3. Check email/password is correct');
    process.exit(1);
  }
}

fixAdminData();
