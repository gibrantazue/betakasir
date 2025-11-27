const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Quick Release v1.1.7\n');

// Step 1: Build
console.log('📦 Step 1/4: Building desktop app...');
console.log('⏳ This will take 5-10 minutes...\n');

try {
  execSync('npm run build-electron', { stdio: 'inherit' });
  console.log('✅ Build completed!\n');
} catch (error) {
  console.error('❌ Build failed!');
  console.log('\n💡 Try:');
  console.log('   rmdir /s /q dist');
  console.log('   rmdir /s /q web-build');
  console.log('   npm run build-electron\n');
  process.exit(1);
}

// Step 2: Check installer
console.log('📁 Step 2/4: Checking installer...');
const installerPath = path.join(__dirname, '..', 'dist', 'BetaKasir Setup 1.1.7.exe');

if (!fs.existsSync(installerPath)) {
  console.error('❌ Installer not found!');
  console.log('   Expected:', installerPath);
  process.exit(1);
}

const stats = fs.statSync(installerPath);
console.log('✅ Installer found!');
console.log('   Size:', (stats.size / 1024 / 1024).toFixed(2), 'MB\n');

// Step 3: Git commit & push
console.log('📝 Step 3/4: Git commit & push...');

try {
  execSync('git add .', { stdio: 'inherit' });
  
  try {
    execSync('git commit -m "Release v1.1.7 - Realtime System & Sales Dashboard Analytics"', { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️  No changes to commit\n');
  }
  
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ Pushed to GitHub!\n');
} catch (error) {
  console.error('❌ Git push failed!');
  console.log('   Check your git credentials\n');
  process.exit(1);
}

// Step 4: Create & push tag
console.log('🏷️  Step 4/4: Creating tag...');

try {
  try {
    execSync('git tag v1.1.7', { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️  Tag already exists, deleting...');
    execSync('git tag -d v1.1.7', { stdio: 'inherit' });
    execSync('git push origin :refs/tags/v1.1.7', { stdio: 'inherit' });
    execSync('git tag v1.1.7', { stdio: 'inherit' });
  }
  
  execSync('git push origin v1.1.7', { stdio: 'inherit' });
  console.log('✅ Tag pushed!\n');
} catch (error) {
  console.error('❌ Tag creation failed!\n');
  process.exit(1);
}

// Success!
console.log('🎉 BUILD & PUSH COMPLETED!\n');
console.log('📋 Next Steps:\n');
console.log('1. Buka: https://github.com/gibrantazue/betakasir/releases/new?tag=v1.1.7');
console.log('2. Title: v1.1.7 - Realtime System & Sales Dashboard Analytics');
console.log('3. Copy description dari CARA_BUAT_RELEASE_V1.1.7_MANUAL.md');
console.log('4. Upload installer: dist/BetaKasir Setup 1.1.7.exe');
console.log('5. Set as latest release ✅');
console.log('6. Publish release\n');

console.log('📁 Installer Location:');
console.log('  ', installerPath);
console.log('   Size:', (stats.size / 1024 / 1024).toFixed(2), 'MB\n');
