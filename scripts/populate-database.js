import { db } from '../server/db.ts';
import { recipes } from '../shared/schema.ts';

// Base64 image data for small placeholder images of different colors
const recipeImages = {
  // Red placeholder - represents tomato or strawberry
  redImage: 'data:image/png;base64,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',
  
  // Green placeholder - represents spinach or avocado
  greenImage: 'data:image/png;base64,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',
  
  // Yellow placeholder - represents lemon or pasta
  yellowImage: 'data:image/png;base64,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',
  
  // Brown placeholder - represents chocolate or coffee
  brownImage: 'data:image/png;base64,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',
  
  // Blue placeholder - represents blueberries
  blueImage: 'data:image/png;base64,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'
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
      "1/4 cup fresh basil leaves",
      "2 tbsp extra virgin olive oil",
      "Salt and pepper to taste"
    ],
    instructions: [
      "In a large bowl, mix flour, salt, and yeast.",
      "Gradually add warm water and olive oil, mixing until a dough forms.",
      "Knead the dough on a floured surface for 5-7 minutes until smooth and elastic.",
      "Place in a greased bowl, cover, and let rise for 1 hour.",
      "Preheat oven to 475°F (245°C).",
      "Roll out the dough on a floured surface to form a 12-inch circle.",
      "Transfer to a baking sheet or pizza stone.",
      "Spread tomato sauce evenly over the dough, leaving a small border.",
      "Top with mozzarella slices.",
      "Bake for 12-15 minutes until crust is golden and cheese is bubbly.",
      "Remove from oven, top with fresh basil leaves, drizzle with olive oil, and season with salt and pepper.",
      "Slice and serve immediately."
    ],
    isFavorite: true
  },
  {
    title: "Avocado Toast with Poached Egg",
    description: "A nutritious and delicious breakfast option that's quick to prepare and packed with healthy fats and protein.",
    imageData: recipeImages.greenImage,
    prepTime: 10,
    cookTime: 5,
    servings: 2,
    ingredients: [
      "2 slices of whole grain bread",
      "1 ripe avocado",
      "2 large eggs",
      "1 tbsp white vinegar",
      "1/2 lemon, juiced",
      "Red pepper flakes",
      "Salt and black pepper to taste",
      "Fresh herbs (cilantro or parsley) for garnish"
    ],
    instructions: [
      "Toast the bread slices until golden and crisp.",
      "Cut the avocado in half, remove the pit, and scoop the flesh into a bowl.",
      "Add lemon juice, salt, and pepper to the avocado and mash with a fork until desired consistency.",
      "Bring a pot of water to a gentle simmer and add white vinegar.",
      "Crack each egg into a small bowl, then gently slide into the simmering water.",
      "Poach eggs for 3-4 minutes until whites are set but yolks are still runny.",
      "Spread the mashed avocado evenly on the toast slices.",
      "Top each toast with a poached egg, sprinkle with red pepper flakes, additional salt and pepper if desired, and garnish with fresh herbs.",
      "Serve immediately."
    ],
    isFavorite: false
  },
  {
    title: "Lemon Garlic Butter Shrimp Pasta",
    description: "A quick and flavorful pasta dish with succulent shrimp in a zesty lemon garlic butter sauce.",
    imageData: recipeImages.yellowImage,
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    ingredients: [
      "12 oz linguine or spaghetti",
      "1 lb large shrimp, peeled and deveined",
      "4 tbsp unsalted butter",
      "4 cloves garlic, minced",
      "1 tsp red pepper flakes",
      "Zest and juice of 1 lemon",
      "1/4 cup dry white wine",
      "1/4 cup fresh parsley, chopped",
      "Salt and freshly ground black pepper",
      "1/4 cup grated Parmesan cheese"
    ],
    instructions: [
      "Cook pasta according to package instructions until al dente. Reserve 1/2 cup of pasta water before draining.",
      "While pasta cooks, season shrimp with salt and pepper.",
      "In a large skillet, melt 2 tablespoons of butter over medium-high heat.",
      "Add shrimp to the skillet and cook for 1-2 minutes per side until pink and cooked through. Remove shrimp and set aside.",
      "In the same skillet, add remaining butter, minced garlic, and red pepper flakes. Cook for 1 minute until fragrant.",
      "Add lemon zest, lemon juice, and white wine. Let simmer for 2 minutes.",
      "Return shrimp to the skillet and add drained pasta. Toss well to coat, adding reserved pasta water as needed to create a silky sauce.",
      "Stir in chopped parsley and Parmesan cheese.",
      "Adjust seasoning with salt and pepper if needed.",
      "Serve immediately with additional Parmesan cheese if desired."
    ],
    isFavorite: true
  },
  {
    title: "Chocolate Lava Cake",
    description: "Decadent chocolate dessert with a molten center that's surprisingly easy to make and guaranteed to impress.",
    imageData: recipeImages.brownImage,
    prepTime: 15,
    cookTime: 14,
    servings: 4,
    ingredients: [
      "4 oz semi-sweet chocolate",
      "1/2 cup unsalted butter",
      "1 cup powdered sugar",
      "2 large eggs",
      "2 large egg yolks",
      "1 tsp vanilla extract",
      "1/3 cup all-purpose flour",
      "Pinch of salt",
      "Butter and cocoa powder for ramekins",
      "Powdered sugar for dusting",
      "Vanilla ice cream for serving (optional)"
    ],
    instructions: [
      "Preheat oven to 425°F (220°C).",
      "Grease four 6-oz ramekins with butter and dust with cocoa powder.",
      "In a microwave-safe bowl, combine chocolate and butter. Microwave in 30-second intervals, stirring in between, until melted and smooth.",
      "Whisk in powdered sugar until well combined.",
      "Add eggs, egg yolks, and vanilla extract, whisking until smooth.",
      "Fold in flour and salt until just combined.",
      "Divide batter evenly among prepared ramekins.",
      "Place ramekins on a baking sheet and bake for 12-14 minutes until edges are firm but centers are still soft.",
      "Let cool for 1 minute, then run a knife around the edges and invert onto serving plates.",
      "Dust with powdered sugar and serve immediately with vanilla ice cream if desired."
    ],
    isFavorite: false
  },
  {
    title: "Blueberry Pancakes",
    description: "Fluffy, golden pancakes studded with juicy blueberries make for the perfect weekend breakfast.",
    imageData: recipeImages.blueImage,
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    ingredients: [
      "2 cups all-purpose flour",
      "2 tbsp granulated sugar",
      "1 tbsp baking powder",
      "1/2 tsp salt",
      "2 large eggs",
      "1 3/4 cups milk",
      "1/4 cup unsalted butter, melted",
      "1 tsp vanilla extract",
      "1 1/2 cups fresh blueberries",
      "Butter or oil for cooking",
      "Maple syrup for serving"
    ],
    instructions: [
      "In a large bowl, whisk together flour, sugar, baking powder, and salt.",
      "In another bowl, beat the eggs, then add milk, melted butter, and vanilla extract.",
      "Pour the wet ingredients into the dry ingredients and stir until just combined. A few lumps are okay.",
      "Gently fold in the blueberries, saving a few for topping.",
      "Heat a non-stick pan or griddle over medium heat and lightly coat with butter or oil.",
      "Pour 1/4 cup of batter for each pancake onto the hot griddle.",
      "Cook until bubbles form on the surface, about 2-3 minutes, then flip and cook another 1-2 minutes until golden brown.",
      "Transfer to a plate and keep warm while cooking the remaining pancakes.",
      "Serve warm, topped with additional blueberries and maple syrup."
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