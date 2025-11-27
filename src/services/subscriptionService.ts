import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserSubscription, PlanType } from '../types/subscription';

/**
 * Get user subscription from Firestore
 */
export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
  try {
    const subscriptionRef = doc(db, 'users', userId, 'subscription', 'current');
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (subscriptionDoc.exists()) {
      const data = subscriptionDoc.data() as UserSubscription;
      
      // Migration: Convert old 'business' plan to 'pro'
      if (data.planType === 'business' as any) {
        console.log('🔄 Migrating old business plan to pro plan');
        data.planType = 'pro';
        // Update in Firestore
        await updateDoc(subscriptionRef, { planType: 'pro' });
        console.log('✅ Migration complete: business → pro');
      }
      
      return data;
    }
    
    // Jika belum ada subscription, buat default free trial
    const defaultSubscription: UserSubscription = {
      userId,
      planType: 'free',
      status: 'trial',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 hari
      autoRenew: false,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    await setDoc(subscriptionRef, defaultSubscription);
    console.log('✅ Created default free trial subscription');
    
    return defaultSubscription;
  } catch (error) {
    console.error('❌ Error getting subscription:', error);
    return null;
  }
};

/**
 * Get subscription for employee (menggunakan subscription seller-nya)
 * Employee akan mengikuti plan dan status subscription dari seller
 */
export const getEmployeeSubscription = async (sellerUID: string): Promise<UserSubscription | null> => {
  try {
    console.log('🔍 Getting subscription for seller:', sellerUID);
    const subscription = await getUserSubscription(sellerUID);
    
    if (subscription) {
      console.log('✅ Employee will use seller subscription:', subscription.planType);
    }
    
    return subscription;
  } catch (error) {
    console.error('❌ Error getting employee subscription:', error);
    return null;
  }
};

/**
 * Update user subscription
 */
export const updateUserSubscription = async (
  userId: string,
  updates: Partial<UserSubscription>
): Promise<void> => {
  try {
    const subscriptionRef = doc(db, 'users', userId, 'subscription', 'current');
    await updateDoc(subscriptionRef, updates);
    console.log('✅ Subscription updated');
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    throw error;
  }
};

/**
 * Upgrade user plan
 */
export const upgradePlan = async (
  userId: string,
  newPlan: PlanType,
  billingCycle: 'monthly' | 'yearly' = 'monthly'
): Promise<void> => {
  try {
    const now = new Date();
    const endDate = billingCycle === 'monthly'
      ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    const updates: Partial<UserSubscription> = {
      planType: newPlan,
      status: 'active',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: true,
      lastPaymentDate: now.toISOString(),
      nextBillingDate: endDate.toISOString(),
    };
    
    await updateUserSubscription(userId, updates);
    
    // Log upgrade event
    await logSubscriptionEvent(userId, 'upgrade', {
      from: 'free',
      to: newPlan,
      billingCycle,
    });
    
    console.log(`✅ Upgraded to ${newPlan} plan`);
    
    // Trigger referral commission if applicable
    try {
      const { triggerUpgradeCommission } = await import('./referralService');
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        await triggerUpgradeCommission(
          userId,
          userData.displayName || userData.name || 'User',
          userData.email || '',
          newPlan
        );
      }
    } catch (commissionError) {
      console.error('⚠️ Error triggering commission (non-critical):', commissionError);
      // Don't throw error, commission is optional
    }
  } catch (error) {
    console.error('❌ Error upgrading plan:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (userId: string): Promise<void> => {
  try {
    const updates: Partial<UserSubscription> = {
      status: 'cancelled',
      autoRenew: false,
    };
    
    await updateUserSubscription(userId, updates);
    
    // Log cancellation event
    await logSubscriptionEvent(userId, 'cancel', {});
    
    console.log('✅ Subscription cancelled');
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    throw error;
  }
};

/**
 * Renew subscription
 */
export const renewSubscription = async (
  userId: string,
  billingCycle: 'monthly' | 'yearly' = 'monthly'
): Promise<void> => {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    const now = new Date();
    const endDate = billingCycle === 'monthly'
      ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    const updates: Partial<UserSubscription> = {
      status: 'active',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      lastPaymentDate: now.toISOString(),
      nextBillingDate: endDate.toISOString(),
    };
    
    await updateUserSubscription(userId, updates);
    
    // Log renewal event
    await logSubscriptionEvent(userId, 'renew', {
      planType: subscription.planType,
      billingCycle,
    });
    
    console.log('✅ Subscription renewed');
  } catch (error) {
    console.error('❌ Error renewing subscription:', error);
    throw error;
  }
};

/**
 * Check if subscription is expired
 */
export const isSubscriptionExpired = (subscription: UserSubscription): boolean => {
  const now = new Date();
  const endDate = new Date(subscription.endDate);
  return endDate < now;
};

/**
 * Check if trial is expired
 */
export const isTrialExpired = (subscription: UserSubscription): boolean => {
  if (!subscription.trialEndsAt) return false;
  const now = new Date();
  const trialEndDate = new Date(subscription.trialEndsAt);
  return trialEndDate < now;
};

/**
 * Get days until expiry
 */
export const getDaysUntilExpiry = (subscription: UserSubscription): number => {
  const now = new Date();
  const endDate = new Date(subscription.endDate);
  const diff = endDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Subscribe to subscription changes (realtime)
 */
export const subscribeToSubscription = (
  userId: string,
  callback: (subscription: UserSubscription | null) => void
): (() => void) => {
  const subscriptionRef = doc(db, 'users', userId, 'subscription', 'current');
  
  const unsubscribe = onSnapshot(
    subscriptionRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserSubscription);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('❌ Error subscribing to subscription:', error);
      callback(null);
    }
  );
  
  return unsubscribe;
};

/**
 * Log subscription events for analytics
 */
const logSubscriptionEvent = async (
  userId: string,
  eventType: 'upgrade' | 'downgrade' | 'cancel' | 'renew' | 'trial_start' | 'trial_end',
  metadata: any
): Promise<void> => {
  try {
    const eventRef = doc(db, 'users', userId, 'subscription_events', new Date().toISOString());
    await setDoc(eventRef, {
      userId,
      eventType,
      metadata,
      timestamp: new Date().toISOString(),
    });
    console.log(`✅ Logged subscription event: ${eventType}`);
  } catch (error) {
    console.error('❌ Error logging subscription event:', error);
  }
};

/**
 * Get subscription usage stats
 */
export const getSubscriptionUsage = async (userId: string) => {
  try {
    // Get counts from Firestore
    const productsSnapshot = await getDoc(doc(db, 'users', userId, 'stats', 'products'));
    const employeesSnapshot = await getDoc(doc(db, 'users', userId, 'stats', 'employees'));
    const transactionsSnapshot = await getDoc(doc(db, 'users', userId, 'stats', 'transactions'));
    
    return {
      productsCount: productsSnapshot.exists() ? productsSnapshot.data().count : 0,
      employeesCount: employeesSnapshot.exists() ? employeesSnapshot.data().count : 0,
      monthlyTransactionsCount: transactionsSnapshot.exists() ? transactionsSnapshot.data().monthlyCount : 0,
      locationsCount: 1, // TODO: implement multi-location
    };
  } catch (error) {
    console.error('❌ Error getting subscription usage:', error);
    return {
      productsCount: 0,
      employeesCount: 0,
      monthlyTransactionsCount: 0,
      locationsCount: 1,
    };
  }
};

/**
 * Update usage stats (call this when adding/removing items)
 */
export const updateUsageStats = async (
  userId: string,
  statType: 'products' | 'employees' | 'transactions',
  increment: number
): Promise<void> => {
  try {
    const statsRef = doc(db, 'users', userId, 'stats', statType);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      const currentCount = statsDoc.data().count || 0;
      await updateDoc(statsRef, {
        count: currentCount + increment,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      await setDoc(statsRef, {
        count: Math.max(0, increment),
        lastUpdated: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('❌ Error updating usage stats:', error);
  }
};
