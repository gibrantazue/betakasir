# 📱 Guide Deployment BetaKasir - PWA & iOS

Panduan lengkap untuk deploy BetaKasir ke PWA (gratis) dan iOS (TestFlight/App Store).

---

## 🌐 OPSI 1: PWA (Progressive Web App) - GRATIS

PWA adalah cara paling hemat untuk support iOS tanpa bayar Apple Developer ($99/tahun).

### ✅ Kelebihan PWA:
- **100% Gratis** - tidak ada biaya sama sekali
- Bisa di-install di iOS via Safari "Add to Home Screen"
- Update instant tanpa review Apple
- Satu codebase untuk semua platform
- Bisa akses offline dengan service worker

### ⚠️ Limitasi PWA di iOS:
- Tidak bisa akses printer thermal langsung (harus pakai cloud printing)
- Notifikasi push terbatas
- Tidak ada di App Store (user harus manual add to home screen)
- Storage terbatas (tapi cukup untuk BetaKasir karena pakai Firebase)

---

## 🚀 LANGKAH 1: Setup PWA (Sudah 80% Siap!)

### 1.1 Update manifest.json

File `public/manifest.json` sudah ada, tapi perlu sedikit penyesuaian:

```json
{
  "name": "BetaKasir - Sistem Kasir Modern",
  "short_name": "BetaKasir",
  "description": "Aplikasi kasir modern dengan fitur lengkap untuk toko dan bisnis Anda",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#DC143C",
  "orientation": "any",
  "scope": "/",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["business", "finance", "productivity"],
  "screenshots": [],
  "shortcuts": [
    {
      "name": "Kasir",
      "short_name": "Kasir",
      "description": "Buka halaman kasir",
      "url": "/cashier",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Produk",
      "short_name": "Produk",
      "description": "Kelola produk",
      "url": "/products",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    }
  ]
}
```

### 1.2 Pastikan Icon Tersedia

Anda perlu icon dengan ukuran:
- 192x192px → `public/icon-192.png` ✅ (sudah ada)
- 512x512px → `public/icon-512.png` (perlu dibuat)

### 1.3 Build Web Version

```bash
npm run build-web
```

Ini akan generate folder `web-build/` yang siap di-deploy.

---

## 🔥 LANGKAH 2: Deploy ke Firebase Hosting (GRATIS)

Anda sudah pakai Firebase, jadi hosting-nya juga gratis!

### 2.1 Install Firebase CLI (jika belum)

```bash
npm install -g firebase-tools
```

### 2.2 Login ke Firebase

```bash
firebase login
```

### 2.3 Init Firebase Hosting

```bash
firebase init hosting
```

Pilih:
- **Public directory**: `web-build`
- **Configure as single-page app**: `Yes`
- **Set up automatic builds**: `No` (manual dulu)
- **Overwrite index.html**: `No`

### 2.4 Deploy!

```bash
firebase deploy --only hosting
```

Selesai! Aplikasi Anda live di: `https://your-project.web.app`

### 2.5 Custom Domain (Opsional)

Bisa pakai domain sendiri seperti `app.betakasir.com`:
1. Beli domain (Niagahoster, Namecheap, dll)
2. Di Firebase Console → Hosting → Add custom domain
3. Ikuti instruksi DNS setup

---

## 📲 LANGKAH 3: Install PWA di iOS

### Cara User Install di iPhone/iPad:

1. Buka Safari (harus Safari, bukan Chrome!)
2. Kunjungi `https://your-project.web.app`
3. Tap tombol **Share** (kotak dengan panah ke atas)
4. Scroll dan tap **"Add to Home Screen"**
5. Tap **"Add"**
6. Icon BetaKasir muncul di home screen seperti app native!

### Tips Marketing PWA:

Buat landing page dengan instruksi install yang jelas:
- Video tutorial singkat
- Screenshot step-by-step
- Button "Install Sekarang" yang scroll ke instruksi

---

## 🍎 OPSI 2: iOS Native (TestFlight / App Store)

Untuk pengalaman native penuh dan ada di App Store.

### 💰 Biaya:
- **Apple Developer Program**: $99/tahun (wajib)
- **Mac**: Diperlukan untuk build iOS (bisa sewa cloud Mac)

---

## 🚀 LANGKAH 1: Setup Apple Developer

### 1.1 Daftar Apple Developer

1. Kunjungi: https://developer.apple.com/programs/
2. Klik **"Enroll"**
3. Login dengan Apple ID
4. Bayar $99/tahun
5. Tunggu approval (biasanya 24-48 jam)

### 1.2 Buat App ID

1. Login ke https://developer.apple.com/account
2. **Certificates, IDs & Profiles** → **Identifiers**
3. Klik **+** untuk buat App ID baru
4. Pilih **App IDs** → **App**
5. Isi:
   - **Description**: BetaKasir
   - **Bundle ID**: `com.betakasir.app` (sudah ada di app.json)
6. **Capabilities**: Pilih yang dibutuhkan (Push Notifications, dll)
7. **Continue** → **Register**

---

## 🔨 LANGKAH 2: Build iOS dengan EAS

Anda sudah punya `eas.json`, tinggal setup credentials.

### 2.1 Install EAS CLI

```bash
npm install -g eas-cli
```

### 2.2 Login ke Expo

```bash
eas login
```

### 2.3 Configure iOS Build

Update `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

### 2.4 Build untuk TestFlight

```bash
eas build --platform ios --profile preview
```

EAS akan:
1. Minta Apple ID credentials
2. Generate certificates otomatis
3. Build di cloud (tidak perlu Mac!)
4. Kasih link download `.ipa` file

---

## 📤 LANGKAH 3: Upload ke TestFlight

### 3.1 Buat App di App Store Connect

1. Login ke https://appstoreconnect.apple.com
2. **My Apps** → **+** → **New App**
3. Isi:
   - **Platform**: iOS
   - **Name**: BetaKasir
   - **Primary Language**: Indonesian
   - **Bundle ID**: com.betakasir.app
   - **SKU**: betakasir-001
4. **Create**

### 3.2 Upload Build

Cara otomatis (recommended):

```bash
eas submit --platform ios --profile production
```

Atau manual:
1. Download `.ipa` dari EAS build
2. Install **Transporter** app (dari Mac App Store)
3. Drag & drop `.ipa` ke Transporter
4. **Deliver**

### 3.3 Setup TestFlight

1. Di App Store Connect → **TestFlight** tab
2. Build akan muncul setelah processing (5-10 menit)
3. **Internal Testing**:
   - Add email tester (max 100)
   - Langsung bisa test tanpa review
4. **External Testing**:
   - Add tester (max 10,000)
   - Perlu review Apple (1-2 hari)
   - Bisa share public link

### 3.4 Invite Testers

1. **Internal**: Add via email di App Store Connect
2. **External**: Share link TestFlight public
3. Tester install app **TestFlight** dari App Store
4. Buka link invite → Install BetaKasir

---

## 🏪 LANGKAH 4: Submit ke App Store (Production)

Setelah testing OK, siap production:

### 4.1 Prepare App Store Listing

Di App Store Connect, isi:

**App Information:**
- **Name**: BetaKasir - Kasir Pintar
- **Subtitle**: Kelola Toko Lebih Mudah
- **Category**: Business
- **Content Rights**: Tidak ada konten pihak ketiga

**Pricing:**
- **Price**: Free (app gratis, subscription di dalam)
- **Availability**: Indonesia (atau worldwide)

**App Privacy:**
- Isi privacy policy (wajib!)
- Deklarasi data yang dikumpulkan

**Screenshots** (wajib):
- iPhone 6.7" (iPhone 14 Pro Max): 3-10 screenshots
- iPhone 6.5" (iPhone 11 Pro Max): 3-10 screenshots
- iPad Pro 12.9": 3-10 screenshots (opsional)

**App Preview Video** (opsional tapi recommended):
- Max 30 detik
- Tunjukkan fitur utama

**Description:**
```
BetaKasir adalah aplikasi kasir modern yang membantu Anda mengelola toko dengan lebih mudah dan efisien.

FITUR UTAMA:
• Dashboard Real-time - Pantau penjualan dan stok secara langsung
• Notifikasi Pintar - Tahu kapan stok menipis sebelum kehabisan
• AI Assistant - Dapatkan insight dan rekomendasi bisnis
• Laporan Lengkap - Analisis penjualan, profit, dan performa produk
• Multi-Device - Sinkron otomatis di semua perangkat
• Offline Mode - Tetap bisa transaksi tanpa internet

COCOK UNTUK:
✓ Warung & Toko Kelontong
✓ Minimarket
✓ Cafe & Restoran
✓ Toko Retail
✓ UMKM

PAKET BERLANGGANAN:
• Starter: Rp 49.000/bulan - Untuk toko kecil
• Pro: Rp 149.000/bulan - Fitur lengkap + AI
• Business: Rp 299.000/bulan - Unlimited kasir

Coba gratis 14 hari tanpa kartu kredit!
```

**Keywords:**
```
kasir, pos, point of sale, toko, umkm, retail, penjualan, stok, inventory, bisnis
```

**Support URL**: https://betakasir.com/support
**Marketing URL**: https://betakasir.com
**Privacy Policy URL**: https://betakasir.com/privacy (wajib!)

### 4.2 Submit for Review

1. Pilih build yang sudah di TestFlight
2. **Add for Review**
3. **Submit**
4. Tunggu review (biasanya 24-48 jam)

### 4.3 Review Guidelines

Apple strict, pastikan:
- ✅ App stabil, tidak crash
- ✅ Privacy policy jelas
- ✅ In-app purchase pakai Apple's IAP (untuk subscription)
- ✅ Tidak ada konten yang melanggar
- ✅ Screenshot sesuai dengan app
- ✅ Deskripsi akurat

---

## 🔄 Update App

### Update PWA:
```bash
npm run build-web
firebase deploy --only hosting
```
User langsung dapat update saat buka app!

### Update iOS:
```bash
eas build --platform ios --profile production
eas submit --platform ios
```
Perlu review lagi (tapi lebih cepat, biasanya 1 hari).

---

## 💡 REKOMENDASI STRATEGI

### Fase 1: MVP (Bulan 1-2) - GRATIS
- ✅ Deploy PWA ke Firebase Hosting
- ✅ Marketing fokus ke Android (Play Store $25)
- ✅ iOS user pakai PWA dulu
- ✅ Kumpulkan feedback

### Fase 2: Growth (Bulan 3-6) - $99
- ✅ Bayar Apple Developer
- ✅ TestFlight untuk early adopters iOS
- ✅ Polish berdasarkan feedback
- ✅ Prepare App Store submission

### Fase 3: Scale (Bulan 6+)
- ✅ Launch di App Store
- ✅ Marketing full (iOS + Android + Web)
- ✅ Fokus retention & subscription

---

## 📊 Perbandingan Biaya

| Platform | Biaya Awal | Biaya Tahunan | Reach |
|----------|-----------|---------------|-------|
| **PWA** | Rp 0 | Rp 0 | iOS + Android + Desktop |
| **Play Store** | Rp 390k (sekali) | Rp 0 | Android only |
| **App Store** | Rp 1.5jt | Rp 1.5jt/tahun | iOS only |
| **Semua** | Rp 1.9jt | Rp 1.5jt/tahun | Maximum reach |

---

## 🆘 Troubleshooting

### PWA tidak bisa di-install di iOS
- Pastikan pakai Safari (bukan Chrome)
- Cek manifest.json valid
- Pastikan HTTPS (Firebase Hosting otomatis HTTPS)

### Build iOS gagal
- Cek Apple Developer account aktif
- Pastikan Bundle ID match dengan App ID
- Cek EAS credits (gratis tier limited)

### App ditolak Apple
- Baca rejection reason dengan teliti
- Fix issue yang disebutkan
- Reply ke reviewer jika perlu klarifikasi
- Submit ulang

---

## 📞 Support

Butuh bantuan? Kontak:
- Email: support@betakasir.com
- WhatsApp: [your-number]
- Docs: https://docs.betakasir.com

---

**Good luck dengan deployment! 🚀**
