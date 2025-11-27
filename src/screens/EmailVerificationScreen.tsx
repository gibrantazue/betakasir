import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';

export default function EmailVerificationScreen({ navigation, route }: any) {
  const { isDesktop } = useResponsive();
  const { email } = route.params || {};

  const handleGoToLogin = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="mail-open" size={80} color="#10B981" />
          <View style={styles.checkmarkBadge}>
            <Ionicons name="checkmark-circle" size={40} color="#10B981" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Akun Berhasil Dibuat!</Text>

        {/* Main Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            Email verifikasi telah dikirim ke:
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionItem}>
            <Ionicons name="mail" size={24} color="#DC143C" />
            <Text style={styles.instructionText}>
              Buka inbox email Anda
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Ionicons name="link" size={24} color="#DC143C" />
            <Text style={styles.instructionText}>
              Klik link verifikasi yang dikirimkan
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-done" size={24} color="#DC143C" />
            <Text style={styles.instructionText}>
              Aktifkan akun Anda
            </Text>
          </View>
        </View>

        {/* Warning Box */}
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={24} color="#F59E0B" />
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>Penting!</Text>
            <Text style={styles.warningText}>
              Anda harus memverifikasi email terlebih dahulu sebelum dapat login.
            </Text>
          </View>
        </View>

        {/* Spam Notice */}
        <View style={styles.spamNotice}>
          <Ionicons name="information-circle" size={20} color="#666" />
          <Text style={styles.spamText}>
            Tidak menerima email? Cek folder Spam atau Junk
          </Text>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleGoToLogin}
        >
          <Text style={styles.loginButtonText}>Ke Halaman Login</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  contentDesktop: {
    maxWidth: 600,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 48,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 24,
    textAlign: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  message: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 12,
  },
  email: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    backgroundColor: '#DC143C20',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC143C',
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    gap: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
  },
  warningBox: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#F59E0B20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
    gap: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  spamNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  spamText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
