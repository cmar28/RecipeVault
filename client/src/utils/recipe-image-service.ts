import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { auth, getCurrentUserToken } from "@/lib/firebase";
import { ProcessingStage } from "@/components/recipe-processing-modal";
import { 
  getClientId, 
  RECIPE_PROCESSING_STAGE_EVENT,
  RECIPE_PROCESSING_FALLBACK_EVENT
} from "@/utils/websocket-service";

// Helper to dispatch processing stage updates for local fallback updates
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
export async function uploadRecipeImage(file: File): Promise<{
  recipe: any; 
  message: string;
  realTimeUpdatesDelivered?: boolean;
}> {
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
    
    // Get WebSocket client ID for real-time updates
    const clientId = await getClientId();
    console.log("Using client ID for real-time updates:", clientId);
    
    // Start with local upload status - this will be superseded by WebSocket
    // updates if available, but gives immediate feedback either way
    updateProcessingStage({
      id: 'uploading',
      label: 'Uploading image',
      status: 'processing',
    });
    
    // Create FormData for the file upload
    const formData = new FormData();
    formData.append('image', file);
    
    // Get current auth token from Firebase
    let headers: Record<string, string> = {
      'X-Client-ID': clientId // Add client ID for WebSocket updates
    };
    
    try {
      // Use the helper function to get the token with retry logic
      const token = await getCurrentUserToken(true);
      
      if (token) {
        console.log("Firebase token obtained successfully");
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.error("Failed to get authentication token");
        throw new Error("Authentication required. Please sign in again.");
      }
    } catch (authError) {
      console.error("Authentication error:", authError);
      throw new Error("Failed to authenticate. Please sign out and sign in again.");
    }
    
    // Mark the upload as complete locally - server will update via WebSocket if available
    updateProcessingStage({
      id: 'uploading',
      label: 'Uploading image',
      status: 'success',
    });
    
    // Set local status as processing verification - server will update via WebSocket if available
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
      headers
    });
    
    if (!response.ok) {
      // Try to get error message from response
      const errorData = await response.json();
      
      // If we're using fallback status updates (no WebSocket), 
      // update the stages locally based on the error
      if (errorData.realTimeUpdatesDelivered === false) {
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
      }
      
      throw new Error(errorData.message || 'Failed to process recipe image');
    }
    
    const result = await response.json();
    
    // If WebSocket updates weren't delivered, use fallback status updates
    if (result.realTimeUpdatesDelivered === false) {
      console.log("WebSocket updates not delivered, using fallback updates");
      
      // If the request succeeded, all stages completed successfully
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
      
      // Dispatch fallback event
      window.dispatchEvent(
        new CustomEvent(RECIPE_PROCESSING_FALLBACK_EVENT, { 
          detail: { complete: true }
        })
      );
    }
    
    return result;
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