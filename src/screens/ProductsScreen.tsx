import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { usePermissions } from '../hooks/usePermissions';
import { useSubscription } from '../hooks/useSubscription';
import { LimitWarning } from '../components/FeatureGate';
import { formatCurrency, generateId } from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { useTheme } from '../hooks/useTheme';

export default function ProductsScreen({ navigation }: any) {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const { permissions } = usePermissions();
  const { checkFeatureLimit } = useSubscription();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: '',
    cost: '',
    stock: '',
    category: '',
  });
  
  // State untuk status message yang muncul di screen
  const [searchStatus, setSearchStatus] = useState<{
    show: boolean;
    type: 'success' | 'info' | 'warning';
    title: string;
    message: string;
  } | null>(null);
  
  const barcodeInputRef = useRef<TextInput>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const lastBarcodeLength = useRef(0);
  const lastSearchedBarcode = useRef<string>(''); // NEW: Track last searched barcode
  const searchInputRef = useRef<TextInput>(null); // NEW: Ref untuk search bar

  // Format number with thousand separator
  const formatNumber = (value: string): string => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, '');
    // Add thousand separator
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parse formatted number back to plain number
  const parseFormattedNumber = (value: string): string => {
    return value.replace(/,/g, '');
  };

  // Fungsi untuk search produk berdasarkan barcode
  const searchProductByBarcode = (barcode: string, forceSearch: boolean = false) => {
    console.log('🔍 searchProductByBarcode called with:', barcode, 'Force:', forceSearch);
    console.log('📦 Total products:', products.length);
    
    // CRITICAL FIX: Prevent duplicate search untuk barcode yang sama (kecuali force)
    if (!forceSearch && lastSearchedBarcode.current === barcode) {
      console.log('⏭️ Skipping duplicate search for:', barcode);
      return;
    }
    
    if (!barcode || barcode.length < 8) {
      console.log('⚠️ BARCODE TERLALU PENDEK - Barcode minimal 8 digit');
      setSearchStatus({
        show: true,
        type: 'warning',
        title: '⚠️ Barcode Terlalu Pendek',
        message: `Barcode minimal 8 digit. Saat ini: ${barcode.length} digit`
      });
      // Auto hide after 5 seconds
      setTimeout(() => setSearchStatus(null), 5000);
      return;
    }

    // Mark this barcode as searched
    lastSearchedBarcode.current = barcode;
    setIsSearching(true);
    
    const existingProduct = products.find(p => p.barcode === barcode);
    console.log('🔎 Search result:', existingProduct ? 'FOUND' : 'NOT FOUND');
    
    if (existingProduct) {
      // Produk ditemukan! Auto-fill semua data
      setFormData({
        name: existingProduct.name,
        barcode: existingProduct.barcode || '',
        price: formatNumber(existingProduct.price.toString()),
        cost: formatNumber(existingProduct.cost.toString()),
        stock: existingProduct.stock.toString(),
        category: existingProduct.category,
      });
      setEditingProduct(existingProduct);
      
      // STATUS: Produk ditemukan - Muncul di screen
      console.log('✅ PRODUK DITEMUKAN!', existingProduct.name, formatCurrency(existingProduct.price));
      setSearchStatus({
        show: true,
        type: 'success',
        title: '✅ Produk Ditemukan!',
        message: `${existingProduct.name} - ${formatCurrency(existingProduct.price)} - Stok: ${existingProduct.stock}`
      });
      // Auto hide after 5 seconds
      setTimeout(() => setSearchStatus(null), 5000);
    } else {
      // Produk tidak ditemukan, ini produk baru
      console.log('ℹ️ PRODUK BARU - Barcode:', barcode, 'Panjang:', barcode.length, 'digit');
      
      // STATUS: Produk tidak ditemukan - Muncul di screen
      setSearchStatus({
        show: true,
        type: 'info',
        title: 'ℹ️ Produk Belum Ada',
        message: `Barcode ${barcode} belum ada di data. Silakan isi data produk baru.`
      });
      // Auto hide after 5 seconds
      setTimeout(() => setSearchStatus(null), 5000);
    }
    
    setIsSearching(false);
  };

  // Monitor perubahan barcode untuk auto-search dengan delay lebih lama
  useEffect(() => {
    // Hanya auto-search jika barcode berubah dan bukan sedang edit
    if (formData.barcode && formData.barcode.length >= 8 && !editingProduct) {
      // Cek apakah barcode berhenti bertambah (scanner selesai)
      if (formData.barcode.length === lastBarcodeLength.current) {
        return; // Tidak ada perubahan, skip
      }
      
      lastBarcodeLength.current = formData.barcode.length;
      
      // Clear timeout sebelumnya
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      
      // Tunggu 500ms (lebih lama) untuk memastikan scanner selesai mengirim semua digit
      scanTimeoutRef.current = setTimeout(() => {
        searchProductByBarcode(formData.barcode);
      }, 500);
    }
    
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [formData.barcode, products, editingProduct]);

  // CRITICAL: Auto-focus search bar saat screen dibuka
  useFocusEffect(
    useCallback(() => {
      // Delay sedikit untuk memastikan screen sudah fully rendered
      const focusTimeout = setTimeout(() => {
        if (searchInputRef.current && !showModal) {
          searchInputRef.current.focus();
          console.log('🎯 Search bar auto-focused! Ready for scanner input.');
        }
      }, 300);

      return () => {
        clearTimeout(focusTimeout);
      };
    }, [showModal])
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.includes(searchQuery) // Support barcode search
  );
  
  // Auto-search dengan barcode scanner di search bar (main screen)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputTimeRef = useRef<number>(Date.now());
  const lastSearchQuery = useRef<string>('');
  const searchQueryLengthRef = useRef<number>(0);
  const previousSearchLength = useRef<number>(0);
  const [isSearchBarScanning, setIsSearchBarScanning] = useState(false);
  
  useEffect(() => {
    // Skip jika search query kosong
    if (!searchQuery || searchQuery.trim().length === 0) {
      searchQueryLengthRef.current = 0;
      lastSearchQuery.current = '';
      setIsSearchBarScanning(false);
      return;
    }
    
    // Deteksi barcode scanner: input cepat dengan panjang minimal 4 digit
    const isLikelyBarcode = /^\d{4,}$/.test(searchQuery);
    
    if (isLikelyBarcode) {
      setIsSearchBarScanning(true);
      
      // CRITICAL FIX: Cek apakah ini barcode baru (bukan yang sama dengan sebelumnya)
      const isNewBarcode = searchQuery !== lastSearchQuery.current;
      
      // Cek apakah panjang berubah (scanner masih mengirim data) ATAU ini barcode baru
      if (searchQuery.length !== searchQueryLengthRef.current || isNewBarcode) {
        searchQueryLengthRef.current = searchQuery.length;
        
        // Clear timeout sebelumnya
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        
        // Tunggu 300ms untuk memastikan scanner selesai
        // Produk sudah langsung muncul di list karena filteredProducts otomatis update!
        searchTimeoutRef.current = setTimeout(() => {
          // Cek apakah ada exact match dengan barcode
          const exactMatch = products.find(p => p.barcode === searchQuery);
          
          if (exactMatch) {
            console.log('✅ Barcode exact match found:', exactMatch.name);
            console.log('🎯 Product automatically displayed in list!');
            lastSearchQuery.current = searchQuery;
            

          } else {
            console.log('❌ Barcode not found:', searchQuery);
            console.log('📋 Showing', filteredProducts.length, 'partial matches');
            lastSearchQuery.current = searchQuery;
          }
          
          setIsSearchBarScanning(false);
        }, 300);
      }
    } else {
      // Bukan barcode, reset
      setIsSearchBarScanning(false);
      searchQueryLengthRef.current = 0;
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, products]);

  const handleOpenModal = (product?: Product) => {
    // CRITICAL FIX: Reset last searched barcode ketika buka modal
    lastSearchedBarcode.current = '';
    lastBarcodeLength.current = 0;
    
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        barcode: product.barcode || '',
        price: formatNumber(product.price.toString()),
        cost: formatNumber(product.cost.toString()),
        stock: product.stock.toString(),
        category: product.category,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        barcode: '',
        price: '',
        cost: '',
        stock: '',
        category: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.stock) {
      Alert.alert('Error', 'Nama, harga, dan stok harus diisi');
      return;
    }

    // Check limit jika tambah produk baru (bukan edit)
    if (!editingProduct) {
      const { allowed, limit } = checkFeatureLimit('maxProducts', products.length);
      
      if (!allowed) {
        Alert.alert(
          'Limit Tercapai',
          `Anda sudah mencapai limit ${limit} produk. Upgrade plan untuk menambah produk.`,
          [
            { text: 'Batal', style: 'cancel' },
            { text: 'Lihat Plan', onPress: () => navigation?.navigate('Billing') }
          ]
        );
        return;
      }
    }

    const productData = {
      name: formData.name,
      barcode: formData.barcode,
      price: parseFloat(parseFormattedNumber(formData.price)),
      cost: parseFloat(parseFormattedNumber(formData.cost)) || 0,
      stock: parseInt(formData.stock),
      category: formData.category || 'Umum',
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      const newProduct: Product = {
        ...productData,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addProduct(newProduct);
    }

    setShowModal(false);
    
    // Re-focus search bar setelah modal ditutup
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        console.log('🎯 Search bar re-focused after modal close');
      }
    }, 300);
  };

  const handleDelete = (product: Product) => {
    console.log('🗑️ Delete button clicked for:', product.name, 'ID:', product.id);
    
    // Gunakan window.confirm untuk web (lebih reliable)
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `🗑️ HAPUS PRODUK\n\n` +
        `Yakin ingin menghapus produk ini?\n\n` +
        `Nama: ${product.name}\n` +
        `Barcode: ${product.barcode || '-'}\n` +
        `Harga: ${formatCurrency(product.price)}\n` +
        `Stok: ${product.stock}\n\n` +
        `⚠️ Tindakan ini tidak dapat dibatalkan!`
      );
      
      if (confirmed) {
        console.log('✅ Delete confirmed, deleting product:', product.id);
        deleteProduct(product.id);
        
        // Success message
        setTimeout(() => {
          window.alert(`✅ BERHASIL\n\nProduk "${product.name}" telah dihapus`);
        }, 100);
      } else {
        console.log('❌ Delete cancelled by user');
      }
    } else {
      // Untuk mobile, gunakan Alert.alert
      Alert.alert(
        '🗑️ Hapus Produk',
        `Yakin ingin menghapus produk ini?\n\nNama: ${product.name}\nBarcode: ${product.barcode || '-'}\nHarga: ${formatCurrency(product.price)}\nStok: ${product.stock}\n\n⚠️ Tindakan ini tidak dapat dibatalkan!`,
        [
          { 
            text: 'Batal', 
            style: 'cancel',
            onPress: () => console.log('Delete cancelled')
          },
          { 
            text: 'Hapus', 
            style: 'destructive', 
            onPress: () => {
              console.log('Deleting product:', product.id, product.name);
              deleteProduct(product.id);
              Alert.alert(
                '✅ Berhasil',
                `Produk "${product.name}" telah dihapus`,
                [{ text: 'OK' }]
              );
            }
          },
        ]
      );
    }
  };



  const ProductItem = ({ item }: { item: Product }) => (
    <View style={[styles.productItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.productCategory, { color: colors.textSecondary }]}>{item.category}</Text>
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
        <Text style={[styles.productStock, { color: colors.textSecondary }]}>Stok: {item.stock}</Text>
      </View>
      {permissions?.canManageProducts && (
        <View style={styles.productActions}>
          <TouchableOpacity 
            onPress={() => handleOpenModal(item)}
            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={24} color="#DC143C" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              console.log('🖱️ Delete button pressed for:', item.name);
              handleDelete(item);
            }} 
            style={[styles.actionButton, styles.deleteButton]}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={[
          styles.searchContainer, 
          { 
            backgroundColor: colors.background, 
            borderColor: isSearchBarScanning ? '#DC143C' : colors.border,
            borderWidth: isSearchBarScanning ? 2 : 1
          }
        ]}>
          <Ionicons 
            name={isSearchBarScanning ? "barcode-outline" : "search"} 
            size={20} 
            color={isSearchBarScanning ? '#DC143C' : colors.textSecondary} 
          />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={isSearchBarScanning ? "📡 Scanning..." : "🔍 Scan barcode atau cari produk..."}
            placeholderTextColor={isSearchBarScanning ? '#DC143C' : colors.textSecondary}
            value={searchQuery}
            onChangeText={(text) => {
              const now = Date.now();
              const timeSinceLastInput = now - lastInputTimeRef.current;
              
              console.log('🔍 Search input:', text, 'Length:', text.length, 'Gap:', timeSinceLastInput, 'ms');
              
              // CRITICAL: Detect scan baru - jika gap > 500ms dan ada barcode lama, clear!
              if (timeSinceLastInput > 500 && lastSearchQuery.current.length >= 4) {
                console.log('🆕 NEW SCAN DETECTED! Gap:', timeSinceLastInput, 'ms - Clearing:', lastSearchQuery.current);
                // Clear semua untuk scan baru
                lastSearchQuery.current = '';
                searchQueryLengthRef.current = 0;
                previousSearchLength.current = 0;
                // Set hanya text baru (digit pertama dari scan baru)
                setSearchQuery(text);
                lastInputTimeRef.current = now;
                return; // Exit early
              }
              
              // Update lastSearchQuery saat barcode lengkap
              if (text.length >= 4) {
                lastSearchQuery.current = text;
              }
              
              setSearchQuery(text);
              previousSearchLength.current = text.length;
              lastInputTimeRef.current = now;
            }}
            autoFocus={false}
            returnKeyType="search"
            selectTextOnFocus={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              console.log('🧹 Clear button clicked - resetting all refs');
              setSearchQuery('');
              setIsSearchBarScanning(false);
              searchQueryLengthRef.current = 0;
              lastSearchQuery.current = '';
              // Re-focus search bar untuk scan berikutnya
              setTimeout(() => {
                if (searchInputRef.current) {
                  searchInputRef.current.focus();
                  console.log('🎯 Search bar re-focused after clear');
                }
              }, 100);
            }}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {permissions?.canManageProducts && (
          <>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: '#FF9800', marginRight: 8 }]} 
              onPress={() => {
                console.log('🔘 Restock button pressed in ProductsScreen');
                console.log('📍 Navigation object:', navigation);
                if (navigation) {
                  navigation.navigate('Restock');
                } else {
                  console.error('❌ Navigation is undefined!');
                }
              }}
            >
              <Ionicons name="cube-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.addButton, styles.imageButton]} 
              onPress={() => {
                navigation?.navigate('ImageTest');
              }}
            >
              <Ionicons name="qr-code-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Limit Warning */}
      <LimitWarning 
        limitType="maxProducts" 
        currentCount={products.length}
        warningThreshold={80}
      />

      {/* Search Results Indicator */}
      {searchQuery && (
        <View style={[styles.searchResultsBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons 
            name={filteredProducts.length > 0 ? "checkmark-circle" : "alert-circle"} 
            size={18} 
            color={filteredProducts.length > 0 ? "#4CAF50" : "#FF9800"} 
          />
          <Text style={[styles.searchResultsText, { color: colors.text }]}>
            {filteredProducts.length > 0 
              ? `✅ ${filteredProducts.length} produk ditemukan` 
              : `⚠️ Tidak ada produk dengan barcode/nama "${searchQuery}"`
            }
          </Text>
        </View>
      )}

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductItem item={item} />}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk'}
          </Text>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalFullScreen, { backgroundColor: colors.background }]} edges={['top']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidFull}
          >
            <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
              <TouchableOpacity onPress={() => {
                Keyboard.dismiss();
                setShowModal(false);
                // Re-focus search bar setelah modal ditutup
                setTimeout(() => {
                  if (searchInputRef.current) {
                    searchInputRef.current.focus();
                    console.log('🎯 Search bar re-focused after modal close (back button)');
                  }
                }, 300);
              }} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
              </Text>
              <View style={styles.backButton} />
            </View>

            {/* Status Message - Muncul di screen */}
            {searchStatus && searchStatus.show && (
              <View style={[
                styles.statusMessage,
                searchStatus.type === 'success' && styles.statusSuccess,
                searchStatus.type === 'info' && styles.statusInfo,
                searchStatus.type === 'warning' && styles.statusWarning,
              ]}>
                <View style={styles.statusHeader}>
                  <Text style={styles.statusTitle}>{searchStatus.title}</Text>
                  <TouchableOpacity onPress={() => setSearchStatus(null)}>
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.statusText}>{searchStatus.message}</Text>
              </View>
            )}

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalContent}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="Nama Produk *"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  returnKeyType="next"
                />

                {/* Barcode Input with Actions */}
                <View style={styles.barcodeContainer}>
                  <View style={styles.barcodeInputWrapper}>
                    <TextInput
                      ref={barcodeInputRef}
                      style={[styles.input, styles.barcodeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, isSearching && styles.barcodeInputSearching]}
                      placeholder="🔍 Scan barcode dengan scanner hardware..."
                      placeholderTextColor={colors.textSecondary}
                      value={formData.barcode}
                      onChangeText={(text) => {
                        console.log('Barcode input:', text, 'Length:', text.length);
                        setFormData({ ...formData, barcode: text });
                      }}
                      onSubmitEditing={() => {
                        // Scanner mengirim Enter, langsung search
                        console.log('Enter pressed! Barcode:', formData.barcode);
                        if (formData.barcode && formData.barcode.length >= 8) {
                          searchProductByBarcode(formData.barcode);
                        }
                      }}
                      keyboardType="default"
                      returnKeyType="search"
                      autoFocus={!editingProduct}
                      editable={!isSearching}
                      maxLength={20}
                      blurOnSubmit={false}
                    />
                    {isSearching && (
                      <View style={styles.searchingIndicator}>
                        <Text style={styles.searchingText}>Mencari...</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.barcodeActions}>
                    <TouchableOpacity
                      style={[
                        styles.barcodeButton, 
                        styles.barcodeButtonPrimary,
                        (isSearching || !formData.barcode) && styles.barcodeButtonDisabled
                      ]}
                      onPress={() => {
                        console.log('🖱️ Cari Produk button clicked!');
                        console.log('📝 Current barcode:', formData.barcode);
                        console.log('🔄 isSearching:', isSearching);
                        
                        if (!formData.barcode) {
                          Alert.alert(
                            '⚠️ Barcode Kosong',
                            'Silakan scan atau ketik barcode terlebih dahulu',
                            [{ text: 'OK' }]
                          );
                          return;
                        }
                        
                        if (formData.barcode.length < 8) {
                          Alert.alert(
                            '⚠️ Barcode Terlalu Pendek',
                            `Barcode minimal 8 digit. Saat ini: ${formData.barcode.length} digit`,
                            [{ text: 'OK' }]
                          );
                          return;
                        }
                        
                        // FORCE SEARCH: Klik manual button harus selalu search
                        searchProductByBarcode(formData.barcode, true);
                      }}
                      disabled={isSearching || !formData.barcode}
                    >
                      <Ionicons name="search-outline" size={20} color="#fff" />
                      <Text style={styles.barcodeButtonTextPrimary}>
                        {isSearching ? 'Mencari...' : 'Cari Produk'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.barcodeActions}>
                    <TouchableOpacity
                      style={styles.barcodeButton}
                      onPress={() => {
                        // Generate random barcode (13 digits - EAN-13 format)
                        const randomBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
                        setFormData({ ...formData, barcode: randomBarcode });
                        console.log('✅ Barcode Dibuat:', randomBarcode);
                      }}
                      disabled={isSearching}
                    >
                      <Ionicons name="create-outline" size={20} color="#DC143C" />
                      <Text style={[styles.barcodeButtonText, { color: colors.text }]}>Generate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.barcodeButton}
                      onPress={() => {
                        // Clear semua form untuk scan produk baru
                        setFormData({
                          name: '',
                          barcode: '',
                          price: '',
                          cost: '',
                          stock: '',
                          category: '',
                        });
                        setEditingProduct(null);
                        lastBarcodeLength.current = 0;
                        setTimeout(() => barcodeInputRef.current?.focus(), 100);
                      }}
                      disabled={isSearching}
                    >
                      <Ionicons name="refresh-outline" size={20} color="#DC143C" />
                      <Text style={[styles.barcodeButtonText, { color: colors.text }]}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  💡 Scan barcode → Klik "Cari Produk" atau tunggu 0.5 detik untuk auto-search
                </Text>
                {formData.barcode && (
                  <Text style={[styles.barcodeInfo, { color: colors.textSecondary }]}>
                    📊 Barcode: {formData.barcode} ({formData.barcode.length} digit)
                  </Text>
                )}

                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="Kategori"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.category}
                  onChangeText={(text) => setFormData({ ...formData, category: text })}
                  returnKeyType="next"
                />

                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="Harga Jual * (contoh: 5,000,000)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={formData.price}
                  onChangeText={(text) => {
                    const formatted = formatNumber(text);
                    setFormData({ ...formData, price: formatted });
                  }}
                  returnKeyType="next"
                />

                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="Harga Modal (contoh: 3,500,000)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={formData.cost}
                  onChangeText={(text) => {
                    const formatted = formatNumber(text);
                    setFormData({ ...formData, cost: formatted });
                  }}
                  returnKeyType="next"
                />

                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="Stok *"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={formData.stock}
                  onChangeText={(text) => setFormData({ ...formData, stock: text })}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowModal(false);
                      // Re-focus search bar setelah modal ditutup
                      setTimeout(() => {
                        if (searchInputRef.current) {
                          searchInputRef.current.focus();
                          console.log('🎯 Search bar re-focused after modal close (cancel button)');
                        }
                      }, 300);
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Batal</Text>
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
  imageButton: {
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  productItem: {
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    elevation: 2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  productCategory: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 14,
    color: '#999',
  },
  productActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  deleteButton: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
    zIndex: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
    fontSize: 16,
  },
  searchResultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
  },
  searchResultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
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
  statusMessage: {
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 2,
  },
  statusSuccess: {
    backgroundColor: '#4CAF50',
    borderColor: '#45a049',
  },
  statusInfo: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  statusWarning: {
    backgroundColor: '#FF9800',
    borderColor: '#F57C00',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
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
  barcodeContainer: {
    marginBottom: 0,
  },
  barcodeInputWrapper: {
    position: 'relative',
  },
  barcodeInput: {
    marginBottom: 10,
  },
  barcodeInputSearching: {
    borderColor: '#DC143C',
    borderWidth: 2,
  },
  searchingIndicator: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: '#DC143C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  searchingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  barcodeActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  barcodeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC143C20',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DC143C',
    gap: 8,
  },
  barcodeButtonText: {
    color: '#DC143C',
    fontSize: 14,
    fontWeight: '600',
  },
  barcodeButtonPrimary: {
    backgroundColor: '#DC143C',
    marginBottom: 10,
  },
  barcodeButtonDisabled: {
    backgroundColor: '#666',
    borderColor: '#666',
    opacity: 0.5,
  },
  barcodeButtonTextPrimary: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  barcodeInfo: {
    fontSize: 12,
    color: '#DC143C',
    marginTop: 8,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
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
