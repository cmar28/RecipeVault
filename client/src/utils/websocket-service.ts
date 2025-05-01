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
      // Use the full URL from the current window location
      // This ensures we connect to the same server that's serving the application
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      // Construct the WebSocket URL with explicit parts to avoid undefined values
      // Important: We use the direct domain from the current page to avoid localhost references
      const wsUrl = `${protocol}//${hostname}${port ? ':' + port : ''}/ws`;
      
      console.log('Connecting to WebSocket server at:', wsUrl);
      
      // Create new WebSocket and ensure it's not null in this block
      const newSocket = new WebSocket(wsUrl);
      socket = newSocket;
      
      // Generate a client ID to use for this connection
      const newClientId = generateClientId();
      
      // Handle connection open
      newSocket.addEventListener('open', () => {
        console.log('WebSocket connection established');
        
        // Send registration message with client ID
        newSocket.send(JSON.stringify({
          type: 'register',
          clientId: newClientId
        }));
        
        // Store the client ID
        clientId = newClientId;
        
        // We'll resolve the promise after we get confirmation,
        // but also set a timeout in case confirmation doesn't come
        const timeoutId = setTimeout(() => {
          console.log('WebSocket registration confirmation timed out, using client ID anyway');
          resolve(newClientId);
          connectionPromise = null;
        }, 3000);
        
        // Set up a one-time handler for the registration confirmation
        const confirmHandler = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'register_confirm' && data.clientId === newClientId) {
              console.log('WebSocket connected with client ID:', newClientId);
              clearTimeout(timeoutId);
              resolve(newClientId);
              connectionPromise = null;
              
              // Remove the event listener
              newSocket.removeEventListener('message', confirmHandler);
            }
          } catch (error) {
            // Ignore parsing errors for non-JSON messages
          }
        };
        
        newSocket.addEventListener('message', confirmHandler);
      });
      
      // Handle messages from the server
      newSocket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'processing_update' && data.stage) {
            // Sometimes the server sends the stage object directly, other times as separate properties
            const stage: ProcessingStage = data.stage.id ? data.stage : {
              id: data.stage as 'uploading' | 'verifying' | 'extracting' | 'saving',
              label: getStageLabel(data.stage),
              status: data.status as 'pending' | 'processing' | 'success' | 'error',
              message: data.message
            };
            
            console.log('Dispatching processing stage update:', stage);
            
            // Dispatch the stage update event
            window.dispatchEvent(
              new CustomEvent(RECIPE_PROCESSING_STAGE_EVENT, { detail: stage })
            );
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error, event.data);
        }
      });
      
      // Handle connection errors
      newSocket.addEventListener('error', (error) => {
        console.error('WebSocket connection error:', error);
        socket = null;
        connectionPromise = null;
        reject(new Error('Failed to establish WebSocket connection'));
      });
      
      // Handle connection close
      newSocket.addEventListener('close', () => {
        console.log('WebSocket connection closed');
        socket = null;
        connectionPromise = null;
      });
      
    } catch (error) {
      console.error('Failed to set up WebSocket connection:', error);
      socket = null;
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