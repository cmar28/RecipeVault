import { DecodedIdToken } from 'firebase-admin/auth';

// For simplicity in development environment, we'll use a mock implementation
console.log('Using Firebase Admin in development mode');

// Create a simple auth instance for development
export const auth = {
  verifyIdToken: async (token: string): Promise<any> => {
    if (process.env.NODE_ENV === 'development') {
      // In development, just return a dummy object with the token as UID
      console.log('Development mode: Using token as UID without verification');
      return { uid: token };
    } else {
      // In production, we would use real Firebase admin
      throw new Error('Production Firebase auth not implemented yet');
    }
  }
};

// Function to verify Firebase ID token
export async function verifyFirebaseToken(token: string): Promise<DecodedIdToken | null> {
  try {
    // In development, let's check if we have a proper Firebase token
    if (process.env.NODE_ENV === 'development' && token.startsWith('eyJ')) {
      // Looks like a JWT, let's try to verify it
      return await auth.verifyIdToken(token);
    } else if (process.env.NODE_ENV === 'development') {
      // Development fallback for easier testing
      console.log('Development mode: Using token as UID without verification');
      return { uid: token } as any;
    } else {
      // Production - always verify
      return await auth.verifyIdToken(token);
    }
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}