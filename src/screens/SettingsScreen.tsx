import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings } from '../types';
import { useSubscription } from '../hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import { downloadBackup, restoreData, parseBackupFile, BackupData } from '../services/backupService';
import { useTheme } from '../hooks/useTheme';
import { AppContent, getAppContent, subscribeToContent, DEFAULT_CONTENT } from '../services/contentService';
import { CURRENT_VERSION, getCurrentVersion } from '../services/updateService';
import { useUpdateNotification } from '../hooks/useUpdateNotification';
import { hasUpdateAvailable, openWhatsApp } from '../services/updateNotificationService';
import { applyReferralCode, getSellerReferralInfo, SalesPerson } from '../services/sellerReferralService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function SettingsScreen({ navigation }: any) {
  const { products, transactions, customers, settings, updateSettings } = useStore();
  const { user, signOut } = useAuth();
  const { subscription, getDaysUntilExpiry } = useSubscription();
  const { colors } = useTheme();
  const [showStoreSettings, setShowStoreSettings] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [storeForm, setStoreForm] = useState<Settings>(settings);
  const [loggingOut, setLoggingOut] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupOptions, setBackupOptions] = useState({
    products: true,
    employees: true,
    transactions: true,
  });
  const [appContent, setAppContent] = useState<AppContent>(DEFAULT_CONTENT);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [displayVersion, setDisplayVersion] = useState(CURRENT_VERSION);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const { notification: updateNotification, loading: updateLoading } = useUpdateNotification();
  
  // Referral Code States
  const [referralCode, setReferralCode] = useState('');
  const [referralInfo, setReferralInfo] = useState<{ hasReferral: boolean; referralCode?: string; salesPerson?: SalesPerson }>({ hasReferral: false });
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [loadingReferral, setLoadingReferral] = useState(true);

  useEffect(() => {
    console.log('⚙️ SettingsScreen mounted');
    console.log('⚙️ Current user:', user?.email);
    setStoreForm(settings);
    
    // Load app content
    loadAppContent();
    
    // Load referral info
    loadReferralInfo();
    
    // Sync version from GitHub
    syncVersionFromGitHub();
    
    // Setup electron update listeners
    setupElectronUpdateListeners();
    
    // Subscribe to realtime content updates
    const unsubscribeContent = subscribeToContent((content) => {
      console.log('📝 Content updated in SettingsScreen');
      setAppContent(content);
    });
    
    // Setup realtime listener for referral code changes
    let unsubscribeReferral: (() => void) | undefined;
    
    if (user?.uid) {
      console.log('🔄 Setting up realtime listener for referral code...');
      const userRef = doc(db, 'users', user.uid);
      
      unsubscribeReferral = onSnapshot(
        userRef,
        {
          includeMetadataChanges: true,
        },
        async (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data();
            console.log('📥 Realtime update received for user referral!');
            console.log('📊 ReferralCode:', userData.referralCode);
            console.log('📊 ReferredBy:', userData.referredBy);
            
            // Reload referral info when data changes
            await loadReferralInfo();
          }
        },
        (error) => {
          console.error('❌ Realtime listener error (referral):', error);
        }
      );
    }
    
    return () => {
      unsubscribeContent();
      if (unsubscribeReferral) {
        console.log('🔴 Cleaning up realtime listener for referral code...');
        unsubscribeReferral();
      }
    };
  }, [settings, user?.uid]);

  const syncVersionFromGitHub = async () => {
    try {
      const version = await getCurrentVersion();
      setDisplayVersion(version);
      console.log('✅ Version display synced:', version);
    } catch (error) {
      console.error('Error syncing version:', error);
    }
  };

  const setupElectronUpdateListeners = () => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      console.log('✅ Setting up electron update listeners');
      
      // Listen for update available
      (window as any).electron.onUpdateAvailable((info: any) => {
        console.log('🎉 Update available:', info);
        setCheckingUpdate(false);
        // Download will start automatically, just show progress
      });
      
      // Listen for download progress
      (window as any).electron.onDownloadProgress((progress: any) => {
        console.log('📥 Download progress:', progress.percent + '%');
        setDownloadProgress(progress.percent);
        setIsDownloading(true);
        setCheckingUpdate(false);
      });
      
      // Listen for update downloaded
      (window as any).electron.onUpdateDownloaded((info: any) => {
        console.log('✅ Update downloaded:', info);
        setIsDownloading(false);
        // No alert needed, app will restart automatically
      });
      
      // Listen for update error
      (window as any).electron.onUpdateError((error: any) => {
        console.error('❌ Update error:', error);
        setIsDownloading(false);
        setCheckingUpdate(false);
        if (Platform.OS === 'web') {
          window.alert('❌ ERROR\n\nGagal download update: ' + error.message);
        }
      });
    }
  };



  useEffect(() => {
    console.log('⚙️ User changed in SettingsScreen:', user?.email);
  }, [user]);
  
  const loadAppContent = async () => {
    try {
      const content = await getAppContent();
      setAppContent(content);
    } catch (error) {
      console.error('Error loading app content:', error);
    }
  };

  const loadReferralInfo = async () => {
    if (!user) return;
    
    try {
      setLoadingReferral(true);
      const info = await getSellerReferralInfo(user.uid);
      setReferralInfo(info);
    } catch (error) {
      console.error('Error loading referral info:', error);
    } finally {
      setLoadingReferral(false);
    }
  };

  const handleApplyReferralCode = async () => {
    if (!user) return;
    
    const code = referralCode.trim().toUpperCase();
    if (!code) {
      if (Platform.OS === 'web') {
        window.alert('Masukkan kode referral');
      } else {
        Alert.alert('Error', 'Masukkan kode referral');
      }
      return;
    }

    try {
      setApplyingReferral(true);
      const result = await applyReferralCode(user.uid, code);
      
      if (result.success) {
        // Reload referral info
        await loadReferralInfo();
        setReferralCode('');
        
        if (Platform.OS === 'web') {
          window.alert(
            `✅ BERHASIL!\n\n${result.message}\n\n` +
            `Sales: ${result.salesPerson?.name || 'Unknown'}\n` +
            `Kode: ${result.salesPerson?.referralCode || code}`
          );
        } else {
          Alert.alert(
            'Berhasil! ✅',
            `${result.message}\n\nSales: ${result.salesPerson?.name || 'Unknown'}\nKode: ${result.salesPerson?.referralCode || code}`
          );
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(`❌ GAGAL\n\n${result.message}`);
        } else {
          Alert.alert('Gagal', result.message);
        }
      }
    } catch (error: any) {
      console.error('Error applying referral code:', error);
      if (Platform.OS === 'web') {
        window.alert(`❌ ERROR\n\n${error.message}`);
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setApplyingReferral(false);
    }
  };

  const handleSaveStoreSettings = () => {
    updateSettings(storeForm);
    setShowStoreSettings(false);
    Alert.alert('Berhasil', 'Pengaturan toko berhasil disimpan');
  };

  const handleCheckForUpdates = async () => {
    console.log('🔍 Check for updates clicked');
    console.log('📊 Update notification data:', updateNotification);
    console.log('⏳ Update loading:', updateLoading);
    
    setCheckingUpdate(true);
    
    try {
      // Wait for data to load if still loading
      if (updateLoading) {
        console.log('⏳ Still loading, waiting...');
        Alert.alert(
          'Mohon Tunggu',
          'Sedang memuat data update...',
          [{ text: 'OK' }]
        );
        setCheckingUpdate(false);
        return;
      }

      // Get update notification from Firestore
      if (!updateNotification) {
        console.log('❌ Update notification is null');
        Alert.alert(
          'Error',
          'Tidak dapat memeriksa update saat ini. Silakan coba lagi nanti.',
          [{ text: 'OK' }]
        );
        setCheckingUpdate(false);
        return;
      }

      // Compare current version with latest version
      const currentVersion = CURRENT_VERSION; // e.g., "1.1.10"
      const latestVersion = updateNotification.latestVersion; // e.g., "1.2.0"
      
      console.log('📱 Current version:', currentVersion);
      console.log('🆕 Latest version:', latestVersion);
      
      const updateAvailable = hasUpdateAvailable(currentVersion, latestVersion);
      console.log('🔍 Update available:', updateAvailable);
      
      if (updateAvailable) {
        // Ada update baru - tampilkan pesan dari admin
        console.log('🎉 Showing update available alert');
        
        if (Platform.OS === 'web') {
          const confirmed = window.confirm(
            `🎉 Update Tersedia!\n\n` +
            `${updateNotification.updateAvailableMessage}\n\n` +
            `Versi Saat Ini: ${currentVersion}\n` +
            `Versi Terbaru: ${latestVersion}\n\n` +
            `Klik OK untuk upgrade sekarang via WhatsApp`
          );
          
          if (confirmed) {
            openWhatsApp(
              updateNotification.whatsappNumber,
              `Halo, saya ingin upgrade BetaKasir dari v${currentVersion} ke v${latestVersion}`
            );
          }
        } else {
          Alert.alert(
            `Update Tersedia! 🎉`,
            `${updateNotification.updateAvailableMessage}\n\nVersi Saat Ini: ${currentVersion}\nVersi Terbaru: ${latestVersion}`,
            [
              { text: 'Nanti', style: 'cancel' },
              {
                text: 'Upgrade Sekarang',
                style: 'default',
                onPress: () => {
                  openWhatsApp(
                    updateNotification.whatsappNumber,
                    `Halo, saya ingin upgrade BetaKasir dari v${currentVersion} ke v${latestVersion}`
                  );
                }
              }
            ]
          );
        }
      } else {
        // Sudah versi terbaru - tampilkan pesan dari admin
        console.log('✅ Showing up to date alert');
        
        if (Platform.OS === 'web') {
          window.alert(
            `✅ Sudah Terbaru!\n\n` +
            `${updateNotification.upToDateMessage}\n\n` +
            `Versi Saat Ini: ${currentVersion}`
          );
        } else {
          Alert.alert(
            'Sudah Terbaru! ✅',
            `${updateNotification.upToDateMessage}\n\nVersi Saat Ini: ${currentVersion}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error: any) {
      console.error('❌ Error checking for updates:', error);
      Alert.alert('Error', 'Gagal memeriksa update: ' + error.message);
    } finally {
      setCheckingUpdate(false);
    }
  };



  const handleBackup = () => {
    if (!user) {
      window.alert('Error: User tidak ditemukan');
      return;
    }
    
    // Show backup options modal
    setShowBackupModal(true);
  };

  const handleConfirmBackup = async () => {
    if (!user) return;

    // Check if at least one option is selected
    if (!backupOptions.products && !backupOptions.employees && !backupOptions.transactions) {
      window.alert('Error: Pilih minimal satu jenis data untuk di-backup');
      return;
    }

    try {
      setBackupLoading(true);
      setShowBackupModal(false);
      console.log('💾 Starting selective backup...', backupOptions);
      
      const storeName = settings.storeName || 'BetaKasir';
      
      // Use selective backup
      const { backupData } = await import('../services/backupService');
      const data = await backupData(user.uid);
      
      // Filter data based on options
      const filteredData = {
        version: data.version,
        timestamp: data.timestamp,
        products: backupOptions.products ? data.products : [],
        employees: backupOptions.employees ? data.employees : [],
        transactions: backupOptions.transactions ? data.transactions : [],
      };
      
      // Create filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `betakasir-backup-${storeName}-${timestamp}.json`;
      
      // Download
      const jsonString = JSON.stringify(filteredData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      const items = [];
      if (backupOptions.products) items.push(`${filteredData.products.length} produk`);
      if (backupOptions.employees) items.push(`${filteredData.employees.length} karyawan`);
      if (backupOptions.transactions) items.push(`${filteredData.transactions.length} transaksi`);
      
      window.alert(
        '✅ BACKUP BERHASIL\n\n' +
        `File backup telah diunduh:\n${filename}\n\n` +
        'File ini berisi:\n' +
        items.map(item => `• ${item}`).join('\n') + '\n\n' +
        'Simpan file ini di tempat yang aman!'
      );
    } catch (error: any) {
      console.error('❌ Backup error:', error);
      window.alert('❌ ERROR\n\nGagal backup data: ' + error.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreClick = () => {
    if (!user) {
      window.alert('Error: User tidak ditemukan');
      return;
    }

    const confirmed = window.confirm(
      '📥 RESTORE DATA\n\n' +
      'Pilih file backup (.json) untuk restore data.\n\n' +
      '⚠️ PERINGATAN:\n' +
      '• Data yang ada akan digabung dengan data dari backup\n' +
      '• Jika ada data dengan ID sama, data lama akan dipertahankan\n' +
      '• Proses ini tidak bisa dibatalkan\n\n' +
      'Lanjutkan?'
    );

    if (!confirmed) return;

    console.log('✅ User confirmed, creating file input...');

    // Create file input dynamically
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = handleFileSelect;
    input.click();
  };

  const handleFileSelect = async (event: any) => {
    console.log('📂 File select triggered');
    
    if (!user) {
      console.log('❌ No user');
      return;
    }

    const file = event.target.files?.[0];
    console.log('📄 Selected file:', file?.name);
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    try {
      setRestoreLoading(true);
      console.log('📥 Reading backup file:', file.name);

      const reader = new FileReader();
      
      reader.onerror = () => {
        console.error('❌ FileReader error:', reader.error);
        window.alert('❌ ERROR\n\nGagal membaca file: ' + reader.error?.message);
        setRestoreLoading(false);
      };
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          console.log('📄 File content loaded, length:', content?.length);
          
          if (!content) {
            throw new Error('File kosong atau tidak bisa dibaca');
          }
          
          const backupData = parseBackupFile(content);

          console.log('📊 Backup data parsed:', {
            products: backupData.products?.length || 0,
            employees: backupData.employees?.length || 0,
            transactions: backupData.transactions?.length || 0,
          });

          const confirmed = window.confirm(
            '📥 KONFIRMASI RESTORE\n\n' +
            `File backup: ${file.name}\n` +
            `Tanggal backup: ${new Date(backupData.timestamp).toLocaleString('id-ID')}\n\n` +
            'Data yang akan di-restore:\n' +
            `• ${backupData.products?.length || 0} produk\n` +
            `• ${backupData.employees?.length || 0} karyawan\n` +
            `• ${backupData.transactions?.length || 0} transaksi\n\n` +
            'Lanjutkan restore?'
          );

          if (!confirmed) {
            setRestoreLoading(false);
            return;
          }

          const result = await restoreData(user.uid, backupData, {
            includeProducts: true,
            includeEmployees: true,
            includeTransactions: true,
            overwrite: false, // Merge mode
          });

          window.alert(
            '✅ RESTORE BERHASIL\n\n' +
            'Data berhasil di-restore:\n' +
            `• ${result.productsRestored} produk\n` +
            `• ${result.employeesRestored} karyawan\n` +
            `• ${result.transactionsRestored} transaksi\n\n` +
            'Refresh halaman untuk melihat data terbaru.'
          );

          // Reload data
          useStore.getState().loadData();
        } catch (error: any) {
          console.error('❌ Restore error:', error);
          window.alert('❌ ERROR\n\nGagal restore data: ' + error.message);
        } finally {
          setRestoreLoading(false);
        }
      };

      reader.readAsText(file);
    } catch (error: any) {
      console.error('❌ File read error:', error);
      window.alert('❌ ERROR\n\nGagal membaca file: ' + error.message);
      setRestoreLoading(false);
    }

    // Reset input
    event.target.value = '';
  };

  const handleClearData = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        '⚠️ HAPUS SEMUA DATA\n\n' +
        'Yakin ingin menghapus semua data?\n\n' +
        '⚠️ PERINGATAN:\n' +
        '- Semua produk akan dihapus\n' +
        '- Semua transaksi akan dihapus\n' +
        '- Semua customer akan dihapus\n' +
        '- Semua karyawan akan dihapus\n\n' +
        'Tindakan ini TIDAK DAPAT DIBATALKAN!'
      );
      
      if (confirmed) {
        handleClearDataConfirmed();
      }
    } else {
      Alert.alert(
        '⚠️ Hapus Semua Data',
        'Yakin ingin menghapus semua data?\n\n⚠️ PERINGATAN:\n- Semua produk akan dihapus\n- Semua transaksi akan dihapus\n- Semua customer akan dihapus\n- Semua karyawan akan dihapus\n\nTindakan ini TIDAK DAPAT DIBATALKAN!',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Hapus Semua',
            style: 'destructive',
            onPress: handleClearDataConfirmed,
          },
        ]
      );
    }
  };

  const handleClearDataConfirmed = async () => {
    try {
      console.log('🗑️ Starting to clear all data...');
      
      // Clear AsyncStorage
      await AsyncStorage.clear();
      console.log('✅ AsyncStorage cleared');
      
      // Clear Firestore data (if user is logged in)
      if (user) {
        const { deleteAllDataFromFirestore } = await import('../services/dataService');
        await deleteAllDataFromFirestore(user.uid);
        console.log('✅ Firestore data cleared');
      }
      
      // Reset store
      useStore.getState().resetStore();
      console.log('✅ Store reset');
      
      if (Platform.OS === 'web') {
        window.alert('✅ BERHASIL\n\nSemua data telah dihapus.\n\nAplikasi akan reload...');
        window.location.reload();
      } else {
        Alert.alert('Berhasil', 'Semua data telah dihapus. Aplikasi akan restart.', [
          { text: 'OK', onPress: () => {
            // Restart app (for mobile)
          }}
        ]);
      }
    } catch (error: any) {
      console.error('❌ Error clearing data:', error);
      if (Platform.OS === 'web') {
        window.alert('❌ ERROR\n\nGagal menghapus data: ' + error.message);
      } else {
        Alert.alert('Error', 'Gagal menghapus data: ' + error.message);
      }
    }
  };

  const SettingItem = ({ icon, title, subtitle, onPress, color = '#333', disabled = false }: any) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: colors.border }, disabled && styles.settingItemDisabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={24} color={disabled ? colors.textSecondary : color} />
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }, disabled && { color: colors.textSecondary }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }, disabled && { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {!disabled && <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />}
      {disabled && <ActivityIndicator size="small" color={colors.textSecondary} />}
    </TouchableOpacity>
  );

  const handleLogout = async () => {
    console.log('🔵 Logout button clicked - direct logout');
    console.log('🔵 Current user:', user?.email);
    
    setLoggingOut(true);
    
    try {
      console.log('🔵 Calling signOut...');
      await signOut();
      console.log('🔵 signOut completed successfully');
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      if (Platform.OS === 'web') {
        window.alert('Gagal logout: ' + error.message);
      } else {
        Alert.alert('Error', 'Gagal logout: ' + error.message);
      }
      setLoggingOut(false);
    }
  };

  // Old logout with confirmation (not used anymore)
  const handleLogoutWithConfirm = async () => {
    console.log('🔵 Logout button clicked');
    console.log('🔵 Current user:', user?.email);
    
    // Use window.confirm for web, Alert.alert for mobile
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Yakin ingin keluar dari akun?');
      console.log('🔵 Confirmation result:', confirmed);
      
      if (!confirmed) {
        console.log('🔵 Logout cancelled');
        return;
      }
      
      console.log('🔵 Logout confirmed!');
      setLoggingOut(true);
      
      try {
        console.log('🔵 Calling signOut...');
        await signOut();
        console.log('🔵 signOut completed successfully');
      } catch (error: any) {
        console.error('❌ Logout error:', error);
        window.alert('Gagal logout: ' + error.message);
        setLoggingOut(false);
      }
    } else {
      // Mobile: Use Alert.alert
      Alert.alert(
        'Keluar dari Akun',
        'Yakin ingin keluar dari akun?',
        [
          { 
            text: 'Batal', 
            style: 'cancel',
            onPress: () => console.log('🔵 Logout cancelled')
          },
          {
            text: 'Keluar',
            style: 'destructive',
            onPress: async () => {
              console.log('🔵 Logout confirmed!');
              setLoggingOut(true);
              try {
                console.log('🔵 Calling signOut...');
                await signOut();
                console.log('🔵 signOut completed successfully');
              } catch (error: any) {
                console.error('❌ Logout error:', error);
                Alert.alert('Error', 'Gagal logout: ' + error.message);
                setLoggingOut(false);
              }
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.primary }]}>
          <Text style={[styles.title, { color: colors.text }]}>Pengaturan</Text>
        </View>

      {/* User Account Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Akun</Text>
        <View style={[styles.userCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
          <View style={[styles.userAvatar, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.displayName || user?.email}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Subscription Plan Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Plan & Billing</Text>
        <TouchableOpacity 
          style={[styles.planCard, { backgroundColor: colors.background }]}
          onPress={() => navigation?.navigate('Billing')}
        >
          <View style={styles.planHeader}>
            <View style={styles.planIcon}>
              <Ionicons 
                name={subscription?.planType === 'pro' ? 'rocket' : subscription?.planType === 'standard' ? 'diamond' : 'gift'} 
                size={24} 
                color={subscription?.planType === 'pro' ? '#8B5CF6' : subscription?.planType === 'standard' ? '#3B82F6' : '#6B7280'} 
              />
            </View>
            <View style={styles.planInfo}>
              <Text style={[styles.planName, { color: colors.text }]}>
                {subscription ? (SUBSCRIPTION_PLANS[subscription.planType]?.displayName || 'Pro') : 'Free Trial'}
              </Text>
              {subscription?.status === 'trial' && (
                <Text style={styles.planTrial}>
                  Trial berakhir dalam {getDaysUntilExpiry()} hari
                </Text>
              )}
              {subscription?.status === 'active' && (
                <Text style={styles.planActive}>Aktif</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
        
        {subscription?.planType === 'free' && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => navigation?.navigate('Billing')}
          >
            <Ionicons name="rocket" size={20} color="#FFFFFF" />
            <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
          </TouchableOpacity>
        )}
      </View>


      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Informasi Aplikasi</Text>
        <View style={[styles.infoCard, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Versi Aplikasi</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{displayVersion}</Text>
        </View>
        <View style={[styles.infoCard, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Total Produk</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{products.length}</Text>
        </View>
        <View style={[styles.infoCard, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Total Transaksi</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{transactions.length}</Text>
        </View>
        
        {/* Update Notification Card */}
        {!updateLoading && updateNotification && (() => {
          const currentVersion = CURRENT_VERSION;
          const latestVersion = updateNotification.latestVersion;
          const updateAvailable = hasUpdateAvailable(currentVersion, latestVersion);
          
          return (
            <View style={[
              styles.updateNotificationCard,
              { 
                backgroundColor: updateAvailable ? '#FEF3C7' : '#D1FAE5',
                borderColor: updateAvailable ? '#F59E0B' : '#10B981'
              }
            ]}>
              <View style={styles.updateNotificationHeader}>
                <Ionicons 
                  name={updateAvailable ? "alert-circle" : "checkmark-circle"} 
                  size={24} 
                  color={updateAvailable ? "#F59E0B" : "#10B981"} 
                />
                <Text style={[
                  styles.updateNotificationTitle,
                  { color: updateAvailable ? "#92400E" : "#065F46" }
                ]}>
                  {updateAvailable ? "Update Tersedia! 🎉" : "Sudah Terbaru! ✅"}
                </Text>
              </View>
              
              <Text style={[
                styles.updateNotificationMessage,
                { color: updateAvailable ? "#78350F" : "#047857" }
              ]}>
                {updateAvailable ? updateNotification.updateAvailableMessage : updateNotification.upToDateMessage}
              </Text>
              
              <View style={styles.updateNotificationVersions}>
                <Text style={[styles.updateNotificationVersion, { color: updateAvailable ? "#92400E" : "#065F46" }]}>
                  Versi Saat Ini: {currentVersion}
                </Text>
                {updateAvailable && (
                  <Text style={[styles.updateNotificationVersion, { color: "#92400E", fontWeight: '600' }]}>
                    Versi Terbaru: {latestVersion}
                  </Text>
                )}
              </View>
              
              {updateAvailable && (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => {
                    openWhatsApp(
                      updateNotification.whatsappNumber,
                      `Halo, saya ingin upgrade BetaKasir dari v${currentVersion} ke v${latestVersion}`
                    );
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                  <Text style={styles.upgradeButtonText}>Upgrade Sekarang</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })()}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Bantuan</Text>
        <SettingItem
          icon="book-outline"
          title={appContent?.settingsContent?.userGuideTitle || 'Panduan Penggunaan'}
          subtitle={appContent?.settingsContent?.userGuideSubtitle || 'Tutorial lengkap cara pakai aplikasi'}
          onPress={() => navigation.navigate('UserGuide')}
          color="#4ECDC4"
        />
        <SettingItem
          icon="list-outline"
          title="Changelog"
          subtitle="Lihat update dan perubahan terbaru"
          onPress={() => navigation.navigate('Changelog')}
          color="#8B5CF6"
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Toko</Text>
        <SettingItem
          icon="storefront-outline"
          title="Informasi Toko"
          subtitle="Nama, alamat, dan kontak toko"
          onPress={() => setShowStoreSettings(true)}
          color="#DC143C"
        />
      </View>

      {/* Referral Code Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Kode Referral Sales</Text>
        
        {loadingReferral ? (
          <View style={styles.referralLoadingCard}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.referralLoadingText, { color: colors.textSecondary }]}>Memuat...</Text>
          </View>
        ) : referralInfo.hasReferral ? (
          // Sudah punya referral code
          <View style={[styles.referralCard, { backgroundColor: colors.background, borderColor: '#10B981' }]}>
            <View style={[styles.referralIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
            </View>
            <View style={styles.referralInfo}>
              <Text style={[styles.referralTitle, { color: colors.text }]}>Kode Referral Aktif</Text>
              <Text style={[styles.referralCode, { color: '#10B981' }]}>{referralInfo.referralCode}</Text>
              {referralInfo.salesPerson && (
                <Text style={[styles.referralSales, { color: colors.textSecondary }]}>
                  Sales: {referralInfo.salesPerson.name}
                </Text>
              )}
              <Text style={[styles.referralNote, { color: colors.textSecondary }]}>
                ✅ Anda terhubung dengan sales person
              </Text>
            </View>
          </View>
        ) : (
          // Belum punya referral code - tampilkan input
          <View style={[styles.referralInputCard, { backgroundColor: colors.background }]}>
            <View style={styles.referralInputHeader}>
              <Ionicons name="gift" size={24} color={colors.primary} />
              <Text style={[styles.referralInputTitle, { color: colors.text }]}>Punya Kode Referral?</Text>
            </View>
            <Text style={[styles.referralInputDesc, { color: colors.textSecondary }]}>
              Masukkan kode referral dari sales person untuk terhubung dengan mereka.
            </Text>
            <View style={styles.referralInputRow}>
              <TextInput
                style={[styles.referralInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Contoh: JOHN2025"
                placeholderTextColor={colors.textSecondary}
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
                maxLength={10}
              />
              <TouchableOpacity
                style={[styles.referralApplyButton, { backgroundColor: colors.primary }, applyingReferral && { opacity: 0.5 }]}
                onPress={handleApplyReferralCode}
                disabled={applyingReferral}
              >
                {applyingReferral ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.referralApplyButtonText}>Terapkan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <View style={[styles.referralBenefitCard, { backgroundColor: colors.card }]}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.referralBenefitText, { color: colors.textSecondary }]}>
                Dengan memasukkan kode referral, Anda akan terhubung dengan sales person yang membantu Anda.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* WhatsApp Integration Section - Coming Soon */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>WhatsApp Integration</Text>
        <TouchableOpacity 
          style={[styles.settingItem, { borderBottomColor: colors.border, opacity: 0.6 }]}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.alert('🚀 COMING SOON!\n\nWhatsApp Bot Integration sedang dalam pengembangan.\n\nFitur yang akan datang:\n✅ Laporan harian otomatis\n✅ Smart alerts\n✅ Remote commands\n✅ 100% GRATIS!\n\nStay tuned! 🎉');
            } else {
              Alert.alert('🚀 Coming Soon', 'WhatsApp Bot Integration sedang dalam pengembangan.\n\nFitur yang akan datang:\n✅ Laporan harian otomatis\n✅ Smart alerts\n✅ Remote commands\n✅ 100% GRATIS!\n\nStay tuned! 🎉');
            }
          }}
        >
          <View style={[styles.settingIcon, { backgroundColor: '#25D366' + '20' }]}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          </View>
          <View style={styles.settingContent}>
            <View style={styles.settingTitleRow}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>WhatsApp Bot Integration</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </View>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              Laporan harian & alert otomatis via WhatsApp (GRATIS!)
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data</Text>
        <SettingItem
          icon="cloud-upload-outline"
          title={backupLoading ? "Memproses..." : "Backup Data"}
          subtitle="Simpan data ke file"
          onPress={handleBackup}
          color="#10B981"
          disabled={backupLoading}
        />
        <SettingItem
          icon="cloud-download-outline"
          title={restoreLoading ? "Memproses..." : "Copy Data"}
          subtitle="Restore data dari file backup"
          onPress={handleRestoreClick}
          color="#3B82F6"
          disabled={restoreLoading}
        />
        <SettingItem
          icon="trash-outline"
          title="Hapus Semua Data"
          subtitle="Reset aplikasi ke kondisi awal"
          onPress={handleClearData}
          color="#f44336"
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Tentang</Text>
        <SettingItem
          icon="information-circle-outline"
          title={`Tentang ${appContent?.settingsContent?.aboutTitle || 'BetaKasir'}`}
          subtitle="Aplikasi kasir untuk toko & minimarket"
          onPress={() => setShowAboutModal(true)}
          color="#DC143C"
        />
        <SettingItem
          icon="help-circle-outline"
          title="Bantuan & Dukungan"
          subtitle={appContent?.settingsContent?.helpSubtitle || 'Kami siap membantu Anda!'}
          onPress={() => setShowHelpModal(true)}
          color="#DC143C"
        />
      </View>

      {/* Logout Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Akun & Keamanan</Text>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.background }, loggingOut && styles.logoutButtonDisabled]}
          disabled={loggingOut}
          onPress={handleLogout}
        >
          {loggingOut ? (
            <>
              <ActivityIndicator color="#f44336" size="small" />
              <Text style={styles.logoutButtonText}>Sedang Keluar...</Text>
            </>
          ) : (
            <>
              <Ionicons name="log-out-outline" size={24} color="#f44336" />
              <Text style={styles.logoutButtonText}>Keluar dari Akun</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>BetaKasir v{displayVersion}</Text>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>© 2026 All Rights Reserved</Text>
      </View>
      </ScrollView>

      {/* About Modal */}
      <Modal visible={showAboutModal} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalFullScreen, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.primary }]}>
            <TouchableOpacity onPress={() => setShowAboutModal(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Tentang BetaKasir</Text>
            <View style={styles.backButton} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.aboutContainer}>
              <View style={styles.aboutLogo}>
                <Ionicons name="cart" size={80} color={colors.primary} />
              </View>
              
              <Text style={[styles.aboutTitle, { color: colors.text }]}>{appContent?.settingsContent?.aboutTitle || 'BetaKasir'}</Text>
              <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>Versi {displayVersion}</Text>
              
              <View style={styles.aboutSection}>
                <Text style={[styles.aboutSectionTitle, { color: colors.primary }]}>📱 Tentang Aplikasi</Text>
                <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
                  {appContent?.settingsContent?.aboutDescription || 'BetaKasir adalah aplikasi kasir modern untuk toko, minimarket, dan UMKM.'}
                </Text>
              </View>

              <View style={styles.aboutSection}>
                <Text style={[styles.aboutSectionTitle, { color: colors.primary }]}>✨ Fitur Utama</Text>
                <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
                  {appContent?.settingsContent?.aboutFeatures || '• Manajemen Produk & Barcode Scanner\n• Transaksi Kasir Cepat\n• Laporan Keuangan Lengkap'}
                </Text>
              </View>

              <View style={styles.aboutSection}>
                <Text style={[styles.aboutSectionTitle, { color: colors.primary }]}>🔒 Keamanan</Text>
                <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
                  {appContent?.settingsContent?.aboutSecurity || 'Data Anda tersimpan aman di Firebase Cloud dengan enkripsi end-to-end.'}
                </Text>
              </View>

              <View style={styles.aboutSection}>
                <Text style={[styles.aboutSectionTitle, { color: colors.primary }]}>📞 Kontak</Text>
                <Text style={[styles.aboutText, { color: colors.textSecondary }]}>Website: {appContent?.settingsContent?.aboutContactWebsite || 'www.betakasir.com'}</Text>
                <Text style={[styles.aboutText, { color: colors.textSecondary }]}>Email: {appContent?.settingsContent?.aboutContactEmail || 'support@betakasir.com'}</Text>
                <Text style={[styles.aboutText, { color: colors.textSecondary }]}>WhatsApp: {appContent?.settingsContent?.aboutContactWhatsApp || '+62 812-3456-7890'}</Text>
              </View>

              <View style={[styles.aboutFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.aboutFooterText, { color: colors.textSecondary }]}>© 2026 {appContent?.settingsContent?.aboutTitle || 'BetaKasir'}</Text>
                <Text style={[styles.aboutFooterText, { color: colors.textSecondary }]}>All Rights Reserved</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Help Modal */}
      <Modal visible={showHelpModal} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalFullScreen, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.primary }]}>
            <TouchableOpacity onPress={() => setShowHelpModal(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Bantuan & Dukungan</Text>
            <View style={styles.backButton} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.helpContainer}>
              <View style={styles.helpSection}>
                <Ionicons name="help-circle" size={60} color={colors.primary} />
                <Text style={[styles.helpTitle, { color: colors.text }]}>{appContent?.settingsContent?.helpTitle || 'Butuh Bantuan?'}</Text>
                <Text style={[styles.helpSubtitle, { color: colors.textSecondary }]}>{appContent?.settingsContent?.helpSubtitle || 'Kami siap membantu Anda!'}</Text>
              </View>

              <TouchableOpacity style={styles.helpCard} onPress={() => {
                if (Platform.OS === 'web') {
                  const phoneNumber = (appContent?.settingsContent?.helpWhatsAppNumber || '+62 812-3456-7890').replace(/[^0-9]/g, '');
                  window.open(`https://wa.me/${phoneNumber}`, '_blank');
                }
              }}>
                <Ionicons name="logo-whatsapp" size={32} color="#25D366" />
                <View style={styles.helpCardContent}>
                  <Text style={styles.helpCardTitle}>{appContent?.settingsContent?.helpWhatsAppTitle || 'WhatsApp Support'}</Text>
                  <Text style={styles.helpCardSubtitle}>{appContent?.settingsContent?.helpWhatsAppSubtitle || 'Chat langsung dengan tim support'}</Text>
                  <Text style={styles.helpCardValue}>{appContent?.settingsContent?.helpWhatsAppNumber || '+62 812-3456-7890'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpCard} onPress={() => {
                if (Platform.OS === 'web') {
                  window.location.href = `mailto:${appContent?.settingsContent?.helpEmailAddress || 'support@betakasir.com'}`;
                }
              }}>
                <Ionicons name="mail" size={32} color="#DC143C" />
                <View style={styles.helpCardContent}>
                  <Text style={styles.helpCardTitle}>{appContent?.settingsContent?.helpEmailTitle || 'Email Support'}</Text>
                  <Text style={styles.helpCardSubtitle}>{appContent?.settingsContent?.helpEmailSubtitle || 'Kirim email ke tim support'}</Text>
                  <Text style={styles.helpCardValue}>{appContent?.settingsContent?.helpEmailAddress || 'support@betakasir.com'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpCard} onPress={() => {
                if (Platform.OS === 'web') {
                  const docsUrl = appContent?.settingsContent?.helpDocsUrl || 'www.betakasir.com/docs';
                  const url = docsUrl.startsWith('http') 
                    ? docsUrl 
                    : `https://${docsUrl}`;
                  window.open(url, '_blank');
                }
              }}>
                <Ionicons name="book" size={32} color="#4ECDC4" />
                <View style={styles.helpCardContent}>
                  <Text style={styles.helpCardTitle}>{appContent?.settingsContent?.helpDocsTitle || 'Dokumentasi'}</Text>
                  <Text style={styles.helpCardSubtitle}>{appContent?.settingsContent?.helpDocsSubtitle || 'Panduan lengkap penggunaan aplikasi'}</Text>
                  <Text style={styles.helpCardValue}>{appContent?.settingsContent?.helpDocsUrl || 'www.betakasir.com/docs'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpCard} onPress={() => {
                if (Platform.OS === 'web') {
                  const videoChannel = appContent?.settingsContent?.helpVideoChannel || '@betakasir';
                  const channel = videoChannel.replace('@', '');
                  window.open(`https://www.youtube.com/@${channel}`, '_blank');
                }
              }}>
                <Ionicons name="logo-youtube" size={32} color="#FF0000" />
                <View style={styles.helpCardContent}>
                  <Text style={styles.helpCardTitle}>{appContent?.settingsContent?.helpVideoTitle || 'Video Tutorial'}</Text>
                  <Text style={styles.helpCardSubtitle}>{appContent?.settingsContent?.helpVideoSubtitle || 'Tutorial lengkap di YouTube'}</Text>
                  <Text style={styles.helpCardValue}>{appContent?.settingsContent?.helpVideoChannel || '@betakasir'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>📚 FAQ (Pertanyaan Umum)</Text>
                
                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>Q: Bagaimana cara menambah produk?</Text>
                  <Text style={styles.faqAnswer}>A: Buka menu Produk → Klik tombol + → Isi data produk → Simpan</Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>Q: Bagaimana cara scan barcode?</Text>
                  <Text style={styles.faqAnswer}>A: Buka menu Kasir → Klik input barcode → Scan dengan scanner hardware</Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>Q: Bagaimana cara cetak struk?</Text>
                  <Text style={styles.faqAnswer}>A: Setelah checkout, struk akan otomatis tercetak. Atau buka Transaksi → Pilih transaksi → Cetak Struk</Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>Q: Apakah data aman?</Text>
                  <Text style={styles.faqAnswer}>A: Ya! Data tersimpan aman di Firebase Cloud dengan enkripsi. Backup otomatis setiap hari.</Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>Q: Bagaimana cara tambah karyawan?</Text>
                  <Text style={styles.faqAnswer}>A: Buka menu Karyawan → Klik tombol + → Isi data karyawan → Simpan → Download QR Code untuk login</Text>
                </View>
              </View>

              <View style={styles.helpFooter}>
                <Text style={styles.helpFooterText}>Jam Operasional Support:</Text>
                <Text style={styles.helpFooterText}>Senin - Jumat: 09:00 - 17:00 WIB</Text>
                <Text style={styles.helpFooterText}>Sabtu: 09:00 - 13:00 WIB</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Backup Options Modal */}
      <Modal visible={showBackupModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>Pilih Data untuk Backup</Text>
              <TouchableOpacity onPress={() => setShowBackupModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalCardContent}>
              <Text style={styles.modalCardSubtitle}>
                Pilih jenis data yang ingin di-backup:
              </Text>

              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() => setBackupOptions({ ...backupOptions, products: !backupOptions.products })}
              >
                <Ionicons
                  name={backupOptions.products ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={backupOptions.products ? '#10B981' : '#666'}
                />
                <Text style={styles.checkboxLabel}>Produk</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() => setBackupOptions({ ...backupOptions, employees: !backupOptions.employees })}
              >
                <Ionicons
                  name={backupOptions.employees ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={backupOptions.employees ? '#10B981' : '#666'}
                />
                <Text style={styles.checkboxLabel}>Karyawan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() => setBackupOptions({ ...backupOptions, transactions: !backupOptions.transactions })}
              >
                <Ionicons
                  name={backupOptions.transactions ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={backupOptions.transactions ? '#10B981' : '#666'}
                />
                <Text style={styles.checkboxLabel}>Transaksi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBackupButton, backupLoading && styles.buttonDisabled]}
                onPress={handleConfirmBackup}
                disabled={backupLoading}
              >
                {backupLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-download" size={20} color="#fff" />
                    <Text style={styles.confirmBackupButtonText}>Backup Sekarang</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Store Settings Modal */}
      <Modal visible={showStoreSettings} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalFullScreen, { backgroundColor: colors.background }]} edges={['top']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidFull}
          >
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.primary }]}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowStoreSettings(false);
                }}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Informasi Toko</Text>
              <View style={styles.backButton} />
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalContent}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Nama Toko"
                  placeholderTextColor={colors.textSecondary}
                  value={storeForm.storeName}
                  onChangeText={(text) => setStoreForm({ ...storeForm, storeName: text })}
                  returnKeyType="next"
                />

                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Alamat Toko"
                  placeholderTextColor={colors.textSecondary}
                  value={storeForm.storeAddress}
                  onChangeText={(text) => setStoreForm({ ...storeForm, storeAddress: text })}
                  returnKeyType="next"
                />

                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Nomor Telepon"
                  placeholderTextColor={colors.textSecondary}
                  value={storeForm.storePhone}
                  onChangeText={(text) => setStoreForm({ ...storeForm, storePhone: text })}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />

                <Text style={[styles.sectionLabel, { color: colors.primary }]}>Template Struk</Text>
                
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Pesan Ucapan (contoh: Terima Kasih Atas Kunjungan Anda)"
                  placeholderTextColor={colors.textSecondary}
                  value={storeForm.receiptFooter}
                  onChangeText={(text) => setStoreForm({ ...storeForm, receiptFooter: text })}
                  returnKeyType="next"
                />

                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Catatan Struk (contoh: Barang yang sudah dibeli tidak dapat ditukar)"
                  placeholderTextColor={colors.textSecondary}
                  value={storeForm.receiptNote}
                  onChangeText={(text) => setStoreForm({ ...storeForm, receiptNote: text })}
                  multiline
                  numberOfLines={3}
                  returnKeyType="next"
                />

                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Website (contoh: www.tokosaya.com)"
                  placeholderTextColor={colors.textSecondary}
                  value={storeForm.receiptWebsite}
                  onChangeText={(text) => setStoreForm({ ...storeForm, receiptWebsite: text })}
                  keyboardType="url"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowStoreSettings(false);
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleSaveStoreSettings();
                    }}
                  >
                    <Text style={styles.saveButtonText}>Simpan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#1a1a1a',
    marginTop: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 15,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC143C20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DC143C',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
  },
  planCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    padding: 16,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F620',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  planTrial: {
    fontSize: 12,
    color: '#F59E0B',
  },
  planActive: {
    fontSize: 12,
    color: '#10B981',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f44336',
    gap: 12,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336',
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingContent: {
    flex: 1,
    marginLeft: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  settingTitleDisabled: {
    color: '#666',
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comingSoonBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  settingSubtitleDisabled: {
    color: '#666',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  modalFullScreen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  keyboardAvoidFull: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#DC143C',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  modalScrollContent: {
    padding: 20,
  },
  modalContent: {
    flex: 1,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC143C',
    marginBottom: 12,
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#DC143C',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  aboutContainer: {
    padding: 20,
  },
  aboutLogo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  aboutTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  aboutVersion: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  aboutSection: {
    marginBottom: 30,
  },
  aboutSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 8,
  },
  aboutFooter: {
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  aboutFooterText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  helpContainer: {
    padding: 20,
  },
  helpSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  helpTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  helpSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  helpCardContent: {
    flex: 1,
    marginLeft: 16,
  },
  helpCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  helpCardSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  helpCardValue: {
    fontSize: 14,
    color: '#DC143C',
    fontWeight: '600',
  },
  helpSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 16,
    marginTop: 20,
  },
  faqItem: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 20,
  },
  helpFooter: {
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  helpFooterText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  modalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCardContent: {
    padding: 20,
  },
  modalCardSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '500',
  },
  confirmBackupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  confirmBackupButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  // Referral Code Styles
  referralCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  referralIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  referralInfo: {
    flex: 1,
  },
  referralTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  referralCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
    letterSpacing: 2,
  },
  referralSales: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  referralNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  referralInputCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
  },
  referralInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  referralInputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  referralInputDesc: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    lineHeight: 20,
  },
  referralInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  referralInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  referralApplyButton: {
    backgroundColor: '#DC143C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 110,
  },
  referralApplyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  referralBenefitCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  referralBenefitText: {
    flex: 1,
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  referralLoadingCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  referralLoadingText: {
    fontSize: 14,
    color: '#999',
  },
  checkUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC143C',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  checkUpdateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  updateNotificationCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateNotificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  updateNotificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  updateNotificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  updateNotificationVersions: {
    marginBottom: 12,
  },
  updateNotificationVersion: {
    fontSize: 13,
    marginBottom: 4,
  },
});
