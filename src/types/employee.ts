// Employee Types untuk sistem manajemen karyawan

export type EmployeeRole = 'seller' | 'cashier' | 'admin';

export interface EmployeePermissions {
  canAccessCashier: boolean;
  canAccessProducts: boolean;
  canManageProducts: boolean; // Create, edit, delete products
  canAccessTransactions: boolean;
  canAccessCustomers: boolean;
  canManageCustomers: boolean; // Create, edit, delete customers
  canAccessReports: boolean;
  canAccessSettings: boolean;
  canManageEmployees: boolean;
  canDeleteTransactions: boolean;
  canGiveDiscount: boolean;
  maxDiscountPercent: number;
}

export interface Employee {
  id: string;
  employeeId: string; // ID unik untuk scan (misal: EMP001)
  name: string;
  email?: string;
  phone: string;
  role: EmployeeRole;
  permissions: EmployeePermissions;
  username: string; // untuk login
  password: string; // hashed password
  photo?: string; // URL foto untuk ID card
  address?: string;
  joinDate: string;
  isActive: boolean;
  createdBy: string; // seller ID yang buat
  createdAt: string;
  lastLogin?: string;
}

export interface EmployeeSession {
  employeeId: string;
  employee: Employee;
  sellerUID: string; // UID seller yang punya karyawan ini
  loginTime: string;
  loginMethod: 'scan' | 'manual'; // scan ID card atau input username/password
}

// Default permissions berdasarkan role
export const DEFAULT_PERMISSIONS: Record<EmployeeRole, EmployeePermissions> = {
  seller: {
    canAccessCashier: true,
    canAccessProducts: true,
    canManageProducts: true,
    canAccessTransactions: true,
    canAccessCustomers: true,
    canManageCustomers: true,
    canAccessReports: true,
    canAccessSettings: true,
    canManageEmployees: true,
    canDeleteTransactions: true,
    canGiveDiscount: true,
    maxDiscountPercent: 100,
  },
  admin: {
    canAccessCashier: true,
    canAccessProducts: true,
    canManageProducts: true,
    canAccessTransactions: true,
    canAccessCustomers: true,
    canManageCustomers: true,
    canAccessReports: true,
    canAccessSettings: false, // Admin tidak bisa ubah settings
    canManageEmployees: false, // Admin tidak bisa manage karyawan
    canDeleteTransactions: true,
    canGiveDiscount: true,
    maxDiscountPercent: 50,
  },
  cashier: {
    canAccessCashier: true,
    canAccessProducts: true, // Bisa lihat produk
    canManageProducts: false, // Tidak bisa edit/hapus produk
    canAccessTransactions: true, // Bisa lihat transaksi sendiri
    canAccessCustomers: false, // Tidak bisa akses menu pelanggan
    canManageCustomers: false,
    canAccessReports: false, // Tidak bisa lihat laporan
    canAccessSettings: false,
    canManageEmployees: false,
    canDeleteTransactions: false,
    canGiveDiscount: true,
    maxDiscountPercent: 10,
  },
};
