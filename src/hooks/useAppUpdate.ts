import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { checkForUpdates, AppVersion } from '../services/updateService';

export const useAppUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<AppVersion | null>(null);
  const [currentVersion, setCurrentVersion] = useState('');
  const [checking, setChecking] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const checkUpdate = useCallback(async () => {
    if (checking) return;
    
    try {
      setChecking(true);
      console.log('🔍 Checking for updates...');
      
      const result = await checkForUpdates();
      
      setUpdateAvailable(result.updateAvailable);
      setLatestVersion(result.latestVersion);
      setCurrentVersion(result.currentVersion);
      
      if (result.updateAvailable && result.latestVersion) {
        console.log('✅ Update available:', result.latestVersion.version);
        setShowUpdateModal(true);
      } else {
        console.log('✅ App is up to date');
      }
    } catch (error) {
      console.error('❌ Error checking for updates:', error);
    } finally {
      setChecking(false);
    }
  }, [checking]);

  // Check for updates on mount
  useEffect(() => {
    checkUpdate();
  }, []);

  // Check for updates when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active, checking for updates...');
        checkUpdate();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkUpdate]);

  // Check for updates periodically (every 30 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Periodic update check...');
      checkUpdate();
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      clearInterval(interval);
    };
  }, [checkUpdate]);

  return {
    updateAvailable,
    latestVersion,
    currentVersion,
    checking,
    showUpdateModal,
    setShowUpdateModal,
    checkUpdate,
  };
};
