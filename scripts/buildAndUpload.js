const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 BetaKasir Build & Upload to Firebase\n');

// Get version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`📦 Building version ${version}...\n`);

try {
  // Step 1: Build installer
  console.log('Step 1: Building installer...');
  execSync('npm run build-electron', { stdio: 'inherit' });
  console.log('✅ Build complete!\n');
  
  // Step 2: Upload to Firebase
  console.log('Step 2: Uploading to Firebase Storage...');
  execSync('node scripts/uploadToFirebase.js', { stdio: 'inherit' });
  
  console.log('\n🎉 All done!');
  console.log(`\n✅ Version ${version} is now available for auto-update!`);
  
} catch (error) {
  console.error('\n❌ Process failed:', error.message);
  process.exit(1);
}
