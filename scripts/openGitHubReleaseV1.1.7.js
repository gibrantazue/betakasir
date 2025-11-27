const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Opening GitHub Release Page for v1.1.7...\n');

// Check if installer exists
const installerPath = path.join(__dirname, '..', 'dist', 'BetaKasir Setup 1.1.7.exe');
const installerExists = fs.existsSync(installerPath);

if (installerExists) {
  const stats = fs.statSync(installerPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log('✅ Installer found!');
  console.log(`   Path: ${installerPath}`);
  console.log(`   Size: ${sizeMB} MB\n`);
} else {
  console.log('⚠️  Installer not found!');
  console.log(`   Expected: ${installerPath}`);
  console.log('   Run: npm run build-desktop\n');
}

// Release description
const description = `# 🎉 BetaKasir v1.1.7 - Realtime System & Sales Dashboard Analytics

## ✨ Fitur Baru

### 🔄 Sistem Realtime
- Admin Dashboard - Sales Management dengan realtime updates
- Sales Dashboard dengan auto-refresh data setiap 10 detik
- Realtime sync multi-user untuk semua device
- Stats cards auto-refresh otomatis

### 📊 Sales Dashboard Analytics
- Tab Navigation System (Overview, Analytics, History)
- Performance Charts - Line Chart & Bar Chart untuk visualisasi data
- Advanced Metrics - Conversion Rate, Growth Rate, Average Deal Size
- Export Report functionality untuk download data

### 🎨 UI/UX Improvements
- Dark Mode optimization untuk better readability
- Light Mode optimization dengan white backgrounds
- Chart labels dengan white color untuk kontras maksimal
- Modern card design dengan shadow dan spacing

## 🔧 Improvements
- Optimasi Firestore queries dengan proper indexing
- Efficient data filtering (removed, cancelled, deleted)
- Memory leak prevention dengan proper cleanup
- Better contrast dan professional look
- Memoized calculations untuk performance

## 🐛 Bug Fixes
- Fixed text visibility di dark mode
- Fixed chart background di light mode
- Fixed chart labels visibility
- Fixed memory leaks dengan proper listener cleanup
- Fixed data inconsistency dengan realtime sync

## 📥 Download & Install

**Windows Desktop:**
- Download: \`BetaKasir Setup 1.1.7.exe\` (di bawah)
- Size: ~178 MB
- Install: Double click dan ikuti wizard

**Auto-Update:**
- Jika sudah install v1.1.6, aplikasi akan otomatis detect update
- Notifikasi update akan muncul saat buka aplikasi
- Klik "Update Now" untuk download dan install otomatis

## ⚠️ Important Notes
- Pastikan Firestore indexes sudah dibuat (WAJIB)
- Test di development environment dulu
- Monitor Firestore usage untuk optimasi
- Backup data sebelum update (opsional)

## 🔗 Links
- Repository: https://github.com/gibrantazue/betakasir
- Documentation: Check CHANGELOG_V1.1.7.md
- Issues: https://github.com/gibrantazue/betakasir/issues

---

**Release Date:** 22 November 2025
**Build Number:** 8
**Platform:** Windows Desktop (Electron)`;

// GitHub Release URL with pre-filled data
const repoUrl = 'https://github.com/gibrantazue/betakasir';
const releaseUrl = `${repoUrl}/releases/new?tag=v1.1.7&title=v1.1.7%20-%20Realtime%20System%20%26%20Sales%20Dashboard%20Analytics&body=${encodeURIComponent(description)}`;

console.log('📋 Release Information:');
console.log('   Tag: v1.1.7');
console.log('   Title: v1.1.7 - Realtime System & Sales Dashboard Analytics');
console.log('   Target: main branch');
console.log('   Description: Pre-filled ✅\n');

console.log('🌐 Opening browser...\n');

// Open browser based on OS
const command = process.platform === 'win32' ? 'start' : 
                process.platform === 'darwin' ? 'open' : 'xdg-open';

exec(`${command} "${releaseUrl}"`, (error) => {
  if (error) {
    console.error('❌ Error opening browser:', error.message);
    console.log('\n📋 Manual Steps:');
    console.log('1. Buka: https://github.com/gibrantazue/betakasir/releases/new');
    console.log('2. Tag: v1.1.7');
    console.log('3. Title: v1.1.7 - Realtime System & Sales Dashboard Analytics');
    console.log('4. Copy description dari CARA_CREATE_GITHUB_RELEASE_V1.1.7.md');
    console.log('5. Upload installer dari: dist/BetaKasir Setup 1.1.7.exe');
    console.log('6. Set as latest release ✅');
    console.log('7. Publish release\n');
    return;
  }

  console.log('✅ Browser opened successfully!\n');
  console.log('📋 Next Steps in Browser:');
  console.log('1. ✅ Tag sudah terisi: v1.1.7');
  console.log('2. ✅ Title sudah terisi');
  console.log('3. ✅ Description sudah terisi');
  console.log('4. ⏳ Upload installer: Drag & drop file dari:');
  console.log(`      ${installerPath}`);
  console.log('5. ⏳ Check "Set as the latest release"');
  console.log('6. ⏳ Click "Publish release"\n');

  if (installerExists) {
    console.log('💡 Tip: Buka File Explorer dan drag file installer ke browser!\n');
  } else {
    console.log('⚠️  Build installer dulu dengan: npm run build-desktop\n');
  }

  console.log('🎉 Done! Tinggal upload installer dan publish!\n');
});
