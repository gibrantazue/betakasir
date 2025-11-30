import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency } from '../utils/helpers';
import { useStore } from '../store/useStore';
import { subscribeToTransactions, getSellerUID } from '../services/dataService';

const screenWidth = Dimensions.get('window').width;

interface MonthlyData {
  month: string;
  monthNum: number;
  kasKeluar: number;
  kasMasuk: number;
  saldo: number;
}

export default function FinancialDashboard() {
  const { colors, isDark } = useTheme();
  const { isDesktop } = useResponsive();
  const navigation = useNavigation();
  const { transactions, employees } = useStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeTransactions, setRealtimeTransactions] = useState(transactions);

  // Generate years dynamically: current year, +1, +2
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];
  
  const months = [
    { num: 1, name: 'Jan' }, { num: 2, name: 'Feb' }, { num: 3, name: 'Mar' },
    { num: 4, name: 'Apr' }, { num: 5, name: 'May' }, { num: 6, name: 'Jun' },
    { num: 7, name: 'Jul' }, { num: 8, name: 'Aug' }, { num: 9, name: 'Sep' },
    { num: 10, name: 'Oct' }, { num: 11, name: 'Nov' }, { num: 12, name: 'Dec' }
  ];

  // Setup realtime listener
  useEffect(() => {
    const sellerUID = getSellerUID();
    if (!sellerUID) {
      setIsLoading(false);
      setRealtimeTransactions(transactions);
      return;
    }

    console.log('🔄 Setting up realtime listener for Financial Dashboard');
    const unsubscribe = subscribeToTransactions(sellerUID, (updatedTransactions) => {
      console.log('🔄 Realtime update received:', updatedTransactions.length, 'transactions');
      setRealtimeTransactions(updatedTransactions);
      setIsLoading(false);
    });

    return () => {
      console.log('🔄 Cleaning up realtime listener');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    calculateMonthlyData();
  }, [realtimeTransactions, selectedYear, selectedMonths]);

  const calculateMonthlyData = () => {
    const data: { [key: string]: MonthlyData } = {};
    
    // Initialize 12 months
    for (let i = 1; i <= 12; i++) {
      const monthKey = `${selectedYear}-${i.toString().padStart(2, '0')}`;
      data[monthKey] = {
        month: months[i - 1].name,
        monthNum: i,
        kasKeluar: 0,
        kasMasuk: 0,
        saldo: 0,
      };
    }

    // Calculate from transactions
    realtimeTransactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      // Filter by selected year and months (if any selected)
      const matchesYear = year === selectedYear;
      const matchesMonth = selectedMonths.length === 0 || selectedMonths.includes(month);
      
      if (matchesYear && matchesMonth) {
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        
        if (data[monthKey]) {
          // Kas Masuk = Total revenue
          data[monthKey].kasMasuk += transaction.total;
          
          // Kas Keluar = Total cost (modal)
          transaction.items.forEach((item) => {
            const cost = (item.product.cost || 0) * item.quantity;
            data[monthKey].kasKeluar += cost;
          });
        }
      }
    });

    // Calculate saldo (kasMasuk - kasKeluar)
    Object.keys(data).forEach((key) => {
      data[key].saldo = data[key].kasMasuk - data[key].kasKeluar;
    });

    const result = Object.values(data);
    setMonthlyData(result);
  };

  // Calculate additional stats
  const calculateStats = () => {
    // Filter transactions by selected year and months
    const filteredTransactions = realtimeTransactions.filter((transaction) => {
      const date = new Date(transaction.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const matchesYear = year === selectedYear;
      const matchesMonth = selectedMonths.length === 0 || selectedMonths.includes(month);
      return matchesYear && matchesMonth;
    });

    // Top 5 Products
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    filteredTransactions.forEach((transaction) => {
      transaction.items.forEach((item) => {
        const productId = item.product.id;
        if (productSales[productId]) {
          productSales[productId].quantity += item.quantity;
          productSales[productId].revenue += item.product.price * item.quantity;
        } else {
          productSales[productId] = {
            name: item.product.name,
            quantity: item.quantity,
            revenue: item.product.price * item.quantity,
          };
        }
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Daily sales for highest, lowest, and average
    const dailySales: { [key: string]: number } = {};
    filteredTransactions.forEach((transaction) => {
      const dateKey = new Date(transaction.createdAt).toLocaleDateString('id-ID');
      dailySales[dateKey] = (dailySales[dateKey] || 0) + transaction.total;
    });

    const salesValues = Object.values(dailySales);
    const highestSale = salesValues.length > 0 ? Math.max(...salesValues) : 0;
    const lowestSale = salesValues.length > 0 ? Math.min(...salesValues) : 0;
    const averageSale = salesValues.length > 0 ? salesValues.reduce((a, b) => a + b, 0) / salesValues.length : 0;

    // Get last 7 days for sparklines
    const last7Days = Object.entries(dailySales)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-7)
      .map(([_, value]) => value);

    return {
      topProducts,
      highestSale,
      lowestSale,
      averageSale,
      last7Days: last7Days.length > 0 ? last7Days : [0, 0, 0, 0, 0, 0, 0],
    };
  };

  const stats = calculateStats();

  const toggleMonth = (monthNum: number) => {
    setSelectedMonths(prev => {
      if (prev.includes(monthNum)) {
        return prev.filter(m => m !== monthNum);
      } else {
        return [...prev, monthNum];
      }
    });
  };

  // Calculate totals
  const totalKasMasuk = monthlyData.reduce((sum, d) => sum + d.kasMasuk, 0);
  const totalKasKeluar = monthlyData.reduce((sum, d) => sum + d.kasKeluar, 0);
  const totalSaldo = totalKasMasuk - totalKasKeluar;

  // Prepare chart data
  const hasData = monthlyData.some(d => d.kasMasuk > 0 || d.kasKeluar > 0);
  
  const pieChartData = [
    {
      name: 'Masuk',
      population: totalKasMasuk || 1,
      color: isDark ? '#4BC0C0' : '#00897B', // Darker cyan for light mode
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Keluar',
      population: totalKasKeluar || 1,
      color: isDark ? '#FFCE56' : '#F57C00', // Darker orange for light mode
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
  ];

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity * 0.8})` : `rgba(0, 0, 0, ${opacity * 0.8})`,
    labelColor: (opacity = 1) => colors.textSecondary,
    style: { borderRadius: 16 },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#DC143C" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading realtime data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {/* Back Button for Mobile Views Only */}
        {!isDesktop && (
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={() => {
              console.log('🔙 Back button pressed in FinancialDashboard');
              if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history) {
                // Web: use browser history
                window.history.back();
              } else if (navigation && typeof navigation.goBack === 'function') {
                // Mobile: use React Navigation
                navigation.goBack();
              } else {
                console.warn('⚠️ Navigation not available');
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>PERFORMANCE DASHBOARD FINANCE</Text>
        <View style={styles.realtimeBadge}>
          <View style={styles.realtimeDot} />
          <Text style={styles.realtimeText}>Realtime</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Sidebar */}
        <View style={[styles.sidebar, { backgroundColor: colors.card, borderRightColor: colors.border }]}>
          {/* Year Selector */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterTitle, { color: colors.textSecondary }]}>YEAR</Text>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearButton, 
                  { backgroundColor: colors.background, borderColor: colors.border },
                  selectedYear === year && styles.yearButtonActive
                ]}
                onPress={() => setSelectedYear(year)}
              >
                <Text style={[
                  styles.yearText, 
                  { color: colors.textSecondary },
                  selectedYear === year && styles.yearTextActive
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Month Selector */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterTitle, { color: colors.textSecondary }]}>MONTH</Text>
            <View style={styles.monthGrid}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month.num}
                  style={[
                    styles.monthButton,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    selectedMonths.includes(month.num) && styles.monthButtonActive
                  ]}
                  onPress={() => toggleMonth(month.num)}
                >
                  <Text style={[
                    styles.monthText,
                    { color: colors.textSecondary },
                    selectedMonths.includes(month.num) && styles.monthTextActive
                  ]}>
                    {month.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setSelectedYear(new Date().getFullYear());
              setSelectedMonths([]);
            }}
          >
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Main Charts Area */}
        <ScrollView style={styles.chartsArea} showsVerticalScrollIndicator={false}>
          {/* Top Row */}
          <View style={styles.topRow}>
            {/* Kas Keluar Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>Kas Keluar</Text>
              <Text style={[styles.chartValue, { color: colors.text }]}>{formatCurrency(totalKasKeluar)}</Text>
              {hasData ? (
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={{
                      labels: monthlyData.map(d => d.month),
                      datasets: [{ 
                        data: monthlyData.map(d => Math.max(d.kasKeluar / 1000, 0.1)),
                        color: (opacity = 1) => isDark ? `rgba(255, 206, 86, ${opacity})` : `rgba(245, 124, 0, ${opacity})`,
                        strokeWidth: 2,
                      }],
                    }}
                    width={screenWidth * 0.28}
                    height={160}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => isDark ? `rgba(255, 206, 86, ${opacity * 0.3})` : `rgba(245, 124, 0, ${opacity * 0.3})`,
                      fillShadowGradient: isDark ? 'rgba(255, 206, 86, 0.1)' : 'rgba(245, 124, 0, 0.1)',
                      fillShadowGradientOpacity: 0.1,
                    }}
                    bezier
                    withDots={false}
                    withInnerLines={false}
                    withOuterLines={false}
                    withVerticalLabels={false}
                    withHorizontalLabels={false}
                    withShadow={false}
                    style={styles.miniChart}
                  />
                </View>
              ) : (
                <View style={styles.emptyChart}>
                  <Ionicons name="trending-down-outline" size={40} color={colors.textSecondary} />
                </View>
              )}
            </View>

            {/* Donut Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>Masuk Vs Keluar</Text>
              <View style={styles.pieChartContainer}>
                <View style={styles.pieChartWrapper}>
                  <PieChart
                    data={pieChartData}
                    width={screenWidth * 0.24}
                    height={180}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="20"
                    center={[10, 0]}
                    hasLegend={false}
                    absolute={false}
                  />
                </View>
                {/* Percentage Display Below Chart */}
                <View style={styles.percentageRow}>
                  <View style={styles.percentageItem}>
                    <View style={[styles.percentageDot, { backgroundColor: isDark ? '#4BC0C0' : '#00897B' }]} />
                    <Text style={[styles.percentageLabel, { color: colors.text }]}>
                      {Math.round((totalKasMasuk / (totalKasMasuk + totalKasKeluar || 1)) * 100)}%
                    </Text>
                  </View>
                  <View style={styles.percentageItem}>
                    <View style={[styles.percentageDot, { backgroundColor: isDark ? '#FFCE56' : '#F57C00' }]} />
                    <Text style={[styles.percentageLabel, { color: colors.text }]}>
                      {Math.round((totalKasKeluar / (totalKasMasuk + totalKasKeluar || 1)) * 100)}%
                    </Text>
                  </View>
                </View>
                {/* Custom Legend */}
                <View style={styles.customLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: isDark ? '#4BC0C0' : '#00897B' }]} />
                    <Text style={[styles.legendText, { color: colors.text }]}>Masuk</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: isDark ? '#FFCE56' : '#F57C00' }]} />
                    <Text style={[styles.legendText, { color: colors.text }]}>Keluar</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Saldo Card */}
            <View style={[styles.saldoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.saldoLabel, { color: colors.textSecondary }]}>Saldo</Text>
              <Text style={[styles.saldoValue, { color: totalSaldo >= 0 ? '#4CAF50' : '#F44336' }]}>
                {formatCurrency(totalSaldo)}
              </Text>
              {hasData && (
                <LineChart
                  data={{
                    labels: [],
                    datasets: [{ data: monthlyData.map(d => Math.max(d.saldo / 1000, 0.1)) }],
                  }}
                  width={screenWidth * 0.18}
                  height={70}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => totalSaldo >= 0 
                      ? `rgba(76, 175, 80, ${opacity})` 
                      : `rgba(244, 67, 54, ${opacity})`,
                  }}
                  bezier
                  withDots={false}
                  withInnerLines={false}
                  withOuterLines={false}
                  withVerticalLabels={false}
                  withHorizontalLabels={false}
                  style={styles.sparkline}
                />
              )}
            </View>
          </View>

          {/* Bottom Row */}
          <View style={styles.bottomRow}>
            {/* Kas Masuk Chart */}
            <View style={[styles.chartCard, styles.wideChart, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>Kas Masuk</Text>
              <Text style={[styles.chartValue, { color: colors.text }]}>{formatCurrency(totalKasMasuk)}</Text>
              {hasData ? (
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={{
                      labels: monthlyData.map(d => d.month),
                      datasets: [{ 
                        data: monthlyData.map(d => Math.max(d.kasMasuk / 1000, 0.1)),
                        color: (opacity = 1) => isDark ? `rgba(75, 192, 192, ${opacity})` : `rgba(0, 137, 123, ${opacity})`,
                        strokeWidth: 2,
                      }],
                    }}
                    width={screenWidth * 0.42}
                    height={200}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => isDark ? `rgba(75, 192, 192, ${opacity * 0.3})` : `rgba(0, 137, 123, ${opacity * 0.3})`,
                      fillShadowGradient: isDark ? 'rgba(75, 192, 192, 0.1)' : 'rgba(0, 137, 123, 0.1)',
                      fillShadowGradientOpacity: 0.1,
                    }}
                    bezier
                    withDots={true}
                    withInnerLines={false}
                    withOuterLines={false}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    withShadow={false}
                    yAxisSuffix="k"
                    style={styles.chart}
                  />
                </View>
              ) : (
                <View style={styles.emptyChartLarge}>
                  <Ionicons name="trending-up-outline" size={60} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No data</Text>
                </View>
              )}
            </View>

            {/* Transaksi Karyawan Terbanyak */}
            <View style={[styles.chartCard, styles.wideChart, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>Transaksi Karyawan Terbanyak</Text>
              <Text style={[styles.chartValue, { color: colors.text }]}>
                {(() => {
                  const employeeTransactions: { [key: string]: number } = {};
                  realtimeTransactions.forEach((transaction) => {
                    const date = new Date(transaction.createdAt);
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;
                    const matchesYear = year === selectedYear;
                    const matchesMonth = selectedMonths.length === 0 || selectedMonths.includes(month);
                    
                    if (matchesYear && matchesMonth && transaction.cashierId) {
                      employeeTransactions[transaction.cashierId] = (employeeTransactions[transaction.cashierId] || 0) + 1;
                    }
                  });
                  const maxTransactions = Math.max(...Object.values(employeeTransactions), 0);
                  return maxTransactions > 0 ? `${maxTransactions} Transaksi` : 'Belum ada data';
                })()}
              </Text>
              {(() => {
                const employeeTransactions: { [key: string]: number } = {};
                realtimeTransactions.forEach((transaction) => {
                  const date = new Date(transaction.createdAt);
                  const year = date.getFullYear();
                  const month = date.getMonth() + 1;
                  const matchesYear = year === selectedYear;
                  const matchesMonth = selectedMonths.length === 0 || selectedMonths.includes(month);
                  
                  if (matchesYear && matchesMonth && transaction.cashierId) {
                    employeeTransactions[transaction.cashierId] = (employeeTransactions[transaction.cashierId] || 0) + 1;
                  }
                });
                
                const topEmployees = Object.entries(employeeTransactions)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 12);
                
                const hasEmployeeData = topEmployees.length > 0;
                
                return hasEmployeeData ? (
                  <View style={styles.chartWrapper}>
                    <BarChart
                      data={{
                        labels: topEmployees.map(([id]) => {
                          const emp = employees.find(e => e.id === id || e.employeeId === id);
                          return emp?.name?.substring(0, 8) || id.substring(0, 8);
                        }),
                        datasets: [{ data: topEmployees.map(([_, count]) => Math.max(count, 0.1)) }],
                      }}
                      width={screenWidth * 0.43}
                      height={200}
                      chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                        barPercentage: 0.7,
                      }}
                      showValuesOnTopOfBars={false}
                      withInnerLines={false}
                      fromZero={true}
                      yAxisSuffix=""
                      yAxisLabel=""
                      style={styles.chart}
                    />
                  </View>
                ) : (
                  <View style={styles.emptyChartLarge}>
                    <Ionicons name="people-outline" size={60} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No data</Text>
                  </View>
                );
              })()}
            </View>
          </View>

          {/* Stats Row: Highest, Lowest, Average */}
          <View style={styles.statsRow}>
            {/* Highest Sale */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Ionicons name="trending-up" size={24} color="#4CAF50" />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Penjualan Tertinggi</Text>
              </View>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {formatCurrency(stats.highestSale)}
              </Text>
              {stats.last7Days.length > 0 && (
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={{
                      labels: [],
                      datasets: [{ 
                        data: stats.last7Days.map(v => Math.max(v / 1000, 0.1)),
                        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                        strokeWidth: 2,
                      }],
                    }}
                    width={screenWidth * 0.27}
                    height={60}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity * 0.2})`,
                      fillShadowGradient: 'rgba(76, 175, 80, 0.1)',
                      fillShadowGradientOpacity: 0.1,
                    }}
                    bezier
                    withDots={false}
                    withInnerLines={false}
                    withOuterLines={false}
                    withVerticalLabels={false}
                    withHorizontalLabels={false}
                    withShadow={false}
                    style={styles.miniSparkline}
                  />
                </View>
              )}
            </View>

            {/* Lowest Sale */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Ionicons name="trending-down" size={24} color="#FF9800" />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Penjualan Terendah</Text>
              </View>
              <Text style={[styles.statValue, { color: '#FF9800' }]}>
                {formatCurrency(stats.lowestSale)}
              </Text>
              {stats.last7Days.length > 0 && (
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={{
                      labels: [],
                      datasets: [{ 
                        data: stats.last7Days.map(v => Math.max(v / 1000, 0.1)),
                        color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                        strokeWidth: 2,
                      }],
                    }}
                    width={screenWidth * 0.27}
                    height={60}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(255, 152, 0, ${opacity * 0.2})`,
                      fillShadowGradient: 'rgba(255, 152, 0, 0.1)',
                      fillShadowGradientOpacity: 0.1,
                    }}
                    bezier
                    withDots={false}
                    withInnerLines={false}
                    withOuterLines={false}
                    withVerticalLabels={false}
                    withHorizontalLabels={false}
                    withShadow={false}
                    style={styles.miniSparkline}
                  />
                </View>
              )}
            </View>

            {/* Average Sale */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Ionicons name="analytics" size={24} color="#2196F3" />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rata-rata Harian</Text>
              </View>
              <Text style={[styles.statValue, { color: '#2196F3' }]}>
                {formatCurrency(stats.averageSale)}
              </Text>
              {stats.last7Days.length > 0 && (
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={{
                      labels: [],
                      datasets: [{ 
                        data: stats.last7Days.map(v => Math.max(v / 1000, 0.1)),
                        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                        strokeWidth: 2,
                      }],
                    }}
                    width={screenWidth * 0.27}
                    height={60}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity * 0.2})`,
                      fillShadowGradient: 'rgba(33, 150, 243, 0.1)',
                      fillShadowGradientOpacity: 0.1,
                    }}
                    bezier
                    withDots={false}
                    withInnerLines={false}
                    withOuterLines={false}
                    withVerticalLabels={false}
                    withHorizontalLabels={false}
                    withShadow={false}
                    style={styles.miniSparkline}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Top Products */}
          <View style={[styles.topProductsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.topProductsHeader}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={[styles.topProductsTitle, { color: colors.text }]}>Top 5 Produk Terlaris</Text>
            </View>
            {stats.topProducts.length > 0 ? (
              <View style={styles.topProductsList}>
                {stats.topProducts.map((product, index) => (
                  <View key={index} style={[styles.topProductItem, { backgroundColor: colors.background }]}>
                    <View style={[
                      styles.topProductRank, 
                      { backgroundColor: colors.border },
                      index < 3 && styles.topProductRankMedal
                    ]}>
                      <Text style={[styles.topProductRankText, { color: index < 3 ? '#000' : colors.text }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.topProductInfo}>
                      <Text style={[styles.topProductName, { color: colors.text }]}>{product.name}</Text>
                      <Text style={[styles.topProductQuantity, { color: colors.textSecondary }]}>{product.quantity} unit terjual</Text>
                    </View>
                    <View style={[styles.topProductBar, { backgroundColor: colors.border }]}>
                      <View 
                        style={[
                          styles.topProductBarFill, 
                          { 
                            width: `${(product.revenue / stats.topProducts[0].revenue) * 100}%`,
                            backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#4CAF50'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.topProductRevenue}>{formatCurrency(product.revenue)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Belum ada data produk</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  realtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
  },
  realtimeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  realtimeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 180,
    borderRightWidth: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  yearButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
  },
  yearButtonActive: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
  },
  yearText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  yearTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthButton: {
    width: 46,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  monthButtonActive: {
    backgroundColor: '#DC143C',
    borderColor: '#DC143C',
  },
  monthText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  monthTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#DC143C',
    marginTop: 12,
  },
  resetText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  chartsArea: {
    flex: 1,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chartCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  wideChart: {
    flex: 1,
  },
  chartLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  chartValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  chartWrapper: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  chart: {
    borderRadius: 8,
    marginTop: 8,
    marginLeft: -10,
  },
  miniChart: {
    borderRadius: 8,
    marginTop: 4,
    marginLeft: -10,
  },
  emptyChart: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartLarge: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    marginTop: 8,
  },
  saldoCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saldoLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  saldoValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  sparkline: {
    borderRadius: 6,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  statCard: {
    width: '32%',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    minHeight: 160,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  miniSparkline: {
    borderRadius: 6,
    marginTop: 8,
    marginLeft: -10,
  },
  topProductsCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  topProductsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  topProductsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  topProductsList: {
    flexDirection: 'column',
  },
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  topProductRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topProductRankMedal: {
    backgroundColor: '#FFD700',
  },
  topProductRankText: {
    fontSize: 16,
    fontWeight: '800',
  },
  topProductInfo: {
    flex: 1,
    minWidth: 150,
  },
  topProductName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  topProductQuantity: {
    fontSize: 12,
    fontWeight: '500',
  },
  topProductBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 16,
    minWidth: 150,
  },
  topProductBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  topProductRevenue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4CAF50',
    minWidth: 120,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  pieChartWrapper: {
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
    marginBottom: 4,
  },
  percentageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  percentageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  percentageLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  customLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
