# 📱 Build APK Android - Simple Guide

## 🚀 Cara Tercepat (Seperti Build EXE/DMG)

Jalankan command ini:

```bash
npm run build-android
```

Script akan:
1. ✅ Build APK di cloud EAS
2. ⏳ Tunggu sampai selesai (15-30 menit)
3. 📥 Download APK otomatis
4. 💾 Simpan ke folder `dist/`

**Hasilnya:** `dist/BetaKasir-1.2.2-preview.apk`

---

## 📋 Command yang Tersedia

### Build & Download Otomatis
```bash
npm run build-android          # Preview build (untuk testing)
npm run build-android-dev      # Development build
npm run build-android-prod     # Production build (untuk release)
```

### Build Tanpa Download (Background)
```bash
npm run build-android-no-wait  # Build di background, download manual nanti
```

---

## 📂 Lokasi File

Setelah build selesai, APK akan tersimpan di:
```
dist/
  └── BetaKasir-1.2.2-preview.apk
```

Sama seperti:
- `dist/BetaKasir Setup 1.2.2.exe` (Windows)
- `dist/BetaKasir-1.2.2.dmg` (macOS)

---

## 📱 Install APK di Android

### Via USB:
1. Hubungkan Android ke PC
2. Copy file dari `dist/BetaKasir-1.2.2-preview.apk` ke Android
3. Buka file APK di Android
4. Tap "Install"

### Via WhatsApp/Drive:
1. Upload APK dari folder `dist/` ke Google Drive atau kirim via WhatsApp
2. Download di Android
3. Buka file APK
4. Tap "Install"

---

## ⚙️ Perbedaan Build Profiles

| Profile | Untuk | Output |
|---------|-------|--------|
| **development** | Testing dengan dev tools | `BetaKasir-1.2.2-development.apk` |
| **preview** | Distribusi internal | `BetaKasir-1.2.2-preview.apk` |
| **production** | Release ke Play Store | `BetaKasir-1.2.2-production.apk` |

---

## 🎯 Workflow Lengkap

### 1. Build APK
```bash
npm run build-android
```

### 2. Tunggu Selesai
Script akan otomatis:
- Monitor progress build
- Download APK setelah selesai
- Simpan ke folder `dist/`

### 3. Distribusi
APK siap didistribusikan:
- Share via WhatsApp/Drive
- Upload ke website
- Submit ke Play Store (untuk production build)

---

## 🐛 Troubleshooting

### Build Gagal
```bash
# Check login status
eas whoami

# Login ulang
eas login

# Build ulang
npm run build-android
```

### Download Gagal
Jika download gagal, download manual:
1. Buka: https://expo.dev/accounts/gibranargantara/projects/betakasir/builds
2. Klik build yang sudah "Finished"
3. Klik "Download"
4. Simpan ke folder `dist/`

---

## 💡 Tips

1. **Build di Background**: Gunakan `npm run build-android-no-wait` jika tidak mau tunggu
2. **Monitor Progress**: Buka dashboard Expo untuk lihat progress real-time
3. **Multiple Builds**: Bisa build beberapa profile sekaligus (dev, preview, prod)

---

## 📊 Perbandingan dengan Platform Lain

| Platform | Command | Output | Lokasi |
|----------|---------|--------|--------|
| **Windows** | `npm run build-electron` | EXE | `dist/BetaKasir Setup 1.2.2.exe` |
| **macOS** | `npm run build-mac` | DMG | `dist/BetaKasir-1.2.2.dmg` |
| **Android** | `npm run build-android` | APK | `dist/BetaKasir-1.2.2-preview.apk` |
| **iOS** | `npm run build-ios` | IPA | Download dari EAS |
| **Web** | `npm run build-web` | HTML/JS | `web-build/` |

---

**Selesai!** APK siap diinstall di Android tablet & mobile 🎉
