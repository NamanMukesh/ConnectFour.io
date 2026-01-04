// WebSocket message handlers
import { store } from '../services/Store.service.js';

export async function handleJoinGame(ws, message, gameService, matchmakingService) {
  const { username } = message.payload;
  
  if (!username || username.trim() === '') {
    send(ws, 'ERROR', { message: 'Username is required' });
    return;
  }

  ws.username = username;
  store.addConnection(username, ws);

  // Check for existing active game
  const existingGame = store.getGameByPlayer(username);
  if (existingGame && existingGame.status === 'active') {
    // Update WebSocket reference in game
    if (existingGame.player1 && existingGame.player1.username === username) {
      existingGame.player1.ws = ws;
    } else if (existingGame.player2 && existingGame.player2.username === username) {
      existingGame.player2.ws = ws;
    }
    
    const gameState = existingGame.getState();
    send(ws, 'GAME_FOUND', { 
      gameId: existingGame.id,
      message: 'Reconnecting to existing game',
      gameState: {
        ...gameState,
        yourPlayer: existingGame.player1?.username === username ? 1 : 2,
        opponent: existingGame.player1?.username === username 
          ? (existingGame.player2?.username || 'Bot')
          : (existingGame.player1?.username || 'Bot')
      }
    });
    
    // Broadcast current game state
    gameService.broadcastGameUpdate(existingGame);
    return;
  }

  // If player is already in matchmaking, update their WebSocket connection
  const waitingPlayer = store.waitingPlayer;
  if (waitingPlayer && waitingPlayer.username === username) {
    console.log(`Player ${username} reconnected during matchmaking, updating WebSocket...`);
    // Update the waiting player's WebSocket to the new connection
    waitingPlayer.ws = ws;
  }

  // Start matchmaking
  matchmakingService.addPlayer(ws, username);
}

export async function handleMakeMove(ws, message, gameService) {
  const { gameId, column } = message.payload;
  
  if (!ws.username) {
    send(ws, 'ERROR', { message: 'Not authenticated' });
    return;
  }

  if (column === undefined || column < 0 || column > 6) {
    send(ws, 'ERROR', { message: 'Invalid column. Must be between 0 and 6' });
    return;
  }

  const game = gameId ? gameService.getGame(gameId) : gameService.getGameByPlayer(ws.username);
  
  if (!game) {
    send(ws, 'ERROR', { message: 'Game not found' });
    return;
  }

  console.log(`🎯 Processing move: player=${ws.username}, column=${column}, gameId=${game.id}`);
  const result = gameService.processMove(game.id, ws.username, column);
  
  if (!result.success) {
    console.error(`❌ Move failed: ${result.error}`);
    send(ws, 'ERROR', { message: result.error });
    return;
  }

  console.log(`✅ Move successful: ${result.success}, win=${result.win}, draw=${result.draw}, nextPlayer=${result.nextPlayer || game.currentPlayer}`);

  if (game.isBotGame && game.status === 'active' && game.currentPlayer === 2 && game.bot) {
    setTimeout(async () => {
      const botResult = game.bot.makeMove();
      if (botResult && botResult.success) {
        gameService.broadcastGameUpdate(game);
        if (botResult.win || botResult.draw) {
          await gameService.handleGameEnd(game, botResult);
        }
      }
    }, 500);
  }
}

export async function handleReconnect(ws, message, gameService, reconnectionService) {
  const { username, gameId } = message.payload;
  
  if (!username) {
    send(ws, 'ERROR', { message: 'Username is required' });
    return;
  }

  ws.username = username;
  store.addConnection(username, ws);

  const game = gameId ? gameService.getGame(gameId) : gameService.getGameByPlayer(username);
  
  if (!game) {
    send(ws, 'ERROR', { message: 'Game not found' });
    return;
  }

  // Check if player was disconnected and handle reconnection
  const wasDisconnected = reconnectionService.handleReconnect(username, ws);
  
  if (!wasDisconnected) {
    // Normal reconnection (not from timeout)
    if (game.player1 && game.player1.username === username) {
      game.player1.ws = ws;
    } else if (game.player2 && game.player2.username === username) {
      game.player2.ws = ws;
    }
  }

  gameService.broadcastGameUpdate(game);

  send(ws, 'RECONNECTED', { 
    gameId: game.id,
    message: 'Successfully reconnected to game',
    gameState: game.getState()
  });
}

function send(ws, type, payload) {
  if (ws.readyState === 1) {
    try {
      ws.send(JSON.stringify({ type, payload }));
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  }
}

