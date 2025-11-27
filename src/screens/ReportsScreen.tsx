import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '../hooks/useTheme';
import AdvancedChart from '../components/AdvancedChart';
import FinancialDashboard from '../components/FinancialDashboard';
import { Product } from '../types';
import { RestockRequest, RestockItem } from '../types/restock';
import { restockService } from '../services/restockService';

const screenWidth = Dimensions.get('window').width;

interface FinancialStats {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  totalTransactions: number;
  averageTransaction: number;
  topProducts: Array<{ product: any; quantity: number; revenue: number }>;
  lowStockProducts: Array<{ product: any; stock: number }>;
  dailyRevenue: Array<{ date: string; revenue: number }>;
  employeePerformance: Array<{ employeeId: string; transactions: number; revenue: number }>;
  paymentMethods: Array<{ method: string; count: number; total: number }>;
}

export default function ReportsScreen() {
  const { transactions, products, employees, settings } = useStore();
  const { colors } = useTheme();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('today');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'overview' | 'products' | 'employees'>('dashboard');
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    topProducts: [],
    lowStockProducts: [],
    dailyRevenue: [],
    employeePerformance: [],
    paymentMethods: [],
  });

  // Restock modal state
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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

  useEffect(() => {
    calculateStats();
  }, [transactions, period]);

  const calculateStats = () => {
    const now = new Date();
    let startDate = new Date();

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    } else if (period === 'all') {
      // All time - set to very old date to include all transactions
      startDate = new Date(2000, 0, 1);
    }

    const filteredTransactions = period === 'all' 
      ? transactions 
      : transactions.filter((t) => new Date(t.createdAt) >= startDate);

    // Calculate revenue, cost, and profit
    let totalRevenue = 0;
    let totalCost = 0;
    const productSales: { [key: string]: { product: any; quantity: number; revenue: number } } = {};
    const employeeStats: { [key: string]: { transactions: number; revenue: number } } = {};
    const paymentStats: { [key: string]: { count: number; total: number } } = {};
    const dailyRevenueMap: { [key: string]: number } = {};

    filteredTransactions.forEach((transaction) => {
      totalRevenue += transaction.total;

      // Daily revenue
      const dateKey = new Date(transaction.createdAt).toLocaleDateString('id-ID');
      dailyRevenueMap[dateKey] = (dailyRevenueMap[dateKey] || 0) + transaction.total;

      // Employee performance
      const employeeId = transaction.cashierId || 'Unknown';
      if (!employeeStats[employeeId]) {
        employeeStats[employeeId] = { transactions: 0, revenue: 0 };
      }
      employeeStats[employeeId].transactions += 1;
      employeeStats[employeeId].revenue += transaction.total;

      // Payment methods
      const method = transaction.paymentMethod || 'cash';
      if (!paymentStats[method]) {
        paymentStats[method] = { count: 0, total: 0 };
      }
      paymentStats[method].count += 1;
      paymentStats[method].total += transaction.total;

      // Product sales
      transaction.items.forEach((item) => {
        const cost = (item.product.cost || 0) * item.quantity;
        totalCost += cost;

        if (productSales[item.product.id]) {
          productSales[item.product.id].quantity += item.quantity;
          productSales[item.product.id].revenue += item.product.price * item.quantity;
        } else {
          productSales[item.product.id] = {
            product: item.product,
            quantity: item.quantity,
            revenue: item.product.price * item.quantity,
          };
        }
      });
    });

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageTransaction = filteredTransactions.length > 0 ? totalRevenue / filteredTransactions.length : 0;

    // Top products
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Low stock products
    const lowStockProducts = products
      .filter((p) => p.stock <= 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10)
      .map((p) => ({ product: p, stock: p.stock }));

    // Daily revenue array
    const dailyRevenue = Object.entries(dailyRevenueMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days

    // Employee performance
    const employeePerformance = Object.entries(employeeStats)
      .map(([employeeId, stats]) => ({ employeeId, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);

    // Payment methods
    const paymentMethods = Object.entries(paymentStats)
      .map(([method, stats]) => ({ method, ...stats }))
      .sort((a, b) => b.total - a.total);

    setStats({
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      totalTransactions: filteredTransactions.length,
      averageTransaction,
      topProducts,
      lowStockProducts,
      dailyRevenue,
      employeePerformance,
      paymentMethods,
    });
  };

  // Handle restock button press
  const handleRestockPress = (product: Product) => {
    console.log('🔘 Restock button pressed for:', product.name);
    setSelectedProduct(product);
    setRequestedQuantity('');
    setEstimatedCost(product.cost.toString());
    setNotes('');
    setSupplierName('');
    setSupplierPhone('');
    setSupplierAddress('');
    setRequestNotes('');
    setShowRestockModal(true);
  };

  // Handle create restock request
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

  // Handle export PDF
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

  // Handle copy text
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

  const handleExportReport = () => {
    if (typeof window !== 'undefined') {
      // Web/Desktop - show options
      const choice = window.confirm('Export laporan ke PDF?\n\nLaporan akan di-download dalam format PDF dengan desain professional.');
      if (choice) {
        exportToPDF();
      }
    } else {
      // Mobile - direct export
      Alert.alert(
        'Export Laporan',
        'Export laporan ke PDF?',
        [
          { text: 'Export', onPress: () => exportToPDF() },
          { text: 'Batal', style: 'cancel' },
        ]
      );
    }
  };

  const exportToPDF = () => {
    try {
      const periodName = period === 'today' ? 'Hari Ini' : 
                        period === 'week' ? '7 Hari' : 
                        period === 'month' ? '30 Hari' : 
                        period === 'year' ? '1 Tahun' : 'Semua Data';
      
      const date = new Date().toLocaleDateString('id-ID');
      const time = new Date().toLocaleTimeString('id-ID');
      
      // Create PDF
      const doc = new jsPDF();
      
      // Header with logo/title
      doc.setFillColor(220, 20, 60); // BetaKasir red
      doc.rect(0, 0, 210, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN KEUANGAN', 105, 15, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text(settings.storeName || 'BetaKasir', 105, 25, { align: 'center' });
      
      // Period and date info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Periode: ${periodName}`, 14, 45);
      doc.text(`Tanggal Export: ${date} ${time}`, 14, 50);
      
      let yPos = 60;
      
      // Summary Section
      doc.setFillColor(240, 240, 240);
      doc.rect(14, yPos, 182, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 20, 60);
      doc.text('RINGKASAN KEUANGAN', 16, yPos + 5);
      
      yPos += 12;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Keterangan', 'Nilai']],
        body: [
          ['Total Pendapatan', formatCurrency(stats.totalRevenue)],
          ['Total Biaya', formatCurrency(stats.totalCost)],
          ['Laba Bersih', formatCurrency(stats.totalProfit)],
          ['Margin Keuntungan', `${stats.profitMargin.toFixed(2)}%`],
          ['Total Transaksi', stats.totalTransactions.toString()],
          ['Rata-rata Transaksi', formatCurrency(stats.averageTransaction)],
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [220, 20, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Top Products Section
      if (stats.topProducts.length > 0) {
        doc.setFillColor(240, 240, 240);
        doc.rect(14, yPos, 182, 8, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 20, 60);
        doc.text('PRODUK TERLARIS', 16, yPos + 5);
        
        yPos += 12;
        
        const productData = stats.topProducts.map((item, index) => {
          const profit = (item.product.price - (item.product.cost || 0)) * item.quantity;
          return [
            (index + 1).toString(),
            item.product.name,
            item.quantity.toString(),
            formatCurrency(item.product.price),
            formatCurrency(item.revenue),
            formatCurrency(profit),
          ];
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Nama Produk', 'Qty', 'Harga', 'Revenue', 'Laba']],
          body: productData,
          theme: 'grid',
          headStyles: {
            fillColor: [220, 20, 60],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
          },
          bodyStyles: {
            fontSize: 8,
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250],
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 60 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' },
          },
          margin: { left: 14, right: 14 },
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
      
      // Employee Performance Section
      if (stats.employeePerformance.length > 0 && yPos < 250) {
        doc.setFillColor(240, 240, 240);
        doc.rect(14, yPos, 182, 8, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 20, 60);
        doc.text('PERFORMA KARYAWAN', 16, yPos + 5);
        
        yPos += 12;
        
        const employeeData = stats.employeePerformance.slice(0, 10).map((item, index) => {
          const employee = employees.find(e => e.employeeId === item.employeeId || e.id === item.employeeId);
          const avgTransaction = item.revenue / item.transactions;
          return [
            (index + 1).toString(),
            employee?.name || item.employeeId,
            item.transactions.toString(),
            formatCurrency(item.revenue),
            formatCurrency(avgTransaction),
          ];
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Nama Karyawan', 'Transaksi', 'Revenue', 'Avg/Transaksi']],
          body: employeeData,
          theme: 'grid',
          headStyles: {
            fillColor: [220, 20, 60],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
          },
          bodyStyles: {
            fontSize: 8,
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250],
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 70 },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' },
          },
          margin: { left: 14, right: 14 },
        });
      }
      
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Halaman ${i} dari ${pageCount} | Generated by ${settings.storeName || 'BetaKasir'} | ${settings.receiptWebsite || 'www.betakasir.com'}`,
          105,
          290,
          { align: 'center' }
        );
      }
      
      // Save PDF
      doc.save(`Laporan_Keuangan_${periodName}_${date.replace(/\//g, '-')}.pdf`);
      
      // Show success message
      if (typeof window !== 'undefined') {
        alert('✅ Laporan berhasil di-export!\n\nFile PDF sudah terdownload dengan desain professional.');
      } else {
        Alert.alert('Berhasil', 'Laporan berhasil di-export ke PDF!');
      }
    } catch (error) {
      console.error('Export error:', error);
      if (typeof window !== 'undefined') {
        alert('❌ Gagal export laporan: ' + error);
      } else {
        Alert.alert('Error', 'Gagal export laporan: ' + error);
      }
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color, backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIconContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        {subtitle && <Text style={[styles.statSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
    </View>
  );

  const renderOverview = () => (
    <>
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Pendapatan"
          value={formatCurrency(stats.totalRevenue)}
          icon="cash-outline"
          color="#4CAF50"
          subtitle={`${stats.totalTransactions} transaksi`}
        />
        <StatCard
          title="Total Biaya"
          value={formatCurrency(stats.totalCost)}
          icon="trending-down-outline"
          color="#FF9800"
          subtitle="Modal produk"
        />
        <StatCard
          title="Laba Bersih"
          value={formatCurrency(stats.totalProfit)}
          icon="trending-up-outline"
          color="#DC143C"
          subtitle={`Margin ${stats.profitMargin.toFixed(1)}%`}
        />
        <StatCard
          title="Rata-rata Transaksi"
          value={formatCurrency(stats.averageTransaction)}
          icon="calculator-outline"
          color="#2196F3"
          subtitle="Per transaksi"
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Metode Pembayaran</Text>
        {stats.paymentMethods.map((item) => (
          <View key={item.method} style={[styles.paymentItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons
              name={
                item.method === 'cash' ? 'cash-outline' :
                item.method === 'transfer' ? 'swap-horizontal-outline' :
                item.method === 'ewallet' ? 'phone-portrait-outline' : 'card-outline'
              }
              size={24}
              color="#DC143C"
            />
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentMethod, { color: colors.text }]}>
                {item.method === 'cash' ? 'Tunai' :
                 item.method === 'transfer' ? 'Transfer' :
                 item.method === 'ewallet' ? 'E-Wallet' : 'Kartu'}
              </Text>
              <Text style={[styles.paymentCount, { color: colors.textSecondary }]}>{item.count} transaksi</Text>
            </View>
            <Text style={[styles.paymentTotal, { color: colors.primary }]}>{formatCurrency(item.total)}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderProducts = () => (
    <>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🏆 Top 10 Produk Terlaris</Text>
        {stats.topProducts.length > 0 ? (
          stats.topProducts.map((item, index) => (
            <View key={item.product.id} style={[styles.topProductItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.topProductRank, index < 3 && styles.topProductRankGold]}>
                <Text style={styles.topProductRankText}>{index + 1}</Text>
              </View>
              <View style={styles.topProductInfo}>
                <Text style={[styles.topProductName, { color: colors.text }]}>{item.product.name}</Text>
                <Text style={[styles.topProductQuantity, { color: colors.textSecondary }]}>
                  Terjual: {item.quantity} unit • {formatCurrency(item.product.price)}/unit
                </Text>
              </View>
              <View style={styles.topProductRight}>
                <Text style={[styles.topProductRevenue, { color: colors.primary }]}>{formatCurrency(item.revenue)}</Text>
                <Text style={styles.topProductProfit}>
                  Laba: {formatCurrency((item.product.price - (item.product.cost || 0)) * item.quantity)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Belum ada data penjualan</Text>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>⚠️ Stok Menipis</Text>
        {stats.lowStockProducts.length > 0 ? (
          stats.lowStockProducts.map((item) => (
            <View key={item.product.id} style={[styles.lowStockItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="warning-outline" size={24} color="#FF9800" />
              <View style={styles.lowStockInfo}>
                <Text style={[styles.lowStockName, { color: colors.text }]}>{item.product.name}</Text>
                <Text style={styles.lowStockQuantity}>Sisa: {item.stock} unit</Text>
              </View>
              <TouchableOpacity 
                style={[styles.restockButton, { backgroundColor: colors.primary }]}
                onPress={() => handleRestockPress(item.product)}
              >
                <Text style={styles.restockButtonText}>Restock</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Semua produk stok aman</Text>
        )}
      </View>
    </>
  );

  const renderEmployees = () => {
    // Get top performer
    const topPerformer = stats.employeePerformance.length > 0 ? stats.employeePerformance[0] : null;
    const topEmployee = topPerformer ? employees.find(e => e.employeeId === topPerformer.employeeId || e.id === topPerformer.employeeId) : null;

    return (
      <>
        {topPerformer && (
          <View style={[styles.topPerformerCard, { backgroundColor: colors.card }]}>
            <View style={styles.topPerformerHeader}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.topPerformerTitle}>🏆 Top Performer</Text>
            </View>
            <View style={styles.topPerformerContent}>
              <View style={styles.topPerformerAvatar}>
                <Text style={styles.topPerformerInitial}>
                  {(topEmployee?.name || topPerformer.employeeId).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.topPerformerInfo}>
                <Text style={[styles.topPerformerName, { color: colors.text }]}>
                  {topEmployee?.name || topPerformer.employeeId}
                </Text>
                <Text style={[styles.topPerformerStats, { color: colors.textSecondary }]}>
                  {topPerformer.transactions} transaksi • {formatCurrency(topPerformer.revenue)}
                </Text>
              </View>
              <View style={styles.topPerformerBadge}>
                <Ionicons name="star" size={32} color="#FFD700" />
              </View>
            </View>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>👥 Semua Karyawan</Text>
          {stats.employeePerformance.length > 0 ? (
            stats.employeePerformance.map((item, index) => {
              const employee = employees.find(e => e.employeeId === item.employeeId || e.id === item.employeeId);
              return (
                <View key={item.employeeId} style={[styles.employeeItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={[styles.employeeRank, index === 0 && styles.employeeRankGold]}>
                    <Text style={styles.employeeRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.employeeInfo}>
                    <Text style={[styles.employeeName, { color: colors.text }]}>
                      {employee?.name || item.employeeId}
                    </Text>
                    <Text style={[styles.employeeStats, { color: colors.textSecondary }]}>
                      {item.transactions} transaksi • Avg: {formatCurrency(item.revenue / item.transactions)}
                    </Text>
                  </View>
                  <View style={styles.employeeRight}>
                    <Text style={[styles.employeeRevenue, { color: colors.primary }]}>{formatCurrency(item.revenue)}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Belum ada data karyawan</Text>
          )}
        </View>
      </>
    );
  };

  const renderCharts = () => {
    // Data untuk grafik penjualan (7 hari terakhir)
    const revenueData = stats.dailyRevenue.slice(-7);
    
    // Validasi data - pastikan tidak ada NaN
    const hasRevenueData = revenueData.length > 0 && revenueData.some(d => d.revenue > 0);
    
    // Clean data untuk line chart - pastikan semua nilai valid
    const cleanRevenueValues = hasRevenueData 
      ? revenueData.map(d => {
          const value = (d.revenue || 0) / 1000;
          const cleanValue = isNaN(value) || !isFinite(value) ? 0 : Math.max(0, value);
          return cleanValue;
        })
      : [0, 0, 0, 0, 0, 0, 0];
    
    // Pastikan ada minimal 1 nilai > 0 untuk menghindari grafik kosong
    const hasValidData = cleanRevenueValues.some(v => v > 0);
    
    // Tambahkan minimal value 1 jika semua data 0 untuk menghindari NaN di chart
    // Gunakan 1 bukan 0.1 karena chart library butuh nilai yang lebih besar
    const finalRevenueValues = hasValidData ? cleanRevenueValues : [1, 1, 1, 1, 1, 1, 1];
    
    // Debug log
    console.log('📊 Chart Data Debug:', {
      hasRevenueData,
      hasValidData,
      revenueDataLength: revenueData.length,
      cleanRevenueValues,
      finalRevenueValues,
    });
    
    const lineData = {
      labels: hasRevenueData 
        ? revenueData.map(d => {
            const date = new Date(d.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
          })
        : ['1', '2', '3', '4', '5', '6', '7'],
      datasets: [{
        data: finalRevenueValues,
      }],
    };

    // Data untuk grafik produk terlaris
    const topProductsData = stats.topProducts.slice(0, 5);
    const hasProductData = topProductsData.length > 0;
    
    // Clean data untuk bar chart
    const cleanProductValues = hasProductData 
      ? topProductsData.map(p => {
          const value = p.quantity || 0;
          return isNaN(value) || !isFinite(value) ? 0 : Math.max(0, value);
        })
      : [0, 0, 0, 0, 0];
    
    // Tambahkan minimal value 1 jika semua data 0 untuk menghindari NaN di chart
    const hasValidProductData = cleanProductValues.some(v => v > 0);
    const finalProductValues = hasValidProductData ? cleanProductValues : [1, 1, 1, 1, 1];
    
    const barData = {
      labels: hasProductData 
        ? topProductsData.map(p => p.product.name.substring(0, 10))
        : ['Produk 1', 'Produk 2', 'Produk 3', 'Produk 4', 'Produk 5'],
      datasets: [{
        data: finalProductValues,
      }],
    };

    // Config grafik dengan warna yang lebih soft
    const chartConfig = {
      backgroundColor: colors.card,
      backgroundGradientFrom: colors.card,
      backgroundGradientTo: colors.card,
      backgroundGradientFromOpacity: 1,
      backgroundGradientToOpacity: 1,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(220, 20, 60, ${opacity})`,
      labelColor: (opacity = 1) => colors.textSecondary,
      style: { 
        borderRadius: 16,
      },
      propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: colors.primary,
        fill: colors.primary,
      },
      propsForBackgroundLines: {
        strokeDasharray: '',
        stroke: colors.border,
        strokeWidth: 1,
      },
      formatYLabel: (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num) || !isFinite(num)) return '0';
        return num.toFixed(0);
      },
    };

    return (
      <>
        {/* Grafik Pendapatan Harian */}
        <View style={[styles.chartSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📈 Pendapatan 7 Hari Terakhir</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                Total: {hasRevenueData 
                  ? formatCurrency(revenueData.reduce((sum, d) => sum + (d.revenue || 0), 0))
                  : 'Rp 0'}
              </Text>
            </View>
            <View style={[styles.chartBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.chartBadgeText, { color: colors.primary }]}>
                {hasRevenueData ? revenueData.length : 7} hari
              </Text>
            </View>
          </View>
          
          {hasValidData ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={lineData}
                  width={Math.max(screenWidth - 60, 350)}
                  height={240}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  yAxisSuffix="k"
                  yAxisLabel=""
                  withInnerLines={true}
                  withOuterLines={true}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  withDots={true}
                  withShadow={false}
                  fromZero={true}
                  yAxisInterval={1}
                  segments={4}
                />
              </ScrollView>
              <View style={[styles.chartLegend, { backgroundColor: colors.background }]}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Pendapatan (dalam ribuan)</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyChartContainer}>
              <Ionicons name="bar-chart-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                Belum ada data penjualan
              </Text>
              <Text style={[styles.emptyChartSubtext, { color: colors.textSecondary }]}>
                Grafik akan muncul setelah ada transaksi
              </Text>
            </View>
          )}
        </View>

        {/* Grafik Produk Terlaris */}
        <View style={[styles.chartSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🏆 Top 5 Produk Terlaris</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                Berdasarkan jumlah unit terjual
              </Text>
            </View>
            <View style={[styles.chartBadge, { backgroundColor: '#4CAF50' + '20' }]}>
              <Text style={[styles.chartBadgeText, { color: '#4CAF50' }]}>
                {hasProductData 
                  ? topProductsData.reduce((sum, p) => sum + (p.quantity || 0), 0)
                  : 0} unit
              </Text>
            </View>
          </View>
          
          {hasValidProductData ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={barData}
                  width={Math.max(screenWidth - 60, 350)}
                  height={240}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  yAxisSuffix=""
                  yAxisLabel=""
                  showValuesOnTopOfBars={true}
                  withInnerLines={true}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  fromZero={true}
                  yAxisInterval={1}
                  segments={4}
                />
              </ScrollView>
              <View style={[styles.chartLegend, { backgroundColor: colors.background }]}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Jumlah unit terjual</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyChartContainer}>
              <Ionicons name="cube-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                Belum ada produk terjual
              </Text>
              <Text style={[styles.emptyChartSubtext, { color: colors.textSecondary }]}>
                Grafik akan muncul setelah ada penjualan produk
              </Text>
            </View>
          )}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="trending-up" size={32} color="#4CAF50" />
            <Text style={[styles.summaryCardValue, { color: colors.text }]}>
              {hasRevenueData 
                ? formatCurrency(Math.max(...revenueData.map(d => d.revenue || 0)))
                : 'Rp 0'}
            </Text>
            <Text style={[styles.summaryCardLabel, { color: colors.textSecondary }]}>Penjualan Tertinggi</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="trending-down" size={32} color="#FF9800" />
            <Text style={[styles.summaryCardValue, { color: colors.text }]}>
              {hasRevenueData 
                ? formatCurrency(Math.min(...revenueData.map(d => d.revenue || 0)))
                : 'Rp 0'}
            </Text>
            <Text style={[styles.summaryCardLabel, { color: colors.textSecondary }]}>Penjualan Terendah</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="calculator" size={32} color={colors.primary} />
            <Text style={[styles.summaryCardValue, { color: colors.text }]}>
              {hasRevenueData && revenueData.length > 0
                ? formatCurrency(revenueData.reduce((sum, d) => sum + (d.revenue || 0), 0) / revenueData.length)
                : 'Rp 0'}
            </Text>
            <Text style={[styles.summaryCardLabel, { color: colors.textSecondary }]}>Rata-rata Harian</Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Tab Selector - Always visible */}
      <View style={[styles.mainTabSelector, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.mainTabButton, 
            { backgroundColor: colors.background, borderColor: colors.border },
            activeTab === 'dashboard' && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons name="grid" size={22} color={activeTab === 'dashboard' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.mainTabText, { color: colors.textSecondary }, activeTab === 'dashboard' && styles.mainTabTextActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mainTabButton, 
            { backgroundColor: colors.background, borderColor: colors.border },
            activeTab === 'overview' && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons name="stats-chart" size={22} color={activeTab === 'overview' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.mainTabText, { color: colors.textSecondary }, activeTab === 'overview' && styles.mainTabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mainTabButton, 
            { backgroundColor: colors.background, borderColor: colors.border },
            activeTab === 'products' && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setActiveTab('products')}
        >
          <Ionicons name="cube" size={22} color={activeTab === 'products' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.mainTabText, { color: colors.textSecondary }, activeTab === 'products' && styles.mainTabTextActive]}>
            Produk
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mainTabButton, 
            { backgroundColor: colors.background, borderColor: colors.border },
            activeTab === 'employees' && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}
          onPress={() => setActiveTab('employees')}
        >
          <Ionicons name="people" size={22} color={activeTab === 'employees' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.mainTabText, { color: colors.textSecondary }, activeTab === 'employees' && styles.mainTabTextActive]}>
            Karyawan
          </Text>
        </TouchableOpacity>

        {activeTab !== 'dashboard' && (
          <TouchableOpacity style={[styles.exportButton, { backgroundColor: colors.primary }]} onPress={handleExportReport}>
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'dashboard' ? (
        <FinancialDashboard />
      ) : (
        <>
          <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>💰 Laporan Keuangan</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Data realtime dari Firebase</Text>
            </View>
          </View>

      <View style={[styles.periodContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.periodScrollView}>
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton, 
                { backgroundColor: colors.background, borderColor: colors.border },
                period === 'today' && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setPeriod('today')}
            >
              <Ionicons 
                name="today-outline" 
                size={24} 
                color={period === 'today' ? '#fff' : colors.textSecondary} 
              />
              <Text style={[styles.periodText, { color: colors.textSecondary }, period === 'today' && styles.periodTextActive]}>
                Hari{'\n'}Ini
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton, 
                { backgroundColor: colors.background, borderColor: colors.border },
                period === 'week' && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setPeriod('week')}
            >
              <Ionicons 
                name="calendar-outline" 
                size={24} 
                color={period === 'week' ? '#fff' : colors.textSecondary} 
              />
              <Text style={[styles.periodText, { color: colors.textSecondary }, period === 'week' && styles.periodTextActive]}>
                7{'\n'}Hari
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton, 
                { backgroundColor: colors.background, borderColor: colors.border },
                period === 'month' && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setPeriod('month')}
            >
              <Ionicons 
                name="calendar-number-outline" 
                size={24} 
                color={period === 'month' ? '#fff' : colors.textSecondary} 
              />
              <Text style={[styles.periodText, { color: colors.textSecondary }, period === 'month' && styles.periodTextActive]}>
                30{'\n'}Hari
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton, 
                { backgroundColor: colors.background, borderColor: colors.border },
                period === 'year' && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setPeriod('year')}
            >
              <Ionicons 
                name="time-outline" 
                size={24} 
                color={period === 'year' ? '#fff' : colors.textSecondary} 
              />
              <Text style={[styles.periodText, { color: colors.textSecondary }, period === 'year' && styles.periodTextActive]}>
                1{'\n'}Tahun
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton, 
                { backgroundColor: colors.background, borderColor: colors.border },
                period === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setPeriod('all')}
            >
              <Ionicons 
                name="infinite-outline" 
                size={24} 
                color={period === 'all' ? '#fff' : colors.textSecondary} 
              />
              <Text style={[styles.periodText, { color: colors.textSecondary }, period === 'all' && styles.periodTextActive]}>
                Semua{'\n'}Data
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.summaryBox, { borderLeftColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Ionicons name="cash-outline" size={20} color="#4CAF50" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryValue}>{formatCurrency(stats.totalRevenue)}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Pendapatan</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.quickStats, { borderLeftColor: colors.border }]}>
          <View style={styles.quickStatItem}>
            <Ionicons name="receipt-outline" size={16} color="#DC143C" />
            <Text style={[styles.quickStatValue, { color: colors.text }]}>{stats.totalTransactions}</Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Transaksi</Text>
          </View>
          <View style={[styles.quickStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.quickStatItem}>
            <Ionicons name="trending-up-outline" size={16} color="#4CAF50" />
            <Text style={[styles.quickStatValue, { color: colors.text }]}>{stats.profitMargin.toFixed(0)}%</Text>
            <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>Margin</Text>
          </View>
        </View>
      </View>



          <ScrollView 
            style={[styles.content, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'products' && renderProducts()}
            {activeTab === 'employees' && renderEmployees()}
          </ScrollView>
        </>
      )}

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
              <Text style={[styles.sectionTitleModal, { color: colors.text }]}>Informasi Supplier</Text>
              
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Nama Supplier *"
                value={supplierName}
                onChangeText={setSupplierName}
                placeholderTextColor={colors.textSecondary}
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="No. WhatsApp Supplier * (contoh: 628123456789)"
                value={supplierPhone}
                onChangeText={setSupplierPhone}
                keyboardType="phone-pad"
                placeholderTextColor={colors.textSecondary}
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Alamat Supplier (opsional)"
                value={supplierAddress}
                onChangeText={setSupplierAddress}
                placeholderTextColor={colors.textSecondary}
              />

              {/* Order Details */}
              <Text style={[styles.sectionTitleModal, { color: colors.text }]}>Detail Pesanan</Text>

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Jumlah Pesanan *"
                value={requestedQuantity}
                onChangeText={setRequestedQuantity}
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />

              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Catatan untuk produk ini (opsional)"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textSecondary}
              />

              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Catatan tambahan untuk supplier (opsional)"
                value={requestNotes}
                onChangeText={setRequestNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textSecondary}
              />

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateRestockRequest}
              >
                <Ionicons name="document-text" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Buat Surat Pesanan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.background }]}
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
              style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
              onPress={() => {
                setShowActionModal(false);
                if (pendingRequest) handleCopyText(pendingRequest);
              }}
            >
              <Ionicons name="copy-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Salin Teks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => {
                setShowActionModal(false);
                if (pendingRequest) handleSaveAsImage(pendingRequest);
              }}
            >
              <Ionicons name="image-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Simpan Gambar</Text>
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
    backgroundColor: '#0f0f0f',
  },
  mainTabSelector: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    alignItems: 'center',
  },
  mainTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#0f0f0f',
    borderWidth: 1.5,
    borderColor: '#2a2a2a',
    gap: 8,
  },
  mainTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  mainTabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  header: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },
  exportButton: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    alignItems: 'center',
  },
  periodScrollView: {
    flexShrink: 0,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
    alignItems: 'center',
  },
  summaryBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#2a2a2a',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryContent: {
    gap: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4CAF50',
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
  },
  quickStats: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#2a2a2a',
  },
  quickStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  quickStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
  },
  quickStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2a2a2a',
  },
  periodButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#0f0f0f',
    borderWidth: 1.5,
    borderColor: '#2a2a2a',
    width: 70,
    height: 70,
    gap: 4,
  },
  periodButtonActive: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  periodText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    textAlign: 'center',
    lineHeight: 12,
  },
  periodTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#0f0f0f',
    borderWidth: 1.5,
    borderColor: '#2a2a2a',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  statsGrid: {
    padding: 20,
    gap: 20,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statContent: {
    marginLeft: 16,
    flex: 1,
  },
  statTitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
    color: '#fff',
    letterSpacing: -0.3,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 14,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  paymentCount: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  paymentTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#DC143C',
  },
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  topProductRank: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DC143C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  topProductRankGold: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
  },
  topProductRankText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#fff',
  },
  topProductQuantity: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  topProductRight: {
    alignItems: 'flex-end',
  },
  topProductRevenue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#DC143C',
    marginBottom: 4,
  },
  topProductProfit: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  lowStockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  lowStockInfo: {
    flex: 1,
    marginLeft: 14,
  },
  lowStockName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  lowStockQuantity: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '600',
  },
  restockButton: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  restockButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  employeeRank: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  employeeRankText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },
  employeeRankGold: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
  },
  topPerformerCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  topPerformerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  topPerformerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  topPerformerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topPerformerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPerformerInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  topPerformerInfo: {
    flex: 1,
  },
  topPerformerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  topPerformerStats: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  topPerformerBadge: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  employeeStats: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  employeeRight: {
    alignItems: 'flex-end',
  },
  employeeRevenue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#DC143C',
  },
  chartSection: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  chartSubtitle: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  chartBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  chartBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chart: {
    marginVertical: 16,
    borderRadius: 16,
  },
  chartLegend: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  emptyChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyChartSubtext: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
  },
  summaryCards: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCardValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryCardLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
    marginBottom: 20,
    fontSize: 15,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  },
  selectedProductInfo: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  selectedProductStock: {
    fontSize: 14,
  },
  sectionTitleModal: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  totalContainer: {
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
  },
  cancelButtonText: {
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
