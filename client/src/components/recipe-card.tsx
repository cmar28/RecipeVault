import { useLocation } from "wouter";
import { Recipe } from "@shared/schema";
import { Image, Clock, Timer, Heart, Utensils, ChefHat } from "lucide-react";

type RecipeCardProps = {
  recipe: Recipe;
};

const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/recipes/${recipe.id}`);
  };

  // Calculate total time (prep + cook)
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <div 
      className="recipe-card animate-fade-in" 
      onClick={handleClick}
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
              {recipe.isFavorite && (
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              )}
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
