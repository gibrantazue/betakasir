// Data Service - Firebase Firestore for Products, Transactions, Customers
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
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, Transaction, Customer } from '../types';

// Collection path: sellers/{sellerUID}/products/{productID}
// Collection path: sellers/{sellerUID}/transactions/{transactionID}
// Collection path: sellers/{sellerUID}/customers/{customerID}

/**
 * PRODUCTS
 */

export const addProductToFirestore = async (sellerUID: string, product: Product): Promise<void> => {
  try {
    console.log('📤 Adding product to Firestore:', product.name);
    const productRef = doc(db, 'sellers', sellerUID, 'products', product.id);
    await setDoc(productRef, {
      ...product,
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ Product added to Firestore');
  } catch (error) {
    console.error('❌ Error adding product to Firestore:', error);
    throw error;
  }
};

export const updateProductInFirestore = async (
  sellerUID: string, 
  productId: string, 
  updates: Partial<Product>
): Promise<void> => {
  try {
    console.log('📤 Updating product in Firestore:', productId);
    const productRef = doc(db, 'sellers', sellerUID, 'products', productId);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    console.log('✅ Product updated in Firestore');
  } catch (error) {
    console.error('❌ Error updating product in Firestore:', error);
    throw error;
  }
};

export const deleteProductFromFirestore = async (sellerUID: string, productId: string): Promise<void> => {
  try {
    console.log('📤 Deleting product from Firestore:', productId);
    const productRef = doc(db, 'sellers', sellerUID, 'products', productId);
    await deleteDoc(productRef);
    console.log('✅ Product deleted from Firestore');
  } catch (error) {
    console.error('❌ Error deleting product from Firestore:', error);
    throw error;
  }
};

export const getProductsFromFirestore = async (sellerUID: string): Promise<Product[]> => {
  try {
    console.log('📥 Loading products from Firestore for seller:', sellerUID);
    const productsRef = collection(db, 'sellers', sellerUID, 'products');
    const snapshot = await getDocs(productsRef);
    
    const products: Product[] = [];
    snapshot.forEach((doc) => {
      products.push(doc.data() as Product);
    });
    
    console.log('✅ Loaded', products.length, 'products from Firestore');
    return products;
  } catch (error) {
    console.error('❌ Error loading products from Firestore:', error);
    return [];
  }
};

/**
 * TRANSACTIONS
 */

export const addTransactionToFirestore = async (sellerUID: string, transaction: Transaction): Promise<void> => {
  try {
    console.log('📤 Adding transaction to Firestore:', transaction.id);
    const transactionRef = doc(db, 'sellers', sellerUID, 'transactions', transaction.id);
    await setDoc(transactionRef, transaction);
    console.log('✅ Transaction added to Firestore');
  } catch (error) {
    console.error('❌ Error adding transaction to Firestore:', error);
    throw error;
  }
};

export const deleteTransactionFromFirestore = async (sellerUID: string, transactionId: string): Promise<void> => {
  try {
    console.log('📤 Deleting transaction from Firestore:', transactionId);
    const transactionRef = doc(db, 'sellers', sellerUID, 'transactions', transactionId);
    await deleteDoc(transactionRef);
    console.log('✅ Transaction deleted from Firestore');
  } catch (error) {
    console.error('❌ Error deleting transaction from Firestore:', error);
    throw error;
  }
};

export const getTransactionsFromFirestore = async (sellerUID: string): Promise<Transaction[]> => {
  try {
    console.log('📥 Loading transactions from Firestore for seller:', sellerUID);
    const transactionsRef = collection(db, 'sellers', sellerUID, 'transactions');
    const snapshot = await getDocs(transactionsRef);
    
    const transactions: Transaction[] = [];
    snapshot.forEach((doc) => {
      transactions.push(doc.data() as Transaction);
    });
    
    console.log('✅ Loaded', transactions.length, 'transactions from Firestore');
    return transactions;
  } catch (error) {
    console.error('❌ Error loading transactions from Firestore:', error);
    return [];
  }
};

/**
 * CUSTOMERS
 */

export const addCustomerToFirestore = async (sellerUID: string, customer: Customer): Promise<void> => {
  try {
    console.log('📤 Adding customer to Firestore:', customer.name);
    const customerRef = doc(db, 'sellers', sellerUID, 'customers', customer.id);
    await setDoc(customerRef, {
      ...customer,
      createdAt: customer.createdAt || new Date().toISOString(),
    });
    console.log('✅ Customer added to Firestore');
  } catch (error) {
    console.error('❌ Error adding customer to Firestore:', error);
    throw error;
  }
};

export const updateCustomerInFirestore = async (
  sellerUID: string, 
  customerId: string, 
  updates: Partial<Customer>
): Promise<void> => {
  try {
    console.log('📤 Updating customer in Firestore:', customerId);
    const customerRef = doc(db, 'sellers', sellerUID, 'customers', customerId);
    await updateDoc(customerRef, updates);
    console.log('✅ Customer updated in Firestore');
  } catch (error) {
    console.error('❌ Error updating customer in Firestore:', error);
    throw error;
  }
};

export const deleteCustomerFromFirestore = async (sellerUID: string, customerId: string): Promise<void> => {
  try {
    console.log('📤 Deleting customer from Firestore:', customerId);
    const customerRef = doc(db, 'sellers', sellerUID, 'customers', customerId);
    await deleteDoc(customerRef);
    console.log('✅ Customer deleted from Firestore');
  } catch (error) {
    console.error('❌ Error deleting customer from Firestore:', error);
    throw error;
  }
};

export const getCustomersFromFirestore = async (sellerUID: string): Promise<Customer[]> => {
  try {
    console.log('📥 Loading customers from Firestore for seller:', sellerUID);
    const customersRef = collection(db, 'sellers', sellerUID, 'customers');
    const snapshot = await getDocs(customersRef);
    
    const customers: Customer[] = [];
    snapshot.forEach((doc) => {
      customers.push(doc.data() as Customer);
    });
    
    console.log('✅ Loaded', customers.length, 'customers from Firestore');
    return customers;
  } catch (error) {
    console.error('❌ Error loading customers from Firestore:', error);
    return [];
  }
};

/**
 * Get seller UID from current user or employee session
 */
export const getSellerUID = (): string | null => {
  try {
    const { useStore } = require('../store/useStore');
    const { currentUser, employeeSession } = useStore.getState();
    
    if (employeeSession) {
      // Employee logged in - use seller UID from session
      return employeeSession.sellerUID || null;
    }
    
    if (currentUser) {
      // Owner logged in - use their UID
      return currentUser.id || null;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting seller UID:', error);
    return null;
  }
};

/**
 * REALTIME LISTENERS
 */

/**
 * Subscribe to real-time products updates
 */
export const subscribeToProducts = (
  sellerUID: string,
  callback: (products: Product[]) => void
): (() => void) => {
  console.log('🔄 Setting up realtime listener for products');
  const productsRef = collection(db, 'sellers', sellerUID, 'products');
  
  const unsubscribe = onSnapshot(
    productsRef,
    (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((doc) => {
        products.push(doc.data() as Product);
      });
      console.log('🔄 Realtime update: Products changed, total:', products.length);
      callback(products);
    },
    (error) => {
      console.error('❌ Error in products realtime listener:', error);
    }
  );
  
  return unsubscribe;
};

/**
 * Subscribe to real-time transactions updates
 */
export const subscribeToTransactions = (
  sellerUID: string,
  callback: (transactions: Transaction[]) => void
): (() => void) => {
  console.log('🔄 Setting up realtime listener for transactions');
  const transactionsRef = collection(db, 'sellers', sellerUID, 'transactions');
  
  const unsubscribe = onSnapshot(
    transactionsRef,
    (snapshot) => {
      const transactions: Transaction[] = [];
      snapshot.forEach((doc) => {
        transactions.push(doc.data() as Transaction);
      });
      console.log('🔄 Realtime update: Transactions changed, total:', transactions.length);
      callback(transactions);
    },
    (error) => {
      console.error('❌ Error in transactions realtime listener:', error);
    }
  );
  
  return unsubscribe;
};

/**
 * Subscribe to real-time customers updates
 */
export const subscribeToCustomers = (
  sellerUID: string,
  callback: (customers: Customer[]) => void
): (() => void) => {
  console.log('🔄 Setting up realtime listener for customers');
  const customersRef = collection(db, 'sellers', sellerUID, 'customers');
  
  const unsubscribe = onSnapshot(
    customersRef,
    (snapshot) => {
      const customers: Customer[] = [];
      snapshot.forEach((doc) => {
        customers.push(doc.data() as Customer);
      });
      console.log('🔄 Realtime update: Customers changed, total:', customers.length);
      callback(customers);
    },
    (error) => {
      console.error('❌ Error in customers realtime listener:', error);
    }
  );
  
  return unsubscribe;
};

/**
 * DELETE ALL DATA (for reset/clear data feature)
 */
export const deleteAllDataFromFirestore = async (sellerUID: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting all data from Firestore for seller:', sellerUID);

    // Delete all products
    const productsRef = collection(db, 'sellers', sellerUID, 'products');
    const productsSnapshot = await getDocs(productsRef);
    const productDeletes = productsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(productDeletes);
    console.log('✅ All products deleted');

    // Delete all transactions
    const transactionsRef = collection(db, 'sellers', sellerUID, 'transactions');
    const transactionsSnapshot = await getDocs(transactionsRef);
    const transactionDeletes = transactionsSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );
    await Promise.all(transactionDeletes);
    console.log('✅ All transactions deleted');

    // Delete all customers
    const customersRef = collection(db, 'sellers', sellerUID, 'customers');
    const customersSnapshot = await getDocs(customersRef);
    const customerDeletes = customersSnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(customerDeletes);
    console.log('✅ All customers deleted');

    // Delete all employees
    const employeesRef = collection(db, 'sellers', sellerUID, 'employees');
    const employeesSnapshot = await getDocs(employeesRef);
    const employeeDeletes = employeesSnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(employeeDeletes);
    console.log('✅ All employees deleted');

    console.log('✅ All data deleted from Firestore');
  } catch (error) {
    console.error('❌ Error deleting all data from Firestore:', error);
    throw error;
  }
};
