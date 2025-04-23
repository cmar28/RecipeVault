import { 
  users, 
  type User, 
  type InsertUser, 
  recipes, 
  type Recipe, 
  type InsertRecipe,
  userFavorites,
  type InsertUserFavorite
} from "@shared/schema";
import { db } from "./db";
import { eq, or, isNull, and, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Firebase User operations
  getUser(uid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
  
  // Recipe operations
  getRecipes(userId?: string): Promise<Recipe[]>;
  getRecipe(id: number, userId?: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: number): Promise<boolean>;
  
  // Favorites operations
  getFavoriteRecipes(userId: string): Promise<Recipe[]>;
  toggleFavorite(userId: string, recipeId: number): Promise<boolean>;
  isFavorite(userId: string, recipeId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Firebase User operations
  async getUser(uid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.uid, uid));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    // Upsert - create if not exists, update if exists
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          ...userData,
          lastLogin: new Date(),
        },
      })
      .returning();
    
    return user;
  }

  // Recipe operations
  async getRecipes(userId?: string): Promise<Recipe[]> {
    let allRecipes: Recipe[];
    
    if (userId) {
      // For authenticated users, return:
      // 1. Public recipes (created_by is NULL)
      // 2. User's own recipes (created_by equals userId)
      allRecipes = await db.select()
        .from(recipes)
        .where(
          // Logic for: WHERE created_by IS NULL OR created_by = userId
          or(
            isNull(recipes.createdBy),
            eq(recipes.createdBy, userId)
          )
        );
      
      // Get user's favorites
      const favorites = await db.select()
        .from(userFavorites)
        .where(eq(userFavorites.userId, userId));
      
      // Create a Set of favorite recipe IDs for quick lookup
      const favoriteIds = new Set(favorites.map(f => f.recipeId));
      
      // Add isFavorite flag to each recipe
      return allRecipes.map(recipe => ({
        ...recipe,
        isFavorite: favoriteIds.has(recipe.id)
      }));
    } else {
      // For unauthenticated users, return only public recipes
      allRecipes = await db.select()
        .from(recipes)
        .where(isNull(recipes.createdBy));
      
      // No favorites for unauthenticated users
      return allRecipes.map(recipe => ({
        ...recipe,
        isFavorite: false
      }));
    }
  }

  async getRecipe(id: number, userId?: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    
    if (!recipe) return undefined;
    
    // Access control: recipe is visible if
    // 1. It's a public recipe (created_by is NULL)
    // 2. User is the creator (created_by equals userId)
    if (recipe.createdBy === null || recipe.createdBy === userId) {
      // If user is authenticated, check if recipe is favorited
      if (userId) {
        const isFavorite = await this.isFavorite(userId, id);
        return {
          ...recipe,
          isFavorite
        };
      }
      
      return {
        ...recipe,
        isFavorite: false
      };
    }
    
    return undefined; // User doesn't have access to this recipe
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const [recipe] = await db
      .insert(recipes)
      .values(insertRecipe)
      .returning();
    
    return {
      ...recipe,
      isFavorite: false
    };
  }

  async updateRecipe(id: number, recipeUpdate: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [updatedRecipe] = await db
      .update(recipes)
      .set(recipeUpdate)
      .where(eq(recipes.id, id))
      .returning();
    
    if (!updatedRecipe) return undefined;
    
    return updatedRecipe;
  }

  async deleteRecipe(id: number): Promise<boolean> {
    // First delete any favorites of this recipe
    await db
      .delete(userFavorites)
      .where(eq(userFavorites.recipeId, id));
    
    // Then delete the recipe
    const [deletedRecipe] = await db
      .delete(recipes)
      .where(eq(recipes.id, id))
      .returning({ id: recipes.id });
    
    return !!deletedRecipe;
  }
  
  // Favorites operations
  async getFavoriteRecipes(userId: string): Promise<Recipe[]> {
    // Get list of favorite recipe IDs for the user
    const favorites = await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId));
    
    if (favorites.length === 0) {
      return [];
    }
    
    // Extract recipe IDs
    const recipeIds = favorites.map(favorite => favorite.recipeId);
    
    // Get recipes by IDs
    const favoriteRecipes = await db
      .select()
      .from(recipes)
      .where(inArray(recipes.id, recipeIds));
    
    // Add isFavorite = true to all recipes in favorites
    return favoriteRecipes.map(recipe => ({
      ...recipe,
      isFavorite: true
    }));
  }
  
  async toggleFavorite(userId: string, recipeId: number): Promise<boolean> {
    // Check if already a favorite
    const isFavorite = await this.isFavorite(userId, recipeId);
    
    if (isFavorite) {
      // Remove from favorites
      await db
        .delete(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, userId),
            eq(userFavorites.recipeId, recipeId)
          )
        );
      return false; // No longer a favorite
    } else {
      // Add to favorites
      await db
        .insert(userFavorites)
        .values({
          userId,
          recipeId
        });
      return true; // Now a favorite
    }
  }
  
  async isFavorite(userId: string, recipeId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.recipeId, recipeId)
        )
      );
    
    return !!favorite;
  }
}

export const storage = new DatabaseStorage();
