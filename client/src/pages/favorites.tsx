import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, ThumbsUp, Plus } from "lucide-react";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import RecipeList from "@/components/recipe-list";
import PhotoOptionsModal from "@/components/photo-options-modal";
import CameraCapture from "@/components/camera-capture";
import { Recipe } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const Favorites = () => {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Fetch favorite recipes
  const { data: favoriteRecipes = [], isLoading, error } = useQuery<Recipe[]>({
    queryKey: ['/api/favorites'],
  });
  
  // Filter favorites based on search query
  const filteredFavorites = favoriteRecipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNewRecipe = () => {
    setIsPhotoModalOpen(true);
  };
  
  // State for camera component
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const handlePhotoOptionSelected = (option: "camera" | "upload") => {
    console.log("Photo option selected (Favorites):", option);
    
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
    console.log("Photo captured successfully from Favorites:", file.name, file.size);
    
    // Navigate to home page where the upload mutation functionality exists
    setLocation("/");
    
    // Trigger the processing via an event after navigation
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('process-recipe-image', { 
        detail: { filePath: URL.createObjectURL(file) }
      }));
    }, 300);
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Navigate to home page where the upload mutation functionality exists
      setLocation("/");
      // Trigger the processing via an event after navigation
      setTimeout(() => {
        const fileData = { file };
        window.dispatchEvent(new CustomEvent('process-recipe-image', { 
          detail: { filePath: URL.createObjectURL(file) }
        }));
      }, 300);
    }
  };
  
  // Handler for the floating action button (plus)
  const handleManualAddRecipe = () => {
    setLocation('/create');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="font-sans bg-background text-foreground min-h-screen pb-20">
      <Header 
        title="Favorites" 
        onSearch={handleSearch} 
        searchQuery={searchQuery} 
      />
      
      <main className="container mx-auto pt-20 pb-4 px-3 sm:px-4">
        <div className="pt-2 pb-6">
          {/* Header with back button */}
          <div className="flex items-center mb-4">
            <button 
              onClick={() => setLocation('/')}
              className="mr-2 p-1 rounded-full hover:bg-secondary transition-colors"
              aria-label="Back to recipes"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-foreground flex items-center">
              <ThumbsUp className="h-6 w-6 mr-2 text-primary" />
              Favorite Recipes
            </h1>
          </div>
          
          {/* Description */}
          {!searchQuery && (
            <p className="text-muted-foreground mb-6">
              Your collection of saved favorite recipes
            </p>
          )}
          
          {/* Search results heading */}
          {searchQuery && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  {filteredFavorites.length} favorite(s) found for "{searchQuery}"
                </p>
              </div>
              <button 
                className="text-sm text-primary hover:underline" 
                onClick={() => handleSearch('')}
              >
                Clear
              </button>
            </div>
          )}
          
          {/* Floating action button for manually adding new recipes */}
          <button 
            className="fab-button"
            onClick={handleManualAddRecipe}
            data-action="add-recipe-manual"
            aria-label="Create new recipe manually"
          >
            <Plus className="h-6 w-6" />
          </button>
          
          {/* Recipe list */}
          <div className="mb-4">
            <RecipeList 
              recipes={filteredFavorites} 
              isLoading={isLoading} 
              error={error}
              searchQuery={searchQuery}
            />
            
            {/* Empty favorites state */}
            {favoriteRecipes.length === 0 && !isLoading && !error && (
              <div className="py-12 px-4 text-center bg-white rounded-xl shadow-sm max-w-xl mx-auto my-4">
                <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
                  <ThumbsUp className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">No Favorites Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start adding recipes to your favorites by clicking the heart icon on recipes you love.
                </p>
                <button 
                  className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  onClick={() => setLocation('/')}
                >
                  Browse Recipes
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <BottomNavigation activeItem="favorites" onAddNew={handleAddNewRecipe} />
      
      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/*"
        className="hidden"
      />
      
      {/* Photo Options Modal */}
      <PhotoOptionsModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSelectOption={handlePhotoOptionSelected}
        isLoading={isProcessingImage}
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

export default Favorites;