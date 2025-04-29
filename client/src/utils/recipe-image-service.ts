import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { auth } from "@/lib/firebase";

/**
 * Uploads a recipe image and processes it with AI
 * @param file The image file to upload
 * @returns A promise that resolves to the created recipe
 */
export async function uploadRecipeImage(file: File): Promise<{recipe: any; message: string}> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('The selected file is not an image');
    }
    
    // Validate file size (5MB max)
    const MAX_SIZE_MB = 5;
    const maxSizeBytes = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`Image size must be less than ${MAX_SIZE_MB}MB`);
    }
    
    // Create FormData for the file upload
    const formData = new FormData();
    formData.append('image', file);
    
    // Get current auth token from Firebase
    let authHeader = {};
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      console.log("Firebase token obtained successfully");
      authHeader = { 'Authorization': `Bearer ${token}` };
    } else {
      console.warn("No authenticated user found for image upload");
    }
    
    // Send the request to process the image
    const response = await fetch('/api/recipes/from-image', {
      method: 'POST',
      body: formData,
      headers: {
        ...authHeader
      }
    });
    
    if (!response.ok) {
      // Try to get error message from response
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to process recipe image');
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while processing your image');
  }
}

// React Query fetch function for uploading recipe images
export const uploadRecipeImageQuery = (file: File) => ({
  queryKey: ['recipeImageUpload'],
  queryFn: async () => {
    const result = await uploadRecipeImage(file);
    return result;
  },
  onSuccess: (data: {recipe: any}) => {
    // Return the created recipe ID for redirection
    return data.recipe.id;
  }
});