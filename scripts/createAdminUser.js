const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  const ADMIN_EMAIL = 'betakasir@admin.com';
  const ADMIN_PASSWORD = 'betakasir123';
  const ADMIN_NAME = 'BetaKasir Admin';

  try {
    console.log('🔐 Creating admin user...');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log('✅ Admin user already exists:', userRecord.uid);
      console.log('📝 Updating user data...');
    } catch (error) {
      // User doesn't exist, create new one
      console.log('➕ Creating new admin user...');
      userRecord = await auth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: ADMIN_NAME,
        emailVerified: true,
      });
      console.log('✅ Admin user created:', userRecord.uid);
    }

    // Create/update user document in Firestore
    console.log('📝 Creating/updating Firestore document...');
    await db.collection('users').doc(userRecord.uid).set({
      email: ADMIN_EMAIL,
      displayName: ADMIN_NAME,
      role: 'admin',
      emailVerified: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log('✅ Firestore document created/updated');

    // Create default subscription
    console.log('📝 Creating subscription...');
    await db.collection('users').doc(userRecord.uid).collection('subscription').doc('current').set({
      userId: userRecord.uid,
      planType: 'enterprise',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      autoRenew: false,
    }, { merge: true });

    console.log('✅ Subscription created');

    console.log('\n🎉 Admin user setup complete!');
    console.log('\n📋 Login credentials:');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('\n🚀 You can now login to the admin dashboard!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run
createAdminUser();
