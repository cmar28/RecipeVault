import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCcw } from "lucide-react";

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

  // Start camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

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

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
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
      
      // Call the capture callback
      onCapture(file);
      
      // Close the camera dialog
      onClose();
    }, 'image/jpeg', 0.95);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Camera header */}
          <div className="bg-black text-white p-3 flex justify-between items-center">
            <h3 className="text-lg font-medium">Take Photo</h3>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={switchCamera} 
                className="h-8 w-8 text-white"
              >
                <RotateCcw size={18} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="h-8 w-8 text-white"
              >
                <X size={18} />
              </Button>
            </div>
          </div>
          
          {/* Camera viewfinder */}
          <div className="relative bg-black flex-1 flex items-center justify-center">
            {error ? (
              <div className="text-white text-center p-6">
                <p className="mb-4">{error}</p>
                <Button onClick={startCamera}>Retry</Button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-h-full max-w-full object-contain"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          {/* Camera footer */}
          <div className="bg-black p-4 flex justify-center">
            <Button
              className="h-16 w-16 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center p-0"
              disabled={!!error || !stream}
              onClick={handleCapture}
            >
              <div className="h-14 w-14 rounded-full border-2 border-gray-400" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;