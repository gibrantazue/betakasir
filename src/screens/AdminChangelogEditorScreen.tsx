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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  subscribeToChangelogs,
  saveChangelog,
  deleteChangelog,
  uploadPredefinedChangelog
} from '../services/changelogService';
import { ChangelogEntry, ChangelogItem, CHANGELOG_CATEGORIES } from '../types/changelog';

export default function AdminChangelogEditorScreen({ navigation }: any) {
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [version, setVersion] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'major' | 'minor' | 'patch'>('minor');
  const [changes, setChanges] = useState<ChangelogItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToChangelogs(
      (data) => {
        setChangelogs(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading changelogs:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setVersion('');
    setDate(new Date().toISOString().split('T')[0]);
    setTitle('');
    setDescription('');
    setType('minor');
    setChanges([]);
  };

  const loadChangelog = (changelog: ChangelogEntry) => {
    setEditingId(changelog.id);
    setVersion(changelog.version);
    setDate(changelog.date);
    setTitle(changelog.title);
    setDescription(changelog.description);
    setType(changelog.type);
    setChanges(changelog.changes);
  };

  const addChange = () => {
    setChanges([...changes, { category: 'feature', text: '' }]);
  };

  const updateChange = (index: number, field: keyof ChangelogItem, value: string) => {
    const newChanges = [...changes];
    newChanges[index] = { ...newChanges[index], [field]: value };
    setChanges(newChanges);
  };

  const removeChange = (index: number) => {
    setChanges(changes.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!version || !title || changes.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Error: Mohon isi semua field yang diperlukan');
      } else {
        Alert.alert('Error', 'Mohon isi semua field yang diperlukan');
      }
      return;
    }

    // Validate changes
    const hasEmptyChanges = changes.some(c => !c.text.trim());
    if (hasEmptyChanges) {
      if (Platform.OS === 'web') {
        window.alert('Error: Semua perubahan harus diisi');
      } else {
        Alert.alert('Error', 'Semua perubahan harus diisi');
      }
      return;
    }

    try {
      setLoading(true);
      await saveChangelog(
        {
          version,
          date,
          title,
          description,
          type,
          changes
        },
        editingId || undefined
      );

      if (Platform.OS === 'web') {
        window.alert('Berhasil! Changelog berhasil disimpan');
      } else {
        Alert.alert('Berhasil', 'Changelog berhasil disimpan');
      }
      resetForm();
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Error: ' + error.message);
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Hapus changelog ini?')
      : await new Promise((resolve) => {
          Alert.alert(
            'Konfirmasi',
            'Hapus changelog ini?',
            [
              { text: 'Batal', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Hapus', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });

    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteChangelog(id);
      if (Platform.OS === 'web') {
        window.alert('Berhasil! Changelog berhasil dihapus');
      } else {
        Alert.alert('Berhasil', 'Changelog berhasil dihapus');
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Error: ' + error.message);
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };



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
        <Text style={styles.headerTitle}>Kelola Changelog</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* JSON Upload Section */}
        <View style={styles.quickUploadSection}>
          <Text style={styles.quickUploadTitle}>📤 Upload Changelog dari JSON</Text>
          <Text style={styles.quickUploadSubtitle}>
            Upload file JSON berisi satu atau lebih changelog. Format: array of changelog objects
          </Text>
          {Platform.OS === 'web' ? (
            <TouchableOpacity
              style={styles.jsonUploadButton}
              onPress={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e: any) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  try {
                    setLoading(true);
                    const text = await file.text();
                    const jsonData = JSON.parse(text);
                    
                    // Validate if it's an array
                    if (!Array.isArray(jsonData)) {
                      throw new Error('JSON harus berupa array of changelog objects');
                    }

                    // Upload each changelog
                    let successCount = 0;
                    let errorCount = 0;
                    
                    for (const changelog of jsonData) {
                      try {
                        // Validate required fields
                        if (!changelog.version || !changelog.title || !changelog.changes) {
                          console.error('Invalid changelog:', changelog);
                          errorCount++;
                          continue;
                        }

                        await saveChangelog(changelog, `v${changelog.version}`);
                        successCount++;
                      } catch (error) {
                        console.error('Error uploading changelog:', error);
                        errorCount++;
                      }
                    }

                    window.alert(
                      `✅ Upload Selesai!\n\n` +
                      `Berhasil: ${successCount} changelog\n` +
                      (errorCount > 0 ? `Gagal: ${errorCount} changelog\n\n` : '\n') +
                      `Changelog sekarang tersedia untuk semua user!`
                    );
                  } catch (error: any) {
                    window.alert('❌ Error: ' + error.message);
                  } finally {
                    setLoading(false);
                  }
                };
                input.click();
              }}
            >
              <Ionicons name="document-text-outline" size={20} color="#fff" />
              <Text style={styles.jsonUploadButtonText}>Pilih File JSON</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.webOnlyText}>
              Fitur ini hanya tersedia di web browser
            </Text>
          )}
          
          <Text style={styles.jsonFormatHint}>
            Format JSON:{'\n'}
            {'['}
            {'\n  '}{'{'} version: "1.2.1", date: "2025-11-23", title: "...", type: "patch", changes: [...] {'}'}
            {'\n'}
            {']'}
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>
            {editingId ? 'Edit Changelog' : 'Buat Changelog Baru'}
          </Text>

          {/* Version */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Version *</Text>
            <TextInput
              style={styles.input}
              value={version}
              onChangeText={setVersion}
              placeholder="1.0.0"
              placeholderTextColor="#666"
            />
          </View>

          {/* Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tanggal *</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />
          </View>

          {/* Type */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tipe *</Text>
            <View style={styles.typeButtons}>
              {(['major', 'minor', 'patch'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeButton,
                    type === t && styles.typeButtonActive
                  ]}
                  onPress={() => setType(t)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === t && styles.typeButtonTextActive
                    ]}
                  >
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Judul *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Judul update"
              placeholderTextColor="#666"
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Deskripsi</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Deskripsi singkat"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Changes */}
          <View style={styles.formGroup}>
            <View style={styles.changesHeader}>
              <Text style={styles.label}>Perubahan *</Text>
              <TouchableOpacity style={styles.addButton} onPress={addChange}>
                <Ionicons name="add-circle" size={24} color="#10B981" />
              </TouchableOpacity>
            </View>

            {changes.map((change, index) => (
              <View key={index} style={styles.changeItem}>
                <View style={styles.changeRow}>
                  <View style={styles.categorySelect}>
                    {Object.entries(CHANGELOG_CATEGORIES).map(([key, cat]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.categoryButton,
                          change.category === key && {
                            backgroundColor: cat.color,
                            borderColor: cat.color
                          }
                        ]}
                        onPress={() => updateChange(index, 'category', key)}
                      >
                        <Ionicons
                          name={cat.icon as any}
                          size={16}
                          color={change.category === key ? '#fff' : cat.color}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => removeChange(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.changeInput}
                  value={change.text}
                  onChangeText={(text) => updateChange(index, 'text', text)}
                  placeholder="Deskripsi perubahan"
                  placeholderTextColor="#666"
                  multiline
                />
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {editingId && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={resetForm}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>
                    {editingId ? 'Update' : 'Simpan'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Existing Changelogs */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Changelog yang Ada</Text>
          {changelogs.map((changelog) => (
            <View key={changelog.id} style={styles.changelogCard}>
              <View style={styles.changelogHeader}>
                <View>
                  <Text style={styles.changelogVersion}>v{changelog.version}</Text>
                  <Text style={styles.changelogTitle}>{changelog.title}</Text>
                </View>
                <View style={styles.changelogActions}>
                  <TouchableOpacity
                    onPress={() => loadChangelog(changelog)}
                    style={styles.editButton}
                  >
                    <Ionicons name="create-outline" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(changelog.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
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
    flex: 1
  },
  formSection: {
    padding: 16,
    backgroundColor: '#374151',
    margin: 16,
    borderRadius: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16
  },
  formGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff'
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'center'
  },
  typeButtonActive: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C'
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF'
  },
  typeButtonTextActive: {
    color: '#fff'
  },
  changesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  addButton: {
    padding: 4
  },
  changeItem: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  categorySelect: {
    flexDirection: 'row',
    gap: 8
  },
  categoryButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeButton: {
    padding: 8
  },
  changeInput: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#fff',
    minHeight: 60,
    textAlignVertical: 'top'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF'
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC143C',
    padding: 14,
    borderRadius: 8
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  },
  listSection: {
    padding: 16
  },
  changelogCard: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  changelogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  changelogVersion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 4
  },
  changelogTitle: {
    fontSize: 14,
    color: '#fff'
  },
  changelogActions: {
    flexDirection: 'row',
    gap: 12
  },
  editButton: {
    padding: 8
  },
  deleteButton: {
    padding: 8
  },
  quickUploadSection: {
    backgroundColor: '#10B981',
    padding: 16,
    margin: 16,
    borderRadius: 12
  },
  quickUploadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  quickUploadSubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 12
  },
  jsonUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12
  },
  jsonUploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  jsonFormatHint: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#059669',
    padding: 8,
    borderRadius: 6
  },
  webOnlyText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    padding: 12,
    opacity: 0.9
  }
});
