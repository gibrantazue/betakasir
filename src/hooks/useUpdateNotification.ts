import { useState, useEffect } from 'react';
import { 
  UpdateNotification, 
  subscribeToUpdateNotification,
  getUpdateNotification 
} from '../services/updateNotificationService';

export const useUpdateNotification = () => {
  const [notification, setNotification] = useState<UpdateNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial load
    const loadInitialData = async () => {
      try {
        const data = await getUpdateNotification();
        setNotification(data);
      } catch (err) {
        setError('Failed to load update notification');
        console.error('Error loading update notification:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToUpdateNotification((data) => {
      setNotification(data);
      setLoading(false);
      if (data === null) {
        setError('Failed to load update notification');
      } else {
        setError(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    notification,
    loading,
    error,
    refresh: () => {
      setLoading(true);
      getUpdateNotification().then(setNotification).finally(() => setLoading(false));
    }
  };
};
