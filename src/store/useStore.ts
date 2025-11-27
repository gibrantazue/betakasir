import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CartItem, Transaction, Customer, User, Category, Settings } from '../types';
import { Employee, EmployeeSession } from '../types/employee';

interface AppState {
  // User
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // Products
  products: Product[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  loadProductsFromFirestore: () => Promise<void>;
  
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  updateCartItem: (productId: string, quantity: number, discount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  
  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<boolean>;
  loadTransactionsFromFirestore: () => Promise<void>;
  
  // Customers
  customers: Customer[];
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  loadCustomersFromFirestore: () => Promise<void>;
  
  // Employees
  employees: Employee[];
  addEmployee: (employee: Employee) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  loadEmployeesFromFirestore: () => Promise<void>;
  
  // Employee Session
  employeeSession: EmployeeSession | null;
  setEmployeeSession: (session: EmployeeSession | null) => Promise<void>;
  
  // Categories
  categories: Category[];
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Settings
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Realtime Listeners
  unsubscribeProducts: (() => void) | null;
  unsubscribeTransactions: (() => void) | null;
  unsubscribeCustomers: (() => void) | null;
  unsubscribeEmployees: (() => void) | null;
  startRealtimeListeners: () => void;
  stopRealtimeListeners: () => void;
  
  // Initialize
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  resetStore: () => void;
  reloadSampleEmployees: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  products: [],
  cart: [],
  transactions: [],
  customers: [],
  employees: [],
  employeeSession: null,
  categories: [],
  settings: {
    storeName: 'BETA KASIR',
    storeAddress: 'Jl. Contoh No. 123, Jakarta',
    storePhone: 'Telp: 021-12345678',
    taxRate: 0,
    currency: 'IDR',
    receiptFooter: 'Terima Kasih Atas Kunjungan Anda',
    receiptNote: 'Barang yang sudah dibeli\ntidak dapat ditukar/dikembalikan',
    receiptWebsite: 'www.betakasir.com',
  },
  theme: 'dark',
  
  // Realtime listeners
  unsubscribeProducts: null,
  unsubscribeTransactions: null,
  unsubscribeCustomers: null,
  unsubscribeEmployees: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  addProduct: async (product) => {
    const { currentUser, employeeSession } = get();
    const sellerUID = employeeSession?.sellerUID || currentUser?.id;
    
    if (!sellerUID) {
      console.error('❌ No seller UID, cannot add product');
      throw new Error('User not logged in');
    }
    
    try {
      const { addProductToFirestore } = await import('../services/dataService');
      await addProductToFirestore(sellerUID, product);
      console.log('✅ Product added to Firestore');
      
      // CRITICAL FIX: Biarkan realtime listener yang handle update
      console.log('⏳ Waiting for realtime listener to update state...');
    } catch (error) {
      console.error('❌ Failed to add product:', error);
      throw error;
    }
  },

  updateProduct: async (id, updatedProduct) => {
    const { currentUser, employeeSession } = get();
    const sellerUID = employeeSession?.sellerUID || currentUser?.id;
    
    if (!sellerUID) {
      console.error('❌ No seller UID, cannot update product');
      throw new Error('User not logged in');
    }
    
    try {
      const { updateProductInFirestore } = await import('../services/dataService');
      await updateProductInFirestore(sellerUID, id, updatedProduct);
      console.log('✅ Product updated in Firestore');
      
      // CRITICAL FIX: Biarkan realtime listener yang handle update
      console.log('⏳ Waiting for realtime listener to update state...');
    } catch (error) {
      console.error('❌ Failed to update product:', error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    const { currentUser, employeeSession } = get();
    const sellerUID = employeeSession?.sellerUID || currentUser?.id;
    
    if (!sellerUID) {
      console.error('❌ No seller UID, cannot delete product');
      throw new Error('User not logged in');
    }
    
    const productToDelete = get().products.find(p => p.id === id);
    if (productToDelete) {
      console.log('🗑️ Deleting product:', productToDelete.name, 'ID:', id);
    }
    
    try {
      const { deleteProductFromFirestore } = await import('../services/dataService');
      await deleteProductFromFirestore(sellerUID, id);
      console.log('✅ Product deleted from Firestore');
      
      // CRITICAL FIX: Biarkan realtime listener yang handle update
      console.log('⏳ Waiting for realtime listener to update state...');
    } catch (error) {
      console.error('❌ Failed to delete product:', error);
      throw error;
    }
  },

  addToCart: (product, quantity) => {
    set((state) => {
      const existingItem = state.cart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }
      return { cart: [...state.cart, { product, quantity, discount: 0 }] };
    });
  },

  updateCartItem: (productId, quantity, discount) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === productId ? { ...item, quantity, discount } : item
      ),
    }));
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    }));
  },

  clearCart: () => set({ cart: [] }),

  addTransaction: async (transaction) => {
    const { currentUser, employeeSession } = get();
    const sellerUID = employeeSession?.sellerUID || currentUser?.id;
    
    if (!sellerUID) {
      console.error('❌ No seller UID, cannot add transaction');
      throw new Error('User not logged in');
    }
    
    try {
      const { addTransactionToFirestore } = await import('../services/dataService');
      await addTransactionToFirestore(sellerUID, transaction);
      console.log('✅ Transaction added to Firestore');
      
      // CRITICAL FIX: JANGAN manual add ke local state
      // Biarkan realtime listener yang handle update untuk avoid duplicate
      // Realtime listener akan auto-update state ketika Firestore berubah
      
      console.log('⏳ Waiting for realtime listener to update state...');
      
      // Backup to localStorage akan di-handle oleh realtime listener
    } catch (error) {
      console.error('❌ Failed to add transaction:', error);
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    const { currentUser, employeeSession } = get();
    const sellerUID = employeeSession?.sellerUID || currentUser?.id;
    
    if (!sellerUID) {
      console.error('❌ No seller UID, cannot delete transaction');
      throw new Error('User not logged in');
    }
    
    console.log('Store: deleteTransaction called with ID:', id);
    const transactionToDelete = get().transactions.find(t => t.id === id);
    
    if (!transactionToDelete) {
      console.error('Store: Transaction not found with ID:', id);
      return false;
    }
    
    try {
      const { deleteTransactionFromFirestore } = await import('../services/dataService');
      await deleteTransactionFromFirestore(sellerUID, id);
      console.log('✅ Transaction deleted from Firestore');
      
      // Update local state
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
      
      // Backup to localStorage
      await AsyncStorage.setItem('transactions', JSON.stringify(get().transactions));
      console.log('✅ Transaction deleted successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to delete transaction:', error);
      return false;
    }
  },

  addCustomer: async (customer) => {
    const { currentUser, employeeSession } = get();
    const sellerUID = employeeSession?.sellerUID || currentUser?.id;
    
    if (!sellerUID) {
      console.error('❌ No seller UID, cannot add customer');
      throw new Error('User not logged in');
    }
    
    try {
      const { addCustomerToFirestore } = await import('../services/dataService');
      await addCustomerToFirestore(sellerUID, customer);
      console.log('✅ Customer added to Firestore');
      
      // CRITICAL FIX: Biarkan realtime listener yang handle update
      console.log('⏳ Waiting for realtime listener to update state...');
    } catch (error) {
      console.error('❌ Failed to add customer:', error);
      throw error;
    }
  },

  updateCustomer: async (id, updatedCustomer) => {
    const { currentUser, employeeSession } = get();
    const sellerUID = employeeSession?.sellerUID || currentUser?.id;
    
    if (!sellerUID) {
      console.error('❌ No seller UID, cannot update customer');
      throw new Error('User not logged in');
    }
    
    try {
      const { updateCustomerInFirestore } = await import('../services/dataService');
      await updateCustomerInFirestore(sellerUID, id, updatedCustomer);
      console.log('✅ Customer updated in Firestore');
      
      // CRITICAL FIX: Biarkan realtime listener yang handle update
      console.log('⏳ Waiting for realtime listener to update state...');
    } catch (error) {
      console.error('❌ Failed to update customer:', error);
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    const { currentUser, employeeSession } = get();
    const sellerUID = employeeSession?.sellerUID || currentUser?.id;
    
    if (!sellerUID) {
      console.error('❌ No seller UID, cannot delete customer');
      throw new Error('User not logged in');
    }
    
    try {
      const { deleteCustomerFromFirestore } = await import('../services/dataService');
      await deleteCustomerFromFirestore(sellerUID, id);
      console.log('✅ Customer deleted from Firestore');
      
      // CRITICAL FIX: Biarkan realtime listener yang handle update
      console.log('⏳ Waiting for realtime listener to update state...');
    } catch (error) {
      console.error('❌ Failed to delete customer:', error);
      throw error;
    }
  },

  addEmployee: async (employee) => {
    console.log('➕ Adding employee:', employee.name);
    
    // Add to Firestore first
    const currentUser = get().currentUser;
    if (!currentUser) {
      console.error('❌ No current user, cannot add employee');
      throw new Error('User not logged in');
    }
    
    try {
      const { addEmployeeToFirestore } = await import('../services/employeeService');
      await addEmployeeToFirestore(currentUser.id, employee);
      console.log('✅ Employee added to Firestore');
      
      // DON'T update local state here - let realtime listener handle it!
      // This prevents duplicate entries when realtime listener triggers
      console.log('✅ Employee will be synced via realtime listener');
    } catch (error) {
      console.error('❌ Failed to add employee:', error);
      throw error;
    }
  },

  updateEmployee: async (id, updatedEmployee) => {
    console.log('📝 Updating employee:', id);
    
    const currentUser = get().currentUser;
    if (!currentUser) {
      console.error('❌ No current user, cannot update employee');
      throw new Error('User not logged in');
    }
    
    try {
      const { updateEmployeeInFirestore } = await import('../services/employeeService');
      await updateEmployeeInFirestore(currentUser.id, id, updatedEmployee);
      console.log('✅ Employee updated in Firestore - realtime listener will sync');
      
      // DON'T update local state here - let realtime listener handle it!
      // This prevents inconsistency and ensures single source of truth
    } catch (error) {
      console.error('❌ Failed to update employee:', error);
      throw error;
    }
  },

  deleteEmployee: async (id) => {
    console.log('🗑️ Deleting employee:', id);
    
    const currentUser = get().currentUser;
    if (!currentUser) {
      console.error('❌ No current user, cannot delete employee');
      throw new Error('User not logged in');
    }
    
    try {
      const { deleteEmployeeFromFirestore } = await import('../services/employeeService');
      await deleteEmployeeFromFirestore(currentUser.id, id);
      console.log('✅ Employee deleted from Firestore - realtime listener will sync');
      
      // DON'T update local state here - let realtime listener handle it!
      // This prevents inconsistency and ensures single source of truth
    } catch (error) {
      console.error('❌ Failed to delete employee:', error);
      throw error;
    }
  },

  setEmployeeSession: async (session) => {
    set({ employeeSession: session });
    
    // Save to AsyncStorage for persistence
    if (session) {
      await AsyncStorage.setItem('employeeSession', JSON.stringify(session));
      console.log('✅ Employee session saved to AsyncStorage');
    } else {
      await AsyncStorage.removeItem('employeeSession');
      console.log('✅ Employee session removed from AsyncStorage');
    }
  },

  loadEmployeesFromFirestore: async () => {
    const currentUser = get().currentUser;
    if (!currentUser) {
      console.log('⚠️ No current user, cannot load employees from Firestore');
      return;
    }

    try {
      console.log('📥 Loading employees from Firestore...');
      const { getEmployeesFromFirestore } = await import('../services/employeeService');
      const employees = await getEmployeesFromFirestore(currentUser.id);
      
      set({ employees });
      
      // Also save to localStorage as backup
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('employees', JSON.stringify(employees));
      
      console.log('✅ Employees loaded from Firestore:', employees.length);
    } catch (error) {
      console.error('❌ Error loading employees from Firestore:', error);
    }
  },

  loadProductsFromFirestore: async () => {
    const { currentUser, employeeSession } = get();
    const sellerUID = employeeSession?.sellerUID || currentUser?.id;
    
    if (!sellerUID) {
      console.log('⚠️ No seller UID, cannot load products from Firestore');
      return;
    }

    try {
      console.log('📥 Loading products from Firestore for seller:', sellerUID);
      const { getProductsFromFirestore } = await import('../services/dataService');
      const products = await getProductsFromFirestore(sellerUID);
      
      set({ products });
      
      // Also save to localStorage as backup
      await AsyncStorage.setItem('products', JSON.stringify(products));
      
      console.log('✅ Products loaded from Firestore:', products.length);
    } catch (error) {
      console.error('❌ Error loading products from Firestore:', error);
    }
  },

  loadTransactionsFromFirestore: async () => {
    const { currentUser, employeeSession } = get();
    const sellerUID = employeeSession?.sellerUID || currentUser?.id;
    
    if (!sellerUID) {
      console.log('⚠️ No seller UID, cannot load transactions from Firestore');
      return;
    }

    try {
      console.log('📥 Loading transactions from Firestore for seller:', sellerUID);
      const { getTransactionsFromFirestore } = await import('../services/dataService');
      const transactions = await getTransactionsFromFirestore(sellerUID);
      
      set({ transactions });
      
      // Also save to localStorage as backup
      await AsyncStorage.setItem('transactions', JSON.stringify(transactions));
      
      console.log('✅ Transactions loaded from Firestore:', transactions.length);
    } catch (error) {
      console.error('❌ Error loading transactions from Firestore:', error);
    }
  },

  loadCustomersFromFirestore: async () => {
    const { currentUser, employeeSession } = get();
    const sellerUID = employeeSession?.sellerUID || currentUser?.id;
    
    if (!sellerUID) {
      console.log('⚠️ No seller UID, cannot load customers from Firestore');
      return;
    }

    try {
      console.log('📥 Loading customers from Firestore for seller:', sellerUID);
      const { getCustomersFromFirestore } = await import('../services/dataService');
      const customers = await getCustomersFromFirestore(sellerUID);
      
      set({ customers });
      
      // Also save to localStorage as backup
      await AsyncStorage.setItem('customers', JSON.stringify(customers));
      
      console.log('✅ Customers loaded from Firestore:', customers.length);
    } catch (error) {
      console.error('❌ Error loading customers from Firestore:', error);
    }
  },

  addCategory: (category) => {
    set((state) => ({ categories: [...state.categories, category] }));
    get().saveData();
  },

  updateCategory: (id, updatedCategory) => {
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...updatedCategory } : c
      ),
    }));
    get().saveData();
  },

  deleteCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
    get().saveData();
  },

  updateSettings: (updatedSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...updatedSettings },
    }));
    get().saveData();
  },

  setTheme: async (theme) => {
    set({ theme });
    await AsyncStorage.setItem('theme', theme);
  },

  loadData: async () => {
    try {
      console.log('📂 Loading data...');
      
      // Load theme preference
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        set({ theme: savedTheme as 'light' | 'dark' | 'system' });
      }
      
      const { currentUser, employeeSession } = get();
      const sellerUID = employeeSession?.sellerUID || currentUser?.id;
      
      if (sellerUID) {
        // Load initial data from Firestore
        console.log('☁️ Loading initial data from Firestore for seller:', sellerUID);
        
        await Promise.all([
          get().loadProductsFromFirestore(),
          get().loadTransactionsFromFirestore(),
          get().loadCustomersFromFirestore(),
          get().loadEmployeesFromFirestore(),
        ]);
        
        console.log('✅ Initial data loaded from Firestore');
        
        // Start realtime listeners for automatic updates
        console.log('🔄 Starting realtime listeners...');
        get().startRealtimeListeners();
        
      } else {
        // Fallback to localStorage if no seller UID
        console.log('📂 Loading data from localStorage (fallback)...');
        
        const [productsData, transactionsData, customersData, categoriesData, settingsData] = await Promise.all([
          AsyncStorage.getItem('products'),
          AsyncStorage.getItem('transactions'),
          AsyncStorage.getItem('customers'),
          AsyncStorage.getItem('categories'),
          AsyncStorage.getItem('settings'),
        ]);

        const loadedData = {
          products: productsData ? JSON.parse(productsData) : [],
          transactions: transactionsData ? JSON.parse(transactionsData) : [],
          customers: customersData ? JSON.parse(customersData) : [],
          categories: categoriesData ? JSON.parse(categoriesData) : [],
          settings: settingsData ? JSON.parse(settingsData) : get().settings,
        };
        
        console.log('✅ Data loaded from localStorage:', {
          products: loadedData.products.length,
          transactions: loadedData.transactions.length,
          customers: loadedData.customers.length,
          categories: loadedData.categories.length,
        });
        
        set(loadedData);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
  },

  saveData: async () => {
    try {
      const { products, transactions, customers, employees, categories, settings } = get();
      console.log('💾 Saving data to localStorage...', {
        products: products.length,
        transactions: transactions.length,
        customers: customers.length,
        employees: employees.length,
        categories: categories.length,
      });
      
      await Promise.all([
        AsyncStorage.setItem('products', JSON.stringify(products)),
        AsyncStorage.setItem('transactions', JSON.stringify(transactions)),
        AsyncStorage.setItem('customers', JSON.stringify(customers)),
        AsyncStorage.setItem('employees', JSON.stringify(employees)),
        AsyncStorage.setItem('categories', JSON.stringify(categories)),
        AsyncStorage.setItem('settings', JSON.stringify(settings)),
      ]);
      
      console.log('✅ Data saved successfully');
    } catch (error) {
      console.error('❌ Error saving data:', error);
    }
  },

  startRealtimeListeners: () => {
    const { currentUser, employeeSession } = get();
    const sellerUID = employeeSession?.sellerUID || currentUser?.id;
    
    if (!sellerUID) {
      console.log('⚠️ No seller UID, cannot start realtime listeners');
      return;
    }
    
    console.log('🔄 Starting realtime listeners for seller:', sellerUID);
    
    // Stop existing listeners first
    get().stopRealtimeListeners();
    
    // Import services
    import('../services/dataService').then(({ subscribeToProducts, subscribeToTransactions, subscribeToCustomers }) => {
      // Products listener
      const unsubProducts = subscribeToProducts(sellerUID, (products) => {
        set({ products });
        AsyncStorage.setItem('products', JSON.stringify(products));
      });
      
      // Transactions listener
      const unsubTransactions = subscribeToTransactions(sellerUID, (transactions) => {
        set({ transactions });
        AsyncStorage.setItem('transactions', JSON.stringify(transactions));
      });
      
      // Customers listener
      const unsubCustomers = subscribeToCustomers(sellerUID, (customers) => {
        set({ customers });
        AsyncStorage.setItem('customers', JSON.stringify(customers));
      });
      
      set({
        unsubscribeProducts: unsubProducts,
        unsubscribeTransactions: unsubTransactions,
        unsubscribeCustomers: unsubCustomers,
      });
      
      console.log('✅ Realtime listeners started for products, transactions, customers');
    });
    
    // Employees listener (only for owner/admin)
    if (currentUser && !employeeSession) {
      import('../services/employeeService').then(({ subscribeToEmployees }) => {
        const unsubEmployees = subscribeToEmployees(currentUser.id, (employees) => {
          set({ employees });
          AsyncStorage.setItem('employees', JSON.stringify(employees));
        });
        
        set({ unsubscribeEmployees: unsubEmployees });
        console.log('✅ Realtime listener started for employees');
      });
    }
  },
  
  stopRealtimeListeners: () => {
    console.log('🛑 Stopping realtime listeners...');
    
    const { unsubscribeProducts, unsubscribeTransactions, unsubscribeCustomers, unsubscribeEmployees } = get();
    
    if (unsubscribeProducts) {
      unsubscribeProducts();
      console.log('✅ Products listener stopped');
    }
    if (unsubscribeTransactions) {
      unsubscribeTransactions();
      console.log('✅ Transactions listener stopped');
    }
    if (unsubscribeCustomers) {
      unsubscribeCustomers();
      console.log('✅ Customers listener stopped');
    }
    if (unsubscribeEmployees) {
      unsubscribeEmployees();
      console.log('✅ Employees listener stopped');
    }
    
    set({
      unsubscribeProducts: null,
      unsubscribeTransactions: null,
      unsubscribeCustomers: null,
      unsubscribeEmployees: null,
    });
  },

  resetStore: () => {
    console.log('🔄 Resetting store (logout)...');
    
    // Stop all realtime listeners
    get().stopRealtimeListeners();
    
    // Clear user session and cart, but keep data in localStorage
    // Data will be reloaded from Firestore on next login
    set({
      currentUser: null,
      cart: [],
      employeeSession: null,
      employees: [], // Clear employees from memory
    });
    
    console.log('✅ Store reset complete');
  },

  reloadSampleEmployees: async () => {
    try {
      const currentUser = get().currentUser;
      if (!currentUser) {
        console.error('❌ No current user, cannot reload sample employees');
        return;
      }

      console.log('🔄 Reloading sample employees...');
      const { generateSampleEmployees } = await import('../utils/sampleEmployees');
      const sampleEmployees = await generateSampleEmployees(currentUser.id);
      
      set({ employees: sampleEmployees });
      await AsyncStorage.setItem('employees', JSON.stringify(sampleEmployees));
      
      console.log('✅ Sample employees reloaded:', sampleEmployees.length);
      console.log('Employees:', sampleEmployees.map(e => `${e.name} (${e.username})`));
    } catch (error) {
      console.error('❌ Error reloading sample employees:', error);
    }
  },
}));
