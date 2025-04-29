import { spawn } from 'child_process';
import { log } from './vite.js';

/**
 * Starts the AI service in the background
 * @returns A cleanup function to stop the service
 */
export function startAIService() {
  log('Starting AI service...', 'services');
  
  // Start the AI service process
  const aiProcess = spawn('python', ['run.py'], {
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
      log(`AI service error: ${data}`, 'services');
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