/**
 * Script untuk upload installer ke Firebase Storage dan update info di Firestore
 * 
 * CARA PAKAI:
 * 1. Build aplikasi dulu: npm run build-electron
 * 2. Jalankan script ini: node scripts/uploadUpdateToFirebase.js
 * 3. Script akan upload file .exe ke Firebase Storage
 * 4. Script akan update info versi di Firestore
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Initialize Firebase Admin
// PENTING: Download service account key dari Firebase Console
// Project Settings > Service Accounts > Generate New Private Key
// Simpan sebagai firebase-admin-key.json di root folder

let serviceAccount;
try {
  serviceAccount = require('../firebase-admin-key.json');
} catch (error) {
  console.error('❌ Error: firebase-admin-key.json tidak ditemukan!');
  console.log('\n📝 Cara mendapatkan file ini:');
  console.log('1. Buka Firebase Console: https://console.firebase.google.com');
  console.log('2. Pilih project BetaKasir');
  console.log('3. Klik ⚙️ Settings > Project Settings');
  console.log('4. Tab "Service Accounts"');
  console.log('5. Klik "Generate New Private Key"');
  console.log('6. Simpan file sebagai "firebase-admin-key.json" di root folder project\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'betakasir-f8c2e.appspot.com' // Ganti dengan bucket Anda
});

const bucket = admin.storage().bucket();
const db = admin.firestore();

// Readline interface untuk input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function uploadUpdate() {
  try {
    console.log('🚀 Upload Update ke Firebase\n');

    // 1. Cari file installer
    const distFolder = path.join(__dirname, '..', 'dist');
    const files = fs.readdirSync(distFolder);
    const exeFile = files.find(f => f.endsWith('.exe'));

    if (!exeFile) {
      console.error('❌ File .exe tidak ditemukan di folder dist/');
      console.log('💡 Jalankan dulu: npm run build-electron');
      process.exit(1);
    }

    const filePath = path.join(distFolder, exeFile);
    const fileSize = fs.statSync(filePath).size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

    console.log(`📦 File ditemukan: ${exeFile}`);
    console.log(`📊 Ukuran: ${fileSizeMB} MB\n`);

    // 2. Input info versi
    const version = await question('Versi baru (contoh: 1.1.4): ');
    const changelog = await question('Changelog (pisahkan dengan koma): ');
    const mandatory = await question('Update wajib? (y/n): ');

    console.log('\n📤 Uploading file ke Firebase Storage...');

    // 3. Upload ke Firebase Storage
    const destination = `updates/desktop/BetaKasir-Setup-v${version}.exe`;
    await bucket.upload(filePath, {
      destination: destination,
      metadata: {
        contentType: 'application/x-msdownload',
        metadata: {
          version: version,
          uploadDate: new Date().toISOString()
        }
      }
    });

    // 4. Get public URL
    const file = bucket.file(destination);
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    console.log('✅ File berhasil diupload!');
    console.log(`🔗 URL: ${publicUrl}\n`);

    // 5. Update Firestore
    console.log('📝 Updating Firestore...');

    const changelogArray = changelog.split(',').map(item => item.trim());

    await db.collection('app_updates').doc('desktop_latest').set({
      version: version,
      releaseDate: new Date().toISOString(),
      downloadUrl: {
        windows: publicUrl
      },
      fileSize: `${fileSizeMB} MB`,
      changelog: changelogArray,
      mandatory: mandatory.toLowerCase() === 'y',
      minVersion: '1.0.0',
      publishedAt: new Date().toISOString()
    });

    console.log('✅ Firestore berhasil diupdate!');
    console.log('\n🎉 Update berhasil dipublish!');
    console.log(`📱 User akan menerima notifikasi update ke versi ${version}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run
uploadUpdate();
