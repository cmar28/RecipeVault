import { Recipe } from "@shared/schema";
import { apiRequest } from "../lib/queryClient";
import { toast } from "@/hooks/use-toast";

// Export recipes to a JSON file
export async function exportRecipes() {
  try {
    // Fetch the export data from the server
    const response = await fetch('/api/recipes/export', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get the export data
    const data = await response.json();

    // Create a Blob from the data
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-recipes.json';
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: `Successfully exported ${data.recipes.length} recipes`,
    });
    
    return data;
  } catch (error) {
    console.error('Error exporting recipes:', error);
    toast({
      title: "Export failed",
      description: error instanceof Error ? error.message : "Failed to export recipes",
      variant: "destructive",
    });
    throw error;
  }
}

// Import recipes from a JSON file
export async function importRecipesFromFile(file: File): Promise<Recipe[]> {
  try {
    // Read the file content
    const fileContent = await readFileAsText(file);
    
    // Parse the JSON data
    let importData;
    try {
      importData = JSON.parse(fileContent);
    } catch (e) {
      throw new Error("Invalid JSON format in the import file");
    }
    
    // Validate the data structure
    if (!importData || !importData.recipes || !Array.isArray(importData.recipes)) {
      throw new Error("Invalid import data format: missing 'recipes' array");
    }
    
    // Send the data to the server
    const response = await fetch('/api/recipes/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(importData)
    });
    
    if (!response.ok) {
      throw new Error(`Import failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Show success message
    toast({
      title: "Import successful",
      description: `Successfully imported ${result.recipes.length} recipes`,
    });
    
    return result.recipes;
  } catch (error) {
    console.error('Error importing recipes:', error);
    toast({
      title: "Import failed",
      description: error instanceof Error ? error.message : "Failed to import recipes",
      variant: "destructive",
    });
    throw error;
  }
}

// Helper function to read a file as text
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}