import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../hooks/useSubscription';
import { PlanFeatures } from '../types/subscription';
import { useNavigation } from '@react-navigation/native';

interface FeatureGateProps {
  feature: keyof PlanFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

/**
 * Component untuk membatasi akses fitur berdasarkan subscription plan
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}) => {
  const { hasFeature } = useSubscription();
  const navigation = useNavigation();

  const hasAccess = hasFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <View style={styles.upgradePrompt}>
        <Ionicons name="lock-closed" size={48} color="#666" />
        <Text style={styles.upgradeTitle}>Fitur Premium</Text>
        <Text style={styles.upgradeText}>
          Upgrade ke plan Standard atau Pro untuk mengakses fitur ini
        </Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('Billing' as never)}
        >
          <Text style={styles.upgradeButtonText}>Lihat Plan</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

interface LimitGateProps {
  limitType: 'maxProducts' | 'maxEmployees' | 'maxTransactionsPerMonth' | 'maxLocations';
  currentCount: number;
  children: React.ReactNode;
  onLimitReached?: () => void;
}

/**
 * Component untuk check limit berdasarkan subscription plan
 */
export const LimitGate: React.FC<LimitGateProps> = ({
  limitType,
  currentCount,
  children,
  onLimitReached,
}) => {
  const { checkFeatureLimit } = useSubscription();
  const navigation = useNavigation();

  const { allowed, limit, remaining } = checkFeatureLimit(limitType, currentCount);

  const handlePress = () => {
    if (!allowed) {
      if (onLimitReached) {
        onLimitReached();
      } else {
        Alert.alert(
          'Limit Tercapai',
          `Anda telah mencapai limit ${getLimitLabel(limitType)} (${limit}). Upgrade plan untuk menambah limit.`,
          [
            { text: 'Batal', style: 'cancel' },
            {
              text: 'Upgrade',
              onPress: () => navigation.navigate('Billing' as never),
            },
          ]
        );
      }
      return;
    }
  };

  // Jika masih dalam limit, render children
  if (allowed) {
    return <>{children}</>;
  }

  // Jika sudah mencapai limit, tampilkan peringatan
  return (
    <View style={styles.limitWarning}>
      <Ionicons name="warning" size={24} color="#F59E0B" />
      <Text style={styles.limitText}>
        Limit {getLimitLabel(limitType)} tercapai ({limit})
      </Text>
      <TouchableOpacity
        style={styles.upgradeButtonSmall}
        onPress={() => navigation.navigate('Billing' as never)}
      >
        <Text style={styles.upgradeButtonTextSmall}>Upgrade</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Component untuk menampilkan warning saat mendekati limit
 */
export const LimitWarning: React.FC<{
  limitType: 'maxProducts' | 'maxEmployees' | 'maxTransactionsPerMonth' | 'maxLocations';
  currentCount: number;
  warningThreshold?: number; // percentage (default 80%)
}> = ({ limitType, currentCount, warningThreshold = 80 }) => {
  const { checkFeatureLimit } = useSubscription();
  const navigation = useNavigation();

  const { limit, remaining } = checkFeatureLimit(limitType, currentCount);

  // Jika unlimited, tidak perlu warning
  if (limit === -1) return null;

  const percentage = (currentCount / limit) * 100;

  // Jika belum mencapai threshold, tidak tampilkan warning
  if (percentage < warningThreshold) return null;

  return (
    <View style={styles.warningBanner}>
      <Ionicons name="alert-circle" size={20} color="#F59E0B" />
      <Text style={styles.warningText}>
        {remaining} {getLimitLabel(limitType)} tersisa dari {limit}
      </Text>
      <TouchableOpacity onPress={() => navigation.navigate('Billing' as never)}>
        <Text style={styles.warningLink}>Upgrade</Text>
      </TouchableOpacity>
    </View>
  );
};

const getLimitLabel = (limitType: string): string => {
  const labels: Record<string, string> = {
    maxProducts: 'produk',
    maxEmployees: 'karyawan',
    maxTransactionsPerMonth: 'transaksi per bulan',
    maxLocations: 'lokasi',
  };
  return labels[limitType] || limitType;
};

const styles = StyleSheet.create({
  upgradePrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0a0a0a',
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  upgradeText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC143C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  limitText: {
    flex: 1,
    fontSize: 14,
    color: '#F59E0B',
  },
  upgradeButtonSmall: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonTextSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#F59E0B',
  },
  warningLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC143C',
  },
});
