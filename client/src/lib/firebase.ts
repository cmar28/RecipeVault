import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Login with Google
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Logout
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Listen to auth state changes
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current auth token with retry logic
export const getCurrentUserToken = async (forceRefresh = true): Promise<string | null> => {
  // If we have a current user, get the token
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken(forceRefresh);
    } catch (error) {
      console.error("Error getting ID token:", error);
      return null;
    }
  }
  
  // If no current user, wait a bit and try again
  // This helps in situations where auth state is still being established
  return new Promise((resolve) => {
    setTimeout(async () => {
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken(forceRefresh);
          resolve(token);
        } catch (error) {
          console.error("Error getting ID token on retry:", error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    }, 500);
  });
};