# 🚀 Cara Push ke GitHub dan Enable Auto-Update

## ✅ Yang Sudah Dilakukan

1. ✅ Update `package.json` dengan GitHub username: `gibrantazue`
2. ✅ Enable auto-updater di `electron/main.js`
3. ✅ No diagnostic errors

---

## 📝 Step 1: Push Code ke GitHub

### 1.1 Initialize Git (jika belum)

```bash
git init
```

### 1.2 Add Remote

```bash
git remote add origin https://github.com/gibrantazue/betakasir.git
```

Atau jika sudah ada remote:
```bash
git remote set-url origin https://github.com/gibrantazue/betakasir.git
```

### 1.3 Add & Commit

```bash
git add .
git commit -m "v1.1.0 - Enable auto-update system"
```

### 1.4 Push

```bash
git branch -M main
git push -u origin main
```

Jika ada error "rejected", gunakan force push (hati-hati!):
```bash
git push -u origin main --force
```

---

## 📝 Step 2: Generate GitHub Token

### 2.1 Buka GitHub Settings

https://github.com/settings/tokens

### 2.2 Generate New Token

1. Klik **"Generate new token (classic)"**
2. Nama: `BetaKasir Auto-Update`
3. Expiration: **No expiration** (atau 1 year)
4. Centang: ☑️ **`repo`** (full control of private repositories)
5. Klik **"Generate token"**
6. **COPY TOKEN** (simpan baik-baik!)

Token akan seperti: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2.3 Set Token di Environment

**PowerShell:**
```powershell
$env:GH_TOKEN="ghp_paste_token_kamu_disini"
```

**Verify:**
```powershell
echo $env:GH_TOKEN
```

Harus muncul token kamu.

---

## 📝 Step 3: Build & Publish v1.1.0

### 3.1 Build Aplikasi

```bash
npm run build-electron
```

Tunggu sampai selesai (2-5 menit).

### 3.2 Publish ke GitHub Releases

```bash
npm run publish-update
```

Atau pakai script helper:
```bash
node scripts/publishUpdate.js 1.1.0
```

Ini akan:
- Build aplikasi
- Upload installer ke GitHub Releases
- Upload `latest.yml` untuk auto-update

### 3.3 Verify di GitHub

Buka: https://github.com/gibrantazue/betakasir/releases

Harus ada:
- ✅ Release v1.1.0
- ✅ File: `BetaKasir Setup 1.1.0.exe`
- ✅ File: `latest.yml`

---

## 📝 Step 4: Test Auto-Update

### 4.1 Install v1.1.0

1. Download installer dari GitHub Releases
2. Install aplikasi
3. Buka aplikasi
4. **Tidak ada error 404!** ✅

### 4.2 Buat Update v1.2.0 (untuk test)

#### A. Update Version

Edit `package.json`:
```json
"version": "1.2.0"
```

#### B. Ubah Sesuatu (agar terlihat bedanya)

Edit `src/screens/HomeScreen.tsx`, tambahkan:
```tsx
<Text style={{ color: '#fff', fontSize: 20, marginTop: 20 }}>
  🎉 UPDATE v1.2.0 BERHASIL!
</Text>
```

#### C. Publish v1.2.0

```bash
node scripts/publishUpdate.js 1.2.0
```

### 4.3 Test Update

1. **Buka aplikasi v1.1.0** yang sudah diinstall
2. **Tunggu 3 detik**
3. **Dialog muncul:** "Update Tersedia - Versi baru 1.2.0 tersedia!"
4. **Klik:** "Download Update"
5. **Tunggu download** selesai (1-3 menit)
6. **Klik:** "Restart Sekarang"
7. **App restart** → Lihat text "🎉 UPDATE v1.2.0 BERHASIL!"

---

## 🎯 Checklist

### Setup
- [ ] Push code ke GitHub
- [ ] Generate GitHub token
- [ ] Set `GH_TOKEN` environment variable
- [ ] Verify token dengan `echo $env:GH_TOKEN`

### Build & Publish
- [ ] Build: `npm run build-electron`
- [ ] Publish: `node scripts/publishUpdate.js 1.1.0`
- [ ] Verify GitHub Releases ada file installer
- [ ] Verify GitHub Releases ada file `latest.yml`

### Test
- [ ] Install v1.1.0 dari GitHub Releases
- [ ] Buka app, tidak ada error 404
- [ ] Buat update v1.2.0
- [ ] Publish v1.2.0
- [ ] Buka app v1.1.0
- [ ] Notifikasi update muncul
- [ ] Download berhasil
- [ ] Install berhasil
- [ ] App sekarang v1.2.0

---

## 🔧 Troubleshooting

### Error: "GH_TOKEN not found"

```powershell
# Set token
$env:GH_TOKEN="ghp_your_token_here"

# Verify
echo $env:GH_TOKEN
```

### Error: "Permission denied"

Token tidak punya akses `repo`. Generate token baru dengan centang `repo`.

### Error: "Repository not found"

Cek URL di `package.json`:
```json
"owner": "gibrantazue",  ← Harus benar
"repo": "betakasir"      ← Harus benar
```

### Build Error

```bash
# Clean build
rm -rf dist/
npm run build-web
npm run build-electron
```

### Publish Error

```bash
# Cek token
echo $env:GH_TOKEN

# Cek internet
ping github.com

# Try again
npm run publish-update
```

---

## 📊 Expected Flow

```
1. Push code ke GitHub
   ↓
2. Generate & set GH_TOKEN
   ↓
3. Build & publish v1.1.0
   ↓
4. Verify GitHub Releases
   ↓
5. Install v1.1.0
   ↓
6. Test (no error 404) ✅
   ↓
7. Publish v1.2.0
   ↓
8. Test auto-update ✅
```

---

## 🎉 Success Criteria

✅ Code di GitHub
✅ Token di-set
✅ v1.1.0 di GitHub Releases
✅ Installer bisa didownload
✅ App jalan tanpa error
✅ Auto-update work!

---

## 📞 Quick Commands

```bash
# Push ke GitHub
git add .
git commit -m "v1.1.0"
git push -u origin main

# Set token
$env:GH_TOKEN="ghp_xxxxx"

# Publish
node scripts/publishUpdate.js 1.1.0

# Verify
echo $env:GH_TOKEN
```

---

**Ready to go! 🚀**

**Next:** Jalankan command di atas step by step!
