// WebSocket server setup
import { WebSocketServer } from 'ws';
import { WebSocketHandler } from './WebSocketHandler.js';

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  console.log('WebSocket server ready');

  // Initializing
  new WebSocketHandler(wss);

  return wss;
}


