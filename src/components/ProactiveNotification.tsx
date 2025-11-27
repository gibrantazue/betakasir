import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProactiveAlert } from '../types/alerts';
import { useNavigation } from '@react-navigation/native';

interface Props {
  alert: ProactiveAlert;
  onDismiss: () => void;
  onPress?: () => void;
}

export function ProactiveNotification({ alert, onDismiss, onPress }: Props) {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 10 seconds for low priority
    if (alert.priority === 'low') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (alert.action) {
      if (alert.action.type === 'navigate') {
        navigation.navigate(alert.action.target as never, alert.action.params as never);
      }
    }
    handleDismiss();
  };

  const getIcon = () => {
    switch (alert.type) {
      case 'warning': return 'warning';
      case 'critical': return 'alert-circle';
      case 'success': return 'checkmark-circle';
      case 'opportunity': return 'bulb';
      case 'info': return 'information-circle';
      default: return 'notifications';
    }
  };

  const getColor = () => {
    switch (alert.type) {
      case 'warning': return '#FF9500';
      case 'critical': return '#FF3B30';
      case 'success': return '#34C759';
      case 'opportunity': return '#5856D6';
      case 'info': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          borderLeftColor: getColor(),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: getColor() + '20' }]}>
          <Ionicons name={getIcon()} size={24} color={getColor()} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {alert.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {alert.message}
          </Text>
          {alert.action && (
            <Text style={[styles.action, { color: getColor() }]}>
              {alert.action.label} →
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    left: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  action: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
