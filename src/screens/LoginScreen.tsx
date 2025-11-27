import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { EmployeeSession } from '../types/employee';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../hooks/useTheme';

export default function LoginScreen({ navigation }: any) {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const { isDesktop } = useResponsive();
  const { colors } = useTheme();
  const [identifier, setIdentifier] = useState(''); // Email atau Username
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Forgot Password Modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      setErrorMessage('Mohon isi email/username dan password');
      return;
    }

    setLoading(true);
    setErrorMessage(''); // Clear previous error

    // Deteksi apakah input adalah email atau username
    const isEmail = identifier.includes('@');

    if (isEmail) {
      // Login sebagai Owner dengan Firebase
      try {
        await signIn(identifier, password);
      } catch (error: any) {
        console.error('🔴 Firebase login error:', error);
        console.error('🔴 Error code:', error.code);
        console.error('🔴 Error message:', error.message);
        
        // Parse Firebase error codes
        let errorMsg = 'Email atau password salah. Periksa kembali data Anda.';
        
        const errorCode = error.code || '';
        
        // Check for specific error codes
        if (errorCode.includes('user-not-found')) {
          errorMsg = 'Email belum terdaftar. Silakan daftar terlebih dahulu.';
        } else if (errorCode.includes('wrong-password')) {
          errorMsg = 'Password salah. Silakan coba lagi.';
        } else if (errorCode.includes('invalid-email')) {
          errorMsg = 'Format email tidak valid.';
        } else if (errorCode.includes('invalid-credential')) {
          errorMsg = 'Email atau password salah. Periksa kembali data Anda.';
        } else if (errorCode.includes('too-many-requests')) {
          errorMsg = 'Terlalu banyak percobaan login. Coba lagi nanti.';
        } else if (errorCode.includes('network')) {
          errorMsg = 'Tidak ada koneksi internet. Periksa koneksi Anda.';
        }
        
        setErrorMessage(errorMsg);
      } finally {
        setLoading(false);
      }
    } else {
      // Login sebagai Karyawan
      try {
        console.log('🔍 Attempting employee login with username:', identifier);

        // Import dependencies
        const { verifyPassword } = await import('../utils/employeeHelpers');
        const { useStore } = await import('../store/useStore');
        const { findEmployeeByUsername } = await import('../services/employeeService');

        // Search for employee in Firestore
        console.log('☁️ Searching employee in Firestore...');
        const result = await findEmployeeByUsername(identifier);

        let foundEmployee = null;
        let sellerUID = null;

        if (result) {
          const { employee, sellerUID: foundSellerUID } = result;
          console.log('✅ Found employee in Firestore:', employee.name);

          // Verify password
          const isValid = await verifyPassword(password, employee.password);
          if (isValid) {
            foundEmployee = employee;
            sellerUID = foundSellerUID;
          } else {
            console.log('❌ Invalid password');
          }
        }

        if (!foundEmployee) {
          if (!result) {
            setErrorMessage('Username tidak ditemukan. Periksa kembali username Anda.');
          } else {
            setErrorMessage('Password salah. Silakan coba lagi.');
          }
          setLoading(false);
          return;
        }

        // Set employee session with sellerUID
        if (!sellerUID) {
          Alert.alert('Error', 'Seller UID not found');
          setLoading(false);
          return;
        }

        const session: EmployeeSession = {
          employeeId: foundEmployee.id,
          employee: foundEmployee,
          sellerUID: sellerUID, // Save seller UID for data access
          loginTime: new Date().toISOString(),
          loginMethod: 'manual' as const,
        };

        useStore.getState().setEmployeeSession(session);

        // Load seller's data from Firestore
        if (sellerUID) {
          console.log('📥 Loading seller data from Firestore...');

          // Load all seller data (products, employees, etc.)
          await useStore.getState().loadData();

          console.log('✅ Loaded seller data');
        }

        Alert.alert(
          'Login Berhasil',
          `Selamat datang, ${foundEmployee.name}!\n\nRole: ${foundEmployee.role}`,
          [{ text: 'OK' }]
        );

        // Navigation will happen automatically when employeeSession is set
      } catch (error: any) {
        console.error('Employee login error:', error);
        setErrorMessage('Terjadi kesalahan saat login. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Google Sign In', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Mohon masukkan email Anda');
      return;
    }

    if (!resetEmail.includes('@')) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setShowForgotPassword(false);
      setResetEmail('');
      Alert.alert(
        'Email Terkirim!',
        `Link reset password telah dikirim ke ${resetEmail}. Silakan cek inbox atau folder spam Anda.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Gagal', error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.formContainer, isDesktop && styles.formContainerDesktop, { backgroundColor: colors.card }]}>
          {/* Theme Toggle */}
          <View style={styles.themeToggleContainer}>
            <ThemeToggle />
          </View>
          
          {/* Logo/Brand */}
          <View style={styles.brandContainer}>
            <View style={styles.logoCircle}>
              <Image 
                source={require('../../public/logo.png')} 
                style={{ width: 60, height: 60 }}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>BetaKasir</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>Aplikasi POS Modern</Text>
          </View>
          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>Selamat Datang!</Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Masuk untuk melanjutkan ke dashboard
            </Text>
          </View>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ff4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Email/Username Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Email atau Username</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }, errorMessage && styles.inputWrapperError]}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="nama@email.com atau username"
                placeholderTextColor={colors.textSecondary}
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  setErrorMessage(''); // Clear error when typing
                }}
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }, errorMessage && styles.inputWrapperError]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Masukkan password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage(''); // Clear error when typing
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => setShowForgotPassword(true)}
          >
            <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Masuk</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Google Sign In - Only show on web */}
          {Platform.OS === 'web' && (
            <>
              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>atau</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Google Sign In Button */}
              <TouchableOpacity
                style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <Ionicons name="logo-google" size={20} color="#DC143C" />
                <Text style={[styles.googleButtonText, { color: colors.text }]}>Masuk dengan Google</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Daftar Sekarang</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDesktop && styles.modalContentDesktop]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lupa Password?</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text style={styles.modalDescription}>
              Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
            </Text>

            {/* Email Input */}
            <View style={styles.modalInputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="nama@email.com"
                  placeholderTextColor="#666"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={[styles.resetButton, resetLoading && styles.resetButtonDisabled]}
              onPress={handleForgotPassword}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="mail" size={20} color="#fff" />
                  <Text style={styles.resetButtonText}>Kirim Link Reset</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowForgotPassword(false);
                setResetEmail('');
              }}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  scrollContentDesktop: {
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
  },
  formContainerDesktop: {
    maxWidth: 450,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 40,
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  themeToggleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DC143C20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DC143C',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  welcomeContainer: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  inputContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
  },
  inputWrapperError: {
    borderColor: '#ff4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff444420',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#ff4444',
    fontWeight: '500',
  },
  inputIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#fff',
  },
  eyeIcon: {
    padding: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#DC143C',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#DC143C',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#666',
  },
  googleButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: '#333',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 13,
    color: '#999',
  },
  registerLink: {
    fontSize: 13,
    color: '#DC143C',
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  modalContentDesktop: {
    maxWidth: 450,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInputContainer: {
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#DC143C',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
});
