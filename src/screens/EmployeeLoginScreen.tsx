import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { verifyPassword } from '../utils/employeeHelpers';
import { Employee } from '../types/employee';

interface EmployeeLoginScreenProps {
  navigation: any;
  onLoginSuccess?: (employee: Employee) => void;
}

export default function EmployeeLoginScreen({ navigation, onLoginSuccess }: EmployeeLoginScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { employees, setEmployeeSession } = useStore();
  const [loginMethod, setLoginMethod] = useState<'manual' | 'scan'>('manual');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanDetected, setScanDetected] = useState(false);
  
  // Barcode scanner buffer
  const scanBuffer = useRef('');
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);

  // Listen for barcode scanner input (hardware scanner)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyPress = (e: KeyboardEvent) => {
        // Barcode scanner sends characters very fast and ends with Enter
        if (e.key === 'Enter') {
          if (scanBuffer.current.length > 10) {
            // This is likely a barcode scan (long string + Enter)
            handleBarcodeScanned(scanBuffer.current);
          }
          scanBuffer.current = '';
        } else if (e.key.length === 1) {
          // Add character to buffer
          scanBuffer.current += e.key;
          
          // Clear buffer after 100ms of inactivity (human typing is slower)
          if (scanTimeout.current) {
            clearTimeout(scanTimeout.current);
          }
          scanTimeout.current = setTimeout(() => {
            scanBuffer.current = '';
          }, 100);
        }
      };

      window.addEventListener('keypress', handleKeyPress);
      return () => {
        window.removeEventListener('keypress', handleKeyPress);
        if (scanTimeout.current) {
          clearTimeout(scanTimeout.current);
        }
      };
    }
  }, [employees]);

  // Handle barcode scan
  const handleBarcodeScanned = async (scannedData: string) => {
    // Show scan detected feedback
    setScanDetected(true);
    setTimeout(() => setScanDetected(false), 2000);
    
    try {
      console.log('🔍 Barcode scanned:', scannedData);
      
      // Try to parse as JSON (QR code data)
      const qrData = JSON.parse(scannedData);
      
      if (qrData.type === 'employee_login' && qrData.username) {
        console.log('✅ Valid QR code detected for:', qrData.username);
        console.log('📊 Total employees in store:', employees.length);
        console.log('📋 Employees list:', employees.map(e => `${e.name} (${e.username})`));
        
        // Find employee
        const employee = employees.find(e => e.username.toLowerCase() === qrData.username.toLowerCase());
        
        if (employee && employee.isActive) {
          console.log('✅ Employee found and active:', employee.name);
          console.log('📋 Employee data:', employee);
          
          // Get seller UID (employee.createdBy contains seller UID)
          const sellerUID = employee.createdBy;
          
          if (!sellerUID || sellerUID === 'system') {
            console.error('❌ No valid seller UID found. createdBy:', sellerUID);
            Alert.alert('Error', 'Data karyawan tidak valid. Silakan hubungi admin untuk membuat ulang akun karyawan.');
            return;
          }
          
          console.log('✅ Seller UID:', sellerUID);
          
          // Auto-login (QR code is trusted credential)
          const session = {
            employeeId: employee.id,
            employee,
            sellerUID, // ✅ Tambahkan sellerUID
            loginTime: new Date().toISOString(),
            loginMethod: 'scan' as const,
          };

          setEmployeeSession(session);
          
          Alert.alert(
            '✅ Login Berhasil', 
            `Selamat datang, ${employee.name}!\n\nRole: ${employee.role}\nID: ${employee.employeeId}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  if (onLoginSuccess) {
                    onLoginSuccess(employee);
                  } else {
                    // Go back to previous screen (should be logged in now)
                    navigation.goBack();
                  }
                }
              }
            ]
          );
        } else {
          console.log('❌ Employee not found or inactive');
          Alert.alert('Error', 'Karyawan tidak ditemukan atau tidak aktif');
        }
      }
    } catch (error) {
      // Not JSON, might be employee ID
      console.log('⚠️ Not JSON, treating as employee ID:', scannedData);
      setEmployeeId(scannedData);
      setLoginMethod('scan');
    }
  };

  const handleManualLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Username dan password harus diisi');
      return;
    }

    setLoading(true);
    try {
      // Find employee by username
      const employee = employees.find(e => e.username.toLowerCase() === username.toLowerCase());
      
      if (!employee) {
        Alert.alert('Error', 'Username tidak ditemukan');
        setLoading(false);
        return;
      }

      if (!employee.isActive) {
        Alert.alert('Error', 'Akun karyawan tidak aktif. Hubungi admin.');
        setLoading(false);
        return;
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, employee.password);
      
      if (!isPasswordValid) {
        Alert.alert('Error', 'Password salah');
        setLoading(false);
        return;
      }

      // Get seller UID (employee.createdBy contains seller UID)
      console.log('📋 Employee data:', employee);
      const sellerUID = employee.createdBy;
      
      if (!sellerUID || sellerUID === 'system') {
        console.error('❌ No valid seller UID found. createdBy:', sellerUID);
        Alert.alert('Error', 'Data karyawan tidak valid. Silakan hubungi admin untuk membuat ulang akun karyawan.');
        setLoading(false);
        return;
      }
      
      console.log('✅ Seller UID:', sellerUID);
      
      // Login success
      const session = {
        employeeId: employee.id,
        employee,
        sellerUID, // ✅ Tambahkan sellerUID
        loginTime: new Date().toISOString(),
        loginMethod: 'manual' as const,
      };

      setEmployeeSession(session);
      
      Alert.alert(
        '✅ Login Berhasil',
        `Selamat datang, ${employee.name}!\n\nRole: ${employee.role}`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onLoginSuccess) {
                onLoginSuccess(employee);
              } else {
                navigation.goBack();
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Gagal login. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanLogin = async () => {
    if (!employeeId) {
      Alert.alert('Error', 'ID karyawan harus diisi');
      return;
    }

    setLoading(true);
    try {
      // Check if employeeId is JSON (from QR code scan)
      let employee: Employee | undefined;
      
      try {
        const qrData = JSON.parse(employeeId);
        
        // If QR code contains username, auto-fill and login
        if (qrData.type === 'employee_login' && qrData.username) {
          setUsername(qrData.username);
          setEmployeeId(qrData.employeeId);
          
          // Find employee by username
          employee = employees.find(e => e.username.toLowerCase() === qrData.username.toLowerCase());
          
          if (employee && employee.isActive) {
            // Get seller UID (employee.createdBy contains seller UID)
            console.log('📋 Employee data:', employee);
            const sellerUID = employee.createdBy;
            
            if (!sellerUID || sellerUID === 'system') {
              console.error('❌ No valid seller UID found. createdBy:', sellerUID);
              Alert.alert('Error', 'Data karyawan tidak valid. Silakan hubungi admin untuk membuat ulang akun karyawan.');
              setLoading(false);
              return;
            }
            
            console.log('✅ Seller UID:', sellerUID);
            
            // Auto login without password (QR code is trusted)
            const session = {
              employeeId: employee.id,
              employee,
              sellerUID, // ✅ Tambahkan sellerUID
              loginTime: new Date().toISOString(),
              loginMethod: 'scan' as const,
            };

            setEmployeeSession(session);
            
            Alert.alert(
              '✅ Login Berhasil',
              `Selamat datang, ${employee.name}!\n\nRole: ${employee.role}`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    if (onLoginSuccess && employee) {
                      onLoginSuccess(employee);
                    } else {
                      navigation.goBack();
                    }
                  }
                }
              ]
            );
            return;
          }
        }
      } catch (e) {
        // Not JSON, treat as regular employee ID
      }
      
      // Regular scan by employee ID
      employee = employees.find(e => e.employeeId.toLowerCase() === employeeId.toLowerCase());
      
      if (!employee) {
        Alert.alert('Error', 'ID karyawan tidak ditemukan');
        setLoading(false);
        return;
      }

      if (!employee.isActive) {
        Alert.alert('Error', 'Akun karyawan tidak aktif. Hubungi admin.');
        setLoading(false);
        return;
      }

      // Get seller UID (employee.createdBy contains seller UID)
      console.log('📋 Employee data:', employee);
      const sellerUID = employee.createdBy;
      
      if (!sellerUID || sellerUID === 'system') {
        console.error('❌ No valid seller UID found. createdBy:', sellerUID);
        Alert.alert('Error', 'Data karyawan tidak valid. Silakan hubungi admin untuk membuat ulang akun karyawan.');
        setLoading(false);
        return;
      }
      
      console.log('✅ Seller UID:', sellerUID);
      
      // Login success
      const session = {
        employeeId: employee.id,
        employee,
        sellerUID, // ✅ Tambahkan sellerUID
        loginTime: new Date().toISOString(),
        loginMethod: 'scan' as const,
      };

      setEmployeeSession(session);
      
      Alert.alert(
        '✅ Login Berhasil',
        `Selamat datang, ${employee.name}!\n\nRole: ${employee.role}`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onLoginSuccess) {
                onLoginSuccess(employee);
              } else {
                navigation.goBack();
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Gagal login. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5' }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons name="person-circle" size={60} color="#DC143C" />
              </View>
              <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>Login Karyawan</Text>
              <Text style={[styles.subtitle, { color: isDark ? '#999' : '#666' }]}>Masuk ke sistem kasir</Text>
            </View>
          </View>

          {/* Scan Detection Indicator */}
          {scanDetected && (
            <View style={styles.scanIndicator}>
              <Ionicons name="scan" size={24} color="#4CAF50" />
              <Text style={styles.scanIndicatorText}>QR Code terdeteksi! Memproses...</Text>
            </View>
          )}

          {/* Login Method Selector */}
          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[
                styles.methodButton, 
                { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#333' : '#ddd' },
                loginMethod === 'manual' && styles.methodButtonActive
              ]}
              onPress={() => setLoginMethod('manual')}
            >
              <Ionicons
                name="keypad-outline"
                size={24}
                color={loginMethod === 'manual' ? '#DC143C' : (isDark ? '#666' : '#999')}
              />
              <Text style={[
                styles.methodText, 
                { color: isDark ? '#666' : '#999' },
                loginMethod === 'manual' && styles.methodTextActive
              ]}>
                Username & Password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodButton, 
                { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#333' : '#ddd' },
                loginMethod === 'scan' && styles.methodButtonActive
              ]}
              onPress={() => setLoginMethod('scan')}
            >
              <Ionicons
                name="scan-outline"
                size={24}
                color={loginMethod === 'scan' ? '#DC143C' : (isDark ? '#666' : '#999')}
              />
              <Text style={[
                styles.methodText, 
                { color: isDark ? '#666' : '#999' },
                loginMethod === 'scan' && styles.methodTextActive
              ]}>
                Scan ID Card
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            {loginMethod === 'manual' ? (
              <>
                <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#333' : '#ddd' }]}>
                  <Ionicons name="person-outline" size={20} color={isDark ? '#666' : '#999'} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                    placeholder="Username"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#333' : '#ddd' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#666' : '#999'} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                    placeholder="Password"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleManualLogin}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={isDark ? '#666' : '#999'}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleManualLogin}
                  disabled={loading}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Memproses...' : 'Login'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.scanInfo}>
                  <Ionicons name="information-circle-outline" size={24} color="#DC143C" />
                  <Text style={styles.scanInfoText}>
                    Scan ID card karyawan atau masukkan ID secara manual
                  </Text>
                </View>

                <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#333' : '#ddd' }]}>
                  <Ionicons name="card-outline" size={20} color={isDark ? '#666' : '#999'} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                    placeholder="ID Karyawan (contoh: EMP001)"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    value={employeeId}
                    onChangeText={setEmployeeId}
                    autoCapitalize="characters"
                    returnKeyType="done"
                    onSubmitEditing={handleScanLogin}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleScanLogin}
                  disabled={loading}
                >
                  <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Memproses...' : 'Verifikasi ID'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Info */}
          <View style={[styles.infoContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#333' : '#ddd' }]}>
            <Ionicons name="help-circle-outline" size={20} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.infoText, { color: isDark ? '#999' : '#666' }]}>
              Belum punya akun? Hubungi pemilik toko untuk membuat akun karyawan.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
  },
  methodButtonActive: {
    borderColor: '#DC143C',
    backgroundColor: '#DC143C20',
  },
  methodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  methodTextActive: {
    color: '#DC143C',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  eyeButton: {
    padding: 8,
  },
  scanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#DC143C20',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DC143C',
  },
  scanInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#DC143C',
    lineHeight: 20,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 18,
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  scanIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#4CAF5020',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  scanIndicatorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
});
