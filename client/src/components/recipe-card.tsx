import { useLocation } from "wouter";
import { Recipe } from "@shared/schema";
import { Image, Clock, Timer, Heart, Utensils, ChefHat } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type RecipeCardProps = {
  recipe: Recipe;
};

const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Calculate total time (prep + cook)
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/favorites/${recipe.id}`);
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      
      // Show toast notification
      toast({
        title: recipe.isFavorite ? "Removed from favorites" : "Added to favorites",
        description: recipe.isFavorite 
          ? `${recipe.title} has been removed from your favorites.`
          : `${recipe.title} has been added to your favorites.`,
        duration: 2000
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleClick = () => {
    setLocation(`/recipes/${recipe.id}`);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    toggleFavoriteMutation.mutate();
  };

  return (
    <div 
      className="recipe-card animate-fade-in" 
      onClick={handleClick}
      data-isfavorite={recipe.isFavorite}
    >
      <div className="recipe-card-img">
        {recipe.imageData ? (
          <img 
            src={recipe.imageData} 
            alt={recipe.title} 
          />
        ) : (
          <div className="w-full h-full bg-accent flex items-center justify-center">
            <ChefHat className="h-16 w-16 text-primary opacity-50" />
          </div>
        )}
        <div className="recipe-card-overlay">
          <div className="p-4 text-white w-full flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-white" />
                <span className="text-sm font-medium">{totalTime} min</span>
              </div>
              
              {recipe.servings && (
                <div className="flex items-center">
                  <Utensils className="h-4 w-4 mr-1 text-white" />
                  <span className="text-sm font-medium">{recipe.servings}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              <button 
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                onClick={handleToggleFavorite}
                aria-label={recipe.isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart 
                  className={`h-5 w-5 transition-all duration-300 ${
                    recipe.isFavorite 
                      ? "text-red-500 fill-red-500 scale-110" 
                      : "text-white hover:text-red-400"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="recipe-card-content">
        <h3 className="font-bold text-lg mb-1 text-foreground">{recipe.title}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2">{recipe.description}</p>
      </div>
    </div>
  );
};

export default RecipeCard;
