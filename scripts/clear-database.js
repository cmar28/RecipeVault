import { db } from '../server/db.js';
import { recipes } from '../shared/schema.js';

// Function to clear all recipes from the database
async function clearDatabase() {
  try {
    // Delete all recipes
    await db.delete(recipes);
    console.log('All recipes have been removed from the database');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

// Call the function to clear the database
clearDatabase();