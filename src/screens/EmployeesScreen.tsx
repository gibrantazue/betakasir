import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView, KeyboardAvoidingView, Platform, Keyboard, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import { LimitWarning } from '../components/FeatureGate';
import { generateId } from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { Employee, EmployeeRole, DEFAULT_PERMISSIONS } from '../types/employee';
import { generateEmployeeId, hashPassword, generateRandomPassword, validateEmployeeData, getRoleDisplayName, getRoleColor } from '../utils/employeeHelpers';
import { printEmployeeCard } from '../utils/printEmployeeCard';
import { useTheme } from '../hooks/useTheme';

export default function EmployeesScreen({ navigation }: any) {
  const { employees, addEmployee, updateEmployee, deleteEmployee, currentUser, settings } = useStore();
  const { checkFeatureLimit, hasFeature, subscription } = useSubscription();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    role: 'cashier' as EmployeeRole,
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const filteredEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (employee?: Employee) => {
    // Check if user has permission to manage employees (Business plan only)
    if (!hasFeature('canManageEmployees')) {
      Alert.alert(
        '🔒 Fitur Premium',
        'Fitur manajemen karyawan hanya tersedia untuk plan Business.\n\nUpgrade ke Business untuk:\n• Tambah/edit/hapus karyawan\n• Unlimited karyawan\n• Unlimited produk & transaksi',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Upgrade ke Business', onPress: () => navigation?.navigate('Billing') }
        ]
      );
      return;
    }
    
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        phone: employee.phone,
        email: employee.email || '',
        username: employee.username,
        password: '', // Don't show password
        role: employee.role,
        address: employee.address || '',
      });
    } else {
      setEditingEmployee(null);
      const randomPassword = generateRandomPassword();
      setFormData({
        name: '',
        phone: '',
        email: '',
        username: '',
        password: randomPassword,
        role: 'cashier',
        address: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const validation = validateEmployeeData(formData);
    if (!validation.valid) {
      Alert.alert('Error', validation.errors.join('\n'));
      return;
    }

    // Check limit jika tambah karyawan baru (bukan edit)
    if (!editingEmployee) {
      const { allowed, limit } = checkFeatureLimit('maxEmployees', employees.length);
      
      if (!allowed) {
        Alert.alert(
          'Limit Tercapai',
          `Anda sudah mencapai limit ${limit} karyawan. Upgrade plan untuk menambah karyawan.`,
          [
            { text: 'Batal', style: 'cancel' },
            { text: 'Lihat Plan', onPress: () => navigation?.navigate('Billing') }
          ]
        );
        return;
      }
    }

    try {
      if (editingEmployee) {
        // Update existing employee
        const updatedData: Partial<Employee> = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          username: formData.username,
          role: formData.role,
          address: formData.address,
          permissions: DEFAULT_PERMISSIONS[formData.role],
        };

        // Only update password if changed
        if (formData.password) {
          updatedData.password = await hashPassword(formData.password);
        }

        await updateEmployee(editingEmployee.id, updatedData);
        Alert.alert('Berhasil', 'Data karyawan berhasil diupdate dan tersimpan ke cloud');
      } else {
        // Create new employee
        const hashedPassword = await hashPassword(formData.password);
        const employeeId = generateEmployeeId(employees);

        const newEmployee: Employee = {
          id: generateId(),
          employeeId,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          username: formData.username,
          password: hashedPassword,
          role: formData.role,
          permissions: DEFAULT_PERMISSIONS[formData.role],
          address: formData.address,
          joinDate: new Date().toISOString(),
          isActive: true,
          createdBy: currentUser?.id || 'system',
          createdAt: new Date().toISOString(),
        };

        // FIX: Close modal first to prevent double submission
        setShowModal(false);
        
        await addEmployee(newEmployee);
        Alert.alert(
          'Berhasil',
          `Karyawan berhasil ditambahkan dan tersimpan ke cloud!\n\nID: ${employeeId}\nUsername: ${formData.username}\nPassword: ${formData.password}\n\nSimpan password ini untuk login karyawan.`
        );
      }

      // Only close modal for edit case (add case already closed above)
      if (editingEmployee) {
        setShowModal(false);
      }
    } catch (error: any) {
      console.error('Error saving employee:', error);
      Alert.alert('Error', error.message || 'Gagal menyimpan data karyawan. Pastikan Anda terhubung ke internet.');
      // Reopen modal if there was an error
      if (!editingEmployee) {
        setShowModal(true);
      }
    }
  };

  const handleDelete = async (employee: Employee) => {
    // Check if user has permission to manage employees (Business plan only)
    if (!hasFeature('canManageEmployees')) {
      Alert.alert(
        '🔒 Fitur Premium',
        'Fitur hapus karyawan hanya tersedia untuk plan Business.\n\nUpgrade ke Business untuk akses penuh.',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Upgrade ke Business', onPress: () => navigation?.navigate('Billing') }
        ]
      );
      return;
    }
    
    // Use window.confirm for web compatibility
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Yakin ingin menghapus ${employee.name}?\n\nData karyawan akan dihapus permanen dari cloud.`);
      if (confirmed) {
        try {
          await deleteEmployee(employee.id);
          Alert.alert('Berhasil', 'Karyawan berhasil dihapus dari cloud');
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Gagal menghapus karyawan');
        }
      }
    } else {
      Alert.alert(
        'Hapus Karyawan',
        `Yakin ingin menghapus ${employee.name}?\n\nData akan dihapus permanen dari cloud.`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus', style: 'destructive', onPress: async () => {
            try {
              await deleteEmployee(employee.id);
              Alert.alert('Berhasil', 'Karyawan berhasil dihapus dari cloud');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Gagal menghapus karyawan');
            }
          }},
        ]
      );
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      await updateEmployee(employee.id, { isActive: !employee.isActive });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal mengubah status karyawan');
    }
  };

  const handleDownloadQR = async (employee: Employee) => {
    try {
      const { downloadEmployeeQRCode } = require('../utils/printEmployeeCard');
      await downloadEmployeeQRCode(employee, settings.storeName);
      Alert.alert('Berhasil', 'QR code berhasil diunduh');
    } catch (error) {
      Alert.alert('Error', 'Gagal mengunduh QR code');
    }
  };

  const handlePrintBarcode = async (employee: Employee) => {
    try {
      const { printEmployeeBarcode } = require('../utils/printEmployeeCard');
      await printEmployeeBarcode(employee, settings.storeName);
    } catch (error) {
      Alert.alert('Error', 'Gagal mencetak barcode');
    }
  };

  const handlePrintCard = async (employee: Employee) => {
    try {
      await printEmployeeCard(employee, settings.storeName);
    } catch (error) {
      Alert.alert('Error', 'Gagal mencetak ID card');
    }
  };

  const handleShowOptions = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowOptionsMenu(true);
  };

  const handleMenuAction = (action: string) => {
    if (!selectedEmployee) return;
    
    setShowOptionsMenu(false);
    
    switch (action) {
      case 'download':
        handleDownloadQR(selectedEmployee);
        break;
      case 'print':
        handlePrintBarcode(selectedEmployee);
        break;
      case 'printCard':
        handlePrintCard(selectedEmployee);
        break;
      case 'toggle':
        handleToggleActive(selectedEmployee);
        break;
      case 'edit':
        handleOpenModal(selectedEmployee);
        break;
      case 'delete':
        handleDelete(selectedEmployee);
        break;
    }
    
    setSelectedEmployee(null);
  };

  const EmployeeItem = ({ item }: { item: Employee }) => {
    const roleColor = getRoleColor(item.role);

    return (
      <View style={[styles.employeeItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.employeeAvatar, { backgroundColor: roleColor + '30', borderColor: roleColor }]}>
          <Text style={[styles.employeeInitial, { color: roleColor }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.employeeInfo}>
          <View style={styles.employeeHeader}>
            <Text style={[styles.employeeName, { color: colors.text }]}>{item.name}</Text>
            {!item.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Nonaktif</Text>
              </View>
            )}
          </View>
          <Text style={[styles.employeeId, { color: colors.textSecondary }]}>ID: {item.employeeId}</Text>
          <View style={styles.employeeDetails}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>
                {getRoleDisplayName(item.role)}
              </Text>
            </View>
            <Text style={[styles.employeePhone, { color: colors.textSecondary }]}>{item.phone}</Text>
          </View>
        </View>
        <View style={styles.employeeActions}>
          <TouchableOpacity onPress={() => handleDownloadQR(item)} style={{ marginRight: 10 }}>
            <Ionicons name="download-outline" size={24} color="#4ECDC4" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePrintBarcode(item)} style={{ marginRight: 10 }}>
            <Ionicons name="print-outline" size={24} color="#FF6B35" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShowOptions(item)}>
            <Ionicons name="ellipsis-vertical" size={24} color="#DC143C" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.primary }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Cari karyawan..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={[
            styles.addButton, 
            { backgroundColor: hasFeature('canManageEmployees') ? colors.primary : '#6B7280' }
          ]} 
          onPress={() => handleOpenModal()}
        >
          <Ionicons name="add" size={24} color="#fff" />
          {!hasFeature('canManageEmployees') && (
            <View style={styles.businessBadge}>
              <Text style={styles.businessBadgeText}>💎</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Business Plan Info Banner */}
      {!hasFeature('canManageEmployees') && (
        <View style={[styles.businessInfoBanner, { backgroundColor: '#8B5CF620', borderColor: '#8B5CF6' }]}>
          <Ionicons name="diamond" size={24} color="#8B5CF6" />
          <View style={styles.businessInfoText}>
            <Text style={[styles.businessInfoTitle, { color: '#8B5CF6' }]}>
              Fitur Manajemen Karyawan - Business Plan
            </Text>
            <Text style={[styles.businessInfoSubtitle, { color: colors.textSecondary }]}>
              Upgrade ke Business untuk tambah, edit, dan hapus karyawan
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.upgradeButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => navigation?.navigate('Billing')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Limit Warning */}
      <LimitWarning 
        limitType="maxEmployees" 
        currentCount={employees.length}
        warningThreshold={80}
      />

      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EmployeeItem item={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={80} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.text }]}>Belum ada karyawan</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Tambahkan karyawan untuk mulai</Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalFullScreen, { backgroundColor: colors.background }]} edges={['top']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidFull}
          >
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.primary }]}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowModal(false);
                }}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
              </Text>
              <View style={styles.backButton} />
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalContent}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Nama Lengkap *"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  returnKeyType="next"
                />

                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Nomor Telepon *"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />

                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  returnKeyType="next"
                  autoCapitalize="none"
                />

                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Username *"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text.toLowerCase() })}
                  returnKeyType="next"
                  autoCapitalize="none"
                />

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    placeholder={editingEmployee ? "Password (kosongkan jika tidak diubah)" : "Password *"}
                    placeholderTextColor={colors.textSecondary}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {!editingEmployee && (
                  <TouchableOpacity
                    style={[styles.generateButton, { borderColor: colors.primary }]}
                    onPress={() => setFormData({ ...formData, password: generateRandomPassword() })}
                  >
                    <Ionicons name="refresh-outline" size={20} color={colors.primary} />
                    <Text style={[styles.generateButtonText, { color: colors.primary }]}>Generate Password</Text>
                  </TouchableOpacity>
                )}

                <Text style={[styles.label, { color: colors.text }]}>Role *</Text>
                <View style={styles.roleSelector}>
                  {(['cashier', 'admin', 'seller'] as EmployeeRole[]).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        { backgroundColor: colors.card, borderColor: getRoleColor(role) },
                        formData.role === role && { backgroundColor: colors.background }
                      ]}
                      onPress={() => setFormData({ ...formData, role })}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        { color: colors.textSecondary },
                        formData.role === role && { color: getRoleColor(role) }
                      ]}>
                        {getRoleDisplayName(role)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Alamat"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  multiline
                  numberOfLines={3}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowModal(false);
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleSave();
                    }}
                  >
                    <Text style={styles.saveButtonText}>Simpan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Options Menu Modal */}
      <Modal visible={showOptionsMenu} animationType="fade" transparent={true}>
        <TouchableOpacity 
          style={styles.optionsOverlay} 
          activeOpacity={1} 
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={[styles.optionsMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.optionsTitle, { color: colors.text }]}>{selectedEmployee?.name}</Text>
            <Text style={[styles.optionsSubtitle, { color: colors.textSecondary }]}>Pilih aksi</Text>
            
            <TouchableOpacity 
              style={[styles.optionItem, { backgroundColor: colors.background, borderColor: colors.border }]} 
              onPress={() => handleMenuAction('download')}
            >
              <Ionicons name="download-outline" size={22} color="#4ECDC4" />
              <Text style={[styles.optionText, { color: colors.text }]}>Download QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionItem, { backgroundColor: colors.background, borderColor: colors.border }]} 
              onPress={() => handleMenuAction('print')}
            >
              <Ionicons name="print-outline" size={22} color="#FF6B35" />
              <Text style={[styles.optionText, { color: colors.text }]}>Cetak QR Sticker</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionItem, { backgroundColor: colors.background, borderColor: colors.border }]} 
              onPress={() => handleMenuAction('printCard')}
            >
              <Ionicons name="card-outline" size={22} color="#9B59B6" />
              <Text style={[styles.optionText, { color: colors.text }]}>Cetak ID Card (Preview)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionItem, { backgroundColor: colors.background, borderColor: colors.border }]} 
              onPress={() => handleMenuAction('toggle')}
            >
              <Ionicons 
                name={selectedEmployee?.isActive ? "close-circle-outline" : "checkmark-circle-outline"} 
                size={22} 
                color={selectedEmployee?.isActive ? "#FF6B35" : "#4ECDC4"} 
              />
              <Text style={[styles.optionText, { color: colors.text }]}>
                {selectedEmployee?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionItem, { backgroundColor: colors.background, borderColor: colors.border }]} 
              onPress={() => handleMenuAction('edit')}
            >
              <Ionicons name="pencil-outline" size={22} color="#3498DB" />
              <Text style={[styles.optionText, { color: colors.text }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionItem, styles.optionItemDanger]} 
              onPress={() => handleMenuAction('delete')}
            >
              <Ionicons name="trash-outline" size={22} color="#DC143C" />
              <Text style={[styles.optionText, styles.optionTextDanger]}>Hapus</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionItem, styles.optionItemCancel, { backgroundColor: colors.border }]} 
              onPress={() => setShowOptionsMenu(false)}
            >
              <Text style={[styles.optionTextCancel, { color: colors.text }]}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    padding: 15,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#DC143C',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#DC143C',
    borderRadius: 8,
    padding: 10,
    position: 'relative',
  },
  businessBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessBadgeText: {
    fontSize: 10,
  },
  businessInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 12,
    borderWidth: 2,
  },
  businessInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  businessInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  businessInfoSubtitle: {
    fontSize: 12,
  },
  upgradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  employeeItem: {
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  employeeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
  },
  employeeInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  inactiveBadge: {
    backgroundColor: '#666',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  employeeId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  employeeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  employeePhone: {
    fontSize: 12,
    color: '#999',
  },
  employeeActions: {
    flexDirection: 'row',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    textAlign: 'center',
    color: '#fff',
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  modalFullScreen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  keyboardAvoidFull: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#DC143C',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  modalScrollContent: {
    padding: 20,
  },
  modalContent: {
    flex: 1,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC143C',
  },
  generateButtonText: {
    color: '#DC143C',
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  roleOptionActive: {
    backgroundColor: '#0a0a0a',
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#DC143C',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  optionsMenu: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  optionsSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#0a0a0a',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionItemDanger: {
    borderColor: '#DC143C40',
    backgroundColor: '#DC143C10',
  },
  optionItemCancel: {
    backgroundColor: '#333',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
  optionTextDanger: {
    color: '#DC143C',
  },
  optionTextCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});
