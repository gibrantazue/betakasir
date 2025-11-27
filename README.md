# BetaKasir - Aplikasi Kasir Pintar

**Version:** 1.2.1  
**Last Updated:** 23 November 2025

Aplikasi Point of Sale (POS) lengkap untuk toko kecil, besar, dan minimarket.

## 🚀 Fitur Utama

- ✅ **Kasir/Transaksi** - Proses transaksi cepat dengan keranjang belanja
- 📦 **Manajemen Produk** - Kelola produk, stok, harga, dan kategori
- 📊 **Laporan Penjualan** - Dashboard dan analitik real-time
- 💰 **Multi Pembayaran** - Tunai, Transfer, E-Wallet, Kartu
- 🧾 **Riwayat Transaksi** - Lacak semua transaksi
- 📈 **Produk Terlaris** - Lihat produk yang paling laku
- 💾 **Offline First** - Bekerja tanpa koneksi internet
- 🔄 **Backup Data** - Simpan data dengan aman

## 📱 Testing Beta

### Cara 1: Expo Go (Paling Mudah)

1. Install Expo Go di smartphone:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Jalankan development server:
   ```bash
   cd BetaKasir
   npm start
   ```

3. Scan QR code yang muncul dengan:
   - Android: Expo Go app
   - iOS: Camera app (akan buka di Expo Go)

### Cara 2: Build APK untuk Android

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login ke Expo:
   ```bash
   eas login
   ```

3. Build APK:
   ```bash
   eas build --platform android --profile preview
   ```

4. Download APK dan install di Android

### Cara 3: TestFlight untuk iOS

1. Build untuk iOS:
   ```bash
   eas build --platform ios
   ```

2. Submit ke TestFlight:
   ```bash
   eas submit --platform ios
   ```

3. Invite beta testers via TestFlight

## 🛠️ Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm start
```

### Run on Android
```bash
npm run android
```

### Run on iOS (macOS only)
```bash
npm run ios
```

### Run on Web
```bash
npm run web
```

## 📦 Build untuk Production

### Android (Play Store)
```bash
eas build --platform android --profile production
```

### iOS (App Store)
```bash
eas build --platform ios --profile production
```

## 🔧 Teknologi

- **React Native** - Framework mobile
- **Expo** - Development platform
- **TypeScript** - Type safety
- **Zustand** - State management
- **AsyncStorage** - Local storage
- **React Navigation** - Navigation

## 📝 Struktur Folder

```
BetaKasir/
├── src/
│   ├── screens/        # Layar aplikasi
│   ├── store/          # State management
│   ├── types/          # TypeScript types
│   └── utils/          # Helper functions
├── assets/             # Gambar dan icon
├── App.tsx             # Entry point
└── app.json            # Konfigurasi Expo
```

## 🎯 Roadmap

- [ ] Scan barcode
- [ ] Cetak struk Bluetooth
- [ ] Multi user/kasir
- [ ] Sinkronisasi cloud
- [ ] Laporan PDF
- [ ] Notifikasi stok menipis
- [ ] Manajemen supplier
- [ ] Loyalty program

## 📄 License

MIT License

## 👨‍💻 Developer

BetaKasir - Aplikasi Kasir Pintar untuk UMKM Indonesia
