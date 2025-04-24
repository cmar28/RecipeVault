import * as admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

// Initialize with the default config which uses application default credentials
// This will work for development purposes
const adminApp = admin.initializeApp({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
});

console.log('Firebase Admin initialized with project ID:', process.env.VITE_FIREBASE_PROJECT_ID);

// Export the admin auth instance
export const auth = admin.auth(adminApp);

// Function to verify Firebase ID token
export async function verifyFirebaseToken(token: string): Promise<DecodedIdToken | null> {
  try {
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}