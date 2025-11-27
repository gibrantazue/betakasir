import { db } from '../config/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface UpdateNotification {
  id: string;
  latestVersion: string; // Versi terbaru yang tersedia (e.g., "1.2.0")
  updateAvailableMessage: string; // Pesan untuk user yang versi lama
  upToDateMessage: string; // Pesan untuk user yang sudah terbaru
  whatsappNumber: string;
  lastUpdated: string;
}

const UPDATE_DOC_ID = 'app-update-notification';

// Compare version strings (e.g., "1.1.10" vs "1.2.0")
export const compareVersions = (currentVersion: string, latestVersion: string): number => {
  const current = currentVersion.split('.').map(Number);
  const latest = latestVersion.split('.').map(Number);
  
  for (let i = 0; i < Math.max(current.length, latest.length); i++) {
    const c = current[i] || 0;
    const l = latest[i] || 0;
    
    if (c < l) return -1; // Current is older
    if (c > l) return 1;  // Current is newer
  }
  
  return 0; // Same version
};

// Check if update is available
export const hasUpdateAvailable = (currentVersion: string, latestVersion: string): boolean => {
  return compareVersions(currentVersion, latestVersion) < 0;
};

// Get update notification data
export const getUpdateNotification = async (): Promise<UpdateNotification | null> => {
  try {
    console.log('📡 Getting update notification from Firestore...');
    const docRef = doc(db, 'appSettings', UPDATE_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('✅ Document exists:', docSnap.data());
      return { id: docSnap.id, ...docSnap.data() } as UpdateNotification;
    }
    
    console.log('⚠️ Document not found, creating default...');
    
    // Return default if not exists
    const defaultData: Omit<UpdateNotification, 'id'> = {
      latestVersion: '1.1.10',
      upToDateMessage: 'Aplikasi Anda sudah menggunakan versi terbaru! 🎉',
      updateAvailableMessage: 'Update baru tersedia! Dapatkan fitur terbaru sekarang.',
      whatsappNumber: '6281340078956',
      lastUpdated: new Date().toISOString()
    };
    
    // Create default document
    console.log('💾 Creating document with data:', defaultData);
    await setDoc(docRef, defaultData);
    console.log('✅ Document created successfully!');
    
    return { id: UPDATE_DOC_ID, ...defaultData };
  } catch (error) {
    console.error('❌ Error getting update notification:', error);
    return null;
  }
};

// Listen to realtime updates
export const subscribeToUpdateNotification = (
  callback: (notification: UpdateNotification | null) => void
) => {
  const docRef = doc(db, 'appSettings', UPDATE_DOC_ID);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = { id: doc.id, ...doc.data() } as UpdateNotification;
      callback(data);
    } else {
      // Create default document if not exists
      const defaultData: Omit<UpdateNotification, 'id'> = {
        latestVersion: '1.1.10',
        upToDateMessage: 'Aplikasi Anda sudah menggunakan versi terbaru! 🎉',
        updateAvailableMessage: 'Update baru tersedia! Dapatkan fitur terbaru sekarang.',
        whatsappNumber: '6281340078956',
        lastUpdated: new Date().toISOString()
      };
      
      setDoc(docRef, defaultData).then(() => {
        callback({ id: UPDATE_DOC_ID, ...defaultData });
      });
    }
  }, (error) => {
    console.error('Error listening to update notification:', error);
    callback(null);
  });
};

// Update notification (Admin only)
export const updateNotificationSettings = async (
  data: Partial<Omit<UpdateNotification, 'id' | 'lastUpdated'>>
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'appSettings', UPDATE_DOC_ID);
    
    await setDoc(docRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return false;
  }
};

// Open WhatsApp
export const openWhatsApp = (phoneNumber: string, message?: string) => {
  const defaultMessage = 'Halo, saya ingin upgrade aplikasi BetaKasir ke versi terbaru.';
  const text = encodeURIComponent(message || defaultMessage);
  const url = `https://wa.me/${phoneNumber}?text=${text}`;
  
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
};
