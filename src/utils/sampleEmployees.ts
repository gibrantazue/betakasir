// Sample employees untuk testing

import { Employee } from '../types/employee';
import { DEFAULT_PERMISSIONS } from '../types/employee';
import { hashPassword } from './employeeHelpers';

export async function generateSampleEmployees(createdBy: string): Promise<Employee[]> {
  const now = new Date().toISOString();
  
  return [
    {
      id: 'emp-001',
      employeeId: 'EMP001',
      name: 'Gibran Ade',
      phone: '08123456789',
      email: 'gibran@example.com',
      username: 'argan',
      password: await hashPassword('123456'), // Password: 123456
      role: 'admin',
      permissions: DEFAULT_PERMISSIONS.admin,
      address: 'Jl. Merdeka No. 123, Jakarta',
      joinDate: '2024-01-15T00:00:00.000Z',
      isActive: true,
      createdBy,
      createdAt: now,
    },
    {
      id: 'emp-004',
      employeeId: 'EMP004',
      name: 'Budi Santoso',
      phone: '08123456780',
      email: 'budi@example.com',
      username: 'budi',
      password: await hashPassword('123456'), // Password: 123456
      role: 'cashier',
      permissions: DEFAULT_PERMISSIONS.cashier,
      address: 'Jl. Merdeka No. 124, Jakarta',
      joinDate: '2024-01-16T00:00:00.000Z',
      isActive: true,
      createdBy,
      createdAt: now,
    },
    {
      id: 'emp-002',
      employeeId: 'EMP002',
      name: 'Siti Nurhaliza',
      phone: '08234567890',
      email: 'siti@example.com',
      username: 'siti',
      password: await hashPassword('123456'), // Password: 123456
      role: 'cashier',
      permissions: DEFAULT_PERMISSIONS.cashier,
      address: 'Jl. Sudirman No. 456, Jakarta',
      joinDate: '2024-02-01T00:00:00.000Z',
      isActive: true,
      createdBy,
      createdAt: now,
    },
    {
      id: 'emp-003',
      employeeId: 'EMP003',
      name: 'Ahmad Rizki',
      phone: '08345678901',
      email: 'ahmad@example.com',
      username: 'ahmad',
      password: await hashPassword('123456'), // Password: 123456
      role: 'admin',
      permissions: DEFAULT_PERMISSIONS.admin,
      address: 'Jl. Thamrin No. 789, Jakarta',
      joinDate: '2024-01-10T00:00:00.000Z',
      isActive: true,
      createdBy,
      createdAt: now,
    },
  ];
}

// Untuk testing di development
export const SAMPLE_CREDENTIALS = {
  admin1: {
    username: 'argan',
    password: '123456',
    employeeId: 'EMP001',
    name: 'Gibran Ade',
  },
  cashier1: {
    username: 'budi',
    password: '123456',
    employeeId: 'EMP004',
  },
  cashier2: {
    username: 'siti',
    password: '123456',
    employeeId: 'EMP002',
  },
  admin2: {
    username: 'ahmad',
    password: '123456',
    employeeId: 'EMP003',
  },
};
