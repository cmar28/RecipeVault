import { spawn, type ChildProcess } from 'child_process';
import { log } from './vite';

/**
 * Starts the AI service in the background
 * @returns A cleanup function to stop the service
 */
export function startAIService(): () => void {
  log('Starting AI service...', 'services');
  
  // Start the AI service process
  const aiProcess: ChildProcess = spawn('python', ['run.py'], {
    cwd: './ai_service',
    stdio: 'pipe',
    detached: false
  });
  
  // Log process output
  if (aiProcess.stdout) {
    aiProcess.stdout.on('data', (data) => {
      log(`AI service: ${data}`, 'services');
    });
  }
  
  if (aiProcess.stderr) {
    aiProcess.stderr.on('data', (data) => {
      const message = data.toString();
      
      // Check for actual error messages
      if (message.includes('ERROR') || message.includes('Exception') || message.includes('Error:')) {
        log(`AI service error: ${message}`, 'services');
      } else {
        // Regular logs from stderr (common in Python)
        log(`AI service: ${message}`, 'services');
      }
    });
  }
  
  // Handle process exit
  aiProcess.on('exit', (code, signal) => {
    if (code !== null) {
      log(`AI service exited with code ${code}`, 'services');
    } else if (signal !== null) {
      log(`AI service was killed with signal ${signal}`, 'services');
    }
  });
  
  // Handle startup errors
  aiProcess.on('error', (err) => {
    log(`Failed to start AI service: ${err}`, 'services');
  });
  
  log('AI service started', 'services');
  
  // Return cleanup function
  return () => {
    if (aiProcess && !aiProcess.killed) {
      log('Stopping AI service...', 'services');
      aiProcess.kill();
    }
  };
}