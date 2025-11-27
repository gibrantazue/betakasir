import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface GuideSection {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  steps: GuideStep[];
}

interface GuideStep {
  title: string;
  description: string;
  tips?: string[];
  screenshot?: string; // Placeholder untuk screenshot
}

const guideData: GuideSection[] = [
  {
    id: 'kasir',
    title: 'Cara Menggunakan Kasir',
    icon: 'cart',
    description: 'Panduan lengkap melakukan transaksi penjualan',
    steps: [
      {
        title: '1. Buka Halaman Kasir',
        description: 'Klik menu "Kasir" di sidebar untuk membuka halaman kasir.',
        tips: [
          'Gunakan shortcut F2 untuk langsung fokus ke pencarian produk',
          'Mode desktop otomatis aktif jika menggunakan komputer'
        ]
      },
      {
        title: '2. Cari dan Tambah Produk',
        description: 'Ketik nama produk atau scan barcode untuk mencari produk. Tekan Enter atau klik produk untuk menambahkan ke keranjang.',
        tips: [
          'Gunakan barcode scanner hardware untuk lebih cepat',
          'Produk otomatis masuk keranjang setelah di-scan',
          'Tekan + atau - untuk mengubah jumlah item'
        ]
      },
      {
        title: '3. Review Keranjang',
        description: 'Cek kembali produk yang sudah ditambahkan. Anda bisa mengubah jumlah atau menghapus item.',
        tips: [
          'Tekan F4 untuk melihat keranjang',
          'Klik tombol + / - untuk ubah quantity',
          'Klik tombol hapus untuk remove item'
        ]
      },
      {
        title: '4. Proses Pembayaran',
        description: 'Klik tombol "Bayar" atau tekan F8. Masukkan jumlah uang yang diterima dari pelanggan.',
        tips: [
          'Gunakan tombol nominal cepat (10rb, 20rb, 50rb, 100rb)',
          'Klik "Uang Pas" jika pelanggan bayar pas',
          'Kembalian otomatis terhitung'
        ]
      },
      {
        title: '5. Selesaikan Transaksi',
        description: 'Klik "Selesaikan" atau tekan Ctrl+S. Struk akan otomatis tercetak jika printer terhubung.',
        tips: [
          'Struk otomatis tercetak ke printer thermal',
          'Transaksi tersimpan di database',
          'Keranjang otomatis kosong untuk transaksi berikutnya'
        ]
      }
    ]
  },
  {
    id: 'produk',
    title: 'Mengelola Produk',
    icon: 'cube',
    description: 'Cara menambah, edit, dan hapus produk',
    steps: [
      {
        title: '1. Buka Halaman Produk',
        description: 'Klik menu "Produk" di sidebar untuk melihat daftar produk.',
        tips: ['Gunakan search box untuk mencari produk cepat']
      },
      {
        title: '2. Tambah Produk Baru',
        description: 'Klik tombol + di kanan atas. Isi form dengan data produk.',
        tips: [
          'Nama produk wajib diisi',
          'Barcode opsional, bisa di-generate otomatis',
          'Harga jual dan stok wajib diisi',
          'Format harga otomatis dengan pemisah ribuan (5,000,000)'
        ]
      },
      {
        title: '3. Scan Barcode untuk Cek Produk',
        description: 'Saat tambah produk, scan barcode untuk cek apakah produk sudah terdaftar.',
        tips: [
          'Jika produk ditemukan, data otomatis terisi',
          'Jika produk baru, isi data manual',
          'Klik "Generate" untuk buat barcode random'
        ]
      },
      {
        title: '4. Edit Produk',
        description: 'Klik icon pensil pada produk yang ingin diedit. Ubah data yang diperlukan lalu simpan.',
        tips: [
          'Semua field bisa diubah',
          'Perubahan langsung tersimpan ke database'
        ]
      },
      {
        title: '5. Hapus Produk',
        description: 'Klik icon tempat sampah pada produk yang ingin dihapus. Konfirmasi penghapusan.',
        tips: [
          'Produk yang dihapus tidak bisa dikembalikan',
          'Pastikan produk tidak sedang dalam transaksi'
        ]
      }
    ]
  },
  {
    id: 'transaksi',
    title: 'Melihat Riwayat Transaksi',
    icon: 'receipt',
    description: 'Cara melihat dan mengelola transaksi',
    steps: [
      {
        title: '1. Buka Halaman Transaksi',
        description: 'Klik menu "Transaksi" di sidebar untuk melihat riwayat transaksi.',
        tips: ['Transaksi diurutkan dari yang terbaru']
      },
      {
        title: '2. Filter Transaksi',
        description: 'Gunakan filter tanggal untuk melihat transaksi periode tertentu.',
        tips: [
          'Pilih "Hari Ini" untuk transaksi hari ini',
          'Pilih "Minggu Ini" atau "Bulan Ini" untuk periode lebih lama',
          'Gunakan "Custom" untuk pilih tanggal spesifik'
        ]
      },
      {
        title: '3. Lihat Detail Transaksi',
        description: 'Klik pada transaksi untuk melihat detail lengkap item yang dibeli.',
        tips: [
          'Detail menampilkan semua produk dalam transaksi',
          'Termasuk harga, quantity, dan total'
        ]
      },
      {
        title: '4. Cetak Ulang Struk',
        description: 'Klik tombol "Cetak Struk" untuk mencetak ulang struk transaksi.',
        tips: [
          'Pastikan printer terhubung',
          'Struk akan sama dengan struk asli'
        ]
      }
    ]
  },
  {
    id: 'karyawan',
    title: 'Mengelola Karyawan',
    icon: 'people',
    description: 'Cara menambah dan mengelola karyawan (Plan Business)',
    steps: [
      {
        title: '1. Upgrade ke Plan Business',
        description: 'Fitur karyawan hanya tersedia di plan Business. Upgrade di menu Pengaturan > Plan & Billing.',
        tips: ['Plan Business: Rp 99.000/bulan']
      },
      {
        title: '2. Tambah Karyawan',
        description: 'Buka menu "Karyawan", klik tombol +. Isi data karyawan (nama, email, role).',
        tips: [
          'Role: Kasir (hanya transaksi) atau Manager (full akses)',
          'Email wajib unik',
          'Password otomatis di-generate'
        ]
      },
      {
        title: '3. Download QR Code',
        description: 'Setelah karyawan dibuat, download QR code untuk login karyawan.',
        tips: [
          'QR code bisa dicetak untuk ID card',
          'Karyawan scan QR untuk login cepat'
        ]
      },
      {
        title: '4. Login Karyawan',
        description: 'Karyawan bisa login dengan scan QR code atau input email & password.',
        tips: [
          'Login karyawan otomatis track aktivitas',
          'Transaksi tercatat atas nama karyawan'
        ]
      }
    ]
  },
  {
    id: 'laporan',
    title: 'Melihat Laporan Keuangan',
    icon: 'stats-chart',
    description: 'Cara melihat laporan penjualan dan keuangan',
    steps: [
      {
        title: '1. Buka Halaman Laporan',
        description: 'Klik menu "Laporan" di sidebar untuk melihat dashboard laporan.',
        tips: ['Laporan realtime, update otomatis']
      },
      {
        title: '2. Pilih Periode',
        description: 'Pilih periode laporan: Hari Ini, Minggu Ini, Bulan Ini, atau Custom.',
        tips: [
          'Grafik otomatis update sesuai periode',
          'Data mencakup penjualan, transaksi, dan profit'
        ]
      },
      {
        title: '3. Analisis Data',
        description: 'Lihat grafik penjualan, produk terlaris, dan ringkasan keuangan.',
        tips: [
          'Grafik menampilkan trend penjualan',
          'Produk terlaris membantu stock planning',
          'Profit dihitung dari harga jual - harga modal'
        ]
      },
      {
        title: '4. Export Laporan',
        description: 'Klik tombol "Export" untuk download laporan dalam format Excel atau PDF.',
        tips: [
          'Excel untuk analisis lebih lanjut',
          'PDF untuk print atau share'
        ]
      }
    ]
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    icon: 'keypad',
    description: 'Shortcut keyboard untuk mempercepat transaksi',
    steps: [
      {
        title: 'Shortcut Kasir',
        description: 'Gunakan keyboard shortcuts untuk transaksi lebih cepat.',
        tips: [
          'F1 - Buka panduan shortcuts',
          'F2 - Fokus ke pencarian produk',
          'F4 - Lihat keranjang',
          'F5 - Clear search',
          'F8 - Proses pembayaran',
          '+ - Tambah quantity item pertama',
          '- - Kurangi quantity item pertama',
          'Del - Hapus item pertama',
          'Enter - Tambah produk ke keranjang',
          'Esc - Tutup modal',
          'Ctrl+K - Kosongkan keranjang',
          'Ctrl+S - Selesaikan transaksi'
        ]
      },
      {
        title: 'Tips Menggunakan Shortcuts',
        description: 'Latihan rutin untuk menghafal shortcuts.',
        tips: [
          'Mulai dengan F2, F8, Ctrl+S',
          'Latihan 10-15 menit setiap hari',
          'Target: 1 transaksi dalam 10 detik',
          'Fokus ke layar, bukan keyboard'
        ]
      }
    ]
  }
];

export default function UserGuideScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [selectedSection, setSelectedSection] = useState<GuideSection | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleSectionPress = (section: GuideSection) => {
    setSelectedSection(section);
    setShowDetailModal(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Panduan Penggunaan</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="book" size={48} color="#DC143C" />
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            Selamat Datang di BetaKasir!
          </Text>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
            Panduan lengkap untuk membantu Anda menggunakan aplikasi kasir profesional ini.
            Pilih topik di bawah untuk melihat tutorial detail.
          </Text>
        </View>

        {/* Guide Sections */}
        <View style={styles.sectionsContainer}>
          {guideData.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSectionPress(section)}
              activeOpacity={0.7}
            >
              <View style={[styles.sectionIcon, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name={section.icon} size={32} color="#DC143C" />
              </View>
              <View style={styles.sectionContent}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  {section.description}
                </Text>
                <View style={styles.sectionFooter}>
                  <Text style={[styles.stepCount, { color: colors.textSecondary }]}>
                    {section.steps.length} langkah
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color="#FFA500" />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Tips Cepat</Text>
          </View>
          <View style={styles.tipsList}>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              💡 Gunakan barcode scanner untuk transaksi lebih cepat
            </Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              ⌨️ Hafalkan keyboard shortcuts untuk efisiensi maksimal
            </Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              📊 Cek laporan setiap hari untuk monitor performa toko
            </Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              👥 Gunakan fitur karyawan untuk track aktivitas tim
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.backButton}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectedSection?.title}
            </Text>
            <View style={styles.backButton} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedSection?.steps.map((step, index) => (
              <View key={index} style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  {step.description}
                </Text>
                
                {step.tips && step.tips.length > 0 && (
                  <View style={[styles.tipsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.tipsBoxHeader}>
                      <Ionicons name="information-circle" size={18} color="#4ECDC4" />
                      <Text style={[styles.tipsBoxTitle, { color: colors.text }]}>Tips:</Text>
                    </View>
                    {step.tips.map((tip, tipIndex) => (
                      <Text key={tipIndex} style={[styles.tipText, { color: colors.textSecondary }]}>
                        • {tip}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  sectionCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  sectionIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  sectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCount: {
    fontSize: 12,
  },
  tipsCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  stepCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tipsBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  tipsBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
});
