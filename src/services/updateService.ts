import { Platform } from 'react-native';

export interface AppVersion {
  version: string; // e.g., "1.0.0"
  buildNumber: number; // e.g., 1
  releaseDate: string; // ISO date string
  downloadUrl: {
    windows?: string; // URL to .exe file
    mac?: string; // URL to .dmg file
    android?: string; // URL to .apk file
    web?: string; // URL to web app
  };
  changelog: string[]; // List of changes
  mandatory: boolean; // Force update?
  minVersion: string; // Minimum supported version
}

// Current app version (update this when releasing new version)
export const CURRENT_VERSION = '1.2.2';
export const CURRENT_BUILD_NUMBER = 13;

// Cached version from GitHub (for display purposes)
let cachedGitHubVersion: string | null = null;

/**
 * Get current version - tries to fetch from GitHub first, falls back to hardcoded
 * This ensures version display is always in sync with GitHub releases
 */
export const getCurrentVersion = async (): Promise<string> => {
  // Return cached if available
  if (cachedGitHubVersion) {
    return cachedGitHubVersion;
  }
  
  try {
    // Try to fetch from GitHub
    const response = await fetch('https://api.github.com/repos/gibrantazue/betakasir/releases/latest', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (response.ok) {
      const release = await response.json();
      const version = release.tag_name.replace(/^v/, '');
      cachedGitHubVersion = version;
      console.log('✅ Version synced from GitHub:', version);
      return version;
    }
  } catch (error) {
    console.log('⚠️ Could not fetch version from GitHub, using hardcoded version');
  }
  
  // Fallback to hardcoded version
  return CURRENT_VERSION;
};

/**
 * Get latest version info from GitHub Releases
 */
export const getLatestVersion = async (): Promise<AppVersion | null> => {
  try {
    // Fetch from GitHub Releases API
    const response = await fetch('https://api.github.com/repos/gibrantazue/betakasir/releases/latest');
    
    if (!response.ok) {
      console.error('GitHub API error:', response.status);
      return null;
    }
    
    const release = await response.json();
    
    // Parse version from tag_name (e.g., "v1.1.8" -> "1.1.8")
    const version = release.tag_name.replace(/^v/, '');
    
    // Parse changelog from release body
    const changelog: string[] = [];
    if (release.body) {
      // Extract bullet points from markdown
      const lines = release.body.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
          changelog.push(trimmed.replace(/^[-*•]\s*/, ''));
        }
      }
    }
    
    // Find Windows .exe asset
    const windowsAsset = release.assets.find((asset: any) => 
      asset.name.endsWith('.exe') && asset.name.includes('Setup')
    );
    
    const appVersion: AppVersion = {
      version,
      buildNumber: parseInt(version.replace(/\./g, '')) || 0,
      releaseDate: release.published_at,
      downloadUrl: {
        windows: windowsAsset?.browser_download_url || '',
      },
      changelog: changelog.length > 0 ? changelog : ['Update tersedia'],
      mandatory: false,
      minVersion: '1.0.0',
    };
    
    console.log('✅ Latest version from GitHub:', version);
    return appVersion;
  } catch (error) {
    console.error('Error fetching latest version from GitHub:', error);
    return null;
  }
};

/**
 * Check if update is available
 */
export const checkForUpdates = async (): Promise<{
  updateAvailable: boolean;
  latestVersion: AppVersion | null;
  currentVersion: string;
}> => {
  try {
    const latestVersion = await getLatestVersion();
    
    if (!latestVersion) {
      return {
        updateAvailable: false,
        latestVersion: null,
        currentVersion: CURRENT_VERSION,
      };
    }
    
    // Compare versions
    const updateAvailable = isNewerVersion(latestVersion.version, CURRENT_VERSION);
    
    return {
      updateAvailable,
      latestVersion,
      currentVersion: CURRENT_VERSION,
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return {
      updateAvailable: false,
      latestVersion: null,
      currentVersion: CURRENT_VERSION,
    };
  }
};

/**
 * Compare two version strings
 * Returns true if newVersion is newer than currentVersion
 */
export const isNewerVersion = (newVersion: string, currentVersion: string): boolean => {
  const newParts = newVersion.split('.').map(Number);
  const currentParts = currentVersion.split('.').map(Number);
  
  for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
    const newPart = newParts[i] || 0;
    const currentPart = currentParts[i] || 0;
    
    if (newPart > currentPart) return true;
    if (newPart < currentPart) return false;
  }
  
  return false;
};

/**
 * Get download URL for current platform
 */
export const getDownloadUrl = (version: AppVersion): string | null => {
  // Check if running in web browser
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    return version.downloadUrl.web || null;
  }
  
  if (Platform.OS === 'windows') {
    return version.downloadUrl.windows || null;
  }
  
  if (Platform.OS === 'macos') {
    return version.downloadUrl.mac || null;
  }
  
  if (Platform.OS === 'android') {
    return version.downloadUrl.android || null;
  }
  
  return null;
};

/**
 * Download and install update (Desktop only)
 */
export const downloadAndInstallUpdate = async (downloadUrl: string): Promise<void> => {
  // Check if running in web browser
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    // For web, just reload
    window.location.reload();
    return;
  }
  
  // For Electron desktop app
  if (typeof window !== 'undefined' && (window as any).electron) {
    try {
      // Send message to Electron main process to download and install
      (window as any).electron.downloadUpdate(downloadUrl);
    } catch (error) {
      console.error('Error downloading update:', error);
      throw error;
    }
  } else {
    // For mobile or other platforms, open download URL in browser
    if (typeof window !== 'undefined') {
      window.open(downloadUrl, '_blank');
    }
  }
};

/**
 * Admin: Publish new version (via GitHub Releases)
 * Note: Upload .exe file to GitHub Releases manually or via script
 */
export const publishNewVersion = async (versionInfo: AppVersion): Promise<void> => {
  console.log('ℹ️ To publish new version:');
  console.log('1. Build: npm run build-electron');
  console.log('2. Upload to: https://github.com/gibrantazue/betakasir/releases/new');
  console.log('3. Tag:', `v${versionInfo.version}`);
  console.log('4. Upload .exe file');
  console.log('5. Publish release');
  console.log('✅ Done! App will auto-detect update from GitHub Releases');
};

/**
 * Check if current version is supported
 */
export const isVersionSupported = (minVersion: string): boolean => {
  return !isNewerVersion(minVersion, CURRENT_VERSION);
};
