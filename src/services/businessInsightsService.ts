// Business Insights Service - Smart Suggestions & Analytics
import { useStore } from '../store/useStore';
import type { Transaction, Product } from '../types';

export interface BusinessInsight {
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  message: string;
  action?: string;
  priority: number; // 1-5, 5 = highest
}

export interface SalesPattern {
  peakDay: string;
  peakHour: number;
  averageTransaction: number;
  topProducts: string[];
  slowMovingProducts: string[];
}

class BusinessInsightsService {
  // Analyze sales patterns
  analyzeSalesPatterns(transactions: Transaction[]): SalesPattern {
    if (!transactions || transactions.length === 0) {
      return {
        peakDay: 'Belum ada data',
        peakHour: 0,
        averageTransaction: 0,
        topProducts: [],
        slowMovingProducts: [],
      };
    }

    // Group by day of week
    const dayCount: Record<string, number> = {};
    const hourCount: Record<number, number> = {};
    const productSales: Record<string, number> = {};

    transactions.forEach(t => {
      if (!t.date) return;

      // Day of week
      const date = new Date(t.date);
      const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][date.getDay()];
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;

      // Hour
      const hour = date.getHours();
      hourCount[hour] = (hourCount[hour] || 0) + 1;

      // Products
      t.items?.forEach(item => {
        const productName = item.name || item.productId;
        productSales[productName] = (productSales[productName] || 0) + item.quantity;
      });
    });

    // Find peak day
    const peakDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Belum ada data';

    // Find peak hour
    const peakHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

    // Average transaction
    const totalSales = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const averageTransaction = totalSales / transactions.length;

    // Top products
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Slow moving products (sold < 5 times)
    const slowMovingProducts = Object.entries(productSales)
      .filter(([, count]) => count < 5)
      .map(([name]) => name);

    return {
      peakDay,
      peakHour: Number(peakHour),
      averageTransaction,
      topProducts,
      slowMovingProducts,
    };
  }

  // Find product correlations (products bought together)
  findProductCorrelations(transactions: Transaction[]): Map<string, string[]> {
    const correlations = new Map<string, Map<string, number>>();

    transactions.forEach(t => {
      if (!t.items || t.items.length < 2) return;

      // For each pair of products in transaction
      for (let i = 0; i < t.items.length; i++) {
        for (let j = i + 1; j < t.items.length; j++) {
          const product1 = t.items[i].name || t.items[i].productId;
          const product2 = t.items[j].name || t.items[j].productId;

          // Track correlation
          if (!correlations.has(product1)) {
            correlations.set(product1, new Map());
          }
          const product1Corr = correlations.get(product1)!;
          product1Corr.set(product2, (product1Corr.get(product2) || 0) + 1);

          // Reverse correlation
          if (!correlations.has(product2)) {
            correlations.set(product2, new Map());
          }
          const product2Corr = correlations.get(product2)!;
          product2Corr.set(product1, (product2Corr.get(product1) || 0) + 1);
        }
      }
    });

    // Convert to simple format: product -> [related products]
    const result = new Map<string, string[]>();
    correlations.forEach((corr, product) => {
      const related = Array.from(corr.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([p]) => p);
      result.set(product, related);
    });

    return result;
  }

  // Generate smart business insights
  generateInsights(): BusinessInsight[] {
    const store = useStore.getState();
    const insights: BusinessInsight[] = [];

    // Safety check
    if (!store.products || !store.transactions) {
      return insights;
    }

    // 1. Low stock products
    const lowStock = store.products.filter(p => p && p.stock <= 10 && p.stock > 0);
    if (lowStock.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Stok Menipis',
        message: `${lowStock.length} produk perlu restock: ${lowStock.slice(0, 3).map(p => p.name).join(', ')}${lowStock.length > 3 ? '...' : ''}`,
        action: 'Restock sekarang untuk hindari kehabisan stok',
        priority: 5,
      });
    }

    // 2. Out of stock products
    const outOfStock = store.products.filter(p => p && p.stock === 0);
    if (outOfStock.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Produk Habis',
        message: `${outOfStock.length} produk habis stok dan tidak bisa dijual`,
        action: 'Restock segera untuk tidak kehilangan penjualan',
        priority: 5,
      });
    }

    // 3. Sales patterns
    if (store.transactions.length >= 10) {
      const patterns = this.analyzeSalesPatterns(store.transactions);
      
      insights.push({
        type: 'info',
        title: 'Pola Penjualan',
        message: `Hari tersibuk: ${patterns.peakDay}, Jam tersibuk: ${patterns.peakHour}:00`,
        action: `Pastikan stok cukup setiap ${patterns.peakDay} dan tambah kasir jam ${patterns.peakHour}:00`,
        priority: 3,
      });

      // Top products insight
      if (patterns.topProducts.length > 0) {
        insights.push({
          type: 'success',
          title: 'Produk Terlaris',
          message: `Top 3: ${patterns.topProducts.slice(0, 3).join(', ')}`,
          action: 'Pastikan produk ini selalu tersedia dan stok cukup',
          priority: 4,
        });
      }

      // Slow moving products
      if (patterns.slowMovingProducts.length > 0) {
        insights.push({
          type: 'warning',
          title: 'Produk Kurang Laku',
          message: `${patterns.slowMovingProducts.length} produk jarang terjual`,
          action: 'Pertimbangkan diskon atau promosi untuk produk ini',
          priority: 2,
        });
      }
    }

    // 4. Product correlations (bundle suggestions)
    if (store.transactions.length >= 20) {
      const correlations = this.findProductCorrelations(store.transactions);
      const topCorrelation = Array.from(correlations.entries())[0];
      
      if (topCorrelation && topCorrelation[1].length > 0) {
        insights.push({
          type: 'tip',
          title: 'Saran Bundle Promo',
          message: `Pelanggan yang beli ${topCorrelation[0]} sering juga beli ${topCorrelation[1][0]}`,
          action: `Buat paket bundle: ${topCorrelation[0]} + ${topCorrelation[1][0]} dengan harga spesial`,
          priority: 3,
        });
      }
    }

    // 5. Average transaction value
    if (store.transactions.length > 0) {
      const patterns = this.analyzeSalesPatterns(store.transactions);
      const avgFormatted = patterns.averageTransaction.toLocaleString('id-ID');
      
      insights.push({
        type: 'info',
        title: 'Rata-rata Transaksi',
        message: `Rp ${avgFormatted} per transaksi`,
        action: 'Tingkatkan dengan upselling dan cross-selling',
        priority: 2,
      });
    }

    // 6. Employee performance (if multiple employees)
    if (store.employees && store.employees.length > 1) {
      const activeEmployees = store.employees.filter(e => e.isActive);
      insights.push({
        type: 'info',
        title: 'Tim Karyawan',
        message: `${activeEmployees.length} karyawan aktif`,
        action: 'Review performa karyawan secara berkala untuk motivasi',
        priority: 2,
      });
    }

    // 7. No sales today
    const today = new Date().toISOString().split('T')[0];
    const todaySales = store.transactions.filter(t => t.date && t.date.startsWith(today));
    if (todaySales.length === 0 && new Date().getHours() > 12) {
      insights.push({
        type: 'warning',
        title: 'Belum Ada Penjualan Hari Ini',
        message: 'Sudah siang tapi belum ada transaksi',
        action: 'Cek apakah ada masalah operasional atau promosi diperlukan',
        priority: 4,
      });
    }

    // Sort by priority (highest first)
    return insights.sort((a, b) => b.priority - a.priority);
  }

  // Generate business recommendations
  generateRecommendations(): string[] {
    const store = useStore.getState();
    const recommendations: string[] = [];

    if (!store.products || !store.transactions) {
      return recommendations;
    }

    const patterns = this.analyzeSalesPatterns(store.transactions);

    // 1. Stock management
    const lowStock = store.products.filter(p => p && p.stock <= 10);
    if (lowStock.length > 0) {
      recommendations.push(`📦 Restock ${lowStock.length} produk yang stoknya menipis`);
    }

    // 2. Peak time staffing
    if (patterns.peakHour > 0) {
      recommendations.push(`👥 Tambah kasir pada jam ${patterns.peakHour}:00 (jam tersibuk)`);
    }

    // 3. Peak day preparation
    if (patterns.peakDay !== 'Belum ada data') {
      recommendations.push(`📅 Siapkan stok ekstra setiap ${patterns.peakDay} (hari tersibuk)`);
    }

    // 4. Product bundling
    const correlations = this.findProductCorrelations(store.transactions);
    if (correlations.size > 0) {
      const topPair = Array.from(correlations.entries())[0];
      if (topPair && topPair[1].length > 0) {
        recommendations.push(`🎁 Buat bundle: ${topPair[0]} + ${topPair[1][0]}`);
      }
    }

    // 5. Slow moving products
    if (patterns.slowMovingProducts.length > 0) {
      recommendations.push(`💰 Buat promo untuk ${patterns.slowMovingProducts.length} produk yang kurang laku`);
    }

    // 6. Upselling
    if (patterns.averageTransaction > 0) {
      recommendations.push(`📈 Target tingkatkan rata-rata transaksi dari Rp ${patterns.averageTransaction.toLocaleString('id-ID')}`);
    }

    // 7. Customer loyalty
    if (store.transactions.length > 50) {
      recommendations.push(`🎯 Mulai program loyalitas untuk pelanggan setia`);
    }

    // 8. Marketing
    if (store.transactions.length < 10) {
      recommendations.push(`📱 Tingkatkan marketing: promosi di media sosial, WhatsApp, Instagram`);
    }

    return recommendations;
  }

  // Get actionable tips
  getActionableTips(): string[] {
    return [
      '💡 Letakkan produk terlaris di tempat yang mudah dijangkau',
      '💡 Tawarkan produk komplementer saat checkout (upselling)',
      '💡 Buat display menarik untuk produk baru',
      '💡 Berikan diskon untuk pembelian dalam jumlah banyak',
      '💡 Gunakan sistem poin untuk pelanggan setia',
      '💡 Promosikan produk slow-moving dengan bundle',
      '💡 Optimalkan jam buka sesuai jam ramai',
      '💡 Training karyawan untuk customer service yang baik',
      '💡 Gunakan data penjualan untuk prediksi stok',
      '💡 Buat promo khusus di hari sepi',
    ];
  }
}

export const businessInsightsService = new BusinessInsightsService();
