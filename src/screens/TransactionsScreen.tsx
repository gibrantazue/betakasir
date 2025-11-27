import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { usePermissions } from '../hooks/usePermissions';
import { useSubscription } from '../hooks/useSubscription';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import * as Print from 'expo-print';
import { useTheme } from '../hooks/useTheme';

export default function TransactionsScreen({ navigation }: any) {
  const transactions = useStore((state) => state.transactions);
  const deleteTransaction = useStore((state) => state.deleteTransaction);
  const loadData = useStore((state) => state.loadData);
  const settings = useStore((state) => state.settings);
  const { permissions } = usePermissions();
  const { hasFeature } = useSubscription();
  const { colors } = useTheme();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handlePrintReceipt = async (transaction: Transaction) => {
    try {
      const html = generateReceiptHTML(transaction);

      console.log('=== CETAK STRUK DIPANGGIL ===');
      console.log('Transaction ID:', transaction.id);

      // Untuk web, gunakan iframe tersembunyi agar print template HTML, bukan halaman website
      if (typeof window !== 'undefined' && window.document) {
        // Hapus iframe lama jika ada
        const oldIframe = document.getElementById('print-iframe-receipt');
        if (oldIframe) {
          oldIframe.remove();
        }

        // Buat iframe baru
        const iframe = document.createElement('iframe');
        iframe.id = 'print-iframe-receipt';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';

        document.body.appendChild(iframe);

        // Tulis HTML template struk ke iframe
        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(html);
          iframeDoc.close();

          // Tunggu load selesai, lalu print
          iframe.onload = () => {
            setTimeout(() => {
              try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();

                // Hapus iframe setelah print
                setTimeout(() => {
                  iframe.remove();
                }, 1000);
              } catch (e) {
                console.error('Print error:', e);
              }
            }, 500);
          };
        }
      } else {
        // Untuk mobile, gunakan expo-print
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Gagal mencetak struk: ' + error);
    }
  };

  const generateReceiptHTML = (transaction: Transaction) => {
    const itemsHTML = transaction.items
      .map(
        (item, index) => `
        <tr>
          <td style="padding: 14px 12px; color: #000; font-size: 14px; border-bottom: 1px solid #e0e0e0;">${index + 1}</td>
          <td style="padding: 14px 12px; color: #000; font-size: 14px; border-bottom: 1px solid #e0e0e0;">${item.product.name}</td>
          <td style="padding: 14px 12px; color: #000; text-align: center; font-size: 14px; border-bottom: 1px solid #e0e0e0;">${item.quantity}</td>
          <td style="padding: 14px 12px; color: #000; text-align: right; font-size: 14px; border-bottom: 1px solid #e0e0e0;">${formatCurrency(item.product.price)}</td>
          <td style="padding: 14px 12px; color: #000; text-align: right; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e0e0e0;">${formatCurrency(item.product.price * item.quantity)}</td>
        </tr>
      `
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${transaction.id}</title>
  <style>
    @page { 
      size: A4;
      margin: 15mm;
    }
    * { 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: white;
      color: #000;
      padding: 50px;
      max-width: 210mm;
      margin: 0 auto;
      line-height: 1.6;
    }
    .invoice-container {
      border: 2px solid #000;
      padding: 40px;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 35px;
      padding-bottom: 25px;
      border-bottom: 3px solid #000;
    }
    .company-info h1 {
      font-size: 32px;
      color: #000;
      margin-bottom: 12px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .company-info p {
      font-size: 14px;
      color: #333;
      margin: 5px 0;
      line-height: 1.6;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h2 {
      font-size: 42px;
      color: #000;
      font-weight: 700;
      margin-bottom: 5px;
      letter-spacing: 2px;
    }
    .invoice-title p {
      font-size: 13px;
      color: #666;
      margin-top: 5px;
    }
    .invoice-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 35px;
      background: #f9f9f9;
      padding: 25px;
      border-radius: 8px;
    }
    .detail-section h3 {
      font-size: 12px;
      color: #000;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 14px;
      padding: 5px 0;
    }
    .detail-label {
      color: #555;
      font-weight: 500;
    }
    .detail-value {
      color: #000;
      font-weight: 600;
      text-align: right;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 35px 0;
    }
    .items-table thead {
      background: #000;
    }
    .items-table th {
      padding: 16px 12px;
      text-align: left;
      font-weight: 600;
      color: #fff;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .items-table th.center {
      text-align: center;
    }
    .items-table th.right {
      text-align: right;
    }
    .items-table tbody tr:nth-child(even) {
      background: #f9f9f9;
    }
    .items-table tbody tr:hover {
      background: #f0f0f0;
    }
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 35px;
    }
    .summary-box {
      width: 400px;
      border: 2px solid #000;
      padding: 20px;
      background: #f9f9f9;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 14px 0;
      font-size: 15px;
      border-bottom: 1px solid #ddd;
    }
    .summary-row:last-child {
      border-bottom: none;
    }
    .summary-row.total {
      background: #000;
      color: #fff;
      margin: -20px -20px 15px -20px;
      padding: 20px;
      border-bottom: none;
      font-size: 22px;
      font-weight: 700;
    }
    .summary-row.total .summary-label,
    .summary-row.total .summary-value {
      color: #fff;
    }
    .summary-label {
      color: #555;
      font-weight: 600;
    }
    .summary-value {
      color: #000;
      font-weight: 700;
      font-size: 16px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 25px;
      border-top: 3px solid #000;
      text-align: center;
    }
    .footer p {
      font-size: 13px;
      color: #555;
      margin: 10px 0;
      line-height: 1.8;
    }
    .footer .website {
      font-weight: 700;
      color: #000;
      margin-top: 15px;
      font-size: 14px;
    }
    .footer .thank-you {
      font-size: 16px;
      font-weight: 600;
      color: #000;
      margin-top: 20px;
    }
    @media print {
      body {
        padding: 0;
      }
      .invoice-container {
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <div class="company-info">
        <h1>${settings.storeName}</h1>
        <p>${settings.storeAddress}</p>
        <p>Telp: ${settings.storePhone}</p>
      </div>
      <div class="invoice-title">
        <h2>INVOICE</h2>
        <p>${new Date(transaction.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>

    <div class="invoice-details">
      <div class="detail-section">
        <h3>Detail Transaksi</h3>
        <div class="detail-row">
          <span class="detail-label">No. Invoice</span>
          <span class="detail-value">#${transaction.id.substring(0, 12).toUpperCase()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tanggal & Waktu</span>
          <span class="detail-value">${formatDateTime(transaction.createdAt)}</span>
        </div>
      </div>
      <div class="detail-section">
        <h3>Informasi Pembayaran</h3>
        <div class="detail-row">
          <span class="detail-label">Kasir</span>
          <span class="detail-value">${transaction.cashierId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Metode Pembayaran</span>
          <span class="detail-value">${transaction.paymentMethod === 'cash' ? 'Tunai' : transaction.paymentMethod.toUpperCase()}</span>
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50px;">NO</th>
          <th>NAMA PRODUK</th>
          <th class="center" style="width: 80px;">QTY</th>
          <th class="right" style="width: 130px;">HARGA SATUAN</th>
          <th class="right" style="width: 130px;">SUBTOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="summary-section">
      <div class="summary-box">
        <div class="summary-row total">
          <span class="summary-label">TOTAL PEMBAYARAN</span>
          <span class="summary-value">${formatCurrency(transaction.total)}</span>
        </div>
        ${transaction.paymentMethod === 'cash' ? `
        <div class="summary-row">
          <span class="summary-label">Tunai Diterima</span>
          <span class="summary-value">${formatCurrency(transaction.cashReceived || 0)}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Kembalian</span>
          <span class="summary-value">${formatCurrency(transaction.change || 0)}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="footer">
      <p class="thank-you">Terima Kasih Atas Kepercayaan Anda</p>
      <p>${settings.receiptFooter}</p>
      <p class="website">www.betakasir.com</p>
    </div>
  </div>
</body>
</html>`;
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    // Check permission dulu
    if (!hasFeature('canDeleteTransactions')) {
      Alert.alert(
        'Fitur Premium',
        'Upgrade ke Standard atau Business untuk hapus transaksi',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation?.navigate('Billing') }
        ]
      );
      return;
    }

    if (!transaction || !transaction.id) {
      alert('✗ Error: Transaksi tidak valid');
      return;
    }

    console.log('=== DELETE BUTTON CLICKED (MODAL) ===');
    console.log('Transaction ID:', transaction.id);

    // Gunakan window.confirm untuk web
    const confirmed = window.confirm(
      `Yakin ingin menghapus transaksi #${transaction.id.substring(0, 8)}?\n\nTotal: ${formatCurrency(transaction.total)}`
    );

    if (!confirmed) {
      console.log('Delete cancelled by user');
      return;
    }

    try {
      console.log('User confirmed delete');
      console.log('Total transactions before:', transactions.length);

      // Cek apakah transaksi ada di list
      const exists = transactions.find(t => t.id === transaction.id);
      if (!exists) {
        console.error('Transaction not found in list!');
        alert('✗ Error: Transaksi tidak ditemukan');
        return;
      }

      // Hapus transaksi
      const success = await deleteTransaction(transaction.id);

      if (!success) {
        alert('✗ Error: Gagal menghapus transaksi dari database');
        return;
      }

      console.log('Transaction deleted from store successfully');

      // Reload data dari AsyncStorage
      console.log('Reloading data from AsyncStorage...');
      await loadData();

      // Force refresh
      setRefreshKey(prev => prev + 1);

      // Tunggu sebentar untuk memastikan state ter-update
      await new Promise(resolve => setTimeout(resolve, 200));

      // Tutup modal
      setShowDetail(false);
      setSelectedTransaction(null);

      console.log('Modal closed, UI should refresh now');

      // Tampilkan notifikasi sukses
      alert('✓ Berhasil! Transaksi berhasil dihapus');
    } catch (error) {
      console.error('Delete error:', error);
      alert('✗ Error: Gagal menghapus transaksi - ' + error);
    }
  };

  const handleQuickDelete = async (item: Transaction, event: any) => {
    // Stop propagation agar tidak buka detail modal
    event?.stopPropagation();

    console.log('Quick delete clicked for:', item.id);

    // Gunakan window.confirm untuk web (lebih reliable)
    const confirmed = window.confirm(
      `Hapus transaksi #${item.id.substring(0, 8)}?\n\nTotal: ${formatCurrency(item.total)}`
    );

    if (!confirmed) {
      console.log('Delete cancelled by user');
      return;
    }

    try {
      console.log('User confirmed delete');
      console.log('Deleting transaction:', item.id);
      console.log('Transactions before delete:', transactions.length);

      // Hapus transaksi
      const success = await deleteTransaction(item.id);

      console.log('Delete result:', success);

      if (success) {
        // Reload data dari AsyncStorage
        console.log('Reloading data from AsyncStorage...');
        await loadData();

        // Force refresh UI
        setRefreshKey(prev => prev + 1);

        console.log('Transactions after reload:', transactions.length);

        alert('✓ Berhasil! Transaksi berhasil dihapus');
      } else {
        alert('✗ Error: Gagal menghapus transaksi');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('✗ Error: Terjadi kesalahan - ' + error);
    }
  };

  const TransactionItem = ({ item }: { item: Transaction }) => (
    <View style={[styles.transactionItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.transactionContent}
        onPress={() => {
          setSelectedTransaction(item);
          setShowDetail(true);
        }}
      >
        <View style={styles.transactionLeft}>
          <View style={styles.transactionIcon}>
            <Ionicons name="receipt-outline" size={24} color="#DC143C" />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionId, { color: colors.text }]}>#{item.id.slice(0, 8)}</Text>
            <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>{formatDateTime(item.createdAt)}</Text>
            <View style={styles.paymentBadge}>
              <Ionicons
                name={
                  item.paymentMethod === 'cash'
                    ? 'cash-outline'
                    : item.paymentMethod === 'transfer'
                      ? 'swap-horizontal-outline'
                      : item.paymentMethod === 'ewallet'
                        ? 'phone-portrait-outline'
                        : 'card-outline'
                }
                size={12}
                color={colors.textSecondary}
              />
              <Text style={[styles.paymentText, { color: colors.textSecondary }]}>
                {item.paymentMethod === 'cash'
                  ? 'Tunai'
                  : item.paymentMethod === 'transfer'
                    ? 'Transfer'
                    : item.paymentMethod === 'ewallet'
                      ? 'E-Wallet'
                      : 'Kartu'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={styles.transactionTotal}>{formatCurrency(item.total)}</Text>
          <Text style={[styles.transactionItems, { color: colors.textSecondary }]}>{item.items.length} item</Text>
        </View>
      </TouchableOpacity>

      {permissions?.canDeleteTransactions && (
        <TouchableOpacity
          style={styles.deleteIconButton}
          onPress={(e) => handleQuickDelete(item, e)}
        >
          <Ionicons name="trash-outline" size={20} color="#f44336" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>Riwayat Transaksi</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{transactions.length} transaksi</Text>
        </View>
        <TouchableOpacity 
          style={styles.importButton}
          onPress={() => {
            navigation?.navigate('ImageTest');
          }}
        >
          <Ionicons name="document-text-outline" size={24} color="#fff" />
          <Text style={styles.importButtonText}>Scan</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        key={refreshKey}
        data={sortedTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem item={item} />}
        contentContainerStyle={styles.list}
        extraData={transactions.length}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Belum ada transaksi</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={showDetail} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => setShowDetail(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Detail Transaksi</Text>
            <View style={styles.backButton} />
          </View>

          {selectedTransaction && (
            <ScrollView style={styles.modalContent}>
              <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>No. Transaksi</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>#{selectedTransaction.id}</Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tanggal & Waktu</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{formatDateTime(selectedTransaction.createdAt)}</Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Metode Pembayaran</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {selectedTransaction.paymentMethod === 'cash'
                    ? 'Tunai'
                    : selectedTransaction.paymentMethod === 'transfer'
                      ? 'Transfer Bank'
                      : selectedTransaction.paymentMethod === 'ewallet'
                        ? 'E-Wallet'
                        : 'Kartu Debit/Kredit'}
                </Text>
              </View>

              <View style={[styles.itemsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Item Pembelian</Text>
                {selectedTransaction.items.map((item, index) => (
                  <View key={index} style={[styles.itemRow, { borderColor: colors.border }]}>
                    <View style={styles.itemLeft}>
                      <Text style={[styles.itemName, { color: colors.text }]}>{item.product.name}</Text>
                      <Text style={[styles.itemDetail, { color: colors.textSecondary }]}>
                        {formatCurrency(item.product.price)} × {item.quantity}
                      </Text>
                    </View>
                    <Text style={[styles.itemTotal, { color: colors.text }]}>
                      {formatCurrency(item.product.price * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={[styles.totalSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                  <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(selectedTransaction.total)}</Text>
                </View>
                {selectedTransaction.discount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Diskon</Text>
                    <Text style={[styles.totalValue, { color: colors.text }]}>-{formatCurrency(selectedTransaction.discount)}</Text>
                  </View>
                )}
                {selectedTransaction.tax > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Pajak</Text>
                    <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(selectedTransaction.tax)}</Text>
                  </View>
                )}
                <View style={[styles.totalRow, styles.grandTotal]}>
                  <Text style={[styles.grandTotalLabel, { color: colors.text }]}>TOTAL</Text>
                  <Text style={[styles.grandTotalValue, { color: colors.text }]}>{formatCurrency(selectedTransaction.total)}</Text>
                </View>

                {selectedTransaction.paymentMethod === 'cash' && (
                  <>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Tunai Diterima</Text>
                      <Text style={styles.totalValue}>
                        {formatCurrency(selectedTransaction.cashReceived || 0)}
                      </Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Kembalian</Text>
                      <Text style={styles.totalValue}>
                        {formatCurrency(selectedTransaction.change || 0)}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.printButton, !permissions?.canDeleteTransactions && styles.printButtonFull]}
                  onPress={() => handlePrintReceipt(selectedTransaction)}
                >
                  <Ionicons name="print-outline" size={20} color="#fff" />
                  <Text style={styles.printButtonText}>Cetak Struk</Text>
                </TouchableOpacity>
                {permissions?.canDeleteTransactions && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteTransaction(selectedTransaction)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.deleteButtonText}>Hapus</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
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
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#DC143C',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  importButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 15,
  },
  transactionItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  transactionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  deleteIconButton: {
    padding: 15,
    paddingLeft: 10,
    paddingRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#333',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC143C20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentText: {
    fontSize: 11,
    color: '#999',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 4,
  },
  transactionItems: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  detailLabel: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 4,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  itemsSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 12,
    color: '#ccc',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC143C',
  },
  totalSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  grandTotal: {
    borderTopWidth: 2,
    borderTopColor: '#DC143C',
    marginTop: 10,
    paddingTop: 15,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC143C',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    marginTop: 10,
  },
  printButton: {
    flex: 1,
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  printButtonFull: {
    flex: 0,
    width: '100%',
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    width: 120,
    backgroundColor: '#f44336',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
