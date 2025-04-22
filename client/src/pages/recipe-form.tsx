import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { insertRecipeSchema, Recipe } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { convertFileToBase64 } from "@/utils/image-utils";
import { PlusCircle, MinusCircle, X, Upload, Image, Circle } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type RecipeFormProps = {
  mode: "create" | "edit";
  id?: number;
};

const RecipeForm = ({ mode, id }: RecipeFormProps) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Extended schema with validation
  const extendedSchema = insertRecipeSchema.extend({
    title: z.string().min(3, "Title must be at least 3 characters"),
    ingredients: z.array(z.string()).min(1, "At least one ingredient is required"),
    instructions: z.array(z.string()).min(1, "At least one instruction is required"),
  });

  // Form setup
  const form = useForm<z.infer<typeof extendedSchema>>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      imageData: "",
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      ingredients: [''],
      instructions: [''],
      isFavorite: false,
    },
  });

  // For edit mode, fetch the existing recipe
  const { data: existingRecipe, isLoading } = useQuery<Recipe>({
    queryKey: ['/api/recipes', id],
    queryFn: async (): Promise<Recipe> => {
      if (!id) throw new Error('Recipe ID is undefined');
      console.log("Fetching recipe in edit mode with ID:", id);
      const response = await fetch(`/api/recipes/${id}`);
      if (!response.ok) {
        throw new Error('Recipe not found');
      }
      const data = await response.json();
      console.log("Recipe data received in edit mode:", data);
      return data as Recipe;
    },
    enabled: mode === "edit" && id !== undefined,
  });

  // Debug: Log recipe info when fetched
  useEffect(() => {
    if (mode === "edit") {
      console.log("Fetching recipe with ID:", id);
      if (existingRecipe) {
        console.log("Recipe data received:", existingRecipe);
      }
    }
  }, [existingRecipe, id, mode]);

  // Update form when existing recipe is loaded
  useEffect(() => {
    if (mode === "edit" && existingRecipe) {
      console.log("Updating form with recipe data");
      form.reset({
        title: existingRecipe.title,
        description: existingRecipe.description || "",
        imageUrl: existingRecipe.imageUrl || "",
        imageData: existingRecipe.imageData || "",
        prepTime: existingRecipe.prepTime || 0,
        cookTime: existingRecipe.cookTime || 0,
        servings: existingRecipe.servings || 1,
        ingredients: existingRecipe.ingredients || [''],
        instructions: existingRecipe.instructions || [''],
        isFavorite: existingRecipe.isFavorite || false,
      });
      
      setIngredients(existingRecipe.ingredients || ['']);
      setInstructions(existingRecipe.instructions || ['']);
      setImagePreview(existingRecipe.imageData || null);
      console.log("Form state after update:", form.getValues());
    }
  }, [existingRecipe, form, mode]);

  // Create or update mutation
  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof extendedSchema>) => {
      if (mode === "edit" && id !== undefined) {
        return await apiRequest("PATCH", `/api/recipes/${id}`, data);
      } else {
        return await apiRequest("POST", "/api/recipes", data);
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      toast({
        title: mode === "edit" ? "Recipe updated" : "Recipe created",
        description: mode === "edit" 
          ? "The recipe has been successfully updated." 
          : "The recipe has been successfully created.",
      });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${mode === "edit" ? "update" : "create"} the recipe. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof extendedSchema>) => {
    // Filter out empty ingredients and instructions
    const filteredIngredients = data.ingredients.filter(ingredient => ingredient.trim() !== '');
    const filteredInstructions = data.instructions.filter(instruction => instruction.trim() !== '');
    
    if (filteredIngredients.length === 0) {
      form.setError('ingredients', {
        type: 'manual',
        message: 'At least one ingredient is required',
      });
      return;
    }
    
    if (filteredInstructions.length === 0) {
      form.setError('instructions', {
        type: 'manual',
        message: 'At least one instruction is required',
      });
      return;
    }
    
    // Submit the form with filtered arrays
    mutation.mutate({
      ...data,
      ingredients: filteredIngredients,
      instructions: filteredInstructions,
    });
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
    form.setValue('ingredients', [...form.getValues('ingredients'), '']);
  };

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
    
    const formIngredients = [...form.getValues('ingredients')];
    formIngredients.splice(index, 1);
    form.setValue('ingredients', formIngredients);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
    form.setValue('instructions', [...form.getValues('instructions'), '']);
  };

  const handleRemoveInstruction = (index: number) => {
    if (instructions.length <= 1) return;
    
    const newInstructions = [...instructions];
    newInstructions.splice(index, 1);
    setInstructions(newInstructions);
    
    const formInstructions = [...form.getValues('instructions')];
    formInstructions.splice(index, 1);
    form.setValue('instructions', formInstructions);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const base64Data = await convertFileToBase64(file);
      form.setValue('imageData', base64Data as string);
      setImagePreview(base64Data as string);
    } catch (error) {
      console.error("Error converting image:", error);
      toast({
        title: "Error",
        description: "Failed to process the image. Please try another one.",
        variant: "destructive",
      });
    }
  };

  const handleCancelForm = () => {
    setLocation('/');
  };

  // Show loading skeleton for edit mode while fetching data
  if (mode === "edit" && isLoading) {
    return (
      <div className="min-h-screen pt-4 px-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-56 w-full" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <div className="flex justify-end space-x-3">
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-4 px-4 pb-16">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {mode === "edit" ? "Edit Recipe" : "Add New Recipe"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={handleCancelForm}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title input */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Homemade Pizza" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description input */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Briefly describe your recipe" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image upload */}
              <div>
                <FormLabel>Recipe Image</FormLabel>
                <div className="border-2 border-dashed border-neutral-200 rounded-lg p-4 text-center">
                  {/* Image preview */}
                  <div className="h-56 mb-4 bg-neutral-100 rounded flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Recipe preview" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="text-neutral-300 flex flex-col items-center">
                        <Image className="h-10 w-10 mb-2" />
                        <span>No image selected</span>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file"
                    id="recipeImage"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <Button 
                    type="button"
                    onClick={() => document.getElementById('recipeImage')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Select Image
                  </Button>
                </div>
              </div>

              {/* Cooking details */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="prepTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prep Time (mins)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0}
                          {...field}
                          onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cookTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cook Time (mins)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0}
                          {...field}
                          onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="servings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Servings</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          {...field}
                          onChange={e => field.onChange(e.target.valueAsNumber || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Ingredients list */}
              <div>
                <FormLabel className="block mb-2">Ingredients</FormLabel>
                <div className="space-y-3">
                  {ingredients.map((_, index) => (
                    <div key={index} className="flex items-center">
                      <div className="flex-shrink-0 mr-2 mt-1">
                        <Circle className="h-2 w-2 text-primary fill-primary" />
                      </div>
                      <Controller
                        control={form.control}
                        name={`ingredients.${index}`}
                        render={({ field }) => (
                          <Input 
                            className="flex-grow"
                            placeholder="e.g. 2 cups flour"
                            {...field}
                          />
                        )}
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        size="icon"
                        className="ml-2 rounded-full hover:text-red-500 hover:border-red-500"
                        onClick={() => handleRemoveIngredient(index)}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  className="mt-3 text-primary border-primary hover:bg-primary/10 hover:text-primary"
                  onClick={handleAddIngredient}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
                <FormMessage>{form.formState.errors.ingredients?.message}</FormMessage>
              </div>

              {/* Instructions list */}
              <div>
                <FormLabel className="block mb-2">Instructions</FormLabel>
                <div className="space-y-3">
                  {instructions.map((_, index) => (
                    <div key={index} className="flex items-start">
                      <div className="mt-3 mr-3 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold shadow-sm">
                        <span>{index + 1}</span>
                      </div>
                      <Controller
                        control={form.control}
                        name={`instructions.${index}`}
                        render={({ field }) => (
                          <Textarea 
                            className="flex-grow"
                            placeholder="Describe this step"
                            rows={2}
                            {...field}
                          />
                        )}
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        size="icon"
                        className="ml-2 rounded-full hover:text-red-500 hover:border-red-500 mt-3"
                        onClick={() => handleRemoveInstruction(index)}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button 
                  type="button"
                  variant="outline"
                  className="mt-3 text-primary border-primary hover:bg-primary/10 hover:text-primary"
                  onClick={handleAddInstruction}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
                <FormMessage>{form.formState.errors.instructions?.message}</FormMessage>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleCancelForm}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <span>Saving...</span>
                  ) : (
                    <span>Save Recipe</span>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default RecipeForm;
