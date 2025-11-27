console.log('🔍 Checking Firestore API Status\n');

console.log('📋 Steps to Enable Firestore API:');
console.log('');
console.log('1️⃣ Enable Firestore API:');
console.log('   https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=betakasir');
console.log('   → Klik "ENABLE" jika belum enabled');
console.log('');
console.log('2️⃣ Enable Cloud Firestore Admin API:');
console.log('   https://console.cloud.google.com/apis/library/firebasehosting.googleapis.com?project=betakasir');
console.log('   → Klik "ENABLE" jika belum enabled');
console.log('');
console.log('3️⃣ Check IAM Permissions:');
console.log('   https://console.cloud.google.com/iam-admin/iam?project=betakasir');
console.log('   → Cari: firebase-adminsdk-fbsvc@betakasir.iam.gserviceaccount.com');
console.log('   → Pastikan punya roles:');
console.log('      • Firebase Admin SDK Administrator Service Agent');
console.log('      • Cloud Datastore User');
console.log('      • Editor (atau Owner)');
console.log('');
console.log('4️⃣ Wait 2-5 minutes after enabling');
console.log('');
console.log('5️⃣ Test again:');
console.log('   node scripts/simpleFirebaseTest.js');
console.log('');

const { exec } = require('child_process');

console.log('🌐 Opening API Library...\n');

const url = 'https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=betakasir';

exec(`start ${url}`, (error) => {
  if (error) {
    console.log('📋 Please open this URL manually:');
    console.log(url);
  } else {
    console.log('✅ Browser opened!');
  }
});
