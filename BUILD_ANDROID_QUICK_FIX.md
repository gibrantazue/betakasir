# 🚀 Quick Fix: Build APK Android BetaKasir

## ✅ Yang Sudah Dilakukan

1. ✓ EAS CLI sudah terinstall
2. ✓ Sudah login ke Expo (gibranperon@gmail.com)
3. ✓ Project sudah terhubung ke akun Anda
4. ✓ Keystore sudah dibuat otomatis
5. ✓ Build sedang berjalan (compressing files)

## 🎯 Cara Tercepat

### Opsi 1: Tunggu Build Selesai (Recommended)

Build yang sedang berjalan akan selesai sendiri. Cek status di:
```
https://expo.dev/accounts/gibranargantara/projects/betakasir/builds
```

### Opsi 2: Build Ulang (Jika Gagal)

Jika build gagal, jalankan lagi:

```bash
eas build --platform android --profile preview
```

Tunggu 15-30 menit, APK akan tersedia di dashboard Expo.

## 📱 Download & Install APK

1. Buka dashboard: https://expo.dev/accounts/gibranargantara/projects/betakasir/builds

2. Klik build yang sudah selesai

3. Download APK file

4. Transfer ke Android device (via USB, Google Drive, atau WhatsApp)

5. Install APK:
   - Buka file APK di Android
   - Tap "Install"
   - Jika ada warning "Unknown Sources", tap "Settings" dan enable "Install from Unknown Sources"
   - Tap "Install" lagi

## 🐛 Troubleshooting

### Build Stuck di "Compressing"

Ini normal untuk project besar. Tunggu saja, biasanya 5-10 menit.

### Build Gagal

1. Cek error message di terminal
2. Atau cek di dashboard Expo
3. Jalankan ulang: `eas build --platform android --profile preview`

### APK Tidak Bisa Install

1. **Enable Unknown Sources:**
   - Settings > Security > Unknown Sources (ON)
   - Atau Settings > Apps > Special Access > Install Unknown Apps

2. **Check Android Version:**
   - Minimum: Android 5.0 (Lollipop)
   - Recommended: Android 8.0+

3. **Check Storage:**
   - Butuh minimal 100MB free space

## 🎨 Kustomisasi (Opsional)

### Ganti Icon

Ganti file `assets/icon.png` (1024x1024px) dan `assets/adaptive-icon.png`

### Ganti Nama App

Edit `app.json`:
```json
{
  "expo": {
    "name": "Nama App Baru"
  }
}
```

### Ganti Package Name

Edit `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.namaanda.app"
    }
  }
}
```

Setelah ganti, build ulang.

## 📊 Build Profiles

- **development**: Untuk testing, include dev tools
- **preview**: Untuk distribusi internal (yang sedang dipakai)
- **production**: Untuk release ke Play Store

## 🚀 Next Steps

Setelah APK berhasil:

1. **Test di Device:**
   - Install APK
   - Test semua fitur
   - Cek camera, barcode scanner, print

2. **Distribusi Internal:**
   - Share APK via Google Drive/Dropbox
   - Atau gunakan Firebase App Distribution

3. **Publish ke Play Store:**
   - Buat akun Google Play Developer ($25 one-time)
   - Upload APK/AAB
   - Submit untuk review

## 💡 Tips

1. **Build Lebih Cepat:**
   - Hapus file-file besar yang tidak perlu
   - Tambahkan ke `.easignore`

2. **Build AAB (untuk Play Store):**
   Edit `eas.json`:
   ```json
   {
     "build": {
       "production": {
         "android": {
           "buildType": "aab"
         }
       }
     }
   }
   ```

3. **Auto-increment Version:**
   Edit `eas.json`:
   ```json
   {
     "cli": {
       "appVersionSource": "remote"
     }
   }
   ```

## 📞 Support

- Dashboard Expo: https://expo.dev/accounts/gibranargantara/projects/betakasir
- Docs: https://docs.expo.dev/build/introduction/
- Forum: https://forums.expo.dev/

---

**Status Saat Ini:** Build sedang berjalan (compressing files)

**Estimasi:** 15-30 menit

**Cek Progress:** https://expo.dev/accounts/gibranargantara/projects/betakasir/builds

🎉 **Setelah build selesai, APK siap didownload dan diinstall!**
