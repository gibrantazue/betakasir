import { QuickAction, QuickActionCategory } from '../types/quickActions';

// All available quick actions
export const allQuickActions: QuickAction[] = [
  // Sales & Revenue
  {
    id: 'sales-today',
    icon: '💰',
    label: 'Penjualan Hari Ini',
    prompt: 'Berapa total penjualan hari ini? Berikan breakdown per metode pembayaran.',
    category: 'sales',
    requiresData: true,
  },
  {
    id: 'sales-week',
    icon: '📈',
    label: 'Penjualan Minggu Ini',
    prompt: 'Analisis penjualan 7 hari terakhir dan berikan insight tren.',
    category: 'sales',
    requiresData: true,
  },
  {
    id: 'profit-margin',
    icon: '💹',
    label: 'Profit Margin',
    prompt: 'Hitung profit margin saya dan bandingkan dengan bulan lalu.',
    category: 'sales',
    requiresData: true,
  },
  
  // Products
  {
    id: 'top-products',
    icon: '🏆',
    label: 'Produk Terlaris',
    prompt: 'Tampilkan 10 produk terlaris bulan ini dengan detail penjualan.',
    category: 'products',
    requiresData: true,
  },
  {
    id: 'low-stock',
    icon: '📦',
    label: 'Stok Menipis',
    prompt: 'Produk mana saja yang stoknya menipis dan perlu restock?',
    category: 'products',
    requiresData: true,
  },
  {
    id: 'slow-moving',
    icon: '🐌',
    label: 'Produk Slow Moving',
    prompt: 'Identifikasi produk yang kurang laku dan berikan rekomendasi.',
    category: 'products',
    requiresData: true,
  },
  
  // Employees
  {
    id: 'employee-performance',
    icon: '👥',
    label: 'Performa Karyawan',
    prompt: 'Ranking performa karyawan bulan ini berdasarkan transaksi.',
    category: 'employees',
    requiresData: true,
  },
  
  // Business Insights
  {
    id: 'swot-analysis',
    icon: '🎯',
    label: 'SWOT Analysis',
    prompt: 'Buatkan SWOT analysis lengkap untuk bisnis saya.',
    category: 'insights',
    requiresData: true,
  },
  {
    id: 'tips-increase-sales',
    icon: '💡',
    label: 'Tips Tingkatkan Penjualan',
    prompt: 'Berikan 5 tips actionable untuk meningkatkan penjualan berdasarkan data saya.',
    category: 'insights',
    requiresData: true,
  },
  {
    id: 'pricing-strategy',
    icon: '🏷️',
    label: 'Strategi Pricing',
    prompt: 'Analisis pricing strategy saya dan berikan rekomendasi optimasi.',
    category: 'insights',
    requiresData: true,
  },
  
  // Help & Guide
  {
    id: 'how-to-scan',
    icon: '📷',
    label: 'Cara Scan Barcode',
    prompt: 'Bagaimana cara menggunakan barcode scanner di BetaKasir?',
    category: 'help',
    requiresData: false,
  },
  {
    id: 'how-to-print',
    icon: '🖨️',
    label: 'Cara Cetak Struk',
    prompt: 'Bagaimana cara setup dan cetak struk di BetaKasir?',
    category: 'help',
    requiresData: false,
  },
];

// Get quick actions based on context
export function getQuickActionsForScreen(screen: string): QuickAction[] {
  switch (screen) {
    case 'Home':
      return allQuickActions.filter(a => 
        ['sales-today', 'top-products', 'tips-increase-sales', 'swot-analysis', 'sales-week', 'profit-margin', 'low-stock', 'pricing-strategy'].includes(a.id)
      );
    
    case 'Products':
      return allQuickActions.filter(a => 
        ['top-products', 'low-stock', 'slow-moving', 'pricing-strategy', 'sales-today', 'tips-increase-sales', 'how-to-scan', 'how-to-print'].includes(a.id)
      );
    
    case 'Transactions':
      return allQuickActions.filter(a => 
        ['sales-today', 'sales-week', 'profit-margin', 'top-products', 'swot-analysis', 'tips-increase-sales', 'employee-performance', 'how-to-print'].includes(a.id)
      );
    
    case 'Employees':
      return allQuickActions.filter(a => 
        ['employee-performance', 'sales-today', 'top-products', 'tips-increase-sales', 'swot-analysis', 'profit-margin', 'how-to-scan', 'how-to-print'].includes(a.id)
      );
    
    case 'Reports':
      return allQuickActions.filter(a => 
        ['sales-week', 'profit-margin', 'swot-analysis', 'tips-increase-sales', 'sales-today', 'top-products', 'low-stock', 'employee-performance'].includes(a.id)
      );
    
    default:
      // Default quick actions for any screen - show 8 buttons
      return allQuickActions.filter(a => 
        ['sales-today', 'top-products', 'tips-increase-sales', 'how-to-scan', 'sales-week', 'swot-analysis', 'low-stock', 'how-to-print'].includes(a.id)
      );
  }
}

// Get quick actions by category
export function getQuickActionsByCategory(category: QuickActionCategory): QuickAction[] {
  return allQuickActions.filter(a => a.category === category);
}

// Search quick actions
export function searchQuickActions(query: string): QuickAction[] {
  const lowerQuery = query.toLowerCase();
  return allQuickActions.filter(a => 
    a.label.toLowerCase().includes(lowerQuery) ||
    a.prompt.toLowerCase().includes(lowerQuery)
  );
}

export const quickActionsService = {
  allQuickActions,
  getQuickActionsForScreen,
  getQuickActionsByCategory,
  searchQuickActions,
};
