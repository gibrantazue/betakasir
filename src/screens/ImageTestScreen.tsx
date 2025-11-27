import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { ImageUpload } from '../components/ImageUpload';
import { ImageAnalysisResultView } from '../components/ImageAnalysisResult';
import { imageAnalysisService } from '../services/imageAnalysisService';
import { ImageAnalysisResult } from '../types/imageAnalysis';
import { Ionicons } from '@expo/vector-icons';

export default function ImageTestScreen() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<'auto' | 'receipt' | 'product'>('auto');

  const handleImageSelected = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      let analysisResult: ImageAnalysisResult;

      switch (analysisType) {
        case 'receipt':
          analysisResult = await imageAnalysisService.analyzeReceipt(file);
          break;
        case 'product':
          analysisResult = await imageAnalysisService.analyzeProduct(file);
          break;
        default:
          analysisResult = await imageAnalysisService.autoAnalyze(file);
      }

      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseData = (data: any) => {
    alert('Data received! You can now integrate this with your app.\n\n' + JSON.stringify(data, null, 2));
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.notSupported}>
          <Ionicons name="warning" size={64} color="#FF9500" />
          <Text style={styles.notSupportedText}>
            Image Recognition currently only works on web platform.
          </Text>
          <Text style={styles.notSupportedSubtext}>
            Mobile support coming soon!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="image" size={32} color="#007AFF" />
        <Text style={styles.title}>Image Recognition Test</Text>
        <Text style={styles.subtitle}>Upload an image to analyze</Text>
      </View>

      {/* Analysis Type Selector */}
      <View style={styles.typeSelector}>
        <Text style={styles.typeSelectorLabel}>Analysis Type:</Text>
        <View style={styles.typeButtons}>
          <TouchableOpacity
            style={[styles.typeButton, analysisType === 'auto' && styles.typeButtonActive]}
            onPress={() => setAnalysisType('auto')}
          >
            <Text style={[styles.typeButtonText, analysisType === 'auto' && styles.typeButtonTextActive]}>
              Auto Detect
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, analysisType === 'receipt' && styles.typeButtonActive]}
            onPress={() => setAnalysisType('receipt')}
          >
            <Text style={[styles.typeButtonText, analysisType === 'receipt' && styles.typeButtonTextActive]}>
              Receipt
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, analysisType === 'product' && styles.typeButtonActive]}
            onPress={() => setAnalysisType('product')}
          >
            <Text style={[styles.typeButtonText, analysisType === 'product' && styles.typeButtonTextActive]}>
              Product
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Upload */}
      {!result && (
        <View style={styles.uploadSection}>
          <ImageUpload onImageSelected={handleImageSelected} isLoading={isAnalyzing} />
          {isAnalyzing && (
            <Text style={styles.analyzingText}>Analyzing image with AI...</Text>
          )}
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Result */}
      {result && (
        <View style={styles.resultSection}>
          <ImageAnalysisResultView result={result} onUseData={handleUseData} />
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <Text style={styles.resetButtonText}>Analyze Another Image</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      {!result && !isAnalyzing && (
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>📝 Instructions:</Text>
          <Text style={styles.instructionText}>1. Select analysis type (Auto, Receipt, or Product)</Text>
          <Text style={styles.instructionText}>2. Click upload area to select image</Text>
          <Text style={styles.instructionText}>3. Wait for AI to analyze (~3-5 seconds)</Text>
          <Text style={styles.instructionText}>4. Review results and use data</Text>
          
          <Text style={styles.tipsTitle}>💡 Tips for best results:</Text>
          <Text style={styles.tipText}>• Use clear, well-lit images</Text>
          <Text style={styles.tipText}>• Ensure text is readable</Text>
          <Text style={styles.tipText}>• Avoid blurry or dark images</Text>
          <Text style={styles.tipText}>• For receipts: flat surface, straight angle</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  typeSelector: {
    marginBottom: 24,
  },
  typeSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  uploadSection: {
    marginBottom: 24,
  },
  analyzingText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#007AFF',
    marginTop: 12,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultSection: {
    marginBottom: 24,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginTop: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  instructions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
    lineHeight: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginTop: 16,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
    lineHeight: 20,
  },
  notSupported: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  notSupportedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginTop: 20,
  },
  notSupportedSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
});
