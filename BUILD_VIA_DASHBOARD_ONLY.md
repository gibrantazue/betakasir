# ⚠️ PENTING: Build APK Hanya Via Dashboard

## Masalah Git Repository

Git repository kamu terlalu luas dan mencakup folder-folder di luar project (Downloads, AppData, dll). Ini menyebabkan EAS CLI tidak bisa upload project.

## Solusi: Build Via Dashboard Web

### Langkah-langkah:

1. **Buka browser** ke: https://expo.dev/accounts/gibranperon/projects/betakasir/builds

2. **Klik "Learn More"** atau **refresh page** sampai muncul tombol build

3. **Atau langsung ke**: https://expo.dev/accounts/gibranperon/projects/betakasir/builds/create

4. **Pilih**:
   - Platform: Android
   - Profile: preview
   - Klik "Build"

5. **Tunggu 10-15 menit**, lalu download APK-nya

---

## Alternatif: Fix Git Repository (Advanced)

Jika mau fix git repository (tidak disarankan karena ribet):

```bash
# 1. Backup project dulu
# 2. Buat git repository baru di folder yang benar
cd C:\Users\GIBRAN ADE BINTANG\OneDrive\Documents\project coding\betakasir\betakasir\BetaKasir
rm -rf .git
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/gibrantazue/betakasir.git
git push -f origin master
```

**PERINGATAN**: Ini akan menghapus semua git history!

---

## Rekomendasi

**Gunakan Dashboard Web** untuk build. Ini cara paling mudah dan tidak perlu deal dengan masalah git.

Link Dashboard: https://expo.dev/accounts/gibranperon/projects/betakasir/builds
