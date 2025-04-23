import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Recipe } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Image, 
  Clock, 
  Timer, 
  Utensils,
  ListOrdered,
  BookOpen,
  Circle,
  Heart
} from "lucide-react";

const RecipeDetail = () => {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const numericId = parseInt(id);

  // Fetch recipe details
  const { data: recipe, isLoading, error } = useQuery<Recipe>({ 
    queryKey: [`/api/recipes/${numericId}`],
    queryFn: async (): Promise<Recipe> => {
      console.log("Fetching recipe with ID:", numericId);
      try {
        const response = await apiRequest("GET", `/api/recipes/${numericId}`);
        const data = await response.json();
        console.log("Recipe data received:", data);
        return data as Recipe;
      } catch (error) {
        console.error("Error fetching recipe:", error);
        throw error;
      }
    },
    enabled: !isNaN(numericId)
  });

  // Handle delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/recipes/${numericId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      toast({
        title: "Recipe deleted",
        description: "The recipe has been successfully deleted."
      });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the recipe. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleBackToList = () => {
    setLocation('/');
  };

  const handleEditRecipe = () => {
    console.log("Navigating to edit recipe with ID:", numericId);
    setLocation(`/edit/${numericId}`);
  };

  const handleDeleteRecipe = () => {
    deleteMutation.mutate();
  };

  if (isNaN(numericId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Invalid Recipe ID</h2>
          <Button onClick={handleBackToList}>Back to Recipes</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-4 px-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="relative h-64 overflow-hidden">
            <Skeleton className="w-full h-full" />
            <div className="absolute top-4 left-4">
              <Button variant="outline" size="icon" className="bg-white bg-opacity-90 rounded-full shadow-md" onClick={handleBackToList}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="p-6">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-6" />
            <div className="flex justify-between mb-8">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-2 mb-8">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex">
                  <Skeleton className="h-6 w-6 rounded-full mr-4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    // Try to extract the error message from the error
    let errorMsg = "The recipe you're looking for doesn't exist or has been removed.";
    
    if (error instanceof Error) {
      const message = error.message;
      if (message.includes("permission")) {
        errorMsg = "You don't have permission to view this recipe.";
      }
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Recipe Not Found</h2>
          <p className="mb-4">{errorMsg}</p>
          <Button onClick={handleBackToList}>Back to Recipes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-4 px-4 pb-16">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="relative h-64 overflow-hidden">
          {recipe.imageData ? (
            <img 
              src={recipe.imageData} 
              alt={recipe.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
              <Image className="h-16 w-16 text-neutral-400" />
            </div>
          )}
          
          <div className="absolute top-4 left-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-white bg-opacity-90 rounded-full shadow-md" 
              onClick={handleBackToList}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              className={`bg-white bg-opacity-90 rounded-full shadow-md ${
                recipe.isFavorite ? 'border-red-400' : ''
              }`}
              onClick={() => {
                const updatedRecipe = {...recipe, isFavorite: !recipe.isFavorite};
                
                // Call API to toggle favorite status
                apiRequest('POST', `/api/favorites/${recipe.id}`)
                .then(() => {
                  // Refresh recipe data
                  queryClient.invalidateQueries({ queryKey: [`/api/recipes/${numericId}`] });
                  queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
                  
                  // Show toast notification
                  toast({
                    title: updatedRecipe.isFavorite ? "Removed from favorites" : "Added to favorites",
                    description: updatedRecipe.isFavorite 
                      ? `${recipe.title} has been removed from your favorites.`
                      : `${recipe.title} has been added to your favorites.`,
                    duration: 2000
                  });
                })
                .catch(() => {
                  toast({
                    title: "Error",
                    description: "Failed to update favorite status. Please try again.",
                    variant: "destructive"
                  });
                });
              }}
            >
              <Heart className={`h-5 w-5 transition-colors ${
                recipe.isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground hover:text-red-400'
              }`} />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-white bg-opacity-90 rounded-full shadow-md" 
              onClick={handleEditRecipe}
            >
              <Edit className="h-5 w-5" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="bg-white bg-opacity-90 rounded-full shadow-md"
                >
                  <Trash className="h-5 w-5 text-red-500" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this recipe? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteRecipe}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">{recipe.title}</h2>
          {recipe.description && (
            <p className="text-neutral-600 mb-6">{recipe.description}</p>
          )}
          
          <div className="flex items-center justify-between mb-8 text-sm">
            {/* Debug: prepTime: {recipe.prepTime} */}
            {recipe.prepTime !== undefined && recipe.prepTime !== null && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                <span>{recipe.prepTime} mins prep</span>
              </div>
            )}
            
            {recipe.cookTime !== undefined && recipe.cookTime !== null && (
              <div className="flex items-center">
                <Timer className="h-4 w-4 mr-2 text-primary" />
                <span>{recipe.cookTime} mins cook</span>
              </div>
            )}
            
            {recipe.servings !== undefined && recipe.servings !== null && (
              <div className="flex items-center">
                <Utensils className="h-4 w-4 mr-2 text-primary" />
                <span>{recipe.servings} servings</span>
              </div>
            )}
          </div>
          
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center text-primary">
                <ListOrdered className="h-5 w-5 mr-2 text-primary" />
                Ingredients
              </h3>
              <ul className="space-y-2 pl-4">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <Circle className="h-2 w-2 text-primary mr-2 mt-1.5 fill-primary" />
                    <span className="text-neutral-800">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {recipe.instructions && recipe.instructions.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center text-primary">
                <BookOpen className="h-5 w-5 mr-2 text-primary" />
                Instructions
              </h3>
              <ol className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex">
                    <div className="mr-4 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold shadow-sm">
                      <span>{index + 1}</span>
                    </div>
                    <p className="text-neutral-800">{instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
