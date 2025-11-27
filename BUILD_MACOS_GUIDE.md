# 🍎 Panduan Build BetaKasir untuk macOS

## ⚠️ PENTING: Build macOS Hanya Bisa di macOS

Kamu **TIDAK BISA** build aplikasi macOS dari Windows. Apple memerlukan macOS untuk:
- Code signing
- DMG creation
- Xcode tools

---

## 📋 PRASYARAT

### Di MacBook:
1. **macOS 10.13+** (High Sierra atau lebih baru)
2. **Node.js 16+** - Download dari https://nodejs.org
3. **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
4. **Git** (biasanya sudah terinstall)

---

## 🚀 CARA BUILD DI MACBOOK

### **Metode 1: Build Lokal di MacBook**

```bash
# 1. Clone/Transfer project ke MacBook
git clone https://github.com/gibrantazue/betakasir.git
cd betakasir

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env dengan Firebase credentials kamu

# 4. Build untuk macOS
npm run build-mac

# 5. File hasil ada di folder dist/
# BetaKasir-1.2.2.dmg (Intel)
# BetaKasir-1.2.2-arm64.dmg (Apple Silicon M1/M2/M3)
```

**Waktu build:** ~5-10 menit (tergantung spesifikasi Mac)

---

### **Metode 2: Build via GitHub Actions (Otomatis)**

Jika kamu tidak punya MacBook, gunakan GitHub Actions:

```bash
# 1. Push code ke GitHub
git add .
git commit -m "Prepare for macOS build"
git push origin main

# 2. Buat tag untuk trigger build
git tag v1.2.2
git push origin v1.2.2

# 3. GitHub Actions akan otomatis build di macOS runner
# 4. Download hasil build dari GitHub Releases
```

**Atau trigger manual:**
1. Buka GitHub repo
2. Klik tab "Actions"
3. Pilih "Build macOS"
4. Klik "Run workflow"
5. Tunggu selesai (~10-15 menit)
6. Download artifact dari hasil build

---

## 📦 HASIL BUILD

Setelah build selesai, kamu akan mendapat:

```
dist/
├── BetaKasir-1.2.2.dmg              # Universal (Intel + Apple Silicon)
├── BetaKasir-1.2.2-arm64.dmg        # Apple Silicon only (M1/M2/M3)
└── BetaKasir-1.2.2-x64.dmg          # Intel only
```

**Ukuran file:** ~180-220 MB per file

---

## 🔧 TROUBLESHOOTING

### Error: "xcode-select: error: tool 'xcodebuild' requires Xcode"
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

### Error: "Cannot find module 'electron'"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Error: "EACCES: permission denied"
```bash
# Fix npm permissions
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

### Build terlalu lama (>20 menit)
- Pastikan koneksi internet stabil
- Coba build ulang: `npm run build-mac`
- Cek Activity Monitor untuk melihat proses

---

## 🎯 INSTALASI DI MACBOOK

Setelah build selesai:

1. **Buka file .dmg**
   ```bash
   open dist/BetaKasir-1.2.2.dmg
   ```

2. **Drag BetaKasir.app ke folder Applications**

3. **Buka aplikasi**
   - Jika muncul "App can't be opened because it is from an unidentified developer":
   ```bash
   # Bypass Gatekeeper (sekali saja)
   sudo xattr -rd com.apple.quarantine /Applications/BetaKasir.app
   ```
   
   Atau:
   - Klik kanan > Open
   - Klik "Open" di dialog

4. **Selesai!** Aplikasi siap digunakan

---

## 🔐 CODE SIGNING (Opsional)

Untuk distribusi ke user lain, sebaiknya sign aplikasi:

1. **Daftar Apple Developer Program** ($99/tahun)
   https://developer.apple.com/programs/

2. **Dapatkan Developer ID Certificate**

3. **Update package.json:**
   ```json
   "mac": {
     "identity": "Developer ID Application: Your Name (TEAM_ID)",
     "hardenedRuntime": true,
     "gatekeeperAssess": false
   }
   ```

4. **Build dengan signing:**
   ```bash
   CSC_LINK=/path/to/certificate.p12 \
   CSC_KEY_PASSWORD=your_password \
   npm run build-mac
   ```

---

## 📊 SPESIFIKASI MINIMUM

**Untuk menjalankan BetaKasir di macOS:**
- macOS 10.13+ (High Sierra)
- RAM: 2 GB (4 GB recommended)
- Storage: 500 MB
- Processor: Intel atau Apple Silicon

**Untuk build BetaKasir:**
- macOS 10.13+
- RAM: 4 GB (8 GB recommended)
- Storage: 5 GB (untuk Node.js, dependencies, dll)
- Xcode Command Line Tools

---

## 🆘 BUTUH BANTUAN?

1. **Cek log build:**
   ```bash
   npm run build-mac 2>&1 | tee build.log
   ```

2. **Bersihkan cache:**
   ```bash
   rm -rf dist web-build node_modules
   npm install
   npm run build-mac
   ```

3. **Kontak support** jika masih error

---

## ✅ CHECKLIST BUILD

- [ ] Node.js 16+ terinstall
- [ ] Xcode Command Line Tools terinstall
- [ ] Dependencies terinstall (`npm install`)
- [ ] File .env sudah dikonfigurasi
- [ ] Koneksi internet stabil
- [ ] Ruang disk cukup (min 5 GB)
- [ ] Jalankan `npm run build-mac`
- [ ] Tunggu hingga selesai (~5-10 menit)
- [ ] Cek folder `dist/` untuk file .dmg
- [ ] Test instalasi di MacBook

---

**Build Date:** November 2025  
**Version:** 1.2.2  
**Platform:** macOS (Intel & Apple Silicon)
