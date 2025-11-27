import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView, KeyboardAvoidingView, Platform, Keyboard, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { formatCurrency, generateId } from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { Customer } from '../types';

export default function CustomersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { customers, addCustomer, updateCustomer, deleteCustomer, transactions } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('Error', 'Nama dan nomor telepon harus diisi');
      return;
    }

    const customerData = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
    };

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, customerData);
    } else {
      const newCustomer: Customer = {
        ...customerData,
        id: generateId(),
        totalPurchases: 0,
        createdAt: new Date().toISOString(),
      };
      addCustomer(newCustomer);
    }

    setShowModal(false);
  };

  const handleDelete = (customer: Customer) => {
    Alert.alert(
      'Hapus Pelanggan',
      `Yakin ingin menghapus ${customer.name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => deleteCustomer(customer.id) },
      ]
    );
  };

  const getCustomerTransactions = (customerId: string) => {
    return transactions.filter((t) => t.customerId === customerId);
  };

  const getCustomerTotalSpent = (customerId: string) => {
    const customerTransactions = getCustomerTransactions(customerId);
    return customerTransactions.reduce((sum, t) => sum + t.total, 0);
  };

  const CustomerItem = ({ item }: { item: Customer }) => {
    const totalSpent = getCustomerTotalSpent(item.id);
    const transactionCount = getCustomerTransactions(item.id).length;

    return (
      <View style={[styles.customerItem, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#333' : '#e0e0e0' }]}>
        <View style={styles.customerAvatar}>
          <Text style={styles.customerInitial}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={[styles.customerName, { color: isDark ? '#fff' : '#000' }]}>{item.name}</Text>
          <Text style={[styles.customerPhone, { color: isDark ? '#999' : '#666' }]}>{item.phone}</Text>
          <View style={styles.customerStats}>
            <Text style={styles.customerStat}>{transactionCount} transaksi</Text>
            <Text style={styles.customerStat}>•</Text>
            <Text style={styles.customerStat}>{formatCurrency(totalSpent)}</Text>
          </View>
        </View>
        <View style={styles.customerActions}>
          <TouchableOpacity onPress={() => handleOpenModal(item)}>
            <Ionicons name="create-outline" size={24} color="#DC143C" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={{ marginLeft: 15 }}>
            <Ionicons name="trash-outline" size={24} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5' }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={[styles.searchContainer, { backgroundColor: isDark ? '#0a0a0a' : '#f8f8f8', borderColor: isDark ? '#333' : '#ddd' }]}>
          <Ionicons name="search" size={20} color={isDark ? '#666' : '#999'} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#fff' : '#000' }]}
            placeholder="Cari pelanggan..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CustomerItem item={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={80} color={isDark ? '#333' : '#ccc'} />
            <Text style={[styles.emptyText, { color: isDark ? '#666' : '#999' }]}>Belum ada pelanggan</Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalFullScreen, { backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5' }]} edges={['top']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidFull}
          >
            <View style={[styles.modalHeader, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowModal(false);
                }}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
                {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
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
                  style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#333' : '#ddd' }]}
                  placeholder="Nama Lengkap *"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  returnKeyType="next"
                />

                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#333' : '#ddd' }]}
                  placeholder="Nomor Telepon *"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />

                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#333' : '#ddd' }]}
                  placeholder="Email"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  returnKeyType="next"
                  autoCapitalize="none"
                />

                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#fff' : '#000', borderColor: isDark ? '#333' : '#ddd' }]}
                  placeholder="Alamat"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  multiline
                  numberOfLines={3}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5', borderColor: isDark ? '#333' : '#ddd' }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowModal(false);
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: isDark ? '#fff' : '#000' }]}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
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
  },
  customerItem: {
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
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DC143C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  customerPhone: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  customerStats: {
    flexDirection: 'row',
    gap: 8,
  },
  customerStat: {
    fontSize: 12,
    color: '#DC143C',
  },
  customerActions: {
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
    color: '#666',
    marginTop: 20,
    fontSize: 16,
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
});
