// Script untuk upload semua changelog ke Firestore
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Data changelog untuk semua versi
const changelogs = [
  {
    id: 'v1.1.6',
    version: '1.1.6',
    date: '2025-01-21',
    title: 'BetaKasir v1.1.6 - Fix Critical Bug! 🐛',
    description: 'Perbaikan bug kritis dimana field input tidak bisa diklik setelah scan barcode di desktop. Workflow scan barcode sekarang lebih lancar dan cepat!',
    type: 'patch',
    changes: [
      {
        category: 'bugfix',
        text: 'Fix field input tidak bisa diklik setelah scan barcode di ProductsScreen'
      },
      {
        category: 'bugfix',
        text: 'Fix alert yang mengganggu workflow di CashierScreen'
      },
      {
        category: 'bugfix',
        text: 'Hapus 5 alert di ProductsScreen (Produk Ditemukan, Produk Baru, Barcode Terlalu Pendek, dll)'
      },
      {
        category: 'bugfix',
        text: 'Hapus 3 alert di CashierScreen (Stok Habis, Keranjang Kosong, Uang Tidak Cukup)'
      },
      {
        category: 'improvement',
        text: 'Workflow scan barcode lebih lancar - kasir bisa scan produk berturut-turut tanpa gangguan'
      },
      {
        category: 'improvement',
        text: 'Data langsung terisi di form tanpa popup yang mengganggu'
      }
    ]
  },
  {
    id: 'v1.1.5',
    version: '1.1.5',
    date: '2025-01-21',
    title: 'BetaKasir v1.1.5 - Auto Update System! 🚀',
    description: 'Implementasi sistem auto-update untuk desktop. Aplikasi sekarang bisa update otomatis tanpa perlu download installer manual!',
    type: 'minor',
    changes: [
      {
        category: 'feature',
        text: 'Auto Update System - notifikasi update otomatis saat ada versi baru'
      },
      {
        category: 'feature',
        text: 'Download update di background tanpa mengganggu pekerjaan'
      },
      {
        category: 'feature',
        text: 'Install update dengan restart aplikasi - tidak perlu uninstall manual'
      },
      {
        category: 'feature',
        text: 'Publish ke GitHub Releases otomatis'
      },
      {
        category: 'improvement',
        text: 'Integrasi electron-updater untuk update seamless'
      },
      {
        category: 'improvement',
        text: 'Update modal dengan progress bar'
      }
    ]
  },
  {
    id: 'v1.1.4',
    version: '1.1.4',
    date: '2025-01-20',
    title: 'BetaKasir v1.1.4 - Firebase Auto Update! ☁️',
    description: 'Sistem update via Firebase Storage sebagai fallback jika GitHub Releases tidak tersedia.',
    type: 'minor',
    changes: [
      {
        category: 'feature',
        text: 'Firebase Auto Update - upload file update ke Firebase Storage'
      },
      {
        category: 'feature',
        text: 'Download update dari Firebase Storage'
      },
      {
        category: 'feature',
        text: 'Fallback system jika GitHub Releases tidak tersedia'
      },
      {
        category: 'improvement',
        text: 'Firebase Storage integration'
      },
      {
        category: 'improvement',
        text: 'Storage rules configuration untuk keamanan'
      }
    ]
  },
  {
    id: 'v1.1.3',
    version: '1.1.3',
    date: '2025-01-19',
    title: 'BetaKasir v1.1.3 - Bug Fixes! 🔧',
    description: 'Perbaikan bug pada sistem auto-update dan optimasi performa.',
    type: 'patch',
    changes: [
      {
        category: 'bugfix',
        text: 'Fix auto-update notification tidak muncul'
      },
      {
        category: 'bugfix',
        text: 'Fix download update error 404'
      },
      {
        category: 'bugfix',
        text: 'Fix GitHub token authentication'
      },
      {
        category: 'improvement',
        text: 'Optimasi check update interval'
      },
      {
        category: 'improvement',
        text: 'Better error handling untuk update'
      },
      {
        category: 'improvement',
        text: 'Improved update modal UI'
      }
    ]
  },
  {
    id: 'v1.1.2',
    version: '1.1.2',
    date: '2025-01-18',
    title: 'BetaKasir v1.1.2 - Initial Auto Update! ⚙️',
    description: 'Setup dasar sistem auto-update dengan electron-updater dan GitHub Releases.',
    type: 'minor',
    changes: [
      {
        category: 'feature',
        text: 'Initial Auto Update Setup - electron-updater configuration'
      },
      {
        category: 'feature',
        text: 'GitHub Releases integration'
      },
      {
        category: 'feature',
        text: 'Basic update checker'
      },
      {
        category: 'improvement',
        text: 'Setup electron-builder untuk publish'
      },
      {
        category: 'improvement',
        text: 'GitHub token configuration'
      }
    ]
  },
  {
    id: 'v1.1.1',
    version: '1.1.1',
    date: '2025-01-17',
    title: 'BetaKasir v1.1.1 - Employee Management! 👥',
    description: 'Sistem manajemen karyawan lengkap dengan QR Code login dan role-based permissions.',
    type: 'minor',
    changes: [
      {
        category: 'feature',
        text: 'Sistem manajemen karyawan lengkap'
      },
      {
        category: 'feature',
        text: 'QR Code untuk login karyawan'
      },
      {
        category: 'feature',
        text: 'Role-based permissions (Admin, Cashier, Staff)'
      },
      {
        category: 'feature',
        text: 'Employee ID card printing'
      },
      {
        category: 'bugfix',
        text: 'Fix employee data tidak tersimpan'
      },
      {
        category: 'bugfix',
        text: 'Fix QR code scan tidak berfungsi'
      }
    ]
  },
  {
    id: 'v1.1.0',
    version: '1.1.0',
    date: '2025-01-15',
    title: 'BetaKasir v1.1.0 - Major Update! 🎉',
    description: 'Update besar dengan AI Assistant, Advanced Analytics, Subscription System, dan WhatsApp Integration!',
    type: 'minor',
    changes: [
      {
        category: 'feature',
        text: 'AI Assistant dengan Gemini API - asisten pintar untuk bisnis Anda'
      },
      {
        category: 'feature',
        text: 'Advanced Analytics - analisis bisnis mendalam dengan grafik interaktif'
      },
      {
        category: 'feature',
        text: 'Subscription System - Free, Standard, dan Business plan'
      },
      {
        category: 'feature',
        text: 'WhatsApp Integration - notifikasi dan laporan via WhatsApp'
      },
      {
        category: 'feature',
        text: 'Dark mode & Light mode'
      },
      {
        category: 'feature',
        text: 'Backup & Restore data'
      },
      {
        category: 'feature',
        text: 'Export laporan ke PDF'
      },
      {
        category: 'improvement',
        text: 'Realtime sync dengan Firebase Firestore'
      },
      {
        category: 'improvement',
        text: 'Google Sign-In integration'
      }
    ]
  },
  {
    id: 'v1.0.0',
    version: '1.0.0',
    date: '2025-01-01',
    title: 'BetaKasir v1.0.0 - Rilis Perdana! 🎉',
    description: 'Aplikasi kasir modern pertama untuk toko dan bisnis Anda. Dilengkapi dengan fitur-fitur dasar yang powerful!',
    type: 'major',
    changes: [
      {
        category: 'feature',
        text: 'Sistem kasir dasar - transaksi cepat dan mudah'
      },
      {
        category: 'feature',
        text: 'Manajemen produk - tambah, edit, hapus produk'
      },
      {
        category: 'feature',
        text: 'Manajemen customer - kelola data pelanggan'
      },
      {
        category: 'feature',
        text: 'Laporan transaksi - lihat riwayat penjualan'
      },
      {
        category: 'feature',
        text: 'Barcode scanner support - scan produk dengan cepat'
      },
      {
        category: 'feature',
        text: 'Print struk thermal - cetak struk otomatis'
      }
    ]
  }
];

// Upload changelogs ke Firestore
async function uploadChangelogs() {
  console.log('🚀 Mulai upload changelogs ke Firestore...\n');

  try {
    for (const changelog of changelogs) {
      console.log(`📝 Uploading ${changelog.id}...`);
      
      await db.collection('changelogs').doc(changelog.id).set({
        ...changelog,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ ${changelog.id} uploaded successfully!`);
    }

    console.log('\n🎉 Semua changelog berhasil di-upload!');
    console.log(`📊 Total: ${changelogs.length} changelog`);
    
  } catch (error) {
    console.error('❌ Error uploading changelogs:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
uploadChangelogs();
