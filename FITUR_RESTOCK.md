# 📦 Fitur Restock Produk

## Deskripsi
Fitur untuk membuat surat pesanan otomatis ke supplier ketika stok produk menipis (≤10 unit), dengan kemampuan export PDF dan kirim langsung ke WhatsApp supplier.

## Cara Menggunakan

### 1. Akses Menu Restock
Ada 2 cara untuk mengakses fitur restock:

**Cara 1: Dari Menu Lainnya**
- Buka tab "Lainnya" di bottom navigation
- Pilih "Restock Produk" (icon 📦 warna orange)

**Cara 2: Dari Halaman Produk**
- Buka halaman "Produk"
- Klik tombol 📦 (warna orange) di header

### 2. Pilih Produk yang Perlu Restock
- Sistem otomatis menampilkan produk dengan stok ≤10 unit
- Produk diurutkan dari stok paling sedikit
- Klik tombol "Restock" pada produk yang ingin dipesan

### 3. Isi Form Surat Pesanan

**Informasi Supplier:**
- Nama Supplier (wajib)
- No. WhatsApp Supplier (wajib, format: 628123456789)
- Alamat Supplier (opsional)

**Detail Pesanan:**
- Jumlah Pesanan (wajib)
- Catatan untuk produk (opsional)
- Catatan tambahan untuk supplier (opsional)

### 4. Pilih Aksi

Setelah klik "Buat Surat Pesanan", pilih salah satu:

**Export PDF**
- Otomatis download surat pesanan sebagai file PDF
- File langsung tersimpan di folder Downloads
- Hanya tersedia di versi web

**Salin Teks**
- Copy surat pesanan ke clipboard
- Bisa paste ke WhatsApp, Email, atau platform lainnya
- Tersedia di semua platform

**Simpan Gambar**
- Otomatis download surat pesanan sebagai file PNG
- Kualitas tinggi, siap dibagikan
- Hanya tersedia di versi web

## Format Surat Pesanan

Surat pesanan yang dibuat mencakup:

```
📄 SURAT PESANAN BARANG
No: RST-1234567890
Tanggal: Senin, 24 November 2025

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DARI:
BETA KASIR
Jl. Contoh No. 123, Jakarta
Telp: 021-12345678

KEPADA:
Supplier ABC
Jl. Supplier No. 456
Telp: 628123456789

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DAFTAR PESANAN:

1. Produk A
   Jumlah: 50 pcs

CATATAN:
[Catatan tambahan jika ada]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mohon konfirmasi ketersediaan barang dan waktu pengiriman.

Terima kasih atas kerjasamanya.

Surat ini dibuat otomatis oleh BetaKasir
```

## Fitur Utama

✅ **Deteksi Otomatis** - Sistem otomatis mendeteksi produk dengan stok ≤10 unit
✅ **Generate Surat** - Membuat surat pesanan profesional secara otomatis
✅ **Export PDF** - Export surat dalam format PDF (web only)
✅ **Salin Teks** - Copy surat ke clipboard untuk dikirim via WhatsApp/Email
✅ **Dark Mode** - Mendukung tema gelap dan terang
✅ **Template Profesional** - Format surat yang rapi dan profesional

## Tips

1. **Simpan Data Supplier** - Catat nomor WhatsApp supplier untuk memudahkan pemesanan berikutnya
2. **Cek Stok Berkala** - Buka menu Restock secara berkala untuk memantau produk yang perlu dipesan
3. **Gunakan Catatan** - Manfaatkan field catatan untuk informasi tambahan (warna, ukuran, dll)
4. **Format Nomor WA** - Pastikan nomor WhatsApp dalam format internasional (628xxx)

## Troubleshooting

**Popup Blocked (Export PDF)**
- Jika PDF tidak muncul, izinkan popup di browser
- Biasanya ada notifikasi di address bar

**Teks Tidak Tersalin**
- Pastikan browser/app memiliki permission untuk akses clipboard
- Coba refresh halaman dan ulangi

**Produk Tidak Muncul**
- Fitur ini hanya menampilkan produk dengan stok ≤10 unit
- Jika semua produk stoknya aman, akan muncul pesan "Semua produk stoknya aman!"

## Permissions

Fitur ini memerlukan permission:
- `canManageProducts` - Untuk akses menu restock dan membuat surat pesanan

## File Terkait

- `src/screens/RestockScreen.tsx` - UI untuk restock
- `src/services/restockService.ts` - Logic generate surat dan kirim
- `src/types/restock.ts` - Type definitions
- `App.tsx` - Navigation setup
