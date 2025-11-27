export interface Product {
  id: string;
  name: string;
  barcode?: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  cost: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  discount: number;
  tax: number;
  paymentMethod: 'cash' | 'transfer' | 'ewallet' | 'card';
  cashReceived?: number;
  change?: number;
  customerId?: string;
  cashierId: string;
  createdAt: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
  createdAt: string;
}

export interface DailySales {
  date: string;
  totalSales: number;
  totalTransactions: number;
  totalProfit: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface Settings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxRate: number;
  currency: string;
  receiptFooter: string;
  receiptNote: string;
  receiptWebsite: string;
}
