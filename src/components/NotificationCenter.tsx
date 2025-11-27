import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProactiveAlerts } from '../hooks/useProactiveAlerts';
import { ProactiveAlert } from '../types/alerts';
import { useNavigation } from '@react-navigation/native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NotificationCenter({ visible, onClose }: Props) {
  const { alerts, stats, markAsRead, dismissAlert, clearAll } = useProactiveAlerts();
  const navigation = useNavigation();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const displayAlerts = filter === 'unread' 
    ? alerts.filter(a => !a.isRead)
    : alerts;

  const handleAlertPress = (alert: ProactiveAlert) => {
    markAsRead(alert.id);
    
    if (alert.action) {
      if (alert.action.type === 'navigate') {
        navigation.navigate(alert.action.target as never, alert.action.params as never);
        onClose();
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return 'warning';
      case 'critical': return 'alert-circle';
      case 'success': return 'checkmark-circle';
      case 'opportunity': return 'bulb';
      case 'info': return 'information-circle';
      default: return 'notifications';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'warning': return '#FF9500';
      case 'critical': return '#FF3B30';
      case 'success': return '#34C759';
      case 'opportunity': return '#5856D6';
      case 'info': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Notifikasi</Text>
            <Text style={styles.headerSubtitle}>
              {stats.unread} belum dibaca
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Semua ({stats.total})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
              Belum Dibaca ({stats.unread})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          <View style={[styles.statCard, { borderLeftColor: '#FF3B30' }]}>
            <Text style={styles.statNumber}>{stats.byPriority.critical}</Text>
            <Text style={styles.statLabel}>Kritis</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#FF9500' }]}>
            <Text style={styles.statNumber}>{stats.byCategory.stock}</Text>
            <Text style={styles.statLabel}>Stok</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#007AFF' }]}>
            <Text style={styles.statNumber}>{stats.byCategory.sales}</Text>
            <Text style={styles.statLabel}>Penjualan</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#5856D6' }]}>
            <Text style={styles.statNumber}>{stats.byCategory.opportunity}</Text>
            <Text style={styles.statLabel}>Peluang</Text>
          </View>
        </ScrollView>

        {/* Alerts List */}
        <ScrollView style={styles.alertsList}>
          {displayAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>Tidak ada notifikasi</Text>
            </View>
          ) : (
            displayAlerts.map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={[
                  styles.alertItem,
                  !alert.isRead && styles.alertItemUnread,
                ]}
                onPress={() => handleAlertPress(alert)}
                activeOpacity={0.7}
              >
                <View style={[styles.alertIcon, { backgroundColor: getColor(alert.type) + '20' }]}>
                  <Ionicons name={getIcon(alert.type)} size={24} color={getColor(alert.type)} />
                </View>

                <View style={styles.alertContent}>
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertTitle} numberOfLines={1}>
                      {alert.title}
                    </Text>
                    <Text style={styles.alertTime}>{formatTime(alert.timestamp)}</Text>
                  </View>
                  <Text style={styles.alertMessage} numberOfLines={2}>
                    {alert.message}
                  </Text>
                  {alert.action && (
                    <Text style={[styles.alertAction, { color: getColor(alert.type) }]}>
                      {alert.action.label} →
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    dismissAlert(alert.id);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={20} color="#CCCCCC" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Footer Actions */}
        {displayAlerts.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.footerButton}
              onPress={clearAll}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={styles.footerButtonText}>Hapus Semua</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 100,
    borderLeftWidth: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  alertsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
  },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  alertItemUnread: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  alertTime: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  alertAction: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
    gap: 8,
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
