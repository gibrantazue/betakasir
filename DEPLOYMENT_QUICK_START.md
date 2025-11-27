# 🚀 BetaKasir Deployment - Quick Start

Panduan singkat untuk deploy BetaKasir ke berbagai platform.

---

## 📱 Platform Options

| Platform | Biaya | Waktu Setup | Command |
|----------|-------|-------------|---------|
| **PWA** | Gratis | 10 menit | `npm run deploy-pwa` |
| **Android** | $25 sekali | 30 menit | `eas build --platform android` |
| **iOS TestFlight** | $99/tahun | 1 jam | `npm run build-ios` |
| **iOS App Store** | $99/tahun | 2-3 hari | `npm run build-ios-prod` |
| **Windows** | Gratis | 5 menit | `npm run build-electron` |
| **macOS** | Gratis | 10 menit | `npm run build-mac` |

---

## 🌐 Deploy PWA (GRATIS - Recommended untuk Start)

### 1. Build & Deploy
```bash
npm run deploy-pwa
```

### 2. Test di iOS
1. Buka Safari → kunjungi URL Firebase Hosting
2. Tap Share → "Add to Home Screen"
3. Done! App muncul di home screen

### 3. Share ke User
```
Cara Install BetaKasir di iPhone:
1. Buka Safari: https://your-app.web.app
2. Tap tombol Share (kotak dengan panah)
3. Pilih "Add to Home Screen"
4. Tap "Add"
```

**Kelebihan:**
- ✅ 100% gratis
- ✅ Update instant
- ✅ Work di iOS & Android
- ✅ Tidak perlu review Apple/Google

**Kekurangan:**
- ⚠️ Tidak ada di App Store
- ⚠️ User harus manual install
- ⚠️ Printer thermal perlu cloud printing

---

## 🤖 Deploy Android (Play Store)

### 1. Build APK
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build
eas build --platform android --profile production
```

### 2. Upload ke Play Store
1. Bayar $25 di https://play.google.com/console
2. Create new app
3. Upload APK dari EAS
4. Isi store listing
5. Submit for review

**Timeline:** 1-3 hari review

---

## 🍎 Deploy iOS (TestFlight)

### 1. Prerequisites
- Apple Developer Account ($99/tahun)
- Bundle ID: `com.betakasir.app`

### 2. Build
```bash
npm run build-ios
```

### 3. Submit to TestFlight
```bash
eas submit --platform ios
```

### 4. Invite Testers
1. Login https://appstoreconnect.apple.com
2. TestFlight tab
3. Add testers via email atau public link

**Timeline:** Instant untuk internal, 1-2 hari untuk external

---

## 🏪 Deploy iOS (App Store)

### 1. Build Production
```bash
npm run build-ios-prod
```

### 2. Submit
```bash
eas submit --platform ios --profile production
```

### 3. App Store Connect
1. Fill app information
2. Upload screenshots (required)
3. Set pricing (Free)
4. Submit for review

**Timeline:** 1-3 hari review

---

## 💻 Deploy Desktop

### Windows
```bash
npm run build-electron
```
Output: `dist/BetaKasir Setup.exe`

### macOS
```bash
npm run build-mac
```
Output: `dist/BetaKasir.dmg`

---

## 🔄 Update Strategy

### PWA
```bash
npm run deploy-pwa
```
User dapat update otomatis saat buka app!

### Mobile Apps
```bash
# Android
eas build --platform android --profile production
eas submit --platform android

# iOS
npm run build-ios-prod
eas submit --platform ios
```
Perlu review lagi (lebih cepat, ~1 hari)

### Desktop
```bash
npm run build-electron  # Windows
npm run build-mac       # macOS
```
Upload ke GitHub Releases, auto-update via electron-updater

---

## 💰 Recommended Budget Strategy

### Fase 1: MVP (Bulan 1-2) - Rp 0
```bash
npm run deploy-pwa
```
- Deploy PWA (gratis)
- Test dengan early users
- Kumpulkan feedback
- Validasi product-market fit

### Fase 2: Android (Bulan 2-3) - Rp 390k
```bash
eas build --platform android
```
- Bayar Play Store $25
- Reach Android users (70% market Indonesia)
- iOS users tetap pakai PWA

### Fase 3: iOS (Bulan 4+) - Rp 1.5jt
```bash
npm run build-ios-prod
```
- Bayar Apple Developer $99/tahun
- Full coverage iOS + Android + Web
- Maximum reach

---

## 🆘 Quick Troubleshooting

### PWA tidak bisa install di iOS
```bash
# Pastikan icon ada
ls public/icon-192.png
ls public/icon-512.png

# Rebuild
npm run build-web
firebase deploy --only hosting
```

### EAS build gagal
```bash
# Check login
eas whoami

# Re-login
eas login

# Check credits
eas account:view
```

### Firebase deploy gagal
```bash
# Re-login
firebase login

# Check project
firebase projects:list

# Use specific project
firebase use your-project-id
```

---

## 📚 Full Documentation

Untuk panduan lengkap, lihat:
- **DEPLOYMENT_GUIDE_PWA_IOS.md** - Guide lengkap PWA & iOS
- **BUILD_MACOS_GUIDE.md** - Guide build macOS
- **PRINT_FIX_GUIDE.md** - Setup printing

---

## 🎯 Quick Decision Tree

**Baru mulai & budget terbatas?**
→ Deploy PWA (gratis)

**Sudah ada user & revenue?**
→ Android Play Store ($25)

**Target premium market?**
→ iOS App Store ($99/tahun)

**Butuh offline & printer thermal?**
→ Desktop Electron (gratis)

**Mau semua platform?**
→ PWA + Android + iOS + Desktop

---

## 📞 Need Help?

Stuck? Check:
1. Error message di terminal
2. EAS build logs: https://expo.dev
3. Firebase Console: https://console.firebase.google.com
4. Full guide: DEPLOYMENT_GUIDE_PWA_IOS.md

---

**Happy Deploying! 🚀**
