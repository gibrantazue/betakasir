import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { RestockRequest, RestockItem } from '../types/restock';
import { restockService } from '../services/restockService';
import { Product } from '../types';
import { useTheme } from '../hooks/useTheme';

export default function RestockScreen({ navigation }: any) {
  const { products, settings } = useStore();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Restock form state
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [notes, setNotes] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  
  // Action selection modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<RestockRequest | null>(null);

  // Filter products that need restock (stock <= 10)
  const lowStockProducts = useMemo(() => {
    return products
      .filter(p => p.stock <= 10)
      .filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.stock - b.stock);
  }, [products, searchQuery]);

  const handleRestockPress = (product: Product) => {
    setSelectedProduct(product);
    setRequestedQuantity('');
    setEstimatedCost(product.cost.toString());
    setNotes('');
    setShowRestockModal(true);
  };

  const handleCreateRestockRequest = () => {
    if (!selectedProduct) return;

    // Validation
    if (!supplierName.trim()) {
      Alert.alert('Error', 'Nama supplier harus diisi');
      return;
    }
    if (!supplierPhone.trim()) {
      Alert.alert('Error', 'No. WhatsApp supplier harus diisi');
      return;
    }
    if (!requestedQuantity || parseInt(requestedQuantity) <= 0) {
      Alert.alert('Error', 'Jumlah pesanan harus lebih dari 0');
      return;
    }

    const qty = parseInt(requestedQuantity);

    const restockItem: RestockItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      currentStock: selectedProduct.stock,
      requestedQuantity: qty,
      estimatedCost: 0, // Not needed for simple order
      notes: notes.trim() || undefined,
    };

    const restockRequest: RestockRequest = {
      id: `RST-${Date.now()}`,
      supplierName: supplierName.trim(),
      supplierPhone: supplierPhone.trim(),
      supplierAddress: supplierAddress.trim() || undefined,
      items: [restockItem],
      totalAmount: 0, // Not needed for simple order
      notes: requestNotes.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Close form modal and show action selection
    setShowRestockModal(false);
    setPendingRequest(restockRequest);
    setShowActionModal(true);
  };

  const handleExportPDF = async (request: RestockRequest) => {
    try {
      if (Platform.OS === 'web') {
        await restockService.exportToPDF(
          request,
          settings.storeName,
          settings.storeAddress,
          settings.storePhone
        );
        Alert.alert('Berhasil', 'Surat pesanan siap dicetak/disimpan sebagai PDF');
      } else {
        Alert.alert('Info', 'Export PDF hanya tersedia di versi web');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Gagal export PDF: ' + (error as Error).message);
    }
  };

  const handleCopyText = async (request: RestockRequest) => {
    try {
      const text = restockService.generateRestockLetter(
        request,
        settings.storeName,
        settings.storeAddress,
        settings.storePhone
      );
      
      // Copy to clipboard
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(text);
        Alert.alert('Berhasil', 'Surat pesanan berhasil dicopy ke clipboard!\n\nSekarang bisa paste ke WhatsApp, Email, atau platform lainnya.');
      } else {
        // For mobile, use Clipboard API
        const { Clipboard } = await import('react-native');
        Clipboard.setString(text);
        Alert.alert('Berhasil', 'Surat pesanan berhasil dicopy ke clipboard!\n\nSekarang bisa paste ke WhatsApp, Email, atau platform lainnya.');
      }
    } catch (error) {
      console.error('Error copying text:', error);
      Alert.alert('Error', 'Gagal copy text: ' + (error as Error).message);
    }
  };

  const handleSaveAsImage = async (request: RestockRequest) => {
    try {
      if (Platform.OS !== 'web') {
        Alert.alert('Info', 'Fitur Save as Image hanya tersedia di versi web.');
        return;
      }

      Alert.alert('Mohon Tunggu', 'Sedang membuat gambar...');
      
      await restockService.exportToPNG(
        request,
        settings.storeName,
        settings.storeAddress,
        settings.storePhone
      );
      
      Alert.alert('Berhasil', 'Gambar surat pesanan berhasil didownload!');
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Gagal save image: ' + (error as Error).message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>📦 Restock Produk</Text>
          <Text style={styles.headerSubtitle}>
            {lowStockProducts.length} produk perlu restock
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Cari produk..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Product List */}
      <ScrollView style={styles.productList}>
        {lowStockProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Semua produk stoknya aman!</Text>
          </View>
        ) : (
          lowStockProducts.map((product) => (
            <View key={product.id} style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.productInfo}>
                <View style={styles.stockBadge}>
                  <Ionicons 
                    name="warning" 
                    size={16} 
                    color={product.stock === 0 ? '#f44336' : '#ff9800'} 
                  />
                  <Text style={[
                    styles.stockText,
                    product.stock === 0 && styles.stockTextDanger
                  ]}>
                    {product.stock === 0 ? 'Habis' : `${product.stock} unit`}
                  </Text>
                </View>
                
                <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
                {product.barcode && (
                  <Text style={[styles.productBarcode, { color: colors.textSecondary }]}>Barcode: {product.barcode}</Text>
                )}
                <Text style={styles.productPrice}>
                  Harga: {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(product.price)}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.restockButton, { backgroundColor: colors.primary }]}
                onPress={() => handleRestockPress(product)}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.restockButtonText}>Restock</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Restock Modal */}
      <Modal
        visible={showRestockModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRestockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Buat Surat Pesanan</Text>
                <TouchableOpacity onPress={() => setShowRestockModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {selectedProduct && (
                <View style={[styles.selectedProductInfo, { backgroundColor: colors.background }]}>
                  <Text style={[styles.selectedProductName, { color: colors.text }]}>{selectedProduct.name}</Text>
                  <Text style={[styles.selectedProductStock, { color: colors.textSecondary }]}>
                    Stok saat ini: {selectedProduct.stock} unit
                  </Text>
                </View>
              )}

              {/* Supplier Info */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Informasi Supplier</Text>
              
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Nama Supplier *"
                value={supplierName}
                onChangeText={setSupplierName}
                placeholderTextColor={colors.textSecondary}
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="No. WhatsApp Supplier * (contoh: 628123456789)"
                value={supplierPhone}
                onChangeText={setSupplierPhone}
                keyboardType="phone-pad"
                placeholderTextColor={colors.textSecondary}
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Alamat Supplier (opsional)"
                value={supplierAddress}
                onChangeText={setSupplierAddress}
                placeholderTextColor={colors.textSecondary}
              />

              {/* Order Details */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Detail Pesanan</Text>

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Jumlah Pesanan *"
                value={requestedQuantity}
                onChangeText={setRequestedQuantity}
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />

              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Catatan untuk produk ini (opsional)"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textSecondary}
              />

              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Catatan tambahan untuk supplier (opsional)"
                value={requestNotes}
                onChangeText={setRequestNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textSecondary}
              />

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateRestockRequest}
              >
                <Ionicons name="document-text" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Buat Surat Pesanan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowRestockModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Batal</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Action Selection Modal */}
      <Modal
        visible={showActionModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.actionModalOverlay}>
          <View style={[styles.actionModalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.actionModalTitle, { color: colors.text }]}>Surat Pesanan Dibuat</Text>
            <Text style={[styles.actionModalSubtitle, { color: colors.textSecondary }]}>
              Pilih aksi yang ingin dilakukan:
            </Text>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowActionModal(false);
                if (pendingRequest) handleExportPDF(pendingRequest);
              }}
            >
              <Ionicons name="document-text-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Export PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => {
                setShowActionModal(false);
                if (pendingRequest) handleCopyText(pendingRequest);
              }}
            >
              <Ionicons name="copy-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Copy Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
              onPress={() => {
                setShowActionModal(false);
                if (pendingRequest) handleSaveAsImage(pendingRequest);
              }}
            >
              <Ionicons name="image-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Save as Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButtonCancel, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={[styles.actionButtonCancelText, { color: colors.textSecondary }]}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#DC143C',
    padding: 20,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  productList: {
    flex: 1,
    padding: 15,
  },
  productCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  productInfo: {
    flex: 1,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  stockText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  stockTextDanger: {
    color: '#f44336',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productBarcode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  restockButton: {
    backgroundColor: '#DC143C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  restockButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedProductInfo: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  selectedProductStock: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 10,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  totalContainer: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC143C',
  },
  createButton: {
    backgroundColor: '#DC143C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  actionModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonCancel: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
