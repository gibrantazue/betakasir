import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, setTheme } = useStore();
  const { colors } = useTheme();

  const themes: Array<{ value: 'light' | 'dark' | 'system'; icon: any; label: string }> = [
    { value: 'light', icon: 'sunny', label: 'Light' },
    { value: 'dark', icon: 'moon', label: 'Dark' },
    { value: 'system', icon: 'phone-portrait', label: 'System' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {themes.map((t) => (
        <TouchableOpacity
          key={t.value}
          style={[
            styles.button,
            theme === t.value && styles.activeButton,
          ]}
          onPress={() => setTheme(t.value)}
        >
          <Ionicons
            name={t.icon}
            size={20}
            color={theme === t.value ? '#DC143C' : colors.textSecondary}
          />
          <Text style={[
            styles.label,
            { color: theme === t.value ? '#DC143C' : colors.textSecondary },
            theme === t.value && styles.activeLabel,
          ]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeButton: {
    backgroundColor: '#DC143C20',
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#DC143C',
    fontWeight: '600',
  },
});
