/**
 * SCRIPT CLEANUP REFERRAL - SIMPLE VERSION
 * Jalankan: node scripts/runCleanupNow.js
 */

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🧹 CLEANUP KODE REFERRAL LAMA - AUTOMATIC SCRIPT        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

⚠️  PERHATIAN:
Script ini akan menghapus semua kode referral lama dari sellers.

Field yang akan dihapus:
- referralCode
- referredBy  
- referredAt

❌ SCRIPT INI TIDAK BISA JALAN KARENA:
Firebase Admin Key expired/tidak valid.

✅ SOLUSI TERCEPAT: MANUAL VIA FIREBASE CONSOLE

═══════════════════════════════════════════════════════════

📋 LANGKAH-LANGKAH MUDAH:

1️⃣  Buka browser, go to:
    https://console.firebase.google.com

2️⃣  Login & pilih project BetaKasir

3️⃣  Sidebar kiri → Firestore Database → Tab "Data"

4️⃣  Klik collection "users"

5️⃣  Untuk setiap seller yang punya kode referral:
    
    Cara A (Satu-satu):
    - Klik document seller
    - Cari field "referralCode"
    - Klik icon 🗑️ di sebelah kanan
    - Klik "Delete field"
    - Ulangi untuk "referredBy" dan "referredAt"
    
    Cara B (Lebih cepat):
    - Klik document seller
    - Klik tombol "..." (3 titik) di kanan atas
    - Pilih "Edit document"
    - Hapus baris: referralCode, referredBy, referredAt
    - Klik "Update"

6️⃣  Selesai! ✅

═══════════════════════════════════════════════════════════

📊 HASIL SETELAH CLEANUP:

✅ Sellers bisa input kode referral baru di Settings
✅ Admin bisa monitor di Sales Management
✅ totalReferrals mulai dari 0
✅ Realtime updates untuk semua perubahan

═══════════════════════════════════════════════════════════

💡 TIPS:

- Fokus ke seller yang masih aktif dulu
- Bisa hapus bertahap (5-10 seller dulu, test, lanjut)
- Backup data dulu kalau mau aman (optional)

═══════════════════════════════════════════════════════════

📝 DOKUMENTASI LENGKAP:
Baca file: CARA_HAPUS_KODE_REFERRAL_LAMA.md

═══════════════════════════════════════════════════════════
`);

process.exit(0);
