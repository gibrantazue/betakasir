# 🚀 Cara Paling Mudah Build APK BetaKasir

## Metode 1: Build via EAS Dashboard (PALING MUDAH - TANPA COMMAND LINE)

### Langkah-langkah:

1. **Buka Browser** dan kunjungi:
   ```
   https://expo.dev/accounts/gibranperon/projects/betakasir/builds
   ```

2. **Login** dengan akun Expo kamu (gibranperon@gmail.com)

3. **Klik tombol "Create Build"**

4. **Pilih Platform**: Android

5. **Pilih Build Profile**: 
   - `preview` (untuk testing - paling cepat, ~10-15 menit)
   - `production` (untuk release - lebih lama, ~20-30 menit)

6. **Klik "Build"** dan tunggu prosesnya selesai

7. **Download APK** langsung dari dashboard setelah build selesai

### Keuntungan Metode Ini:
- ✅ Tidak perlu command line
- ✅ Tidak ada masalah git
- ✅ Build di cloud (tidak pakai resource komputer kamu)
- ✅ Bisa download APK langsung
- ✅ Bisa share link download ke orang lain

---

## Metode 2: Build via CLI (Jika Git Sudah Bersih)

Jika kamu sudah fix masalah git, jalankan:

```bash
npm run build:android:preview
```

Atau untuk production:

```bash
npm run build:android:production
```

---

## Metode 3: Expo Go (Untuk Testing Cepat)

Jika hanya mau testing di HP tanpa build APK:

1. Install **Expo Go** dari Play Store
2. Jalankan di komputer:
   ```bash
   npx expo start
   ```
3. Scan QR code dengan Expo Go app

---

## Troubleshooting

### Jika Build Gagal di Dashboard:
- Cek apakah semua environment variables sudah diset di Expo dashboard
- Pastikan `eas.json` sudah benar
- Cek build logs untuk error spesifik

### Jika Mau Build Lokal (Butuh Android Studio):
1. Install Android Studio
2. Setup Android SDK
3. Jalankan:
   ```bash
   npx expo run:android
   ```

---

## Link Penting

- **EAS Dashboard**: https://expo.dev/accounts/gibranperon/projects/betakasir
- **Build History**: https://expo.dev/accounts/gibranperon/projects/betakasir/builds
- **Expo Documentation**: https://docs.expo.dev/build/setup/

---

## Catatan

- Build pertama biasanya lebih lama (20-30 menit)
- Build selanjutnya lebih cepat karena ada cache
- APK hasil build bisa langsung diinstall di HP/tablet Android
- Untuk publish ke Play Store, gunakan profile `production`
