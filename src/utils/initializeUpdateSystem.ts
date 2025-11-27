import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Initialize update system with test data
 * Call this once to create the latestVersion document for testing
 */
export const initializeUpdateSystem = async () => {
  try {
    console.log('🚀 Initializing update system...');
    
    const versionRef = doc(db, 'appSettings', 'latestVersion');
    
    // Create test update document
    await setDoc(versionRef, {
      version: '1.1.0',
      buildNumber: 2,
      releaseDate: new Date().toISOString(),
      downloadUrl: {
        windows: 'https://example.com/BetaKasir-Setup-1.1.0.exe',
        android: 'https://example.com/BetaKasir-1.1.0.apk',
        web: 'https://betakasir.com',
      },
      changelog: [
        '✨ Fitur baru: Export laporan ke Excel',
        '🐛 Perbaikan: Bug di halaman kasir',
        '⚡ Peningkatan: Loading 2x lebih cepat',
        '🔒 Keamanan: Update library keamanan',
      ],
      mandatory: false,
      minVersion: '1.0.0',
      publishedAt: new Date().toISOString(),
    });
    
    console.log('✅ Update system initialized successfully!');
    console.log('📝 Document created: appSettings/latestVersion');
    console.log('🔄 Refresh aplikasi untuk melihat modal update');
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing update system:', error);
    throw error;
  }
};

/**
 * Remove test update (reset to no update available)
 */
export const removeTestUpdate = async () => {
  try {
    console.log('🗑️ Removing test update...');
    
    const versionRef = doc(db, 'appSettings', 'latestVersion');
    
    // Set version same as current (no update available)
    await setDoc(versionRef, {
      version: '1.0.0',
      buildNumber: 1,
      releaseDate: new Date().toISOString(),
      downloadUrl: {
        web: 'https://betakasir.com',
      },
      changelog: ['Initial release'],
      mandatory: false,
      minVersion: '1.0.0',
    });
    
    console.log('✅ Test update removed!');
    console.log('🔄 Refresh aplikasi, modal tidak akan muncul');
    
    return true;
  } catch (error) {
    console.error('❌ Error removing test update:', error);
    throw error;
  }
};
