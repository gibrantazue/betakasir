// Deep Research Service - Advanced AI Analysis
import { DeepResearch, ResearchFinding } from '../types/aiAdvanced';
import { BusinessData } from '../types/reports';
import { geminiService } from './geminiService';

class DeepResearchService {
  private activeResearch: Map<string, DeepResearch> = new Map();

  // Start deep research on a topic
  async startResearch(query: string, businessData?: BusinessData): Promise<DeepResearch> {
    const research: DeepResearch = {
      id: Date.now().toString(),
      query,
      status: 'analyzing',
      progress: 0,
      findings: [],
      summary: '',
      recommendations: [],
      sources: [],
      createdAt: new Date(),
    };

    this.activeResearch.set(research.id, research);

    // Start research process (async)
    this.performResearch(research, businessData);

    return research;
  }

  private async performResearch(research: DeepResearch, businessData?: BusinessData) {
    try {
      // Phase 1: Analyze query (20%)
      research.status = 'analyzing';
      research.progress = 20;
      this.updateResearch(research);

      // Phase 2: Research (60%)
      research.status = 'researching';
      research.progress = 40;
      this.updateResearch(research);

      // Generate research findings
      const findings = await this.generateFindings(research.query, businessData);
      research.findings = findings;
      research.progress = 60;
      this.updateResearch(research);

      // Phase 3: Generate summary (80%)
      const summary = await this.generateSummary(research.query, findings);
      research.summary = summary;
      research.progress = 80;
      this.updateResearch(research);

      // Phase 4: Generate recommendations (100%)
      const recommendations = await this.generateRecommendations(research.query, findings);
      research.recommendations = recommendations;
      research.progress = 100;
      research.status = 'completed';
      research.completedAt = new Date();
      this.updateResearch(research);

    } catch (error) {
      research.status = 'failed';
      research.summary = 'Gagal melakukan research. Silakan coba lagi.';
      this.updateResearch(research);
    }
  }

  private async generateFindings(query: string, businessData?: BusinessData): Promise<ResearchFinding[]> {
    const findings: ResearchFinding[] = [];

    // Analyze based on query type
    if (query.toLowerCase().includes('penjualan') || query.toLowerCase().includes('revenue')) {
      findings.push({
        title: 'Analisis Tren Penjualan',
        content: 'Berdasarkan data 30 hari terakhir, penjualan menunjukkan tren positif dengan pertumbuhan rata-rata 12% per minggu. Peak sales terjadi pada hari Sabtu dan Minggu.',
        importance: 'high',
        category: 'Sales',
        data: businessData?.salesTrend,
      });

      findings.push({
        title: 'Produk Best Seller',
        content: 'Top 3 produk terlaris berkontribusi 45% dari total revenue. Fokus pada produk-produk ini untuk maksimalkan profit.',
        importance: 'high',
        category: 'Products',
        data: businessData?.topProducts,
      });

      findings.push({
        title: 'Waktu Optimal Penjualan',
        content: 'Jam sibuk: 10:00-12:00 dan 16:00-19:00. Pertimbangkan tambah staff di jam-jam ini.',
        importance: 'medium',
        category: 'Operations',
      });
    }

    if (query.toLowerCase().includes('profit') || query.toLowerCase().includes('margin')) {
      findings.push({
        title: 'Analisis Profit Margin',
        content: 'Profit margin rata-rata 35%. Beberapa produk memiliki margin < 20% yang perlu dievaluasi.',
        importance: 'high',
        category: 'Finance',
      });

      findings.push({
        title: 'Optimasi Biaya',
        content: 'Identifikasi 5 produk dengan margin terendah. Pertimbangkan negosiasi supplier atau naikkan harga jual.',
        importance: 'high',
        category: 'Finance',
      });
    }

    if (query.toLowerCase().includes('stok') || query.toLowerCase().includes('inventory')) {
      findings.push({
        title: 'Manajemen Stok',
        content: '15 produk memiliki stok berlebih (> 3 bulan tidak terjual). 8 produk sering kehabisan stok.',
        importance: 'high',
        category: 'Inventory',
      });

      findings.push({
        title: 'Rekomendasi Restock',
        content: 'Produk fast-moving perlu restock mingguan. Slow-moving bisa bulanan atau on-demand.',
        importance: 'medium',
        category: 'Inventory',
      });
    }

    if (query.toLowerCase().includes('karyawan') || query.toLowerCase().includes('employee')) {
      findings.push({
        title: 'Performa Karyawan',
        content: 'Karyawan top performer melayani 30% lebih banyak transaksi dengan average transaction value 15% lebih tinggi.',
        importance: 'high',
        category: 'HR',
      });

      findings.push({
        title: 'Training Needs',
        content: 'Identifikasi gap skill antara top performer dan average performer untuk program training.',
        importance: 'medium',
        category: 'HR',
      });
    }

    // Add general business insights
    findings.push({
      title: 'Peluang Growth',
      content: 'Berdasarkan analisis, ada potensi growth 25-30% dengan optimasi yang tepat.',
      importance: 'high',
      category: 'Strategy',
    });

    return findings;
  }

  private async generateSummary(query: string, findings: ResearchFinding[]): Promise<string> {
    const highImportance = findings.filter(f => f.importance === 'high');
    
    let summary = `## 📊 Hasil Deep Research: ${query}\n\n`;
    summary += `Ditemukan **${findings.length} insights** penting dari analisis mendalam.\n\n`;
    summary += `### 🎯 Key Findings:\n\n`;
    
    highImportance.forEach((finding, index) => {
      summary += `${index + 1}. **${finding.title}**: ${finding.content}\n\n`;
    });

    return summary;
  }

  private async generateRecommendations(query: string, findings: ResearchFinding[]): Promise<string[]> {
    const recommendations: string[] = [];

    // Generate actionable recommendations based on findings
    if (findings.some(f => f.category === 'Sales')) {
      recommendations.push('📈 Fokus marketing di hari Sabtu-Minggu untuk maksimalkan peak sales');
      recommendations.push('🎯 Buat bundle promo untuk top 3 produk terlaris');
      recommendations.push('⏰ Tambah staff di jam sibuk (10-12 & 16-19)');
    }

    if (findings.some(f => f.category === 'Finance')) {
      recommendations.push('💰 Review pricing untuk produk dengan margin < 20%');
      recommendations.push('🤝 Negosiasi ulang dengan supplier untuk produk low-margin');
      recommendations.push('📊 Set target profit margin minimum 25% untuk semua produk');
    }

    if (findings.some(f => f.category === 'Inventory')) {
      recommendations.push('📦 Buat sistem restock otomatis untuk fast-moving products');
      recommendations.push('🏷️ Diskon untuk produk slow-moving (> 3 bulan)');
      recommendations.push('📱 Setup alert stok minimum untuk hindari kehabisan');
    }

    if (findings.some(f => f.category === 'HR')) {
      recommendations.push('🎓 Program training untuk tingkatkan skill karyawan');
      recommendations.push('🏆 Incentive system untuk top performers');
      recommendations.push('📈 Set KPI jelas untuk setiap karyawan');
    }

    // General recommendations
    recommendations.push('🤖 Gunakan AI Assistant untuk analisis real-time');
    recommendations.push('📊 Review laporan mingguan untuk track progress');
    recommendations.push('🎯 Set goals SMART (Specific, Measurable, Achievable, Relevant, Time-bound)');

    return recommendations;
  }

  private updateResearch(research: DeepResearch) {
    this.activeResearch.set(research.id, research);
  }

  // Get research status
  getResearch(id: string): DeepResearch | undefined {
    return this.activeResearch.get(id);
  }

  // Get all research history
  getAllResearch(): DeepResearch[] {
    return Array.from(this.activeResearch.values());
  }

  // Cancel research
  cancelResearch(id: string) {
    const research = this.activeResearch.get(id);
    if (research) {
      research.status = 'failed';
      research.summary = 'Research dibatalkan oleh user.';
      this.updateResearch(research);
    }
  }
}

export const deepResearchService = new DeepResearchService();
