import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { useSubscription } from '../hooks/useSubscription';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../hooks/useTheme';
import { RestockRequest } from '../types/restock';
import { RestockItem } from '../types/restock';
import { Product } from 'electron';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const { transactions, products, settings } = useStore();
  const { isDesktop, deviceType, width: screenWidth } = useResponsive();
  const { subscription } = useSubscription();
  const { colors } = useTheme();
  const [todaySales, setTodaySales] = useState(0);
  const [todayTransactions, setTodayTransactions] = useState(0);
  const [lowStock, setLowStock] = useState(0);

  // Get plan badge text based on subscription
  const getPlanBadgeText = () => {
    console.log('🔍 HomeScreen - Subscription data:', subscription);
    console.log('🔍 HomeScreen - Plan type:', subscription?.planType);
    
    if (!subscription) {
      console.log('⚠️ No subscription data');
      return null;
    }
    
    switch (subscription.planType) {
      case 'free':
        console.log('✅ Free plan - no badge');
        return null; // Don't show badge for free
      case 'standard':
        console.log('✅ Standard plan - show STANDARD badge');
        return 'STANDARD';
      case 'pro':
        console.log('✅ Pro plan - show PRO badge');
        return 'PRO';
      default:
        console.log('⚠️ Unknown plan type:', subscription.planType);
        return null;
    }
  };

  const planBadgeText = getPlanBadgeText();

  // Get subscription info
  const getSubscriptionInfo = () => {
    if (!subscription) return null;

    const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
    const now = new Date();
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    let statusColor = '#10B981'; // Green
    let statusText = 'Aktif';
    let statusIcon: any = 'checkmark-circle';

    if (daysRemaining <= 0) {
      statusColor = '#EF4444'; // Red
      statusText = 'Berakhir';
      statusIcon = 'close-circle';
    } else if (daysRemaining <= 7) {
      statusColor = '#F59E0B'; // Orange
      statusText = 'Segera Berakhir';
      statusIcon = 'warning';
    }

    return {
      planName: subscription.planType === 'free' ? 'Free Trial' : subscription.planType === 'standard' ? 'Standard' : 'Pro',
      endDate: endDate ? endDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-',
      daysRemaining,
      statusColor,
      statusText,
      statusIcon,
    };
  };

  const subscriptionInfo = getSubscriptionInfo();

  useEffect(() => {
    const today = new Date().toDateString();
    const todayTrans = transactions.filter(
      (t) => new Date(t.createdAt).toDateString() === today
    );
    
    setTodaySales(todayTrans.reduce((sum, t) => sum + t.total, 0));
    setTodayTransactions(todayTrans.length);
    setLowStock(products.filter((p) => p.stock < 10).length);
  }, [transactions, products]);

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color, backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon} size={32} color={color} />
      <View style={styles.statContent}>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );

  const QuickAction = ({ title, icon, color, onPress }: any) => (
    <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <Text style={[styles.quickActionText, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{settings.storeName || 'BetaKasir'}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Dashboard</Text>
          </View>
          <View style={styles.headerRight}>
            {isDesktop && (
              <View style={[styles.modeIndicator, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="desktop-outline" size={20} color="#DC143C" />
                <Text style={[styles.modeText, { color: colors.text }]}>Mode Desktop</Text>
                {planBadgeText && (
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeBadgeText}>{planBadgeText}</Text>
                  </View>
                )}
              </View>
            )}
            <ThemeToggle />
          </View>
        </View>

        {/* Subscription Info Card */}
        {subscriptionInfo && (
          <View style={[styles.subscriptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionTitleRow}>
                <Ionicons name="card-outline" size={20} color="#DC143C" />
                <Text style={[styles.subscriptionTitle, { color: colors.text }]}>Subscription</Text>
              </View>
              <View style={[styles.subscriptionStatusBadge, { backgroundColor: subscriptionInfo.statusColor + '20', borderColor: subscriptionInfo.statusColor }]}>
                <Ionicons name={subscriptionInfo.statusIcon} size={14} color={subscriptionInfo.statusColor} />
                <Text style={[styles.subscriptionStatusText, { color: subscriptionInfo.statusColor }]}>
                  {subscriptionInfo.statusText}
                </Text>
              </View>
            </View>

            <View style={styles.subscriptionBody}>
              <View style={styles.subscriptionRow}>
                <Text style={[styles.subscriptionLabel, { color: colors.textSecondary }]}>Plan:</Text>
                <Text style={[styles.subscriptionValue, { color: colors.text }]}>{subscriptionInfo.planName}</Text>
              </View>
              <View style={styles.subscriptionRow}>
                <Text style={[styles.subscriptionLabel, { color: colors.textSecondary }]}>Berakhir:</Text>
                <Text style={[styles.subscriptionValue, { color: colors.text }]}>{subscriptionInfo.endDate}</Text>
              </View>
              <View style={styles.subscriptionRow}>
                <Text style={[styles.subscriptionLabel, { color: colors.textSecondary }]}>Sisa Waktu:</Text>
                <Text style={[styles.subscriptionValue, { color: subscriptionInfo.statusColor, fontWeight: '600' }]}>
                  {subscriptionInfo.daysRemaining > 0 ? `${subscriptionInfo.daysRemaining} hari lagi` : 'Sudah berakhir'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Info Mode Desktop */}


      <View style={styles.statsContainer}>
        <StatCard
          title="Penjualan Hari Ini"
          value={formatCurrency(todaySales)}
          icon="cash-outline"
          color="#DC143C"
        />
        <StatCard
          title="Transaksi Hari Ini"
          value={todayTransactions}
          icon="receipt-outline"
          color="#DC143C"
        />
        <StatCard
          title="Stok Menipis"
          value={lowStock}
          icon="alert-circle-outline"
          color="#DC143C"
        />
        <StatCard
          title="Total Produk"
          value={products.length}
          icon="cube-outline"
          color="#DC143C"
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Menu Cepat</Text>
      <View style={styles.quickActionsContainer}>
        <QuickAction
          title="Kasir"
          icon="cart-outline"
          color="#DC143C"
          onPress={() => navigation.navigate('Cashier')}
        />
        <QuickAction
          title="Produk"
          icon="cube-outline"
          color="#DC143C"
          onPress={() => navigation.navigate('Products')}
        />
        <QuickAction
          title="Transaksi"
          icon="receipt-outline"
          color="#DC143C"
          onPress={() => navigation.navigate('Transactions')}
        />
        <QuickAction
          title="Pelanggan"
          icon="people-outline"
          color="#DC143C"
          onPress={() => navigation.navigate('Customers')}
        />
        <QuickAction
          title="Laporan"
          icon="stats-chart-outline"
          color="#DC143C"
          onPress={() => navigation.navigate('Reports')}
        />
        <QuickAction
          title="Pengaturan"
          icon="settings-outline"
          color="#DC143C"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#DC143C',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC143C20',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DC143C',
    gap: 8,
  },
  subscriptionCard: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  subscriptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  subscriptionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  subscriptionStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionBody: {
    padding: 16,
    gap: 12,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionLabel: {
    fontSize: 14,
    color: '#999',
  },
  subscriptionValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  modeText: {
    color: '#DC143C',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modeBadge: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  desktopInfo: {
    backgroundColor: '#1a1a1a',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  desktopInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  desktopInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  desktopInfoText: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginBottom: 16,
  },
  shortcutPreview: {
    flexDirection: 'row',
    gap: 12,
  },
  shortcutItem: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  shortcutKey: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 4,
  },
  shortcutDesc: {
    fontSize: 11,
    color: '#666',
  },
  statsContainer: {
    padding: 15,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#333',
    elevation: 2,
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statContent: {
    marginLeft: 15,
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#999',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    marginTop: 10,
    marginBottom: 15,
    color: '#fff',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    minWidth: 150,
    maxWidth: 200,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    margin: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    elevation: 2,
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#DC143C',
    fontWeight: '600',
  },
  lowStockScroll: {
    marginVertical: 12,
  },
  lowStockContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  lowStockCard: {
    width: 160,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  lowStockBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  lowStockName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    minHeight: 36,
  },
  lowStockPrice: {
    fontSize: 12,
    marginBottom: 8,
  },
  restockButton: {
    backgroundColor: '#DC143C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  restockButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectedProductInfo: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  selectedProductStock: {
    fontSize: 14,
  },
  sectionTitleModal: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  totalContainer: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC143C',
  },
  createButton: {
    backgroundColor: '#DC143C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
