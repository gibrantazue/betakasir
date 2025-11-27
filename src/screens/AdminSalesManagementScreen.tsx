import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useFocusEffect } from '@react-navigation/native';

interface SalesPerson {
  id: string;
  name: string;
  phone: string;
  referralCode: string;
  totalReferrals: number;
  createdAt: any;
  active: boolean;
  customersCount?: number;
  customers?: Array<{
    uid: string;
    name: string;
    email: string;
    plan: string;
    registeredAt: string;
  }>;
}

export default function AdminSalesManagementScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSales, setSelectedSales] = useState<SalesPerson | null>(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  
  // Expanded state untuk collapsible cards
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Toggle expand/collapse card
  const toggleCard = (salesId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(salesId)) {
        newSet.delete(salesId);
      } else {
        newSet.add(salesId);
      }
      return newSet;
    });
  };

  // Function to load and process sales data (moved outside useEffect for reusability)
  const loadSalesData = useCallback(async () => {
    const salesRef = collection(db, 'salesPeople');
    const usersRef = collection(db, 'users');
    try {
      const snapshot = await getDocs(salesRef);
      const salesList: SalesPerson[] = [];
      
      for (const docSnap of snapshot.docs) {
        const salesData = { id: docSnap.id, ...docSnap.data() } as SalesPerson;
        
        // Count customers for this sales
        const usersQuery = query(
          usersRef,
          where('referralCode', '==', salesData.referralCode)
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        salesData.customersCount = usersSnapshot.size;
        
        // Process customers with async to check subscription subcollection
        const customersPromises = usersSnapshot.docs.map(async (userDoc) => {
          const userData = userDoc.data();
          
          // Get plan from subscription subcollection (correct location)
          let customerPlan = 'free';
          
          try {
            // Check subscription subcollection: users/{userId}/subscription/current
            const subscriptionRef = doc(db, 'users', userDoc.id, 'subscription', 'current');
            const subscriptionSnap = await getDoc(subscriptionRef);
            
            if (subscriptionSnap.exists()) {
              const subData = subscriptionSnap.data();
              customerPlan = subData.planType || subData.plan || 'free';
              
              console.log('✅ Found subscription (realtime):', {
                email: userData.email,
                planType: subData.planType,
                status: subData.status,
              });
            } else {
              // Fallback: check fields in user document (legacy)
              if (userData.subscription && userData.subscription.planType) {
                customerPlan = userData.subscription.planType;
              } else if (userData.subscription && userData.subscription.plan) {
                customerPlan = userData.subscription.plan;
              } else if (userData.subscriptionPlan) {
                customerPlan = userData.subscriptionPlan;
              } else if (userData.plan) {
                customerPlan = userData.plan;
              } else if (userData.planType) {
                customerPlan = userData.planType;
              }
              
              console.log('⚠️ No subscription subcollection (realtime), using fallback:', {
                email: userData.email,
                finalPlan: customerPlan,
              });
            }
          } catch (error) {
            console.error('Error fetching subscription (realtime):', userData.email, error);
          }
          
          return {
            uid: userDoc.id,
            name: userData.displayName || userData.email || 'Unknown',
            email: userData.email || '',
            plan: customerPlan,
            registeredAt: userData.referredAt || userData.createdAt || '',
          };
        });
        
        salesData.customers = await Promise.all(customersPromises);
        
        salesList.push(salesData);
      }
      
      // Sort by customers count
      salesList.sort((a, b) => (b.customersCount || 0) - (a.customersCount || 0));
      
      console.log('✅ Realtime update processed:', salesList.length, 'sales people');
      setSalesPeople(salesList);
      setLoading(false);
      setRefreshing(false);
      setRealtimeActive(true);
    } catch (error: any) {
      console.error('❌ Error loading sales data:', error);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Setup realtime listener untuk sales people
  useEffect(() => {
    console.log('🔄 Setting up realtime listener for Sales Management...');

    const salesRef = collection(db, 'salesPeople');
    const usersRef = collection(db, 'users');

    // Listen to salesPeople collection changes
    const unsubscribeSales = onSnapshot(
      salesRef,
      {
        includeMetadataChanges: true,
      },
      (snapshot) => {
        console.log('📥 Realtime update received for sales!');
        console.log('📊 Snapshot size:', snapshot.size);
        console.log('📊 Document changes:', snapshot.docChanges().length);
        
        // Log what changed
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            console.log('➕ Added sales:', change.doc.data().name);
          }
          if (change.type === 'modified') {
            console.log('✏️ Modified sales:', change.doc.data().name);
          }
          if (change.type === 'removed') {
            console.log('🗑️ Removed sales:', change.doc.data().name);
          }
        });

        loadSalesData();
      },
      (error) => {
        console.error('❌ Realtime listener error (sales):', error);
        Alert.alert('Error', 'Gagal memuat data realtime');
        setLoading(false);
        setRefreshing(false);
      }
    );

    // Listen to users collection changes (for customer plan updates)
    const unsubscribeUsers = onSnapshot(
      usersRef,
      {
        includeMetadataChanges: true,
      },
      (snapshot) => {
        console.log('📥 Realtime update received for users!');
        console.log('📊 User changes:', snapshot.docChanges().length);
        
        // Log what changed
        snapshot.docChanges().forEach((change) => {
          const userData = change.doc.data();
          if (change.type === 'modified' && userData.referralCode) {
            console.log('✏️ Modified user with referral:', userData.email);
          }
        });

        // Reload sales data when users change (to update customer plans)
        loadSalesData();
      },
      (error) => {
        console.error('❌ Realtime listener error (users):', error);
      }
    );

    // Initial load
    loadSalesData();

    // Cleanup on unmount
    return () => {
      console.log('🔴 Cleaning up realtime listeners for Sales Management...');
      unsubscribeSales();
      unsubscribeUsers();
      setRealtimeActive(false);
    };
  }, [loadSalesData]);

  // Reload data when screen comes into focus (after navigation)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Screen focused - Reloading sales data...');
      loadSalesData();
      
      return () => {
        console.log('🔴 Screen unfocused');
      };
    }, [loadSalesData])
  );

  const generateReferralCode = (name: string): string => {
    const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}${randomNum}`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Realtime listener will automatically update the data
    // Just show refreshing state for user feedback
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const handleAddSales = async () => {
    if (!formName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Mohon isi Nama');
      } else {
        Alert.alert('Error', 'Mohon isi Nama');
      }
      return;
    }

    setSaving(true);
    try {
      const referralCode = generateReferralCode(formName);
      
      await addDoc(collection(db, 'salesPeople'), {
        name: formName.trim(),
        phone: formPhone.trim() || '',
        referralCode,
        totalReferrals: 0,
        createdAt: serverTimestamp(),
        active: true,
      });

      if (Platform.OS === 'web') {
        window.alert(`✅ Sales berhasil ditambahkan!\n\nKode Referral: ${referralCode}`);
      } else {
        Alert.alert('Berhasil', `Sales berhasil ditambahkan!\n\nKode Referral: ${referralCode}`);
      }

      setShowAddModal(false);
      setFormName('');
      setFormPhone('');
      // No need to reload - realtime listener will update automatically!
    } catch (error) {
      console.error('Error adding sales:', error);
      if (Platform.OS === 'web') {
        window.alert('❌ Gagal menambahkan sales');
      } else {
        Alert.alert('Error', 'Gagal menambahkan sales');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditSales = async () => {
    if (!selectedSales || !formName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Mohon isi Nama');
      } else {
        Alert.alert('Error', 'Mohon isi Nama');
      }
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'salesPeople', selectedSales.id), {
        name: formName.trim(),
        phone: formPhone.trim() || '',
      });

      if (Platform.OS === 'web') {
        window.alert('✅ Data sales berhasil diupdate!');
      } else {
        Alert.alert('Berhasil', 'Data sales berhasil diupdate!');
      }

      setShowEditModal(false);
      setSelectedSales(null);
      setFormName('');
      setFormPhone('');
      // No need to reload - realtime listener will update automatically!
    } catch (error) {
      console.error('Error updating sales:', error);
      if (Platform.OS === 'web') {
        window.alert('❌ Gagal mengupdate sales');
      } else {
        Alert.alert('Error', 'Gagal mengupdate sales');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveReferral = async (customerUid: string, customerName: string, salesId: string) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm(`Hapus kode referral dari ${customerName}?\n\nPelanggan ini akan terputus dari sales person.`)
      : await new Promise(resolve => {
          Alert.alert(
            'Hapus Kode Referral',
            `Hapus kode referral dari ${customerName}?\n\nPelanggan ini akan terputus dari sales person.`,
            [
              { text: 'Batal', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Hapus', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });

    if (!confirmed) return;

    try {
      // Remove referral from customer
      await updateDoc(doc(db, 'users', customerUid), {
        referralCode: null,
        referredBy: null,
        referredAt: null,
      });

      // Decrement totalReferrals
      const salesDoc = await getDocs(query(collection(db, 'salesPeople'), where('__name__', '==', salesId)));
      if (!salesDoc.empty) {
        const currentTotal = salesDoc.docs[0].data().totalReferrals || 0;
        await updateDoc(doc(db, 'salesPeople', salesId), {
          totalReferrals: Math.max(0, currentTotal - 1),
        });
      }

      if (Platform.OS === 'web') {
        window.alert('✅ Kode referral berhasil dihapus');
      } else {
        Alert.alert('Berhasil', 'Kode referral berhasil dihapus');
      }

      // No need to reload - realtime listener will update automatically!
    } catch (error) {
      console.error('Error removing referral:', error);
      if (Platform.OS === 'web') {
        window.alert('❌ Gagal menghapus kode referral');
      } else {
        Alert.alert('Error', 'Gagal menghapus kode referral');
      }
    }
  };

  const handleDeleteSales = async (sales: SalesPerson) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm(`Hapus sales ${sales.name}?\n\nKode referral: ${sales.referralCode}\nPelanggan: ${sales.customersCount || 0}`)
      : await new Promise(resolve => {
          Alert.alert(
            'Konfirmasi',
            `Hapus sales ${sales.name}?\n\nKode referral: ${sales.referralCode}\nPelanggan: ${sales.customersCount || 0}`,
            [
              { text: 'Batal', onPress: () => resolve(false) },
              { text: 'Hapus', onPress: () => resolve(true), style: 'destructive' },
            ]
          );
        });

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'salesPeople', sales.id));
      
      if (Platform.OS === 'web') {
        window.alert('✅ Sales berhasil dihapus');
      } else {
        Alert.alert('Berhasil', 'Sales berhasil dihapus');
      }
      
      // No need to reload - realtime listener will update automatically!
    } catch (error) {
      console.error('Error deleting sales:', error);
      if (Platform.OS === 'web') {
        window.alert('❌ Gagal menghapus sales');
      } else {
        Alert.alert('Error', 'Gagal menghapus sales');
      }
    }
  };

  const openEditModal = (sales: SalesPerson) => {
    setSelectedSales(sales);
    setFormName(sales.name);
    setFormPhone(sales.phone);
    setShowEditModal(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(text);
        window.alert(`✅ ${text} berhasil dicopy!`);
      } else {
        const Clipboard = await import('expo-clipboard');
        await Clipboard.default.setStringAsync(text);
        Alert.alert('Berhasil', `${text} berhasil dicopy!`);
      }
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#DC143C" />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Sales Management</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {salesPeople.length} Sales Person
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setFormName('');
            setFormPhone('');
            setShowAddModal(true);
          }}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Realtime Indicator */}
      {realtimeActive && (
        <View style={[styles.realtimeIndicator, { backgroundColor: colors.surface }]}>
          <View style={styles.realtimeDot} />
          <Text style={[styles.realtimeText, { color: colors.textSecondary }]}>
            Realtime Active
          </Text>
        </View>
      )}

      {/* Sales List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#DC143C"
            colors={['#DC143C']}
          />
        }
      >
        {salesPeople.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={80} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Belum ada sales person
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Tap tombol + untuk menambahkan
            </Text>
          </View>
        ) : (
          <View style={styles.salesList}>
            {salesPeople.map((sales) => (
              <View key={sales.id} style={[styles.salesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.salesHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.salesName, { color: colors.text }]}>{sales.name}</Text>
                    {sales.phone && (
                      <Text style={[styles.salesPhone, { color: colors.textSecondary }]}>{sales.phone}</Text>
                    )}
                  </View>
                  <View style={styles.salesActions}>
                    <TouchableOpacity
                      onPress={() => openEditModal(sales)}
                      style={[styles.actionButton, { backgroundColor: '#3B82F615' }]}
                    >
                      <Ionicons name="create-outline" size={20} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteSales(sales)}
                      style={[styles.actionButton, { backgroundColor: '#EF444415' }]}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Referral Code */}
                <TouchableOpacity
                  onPress={() => copyToClipboard(sales.referralCode)}
                  style={[styles.referralCodeContainer, { backgroundColor: colors.surface }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.referralLabel, { color: colors.textSecondary }]}>Kode Referral</Text>
                    <Text style={[styles.referralCode, { color: '#DC143C' }]}>{sales.referralCode}</Text>
                  </View>
                  <Ionicons name="copy-outline" size={20} color="#DC143C" />
                </TouchableOpacity>

                {/* Stats with Toggle Button */}
                <TouchableOpacity 
                  onPress={() => toggleCard(sales.id)}
                  style={styles.statsContainer}
                  activeOpacity={0.7}
                >
                  <View style={styles.statItem}>
                    <Ionicons name="people" size={16} color={colors.textSecondary} />
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      {sales.customersCount || 0} Pelanggan
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="gift" size={16} color="#10B981" />
                    <Text style={[styles.statText, { color: '#10B981' }]}>
                      {sales.totalReferrals || 0} Referral
                    </Text>
                  </View>
                  {sales.customers && sales.customers.length > 0 && (
                    <View style={styles.expandButton}>
                      <Ionicons 
                        name={expandedCards.has(sales.id) ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={colors.textSecondary} 
                      />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Customers List - Collapsible */}
                {sales.customers && sales.customers.length > 0 && expandedCards.has(sales.id) && (
                  <View style={[styles.customersContainer, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.customersTitle, { color: colors.text }]}>Pelanggan:</Text>
                    {sales.customers.map((customer, index) => (
                      <View key={index} style={styles.customerItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.customerName, { color: colors.text }]}>{customer.name}</Text>
                          <Text style={[styles.customerEmail, { color: colors.textSecondary }]}>{customer.email}</Text>
                        </View>
                        <View style={[styles.planBadge, { backgroundColor: getPlanColor(customer.plan) }]}>
                          <Text style={styles.planBadgeText}>{customer.plan.toUpperCase()}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveReferral(customer.uid, customer.name, sales.id)}
                          style={[styles.removeReferralButton, { backgroundColor: '#EF444415' }]}
                        >
                          <Ionicons name="close-circle" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Tambah Sales Person</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Nama</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={formName}
                onChangeText={setFormName}
                placeholder="Nama lengkap"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>No Telepon (Opsional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={formPhone}
                onChangeText={setFormPhone}
                placeholder="08123456789 (opsional)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                onPress={handleAddSales}
                style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Simpan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Sales Person</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Nama</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={formName}
                onChangeText={setFormName}
                placeholder="Nama lengkap"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>No Telepon (Opsional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={formPhone}
                onChangeText={setFormPhone}
                placeholder="08123456789 (opsional)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                onPress={handleEditSales}
                style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Update</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getPlanColor = (plan: string) => {
  switch (plan.toLowerCase()) {
    case 'pro':
      return '#DC143C';
    case 'business':
      return '#8B5CF6';
    case 'standard':
      return '#3B82F6';
    case 'free':
    default:
      return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  realtimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  realtimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  realtimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#DC143C',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  salesList: {
    padding: 16,
    gap: 16,
  },
  salesCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  salesHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  salesName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  salesPhone: {
    fontSize: 14,
  },
  salesActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  referralLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  referralCode: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
  },
  expandButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  customersContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  customersTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  customerEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  removeReferralButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF444415',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
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
  formContainer: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC143C',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
