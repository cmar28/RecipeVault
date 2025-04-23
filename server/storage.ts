import { 
  users, 
  type User, 
  type InsertUser, 
  recipes, 
  type Recipe, 
  type InsertRecipe 
} from "@shared/schema";
import { db } from "./db";
import { eq, or, isNull } from "drizzle-orm";

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
    if (userId) {
      // For authenticated users, return:
      // 1. Public recipes (created_by is NULL)
      // 2. User's own recipes (created_by equals userId)
      return await db.select()
        .from(recipes)
        .where(
          // Logic for: WHERE created_by IS NULL OR created_by = userId
          or(
            isNull(recipes.createdBy),
            eq(recipes.createdBy, userId)
          )
        );
    } else {
      // For unauthenticated users, return only public recipes
      return await db.select()
        .from(recipes)
        .where(isNull(recipes.createdBy));
    }
  }

  async getRecipe(id: number, userId?: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    
    if (!recipe) return undefined;
    
    // Access control: recipe is visible if
    // 1. It's a public recipe (created_by is NULL)
    // 2. User is the creator (created_by equals userId)
    if (recipe.createdBy === null || recipe.createdBy === userId) {
      return recipe;
    }
    
    return undefined; // User doesn't have access to this recipe
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const [recipe] = await db
      .insert(recipes)
      .values(insertRecipe)
      .returning();
    return recipe;
  }

  async updateRecipe(id: number, recipeUpdate: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [updatedRecipe] = await db
      .update(recipes)
      .set(recipeUpdate)
      .where(eq(recipes.id, id))
      .returning();
    
    return updatedRecipe || undefined;
  }

  async deleteRecipe(id: number): Promise<boolean> {
    const [deletedRecipe] = await db
      .delete(recipes)
      .where(eq(recipes.id, id))
      .returning({ id: recipes.id });
    
    return !!deletedRecipe;
  }
}

export const storage = new DatabaseStorage();
