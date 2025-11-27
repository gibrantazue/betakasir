import { ProactiveAlert, AlertRule, AlertStats, AlertType, AlertCategory, AlertPriority } from '../types/alerts';
import { useStore } from '../store/useStore';

class AlertService {
  private alerts: ProactiveAlert[] = [];
  private rules: AlertRule[] = [];
  private listeners: ((alerts: ProactiveAlert[]) => void)[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultRules();
  }

  // Initialize default alert rules
  private initializeDefaultRules() {
    this.rules = [
      {
        id: 'low-stock-warning',
        name: 'Low Stock Warning',
        description: 'Alert when product stock is below minimum threshold',
        category: 'stock',
        isEnabled: true,
        checkInterval: 30,
        conditions: [{ field: 'stock', operator: 'lte', value: 5 }],
        alertTemplate: {
          type: 'warning',
          title: 'Stok Menipis!',
          message: 'Beberapa produk stoknya sudah menipis',
          priority: 'high',
        }
      },
      {
        id: 'out-of-stock-critical',
        name: 'Out of Stock Critical',
        description: 'Critical alert when products are completely out of stock',
        category: 'stock',
        isEnabled: true,
        checkInterval: 15,
        conditions: [{ field: 'stock', operator: 'eq', value: 0 }],
        alertTemplate: {
          type: 'critical',
          title: 'Produk Habis!',
          message: 'Ada produk yang stoknya habis total',
          priority: 'critical',
        }
      },
      {
        id: 'sales-drop-alert',
        name: 'Sales Drop Alert',
        description: 'Alert when daily sales drop significantly',
        category: 'sales',
        isEnabled: true,
        checkInterval: 60,
        conditions: [{ field: 'dailySales', operator: 'lt', value: 0.5, timeframe: 'today' }],
        alertTemplate: {
          type: 'warning',
          title: 'Penjualan Turun Drastis',
          message: 'Penjualan hari ini jauh di bawah rata-rata',
          priority: 'high',
        }
      },
      {
        id: 'sales-spike-opportunity',
        name: 'Sales Spike Opportunity',
        description: 'Alert when sales are unusually high',
        category: 'opportunity',
        isEnabled: true,
        checkInterval: 60,
        conditions: [{ field: 'dailySales', operator: 'gt', value: 1.5, timeframe: 'today' }],
        alertTemplate: {
          type: 'success',
          title: 'Penjualan Melonjak! 🎉',
          message: 'Penjualan hari ini sangat bagus!',
          priority: 'medium',
        }
      },
      {
        id: 'daily-summary',
        name: 'Daily Summary',
        description: 'Daily business summary notification',
        category: 'system',
        isEnabled: true,
        checkInterval: 1440,
        conditions: [],
        alertTemplate: {
          type: 'info',
          title: 'Ringkasan Harian',
          message: 'Lihat performa bisnis Anda hari ini',
          priority: 'low',
        }
      }
    ];
  }

  // Start background monitoring
  startMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Run checks every 5 minutes
    this.checkInterval = setInterval(() => {
      this.runAllChecks();
    }, 5 * 60 * 1000);

    // Run initial check after 2 seconds
    setTimeout(() => this.runAllChecks(), 2000);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Run all enabled alert checks
  async runAllChecks(): Promise<ProactiveAlert[]> {
    const newAlerts: ProactiveAlert[] = [];
    const now = new Date();

    for (const rule of this.rules) {
      if (!rule.isEnabled) continue;

      const timeSinceLastCheck = rule.lastChecked 
        ? (now.getTime() - rule.lastChecked.getTime()) / (1000 * 60)
        : Infinity;

      if (timeSinceLastCheck < rule.checkInterval) continue;

      try {
        const alerts = await this.checkRule(rule);
        newAlerts.push(...alerts);
        rule.lastChecked = now;
      } catch (error) {
        console.error(`Error checking rule ${rule.id}:`, error);
      }
    }

    if (newAlerts.length > 0) {
      this.addAlerts(newAlerts);
    }

    return newAlerts;
  }

  // Check specific rule
  private async checkRule(rule: AlertRule): Promise<ProactiveAlert[]> {
    const alerts: ProactiveAlert[] = [];

    switch (rule.id) {
      case 'low-stock-warning':
        alerts.push(...await this.checkLowStock());
        break;
      case 'out-of-stock-critical':
        alerts.push(...await this.checkOutOfStock());
        break;
      case 'sales-drop-alert':
        const salesDropAlert = await this.checkSalesDrop();
        if (salesDropAlert) alerts.push(salesDropAlert);
        break;
      case 'sales-spike-opportunity':
        const salesSpikeAlert = await this.checkSalesSpike();
        if (salesSpikeAlert) alerts.push(salesSpikeAlert);
        break;
      case 'daily-summary':
        const summaryAlert = await this.generateDailySummary();
        if (summaryAlert) alerts.push(summaryAlert);
        break;
    }

    return alerts;
  }

  // Check for low stock products
  private async checkLowStock(): Promise<ProactiveAlert[]> {
    const { products } = useStore.getState();
    const lowStockProducts = products.filter(p => p.stock <= 5 && p.stock > 0);

    if (lowStockProducts.length === 0) return [];

    const critical = lowStockProducts.filter(p => p.stock <= 2);
    const warning = lowStockProducts.filter(p => p.stock > 2 && p.stock <= 5);
    const alerts: ProactiveAlert[] = [];

    if (critical.length > 0) {
      alerts.push({
        id: `low-stock-critical-${Date.now()}`,
        type: 'critical',
        category: 'stock',
        title: `${critical.length} Produk Stok Kritis!`,
        message: `${critical.map(p => p.name).slice(0, 3).join(', ')} stoknya tinggal sedikit`,
        priority: 'critical',
        timestamp: new Date(),
        isRead: false,
        isDismissed: false,
        data: { products: critical },
        action: {
          label: 'Lihat Produk',
          type: 'navigate',
          target: 'Products',
          params: { filter: 'low-stock' }
        }
      });
    }

    if (warning.length > 0) {
      alerts.push({
        id: `low-stock-warning-${Date.now()}`,
        type: 'warning',
        category: 'stock',
        title: `${warning.length} Produk Perlu Restock`,
        message: `Stok ${warning.map(p => p.name).slice(0, 3).join(', ')} mulai menipis`,
        priority: 'medium',
        timestamp: new Date(),
        isRead: false,
        isDismissed: false,
        data: { products: warning },
        action: {
          label: 'Lihat Produk',
          type: 'navigate',
          target: 'Products'
        }
      });
    }

    return alerts;
  }

  // Check for out of stock products
  private async checkOutOfStock(): Promise<ProactiveAlert[]> {
    const { products } = useStore.getState();
    const outOfStockProducts = products.filter(p => p.stock === 0);

    if (outOfStockProducts.length === 0) return [];

    return [{
      id: `out-of-stock-${Date.now()}`,
      type: 'critical',
      category: 'stock',
      title: `${outOfStockProducts.length} Produk Habis!`,
      message: `${outOfStockProducts.map(p => p.name).slice(0, 3).join(', ')} stoknya habis total`,
      priority: 'critical',
      timestamp: new Date(),
      isRead: false,
      isDismissed: false,
      data: { products: outOfStockProducts },
      action: {
        label: 'Restock Sekarang',
        type: 'navigate',
        target: 'Products',
        params: { filter: 'out-of-stock' }
      }
    }];
  }

  // Check for sales drop
  private async checkSalesDrop(): Promise<ProactiveAlert | null> {
    const { transactions } = useStore.getState();
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todaySales = transactions
      .filter(t => new Date(t.createdAt) >= todayStart)
      .reduce((sum, t) => sum + t.total, 0);

    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekSales = transactions
      .filter(t => {
        const date = new Date(t.createdAt);
        return date >= weekAgo && date < todayStart;
      })
      .reduce((sum, t) => sum + t.total, 0);
    
    const avgDailySales = weekSales / 7;

    if (todaySales < avgDailySales * 0.5 && avgDailySales > 0) {
      return {
        id: `sales-drop-${Date.now()}`,
        type: 'warning',
        category: 'sales',
        title: 'Penjualan Turun Drastis',
        message: `Penjualan hari ini Rp ${todaySales.toLocaleString('id-ID')}, 50% lebih rendah dari rata-rata`,
        priority: 'high',
        timestamp: new Date(),
        isRead: false,
        isDismissed: false,
        data: { todaySales, avgDailySales },
        action: {
          label: 'Analisis Penjualan',
          type: 'navigate',
          target: 'Reports'
        }
      };
    }

    return null;
  }

  // Check for sales spike
  private async checkSalesSpike(): Promise<ProactiveAlert | null> {
    const { transactions } = useStore.getState();
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todaySales = transactions
      .filter(t => new Date(t.createdAt) >= todayStart)
      .reduce((sum, t) => sum + t.total, 0);

    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekSales = transactions
      .filter(t => {
        const date = new Date(t.createdAt);
        return date >= weekAgo && date < todayStart;
      })
      .reduce((sum, t) => sum + t.total, 0);
    
    const avgDailySales = weekSales / 7;

    if (todaySales > avgDailySales * 1.5 && avgDailySales > 0) {
      return {
        id: `sales-spike-${Date.now()}`,
        type: 'success',
        category: 'opportunity',
        title: 'Penjualan Melonjak! 🎉',
        message: `Luar biasa! Penjualan hari ini Rp ${todaySales.toLocaleString('id-ID')}, 50% lebih tinggi dari rata-rata!`,
        priority: 'medium',
        timestamp: new Date(),
        isRead: false,
        isDismissed: false,
        data: { todaySales, avgDailySales },
        action: {
          label: 'Lihat Detail',
          type: 'navigate',
          target: 'Reports'
        }
      };
    }

    return null;
  }

  // Generate daily summary
  private async generateDailySummary(): Promise<ProactiveAlert | null> {
    const { transactions, products } = useStore.getState();
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayTransactions = transactions.filter(t => new Date(t.createdAt) >= todayStart);
    const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const lowStockCount = products.filter(p => p.stock <= 5).length;

    return {
      id: `daily-summary-${Date.now()}`,
      type: 'info',
      category: 'system',
      title: 'Ringkasan Harian',
      message: `${todayTransactions.length} transaksi, Rp ${todaySales.toLocaleString('id-ID')} penjualan${lowStockCount > 0 ? `, ${lowStockCount} produk stok menipis` : ''}`,
      priority: 'low',
      timestamp: new Date(),
      isRead: false,
      isDismissed: false,
      data: { transactions: todayTransactions.length, sales: todaySales, lowStock: lowStockCount },
      action: {
        label: 'Lihat Laporan',
        type: 'navigate',
        target: 'Reports'
      }
    };
  }

  // Add alerts
  addAlerts(newAlerts: ProactiveAlert[]) {
    this.alerts = [...newAlerts, ...this.alerts];
    this.notifyListeners();
  }

  // Get all alerts
  getAlerts(): ProactiveAlert[] {
    return this.alerts;
  }

  // Get unread alerts
  getUnreadAlerts(): ProactiveAlert[] {
    return this.alerts.filter(a => !a.isRead && !a.isDismissed);
  }

  // Mark alert as read
  markAsRead(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      this.notifyListeners();
    }
  }

  // Dismiss alert
  dismissAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isDismissed = true;
      this.notifyListeners();
    }
  }

  // Clear all alerts
  clearAll() {
    this.alerts = [];
    this.notifyListeners();
  }

  // Get alert statistics
  getStats(): AlertStats {
    const active = this.alerts.filter(a => !a.isDismissed);
    
    return {
      total: active.length,
      unread: active.filter(a => !a.isRead).length,
      byType: {
        warning: active.filter(a => a.type === 'warning').length,
        info: active.filter(a => a.type === 'info').length,
        success: active.filter(a => a.type === 'success').length,
        opportunity: active.filter(a => a.type === 'opportunity').length,
        critical: active.filter(a => a.type === 'critical').length,
      },
      byCategory: {
        stock: active.filter(a => a.category === 'stock').length,
        sales: active.filter(a => a.category === 'sales').length,
        system: active.filter(a => a.category === 'system').length,
        opportunity: active.filter(a => a.category === 'opportunity').length,
        employee: active.filter(a => a.category === 'employee').length,
      },
      byPriority: {
        low: active.filter(a => a.priority === 'low').length,
        medium: active.filter(a => a.priority === 'medium').length,
        high: active.filter(a => a.priority === 'high').length,
        critical: active.filter(a => a.priority === 'critical').length,
      },
    };
  }

  // Subscribe to alerts
  subscribe(listener: (alerts: ProactiveAlert[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getUnreadAlerts()));
  }

  // Enable/disable rule
  setRuleEnabled(ruleId: string, enabled: boolean) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.isEnabled = enabled;
    }
  }

  // Get all rules
  getRules(): AlertRule[] {
    return this.rules;
  }
}

// Export singleton instance
export const alertService = new AlertService();
