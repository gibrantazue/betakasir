# 🐛 Debug Info - Restock Feature

## Cek Ini Dulu

### 1. Apakah tombol muncul?

**Di halaman Produk:**
- Cari tombol 📦 warna orange di header (sebelah kiri tombol QR)
- Jika TIDAK muncul → User tidak punya permission `canManageProducts`

**Di menu Lainnya:**
- Scroll ke bawah
- Cari menu "Restock Produk" dengan icon 📦
- Jika TIDAK muncul → User tidak punya permission `canManageProducts`

### 2. Cek Permission User

Buka console browser (F12) dan ketik:
```javascript
// Cek current user
console.log('User:', localStorage.getItem('currentUser'));

// Cek permissions
const permissions = JSON.parse(localStorage.getItem('employeeSession') || '{}');
console.log('Permissions:', permissions);
```

Pastikan ada: `canManageProducts: true`

### 3. Cek Console Saat Klik Tombol

Saat klik tombol Restock, harus muncul di console:
```
🔘 Restock button pressed in ProductsScreen
📍 Navigation object: [object Object]
```

Atau:
```
🔘 Restock button pressed in MoreScreen
📍 Navigation object: [object Object]
```

Jika TIDAK muncul → Tombol tidak ter-klik (mungkin ada overlay)

### 4. Cek Navigation

Di console, ketik:
```javascript
// Cek apakah RestockScreen terdaftar
console.log('Navigation routes:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
```

## Solusi Cepat

### Solusi 1: Reload Aplikasi
1. Tekan `r` di terminal Expo
2. Atau refresh browser (Ctrl+R)

### Solusi 2: Clear Cache
```bash
# Stop server (Ctrl+C)
npm start -- --clear
```

### Solusi 3: Hard Refresh Browser
- Windows: Ctrl+Shift+R
- Mac: Cmd+Shift+R

### Solusi 4: Cek Permission Manual

Jika user adalah Owner/Admin, permission otomatis ada.
Jika user adalah Employee, cek di halaman Employees:
1. Buka menu "Karyawan"
2. Edit employee yang login
3. Pastikan "Kelola Produk" dicentang

### Solusi 5: Login Ulang
1. Logout
2. Login lagi
3. Coba akses menu Restock

## Test Manual

### Test 1: Cek File Ada
```bash
ls -la src/screens/RestockScreen.tsx
ls -la src/services/restockService.ts
ls -la src/types/restock.ts
```

Semua harus ada (tidak error "No such file").

### Test 2: Cek Import
Buka `App.tsx` dan cari baris ini:
```typescript
import RestockScreen from './src/screens/RestockScreen';
```

Harus ada dan tidak ada garis merah di editor.

### Test 3: Cek Stack.Screen
Buka `App.tsx` dan cari:
```typescript
<Stack.Screen name="Restock" component={RestockScreen} />
```

Harus ada di dalam `<Stack.Navigator>`.

### Test 4: Cek TypeScript
```bash
npx tsc --noEmit
```

Tidak boleh ada error.

## Informasi Sistem

Untuk laporan bug, sertakan info ini:

**Browser:**
- Nama: Chrome/Firefox/Safari
- Versi: (cek di About)

**Platform:**
- Web / Android / iOS

**User Role:**
- Owner / Admin / Employee

**Permission:**
- canManageProducts: true/false

**Console Errors:**
- (Screenshot console browser)

**Terminal Output:**
- (Screenshot terminal Expo)

## Kontak

Jika masih bermasalah setelah coba semua solusi:
1. Screenshot console browser (F12)
2. Screenshot terminal Expo
3. Screenshot halaman yang error
4. Kirim ke support dengan info sistem di atas
