// services/Matchmaking.service.js
import { store } from './Store.service.js';
import { config } from '../config/App.config.js';
import { Bot } from '../bot/Bot.js';

export class MatchmakingService {
  constructor(gameService, wsHandler) {
    this.gameService = gameService;
    this.wsHandler = wsHandler;
    this.matchmakingTimers = new Map(); // username -> timeout
  }

  addPlayer(ws, username) {
    // Update WS if same user reconnects while waiting
    const waitingPlayer = store.waitingPlayer;
    if (waitingPlayer && waitingPlayer.username === username) {
      waitingPlayer.ws = ws;
      store.addConnection(username, ws);

      this.wsHandler.send(ws, 'WAITING_FOR_OPPONENT', {
        message: 'Waiting for an opponent...',
        timeout: config.matchmakingTimeout
      });
      return;
    }

    this.clearTimer(username);

    // PvP MATCH
    if (store.waitingPlayer && store.waitingPlayer.username !== username) {
      const p1 = store.waitingPlayer;
      store.clearWaitingPlayer();
      this.clearTimer(p1.username);

      const game = this.gameService.createGame(
        { username: p1.username, ws: p1.ws },
        { username, ws },
        false
      );

      const gameState = game.getState();

      // Player 1
      this.wsHandler.send(p1.ws, 'GAME_STARTED', {
        gameId: game.id,
        opponent: username,
        isBotGame: false,
        gameState: { ...gameState, yourPlayer: 1 }
      });

      // Player 2
      this.wsHandler.send(ws, 'GAME_STARTED', {
        gameId: game.id,
        opponent: p1.username,
        isBotGame: false,
        gameState: { ...gameState, yourPlayer: 2 }
      });

      // Initial state sync
      this.wsHandler.broadcast(game, 'GAME_UPDATE', gameState);

      return;
    }

    //WAITING QUEUE
    store.setWaitingPlayer(ws, username);

    this.wsHandler.send(ws, 'WAITING_FOR_OPPONENT', {
      message: 'Waiting for an opponent...',
      timeout: config.matchmakingTimeout
    });

    const timer = setTimeout(() => {
      this.startBotGame(username);
    }, config.matchmakingTimeout);

    this.matchmakingTimers.set(username, timer);
  }

  //BOT GAME
  startBotGame(username) {
    const waitingPlayer = store.waitingPlayer;

    if (!waitingPlayer || waitingPlayer.username !== username) {
      return;
    }

    const ws = store.getConnection(username) || waitingPlayer.ws;

    if (!ws || ws.readyState !== 1) {
      store.clearWaitingPlayer();
      this.clearTimer(username);
      return;
    }

    store.clearWaitingPlayer();
    this.clearTimer(username);

    const bot = new Bot();
    const game = this.gameService.createGame(
      { username, ws },
      { username: 'Bot', ws: null },
      true
    );

    game.bot = bot;
    bot.setGame(game);

    const gameState = game.getState();

    this.wsHandler.send(ws, 'GAME_STARTED', {
      gameId: game.id,
      opponent: 'Bot',
      isBotGame: true,
      gameState: { ...gameState, yourPlayer: 1 }
    });

    this.wsHandler.send(ws, 'GAME_UPDATE', {
      ...gameState,
      yourPlayer: 1
    });

    console.log(`Bot game started for ${username} (gameId=${game.id})`);
  }

  clearTimer(username) {
    const timer = this.matchmakingTimers.get(username);
    if (timer) {
      clearTimeout(timer);
      this.matchmakingTimers.delete(username);
    }
  }

  removePlayer(username) {
    if (store.waitingPlayer?.username === username) {
      store.clearWaitingPlayer();
    }
    this.clearTimer(username);
  }
}
