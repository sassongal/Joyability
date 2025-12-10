import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// ------------------------------------------------------------------
// FIREBASE CONFIGURATION
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyDUjgNWwAg_Ny8oayiiwxzRmYLsB3S_tx4",
  authDomain: "joyabilty.firebaseapp.com",
  projectId: "joyabilty",
  storageBucket: "joyabilty.firebasestorage.app",
  messagingSenderId: "729778885630",
  appId: "1:729778885630:web:91c898f771563acaaa26af",
  measurementId: "G-S64W45XJSV"
};

// Initialize Firebase (Singleton pattern to prevent re-initialization)
let app;
let auth;
let db;
let analytics;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Initialize Services
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Initialize Analytics safely (it's async in some environments)
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch(err => {
      console.warn("Firebase Analytics not supported in this environment:", err);
    });
  }

} catch (error) {
  console.error("Joyability: Failed to initialize Firebase", error);
}

export const googleProvider = new GoogleAuthProvider();

// Export services
export { auth, db, analytics };
export default app;