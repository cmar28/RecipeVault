import { db } from '../server/db';
import { recipes } from '../shared/schema';

// Base64 image data for small placeholder images of different colors (truncated for brevity)
const recipeImages = {
  redImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA/0lEQVR4nO3RMQ0AMQwEwXuFf8mKgBdQMHSGYAfZH4CefapAGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWC8AAD//1VNKpNvzGnXAAAAAElFTkSuQmCC',

  greenImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA/0lEQVR4nO3RMQ0AMQwEwbuRfwmUXJFeBkoCgdghu0P2B2Ceq76AwDIILIPAMggsg8AyCCyDwDIILIPAMggsg8AyCCyDwDIILIPAMggsg8AyCCyDwDIILIPAMggsg8AyCCyDwDIILIPAMggsg8AyCCyDwDIILIPAMggsg8AyCCyDwDIILIPAMggsg8AyCCyDwDIILIPAMggsg8AyCCyDwDIILIPAMggsg8AyCCyDwDIILIPAMggsg8AyCCyDwDIILIPAMggsg8AyCCyDwDIILIPAMggsg8AyCCyDwDIILIPAMggsg8AyCCyDwDIILIPAMggsg8AyCCyDwDIILIPAAXq1H9sEvZHZAAAAAElFTkSuQmCC',

  yellowImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA/0lEQVR4nO3RMQ0AMQwEwfvVf8k68YNcMHSGYAfZH4CefapAGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWAYBIZBYBgEhkFgGASGQWC8AAD//2XCKpMqV27aAAAAAElFTkSuQmCC',

  brownImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA/0lEQVR4nO3RMQkAAAwDsPJXPaoEbO4JyHqSPQAwR30BgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoG1AAD//24qKpM0eUbUAAAAAElFTkSuQmCC',

  blueImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA/0lEQVR4nO3RMQ0AMAwDwTvYv2Qb1BFMQMHQGYI9yD6A8ky1AoJlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaBZRBYBoFlEFgGgWUQWAaB9QIA///uiSqTFThHPQAAAABJRU5ErkJggg=='
};

// Test recipes data
const testRecipes = [
  {
    title: "Classic Margherita Pizza",
    description: "A simple yet delicious traditional Italian pizza with fresh mozzarella, tomatoes, and basil.",
    imageData: recipeImages.redImage,
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
      "Salt and pepper to taste"
    ],
    instructions: [
      "Mix flour, salt, and yeast. Add warm water and olive oil to form dough.",
      "Knead dough for 5-7 minutes until smooth. Let rise for 1 hour.",
      "Roll out dough and top with sauce, cheese, and basil.",
      "Bake at 475°F for 12-15 minutes until golden.",
      "Drizzle with olive oil before serving."
    ],
    isFavorite: true
  },
  {
    title: "Avocado Toast with Poached Egg",
    description: "A nutritious breakfast with creamy avocado and perfectly poached eggs.",
    imageData: recipeImages.greenImage,
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
      "Fresh herbs for garnish"
    ],
    instructions: [
      "Toast bread until golden and crisp.",
      "Mash avocado with lemon juice, salt, and pepper.",
      "Poach eggs in simmering water with vinegar for 3-4 minutes.",
      "Spread avocado on toast and top with poached eggs.",
      "Garnish with red pepper flakes and fresh herbs."
    ],
    isFavorite: false
  },
  {
    title: "Lemon Garlic Butter Shrimp Pasta",
    description: "A quick and flavorful pasta dish with succulent shrimp.",
    imageData: recipeImages.yellowImage,
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    ingredients: [
      "12 oz linguine or spaghetti",
      "1 lb large shrimp, peeled and deveined",
      "4 tbsp unsalted butter",
      "4 cloves garlic, minced",
      "Zest and juice of 1 lemon",
      "1/4 cup dry white wine",
      "Fresh parsley, chopped",
      "Parmesan cheese",
      "Salt and pepper"
    ],
    instructions: [
      "Cook pasta according to package instructions.",
      "Sauté shrimp in butter until pink. Remove and set aside.",
      "In the same pan, cook garlic and add lemon zest, juice, and wine.",
      "Return shrimp to pan and add drained pasta.",
      "Toss with parsley and Parmesan before serving."
    ],
    isFavorite: true
  },
  {
    title: "Chocolate Lava Cake",
    description: "Decadent chocolate dessert with a molten center.",
    imageData: recipeImages.brownImage,
    prepTime: 15,
    cookTime: 14,
    servings: 4,
    ingredients: [
      "4 oz semi-sweet chocolate",
      "1/2 cup unsalted butter",
      "1 cup powdered sugar",
      "2 large eggs",
      "2 egg yolks",
      "1 tsp vanilla extract",
      "1/3 cup all-purpose flour",
      "Pinch of salt",
      "Powdered sugar for dusting"
    ],
    instructions: [
      "Preheat oven to 425°F and grease four ramekins.",
      "Melt chocolate and butter together.",
      "Whisk in powdered sugar, eggs, egg yolks, and vanilla.",
      "Fold in flour and salt gently.",
      "Pour into ramekins and bake for 12-14 minutes.",
      "Dust with powdered sugar and serve warm."
    ],
    isFavorite: false
  },
  {
    title: "Blueberry Pancakes",
    description: "Fluffy pancakes studded with juicy blueberries.",
    imageData: recipeImages.blueImage,
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    ingredients: [
      "2 cups all-purpose flour",
      "2 tbsp sugar",
      "1 tbsp baking powder",
      "1/2 tsp salt",
      "2 eggs",
      "1 3/4 cups milk",
      "1/4 cup melted butter",
      "1 tsp vanilla",
      "1 1/2 cups fresh blueberries",
      "Maple syrup for serving"
    ],
    instructions: [
      "Mix dry ingredients in one bowl, wet ingredients in another.",
      "Combine wet and dry ingredients until just mixed.",
      "Fold in the blueberries gently.",
      "Cook on a hot griddle until bubbles form, then flip.",
      "Serve warm with maple syrup."
    ],
    isFavorite: true
  }
];

// Function to populate the database with test recipes
async function populateDatabase() {
  try {
    for (const recipe of testRecipes) {
      await db.insert(recipes).values(recipe);
    }
    console.log('Database successfully populated with 5 test recipes');
  } catch (error) {
    console.error('Error populating database:', error);
  }
}

// Call the populate function
populateDatabase();