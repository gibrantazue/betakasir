import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShortcutGuideProps {
  visible: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'F1', description: 'Buka/Tutup Panduan Shortcut' },
  { key: 'F2', description: 'Fokus ke Pencarian Produk (untuk scan barcode)' },
  { key: 'F3', description: 'Fokus ke Pencarian (alternatif)' },
  { key: 'F4', description: 'Lihat Keranjang' },
  { key: 'F5', description: 'Clear Search / Refresh' },
  { key: 'F8', description: 'Proses Pembayaran' },
  { key: '+', description: 'Tambah Jumlah Item Pertama di Keranjang' },
  { key: '-', description: 'Kurangi Jumlah Item Pertama di Keranjang' },
  { key: 'Del', description: 'Hapus Item Pertama di Keranjang' },
  { key: 'Enter', description: 'Tambah Produk Pertama ke Keranjang' },
  { key: 'Esc', description: 'Tutup Modal / Batal' },
  { key: 'Ctrl+K', description: 'Kosongkan Seluruh Keranjang' },
  { key: 'Ctrl+S', description: 'Selesaikan Transaksi' },
];

export default function ShortcutGuide({ visible, onClose }: ShortcutGuideProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="keypad" size={24} color="#DC143C" />
              <Text style={styles.title}>Panduan Keyboard Shortcuts</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#999" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Gunakan keyboard shortcuts untuk mempercepat transaksi kasir
            </Text>

            {shortcuts.map((shortcut, index) => (
              <View key={index} style={styles.shortcutItem}>
                <View style={styles.keyContainer}>
                  <Text style={styles.keyText}>{shortcut.key}</Text>
                </View>
                <Text style={styles.descriptionText}>{shortcut.description}</Text>
              </View>
            ))}

            <View style={styles.footer}>
              <Ionicons name="information-circle" size={16} color="#666" />
              <Text style={styles.footerText}>
                Tekan F1 kapan saja untuk membuka panduan ini
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    lineHeight: 20,
  },
  shortcutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  keyContainer: {
    backgroundColor: '#0a0a0a',
    borderWidth: 2,
    borderColor: '#DC143C',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  keyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC143C',
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
  },
  descriptionText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
});
