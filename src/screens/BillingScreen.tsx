import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../hooks/useSubscription';
import {
  SUBSCRIPTION_PLANS,
  PlanType,
  formatPrice,
  calculateYearlySavings,
} from '../types/subscription';
import { useTheme } from '../hooks/useTheme';

export default function BillingScreen({ navigation }: any) {
  const { subscription, upgradePlan, loading } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { colors, isDark } = useTheme();

  const handleUpgrade = async (planType: PlanType) => {
    console.log('🚀 handleUpgrade called with:', planType);
    console.log('📊 Subscription:', subscription);
    
    if (planType === subscription?.planType) {
      console.log('⚠️ Same plan, showing alert');
      Alert.alert('Info', 'Anda sudah menggunakan plan ini');
      return;
    }

    // Jika plan free, langsung upgrade tanpa pembayaran
    if (planType === 'free') {
      console.log('📦 Free plan selected, showing downgrade dialog');
      Alert.alert(
        'Konfirmasi',
        'Downgrade ke plan Free?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Ya',
            onPress: async () => {
              try {
                await upgradePlan(planType);
                Alert.alert('Berhasil', 'Plan berhasil diubah ke Free!');
              } catch (error) {
                Alert.alert('Error', 'Gagal mengubah plan');
              }
            },
          },
        ]
      );
      return;
    }

    // Untuk plan berbayar, arahkan ke WhatsApp
    console.log('💰 Paid plan selected, preparing WhatsApp');
    const plan = SUBSCRIPTION_PLANS[planType] || SUBSCRIPTION_PLANS['pro'];
    console.log('📋 Plan details:', plan);
    
    const price = billingCycle === 'monthly' ? plan.price : plan.yearlyPrice;
    const cycle = billingCycle === 'monthly' ? 'Bulanan' : 'Tahunan';
    
    const message = `Halo, saya ingin upgrade ke plan *${plan.displayName}* (${cycle})\n\nHarga: ${formatPrice(price)}/${billingCycle === 'monthly' ? 'bulan' : 'tahun'}\n\nMohon informasi cara pembayarannya. Terima kasih!`;
    
    const whatsappNumber = '081340078956';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    console.log('📱 WhatsApp URL:', whatsappUrl);
    console.log('🔔 Showing confirmation dialog...');
    console.log('🖥️ Platform:', Platform.OS);

    // Handle Web platform differently
    if (Platform.OS === 'web') {
      console.log('🌐 Web platform detected, using window.confirm');
      const confirmed = window.confirm(
        `Upgrade ke ${plan.displayName}\n\nHarga: ${formatPrice(price)}/${cycle}\n\nAnda akan diarahkan ke WhatsApp. Lanjutkan?`
      );
      
      if (confirmed) {
        console.log('✅ User confirmed, opening WhatsApp');
        try {
          window.open(whatsappUrl, '_blank');
          console.log('✅ WhatsApp opened in new tab');
        } catch (error) {
          console.error('❌ Error opening WhatsApp:', error);
          alert(`Gagal membuka WhatsApp. Silakan hubungi: ${whatsappNumber}`);
        }
      } else {
        console.log('❌ User cancelled');
      }
      return;
    }

    // Handle Mobile/Desktop platform
    try {
      console.log('📱 Mobile/Desktop platform, using Alert.alert');
      Alert.alert(
        'Upgrade Plan',
        `Anda akan diarahkan ke WhatsApp untuk melakukan pembayaran plan ${plan.displayName}.\n\nHarga: ${formatPrice(price)}/${cycle}`,
        [
          { 
            text: 'Batal', 
            style: 'cancel',
            onPress: () => console.log('❌ User cancelled')
          },
          {
            text: 'Lanjutkan',
            onPress: async () => {
              console.log('✅ User clicked Lanjutkan');
              try {
                console.log('🔍 Checking if WhatsApp is available...');
                const supported = await Linking.canOpenURL(whatsappUrl);
                console.log('📱 WhatsApp supported:', supported);
                
                if (supported) {
                  console.log('🚀 Opening WhatsApp...');
                  await Linking.openURL(whatsappUrl);
                  console.log('✅ WhatsApp opened successfully');
                } else {
                  console.log('⚠️ WhatsApp not available');
                  Alert.alert(
                    'WhatsApp Tidak Tersedia',
                    `Silakan hubungi kami di:\n${whatsappNumber}\n\nUntuk upgrade ke ${plan.displayName}`,
                    [
                      {
                        text: 'Salin Nomor',
                        onPress: () => {
                          Alert.alert('Info', `Nomor WhatsApp: ${whatsappNumber}`);
                        }
                      },
                      { text: 'OK' }
                    ]
                  );
                }
              } catch (error) {
                console.error('❌ Error opening WhatsApp:', error);
                Alert.alert(
                  'Error',
                  `Gagal membuka WhatsApp. Silakan hubungi kami di: ${whatsappNumber}`
                );
              }
            },
          },
        ]
      );
      console.log('✅ Alert.alert called successfully');
    } catch (error) {
      console.error('❌ Error showing alert:', error);
    }
  };

  const renderFeatureItem = (text: string, included: boolean) => (
    <View style={styles.featureItem}>
      <Ionicons
        name={included ? 'checkmark-circle' : 'close-circle'}
        size={20}
        color={included ? '#10B981' : '#EF4444'}
      />
      <Text style={[
        styles.featureText,
        { color: colors.text },
        !included && styles.featureTextDisabled
      ]}>
        {text}
      </Text>
    </View>
  );

  const renderPlanCard = (planType: PlanType) => {
    const plan = SUBSCRIPTION_PLANS[planType] || SUBSCRIPTION_PLANS['pro'];
    const isCurrentPlan = subscription?.planType === planType;
    const price = billingCycle === 'monthly' ? plan.price : plan.yearlyPrice;
    const savings = calculateYearlySavings(plan.price, plan.yearlyPrice);

    // Cek apakah plan ini lebih rendah dari plan aktif user
    const planHierarchy: Record<PlanType, number> = {
      free: 0,
      standard: 1,
      pro: 2,
    };
    
    const currentPlanLevel = planHierarchy[subscription?.planType || 'free'];
    const targetPlanLevel = planHierarchy[planType];
    const isLowerPlan = targetPlanLevel < currentPlanLevel;
    const isDisabled = isCurrentPlan || isLowerPlan;

    // Shadow untuk light mode
    const cardShadow = !isDark ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    } : {};

    // Popular plan mendapat shadow lebih besar
    const popularShadow = !isDark && plan.popular ? {
      shadowColor: '#DC143C',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    } : {};

    return (
      <View
        key={planType}
        style={[
          styles.planCard,
          {
            backgroundColor: colors.card,
            borderColor: isCurrentPlan || plan.popular ? colors.primary : colors.border,
            opacity: isLowerPlan ? 0.6 : 1,
          },
          cardShadow,
          popularShadow,
          isCurrentPlan && styles.currentPlanCard,
          plan.popular && styles.popularPlanCard,
        ]}
      >
        {isLowerPlan && (
          <View style={styles.disabledBadge}>
            <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
            <Text style={styles.disabledText}>TIDAK TERSEDIA</Text>
          </View>
        )}
        {plan.popular && !isLowerPlan && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>PALING POPULER</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={[styles.planName, { color: colors.text }]}>
            {plan.displayName}
          </Text>
          <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
            {plan.description}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: colors.text }]}>
            {price === 0 ? 'Gratis' : formatPrice(price)}
          </Text>
          {price > 0 && (
            <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>
              /{billingCycle === 'monthly' ? 'bulan' : 'tahun'}
            </Text>
          )}
        </View>

        {billingCycle === 'yearly' && price > 0 && (
          <Text style={styles.savingsText}>
            Hemat {formatPrice(savings)} per tahun
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.upgradeButton,
            { 
              backgroundColor: isDisabled ? '#666' : plan.color,
              opacity: isDisabled ? 0.5 : 1,
            },
          ]}
          onPress={() => {
            console.log('=== BUTTON CLICKED ===');
            console.log('Plan Type:', planType);
            console.log('Current Plan:', subscription?.planType);
            console.log('Is Disabled:', isDisabled);
            console.log('Is Current Plan:', isCurrentPlan);
            console.log('Is Lower Plan:', isLowerPlan);
            
            if (isDisabled) {
              Alert.alert('Info', isCurrentPlan ? 'Anda sudah menggunakan plan ini' : 'Plan ini tidak tersedia untuk downgrade');
              return;
            }
            
            handleUpgrade(planType);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.upgradeButtonText}>
            {isCurrentPlan 
              ? 'Plan Aktif' 
              : isLowerPlan 
                ? 'Tidak Tersedia' 
                : planType === 'free' 
                  ? 'Downgrade ke Free' 
                  : 'Upgrade'}
          </Text>
        </TouchableOpacity>

        <View style={styles.featuresContainer}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>
            Fitur:
          </Text>

          {/* Limits */}
          {renderFeatureItem(
            plan.features.maxProducts === -1
              ? 'Produk Unlimited'
              : `${plan.features.maxProducts} Produk`,
            true
          )}
          
          {/* Kelola Karyawan - Hanya muncul untuk Standard & Pro */}
          {planType !== 'free' && renderFeatureItem(
            plan.features.maxEmployees === -1
              ? 'Kelola Karyawan (Unlimited)'
              : `Kelola Karyawan (Maks ${plan.features.maxEmployees})`,
            true
          )}
          
          {renderFeatureItem(
            plan.features.maxTransactionsPerMonth === -1
              ? 'Transaksi Unlimited'
              : `${plan.features.maxTransactionsPerMonth} Transaksi/bulan`,
            true
          )}
          {renderFeatureItem(
            plan.features.maxLocations === -1
              ? 'Lokasi/Cabang Unlimited'
              : `${plan.features.maxLocations} Lokasi`,
            true
          )}

          {/* Features Basic - Selalu Ada */}
          {renderFeatureItem('Kasir POS', true)}
          {renderFeatureItem('Barcode Scanner', plan.features.hasBarcodeScanner)}
          {renderFeatureItem('Cetak Struk', true)}
          
          {/* Fitur Karyawan - Hanya untuk Standard & Pro */}
          {planType !== 'free' && renderFeatureItem('Cetak ID Card Karyawan', plan.features.canPrintEmployeeCards)}
          {planType !== 'free' && renderFeatureItem('QR Login Karyawan', plan.features.canUseQRLogin)}

          {/* Features Advanced - Tergantung Plan */}
          {renderFeatureItem('Realtime Sync', plan.features.hasRealtimeSync)}
          {renderFeatureItem('Laporan Lanjutan', plan.features.hasAdvancedReports)}
          {renderFeatureItem('AI Assistant', plan.features.hasAIAssistant)}
          {renderFeatureItem('Export Transaksi', plan.features.canExportTransactions)}
          {renderFeatureItem('Hapus Transaksi', plan.features.canDeleteTransactions)}
          {renderFeatureItem('Kustomisasi Struk', plan.features.hasReceiptCustomization)}
          {planType !== 'free' && renderFeatureItem('Role & Permissions', plan.features.hasAdvancedPermissions)}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          onPress={() => {
            if (navigation.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Settings');
            }
          }} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Pilih Plan</Text>
      </View>

      {/* Current Plan Info */}
      {subscription && (
        <View style={[
          styles.currentPlanInfo,
          {
            backgroundColor: colors.card,
            ...(isDark ? {} : {
              shadowColor: '#DC143C',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            })
          }
        ]}>
          <Text style={[styles.currentPlanLabel, { color: colors.textSecondary }]}>
            Plan Saat Ini:
          </Text>
          <Text style={[styles.currentPlanName, { color: colors.text }]}>
            {(SUBSCRIPTION_PLANS[subscription.planType] || SUBSCRIPTION_PLANS['pro']).displayName}
          </Text>
          {subscription.status === 'trial' && (
            <Text style={styles.trialText}>
              Trial berakhir: {new Date(subscription.endDate).toLocaleDateString('id-ID')}
            </Text>
          )}
        </View>
      )}

      {/* Billing Cycle Toggle */}
      <View style={[
        styles.billingToggle,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          ...(isDark ? {} : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          })
        }
      ]}>
        <TouchableOpacity
          style={[styles.toggleButton, billingCycle === 'monthly' && styles.toggleButtonActive]}
          onPress={() => setBillingCycle('monthly')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: billingCycle === 'monthly' ? '#fff' : colors.textSecondary },
              billingCycle === 'monthly' && styles.toggleTextActive,
            ]}
          >
            Bulanan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, billingCycle === 'yearly' && styles.toggleButtonActive]}
          onPress={() => setBillingCycle('yearly')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: billingCycle === 'yearly' ? '#fff' : colors.textSecondary },
              billingCycle === 'yearly' && styles.toggleTextActive,
            ]}
          >
            Tahunan
          </Text>
          <View style={styles.saveBadge}>
            <Text style={styles.saveBadgeText}>Hemat 10%</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Plans */}
      <View style={styles.plansContainer}>
        {renderPlanCard('free')}
        {renderPlanCard('standard')}
        {renderPlanCard('pro')}
      </View>

      {/* FAQ */}
      <View style={styles.faqContainer}>
        <Text style={[styles.faqTitle, { color: colors.text }]}>
          Pertanyaan Umum
        </Text>

        <View style={[
          styles.faqItem,
          {
            backgroundColor: colors.card,
            borderColor: colors.border
          }
        ]}>
          <Text style={[styles.faqQuestion, { color: colors.text }]}>
            Bagaimana cara upgrade?
          </Text>
          <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
            Pilih plan yang diinginkan dan klik tombol "Upgrade". Anda akan diarahkan ke halaman pembayaran.
          </Text>
        </View>

        <View style={[
          styles.faqItem,
          {
            backgroundColor: colors.card,
            borderColor: colors.border
          }
        ]}>
          <Text style={[styles.faqQuestion, { color: colors.text }]}>
            Apakah bisa downgrade?
          </Text>
          <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
            Ya, Anda bisa downgrade kapan saja. Perubahan akan berlaku di periode billing berikutnya.
          </Text>
        </View>

        <View style={[
          styles.faqItem,
          {
            backgroundColor: colors.card,
            borderColor: colors.border
          }
        ]}>
          <Text style={[styles.faqQuestion, { color: colors.text }]}>
            Metode pembayaran apa yang diterima?
          </Text>
          <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
            Kami menerima transfer bank, kartu kredit, dan e-wallet (GoPay, OVO, Dana).
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 3,
    borderBottomColor: '#DC143C',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  currentPlanInfo: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  currentPlanLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  trialText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  billingToggle: {
    flexDirection: 'row',
    margin: 16,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    position: 'relative',
  },
  toggleButtonActive: {
    backgroundColor: '#DC143C',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  plansContainer: {
    padding: 16,
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    position: 'relative',
  },
  currentPlanCard: {
    borderColor: '#DC143C',
  },
  popularPlanCard: {
    borderColor: '#DC143C',
    transform: Platform.OS === 'web' ? [] : [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#DC143C',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disabledBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#666',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  disabledText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  pricePeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  savingsText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 16,
  },
  upgradeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  currentPlanButton: {
    opacity: 0.6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  featuresContainer: {
    gap: 8,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  featureTextDisabled: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  faqContainer: {
    padding: 16,
    marginBottom: 32,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  faqItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
});
