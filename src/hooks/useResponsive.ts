import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const width = dimensions.width;
  const height = dimensions.height;

  // Deteksi device type
  const getDeviceType = (): DeviceType => {
    if (Platform.OS === 'web') {
      if (width >= 1024) return 'desktop';
      if (width >= 768) return 'tablet';
      return 'mobile';
    }
    // React Native
    if (width >= 768) return 'tablet';
    return 'mobile';
  };

  const deviceType = getDeviceType();
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';
  const isWeb = Platform.OS === 'web';

  return {
    width,
    height,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isWeb,
  };
};
