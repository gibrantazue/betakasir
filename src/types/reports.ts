// Type definitions for reports and analytics

export interface DailyReportData {
  date: string;
  totalSales: number;
  revenue?: number;
  totalTransactions: number;
  transactions?: number;
  totalProfit: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
    sold?: number;
  }>;
  lowStockProducts?: Array<{
    name: string;
    stock: number;
  }>;
  paymentMethods: Record<string, number>;
  employeePerformance?: Array<{
    name: string;
    transactions: number;
    sales: number;
  }>;
}

export interface SalesReportParams {
  period: 'today' | 'week' | 'month' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

export interface ReportGenerationResult {
  success: boolean;
  fileName?: string;
  fileUri?: string;
  data?: DailyReportData;
  error?: string;
}

export interface DiagramData {
  nodes?: Array<{ id: string; label: string; type?: string }>;
  edges?: Array<{ from: string; to: string; label?: string }>;
  timeline?: Array<{ date: string; event: string }>;
  hierarchy?: Record<string, string[]>;
  values?: Record<string, number>;
}

export interface BusinessData {
  revenue: number;
  expenses: number;
  profit: number;
  netProfit?: number;
  transactions: number;
  totalTransactions?: number;
  customers: number;
  products: number;
  todayRevenue?: number;
  hpp?: number;
  operational?: number;
  salesTrend?: Array<{ date: string; value: number }>;
  weeklyTrend?: Array<{ date: string; value: number }>;
  topProducts?: Array<{ name: string; sales: number; sold?: number }>;
  trends?: Array<{ date: string; value: number }>;
}
