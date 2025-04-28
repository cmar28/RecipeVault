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
      try {
        // For development only: Extract user_id from JWT without verification
        // This is for development convenience only
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
      
      // Fall back to regular verification
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