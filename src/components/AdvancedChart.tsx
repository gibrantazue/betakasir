import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { LineChart, AreaChart, BarChart, ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { formatCurrency } from '../utils/helpers';

const screenWidth = Dimensions.get('window').width;

interface ChartData {
  date: string;
  revenue: number;
  cost?: number;
  profit?: number;
  transactions?: number;
  volume?: number;
}

type ChartType = 'line' | 'area' | 'bar' | 'composed';
type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface AdvancedChartProps {
  data: ChartData[];
  title?: string;
  type?: ChartType;
  showVolume?: boolean;
  showIndicators?: boolean;
  height?: number;
}

export default function AdvancedChart({
  data,
  title = 'Grafik Penjualan',
  type = 'area',
  showVolume = true,
  showIndicators: initialShowIndicators = true,
  height = 300
}: AdvancedChartProps) {
  const { colors } = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>('1W');
  const [chartType, setChartType] = useState<ChartType>(type);
  const [showGrid, setShowGrid] = useState(true);
  const [showIndicators, setShowIndicators] = useState(initialShowIndicators);

  // Filter data based on time range
  const getFilteredData = () => {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case '1D':
        startDate.setDate(now.getDate() - 1);
        break;
      case '1W':
        startDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ALL':
        return data;
    }

    return data.filter(d => new Date(d.date) >= startDate);
  };

  const filteredData = getFilteredData();

  // Calculate indicators
  const calculateMA = (period: number) => {
    return filteredData.map((item, index) => {
      if (index < period - 1) return { ...item, [`ma${period}`]: null };
      const sum = filteredData
        .slice(index - period + 1, index + 1)
        .reduce((acc, curr) => acc + curr.revenue, 0);
      return { ...item, [`ma${period}`]: sum / period };
    });
  };

  const dataWithMA = showIndicators ? calculateMA(7) : filteredData;

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <View style={[styles.tooltip, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tooltipLabel, { color: colors.text }]}>{label}</Text>
          {payload.map((entry: any, index: number) => (
            <View key={index} style={styles.tooltipItem}>
              <View style={[styles.tooltipDot, { backgroundColor: entry.color }]} />
              <Text style={[styles.tooltipText, { color: colors.text }]}>
                {entry.name}: {formatCurrency(entry.value)}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    return null;
  };

  // Always show tooltip and legend (removed unused state)
  const showTooltip = true;
  const showLegend = true;

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: dataWithMA,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    const chartConfig = {
      stroke: colors.primary,
      strokeWidth: 2,
      dot: { fill: colors.primary, r: 4 },
      activeDot: { r: 6 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />}
            <XAxis dataKey="date" stroke={colors.textSecondary} />
            <YAxis stroke={colors.textSecondary} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            <Line type="monotone" dataKey="revenue" name="Pendapatan" {...chartConfig} />
            {showIndicators && (
              <Line
                type="monotone"
                dataKey="ma7"
                name="MA 7"
                stroke="#FFA500"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="5 5"
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />}
            <XAxis dataKey="date" stroke={colors.textSecondary} />
            <YAxis stroke={colors.textSecondary} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="revenue"
              name="Pendapatan"
              stroke={colors.primary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            {showIndicators && (
              <Line
                type="monotone"
                dataKey="ma7"
                name="MA 7"
                stroke="#FFA500"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="5 5"
              />
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />}
            <XAxis dataKey="date" stroke={colors.textSecondary} />
            <YAxis stroke={colors.textSecondary} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            <Bar dataKey="revenue" name="Pendapatan" fill={colors.primary} radius={[8, 8, 0, 0]} />
          </BarChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />}
            <XAxis dataKey="date" stroke={colors.textSecondary} />
            <YAxis stroke={colors.textSecondary} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="revenue"
              name="Pendapatan"
              stroke={colors.primary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            {showIndicators && (
              <Line
                type="monotone"
                dataKey="ma7"
                name="MA 7"
                stroke="#FFA500"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="5 5"
              />
            )}
            {showVolume && data[0]?.transactions && (
              <Bar dataKey="transactions" name="Transaksi" fill="#4CAF50" opacity={0.3} yAxisId="right" />
            )}
          </ComposedChart>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.background }]}
            onPress={() => setShowGrid(!showGrid)}
          >
            <Ionicons name="grid-outline" size={18} color={showGrid ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.background }]}
            onPress={() => setShowIndicators(!showIndicators)}
          >
            <Ionicons name="analytics-outline" size={18} color={showIndicators ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Range Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeRangeContainer}>
        {(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              { backgroundColor: colors.background, borderColor: colors.border },
              timeRange === range && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[
              styles.timeRangeText,
              { color: colors.textSecondary },
              timeRange === range && { color: '#fff', fontWeight: 'bold' }
            ]}>
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chart Type Selector */}
      <View style={styles.chartTypeContainer}>
        {(['line', 'area', 'bar', 'composed'] as ChartType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.chartTypeButton,
              { backgroundColor: colors.background, borderColor: colors.border },
              chartType === type && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setChartType(type)}
          >
            <Ionicons
              name={
                type === 'line' ? 'trending-up-outline' :
                  type === 'area' ? 'analytics-outline' :
                    type === 'bar' ? 'bar-chart-outline' : 'stats-chart-outline'
              }
              size={20}
              color={chartType === type ? '#fff' : colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </View>

      {/* Stats Summary */}
      <View style={[styles.statsContainer, { backgroundColor: colors.background }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tertinggi</Text>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>
            {filteredData.length > 0 
              ? formatCurrency(Math.max(...filteredData.map(d => d.revenue || 0)))
              : 'Rp 0'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Terendah</Text>
          <Text style={[styles.statValue, { color: '#F44336' }]}>
            {filteredData.length > 0 
              ? formatCurrency(Math.min(...filteredData.map(d => d.revenue || 0)))
              : 'Rp 0'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rata-rata</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {filteredData.length > 0 
              ? formatCurrency(filteredData.reduce((acc, d) => acc + (d.revenue || 0), 0) / filteredData.length)
              : 'Rp 0'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeRangeContainer: {
    marginBottom: 12,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chartTypeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  chartContainer: {
    marginVertical: 8,
  },
  tooltip: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tooltipLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tooltipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tooltipText: {
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
