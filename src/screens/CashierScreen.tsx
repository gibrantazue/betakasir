import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import { formatCurrency, generateId, calculateTotal } from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { Product, Transaction } from '../types';

import { useResponsive } from '../hooks/useResponsive';
import ShortcutGuide from '../components/ShortcutGuide';
import { useTheme } from '../hooks/useTheme';

export default function CashierScreen({ navigation }: any) {
  const { products, cart, addToCart, updateCartItem, removeFromCart, clearCart, addTransaction, currentUser, employeeSession, transactions } = useStore();
  const { isDesktop, isWeb } = useResponsive();
  const { checkFeatureLimit } = useSubscription();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod] = useState<'cash'>('cash'); // Hanya tunai
  const [cashReceived, setCashReceived] = useState('');
  
  // Format input uang dengan pemisah ribuan
  const formatCashInput = (text: string) => {
    // Hapus semua karakter non-digit
    const numbers = text.replace(/[^\d]/g, '');
    
    // Jika kosong, return empty
    if (!numbers) return '';
    
    // Format dengan pemisah ribuan
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  
  // Handle perubahan input uang
  const handleCashChange = (text: string) => {
    const formatted = formatCashInput(text);
    setCashReceived(formatted);
  };
  
  // Parse cash untuk perhitungan (hapus titik)
  const parseCash = (formattedCash: string): number => {
    return parseFloat(formattedCash.replace(/\./g, '')) || 0;
  };

  const [showShortcutGuide, setShowShortcutGuide] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const cashInputRef = useRef<TextInput>(null);

  const filteredProducts = products.filter((p) => {
    const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Untuk barcode: Selalu gunakan partial match untuk display
    // Auto-scan akan handle exact match detection
    const barcodeMatch = p.barcode?.includes(searchQuery);
    
    return nameMatch || barcodeMatch;
  });

  const total = calculateTotal(cart);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScannedBarcodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const isScanningRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false); // NEW: Flag untuk prevent processing saat add to cart

  // Auto-add produk ketika barcode selesai di-scan (hardware scanner)
  // DYNAMIC DETECTION: Support SEMUA panjang barcode (4, 5, 6, 7, 13 digit, dll)
  useEffect(() => {
    // CRITICAL FIX: Skip jika sedang processing add to cart
    if (isProcessingRef.current) {
      console.log('⏭️ Still processing previous scan, skipping...');
      return;
    }
    
    // CRITICAL FIX: Skip jika search query kosong (hasil dari clear)
    if (!searchQuery || searchQuery.trim().length === 0) {
      console.log('⏭️ Search query empty, skipping auto-scan');
      return;
    }
    
    // DYNAMIC DETECTION: Tunggu user berhenti mengetik, lalu cek apakah ada exact match
    // Support SEMUA panjang barcode (tidak ada minimum length)
    if (searchQuery.length >= 4) { // Minimum 4 digit untuk avoid false positive
      // Prevent duplicate scans (debounce 1 second)
      const now = Date.now();
      if (
        lastScannedBarcodeRef.current === searchQuery && 
        now - lastScanTimeRef.current < 1000
      ) {
        console.log('⏭️ Skipping duplicate scan:', searchQuery);
        return;
      }
      
      // Prevent concurrent scanning
      if (isScanningRef.current) {
        console.log('⏭️ Already scanning, skipping:', searchQuery);
        return;
      }
      
      // Clear timeout sebelumnya
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      
      // Tunggu 500ms untuk memastikan scan selesai
      scanTimeoutRef.current = setTimeout(() => {
        // DOUBLE CHECK: Pastikan tidak sedang processing
        if (isProcessingRef.current) {
          console.log('⏭️ Processing flag still active, aborting scan');
          return;
        }
        
        isScanningRef.current = true;
        isProcessingRef.current = true; // LOCK processing
        
        console.log('🔍 Searching for barcode:', searchQuery, 'Length:', searchQuery.length);
        
        // CRITICAL FIX: Simpan barcode yang sedang di-search SEBELUM clear
        const currentBarcode = searchQuery;
        
        // CLEAR SEARCH IMMEDIATELY untuk prevent scan berikutnya menggunakan barcode ini
        setSearchQuery('');
        console.log('🧹 Search cleared immediately to:', '""');
        
        // Cari produk dengan exact match barcode (gunakan currentBarcode, bukan searchQuery)
        const product = products.find(p => {
          const match = p.barcode === currentBarcode;
          if (match) {
            console.log(`  ✅ MATCH FOUND: ${p.name} (${p.barcode})`);
          }
          return match;
        });
        
        if (product) {
          console.log('✅ Product found:', product.name, 'Barcode:', product.barcode);
          
          // Update last scanned info
          lastScannedBarcodeRef.current = currentBarcode;
          lastScanTimeRef.current = Date.now();
          
          // Produk ditemukan, tambahkan ke cart
          handleAddToCart(product);
          
          console.log(`✅ Added to cart: ${product.name} (${currentBarcode})`);
        } else {
          console.log('❌ Product not found for barcode:', currentBarcode);
          console.log(`❌ Product not found: ${currentBarcode} (${currentBarcode.length} digit)`);
        }
        
        // Focus kembali ke search input untuk scan berikutnya
        setTimeout(() => {
          searchInputRef.current?.focus();
          isScanningRef.current = false;
          isProcessingRef.current = false; // UNLOCK processing
          console.log('✅ Ready for next scan - All flags cleared');
        }, 200); // Tambah delay untuk ensure state update
        
      }, 500);
    }
    
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [searchQuery, products]);

  // Keyboard shortcuts untuk desktop
  useEffect(() => {
    if (!isWeb) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Jangan handle shortcuts jika sedang mengetik di input
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Debug log for Ctrl shortcuts
      if (e.ctrlKey || e.metaKey) {
        console.log('⌨️ Ctrl/Cmd pressed:', e.key, '| isTyping:', isTyping);
      }

      // F1 - Shortcut Guide (selalu aktif)
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutGuide(true);
        return;
      }

      // Esc - Close modals
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showShortcutGuide) setShowShortcutGuide(false);
        else if (showPayment) setShowPayment(false);
        else if (showCart) setShowCart(false);
        return;
      }

      // Allow Ctrl/Cmd shortcuts even when typing
      if (isTyping && !e.ctrlKey && !e.metaKey && e.key !== 'Escape') {
        console.log('🚫 Blocked: typing without Ctrl');
        return;
      }

      // F1 - Show shortcut guide
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutGuide(!showShortcutGuide);
        return;
      }

      // F2 - Focus search
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // F3 - Focus search (alternative for barcode scanner)
      if (e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // F4 - View cart
      if (e.key === 'F4') {
        e.preventDefault();
        setShowCart(true);
        return;
      }

      // F5 - Clear search
      if (e.key === 'F5') {
        e.preventDefault();
        setSearchQuery('');
        searchInputRef.current?.focus();
        return;
      }

      // F8 - Checkout
      if (e.key === 'F8') {
        e.preventDefault();
        handleCheckout();
        return;
      }

      // + key - Increase quantity of first cart item
      if ((e.key === '+' || e.key === '=') && cart.length > 0 && !showPayment) {
        e.preventDefault();
        const firstItem = cart[0];
        updateCartItem(firstItem.product.id, firstItem.quantity + 1, firstItem.discount);
        return;
      }

      // - key - Decrease quantity of first cart item
      if (e.key === '-' && cart.length > 0 && !showPayment) {
        e.preventDefault();
        const firstItem = cart[0];
        if (firstItem.quantity > 1) {
          updateCartItem(firstItem.product.id, firstItem.quantity - 1, firstItem.discount);
        } else {
          removeFromCart(firstItem.product.id);
        }
        return;
      }

      // Delete key - Remove first cart item
      if (e.key === 'Delete' && cart.length > 0 && !showPayment) {
        e.preventDefault();
        const firstItem = cart[0];
        removeFromCart(firstItem.product.id);
        return;
      }

      // Payment method shortcuts removed (hanya tunai)

      // Ctrl+K - Clear cart
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        console.log('🎯 Ctrl+K pressed!');
        if (cart.length > 0) {
          if (Platform.OS === 'web') {
            const confirmed = window.confirm(
              '🗑️ KOSONGKAN KERANJANG\n\n' +
              `Total ${cart.length} item akan dihapus.\n\n` +
              'Yakin ingin melanjutkan?'
            );
            if (confirmed) {
              console.log('🗑️ Clearing cart via Ctrl+K');
              handleClearCart();
            }
          } else {
            Alert.alert(
              'Kosongkan Keranjang',
              'Yakin ingin menghapus semua item?',
              [
                { text: 'Batal', style: 'cancel' },
                { 
                  text: 'Hapus', 
                  onPress: () => {
                    console.log('🗑️ Clearing cart via Ctrl+K');
                    handleClearCart();
                  }, 
                  style: 'destructive' 
                },
              ]
            );
          }
        } else {
          console.log('⚠️ Cart is empty, nothing to clear');
        }
        return;
      }

      // Ctrl+S - Complete transaction
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        console.log('💾 Ctrl+S pressed!');
        console.log('📋 showPayment:', showPayment);
        console.log('💰 cashReceived:', cashReceived);
        console.log('💵 total:', total);
        
        if (showPayment) {
          console.log('✅ Completing transaction via Ctrl+S');
          handleCompleteTransaction();
        } else {
          console.log('⚠️ Payment modal not open, Ctrl+S ignored');
        }
        return;
      }

      // Enter - Add first product or confirm
      if (e.key === 'Enter' && !showPayment && !showCart) {
        e.preventDefault();
        
        // CRITICAL FIX: Jangan gunakan filteredProducts jika sedang processing
        if (isProcessingRef.current) {
          console.log('⏭️ Still processing, ignoring Enter key');
          return;
        }
        
        if (filteredProducts.length > 0 && searchQuery.trim().length > 0) {
          handleAddToCart(filteredProducts[0]);
          // Clear search setelah add
          setSearchQuery('');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up keyboard shortcuts');
      window.removeEventListener('keydown', handleKeyPress);
      
      // Clear any pending timeouts
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
      
      // Reset all scanning flags
      isScanningRef.current = false;
      isProcessingRef.current = false;
    };
  }, [isWeb, showCart, showPayment, showShortcutGuide, cart, filteredProducts, searchQuery]);

  // Handle clear cart dengan reset semua state
  const handleClearCart = () => {
    console.log('🗑️ Clearing cart and resetting all states');
    
    // Clear timeout jika ada
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    
    // Reset all scanning flags
    isScanningRef.current = false;
    isProcessingRef.current = false;
    
    // Clear search query
    setSearchQuery('');
    
    // Clear cart
    clearCart();
    
    // Focus kembali ke search input
    setTimeout(() => {
      searchInputRef.current?.focus();
      console.log('✅ Cart cleared, search reset, ready for next scan');
    }, 100);
  };

  // Handle update cart item dengan reset search
  const handleUpdateCartItem = (productId: string, quantity: number, discount: number) => {
    console.log('📝 Updating cart item:', productId, 'quantity:', quantity);
    
    // Clear timeout jika ada
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    
    // Reset all scanning flags
    isScanningRef.current = false;
    isProcessingRef.current = false;
    
    // Clear search query
    setSearchQuery('');
    
    // Update cart
    updateCartItem(productId, quantity, discount);
    
    // Focus kembali ke search input
    setTimeout(() => {
      searchInputRef.current?.focus();
      console.log('✅ Cart updated, search reset, ready for next scan');
    }, 100);
  };

  // Handle remove from cart dengan reset search
  const handleRemoveFromCart = (productId: string) => {
    console.log('🗑️ Removing item from cart:', productId);
    
    // Clear timeout jika ada
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    
    // Reset all scanning flags
    isScanningRef.current = false;
    isProcessingRef.current = false;
    
    // Clear search query
    setSearchQuery('');
    
    // Remove from cart
    removeFromCart(productId);
    
    // Focus kembali ke search input
    setTimeout(() => {
      searchInputRef.current?.focus();
      console.log('✅ Item removed, search reset, ready for next scan');
    }, 100);
  };



  const handleAddToCart = (product: Product) => {
    if (product.stock > 0) {
      addToCart(product, 1);
    } else {
      // FIXED: Tidak ada alert, langsung console log saja
      console.log('⚠️ STOK HABIS - Produk:', product.name, 'tidak tersedia');
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      // FIXED: Tidak ada alert, langsung console log saja
      console.log('⚠️ KERANJANG KOSONG - Tambahkan produk terlebih dahulu');
      return;
    }
    setShowCart(false);
    setShowPayment(true);
  };

  const handleCompleteTransaction = () => {
    const cash = parseCash(cashReceived);

    if (paymentMethod === 'cash' && cash < total) {
      // FIXED: Tidak ada alert, langsung console log saja
      console.log('⚠️ UANG TIDAK CUKUP - Jumlah uang yang diterima kurang dari total');
      return;
    }

    // Check monthly transaction limit
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTransactionCount = transactions.filter(t => 
      new Date(t.createdAt) >= startOfMonth
    ).length;

    const { allowed, limit } = checkFeatureLimit('maxTransactionsPerMonth', monthlyTransactionCount);
    
    if (!allowed) {
      Alert.alert(
        'Limit Transaksi Tercapai',
        `Anda sudah mencapai limit ${limit} transaksi bulan ini. Upgrade plan untuk transaksi unlimited.`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Lihat Plan', onPress: () => navigation?.navigate('Billing') }
        ]
      );
      return;
    }

    // Get cashier ID: prioritize employee session, fallback to current user
    const cashierId = employeeSession?.employeeId || employeeSession?.employee?.employeeId || currentUser?.id || 'unknown';
    
    const transaction: Transaction = {
      id: generateId(),
      items: cart,
      total,
      discount: 0,
      tax: 0,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? cash : undefined,
      change: paymentMethod === 'cash' ? cash - total : undefined,
      cashierId: cashierId,
      createdAt: new Date().toISOString(),
    };

    addTransaction(transaction);

    // Update stock
    cart.forEach((item) => {
      const product = products.find((p) => p.id === item.product.id);
      if (product) {
        useStore.getState().updateProduct(product.id, {
          stock: product.stock - item.quantity,
        });
      }
    });

    // Clear cart dengan reset state
    handleClearCart();
    setShowPayment(false);
    setCashReceived('');

    // Log transaksi
    console.log(`✅ Transaction completed: Total ${formatCurrency(total)}, Change ${formatCurrency(transaction.change || 0)}`);
    
    // CETAK STRUK OTOMATIS
    setTimeout(async () => {
      const { printReceipt } = await import('../utils/printReceipt');
      const storeSettings = useStore.getState().settings;
      const settings = {
        storeName: storeSettings.storeName || 'BETA KASIR',
        storeAddress: storeSettings.storeAddress || 'Jl. Contoh No. 123, Jakarta',
        storePhone: storeSettings.storePhone || 'Telp: 021-12345678',
        receiptFooter: 'Terima Kasih Atas Kunjungan Anda'
      };
      
      const printed = await printReceipt(transaction, settings);
      if (printed) {
        console.log('🖨️ Receipt printed successfully');
      } else {
        console.log('⚠️ Failed to print receipt');
      }
    }, 500);
  };

  const CartItem = ({ item }: any) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemLeft}>
        <Text style={styles.cartItemName} numberOfLines={1}>{item.product.name}</Text>
        <Text style={styles.cartItemPrice}>{formatCurrency(item.product.price)} × {item.quantity}</Text>
      </View>
      <View style={styles.cartItemRight}>
        <View style={styles.cartItemActions}>
          <TouchableOpacity
            onPress={() => {
              if (item.quantity > 1) {
                handleUpdateCartItem(item.product.id, item.quantity - 1, item.discount);
              } else {
                handleRemoveFromCart(item.product.id);
              }
            }}
            style={styles.quantityButton}
          >
            <Ionicons name="remove" size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.cartItemQuantity}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => {
              if (item.quantity < item.product.stock) {
                handleUpdateCartItem(item.product.id, item.quantity + 1, item.discount);
              }
            }}
            style={styles.quantityButton}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.cartItemTotal}>
          {formatCurrency(item.product.price * item.quantity)}
        </Text>
      </View>
    </View>
  );

  // Desktop layout
  if (isDesktop) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Desktop Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Kasir POS</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setShowShortcutGuide(true)}
              style={styles.shortcutButton}
            >
              <Ionicons name="keypad-outline" size={20} color="#fff" />
              <Text style={styles.shortcutButtonText}>F1 - Shortcuts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Desktop Layout - 2 Columns */}
        <View style={styles.desktopLayout}>
          {/* Left Column - Products */}
          <View style={styles.desktopLeft}>
            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons 
                name={searchQuery.length > 0 ? "barcode" : "search"} 
                size={20} 
                color={searchQuery.length > 0 ? "#DC143C" : colors.textSecondary} 
              />
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={searchQuery.length === 0 ? "✅ Siap scan barcode... (F2)" : "Scanning..."}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={(text) => {
                  console.log('📝 Search input changed:', text, 'Length:', text.length);
                  setSearchQuery(text);
                }}
                autoFocus
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => {
                  console.log('🔄 Manual clear search');
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}>
                  <Ionicons name="close-circle" size={20} color="#DC143C" />
                </TouchableOpacity>
              ) : (
                <View style={styles.readyIndicator}>
                  <Text style={styles.readyText}>READY</Text>
                </View>
              )}
            </View>

            {/* Products Grid */}
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.desktopProductList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.desktopProductCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleAddToCart(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.productHeader}>
                    <View style={[styles.stockBadge, item.stock < 10 && styles.stockBadgeLow]}>
                      <Text style={styles.stockBadgeText}>{item.stock}</Text>
                    </View>
                  </View>
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                  {item.barcode && (
                    <Text style={[styles.productBarcode, { color: colors.textSecondary }]} numberOfLines={1}>{item.barcode}</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyProducts}>
                  <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyProductsText, { color: colors.textSecondary }]}>Produk tidak ditemukan</Text>
                </View>
              }
            />
          </View>

          {/* Right Column - Cart */}
          <View style={[styles.desktopRight, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cartHeader}>
              <Text style={[styles.cartTitle, { color: colors.text }]}>Keranjang Belanja</Text>
              {cart.length > 0 && (
                <TouchableOpacity onPress={() => {
                  if (Platform.OS === 'web') {
                    const confirmed = window.confirm('Yakin ingin menghapus semua item dari keranjang?');
                    if (confirmed) {
                      handleClearCart();
                    }
                  } else {
                    Alert.alert(
                      'Kosongkan Keranjang',
                      'Yakin ingin menghapus semua item?',
                      [
                        { text: 'Batal', style: 'cancel' },
                        { text: 'Hapus', onPress: handleClearCart, style: 'destructive' },
                      ]
                    );
                  }
                }} style={styles.clearCartButton}>
                  <Ionicons name="trash-outline" size={18} color="#DC143C" />
                  <Text style={styles.clearCartText}>Ctrl+K</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Cart Items */}
            <FlatList
              data={cart}
              keyExtractor={(item) => item.product.id}
              contentContainerStyle={styles.desktopCartList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[styles.desktopCartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cartItemTop}>
                    <Text style={[styles.cartItemName, { color: colors.text }]} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveFromCart(item.product.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close" size={18} color="#DC143C" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cartItemBottom}>
                    <Text style={[styles.cartItemPrice, { color: colors.textSecondary }]}>
                      {formatCurrency(item.product.price)}
                    </Text>
                    <View style={styles.cartItemActions}>
                      <TouchableOpacity
                        onPress={() => {
                          if (item.quantity > 1) {
                            handleUpdateCartItem(item.product.id, item.quantity - 1, item.discount);
                          } else {
                            handleRemoveFromCart(item.product.id);
                          }
                        }}
                        style={styles.quantityButton}
                      >
                        <Ionicons name="remove" size={14} color="#fff" />
                      </TouchableOpacity>
                      <Text style={[styles.cartItemQuantity, { color: colors.text }]}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          if (item.quantity < item.product.stock) {
                            handleUpdateCartItem(item.product.id, item.quantity + 1, item.discount);
                          }
                        }}
                        style={styles.quantityButton}
                      >
                        <Ionicons name="add" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.cartItemTotal}>
                      {formatCurrency(item.product.price * item.quantity)}
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyCart}>
                  <Ionicons name="cart-outline" size={64} color={colors.textSecondary} />
                  <Text style={[styles.emptyCartText, { color: colors.textSecondary }]}>Keranjang kosong</Text>
                  <Text style={[styles.emptyCartSubtext, { color: colors.textSecondary }]}>
                    Scan barcode atau pilih produk
                  </Text>
                </View>
              }
            />

            {/* Cart Footer */}
            {cart.length > 0 && (
              <View style={[styles.desktopCartFooter, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                  <Text style={[styles.totalAmount, { color: colors.text }]}>{formatCurrency(total)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabelMain, { color: colors.text }]}>TOTAL</Text>
                  <Text style={[styles.totalAmountMain, { color: colors.text }]}>{formatCurrency(total)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.desktopCheckoutButton}
                  onPress={handleCheckout}
                  activeOpacity={0.8}
                >
                  <Ionicons name="card-outline" size={20} color="#fff" />
                  <Text style={styles.desktopCheckoutText}>Proses Pembayaran</Text>
                  <Text style={styles.desktopCheckoutShortcut}>F8</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Shortcut Guide Modal */}
        <ShortcutGuide
          visible={showShortcutGuide}
          onClose={() => setShowShortcutGuide(false)}
        />

        {/* Payment Modal - Desktop Version */}
        <Modal visible={showPayment} animationType="fade" transparent={false}>
          <View style={[styles.paymentModalContainer, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" backgroundColor={colors.surface} />
            <ScrollView
              contentContainerStyle={styles.paymentModalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.paymentModalContent}>
                <View style={[styles.paymentModalHeader, { paddingTop: insets.top + 16 }]}>
                  <TouchableOpacity
                    onPress={() => setShowPayment(false)}
                    style={styles.backButton}
                  >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.paymentModalTitle}>Pembayaran</Text>
                  <View style={styles.backButton} />
                </View>

                <View style={[styles.modalTotal, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.modalTotalLabel, { color: colors.textSecondary }]}>Total Pembayaran</Text>
                  <Text
                    style={styles.modalTotalAmount}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {formatCurrency(total)}
                  </Text>
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Pembayaran Tunai</Text>
                {/* Hanya metode tunai - UI disederhanakan */}
                {true && (
                  <View style={styles.cashSection}>
                    <Text style={[styles.label, { color: colors.text }]}>Uang Diterima</Text>
                    <TextInput
                      ref={cashInputRef}
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      placeholder="Ketik nominal: 150000"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={cashReceived}
                      onChangeText={handleCashChange}
                      autoFocus
                    />
                    
                    {/* Quick Cash Buttons */}
                    <View style={styles.quickCashContainer}>
                      <Text style={[styles.quickCashLabel, { color: colors.text }]}>💵 Nominal Cepat:</Text>
                      <View style={styles.quickCashButtons}>
                        {[10000, 20000, 50000, 100000].map((amount) => (
                          <TouchableOpacity
                            key={amount}
                            style={[styles.quickCashButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => {
                              const formatted = formatCashInput(amount.toString());
                              setCashReceived(formatted);
                            }}
                          >
                            <Text style={styles.quickCashButtonText}>
                              {formatCurrency(amount)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TouchableOpacity
                        style={styles.exactAmountButton}
                        onPress={() => {
                          const formatted = formatCashInput(total.toString());
                          setCashReceived(formatted);
                        }}
                      >
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        <Text style={styles.exactAmountButtonText}>Uang Pas</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {cashReceived && parseCash(cashReceived) >= total && (
                      <View style={[styles.changeContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.changeLabel, { color: colors.textSecondary }]}>Kembalian</Text>
                        <Text style={styles.changeAmount}>
                          {formatCurrency(parseCash(cashReceived) - total)}
                        </Text>
                      </View>
                    )}
                    {cashReceived && parseCash(cashReceived) > 0 && parseCash(cashReceived) < total && (
                      <Text style={styles.errorText}>
                        Uang kurang {formatCurrency(total - parseCash(cashReceived))}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setShowPayment(false)}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Batal (Esc)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleCompleteTransaction}
                  >
                    <Text style={styles.confirmButtonText}>Selesaikan (Ctrl+S)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>


      </SafeAreaView>
    );
  }

  // Mobile layout (original)
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kasir</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowCart(true)}>
            <View style={styles.cartIconContainer}>
              <Ionicons name="cart" size={24} color="#fff" />
              {cart.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cart.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="🔍 Scan barcode atau cari produk..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={(text) => {
            console.log('📝 Search input changed:', text, 'Length:', text.length);
            setSearchQuery(text);
          }}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            Keyboard.dismiss();
          }}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => {
              Keyboard.dismiss();
              handleAddToCart(item);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.productHeader}>
              <View style={[styles.stockBadge, item.stock < 10 && styles.stockBadgeLow]}>
                <Text style={styles.stockBadgeText}>{item.stock}</Text>
              </View>
            </View>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
            <View style={styles.addButton}>
              <Ionicons name="add" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.floatingCartButton}
          onPress={() => setShowCart(true)}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartContent}>
            <View style={styles.floatingCartLeft}>
              <Ionicons name="cart" size={24} color="#fff" />
              <View style={styles.floatingCartBadge}>
                <Text style={styles.floatingCartBadgeText}>{cart.length}</Text>
              </View>
            </View>
            <Text style={styles.floatingCartText}>Lihat Keranjang</Text>
            <Text style={styles.floatingCartTotal}>{formatCurrency(total)}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal
        visible={showCart}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCart(false)}
      >
        <View style={styles.cartModal}>
          <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
          {/* Cart Header */}
          <View style={[styles.cartModalHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={() => setShowCart(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.cartModalTitle}>Keranjang ({cart.length})</Text>
            {cart.length > 0 ? (
              <TouchableOpacity onPress={() => {
                if (Platform.OS === 'web') {
                  const confirmed = window.confirm('Yakin ingin menghapus semua item dari keranjang?');
                  if (confirmed) {
                    handleClearCart();
                  }
                } else {
                  Alert.alert(
                    'Kosongkan Keranjang',
                    'Yakin ingin menghapus semua item?',
                    [
                      { text: 'Batal', style: 'cancel' },
                      { text: 'Hapus', onPress: handleClearCart, style: 'destructive' },
                    ]
                  );
                }
              }} style={styles.trashButton}>
                <Ionicons name="trash-outline" size={24} color="#DC143C" />
              </TouchableOpacity>
            ) : (
              <View style={styles.trashButton} />
            )}
          </View>

          {/* Cart Items */}
          <FlatList
            data={cart}
            keyExtractor={(item) => item.product.id}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <CartItem item={item} />}
            ListEmptyComponent={
              <View style={styles.emptyCartContainer}>
                <Ionicons name="cart-outline" size={80} color="#333" />
                <Text style={styles.emptyCartMobile}>Keranjang kosong</Text>
                <Text style={styles.emptyCartSubtextMobile}>Tambahkan produk untuk memulai</Text>
              </View>
            }
          />

          {/* Cart Footer */}
          {cart.length > 0 && (
            <View style={styles.cartFooter}>
              <View style={styles.cartTotalContainer}>
                <Text style={styles.cartTotalLabel}>Total</Text>
                <Text style={styles.cartTotalAmount}>{formatCurrency(total)}</Text>
              </View>
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={handleCheckout}
                activeOpacity={0.8}
              >
                <Ionicons name="card-outline" size={20} color="#fff" style={styles.checkoutIcon} />
                <Text style={styles.checkoutButtonText}>Proses Pembayaran</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPayment} animationType="slide" transparent={false}>
        <View style={styles.paymentModalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.paymentModalFlex}
          >
            <ScrollView
              contentContainerStyle={styles.paymentModalScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.paymentModalContent}>
                <View style={[styles.paymentModalHeader, { paddingTop: insets.top + 16 }]}>
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowPayment(false);
                    }}
                    style={styles.backButton}
                  >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.paymentModalTitle}>Pembayaran</Text>
                  <View style={styles.backButton} />
                </View>

                <View style={[styles.modalTotal, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.modalTotalLabel, { color: colors.textSecondary }]}>Total Pembayaran</Text>
                  <Text
                    style={styles.modalTotalAmount}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {formatCurrency(total)}
                  </Text>
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Pembayaran Tunai</Text>
                {/* Hanya metode tunai - UI disederhanakan */}
                {true && (
                  <View style={styles.cashSection}>
                    <Text style={[styles.label, { color: colors.text }]}>Uang Diterima</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                      placeholder="Ketik nominal: 150000"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      value={cashReceived}
                      onChangeText={handleCashChange}
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                    
                    {/* Quick Cash Buttons */}
                    <View style={styles.quickCashContainer}>
                      <Text style={[styles.quickCashLabel, { color: colors.text }]}>💵 Nominal Cepat:</Text>
                      <View style={styles.quickCashButtons}>
                        {[10000, 20000, 50000, 100000].map((amount) => (
                          <TouchableOpacity
                            key={amount}
                            style={[styles.quickCashButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => {
                              const formatted = formatCashInput(amount.toString());
                              setCashReceived(formatted);
                            }}
                          >
                            <Text style={styles.quickCashButtonText}>
                              {formatCurrency(amount)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TouchableOpacity
                        style={styles.exactAmountButton}
                        onPress={() => {
                          const formatted = formatCashInput(total.toString());
                          setCashReceived(formatted);
                        }}
                      >
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        <Text style={styles.exactAmountButtonText}>Uang Pas</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {cashReceived && parseCash(cashReceived) >= total && (
                      <View style={[styles.changeContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.changeLabel, { color: colors.textSecondary }]}>Kembalian</Text>
                        <Text style={styles.changeAmount}>
                          {formatCurrency(parseCash(cashReceived) - total)}
                        </Text>
                      </View>
                    )}
                    {cashReceived && parseCash(cashReceived) > 0 && parseCash(cashReceived) < total && (
                      <Text style={styles.errorText}>
                        Uang kurang {formatCurrency(total - parseCash(cashReceived))}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowPayment(false);
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleCompleteTransaction();
                    }}
                  >
                    <Text style={styles.confirmButtonText}>Selesaikan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#DC143C',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shortcutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC143C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shortcutButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Desktop Layout
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopLeft: {
    flex: 2,
    borderRightWidth: 2,
    borderRightColor: '#DC143C',
  },
  desktopRight: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  desktopProductList: {
    padding: 12,
  },
  desktopProductCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    margin: 6,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 140,
    maxWidth: '31%',
  },
  productBarcode: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  emptyProducts: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyProductsText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
  // Desktop Cart
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
  },
  clearCartText: {
    color: '#DC143C',
    fontSize: 11,
    fontWeight: 'bold',
  },
  desktopCartList: {
    padding: 16,
    flexGrow: 1,
  },
  desktopCartItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  cartItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cartItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeButton: {
    padding: 4,
  },
  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyCartText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyCartSubtext: {
    color: '#444',
    fontSize: 13,
    marginTop: 6,
  },
  desktopCartFooter: {
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#DC143C',
    backgroundColor: '#1a1a1a',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#999',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  totalLabelMain: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalAmountMain: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DC143C',
  },
  desktopCheckoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 8,
  },
  desktopCheckoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  desktopCheckoutShortcut: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  desktopModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  paymentShortcut: {
    fontSize: 9,
    color: '#666',
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  cartIconContainer: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#DC143C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#fff',
  },
  readyIndicator: {
    backgroundColor: '#00ff0020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  readyText: {
    color: '#00ff00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productList: {
    padding: 8,
    paddingBottom: 100,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    margin: 8,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 140,
    position: 'relative',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  stockBadge: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockBadgeLow: {
    backgroundColor: '#FF6B6B',
  },
  stockBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    minHeight: 36,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#DC143C',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#DC143C',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  floatingCartLeft: {
    position: 'relative',
  },
  floatingCartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  floatingCartBadgeText: {
    color: '#DC143C',
    fontSize: 11,
    fontWeight: 'bold',
  },
  floatingCartText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingCartTotal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartModal: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  cartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  trashButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  cartList: {
    padding: 16,
    flexGrow: 1,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  cartItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#999',
  },
  cartItemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  quantityButton: {
    backgroundColor: '#DC143C',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemQuantity: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    minWidth: 24,
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC143C',
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyCartMobile: {
    textAlign: 'center',
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  emptyCartSubtextMobile: {
    textAlign: 'center',
    color: '#444',
    fontSize: 14,
    marginTop: 8,
  },
  cartFooter: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 2,
    borderTopColor: '#DC143C',
  },
  cartTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
  },
  cartTotalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DC143C',
  },
  checkoutButton: {
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutIcon: {
    marginRight: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Fullscreen Payment Modal
  paymentModalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  paymentModalFlex: {
    flex: 1,
  },
  paymentModalScroll: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  paymentModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  paymentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#DC143C',
    marginHorizontal: -20,
    marginBottom: 20,
  },
  paymentModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  modalTotal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#DC143C',
    alignItems: 'center',
    width: '100%',
  },
  modalTotalLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalTotalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#DC143C',
    width: '100%',
    textAlign: 'center',
    flexShrink: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  paymentMethod: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    gap: 6,
  },
  paymentMethodActive: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  paymentMethodTextActive: {
    color: '#fff',
  },
  cashSection: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 18,
    fontSize: 18,
    color: '#fff',
    borderWidth: 2,
    borderColor: '#333',
  },
  changeContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#DC143C',
    alignItems: 'center',
  },
  changeLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  changeAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#DC143C',
  },
  errorText: {
    fontSize: 13,
    color: '#FF6B6B',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  quickCashContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  quickCashLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 12,
  },
  quickCashButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  quickCashButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#DC143C',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCashButtonText: {
    color: '#DC143C',
    fontSize: 15,
    fontWeight: 'bold',
  },
  exactAmountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
    padding: 14,
  },
  exactAmountButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 20,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  confirmButton: {
    backgroundColor: '#DC143C',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
