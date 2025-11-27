# 📊 Financial Dashboard - Panduan Lengkap (Updated)

## ✨ Fitur Utama

Dashboard keuangan yang lengkap dan detail dengan visualisasi grafik modern seperti screenshot yang diberikan.

### 🎯 Komponen Grafik

1. **Kas Keluar (Line Chart)** - Kuning
   - Menampilkan tren pengeluaran modal per bulan
   - Data realtime dari Firebase
   - Smooth bezier curve
   - Compact design di top row

2. **Kas Masuk (Line Chart)** - Cyan
   - Menampilkan tren pendapatan per bulan
   - Data realtime dari Firebase
   - Smooth bezier curve
   - Wide chart di bottom row

3. **Donut Chart - Masuk vs Keluar**
   - Perbandingan visual antara kas masuk dan keluar
   - Warna: Cyan (Masuk) vs Kuning (Keluar)
   - Menampilkan proporsi dalam persentase
   - Compact design di top row

4. **Saldo Card dengan Sparkline**
   - Menampilkan total saldo (Kas Masuk - Kas Keluar)
   - Mini sparkline untuk tren saldo
   - Warna hijau jika positif, merah jika negatif
   - Compact design di top row

5. **Saldo Bar Chart**
   - Bar chart untuk saldo per bulan
   - Warna hijau untuk profit
   - Data dalam ribuan (k)
   - Wide chart di bottom row

### 🎛️ Filter & Kontrol

**Sidebar Kiri (180px):**
- **Filter Tahun**: 2023, 2024, 2025 (single select)
- **Filter Bulan**: Jan - Dec (multi-select, grid 3x4)
- **Reset Button**: Kembali ke tahun sekarang & clear semua bulan

**Fitur Realtime:**
- Badge "Realtime" dengan dot hijau
- Auto-update saat ada transaksi baru
- Menggunakan Firebase onSnapshot listener

### 📱 Cara Menggunakan

1. **Buka Laporan Keuangan**
   - Navigasi ke menu "Laporan"
   - Pilih tab "Dashboard" (tab pertama di top)

2. **Filter Data**
   - Klik tahun di sidebar untuk filter tahun
   - Klik bulan untuk select/unselect (multi-select)
   - Klik "Reset" untuk reset semua filter

3. **Lihat Grafik**
   - Scroll untuk melihat semua grafik
   - Grafik akan auto-update saat ada transaksi baru
   - Data ditampilkan dalam ribuan (k) untuk readability

4. **Switch Tab**
   - Tab "Dashboard" untuk grafik visual
   - Tab "Overview" untuk ringkasan keuangan
   - Tab "Produk" untuk top products
   - Tab "Karyawan" untuk employee performance
   - Tab "Grafik" untuk charts lainnya

### 🔧 Implementasi Teknis

**File Utama:**
- `src/components/FinancialDashboard.tsx` - Komponen dashboard (BARU - Rombak total)
- `src/screens/ReportsScreen.tsx` - Screen laporan dengan tab navigation

**Dependencies:**
- `react-native-chart-kit` - Library untuk grafik
- `react-native-svg` - Untuk rendering grafik
- Firebase Firestore - Realtime database

**Realtime Updates:**
```typescript
// Setup listener di useEffect
const unsubscribe = subscribeToTransactions(sellerUID, (updatedTransactions) => {
  setRealtimeTransactions(updatedTransactions);
});

// Cleanup saat unmount
return () => unsubscribe();
```

### 📊 Perhitungan Data

**Kas Masuk:**
- Total dari semua `transaction.total`

**Kas Keluar:**
- Total dari semua `(item.product.cost * item.quantity)`

**Saldo:**
- `Kas Masuk - Kas Keluar`

**Filter Logic:**
- Year: Single select (hanya 1 tahun aktif)
- Month: Multi-select (bisa pilih beberapa bulan sekaligus)
- Jika tidak ada bulan dipilih = tampilkan semua bulan

### 🎨 Design

**Color Scheme:**
- Background: `#0f0f0f` (Dark)
- Card: `#1a1a1a` (Dark Gray)
- Border: `#2a2a2a` (Gray)
- Primary: `#DC143C` (Crimson Red)
- Kas Keluar: `#FFCE56` (Yellow)
- Kas Masuk: `#4BC0C0` (Cyan)
- Saldo Positif: `#4CAF50` (Green)
- Saldo Negatif: `#F44336` (Red)

**Layout:**
- Sidebar: 180px fixed width
- Charts: Responsive dengan flex layout
- Top Row: 3 cards (Kas Keluar, Donut, Saldo) - compact
- Bottom Row: 2 wide cards (Kas Masuk, Saldo Bar) - full width

**Typography:**
- Header: 20px, bold, white
- Chart Label: 13px, semi-bold, gray
- Chart Value: 18px, extra-bold, white
- Saldo Value: 28px, extra-bold, green/red
- Filter Title: 11px, bold, gray
- Button Text: 12-13px, semi-bold

### ✅ Fitur Lengkap

- ✅ Grafik Line untuk Kas Keluar & Kas Masuk
- ✅ Donut Chart untuk perbandingan
- ✅ Bar Chart untuk Saldo
- ✅ Sparkline untuk tren saldo
- ✅ Filter tahun (single select)
- ✅ Filter bulan (multi-select)
- ✅ Realtime updates dari Firebase
- ✅ Responsive design
- ✅ Dark theme modern
- ✅ Loading state
- ✅ Empty state handling
- ✅ Format currency Indonesia
- ✅ Tab navigation (Dashboard, Overview, Produk, Karyawan, Grafik)
- ✅ Export PDF (di tab selain Dashboard)

### 🚀 Performance

- Menggunakan Firebase onSnapshot untuk realtime
- Data di-cache di local state
- Efficient re-rendering dengan proper dependencies
- Cleanup listener saat unmount
- Optimized chart rendering

### 📝 Perubahan dari Versi Sebelumnya

**Rombak Total:**
1. ✅ Sidebar lebih compact (200px → 180px)
2. ✅ Filter bulan jadi multi-select (bisa pilih beberapa)
3. ✅ Layout lebih rapi dan modern
4. ✅ Chart size lebih proporsional
5. ✅ Typography lebih konsisten
6. ✅ Color scheme lebih soft
7. ✅ Tab navigation di top level
8. ✅ Export button hanya muncul di tab selain Dashboard
9. ✅ Loading state lebih clean
10. ✅ Empty state dengan icon

### 🎯 Sinkronisasi dengan Update Terbaru

- ✅ Menggunakan `useStore` untuk state management
- ✅ Menggunakan `useTheme` untuk theming (fallback ke dark theme)
- ✅ Menggunakan `formatCurrency` dari helpers
- ✅ Menggunakan `subscribeToTransactions` dari dataService
- ✅ Menggunakan `getSellerUID` untuk multi-user support
- ✅ Compatible dengan employee session
- ✅ Realtime sync dengan Firebase

### 🐛 Bug Fixes

- ✅ Fix chart rendering dengan data kosong (min value 0.1)
- ✅ Fix type error di activeTab
- ✅ Fix layout overflow di small screens
- ✅ Fix realtime listener cleanup
- ✅ Fix month filter logic

---

**Created:** November 2025
**Version:** 2.0.0 (Rombak Total)
**Status:** ✅ Production Ready
**Last Updated:** November 24, 2025
