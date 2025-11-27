const admin = require('firebase-admin');
const path = require('path');

console.log('🔍 Testing Firebase Admin Connection...\n');

try {
  // Read service account
  const serviceAccountPath = path.join(__dirname, '..', 'firebase-admin-key.json');
  console.log('📁 Reading service account from:', serviceAccountPath);
  
  const serviceAccount = require(serviceAccountPath);
  console.log('✅ Service account loaded');
  console.log('   Project ID:', serviceAccount.project_id);
  console.log('   Client Email:', serviceAccount.client_email);
  console.log('   Private Key ID:', serviceAccount.private_key_id.substring(0, 10) + '...\n');
  
  // Initialize Firebase Admin
  console.log('🔧 Initializing Firebase Admin...');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized\n');
  
  // Test Firestore connection
  console.log('🔗 Testing Firestore connection...');
  const db = admin.firestore();
  
  // Try to read a simple collection
  db.collection('users').limit(1).get()
    .then(snapshot => {
      console.log('✅ Firestore connection successful!');
      console.log(`   Found ${snapshot.size} document(s)\n`);
      
      console.log('🎉 ALL TESTS PASSED!');
      console.log('   Firebase Admin Key is working correctly.\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Firestore connection failed:');
      console.error('   Error:', error.message);
      console.error('   Code:', error.code);
      console.error('   Reason:', error.reason || 'Unknown');
      console.error('\n💡 Possible solutions:');
      console.error('   1. Check if service account has Firestore permissions');
      console.error('   2. Verify project ID is correct');
      console.error('   3. Generate a new service account key');
      console.error('   4. Check Firebase project settings\n');
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\n💡 Check:');
  console.error('   1. firebase-admin-key.json exists');
  console.error('   2. JSON format is valid');
  console.error('   3. File path is correct\n');
  process.exit(1);
}
