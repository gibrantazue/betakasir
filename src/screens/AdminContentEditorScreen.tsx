import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import {
  AppContent,
  getAppContent,
  updateAppContent,
  resetContentToDefault,
  subscribeToContent,
  DEFAULT_CONTENT,
} from '../services/contentService';

export default function AdminContentEditorScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [content, setContent] = useState<AppContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['appVersion', 'about', 'help', 'userGuide']));

  useEffect(() => {
    loadContent();
    
    // Subscribe to realtime updates
    const unsubscribe = subscribeToContent((updatedContent) => {
      console.log('🔄 Realtime update received:', updatedContent);
      setContent(updatedContent);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    console.log('📊 Content state changed:', content);
  }, [content]);

  const loadContent = async () => {
    try {
      setLoading(true);
      console.log('📥 Loading content from Firestore...');
      const data = await getAppContent();
      console.log('✅ Content loaded:', data);
      console.log('📝 settingsContent:', data?.settingsContent);
      setContent(data);
    } catch (error) {
      console.error('❌ Error loading content:', error);
      Alert.alert('Error', 'Gagal memuat konten');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateAppContent(content);
      
      if (Platform.OS === 'web') {
        window.alert('✅ Konten berhasil disimpan!\n\nPerubahan akan langsung terlihat di halaman Settings.');
      } else {
        Alert.alert('Berhasil', 'Konten berhasil disimpan!');
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('❌ Error!\n\n' + (error.message || 'Gagal menyimpan konten'));
      } else {
        Alert.alert('Error', error.message || 'Gagal menyimpan konten');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('⚠️ Reset ke Default?\n\nSemua perubahan akan hilang dan kembali ke teks default.')
      : await new Promise((resolve) => {
          Alert.alert(
            'Reset ke Default',
            'Semua perubahan akan hilang dan kembali ke teks default.',
            [
              { text: 'Batal', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Reset', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    try {
      setSaving(true);
      await resetContentToDefault();
      await loadContent();
      
      if (Platform.OS === 'web') {
        window.alert('✅ Konten berhasil direset ke default!');
      } else {
        Alert.alert('Berhasil', 'Konten berhasil direset ke default!');
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('❌ Error!\n\n' + (error.message || 'Gagal reset konten'));
      } else {
        Alert.alert('Error', error.message || 'Gagal reset konten');
      }
    } finally {
      setSaving(false);
    }
  };



  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const updateField = (field: keyof AppContent['settingsContent'], value: string) => {
    setContent((prev) => ({
      ...prev,
      settingsContent: {
        ...prev.settingsContent,
        [field]: value,
      },
    }));
  };

  const renderField = (
    field: keyof AppContent['settingsContent'],
    label: string,
    multiline: boolean = false
  ) => {
    const value = content?.settingsContent?.[field] || '';
    
    // Debug log
    if (field === 'appVersion') {
      console.log('🔍 Rendering appVersion field:', {
        content: content,
        settingsContent: content?.settingsContent,
        value: value
      });
    }
    
    return (
      <View key={field} style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <TextInput
          style={[
            styles.fieldInput,
            multiline && styles.fieldInputMultiline,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={value}
          onChangeText={(text) => updateField(field, text)}
          placeholder={`Masukkan ${label}`}
          placeholderTextColor={colors.textSecondary}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
        />
      </View>
    );
  };

  const renderSection = (
    sectionKey: string,
    sectionTitle: string,
    icon: string,
    fields: Array<{ key: keyof AppContent['settingsContent']; label: string; multiline?: boolean }>
  ) => {
    const isExpanded = expandedSections.has(sectionKey);

    return (
      <View key={sectionKey} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(sectionKey)}
        >
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name={icon as any} size={20} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{sectionTitle}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{fields.length}</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {fields.map(({ key, label, multiline }) => renderField(key, label, multiline))}
          </View>
        )}
      </View>
    );
  };



  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#DC143C" />
        <Text style={[styles.loadingText, { color: colors.text }]}>Memuat konten...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Editor Konten</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Edit konten halaman Settings
          </Text>
        </View>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Ionicons name="refresh" size={20} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: '#10B981' }]}>
        <Ionicons name="information-circle-outline" size={20} color="#fff" />
        <Text style={styles.infoBannerText}>
          Edit konten yang ditampilkan di halaman Settings: Tentang BetaKasir, Bantuan & Dukungan, Panduan Penggunaan, dan Versi Aplikasi
        </Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* App Version Section */}
        {renderSection('appVersion', 'Versi Aplikasi', 'code-working-outline', [
          { key: 'appVersion', label: 'Versi Aplikasi' },
        ])}

        {/* About BetaKasir Section */}
        {renderSection('about', 'Tentang BetaKasir', 'information-circle-outline', [
          { key: 'aboutTitle', label: 'Judul Aplikasi' },
          { key: 'aboutDescription', label: 'Deskripsi Aplikasi', multiline: true },
          { key: 'aboutFeatures', label: 'Fitur Utama', multiline: true },
          { key: 'aboutSecurity', label: 'Keamanan', multiline: true },
          { key: 'aboutContactWebsite', label: 'Website' },
          { key: 'aboutContactEmail', label: 'Email' },
          { key: 'aboutContactWhatsApp', label: 'WhatsApp' },
        ])}

        {/* Help & Support Section */}
        {renderSection('help', 'Bantuan & Dukungan', 'help-circle-outline', [
          { key: 'helpTitle', label: 'Judul Bantuan' },
          { key: 'helpSubtitle', label: 'Subjudul Bantuan' },
          { key: 'helpWhatsAppTitle', label: 'Judul WhatsApp' },
          { key: 'helpWhatsAppSubtitle', label: 'Subjudul WhatsApp' },
          { key: 'helpWhatsAppNumber', label: 'Nomor WhatsApp' },
          { key: 'helpEmailTitle', label: 'Judul Email' },
          { key: 'helpEmailSubtitle', label: 'Subjudul Email' },
          { key: 'helpEmailAddress', label: 'Alamat Email' },
          { key: 'helpDocsTitle', label: 'Judul Dokumentasi' },
          { key: 'helpDocsSubtitle', label: 'Subjudul Dokumentasi' },
          { key: 'helpDocsUrl', label: 'URL Dokumentasi' },
          { key: 'helpVideoTitle', label: 'Judul Video Tutorial' },
          { key: 'helpVideoSubtitle', label: 'Subjudul Video Tutorial' },
          { key: 'helpVideoChannel', label: 'Channel YouTube' },
        ])}

        {/* User Guide Section */}
        {renderSection('userGuide', 'Panduan Penggunaan', 'book-outline', [
          { key: 'userGuideTitle', label: 'Judul Panduan' },
          { key: 'userGuideSubtitle', label: 'Subjudul Panduan' },
        ])}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.saveButtonText}>Menyimpan...</Text>
            </>
          ) : (
            <>
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  resetButton: {
    padding: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  fieldContainer: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 44,
  },
  fieldInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC143C',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

});
