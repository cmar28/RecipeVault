import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, ChevronRight, TrendingUp, ThumbsUp } from "lucide-react";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import RecipeList from "@/components/recipe-list";
import { Recipe } from "@shared/schema";

const Home = () => {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const clearSearchRef = useRef<HTMLButtonElement>(null);
  
  // Fetch all recipes
  const { data: recipes, isLoading, error } = useQuery<Recipe[]>({ 
    queryKey: ['/api/recipes']
  });
  
  // Fetch favorite recipes separately to ensure they're always up-to-date
  const { data: favoriteRecipes = [] } = useQuery<Recipe[]>({
    queryKey: ['/api/favorites'],
    // Don't show loading state or error for favorites
    staleTime: 10000 // 10 seconds
  });
  
  const filteredRecipes = recipes?.filter(recipe => 
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNewRecipe = () => {
    setLocation("/create");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Clear search handler
  useEffect(() => {
    // Register the clear search handler
    if (clearSearchRef.current) {
      clearSearchRef.current.addEventListener('click', () => handleSearch(''));
    }
  }, []);

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
          
          {/* Floating action button for adding new recipes */}
          <button 
            className="fab-button"
            onClick={handleAddNewRecipe}
            data-action="add-recipe"
            aria-label="Add new recipe"
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
            <h2 className="text-lg font-semibold mb-5 flex items-center text-foreground">
              {searchQuery ? 'Found Recipes' : 'All Recipes'}
            </h2>
            
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
    </div>
  );
};

export default Home;
