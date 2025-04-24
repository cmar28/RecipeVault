import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { recipes, insertRecipeSchema, insertUserSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { eq } from "drizzle-orm";
import { verifyFirebaseToken } from "./firebase-admin";
import axios from "axios";
import { log } from "./vite";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Python AI service configuration
const AI_SERVICE_URL = 'http://localhost:5050';

// Helper function to verify recipe image with Python AI service
async function verifyRecipeImage(base64Image: string): Promise<{ success: boolean; message: string; is_recipe?: boolean }> {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/verify`, {
      image: base64Image,
    });
    return response.data;
  } catch (error) {
    console.error("Error verifying recipe image:", error);
    return { 
      success: false, 
      message: "Failed to verify recipe image. Please try again."
    };
  }
}

// Helper function to extract recipe data from image with Python AI service
async function extractRecipeFromImage(base64Image: string): Promise<{ 
  success: boolean; 
  message?: string; 
  recipe?: {
    title: string;
    description: string;
    cookingTimeMinutes: number;
    difficulty: string;
    ingredients: string[];
    instructions: string[];
    servings: number;
  } 
}> {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/extract`, {
      image: base64Image,
    });
    return response.data;
  } catch (error) {
    console.error("Error extracting recipe from image:", error);
    return { 
      success: false, 
      message: "Failed to extract recipe data from image. Please try again."
    };
  }
}

// Middleware to verify and extract Firebase token
const firebaseAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract the Firebase ID token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1];
      
      // Verify the Firebase ID token
      const decodedToken = await verifyFirebaseToken(idToken);
      
      if (decodedToken) {
        // Set the user ID as a request header for easy access in routes
        req.headers['x-firebase-uid'] = decodedToken.uid;
        
        // For debugging
        console.log(`Authenticated request from user: ${decodedToken.uid}`);
      } else {
        console.warn('Invalid Firebase token provided');
        // Don't set the user ID if token is invalid
        // This will cause protected routes to return 401
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in Firebase auth middleware:', error);
    // Continue without authentication in case of error
    next();
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply the Firebase auth middleware to all routes
  app.use(firebaseAuthMiddleware);
  
  // Upload and process recipe image
  app.post("/api/recipes/from-image", upload.single('image'), async (req: Request, res: Response) => {
    try {
      // Get user ID from Firebase Auth
      const userId = req.headers['x-firebase-uid'] as string;
      
      // Require authentication
      if (!userId) {
        return res.status(401).json({ message: "Authentication required to create recipes" });
      }
      
      // Ensure the file was provided
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // Convert the file buffer to base64
      const base64Image = req.file.buffer.toString('base64');
      
      // Verify it's a recipe image
      log("Verifying if image contains a recipe");
      const verificationResult = await verifyRecipeImage(base64Image);
      
      if (!verificationResult.success) {
        return res.status(500).json({ 
          message: verificationResult.message || "Failed to verify recipe image" 
        });
      }
      
      if (!verificationResult.is_recipe) {
        return res.status(400).json({ 
          message: "The uploaded image does not appear to contain a recipe. Please try a different image." 
        });
      }
      
      // Extract recipe data from image
      log("Extracting recipe data from image");
      const extractionResult = await extractRecipeFromImage(base64Image);
      
      if (!extractionResult.success || !extractionResult.recipe) {
        return res.status(500).json({ 
          message: extractionResult.message || "Failed to extract recipe data from image" 
        });
      }
      
      // Convert the extracted recipe to our schema format
      const recipeData = {
        title: extractionResult.recipe.title,
        description: extractionResult.recipe.description,
        cookingTime: extractionResult.recipe.cookingTimeMinutes,
        difficulty: extractionResult.recipe.difficulty.toLowerCase(),
        ingredients: extractionResult.recipe.ingredients.join('\n'),
        instructions: extractionResult.recipe.instructions.join('\n'),
        servings: extractionResult.recipe.servings,
        imageUrl: null, // No image is stored
        createdBy: userId
      };
      
      // Create the recipe in the database
      const validatedData = insertRecipeSchema.parse(recipeData);
      const newRecipe = await storage.createRecipe(validatedData);
      
      // Return the created recipe
      res.status(201).json({
        recipe: newRecipe,
        message: "Recipe successfully created from image"
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating recipe from image:", error);
      res.status(500).json({ message: "Failed to create recipe from image" });
    }
  });
  // Firebase User API endpoints
  // Sync user data from Firebase Auth to our database
  app.post("/api/users/sync", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.upsertUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error syncing user:", error);
      res.status(500).json({ message: "Failed to sync user data" });
    }
  });

  // Get user data from our database
  app.get("/api/users/:uid", async (req: Request, res: Response) => {
    try {
      const { uid } = req.params;
      const user = await storage.getUser(uid);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  // Get all recipes
  app.get("/api/recipes", async (req: Request, res: Response) => {
    try {
      // Get user ID from Firebase Auth data if available
      const userId = (req.headers['x-firebase-uid'] as string) || undefined;
      const recipes = await storage.getRecipes(userId);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });
  
  // Get user's favorite recipes
  app.get("/api/favorites", async (req: Request, res: Response) => {
    try {
      // Get user ID from Firebase Auth
      const userId = req.headers['x-firebase-uid'] as string;
      
      // Require authentication for favorites
      if (!userId) {
        return res.status(401).json({ message: "Authentication required to access favorites" });
      }
      
      const favorites = await storage.getFavoriteRecipes(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });
  
  // Toggle a recipe as favorite/unfavorite
  app.post("/api/favorites/:recipeId", async (req: Request, res: Response) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      
      if (isNaN(recipeId)) {
        return res.status(400).json({ message: "Invalid recipe ID" });
      }
      
      // Get user ID from Firebase Auth
      const userId = req.headers['x-firebase-uid'] as string;
      
      // Require authentication for toggling favorites
      if (!userId) {
        return res.status(401).json({ message: "Authentication required to manage favorites" });
      }
      
      // Check if recipe exists and user has access to it
      const recipe = await storage.getRecipe(recipeId, userId);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Toggle favorite status
      const isFavorite = await storage.toggleFavorite(userId, recipeId);
      
      res.json({ 
        recipeId, 
        isFavorite 
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to update favorite status" });
    }
  });

  // Get a specific recipe
  app.get("/api/recipes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid recipe ID" });
      }
      
      // Get user ID from Firebase Auth data if available
      const userId = (req.headers['x-firebase-uid'] as string) || undefined;
      
      // Log for debugging
      console.log(`Fetching recipe ${id} for user ${userId || 'anonymous'}`);
      
      try {
        const recipe = await storage.getRecipe(id, userId);
        
        if (!recipe) {
          return res.status(404).json({ message: "Recipe not found" });
        }
        
        res.json(recipe);
      } catch (err: any) {
        if (err.name === "PermissionError") {
          return res.status(403).json({ message: err.message });
        }
        throw err; // Re-throw for the outer catch
      }
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  // Create a new recipe
  app.post("/api/recipes", async (req: Request, res: Response) => {
    try {
      // Get user ID from Firebase Auth
      const userId = req.headers['x-firebase-uid'] as string;
      
      // Require authentication for creating recipes
      if (!userId) {
        return res.status(401).json({ message: "Authentication required to create recipes" });
      }
      
      // Add the user ID to the recipe data
      const recipeData = {
        ...req.body,
        createdBy: userId
      };
      
      const validatedData = insertRecipeSchema.parse(recipeData);
      const newRecipe = await storage.createRecipe(validatedData);
      res.status(201).json(newRecipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating recipe:", error);
      res.status(500).json({ message: "Failed to create recipe" });
    }
  });

  // Update a recipe
  app.patch("/api/recipes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid recipe ID" });
      }
      
      // Get user ID from Firebase Auth
      const userId = req.headers['x-firebase-uid'] as string;
      
      // Require authentication for updating recipes
      if (!userId) {
        return res.status(401).json({ message: "Authentication required to update recipes" });
      }
      
      const recipe = await storage.getRecipe(id, userId);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Check if the user is the owner of the recipe
      if (recipe.createdBy !== null && recipe.createdBy !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this recipe" });
      }
      
      const validatedData = insertRecipeSchema.partial().parse(req.body);
      const updatedRecipe = await storage.updateRecipe(id, validatedData);
      
      res.json(updatedRecipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating recipe:", error);
      res.status(500).json({ message: "Failed to update recipe" });
    }
  });

  // Delete a recipe
  app.delete("/api/recipes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid recipe ID" });
      }
      
      // Get user ID from Firebase Auth
      const userId = req.headers['x-firebase-uid'] as string;
      
      // Require authentication for deleting recipes
      if (!userId) {
        return res.status(401).json({ message: "Authentication required to delete recipes" });
      }
      
      const recipe = await storage.getRecipe(id, userId);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      // Check if the user is the owner of the recipe
      if (recipe.createdBy !== null && recipe.createdBy !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this recipe" });
      }
      
      const deleted = await storage.deleteRecipe(id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete recipe" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
