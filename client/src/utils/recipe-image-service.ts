import { apiRequest, getQueryFn } from "@/lib/queryClient";

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
    
    // Upload the image to the server - manually handle FormData using fetch API
    const token = localStorage.getItem('token');
    
    try {
      // First, check if AI service is running by making a quick request with timeout
      const aiServiceCheck = await Promise.race([
        fetch('/api/recipes/from-image', {
          method: 'HEAD',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }),
        new Promise<Response>((_, reject) => 
          setTimeout(() => reject(new Error('AI service connection timeout')), 1000)
        )
      ]);
    } catch (e) {
      // AI service is not running or not responding
      console.error("AI service connection issue:", e);
      throw new Error('The AI recipe analysis service is not available. Please make sure to run the start_ai_service.sh script in a separate terminal.');
    }
    
    // If we reach here, the AI service appears to be responding
    const response = await fetch('/api/recipes/from-image', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
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