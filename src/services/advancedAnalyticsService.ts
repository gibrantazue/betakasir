import { Product, Transaction } from '../types';

// Advanced Analytics Service - Memberikan AI kemampuan analisis mendalam
export interface AnalyticsData {
  // HPP & Profit Analysis
  hpp: {
    totalCost: number;
    totalRevenue: number;
    grossProfit: number;
    grossProfitMargin: number;
    netProfit: number;
    netProfitMargin: number;
  };
  
  // Inventory Metrics
  inventory: {
    totalValue: number;
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    inventoryTurnover: number;
    daysInventoryOutstanding: number;
  };
  
  // Sales Performance
  sales: {
    totalSales: number;
    totalTransactions: number;
    averageTransactionValue: number;
    salesGrowth: number;
    bestSellingProducts: Array<{
      product: Product;
      quantity: number;
      revenue: number;
    }>;
    worstSellingProducts: Array<{
      product: Product;
      quantity: number;
      revenue: number;
    }>;
  };
  
  // Financial Ratios
  ratios: {
    roi: number; // Return on Investment
    roa: number; // Return on Assets
    currentRatio: number;
    quickRatio: number;
    debtToEquity: number;
  };
  
  // Forecasting
  forecast: {
    nextMonthSales: number;
    nextMonthProfit: number;
    trendDirection: 'up' | 'down' | 'stable';
    confidence: number;
  };
  
  // Customer Insights
  customer: {
    totalCustomers: number;
    averageOrderValue: number;
    repeatCustomerRate: number;
    customerLifetimeValue: number;
  };
}

// Calculate HPP (Harga Pokok Penjualan) & Profit
export function calculateHPP(products: Product[], transactions: Transaction[]): AnalyticsData['hpp'] {
  let totalCost = 0;
  let totalRevenue = 0;
  
  // Calculate from transactions
  transactions.forEach(transaction => {
    transaction.items.forEach(item => {
      const product = products.find(p => p.id === item.product.id);
      if (product) {
        totalCost += (product.cost || 0) * item.quantity;
        totalRevenue += item.product.price * item.quantity;
      }
    });
  });
  
  const grossProfit = totalRevenue - totalCost;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  
  // Estimate operating expenses (10% of revenue)
  const operatingExpenses = totalRevenue * 0.1;
  const netProfit = grossProfit - operatingExpenses;
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  
  return {
    totalCost,
    totalRevenue,
    grossProfit,
    grossProfitMargin,
    netProfit,
    netProfitMargin,
  };
}

// Calculate Inventory Metrics
export function calculateInventoryMetrics(products: Product[], transactions: Transaction[]): AnalyticsData['inventory'] {
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockItems = products.filter(p => p.stock < 10 && p.stock > 0).length;
  const outOfStockItems = products.filter(p => p.stock === 0).length;
  
  // Calculate inventory turnover (COGS / Average Inventory)
  const hpp = calculateHPP(products, transactions);
  const averageInventory = totalValue / 2; // Simplified
  const inventoryTurnover = averageInventory > 0 ? hpp.totalCost / averageInventory : 0;
  const daysInventoryOutstanding = inventoryTurnover > 0 ? 365 / inventoryTurnover : 0;
  
  return {
    totalValue,
    totalItems,
    lowStockItems,
    outOfStockItems,
    inventoryTurnover,
    daysInventoryOutstanding,
  };
}

// Calculate Sales Performance
export function calculateSalesPerformance(products: Product[], transactions: Transaction[]): AnalyticsData['sales'] {
  const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = transactions.length;
  const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  
  // Calculate sales growth (compare last 30 days vs previous 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const recentSales = transactions
    .filter(t => new Date(t.createdAt) >= thirtyDaysAgo)
    .reduce((sum, t) => sum + t.total, 0);
  
  const previousSales = transactions
    .filter(t => new Date(t.createdAt) >= sixtyDaysAgo && new Date(t.createdAt) < thirtyDaysAgo)
    .reduce((sum, t) => sum + t.total, 0);
  
  const salesGrowth = previousSales > 0 ? ((recentSales - previousSales) / previousSales) * 100 : 0;
  
  // Calculate best & worst selling products
  const productSales = new Map<string, { product: Product; quantity: number; revenue: number }>();
  
  transactions.forEach(transaction => {
    transaction.items.forEach(item => {
      const existing = productSales.get(item.product.id);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.product.price * item.quantity;
      } else {
        productSales.set(item.product.id, {
          product: item.product,
          quantity: item.quantity,
          revenue: item.product.price * item.quantity,
        });
      }
    });
  });
  
  const sortedProducts = Array.from(productSales.values()).sort((a, b) => b.revenue - a.revenue);
  const bestSellingProducts = sortedProducts.slice(0, 5);
  const worstSellingProducts = sortedProducts.slice(-5).reverse();
  
  return {
    totalSales,
    totalTransactions,
    averageTransactionValue,
    salesGrowth,
    bestSellingProducts,
    worstSellingProducts,
  };
}

// Calculate Financial Ratios
export function calculateFinancialRatios(products: Product[], transactions: Transaction[]): AnalyticsData['ratios'] {
  const hpp = calculateHPP(products, transactions);
  const inventory = calculateInventoryMetrics(products, transactions);
  
  // ROI (Return on Investment)
  const totalInvestment = inventory.totalValue;
  const roi = totalInvestment > 0 ? (hpp.netProfit / totalInvestment) * 100 : 0;
  
  // ROA (Return on Assets)
  const totalAssets = inventory.totalValue + hpp.totalRevenue * 0.1; // Simplified
  const roa = totalAssets > 0 ? (hpp.netProfit / totalAssets) * 100 : 0;
  
  // Current Ratio (Current Assets / Current Liabilities)
  const currentAssets = inventory.totalValue + hpp.totalRevenue * 0.2;
  const currentLiabilities = hpp.totalCost * 0.3; // Simplified
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  
  // Quick Ratio (Quick Assets / Current Liabilities)
  const quickAssets = hpp.totalRevenue * 0.2; // Cash & receivables
  const quickRatio = currentLiabilities > 0 ? quickAssets / currentLiabilities : 0;
  
  // Debt to Equity Ratio
  const totalDebt = hpp.totalCost * 0.3;
  const totalEquity = hpp.netProfit + inventory.totalValue;
  const debtToEquity = totalEquity > 0 ? totalDebt / totalEquity : 0;
  
  return {
    roi,
    roa,
    currentRatio,
    quickRatio,
    debtToEquity,
  };
}

// Forecast Future Sales & Profit
export function forecastSales(transactions: Transaction[]): AnalyticsData['forecast'] {
  if (transactions.length < 7) {
    return {
      nextMonthSales: 0,
      nextMonthProfit: 0,
      trendDirection: 'stable',
      confidence: 0,
    };
  }
  
  // Simple linear regression for forecasting
  const dailySales = new Map<string, number>();
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.createdAt).toISOString().split('T')[0];
    dailySales.set(date, (dailySales.get(date) || 0) + transaction.total);
  });
  
  const salesData = Array.from(dailySales.values());
  const n = salesData.length;
  
  // Calculate trend
  const firstHalf = salesData.slice(0, Math.floor(n / 2));
  const secondHalf = salesData.slice(Math.floor(n / 2));
  
  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const trendDirection = secondHalfAvg > firstHalfAvg * 1.1 ? 'up' : 
                        secondHalfAvg < firstHalfAvg * 0.9 ? 'down' : 'stable';
  
  // Calculate average daily sales
  const avgDailySales = salesData.reduce((a, b) => a + b, 0) / n;
  
  // Forecast next month (30 days)
  const growthRate = firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0;
  const nextMonthSales = avgDailySales * 30 * (1 + growthRate);
  const nextMonthProfit = nextMonthSales * 0.3; // Assume 30% profit margin
  
  // Confidence based on data consistency
  const variance = salesData.reduce((sum, val) => sum + Math.pow(val - avgDailySales, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = avgDailySales > 0 ? stdDev / avgDailySales : 1;
  const confidence = Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100));
  
  return {
    nextMonthSales,
    nextMonthProfit,
    trendDirection,
    confidence,
  };
}

// Calculate Customer Insights
export function calculateCustomerInsights(transactions: Transaction[]): AnalyticsData['customer'] {
  const customerTransactions = new Map<string, number[]>();
  
  transactions.forEach(transaction => {
    const customerId = transaction.customerId || 'guest';
    if (!customerTransactions.has(customerId)) {
      customerTransactions.set(customerId, []);
    }
    customerTransactions.get(customerId)!.push(transaction.total);
  });
  
  const totalCustomers = customerTransactions.size;
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const averageOrderValue = transactions.length > 0 ? totalRevenue / transactions.length : 0;
  
  // Calculate repeat customer rate
  const repeatCustomers = Array.from(customerTransactions.values()).filter(orders => orders.length > 1).length;
  const repeatCustomerRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
  
  // Calculate customer lifetime value
  const avgOrdersPerCustomer = transactions.length / totalCustomers;
  const customerLifetimeValue = averageOrderValue * avgOrdersPerCustomer * 12; // Annualized
  
  return {
    totalCustomers,
    averageOrderValue,
    repeatCustomerRate,
    customerLifetimeValue,
  };
}

// Get Complete Analytics Data
export function getCompleteAnalytics(products: Product[], transactions: Transaction[]): AnalyticsData {
  return {
    hpp: calculateHPP(products, transactions),
    inventory: calculateInventoryMetrics(products, transactions),
    sales: calculateSalesPerformance(products, transactions),
    ratios: calculateFinancialRatios(products, transactions),
    forecast: forecastSales(transactions),
    customer: calculateCustomerInsights(transactions),
  };
}

// Format analytics data for AI context
export function formatAnalyticsForAI(analytics: AnalyticsData): string {
  return `
📊 ADVANCED ANALYTICS DATA:

💰 HPP & PROFIT ANALYSIS:
- Total Cost (HPP): Rp ${analytics.hpp.totalCost.toLocaleString('id-ID')}
- Total Revenue: Rp ${analytics.hpp.totalRevenue.toLocaleString('id-ID')}
- Gross Profit: Rp ${analytics.hpp.grossProfit.toLocaleString('id-ID')}
- Gross Profit Margin: ${analytics.hpp.grossProfitMargin.toFixed(2)}%
- Net Profit: Rp ${analytics.hpp.netProfit.toLocaleString('id-ID')}
- Net Profit Margin: ${analytics.hpp.netProfitMargin.toFixed(2)}%

📦 INVENTORY METRICS:
- Total Inventory Value: Rp ${analytics.inventory.totalValue.toLocaleString('id-ID')}
- Total Items in Stock: ${analytics.inventory.totalItems}
- Low Stock Items: ${analytics.inventory.lowStockItems}
- Out of Stock Items: ${analytics.inventory.outOfStockItems}
- Inventory Turnover: ${analytics.inventory.inventoryTurnover.toFixed(2)}x
- Days Inventory Outstanding: ${analytics.inventory.daysInventoryOutstanding.toFixed(0)} days

📈 SALES PERFORMANCE:
- Total Sales: Rp ${analytics.sales.totalSales.toLocaleString('id-ID')}
- Total Transactions: ${analytics.sales.totalTransactions}
- Average Transaction Value: Rp ${analytics.sales.averageTransactionValue.toLocaleString('id-ID')}
- Sales Growth: ${analytics.sales.salesGrowth.toFixed(2)}%
- Best Selling Products: ${analytics.sales.bestSellingProducts.slice(0, 3).map(p => p.product.name).join(', ')}
- Worst Selling Products: ${analytics.sales.worstSellingProducts.slice(0, 3).map(p => p.product.name).join(', ')}

💹 FINANCIAL RATIOS:
- ROI (Return on Investment): ${analytics.ratios.roi.toFixed(2)}%
- ROA (Return on Assets): ${analytics.ratios.roa.toFixed(2)}%
- Current Ratio: ${analytics.ratios.currentRatio.toFixed(2)}
- Quick Ratio: ${analytics.ratios.quickRatio.toFixed(2)}
- Debt to Equity: ${analytics.ratios.debtToEquity.toFixed(2)}

🔮 FORECAST (Next Month):
- Predicted Sales: Rp ${analytics.forecast.nextMonthSales.toLocaleString('id-ID')}
- Predicted Profit: Rp ${analytics.forecast.nextMonthProfit.toLocaleString('id-ID')}
- Trend Direction: ${analytics.forecast.trendDirection === 'up' ? '📈 Naik' : analytics.forecast.trendDirection === 'down' ? '📉 Turun' : '➡️ Stabil'}
- Confidence Level: ${analytics.forecast.confidence.toFixed(0)}%

👥 CUSTOMER INSIGHTS:
- Total Customers: ${analytics.customer.totalCustomers}
- Average Order Value: Rp ${analytics.customer.averageOrderValue.toLocaleString('id-ID')}
- Repeat Customer Rate: ${analytics.customer.repeatCustomerRate.toFixed(2)}%
- Customer Lifetime Value: Rp ${analytics.customer.customerLifetimeValue.toLocaleString('id-ID')}
`;
}

export const advancedAnalyticsService = {
  getCompleteAnalytics,
  calculateHPP,
  calculateInventoryMetrics,
  calculateSalesPerformance,
  calculateFinancialRatios,
  forecastSales,
  calculateCustomerInsights,
  formatAnalyticsForAI,
};
