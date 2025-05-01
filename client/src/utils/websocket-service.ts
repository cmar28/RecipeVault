import { ProcessingStage } from "@/components/recipe-processing-modal";

// Custom events for processing updates
export const RECIPE_PROCESSING_STAGE_EVENT = 'recipe-processing-stage-update';
export const RECIPE_PROCESSING_FALLBACK_EVENT = 'recipe-processing-fallback';

// Store WebSocket connection and client ID
let socket: WebSocket | null = null;
let clientId: string | null = null;
let connectionPromise: Promise<string> | null = null;

/**
 * Generate a unique client ID
 */
function generateClientId(): string {
  return 'client_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Connect to the WebSocket server
 * Returns a promise that resolves with the client ID once connected
 */
export function connectToWebSocket(): Promise<string> {
  // If we're already connecting, return the existing promise
  if (connectionPromise) {
    return connectionPromise;
  }
  
  // If we already have a connection, return the client ID
  if (socket && socket.readyState === WebSocket.OPEN && clientId) {
    return Promise.resolve(clientId);
  }
  
  // Create a new connection
  connectionPromise = new Promise((resolve, reject) => {
    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket server at:', wsUrl);
      socket = new WebSocket(wsUrl);
      
      // Generate a client ID to use for this connection
      const newClientId = generateClientId();
      
      // Handle connection open
      socket.addEventListener('open', () => {
        console.log('WebSocket connection established');
        
        // Store and resolve with the client ID
        clientId = newClientId;
        resolve(clientId);
        
        // Clear the promise so we can reconnect if needed
        connectionPromise = null;
      });
      
      // Handle messages from the server
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'processing_update') {
            // Create a ProcessingStage object
            const stage: ProcessingStage = {
              id: data.stage as 'uploading' | 'verifying' | 'extracting' | 'saving',
              label: getStageLabel(data.stage),
              status: data.status as 'pending' | 'processing' | 'success' | 'error',
              message: data.message
            };
            
            // Dispatch the stage update event
            window.dispatchEvent(
              new CustomEvent(RECIPE_PROCESSING_STAGE_EVENT, { detail: stage })
            );
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      
      // Handle connection errors
      socket.addEventListener('error', (error) => {
        console.error('WebSocket connection error:', error);
        connectionPromise = null;
        reject(new Error('Failed to establish WebSocket connection'));
      });
      
      // Handle connection close
      socket.addEventListener('close', () => {
        console.log('WebSocket connection closed');
        socket = null;
        connectionPromise = null;
      });
      
    } catch (error) {
      console.error('Failed to set up WebSocket connection:', error);
      connectionPromise = null;
      reject(error);
    }
  });
  
  return connectionPromise;
}

/**
 * Get the client ID, connecting to WebSocket if necessary
 */
export async function getClientId(): Promise<string> {
  try {
    return await connectToWebSocket();
  } catch (error) {
    console.warn('Could not establish WebSocket connection for real-time updates');
    
    // Return a fallback client ID that won't match any actual connection
    // This lets us track that we tried to get a connection but it failed
    return `fallback_${generateClientId()}`;
  }
}

/**
 * Helper function to get a human-readable label for a processing stage
 */
function getStageLabel(stage: string): string {
  switch (stage) {
    case 'uploading': return 'Uploading image';
    case 'verifying': return 'Verifying recipe image';
    case 'extracting': return 'Extracting recipe details';
    case 'saving': return 'Saving recipe';
    default: return stage.charAt(0).toUpperCase() + stage.slice(1);
  }
}