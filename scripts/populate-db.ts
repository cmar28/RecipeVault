import { db } from '../server/db';
import { recipes } from '../shared/schema';

// Enhanced base64 image data for more visible, bolder placeholder images
const recipeImages = {
  // Red color - more vibrant for pizza image
  redImage: 'data:image/png;base64,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',

  // Green color - more vibrant for avocado toast
  greenImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAAnFBMVEUzpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD4zpD7MHqcYAAAAM3RSTlMAmfRJUQgV7Dkm4cBOJwPX04d1F0Aqnol9cjUPLcmukjrp5th7GA7Jso5gVS+/q2pXRDLK3HkPAAADAElEQVRo3u3a2XKbQBAFUGkkEFoQsgQCxGazAZPFJv//a1HTGgJKleUl8jSnKkVlqrjTfd1NYzH/VLH5qP2vZgv7vXbzUZtJO2f8uoJhcJ6o1mrGGq7o4AtYrRLrOW4o1CouGwU6tOrvMvLm4jtrvcGYk0wJB5pKuZDm4G1t6qn17AxtqrSw48C6p1KgnUg/w9GsEbihYv7Idv7YEGDMZIPt/KW4BVhiYF6EOmqRrKiDHFvKOBjaxs6whJwfXUoL+2HCkVkLEJ9GqzjCcQY7UVNnDmg7mNuiNCzUzq21vNcwUa9NqbQVRzrqfGp7BQM1ayuDZ37K3lLZQbPWO8rWt6y0pXK2H7CnYt7yXh3+xTJeXjdfrddU8tEYTl0eE6XS9/Itp61TvSS2qOQGlGqrRW7aasTahHYcLY9UD3eMaHNkp/KUhpTGZqd0v0fz2e30bMh7Xba8Pj+/zvkgRCfbKfTDLF9c+WqIJvOpzr4fpKtYLRmEoSeGaaKK0qHX3aWq4+VFHSmaRFTlw7M3Vk1H0Oi4SruLp2VZ9AzxGvgKm0Yjj6L5vDgeYzHrxtHzPuvt8r5Cg6LFUfCp9y6WC+5Fr4tYJzTJtqmk3X9d80VsjKfSCzLxiAolZw0+Y2NJ0qFSBM3YLDumWg6NmMVU82FEwamWQyMWW8plWGNLuQJrPH4onMOWL4ozaMS56uQjxKK2vYcJP6FMAROidoZbmDgIKhQw0RPUcWEgpFyADXW+RigT4Bz12cLGJKVCBivxREAXNoKEog7AJMRMiSKAYwXaMQgz0kxJrACmLlKbg8soKpRgZ0D9TQc2jDeVSmClyVOHSzvBWUL9bpgEkIm0DY7b2F3GHPULk3PkXWNfCeCF1GnvwbmCOplwbVEnCy7lAq3KGQ7SYqP+pS3UwcXGfQ81EnUQC4L2uCnuQqduAzcIW/6htQ0o1zT/Vf2A65/88fPnTwAX1vkZf+XlOdZ7+w1E6NB7s/OdMQAAAABJRU5ErkJggg==',

  // Yellow color - more vibrant for pasta dish
  yellowImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAA/1BMVEXyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwLyuwL4X4b+AAAAU3RSTlMAAfwK9AUFEQwU3xji0jAe8FsqJfnr5rl0blKsiW5ZMikcycB5WUs9EP3z7NnKjYVpUUA6+e/Syr6xsKyakIN9dXJfTUQxKNrVysWvrZmYj4d6OAqsuOIAAAMtSURBVGje7ZrndqMwEIUNQgKEwL333nvvJbub3fd/mB0JjA3GJnF2N+ewOT+sM9b96EojCcTTw4OovUf15PHhvSiKn/Z3DQdVUXwLv97UlSo9RQTvSlUDnVRZwWoXqgYKHzWPHlQO8U2NoVtFc313Zy4Ry9ydDarwdcUHwQFwX7cP/C0MvIIvUG++yF9QhS8QHw+AeEg+z1+yhq+wlj+vVOHrjw8GaXC+3iaqRF9fZPj6esMcpI3z4r5KfL0WQKXC1yeAcUhGBIRD0pCQhCQkIQlJSEISkpCEJCQhCUn4L0Iql8FgYBgGK/R3QaZpuq47QMfM/xsymUwmpm0OrbFxnRj+JqQqsyGMJLH8NUhlGGCzmX2NGK0vu+w0Qc/HFSnVJljDucFwlrjjyqXS33/sTx52GKEfG/sQBDlD0LxpEeM0f/w0GDWB/oNFJBL3Nrmu20gYnIy1LEvVtHwYwt8ZvCYaTYrRaqPeHNdqwL0vxGKxKN4WwUWG8VhPP3qK0xSDSQkRGACcCfNUG/cMBRnwK+GX8TMC6Tm7NNbTrSk6cRAijokV5gTzMJEBWIEzXmI0FsMQk44FiBlBDmICYiX0g6SXFKNjnb5kfKk4UUzm2dqQzBQ7rsMQpwtAkAAEL0OiFMmVKC5/gqSZUJ+y/EGQi1h1+CLNRKjOXn4AMlVpJnrufL0gBG/6rYvp6x2EtBRaF35EvAOQokozsRwupq/VEZJ+qAJxRYIQXU0xoSe2rT1AZkOKia1dq+8BWQwpJla7VqscQ9gWUjFUYdud4xn6iTbSXKwTQBNjF5BaQADSRMvnAMma8P4QAgDxzXwBE1FXHWNvCB1N6gI9cQ5MLKlWGsEZADlvJX7l7g5BU5E5UUZlPtfRAOFvPrULENPn8zQ+NXHW3WkJNVPpDnB2a3rWkPDJMYEoB49MsG2kc/C2kDbZt4W0SSFYsbcmjWGjCZBGvcE2ZUwBYWcU+vM0G/OEeYEFZDtC3BXAN63ExaMgKD+q3rS/l5Mxl/kSbNPvWvFUFW8e38D7nJ5qPP0B6r07Y7+UgYoAAAAASUVORK5CYII=',

  // Brown color - more vibrant for chocolate cake
  brownImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAA/1BMVEVyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBxyPBwv9Xb8AAAAU3RSTlMA/gEU+fr4Qvzz6zjdFgnGrgLwIW0QC/mzcNKpcWkeBaKVZ1o9Mxzvx7CkjVcrHBfh2c/CunloYFhUTjYrJh316OXi4NnTuLSaj4N5XVBKRDAbTDQpCikAAAMKSURBVGje7dpnc9pAFIbhBUQRohtMbwZT3Huv6T0k5/9/TrQrpARs4iQ7M5nJvB9t3TMrLldCaDSfM/SfZT7XrD80zP7Zk4KLAiMoS0/OzJ+aDeGrqKmqp1Kpur4nfMDrCt/HkFcXYbzgZdE6E9gY1y3aIGwQ8Q30Dd4wARtTi5ZMAMc0qYUAjxpRkxrwMQntU6UBHpNQixaBHzWJXrSgYxJrLBGD3w1rEi0hx4RkSqanKu19lclCTFD8VilC78BItGXOUlKUTEoSQ78hicVoEunCVNvSJZnpnUV2Kklw1WitF3XvHBe9CqU5zDp1UmzKZIu+8ixO7aqatRhEmgfNGpdNSbS9vZjnY4RBilKQJIIWaQIJ0QMahUxlsihpCQRHJDSrJBFXNapAPk5Ek0ofAeOFVw4wMRUSISmQZCqRhlz20I0BRXZgIU8Z2OiLPKysRRpnrMcBmDilLGmojYxcA45EQa4hWDZ5cPJb05MwzEzJxFEw0jZF4pCImJRJQ0JI6RLByjm50AcmCxeFQmEiHOGnl1IIRpTcUHwsUxZa6FEyWXhIUWQMLRKUTAYMOUUWm5DNE+E9JOPmKfkktDCnZOPQIikK70OLtqhD0mJTZA4t5nRI7kPyICihjCAPERPMRcLQIcgGLDe5V2jhhyV38YH/7pvxQx4DLhL2FtkPdx8Cbt9zr3hhECEtyEu3yDDyuStkHjbk8tkp4r5CslnbPa/mLhDXFrKJbOzYFwhr0wGQzeU6sS9OkAZJNRhbH9nYGeLqJKdXQSM2yD7i8klU9LdIZXO1ndt2EWRA7kpUuwgd+yWHR8hnJPbXSxNM4VR9P+3IXj+lRsbpXh+6+lZDR91UXkJ8+1a1sJ6ZBxsjGqTWfwhrpmmR9X4MNKbRaP4+TNKfR6t3jK8SzK1/CHvL8rJkv4MGt0uiJexnlZfFfj0CHDVYf2o4vMxKsOhxXQKNkdYlEUtrr8siPy0TzZZgUoYF5pHqvtM+Lg3Ld9DV/Z+XpzNTtEyYfZf1fzQzRXP2G85D+tWLZ9MbAAAAAElFTkSuQmCC',

  // Blue color - more vibrant for blueberry pancakes
  blueImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAA5FBMVEX/////gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv//gv+HQx0vAAAAS3RSTlMAAf3+5wQCAvr3CfMGEAvsPRwV9OncLSEO8by0n4wz7+LWmHNZVUcpHt/MvJ+cdFJENTAeGwkH9vDt2s7ErKKai2JXT0lAPy8jGY/Yk/d2AAADGUlEQVRo3u3a2VLbQBAFULUsWZb3fcd4wYBZQwhZCdnIQsj//1Bqhs2AQi6m1DXVNzwbnbJ6ZiRbEY8PDw+NH1X/8fjwoNEwfzGOrGMt6dDImv1i/IIWHVZ1mL8aDa20VrRptDYqmxZO0x1t5oJR0TYr40t9GJlw/mWE6hsMR2EqWmG4u1GYa+xhiBDXGHmYWbix+WfU5bNc+/7xDJOr4pN18H0YtNQaM/mKx19rPEq8AFEOE0NuX3b+kQy+BCDuwdRVJpOJyPxl19KT53gG2CiTeIZkKtVxp7TFdnKRjCdgNR1Yxm4XHSujEn+ZYBpymk7q7JgGO2Xa42w3RU7r7Aw5uSuRrCdE7JrESLcKaxl3SDSTjMbGUvgmZ7NSYrRXNnszY48/Yw82Bm9Uh+G1BivDVBWGoVsMUzUYA9PmDIMVGT2fYXoFhjFm8xGNHr+Gz1+s0RgwLfZI3HaLoeQ+REvqLpzWw5GDj1LMGfZYILH5JYtWFkxXkQPvtsfQCu6JudYKDKjFUGIfqR4fNdgC1WKWZw9j3oJKNBfqyMHVf7NRFJuUFyU1CifGDiVGXiOxjtbhSMyP0YcTcyURc6p9mhHnGOVNirGdQiPHSdZAY8YpoooM0VRmVC000Iw0SYSlGvKN5jwrhb13hmpwlIb23iPDUiOuYrfBmU+hhqVa3RRnJlWUGKbVaqWCkWnVCKUmqsCwiKcYfzYHl5fXXMlTbYafKfL0eeLHwFlfBx+ue+9uWxjPp9N5iSEpSkwreFbcgBErRk65CWSbF2KVgslolcxuJFhSFIXc68Boi+00Q/XVjdGqZBW+uzAgMZFRqp0N5JhL2+lwCw75VRnzSqvZTJqP9GbNlRm2F2lzMHdnPCjO7rEEq8FYw+6wN4zhdtq8w6xmO89bcKrV5hlmVhuqQDWG5fEOo8EwlR53A7UYpq/6jI4W43zU5RCwDNXlBl8C1uV4h9FieN5bj0u3CdVmeIrX5XiO1mYYHu8wGowzXxcH2PVU/0/1I+af/PHzwRPATfP8jFf58hi/2x/oO5wfXWMCvwAAAABJRU5ErkJggg=='
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