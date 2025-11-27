import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Firebase configuration
// Note: In React Native/Expo, we use fallback values since process.env doesn't work the same way
// For production, these should be configured via Expo's environment variables or app.json
const firebaseConfig = {
  apiKey: "AIzaSyBJ7Kd9rTJE8FvyyVbF-o0RgnSgormwmnY",
  authDomain: "betakasir.firebaseapp.com",
  projectId: "betakasir",
  storageBucket: "betakasir.firebasestorage.app",
  messagingSenderId: "424861148877",
  appId: "1:424861148877:web:f064ebd57c9035b976ab84",
  measurementId: "G-P3GM97YQCZ"
};

// Google OAuth Client ID
// Web Client ID: 424861148877-70jnki6aga9trvllunq65o0utigttdem.apps.googleusercontent.com

console.log('🔥 Initializing Firebase...');
console.log('🔥 Project:', firebaseConfig.projectId);
console.log('🔥 Platform:', Platform.OS);

// Initialize Firebase (prevent duplicate initialization)
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
console.log('✅ Firebase app initialized');

// Initialize Auth
// Note: For React Native, persistence is handled by AsyncStorage automatically
const auth: Auth = getAuth(app);
console.log('✅ Firebase Auth initialized');

// Initialize Firestore
const db: Firestore = getFirestore(app);
console.log('✅ Firestore initialized');

// Initialize Storage
const storage: FirebaseStorage = getStorage(app);
console.log('✅ Firebase Storage initialized');

export { auth, db, storage };
export default app;
