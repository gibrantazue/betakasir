import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface AppVersion {
  version: string;
  releaseDate: string;
  downloadUrl: string;
  fileSize: string;
  changelog: string[];
  mandatory: boolean;
  minVersion?: string;
}

/**
 * Firebase Update Service
 * Menggunakan Firestore untuk info versi dan Firebase Storage untuk file installer
 */
class FirebaseUpdateService {
  private readonly COLLECTION = 'app_updates';
  private readonly DOC_ID = 'desktop_latest';

  /**
   * Cek versi terbaru dari Firestore
   */
  async checkForUpdates(currentVersion: string): Promise<{
    hasUpdate: boolean;
    updateInfo?: AppVersion;
    isMandatory?: boolean;
  }> {
    try {
      const docRef = doc(db, this.COLLECTION, this.DOC_ID);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log('No update info found in Firestore');
        return { hasUpdate: false };
      }

      const latestVersion = docSnap.data() as AppVersion;
      
      // Compare versions
      const hasUpdate = this.compareVersions(latestVersion.version, currentVersion) > 0;

      if (hasUpdate) {
        return {
          hasUpdate: true,
          updateInfo: latestVersion,
          isMandatory: latestVersion.mandatory || false
        };
      }

      return { hasUpdate: false };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return { hasUpdate: false };
    }
  }

  /**
   * Compare version strings (e.g., "1.2.0" vs "1.1.3")
   * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }

    return 0;
  }

  /**
   * Get download URL for latest version
   */
  async getDownloadUrl(): Promise<string | null> {
    try {
      const docRef = doc(db, this.COLLECTION, this.DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data().downloadUrl || null;
      }

      return null;
    } catch (error) {
      console.error('Error getting download URL:', error);
      return null;
    }
  }

  /**
   * Download installer file
   */
  async downloadUpdate(downloadUrl: string, onProgress?: (progress: number) => void): Promise<boolean> {
    try {
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      const chunks: BlobPart[] = [];

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value as BlobPart);
        loaded += value.length;

        if (onProgress && total > 0) {
          const progress = Math.round((loaded / total) * 100);
          onProgress(progress);
        }
      }

      // Combine chunks
      const blob = new Blob(chunks);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BetaKasir-Setup.exe';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error downloading update:', error);
      return false;
    }
  }
}

export const firebaseUpdateService = new FirebaseUpdateService();
