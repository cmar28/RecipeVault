import { useLocation } from "wouter";
import { Recipe } from "@shared/schema";

type RecipeCardProps = {
  recipe: Recipe;
};

const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/recipes/${recipe.id}`);
  };

  return (
    <div 
      className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition cursor-pointer" 
      onClick={handleClick}
    >
      <div className="h-48 overflow-hidden relative">
        {recipe.imageData ? (
          <img 
            src={recipe.imageData} 
            alt={recipe.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
            <span className="material-icons text-4xl text-neutral-400">image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="p-3 text-white">
            <div className="flex items-center">
              <span className="material-icons text-sm mr-1">schedule</span>
              <span className="text-sm">{recipe.cookTime || 0} mins</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{recipe.title}</h3>
        <p className="text-neutral-300 text-sm line-clamp-2">{recipe.description}</p>
      </div>
    </div>
  );
};

export default RecipeCard;
