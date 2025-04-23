import { db } from "../server/db";
import { recipes } from "../shared/schema";
import * as fs from 'fs';
import * as path from 'path';

// Function to read image files and convert to base64
function imageFileToBase64(filePath: string): string {
  try {
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');
    const mimeType = path.extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64Data}`;
  } catch (error) {
    console.error(`Error reading image file: ${filePath}`, error);
    return '';
  }
}

// Get base64 encoded images from the PNG files
const recipeImages = {
  pizzaImage: imageFileToBase64('scripts/Pizza.png'),
  toastImage: imageFileToBase64('scripts/Toasts.png'),
  pastaImage: imageFileToBase64('scripts/Pasta.png'),
  cakeImage: imageFileToBase64('scripts/Cake.png'),
  pancakesImage: imageFileToBase64('scripts/pancakes.png'),
};

// Test recipes data
const testRecipes = [
  {
    title: "Classic Margherita Pizza",
    description: "A simple yet delicious traditional Italian pizza with fresh mozzarella, tomatoes, and basil.",
    imageData: recipeImages.pizzaImage,
    prepTime: 25,
    cookTime: 15,
    servings: 4,
    ingredients: [
      "2 1/4 cups all-purpose flour",
      "1 tsp salt", 
      "1 tsp active dry yeast",
      "1 cup warm water",
      "2 tbsp olive oil",
      "1 cup tomato sauce",
      "8 oz fresh mozzarella, sliced",
      "Fresh basil leaves",
      "Extra virgin olive oil",
      "Salt and pepper to taste",
    ],
    instructions: [
      "Mix flour, salt, and yeast. Add warm water and olive oil to form dough.",
      "Knead dough for 5-7 minutes until smooth. Let rise for 1 hour.",
      "Roll out dough and top with sauce, cheese, and basil.",
      "Bake at 475°F for 12-15 minutes until golden.",
      "Drizzle with olive oil before serving.",
    ],
    createdBy: null, // Public recipe
  },
  {
    title: "Avocado Toast with Poached Egg",
    description: "A nutritious breakfast with creamy avocado and perfectly poached eggs.",
    imageData: recipeImages.toastImage,
    prepTime: 10,
    cookTime: 5,
    servings: 2,
    ingredients: [
      "2 slices whole grain bread",
      "1 ripe avocado",
      "2 large eggs",
      "1 tbsp white vinegar",
      "Lemon juice",
      "Red pepper flakes",
      "Salt and black pepper",
      "Fresh herbs for garnish",
    ],
    instructions: [
      "Toast bread until golden and crisp.",
      "Mash avocado with lemon juice, salt, and pepper.",
      "Poach eggs in simmering water with vinegar for 3-4 minutes.",
      "Spread avocado on toast and top with poached eggs.",
      "Garnish with red pepper flakes and fresh herbs.",
    ],
    createdBy: null,
  }
];

// Function to populate the database with test recipes
async function populateDatabase() {
  try {
    for (const recipe of testRecipes) {
      await db.insert(recipes).values(recipe);
    }
    console.log("Database successfully populated with test recipes");
  } catch (error) {
    console.error("Error populating database:", error);
  }
}

// Call the populate function
populateDatabase();