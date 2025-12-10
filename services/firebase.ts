import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  analytics?: Analytics;
  googleProvider: GoogleAuthProvider;
}

// ------------------------------------------------------------------
// FIREBASE CONFIGURATION
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// ------------------------------------------------------------------
// FIREBASE INITIALIZATION
// ------------------------------------------------------------------

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
let analytics: Analytics | undefined;
let firebaseServices: FirebaseServices | null = null;

const ensureAnalytics = async (): Promise<Analytics | undefined> => {
  if (analytics || typeof window === 'undefined') {
    return analytics;
  }

  try {
    const isAnalyticsSupported = await isSupported();
    if (isAnalyticsSupported) {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }

  return analytics;
};

/**
 * Initialize Firebase services with error handling and type safety
 */
export const initializeFirebase = async (): Promise<FirebaseServices> => {
  if (firebaseServices) {
    return firebaseServices;
  }

  try {
    await ensureAnalytics();

    firebaseServices = {
      app,
      auth,
      db,
      analytics,
      googleProvider
    };

    return firebaseServices;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw new Error('Firebase initialization failed');
  }
};

/**
 * Get Firebase services (must be called after initializeFirebase)
 */
export const getFirebaseServices = (): FirebaseServices => {
  if (!firebaseServices) {
    throw new Error('Firebase services not initialized. Call initializeFirebase() first.');
  }
  return firebaseServices;
};

// Initialize Firebase when this module is imported
if (typeof window !== 'undefined') {
  initializeFirebase().catch(console.error);
}

export { app, auth, db, analytics, googleProvider };
