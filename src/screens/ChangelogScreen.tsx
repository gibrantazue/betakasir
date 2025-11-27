import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { subscribeToChangelogs } from '../services/changelogService';
import { ChangelogEntry, CHANGELOG_CATEGORIES } from '../types/changelog';
import { useTheme } from '../hooks/useTheme';

// Hardcoded changelogs
const HARDCODED_CHANGELOGS: ChangelogEntry[] = [
  {
    id: 'v1.2.2',
    version: '1.2.2',
    date: '2025-11-24',
    title: 'JSON Upload Feature & UI Improvements',
    description: 'Update v1.2.2 membawa fitur upload changelog dari JSON dan berbagai perbaikan UI di Admin Dashboard.',
    type: 'minor',
    changes: [
      { category: 'feature', text: 'Upload changelog dari file JSON - bulk upload multiple changelogs sekaligus' },
      { category: 'feature', text: 'JSON parser dengan validasi otomatis untuk format changelog' },
      { category: 'feature', text: 'Contoh file JSON template untuk memudahkan admin' },
      { category: 'improvement', text: 'Hapus tombol Create Referral dari Admin Dashboard (sudah ada di Sales Management)' },
      { category: 'improvement', text: 'Hapus Changelog Management dari Content Editor (sudah ada di Admin Dashboard)' },
      { category: 'improvement', text: 'Tambah changelog v1.1.9, v1.2.0, v1.2.1 ke Admin Dashboard' },
      { category: 'improvement', text: 'Better organization untuk admin features' },
      { category: 'improvement', text: 'Simplified changelog upload workflow' },
      { category: 'bugfix', text: 'Fixed syntax error di AdminSalesManagementScreen (nested try-catch)' },
      { category: 'bugfix', text: 'Fixed changelog tidak muncul di Kelola Changelog screen' },
      { category: 'bugfix', text: 'Fixed duplicate features di admin interface' }
    ],
    createdAt: new Date('2025-11-24'),
    updatedAt: new Date('2025-11-24')
  },
  {
    id: 'v1.2.1',
    version: '1.2.1',
    date: '2025-01-23',
    title: 'Patch Update',
    description: 'Version synchronization update dengan fitur zoom control untuk desktop app.',
    type: 'patch',
    changes: [
      { category: 'feature', text: 'Zoom control untuk desktop (Ctrl +/-/0)' },
      { category: 'feature', text: 'Smooth zoom dengan increment 0.5 per press' },
      { category: 'improvement', text: 'Version synchronization across all files' },
      { category: 'improvement', text: 'Updated package.json version to 1.2.1' },
      { category: 'improvement', text: 'Updated app.json version to 1.2.1' },
      { category: 'improvement', text: 'Documentation updates' }
    ],
    createdAt: new Date('2025-01-23'),
    updatedAt: new Date('2025-01-23')
  },
  {
    id: 'v1.2.0',
    version: '1.2.0',
    date: '2025-01-22',
    title: 'Realtime Update & Pro Plan',
    description: 'Update v1.2.0 membawa sistem notifikasi update realtime dan rebranding Business Plan menjadi Pro Plan.',
    type: 'minor',
    changes: [
      { category: 'feature', text: 'Realtime Update Notification System' },
      { category: 'feature', text: 'Smart version comparison otomatis' },
      { category: 'feature', text: 'In-screen notification card tanpa popup' },
      { category: 'feature', text: 'Admin control panel untuk update notifications' },
      { category: 'feature', text: 'WhatsApp integration untuk upgrade' },
      { category: 'improvement', text: 'Business Plan → Pro Plan rebranding' },
      { category: 'improvement', text: 'Better update UX dengan always visible notification' },
      { category: 'bugfix', text: 'Fixed Alert.alert() tidak bekerja di web browser' },
      { category: 'bugfix', text: 'Fixed version comparison dengan semantic versioning' }
    ],
    createdAt: new Date('2025-01-22'),
    updatedAt: new Date('2025-01-22')
  },
  {
    id: 'v1.1.9',
    version: '1.1.9',
    date: '2025-01-22',
    title: 'AI Knows App Version',
    description: 'AI Assistant sekarang otomatis mengetahui versi aplikasi dan changelog terbaru! Plus perbaikan tombol Cek Update.',
    type: 'minor',
    changes: [
      { category: 'feature', text: 'AI Assistant sekarang tahu versi aplikasi saat ini' },
      { category: 'feature', text: 'AI dapat menjawab pertanyaan tentang changelog terbaru' },
      { category: 'feature', text: 'Auto-inject version info ke AI context' },
      { category: 'feature', text: 'Version display otomatis sync dari GitHub Releases' },
      { category: 'improvement', text: 'Fallback ke hardcoded version jika offline' },
      { category: 'improvement', text: 'Caching untuk performa optimal' },
      { category: 'bugfix', text: 'Fixed tombol "Cek Update" sekarang trigger electron auto-updater' },
      { category: 'bugfix', text: 'Improved version comparison accuracy' }
    ],
    createdAt: new Date('2025-01-22'),
    updatedAt: new Date('2025-01-22')
  }
];

export default function ChangelogScreen({ navigation }: any) {
  const { isDark, colors } = useTheme();
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>(HARDCODED_CHANGELOGS);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Handle browser back button untuk web
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'web') {
        const handlePopState = () => {
          // Gunakan window.history.back() untuk web
          if (typeof window !== 'undefined' && window.history.length > 1) {
            // Tidak perlu preventDefault, biarkan browser handle
            navigation.navigate('Settings');
          }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
          window.removeEventListener('popstate', handlePopState);
        };
      }
    }, [navigation])
  );

  useEffect(() => {
    // Fetch dari Firestore dengan realtime updates
    const unsubscribe = subscribeToChangelogs(
      (firestoreData) => {
        if (firestoreData.length > 0) {
          // Jika ada data dari Firestore, prioritaskan Firestore
          // Tambahkan hardcoded changelog yang tidak ada di Firestore sebagai fallback
          const firestoreVersions = firestoreData.map(c => c.version);
          const hardcodedFallback = HARDCODED_CHANGELOGS.filter(c => !firestoreVersions.includes(c.version));
          
          // Gabungkan: Firestore di atas (prioritas), hardcoded di bawah (fallback)
          const combined = [...firestoreData, ...hardcodedFallback];
          
          setChangelogs(combined);
          setLoading(false);
          console.log('📋 Changelog loaded from Firestore:', firestoreData.length, 'entries (realtime)');
          console.log('📋 Hardcoded fallback:', hardcodedFallback.length, 'entries');
        } else {
          // Jika Firestore kosong, gunakan hardcoded
          setChangelogs(HARDCODED_CHANGELOGS);
          setLoading(false);
          console.log('📋 Using hardcoded changelogs:', HARDCODED_CHANGELOGS.length, 'entries');
        }
      },
      (error) => {
        console.error('Error loading changelogs:', error);
        // Jika error, tetap tampilkan hardcoded
        setChangelogs(HARDCODED_CHANGELOGS);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getTypeColor = (type: string) => {
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'major':
        return 'MAJOR';
      case 'minor':
        return 'MINOR';
      case 'patch':
        return 'PATCH';
      default:
        return type.toUpperCase();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderBottomColor: '#DC143C' }]}>
          <TouchableOpacity 
            onPress={() => {
              if (Platform.OS === 'web') {
                navigation.navigate('Settings');
              } else {
                navigation.goBack();
              }
            }} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Changelog</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC143C" />
          <Text style={[styles.loadingText, { color: isDark ? '#999' : '#666' }]}>Memuat changelog...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderBottomColor: '#DC143C' }]}>
        <TouchableOpacity 
          onPress={() => {
            if (Platform.OS === 'web') {
              navigation.navigate('Settings');
            } else {
              navigation.goBack();
            }
          }} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Changelog</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF', borderColor: isDark ? '#3B82F6' : '#BFDBFE', borderWidth: 1 }]}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <View style={styles.infoBannerText}>
            <Text style={[styles.infoBannerTitle, { color: isDark ? '#fff' : '#1E40AF' }]}>Riwayat Pembaruan</Text>
            <Text style={[styles.infoBannerDesc, { color: isDark ? '#BFDBFE' : '#3B82F6' }]}>
              Lihat semua pembaruan dan perbaikan yang telah dilakukan pada aplikasi BetaKasir
            </Text>
          </View>
        </View>

        {/* Changelog List */}
        {changelogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={isDark ? '#333' : '#ccc'} />
            <Text style={[styles.emptyStateText, { color: isDark ? '#666' : '#999' }]}>Belum ada changelog</Text>
          </View>
        ) : (
          changelogs.map((changelog) => (
            <View key={changelog.id} style={[styles.changelogCard, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#333' : '#e0e0e0', borderWidth: 1 }]}>
              {/* Header */}
              <TouchableOpacity
                style={styles.changelogHeader}
                onPress={() => toggleExpand(changelog.id)}
                activeOpacity={0.7}
              >
                <View style={styles.changelogHeaderLeft}>
                  <View style={styles.versionRow}>
                    <Text style={styles.version}>v{changelog.version}</Text>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: getTypeColor(changelog.type) }
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>
                        {getTypeLabel(changelog.type)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>{changelog.title}</Text>
                  <Text style={[styles.date, { color: isDark ? '#999' : '#666' }]}>📅 {changelog.date}</Text>
                </View>
                <Ionicons
                  name={expandedId === changelog.id ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={isDark ? '#999' : '#666'}
                />
              </TouchableOpacity>

              {/* Expanded Content */}
              {expandedId === changelog.id && (
                <View style={[styles.changelogContent, { borderTopColor: isDark ? '#333' : '#e0e0e0' }]}>
                  {changelog.description && (
                    <Text style={[styles.description, { color: isDark ? '#ccc' : '#666' }]}>{changelog.description}</Text>
                  )}

                  {/* Changes */}
                  <View style={styles.changesSection}>
                    {changelog.changes.map((change, index) => {
                      const category = CHANGELOG_CATEGORIES[change.category];
                      return (
                        <View key={index} style={styles.changeItem}>
                          <View
                            style={[
                              styles.changeIcon,
                              { backgroundColor: category.color + (isDark ? '20' : '15') }
                            ]}
                          >
                            <Ionicons
                              name={category.icon as any}
                              size={16}
                              color={category.color}
                            />
                          </View>
                          <View style={styles.changeTextContainer}>
                            <Text style={[styles.changeCategory, { color: isDark ? '#999' : '#666' }]}>{category.label}</Text>
                            <Text style={[styles.changeText, { color: isDark ? '#fff' : '#000' }]}>{change.text}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          ))
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? '#666' : '#999' }]}>
            💡 Tip: Klik pada setiap versi untuk melihat detail perubahan
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1
  },
  backButton: {
    marginRight: 16
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  content: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12
  },
  infoBannerText: {
    flex: 1
  },
  infoBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  infoBannerDesc: {
    fontSize: 13,
    lineHeight: 18
  },
  changelogCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden'
  },
  changelogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16
  },
  changelogHeaderLeft: {
    flex: 1
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  version: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC143C'
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff'
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  date: {
    fontSize: 13
  },
  changelogContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16
  },
  changesSection: {
    gap: 12
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  changeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  changeTextContainer: {
    flex: 1
  },
  changeCategory: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase'
  },
  changeText: {
    fontSize: 14,
    lineHeight: 20
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16
  },
  footer: {
    padding: 16,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center'
  }
});
