// Diagram & Infographic Generation Service
import { Diagram, DiagramType, Infographic } from '../types/aiAdvanced';

import { DiagramData, BusinessData } from '../types/reports';

class DiagramService {
  // Generate Mermaid diagram code
  generateMermaidDiagram(type: DiagramType, data: DiagramData): string {
    switch (type) {
      case 'flowchart':
        return this.generateFlowchart(data);
      case 'mindmap':
        return this.generateMindmap(data);
      case 'timeline':
        return this.generateTimeline(data);
      case 'orgchart':
        return this.generateOrgChart(data);
      default:
        return '';
    }
  }

  private generateFlowchart(data: DiagramData): string {
    // Example: Sales process flowchart
    return `
graph TD
    A[Pelanggan Datang] --> B{Sudah Tahu Produk?}
    B -->|Ya| C[Scan/Input Produk]
    B -->|Tidak| D[Tanya Kasir]
    D --> C
    C --> E[Tambah ke Cart]
    E --> F{Tambah Lagi?}
    F -->|Ya| C
    F -->|Tidak| G[Proses Pembayaran]
    G --> H[Cetak Struk]
    H --> I[Selesai]
    
    style A fill:#DC143C,color:#fff
    style I fill:#28a745,color:#fff
    style G fill:#ffc107,color:#000
`;
  }

  private generateMindmap(data: DiagramData): string {
    return `
mindmap
  root((BetaKasir))
    Kasir
      Scan Barcode
      Input Manual
      Pembayaran
      Cetak Struk
    Produk
      Tambah Produk
      Edit Stok
      Kategori
      Harga
    Karyawan
      Tambah Karyawan
      Role & Permission
      QR Login
      Performa
    Laporan
      Pendapatan
      Profit
      Top Produk
      Grafik
`;
  }

  private generateTimeline(data: DiagramData): string {
    return `
timeline
    title Perjalanan Bisnis Anda
    2024-01 : Mulai Usaha : 10 Produk
    2024-03 : Ekspansi : 50 Produk : 2 Karyawan
    2024-06 : Growth : 100 Produk : 5 Karyawan
    2024-12 : Scale Up : 200+ Produk : 10 Karyawan
`;
  }

  private generateOrgChart(data: DiagramData): string {
    return `
graph TD
    A[Owner/Admin] --> B[Manager]
    A --> C[Manager]
    B --> D[Kasir 1]
    B --> E[Kasir 2]
    C --> F[Kasir 3]
    C --> G[Kasir 4]
    
    style A fill:#DC143C,color:#fff
    style B fill:#ffc107,color:#000
    style C fill:#ffc107,color:#000
`;
  }

  // Generate business infographic
  generateBusinessInfographic(businessData: BusinessData): Infographic {
    return {
      id: Date.now().toString(),
      title: 'Ringkasan Bisnis Anda',
      style: 'modern',
      sections: [
        {
          type: 'stat',
          title: 'Pendapatan Hari Ini',
          data: {
            value: businessData.todayRevenue || 0,
            change: '+15%',
            trend: 'up',
          },
          icon: '💰',
          color: '#28a745',
        },
        {
          type: 'stat',
          title: 'Total Transaksi',
          data: {
            value: businessData.totalTransactions || 0,
            change: '+8%',
            trend: 'up',
          },
          icon: '🛒',
          color: '#DC143C',
        },
        {
          type: 'comparison',
          title: 'Top 3 Produk Terlaris',
          data: businessData.topProducts || [],
          icon: '🏆',
          color: '#ffc107',
        },
        {
          type: 'timeline',
          title: 'Tren 7 Hari Terakhir',
          data: businessData.weeklyTrend || [],
          icon: '📈',
          color: '#17a2b8',
        },
      ],
      createdAt: new Date(),
    };
  }

  // Generate sales funnel diagram
  generateSalesFunnel(data: DiagramData): string {
    return `
graph TD
    A[Pengunjung: 1000] --> B[Lihat Produk: 800]
    B --> C[Tambah ke Cart: 500]
    C --> D[Checkout: 300]
    D --> E[Pembayaran: 250]
    
    style A fill:#e3f2fd
    style B fill:#bbdefb
    style C fill:#90caf9
    style D fill:#42a5f5
    style E fill:#1976d2,color:#fff
`;
  }

  // Generate product comparison chart
  generateProductComparison(products: Array<{ name: string; price: number; sales: number; sold?: number }>): Diagram {
    return {
      id: Date.now().toString(),
      type: 'bar',
      title: 'Perbandingan Penjualan Produk',
      data: {
        labels: products.map(p => p.name),
        datasets: [{
          label: 'Terjual',
          data: products.map(p => p.sold),
          backgroundColor: '#DC143C',
        }],
      },
      createdAt: new Date(),
    };
  }

  // Generate profit margin visualization
  generateProfitMarginChart(data: BusinessData): Diagram {
    return {
      id: Date.now().toString(),
      type: 'pie',
      title: 'Breakdown Profit Margin',
      data: {
        labels: ['HPP', 'Operasional', 'Profit Bersih'],
        datasets: [{
          data: [data.hpp, data.operational, data.netProfit],
          backgroundColor: ['#DC143C', '#ffc107', '#28a745'],
        }],
      },
      createdAt: new Date(),
    };
  }
}

export const diagramService = new DiagramService();
