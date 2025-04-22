import { Recipe } from "@shared/schema";
import RecipeCard from "./recipe-card";
import { Skeleton } from "@/components/ui/skeleton";

type RecipeListProps = {
  recipes: Recipe[];
  isLoading: boolean;
  error: unknown;
};

const RecipeList = ({ recipes, isLoading, error }: RecipeListProps) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg overflow-hidden shadow">
            <Skeleton className="h-48 w-full" />
            <div className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-10 text-center">
        <span className="material-icons text-5xl text-red-500 mb-4">error_outline</span>
        <h3 className="text-xl font-bold mb-2">Failed to load recipes</h3>
        <p className="text-neutral-300">Please try again later or contact support if the problem persists.</p>
      </div>
    );
  }

  // Empty state
  if (recipes.length === 0) {
    return (
      <div className="py-10 text-center">
        <span className="material-icons text-5xl text-neutral-300 mb-4">menu_book</span>
        <h3 className="text-xl font-bold mb-2">No recipes found</h3>
        <p className="text-neutral-300">Start adding your favorite recipes by clicking the 'New' button.</p>
      </div>
    );
  }

  // Recipes grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
};

export default RecipeList;
