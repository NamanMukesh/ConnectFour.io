// Game Operations
import { Game } from './Game.js';
import { store } from '../services/Store.service.js';
import { GameModel } from '../models/Game.model.js';
import { LeaderboardModel } from '../models/Leaderboard.model.js';

export class GameService {
  constructor(wsHandler) {
    this.wsHandler = wsHandler;
  }

  // Create a new game
  createGame(player1, player2 = null, isBotGame = false) {
    const game = new Game(player1, player2, isBotGame);
    store.addGame(game);
    return game;
  }

  // Process a move
  processMove(gameId, username, column) {
    const game = store.getGame(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    // Determine player number
    let playerNumber;
    if (game.player1 && game.player1.username === username) {
      playerNumber = 1;
    } else if (game.player2 && game.player2.username === username) {
      playerNumber = 2;
    } else {
      return { success: false, error: 'Player not in this game' };
    }

    // Make the move
    const result = game.makeMove(column, playerNumber);

    if (!result.success) {
      return result;
    }

    this.broadcastGameUpdate(game);

    if (result.win || result.draw) {
      // Handle game end asynchronously (don't block the response)
      this.handleGameEnd(game, result).catch(err => {
        console.error('Error in handleGameEnd:', err);
      });
    }

    return result;
  }

  broadcastGameUpdate(game) {
    const state = game.getState();
    
    if (game.player1 && game.player1.ws && game.player1.ws.readyState === 1) {
      this.wsHandler.send(game.player1.ws, 'GAME_UPDATE', {
        ...state,
        yourPlayer: 1
      });
    }

    if (game.player2 && game.player2.ws && game.player2.ws.readyState === 1) {
      this.wsHandler.send(game.player2.ws, 'GAME_UPDATE', {
        ...state,
        yourPlayer: 2
      });
    }
  }

  // Game end
  async handleGameEnd(game, result) {
    const state = game.getState();

    // Send game over message
    if (game.player1 && game.player1.ws) {
      this.wsHandler.send(game.player1.ws, 'GAME_OVER', {
        ...state,
        result: result.win ? (result.winner === 'player1' ? 'win' : 'loss') : 'draw',
        winCells: result.winCells || []
      });
    }

    if (game.player2 && game.player2.ws) {
      this.wsHandler.send(game.player2.ws, 'GAME_OVER', {
        ...state,
        result: result.win ? (result.winner === 'player2' ? 'win' : 'loss') : 'draw',
        winCells: result.winCells || []
      });
    }

    // Save to database
    try {
      await GameModel.saveGame(game);
      
      // Update leaderboard
      if (result.win) {
        const winner = result.winner === 'player1' ? game.player1?.username : game.player2?.username;
        const loser = result.winner === 'player1' ? game.player2?.username : game.player1?.username;
        await LeaderboardModel.updateLeaderboard(winner, loser, false);
      } else if (result.draw) {
        await LeaderboardModel.updateLeaderboard(
          game.player1?.username,
          game.player2?.username,
          true
        );
      }
    } catch (error) {
      console.error('Error saving game to database:', error);
      // Don't throw - game already ended, just log the error
    }
  }

  getGame(gameId) {
    return store.getGame(gameId);
  }

  getGameByPlayer(username) {
    return store.getGameByPlayer(username);
  }
}

