# 🍎 BetaKasir untuk macOS

Sistem Kasir Modern untuk Toko dan Bisnis - Versi macOS

---

## 📥 INSTALASI

### Cara 1: Install dari DMG (Recommended)

1. **Download** file `BetaKasir-1.2.2.dmg`
2. **Buka** file DMG dengan double-click
3. **Drag** icon BetaKasir ke folder Applications
4. **Buka** BetaKasir dari Applications

### Cara 2: Install via Terminal

```bash
# Mount DMG
hdiutil attach BetaKasir-1.2.2.dmg

# Copy ke Applications
cp -R /Volumes/BetaKasir/BetaKasir.app /Applications/

# Unmount DMG
hdiutil detach /Volumes/BetaKasir

# Buka aplikasi
open /Applications/BetaKasir.app
```

---

## 🔐 BYPASS GATEKEEPER

Jika muncul pesan **"BetaKasir can't be opened because it is from an unidentified developer"**:

### Metode 1: Via UI (Mudah)
1. **Klik kanan** pada BetaKasir.app
2. Pilih **"Open"**
3. Klik **"Open"** di dialog yang muncul
4. Aplikasi akan terbuka (hanya perlu sekali)

### Metode 2: Via Terminal (Cepat)
```bash
sudo xattr -rd com.apple.quarantine /Applications/BetaKasir.app
```

Masukkan password Mac kamu, lalu buka aplikasi seperti biasa.

---

## 💻 SPESIFIKASI SISTEM

### Minimum:
- **OS:** macOS 10.13 (High Sierra) atau lebih baru
- **RAM:** 2 GB
- **Storage:** 500 MB ruang kosong
- **Processor:** Intel atau Apple Silicon (M1/M2/M3)

### Recommended:
- **OS:** macOS 11 (Big Sur) atau lebih baru
- **RAM:** 4 GB atau lebih
- **Storage:** 1 GB ruang kosong
- **Processor:** Apple Silicon M1+ atau Intel Core i5+

### Kompatibilitas:
- ✅ Intel Mac (x64)
- ✅ Apple Silicon Mac (M1/M2/M3 - arm64)
- ✅ Universal Binary (berjalan di kedua arsitektur)

---

## 🚀 FITUR UTAMA

### Kasir POS
- ✅ Barcode scanner support
- ✅ Keyboard shortcuts (F1-F12)
- ✅ Print struk otomatis
- ✅ Multi-payment methods
- ✅ Real-time inventory update

### Manajemen Produk
- ✅ CRUD produk lengkap
- ✅ Kategori produk
- ✅ Barcode management
- ✅ Stock tracking
- ✅ Bulk import/export

### Laporan & Analytics
- ✅ Dashboard penjualan
- ✅ Laporan harian/bulanan/tahunan
- ✅ Grafik interaktif
- ✅ Export PDF/Excel
- ✅ Financial insights

### Fitur Lanjutan
- ✅ AI Assistant (Gemini)
- ✅ Multi-user & permissions
- ✅ Cloud sync (Firebase)
- ✅ Auto-update
- ✅ Backup & restore

---

## 🔧 TROUBLESHOOTING

### Aplikasi tidak bisa dibuka
```bash
# Reset quarantine attribute
sudo xattr -cr /Applications/BetaKasir.app

# Atau hapus semua extended attributes
sudo xattr -d com.apple.quarantine /Applications/BetaKasir.app
```

### Aplikasi crash saat startup
```bash
# Hapus cache aplikasi
rm -rf ~/Library/Application\ Support/BetaKasir
rm -rf ~/Library/Caches/com.betakasir.app

# Restart aplikasi
open /Applications/BetaKasir.app
```

### Printer tidak terdeteksi
1. Buka **System Preferences > Printers & Scanners**
2. Pastikan printer sudah terhubung
3. Restart BetaKasir
4. Coba print test dari Settings

### Database error
```bash
# Backup data dulu
cp -R ~/Library/Application\ Support/BetaKasir ~/Desktop/BetaKasir-Backup

# Reset database
rm -rf ~/Library/Application\ Support/BetaKasir

# Restart aplikasi (akan create database baru)
```

### Update tidak berjalan
1. Tutup BetaKasir
2. Download installer terbaru
3. Install ulang (data tidak akan hilang)

---

## 📂 LOKASI FILE

### Data Aplikasi
```
~/Library/Application Support/BetaKasir/
├── database.db          # Local database
├── settings.json        # User settings
└── logs/               # Application logs
```

### Cache
```
~/Library/Caches/com.betakasir.app/
```

### Preferences
```
~/Library/Preferences/com.betakasir.app.plist
```

---

## 🔄 UPDATE APLIKASI

BetaKasir memiliki **auto-update** built-in:

1. Notifikasi update akan muncul otomatis
2. Klik **"Update Now"**
3. Aplikasi akan download dan install update
4. Restart aplikasi

Atau update manual:
1. Download installer terbaru
2. Install seperti biasa
3. Data kamu tetap aman

---

## 🗑️ UNINSTALL

### Via Finder
1. Buka **Applications**
2. Drag **BetaKasir** ke Trash
3. Empty Trash

### Via Terminal (Clean Uninstall)
```bash
# Hapus aplikasi
sudo rm -rf /Applications/BetaKasir.app

# Hapus data (HATI-HATI: Data akan hilang!)
rm -rf ~/Library/Application\ Support/BetaKasir
rm -rf ~/Library/Caches/com.betakasir.app
rm -rf ~/Library/Preferences/com.betakasir.app.plist
rm -rf ~/Library/Logs/BetaKasir
```

**⚠️ BACKUP DATA SEBELUM UNINSTALL!**

---

## 🆘 SUPPORT

### Dokumentasi
- 📖 User Guide: Buka aplikasi > Help > User Guide
- 📋 Changelog: Buka aplikasi > Help > What's New

### Kontak
- 📧 Email: support@betakasir.com
- 💬 WhatsApp: +62-xxx-xxxx-xxxx
- 🌐 Website: https://betakasir.com

### Bug Report
Jika menemukan bug:
1. Buka **Help > Report Bug**
2. Atau email ke support dengan:
   - Screenshot error
   - Log file dari `~/Library/Logs/BetaKasir/`
   - Deskripsi masalah

---

## 📜 LICENSE

Copyright © 2025 BetaKasir Team  
All rights reserved.

---

## 🎯 TIPS & TRICKS

### Keyboard Shortcuts
- `F1` - Shortcut guide
- `F2` - Focus search
- `F4` - View cart
- `F8` - Checkout
- `Cmd+K` - Clear cart
- `Cmd+S` - Complete transaction
- `Cmd+P` - Print receipt

### Barcode Scanner
- Pastikan scanner dalam mode "USB Keyboard"
- Scanner akan auto-add produk ke cart
- Support semua panjang barcode (4-13 digit)

### Performance
- Tutup aplikasi lain untuk performa optimal
- Restart aplikasi setiap 1-2 minggu
- Clear cache jika aplikasi lambat

### Backup
- Auto-backup ke Firebase (jika online)
- Manual backup: Settings > Backup & Restore
- Export data: Settings > Export Data

---

**Version:** 1.2.2  
**Build Date:** November 2025  
**Platform:** macOS (Universal Binary)  
**Architecture:** x64 + arm64

🍎 **Optimized for Apple Silicon (M1/M2/M3)**
