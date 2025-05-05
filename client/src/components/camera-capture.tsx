import { useEffect, useRef, useState } from "react";
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

// Using a custom modal for camera to avoid Dialog issues on mobile
const CameraCapture = ({ isOpen, onClose, onCapture }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Force body to not scroll when camera is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Start camera when opened
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
    console.log("Stopping camera stream");
    
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const closeCamera = () => {
    console.log("Closing camera");
    stopCamera();
    setTimeout(() => {
      onClose();
    }, 50);
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas refs not available");
      return;
    }
    
    console.log("Capturing photo...");
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      console.log(`Canvas size set to ${canvas.width}x${canvas.height}`);
      
      // Get 2D context for drawing
      const context = canvas.getContext('2d');
      if (!context) {
        console.error("Could not get canvas context");
        return;
      }
      
      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      console.log("Image drawn to canvas");
      
      // Convert canvas to a blob (image file)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("Failed to create blob from canvas");
            toast({
              title: "Error",
              description: "Failed to process the photo. Please try again.",
              variant: "destructive"
            });
            return;
          }
          
          console.log(`Blob created: ${blob.size} bytes`);
          
          // Create file from blob
          const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
          console.log("File created from blob");
          
          // First hide the container
          if (containerRef.current) {
            containerRef.current.style.visibility = 'hidden';
          }
          
          // Stop camera immediately to free resources
          stopCamera();
          
          // Close the camera UI
          onClose();
          
          // Process the captured image
          console.log("Processing captured image");
          setTimeout(() => onCapture(file), 100);
        },
        'image/jpeg',
        0.9
      );
    } catch (error) {
      console.error("Error capturing photo:", error);
      toast({
        title: "Error",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive"
      });
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  // If not open, don't render anything
  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col w-full h-full"
      style={{ height: '100dvh' }}
    >
      {/* Camera header - Fixed at top */}
      <div className="bg-black text-white p-3 flex justify-between items-center z-20">
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
            onClick={closeCamera} 
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
              <Button 
                onClick={closeCamera} 
                variant="outline"
              >
                Cancel
              </Button>
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
      <div 
        className="bg-black p-4 flex justify-center items-center w-full"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
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
  );
};

export default CameraCapture;