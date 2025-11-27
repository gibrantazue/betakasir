import { useState, useEffect } from 'react';
import { UserSubscription, PlanType, canAccessFeature, checkLimit, getPlanFeatures } from '../types/subscription';
import { useStore } from '../store/useStore';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Hook untuk manage subscription user
 * Mendukung employee yang menggunakan subscription seller-nya
 */
export const useSubscription = () => {
  const { user } = useAuth();
  const employeeSession = useStore((state) => state.employeeSession);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 useSubscription effect triggered');
    console.log('Firebase User:', user ? user.uid : 'null');
    console.log('Employee Session:', employeeSession);
    console.log('Employee Session sellerUID:', employeeSession?.sellerUID);
    
    // Jika employee login, user bisa null tapi employeeSession ada
    if (!user && !employeeSession) {
      console.log('⚠️ No user and no employee session');
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Tentukan user ID yang akan digunakan untuk subscription
    // Jika employee login, gunakan sellerUID
    // Jika seller login, gunakan user.uid
    const subscriptionUserId = employeeSession?.sellerUID || user?.uid;
    
    if (!subscriptionUserId) {
      console.log('❌ No subscription user ID found');
      setSubscription(null);
      setLoading(false);
      return;
    }
    
    console.log('🔄 Setting up subscription listener');
    console.log('User ID:', user?.uid || 'null');
    console.log('Employee Session:', employeeSession ? 'Active' : 'None');
    console.log('Subscription User ID:', subscriptionUserId);

    // Setup realtime listener for subscription
    const subRef = doc(db, 'users', subscriptionUserId, 'subscription', 'current');
    
    const unsubscribe = onSnapshot(
      subRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserSubscription;
          console.log('✅ Subscription data loaded:', data);
          setSubscription(data);
        } else {
          console.log('⚠️ No subscription document found, using default');
          // Default free trial
          const defaultSubscription: UserSubscription = {
            userId: subscriptionUserId,
            planType: 'free',
            status: 'trial',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            autoRenew: false,
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          };
          setSubscription(defaultSubscription);
        }
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error loading subscription:', error);
        setLoading(false);
      }
    );

    return () => {
      console.log('🔴 Cleaning up subscription listener');
      unsubscribe();
    };
  }, [user, employeeSession]);

  const hasFeature = (featureKey: keyof ReturnType<typeof getPlanFeatures>): boolean => {
    if (!subscription) return false;
    return canAccessFeature(subscription.planType, featureKey);
  };

  const checkFeatureLimit = (
    limitKey: 'maxProducts' | 'maxEmployees' | 'maxTransactionsPerMonth' | 'maxLocations',
    currentCount: number
  ) => {
    if (!subscription) {
      return { allowed: false, limit: 0, remaining: 0 };
    }
    return checkLimit(subscription.planType, limitKey, currentCount);
  };

  const upgradePlan = async (newPlan: PlanType) => {
    try {
      // TODO: Implement payment & upgrade logic
      console.log('Upgrading to:', newPlan);
      
      if (subscription) {
        const updatedSubscription: UserSubscription = {
          ...subscription,
          planType: newPlan,
          status: 'active',
        };
        setSubscription(updatedSubscription);
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      throw error;
    }
  };

  const cancelSubscription = async () => {
    try {
      // TODO: Implement cancellation logic
      if (subscription) {
        const updatedSubscription: UserSubscription = {
          ...subscription,
          status: 'cancelled',
          autoRenew: false,
        };
        setSubscription(updatedSubscription);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  };

  const isTrialExpired = (): boolean => {
    if (!subscription || !subscription.trialEndsAt) return false;
    return new Date(subscription.trialEndsAt) < new Date();
  };

  const getDaysUntilExpiry = (): number => {
    if (!subscription) return 0;
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const isSubscriptionExpired = (): boolean => {
    if (!subscription) return false;
    
    // Check if subscription is expired
    if (subscription.status === 'expired') return true;
    
    // Check if end date has passed
    if (subscription.endDate) {
      const endDate = new Date(subscription.endDate);
      const now = new Date();
      return endDate < now;
    }
    
    return false;
  };

  return {
    subscription,
    loading,
    hasFeature,
    checkFeatureLimit,
    upgradePlan,
    cancelSubscription,
    isTrialExpired,
    getDaysUntilExpiry,
    isSubscriptionExpired,
  };
};
