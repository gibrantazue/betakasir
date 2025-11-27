import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useStore } from '../store/useStore';
import { useSubscription } from '../hooks/useSubscription';
import AIAssistant from './AIAssistant';
import { useTheme } from '../hooks/useTheme';

interface DesktopLayoutProps {
  children: React.ReactNode;
  navigation: any;
  currentRoute: string;
}

export default function DesktopLayout({ children, navigation, currentRoute }: DesktopLayoutProps) {
  const { user, signOut } = useAuth();
  const { permissions, isEmployee, employee } = usePermissions();
  const { employeeSession } = useStore();
  const { subscription } = useSubscription();
  const { colors } = useTheme();
  
  const [showAIAssistant, setShowAIAssistant] = React.useState(false);

  // Get plan badge text based on subscription
  const getPlanBadgeText = () => {
    if (!subscription) return null;
    
    switch (subscription.planType) {
      case 'free':
        return null; // Don't show badge for free
      case 'standard':
        return 'STANDARD';
      case 'business':
        return 'BUSINESS';
      case 'pro':
        return 'PRO';
      default:
        return null;
    }
  };

  const planBadgeText = getPlanBadgeText();

  // Define all menu items with permission requirements
  const allMenuItems = [
    { name: 'Home', label: 'Beranda', icon: 'home-outline', iconActive: 'home', permission: null },
    { name: 'Cashier', label: 'Kasir', icon: 'cart-outline', iconActive: 'cart', permission: 'canAccessCashier' },
    { name: 'Products', label: 'Produk', icon: 'cube-outline', iconActive: 'cube', permission: 'canAccessProducts' },
    { name: 'Transactions', label: 'Transaksi', icon: 'receipt-outline', iconActive: 'receipt', permission: 'canAccessTransactions' },
    // { name: 'Customers', label: 'Pelanggan', icon: 'people-outline', iconActive: 'people', permission: 'canAccessCustomers' }, // DISABLED
    { name: 'Employees', label: 'Karyawan', icon: 'people-circle-outline', iconActive: 'people-circle', permission: 'canManageEmployees' },
    { name: 'Reports', label: 'Laporan', icon: 'stats-chart-outline', iconActive: 'stats-chart', permission: 'canAccessReports' },
    { name: 'Settings', label: 'Pengaturan', icon: 'settings-outline', iconActive: 'settings', permission: 'canAccessSettings' },
  ];
  
  // Filter menu items based on permissions
  const menuItems = allMenuItems.filter(item => {
    if (!item.permission) return true; // Always show items without permission requirement
    if (!permissions) return false; // Hide if no permissions
    return permissions[item.permission as keyof typeof permissions] === true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sidebar */}
      <View style={[styles.sidebar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Logo/Brand */}
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Image 
              source={require('../../public/logo.png')} 
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.brandText, { color: colors.text }]}>BetaKasir</Text>
          {planBadgeText && (
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>{planBadgeText}</Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => {
            const isActive = currentRoute === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => navigation.navigate(item.name)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={(isActive ? item.iconActive : item.icon) as any}
                  size={22}
                  color={isActive ? '#fff' : colors.textSecondary}
                />
                <Text style={[styles.menuItemText, { color: colors.textSecondary }, isActive && styles.menuItemTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          
          {/* AI Assistant Menu Item */}
          <View style={styles.menuDivider} />
          <TouchableOpacity
            style={[styles.menuItem, styles.aiMenuItem]}
            onPress={() => setShowAIAssistant(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="sparkles" size={22} color="#DC143C" />
            <Text style={[styles.menuItemText, styles.aiMenuText]}>
              AI Assistant
            </Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>NEW</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer - User Info */}
        <View style={styles.sidebarFooter}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Ionicons name={isEmployee ? "person-circle" : "person"} size={20} color="#DC143C" />
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {isEmployee 
                  ? employee?.name 
                  : (user?.displayName || user?.email?.split('@')[0] || 'User')
                }
              </Text>
              <Text style={[styles.userRole, { color: colors.textSecondary }]} numberOfLines={1}>
                {isEmployee 
                  ? `${employee?.role === 'cashier' ? 'Kasir' : employee?.role === 'admin' ? 'Admin' : 'Seller'} • ${employee?.employeeId}`
                  : (user?.email || 'Owner')
                }
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                console.log('🔴 Logout button clicked - direct logout');
                signOut();
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#DC143C" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>
      
      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <AIAssistant 
          visible={showAIAssistant} 
          onClose={() => setShowAIAssistant(false)} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#1a1a1a',
    borderRightWidth: 2,
    borderRightColor: '#DC143C',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 12,
  },
  brandIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#DC143C20',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  brandText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  brandBadge: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  menu: {
    flex: 1,
    padding: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: '#DC143C',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  menuItemTextActive: {
    color: '#fff',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#DC143C20',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  userDetails: {
    flex: 1,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#DC143C20',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  userRole: {
    fontSize: 12,
    color: '#999',
  },
  content: {
    flex: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 12,
    marginHorizontal: 8,
  },
  aiMenuItem: {
    backgroundColor: '#DC143C10',
    borderWidth: 1,
    borderColor: '#DC143C',
  },
  aiMenuText: {
    color: '#DC143C',
    flex: 1,
  },
  aiBadge: {
    backgroundColor: '#DC143C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
