import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { whatsappService } from '../services/whatsappService';
import { WhatsAppConfig } from '../types/whatsapp';

export default function WhatsAppSettingsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [config, setConfig] = useState<WhatsAppConfig>(whatsappService.getConfig());
  const [phoneNumber, setPhoneNumber] = useState(config.phoneNumber);

  useEffect(() => {
    // Load config
    const currentConfig = whatsappService.getConfig();
    setConfig(currentConfig);
    setPhoneNumber(currentConfig.phoneNumber);
  }, []);

  const handleSave = () => {
    // Validate phone number
    if (config.enabled && !phoneNumber) {
      if (Platform.OS === 'web') {
        window.alert('❌ ERROR\n\nNomor WhatsApp harus diisi!');
      } else {
        Alert.alert('Error', 'Nomor WhatsApp harus diisi!');
      }
      return;
    }

    // Validate phone number format
    if (config.enabled && phoneNumber) {
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
      if (!cleanNumber.startsWith('62')) {
        if (Platform.OS === 'web') {
          window.alert(
            '❌ FORMAT SALAH\n\n' +
            'Nomor harus format international:\n' +
            '✅ 6281234567890\n' +
            '❌ 081234567890\n\n' +
            'Tambahkan 62 di depan (tanpa +)'
          );
        } else {
          Alert.alert(
            'Format Salah',
            'Nomor harus format international:\n✅ 6281234567890\n❌ 081234567890\n\nTambahkan 62 di depan (tanpa +)'
          );
        }
        return;
      }
    }

    // Save config
    const newConfig = {
      ...config,
      phoneNumber: phoneNumber.replace(/[^0-9]/g, ''),
    };

    whatsappService.setConfig(newConfig);
    setConfig(newConfig);

    if (Platform.OS === 'web') {
      window.alert('✅ BERHASIL\n\nPengaturan WhatsApp berhasil disimpan!');
    } else {
      Alert.alert('Berhasil', 'Pengaturan WhatsApp berhasil disimpan!');
    }
  };

  const handleTest = async () => {
    if (!config.enabled) {
      if (Platform.OS === 'web') {
        window.alert('⚠️ WhatsApp belum diaktifkan!\n\nAktifkan dulu untuk test.');
      } else {
        Alert.alert('Peringatan', 'WhatsApp belum diaktifkan!\n\nAktifkan dulu untuk test.');
      }
      return;
    }

    if (!phoneNumber) {
      if (Platform.OS === 'web') {
        window.alert('⚠️ Nomor WhatsApp belum diisi!');
      } else {
        Alert.alert('Peringatan', 'Nomor WhatsApp belum diisi!');
      }
      return;
    }

    // Send test message
    const testMessage = `📱 *TEST WHATSAPP INTEGRATION*\n\nHalo! Ini adalah pesan test dari BetaKasir.\n\nJika Anda menerima pesan ini, berarti WhatsApp Integration sudah berhasil disetup! 🎉\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nFitur yang tersedia:\n✅ Laporan harian otomatis\n✅ Remote commands (laporan, stok, top, transaksi)\n✅ Smart alerts\n\nKetik *help* untuk lihat daftar perintah.\n\n📱 BetaKasir - Kasir Pintar Anda`;

    const success = await whatsappService.sendMessage({
      to: phoneNumber.replace(/[^0-9]/g, ''),
      message: testMessage,
      type: 'text',
    });

    if (success) {
      if (Platform.OS === 'web') {
        window.alert('✅ TEST BERHASIL\n\nPesan test sudah dikirim ke WhatsApp!\n\nCek WhatsApp Anda.');
      } else {
        Alert.alert('Berhasil', 'Pesan test sudah dikirim ke WhatsApp!\n\nCek WhatsApp Anda.');
      }
    }
  };

  const handleSendDailyReport = async () => {
    if (!config.enabled) {
      if (Platform.OS === 'web') {
        window.alert('⚠️ WhatsApp belum diaktifkan!');
      } else {
        Alert.alert('Peringatan', 'WhatsApp belum diaktifkan!');
      }
      return;
    }

    // Mock data for test
    const mockData = {
      revenue: 2500000,
      transactions: 85,
      topProducts: [
        { name: 'Indomie Goreng', sold: 50 },
        { name: 'Aqua 600ml', sold: 40 },
        { name: 'Mie Sedaap', sold: 30 },
      ],
      lowStockProducts: [
        { name: 'Indomie Goreng', stock: 5 },
        { name: 'Aqua 1500ml', stock: 3 },
      ],
    };

    const success = await whatsappService.sendDailyReport(mockData);

    if (success) {
      if (Platform.OS === 'web') {
        window.alert('✅ LAPORAN TERKIRIM\n\nLaporan harian sudah dikirim ke WhatsApp!');
      } else {
        Alert.alert('Berhasil', 'Laporan harian sudah dikirim ke WhatsApp!');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>WhatsApp Integration</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Enable WhatsApp */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Enable WhatsApp</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Aktifkan integrasi WhatsApp
                </Text>
              </View>
            </View>
            <Switch
              value={config.enabled}
              onValueChange={(value) => setConfig({ ...config, enabled: value })}
              trackColor={{ false: '#767577', true: '#25D366' }}
              thumbColor={config.enabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Phone Number */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Nomor WhatsApp</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="6281234567890"
              placeholderTextColor={colors.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={config.enabled}
            />
          </View>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Format: 62 + nomor (tanpa +, tanpa -)
            {'\n'}Contoh: 6281340078956
          </Text>
        </View>

        {/* Daily Report Time */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Waktu Laporan Harian</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="20:00"
              placeholderTextColor={colors.textSecondary}
              value={config.dailyReportTime}
              onChangeText={(value) => setConfig({ ...config, dailyReportTime: value })}
              editable={config.enabled}
            />
          </View>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Format: HH:MM (24 jam)
            {'\n'}Contoh: 20:00 untuk jam 8 malam
          </Text>
        </View>

        {/* Features */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Fitur</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color="#DC143C" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Smart Alerts</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Notifikasi penting via WhatsApp
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableAlerts}
              onValueChange={(value) => setConfig({ ...config, enableAlerts: value })}
              trackColor={{ false: '#767577', true: '#DC143C' }}
              thumbColor={config.enableAlerts ? '#fff' : '#f4f3f4'}
              disabled={!config.enabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="terminal-outline" size={24} color="#8B5CF6" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Remote Commands</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Kontrol via perintah WhatsApp
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableCommands}
              onValueChange={(value) => setConfig({ ...config, enableCommands: value })}
              trackColor={{ false: '#767577', true: '#8B5CF6' }}
              thumbColor={config.enableCommands ? '#fff' : '#f4f3f4'}
              disabled={!config.enabled}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>Simpan Pengaturan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.testButton, !config.enabled && styles.buttonDisabled]}
            onPress={handleTest}
            disabled={!config.enabled}
          >
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.buttonText}>Test WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.reportButton, !config.enabled && styles.buttonDisabled]}
            onPress={handleSendDailyReport}
            disabled={!config.enabled}
          >
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.buttonText}>Kirim Laporan Test</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: '#25D366' }]}>
          <Ionicons name="information-circle" size={24} color="#25D366" />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Cara Pakai</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              1. Aktifkan WhatsApp Integration{'\n'}
              2. Input nomor WhatsApp Anda{'\n'}
              3. Set waktu laporan harian{'\n'}
              4. Klik "Test WhatsApp" untuk test{'\n'}
              5. Selesai! Anda akan terima laporan otomatis
            </Text>
          </View>
        </View>

        {/* Commands Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: '#8B5CF6' }]}>
          <Ionicons name="terminal" size={24} color="#8B5CF6" />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Perintah WhatsApp</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Kirim perintah ini ke nomor WA Anda:{'\n\n'}
              • <Text style={{ fontWeight: 'bold' }}>laporan</Text> - Lihat laporan hari ini{'\n'}
              • <Text style={{ fontWeight: 'bold' }}>stok [produk]</Text> - Cek stok produk{'\n'}
              • <Text style={{ fontWeight: 'bold' }}>top</Text> - Top 5 produk terlaris{'\n'}
              • <Text style={{ fontWeight: 'bold' }}>transaksi</Text> - Ringkasan transaksi{'\n'}
              • <Text style={{ fontWeight: 'bold' }}>help</Text> - Daftar perintah
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 2,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#25D366',
  },
  testButton: {
    backgroundColor: '#8B5CF6',
  },
  reportButton: {
    backgroundColor: '#DC143C',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
