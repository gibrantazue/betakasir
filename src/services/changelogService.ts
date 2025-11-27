import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChangelogEntry } from '../types/changelog';

const CHANGELOG_COLLECTION = 'changelogs';

// Get all changelogs (sorted by version desc)
export const getAllChangelogs = async (): Promise<ChangelogEntry[]> => {
  try {
    const q = query(collection(db, CHANGELOG_COLLECTION));
    const snapshot = await getDocs(q);
    const changelogs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChangelogEntry[];
    
    // Sort by version number (newest first)
    return changelogs.sort((a, b) => compareVersions(a.version, b.version));
  } catch (error) {
    console.error('Error getting changelogs:', error);
    throw error;
  }
};

// Get single changelog
export const getChangelog = async (id: string): Promise<ChangelogEntry | null> => {
  try {
    const docRef = doc(db, CHANGELOG_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ChangelogEntry;
    }
    return null;
  } catch (error) {
    console.error('Error getting changelog:', error);
    throw error;
  }
};

// Helper function to compare version numbers
const compareVersions = (a: string, b: string): number => {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aNum = aParts[i] || 0;
    const bNum = bParts[i] || 0;
    
    if (aNum > bNum) return -1; // a is newer
    if (aNum < bNum) return 1;  // b is newer
  }
  
  return 0; // equal
};

// Debug logging for version comparison
const logVersionComparison = (changelogs: ChangelogEntry[]) => {
  console.log('📊 Changelog versions before sort:');
  changelogs.forEach((c, i) => {
    console.log(`  ${i + 1}. v${c.version} (${c.date})`);
  });
  
  const sorted = [...changelogs].sort((a, b) => compareVersions(a.version, b.version));
  
  console.log('📊 Changelog versions after sort:');
  sorted.forEach((c, i) => {
    console.log(`  ${i + 1}. v${c.version} (${c.date})`);
  });
  
  return sorted;
};

// Subscribe to changelogs (realtime)
export const subscribeToChangelogs = (
  onUpdate: (changelogs: ChangelogEntry[]) => void,
  onError: (error: Error) => void
) => {
  // Don't use orderBy in query, we'll sort manually
  const q = query(collection(db, CHANGELOG_COLLECTION));

  return onSnapshot(
    q,
    (snapshot) => {
      const changelogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChangelogEntry[];
      
      // Sort by version number (newest first) with debug logging
      const sortedChangelogs = logVersionComparison(changelogs);
      
      onUpdate(sortedChangelogs);
    },
    (error) => {
      console.error('Error in changelog subscription:', error);
      onError(error);
    }
  );
};

// Create or update changelog
export const saveChangelog = async (
  changelog: Omit<ChangelogEntry, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string
): Promise<string> => {
  try {
    const changelogId = id || `v${changelog.version}`;
    const docRef = doc(db, CHANGELOG_COLLECTION, changelogId);
    
    const existingDoc = await getDoc(docRef);
    
    const data = {
      ...changelog,
      updatedAt: serverTimestamp(),
      ...(existingDoc.exists() ? {} : { createdAt: serverTimestamp() })
    };

    await setDoc(docRef, data, { merge: true });
    return changelogId;
  } catch (error) {
    console.error('Error saving changelog:', error);
    throw error;
  }
};

// Delete changelog
export const deleteChangelog = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, CHANGELOG_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting changelog:', error);
    throw error;
  }
};

// Get latest changelog
export const getLatestChangelog = async (): Promise<ChangelogEntry | null> => {
  try {
    const changelogs = await getAllChangelogs();
    return changelogs.length > 0 ? changelogs[0] : null;
  } catch (error) {
    console.error('Error getting latest changelog:', error);
    return null;
  }
};

// Predefined changelogs for quick upload
export const uploadPredefinedChangelog = async (version: string): Promise<void> => {
  const changelogData = getPredefinedChangelogData(version);
  
  if (!changelogData) {
    throw new Error(`Changelog data for version ${version} not found`);
  }
  
  await saveChangelog(changelogData, `v${version}`);
};

// Get predefined changelog data
const getPredefinedChangelogData = (version: string): Omit<ChangelogEntry, 'id' | 'createdAt' | 'updatedAt'> | null => {
  switch (version) {
    case '1.1.9':
      return {
        version: '1.1.9',
        date: '2025-01-22',
        title: 'AI Knows App Version',
        description: 'AI Assistant sekarang otomatis mengetahui versi aplikasi dan changelog terbaru! Plus perbaikan tombol Cek Update.',
        type: 'minor',
        changes: [
          {
            category: 'feature',
            text: 'AI Assistant sekarang tahu versi aplikasi saat ini'
          },
          {
            category: 'feature',
            text: 'AI dapat menjawab pertanyaan tentang changelog terbaru'
          },
          {
            category: 'feature',
            text: 'Auto-inject version info ke AI context'
          },
          {
            category: 'feature',
            text: 'Version display otomatis sync dari GitHub Releases'
          },
          {
            category: 'improvement',
            text: 'Fallback ke hardcoded version jika offline'
          },
          {
            category: 'improvement',
            text: 'Caching untuk performa optimal'
          },
          {
            category: 'bugfix',
            text: 'Fixed tombol "Cek Update" sekarang trigger electron auto-updater'
          },
          {
            category: 'bugfix',
            text: 'Improved version comparison accuracy'
          }
        ]
      };
      
    case '1.2.0':
      return {
        version: '1.2.0',
        date: '2025-11-22',
        title: 'Realtime Update & Pro Plan',
        description: 'Update v1.2.0 membawa sistem notifikasi update realtime dan rebranding Business Plan menjadi Pro Plan.',
        type: 'minor',
        changes: [
          {
            category: 'feature',
            text: 'Realtime Update Notification System'
          },
          {
            category: 'feature',
            text: 'Smart version comparison otomatis'
          },
          {
            category: 'feature',
            text: 'In-screen notification card tanpa popup'
          },
          {
            category: 'feature',
            text: 'Admin control panel untuk update notifications'
          },
          {
            category: 'feature',
            text: 'WhatsApp integration untuk upgrade'
          },
          {
            category: 'improvement',
            text: 'Business Plan → Pro Plan rebranding'
          },
          {
            category: 'improvement',
            text: 'Better update UX dengan always visible notification'
          },
          {
            category: 'bugfix',
            text: 'Fixed Alert.alert() tidak bekerja di web browser'
          },
          {
            category: 'bugfix',
            text: 'Fixed version comparison dengan semantic versioning'
          }
        ]
      };
      
    case '1.2.1':
      return {
        version: '1.2.1',
        date: '2025-11-23',
        title: 'Patch Update',
        description: 'Version synchronization update dengan fitur zoom control untuk desktop app.',
        type: 'patch',
        changes: [
          {
            category: 'feature',
            text: 'Zoom control untuk desktop (Ctrl +/-/0)'
          },
          {
            category: 'feature',
            text: 'Smooth zoom dengan increment 0.5 per press'
          },
          {
            category: 'improvement',
            text: 'Version synchronization across all files'
          },
          {
            category: 'improvement',
            text: 'Updated package.json version to 1.2.1'
          },
          {
            category: 'improvement',
            text: 'Updated app.json version to 1.2.1'
          },
          {
            category: 'improvement',
            text: 'Documentation updates'
          },
          {
            category: 'bugfix',
            text: 'Bug fixes dan improvements'
          }
        ]
      };
      
    default:
      return null;
  }
};
