// Game Operations
import { Game } from './Game.js';
import { store } from '../services/Store.service.js';

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
      this.handleGameEnd(game, result);
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
  handleGameEnd(game, result) {
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
  }

  getGame(gameId) {
    return store.getGame(gameId);
  }

  getGameByPlayer(username) {
    return store.getGameByPlayer(username);
  }
}

