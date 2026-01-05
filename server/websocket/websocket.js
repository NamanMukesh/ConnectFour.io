// WebSocket server setup
import { WebSocketServer } from 'ws';
import { WebSocketHandler } from './WebSocketHandler.js';

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  // Initialize WebSocket handler
  new WebSocketHandler(wss);

  wss.on('error', (error) => {
    console.error('WebSocket Server Error:', error);
  });

  wss.on('listening', () => {
    console.log('WebSocket server ready');
    console.log('Waiting for connections...');
  });

  return wss;
}


