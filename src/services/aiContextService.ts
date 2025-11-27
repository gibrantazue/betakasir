// AI Context Service - Deteksi konteks user dan kasih insight
import { useStore } from '../store/useStore';
import { businessInsightsService } from './businessInsightsService';

export interface AIContext {
  currentScreen: string;
  screenData: any;
  insights: string[];
  suggestions: string[];
  quickActions: QuickAction[];
}

export interface QuickAction {
  icon: string;
  text: string;
  query: string;
  action?: () => void;
}

class AIContextService {
  private currentScreen: string = 'Home';
  private screenData: any = {};

  // Set current screen context
  setContext(screen: string, data?: any) {
    this.currentScreen = screen;
    this.screenData = data || {};
  }

  // Get context-aware greeting - SHORT & DIRECT
  getGreeting(): string {
    const hour = new Date().getHours();
    let emoji = '';
    
    if (hour < 12) emoji = '☀️';
    else if (hour < 15) emoji = '🌤️';
    else if (hour < 18) emoji = '🌅';
    else emoji = '🌙';

    const screenContext = this.getScreenContext();
    return `${emoji} ${screenContext}`;
  }

  // Get screen-specific context message - CONCISE
  private getScreenContext(): string {
    const store = useStore.getState();
    
    switch (this.currentScreen) {
      case 'Cashier':
        const cartCount = store.cart?.length || 0;
        return cartCount > 0 ? `${cartCount} produk di keranjang` : 'Siap transaksi';
      
      case 'Products':
        const productCount = store.products?.length || 0;
        const lowStock = store.products?.filter(p => p && p.stock <= 10).length || 0;
        return lowStock > 0 ? `${productCount} produk, ${lowStock} stok menipis` : `${productCount} produk`;
      
      case 'Reports':
        return 'Analisis data tersedia';
      
      case 'Employees':
        const empCount = store.employees?.length || 0;
        return `${empCount} karyawan`;
      
      case 'Transactions':
        const txCount = store.transactions?.length || 0;
        return `${txCount} transaksi`;
      
      default:
        return 'Tanya apa aja!';
    }
  }

  // Get context-aware quick actions
  getQuickActions(): QuickAction[] {
    switch (this.currentScreen) {
      case 'Cashier':
        return [
          { icon: 'barcode', text: 'Scan barcode', query: 'Bagaimana cara scan barcode produk?' },
          { icon: 'keypad', text: 'Shortcut keyboard', query: 'Apa saja keyboard shortcuts untuk kasir?' },
          { icon: 'card', text: 'Proses pembayaran', query: 'Bagaimana cara proses pembayaran?' },
          { icon: 'calculator', text: 'Hitung kembalian', query: 'Bagaimana cara hitung kembalian otomatis?' },
        ];
      
      case 'Products':
        return [
          { icon: 'add-circle', text: 'Tambah produk', query: 'Bagaimana cara menambah produk baru?' },
          { icon: 'barcode', text: 'Input barcode', query: 'Bagaimana cara input barcode produk?' },
          { icon: 'alert-circle', text: 'Stok menipis', query: 'Bagaimana cara set alert stok menipis?' },
          { icon: 'pricetag', text: 'Set harga', query: 'Bagaimana cara set harga jual dan modal?' },
        ];
      
      case 'Reports':
        return [
          { icon: 'stats-chart', text: 'Analisis penjualan', query: 'Analisis pola penjualan saya dan kasih insight' },
          { icon: 'trending-up', text: 'Produk terlaris', query: 'Produk apa yang paling laris dan kenapa?' },
          { icon: 'people', text: 'Performa karyawan', query: 'Bagaimana performa karyawan saya?' },
          { icon: 'bulb', text: 'Strategi bisnis', query: 'Kasih rekomendasi strategi untuk tingkatkan penjualan' },
          { icon: 'warning', text: 'Deteksi masalah', query: 'Ada masalah apa di bisnis saya yang perlu diperbaiki?' },
          { icon: 'gift', text: 'Bundle promo', query: 'Produk apa yang cocok dibuat bundle promo?' },
        ];
      
      case 'Employees':
        return [
          { icon: 'person-add', text: 'Tambah karyawan', query: 'Bagaimana cara menambah karyawan baru?' },
          { icon: 'qr-code', text: 'QR Code login', query: 'Bagaimana cara login karyawan dengan QR code?' },
          { icon: 'card', text: 'Print ID Card', query: 'Bagaimana cara cetak ID card karyawan?' },
          { icon: 'shield', text: 'Set permissions', query: 'Bagaimana cara set permissions karyawan?' },
        ];
      
      case 'Transactions':
        return [
          { icon: 'search', text: 'Cari transaksi', query: 'Bagaimana cara cari transaksi tertentu?' },
          { icon: 'print', text: 'Cetak ulang struk', query: 'Bagaimana cara cetak ulang struk?' },
          { icon: 'calendar', text: 'Filter tanggal', query: 'Bagaimana cara filter transaksi by tanggal?' },
          { icon: 'trash', text: 'Hapus transaksi', query: 'Bagaimana cara hapus transaksi?' },
        ];
      
      default:
        return [
          { icon: 'help-circle', text: 'Cara pakai kasir', query: 'Bagaimana cara menggunakan fitur kasir?' },
          { icon: 'barcode', text: 'Scan barcode', query: 'Bagaimana cara scan barcode produk?' },
          { icon: 'print', text: 'Cetak struk', query: 'Bagaimana cara cetak struk transaksi?' },
          { icon: 'people', text: 'Kelola karyawan', query: 'Bagaimana cara mengelola karyawan?' },
        ];
    }
  }

  // Get proactive insights based on data
  getProactiveInsights(): string[] {
    const store = useStore.getState();
    const insights: string[] = [];

    // Safety check
    if (!store.products || !store.transactions || !store.cart || !store.employees) {
      return insights;
    }

    // Get business insights from service
    const businessInsights = businessInsightsService.generateInsights();
    
    // Add top 3 business insights
    businessInsights.slice(0, 3).forEach(insight => {
      const icon = {
        'success': '✅',
        'warning': '⚠️',
        'info': '📊',
        'tip': '💡'
      }[insight.type] || '📌';
      
      insights.push(`${icon} ${insight.title}: ${insight.message}`);
    });

    // Cart reminder (if in Cashier screen)
    if (this.currentScreen === 'Cashier' && store.cart.length > 0) {
      const cartTotal = store.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      insights.push(`🛒 Keranjang: ${store.cart.length} item, Total: Rp ${cartTotal.toLocaleString('id-ID')}`);
    }

    return insights;
  }

  // Get smart suggestions based on patterns
  getSmartSuggestions(): string[] {
    const store = useStore.getState();
    const suggestions: string[] = [];

    // Safety check
    if (!store.products || !store.transactions || !store.employees) {
      return suggestions;
    }

    // Get recommendations from business insights service
    const recommendations = businessInsightsService.generateRecommendations();
    
    // Add top 5 recommendations
    recommendations.slice(0, 5).forEach(rec => {
      suggestions.push(rec);
    });

    // Note: lastBackup feature not implemented yet
    // const lastBackup = store.settings?.lastBackup;
    // if (!lastBackup || this.daysSince(lastBackup) > 7) {
    //   suggestions.push('💾 Saran: Backup data sudah lama, sebaiknya backup sekarang');
    // }

    return suggestions;
  }

  // Helper: Calculate days since date
  private daysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // Get full context
  getFullContext(): AIContext {
    return {
      currentScreen: this.currentScreen,
      screenData: this.screenData,
      insights: this.getProactiveInsights(),
      suggestions: this.getSmartSuggestions(),
      quickActions: this.getQuickActions(),
    };
  }

  // Generate context-aware prompt for AI
  generateContextPrompt(): string {
    const context = this.getFullContext();
    const greeting = this.getGreeting();
    
    let prompt = `${greeting}\n\n`;
    
    if (context.insights.length > 0) {
      prompt += `📊 INSIGHT:\n${context.insights.join('\n')}\n\n`;
    }
    
    if (context.suggestions.length > 0) {
      prompt += `💡 SARAN:\n${context.suggestions.join('\n')}\n\n`;
    }
    
    prompt += `Saya di screen: ${this.currentScreen}\n`;
    prompt += `Ada yang bisa saya bantu?`;
    
    return prompt;
  }

  // Get subscription plans comparison info
  getSubscriptionPlansInfo(): string {
    let plansInfo = `💎 INFORMASI LENGKAP SUBSCRIPTION PLANS\n`;
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    plansInfo += `📊 RINGKASAN HARGA:\n`;
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    plansInfo += `1. FREE TRIAL\n`;
    plansInfo += `   • Harga: GRATIS (7 hari trial)\n`;
    plansInfo += `   • Cocok untuk: Testing & usaha sangat kecil\n\n`;
    
    plansInfo += `2. STANDARD (⭐ PALING POPULER)\n`;
    plansInfo += `   • Bulanan: Rp 200.000/bulan\n`;
    plansInfo += `   • Tahunan: Rp 2.160.000/tahun (hemat Rp 240.000 atau 10%)\n`;
    plansInfo += `   • Cocok untuk: Toko retail, cafe, salon, 3-5 karyawan\n\n`;
    
    plansInfo += `3. PRO (🚀 UNLIMITED)\n`;
    plansInfo += `   • Bulanan: Rp 800.000/bulan\n`;
    plansInfo += `   • Tahunan: Rp 8.640.000/tahun (hemat Rp 960.000 atau 10%)\n`;
    plansInfo += `   • Cocok untuk: Bisnis besar, franchise, multi cabang\n\n`;
    
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    plansInfo += `📋 PERBANDINGAN DETAIL FITUR:\n`;
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    plansInfo += `🔢 LIMITS & KAPASITAS:\n`;
    plansInfo += `┌─────────────────────┬──────────┬──────────┬──────────┐\n`;
    plansInfo += `│ Fitur               │ Free     │ Standard │ Pro      │\n`;
    plansInfo += `├─────────────────────┼──────────┼──────────┼──────────┤\n`;
    plansInfo += `│ Produk              │ 50       │ 500      │ UNLIMITED│\n`;
    plansInfo += `│ Karyawan            │ 2*       │ 5        │ UNLIMITED│\n`;
    plansInfo += `│ Transaksi/Bulan     │ 100      │ 1.000    │ UNLIMITED│\n`;
    plansInfo += `│ Lokasi/Cabang*      │ 1        │ 1        │ 1        │\n`;
    plansInfo += `└─────────────────────┴──────────┴──────────┴──────────┘\n`;
    plansInfo += `* Free: 2 karyawan tapi TIDAK BISA manage (fitur tidak muncul)\n`;
    plansInfo += `* Lokasi/Cabang: Fitur multi-lokasi BELUM DIIMPLEMENTASI (semua plan 1 lokasi)\n\n`;
    
    plansInfo += `✨ FITUR DASAR (Semua Plan):\n`;
    plansInfo += `• ✅ Kasir POS\n`;
    plansInfo += `• ✅ Manajemen Produk (tambah, edit, hapus)\n`;
    plansInfo += `• ✅ Barcode Scanner\n`;
    plansInfo += `• ✅ Cetak Struk\n`;
    plansInfo += `• ✅ Laporan Dasar\n`;
    plansInfo += `• ✅ Multi-user (owner + karyawan)\n\n`;
    
    plansInfo += `🚀 FITUR LANJUTAN:\n`;
    plansInfo += `┌─────────────────────────────┬──────┬──────────┬──────┐\n`;
    plansInfo += `│ Fitur                       │ Free │ Standard │ Pro  │\n`;
    plansInfo += `├─────────────────────────────┼──────┼──────────┼──────┤\n`;
    plansInfo += `│ Realtime Sync               │ ❌   │ ✅       │ ✅   │\n`;
    plansInfo += `│ Laporan Lanjutan            │ ❌   │ ✅       │ ✅   │\n`;
    plansInfo += `│ AI Assistant                │ ❌   │ ✅       │ ✅   │\n`;
    plansInfo += `│ Advanced Permissions        │ ❌   │ ✅       │ ✅   │\n`;
    plansInfo += `│ Export Transaksi            │ ❌   │ ✅       │ ✅   │\n`;
    plansInfo += `│ Hapus Transaksi             │ ❌   │ ✅       │ ✅   │\n`;
    plansInfo += `│ Kustomisasi Struk           │ ❌   │ ✅       │ ✅   │\n`;
    plansInfo += `└─────────────────────────────┴──────┴──────────┴──────┘\n\n`;
    
    plansInfo += `👥 FITUR KARYAWAN:\n`;
    plansInfo += `┌─────────────────────────────┬──────┬──────────┬──────┐\n`;
    plansInfo += `│ Fitur                       │ Free │ Standard │ Pro  │\n`;
    plansInfo += `├─────────────────────────────┼──────┼──────────┼──────┤\n`;
    plansInfo += `│ Manage Karyawan*            │ ❌   │ ✅       │ ✅   │\n`;
    plansInfo += `│ Print ID Card               │ ❌   │ ✅       │ ✅   │\n`;
    plansInfo += `│ QR Code Login               │ ❌   │ ✅       │ ✅   │\n`;
    plansInfo += `│ Role & Permissions          │ ❌   │ ✅       │ ✅   │\n`;
    plansInfo += `│ Laporan Performa Karyawan   │ ❌   │ ✅       │ ✅   │\n`;
    plansInfo += `└─────────────────────────────┴──────┴──────────┴──────┘\n`;
    plansInfo += `* Manage = tambah, edit, hapus karyawan\n`;
    plansInfo += `  Free: Fitur manage karyawan TIDAK MUNCUL sama sekali\n`;
    plansInfo += `  Standard: Bisa manage maksimal 5 karyawan\n`;
    plansInfo += `  Pro: Bisa manage UNLIMITED karyawan\n\n`;
    
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    plansInfo += `🎯 REKOMENDASI PLAN:\n`;
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    plansInfo += `🆓 FREE TRIAL - Cocok untuk:\n`;
    plansInfo += `✅ Baru mencoba aplikasi (7 hari gratis)\n`;
    plansInfo += `✅ Usaha sangat kecil (warung, kios)\n`;
    plansInfo += `✅ Testing fitur sebelum commit\n`;
    plansInfo += `✅ Maksimal 2 karyawan (tidak bisa manage)\n`;
    plansInfo += `✅ Transaksi < 100/bulan\n`;
    plansInfo += `✅ Produk < 50 item\n\n`;
    plansInfo += `⚠️ KETERBATASAN FREE:\n`;
    plansInfo += `• Tidak ada realtime sync\n`;
    plansInfo += `• Tidak bisa export data\n`;
    plansInfo += `• Tidak ada AI Assistant\n`;
    plansInfo += `• Tidak bisa manage karyawan (fitur tidak muncul)\n`;
    plansInfo += `• Tidak bisa print ID card karyawan\n`;
    plansInfo += `• Tidak bisa QR login karyawan\n`;
    plansInfo += `• Limit produk, karyawan, dan transaksi\n\n`;
    
    plansInfo += `💎 STANDARD (⭐ PALING POPULER) - Cocok untuk:\n`;
    plansInfo += `✅ Toko retail menengah\n`;
    plansInfo += `✅ Cafe & Restaurant\n`;
    plansInfo += `✅ Salon & Barbershop\n`;
    plansInfo += `✅ Minimarket\n`;
    plansInfo += `✅ 3-5 karyawan\n`;
    plansInfo += `✅ Transaksi 100-1000/bulan\n`;
    plansInfo += `✅ Produk 50-500 item\n`;
    plansInfo += `✅ Butuh laporan lengkap\n`;
    plansInfo += `✅ Butuh AI Assistant\n`;
    plansInfo += `✅ Butuh manage karyawan (maks 5)\n\n`;
    plansInfo += `⭐ KEUNGGULAN STANDARD:\n`;
    plansInfo += `• Realtime sync antar device\n`;
    plansInfo += `• Export & backup data\n`;
    plansInfo += `• AI Assistant untuk bantuan\n`;
    plansInfo += `• Laporan performa karyawan\n`;
    plansInfo += `• Kustomisasi struk\n`;
    plansInfo += `• Manage karyawan (tambah/edit/hapus, maks 5)\n`;
    plansInfo += `• Print ID card karyawan\n`;
    plansInfo += `• QR code login karyawan\n`;
    plansInfo += `• Advanced permissions\n\n`;
    plansInfo += `⚠️ KETERBATASAN STANDARD:\n`;
    plansInfo += `• Maksimal 500 produk\n`;
    plansInfo += `• Maksimal 5 karyawan\n`;
    plansInfo += `• Maksimal 1.000 transaksi/bulan\n`;
    plansInfo += `• Maksimal 1 lokasi\n\n`;
    
    plansInfo += `🚀 PRO (UNLIMITED) - Cocok untuk:\n`;
    plansInfo += `✅ Bisnis besar & franchise\n`;
    plansInfo += `✅ Karyawan > 5 orang (unlimited)\n`;
    plansInfo += `✅ Transaksi > 1000/bulan (unlimited)\n`;
    plansInfo += `✅ Produk > 500 item (unlimited)\n`;
    plansInfo += `✅ Butuh skalabilitas tinggi\n`;
    plansInfo += `✅ Butuh semua fitur tanpa batasan\n\n`;
    plansInfo += `⭐ KEUNGGULAN PRO:\n`;
    plansInfo += `• UNLIMITED produk, karyawan, transaksi\n`;
    plansInfo += `• Semua fitur Standard +\n`;
    plansInfo += `• Tidak ada batasan apapun\n`;
    plansInfo += `• Cocok untuk bisnis yang berkembang pesat\n`;
    plansInfo += `• Tidak perlu khawatir limit\n\n`;
    
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    plansInfo += `💰 PERHITUNGAN ROI:\n`;
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    plansInfo += `Contoh: Toko Retail dengan 5 Karyawan\n\n`;
    plansInfo += `TANPA BETA KASIR:\n`;
    plansInfo += `• Kasir manual: 2 jam/hari rekap = Rp 300.000/bulan\n`;
    plansInfo += `• Kesalahan hitung: ~Rp 500.000/bulan\n`;
    plansInfo += `• Kehilangan data: Priceless\n`;
    plansInfo += `• Total Loss: ~Rp 800.000/bulan\n\n`;
    
    plansInfo += `DENGAN BETA KASIR STANDARD (Rp 200.000/bulan):\n`;
    plansInfo += `• Hemat waktu rekap: Rp 300.000\n`;
    plansInfo += `• Kurangi kesalahan: Rp 500.000\n`;
    plansInfo += `• Data aman & backup: Priceless\n`;
    plansInfo += `• Total Saving: ~Rp 600.000/bulan\n`;
    plansInfo += `• ROI: 300% dalam 1 bulan!\n\n`;
    
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    plansInfo += `🎁 PROMO & DISKON:\n`;
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    plansInfo += `💰 DISKON TAHUNAN (10% OFF):\n`;
    plansInfo += `• Standard: Hemat Rp 240.000/tahun\n`;
    plansInfo += `• Pro: Hemat Rp 960.000/tahun\n\n`;
    
    plansInfo += `🎁 FREE TRIAL:\n`;
    plansInfo += `• 7 hari gratis untuk semua user baru\n`;
    plansInfo += `• Tidak perlu kartu kredit\n`;
    plansInfo += `• Bisa upgrade kapan saja\n`;
    plansInfo += `• Tidak ada kontrak jangka panjang\n\n`;
    
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    plansInfo += `❓ FAQ SUBSCRIPTION:\n`;
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    plansInfo += `Q: Apakah bisa upgrade/downgrade kapan saja?\n`;
    plansInfo += `A: Ya, bisa kapan saja. Perubahan berlaku di periode billing berikutnya.\n\n`;
    
    plansInfo += `Q: Apakah data saya aman saat downgrade?\n`;
    plansInfo += `A: Ya, data tetap aman. Hanya akses fitur yang dibatasi.\n\n`;
    
    plansInfo += `Q: Bagaimana cara pembayaran?\n`;
    plansInfo += `A: Transfer bank, kartu kredit, e-wallet (GoPay, OVO, Dana).\n\n`;
    
    plansInfo += `Q: Apakah ada biaya setup?\n`;
    plansInfo += `A: Tidak ada biaya setup. Harga sudah all-in.\n\n`;
    
    plansInfo += `Q: Apakah bisa trial dulu sebelum bayar?\n`;
    plansInfo += `A: Ya, semua user dapat 7 hari free trial.\n\n`;
    
    plansInfo += `Q: Bagaimana jika tidak puas?\n`;
    plansInfo += `A: Money-back guarantee 7 hari pertama.\n\n`;
    
    plansInfo += `Q: Apakah harga sudah termasuk update?\n`;
    plansInfo += `A: Ya, semua update gratis selamanya.\n\n`;
    
    plansInfo += `Q: Apakah ada kontrak jangka panjang?\n`;
    plansInfo += `A: Tidak ada kontrak. Bisa cancel kapan saja.\n\n`;
    
    plansInfo += `Q: Perbedaan utama Free vs Standard?\n`;
    plansInfo += `A: Free tidak bisa manage karyawan (fitur tidak muncul), tidak ada AI Assistant, tidak ada realtime sync, limit ketat. Standard bisa manage 5 karyawan, ada AI Assistant, realtime sync, limit lebih besar.\n\n`;
    
    plansInfo += `Q: Perbedaan utama Standard vs Pro?\n`;
    plansInfo += `A: Standard ada limit (500 produk, 5 karyawan, 1000 transaksi/bulan). Pro UNLIMITED (produk, karyawan, transaksi). Note: Fitur multi-lokasi belum tersedia di semua plan.\n\n`;
    
    plansInfo += `Q: Kenapa Free tidak bisa manage karyawan?\n`;
    plansInfo += `A: Free trial hanya untuk testing. Fitur manage karyawan (tambah/edit/hapus) tidak muncul di Free. Untuk manage karyawan, perlu upgrade ke Standard atau Pro.\n\n`;
    
    plansInfo += `Q: Apakah ada fitur multi-lokasi/cabang?\n`;
    plansInfo += `A: Fitur multi-lokasi/cabang BELUM DIIMPLEMENTASI. Saat ini semua plan (Free, Standard, Pro) hanya support 1 lokasi. Fitur ini masih dalam roadmap untuk development di masa depan.\n\n`;
    
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    plansInfo += `✅ AI SUDAH TAHU SEMUA TENTANG SUBSCRIPTION!\n`;
    plansInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    plansInfo += `Kamu bisa tanya:\n`;
    plansInfo += `• "Apa perbedaan plan Free, Standard, dan Pro?"\n`;
    plansInfo += `• "Berapa harga plan Standard?"\n`;
    plansInfo += `• "Fitur apa saja yang ada di plan Pro?"\n`;
    plansInfo += `• "Kenapa Free tidak bisa manage karyawan?"\n`;
    plansInfo += `• "Berapa limit produk di plan Standard?"\n`;
    plansInfo += `• "Apakah plan Pro unlimited?"\n`;
    plansInfo += `• "Berapa hemat kalau bayar tahunan?"\n`;
    plansInfo += `• "Plan mana yang cocok untuk toko saya?"\n`;
    plansInfo += `• "Apa keuntungan upgrade ke Standard?"\n`;
    plansInfo += `• "Berapa ROI kalau pakai Beta Kasir?"\n`;
    
    return plansInfo;
  }

  // Get app version and ALL changelogs info
  async getAppVersionInfo(): Promise<string> {
    try {
      // Import services
      const { getCurrentVersion } = await import('./updateService');
      const { getAllChangelogs } = await import('./changelogService');
      
      // Get current version
      const currentVersion = await getCurrentVersion();
      
      // Get ALL changelogs from Firebase
      const allChangelogs = await getAllChangelogs();
      
      let versionInfo = `📱 INFORMASI APLIKASI & SEMUA CHANGELOG\n`;
      versionInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      versionInfo += `🔖 Versi Saat Ini: ${currentVersion}\n`;
      versionInfo += `📅 Tanggal: ${new Date().toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}\n`;
      versionInfo += `📝 Total Changelog: ${allChangelogs.length} versi\n\n`;
      
      if (allChangelogs.length > 0) {
        versionInfo += `📚 SEMUA CHANGELOG (${allChangelogs.length} versi):\n`;
        versionInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        // Sort by version (newest first)
        const sortedChangelogs = [...allChangelogs].sort((a, b) => {
          const versionA = a.version.split('.').map(Number);
          const versionB = b.version.split('.').map(Number);
          for (let i = 0; i < 3; i++) {
            if (versionB[i] !== versionA[i]) return versionB[i] - versionA[i];
          }
          return 0;
        });
        
        // Display each changelog
        sortedChangelogs.forEach((changelog, index) => {
          const isCurrent = changelog.version === currentVersion;
          const versionBadge = isCurrent ? '🔖 CURRENT' : '';
          
          versionInfo += `${index + 1}. v${changelog.version} ${versionBadge}\n`;
          versionInfo += `   📅 ${changelog.date}\n`;
          versionInfo += `   📌 ${changelog.title}\n`;
          versionInfo += `   📄 ${changelog.description}\n`;
          
          // Group changes by category
          const features = changelog.changes.filter(c => c.category === 'feature');
          const improvements = changelog.changes.filter(c => c.category === 'improvement');
          const bugfixes = changelog.changes.filter(c => c.category === 'bugfix');
          const breaking = changelog.changes.filter(c => c.category === 'breaking');
          
          if (features.length > 0) {
            versionInfo += `   ✨ Fitur Baru (${features.length}):\n`;
            features.slice(0, 3).forEach(item => {
              versionInfo += `      • ${item.text}\n`;
            });
            if (features.length > 3) {
              versionInfo += `      ... dan ${features.length - 3} fitur lainnya\n`;
            }
          }
          
          if (improvements.length > 0) {
            versionInfo += `   🚀 Peningkatan (${improvements.length}):\n`;
            improvements.slice(0, 2).forEach(item => {
              versionInfo += `      • ${item.text}\n`;
            });
            if (improvements.length > 2) {
              versionInfo += `      ... dan ${improvements.length - 2} peningkatan lainnya\n`;
            }
          }
          
          if (bugfixes.length > 0) {
            versionInfo += `   🐛 Perbaikan Bug (${bugfixes.length}):\n`;
            bugfixes.slice(0, 2).forEach(item => {
              versionInfo += `      • ${item.text}\n`;
            });
            if (bugfixes.length > 2) {
              versionInfo += `      ... dan ${bugfixes.length - 2} perbaikan lainnya\n`;
            }
          }
          
          if (breaking.length > 0) {
            versionInfo += `   ⚠️ Breaking Changes (${breaking.length}):\n`;
            breaking.forEach(item => {
              versionInfo += `      • ${item.text}\n`;
            });
          }
          
          versionInfo += `\n`;
        });
      } else {
        versionInfo += `ℹ️ Belum ada changelog tersedia.\n\n`;
      }
      
      versionInfo += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      versionInfo += `✅ AI sudah tahu SEMUA versi dan changelog aplikasi!\n`;
      versionInfo += `Kamu bisa tanya:\n`;
      versionInfo += `- "Versi berapa aplikasi ini?"\n`;
      versionInfo += `- "Fitur apa saja di versi 1.1.5?"\n`;
      versionInfo += `- "Apa yang baru di update sebelumnya?"\n`;
      versionInfo += `- "Changelog versi 1.1.7 apa saja?"\n`;
      versionInfo += `- "Kapan fitur AI Assistant ditambahkan?"\n`;
      versionInfo += `- "Perbedaan versi 1.1.0 dan 1.1.5?"\n`;
      
      return versionInfo;
    } catch (error) {
      console.error('Error getting app version info:', error);
      return `⚠️ Gagal mengambil informasi versi aplikasi.\n`;
    }
  }

  // Get complete business data for AI (auto-detect user from login)
  getBusinessData(): string {
    const store = useStore.getState();
    const { currentUser, employeeSession, products, transactions, employees, customers, cart, settings } = store;
    
    // Import advanced analytics
    const { advancedAnalyticsService } = require('./advancedAnalyticsService');
    
    // Detect seller UID (from employee session or current user)
    const sellerUID = employeeSession?.sellerUID || currentUser?.id;
    const userName = employeeSession?.employee?.name || currentUser?.name || 'User';
    const userRole = employeeSession?.employee?.role || 'owner';
    
    if (!sellerUID) {
      return '❌ User belum login. Tidak bisa akses data bisnis.';
    }

    // Build comprehensive business data context
    let dataContext = `📊 DATA BISNIS LENGKAP (Auto-detected from login)\n`;
    dataContext += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // User Info
    dataContext += `👤 USER INFO:\n`;
    dataContext += `- Nama: ${userName}\n`;
    dataContext += `- Role: ${userRole}\n`;
    dataContext += `- Seller UID: ${sellerUID}\n`;
    dataContext += `- Toko: ${settings?.storeName || 'BETA KASIR'}\n\n`;
    
    // Products Summary
    dataContext += `📦 PRODUK (${products?.length || 0} total):\n`;
    if (products && products.length > 0) {
      const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
      const lowStock = products.filter(p => p.stock <= 10);
      const outOfStock = products.filter(p => p.stock === 0);
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
      
      dataContext += `- Total stok: ${totalStock} unit\n`;
      dataContext += `- Nilai inventory: Rp ${totalValue.toLocaleString('id-ID')}\n`;
      dataContext += `- Stok menipis: ${lowStock.length} produk\n`;
      dataContext += `- Stok habis: ${outOfStock.length} produk\n`;
      
      // Top 5 products by stock value
      const topProducts = [...products]
        .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
        .slice(0, 5);
      
      dataContext += `\nTop 5 Produk (by nilai stok):\n`;
      topProducts.forEach((p, i) => {
        dataContext += `  ${i + 1}. ${p.name} - Stok: ${p.stock}, Harga: Rp ${p.price.toLocaleString('id-ID')}\n`;
      });
    } else {
      dataContext += `- Belum ada produk\n`;
    }
    dataContext += `\n`;
    
    // Transactions Summary
    dataContext += `💰 TRANSAKSI (${transactions?.length || 0} total):\n`;
    if (transactions && transactions.length > 0) {
      const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
      const avgTransaction = totalRevenue / transactions.length;
      
      // Today's transactions
      const today = new Date().toISOString().split('T')[0];
      const todayTx = transactions.filter(t => t.createdAt.startsWith(today));
      const todayRevenue = todayTx.reduce((sum, t) => sum + t.total, 0);
      
      // This month's transactions
      const thisMonth = new Date().toISOString().slice(0, 7);
      const monthTx = transactions.filter(t => t.createdAt.startsWith(thisMonth));
      const monthRevenue = monthTx.reduce((sum, t) => sum + t.total, 0);
      
      dataContext += `- Total pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}\n`;
      dataContext += `- Rata-rata transaksi: Rp ${avgTransaction.toLocaleString('id-ID')}\n`;
      dataContext += `- Hari ini: ${todayTx.length} transaksi, Rp ${todayRevenue.toLocaleString('id-ID')}\n`;
      dataContext += `- Bulan ini: ${monthTx.length} transaksi, Rp ${monthRevenue.toLocaleString('id-ID')}\n`;
      
      // Best selling products
      const productSales: { [key: string]: { name: string; qty: number; revenue: number } } = {};
      transactions.forEach(t => {
        t.items.forEach(item => {
          if (!productSales[item.product.id]) {
            productSales[item.product.id] = {
              name: item.product.name,
              qty: 0,
              revenue: 0
            };
          }
          productSales[item.product.id].qty += item.quantity;
          productSales[item.product.id].revenue += item.product.price * item.quantity;
        });
      });
      
      const topSelling = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      dataContext += `\nTop 5 Produk Terlaris:\n`;
      topSelling.forEach((p, i) => {
        dataContext += `  ${i + 1}. ${p.name} - Terjual: ${p.qty} unit, Revenue: Rp ${p.revenue.toLocaleString('id-ID')}\n`;
      });
    } else {
      dataContext += `- Belum ada transaksi\n`;
    }
    dataContext += `\n`;
    
    // Employees Summary (only if owner/admin)
    if (userRole === 'owner' || userRole === 'admin' || userRole === 'seller') {
      dataContext += `👥 KARYAWAN (${employees?.length || 0} total):\n`;
      if (employees && employees.length > 0) {
        const activeEmployees = employees.filter(e => e.isActive);
        const inactiveEmployees = employees.filter(e => !e.isActive);
        
        dataContext += `- Aktif: ${activeEmployees.length}\n`;
        dataContext += `- Tidak aktif: ${inactiveEmployees.length}\n`;
        
        dataContext += `\nDaftar Karyawan:\n`;
        employees.forEach((e, i) => {
          dataContext += `  ${i + 1}. ${e.name} (${e.username}) - ${e.role} - ${e.isActive ? 'aktif' : 'tidak aktif'}\n`;
        });
      } else {
        dataContext += `- Belum ada karyawan\n`;
      }
      dataContext += `\n`;
    }
    
    // Customers Summary
    dataContext += `👤 PELANGGAN (${customers?.length || 0} total):\n`;
    if (customers && customers.length > 0) {
      // Top customers by transaction count
      const customerTxCount: { [key: string]: { name: string; count: number; total: number } } = {};
      
      transactions?.forEach(t => {
        if (t.customerId) {
          const customer = customers.find(c => c.id === t.customerId);
          if (customer) {
            if (!customerTxCount[customer.id]) {
              customerTxCount[customer.id] = {
                name: customer.name,
                count: 0,
                total: 0
              };
            }
            customerTxCount[customer.id].count++;
            customerTxCount[customer.id].total += t.total;
          }
        }
      });
      
      const topCustomers = Object.values(customerTxCount)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      
      if (topCustomers.length > 0) {
        dataContext += `Top 5 Pelanggan:\n`;
        topCustomers.forEach((c, i) => {
          dataContext += `  ${i + 1}. ${c.name} - ${c.count} transaksi, Total: Rp ${c.total.toLocaleString('id-ID')}\n`;
        });
      } else {
        dataContext += `- Data pelanggan tersedia tapi belum ada transaksi\n`;
      }
    } else {
      dataContext += `- Belum ada data pelanggan\n`;
    }
    dataContext += `\n`;
    
    // Current Cart (if any)
    if (cart && cart.length > 0) {
      dataContext += `🛒 KERANJANG SAAT INI (${cart.length} item):\n`;
      const cartTotal = cart.reduce((sum, item) => {
        const itemPrice = item.product.price * item.quantity;
        const discountAmount = itemPrice * (item.discount / 100);
        return sum + (itemPrice - discountAmount);
      }, 0);
      cart.forEach((item, i) => {
        const itemPrice = item.product.price * item.quantity;
        const discountAmount = itemPrice * (item.discount / 100);
        const finalPrice = itemPrice - discountAmount;
        dataContext += `  ${i + 1}. ${item.product.name} x${item.quantity} = Rp ${finalPrice.toLocaleString('id-ID')}`;
        if (item.discount > 0) {
          dataContext += ` (diskon ${item.discount}%)`;
        }
        dataContext += `\n`;
      });
      dataContext += `Total: Rp ${cartTotal.toLocaleString('id-ID')}\n\n`;
    }
    
    // ADVANCED ANALYTICS - HPP, Matematika Bisnis, Forecasting
    if (products && products.length > 0 && transactions && transactions.length > 0) {
      try {
        const analytics = advancedAnalyticsService.getCompleteAnalytics(products, transactions);
        const analyticsText = advancedAnalyticsService.formatAnalyticsForAI(analytics);
        dataContext += analyticsText;
        dataContext += `\n`;
      } catch (error) {
        console.warn('⚠️ Failed to calculate advanced analytics:', error);
      }
    }
    
    dataContext += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    dataContext += `✅ AI sudah punya akses ke SEMUA data bisnis kamu!\n`;
    dataContext += `Termasuk: HPP, Profit Margin, ROI, Inventory Turnover, Forecasting, dll.\n`;
    dataContext += `Kamu bisa tanya apa aja tentang matematika bisnis, analisis keuangan, prediksi, dll.\n`;
    dataContext += `Contoh: "Berapa HPP saya?", "Berapa ROI bisnis saya?", "Prediksi penjualan bulan depan?"\n\n`;
    
    // Add subscription plans info
    dataContext += this.getSubscriptionPlansInfo();
    
    return dataContext;
  }
}

export const aiContextService = new AIContextService();
