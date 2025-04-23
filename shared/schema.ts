import { pgTable, text, serial, integer, boolean, varchar, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Firebase users - stores additional user info from Firebase Auth
export const users = pgTable("users", {
  uid: varchar("uid").primaryKey().notNull(), // Firebase UID
  displayName: varchar("display_name"),
  email: varchar("email"),
  photoURL: varchar("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login").defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  imageData: text("image_data"), // Base64 encoded image data
  prepTime: integer("prep_time"),
  cookTime: integer("cook_time"),
  servings: integer("servings"),
  ingredients: text("ingredients").array(),
  instructions: text("instructions").array(),
  createdBy: varchar("created_by").references(() => users.uid), // Reference to Firebase user ID
});

// User favorite recipes - junction table for many-to-many relationship
export const userFavorites = pgTable("user_favorites", {
  userId: varchar("user_id").notNull().references(() => users.uid),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.recipeId] })
}));

export const insertUserSchema = createInsertSchema(users);

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
});

export const insertUserFavoriteSchema = createInsertSchema(userFavorites);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect & { isFavorite?: boolean }; // Add virtual field for client

export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;
export type UserFavorite = typeof userFavorites.$inferSelect;
