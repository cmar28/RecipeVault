import admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

// Initialize Firebase Admin
// When running in production or Replit, use environment variables for project ID
// In development, we'll use a less secure approach for convenience
let firebaseApp;

try {
  // Check if the environment is development
  if (process.env.NODE_ENV === 'development') {
    console.log('Using Firebase Admin in development mode');
    
    // In development, initialize with limited credentials
    // This allows us to test without requiring service account credentials
    firebaseApp = admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    });
  } else {
    // In production, initialize properly
    console.log('Initializing Firebase Admin SDK for production');
    
    // When deployed to Replit, the app uses the FIREBASE_CONFIG env variable
    // or automatically detects Google Cloud credentials
    firebaseApp = admin.initializeApp();
  }
} catch (error) {
  // Handle initialization errors (e.g., app already exists)
  console.error('Error initializing Firebase Admin:', error);
  
  // Try to get the default app if it's already initialized
  try {
    firebaseApp = admin.app();
  } catch (appError) {
    console.error('Could not get existing Firebase Admin app:', appError);
  }
}

// Export the auth instance for token verification
export const auth = firebaseApp ? firebaseApp.auth() : null;

// Function to verify Firebase ID token
export async function verifyFirebaseToken(token: string): Promise<DecodedIdToken | null> {
  try {
    // In development mode, provide a fallback for testing
    if (process.env.NODE_ENV === 'development') {
      // Special test token for development
      if (token === 'test-token') {
        console.log('Development mode: Using test token');
        return { uid: 'test-user-id', email: 'test@example.com' } as any;
      }
      
      // Development convenience - extract user ID from token
      if (token.startsWith('eyJ')) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length >= 2) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            if (payload && payload.user_id) {
              console.log('Development mode: Extracted user_id from JWT');
              return { 
                uid: payload.user_id,
                user_id: payload.user_id
              } as any;
            }
          }
        } catch (err) {
          console.error('Error extracting user_id from JWT:', err);
        }
      }
    }
    
    // Check if Firebase Auth is available
    if (!auth) {
      console.error('Firebase Auth is not initialized');
      if (process.env.NODE_ENV === 'development') {
        // In development, allow using the token as the UID for testing
        console.log('Development mode: Using token as UID without verification');
        return { uid: token } as any;
      }
      return null;
    }
    
    // For proper tokens in production, always verify with Firebase Admin
    return await auth.verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}