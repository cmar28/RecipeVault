import { Recipe } from "@shared/schema";
import RecipeCard from "./recipe-card";
import { Skeleton } from "@/components/ui/skeleton";
import { CookingPot, AlertTriangle, Search } from "lucide-react";

type RecipeListProps = {
  recipes: Recipe[];
  isLoading: boolean;
  error: unknown;
  searchQuery?: string;
};

const RecipeList = ({ recipes, isLoading, error, searchQuery = '' }: RecipeListProps) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 recipe-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="recipe-card overflow-hidden">
            <Skeleton className="h-52 w-full" />
            <div className="p-5">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-12 px-4 text-center bg-white rounded-xl shadow-sm max-w-xl mx-auto my-4">
        <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold mb-3">Failed to load recipes</h3>
        <p className="text-muted-foreground mb-6">Please try again later or contact support if the problem persists.</p>
        <button 
          className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state with no search query
  if (recipes.length === 0 && !searchQuery) {
    return (
      <div className="py-12 px-4 text-center bg-white rounded-xl shadow-sm max-w-xl mx-auto my-4">
        <div className="bg-primary/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
          <CookingPot className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold mb-3">Ready to Cook Something Delicious?</h3>
        <p className="text-muted-foreground mb-6">Start building your collection by adding your favorite recipes.</p>
        <button 
          className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          onClick={() => {
            const addButton = document.querySelector('[data-action="add-recipe"]') as HTMLButtonElement;
            if (addButton) addButton.click();
          }}
        >
          Add Your First Recipe
        </button>
      </div>
    );
  }

  // Empty search results
  if (recipes.length === 0 && searchQuery) {
    return (
      <div className="py-12 px-4 text-center bg-white rounded-xl shadow-sm max-w-xl mx-auto my-4">
        <div className="bg-secondary text-secondary-foreground w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
          <Search className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold mb-3">No matching recipes found</h3>
        <p className="text-muted-foreground mb-2">
          We couldn't find any recipes matching "{searchQuery}".
        </p>
        <p className="text-muted-foreground mb-6">
          Try searching with different keywords or browse all recipes.
        </p>
        <button 
          className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          onClick={() => {
            const clearButton = document.querySelector('[data-action="clear-search"]') as HTMLButtonElement;
            if (clearButton) clearButton.click();
          }}
        >
          Clear Search
        </button>
      </div>
    );
  }

  // Recipes grid with staggered animation
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 recipe-grid">
      {recipes.map((recipe, index) => (
        <div key={recipe.id} style={{ animationDelay: `${index * 0.05}s` }}>
          <RecipeCard recipe={recipe} />
        </div>
      ))}
    </div>
  );
};

export default RecipeList;
