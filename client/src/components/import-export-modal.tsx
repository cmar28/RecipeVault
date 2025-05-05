import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from '@tanstack/react-query';
import { exportRecipes, importRecipesFromFile } from '@/utils/recipe-export-import';
import { Download, Upload, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ImportExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ImportExportModal({ isOpen, onClose }: ImportExportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("export");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Handle export
  const handleExport = async () => {
    try {
      setIsLoading(true);
      await exportRecipes();
      onClose();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle import file selection
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file change and import
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsLoading(true);
      await importRecipesFromFile(file);
      
      // Invalidate recipes cache to refresh the lists
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      
      // Clear the file input for next use
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onClose();
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import & Export Recipes</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Export all your recipes to a JSON file that you can save as a backup or transfer to another device.
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleExport} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isLoading ? 'Exporting...' : 'Export All Recipes'}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Import recipes from a JSON file. The file should be in the format exported by this app.
              </div>
              
              <div className="flex flex-col items-center">
                <div 
                  className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors w-full mb-4"
                  onClick={handleFileSelect}
                >
                  <File className="h-10 w-10 mx-auto mb-2 text-neutral-500" />
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    Click to select a recipe file
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Supports .json files
                  </p>
                </div>
                
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".json"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                
                <Button 
                  onClick={handleFileSelect}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isLoading ? 'Importing...' : 'Select File to Import'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}