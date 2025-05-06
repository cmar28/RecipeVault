import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, ChevronRight, ThumbsUp, Download, Upload } from "lucide-react";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import RecipeList from "@/components/recipe-list";
import RecipeCard from "@/components/recipe-card";
import PhotoOptionsModal from "@/components/photo-options-modal";
import RecipeProcessingModal, { ProcessingStage } from "@/components/recipe-processing-modal";
import { ImportExportModal } from "@/components/import-export-modal";
import CameraCapture from "@/components/camera-capture";
import { Recipe } from "@shared/schema";
import { uploadRecipeImage } from "@/utils/recipe-image-service";
import { 
  RECIPE_PROCESSING_STAGE_EVENT,
  RECIPE_PROCESSING_FALLBACK_EVENT
} from "@/utils/websocket-service";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

const Home = () => {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([
    { id: 'uploading', label: 'Uploading image', status: 'pending' },
    { id: 'verifying', label: 'Verifying recipe image', status: 'pending' },
    { id: 'extracting', label: 'Extracting recipe details', status: 'pending' },
    { id: 'saving', label: 'Saving recipe', status: 'pending' }
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clearSearchRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all recipes with retry for auth issues
  const { data: recipes, isLoading, error, refetch: refetchRecipes } = useQuery<Recipe[]>({ 
    queryKey: ['/api/recipes'],
    retry: 3, // Retry 3 times if it fails (helps with timing of auth)
    retryDelay: 1000 // 1 second between retries
  });
  
  // Fetch favorite recipes separately to ensure they're always up-to-date
  const { 
    data: favoriteRecipes = [], 
    refetch: refetchFavorites
  } = useQuery<Recipe[]>({
    queryKey: ['/api/favorites'],
    // Don't show loading state or error for favorites
    staleTime: 10000, // 10 seconds
    retry: 3, // Retry 3 times if it fails
    retryDelay: 1000 // 1 second between retries
  });
  
  // Effect to refetch recipes when auth state changes
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      if (user) {
        console.log("User authenticated, refreshing recipe data");
        // Force refresh both queries when the user is authenticated
        refetchRecipes();
        refetchFavorites();
      }
    });
    
    // Clean up the subscription
    return () => unsubscribe();
  }, [refetchRecipes, refetchFavorites]);
  
  // Setup mutation for recipe image upload
  const uploadMutation = useMutation({
    mutationFn: uploadRecipeImage,
    onSuccess: (data) => {
      console.log("Recipe created successfully:", data.recipe.id);
      
      // Show success toast
      toast({
        title: "Recipe created!",
        description: "Your recipe has been successfully created from the image",
        duration: 3000,
      });
      
      // Force immediate refetch of recipes data
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      queryClient.refetchQueries({ queryKey: ['/api/recipes'] });
      
      // Update favorites if needed
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      
      // Navigate to the newly created recipe after a short delay so user can see the completed stages
      setTimeout(() => {
        setIsProcessingImage(false);
        
        // Reset processing stages for next time
        setProcessingStages([
          { id: 'uploading', label: 'Uploading image', status: 'pending' },
          { id: 'verifying', label: 'Verifying recipe image', status: 'pending' },
          { id: 'extracting', label: 'Extracting recipe details', status: 'pending' },
          { id: 'saving', label: 'Saving recipe', status: 'pending' }
        ]);
        
        // Navigate to the new recipe detail page
        setLocation(`/recipes/${data.recipe.id}`);
      }, 1500);
    },
    onError: (error: Error) => {
      // Show error toast
      toast({
        title: "Error creating recipe",
        description: error.message || "There was a problem processing your image",
        variant: "destructive",
        duration: 5000,
      });
      
      // Keep the modal open for a bit longer so user can see the error
      setTimeout(() => {
        setIsProcessingImage(false);
        
        // Reset processing stages for next time
        setProcessingStages([
          { id: 'uploading', label: 'Uploading image', status: 'pending' },
          { id: 'verifying', label: 'Verifying recipe image', status: 'pending' },
          { id: 'extracting', label: 'Extracting recipe details', status: 'pending' },
          { id: 'saving', label: 'Saving recipe', status: 'pending' }
        ]);
      }, 3000);
    }
  });
  
  // Filter recipes by search query if recipes exist
  const filteredRecipes = recipes ? recipes.filter((recipe: Recipe) => 
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Handler for the bottom center button (camera)
  const handleAddNewRecipe = () => {
    setIsPhotoModalOpen(true);
  };
  
  // Handler for the floating action button (plus)
  const handleManualAddRecipe = () => {
    setLocation('/create');
  };

  // Handler for import/export button
  const handleImportExport = () => {
    setIsImportExportModalOpen(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // State for camera component
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const handlePhotoOptionSelected = (option: "camera" | "upload") => {
    console.log("Photo option selected:", option);
    
    if (option === "camera") {
      // Close photo options and open camera component
      setIsPhotoModalOpen(false);
      setIsCameraOpen(true);
    } else if (option === "upload") {
      // Trigger file input click
      fileInputRef.current?.click();
    }
  };
  
  // Handle photo captured from camera component
  const handleCameraCapture = (file: File) => {
    console.log("Photo captured successfully:", file.name, file.size);
    
    try {
      // Ensure camera is closed
      setIsCameraOpen(false);
      
      // Reset processing stages first
      setProcessingStages([
        { id: 'uploading', label: 'Uploading image', status: 'pending' },
        { id: 'verifying', label: 'Verifying recipe image', status: 'pending' },
        { id: 'extracting', label: 'Extracting recipe details', status: 'pending' },
        { id: 'saving', label: 'Saving recipe', status: 'pending' }
      ]);
      
      // Show processing modal and start the upload
      setIsProcessingImage(true);
      
      // Short timeout to ensure UI is updated
      setTimeout(() => {
        // Start the upload process
        uploadMutation.mutate(file);
      }, 100);
    } catch (err) {
      console.error("Error handling camera capture:", err);
      toast({
        title: "Error Processing Photo",
        description: "Failed to process the captured photo. Please try again.",
        variant: "destructive"
      });
      
      // Close the camera UI and reset state
      setIsCameraOpen(false);
      setIsProcessingImage(false);
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Set loading state
      setIsProcessingImage(true);
      
      // Upload and process the image
      uploadMutation.mutate(file);
      
      // Reset the file input so the same file can be selected again
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Setup event listeners
  useEffect(() => {
    // Register the clear search handler
    if (clearSearchRef.current) {
      clearSearchRef.current.addEventListener('click', () => handleSearch(''));
    }
    
    // Register the custom event handler for showing the photo modal
    const showPhotoModalHandler = () => {
      setIsPhotoModalOpen(true);
    };
    
    // Register the custom event handler for processing recipe image
    const processRecipeImageHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{filePath: string}>;
      
      // Trigger file selection based on the path
      if (customEvent.detail && customEvent.detail.filePath) {
        // We need to convert the URL back to a file
        fetch(customEvent.detail.filePath)
          .then(response => response.blob())
          .then(blob => {
            const file = new File([blob], "recipe-image.jpg", { type: "image/jpeg" });
            
            // Set loading state
            setIsProcessingImage(true);
            
            // Upload and process the image
            uploadMutation.mutate(file);
          })
          .catch(error => {
            console.error("Error processing image:", error);
            toast({
              title: "Error processing image",
              description: "There was a problem processing your image",
              variant: "destructive",
              duration: 5000,
            });
            setIsProcessingImage(false);
          });
      }
    };
    
    // Register the stage update event handler
    const processingStageUpdateHandler = (event: Event) => {
      const customEvent = event as CustomEvent<ProcessingStage>;
      const updatedStage = customEvent.detail;
      
      console.log('Received processing stage update:', updatedStage);
      
      // Update the processing stages
      setProcessingStages(prevStages => {
        return prevStages.map(stage => {
          if (stage.id === updatedStage.id) {
            return { ...stage, ...updatedStage };
          }
          return stage;
        });
      });
    };
    
    // Register the fallback event handler for when WebSocket updates aren't available
    const fallbackHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{complete: boolean}>;
      
      console.log('Received fallback event:', customEvent.detail);
      
      // If we get a fallback complete event, update all stages to completed
      if (customEvent.detail.complete) {
        console.log('Using fallback status updates - WebSocket updates not delivered');
      }
    };
    
    window.addEventListener('show-photo-modal', showPhotoModalHandler);
    window.addEventListener('process-recipe-image', processRecipeImageHandler as EventListener);
    window.addEventListener(RECIPE_PROCESSING_STAGE_EVENT, processingStageUpdateHandler as EventListener);
    window.addEventListener(RECIPE_PROCESSING_FALLBACK_EVENT, fallbackHandler as EventListener);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('show-photo-modal', showPhotoModalHandler);
      window.removeEventListener('process-recipe-image', processRecipeImageHandler as EventListener);
      window.removeEventListener(RECIPE_PROCESSING_STAGE_EVENT, processingStageUpdateHandler as EventListener);
      window.removeEventListener(RECIPE_PROCESSING_FALLBACK_EVENT, fallbackHandler as EventListener);
    };
  }, [toast, uploadMutation]);

  return (
    <div className="font-sans bg-background text-foreground min-h-screen pb-20">
      <Header 
        title="Recipe Keeper" 
        onSearch={handleSearch} 
        searchQuery={searchQuery} 
      />
      
      <main className="container mx-auto pt-20 pb-4 px-3 sm:px-4">
        {/* Header section with welcome message */}
        <div className="pt-2 pb-6">
          {!searchQuery && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-1">Explore Recipes</h1>
              <p className="text-muted-foreground mb-6">Discover delicious meals to cook today</p>
            </>
          )}
          
          {searchQuery && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Search Results</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredRecipes?.length || 0} recipes found for "{searchQuery}"
                </p>
              </div>
              <button 
                ref={clearSearchRef}
                className="text-sm text-primary hover:underline" 
                data-action="clear-search"
                onClick={() => handleSearch('')}
              >
                Clear
              </button>
            </div>
          )}
          
          {/* Hidden file input for photo upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            accept="image/*"
            className="hidden"
          />
          
          {/* Floating action button for manually adding new recipes */}
          <button 
            className="fab-button"
            onClick={handleManualAddRecipe}
            data-action="add-recipe-manual"
            aria-label="Create new recipe manually"
          >
            <Plus className="h-6 w-6" />
          </button>
          
          {/* Show favorite recipes section if no search and there are favorites */}
          {!searchQuery && favoriteRecipes.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center text-foreground">
                  <ThumbsUp className="h-5 w-5 mr-2 text-primary" />
                  Favorites
                </h2>
                <button 
                  className="text-sm text-primary flex items-center hover:underline"
                  onClick={() => setLocation('/favorites')}
                >
                  See all <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                {favoriteRecipes.slice(0, 3).map((recipe, index) => (
                  <div key={recipe.id} style={{ animationDelay: `${index * 0.05}s` }}>
                    <RecipeCard recipe={recipe} />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Main Recipes Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold flex items-center text-foreground">
                {searchQuery ? 'Found Recipes' : 'All Recipes'}
              </h2>
              
              {!searchQuery && recipes && recipes.length > 0 && (
                <button 
                  className="text-sm text-primary flex items-center hover:underline"
                  onClick={handleImportExport}
                  data-testid="import-export-button"
                >
                  <Download className="h-4 w-4 mr-1" />
                  <Upload className="h-4 w-4 mr-1" />
                  Import/Export
                </button>
              )}
            </div>
            
            <RecipeList 
              recipes={filteredRecipes || []} 
              isLoading={isLoading} 
              error={error}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </main>
      
      <BottomNavigation activeItem="recipes" onAddNew={handleAddNewRecipe} />
      
      {/* Photo Options Modal */}
      <PhotoOptionsModal
        isOpen={isPhotoModalOpen && !isProcessingImage}
        onClose={() => setIsPhotoModalOpen(false)}
        onSelectOption={handlePhotoOptionSelected}
        isLoading={false}
      />
      
      {/* Recipe Processing Modal */}
      <RecipeProcessingModal
        isOpen={isProcessingImage}
        onClose={() => {
          // Only allow closing when an error has occurred or processing is complete
          const hasError = processingStages.some(stage => stage.status === 'error');
          const isComplete = processingStages.every(stage => 
            stage.status === 'success' || stage.status === 'error'
          );
          
          if (hasError || isComplete) {
            setIsProcessingImage(false);
            
            // If completed successfully, refresh the recipes list
            if (isComplete && !hasError) {
              console.log("Recipe processing complete, forcing data refresh");
              
              // Invalidate and force an immediate refetch of the recipes
              queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
              queryClient.refetchQueries({ queryKey: ['/api/recipes'] });
              
              // Invalidate favorites as well
              queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
            }
          }
        }}
        stages={processingStages}
        title="Processing Your Recipe"
      />
      
      {/* Import/Export Modal */}
      <ImportExportModal 
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
      />
      
      {/* Camera Capture Component */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};

export default Home;
