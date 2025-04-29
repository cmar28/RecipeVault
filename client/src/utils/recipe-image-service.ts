import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { auth } from "@/lib/firebase";
import { ProcessingStage } from "@/components/recipe-processing-modal";

// Define an event for reporting processing stage updates
export const RECIPE_PROCESSING_STAGE_EVENT = 'recipe-processing-stage-update';

// Helper to dispatch processing stage updates
export function updateProcessingStage(stage: ProcessingStage) {
  window.dispatchEvent(
    new CustomEvent(RECIPE_PROCESSING_STAGE_EVENT, { detail: stage })
  );
}

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
    
    // Update processing stage: Uploading
    updateProcessingStage({
      id: 'uploading',
      label: 'Uploading image',
      status: 'processing',
    });
    
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
    
    // Update processing stage: Verifying
    updateProcessingStage({
      id: 'uploading',
      label: 'Uploading image',
      status: 'success',
    });
    
    updateProcessingStage({
      id: 'verifying',
      label: 'Verifying recipe image',
      status: 'processing',
      message: 'Checking if the image contains a recipe...'
    });
    
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
      
      // Determine which stage failed based on the error message
      if (errorData.message?.includes('does not appear to contain a recipe')) {
        updateProcessingStage({
          id: 'verifying',
          label: 'Verifying recipe image',
          status: 'error',
          message: 'The image does not contain a recipe'
        });
      } else if (errorData.message?.includes('extract recipe')) {
        updateProcessingStage({
          id: 'verifying',
          label: 'Verifying recipe image',
          status: 'success',
        });
        updateProcessingStage({
          id: 'extracting',
          label: 'Extracting recipe details',
          status: 'error',
          message: 'Failed to extract recipe information'
        });
      } else if (errorData.message?.includes('create recipe')) {
        updateProcessingStage({
          id: 'verifying',
          label: 'Verifying recipe image',
          status: 'success',
        });
        updateProcessingStage({
          id: 'extracting',
          label: 'Extracting recipe details',
          status: 'success',
        });
        updateProcessingStage({
          id: 'saving',
          label: 'Saving recipe',
          status: 'error',
          message: 'Failed to save the recipe'
        });
      }
      
      throw new Error(errorData.message || 'Failed to process recipe image');
    }
    
    // All stages completed successfully
    updateProcessingStage({
      id: 'verifying',
      label: 'Verifying recipe image',
      status: 'success',
    });
    
    updateProcessingStage({
      id: 'extracting',
      label: 'Extracting recipe details',
      status: 'success',
    });
    
    updateProcessingStage({
      id: 'saving',
      label: 'Saving recipe',
      status: 'success',
    });
    
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