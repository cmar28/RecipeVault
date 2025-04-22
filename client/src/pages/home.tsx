import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus } from "lucide-react";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import RecipeList from "@/components/recipe-list";
import { Recipe } from "@shared/schema";

const Home = () => {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all recipes
  const { data: recipes, isLoading, error } = useQuery<Recipe[]>({ 
    queryKey: ['/api/recipes']
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

  return (
    <div className="font-sans bg-neutral-100 text-neutral-400 min-h-screen pb-16">
      <Header 
        title="Recipe Keeper" 
        onSearch={handleSearch} 
        searchQuery={searchQuery} 
      />
      
      <main className="container mx-auto pt-16 pb-4 px-4">
        <div className="pt-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">My Recipes</h2>
            <button 
              className="bg-primary text-white flex items-center px-4 py-2 rounded-lg shadow-md hover:bg-opacity-90 transition"
              onClick={handleAddNewRecipe}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="font-medium">New</span>
            </button>
          </div>
          
          <RecipeList 
            recipes={filteredRecipes || []} 
            isLoading={isLoading} 
            error={error}
          />
        </div>
      </main>
      
      <BottomNavigation activeItem="recipes" onAddNew={handleAddNewRecipe} />
    </div>
  );
};

export default Home;
