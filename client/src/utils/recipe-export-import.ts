import { Recipe } from "@shared/schema";
import { apiRequest } from "../lib/queryClient";
import { toast } from "@/hooks/use-toast";

// Export recipes to a JSON file
export async function exportRecipes() {
  try {
    console.log('Starting recipe export');
    // Fetch the export data from the server
    const response = await fetch('/api/export-recipes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Export failed with status:', response.status);
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get the export data as text first
    const rawText = await response.text();
    
    // Try to parse the text as JSON
    let data;
    try {
      data = JSON.parse(rawText);
      console.log('Successfully parsed export data:', data);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      console.log('Raw response:', rawText);
      throw new Error('Failed to parse server response as JSON');
    }

    // Create a Blob directly from the raw text
    const blob = new Blob([rawText], { type: 'application/json' });
    
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
    console.log('Starting recipe import');
    const response = await fetch('/api/import-recipes', {
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