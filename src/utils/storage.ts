// Safe AsyncStorage wrapper with error handling

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Safely get item from AsyncStorage
 */
export const getStorageItem = async <T = any>(key: string, defaultValue: T | null = null): Promise<T | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      return defaultValue;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`❌ Error getting storage item "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Safely set item to AsyncStorage
 */
export const setStorageItem = async <T = unknown>(key: string, value: T): Promise<boolean> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`❌ Error setting storage item "${key}":`, error);
    
    // Check if storage is full
    if (error instanceof Error && error.message.includes('QuotaExceededError')) {
      console.error('💾 Storage quota exceeded! Attempting to clear old data...');
      
      try {
        // Auto-clear cache and retry
        await clearStorageCache();
        
        // Retry save
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
        console.log('✅ Successfully saved after clearing cache');
        return true;
      } catch (retryError) {
        console.error('❌ Failed to save even after clearing cache:', retryError);
        return false;
      }
    }
    
    return false;
  }
};

/**
 * Safely remove item from AsyncStorage
 */
export const removeStorageItem = async (key: string): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`❌ Error removing storage item "${key}":`, error);
    return false;
  }
};

/**
 * Safely clear all AsyncStorage
 */
export const clearStorage = async (): Promise<boolean> => {
  try {
    await AsyncStorage.clear();
    console.log('✅ Storage cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
    return false;
  }
};

/**
 * Get all keys from AsyncStorage
 */
export const getAllStorageKeys = async (): Promise<readonly string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys;
  } catch (error) {
    console.error('❌ Error getting storage keys:', error);
    return [];
  }
};

/**
 * Get multiple items from AsyncStorage
 */
export const getMultipleStorageItems = async (keys: readonly string[]): Promise<Record<string, any>> => {
  try {
    const values = await AsyncStorage.multiGet(keys as string[]);
    const result: Record<string, any> = {};
    
    values.forEach(([key, value]) => {
      if (value !== null) {
        try {
          result[key] = JSON.parse(value);
        } catch (parseError) {
          console.error(`❌ Error parsing storage item "${key}":`, parseError);
          result[key] = null;
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error getting multiple storage items:', error);
    return {};
  }
};

/**
 * Set multiple items to AsyncStorage
 */
export const setMultipleStorageItems = async (items: Array<[string, any]>): Promise<boolean> => {
  try {
    const jsonItems: [string, string][] = items.map(([key, value]) => [key, JSON.stringify(value)]);
    await AsyncStorage.multiSet(jsonItems);
    return true;
  } catch (error) {
    console.error('❌ Error setting multiple storage items:', error);
    return false;
  }
};

/**
 * Check storage size (approximate)
 */
export const getStorageSize = async (): Promise<{ keys: number; estimatedSize: string }> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const values = await AsyncStorage.multiGet(keys);
    
    let totalSize = 0;
    values.forEach(([key, value]) => {
      if (value) {
        totalSize += key.length + value.length;
      }
    });
    
    // Convert to human readable format
    const sizeInKB = (totalSize / 1024).toFixed(2);
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    const estimatedSize = totalSize > 1024 * 1024 
      ? `${sizeInMB} MB` 
      : `${sizeInKB} KB`;
    
    return {
      keys: keys.length,
      estimatedSize,
    };
  } catch (error) {
    console.error('❌ Error getting storage size:', error);
    return { keys: 0, estimatedSize: '0 KB' };
  }
};

/**
 * Merge item with existing data in AsyncStorage
 */
export const mergeStorageItem = async <T extends Record<string, unknown>>(
  key: string, 
  value: Partial<T>
): Promise<boolean> => {
  try {
    const existing = await getStorageItem<T>(key, {} as T);
    const merged = { ...existing, ...value };
    return await setStorageItem(key, merged);
  } catch (error) {
    console.error(`❌ Error merging storage item "${key}":`, error);
    return false;
  }
};

/**
 * Clear cache items (items with 'cache_' prefix)
 * Used when storage quota is exceeded
 */
export const clearStorageCache = async (): Promise<boolean> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key.startsWith('cache_') || 
      key.startsWith('temp_') ||
      key.includes('_old_')
    );
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`✅ Cleared ${cacheKeys.length} cache items`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return false;
  }
};
