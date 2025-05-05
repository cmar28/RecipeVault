/**
 * Utility service for accessing the device camera and capturing photos
 */

/**
 * Captures a photo using the device camera
 * @returns A promise that resolves to a File object containing the captured image
 */
export async function capturePhotoFromCamera(): Promise<File> {
  return new Promise((resolve, reject) => {
    // Create a container for the camera UI
    const cameraContainer = document.createElement('div');
    cameraContainer.style.position = 'fixed';
    cameraContainer.style.top = '0';
    cameraContainer.style.left = '0';
    cameraContainer.style.width = '100%';
    cameraContainer.style.height = '100%';
    cameraContainer.style.backgroundColor = '#000';
    cameraContainer.style.zIndex = '9999';
    cameraContainer.style.display = 'flex';
    cameraContainer.style.flexDirection = 'column';
    cameraContainer.style.overflow = 'hidden';
    
    // Create a video element for the camera stream
    const video = document.createElement('video');
    video.setAttribute('autoplay', 'true');
    video.setAttribute('playsinline', 'true'); // Required for iOS
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.flex = '1';
    
    // Create a canvas element to capture the frame
    const canvas = document.createElement('canvas');
    let stream: MediaStream | null = null;
    
    // Setup error cleanup
    const cleanupAndReject = (error: Error) => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (document.body.contains(cameraContainer)) {
        document.body.removeChild(cameraContainer);
      }
      reject(error);
    };
    
    // Track current camera mode
    let currentFacingMode = 'environment';
    
    // Create header with title, switch camera and cancel buttons
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '15px';
    header.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    header.style.zIndex = '10001'; // Ensure it's above video
    
    const title = document.createElement('div');
    title.textContent = 'Take Recipe Photo';
    title.style.color = 'white';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '18px';
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '10px';
    
    // Switch camera button
    const switchCameraButton = document.createElement('button');
    switchCameraButton.textContent = '🔄';
    switchCameraButton.setAttribute('aria-label', 'Switch Camera');
    switchCameraButton.style.padding = '8px 12px';
    switchCameraButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    switchCameraButton.style.color = 'white';
    switchCameraButton.style.border = 'none';
    switchCameraButton.style.borderRadius = '5px';
    switchCameraButton.style.cursor = 'pointer';
    switchCameraButton.style.fontSize = '16px';
    switchCameraButton.style.zIndex = '10001'; // Ensure it's above video
    
    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '8px 15px';
    cancelButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '5px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.zIndex = '10001'; // Ensure it's above video
    
    buttonsContainer.appendChild(switchCameraButton);
    buttonsContainer.appendChild(cancelButton);
    
    header.appendChild(title);
    header.appendChild(buttonsContainer);
    
    // Improve tap area for buttons by adding pointer-events
    switchCameraButton.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    cancelButton.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    
    // Function to switch camera
    const switchCamera = () => {
      if (stream) {
        // Stop current stream
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Toggle facing mode
      currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
      
      // Get new stream with the other camera
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })
      .then(mediaStream => {
        stream = mediaStream;
        video.srcObject = mediaStream;
        
        // When video is ready
        video.onloadedmetadata = () => {
          video.play().catch(cleanupAndReject);
        };
      })
      .catch(error => {
        cleanupAndReject(new Error(`Camera access denied: ${error.message}`));
      });
    };
    
    // Attach switch camera event
    switchCameraButton.onclick = switchCamera;
    
    // Create footer with capture button
    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.justifyContent = 'center';
    footer.style.padding = '20px';
    footer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    footer.style.zIndex = '10001'; // Ensure it's above video
    
    const captureButton = document.createElement('button');
    captureButton.style.width = '70px';
    captureButton.style.height = '70px';
    captureButton.style.borderRadius = '50%';
    captureButton.style.backgroundColor = 'white';
    captureButton.style.border = '2px solid #444';
    captureButton.style.cursor = 'pointer';
    captureButton.style.position = 'relative';
    captureButton.style.zIndex = '10002'; // Ensure it's above header and footer
    captureButton.style.touchAction = 'manipulation'; // Improve touch response
    
    // Create inner circle for capture button
    const innerCircle = document.createElement('div');
    innerCircle.style.width = '52px';
    innerCircle.style.height = '52px';
    innerCircle.style.borderRadius = '50%';
    innerCircle.style.backgroundColor = 'white';
    innerCircle.style.border = '2px solid #fff';
    innerCircle.style.position = 'absolute';
    innerCircle.style.top = '2px';
    innerCircle.style.left = '2px';
    
    captureButton.appendChild(innerCircle);
    footer.appendChild(captureButton);
    
    // Improve tap area for capture button
    captureButton.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    
    // Construct UI
    cameraContainer.appendChild(header);
    cameraContainer.appendChild(video);
    cameraContainer.appendChild(footer);
    document.body.appendChild(cameraContainer);
    
    // Handle cancel button click
    cancelButton.onclick = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      document.body.removeChild(cameraContainer);
      reject(new Error('Photo capture cancelled'));
    };
    
    // Handle capture button click
    captureButton.onclick = () => {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      const context = canvas.getContext('2d');
      if (!context) {
        cleanupAndReject(new Error('Failed to get canvas context'));
        return;
      }
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Stop the camera stream
      stream!.getTracks().forEach(track => track.stop());
      
      // Remove camera UI
      document.body.removeChild(cameraContainer);
      
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
      
      // When video is ready
      video.onloadedmetadata = () => {
        video.play().catch(cleanupAndReject);
      };
    })
    .catch(error => {
      cleanupAndReject(new Error(`Camera access denied: ${error.message}`));
    });
  });
}