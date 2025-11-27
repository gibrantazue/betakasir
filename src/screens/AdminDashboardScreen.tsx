import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAllSellers, updateSellerSubscription, subscribeToSellers, deleteSeller, SellerInfo } from '../services/adminService';
import { SUBSCRIPTION_PLANS, PlanType } from '../types/subscription';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import { collection, doc, setDoc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Conditional import for DateTimePicker (only for mobile)
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (e) {
    console.warn('DateTimePicker not available');
  }
}
import { useTheme } from '../hooks/useTheme';

export default function AdminDashboardScreen({ navigation }: any) {
  const { signOut } = useAuth();
  const { colors } = useTheme();
  const [sellers, setSellers] = useState<SellerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerInfo | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<'1month' | '1year' | 'unlimited' | 'custom'>('1month');
  const [customMonths, setCustomMonths] = useState<string>('');
  const [customDurationMode, setCustomDurationMode] = useState<'duration' | 'endDate'>('duration');
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [customEndDateInput, setCustomEndDateInput] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | PlanType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'trial' | 'expired'>('all');
  const [selectedSellers, setSelectedSellers] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [uploadingChangelogs, setUploadingChangelogs] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  


  // Changelog data untuk semua versi
  const changelogsData = [
    {
      id: 'v1.2.1',
      version: '1.2.1',
      date: '2025-11-23',
      title: 'BetaKasir v1.2.1 - Patch Update 🔧',
      description: 'Version synchronization update dengan fitur zoom control untuk desktop app.',
      type: 'patch',
      changes: [
        { category: 'feature', text: 'Zoom control untuk desktop (Ctrl +/-/0)' },
        { category: 'improvement', text: 'Version synchronization across all files' },
        { category: 'improvement', text: 'Documentation updates' },
        { category: 'bugfix', text: 'Bug fixes dan improvements' }
      ]
    },
    {
      id: 'v1.2.0',
      version: '1.2.0',
      date: '2025-11-22',
      title: 'BetaKasir v1.2.0 - Realtime Update & Pro Plan 🚀',
      description: 'Update v1.2.0 membawa sistem notifikasi update realtime dan rebranding Business Plan menjadi Pro Plan.',
      type: 'minor',
      changes: [
        { category: 'feature', text: 'Realtime Update Notification System' },
        { category: 'feature', text: 'Business Plan → Pro Plan rebranding' },
        { category: 'feature', text: 'Smart version comparison' },
        { category: 'feature', text: 'In-screen notification card' },
        { category: 'feature', text: 'Admin control panel untuk update notifications' },
        { category: 'feature', text: 'WhatsApp integration untuk upgrade' },
        { category: 'improvement', text: 'Better notification UI/UX' },
        { category: 'improvement', text: 'Optimized update checking' }
      ]
    },
    {
      id: 'v1.1.9',
      version: '1.1.9',
      date: '2025-01-22',
      title: 'BetaKasir v1.1.9 - AI Knows App Version 🤖',
      description: 'AI Assistant sekarang otomatis mengetahui versi aplikasi dan changelog terbaru! Plus perbaikan tombol Cek Update.',
      type: 'minor',
      changes: [
        { category: 'feature', text: 'AI dapat menjawab pertanyaan tentang versi aplikasi' },
        { category: 'feature', text: 'Version auto-sync dari GitHub Releases' },
        { category: 'bugfix', text: 'Fixed tombol Cek Update' },
        { category: 'improvement', text: 'Performance improvements' }
      ]
    },
    {
      id: 'v1.1.8',
      version: '1.1.8',
      date: '2025-01-22',
      title: 'BetaKasir v1.1.8 - Changelog Management System! 📝',
      description: 'Sistem manajemen changelog otomatis untuk admin. Upload changelog dengan satu klik!',
      type: 'minor',
      changes: [
        { category: 'feature', text: 'Tombol upload changelog otomatis untuk setiap versi' },
        { category: 'feature', text: 'Changelog Management UI di Admin Dashboard' },
        { category: 'feature', text: 'One-click upload untuk v1.0.0 sampai v1.1.8' },
        { category: 'improvement', text: 'Simplified changelog deployment process' },
        { category: 'improvement', text: 'Better changelog organization' }
      ]
    },
    {
      id: 'v1.1.7',
      version: '1.1.7',
      date: '2025-01-22',
      title: 'BetaKasir v1.1.7 - Realtime System & Sales Dashboard Analytics! 📊',
      description: 'Update besar dengan sistem realtime untuk Admin & Sales Dashboard, plus fitur analytics lengkap dengan charts dan export report.',
      type: 'minor',
      changes: [
        { category: 'feature', text: 'Admin Dashboard - Sales Management dengan realtime updates' },
        { category: 'feature', text: 'Sales Dashboard dengan auto-refresh data setiap 10 detik' },
        { category: 'feature', text: 'Realtime sync multi-user untuk semua device' },
        { category: 'feature', text: 'Tab Navigation System (Overview, Analytics, History)' },
        { category: 'feature', text: 'Performance Charts - Line Chart & Bar Chart untuk visualisasi data' },
        { category: 'feature', text: 'Advanced Metrics - Conversion Rate, Growth Rate, Average Deal Size' },
        { category: 'feature', text: 'Export Report functionality untuk download data' },
        { category: 'improvement', text: 'Dark Mode optimization untuk better readability' },
        { category: 'improvement', text: 'Light Mode optimization dengan white backgrounds' },
        { category: 'improvement', text: 'Chart labels dengan white color untuk kontras maksimal' },
        { category: 'improvement', text: 'Modern card design dengan shadow dan spacing' },
        { category: 'improvement', text: 'Optimasi Firestore queries dengan proper indexing' },
        { category: 'improvement', text: 'Efficient data filtering (removed, cancelled, deleted)' },
        { category: 'improvement', text: 'Memory leak prevention dengan proper cleanup' },
        { category: 'bugfix', text: 'Fixed text visibility di dark mode' },
        { category: 'bugfix', text: 'Fixed chart background di light mode' },
        { category: 'bugfix', text: 'Fixed chart labels visibility' },
        { category: 'bugfix', text: 'Fixed memory leaks dengan proper listener cleanup' },
        { category: 'bugfix', text: 'Fixed data inconsistency dengan realtime sync' }
      ]
    },
    {
      id: 'v1.1.6',
      version: '1.1.6',
      date: '2025-01-21',
      title: 'BetaKasir v1.1.6 - Fix Critical Bug! 🐛',
      description: 'Perbaikan bug kritis dimana field input tidak bisa diklik setelah scan barcode di desktop. Workflow scan barcode sekarang lebih lancar dan cepat!',
      type: 'patch',
      changes: [
        { category: 'bugfix', text: 'Fix field input tidak bisa diklik setelah scan barcode di ProductsScreen' },
        { category: 'bugfix', text: 'Fix alert yang mengganggu workflow di CashierScreen' },
        { category: 'bugfix', text: 'Hapus 5 alert di ProductsScreen (Produk Ditemukan, Produk Baru, Barcode Terlalu Pendek, dll)' },
        { category: 'bugfix', text: 'Hapus 3 alert di CashierScreen (Stok Habis, Keranjang Kosong, Uang Tidak Cukup)' },
        { category: 'improvement', text: 'Workflow scan barcode lebih lancar - kasir bisa scan produk berturut-turut tanpa gangguan' },
        { category: 'improvement', text: 'Data langsung terisi di form tanpa popup yang mengganggu' }
      ]
    },
    {
      id: 'v1.1.5',
      version: '1.1.5',
      date: '2025-01-21',
      title: 'BetaKasir v1.1.5 - Auto Update System! 🚀',
      description: 'Implementasi sistem auto-update untuk desktop. Aplikasi sekarang bisa update otomatis tanpa perlu download installer manual!',
      type: 'minor',
      changes: [
        { category: 'feature', text: 'Auto Update System - notifikasi update otomatis saat ada versi baru' },
        { category: 'feature', text: 'Download update di background tanpa mengganggu pekerjaan' },
        { category: 'feature', text: 'Install update dengan restart aplikasi - tidak perlu uninstall manual' },
        { category: 'feature', text: 'Publish ke GitHub Releases otomatis' },
        { category: 'improvement', text: 'Integrasi electron-updater untuk update seamless' },
        { category: 'improvement', text: 'Update modal dengan progress bar' }
      ]
    },
    {
      id: 'v1.1.4',
      version: '1.1.4',
      date: '2025-01-20',
      title: 'BetaKasir v1.1.4 - Firebase Auto Update! ☁️',
      description: 'Sistem update via Firebase Storage sebagai fallback jika GitHub Releases tidak tersedia.',
      type: 'minor',
      changes: [
        { category: 'feature', text: 'Firebase Auto Update - upload file update ke Firebase Storage' },
        { category: 'feature', text: 'Download update dari Firebase Storage' },
        { category: 'feature', text: 'Fallback system jika GitHub Releases tidak tersedia' },
        { category: 'improvement', text: 'Firebase Storage integration' },
        { category: 'improvement', text: 'Storage rules configuration untuk keamanan' }
      ]
    },
    {
      id: 'v1.1.3',
      version: '1.1.3',
      date: '2025-01-19',
      title: 'BetaKasir v1.1.3 - Bug Fixes! 🔧',
      description: 'Perbaikan bug pada sistem auto-update dan optimasi performa.',
      type: 'patch',
      changes: [
        { category: 'bugfix', text: 'Fix auto-update notification tidak muncul' },
        { category: 'bugfix', text: 'Fix download update error 404' },
        { category: 'bugfix', text: 'Fix GitHub token authentication' },
        { category: 'improvement', text: 'Optimasi check update interval' },
        { category: 'improvement', text: 'Better error handling untuk update' },
        { category: 'improvement', text: 'Improved update modal UI' }
      ]
    },
    {
      id: 'v1.1.2',
      version: '1.1.2',
      date: '2025-01-18',
      title: 'BetaKasir v1.1.2 - Initial Auto Update! ⚙️',
      description: 'Setup dasar sistem auto-update dengan electron-updater dan GitHub Releases.',
      type: 'minor',
      changes: [
        { category: 'feature', text: 'Initial Auto Update Setup - electron-updater configuration' },
        { category: 'feature', text: 'GitHub Releases integration' },
        { category: 'feature', text: 'Basic update checker' },
        { category: 'improvement', text: 'Setup electron-builder untuk publish' },
        { category: 'improvement', text: 'GitHub token configuration' }
      ]
    },
    {
      id: 'v1.1.1',
      version: '1.1.1',
      date: '2025-01-17',
      title: 'BetaKasir v1.1.1 - Employee Management System! 👥',
      description: 'Sistem manajemen karyawan lengkap dengan QR Code login, role-based permissions, dan ID card printing.',
      type: 'minor',
      changes: [
        { category: 'feature', text: 'Sistem manajemen karyawan lengkap' },
        { category: 'feature', text: 'QR Code untuk login karyawan' },
        { category: 'feature', text: 'Role-based permissions (Owner, Manager, Cashier)' },
        { category: 'feature', text: 'Employee ID card printing' },
        { category: 'bugfix', text: 'Fix employee data tidak tersimpan' },
        { category: 'bugfix', text: 'Fix QR code scan tidak berfungsi' },
        { category: 'bugfix', text: 'Fix permission check' }
      ]
    },
    {
      id: 'v1.1.0',
      version: '1.1.0',
      date: '2025-01-15',
      title: 'BetaKasir v1.1.0 - Major Update! 🎉',
      description: 'Update besar dengan AI Assistant, Advanced Analytics, Subscription System, dan WhatsApp Integration!',
      type: 'major',
      changes: [
        { category: 'feature', text: 'AI Assistant dengan Gemini API' },
        { category: 'feature', text: 'Advanced Analytics - analisis bisnis mendalam' },
        { category: 'feature', text: 'Subscription System (Free, Standard, Pro)' },
        { category: 'feature', text: 'WhatsApp Integration untuk notifikasi' },
        { category: 'feature', text: 'Dark mode & Light mode' },
        { category: 'feature', text: 'Backup & Restore data' },
        { category: 'feature', text: 'Export laporan ke PDF' },
        { category: 'feature', text: 'Realtime sync dengan Firebase' },
        { category: 'improvement', text: 'Firebase Firestore integration' },
        { category: 'improvement', text: 'Google Sign-In' },
        { category: 'improvement', text: 'Electron desktop app' },
        { category: 'improvement', text: 'React Native mobile app' }
      ]
    },
    {
      id: 'v1.0.0',
      version: '1.0.0',
      date: '2025-01-01',
      title: 'BetaKasir v1.0.0 - Rilis Perdana! 🎊',
      description: 'Rilis perdana BetaKasir - Aplikasi kasir modern dengan fitur lengkap untuk bisnis Anda!',
      type: 'major',
      changes: [
        { category: 'feature', text: 'Sistem kasir dasar' },
        { category: 'feature', text: 'Manajemen produk' },
        { category: 'feature', text: 'Manajemen customer' },
        { category: 'feature', text: 'Laporan transaksi' },
        { category: 'feature', text: 'Barcode scanner support' },
        { category: 'feature', text: 'Print struk thermal' }
      ]
    }
  ];

  // Upload single changelog
  const handleUploadSingleChangelog = async (changelog: any) => {
    const confirmed = window.confirm(
      `📝 Upload Changelog ${changelog.version}?\n\n` +
      `${changelog.title}\n\n` +
      `Ini akan upload/update changelog untuk versi ${changelog.version}.\n\n` +
      `Lanjutkan?`
    );

    if (!confirmed) return;

    setUploadingChangelogs(true);

    try {
      console.log(`🚀 Uploading changelog ${changelog.id}...`);
      
      await setDoc(doc(db, 'changelogs', changelog.id), {
        ...changelog,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ ${changelog.id} uploaded!`);
      
      window.alert(
        `🎉 Berhasil!\n\n` +
        `Changelog ${changelog.version} berhasil diupload!\n\n` +
        `${changelog.title}\n\n` +
        `Sellers sekarang bisa lihat changelog ini di Settings → Changelog! 🚀`
      );

    } catch (error: any) {
      console.error(`❌ Error uploading changelog ${changelog.id}:`, error);
      window.alert(`Error: Gagal upload changelog ${changelog.version}. ` + error.message);
    } finally {
      setUploadingChangelogs(false);
    }
  };

  // Upload all changelogs to Firestore (with delete old data first)
  const handleUploadAllChangelogs = async () => {
    const confirmed = window.confirm(
      '🔄 Upload Semua Changelog?\n\n' +
      'Ini akan:\n' +
      '1. DELETE semua changelog lama\n' +
      '2. Upload ulang semua changelog (v1.0.0 - v1.2.1)\n\n' +
      'Total: 13 changelog akan diupload\n\n' +
      'Lanjutkan?'
    );

    if (!confirmed) return;

    setUploadingChangelogs(true);

    try {
      console.log('🚀 Starting changelog upload...');
      
      // Step 1: Delete all old changelogs
      console.log('📝 Step 1: Deleting old changelogs...');
      const snapshot = await getDocs(collection(db, 'changelogs'));
      
      if (!snapshot.empty) {
        console.log(`   Found ${snapshot.size} changelogs to delete`);
        
        for (const docSnapshot of snapshot.docs) {
          await deleteDoc(doc(db, 'changelogs', docSnapshot.id));
          console.log(`   ❌ Deleted: ${docSnapshot.id}`);
        }
        
        console.log('   ✅ All old changelogs deleted!');
      }
      
      // Step 2: Upload new changelogs
      console.log('📝 Step 2: Uploading new changelogs...');
      
      for (const changelog of changelogsData) {
        console.log(`   📝 Uploading ${changelog.id}...`);
        
        await setDoc(doc(db, 'changelogs', changelog.id), {
          ...changelog,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        console.log(`   ✅ ${changelog.id} uploaded!`);
      }

      console.log('🎉 Changelog upload complete!');
      
      window.alert(
        '🎉 Berhasil!\n\n' +
        '13 changelog sudah diupload:\n' +
        '✅ v1.2.1 - Patch Update (TERBARU!)\n' +
        '✅ v1.2.0 - Realtime Update & Pro Plan\n' +
        '✅ v1.1.9 - AI Knows App Version\n' +
        '✅ v1.1.8 - Changelog Management System\n' +
        '✅ v1.1.7 - Realtime System & Sales Dashboard Analytics\n' +
        '✅ v1.1.6 - Fix Critical Bug\n' +
        '✅ v1.1.5 - Auto Update System\n' +
        '✅ v1.1.4 - Firebase Auto Update\n' +
        '✅ v1.1.3 - Bug Fixes\n' +
        '✅ v1.1.2 - Initial Auto Update\n' +
        '✅ v1.1.1 - Employee Management\n' +
        '✅ v1.1.0 - Major Update\n' +
        '✅ v1.0.0 - Rilis Perdana\n\n' +
        'Sellers sekarang bisa lihat semua changelog di Settings → Changelog! 🚀'
      );

    } catch (error: any) {
      console.error('❌ Error uploading changelogs:', error);
      window.alert('Error: Gagal upload changelog. ' + error.message);
    } finally {
      setUploadingChangelogs(false);
    }
  };

  // Setup realtime listener
  useEffect(() => {
    console.log('🔄 Setting up realtime listener for Admin Dashboard...');

    const unsubscribe = subscribeToSellers(
      (updatedSellers) => {
        console.log('📊 Realtime update received:', updatedSellers.length, 'sellers');
        setSellers(updatedSellers);
        setLoading(false);
        setRefreshing(false);
        setRealtimeActive(true);
      },
      (error) => {
        console.error('❌ Realtime error:', error);
        Alert.alert('Error', 'Gagal memuat data realtime');
        setLoading(false);
        setRefreshing(false);
      }
    );

    // Cleanup on unmount
    return () => {
      console.log('🔴 Cleaning up realtime listener...');
      unsubscribe();
      setRealtimeActive(false);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Realtime listener will automatically update the data
    // Just show refreshing state for user feedback
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const handleChangePlan = (seller: SellerInfo) => {
    setSelectedSeller(seller);
    setSelectedPlan(null);
    setSelectedDuration('1month');
    setCustomMonths('');
    setShowPlanModal(true);
  };

  const toggleSellerSelection = (sellerId: string) => {
    setSelectedSellers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sellerId)) {
        newSet.delete(sellerId);
      } else {
        newSet.add(sellerId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSellers.size === sellers.length) {
      setSelectedSellers(new Set());
    } else {
      setSelectedSellers(new Set(sellers.map(s => s.uid)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSellers.size === 0) {
      if (Platform.OS === 'web') {
        window.alert('⚠️ Tidak ada seller yang dipilih');
      } else {
        Alert.alert('Peringatan', 'Tidak ada seller yang dipilih');
      }
      return;
    }

    const selectedSellersList = sellers.filter(s => selectedSellers.has(s.uid));
    const totalProducts = selectedSellersList.reduce((sum, s) => sum + (s.stats?.productsCount || 0), 0);
    const totalEmployees = selectedSellersList.reduce((sum, s) => sum + (s.stats?.employeesCount || 0), 0);
    const totalTransactions = selectedSellersList.reduce((sum, s) => sum + (s.stats?.transactionsCount || 0), 0);

    const message =
      `⚠️ HAPUS ${selectedSellers.size} AKUN SELLER\n\n` +
      `Apakah Anda yakin ingin menghapus ${selectedSellers.size} akun seller?\n\n` +
      `Total data yang akan dihapus:\n` +
      `• ${totalProducts} Produk\n` +
      `• ${totalEmployees} Karyawan\n` +
      `• ${totalTransactions} Transaksi\n\n` +
      `⚠️ TINDAKAN INI TIDAK DAPAT DIBATALKAN!\n\n` +
      `Klik OK untuk menghapus, atau Cancel untuk membatalkan.`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(message);
      if (confirmed) {
        try {
          setLoading(true);
          let successCount = 0;
          let failCount = 0;

          for (const sellerId of selectedSellers) {
            try {
              await deleteSeller(sellerId);
              successCount++;
            } catch (error) {
              console.error('Failed to delete seller:', sellerId, error);
              failCount++;
            }
          }

          setSelectedSellers(new Set());
          setIsSelectionMode(false);

          window.alert(
            `✅ Selesai!\n\n` +
            `Berhasil dihapus: ${successCount} akun\n` +
            (failCount > 0 ? `Gagal dihapus: ${failCount} akun` : '')
          );
        } catch (error: any) {
          window.alert('❌ Error!\n\n' + (error.message || 'Gagal menghapus akun'));
        } finally {
          setLoading(false);
        }
      }
    } else {
      Alert.alert(
        '⚠️ Hapus Multiple Seller',
        message,
        [
          {
            text: 'Batal',
            style: 'cancel',
          },
          {
            text: 'Hapus Semua',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                let successCount = 0;
                let failCount = 0;

                for (const sellerId of selectedSellers) {
                  try {
                    await deleteSeller(sellerId);
                    successCount++;
                  } catch (error) {
                    console.error('Failed to delete seller:', sellerId, error);
                    failCount++;
                  }
                }

                setSelectedSellers(new Set());
                setIsSelectionMode(false);

                Alert.alert(
                  'Selesai',
                  `Berhasil dihapus: ${successCount} akun\n` +
                  (failCount > 0 ? `Gagal dihapus: ${failCount} akun` : '')
                );
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Gagal menghapus akun');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleDeleteSeller = async (seller: SellerInfo) => {
    const message =
      `⚠️ HAPUS AKUN SELLER\n\n` +
      `Apakah Anda yakin ingin menghapus akun "${seller?.displayName || seller?.email || 'seller'}"?\n\n` +
      `Ini akan menghapus:\n` +
      `• ${seller.stats?.productsCount || 0} Produk\n` +
      `• ${seller.stats?.employeesCount || 0} Karyawan\n` +
      `• ${seller.stats?.transactionsCount || 0} Transaksi\n` +
      `• Semua data terkait\n\n` +
      `⚠️ TINDAKAN INI TIDAK DAPAT DIBATALKAN!\n\n` +
      `Klik OK untuk menghapus, atau Cancel untuk membatalkan.`;

    if (Platform.OS === 'web') {
      // Web platform - use window.confirm
      const confirmed = window.confirm(message);
      if (confirmed) {
        try {
          setLoading(true);
          await deleteSeller(seller.uid);
          window.alert('✅ Berhasil!\n\nAkun seller berhasil dihapus.');
        } catch (error: any) {
          window.alert('❌ Error!\n\n' + (error.message || 'Gagal menghapus akun'));
        } finally {
          setLoading(false);
        }
      }
    } else {
      // Mobile platform - use Alert.alert
      Alert.alert(
        '⚠️ Hapus Akun Seller',
        message,
        [
          {
            text: 'Batal',
            style: 'cancel',
          },
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                await deleteSeller(seller.uid);
                Alert.alert('Berhasil', 'Akun seller berhasil dihapus');
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Gagal menghapus akun');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleSelectPlan = (planType: PlanType) => {
    setSelectedPlan(planType);
  };

  const handleConfirmPlanChange = async () => {
    console.log('🔵 Confirm button clicked');
    console.log('Selected seller:', selectedSeller?.displayName);
    console.log('Selected plan:', selectedPlan);
    console.log('Selected duration:', selectedDuration);

    if (!selectedSeller || !selectedPlan) {
      console.log('⚠️ Missing seller or plan');
      Alert.alert('Error', 'Pilih plan terlebih dahulu');
      return;
    }

    // Calculate duration in months
    let durationMonths = 1;
    let durationText = '1 bulan';

    switch (selectedDuration) {
      case '1month':
        durationMonths = 1;
        durationText = '1 bulan';
        break;
      case '1year':
        durationMonths = 12;
        durationText = '1 tahun';
        break;
      case 'unlimited':
        durationMonths = 999; // 999 months = ~83 years (unlimited)
        durationText = 'Unlimited';
        break;
      case 'custom':
        if (customDurationMode === 'duration') {
          // Mode: Format Durasi (7d, 3m, 1y, 12h)
          if (!customMonths || customMonths.trim() === '') {
            window.alert('Error: Masukkan durasi yang valid (contoh: 7d, 3m, 1y, 12h)');
            return;
          }

          // Parse custom duration format: 7d, 3m, 1y, 12h
          const input = customMonths.trim().toLowerCase();
          const match = input.match(/^(\d+)([hdmy])$/);

          if (!match) {
            window.alert('Error: Format tidak valid. Gunakan format: angka + h/d/m/y\nContoh: 7d (7 hari), 3m (3 bulan), 1y (1 tahun), 12h (12 jam)');
            return;
          }

          const value = parseInt(match[1]);
          const unit = match[2];

          if (value <= 0) {
            window.alert('Error: Nilai harus lebih dari 0');
            return;
          }

          // Convert to months for storage
          switch (unit) {
            case 'h': // hours
              durationMonths = value / (24 * 30); // approximate: hours to months
              durationText = `${value} jam`;
              break;
            case 'd': // days
              durationMonths = value / 30; // approximate: days to months
              durationText = `${value} hari`;
              break;
            case 'm': // months
              durationMonths = value;
              durationText = `${value} bulan`;
              break;
            case 'y': // years
              durationMonths = value * 12;
              durationText = `${value} tahun`;
              break;
            default:
              window.alert('Error: Unit tidak valid. Gunakan h (jam), d (hari), m (bulan), atau y (tahun)');
              return;
          }
        } else {
          // Mode: Tanggal Berakhir
          if (!customEndDate) {
            window.alert('Error: Pilih tanggal berakhir terlebih dahulu');
            return;
          }

          // Calculate duration from now to end date
          const now = new Date();
          const diffMs = customEndDate.getTime() - now.getTime();
          
          if (diffMs <= 0) {
            window.alert('Error: Tanggal berakhir harus di masa depan');
            return;
          }

          // Convert milliseconds to months (approximate)
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          durationMonths = diffDays / 30;
          
          // Format duration text
          const endDateStr = customEndDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          durationText = `sampai ${endDateStr}`;
        }
        break;
    }

    console.log('🟢 Showing confirmation alert...');

    // Direct execution without Alert for web compatibility
    const planInfo = SUBSCRIPTION_PLANS[selectedPlan] || SUBSCRIPTION_PLANS['pro'];
    const confirmed = window.confirm(
      `Ubah plan ${selectedSeller?.displayName || selectedSeller?.email || 'seller'} ke ${planInfo.displayName} untuk ${durationText}?`
    );

    if (!confirmed) {
      console.log('❌ User cancelled');
      return;
    }

    console.log('✅ User confirmed, updating subscription...');

    try {
      // Pass customEndDate if using endDate mode
      const endDateToPass = customDurationMode === 'endDate' && customEndDate ? customEndDate : undefined;
      await updateSellerSubscription(selectedSeller.uid, selectedPlan, durationMonths, endDateToPass);
      console.log('✅ Subscription updated successfully');

      window.alert(`Berhasil! Plan berhasil diubah untuk ${durationText}. Data akan update otomatis.`);

      setShowPlanModal(false);
      setSelectedPlan(null);
      // No need to reload - realtime listener will update automatically!
    } catch (error: any) {
      console.error('❌ Error updating subscription:', error);
      window.alert('Error: Gagal mengubah plan. ' + error.message);
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Keluar dari admin panel?');
    if (confirmed) {
      signOut();
    }
  };



  const copyToClipboard = async (text: string) => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(text);
        window.alert(`✅ Kode ${text} berhasil dicopy!`);
      } else {
        const Clipboard = await import('expo-clipboard');
        await Clipboard.default.setStringAsync(text);
        Alert.alert('Berhasil', `Kode ${text} berhasil dicopy!`);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const getVersionColor = (type: string) => {
    switch (type) {
      case 'major':
        return '#DC143C';
      case 'minor':
        return '#3B82F6';
      case 'patch':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getPlanColor = (planType?: PlanType) => {
    if (!planType) return '#6B7280';
    const plan = SUBSCRIPTION_PLANS[planType];
    return plan?.color || '#6B7280';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSubscriptionStatus = (subscription?: any) => {
    if (!subscription) return { text: 'Tidak Aktif', color: '#6B7280' };

    const daysRemaining = getDaysRemaining(subscription.endDate);

    if (subscription.status === 'trial') {
      if (daysRemaining && daysRemaining > 0) {
        return { text: `Trial (${daysRemaining} hari lagi)`, color: '#3B82F6' };
      }
      return { text: 'Trial Berakhir', color: '#EF4444' };
    }

    if (subscription.status === 'active') {
      if (daysRemaining && daysRemaining > 0) {
        if (daysRemaining <= 7) {
          return { text: `Aktif (${daysRemaining} hari lagi)`, color: '#F59E0B' };
        }
        return { text: `Aktif (${daysRemaining} hari lagi)`, color: '#10B981' };
      }
      return { text: 'Berakhir', color: '#EF4444' };
    }

    if (subscription.status === 'expired') {
      return { text: 'Berakhir', color: '#EF4444' };
    }

    return { text: subscription.status || 'Unknown', color: '#6B7280' };
  };

  const toggleCardExpanded = (sellerId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sellerId)) {
        newSet.delete(sellerId);
      } else {
        newSet.add(sellerId);
      }
      return newSet;
    });
  };

  const renderSellerCard = (seller: SellerInfo) => {
    const planType = seller.subscription?.planType || 'free';
    const planColor = getPlanColor(planType);
    const subscriptionStatus = getSubscriptionStatus(seller.subscription);
    const daysRemaining = getDaysRemaining(seller.subscription?.endDate);
    const isExpanded = expandedCards.has(seller.uid);

    // Get plan badge text
    const getPlanBadgeText = (plan: PlanType) => {
      switch (plan) {
        case 'free':
          return 'FREE';
        case 'standard':
          return 'STANDARD';
        case 'pro':
          return 'PRO';
        default:
          return 'FREE';
      }
    };

    const isSelected = selectedSellers.has(seller.uid);

    return (
      <View key={seller.uid} style={[styles.sellerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Checkbox - Selection Mode */}
        {isSelectionMode && (
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleSellerSelection(seller.uid)}
          >
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={24}
              color={isSelected ? '#DC143C' : colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Plan Badge - Top Right Corner */}
        <View style={[styles.cornerBadge, { backgroundColor: planColor }]}>
          <Text style={styles.cornerBadgeText}>{getPlanBadgeText(planType)}</Text>
        </View>

        <View style={styles.sellerHeader}>
          <View style={styles.sellerInfo}>
            <Text style={[styles.sellerName, { color: colors.text }]}>{seller?.displayName || seller?.email || 'Seller'}</Text>
            <Text style={[styles.sellerEmail, { color: colors.textSecondary }]}>{seller?.email || '-'}</Text>
          </View>
        </View>

        {/* Toggle Button for Subscription Info */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => toggleCardExpanded(seller.uid)}
        >
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.toggleButtonText, { color: colors.textSecondary }]}>
            {isExpanded ? 'Sembunyikan' : 'Lihat'} Info Berlangganan
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Subscription Info - Collapsible */}
        {isExpanded && (
          <View style={[styles.subscriptionInfo, { backgroundColor: colors.surface }]}>
            <View style={styles.subscriptionRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.subscriptionLabel, { color: colors.textSecondary }]}>Mulai:</Text>
              <Text style={[styles.subscriptionValue, { color: colors.text }]}>
                {formatDate(seller.subscription?.startDate)}
              </Text>
            </View>
            <View style={styles.subscriptionRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.subscriptionLabel, { color: colors.textSecondary }]}>Berakhir:</Text>
              <Text style={[styles.subscriptionValue, { color: colors.text }]}>
                {formatDate(seller.subscription?.endDate)}
              </Text>
            </View>
            <View style={styles.subscriptionRow}>
              <Ionicons
                name={daysRemaining && daysRemaining > 0 ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={subscriptionStatus?.color || '#6B7280'}
              />
              <Text style={[styles.subscriptionLabel, { color: colors.textSecondary }]}>Status:</Text>
              <Text style={[styles.subscriptionValue, { color: subscriptionStatus?.color || '#6B7280', fontWeight: '600' }]}>
                {subscriptionStatus?.text || 'Unknown'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.sellerStats}>
          <View style={styles.statItem}>
            <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>{seller.stats?.productsCount || 0} Produk</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>{seller.stats?.employeesCount || 0} Karyawan</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="receipt-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>{seller.stats?.transactionsCount || 0} Transaksi</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.changePlanButton}
            onPress={() => handleChangePlan(seller)}
          >
            <Ionicons name="swap-horizontal" size={20} color="#DC143C" />
            <Text style={styles.changePlanText}>Ubah Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteSeller(seller)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC143C" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>Admin Dashboard</Text>
            {realtimeActive && (
              <View style={styles.realtimeBadge}>
                <View style={styles.realtimeDot} />
                <Text style={styles.realtimeText}>LIVE</Text>
              </View>
            )}
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isSelectionMode
              ? `${selectedSellers.size} dari ${sellers.length} dipilih`
              : `${sellers.length} Sellers Terdaftar`
            }
          </Text>
        </View>

        {/* Theme Toggle */}
        <View style={styles.themeToggleWrapper}>
          <ThemeToggle />
        </View>

        {/* Selection Mode Toggle */}
        <TouchableOpacity
          onPress={() => {
            setIsSelectionMode(!isSelectionMode);
            setSelectedSellers(new Set());
          }}
          style={[styles.selectionButton, isSelectionMode && styles.selectionButtonActive]}
        >
          <Ionicons
            name={isSelectionMode ? 'close-circle' : 'checkmark-circle-outline'}
            size={20}
            color={isSelectionMode ? '#fff' : '#3B82F6'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('AdminSalesManagement')}
          style={styles.salesManagementButton}
        >
          <Ionicons name="people" size={20} color="#DC143C" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminContentEditor')}
          style={styles.contentEditorButton}
        >
          <Ionicons name="create-outline" size={20} color="#10B981" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminChangelogEditor')}
          style={styles.changelogButton}
        >
          <Ionicons name="list-outline" size={20} color="#8B5CF6" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminUpdateNotification')}
          style={styles.updateNotificationButton}
        >
          <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminTesting')}
          style={styles.testingButton}
        >
          <Ionicons name="flask-outline" size={20} color="#8B5CF6" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminMigration')}
          style={styles.migrationButton}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowChangelogModal(true)}
          style={styles.uploadChangelogButton}
        >
          <Ionicons name="newspaper-outline" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#DC143C" />
        </TouchableOpacity>
      </View>

      {/* Bulk Actions Bar */}
      {isSelectionMode && (
        <View style={styles.bulkActionsBar}>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={toggleSelectAll}
          >
            <Ionicons
              name={selectedSellers.size === sellers.length ? 'checkbox' : 'square-outline'}
              size={20}
              color="#DC143C"
            />
            <Text style={styles.selectAllText}>
              {selectedSellers.size === sellers.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
            </Text>
          </TouchableOpacity>

          {selectedSellers.size > 0 && (
            <TouchableOpacity
              style={styles.bulkDeleteButton}
              onPress={handleBulkDelete}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.bulkDeleteText}>
                Hapus {selectedSellers.size} Akun
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}


      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {sellers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={80} color="#333" />
            <Text style={styles.emptyText}>Belum ada seller terdaftar</Text>
          </View>
        ) : (
          <View style={styles.sellersContainer}>
            {sellers.map(renderSellerCard)}
          </View>
        )}
      </ScrollView>

      {/* Changelog Management Modal */}
      <Modal visible={showChangelogModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📝 Changelog Management</Text>
              <TouchableOpacity onPress={() => setShowChangelogModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { marginBottom: 16 }]}>
              Upload changelog untuk setiap versi. Sellers akan melihat changelog di Settings → Changelog.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Upload All Button */}
              <TouchableOpacity
                style={[styles.uploadAllButton, uploadingChangelogs && styles.uploadAllButtonDisabled]}
                onPress={handleUploadAllChangelogs}
                disabled={uploadingChangelogs}
              >
                {uploadingChangelogs ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={24} color="#fff" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.uploadAllButtonTitle}>Upload Semua Changelog</Text>
                      <Text style={styles.uploadAllButtonSubtitle}>
                        Upload 13 changelog sekaligus (v1.0.0 - v1.2.1)
                      </Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ATAU PILIH VERSI</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Individual Changelog Buttons */}
              <View style={styles.changelogList}>
                {changelogsData.map((changelog) => (
                  <TouchableOpacity
                    key={changelog.id}
                    style={[styles.changelogItem, uploadingChangelogs && styles.changelogItemDisabled]}
                    onPress={() => handleUploadSingleChangelog(changelog)}
                    disabled={uploadingChangelogs}
                  >
                    <View style={styles.changelogItemHeader}>
                      <View style={[styles.versionBadge, { backgroundColor: getVersionColor(changelog.type) }]}>
                        <Text style={styles.versionBadgeText}>v{changelog.version}</Text>
                      </View>
                      <Text style={styles.changelogDate}>{changelog.date}</Text>
                    </View>
                    <Text style={styles.changelogTitle} numberOfLines={2}>
                      {changelog.title}
                    </Text>
                    <Text style={styles.changelogDescription} numberOfLines={2}>
                      {changelog.description}
                    </Text>
                    <View style={styles.changelogFooter}>
                      <View style={styles.changelogStats}>
                        <Ionicons name="list" size={14} color="#999" />
                        <Text style={styles.changelogStatsText}>
                          {changelog.changes.length} perubahan
                        </Text>
                      </View>
                      <View style={styles.uploadButtonSmall}>
                        <Ionicons name="cloud-upload-outline" size={16} color="#10B981" />
                        <Text style={styles.uploadButtonSmallText}>Upload</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Plan Selection Modal */}
      <Modal visible={showPlanModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Plan</Text>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSubtitle}>{selectedSeller?.displayName || selectedSeller?.email || 'Seller'}</Text>

              {/* Step 1: Select Plan */}
              <Text style={styles.sectionTitle}>1. Pilih Plan</Text>
              <View style={styles.planOptions}>
                {(['free', 'standard', 'pro'] as PlanType[]).map((planType) => {
                  const plan = SUBSCRIPTION_PLANS[planType];
                  const isCurrentPlan = selectedSeller?.subscription?.planType === planType;
                  const isSelected = selectedPlan === planType;

                  return (
                    <TouchableOpacity
                      key={planType}
                      style={[
                        styles.planOption,
                        isSelected && styles.planOptionSelected,
                        isCurrentPlan && styles.planOptionCurrent,
                        { borderColor: isSelected ? (plan?.color || '#333') : '#333' },
                      ]}
                      onPress={() => handleSelectPlan(planType)}
                      disabled={isCurrentPlan}
                    >
                      <Text style={styles.planOptionName}>{plan?.displayName || planType}</Text>
                      <Text style={styles.planOptionPrice}>
                        {plan?.price === 0 ? 'Gratis' : `Rp ${(plan?.price || 0).toLocaleString()}/bln`}
                      </Text>
                      {isCurrentPlan && <Text style={styles.currentPlanText}>Plan Aktif</Text>}
                      {isSelected && !isCurrentPlan && (
                        <Ionicons name="checkmark-circle" size={20} color={plan?.color || '#3B82F6'} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Step 2: Select Duration */}
              {selectedPlan && (
                <>
                  <Text style={styles.sectionTitle}>2. Pilih Durasi</Text>
                  <View style={styles.durationOptions}>
                    <TouchableOpacity
                      style={[
                        styles.durationOption,
                        selectedDuration === '1month' && styles.durationOptionSelected,
                      ]}
                      onPress={() => setSelectedDuration('1month')}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={selectedDuration === '1month' ? '#DC143C' : '#999'}
                      />
                      <Text
                        style={[
                          styles.durationOptionText,
                          selectedDuration === '1month' && styles.durationOptionTextSelected,
                        ]}
                      >
                        1 Bulan
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.durationOption,
                        selectedDuration === '1year' && styles.durationOptionSelected,
                      ]}
                      onPress={() => setSelectedDuration('1year')}
                    >
                      <Ionicons
                        name="calendar"
                        size={20}
                        color={selectedDuration === '1year' ? '#DC143C' : '#999'}
                      />
                      <Text
                        style={[
                          styles.durationOptionText,
                          selectedDuration === '1year' && styles.durationOptionTextSelected,
                        ]}
                      >
                        1 Tahun
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.durationOption,
                        selectedDuration === 'unlimited' && styles.durationOptionSelected,
                      ]}
                      onPress={() => setSelectedDuration('unlimited')}
                    >
                      <Ionicons
                        name="infinite"
                        size={20}
                        color={selectedDuration === 'unlimited' ? '#DC143C' : '#999'}
                      />
                      <Text
                        style={[
                          styles.durationOptionText,
                          selectedDuration === 'unlimited' && styles.durationOptionTextSelected,
                        ]}
                      >
                        Unlimited
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.durationOption,
                        selectedDuration === 'custom' && styles.durationOptionSelected,
                      ]}
                      onPress={() => setSelectedDuration('custom')}
                    >
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color={selectedDuration === 'custom' ? '#DC143C' : '#999'}
                      />
                      <Text
                        style={[
                          styles.durationOptionText,
                          selectedDuration === 'custom' && styles.durationOptionTextSelected,
                        ]}
                      >
                        Custom
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Custom Duration Input */}
                  {selectedDuration === 'custom' && (
                    <View style={styles.customDurationContainer}>
                      {/* Toggle between Duration Format and End Date */}
                      <View style={styles.customModeToggle}>
                        <TouchableOpacity
                          style={[
                            styles.toggleOption,
                            customDurationMode === 'duration' && styles.toggleOptionActive,
                          ]}
                          onPress={() => {
                            console.log('🔄 Switching to Duration mode');
                            setCustomDurationMode('duration');
                          }}
                        >
                          <Ionicons 
                            name="time-outline" 
                            size={18} 
                            color={customDurationMode === 'duration' ? '#fff' : '#666'} 
                          />
                          <Text
                            style={[
                              styles.toggleOptionText,
                              customDurationMode === 'duration' && styles.toggleOptionTextActive,
                            ]}
                          >
                            Format Durasi
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.toggleOption,
                            customDurationMode === 'endDate' && styles.toggleOptionActive,
                          ]}
                          onPress={() => {
                            console.log('📅 Switching to End Date mode');
                            setCustomDurationMode('endDate');
                          }}
                        >
                          <Ionicons 
                            name="calendar-outline" 
                            size={18} 
                            color={customDurationMode === 'endDate' ? '#fff' : '#666'} 
                          />
                          <Text
                            style={[
                              styles.toggleOptionText,
                              customDurationMode === 'endDate' && styles.toggleOptionTextActive,
                            ]}
                          >
                            Tanggal Berakhir
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Duration Format Mode */}
                      {customDurationMode === 'duration' && (
                        <>
                          <Text style={styles.customDurationLabel}>Durasi Custom:</Text>
                          <TextInput
                            style={styles.customDurationInput}
                            value={customMonths}
                            onChangeText={setCustomMonths}
                            placeholder="Contoh: 7d, 3m, 1y, 12h"
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                          />
                          <Text style={styles.customDurationHint}>
                            Format: angka + unit (h=jam, d=hari, m=bulan, y=tahun)
                          </Text>
                          <View style={styles.customDurationExamples}>
                            <Text style={styles.exampleText}>• 12h = 12 jam</Text>
                            <Text style={styles.exampleText}>• 7d = 7 hari</Text>
                            <Text style={styles.exampleText}>• 3m = 3 bulan</Text>
                            <Text style={styles.exampleText}>• 1y = 1 tahun</Text>
                          </View>
                        </>
                      )}

                      {/* End Date Mode */}
                      {customDurationMode === 'endDate' && (
                        <>
                          <Text style={styles.customDurationLabel}>Pilih Tanggal Berakhir:</Text>
                          
                          {/* Web: Direct TextInput */}
                          {Platform.OS === 'web' && (
                            <View style={styles.webDateInputContainer}>
                              <TextInput
                                style={styles.webDateInput}
                                placeholder="YYYY-MM-DD (contoh: 2025-01-27)"
                                placeholderTextColor="#666"
                                value={customEndDateInput}
                                onChangeText={(text) => {
                                  console.log('📅 Date input:', text);
                                  setCustomEndDateInput(text);
                                  
                                  // Parse date from YYYY-MM-DD format
                                  if (text.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                    const date = new Date(text + 'T00:00:00');
                                    if (!isNaN(date.getTime())) {
                                      console.log('✅ Valid date:', date);
                                      setCustomEndDate(date);
                                    } else {
                                      console.log('⚠️ Invalid date');
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  // On blur, validate and format
                                  if (customEndDate) {
                                    setCustomEndDateInput(customEndDate.toISOString().split('T')[0]);
                                  }
                                }}
                              />
                              <Text style={styles.webDateHint}>
                                Format: YYYY-MM-DD (contoh: 2025-01-27 untuk 27 Januari 2025)
                              </Text>
                            </View>
                          )}
                          
                          {/* Mobile: TouchableOpacity to open picker */}
                          {Platform.OS !== 'web' && (
                            <TouchableOpacity
                              style={styles.datePickerButton}
                              onPress={() => setShowDatePicker(true)}
                            >
                              <Ionicons name="calendar" size={20} color="#DC143C" />
                              <Text style={styles.datePickerButtonText}>
                                {customEndDate 
                                  ? customEndDate.toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })
                                  : 'Pilih Tanggal'}
                              </Text>
                            </TouchableOpacity>
                          )}
                          
                          {customEndDate && (
                            <View style={styles.datePreview}>
                              <Text style={styles.datePreviewLabel}>Berakhir pada:</Text>
                              <Text style={styles.datePreviewValue}>
                                {customEndDate.toLocaleDateString('id-ID', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </Text>
                              <Text style={styles.datePreviewTime}>
                                Pukul {customEndDate.toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            </View>
                          )}

                          {/* Mobile: Native DateTimePicker */}
                          {showDatePicker && Platform.OS !== 'web' && DateTimePicker && (
                            <DateTimePicker
                              value={customEndDate || new Date()}
                              mode="date"
                              display="default"
                              onChange={(event: any, selectedDate?: Date) => {
                                setShowDatePicker(false);
                                if (selectedDate) {
                                  setCustomEndDate(selectedDate);
                                }
                              }}
                              minimumDate={new Date()}
                            />
                          )}
                        </>
                      )}
                    </View>
                  )}

                  {/* Confirm Button */}
                  <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPlanChange}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.confirmButtonText}>Konfirmasi Perubahan</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#999',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 3,
    borderBottomColor: '#DC143C',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  realtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#10B98120',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  realtimeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  realtimeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  themeToggleWrapper: {
    marginRight: 12,
  },
  contentEditorButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B98115',
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#10B98130',
  },
  changelogButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF615',
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#8B5CF630',
  },
  updateNotificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B15',
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F59E0B30',
  },
  testingButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF615',
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#8B5CF630',
  },
  migrationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F615',
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3B82F630',
  },
  salesManagementButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    borderRadius: 10,
    marginRight: 8,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadChangelogButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 10,
    marginRight: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadChangelogButtonDisabled: {
    opacity: 0.6,
  },
  logoutButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC143C15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DC143C30',
  },
  sellersContainer: {
    padding: 16,
    gap: 16,
  },
  sellerCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    position: 'relative',
    overflow: 'hidden',
  },
  cornerBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    zIndex: 10,
  },
  cornerBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sellerEmail: {
    fontSize: 14,
    color: '#999',
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  planText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  subscriptionInfo: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionLabel: {
    fontSize: 12,
    color: '#999',
    width: 70,
  },
  subscriptionValue: {
    fontSize: 12,
    color: '#fff',
    flex: 1,
  },
  sellerStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
  },
  planOptions: {
    gap: 12,
  },
  planOptionSelected: {
    borderWidth: 2,
    backgroundColor: '#DC143C10',
  },
  planOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#0a0a0a',
  },
  planOptionCurrent: {
    opacity: 0.6,
  },
  planOptionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  planOptionPrice: {
    fontSize: 14,
    color: '#999',
  },
  currentPlanText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 8,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  durationOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  durationOptionSelected: {
    borderColor: '#DC143C',
    borderWidth: 2,
    backgroundColor: '#DC143C10',
  },
  durationOptionText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  durationOptionTextSelected: {
    color: '#DC143C',
    fontWeight: '600',
  },
  customDurationContainer: {
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DC143C',
    marginBottom: 20,
  },
  customModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  toggleOptionActive: {
    backgroundColor: '#DC143C',
  },
  toggleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  toggleOptionTextActive: {
    color: '#fff',
  },
  customDurationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  customDurationInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  customDurationHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  customDurationExamples: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  exampleText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  datePreview: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC143C',
  },
  datePreviewLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  datePreviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  datePreviewTime: {
    fontSize: 14,
    color: '#DC143C',
  },
  webDateInputContainer: {
    marginTop: 8,
  },
  webDateInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  webDateHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC143C',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  changePlanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#DC143C',
    borderRadius: 10,
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  changePlanText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.3,
  },
  checkbox: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  selectionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#3B82F610',
    marginRight: 8,
  },
  selectionButtonActive: {
    backgroundColor: '#3B82F6',
  },
  bulkActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  bulkDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bulkDeleteText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Changelog Modal Styles
  uploadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#DC143C',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  uploadAllButtonDisabled: {
    opacity: 0.6,
  },
  uploadAllButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  uploadAllButtonSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
  },
  changelogList: {
    gap: 12,
  },
  changelogItem: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  changelogItemDisabled: {
    opacity: 0.6,
  },
  changelogItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  versionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  changelogDate: {
    fontSize: 12,
    color: '#999',
  },
  changelogTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 20,
  },
  changelogDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    lineHeight: 18,
  },
  changelogFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changelogStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changelogStatsText: {
    fontSize: 12,
    color: '#999',
  },
  uploadButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#10B98115',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B98130',
  },
  uploadButtonSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },

});
