/**
 * Utility service for accessing the device camera and capturing photos
 */

/**
 * Captures a photo using the device camera
 * @returns A promise that resolves to a File object containing the captured image
 */
export async function capturePhotoFromCamera(): Promise<File> {
  return new Promise((resolve, reject) => {
    // Create a video element for the camera stream
    const video = document.createElement('video');
    video.setAttribute('autoplay', 'true');
    video.setAttribute('playsinline', 'true'); // Required for iOS
    
    // Create a canvas element to capture the frame
    const canvas = document.createElement('canvas');
    let stream: MediaStream | null = null;
    
    // Setup error cleanup
    const cleanupAndReject = (error: Error) => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      reject(error);
    };
    
    // Get camera stream
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Use back camera if available
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    })
    .then(mediaStream => {
      stream = mediaStream;
      video.srcObject = mediaStream;
      
      // When video can play, setup capture canvas
      video.onloadedmetadata = () => {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Listen for clikc event on video to take the picture
        video.onclick = () => {
          // Draw the current video frame to canvas
          const context = canvas.getContext('2d');
          if (!context) {
            cleanupAndReject(new Error('Failed to get canvas context'));
            return;
          }
          
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Stop the camera stream
          stream!.getTracks().forEach(track => track.stop());
          
          // Convert canvas to blob
          canvas.toBlob(blob => {
            if (!blob) {
              reject(new Error('Failed to capture image'));
              return;
            }
            
            // Create a File object
            const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
            resolve(file);
          }, 'image/jpeg', 0.95); // JPEG at 95% quality
        };
        
        // Append video to body temporarily
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.zIndex = '9999';
        document.body.appendChild(video);
        
        // Add instructions
        const instructions = document.createElement('div');
        instructions.textContent = 'Tap to capture photo';
        instructions.style.position = 'fixed';
        instructions.style.bottom = '20px';
        instructions.style.left = '0';
        instructions.style.width = '100%';
        instructions.style.textAlign = 'center';
        instructions.style.color = 'white';
        instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        instructions.style.padding = '10px';
        instructions.style.zIndex = '10000';
        document.body.appendChild(instructions);
        
        // Add cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.position = 'fixed';
        cancelButton.style.top = '20px';
        cancelButton.style.right = '20px';
        cancelButton.style.padding = '10px 20px';
        cancelButton.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '5px';
        cancelButton.style.zIndex = '10000';
        cancelButton.onclick = () => {
          // Stop the stream
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          
          // Remove elements
          document.body.removeChild(video);
          document.body.removeChild(instructions);
          document.body.removeChild(cancelButton);
          
          reject(new Error('Photo capture cancelled'));
        };
        document.body.appendChild(cancelButton);
      };
      
      video.play().catch(cleanupAndReject);
    })
    .catch(error => {
      cleanupAndReject(new Error(`Camera access denied: ${error.message}`));
    });
  });
}