import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AIAssistant from './AIAssistant';
import { NotificationCenter } from './NotificationCenter';
import { ProactiveNotification } from './ProactiveNotification';
import { useProactiveAlerts } from '../hooks/useProactiveAlerts';
import { useNavigationState } from '@react-navigation/native';

interface AIAssistantButtonProps {
  currentScreen?: string;
}

export default function AIAssistantButton({ currentScreen }: AIAssistantButtonProps) {
  const [visible, setVisible] = useState(false);
  const [notificationCenterVisible, setNotificationCenterVisible] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const { alerts, stats, dismissAlert } = useProactiveAlerts();

  // Auto-detect current screen from navigation if not provided
  // Use try-catch to handle case when component is outside navigator
  let detectedScreen = currentScreen || 'Home';
  try {
    const navigationState = useNavigationState(state => state);
    detectedScreen = currentScreen || navigationState?.routes[navigationState.index]?.name || 'Home';
  } catch (error) {
    // Component is outside navigator context, use default or provided screen
    console.log('AIAssistantButton: Not inside navigator, using default screen');
  }

  // Show latest unread alert as toast
  const latestAlert = alerts.find(a => !a.isRead && !a.isDismissed);

  const handlePress = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setVisible(true);
  };

  const handleLongPress = () => {
    setNotificationCenterVisible(true);
  };

  return (
    <>
      {/* Proactive Toast Notification */}
      {latestAlert && (
        <ProactiveNotification
          alert={latestAlert}
          onDismiss={() => dismissAlert(latestAlert.id)}
        />
      )}

      {/* AI Assistant FAB with Badge */}
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handlePress}
          onLongPress={handleLongPress}
        >
          <Ionicons name="sparkles" size={24} color="#fff" />
          {stats.unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {stats.unread > 9 ? '9+' : stats.unread}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* AI Assistant Modal */}
      <AIAssistant 
        visible={visible} 
        onClose={() => setVisible(false)} 
        currentScreen={detectedScreen}
      />

      {/* Notification Center Modal */}
      <NotificationCenter
        visible={notificationCenterVisible}
        onClose={() => setNotificationCenterVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC143C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC143C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
