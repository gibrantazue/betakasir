const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Creating GitHub Release v1.1.9...\n');

// 1. Git add, commit, push
console.log('📦 Step 1: Committing changes...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "v1.1.9 - Fix auto-update error handling"', { stdio: 'inherit' });
  console.log('✅ Changes committed\n');
} catch (error) {
  console.log('ℹ️ No changes to commit or already committed\n');
}

console.log('📤 Step 2: Pushing to GitHub...');
try {
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ Pushed to GitHub\n');
} catch (error) {
  console.error('❌ Failed to push:', error.message);
  process.exit(1);
}

// 2. Create GitHub Release using GitHub CLI
console.log('🎉 Step 3: Creating GitHub Release...');

const releaseNotes = `## 🎉 v1.1.9 - Fix Auto Update

### ✨ What's New
- Fixed auto-update error handling
- No more error dialogs when checking for updates
- Show "Already up to date" message instead of errors

### 🐛 Bug Fixes
- Fixed "Cannot find latest.yml" error
- Fixed 404 error when no GitHub release exists
- Improved error handling for update checks

### 📦 Installation
Download and install \`BetaKasir Setup 1.1.9.exe\` below.

---
**Full Changelog**: https://github.com/gibrantazue/betakasir/compare/v1.1.8...v1.1.9
`;

// Save release notes to temp file
const notesFile = path.join(__dirname, 'release-notes-temp.md');
fs.writeFileSync(notesFile, releaseNotes);

try {
  // Check if gh CLI is installed
  execSync('gh --version', { stdio: 'pipe' });
  
  // Create release with gh CLI
  const releaseCmd = `gh release create v1.1.9 --title "v1.1.9 - Fix Auto Update" --notes-file "${notesFile}" "dist/BetaKasir Setup 1.1.9.exe"`;
  
  execSync(releaseCmd, { stdio: 'inherit' });
  
  console.log('\n✅ GitHub Release v1.1.9 created successfully!');
  console.log('🔗 View release: https://github.com/gibrantazue/betakasir/releases/tag/v1.1.9\n');
  
  // Clean up temp file
  fs.unlinkSync(notesFile);
  
} catch (error) {
  console.error('\n❌ Failed to create release with gh CLI');
  console.log('\n📝 Manual steps:');
  console.log('1. Go to: https://github.com/gibrantazue/betakasir/releases/new');
  console.log('2. Tag: v1.1.9');
  console.log('3. Title: v1.1.9 - Fix Auto Update');
  console.log('4. Upload file: dist\\BetaKasir Setup 1.1.9.exe');
  console.log('5. Click "Publish release"\n');
  
  // Clean up temp file
  if (fs.existsSync(notesFile)) {
    fs.unlinkSync(notesFile);
  }
}
