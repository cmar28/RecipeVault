import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { recipes, insertRecipeSchema, insertUserSchema, Recipe, InsertRecipe } from "@shared/schema";
import multer from "multer";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { eq } from "drizzle-orm";
import { verifyFirebaseToken } from "./firebase-admin";
import axios from "axios";
import { log } from "./vite";
import { WebSocketServer, WebSocket } from 'ws';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Python AI service configuration
const AI_SERVICE_URL = 'http://localhost:5050';

// WebSocket client connections storage
const clients = new Map<string, WebSocket>();

// Helper function to send processing status updates via WebSocket
function sendProcessingStatus(
  clientId: string, 
  stage: 'uploading' | 'verifying' | 'extracting' | 'saving',
  status: 'pending' | 'processing' | 'success' | 'error',
  message?: string
): boolean {
  console.log(`Attempting to send ${stage} status (${status}) to client ${clientId}`);
  
  const client = clients.get(clientId);
  
  // Check if client exists
  if (!client) {
    console.log(`WebSocket client ${clientId} not found in clients map`);
    return false;
  }
  
  // Check if connection is open
  if (client.readyState !== WebSocket.OPEN) {
    console.log(`WebSocket client ${clientId} connection not open (state: ${client.readyState})`);
    return false;
  }
  
  try {
    // Create the update message
    const updateMessage = {
      type: 'processing_update',
      stage: {
        id: stage,
        label: getStageLabel(stage),
        status,
        message
      }
    };
    
    // Log what we're sending
    console.log(`Sending to client ${clientId}:`, JSON.stringify(updateMessage));
    
    // Send the message
    client.send(JSON.stringify(updateMessage));
    console.log(`Successfully sent ${stage} ${status} status to client ${clientId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send WebSocket update to client ${clientId}:`, error);
    return false;
  }
}

// Get a human-readable label for a processing stage
function getStageLabel(stage: string): string {
  switch (stage) {
    case 'uploading': return 'Uploading image';
    case 'verifying': return 'Verifying recipe image';
    case 'extracting': return 'Extracting recipe details';
    case 'saving': return 'Saving recipe';
    default: return 'Processing';
  }
}

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

// Helper function to crop recipe image with Python AI service
async function cropRecipeImage(base64Image: string): Promise<{
  success: boolean;
  message?: string;
  cropped_image?: string;
  cover_type?: string;
}> {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/crop`, {
      image: base64Image,
    });
    return response.data;
  } catch (error) {
    console.error("Error cropping recipe image:", error);
    return {
      success: false,
      message: "Failed to crop recipe image. Using original image."
    };
  }
}

// Middleware to verify and extract Firebase token
const firebaseAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract the Firebase ID token from the Authorization header
    const authHeader = req.headers.authorization;
    
    // Detailed debugging for recipe image upload requests
    if (req.path === '/api/recipes/from-image' && req.method === 'POST') {
      console.log('Recipe image upload auth middleware processing');
      console.log('Auth header exists:', !!authHeader);
      if (authHeader) {
        console.log('Auth header starts with Bearer:', authHeader.startsWith('Bearer '));
      }
    }
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1];
      
      try {
        // Verify the Firebase ID token
        const decodedToken = await verifyFirebaseToken(idToken);
        
        if (decodedToken) {
          // Set the user ID as a request header for easy access in routes
          // Make sure we're using the uid property from the decoded token
          const userId = decodedToken.uid || decodedToken.user_id;
          req.headers['x-firebase-uid'] = userId;
          
          // For debugging
          if (process.env.NODE_ENV === 'development') {
            console.log(`Authenticated request from user: ${userId}`);
            
            // More detailed debug for image upload
            if (req.path === '/api/recipes/from-image' && req.method === 'POST') {
              console.log('Successfully authenticated image upload request');
            }
          }
        } else {
          console.warn('Invalid Firebase token provided');
          // More detailed debug for image upload
          if (req.path === '/api/recipes/from-image' && req.method === 'POST') {
            console.log('Invalid token for image upload request');
          }
          // Don't set the user ID if token is invalid
          // This will cause protected routes to return 401
        }
      } catch (tokenError) {
        console.error('Error verifying token:', tokenError);
        // More detailed debug for image upload
        if (req.path === '/api/recipes/from-image' && req.method === 'POST') {
          console.log('Token verification error for image upload');
        }
        // Don't set user ID on verification error
      }
    } else if (req.path === '/api/recipes/from-image' && req.method === 'POST') {
      console.log('No Bearer token found for image upload request');
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
      // Log headers for debugging
      console.log("Received recipe image upload request");
      console.log("Auth header:", req.headers.authorization ? "Present" : "Missing");
      
      // Check for client ID for WebSocket updates
      const clientId = req.headers['x-client-id'] as string;
      console.log("Client ID for WebSocket updates:", clientId || "Not provided");
      
      // Track if real-time updates were delivered
      let realTimeUpdatesDelivered = false;
      
      // Get user ID from Firebase Auth
      const userId = req.headers['x-firebase-uid'] as string;
      console.log("User ID from middleware:", userId || "Not found");
      
      // Require authentication
      if (!userId) {
        console.log("Authentication failed for recipe image upload");
        return res.status(401).json({ message: "Authentication required to create recipes" });
      }
      
      // Ensure the file was provided
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // Convert the file buffer to base64
      const base64Image = req.file.buffer.toString('base64');
      
      // Send uploading complete and verification starting update via WebSocket
      if (clientId) {
        // Update for upload complete
        const uploadComplete = sendProcessingStatus(clientId, 'uploading', 'success');
        // Update for verification starting
        const verifyStarting = sendProcessingStatus(
          clientId, 
          'verifying', 
          'processing', 
          'Checking if the image contains a recipe...'
        );
        
        // If both messages were sent successfully, mark real-time updates as delivered
        realTimeUpdatesDelivered = uploadComplete && verifyStarting;
      }
      
      // Verify it's a recipe image
      log("Verifying if image contains a recipe");
      
      if (clientId) {
        console.log(`Sending verification processing status to client ${clientId}`);
      }
      
      const verificationResult = await verifyRecipeImage(base64Image);
      
      if (!verificationResult.success) {
        // Send error update via WebSocket
        if (clientId) {
          const sent = sendProcessingStatus(
            clientId, 
            'verifying', 
            'error', 
            verificationResult.message || "Failed to verify recipe image"
          );
          console.log(`Verification error status sent: ${sent}`);
        }
        
        return res.status(500).json({ 
          message: verificationResult.message || "Failed to verify recipe image",
          realTimeUpdatesDelivered 
        });
      }
      
      if (!verificationResult.is_recipe) {
        // Send error update via WebSocket
        if (clientId) {
          const sent = sendProcessingStatus(
            clientId, 
            'verifying', 
            'error', 
            "The uploaded image does not appear to contain a recipe"
          );
          console.log(`Not a recipe error status sent: ${sent}`);
        }
        
        return res.status(400).json({ 
          message: "The uploaded image does not appear to contain a recipe. Please try a different image.",
          realTimeUpdatesDelivered 
        });
      }
      
      // Send verification complete and extraction starting update via WebSocket
      if (clientId) {
        // Update for verification complete
        const verifySent = sendProcessingStatus(clientId, 'verifying', 'success');
        console.log(`Verification success status sent: ${verifySent}`);
        
        // Update for extraction starting
        const extractingSent = sendProcessingStatus(
          clientId, 
          'extracting', 
          'processing', 
          'Analyzing recipe ingredients and instructions...'
        );
        console.log(`Extraction processing status sent: ${extractingSent}`);
      }
      
      // Extract recipe data from image
      log("Extracting recipe data from image");
      const extractionResult = await extractRecipeFromImage(base64Image);
      
      if (!extractionResult.success || !extractionResult.recipe) {
        // Send error update via WebSocket
        if (clientId) {
          const sent = sendProcessingStatus(
            clientId, 
            'extracting', 
            'error', 
            extractionResult.message || "Failed to extract recipe data from image"
          );
          console.log(`Extraction error status sent: ${sent}`);
        }
        
        return res.status(500).json({ 
          message: extractionResult.message || "Failed to extract recipe data from image",
          realTimeUpdatesDelivered 
        });
      }
      
      // Send extraction complete and saving starting update via WebSocket
      if (clientId) {
        // Update for extraction complete
        const extractSuccessSent = sendProcessingStatus(clientId, 'extracting', 'success');
        console.log(`Extraction success status sent: ${extractSuccessSent}`);
        
        // Update for saving starting
        const savingProcessingSent = sendProcessingStatus(
          clientId, 
          'saving', 
          'processing', 
          'Saving recipe to your collection...'
        );
        console.log(`Saving processing status sent: ${savingProcessingSent}`);
      }
      
      // Use AI to crop the recipe image to focus on the dish or title
      log("Cropping recipe image to focus on dish or title");
      const cropResult = await cropRecipeImage(base64Image);
      
      // Use cropped image if available, otherwise use original
      let rawImageData = cropResult.success && cropResult.cropped_image 
        ? cropResult.cropped_image 
        : base64Image;
      
      // Log crop results for debugging (exclude image data due to size)
      console.log(`Crop result success: ${cropResult.success}`);
      console.log(`Crop type: ${cropResult.cover_type || 'Not detected'}`);
      
      // Add data URL prefix if it doesn't exist
      // Determine the image format (assuming JPEG if we can't detect it)
      const imageFormat = req.file.mimetype || 'image/jpeg';
      const imageDataToStore = rawImageData.startsWith('data:') 
        ? rawImageData 
        : `data:${imageFormat};base64,${rawImageData}`;
      
      // Convert the extracted recipe to our schema format
      const recipeData = {
        title: extractionResult.recipe.title,
        description: extractionResult.recipe.description,
        cookTime: extractionResult.recipe.cookingTimeMinutes, // Match schema field name
        servings: extractionResult.recipe.servings,
        // Pass arrays directly instead of joining as strings
        ingredients: extractionResult.recipe.ingredients,
        instructions: extractionResult.recipe.instructions,
        imageData: imageDataToStore, // Store the cropped image as base64 with data URL prefix
        imageUrl: null, // We'll use imageData instead of URL
        createdBy: userId
      };
      
      let newRecipe;
      try {
        // Log the data we're trying to validate (excluding the large imageData field)
        const logSafeData = { ...recipeData };
        if (logSafeData.imageData) {
          logSafeData.imageData = '[BASE64_IMAGE_DATA]'; // Replace actual image data with placeholder
        }
        console.log('Recipe data before validation:', JSON.stringify(logSafeData, null, 2));
        
        // Create the recipe in the database
        const validatedData = insertRecipeSchema.parse(recipeData);
        console.log('Validation successful');
        newRecipe = await storage.createRecipe(validatedData);
        
        // Send saving complete update via WebSocket
        if (clientId) {
          const savingSuccessSent = sendProcessingStatus(clientId, 'saving', 'success');
          console.log(`Saving success status sent: ${savingSuccessSent}`);
        }
      } catch (validationErr) {
        // Send error update via WebSocket
        if (clientId) {
          const savingErrorSent = sendProcessingStatus(
            clientId, 
            'saving', 
            'error', 
            'Failed to save the recipe due to validation errors'
          );
          console.log(`Saving error status sent: ${savingErrorSent}`);
        }
        
        if (validationErr instanceof z.ZodError) {
          console.error('Zod validation error:', JSON.stringify(validationErr.format(), null, 2));
        }
        throw validationErr;
      }
      
      // Return the created recipe
      res.status(201).json({
        recipe: newRecipe,
        message: "Recipe successfully created from image",
        realTimeUpdatesDelivered
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: validationError.message,
          realTimeUpdatesDelivered: false  
        });
      }
      console.error("Error creating recipe from image:", error);
      res.status(500).json({ 
        message: "Failed to create recipe from image",
        realTimeUpdatesDelivered: false
      });
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

  // Export all recipes for a user
  app.get("/api/export-recipes", async (req: Request, res: Response) => {
    try {
      // Get user ID from Firebase Auth
      const userId = req.headers['x-firebase-uid'] as string;
      
      // Require authentication for exporting recipes
      if (!userId) {
        return res.status(401).json({ message: "Authentication required to export recipes" });
      }
      
      console.log(`Exporting recipes for user: ${userId}`);
      
      // Get all recipes for the user, including their favorites
      const userRecipes = await storage.getRecipes(userId);
      const userFavorites = await storage.getFavoriteRecipes(userId);
      
      // Combine recipes and favorites, removing duplicates
      const favoriteIds = new Set(userFavorites.map(recipe => recipe.id));
      const ownedRecipes = userRecipes.filter(recipe => recipe.createdBy === userId);
      
      console.log(`Found ${ownedRecipes.length} recipes to export`);
      
      // Mark favorites in the export data
      const exportData = {
        recipes: ownedRecipes,
        favorites: Array.from(favoriteIds)
      };
      
      // Create a JSON string from the export data
      const jsonData = JSON.stringify(exportData);
      
      // Set the filename for the download
      res.setHeader('Content-Disposition', 'attachment; filename="my-recipes.json"');
      res.setHeader('Content-Type', 'application/json');
      
      // Send the raw JSON string instead of using res.json()
      res.end(jsonData);
    } catch (error) {
      console.error("Error exporting recipes:", error);
      res.status(500).json({ message: "Failed to export recipes" });
    }
  });
  
  // Import recipes for a user
  app.post("/api/import-recipes", async (req: Request, res: Response) => {
    try {
      // Get user ID from Firebase Auth
      const userId = req.headers['x-firebase-uid'] as string;
      
      // Require authentication for importing recipes
      if (!userId) {
        return res.status(401).json({ message: "Authentication required to import recipes" });
      }
      
      console.log(`Importing recipes for user: ${userId}`);
      
      const importData = req.body;
      
      if (!importData || !importData.recipes || !Array.isArray(importData.recipes)) {
        return res.status(400).json({ message: "Invalid import data format" });
      }
      
      const importedRecipes: Recipe[] = [];
      const favorites: number[] = importData.favorites || [];
      
      // Import recipes
      for (const recipe of importData.recipes) {
        // Prepare recipe data for insertion
        const recipeData: InsertRecipe = {
          title: recipe.title,
          description: recipe.description,
          imageUrl: recipe.imageUrl,
          imageData: recipe.imageData,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          createdBy: userId // Set the current user as the creator
        };
        
        // Validate and insert recipe
        try {
          const validatedData = insertRecipeSchema.parse(recipeData);
          const newRecipe = await storage.createRecipe(validatedData);
          importedRecipes.push(newRecipe);
          
          // Add to favorites if the original was a favorite
          if (favorites.includes(recipe.id)) {
            await storage.toggleFavorite(userId, newRecipe.id);
          }
        } catch (validationErr) {
          console.error(`Validation error for recipe "${recipe.title}":`, validationErr);
          // Continue with other recipes even if one fails
        }
      }
      
      res.status(201).json({
        message: `Successfully imported ${importedRecipes.length} recipes`,
        recipes: importedRecipes
      });
      
    } catch (error) {
      console.error("Error importing recipes:", error);
      res.status(500).json({ message: "Failed to import recipes" });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server on the same HTTP server but with a different path
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });
  
  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection established');
    
    // Handle client registration
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle client registration
        if (data.type === 'register' && data.clientId) {
          const clientId = data.clientId;
          console.log(`Registering WebSocket client: ${clientId}`);
          
          // Add client to our map
          clients.set(clientId, ws);
          
          // Send confirmation to client
          ws.send(JSON.stringify({
            type: 'register_confirm',
            clientId
          }));
          
          // When the connection closes, remove the client
          ws.on('close', () => {
            console.log(`WebSocket client disconnected: ${clientId}`);
            clients.delete(clientId);
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
  });
  
  return httpServer;
}
