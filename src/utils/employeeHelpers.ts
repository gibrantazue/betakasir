// Helper functions untuk employee management

import { Employee, EmployeeRole, DEFAULT_PERMISSIONS } from '../types/employee';
import * as Crypto from 'expo-crypto';

// Generate employee ID (format: EMP001, EMP002, dst)
export function generateEmployeeId(existingEmployees: Employee[]): string {
  const maxId = existingEmployees.reduce((max, emp) => {
    const num = parseInt(emp.employeeId.replace('EMP', ''));
    return num > max ? num : max;
  }, 0);
  
  const nextId = maxId + 1;
  return `EMP${nextId.toString().padStart(3, '0')}`;
}

// Hash password sederhana (untuk production gunakan bcrypt)
export async function hashPassword(password: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return digest;
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const digest = await hashPassword(password);
  return digest === hashedPassword;
}

// Generate random password
export function generateRandomPassword(length: number = 6): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Validate employee data
export function validateEmployeeData(data: Partial<Employee>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 3) {
    errors.push('Nama minimal 3 karakter');
  }

  if (!data.phone || data.phone.trim().length < 10) {
    errors.push('Nomor telepon tidak valid');
  }

  if (!data.username || data.username.trim().length < 4) {
    errors.push('Username minimal 4 karakter');
  }

  if (!data.role) {
    errors.push('Role harus dipilih');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get role display name
export function getRoleDisplayName(role: EmployeeRole): string {
  const roleNames: Record<EmployeeRole, string> = {
    seller: 'Pemilik Toko',
    admin: 'Admin',
    cashier: 'Kasir',
  };
  return roleNames[role];
}

// Get role color
export function getRoleColor(role: EmployeeRole): string {
  const roleColors: Record<EmployeeRole, string> = {
    seller: '#DC143C',
    admin: '#FF6B35',
    cashier: '#4ECDC4',
  };
  return roleColors[role];
}

// Check if employee can access feature
export function canAccessFeature(employee: Employee, feature: string): boolean {
  const permissionMap: Record<string, keyof typeof employee.permissions> = {
    'Cashier': 'canAccessCashier',
    'Products': 'canAccessProducts',
    'Transactions': 'canAccessTransactions',
    'Reports': 'canAccessReports',
    'Settings': 'canAccessSettings',
    'Employees': 'canManageEmployees',
  };

  const permissionKey = permissionMap[feature];
  if (!permissionKey) return true;

  return Boolean(employee.permissions[permissionKey]);
}
