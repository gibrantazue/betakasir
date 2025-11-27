/**
 * Migration Script: Create Firestore documents for existing Firebase Auth users
 * 
 * This script will:
 * 1. Get all users from Firebase Authentication
 * 2. Check if they have Firestore document
 * 3. Create document if missing
 * 4. Create default subscription
 */

import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  details: Array<{
    email: string;
    status: 'migrated' | 'skipped' | 'error';
    message?: string;
  }>;
}

/**
 * Migrate a single user to Firestore
 */
export const migrateUser = async (
  uid: string,
  email: string,
  displayName?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`📝 Migrating user: ${email}`);
    
    // Check if user document already exists
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log(`⏭️  User ${email} already has Firestore document, skipping...`);
      return { success: true, message: 'Already exists' };
    }
    
    // Create user document
    await setDoc(userRef, {
      uid: uid,
      email: email,
      displayName: displayName || email?.split('@')[0] || 'User',
      name: displayName || email?.split('@')[0] || 'User',
      role: 'seller',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      migratedAt: new Date().toISOString(), // Mark as migrated
    });
    
    console.log(`✅ User document created for ${email}`);
    
    // Check if subscription exists
    const subRef = doc(db, 'users', uid, 'subscription', 'current');
    const subDoc = await getDoc(subRef);
    
    if (!subDoc.exists()) {
      // Create default subscription (7 days free trial)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      
      await setDoc(subRef, {
        userId: uid,
        planType: 'free',
        status: 'trial',
        startDate: new Date().toISOString(),
        endDate: trialEndDate.toISOString(),
        autoRenew: false,
        trialEndsAt: trialEndDate.toISOString(),
        createdAt: new Date().toISOString(),
      });
      
      console.log(`✅ Default subscription created for ${email}`);
    }
    
    return { success: true, message: 'Migrated successfully' };
  } catch (error: any) {
    console.error(`❌ Error migrating user ${email}:`, error);
    return { success: false, message: error.message };
  }
};

/**
 * Get all users from Firestore (to check who's already migrated)
 */
export const getExistingFirestoreUsers = async (): Promise<Set<string>> => {
  try {
    const usersRef = collection(db, 'users');
    const { getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(usersRef);
    
    const existingUids = new Set<string>();
    snapshot.forEach(doc => {
      existingUids.add(doc.id);
    });
    
    return existingUids;
  } catch (error) {
    console.error('Error getting existing Firestore users:', error);
    return new Set();
  }
};

/**
 * Manual migration function for specific users
 * Use this if you know the user details
 */
export const migrateSpecificUsers = async (
  users: Array<{ uid: string; email: string; displayName?: string }>
): Promise<MigrationResult> => {
  const result: MigrationResult = {
    total: users.length,
    migrated: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };
  
  console.log(`🚀 Starting migration for ${users.length} users...`);
  
  for (const user of users) {
    const { success, message } = await migrateUser(user.uid, user.email, user.displayName);
    
    if (success) {
      if (message === 'Already exists') {
        result.skipped++;
        result.details.push({
          email: user.email,
          status: 'skipped',
          message,
        });
      } else {
        result.migrated++;
        result.details.push({
          email: user.email,
          status: 'migrated',
          message,
        });
      }
    } else {
      result.errors++;
      result.details.push({
        email: user.email,
        status: 'error',
        message,
      });
    }
  }
  
  console.log('📊 Migration Summary:');
  console.log(`   Total: ${result.total}`);
  console.log(`   ✅ Migrated: ${result.migrated}`);
  console.log(`   ⏭️  Skipped: ${result.skipped}`);
  console.log(`   ❌ Errors: ${result.errors}`);
  
  return result;
};

/**
 * Example usage:
 * 
 * import { migrateSpecificUsers } from './utils/migrateExistingUsers';
 * 
 * const users = [
 *   { uid: 'xxx', email: 'user1@example.com', displayName: 'User 1' },
 *   { uid: 'yyy', email: 'user2@example.com', displayName: 'User 2' },
 * ];
 * 
 * const result = await migrateSpecificUsers(users);
 * console.log(result);
 */
