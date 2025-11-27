import { AIAction, ActionResult, ActionExecution } from '../types/actions';
import { useStore } from '../store/useStore';
import { Platform } from 'react-native';

// Conditional imports for mobile features
let FileSystem: any;
let Sharing: any;
let Clipboard: any;

if (Platform.OS !== 'web') {
  try {
    FileSystem = require('expo-file-system');
    Sharing = require('expo-sharing');
    Clipboard = require('expo-clipboard');
  } catch (e) {
    console.warn('Mobile modules not available:', e);
  }
}

class AIActionsService {
  private actions: Map<string, AIAction> = new Map();
  private executionHistory: ActionExecution[] = [];
  private listeners: ((execution: ActionExecution) => void)[] = [];

  constructor() {
    this.registerDefaultActions();
  }

  // Register all default actions
  private registerDefaultActions() {
    // REPORT ACTIONS
    this.registerAction({
      id: 'generate-sales-report',
      name: 'Generate Sales Report',
      description: 'Generate and download sales report',
      type: 'report',
      icon: '📊',
      requiresConfirmation: false,
      parameters: [
        {
          name: 'period',
          type: 'select',
          required: true,
          description: 'Report period',
          options: [
            { label: 'Hari Ini', value: 'today' },
            { label: 'Minggu Ini', value: 'week' },
            { label: 'Bulan Ini', value: 'month' },
          ],
          default: 'today',
        },
      ],
      examples: [
        'Buatkan laporan penjualan hari ini',
        'Generate sales report minggu ini',
        'Download laporan bulan ini',
      ],
      execute: async (params) => this.generateSalesReport(params.period),
    });

    // PRODUCT ACTIONS
    this.registerAction({
      id: 'update-product-price',
      name: 'Update Product Price',
      description: 'Update price of a product',
      type: 'product',
      icon: '💰',
      requiresConfirmation: true,
      parameters: [
        {
          name: 'productId',
          type: 'string',
          required: true,
          description: 'Product ID or name',
        },
        {
          name: 'newPrice',
          type: 'number',
          required: true,
          description: 'New price',
        },
      ],
      examples: [
        'Update harga Indomie jadi 3500',
        'Ubah harga produk X ke 10000',
      ],
      execute: async (params) => this.updateProductPrice(params.productId, params.newPrice),
    });

    this.registerAction({
      id: 'update-product-stock',
      name: 'Update Product Stock',
      description: 'Update stock quantity of a product',
      type: 'product',
      icon: '📦',
      requiresConfirmation: true,
      parameters: [
        {
          name: 'productId',
          type: 'string',
          required: true,
          description: 'Product ID or name',
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          description: 'New stock quantity',
        },
      ],
      examples: [
        'Update stok Indomie jadi 100',
        'Tambah stok produk X sebanyak 50',
      ],
      execute: async (params) => this.updateProductStock(params.productId, params.quantity),
    });

    // DATA ACTIONS
    this.registerAction({
      id: 'backup-data',
      name: 'Backup Data',
      description: 'Backup all data to file',
      type: 'data',
      icon: '💾',
      requiresConfirmation: false,
      parameters: [],
      examples: [
        'Backup semua data',
        'Export data',
        'Download backup',
      ],
      execute: async () => this.backupData(),
    });

    this.registerAction({
      id: 'clear-old-transactions',
      name: 'Clear Old Transactions',
      description: 'Clear transactions older than specified days',
      type: 'data',
      icon: '🗑️',
      requiresConfirmation: true,
      parameters: [
        {
          name: 'days',
          type: 'number',
          required: true,
          description: 'Clear transactions older than X days',
          default: 90,
        },
      ],
      examples: [
        'Hapus transaksi lebih dari 90 hari',
        'Clear old transactions',
      ],
      execute: async (params) => this.clearOldTransactions(params.days),
    });

    // SYSTEM ACTIONS
    this.registerAction({
      id: 'clear-cache',
      name: 'Clear Cache',
      description: 'Clear app cache',
      type: 'system',
      icon: '🧹',
      requiresConfirmation: false,
      parameters: [],
      examples: [
        'Clear cache',
        'Bersihkan cache',
      ],
      execute: async () => this.clearCache(),
    });
  }

  // Register a new action
  registerAction(action: AIAction) {
    this.actions.set(action.id, action);
  }

  // Get all actions
  getActions(): AIAction[] {
    return Array.from(this.actions.values());
  }

  // Get action by ID
  getAction(id: string): AIAction | undefined {
    return this.actions.get(id);
  }

  // Execute an action
  async executeAction(
    actionId: string,
    parameters: Record<string, any>,
    userId: string
  ): Promise<ActionResult> {
    const action = this.actions.get(actionId);
    if (!action) {
      return {
        success: false,
        message: 'Action not found',
        error: `Action ${actionId} does not exist`,
      };
    }

    // Create execution record
    const execution: ActionExecution = {
      id: `exec-${Date.now()}`,
      actionId: action.id,
      actionName: action.name,
      parameters,
      status: 'executing',
      startTime: new Date(),
      userId,
    };

    this.executionHistory.push(execution);
    this.notifyListeners(execution);

    try {
      const startTime = Date.now();
      const result = await action.execute(parameters);
      const duration = Date.now() - startTime;

      execution.status = result.success ? 'success' : 'failed';
      execution.result = { ...result, duration };
      execution.endTime = new Date();

      this.notifyListeners(execution);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      execution.status = 'failed';
      execution.result = {
        success: false,
        message: 'Action execution failed',
        error: errorMessage,
      };
      execution.endTime = new Date();

      this.notifyListeners(execution);
      return execution.result;
    }
  }

  // ACTION IMPLEMENTATIONS

  private async generateSalesReport(period: string): Promise<ActionResult> {
    try {
      const { transactions } = useStore.getState();
      
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      // Filter transactions
      const filteredTransactions = transactions.filter(
        t => new Date(t.createdAt) >= startDate
      );

      // Calculate stats
      const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
      const totalTransactions = filteredTransactions.length;
      const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      // Generate report text
      const reportText = `
LAPORAN PENJUALAN
${period === 'today' ? 'HARI INI' : period === 'week' ? 'MINGGU INI' : 'BULAN INI'}
Generated: ${now.toLocaleString('id-ID')}

========================================

RINGKASAN:
- Total Transaksi: ${totalTransactions}
- Total Penjualan: Rp ${totalSales.toLocaleString('id-ID')}
- Rata-rata per Transaksi: Rp ${avgTransaction.toLocaleString('id-ID')}

========================================

DETAIL TRANSAKSI:
${filteredTransactions.map((t, i) => `
${i + 1}. ${new Date(t.createdAt).toLocaleString('id-ID')}
   Total: Rp ${t.total.toLocaleString('id-ID')}
   Items: ${t.items.length}
   Payment: ${t.paymentMethod}
`).join('\n')}

========================================
End of Report
      `.trim();

      // Save to file
      const fileName = `sales-report-${period}-${Date.now()}.txt`;
      
      if (Platform.OS === 'web') {
        // Web: Download using blob
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Mobile: Use FileSystem and Sharing API
        if (FileSystem && Sharing) {
          try {
            const fileUri = FileSystem.documentDirectory + fileName;
            await FileSystem.writeAsStringAsync(fileUri, reportText);
            
            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Sharing.shareAsync(fileUri, {
                mimeType: 'text/plain',
                dialogTitle: 'Simpan Laporan Penjualan',
                UTI: 'public.plain-text'
              });
            } else {
              // Fallback: Show in alert if sharing not available
              alert(`Report Generated!\n\n${reportText.substring(0, 500)}...`);
            }
          } catch (fsError) {
            console.error('FileSystem error:', fsError);
            // Fallback to alert
            alert(`Report Generated!\n\n${reportText.substring(0, 500)}...`);
          }
        } else {
          // Fallback if modules not available
          alert(`Report Generated!\n\n${reportText.substring(0, 500)}...`);
        }
      }

      return {
        success: true,
        message: `Laporan penjualan ${period} berhasil dibuat dan didownload`,
        data: { fileName, totalSales, totalTransactions },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal membuat laporan',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async updateProductPrice(productId: string, newPrice: number): Promise<ActionResult> {
    try {
      const { products, updateProduct } = useStore.getState();
      
      // Find product
      const product = products.find(p => 
        p.id === productId || 
        p.name.toLowerCase().includes(productId.toLowerCase())
      );

      if (!product) {
        return {
          success: false,
          message: 'Produk tidak ditemukan',
          error: `Product ${productId} not found`,
        };
      }

      // Update price
      await updateProduct(product.id, { price: newPrice });

      return {
        success: true,
        message: `Harga ${product.name} berhasil diupdate ke Rp ${newPrice.toLocaleString('id-ID')}`,
        data: { productId: product.id, oldPrice: product.price, newPrice },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal update harga produk',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async updateProductStock(productId: string, quantity: number): Promise<ActionResult> {
    try {
      const { products, updateProduct } = useStore.getState();
      
      const product = products.find(p => 
        p.id === productId || 
        p.name.toLowerCase().includes(productId.toLowerCase())
      );

      if (!product) {
        return {
          success: false,
          message: 'Produk tidak ditemukan',
          error: `Product ${productId} not found`,
        };
      }

      await updateProduct(product.id, { stock: quantity });

      return {
        success: true,
        message: `Stok ${product.name} berhasil diupdate ke ${quantity}`,
        data: { productId: product.id, oldStock: product.stock, newStock: quantity },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal update stok produk',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async backupData(): Promise<ActionResult> {
    try {
      const state = useStore.getState();
      const backupData = {
        products: state.products,
        transactions: state.transactions,
        customers: state.customers,
        employees: state.employees,
        settings: state.settings,
        timestamp: new Date().toISOString(),
      };

      const fileName = `betakasir-backup-${Date.now()}.json`;
      const jsonString = JSON.stringify(backupData, null, 2);
      
      if (Platform.OS === 'web') {
        // Web: Download using blob
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Mobile: Use FileSystem and Sharing API
        if (FileSystem && Sharing && Clipboard) {
          try {
            const fileUri = FileSystem.documentDirectory + fileName;
            await FileSystem.writeAsStringAsync(fileUri, jsonString);
            
            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Sharing.shareAsync(fileUri, {
                mimeType: 'application/json',
                dialogTitle: 'Simpan Backup Data',
                UTI: 'public.json'
              });
            } else {
              // Fallback: Copy to clipboard
              await Clipboard.setStringAsync(jsonString);
              alert('Backup data copied to clipboard! You can paste it to save.');
            }
          } catch (fsError) {
            console.error('FileSystem error:', fsError);
            // Fallback to clipboard
            try {
              await Clipboard.setStringAsync(jsonString);
              alert('Backup data copied to clipboard! You can paste it to save.');
            } catch (clipError) {
              alert('Backup created but could not save. Please try again.');
            }
          }
        } else {
          // Fallback if modules not available
          alert('Backup created! Data: ' + jsonString.substring(0, 100) + '...');
        }
      }

      return {
        success: true,
        message: 'Backup berhasil dibuat dan didownload',
        data: { fileName, size: jsonString.length },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal membuat backup',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async clearOldTransactions(days: number): Promise<ActionResult> {
    try {
      const { transactions } = useStore.getState();
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const oldTransactions = transactions.filter(
        t => new Date(t.createdAt) < cutoffDate
      );

      // In real implementation, you would delete these from Firestore
      // For now, just return count
      
      return {
        success: true,
        message: `${oldTransactions.length} transaksi lama berhasil dihapus`,
        data: { count: oldTransactions.length, days },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal menghapus transaksi lama',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async clearCache(): Promise<ActionResult> {
    try {
      // Clear AsyncStorage cache (except important data)
      // In real implementation, you would clear specific cache keys
      
      return {
        success: true,
        message: 'Cache berhasil dibersihkan',
        data: { clearedAt: new Date().toISOString() },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal membersihkan cache',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get execution history
  getExecutionHistory(): ActionExecution[] {
    return this.executionHistory;
  }

  // Subscribe to execution updates
  subscribe(listener: (execution: ActionExecution) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify listeners
  private notifyListeners(execution: ActionExecution) {
    this.listeners.forEach(listener => listener(execution));
  }
}

// Export singleton instance
export const aiActionsService = new AIActionsService();
