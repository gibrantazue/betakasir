const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'betakasir-f7c2e.appspot.com'
});

const bucket = admin.storage().bucket();

async function uploadInstaller() {
  try {
    // Get version from package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;
    
    console.log(`📦 Uploading BetaKasir v${version} to Firebase Storage...`);
    
    // Find installer file
    const installerName = `BetaKasir Setup ${version}.exe`;
    const installerPath = path.join('dist', installerName);
    
    if (!fs.existsSync(installerPath)) {
      console.error(`❌ Installer not found: ${installerPath}`);
      console.log('💡 Run "npm run build-electron" first');
      process.exit(1);
    }
    
    const fileSize = fs.statSync(installerPath).size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    console.log(`📊 File size: ${fileSizeMB} MB`);
    
    // Upload installer to Firebase Storage
    const destination = `updates/BetaKasir-Setup-${version}.exe`;
    console.log(`⬆️  Uploading to: ${destination}`);
    
    await bucket.upload(installerPath, {
      destination,
      metadata: {
        contentType: 'application/x-msdownload',
        metadata: {
          version,
          uploadedAt: new Date().toISOString()
        }
      },
      public: true // Make file publicly accessible
    });
    
    console.log('✅ Installer uploaded successfully!');
    
    // Get public URL
    const file = bucket.file(destination);
    const [metadata] = await file.getMetadata();
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;
    
    console.log(`🔗 Public URL: ${publicUrl}`);
    
    // Create/update latest.json with version info
    const versionInfo = {
      version,
      downloadUrl: publicUrl,
      releaseDate: new Date().toISOString(),
      releaseNotes: `Update to version ${version}`,
      fileSize: fileSize,
      fileSizeMB: fileSizeMB
    };
    
    const versionInfoPath = path.join('dist', 'latest.json');
    fs.writeFileSync(versionInfoPath, JSON.stringify(versionInfo, null, 2));
    
    console.log('📝 Created latest.json');
    
    // Upload latest.json
    await bucket.upload(versionInfoPath, {
      destination: 'updates/latest.json',
      metadata: {
        contentType: 'application/json',
        cacheControl: 'no-cache, no-store, must-revalidate'
      },
      public: true
    });
    
    console.log('✅ Version info uploaded!');
    
    console.log('\n🎉 Upload complete!');
    console.log(`\n📋 Summary:`);
    console.log(`   Version: ${version}`);
    console.log(`   File: ${installerName}`);
    console.log(`   Size: ${fileSizeMB} MB`);
    console.log(`   URL: ${publicUrl}`);
    console.log(`\n✅ Users can now download this update!`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    process.exit(0);
  }
}

uploadInstaller();
