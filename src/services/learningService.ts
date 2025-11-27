// Learning Service - Integrated Learning System
import { LearningModule, Lesson, InteractiveTutorial, TutorialStep } from '../types/aiAdvanced';

class LearningService {
  private modules: Map<string, LearningModule> = new Map();
  private tutorials: Map<string, InteractiveTutorial> = new Map();

  constructor() {
    this.initializeModules();
    this.initializeTutorials();
  }

  private initializeModules() {
    const modules: LearningModule[] = [
      {
        id: 'kasir-101',
        title: 'Kasir 101: Dasar-Dasar Kasir',
        description: 'Pelajari cara mengoperasikan kasir dengan cepat dan efisien',
        category: 'kasir',
        difficulty: 'pemula',
        progress: 0,
        estimatedTime: 30,
        lessons: [
          {
            id: 'lesson-1',
            title: 'Pengenalan Interface Kasir',
            content: `# Pengenalan Interface Kasir

## Layout Utama
- **Search Bar**: Untuk cari produk
- **Cart**: Daftar produk yang akan dibeli
- **Total**: Total harga yang harus dibayar
- **Actions**: Tombol-tombol aksi

## Shortcut Keyboard
- **F2**: Fokus ke search bar
- **F3**: Scan barcode
- **F8**: Proses pembayaran
- **F9**: Pembayaran tunai
- **Ctrl+S**: Selesaikan transaksi

## Tips
✅ Gunakan shortcut untuk lebih cepat
✅ Target: < 20 detik per transaksi
✅ Selalu cek total sebelum pembayaran`,
            type: 'text',
            duration: 10,
            completed: false,
          },
          {
            id: 'lesson-2',
            title: 'Cara Scan Barcode',
            content: `# Cara Scan Barcode

## Metode 1: Kamera (F3)
1. Tekan **F3** untuk buka kamera
2. Arahkan ke barcode
3. Tunggu auto-detect
4. Produk otomatis masuk cart

## Metode 2: Hardware Scanner
1. Fokus ke search bar (F2)
2. Scan dengan scanner USB/Bluetooth
3. Produk otomatis masuk cart

## Troubleshooting
❌ Barcode tidak terbaca?
- Pastikan pencahayaan cukup
- Barcode tidak rusak/kotor
- Jarak 10-20cm dari kamera

✅ Support format:
- EAN13, EAN8
- Code128, Code39
- QR Code`,
            type: 'text',
            duration: 10,
            completed: false,
          },
          {
            id: 'lesson-3',
            title: 'Proses Pembayaran',
            content: `# Proses Pembayaran

## Langkah-Langkah
1. Pastikan semua produk sudah di cart
2. Cek total harga
3. Tekan **F8** untuk pembayaran
4. Input jumlah uang yang dibayar
5. Sistem hitung kembalian otomatis
6. Tekan **Ctrl+S** untuk selesai
7. Struk auto-print (jika ada printer)

## Pembayaran Cepat
Untuk pembayaran tunai pas:
- Tekan **F9** langsung selesai!

## Tips
✅ Selalu konfirmasi jumlah uang
✅ Hitung kembalian dengan benar
✅ Berikan struk ke pelanggan`,
            type: 'text',
            duration: 10,
            completed: false,
          },
        ],
      },
      {
        id: 'produk-management',
        title: 'Manajemen Produk Efektif',
        description: 'Kelola produk dan stok dengan optimal',
        category: 'produk',
        difficulty: 'menengah',
        progress: 0,
        estimatedTime: 45,
        lessons: [
          {
            id: 'lesson-1',
            title: 'Menambah Produk Baru',
            content: `# Menambah Produk Baru

## Informasi Wajib
- **Nama Produk**: Jelas dan deskriptif
- **Barcode**: Unique identifier
- **HPP**: Harga Pokok Penjualan
- **Harga Jual**: Harga untuk customer
- **Stok**: Jumlah tersedia

## Informasi Opsional
- Kategori
- Deskripsi
- Gambar produk
- Minimum stok

## Best Practices
✅ Gunakan nama yang mudah dicari
✅ Set HPP dengan akurat
✅ Profit margin minimal 20-30%
✅ Set minimum stok untuk alert`,
            type: 'text',
            duration: 15,
            completed: false,
          },
          {
            id: 'lesson-2',
            title: 'Strategi Pricing',
            content: `# Strategi Pricing

## Rumus Dasar
**Harga Jual = HPP + (HPP × Margin%)**

Contoh:
- HPP: Rp 10.000
- Target margin: 30%
- Harga Jual: Rp 10.000 + (Rp 10.000 × 30%) = Rp 13.000

## Strategi Pricing
1. **Cost-Plus**: HPP + margin tetap
2. **Competitive**: Ikuti harga pasar
3. **Value-Based**: Sesuai perceived value
4. **Psychological**: Rp 9.999 vs Rp 10.000

## Tips
✅ Review pricing setiap 3 bulan
✅ Bandingkan dengan kompetitor
✅ Pertimbangkan volume penjualan
✅ Jangan terlalu murah atau mahal`,
            type: 'text',
            duration: 15,
            completed: false,
          },
          {
            id: 'lesson-3',
            title: 'Manajemen Stok',
            content: `# Manajemen Stok

## Prinsip Dasar
- **Fast-Moving**: Restock sering
- **Slow-Moving**: Restock jarang
- **Dead Stock**: Diskon/hapus

## Sistem Restock
1. Set minimum stok per produk
2. Alert otomatis saat < minimum
3. Restock sebelum habis
4. Track lead time supplier

## Analisis Stok
📊 Metrics penting:
- **Turnover Rate**: Berapa kali stok habis/bulan
- **Days of Inventory**: Berapa hari stok bertahan
- **Stock-out Rate**: Seberapa sering kehabisan

## Tips
✅ Jangan overstock (biaya tinggi)
✅ Jangan understock (lost sales)
✅ Review stok mingguan
✅ Diskon untuk slow-moving`,
            type: 'text',
            duration: 15,
            completed: false,
          },
        ],
      },
      {
        id: 'bisnis-analytics',
        title: 'Business Analytics & Insights',
        description: 'Analisis data untuk keputusan bisnis yang lebih baik',
        category: 'bisnis',
        difficulty: 'lanjutan',
        progress: 0,
        estimatedTime: 60,
        lessons: [
          {
            id: 'lesson-1',
            title: 'Key Performance Indicators (KPI)',
            content: `# Key Performance Indicators

## KPI Utama
1. **Revenue**: Total pendapatan
2. **Profit Margin**: (Revenue - Cost) / Revenue
3. **Average Transaction Value**: Revenue / Jumlah Transaksi
4. **Customer Retention**: % pelanggan repeat
5. **Inventory Turnover**: Cost of Goods Sold / Average Inventory

## Cara Tracking
- Daily: Revenue, transaksi
- Weekly: Profit, top products
- Monthly: Growth rate, trends
- Quarterly: ROI, strategic goals

## Target Benchmark
✅ Profit Margin: > 25%
✅ Growth Rate: > 10% per bulan
✅ Customer Retention: > 40%
✅ Inventory Turnover: 4-6x per tahun`,
            type: 'text',
            duration: 20,
            completed: false,
          },
          {
            id: 'lesson-2',
            title: 'Data-Driven Decision Making',
            content: `# Data-Driven Decision Making

## Framework
1. **Define**: Apa yang ingin dicapai?
2. **Measure**: Data apa yang dibutuhkan?
3. **Analyze**: Apa insight dari data?
4. **Decide**: Keputusan berdasarkan data
5. **Act**: Implementasi keputusan
6. **Review**: Evaluasi hasil

## Contoh Kasus
**Problem**: Penjualan menurun
**Data**: 
- Revenue turun 15%
- Traffic sama
- Average transaction value turun

**Analysis**: 
- Customer beli lebih sedikit item
- Tidak ada upselling

**Decision**: 
- Training staff untuk upselling
- Buat bundle promo

**Result**: 
- Average transaction value naik 20%
- Revenue recovery`,
            type: 'text',
            duration: 20,
            completed: false,
          },
          {
            id: 'lesson-3',
            title: 'Forecasting & Planning',
            content: `# Forecasting & Planning

## Metode Forecasting
1. **Historical Data**: Analisis tren masa lalu
2. **Seasonal Patterns**: Pola musiman
3. **Market Trends**: Tren industri
4. **External Factors**: Event, ekonomi

## Sales Forecasting
Formula sederhana:
**Forecast = Average Sales × Growth Rate × Seasonal Factor**

Contoh:
- Average: Rp 10jt/bulan
- Growth: 10%
- Seasonal: 1.2 (peak season)
- Forecast: Rp 10jt × 1.1 × 1.2 = Rp 13.2jt

## Planning
✅ Set realistic targets
✅ Plan inventory needs
✅ Budget marketing spend
✅ Prepare for peak seasons`,
            type: 'text',
            duration: 20,
            completed: false,
          },
        ],
      },
    ];

    modules.forEach(module => {
      this.modules.set(module.id, module);
    });
  }

  private initializeTutorials() {
    const tutorials: InteractiveTutorial[] = [
      {
        id: 'first-transaction',
        title: 'Tutorial: Transaksi Pertama',
        currentStep: 0,
        completed: false,
        steps: [
          {
            id: 'step-1',
            title: 'Buka Kasir',
            description: 'Klik menu Kasir di sidebar',
            action: 'Navigate to Kasir screen',
            target: 'kasir-menu',
            hint: 'Lihat sidebar di sebelah kiri',
          },
          {
            id: 'step-2',
            title: 'Fokus Search Bar',
            description: 'Tekan F2 atau klik search bar',
            action: 'Focus search bar',
            target: 'search-bar',
            hint: 'Shortcut: F2',
          },
          {
            id: 'step-3',
            title: 'Cari Produk',
            description: 'Ketik nama produk atau scan barcode',
            action: 'Search for product',
            target: 'search-bar',
            hint: 'Ketik minimal 2 karakter',
          },
          {
            id: 'step-4',
            title: 'Tambah ke Cart',
            description: 'Klik produk atau tekan Enter',
            action: 'Add product to cart',
            target: 'product-list',
            hint: 'Produk akan masuk ke cart',
          },
          {
            id: 'step-5',
            title: 'Proses Pembayaran',
            description: 'Tekan F8 atau klik tombol Bayar',
            action: 'Open payment dialog',
            target: 'payment-button',
            hint: 'Shortcut: F8',
          },
          {
            id: 'step-6',
            title: 'Input Jumlah Bayar',
            description: 'Masukkan jumlah uang yang dibayar',
            action: 'Enter payment amount',
            target: 'payment-input',
            hint: 'Untuk tunai pas, tekan F9',
          },
          {
            id: 'step-7',
            title: 'Selesaikan Transaksi',
            description: 'Tekan Ctrl+S atau klik Selesai',
            action: 'Complete transaction',
            target: 'complete-button',
            hint: 'Struk akan auto-print',
          },
        ],
      },
    ];

    tutorials.forEach(tutorial => {
      this.tutorials.set(tutorial.id, tutorial);
    });
  }

  // Get all modules
  getAllModules(): LearningModule[] {
    return Array.from(this.modules.values());
  }

  // Get module by ID
  getModule(id: string): LearningModule | undefined {
    return this.modules.get(id);
  }

  // Get modules by category
  getModulesByCategory(category: string): LearningModule[] {
    return Array.from(this.modules.values()).filter(m => m.category === category);
  }

  // Mark lesson as completed
  completeLesson(moduleId: string, lessonId: string) {
    const module = this.modules.get(moduleId);
    if (!module) return;

    const lesson = module.lessons.find(l => l.id === lessonId);
    if (lesson) {
      lesson.completed = true;
      
      // Update module progress
      const completedLessons = module.lessons.filter(l => l.completed).length;
      module.progress = Math.round((completedLessons / module.lessons.length) * 100);
      
      this.modules.set(moduleId, module);
    }
  }

  // Get tutorial
  getTutorial(id: string): InteractiveTutorial | undefined {
    return this.tutorials.get(id);
  }

  // Next tutorial step
  nextTutorialStep(id: string) {
    const tutorial = this.tutorials.get(id);
    if (!tutorial) return;

    if (tutorial.currentStep < tutorial.steps.length - 1) {
      tutorial.currentStep++;
    } else {
      tutorial.completed = true;
    }

    this.tutorials.set(id, tutorial);
  }

  // Previous tutorial step
  previousTutorialStep(id: string) {
    const tutorial = this.tutorials.get(id);
    if (!tutorial) return;

    if (tutorial.currentStep > 0) {
      tutorial.currentStep--;
    }

    this.tutorials.set(id, tutorial);
  }

  // Reset tutorial
  resetTutorial(id: string) {
    const tutorial = this.tutorials.get(id);
    if (!tutorial) return;

    tutorial.currentStep = 0;
    tutorial.completed = false;

    this.tutorials.set(id, tutorial);
  }
}

export const learningService = new LearningService();
