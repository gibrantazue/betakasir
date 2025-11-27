import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImageAnalysisResult, ReceiptData, ProductInfo } from '../types/imageAnalysis';

interface Props {
  result: ImageAnalysisResult;
  onUseData?: (data: any) => void;
}

export function ImageAnalysisResultView({ result, onUseData }: Props) {
  const getIcon = () => {
    switch (result.type) {
      case 'receipt': return 'receipt-outline';
      case 'product': return 'cube-outline';
      case 'barcode': return 'barcode-outline';
      default: return 'image-outline';
    }
  };

  const getTitle = () => {
    switch (result.type) {
      case 'receipt': return 'Receipt Analysis';
      case 'product': return 'Product Recognition';
      case 'barcode': return 'Barcode Detected';
      default: return 'Image Analysis';
    }
  };

  const renderReceiptData = (data: ReceiptData) => (
    <View style={styles.dataContainer}>
      {data.storeName && (
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Store:</Text>
          <Text style={styles.dataValue}>{data.storeName}</Text>
        </View>
      )}
      {data.date && (
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Date:</Text>
          <Text style={styles.dataValue}>{data.date}</Text>
        </View>
      )}
      
      <Text style={styles.sectionTitle}>Items ({data.items?.length || 0}):</Text>
      {data.items?.map((item, index) => (
        <View key={index} style={styles.itemCard}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.itemDetails}>
            <Text style={styles.itemText}>Qty: {item.quantity}</Text>
            <Text style={styles.itemText}>@ Rp {item.price.toLocaleString('id-ID')}</Text>
            <Text style={styles.itemTotal}>Rp {item.total.toLocaleString('id-ID')}</Text>
          </View>
        </View>
      ))}
      
      {data.total && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>Rp {data.total.toLocaleString('id-ID')}</Text>
        </View>
      )}
    </View>
  );

  const renderProductData = (data: ProductInfo) => (
    <View style={styles.dataContainer}>
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>Name:</Text>
        <Text style={styles.dataValue}>{data.name}</Text>
      </View>
      {data.category && (
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Category:</Text>
          <Text style={styles.dataValue}>{data.category}</Text>
        </View>
      )}
      {data.suggestedPrice && (
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Suggested Price:</Text>
          <Text style={styles.dataValue}>Rp {data.suggestedPrice.toLocaleString('id-ID')}</Text>
        </View>
      )}
      {data.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.dataLabel}>Description:</Text>
          <Text style={styles.description}>{data.description}</Text>
        </View>
      )}
    </View>
  );

  const renderGeneralData = (data: any) => (
    <View style={styles.dataContainer}>
      <Text style={styles.description}>{data.description || JSON.stringify(data, null, 2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name={getIcon() as any} size={24} color="#007AFF" />
          <Text style={styles.title}>{getTitle()}</Text>
        </View>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            {Math.round(result.confidence * 100)}% confident
          </Text>
        </View>
      </View>

      {/* Insights */}
      {result.insights.length > 0 && (
        <View style={styles.insightsContainer}>
          {result.insights.map((insight, index) => (
            <View key={index} style={styles.insightRow}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Data */}
      <ScrollView style={styles.scrollView}>
        {result.type === 'receipt' && renderReceiptData(result.data)}
        {result.type === 'product' && renderProductData(result.data)}
        {result.type === 'general' && renderGeneralData(result.data)}
      </ScrollView>

      {/* Actions */}
      {onUseData && (
        <TouchableOpacity style={styles.useButton} onPress={() => onUseData(result.data)}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.useButtonText}>Use This Data</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  confidenceBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  insightsContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginBottom: 16,
  },
  dataContainer: {
    gap: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  dataValue: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginTop: 8,
    marginBottom: 8,
  },
  itemCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemText: {
    fontSize: 13,
    color: '#666666',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  descriptionContainer: {
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  useButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
