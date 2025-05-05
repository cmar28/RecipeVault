import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCcw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUserToken } from "@/lib/firebase";

type CameraCaptureProps = {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

const CameraCapture = ({ isOpen, onClose, onCapture }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Start camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Verify authentication status when opening camera
      verifyAuthStatus();
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Verify that authentication is active and valid
  const verifyAuthStatus = async () => {
    if (!currentUser) {
      setError("You must be signed in to use the camera");
      return false;
    }

    // Check if we can get a valid token
    try {
      setIsCheckingAuth(true);
      const token = await getCurrentUserToken(true);
      setIsCheckingAuth(false);
      
      if (!token) {
        setError("Authentication error. Please sign out and sign in again.");
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Auth verification error:", err);
      setIsCheckingAuth(false);
      setError("Authentication error. Please try signing out and back in.");
      return false;
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      
      // Check if the browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support camera access");
      }
      
      // Stop any existing stream
      if (stream) {
        stopCamera();
      }
      
      console.log(`Starting camera with facing mode: ${facingMode}`);
      
      // Get camera stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      
      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera start error:", err);
      setError(err instanceof Error ? err.message : "Failed to access camera");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Verify auth status before capture
    const isAuthValid = await verifyAuthStatus();
    if (!isAuthValid) {
      toast({
        title: "Authentication Error",
        description: "Please sign out and sign in again to continue.",
        variant: "destructive"
      });
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob(blob => {
      if (!blob) return;
      
      // Create file from blob
      const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
      
      try {
        // Call the capture callback
        onCapture(file);
        
        // Close the camera dialog
        onClose();
      } catch (error) {
        console.error("Error capturing photo:", error);
        toast({
          title: "Error",
          description: "Failed to process the photo. Please try again.",
          variant: "destructive"
        });
      }
    }, 'image/jpeg', 0.95);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 w-full h-[100dvh] sm:max-w-md sm:h-auto sm:max-h-[80vh] overflow-hidden top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-lg">
        <DialogTitle className="sr-only">Take Photo</DialogTitle>
        <DialogDescription className="sr-only">Use your camera to take a photo of a recipe</DialogDescription>
        <div className="flex flex-col h-full" style={{ maxHeight: '100dvh' }}>
          {/* Camera header - Fixed at top */}
          <div className="bg-black text-white p-3 flex justify-between items-center sticky top-0 z-20">
            <h2 className="text-lg font-medium text-white">Take Photo</h2>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={switchCamera} 
                className="h-12 w-12 text-white" 
              >
                <RotateCcw size={20} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="h-12 w-12 text-white"
              >
                <X size={20} />
              </Button>
            </div>
          </div>
          
          {/* Camera viewfinder */}
          <div className="bg-black flex-1 flex items-center justify-center overflow-hidden">
            {error ? (
              <div className="text-white text-center p-6 flex flex-col items-center max-w-xs mx-auto">
                <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
                <p className="mb-4 text-lg">{error}</p>
                <div className="flex gap-4">
                  <Button onClick={startCamera} variant="secondary">Retry Camera</Button>
                  <Button onClick={onClose} variant="outline">Cancel</Button>
                </div>
              </div>
            ) : isCheckingAuth ? (
              <div className="text-white text-center p-6">
                <p className="mb-4">Verifying authentication...</p>
                <div className="animate-spin h-8 w-8 rounded-full border-4 border-t-transparent border-white mx-auto"></div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          {/* Camera footer - Fixed at bottom of viewport */}
          <div className="bg-black p-4 flex justify-center items-center sticky bottom-0 z-20 w-full"
               style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
            <button
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center border-4 border-gray-800 shadow-lg animate-pulse"
              disabled={!!error || !stream ? true : false}
              onClick={handleCapture}
              aria-label="Take photo"
              style={{ 
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div className="h-14 w-14 rounded-full border-4 border-red-400" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;