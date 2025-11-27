import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ContentProvider } from './src/context/ContentContext';
import { useStore } from './src/store/useStore';
import { useResponsive } from './src/hooks/useResponsive';
import { usePermissions } from './src/hooks/usePermissions';
import DesktopLayout from './src/components/DesktopLayout';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import AIAssistantButton from './src/components/AIAssistantButton';
import { useTheme } from './src/hooks/useTheme';
import UpdateModal from './src/components/UpdateModal';
import { useAppUpdate } from './src/hooks/useAppUpdate';

// Auth Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';

import HomeScreen from './src/screens/HomeScreen';
import CashierScreen from './src/screens/CashierScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import WhatsAppSettingsScreen from './src/screens/WhatsAppSettingsScreen';
import UserGuideScreen from './src/screens/UserGuideScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import EmployeesScreen from './src/screens/EmployeesScreen';
import BillingScreen from './src/screens/BillingScreen';
import RestockScreen from './src/screens/RestockScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminMigrationScreen from './src/screens/AdminMigrationScreen';
import AdminTestingScreen from './src/screens/AdminTestingScreen';
import AdminContentEditorScreen from './src/screens/AdminContentEditorScreen';
import AdminChangelogEditorScreen from './src/screens/AdminChangelogEditorScreen';
import AdminSalesManagementScreen from './src/screens/AdminSalesManagementScreen';
import ChangelogScreen from './src/screens/ChangelogScreen';
import SubscriptionExpiredScreen from './src/screens/SubscriptionExpiredScreen';
import ImageTestScreen from './src/screens/ImageTestScreen';
import AdminUpdateNotificationScreen from './src/screens/AdminUpdateNotificationScreen';
import { isAdmin } from './src/services/adminService';
import { useSubscription } from './src/hooks/useSubscription';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();

function MainTabs() {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Cashier') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'menu' : 'menu-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#DC143C',
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: '#DC143C',
        },
        headerShown: false,
        lazy: true,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Beranda' }}
      />
      <Tab.Screen 
        name="Cashier" 
        component={CashierScreen}
        options={{ tabBarLabel: 'Kasir' }}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{ tabBarLabel: 'Produk' }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen}
        options={{ tabBarLabel: 'Lainnya' }}
      />
    </Tab.Navigator>
  );
}

function MoreScreen({ navigation }: any) {
  const { permissions } = usePermissions();
  const { colors } = useTheme();
  
  const MenuItem = ({ icon, title, onPress, color = '#DC143C' }: any) => (
    <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Menu Lainnya</Text>
      </View>
      <ScrollView>
        {permissions?.canAccessTransactions && (
          <MenuItem
            icon="receipt-outline"
            title="Riwayat Transaksi"
            onPress={() => navigation.navigate('Transactions')}
          />
        )}
        {permissions?.canAccessCustomers && (
          <MenuItem
            icon="people-outline"
            title="Pelanggan"
            onPress={() => navigation.navigate('Customers')}
          />
        )}
        {permissions?.canManageEmployees && (
          <MenuItem
            icon="people-circle-outline"
            title="Karyawan"
            onPress={() => navigation.navigate('Employees')}
            color="#4ECDC4"
          />
        )}
        {permissions?.canAccessReports && (
          <MenuItem
            icon="stats-chart-outline"
            title="Laporan"
            onPress={() => navigation.navigate('Reports')}
          />
        )}
        {permissions?.canManageProducts && (
          <MenuItem
            icon="cube-outline"
            title="Restock Produk"
            onPress={() => {
              console.log('🔘 Restock button pressed in MoreScreen');
              console.log('📍 Navigation object:', navigation);
              navigation.navigate('Restock');
            }}
            color="#FF9800"
          />
        )}
        {permissions?.canAccessSettings && (
          <MenuItem
            icon="settings-outline"
            title="Pengaturan"
            onPress={() => navigation.navigate('Settings')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Desktop Navigator
function DesktopNavigator() {
  const [currentRoute, setCurrentRoute] = useState('Home');

  const screens: any = {
    Home: HomeScreen,
    Cashier: CashierScreen,
    Products: ProductsScreen,
    Transactions: TransactionsScreen,
    // Customers: CustomersScreen, // DISABLED - Feature removed
    Employees: EmployeesScreen,
    Reports: ReportsScreen,
    Restock: RestockScreen,
    Settings: SettingsScreen,
    WhatsAppSettings: WhatsAppSettingsScreen,
    UserGuide: UserGuideScreen,
    Changelog: ChangelogScreen,
    Billing: BillingScreen,
    ImageTest: ImageTestScreen,
  };

  const CurrentScreen = screens[currentRoute];

  const navigation = {
    navigate: (route: string) => setCurrentRoute(route),
  };

  return (
    <DesktopLayout navigation={navigation} currentRoute={currentRoute}>
      <CurrentScreen navigation={navigation} />
    </DesktopLayout>
  );
}

// Auth Navigator
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
    </Stack.Navigator>
  );
}

// Admin Navigator
function AdminNavigator() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <AdminStack.Screen name="AdminSalesManagement" component={AdminSalesManagementScreen} />
      <AdminStack.Screen name="AdminMigration" component={AdminMigrationScreen} />
      <AdminStack.Screen name="AdminTesting" component={AdminTestingScreen} />
      <AdminStack.Screen name="AdminContentEditor" component={AdminContentEditorScreen} />
      <AdminStack.Screen name="AdminChangelogEditor" component={AdminChangelogEditorScreen} />
      <AdminStack.Screen name="AdminUpdateNotification" component={AdminUpdateNotificationScreen} />
    </AdminStack.Navigator>
  );
}

// Expired Subscription Navigator
const ExpiredStack = createNativeStackNavigator();
function ExpiredNavigator() {
  return (
    <ExpiredStack.Navigator screenOptions={{ headerShown: false }}>
      <ExpiredStack.Screen name="SubscriptionExpired" component={SubscriptionExpiredScreen} />
      <ExpiredStack.Screen name="Billing" component={BillingScreen} />
    </ExpiredStack.Navigator>
  );
}

function AppContent() {
  const [initError, setInitError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const { colors } = useTheme();
  
  // App Update Checker
  const {
    updateAvailable,
    latestVersion,
    currentVersion,
    showUpdateModal,
    setShowUpdateModal,
  } = useAppUpdate();
  
  let user: any = null;
  let loading = true;
  let width = 1024;
  let subscriptionLoading = true;
  let isExpired = false;
  
  try {
    const authContext = useAuth();
    user = authContext.user;
    loading = authContext.loading;
    
    const responsive = useResponsive();
    width = responsive.width;
    
    // Check subscription status
    const subscriptionHook = useSubscription();
    subscriptionLoading = subscriptionHook.loading;
    isExpired = subscriptionHook.isSubscriptionExpired();
  } catch (error) {
    console.error('❌ Error in hooks:', error);
    setInitError(error instanceof Error ? error.message : 'Unknown error');
  }
  
  const { loadData, setCurrentUser, resetStore, employeeSession, setEmployeeSession } = useStore();

  // Restore employee session from AsyncStorage on mount
  useEffect(() => {
    const restoreEmployeeSession = async () => {
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        const sessionData = await AsyncStorage.default.getItem('employeeSession');
        
        if (sessionData) {
          const session = JSON.parse(sessionData);
          console.log('🔄 Restoring employee session:', session.employee.name);
          await setEmployeeSession(session);
          
          // Load data for this employee
          await loadData();
        }
      } catch (error) {
        console.error('❌ Error restoring employee session:', error);
      }
    };
    
    restoreEmployeeSession();
  }, []);

  // Load user role from Firestore
  useEffect(() => {
    const loadUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setRoleLoading(false);
        return;
      }

      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('./src/config/firebase');
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role || 'seller';
          console.log('👤 User role loaded:', role);
          setUserRole(role);
        } else {
          console.log('⚠️ User document not found, defaulting to seller');
          setUserRole('seller');
        }
      } catch (error) {
        console.error('❌ Error loading user role:', error);
        setUserRole('seller');
      } finally {
        setRoleLoading(false);
      }
    };

    loadUserRole();
  }, [user]);

  useEffect(() => {
    console.log('👤 User state in AppContent:', user ? user.email : 'null');
    if (user) {
      console.log('✅ User logged in, setting current user...');
      
      // Ensure seller document exists in Firestore (only for sellers, not sales)
      const initializeSeller = async () => {
        try {
          // Wait for role to be loaded
          if (roleLoading) return;
          
          // Only initialize seller document for sellers, not sales
          if (userRole === 'seller' || userRole === 'admin') {
            const { ensureSellerDocument } = await import('./src/services/employeeService');
            await ensureSellerDocument(user.uid, {
              email: user.email,
              name: user.displayName || user.email,
            });
          }
        } catch (error) {
          console.error('⚠️ Error ensuring seller document:', error);
        }
      };
      initializeSeller();
      
      // Set current user FIRST before loading data
      setCurrentUser({
        id: user.uid,
        name: user.displayName || user.email || 'User',
        email: user.email || '',
        role: (userRole === 'admin' ? 'admin' : 'cashier') as 'cashier' | 'admin',
        createdAt: new Date().toISOString(),
      });
      
      // Load data from localStorage (only for sellers)
      if (userRole === 'seller' || userRole === 'admin') {
        console.log('📂 Loading data from localStorage...');
        loadData();
        
        // Load employees from Firestore (will override localStorage)
        console.log('☁️ Loading employees from Firestore...');
        useStore.getState().loadEmployeesFromFirestore();
      }
    } else {
      console.log('❌ User is null, resetting store...');
      resetStore();
      setUserRole(null);
      setRoleLoading(false);
    }
  }, [user, userRole, roleLoading]);

  // Show error if initialization failed
  if (initError) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: '#DC143C', fontSize: 18, marginBottom: 16 }}>❌ Error</Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>{initError}</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 12, backgroundColor: '#DC143C', borderRadius: 8 }}
          onPress={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
        >
          <Text style={{ color: '#fff' }}>Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading screen
  if (loading || subscriptionLoading || roleLoading) {
    console.log('⏳ Loading...');
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#DC143C" />
        <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  // Check if admin user (admin bypass subscription check)
  if (user && isAdmin(user.email || '')) {
    console.log('👑 Admin logged in, showing Admin Navigator');
    return <AdminNavigator />;
  }

  // Show auth screens if not logged in (unless employee session exists)
  if (!user && !employeeSession) {
    console.log('🔓 No user and no employee session, showing AuthNavigator');
    return <AuthNavigator />;
  }

  // Check if subscription expired (only for sellers, not employees)
  if (user && !employeeSession && isExpired) {
    console.log('⏰ Subscription expired, showing Expired Screen');
    return <ExpiredNavigator />;
  }
  
  // If employee session exists but no Firebase user, show main app
  if (employeeSession && !user) {
    console.log('👷 Employee session active:', employeeSession.employee.name);
  }

  console.log('🔐 User logged in, showing main app');

  // Sementara paksa desktop untuk test
  const forceDesktop = width >= 1024;

  // Desktop layout dengan sidebar
  if (forceDesktop) {
    console.log('💻 Showing Desktop Layout');
    return <DesktopNavigator />;
  }

  // Mobile layout dengan bottom tabs
  console.log('📱 Showing Mobile Layout');
  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} />
        {/* <Stack.Screen name="Customers" component={CustomersScreen} /> */}
        <Stack.Screen name="Employees" component={EmployeesScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="Restock" component={RestockScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="WhatsAppSettings" component={WhatsAppSettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UserGuide" component={UserGuideScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Changelog" component={ChangelogScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Billing" component={BillingScreen} options={{ headerShown: true, title: 'Pilih Plan' }} />
        <Stack.Screen name="ImageTest" component={ImageTestScreen} options={{ headerShown: true, title: '📸 Image Recognition' }} />
      </Stack.Navigator>
      <AIAssistantButton />
      
      {/* Update Modal */}
      {updateAvailable && latestVersion && (
        <UpdateModal
          visible={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          versionInfo={latestVersion}
          currentVersion={currentVersion}
        />
      )}
    </>
  );
}

export default function App() {
  console.log('🚀 App starting...');
  
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <ContentProvider>
            <NavigationContainer
              fallback={
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#DC143C" />
                  <Text style={{ color: '#999', marginTop: 16 }}>Loading...</Text>
                </View>
              }
            >
              <AppContent />
            </NavigationContainer>
          </ContentProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#DC143C',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 15,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
