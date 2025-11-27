import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { 
  UpdateNotification,
  updateNotificationSettings,
  getUpdateNotification,
  hasUpdateAvailable
} from '../services/updateNotificationService';
import { CURRENT_VERSION } from '../services/updateService';

export default function AdminUpdateNotificationScreen({ navigation }: any) {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<UpdateNotification | null>(null);
  
  const [formData, setFormData] = useState({
    latestVersion: '1.1.10',
    upToDateMessage: 'Aplikasi Anda sudah menggunakan versi terbaru! 🎉',
    updateAvailableMessage: 'Update baru tersedia! Dapatkan fitur terbaru sekarang.',
    whatsappNumber: '6281340078956'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getUpdateNotification();
      if (data) {
        setNotification(data);
        setFormData({
          latestVersion: data.latestVersion,
          upToDateMessage: data.upToDateMessage,
          updateAvailableMessage: data.updateAvailableMessage,
          whatsappNumber: data.whatsappNumber
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const success = await updateNotificationSettings(formData);
      
      if (success) {
        Alert.alert(
          'Berhasil! ✅',
          'Pengaturan update notification berhasil disimpan. Semua user akan melihat perubahan secara realtime.',
          [{ text: 'OK' }]
        );
        loadData(); // Refresh data
      } else {
        Alert.alert('Error', 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const currentVersion = CURRENT_VERSION;
    const latestVersion = formData.latestVersion;
    const updateAvailable = hasUpdateAvailable(currentVersion, latestVersion);
    
    const message = updateAvailable 
      ? `${formData.updateAvailableMessage}\n\nVersi Saat Ini: ${currentVersion}\nVersi Terbaru: ${latestVersion}`
      : `${formData.upToDateMessage}\n\nVersi Saat Ini: ${currentVersion}`;
    
    const title = updateAvailable 
      ? 'Update Tersedia! 🎉' 
      : 'Sudah Terbaru! ✅';
    
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: isDarkMode ? '#fff' : '#000' }]}>
            Memuat data...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }]}>
      <View style={[styles.header, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Update Notification
        </Text>
        <TouchableOpacity 
          style={styles.previewButton}
          onPress={handlePreview}
        >
          <Ionicons name="eye" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Cara Kerja
            </Text>
            <Text style={[styles.infoText, { color: isDarkMode ? '#ccc' : '#666' }]}>
              Sistem akan membandingkan versi user dengan "Versi Terbaru" yang Anda set. 
              Jika versi user lebih lama, akan muncul pesan "Ada Update". 
              Jika sama, akan muncul pesan "Sudah Terbaru".
            </Text>
          </View>
        </View>

        {/* Current App Version */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            Versi Aplikasi Saat Ini
          </Text>
          <View style={[styles.versionBadge, { backgroundColor: isDarkMode ? '#3a3a3a' : '#f8f8f8' }]}>
            <Ionicons name="code-working" size={20} color="#007AFF" />
            <Text style={[styles.versionText, { color: isDarkMode ? '#fff' : '#000' }]}>
              v{CURRENT_VERSION}
            </Text>
          </View>
          <Text style={[styles.helperText, { color: isDarkMode ? '#888' : '#999' }]}>
            Ini adalah versi aplikasi yang sedang berjalan
          </Text>
        </View>

        {/* Latest Version Setting */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            Versi Terbaru yang Tersedia
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
              Versi Terbaru
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDarkMode ? '#3a3a3a' : '#f8f8f8',
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? '#4a4a4a' : '#ddd'
              }]}
              value={formData.latestVersion}
              onChangeText={(text) => setFormData({ ...formData, latestVersion: text })}
              placeholder="1.2.0"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
            />
            <Text style={[styles.helperText, { color: isDarkMode ? '#888' : '#999' }]}>
              Contoh: 1.2.0, 1.1.11, 2.0.0
            </Text>
          </View>
        </View>

        {/* Messages */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            Pesan Notifikasi
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
              Pesan "Sudah Terbaru" ✅
            </Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: isDarkMode ? '#3a3a3a' : '#f8f8f8',
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? '#4a4a4a' : '#ddd'
              }]}
              value={formData.upToDateMessage}
              onChangeText={(text) => setFormData({ ...formData, upToDateMessage: text })}
              placeholder="Aplikasi Anda sudah menggunakan versi terbaru! 🎉"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              multiline
              numberOfLines={3}
            />
            <Text style={[styles.helperText, { color: isDarkMode ? '#888' : '#999' }]}>
              Pesan ini muncul jika user sudah pakai versi terbaru
            </Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
              Pesan "Ada Update" 🎉
            </Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: isDarkMode ? '#3a3a3a' : '#f8f8f8',
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? '#4a4a4a' : '#ddd'
              }]}
              value={formData.updateAvailableMessage}
              onChangeText={(text) => setFormData({ ...formData, updateAvailableMessage: text })}
              placeholder="Update baru tersedia! Dapatkan fitur terbaru sekarang."
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              multiline
              numberOfLines={3}
            />
            <Text style={[styles.helperText, { color: isDarkMode ? '#888' : '#999' }]}>
              Pesan ini muncul jika ada versi lebih baru
            </Text>
          </View>
        </View>

        {/* WhatsApp */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            WhatsApp Support
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
              Nomor WhatsApp
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDarkMode ? '#3a3a3a' : '#f8f8f8',
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? '#4a4a4a' : '#ddd'
              }]}
              value={formData.whatsappNumber}
              onChangeText={(text) => setFormData({ ...formData, whatsappNumber: text })}
              placeholder="6281340078956"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              keyboardType="phone-pad"
            />
            <Text style={[styles.helperText, { color: isDarkMode ? '#888' : '#999' }]}>
              Nomor WhatsApp untuk upgrade (format: 628xxx)
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#fff" style={styles.saveIcon} />
              <Text style={styles.saveButtonText}>Simpan Pengaturan</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
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
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  previewButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
});
