import { saveChangelog } from '../services/changelogService';

/**
 * Seed initial changelog for version 1.0.0
 * Run this once to populate the changelog
 */
export const seedChangelogV1 = async () => {
  try {
    console.log('🌱 Seeding changelog v1.0.0...');

    await saveChangelog({
      version: '1.0.0',
      date: '2026-01-01',
      title: 'BetaKasir v1.0.0 - Rilis Perdana! 🎉',
      description: 'Aplikasi kasir lengkap dengan fitur-fitur modern untuk membantu bisnis Anda. Dari manajemen produk, transaksi, karyawan, hingga laporan keuangan yang detail.',
      type: 'major',
      changes: [
        // Core Features
        {
          category: 'feature',
          text: '🏪 Sistem Kasir - Transaksi cepat dengan barcode scanner & keyboard shortcuts'
        },
        {
          category: 'feature',
          text: '📦 Manajemen Produk - Kelola produk dengan kategori, stok, dan harga'
        },
        {
          category: 'feature',
          text: '📊 Laporan Keuangan - Dashboard lengkap dengan grafik penjualan & profit'
        },
        {
          category: 'feature',
          text: '👥 Manajemen Karyawan - Sistem role & permissions (Owner, Manager, Cashier)'
        },
        {
          category: 'feature',
          text: '🔐 Login Karyawan QR Code - Scan QR code untuk login cepat'
        },
        {
          category: 'feature',
          text: '🖨️ Cetak Struk - Print receipt otomatis setelah transaksi'
        },
        {
          category: 'feature',
          text: '📱 Multi-Platform - Web, Desktop (Windows/Mac/Linux), & Mobile'
        },
        
        // Subscription System
        {
          category: 'feature',
          text: '💎 Sistem Subscription - 3 plan: Free, Standard, Pro dengan fitur berbeda'
        },
        {
          category: 'feature',
          text: '🎁 Free Trial 7 Hari - Coba semua fitur Pro plan gratis'
        },
        {
          category: 'feature',
          text: '🔒 Feature Gate - Akses fitur sesuai plan subscription'
        },
        
        // Admin Features
        {
          category: 'feature',
          text: '👑 Admin Dashboard - Kelola semua seller & subscription'
        },
        {
          category: 'feature',
          text: '✏️ Content Editor - Admin bisa edit konten aplikasi realtime'
        },
        {
          category: 'feature',
          text: '📝 Changelog System - Info update terbaru untuk user'
        },
        {
          category: 'feature',
          text: '🧪 Testing Tools - Auto-create testing documents di Firestore'
        },
        
        // UI/UX Features
        {
          category: 'feature',
          text: '🌓 Dark/Light Mode - Toggle tema sesuai preferensi'
        },
        {
          category: 'feature',
          text: '💻 Desktop Mode - Layout khusus untuk desktop dengan sidebar'
        },
        {
          category: 'feature',
          text: '⌨️ Keyboard Shortcuts - Produktivitas maksimal dengan shortcuts'
        },
        {
          category: 'feature',
          text: '🎨 Responsive Design - Tampilan optimal di semua ukuran layar'
        },
        
        // Advanced Features
        {
          category: 'feature',
          text: '🔄 Realtime Sync - Data sync otomatis dengan Firestore'
        },
        {
          category: 'feature',
          text: '🤖 AI Assistant - Chatbot untuk bantuan & rekomendasi (powered by Gemini)'
        },
        {
          category: 'feature',
          text: '🔔 Auto Update - Notifikasi update baru otomatis'
        },
        {
          category: 'feature',
          text: '💾 Backup & Restore - Export/import data untuk keamanan'
        },
        {
          category: 'feature',
          text: '📧 Email Verification - Verifikasi email untuk keamanan akun'
        },
        
        // Barcode & Hardware
        {
          category: 'feature',
          text: '📷 Barcode Scanner - Support hardware barcode scanner'
        },
        {
          category: 'feature',
          text: '🖨️ Thermal Printer - Support printer thermal untuk struk'
        },
        
        // Reports & Analytics
        {
          category: 'feature',
          text: '📈 Grafik Penjualan - Visualisasi data penjualan harian/bulanan'
        },
        {
          category: 'feature',
          text: '💰 Laporan Profit - Tracking profit & margin per produk'
        },
        {
          category: 'feature',
          text: '🏆 Top Products - Produk terlaris & analisis performa'
        },
        {
          category: 'feature',
          text: '📊 Export Excel - Export laporan ke Excel untuk analisis lanjut'
        },
        
        // Security & Auth
        {
          category: 'feature',
          text: '🔐 Google Sign-In - Login cepat dengan akun Google'
        },
        {
          category: 'feature',
          text: '🔑 Role-Based Access - Kontrol akses berdasarkan role karyawan'
        },
        {
          category: 'feature',
          text: '⏰ Auto Logout - Logout otomatis saat subscription expired'
        },
        {
          category: 'feature',
          text: '🛡️ Session Persistence - Login tetap aktif setelah refresh'
        },
        
        // Improvements
        {
          category: 'improvement',
          text: '⚡ Performance - Optimasi loading & rendering untuk performa maksimal'
        },
        {
          category: 'improvement',
          text: '🎯 UX - Interface intuitif & mudah digunakan'
        },
        {
          category: 'improvement',
          text: '📱 Mobile Friendly - Touch-optimized untuk mobile devices'
        },
        {
          category: 'improvement',
          text: '🌐 PWA Support - Install sebagai aplikasi di browser'
        },
        {
          category: 'improvement',
          text: '🔍 Search & Filter - Cari produk & transaksi dengan cepat'
        },
        {
          category: 'improvement',
          text: '📋 Form Validation - Validasi input untuk mencegah error'
        },
        {
          category: 'improvement',
          text: '💬 User Guide - Panduan lengkap cara pakai aplikasi'
        },
        {
          category: 'improvement',
          text: '🎨 Custom Branding - Sesuaikan nama & info toko'
        }
      ]
    }, 'v1.0.0');

    console.log('✅ Changelog v1.0.0 berhasil dibuat!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding changelog:', error);
    return false;
  }
};

/**
 * Seed all changelogs
 */
export const seedAllChangelogs = async () => {
  console.log('🌱 Seeding all changelogs...');
  
  const results = await Promise.all([
    seedChangelogV1()
  ]);
  
  const allSuccess = results.every(result => result === true);
  
  if (allSuccess) {
    console.log('✅ Semua changelogs berhasil dibuat!');
  } else {
    console.log('⚠️ Beberapa changelogs gagal dibuat');
  }
  
  return allSuccess;
};
