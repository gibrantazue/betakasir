import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useStore } from '../store/useStore';
import { isAdmin } from '../services/adminService';

// Conditional imports for platform-specific code
let signInWithPopup: any;
let signInWithCredential: any;
let GoogleSignin: any;

if (Platform.OS === 'web') {
  // Web only imports
  const firebaseAuth = require('firebase/auth');
  signInWithPopup = firebaseAuth.signInWithPopup;
} else {
  // Mobile: Try to import, but don't fail if not available (Expo Go)
  try {
    const googleSignin = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSignin.GoogleSignin;
    const firebaseAuth = require('firebase/auth');
    signInWithCredential = firebaseAuth.signInWithCredential;
  } catch (error) {
    console.log('⚠️ Google Sign In not available in Expo Go. Build with EAS to enable.');
    GoogleSignin = null;
  }
}

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // Helper function to create/update user document in Firestore
  const ensureUserDocument = async (firebaseUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      
      // Check if user document already exists
      const { getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // User exists, only update timestamp (don't overwrite role!)
        await setDoc(userRef, {
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        console.log('✅ User document updated (role preserved)');
      } else {
        // New user, create with default seller role
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role: 'seller',
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ New user document created with seller role');
      }
      
      console.log('✅ User document ensured in Firestore');
      
      // Check if subscription exists, if not create default
      const subRef = doc(db, 'users', firebaseUser.uid, 'subscription', 'current');
      const subDoc = await import('firebase/firestore').then(m => m.getDoc(subRef));
      
      if (!subDoc.exists()) {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days trial
        
        await setDoc(subRef, {
          userId: firebaseUser.uid,
          planType: 'free',
          status: 'trial',
          startDate: new Date().toISOString(),
          endDate: trialEndDate.toISOString(),
          autoRenew: false,
          trialEndsAt: trialEndDate.toISOString(),
          createdAt: new Date().toISOString(),
        });
        
        console.log('✅ Default subscription created');
      }
    } catch (error) {
      console.error('❌ Error ensuring user document:', error);
    }
  };

  useEffect(() => {
    // Configure Google Sign In for mobile (only if available)
    if (Platform.OS !== 'web' && GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId: '424861148877-70jnki6aga9trvllunq65o0utigttdem.apps.googleusercontent.com',
          offlineAccess: true,
        });
        console.log('✅ Google Sign In configured for mobile');
      } catch (error) {
        console.log('⚠️ Failed to configure Google Sign In:', error);
      }
    }

    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? firebaseUser.email : 'null');
      
      // Skip setting user if we're in registration process
      if (isRegistering) {
        console.log('⏭️ Skipping auth state change during registration');
        return;
      }
      
      // Ensure user document exists in Firestore
      if (firebaseUser) {
        await ensureUserDocument(firebaseUser);
      }
      
      setUser(firebaseUser);
      setLoading(false);
      
      // Save auth state
      if (firebaseUser) {
        await AsyncStorage.setItem('user', JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        }));
      } else {
        await AsyncStorage.removeItem('user');
      }
    });

    return unsubscribe;
  }, [isRegistering]);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if email is verified (skip for admin and sales)
      const userIsAdmin = isAdmin(email);
      
      // Check if user is sales by checking Firestore
      let isSalesUser = false;
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          isSalesUser = userData.role === 'sales';
        }
      } catch (error) {
        console.log('⚠️ Could not check user role:', error);
      }
      
      if (!user.emailVerified && !userIsAdmin && !isSalesUser) {
        // Logout user
        await firebaseSignOut(auth);
        throw new Error(
          'Email belum diverifikasi!\n\n' +
          'Silakan cek inbox email Anda dan klik link verifikasi.\n\n' +
          'Tidak menerima email? Cek folder Spam atau login ulang untuk kirim ulang email verifikasi.'
        );
      }
      
      if (userIsAdmin) {
        console.log('✅ Admin login - skipping email verification check');
      } else if (isSalesUser) {
        console.log('✅ Sales login - skipping email verification check');
      } else {
        console.log('✅ Email verified, login successful');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('📝 Creating user account...');
      setIsRegistering(true); // Set flag to prevent auto-login
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ User created in Auth:', user.uid);
      
      // Send email verification
      const { sendEmailVerification } = await import('firebase/auth');
      await sendEmailVerification(user);
      console.log('📧 Email verification sent to:', user.email);
      
      // Create user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: name,
        name: name,
        createdAt: new Date().toISOString(),
        role: 'seller',
        updatedAt: new Date().toISOString(),
        emailVerified: false,
      });
      
      console.log('✅ User document created in Firestore');
      
      // Create default subscription (free trial)
      const subRef = doc(db, 'users', user.uid, 'subscription', 'current');
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days trial
      
      await setDoc(subRef, {
        userId: user.uid,
        planType: 'free',
        status: 'trial',
        startDate: new Date().toISOString(),
        endDate: trialEndDate.toISOString(),
        autoRenew: false,
        trialEndsAt: trialEndDate.toISOString(),
        createdAt: new Date().toISOString(),
      });
      
      console.log('✅ Default subscription created (7 days free trial)');
      
      // Store email before logout
      const userEmail = user.email;
      
      // Logout user immediately (must verify email first)
      console.log('🔴 Logging out user after registration...');
      await firebaseSignOut(auth);
      
      // Force set user to null and reset loading
      setUser(null);
      setLoading(false);
      setIsRegistering(false); // Reset flag
      
      console.log('✅ User logged out - must verify email before login');
      
      // Return email for navigation
      return { email: userEmail };
    } catch (error: any) {
      console.error('❌ SignUp error:', error);
      setIsRegistering(false); // Reset flag on error
      // If error, also logout to be safe
      try {
        await firebaseSignOut(auth);
        setUser(null);
      } catch (logoutError) {
        console.error('Error during cleanup logout:', logoutError);
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🔴 Starting logout process...');
      
      // Step 1: Reset Zustand store
      try {
        useStore.getState().resetStore();
        console.log('✅ Store reset');
      } catch (storeError) {
        console.error('⚠️ Store reset error:', storeError);
      }
      
      // Step 2: Clear all local storage
      try {
        await AsyncStorage.clear();
        console.log('✅ AsyncStorage cleared');
      } catch (storageError) {
        console.error('⚠️ AsyncStorage clear error:', storageError);
      }
      
      // Step 3: Clear Firebase auth (this will trigger onAuthStateChanged)
      await firebaseSignOut(auth);
      console.log('✅ Firebase signOut completed');
      
      console.log('✅ Logout completed successfully');
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      throw new Error(error.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔵 Starting Google Sign In...');
      console.log('🔵 Platform:', Platform.OS);

      if (Platform.OS === 'web') {
        // Web: Use signInWithPopup
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        
        const result = await signInWithPopup(auth, provider);
        console.log('✅ Google Sign In Success (Web):', result.user.email);
      } else {
        // Mobile: Check if GoogleSignin is available
        if (!GoogleSignin) {
          throw new Error('Google Sign In tidak tersedia di Expo Go. Silakan build dengan EAS atau gunakan email/password login.');
        }
        
        // Mobile: Use @react-native-google-signin/google-signin
        console.log('🔵 Checking Google Play Services...');
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        
        console.log('🔵 Signing in with Google...');
        const userInfo = await GoogleSignin.signIn();
        console.log('✅ Google Sign In Success (Mobile):', userInfo.data?.user.email);
        
        // Get ID token
        const idToken = userInfo.data?.idToken;
        if (!idToken) {
          throw new Error('No ID token received from Google');
        }
        
        console.log('🔵 Creating Firebase credential...');
        const googleCredential = GoogleAuthProvider.credential(idToken);
        
        console.log('🔵 Signing in to Firebase...');
        const result = await signInWithCredential(auth, googleCredential);
        console.log('✅ Firebase Sign In Success:', result.user.email);
      }
      
    } catch (error: any) {
      console.error('❌ Google Sign In Error:', error);
      
      // Handle specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Login dibatalkan oleh user');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Domain tidak diizinkan. Tambahkan localhost ke Authorized domains di Firebase Console.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google Sign In belum di-enable di Firebase Console.');
      } else if (error.code === 'auth/invalid-api-key') {
        throw new Error('API Key Firebase tidak valid. Periksa konfigurasi Firebase.');
      } else if (error.message?.includes('XXXXX')) {
        throw new Error('Firebase config belum diisi! Buka src/config/firebase.ts dan isi dengan config Firebase Anda.');
      } else if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Login dibatalkan');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Login sedang berlangsung');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services tidak tersedia');
      }
      
      throw new Error(error.message || 'Gagal login dengan Google');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Configure action code settings with continue URL
      const actionCodeSettings = {
        // URL to redirect after password reset
        url: Platform.OS === 'web' 
          ? window.location.origin // Use current domain for web
          : 'betakasir://login', // Deep link for mobile (configure later)
        handleCodeInApp: false, // Let Firebase handle the reset page
      };
      
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      console.log('✅ Password reset email sent to:', email);
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      
      if (error.code === 'auth/user-not-found') {
        throw new Error('Email tidak terdaftar');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Format email tidak valid');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Terlalu banyak percobaan. Coba lagi nanti');
      }
      
      throw new Error(error.message || 'Gagal mengirim email reset password');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
