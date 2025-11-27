import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { migrateSpecificUsers } from '../utils/migrateExistingUsers';

export default function AdminMigrationScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleMigrate = async () => {
    if (!userInput.trim()) {
      Alert.alert('Error', 'Mohon isi data user yang akan dimigrate');
      return;
    }

    try {
      // Parse input (format: uid,email,displayName per line)
      const lines = userInput.trim().split('\n');
      const users = lines.map(line => {
        const [uid, email, displayName] = line.split(',').map(s => s.trim());
        return { uid, email, displayName };
      }).filter(u => u.uid && u.email);

      if (users.length === 0) {
        Alert.alert('Error', 'Format tidak valid. Gunakan format: uid,email,displayName');
        return;
      }

      Alert.alert(
        'Konfirmasi',
        `Migrate ${users.length} user(s)?`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Migrate',
            onPress: async () => {
              setLoading(true);
              try {
                const migrationResult = await migrateSpecificUsers(users);
                setResult(migrationResult);
                Alert.alert(
                  'Selesai!',
                  `Migrated: ${migrationResult.migrated}\nSkipped: ${migrationResult.skipped}\nErrors: ${migrationResult.errors}`
                );
              } catch (error: any) {
                Alert.alert('Error', error.message);
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>User Migration</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            Tool ini untuk migrate user yang sudah ada di Firebase Authentication tapi belum punya document di Firestore.
          </Text>
        </View>

        <Text style={styles.label}>Format Input:</Text>
        <Text style={styles.formatExample}>uid,email,displayName</Text>
        <Text style={styles.formatExample}>uid2,email2,displayName2</Text>
        <Text style={styles.formatExample}>...</Text>

        <Text style={styles.label}>Paste User Data:</Text>
        <TextInput
          style={styles.textArea}
          placeholder="uid1,user1@example.com,User 1&#10;uid2,user2@example.com,User 2"
          placeholderTextColor="#666"
          value={userInput}
          onChangeText={setUserInput}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.migrateButton, loading && styles.migrateButtonDisabled]}
          onPress={handleMigrate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.migrateButtonText}>Migrate Users</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Migration Result:</Text>
            <View style={styles.resultStats}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatLabel}>Total:</Text>
                <Text style={styles.resultStatValue}>{result.total}</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={[styles.resultStatLabel, { color: '#10B981' }]}>Migrated:</Text>
                <Text style={[styles.resultStatValue, { color: '#10B981' }]}>{result.migrated}</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={[styles.resultStatLabel, { color: '#F59E0B' }]}>Skipped:</Text>
                <Text style={[styles.resultStatValue, { color: '#F59E0B' }]}>{result.skipped}</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={[styles.resultStatLabel, { color: '#EF4444' }]}>Errors:</Text>
                <Text style={[styles.resultStatValue, { color: '#EF4444' }]}>{result.errors}</Text>
              </View>
            </View>

            <Text style={styles.resultDetailsTitle}>Details:</Text>
            {result.details.map((detail: any, index: number) => (
              <View key={index} style={styles.resultDetail}>
                <Ionicons
                  name={
                    detail.status === 'migrated'
                      ? 'checkmark-circle'
                      : detail.status === 'skipped'
                      ? 'remove-circle'
                      : 'close-circle'
                  }
                  size={16}
                  color={
                    detail.status === 'migrated'
                      ? '#10B981'
                      : detail.status === 'skipped'
                      ? '#F59E0B'
                      : '#EF4444'
                  }
                />
                <Text style={styles.resultDetailText}>
                  {detail.email} - {detail.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>Cara Mendapatkan User Data:</Text>
          <Text style={styles.helpText}>
            1. Buka Firebase Console → Authentication{'\n'}
            2. Lihat list users{'\n'}
            3. Copy UID dan Email setiap user{'\n'}
            4. Format: uid,email,displayName{'\n'}
            5. Paste di form di atas{'\n'}
            6. Klik "Migrate Users"
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 3,
    borderBottomColor: '#DC143C',
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#1E3A8A20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#93C5FD',
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  formatExample: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  textArea: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 200,
    marginTop: 8,
    marginBottom: 20,
  },
  migrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC143C',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  migrateButtonDisabled: {
    opacity: 0.6,
  },
  migrateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  resultStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  resultStat: {
    flex: 1,
    minWidth: 100,
  },
  resultStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  resultStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
  },
  resultDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  resultDetailText: {
    flex: 1,
    fontSize: 12,
    color: '#ccc',
  },
  helpBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#999',
    lineHeight: 22,
  },
});
