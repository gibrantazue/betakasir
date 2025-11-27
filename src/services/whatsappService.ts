// WhatsApp Integration Service
import { WhatsAppConfig, WhatsAppMessage, DailyReport, WhatsAppCommand, WhatsAppAlert } from '../types/whatsapp';
import { DailyReportData } from '../types/reports';

class WhatsAppService {
  private config: WhatsAppConfig = {
    enabled: false,
    phoneNumber: '',
    dailyReportTime: '20:00',
    enableAlerts: true,
    enableCommands: true,
  };

  private commands: Map<string, WhatsAppCommand> = new Map();
  private alertQueue: WhatsAppAlert[] = [];

  constructor() {
    this.initializeCommands();
  }

  // Initialize available commands
  private initializeCommands() {
    this.commands.set('laporan', {
      command: 'laporan',
      description: 'Lihat laporan hari ini',
      handler: async () => this.generateDailyReportText(),
    });

    this.commands.set('stok', {
      command: 'stok [nama produk]',
      description: 'Cek stok produk',
      handler: async (productName?: string) => {
        if (!productName) {
          return '❌ Format: stok [nama produk]\nContoh: stok Aqua';
        }
        return this.checkStock(productName);
      },
    });

    this.commands.set('top', {
      command: 'top',
      description: 'Lihat top 10 produk terlaris',
      handler: async () => this.getTopProducts(),
    });

    this.commands.set('help', {
      command: 'help',
      description: 'Lihat daftar perintah',
      handler: async () => this.getHelpText(),
    });

    this.commands.set('transaksi', {
      command: 'transaksi',
      description: 'Lihat total transaksi hari ini',
      handler: async () => this.getTransactionSummary(),
    });
  }

  // Configure WhatsApp settings
  setConfig(config: Partial<WhatsAppConfig>) {
    this.config = { ...this.config, ...config };
    console.log('✅ WhatsApp config updated:', this.config);
  }

  getConfig(): WhatsAppConfig {
    return this.config;
  }

  // Send WhatsApp message
  async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    if (!this.config.enabled) {
      console.log('⚠️ WhatsApp not enabled');
      return false;
    }

    try {
      // Format WhatsApp URL
      const encodedMessage = encodeURIComponent(message.message);
      const whatsappUrl = `https://wa.me/${message.to}?text=${encodedMessage}`;

      // Open WhatsApp (web or app)
      if (typeof window !== 'undefined') {
        window.open(whatsappUrl, '_blank');
      }

      console.log('✅ WhatsApp message sent:', message.to);
      return true;
    } catch (error) {
      console.error('❌ Failed to send WhatsApp message:', error);
      return false;
    }
  }

  // Generate daily report
  async generateDailyReport(data: DailyReportData): Promise<DailyReport> {
    const today = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const summary = this.generateDailyReportText(data);

    return {
      date: today,
      revenue: data.revenue || data.totalSales,
      transactions: data.transactions || data.totalTransactions,
      topProducts: data.topProducts.map(p => ({ name: p.name, sold: p.sold || p.quantity })),
      lowStockProducts: data.lowStockProducts || [],
      summary,
    };
  }

  // Generate daily report text
  private generateDailyReportText(data?: DailyReportData): string {
    const today = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Mock data if not provided
    const revenue = data?.revenue || data?.totalSales || 2500000;
    const transactions = data?.transactions || data?.totalTransactions || 85;
    const topProducts = data?.topProducts?.map(p => ({ 
      name: p.name, 
      sold: p.sold || p.quantity 
    })) || [
      { name: 'Indomie Goreng', sold: 50 },
      { name: 'Aqua 600ml', sold: 40 },
      { name: 'Mie Sedaap', sold: 30 },
    ];
    const lowStock = data?.lowStockProducts || [
      { name: 'Indomie Goreng', stock: 5 },
      { name: 'Aqua 1500ml', stock: 3 },
    ];

    const revenueFormatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(revenue);

    let report = `📊 *LAPORAN HARIAN BETAKASIR*\n`;
    report += `${today}\n\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    report += `💰 *Pendapatan:* ${revenueFormatted}\n`;
    report += `🛒 *Transaksi:* ${transactions} transaksi\n`;
    report += `📈 *Rata-rata:* ${new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(revenue / transactions)}/transaksi\n\n`;

    report += `🏆 *TOP 3 PRODUK TERLARIS:*\n`;
    topProducts.slice(0, 3).forEach((product, index) => {
      report += `${index + 1}. ${product.name} - ${product.sold} pcs\n`;
    });

    if (lowStock.length > 0) {
      report += `\n⚠️ *STOK MENIPIS (${lowStock.length} produk):*\n`;
      lowStock.forEach((product) => {
        report += `• ${product.name} - ${product.stock} pcs\n`;
      });
    }

    report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📱 BetaKasir - Kasir Pintar Anda\n`;
    report += `\nBalas dengan *help* untuk lihat perintah lain`;

    return report;
  }

  // Send daily report via WhatsApp
  async sendDailyReport(data: DailyReportData): Promise<boolean> {
    if (!this.config.enabled || !this.config.phoneNumber) {
      console.log('⚠️ WhatsApp not configured');
      return false;
    }

    const report = await this.generateDailyReport(data);

    return this.sendMessage({
      to: this.config.phoneNumber,
      message: report.summary,
      type: 'text',
    });
  }

  // Check stock command
  private async checkStock(productName: string): Promise<string> {
    // Mock data - replace with actual database query
    const mockProducts = [
      { name: 'Aqua', stock: 25 },
      { name: 'Indomie Goreng', stock: 5 },
      { name: 'Mie Sedaap', stock: 15 },
    ];

    const product = mockProducts.find((p) =>
      p.name.toLowerCase().includes(productName.toLowerCase())
    );

    if (!product) {
      return `❌ Produk "${productName}" tidak ditemukan.\n\nCoba cek nama produk atau ketik *help* untuk bantuan.`;
    }

    let message = `📦 *STOK PRODUK*\n\n`;
    message += `Produk: *${product.name}*\n`;
    message += `Stok: *${product.stock} pcs*\n\n`;

    if (product.stock < 10) {
      message += `⚠️ Stok menipis! Perlu restock segera.`;
    } else {
      message += `✅ Stok masih aman.`;
    }

    return message;
  }

  // Get top products
  private async getTopProducts(): Promise<string> {
    // Mock data
    const topProducts = [
      { name: 'Indomie Goreng', sold: 50, revenue: 150000 },
      { name: 'Aqua 600ml', sold: 40, revenue: 140000 },
      { name: 'Mie Sedaap', sold: 30, revenue: 105000 },
      { name: 'Teh Botol', sold: 25, revenue: 87500 },
      { name: 'Kopi Kapal Api', sold: 20, revenue: 60000 },
    ];

    let message = `🏆 *TOP 5 PRODUK TERLARIS*\n`;
    message += `Hari ini\n\n`;

    topProducts.forEach((product, index) => {
      const revenueFormatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(product.revenue);

      message += `${index + 1}. *${product.name}*\n`;
      message += `   ${product.sold} pcs - ${revenueFormatted}\n\n`;
    });

    message += `Ketik *laporan* untuk lihat laporan lengkap`;

    return message;
  }

  // Get transaction summary
  private async getTransactionSummary(): Promise<string> {
    // Mock data
    const data = {
      total: 85,
      completed: 82,
      cancelled: 3,
      revenue: 2500000,
    };

    const revenueFormatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(data.revenue);

    let message = `🛒 *RINGKASAN TRANSAKSI*\n`;
    message += `Hari ini\n\n`;
    message += `Total: *${data.total} transaksi*\n`;
    message += `✅ Selesai: ${data.completed}\n`;
    message += `❌ Batal: ${data.cancelled}\n\n`;
    message += `💰 Total Pendapatan:\n`;
    message += `*${revenueFormatted}*\n\n`;
    message += `📊 Rata-rata per transaksi:\n`;
    message += `${new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(data.revenue / data.completed)}`;

    return message;
  }

  // Get help text
  private getHelpText(): string {
    let help = `📱 *PERINTAH WHATSAPP BETAKASIR*\n\n`;
    help += `Kirim perintah berikut untuk mendapatkan info:\n\n`;

    this.commands.forEach((cmd) => {
      help += `• *${cmd.command}*\n  ${cmd.description}\n\n`;
    });

    help += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    help += `Contoh penggunaan:\n`;
    help += `• laporan\n`;
    help += `• stok Aqua\n`;
    help += `• top\n`;
    help += `• transaksi\n\n`;
    help += `📱 BetaKasir - Kasir Pintar Anda`;

    return help;
  }

  // Process incoming command
  async processCommand(commandText: string): Promise<string> {
    if (!this.config.enableCommands) {
      return '⚠️ Perintah WhatsApp tidak diaktifkan.';
    }

    const parts = commandText.trim().toLowerCase().split(' ');
    const command = parts[0];
    const params = parts.slice(1).join(' ');

    const cmd = this.commands.get(command);

    if (!cmd) {
      return `❌ Perintah tidak dikenal: "${command}"\n\nKetik *help* untuk lihat daftar perintah.`;
    }

    try {
      return await cmd.handler(params);
    } catch (error) {
      console.error('Error processing command:', error);
      return '❌ Terjadi kesalahan saat memproses perintah. Silakan coba lagi.';
    }
  }

  // Send alert
  async sendAlert(alert: Omit<WhatsAppAlert, 'id' | 'timestamp' | 'sent'>): Promise<boolean> {
    if (!this.config.enableAlerts || !this.config.phoneNumber) {
      return false;
    }

    const fullAlert: WhatsAppAlert = {
      ...alert,
      id: Date.now().toString(),
      timestamp: new Date(),
      sent: false,
    };

    // Format alert message
    let emoji = '📢';
    if (alert.priority === 'critical') emoji = '🚨';
    else if (alert.priority === 'high') emoji = '⚠️';
    else if (alert.priority === 'medium') emoji = '📌';

    const message = `${emoji} *${alert.title}*\n\n${alert.message}\n\n_${new Date().toLocaleString('id-ID')}_`;

    const sent = await this.sendMessage({
      to: this.config.phoneNumber,
      message,
      type: 'text',
    });

    fullAlert.sent = sent;
    this.alertQueue.push(fullAlert);

    return sent;
  }

  // Schedule daily report
  scheduleDailyReport(callback: () => Promise<any>) {
    const [hours, minutes] = this.config.dailyReportTime.split(':').map(Number);

    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        callback().then((data) => {
          this.sendDailyReport(data);
        });
      }
    };

    // Check every minute
    setInterval(checkTime, 60000);
    console.log(`✅ Daily report scheduled at ${this.config.dailyReportTime}`);
  }

  // Get alert history
  getAlertHistory(): WhatsAppAlert[] {
    return this.alertQueue;
  }

  // Clear alert history
  clearAlertHistory() {
    this.alertQueue = [];
  }
}

export const whatsappService = new WhatsAppService();
