const { exec } = require('child_process');

console.log('🔥 Opening Firebase Console...\n');

const url = 'https://console.firebase.google.com/project/betakasir/settings/serviceaccounts';

console.log('📋 Instructions:');
console.log('1. Scroll ke bawah ke section "Firebase Admin SDK"');
console.log('2. Klik tombol "Generate new private key" (merah)');
console.log('3. Klik "Generate key" di popup');
console.log('4. File JSON akan terdownload');
console.log('5. Rename jadi "firebase-admin-key.json"');
console.log('6. Copy ke root folder project (replace file lama)');
console.log('7. Run: node scripts/simpleFirebaseTest.js');
console.log('');
console.log('🌐 Opening browser...\n');

// Open browser
exec(`start ${url}`, (error) => {
  if (error) {
    console.error('❌ Could not open browser automatically');
    console.log('\n📋 Please open this URL manually:');
    console.log(url);
  } else {
    console.log('✅ Browser opened!');
    console.log('📋 URL:', url);
  }
});
