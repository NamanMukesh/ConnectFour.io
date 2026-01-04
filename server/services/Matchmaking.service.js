// Matchmaking
import { store } from './Store.service.js';
import { config } from '../config/App.config.js';
import { GameService } from '../game/GameService.js';
import { Bot } from '../bot/Bot.js';

export class MatchmakingService {
  constructor(gameService, wsHandler) {
    this.gameService = gameService;
    this.wsHandler = wsHandler;
    this.matchmakingTimers = new Map(); // username -> timeout
  }

  addPlayer(ws, username) {
    this.clearTimer(username);

    if (store.waitingPlayer && store.waitingPlayer.username !== username) {
      const player1 = store.waitingPlayer;
      store.clearWaitingPlayer();
      this.clearTimer(player1.username);

      // Create PvP
      const game = this.gameService.createGame(
        { username: player1.username, ws: player1.ws },
        { username, ws },
        false
      );

      // GAME STARTED
      this.wsHandler.send(player1.ws, 'GAME_STARTED', {
        gameId: game.id,
        player: 1,
        opponent: username,
        isBotGame: false,
        gameState: game.getState()
      });

      this.wsHandler.send(ws, 'GAME_STARTED', {
        gameId: game.id,
        player: 2,
        opponent: player1.username,
        isBotGame: false,
        gameState: game.getState()
      });

      return { matched: true, game };
    }

    // No waiting player, add to queue
    store.setWaitingPlayer(ws, username);

    // Set timeout for bot match
    const timer = setTimeout(() => {
      this.startBotGame(ws, username);
    }, config.matchmakingTimeout);

    this.matchmakingTimers.set(username, timer);

    // WAITING FOR OPPONENT
    this.wsHandler.send(ws, 'WAITING_FOR_OPPONENT', {
      message: 'Waiting for an opponent...',
      timeout: config.matchmakingTimeout
    });

    return { matched: false };
  }

  // Start game with bot
  startBotGame(ws, username) {
    // Check if player is still waiting
    if (store.waitingPlayer && store.waitingPlayer.username === username) {
      store.clearWaitingPlayer();
      this.clearTimer(username);

      // Create bot game
      const bot = new Bot();
      const game = this.gameService.createGame(
        { username, ws },
        { username: 'Bot', ws: null },
        true
      );

      // Storing bot instance in game
      game.bot = bot;
      game.bot.setGame(game);

      this.wsHandler.send(ws, 'GAME_STARTED', {
        gameId: game.id,
        player: 1,
        opponent: 'Bot',
        isBotGame: true,
        gameState: game.getState()
      });

      return game;
    }
    return null;
  }

  removePlayer(username) {
    if (store.waitingPlayer && store.waitingPlayer.username === username) {
      store.clearWaitingPlayer();
    }
    this.clearTimer(username);
  }

  // Clear matchmaking timer
  clearTimer(username) {
    const timer = this.matchmakingTimers.get(username);
    if (timer) {
      clearTimeout(timer);
      this.matchmakingTimers.delete(username);
    }
  }
}
