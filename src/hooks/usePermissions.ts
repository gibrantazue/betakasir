import { useStore } from '../store/useStore';
import { EmployeePermissions } from '../types/employee';

/**
 * Hook untuk check permissions user (owner atau employee)
 */
export const usePermissions = () => {
  const { currentUser, employeeSession } = useStore();

  // Jika owner, full access
  if (currentUser && !employeeSession) {
    return {
      isOwner: true,
      isEmployee: false,
      role: 'owner' as const,
      permissions: {
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
      } as EmployeePermissions,
      employee: null,
    };
  }

  // Jika employee
  if (employeeSession) {
    return {
      isOwner: false,
      isEmployee: true,
      role: employeeSession.employee.role,
      permissions: employeeSession.employee.permissions,
      employee: employeeSession.employee,
    };
  }

  // Default (tidak login)
  return {
    isOwner: false,
    isEmployee: false,
    role: null,
    permissions: null,
    employee: null,
  };
};

/**
 * Check apakah user punya permission tertentu
 */
export const hasPermission = (
  permission: keyof EmployeePermissions,
  permissions: EmployeePermissions | null
): boolean => {
  if (!permissions) return false;
  return permissions[permission] === true;
};
