import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createTestingConfig,
  createAppSettings,
  createContentSettings,
  createAllTestingDocuments
} from '../utils/createTestingDocuments';
import { seedChangelogV1 } from '../utils/seedChangelog';

export default function AdminTestingScreen({ navigation }: any) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCreateDocument = async (
    type: string,
    createFunction: () => Promise<boolean>
  ) => {
    setLoading(type);
    try {
      const success = await createFunction();
      if (success) {
        Alert.alert('Berhasil', `Document ${type} berhasil dibuat!`);
      } else {
        Alert.alert('Gagal', `Gagal membuat document ${type}`);
      }
    } catch (error) {
      Alert.alert('Error', `Error: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const handleCreateAll = async () => {
    setLoading('all');
    try {
      const success = await createAllTestingDocuments();
      if (success) {
        Alert.alert(
          'Berhasil',
          'Semua testing documents berhasil dibuat!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Gagal', 'Beberapa documents gagal dibuat');
      }
    } catch (error) {
      Alert.alert('Error', `Error: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const DocumentButton = ({
    title,
    description,
    icon,
    color,
    onPress,
    isLoading
  }: any) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={loading !== null}
    >
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardDescription}>{description}</Text>
      {isLoading && (
        <ActivityIndicator size="small" color={color} style={styles.loader} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Testing Documents</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            Gunakan tools ini untuk membuat testing documents di Firestore
          </Text>
        </View>

        {/* Create All Button */}
        <TouchableOpacity
          style={styles.createAllButton}
          onPress={handleCreateAll}
          disabled={loading !== null}
        >
          <Ionicons name="rocket" size={24} color="#fff" />
          <Text style={styles.createAllText}>
            {loading === 'all' ? 'Membuat...' : 'Buat Semua Documents'}
          </Text>
          {loading === 'all' && (
            <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />
          )}
        </TouchableOpacity>

        {/* Individual Documents */}
        <Text style={styles.sectionTitle}>Atau Buat Satu Per Satu:</Text>

        <DocumentButton
          title="testing/config"
          description="Document untuk testing configuration"
          icon="flask"
          color="#8B5CF6"
          onPress={() => handleCreateDocument('testing/config', createTestingConfig)}
          isLoading={loading === 'testing/config'}
        />

        <DocumentButton
          title="appSettings/general"
          description="Document untuk app settings umum"
          icon="settings"
          color="#10B981"
          onPress={() => handleCreateDocument('appSettings/general', createAppSettings)}
          isLoading={loading === 'appSettings/general'}
        />

        <DocumentButton
          title="content/settings"
          description="Document untuk content editor settings"
          icon="document-text"
          color="#F59E0B"
          onPress={() => handleCreateDocument('content/settings', createContentSettings)}
          isLoading={loading === 'content/settings'}
        />

        {/* Changelog Seed */}
        <Text style={styles.sectionTitle}>Changelog:</Text>

        <DocumentButton
          title="Changelog v1.0.0"
          description="Seed changelog lengkap untuk versi 1.0.0"
          icon="list"
          color="#DC143C"
          onPress={() => handleCreateDocument('changelog-v1.0.0', seedChangelogV1)}
          isLoading={loading === 'changelog-v1.0.0'}
        />

        {/* Warning */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            Jika document sudah ada, akan di-overwrite dengan data default
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151'
  },
  backButton: {
    marginRight: 16
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  content: {
    flex: 1,
    padding: 16
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#1E3A8A',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center'
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#93C5FD',
    fontSize: 14
  },
  createAllButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  createAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12
  },
  card: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12
  },
  cardDescription: {
    fontSize: 14,
    color: '#9CA3AF'
  },
  loader: {
    marginTop: 8
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#78350F',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center'
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    color: '#FCD34D',
    fontSize: 12
  }
});
