import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Utility untuk membuat document testing di Firestore
 * Jalankan function ini untuk auto-create document yang dibutuhkan
 */

// Create document testing/config
export const createTestingConfig = async () => {
  try {
    const testingRef = doc(db, 'testing', 'config');
    await setDoc(testingRef, {
      enabled: true,
      message: 'Testing mode is active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Document testing/config berhasil dibuat');
    return true;
  } catch (error) {
    console.error('❌ Error creating testing/config:', error);
    return false;
  }
};

// Create document appSettings/general
export const createAppSettings = async () => {
  try {
    const settingsRef = doc(db, 'appSettings', 'general');
    await setDoc(settingsRef, {
      appName: 'BetaKasir',
      version: '1.0.0',
      maintenanceMode: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Document appSettings/general berhasil dibuat');
    return true;
  } catch (error) {
    console.error('❌ Error creating appSettings/general:', error);
    return false;
  }
};

// Create document content/settings untuk Content Editor
export const createContentSettings = async () => {
  try {
    const contentRef = doc(db, 'content', 'settings');
    await setDoc(contentRef, {
      storeName: 'Toko Saya',
      storeAddress: 'Jl. Contoh No. 123',
      storePhone: '081234567890',
      receiptFooter: 'Terima kasih atas kunjungan Anda',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Document content/settings berhasil dibuat');
    return true;
  } catch (error) {
    console.error('❌ Error creating content/settings:', error);
    return false;
  }
};

// Create semua documents sekaligus
export const createAllTestingDocuments = async () => {
  console.log('🚀 Memulai pembuatan testing documents...');
  
  const results = await Promise.all([
    createTestingConfig(),
    createAppSettings(),
    createContentSettings()
  ]);
  
  const allSuccess = results.every(result => result === true);
  
  if (allSuccess) {
    console.log('✅ Semua testing documents berhasil dibuat!');
  } else {
    console.log('⚠️ Beberapa documents gagal dibuat, cek log di atas');
  }
  
  return allSuccess;
};
