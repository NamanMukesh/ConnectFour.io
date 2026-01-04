// WebSocket message handler
import { store } from '../services/Store.service.js';
import { handleJoinGame, handleMakeMove, handleReconnect } from './messageHandlers.js';
import { GameService } from '../game/GameService.js';
import { MatchmakingService } from '../services/Matchmaking.service.js';
import { ReconnectionService } from '../services/Reconnection.service.js';

export class WebSocketHandler {
  constructor(wss) {
    this.wss = wss;
    this.gameService = new GameService(this);
    this.matchmakingService = new MatchmakingService(this.gameService, this);
    this.reconnectionService = new ReconnectionService(this.gameService, this);
    this.setupConnectionHandlers();
  }

  setupConnectionHandlers() {
    this.wss.on('connection', (ws) => {
      console.log('✅ New WebSocket connection established');

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📨 Received:', message.type, message.payload?.username || '');

          switch (message.type) {
            case 'JOIN_GAME':
              console.log(`🎮 Player joining: ${message.payload?.username}`);
              await handleJoinGame(ws, message, this.gameService, this.matchmakingService);
              break;
            case 'MAKE_MOVE':
              await handleMakeMove(ws, message, this.gameService);
              break;
            case 'RECONNECT':
              await handleReconnect(ws, message, this.gameService, this.reconnectionService);
              break;
            case 'PING':
              this.send(ws, 'PONG', { timestamp: Date.now() });
              break;
            default:
              console.warn('Unknown message type:', message.type);
              this.send(ws, 'ERROR', { message: 'Unknown message type' });
          }
        } catch (error) {
          console.error('Error processing message:', error);
          this.send(ws, 'ERROR', { message: 'Invalid message format' });
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  handleDisconnect(ws) {
    if (ws.username) {
      const connection = store.getConnection(ws.username);
      if (connection === ws) {
        // Get player's active game
        const game = store.getGameByPlayer(ws.username);
        if (game && game.status === 'active') {
          // Handle disconnection with reconnection service
          this.reconnectionService.handleDisconnect(ws.username, game);
        } else {
          // If no active game, check if player is in matchmaking
          // Don't remove from matchmaking - let the timer complete
          // Only remove connection if player already has a game or is not waiting
          if (!store.waitingPlayer || store.waitingPlayer.username !== ws.username) {
            store.removeConnection(ws.username);
          }
        }
      }
    }
  }

  send(ws, type, payload) {
    if (ws.readyState === 1) {
      try {
        ws.send(JSON.stringify({ type, payload }));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  broadcast(game, type, payload, excludeWs = null) {
    const message = JSON.stringify({ type, payload });
    
    if (game.player1 && game.player1.ws !== excludeWs) {
      this.send(game.player1.ws, type, payload);
    }
    if (game.player2 && game.player2.ws !== excludeWs) {
      this.send(game.player2.ws, type, payload);
    }
  }
}

