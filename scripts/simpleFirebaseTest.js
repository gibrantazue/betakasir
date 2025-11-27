const admin = require('firebase-admin');

console.log('🔍 Simple Firebase Admin Test\n');

try {
  // Read service account
  const serviceAccount = require('../firebase-admin-key.json');
  
  console.log('📋 Service Account Info:');
  console.log('   Project ID:', serviceAccount.project_id);
  console.log('   Client Email:', serviceAccount.client_email);
  console.log('   Private Key ID:', serviceAccount.private_key_id.substring(0, 20) + '...');
  console.log('   Has Private Key:', serviceAccount.private_key ? 'Yes' : 'No');
  console.log('');

  // Initialize
  console.log('🔧 Initializing Firebase Admin...');
  
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log('✅ Firebase Admin initialized\n');
  } else {
    console.log('✅ Firebase Admin already initialized\n');
  }

  // Test Firestore
  console.log('🔗 Testing Firestore connection...');
  const db = admin.firestore();
  
  // Simple query - just count users
  db.collection('users')
    .limit(1)
    .get()
    .then(snapshot => {
      console.log('✅ Firestore connection successful!');
      console.log(`📊 Can access users collection (found ${snapshot.size} document)\n`);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        console.log('📄 Sample document:');
        console.log('   ID:', doc.id);
        console.log('   Email:', doc.data().email);
        console.log('   Has subscription:', !!doc.data().subscription);
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Firestore connection failed:');
      console.error('   Error:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details || 'N/A');
      console.error('\n💡 Possible causes:');
      console.error('   1. Service account key expired');
      console.error('   2. Missing Firestore permissions');
      console.error('   3. Firestore API not enabled');
      console.error('   4. Wrong project ID');
      console.error('\n🔧 Solution: Generate NEW key from Firebase Console');
      console.error('   → https://console.firebase.google.com/project/betakasir/settings/serviceaccounts');
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Initialization failed:');
  console.error('   Error:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}
