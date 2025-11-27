// Employee Service - Firebase Firestore
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Employee } from '../types/employee';

// Collection path: sellers/{sellerUID}/employees/{employeeID}

/**
 * Create or update seller document
 * This ensures the seller document exists so the collection is visible
 */
export const ensureSellerDocument = async (sellerUID: string, sellerData?: any): Promise<void> => {
  try {
    const sellerRef = doc(db, 'sellers', sellerUID);
    const sellerDoc = await getDoc(sellerRef);
    
    if (!sellerDoc.exists()) {
      console.log('📝 Creating seller document for:', sellerUID);
      await setDoc(sellerRef, {
        uid: sellerUID,
        email: sellerData?.email || '',
        name: sellerData?.name || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ Seller document created');
    } else {
      console.log('✅ Seller document already exists');
    }
  } catch (error) {
    console.error('❌ Error ensuring seller document:', error);
    throw error;
  }
};

/**
 * Check if employee with same employeeId or username already exists
 */
export const checkEmployeeDuplicate = async (
  sellerUID: string, 
  employeeId: string, 
  username: string,
  excludeId?: string // For update operations
): Promise<{ isDuplicate: boolean; reason?: string }> => {
  try {
    const employeesRef = collection(db, 'sellers', sellerUID, 'employees');
    const snapshot = await getDocs(employeesRef);
    
    for (const doc of snapshot.docs) {
      // Skip if this is the same employee (for update operations)
      if (excludeId && doc.id === excludeId) {
        continue;
      }
      
      const emp = doc.data() as Employee;
      
      // Check employeeId duplicate
      if (emp.employeeId === employeeId) {
        return { 
          isDuplicate: true, 
          reason: `Employee ID ${employeeId} sudah digunakan oleh ${emp.name}` 
        };
      }
      
      // Check username duplicate
      if (emp.username.toLowerCase() === username.toLowerCase()) {
        return { 
          isDuplicate: true, 
          reason: `Username ${username} sudah digunakan oleh ${emp.name}` 
        };
      }
    }
    
    return { isDuplicate: false };
  } catch (error) {
    console.error('❌ Error checking duplicate:', error);
    throw error;
  }
};

/**
 * Add employee to Firestore
 */
export const addEmployeeToFirestore = async (sellerUID: string, employee: Employee): Promise<void> => {
  try {
    console.log('📤 Adding employee to Firestore:', employee.name);
    
    // Ensure seller document exists first
    await ensureSellerDocument(sellerUID);
    
    // Check for duplicates
    const duplicateCheck = await checkEmployeeDuplicate(
      sellerUID, 
      employee.employeeId, 
      employee.username
    );
    
    if (duplicateCheck.isDuplicate) {
      console.error('❌ Duplicate employee detected:', duplicateCheck.reason);
      throw new Error(duplicateCheck.reason);
    }
    
    const employeeRef = doc(db, 'sellers', sellerUID, 'employees', employee.id);
    await setDoc(employeeRef, {
      ...employee,
      createdAt: employee.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ Employee added to Firestore');
  } catch (error) {
    console.error('❌ Error adding employee to Firestore:', error);
    throw error;
  }
};

/**
 * Update employee in Firestore
 */
export const updateEmployeeInFirestore = async (
  sellerUID: string, 
  employeeId: string, 
  updates: Partial<Employee>
): Promise<void> => {
  try {
    console.log('📤 Updating employee in Firestore:', employeeId);
    
    // If updating employeeId or username, check for duplicates
    if (updates.employeeId || updates.username) {
      // Get current employee data
      const employeeRef = doc(db, 'sellers', sellerUID, 'employees', employeeId);
      const employeeDoc = await getDoc(employeeRef);
      
      if (!employeeDoc.exists()) {
        throw new Error('Employee not found');
      }
      
      const currentEmployee = employeeDoc.data() as Employee;
      
      const duplicateCheck = await checkEmployeeDuplicate(
        sellerUID,
        updates.employeeId || currentEmployee.employeeId,
        updates.username || currentEmployee.username,
        employeeId // Exclude current employee from check
      );
      
      if (duplicateCheck.isDuplicate) {
        console.error('❌ Duplicate employee detected:', duplicateCheck.reason);
        throw new Error(duplicateCheck.reason);
      }
    }
    
    const employeeRef = doc(db, 'sellers', sellerUID, 'employees', employeeId);
    await updateDoc(employeeRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ Employee updated in Firestore');
  } catch (error) {
    console.error('❌ Error updating employee in Firestore:', error);
    throw error;
  }
};

/**
 * Delete employee from Firestore
 */
export const deleteEmployeeFromFirestore = async (sellerUID: string, employeeId: string): Promise<void> => {
  try {
    console.log('📤 Deleting employee from Firestore:', employeeId);
    const employeeRef = doc(db, 'sellers', sellerUID, 'employees', employeeId);
    await deleteDoc(employeeRef);
    console.log('✅ Employee deleted from Firestore');
  } catch (error) {
    console.error('❌ Error deleting employee from Firestore:', error);
    throw error;
  }
};

/**
 * Get all employees for a seller
 */
export const getEmployeesFromFirestore = async (sellerUID: string): Promise<Employee[]> => {
  try {
    console.log('📥 Loading employees from Firestore for seller:', sellerUID);
    const employeesRef = collection(db, 'sellers', sellerUID, 'employees');
    const snapshot = await getDocs(employeesRef);
    
    const employees: Employee[] = [];
    snapshot.forEach((doc) => {
      employees.push(doc.data() as Employee);
    });
    
    console.log('✅ Loaded', employees.length, 'employees from Firestore');
    return employees;
  } catch (error) {
    console.error('❌ Error loading employees from Firestore:', error);
    return [];
  }
};

/**
 * Get single employee by ID
 */
export const getEmployeeFromFirestore = async (sellerUID: string, employeeId: string): Promise<Employee | null> => {
  try {
    const employeeRef = doc(db, 'sellers', sellerUID, 'employees', employeeId);
    const snapshot = await getDoc(employeeRef);
    
    if (snapshot.exists()) {
      return snapshot.data() as Employee;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting employee from Firestore:', error);
    return null;
  }
};

/**
 * Find employee by username across all sellers
 * Used for employee login
 */
export const findEmployeeByUsername = async (username: string): Promise<{ employee: Employee; sellerUID: string } | null> => {
  try {
    if (!username || username.trim().length === 0) {
      console.error('❌ Invalid username provided');
      return null;
    }
    
    console.log('🔍 Searching for employee with username:', username);
    
    // Get all sellers
    const sellersRef = collection(db, 'sellers');
    const sellersSnapshot = await getDocs(sellersRef);
    
    if (sellersSnapshot.empty) {
      console.log('⚠️ No sellers found in database');
      return null;
    }
    
    console.log('📊 Total sellers found:', sellersSnapshot.size);
    
    // Search through each seller's employees
    for (const sellerDoc of sellersSnapshot.docs) {
      try {
        const sellerUID = sellerDoc.id;
        console.log('🔍 Checking seller:', sellerUID);
        
        const employeesRef = collection(db, 'sellers', sellerUID, 'employees');
        const employeesSnapshot = await getDocs(employeesRef);
        
        console.log(`  📋 Found ${employeesSnapshot.size} employees for seller ${sellerUID}`);
        
        for (const empDoc of employeesSnapshot.docs) {
          try {
            const employee = empDoc.data() as Employee;
            
            // Validate employee data
            if (!employee.username || !employee.name) {
              console.warn('⚠️ Invalid employee data:', empDoc.id);
              continue;
            }
            
            console.log(`    👤 Checking employee: ${employee.name} (${employee.username})`);
            
            if (employee.username.toLowerCase() === username.toLowerCase() && employee.isActive) {
              console.log('✅ Found employee:', employee.name, 'for seller:', sellerUID);
              return { employee, sellerUID };
            }
          } catch (empError) {
            console.error('❌ Error processing employee:', empDoc.id, empError);
            continue;
          }
        }
      } catch (sellerError) {
        console.error('❌ Error processing seller:', sellerDoc.id, sellerError);
        continue;
      }
    }
    
    console.log('❌ Employee not found after checking all sellers');
    return null;
  } catch (error) {
    console.error('❌ Error finding employee:', error);
    throw new Error('Gagal mencari karyawan. Silakan coba lagi.');
  }
};

/**
 * Subscribe to real-time updates for employees
 */
export const subscribeToEmployees = (
  sellerUID: string, 
  callback: (employees: Employee[]) => void
): (() => void) => {
  console.log('🔄 Setting up realtime listener for employees');
  const employeesRef = collection(db, 'sellers', sellerUID, 'employees');
  
  const unsubscribe = onSnapshot(
    employeesRef, 
    (snapshot) => {
      const employees: Employee[] = [];
      snapshot.forEach((doc) => {
        employees.push(doc.data() as Employee);
      });
      console.log('🔄 Realtime update: Employees changed, total:', employees.length);
      callback(employees);
    }, 
    (error) => {
      console.error('❌ Error in employees realtime listener:', error);
    }
  );
  
  return unsubscribe;
};
