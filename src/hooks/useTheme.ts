import { useColorScheme } from 'react-native';
import { useStore } from '../store/useStore';

export function useTheme() {
  const { theme } = useStore();
  const systemColorScheme = useColorScheme();

  // Determine active theme
  const activeTheme = theme === 'system' ? (systemColorScheme || 'dark') : theme;
  const isDark = activeTheme === 'dark';

  // Color palette
  const colors = {
    background: isDark ? '#0a0a0a' : '#ffffff',
    surface: isDark ? '#1a1a1a' : '#f5f5f5',
    card: isDark ? '#1a1a1a' : '#ffffff',
    border: isDark ? '#333' : '#e0e0e0',
    text: isDark ? '#fff' : '#000',
    textSecondary: isDark ? '#999' : '#666',
    primary: '#DC143C',
    primaryLight: '#DC143C20',
    success: '#4ECDC4',
    warning: '#FFD93D',
    error: '#FF6B6B',
    tabBar: isDark ? '#1a1a1a' : '#ffffff',
    tabBarBorder: '#DC143C',
  };

  return {
    theme: activeTheme,
    isDark,
    colors,
  };
}
