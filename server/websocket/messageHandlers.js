// WebSocket message handlers
import { store } from '../services/Store.service.js';

export async function handleJoinGame(ws, message, gameService) {
  const { username } = message.payload;
  
  if (!username || username.trim() === '') {
    send(ws, 'ERROR', { message: 'Username is required' });
    return;
  }

  ws.username = username;
  store.addConnection(username, ws);

  const existingGame = store.getGameByPlayer(username);
  if (existingGame && existingGame.status === 'active') {
    gameService.broadcastGameUpdate(existingGame);
    send(ws, 'GAME_FOUND', { 
      gameId: existingGame.id,
      message: 'Reconnecting to existing game',
      gameState: existingGame.getState()
    });
    return;
  }

  send(ws, 'WAITING_FOR_OPPONENT', { 
    message: 'Waiting for an opponent...',
    timeout: 10000 
  });
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

  const result = gameService.processMove(game.id, ws.username, column);
  
  if (!result.success) {
    send(ws, 'ERROR', { message: result.error });
    return;
  }

}

export async function handleReconnect(ws, message, gameService) {
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

  if (game.player1 && game.player1.username === username) {
    game.player1.ws = ws;
  } else if (game.player2 && game.player2.username === username) {
    game.player2.ws = ws;
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

