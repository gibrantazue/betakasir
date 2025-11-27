import { EmployeePermissions } from '../types/employee';

/**
 * DEPRECATED: File ini sudah tidak digunakan lagi.
 * Gunakan DEFAULT_PERMISSIONS dari src/types/employee.ts
 * 
 * File ini dipertahankan untuk backward compatibility.
 * Akan dihapus di versi berikutnya.
 */

/**
 * Check if employee has specific permission
 */
export const hasPermission = (
  permissions: EmployeePermissions,
  permissionKey: keyof EmployeePermissions
): boolean => {
  return permissions[permissionKey] === true;
};

/**
 * Check if employee can access cashier
 */
export const canAccessCashier = (permissions: EmployeePermissions): boolean => {
  return permissions.canAccessCashier;
};

/**
 * Check if employee can manage products
 */
export const canManageProducts = (permissions: EmployeePermissions): boolean => {
  return permissions.canManageProducts;
};

/**
 * Check if employee can delete transactions
 */
export const canDeleteTransactions = (permissions: EmployeePermissions): boolean => {
  return permissions.canDeleteTransactions;
};

/**
 * Check if employee can give discount
 */
export const canGiveDiscount = (permissions: EmployeePermissions): boolean => {
  return permissions.canGiveDiscount;
};

/**
 * Get max discount percentage for employee
 */
export const getMaxDiscountPercent = (permissions: EmployeePermissions): number => {
  return permissions.maxDiscountPercent;
};

/**
 * Permission labels untuk UI
 */
export const PERMISSION_LABELS: Record<keyof EmployeePermissions, string> = {
  canAccessCashier: 'Akses Kasir',
  canAccessProducts: 'Lihat Produk',
  canManageProducts: 'Kelola Produk (Tambah/Edit/Hapus)',
  canAccessTransactions: 'Lihat Transaksi',
  canAccessCustomers: 'Lihat Pelanggan',
  canManageCustomers: 'Kelola Pelanggan (Tambah/Edit/Hapus)',
  canAccessReports: 'Lihat Laporan',
  canAccessSettings: 'Akses Pengaturan',
  canManageEmployees: 'Kelola Karyawan',
  canDeleteTransactions: 'Hapus Transaksi',
  canGiveDiscount: 'Berikan Diskon',
  maxDiscountPercent: 'Maksimal Diskon (%)',
};

/**
 * Permission categories untuk grouping di UI
 */
export const PERMISSION_CATEGORIES = {
  cashier: {
    label: 'Kasir',
    permissions: ['canAccessCashier', 'canGiveDiscount', 'maxDiscountPercent'] as (keyof EmployeePermissions)[],
  },
  products: {
    label: 'Produk',
    permissions: ['canAccessProducts', 'canManageProducts'] as (keyof EmployeePermissions)[],
  },
  transactions: {
    label: 'Transaksi',
    permissions: ['canAccessTransactions', 'canDeleteTransactions'] as (keyof EmployeePermissions)[],
  },
  customers: {
    label: 'Pelanggan',
    permissions: ['canAccessCustomers', 'canManageCustomers'] as (keyof EmployeePermissions)[],
  },
  reports: {
    label: 'Laporan',
    permissions: ['canAccessReports'] as (keyof EmployeePermissions)[],
  },
  employees: {
    label: 'Karyawan',
    permissions: ['canManageEmployees'] as (keyof EmployeePermissions)[],
  },
  settings: {
    label: 'Pengaturan',
    permissions: ['canAccessSettings'] as (keyof EmployeePermissions)[],
  },
};
