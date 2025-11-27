import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface BackupData {
  version: string;
  timestamp: string;
  products: any[];
  employees: any[];
  transactions: any[];
}

/**
 * Backup all data (products, employees, transactions) to JSON
 */
export const backupData = async (userId: string): Promise<BackupData> => {
  try {
    console.log('📦 Starting backup for user:', userId);

    // Get products
    const productsRef = collection(db, 'sellers', userId, 'products');
    const productsSnapshot = await getDocs(productsRef);
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get employees
    const employeesRef = collection(db, 'sellers', userId, 'employees');
    const employeesSnapshot = await getDocs(employeesRef);
    const employees = employeesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get transactions
    const transactionsRef = collection(db, 'sellers', userId, 'transactions');
    const transactionsSnapshot = await getDocs(transactionsRef);
    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const backupData: BackupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      products,
      employees,
      transactions,
    };

    console.log('✅ Backup completed:', {
      products: products.length,
      employees: employees.length,
      transactions: transactions.length,
    });

    return backupData;
  } catch (error) {
    console.error('❌ Error backing up data:', error);
    throw error;
  }
};

/**
 * Download backup data as JSON file
 */
export const downloadBackup = async (userId: string, storeName: string = 'BetaKasir') => {
  try {
    const data = await backupData(userId);
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `betakasir-backup-${storeName}-${timestamp}.json`;
    
    // Convert to JSON string
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(url);
    
    console.log('✅ Backup downloaded:', filename);
    return filename;
  } catch (error) {
    console.error('❌ Error downloading backup:', error);
    throw error;
  }
};

/**
 * Restore data from backup file
 */
export const restoreData = async (
  userId: string,
  backupData: BackupData,
  options: {
    includeProducts?: boolean;
    includeEmployees?: boolean;
    includeTransactions?: boolean;
    overwrite?: boolean;
  } = {}
): Promise<{
  productsRestored: number;
  employeesRestored: number;
  transactionsRestored: number;
}> => {
  try {
    console.log('📥 Starting restore for user:', userId);
    console.log('Options:', options);

    const {
      includeProducts = true,
      includeEmployees = true,
      includeTransactions = true,
      overwrite = false,
    } = options;

    let productsRestored = 0;
    let employeesRestored = 0;
    let transactionsRestored = 0;

    // Import products
    if (includeProducts && backupData.products) {
      const { setDoc, doc } = await import('firebase/firestore');
      
      for (const product of backupData.products) {
        const productRef = doc(db, 'sellers', userId, 'products', product.id);
        await setDoc(productRef, product, { merge: !overwrite });
        productsRestored++;
      }
      console.log(`✅ Restored ${productsRestored} products`);
    }

    // Import employees
    if (includeEmployees && backupData.employees) {
      const { setDoc, doc } = await import('firebase/firestore');
      
      for (const employee of backupData.employees) {
        const employeeRef = doc(db, 'sellers', userId, 'employees', employee.id);
        await setDoc(employeeRef, employee, { merge: !overwrite });
        employeesRestored++;
      }
      console.log(`✅ Restored ${employeesRestored} employees`);
    }

    // Import transactions
    if (includeTransactions && backupData.transactions) {
      const { setDoc, doc } = await import('firebase/firestore');
      
      for (const transaction of backupData.transactions) {
        const transactionRef = doc(db, 'sellers', userId, 'transactions', transaction.id);
        await setDoc(transactionRef, transaction, { merge: !overwrite });
        transactionsRestored++;
      }
      console.log(`✅ Restored ${transactionsRestored} transactions`);
    }

    console.log('✅ Restore completed');
    return { productsRestored, employeesRestored, transactionsRestored };
  } catch (error) {
    console.error('❌ Error restoring data:', error);
    throw error;
  }
};

/**
 * Parse and validate backup file
 */
export const parseBackupFile = (fileContent: string): BackupData => {
  try {
    console.log('📄 Parsing file content, length:', fileContent.length);
    const data = JSON.parse(fileContent);
    console.log('✅ JSON parsed successfully');
    console.log('📊 Data structure:', {
      hasVersion: !!data.version,
      hasTimestamp: !!data.timestamp,
      hasProducts: !!data.products,
      hasEmployees: !!data.employees,
      hasTransactions: !!data.transactions,
    });
    
    // Validate structure (flexible - accept old format without timestamp)
    if (!data.version && !data.backupDate) {
      console.error('❌ Missing version or backupDate');
      throw new Error('Format file tidak valid: missing version');
    }
    
    // Normalize timestamp field (support both old and new format)
    if (!data.timestamp && data.backupDate) {
      data.timestamp = data.backupDate;
      console.log('📝 Using backupDate as timestamp');
    }
    
    if (!data.timestamp) {
      // If still no timestamp, use current time
      data.timestamp = new Date().toISOString();
      console.log('📝 No timestamp found, using current time');
    }
    
    if (!data.products && !data.employees && !data.transactions) {
      console.error('❌ No data arrays found');
      throw new Error('File backup kosong: tidak ada data produk/karyawan/transaksi');
    }
    
    console.log('✅ Validation passed');
    return data as BackupData;
  } catch (error: any) {
    console.error('❌ Error parsing backup file:', error);
    
    if (error instanceof SyntaxError) {
      throw new Error('File bukan JSON yang valid. Pastikan file tidak rusak.');
    }
    
    if (error.message.includes('Format file') || error.message.includes('File backup')) {
      throw error; // Re-throw our custom errors
    }
    
    throw new Error('File backup tidak valid atau rusak: ' + error.message);
  }
};
