// Subscription Types untuk sistem billing

export type PlanType = 'free' | 'standard' | 'pro';

export interface PlanFeatures {
  // Limits
  maxProducts: number; // -1 = unlimited
  maxEmployees: number; // -1 = unlimited
  maxTransactionsPerMonth: number; // -1 = unlimited
  maxLocations: number; // jumlah toko/cabang (belum diimplementasi, default 1)
  
  // Features (Yang Sudah Ada)
  hasRealtimeSync: boolean; // ✅ Sudah ada
  hasAdvancedReports: boolean; // ✅ Sudah ada
  hasAIAssistant: boolean; // ✅ Sudah ada
  hasAdvancedPermissions: boolean; // ✅ Sudah ada
  hasBarcodeScanner: boolean; // ✅ Sudah ada
  
  // Employee Features (Yang Sudah Ada)
  canManageEmployees: boolean; // ✅ Tambah/edit/hapus karyawan (Pro only)
  canPrintEmployeeCards: boolean; // ✅ Sudah ada
  canUseQRLogin: boolean; // ✅ Sudah ada
  
  // Transaction Features (Yang Sudah Ada)
  canExportTransactions: boolean; // ✅ Sudah ada
  canDeleteTransactions: boolean; // ✅ Sudah ada
  hasReceiptCustomization: boolean; // ✅ Sudah ada
}

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  displayName: string;
  description: string;
  price: number; // dalam IDR per bulan
  yearlyPrice: number; // harga per tahun (biasanya diskon)
  features: PlanFeatures;
  popular?: boolean; // untuk highlight plan yang paling populer
  color: string; // warna untuk UI
}

export interface UserSubscription {
  userId: string;
  planType: PlanType;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod?: 'credit_card' | 'bank_transfer' | 'e_wallet';
  lastPaymentDate?: string;
  nextBillingDate?: string;
  trialEndsAt?: string; // untuk free trial
}

// Plan Definitions
export const SUBSCRIPTION_PLANS: Record<PlanType, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'free',
    displayName: 'Free Trial',
    description: 'Coba gratis 7 hari untuk usaha kecil',
    price: 0,
    yearlyPrice: 0,
    color: '#6B7280',
    features: {
      maxProducts: 50,
      maxEmployees: 2, // 2 karyawan tapi tidak bisa manage
      maxTransactionsPerMonth: 100,
      maxLocations: 1,
      hasRealtimeSync: false,
      hasAdvancedReports: false,
      hasAIAssistant: false,
      hasAdvancedPermissions: false,
      hasBarcodeScanner: true,
      canManageEmployees: false, // ❌ Free tidak bisa manage employees (fitur tidak muncul)
      canPrintEmployeeCards: false, // ❌ Free tidak bisa cetak ID card
      canUseQRLogin: false, // ❌ Free tidak bisa QR login
      canExportTransactions: false,
      canDeleteTransactions: false,
      hasReceiptCustomization: false,
    },
  },
  standard: {
    id: 'standard',
    name: 'standard',
    displayName: 'Standard',
    description: 'Untuk usaha menengah yang sedang berkembang',
    price: 200000, // Rp 200.000/bulan
    yearlyPrice: 2160000, // Rp 2.160.000/tahun (hemat 10%)
    color: '#3B82F6',
    popular: true,
    features: {
      maxProducts: 500,
      maxEmployees: 5, // ✅ Maksimal 5 karyawan
      maxTransactionsPerMonth: 1000,
      maxLocations: 1,
      hasRealtimeSync: true,
      hasAdvancedReports: true,
      hasAIAssistant: true,
      hasAdvancedPermissions: true,
      hasBarcodeScanner: true,
      canManageEmployees: true, // ✅ Standard bisa manage employees (maks 5)
      canPrintEmployeeCards: true,
      canUseQRLogin: true,
      canExportTransactions: true,
      canDeleteTransactions: true,
      hasReceiptCustomization: true,
    },
  },
  pro: {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    description: 'Untuk bisnis besar dengan kebutuhan lengkap',
    price: 800000, // Rp 800.000/bulan
    yearlyPrice: 8640000, // Rp 8.640.000/tahun (hemat 10%)
    color: '#8B5CF6',
    features: {
      maxProducts: -1, // unlimited
      maxEmployees: -1, // unlimited
      maxTransactionsPerMonth: -1, // unlimited
      maxLocations: -1, // unlimited
      hasRealtimeSync: true,
      hasAdvancedReports: true,
      hasAIAssistant: true,
      hasAdvancedPermissions: true,
      hasBarcodeScanner: true,
      canManageEmployees: true, // ✅ Pro bisa manage employees
      canPrintEmployeeCards: true,
      canUseQRLogin: true,
      canExportTransactions: true,
      canDeleteTransactions: true,
      hasReceiptCustomization: true,
    },
  },
};

// Helper functions
export const getPlanFeatures = (planType: PlanType): PlanFeatures => {
  // Fallback to 'pro' if plan not found (for old 'business' data)
  const plan = SUBSCRIPTION_PLANS[planType] || SUBSCRIPTION_PLANS['pro'];
  return plan.features;
};

export const canAccessFeature = (
  userPlan: PlanType,
  featureKey: keyof PlanFeatures
): boolean => {
  const features = getPlanFeatures(userPlan);
  return features[featureKey] as boolean;
};

export const checkLimit = (
  userPlan: PlanType,
  limitKey: 'maxProducts' | 'maxEmployees' | 'maxTransactionsPerMonth' | 'maxLocations',
  currentCount: number
): { allowed: boolean; limit: number; remaining: number } => {
  const features = getPlanFeatures(userPlan);
  const limit = features[limitKey] as number;
  
  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1 };
  }
  
  return {
    allowed: currentCount < limit,
    limit,
    remaining: Math.max(0, limit - currentCount),
  };
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export const calculateYearlySavings = (monthlyPrice: number, yearlyPrice: number): number => {
  return (monthlyPrice * 12) - yearlyPrice;
};
