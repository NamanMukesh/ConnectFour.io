import { store } from './Store.service.js';
import { config } from '../config/App.config.js';
import { GameModel } from '../models/Game.model.js';
import { LeaderboardModel } from '../models/Leaderboard.model.js';

export class ReconnectionService {
  constructor(gameService, wsHandler) {
    this.gameService = gameService;
    this.wsHandler = wsHandler;
    this.disconnectedPlayers = new Map(); // username -> { gameId, disconnectedAt, timer }
    this.startCleanupInterval();
  }

  // Handle player disconnection
  handleDisconnect(username, game) {
    if (!game || game.status !== 'active') {
      return;
    }
    if (game.isBotGame && game.player2?.username === 'Bot') {
      return;
    }

    const disconnectedAt = Date.now();
    
    // Set up forfeit timer
    const timer = setTimeout(() => {
      this.forfeitGame(username, game.id);
    }, config.reconnectionTimeout);

    this.disconnectedPlayers.set(username, {
      gameId: game.id,
      disconnectedAt,
      timer
    });

    // Notify opponent
    const opponent = game.player1?.username === username 
      ? game.player2 
      : game.player1;

    if (opponent && opponent.ws) {
      this.wsHandler.send(opponent.ws, 'OPPONENT_DISCONNECTED', {
        message: 'Opponent disconnected. They have 30 seconds to reconnect.',
        timeout: config.reconnectionTimeout
      });
    }
  }

  // Handle player reconnection
  handleReconnect(username, ws) {
    const disconnected = this.disconnectedPlayers.get(username);
    
    if (!disconnected) {
      return false; // Not in disconnected list
    }

    // Clear forfeit timer
    clearTimeout(disconnected.timer);
    this.disconnectedPlayers.delete(username);

    // Update connection in game
    const game = store.getGame(disconnected.gameId);
    if (!game || game.status !== 'active') {
      return false;
    }

    // Update WebSocket connection
    if (game.player1?.username === username) {
      game.player1.ws = ws;
    } else if (game.player2?.username === username) {
      game.player2.ws = ws;
    }

    // Notify opponent
    const opponent = game.player1?.username === username 
      ? game.player2 
      : game.player1;

    if (opponent && opponent.ws) {
      this.wsHandler.send(opponent.ws, 'OPPONENT_RECONNECTED', {
        message: 'Opponent has reconnected.'
      });
    }

    return true;
  }

  // Forfeit game due to timeout
  async forfeitGame(username, gameId) {
    const game = store.getGame(gameId);
    if (!game || game.status !== 'active') {
      return;
    }

    // Determine winner
    const forfeitingPlayer = game.player1?.username === username ? 1 : 2;
    const winner = forfeitingPlayer === 1 ? 2 : 1;
    
    game.forfeit(forfeitingPlayer);
    
    // Save to database
    try {
      await GameModel.saveGame(game);
      
      // Update leaderboard
      const winnerUsername = winner === 1 ? game.player1?.username : game.player2?.username;
      const loserUsername = forfeitingPlayer === 1 ? game.player1?.username : game.player2?.username;
      
      if (winnerUsername && loserUsername) {
        await LeaderboardModel.updateLeaderboard(winnerUsername, loserUsername, false);
      }
    } catch (error) {
      console.error('Error saving forfeited game:', error);
    }

    if (game.player1?.ws) {
      this.wsHandler.send(game.player1.ws, 'GAME_OVER', {
        ...game.getState(),
        result: forfeitingPlayer === 1 ? 'loss' : 'win',
        reason: 'opponent_forfeited'
      });
    }

    if (game.player2?.ws && !game.isBotGame) {
      this.wsHandler.send(game.player2.ws, 'GAME_OVER', {
        ...game.getState(),
        result: forfeitingPlayer === 2 ? 'loss' : 'win',
        reason: 'opponent_forfeited'
      });
    }

    // Clean up
    this.disconnectedPlayers.delete(username);
  }

  // Remove stale disconnected players
  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [username, data] of this.disconnectedPlayers.entries()) {
        // If timeout passed but timer didn't fire, clean up
        if (now - data.disconnectedAt > config.reconnectionTimeout + 1000) {
          this.disconnectedPlayers.delete(username);
        }
      }
    }, 5000); // Check every 5 seconds
  }

  isDisconnected(username) {
    return this.disconnectedPlayers.has(username);
  }
}

