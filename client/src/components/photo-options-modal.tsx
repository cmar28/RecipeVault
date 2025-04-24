import { Camera, Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PhotoOptionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: "camera" | "upload") => void;
  isLoading?: boolean;
};

const PhotoOptionsModal = ({
  isOpen,
  onClose,
  onSelectOption,
  isLoading = false,
}: PhotoOptionsModalProps) => {
  const handleSelectCamera = () => {
    onSelectOption("camera");
    onClose();
  };

  const handleSelectUpload = () => {
    onSelectOption("upload");
    onClose();
  };

  // If loading, show a processing message
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Processing Recipe</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-center text-muted-foreground">
              Please wait while we analyze your recipe image...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Add Recipe from Photo</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="flex flex-col items-center">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-32 flex flex-col gap-2"
              onClick={handleSelectCamera}
            >
              <Camera className="h-12 w-12 text-primary" />
              <span>Take Photo</span>
            </Button>
          </div>
          <div className="flex flex-col items-center">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-32 flex flex-col gap-2"
              onClick={handleSelectUpload}
            >
              <Upload className="h-12 w-12 text-primary" />
              <span>Upload Photo</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoOptionsModal;