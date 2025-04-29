import { Loader2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ProcessingStage = {
  id: 'uploading' | 'verifying' | 'extracting' | 'saving';
  label: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
};

type RecipeProcessingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  stages: ProcessingStage[];
  title?: string;
};

const RecipeProcessingModal = ({
  isOpen,
  onClose,
  stages,
  title = "Processing Recipe"
}: RecipeProcessingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <ul className="space-y-4">
            {stages.map((stage) => (
              <li key={stage.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {stage.status === 'processing' && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                  {stage.status === 'success' && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                  {stage.status === 'error' && (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                  {stage.status === 'pending' && (
                    <div className="h-5 w-5 rounded-full border border-neutral-300"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${
                    stage.status === 'processing' ? 'text-primary' : 
                    stage.status === 'success' ? 'text-green-500' : 
                    stage.status === 'error' ? 'text-red-500' : 'text-neutral-500'
                  }`}>
                    {stage.label}
                  </p>
                  {stage.message && (
                    <p className="text-xs text-muted-foreground mt-1">{stage.message}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeProcessingModal;