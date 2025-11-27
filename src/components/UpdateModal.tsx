import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { AppVersion, downloadAndInstallUpdate, getDownloadUrl } from '../services/updateService';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  versionInfo: AppVersion;
  currentVersion: string;
}

export default function UpdateModal({ visible, onClose, versionInfo, currentVersion }: UpdateModalProps) {
  const { colors } = useTheme();
  const [downloading, setDownloading] = useState(false);

  const handleUpdate = async () => {
    try {
      setDownloading(true);
      
      const downloadUrl = getDownloadUrl(versionInfo);
      
      if (!downloadUrl) {
        // Check if running in browser
        if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
          window.alert('Update tersedia! Silakan refresh halaman untuk mendapatkan versi terbaru.');
          window.location.reload();
        } else {
          alert('Download URL tidak tersedia untuk platform ini.');
        }
        return;
      }
      
      await downloadAndInstallUpdate(downloadUrl);
      
      // For web, page will reload automatically
      // For desktop, Electron will handle the update
      
    } catch (error: any) {
      console.error('Error updating:', error);
      if (typeof window !== 'undefined') {
        window.alert('Gagal mengunduh update: ' + error.message);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleSkip = () => {
    if (versionInfo.mandatory) {
      if (typeof window !== 'undefined') {
        window.alert('Update ini wajib diinstall untuk melanjutkan menggunakan aplikasi.');
      }
      return;
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="rocket" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Update Tersedia!
            </Text>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>
              Versi {versionInfo.version} sudah tersedia
            </Text>
            {versionInfo.mandatory && (
              <View style={styles.mandatoryBadge}>
                <Text style={styles.mandatoryText}>Wajib Update</Text>
              </View>
            )}
          </View>

          {/* Current vs New Version */}
          <View style={[styles.versionCompare, { backgroundColor: colors.background }]}>
            <View style={styles.versionItem}>
              <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>
                Versi Saat Ini
              </Text>
              <Text style={[styles.versionNumber, { color: colors.text }]}>
                {currentVersion}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color={colors.primary} />
            <View style={styles.versionItem}>
              <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>
                Versi Terbaru
              </Text>
              <Text style={[styles.versionNumber, { color: colors.primary }]}>
                {versionInfo.version}
              </Text>
            </View>
          </View>

          {/* Changelog */}
          <View style={styles.changelogContainer}>
            <Text style={[styles.changelogTitle, { color: colors.text }]}>
              ✨ Yang Baru:
            </Text>
            <ScrollView style={styles.changelogScroll} showsVerticalScrollIndicator={false}>
              {versionInfo.changelog.map((change, index) => (
                <View key={index} style={styles.changelogItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={[styles.changelogText, { color: colors.textSecondary }]}>
                    {change}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Release Date */}
          <Text style={[styles.releaseDate, { color: colors.textSecondary }]}>
            Dirilis: {new Date(versionInfo.releaseDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {!versionInfo.mandatory && (
              <TouchableOpacity
                style={[styles.button, styles.skipButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={handleSkip}
                disabled={downloading}
              >
                <Text style={[styles.skipButtonText, { color: colors.text }]}>
                  Nanti Saja
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                styles.updateButton,
                { backgroundColor: colors.primary },
                versionInfo.mandatory && styles.updateButtonFull,
                downloading && styles.buttonDisabled,
              ]}
              onPress={handleUpdate}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.updateButtonText}>Mengunduh...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="download" size={20} color="#fff" />
                  <Text style={styles.updateButtonText}>
                    {versionInfo.mandatory ? 'Update Sekarang' : 'Update'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 16,
    marginBottom: 12,
  },
  mandatoryBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mandatoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  versionCompare: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  versionItem: {
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  versionNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  changelogContainer: {
    marginBottom: 16,
  },
  changelogTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  changelogScroll: {
    maxHeight: 150,
  },
  changelogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  changelogText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  releaseDate: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  skipButton: {
    borderWidth: 1,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    flex: 1,
  },
  updateButtonFull: {
    flex: 1,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
