# 🔧 Troubleshooting Fitur Restock

## Tombol Tidak Berfungsi

### 1. Clear Cache & Restart
```bash
# Stop server (Ctrl+C)
# Lalu jalankan:
npm start -- --clear
```

### 2. Reload Aplikasi
Di terminal Expo, tekan:
- `r` untuk reload
- Atau di browser tekan `Ctrl+R` / `Cmd+R`

### 3. Cek Console Browser
1. Buka Developer Tools (F12)
2. Lihat tab Console
3. Cari error berwarna merah
4. Cari log: "🔘 Restock button pressed"

### 4. Cek Permission
Pastikan user memiliki permission `canManageProducts`:
- Login sebagai owner/admin
- Atau employee dengan permission manage products

### 5. Verifikasi Navigation
Cek di console browser saat klik tombol:
```
🔘 Restock button pressed in ProductsScreen
📍 Navigation object: [object Object]
```

Jika muncul "Navigation is undefined", ada masalah dengan navigation prop.

## Error yang Mungkin Muncul

### "Cannot read property 'navigate' of undefined"
**Penyebab:** Navigation prop tidak diteruskan dengan benar

**Solusi:**
1. Pastikan RestockScreen menerima navigation prop
2. Cek apakah RestockScreen terdaftar di Stack.Navigator
3. Restart aplikasi

### "Module not found: Can't resolve './RestockScreen'"
**Penyebab:** File tidak ditemukan atau typo

**Solusi:**
1. Pastikan file ada di `src/screens/RestockScreen.tsx`
2. Cek import di App.tsx: `import RestockScreen from './src/screens/RestockScreen';`
3. Restart Metro bundler

### "products.filter is not a function"
**Penyebab:** Data products belum loaded

**Solusi:**
1. Tunggu beberapa detik sampai data loaded
2. Cek apakah ada produk di database
3. Refresh halaman

## Cek Manual

### 1. Cek File Ada
```bash
# Pastikan file-file ini ada:
ls src/screens/RestockScreen.tsx
ls src/services/restockService.ts
ls src/types/restock.ts
```

### 2. Cek Import di App.tsx
Buka `App.tsx` dan cari:
```typescript
import RestockScreen from './src/screens/RestockScreen';
```

### 3. Cek Stack.Screen
Buka `App.tsx` dan cari:
```typescript
<Stack.Screen name="Restock" component={RestockScreen} />
```

### 4. Cek Tombol di MoreScreen
Buka `App.tsx` dan cari:
```typescript
{permissions?.canManageProducts && (
  <MenuItem
    icon="cube-outline"
    title="Restock Produk"
    onPress={() => navigation.navigate('Restock')}
    color="#FF9800"
  />
)}
```

### 5. Cek Tombol di ProductsScreen
Buka `src/screens/ProductsScreen.tsx` dan cari:
```typescript
<TouchableOpacity 
  style={[styles.addButton, { backgroundColor: '#FF9800', marginRight: 8 }]} 
  onPress={() => {
    navigation.navigate('Restock');
  }}
>
  <Ionicons name="cube-outline" size={24} color="#fff" />
</TouchableOpacity>
```

## Test Import
Jalankan test import:
```bash
node test-restock-import.js
```

Jika berhasil, akan muncul:
```
✅ All imports successful! Restock feature is ready.
```

## Masih Tidak Berfungsi?

1. **Restart Metro Bundler**
   ```bash
   # Stop (Ctrl+C)
   npm start -- --clear
   ```

2. **Clear Browser Cache**
   - Chrome: Ctrl+Shift+Delete
   - Pilih "Cached images and files"
   - Clear data

3. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules
   npm install
   npm start
   ```

4. **Cek TypeScript Errors**
   ```bash
   npx tsc --noEmit
   ```

5. **Cek Console Logs**
   Saat klik tombol, harus muncul:
   ```
   🔘 Restock button pressed in ProductsScreen
   📍 Navigation object: {...}
   ```

## Contact Support

Jika masih bermasalah, kirim screenshot:
1. Console browser (F12 → Console tab)
2. Terminal Expo
3. Error message yang muncul


## Export PDF Tidak Berfungsi

### "Failed to load jsPDF library"
**Penyebab:** Koneksi internet lambat atau CDN tidak dapat diakses

**Solusi:**
1. Pastikan koneksi internet stabil
2. Refresh halaman (Ctrl+R)
3. Coba lagi

### PDF Tidak Terdownload
**Penyebab:** Browser memblokir download otomatis

**Solusi:**
1. Cek address bar untuk notifikasi download blocked
2. Klik "Allow" atau "Izinkan"
3. Coba lagi
4. Cek folder Downloads

### File PDF Tidak Ditemukan
**Penyebab:** Download tersimpan di lokasi lain

**Solusi:**
1. Buka folder Downloads
2. Cari file: Surat-Pesanan-RST-xxxxx.pdf
3. Atau cek browser download history (Ctrl+J)
4. File akan muncul di list downloads

## Export PNG Tidak Berfungsi

### "Failed to load html2canvas library"
**Penyebab:** Koneksi internet lambat atau CDN tidak dapat diakses

**Solusi:**
1. Pastikan koneksi internet stabil
2. Refresh halaman (Ctrl+R)
3. Coba lagi

### PNG Tidak Terdownload
**Penyebab:** Browser memblokir download otomatis

**Solusi:**
1. Cek address bar untuk notifikasi download blocked
2. Klik "Allow" atau "Izinkan"
3. Coba lagi
4. Cek folder Downloads

### Gambar PNG Terpotong
**Penyebab:** Konten terlalu panjang

**Solusi:**
1. Kurangi jumlah catatan
2. Atau gunakan export PDF sebagai alternatif
3. PNG cocok untuk surat pesanan sederhana

### "Mohon Tunggu" Terlalu Lama
**Penyebab:** Library html2canvas sedang loading atau rendering

**Solusi:**
1. Tunggu hingga 10 detik
2. Jika masih loading, refresh halaman
3. Pastikan koneksi internet stabil
4. Coba lagi

## Copy Text Tidak Berfungsi

### "Failed to copy to clipboard"
**Penyebab:** Browser tidak memiliki permission clipboard

**Solusi:**
1. Pastikan browser memiliki permission clipboard
2. Di Chrome: Settings → Privacy → Site Settings → Clipboard
3. Izinkan akses clipboard untuk site ini
4. Refresh halaman dan coba lagi

### Text Tidak Tersalin
**Penyebab:** Clipboard API tidak didukung

**Solusi:**
1. Update browser ke versi terbaru
2. Gunakan browser modern (Chrome, Firefox, Edge)
3. Atau gunakan export PDF sebagai alternatif
