// In-memory store for active games and matchmaking
export class Store {
  constructor() {
    this.waitingPlayer = null;
    this.games = new Map(); // gameId -> game object
    this.playerToGame = new Map(); // username -> gameId
    this.connections = new Map(); // username -> WebSocket
  }

  // Matchmaking methods
  setWaitingPlayer(ws, username) {
    this.waitingPlayer = { ws, username, timestamp: Date.now() };
  }

  clearWaitingPlayer() {
    this.waitingPlayer = null;
  }

  // Game management
  addGame(game) {
    this.games.set(game.id, game);
    if (game.player1) {
      this.playerToGame.set(game.player1.username, game.id);
    }
    if (game.player2) {
      this.playerToGame.set(game.player2.username, game.id);
    }
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  getGameByPlayer(username) {
    const gameId = this.playerToGame.get(username);
    return gameId ? this.games.get(gameId) : null;
  }

  removeGame(gameId) {
    const game = this.games.get(gameId);
    if (game) {
      if (game.player1) this.playerToGame.delete(game.player1.username);
      if (game.player2) this.playerToGame.delete(game.player2.username);
      this.games.delete(gameId);
    }
  }

  // Connection management
  addConnection(username, ws) {
    this.connections.set(username, ws);
  }

  getConnection(username) {
    return this.connections.get(username);
  }

  removeConnection(username) {
    this.connections.delete(username);
  }

  // Disconnected players
  cleanupDisconnected() {
    for (const [username, ws] of this.connections.entries()) {
      if (ws.readyState === 3) { // CLOSED
        this.removeConnection(username);
      }
    }
  }
}

export const store = new Store();


