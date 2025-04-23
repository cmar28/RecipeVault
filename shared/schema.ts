import { pgTable, text, serial, integer, boolean, varchar, timestamp } from "drizzle-orm/pg-core";
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
  isFavorite: boolean("is_favorite").default(false),
  createdBy: varchar("created_by").references(() => users.uid), // Reference to Firebase user ID
});

export const insertUserSchema = createInsertSchema(users);

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;
