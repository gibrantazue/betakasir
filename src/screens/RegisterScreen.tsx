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
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../hooks/useTheme';

export default function RegisterScreen({ navigation }: any) {
  const { signUp } = useAuth();
  const { isDesktop } = useResponsive();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Mohon isi semua field');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password tidak cocok');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    
    try {
      const result = await signUp(email, password, name);
      
      // Save referral code if provided
      if (referralCode.trim() && result?.uid) {
        try {
          const { doc, setDoc, getDoc, updateDoc, increment } = await import('firebase/firestore');
          const { db } = await import('../config/firebase');
          
          // Check if referral code exists
          const refCodeDoc = await getDoc(doc(db, 'referralCodes', referralCode.trim().toUpperCase()));
          
          if (refCodeDoc.exists()) {
            // Save referral code to user document
            await setDoc(doc(db, 'users', result.uid), {
              referralCode: referralCode.trim().toUpperCase(),
              referredAt: new Date().toISOString(),
            }, { merge: true });
            
            // Increment usage count
            await updateDoc(doc(db, 'referralCodes', referralCode.trim().toUpperCase()), {
              usedCount: increment(1),
            });
            
            console.log('✅ Referral code applied:', referralCode.trim().toUpperCase());
          } else {
            console.log('⚠️ Referral code not found:', referralCode.trim().toUpperCase());
          }
        } catch (refError) {
          console.error('Error applying referral:', refError);
          // Don't fail registration if referral fails
        }
      }
      
      setLoading(false);
      
      // Small delay to ensure auth state is settled
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Navigate to email verification screen
      navigation.replace('EmailVerification', { email: result?.email || email });
      
    } catch (error: any) {
      setLoading(false);
      
      if (Platform.OS === 'web') {
        window.alert('❌ Registrasi Gagal\n\n' + error.message);
      } else {
        Alert.alert('Registrasi Gagal', error.message);
      }
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
          {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* Theme Toggle */}
              <View style={styles.themeToggleContainer}>
                <ThemeToggle />
              </View>

              {/* Logo/Brand */}
              <View style={styles.brandContainer}>
                <View style={styles.logoCircle}>
                  <Ionicons name="person-add" size={48} color="#DC143C" />
                </View>
                <Text style={[styles.brandTitle, { color: colors.text }]}>Daftar Akun</Text>
                <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>Buat akun BetaKasir baru</Text>
              </View>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Nama Lengkap</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Nama Anda"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="nama@email.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Minimal 6 karakter"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
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
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Konfirmasi Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ulangi password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Referral Code Input (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Kode Referral <Text style={[styles.optionalText, { color: colors.textSecondary }]}>(Opsional)</Text>
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="gift-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Masukkan kode referral"
                placeholderTextColor={colors.textSecondary}
                value={referralCode}
                onChangeText={(text) => setReferralCode(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Punya kode referral? Masukkan di sini
            </Text>
          </View>

          {/* Terms */}
          <Text style={[styles.termsText, { color: colors.textSecondary }]}>
            Dengan mendaftar, Anda menyetujui{' '}
            <Text style={styles.termsLink}>Syarat & Ketentuan</Text> dan{' '}
            <Text style={styles.termsLink}>Kebijakan Privasi</Text> kami
          </Text>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.registerButtonText}>Daftar</Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Masuk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  themeToggleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DC143C20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#DC143C',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  eyeIcon: {
    padding: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  termsLink: {
    color: '#DC143C',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#999',
  },
  loginLink: {
    fontSize: 14,
    color: '#DC143C',
    fontWeight: 'bold',
  },
  optionalText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#666',
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
  },
});
