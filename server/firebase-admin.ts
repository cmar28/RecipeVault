import { DecodedIdToken } from 'firebase-admin/auth';

// Temporary stub for development purposes
// In production, you would properly initialize Firebase Admin SDK
console.log('Using Firebase Admin stub');

// Dummy auth object
export const auth = {
  verifyIdToken: async (token: string): Promise<any> => {
    // Extract the UID from the token (which is just the UID in development)
    return { uid: token };
  }
};

// Function to verify Firebase ID token - simplified for development
export async function verifyFirebaseToken(token: string): Promise<DecodedIdToken | null> {
  try {
    // In development, we'll just assume the token is the UID
    console.log('Development mode: Using token as UID without verification');
    return { uid: token } as any;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}