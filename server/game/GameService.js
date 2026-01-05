// Game Operations
import { Game } from './Game.js';
import { store } from '../services/Store.service.js';
import { GameModel } from '../models/Game.model.js';
import { LeaderboardModel } from '../models/Leaderboard.model.js';
import { emitGameEvent } from '../kafka/producer.kafka.js';

export class GameService {
  constructor(wsHandler) {
    this.wsHandler = wsHandler;
  }

  // Create a new game
  createGame(player1, player2 = null, isBotGame = false) {
  const game = new Game(player1, player2, isBotGame);
  store.addGame(game);

  // KAFKA EVENT: GAME_STARTED
  emitGameEvent('GAME_STARTED', {
    gameId: game.id,
    players: [
      player1.username,
      player2?.username || 'Bot'
    ],
    isBotGame,
    startedAt: Date.now()
  }).catch(console.error);

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

    // After a successful move
    emitGameEvent('MOVE_MADE', {
      gameId,
      player: username,
      column,
      moveNumber: game.moveCount,
      currentPlayer: playerNumber,
      timestamp: Date.now()
    }).catch(console.error);

    this.broadcastGameUpdate(game);

    if (result.win || result.draw) {
      this.handleGameEnd(game, result).catch(err => {
        console.error('Error in handleGameEnd:', err);
      });
    }

    return result;
  }

  broadcastGameUpdate(game) {
    const state = game.getState();
    console.log(`Broadcasting GAME_UPDATE for game ${game.id}, status: ${state.status}, currentPlayer: ${state.currentPlayer}`);
    
    let player1Ws = game.player1?.ws;
    if (game.player1 && (!player1Ws || player1Ws.readyState !== 1)) {
      const storedWs = store.getConnection(game.player1.username);
      if (storedWs && storedWs.readyState === 1) {
        player1Ws = storedWs;
        game.player1.ws = storedWs; // Update game's WebSocket reference
      }
    }
    
    if (game.player1 && player1Ws && player1Ws.readyState === 1) {
      const player1State = {
        ...state,
        yourPlayer: 1,
        opponent: game.player2?.username || 'Bot'
      };
      this.wsHandler.send(player1Ws, 'GAME_UPDATE', player1State);
    }

    if (game.player2 && game.player2.ws && game.player2.ws.readyState === 1) {
      const player2State = {
        ...state,
        yourPlayer: 2,
        opponent: game.player1?.username || 'Bot'
      };
      console.log(`   → Sending to player2 (${game.player2.username})`);
      this.wsHandler.send(game.player2.ws, 'GAME_UPDATE', player2State);
    } else if (game.player2 && game.player2.username === 'Bot') {
      // Bot doesn't need WebSocket
    }
  }

  // Game end
  async handleGameEnd(game, result) {
    //KAFKA EVENT: GAME_ENDED
    emitGameEvent('GAME_ENDED', {
      gameId: game.id,
      winner: result.win
        ? (result.winner === 'player1'
            ? game.player1?.username
            : game.player2?.username)
        : 'draw',
      isDraw: result.draw,
      totalMoves: game.moveCount,
      durationMs: Date.now() - game.startedAt,
      endedAt: Date.now()
    }).catch(console.error);

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
    }
  }

  getGame(gameId) {
    return store.getGame(gameId);
  }

  getGameByPlayer(username) {
    return store.getGameByPlayer(username);
  }
}

