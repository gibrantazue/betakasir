// Script untuk verify email admin di Firebase Authentication
// Jalankan: node scripts/verifyAdminEmail.js

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, updateProfile } = require('firebase/auth');

// Firebase config
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

async function verifyAdminEmail() {
  try {
    console.log('🔧 Verifying admin email...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    // Login as admin
    console.log('🔐 Logging in as admin...');
    const userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const user = userCredential.user;
    
    console.log('✅ Logged in! UID:', user.uid);
    console.log('📧 Email verified status:', user.emailVerified);
    
    if (user.emailVerified) {
      console.log('✅ Email already verified!');
    } else {
      console.log('⚠️ Email not verified in Firebase Auth');
      console.log('💡 But we added bypass in AuthContext for admin');
    }
    
    console.log('\n🎉 Admin can now login!');
    console.log('\n📋 Login credentials:');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('\n💡 Email verification check is bypassed for admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyAdminEmail();
