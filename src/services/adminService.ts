import { collection, getDocs, doc, getDoc, updateDoc, query, orderBy, onSnapshot, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { PlanType, UserSubscription } from '../types/subscription';

// Admin credentials
// Note: In React Native/Expo, these are kept in config for simplicity
// For production, consider using Firebase Admin SDK or secure backend
export const ADMIN_EMAIL = 'betakasir@admin.com';
export const ADMIN_PASSWORD = 'BetaKasir2025!SecurePassword';

// Security warning
if (ADMIN_PASSWORD.length < 12) {
  console.warn('⚠️ WARNING: Admin password should be at least 12 characters for security.');
}

export interface SellerInfo {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  subscription?: UserSubscription;
  stats?: {
    productsCount: number;
    employeesCount: number;
    transactionsCount: number;
  };
}

/**
 * Check if user is admin
 */
export const isAdmin = (email: string): boolean => {
  return email === ADMIN_EMAIL;
};

/**
 * Get all sellers (users)
 */
export const getAllSellers = async (): Promise<SellerInfo[]> => {
  try {
    console.log('📥 Fetching all sellers...');
    
    // Get all users from Firestore
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const sellers: SellerInfo[] = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Skip admin account
      if (userData.email === ADMIN_EMAIL) continue;
      
      // Skip sales users (they have their own management screen)
      if (userData.role === 'sales') {
        console.log('⏭️ Skipping sales user:', userData.email);
        continue;
      }
      
      // Get subscription
      let subscription: UserSubscription | undefined;
      try {
        const subRef = doc(db, 'users', userDoc.id, 'subscription', 'current');
        const subDoc = await getDoc(subRef);
        if (subDoc.exists()) {
          subscription = subDoc.data() as UserSubscription;
        }
      } catch (error) {
        console.error('Error fetching subscription for', userDoc.id, error);
      }
      
      // Get real stats from collections (data stored in 'sellers' collection)
      let stats = {
        productsCount: 0,
        employeesCount: 0,
        transactionsCount: 0,
      };
      
      try {
        // Count products from sellers collection
        const productsRef = collection(db, 'sellers', userDoc.id, 'products');
        const productsSnapshot = await getDocs(productsRef);
        stats.productsCount = productsSnapshot.size;

        // Count employees from sellers collection
        const employeesRef = collection(db, 'sellers', userDoc.id, 'employees');
        const employeesSnapshot = await getDocs(employeesRef);
        stats.employeesCount = employeesSnapshot.size;

        // Count transactions from sellers collection
        const transactionsRef = collection(db, 'sellers', userDoc.id, 'transactions');
        const transactionsSnapshot = await getDocs(transactionsRef);
        stats.transactionsCount = transactionsSnapshot.size;

        console.log(`📊 Stats for ${userData.email}:`, stats);
      } catch (error) {
        console.error('Error fetching stats for', userDoc.id, error);
      }
      
      sellers.push({
        uid: userDoc.id,
        email: userData.email || '',
        displayName: userData.displayName || userData.name || 'Unknown',
        createdAt: userData.createdAt || new Date().toISOString(),
        subscription,
        stats,
      });
    }
    
    console.log('✅ Fetched', sellers.length, 'sellers');
    return sellers;
  } catch (error) {
    console.error('❌ Error fetching sellers:', error);
    throw error;
  }
};

/**
 * Get seller details
 */
export const getSellerDetails = async (sellerId: string): Promise<SellerInfo | null> => {
  try {
    const userRef = doc(db, 'users', sellerId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    
    // Get subscription
    let subscription: UserSubscription | undefined;
    const subRef = doc(db, 'users', sellerId, 'subscription', 'current');
    const subDoc = await getDoc(subRef);
    if (subDoc.exists()) {
      subscription = subDoc.data() as UserSubscription;
    }
    
    return {
      uid: sellerId,
      email: userData.email || '',
      displayName: userData.displayName || userData.name || 'Unknown',
      createdAt: userData.createdAt || new Date().toISOString(),
      subscription,
    };
  } catch (error) {
    console.error('❌ Error fetching seller details:', error);
    throw error;
  }
};

/**
 * Update seller subscription (Admin only)
 */
export const updateSellerSubscription = async (
  sellerId: string,
  newPlan: PlanType,
  durationMonths: number = 1,
  customEndDate?: Date
): Promise<void> => {
  try {
    console.log('🔄 Updating subscription for seller:', sellerId);
    console.log('New plan:', newPlan, 'Duration:', durationMonths, 'months');
    
    const now = new Date();
    let endDate: Date;
    
    if (customEndDate) {
      // Use custom end date if provided
      endDate = customEndDate;
      console.log('📅 Using custom end date:', endDate.toISOString());
    } else {
      // Calculate end date from duration
      endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + durationMonths);
      console.log('⏰ Calculated end date from duration:', endDate.toISOString());
    }
    
    const subscriptionData: Partial<UserSubscription> = {
      planType: newPlan,
      status: 'active',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: false,
      lastPaymentDate: now.toISOString(),
      nextBillingDate: endDate.toISOString(),
    };
    
    const subRef = doc(db, 'users', sellerId, 'subscription', 'current');
    await updateDoc(subRef, subscriptionData);
    
    console.log('✅ Subscription updated successfully');
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    throw error;
  }
};

/**
 * Create default subscription for seller (if not exists)
 */
export const createDefaultSubscription = async (sellerId: string): Promise<void> => {
  try {
    const subRef = doc(db, 'users', sellerId, 'subscription', 'current');
    const subDoc = await getDoc(subRef);
    
    if (!subDoc.exists()) {
      const defaultSubscription = {
        userId: sellerId,
        planType: 'free',
        status: 'trial',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: false,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      await updateDoc(subRef, defaultSubscription as any);
      console.log('✅ Created default subscription for seller:', sellerId);
    }
  } catch (error) {
    console.error('❌ Error creating default subscription:', error);
    throw error;
  }
};

// Cache for seller stats to reduce Firestore reads
const statsCache = new Map<string, { stats: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached stats or fetch from Firestore
 */
const getCachedStats = async (sellerId: string) => {
  const cached = statsCache.get(sellerId);
  const now = Date.now();
  
  // Return cached if still valid
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.stats;
  }
  
  // Fetch fresh stats
  const stats = {
    productsCount: 0,
    employeesCount: 0,
    transactionsCount: 0,
  };
  
  try {
    // Use aggregation queries if available, otherwise count
    const productsRef = collection(db, 'sellers', sellerId, 'products');
    const productsSnapshot = await getDocs(productsRef);
    stats.productsCount = productsSnapshot.size;

    const employeesRef = collection(db, 'sellers', sellerId, 'employees');
    const employeesSnapshot = await getDocs(employeesRef);
    stats.employeesCount = employeesSnapshot.size;

    const transactionsRef = collection(db, 'sellers', sellerId, 'transactions');
    const transactionsSnapshot = await getDocs(transactionsRef);
    stats.transactionsCount = transactionsSnapshot.size;
    
    // Cache the result
    statsCache.set(sellerId, { stats, timestamp: now });
  } catch (error) {
    console.error('Error fetching stats for', sellerId, error);
  }
  
  return stats;
};

/**
 * Subscribe to realtime sellers updates (OPTIMIZED)
 * Returns unsubscribe function
 */
export const subscribeToSellers = (
  onUpdate: (sellers: SellerInfo[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  console.log('🔄 Setting up optimized realtime listener for sellers...');
  
  const usersRef = collection(db, 'users');
  
  const unsubscribe = onSnapshot(
    usersRef,
    async (snapshot) => {
      try {
        console.log('📥 Realtime update received!');
        console.log('📊 Document changes:', snapshot.docChanges().length);
        
        const sellers: SellerInfo[] = [];
        
        // Process only changed documents for better performance
        const changedDocs = snapshot.docChanges();
        const hasChanges = changedDocs.length > 0;
        
        if (hasChanges) {
          // Log changes
          changedDocs.forEach((change) => {
            const email = change.doc.data().email;
            if (change.type === 'added') console.log('➕ Added:', email);
            if (change.type === 'modified') console.log('✏️ Modified:', email);
            if (change.type === 'removed') console.log('🗑️ Removed:', email);
          });
        }
        
        // Process all docs (use cached stats for unchanged ones)
        for (const userDoc of snapshot.docs) {
          const userData = userDoc.data();
          
          // Skip admin and sales users
          if (userData.email === ADMIN_EMAIL || userData.role === 'sales') continue;
          
          // Get subscription (lightweight query)
          let subscription: UserSubscription | undefined;
          try {
            const subRef = doc(db, 'users', userDoc.id, 'subscription', 'current');
            const subDoc = await getDoc(subRef);
            if (subDoc.exists()) {
              subscription = subDoc.data() as UserSubscription;
            }
          } catch (error) {
            console.error('Error fetching subscription for', userDoc.id, error);
          }
          
          // Get stats (use cache to reduce reads)
          const stats = await getCachedStats(userDoc.id);
          
          sellers.push({
            uid: userDoc.id,
            email: userData.email || '',
            displayName: userData.displayName || userData.name || 'Unknown',
            createdAt: userData.createdAt || new Date().toISOString(),
            subscription,
            stats,
          });
        }
        
        console.log('✅ Realtime update processed:', sellers.length, 'sellers');
        onUpdate(sellers);
      } catch (error: unknown) {
        console.error('❌ Error processing realtime update:', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    },
    (error) => {
      console.error('❌ Realtime listener error:', error);
      if (onError) {
        onError(error);
      }
    }
  );
  
  console.log('✅ Optimized realtime listener setup complete');
  return unsubscribe;
};


/**
 * Delete seller account and all related data
 * WARNING: This is a destructive operation!
 */
export const deleteSeller = async (sellerId: string): Promise<void> => {
  try {
    console.log('🗑️ Starting deletion process for seller:', sellerId);
    
    const batch = writeBatch(db);
    
    // 1. Delete all products
    console.log('🗑️ Deleting products...');
    const productsRef = collection(db, 'sellers', sellerId, 'products');
    const productsSnapshot = await getDocs(productsRef);
    productsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    console.log(`✅ Marked ${productsSnapshot.size} products for deletion`);
    
    // 2. Delete all transactions
    console.log('🗑️ Deleting transactions...');
    const transactionsRef = collection(db, 'sellers', sellerId, 'transactions');
    const transactionsSnapshot = await getDocs(transactionsRef);
    transactionsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    console.log(`✅ Marked ${transactionsSnapshot.size} transactions for deletion`);
    
    // 3. Delete all employees
    console.log('🗑️ Deleting employees...');
    const employeesRef = collection(db, 'sellers', sellerId, 'employees');
    const employeesSnapshot = await getDocs(employeesRef);
    employeesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    console.log(`✅ Marked ${employeesSnapshot.size} employees for deletion`);
    
    // 4. Delete all customers
    console.log('🗑️ Deleting customers...');
    const customersRef = collection(db, 'sellers', sellerId, 'customers');
    const customersSnapshot = await getDocs(customersRef);
    customersSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    console.log(`✅ Marked ${customersSnapshot.size} customers for deletion`);
    
    // 5. Delete subscription
    console.log('🗑️ Deleting subscription...');
    const subRef = doc(db, 'users', sellerId, 'subscription', 'current');
    batch.delete(subRef);
    
    // 6. Delete seller document
    console.log('🗑️ Deleting seller document...');
    const sellerRef = doc(db, 'sellers', sellerId);
    batch.delete(sellerRef);
    
    // 7. Delete user document
    console.log('🗑️ Deleting user document...');
    const userRef = doc(db, 'users', sellerId);
    batch.delete(userRef);
    
    // Commit all deletions
    console.log('💾 Committing batch delete...');
    await batch.commit();
    
    console.log('✅ Seller account and all data deleted successfully');
    
    // Note: Firebase Authentication user deletion requires Admin SDK
    // which is not available in client-side code
    // You would need to implement this via Cloud Functions
    console.log('⚠️ Note: Firebase Auth user still exists. Delete manually from Firebase Console or use Cloud Functions.');
    
  } catch (error) {
    console.error('❌ Error deleting seller:', error);
    throw error;
  }
};
