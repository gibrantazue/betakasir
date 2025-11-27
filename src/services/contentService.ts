import { doc, getDoc, setDoc, onSnapshot, collection, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface AppContent {
  // Settings Page Content - Editable by Admin
  settingsContent: {
    // App Version
    appVersion: string;
    
    // About BetaKasir
    aboutTitle: string;
    aboutDescription: string;
    aboutFeatures: string;
    aboutSecurity: string;
    aboutContactWebsite: string;
    aboutContactEmail: string;
    aboutContactWhatsApp: string;
    
    // Help & Support
    helpTitle: string;
    helpSubtitle: string;
    helpWhatsAppTitle: string;
    helpWhatsAppSubtitle: string;
    helpWhatsAppNumber: string;
    helpEmailTitle: string;
    helpEmailSubtitle: string;
    helpEmailAddress: string;
    helpDocsTitle: string;
    helpDocsSubtitle: string;
    helpDocsUrl: string;
    helpVideoTitle: string;
    helpVideoSubtitle: string;
    helpVideoChannel: string;
    
    // User Guide
    userGuideTitle: string;
    userGuideSubtitle: string;
  };
}

// Default content (Indonesian)
export const DEFAULT_CONTENT: AppContent = {
  settingsContent: {
    // App Version
    appVersion: '1.0.0 (Beta)',
    
    // About BetaKasir
    aboutTitle: 'BetaKasir',
    aboutDescription: 'BetaKasir adalah aplikasi kasir modern untuk toko, minimarket, dan UMKM. Dilengkapi dengan fitur lengkap untuk mengelola produk, transaksi, customer, dan karyawan secara realtime.',
    aboutFeatures: '• Manajemen Produk & Barcode Scanner\n• Transaksi Kasir Cepat\n• Laporan Keuangan Lengkap\n• Manajemen Customer\n• Manajemen Karyawan & Role\n• Cetak Struk Otomatis\n• Sync Realtime Multi-Device\n• Cloud Backup Otomatis',
    aboutSecurity: 'Data Anda tersimpan aman di Firebase Cloud dengan enkripsi end-to-end. Setiap seller memiliki data terpisah dan tidak dapat diakses oleh seller lain.',
    aboutContactWebsite: 'www.betakasir.com',
    aboutContactEmail: 'support@betakasir.com',
    aboutContactWhatsApp: '+62 812-3456-7890',
    
    // Help & Support
    helpTitle: 'Butuh Bantuan?',
    helpSubtitle: 'Kami siap membantu Anda!',
    helpWhatsAppTitle: 'WhatsApp Support',
    helpWhatsAppSubtitle: 'Chat langsung dengan tim support',
    helpWhatsAppNumber: '+62 812-3456-7890',
    helpEmailTitle: 'Email Support',
    helpEmailSubtitle: 'Kirim email ke tim support',
    helpEmailAddress: 'support@betakasir.com',
    helpDocsTitle: 'Dokumentasi',
    helpDocsSubtitle: 'Panduan lengkap penggunaan aplikasi',
    helpDocsUrl: 'www.betakasir.com/docs',
    helpVideoTitle: 'Video Tutorial',
    helpVideoSubtitle: 'Tutorial lengkap di YouTube',
    helpVideoChannel: '@betakasir',
    
    // User Guide
    userGuideTitle: 'Panduan Penggunaan',
    userGuideSubtitle: 'Tutorial lengkap cara pakai aplikasi',
  },
};

/**
 * Get app content from Firestore
 */
export const getAppContent = async (): Promise<AppContent> => {
  try {
    const contentRef = doc(db, 'appSettings', 'content');
    const contentDoc = await getDoc(contentRef);
    
    if (contentDoc.exists()) {
      return contentDoc.data() as AppContent;
    }
    
    // If not exists, create default
    await setDoc(contentRef, DEFAULT_CONTENT);
    return DEFAULT_CONTENT;
  } catch (error) {
    console.error('Error fetching app content:', error);
    return DEFAULT_CONTENT;
  }
};

/**
 * Update app content (Admin only)
 */
export const updateAppContent = async (content: Partial<AppContent>): Promise<void> => {
  try {
    const contentRef = doc(db, 'appSettings', 'content');
    
    // Check if document exists first
    const contentDoc = await getDoc(contentRef);
    
    if (contentDoc.exists()) {
      // Update existing document
      await updateDoc(contentRef, content as any);
    } else {
      // Create new document if not exists
      await setDoc(contentRef, content);
    }
    
    console.log('✅ App content updated successfully');
  } catch (error) {
    console.error('❌ Error updating app content:', error);
    throw error;
  }
};

/**
 * Subscribe to realtime content updates
 */
export const subscribeToContent = (
  onUpdate: (content: AppContent) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const contentRef = doc(db, 'appSettings', 'content');
  
  const unsubscribe = onSnapshot(
    contentRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as AppContent);
      } else {
        onUpdate(DEFAULT_CONTENT);
      }
    },
    (error) => {
      console.error('Error in content subscription:', error);
      if (onError) {
        onError(error);
      }
    }
  );
  
  return unsubscribe;
};

/**
 * Reset content to default
 */
export const resetContentToDefault = async (): Promise<void> => {
  try {
    const contentRef = doc(db, 'appSettings', 'content');
    await setDoc(contentRef, DEFAULT_CONTENT);
    console.log('✅ Content reset to default');
  } catch (error) {
    console.error('❌ Error resetting content:', error);
    throw error;
  }
};
