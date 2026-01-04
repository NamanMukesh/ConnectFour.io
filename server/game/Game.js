// Game logic - Connect Four
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/App.config.js';

export class Game {
  constructor(player1, player2 = null, isBotGame = false) {
    this.id = uuidv4();
    this.player1 = player1 ? { username: player1.username || player1, ws: player1.ws || null } : null;
    this.player2 = player2 ? { username: player2.username || player2, ws: player2.ws || null } : null;
    this.isBotGame = isBotGame;
    
    // 0 = empty, 1 = player1, 2 = player2/bot
    this.board = Array.from({ length: config.boardRows }, () => 
      Array(config.boardCols).fill(0)
    );
    
    this.currentPlayer = 1; // 1 = player1, 2 = player2/bot
    this.status = 'active'; // active, completed, forfeited
    this.winner = null; // null, 'player1', 'player2', 'draw'
    this.moves = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  makeMove(column, playerNumber) {
    if (!this.isValidMove(column, playerNumber)) {
      return { success: false, error: 'Invalid move' };
    }

    const row = this.getNextAvailableRow(column);
    if (row === -1) {
      return { success: false, error: 'Column is full' };
    }

    // Placing the disc
    this.board[row][column] = playerNumber;
    this.moves.push({ row, column, player: playerNumber, timestamp: Date.now() });
    this.updatedAt = new Date();

    // Checking for win
    const winResult = this.checkWin(row, column, playerNumber);
    if (winResult.won) {
      this.status = 'completed';
      this.winner = playerNumber === 1 ? 'player1' : 'player2';
      return { 
        success: true, 
        row, 
        column, 
        win: true, 
        winCells: winResult.cells,
        winner: this.winner 
      };
    }

    // Checking for draw
    if (this.isBoardFull()) {
      this.status = 'completed';
      this.winner = 'draw';
      return { 
        success: true, 
        row, 
        column, 
        draw: true 
      };
    }

    // Switch turn
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

    return { 
      success: true, 
      row, 
      column, 
      nextPlayer: this.currentPlayer 
    };
  }

  isValidMove(column, playerNumber) {
    if (this.status !== 'active') {
      return false;
    }

    if (playerNumber !== this.currentPlayer) {
      return false;
    }

    if (column < 0 || column >= config.boardCols) {
      return false;
    }

    if (this.board[0][column] !== 0) {
      return false;
    }

    return true;
  }

  getNextAvailableRow(column) {
    for (let row = config.boardRows - 1; row >= 0; row--) {
      if (this.board[row][column] === 0) {
        return row;
      }
    }
    return -1; 
  }

  // Win condition
  checkWin(row, column, playerNumber) {
    const directions = [
      { dr: 0, dc: 1 },   // Horizontal
      { dr: 1, dc: 0 },   // Vertical
      { dr: 1, dc: 1 },   // Diagonal 
      { dr: 1, dc: -1 }   // Diagonal 
    ];

    for (const dir of directions) {
      const cells = this.checkDirection(row, column, playerNumber, dir.dr, dir.dc);
      if (cells.length >= config.winLength) {
        return { won: true, cells };
      }
    }

    return { won: false, cells: [] };
  }

  // Checking a specific direction for consecutive pieces
  checkDirection(row, column, playerNumber, deltaRow, deltaCol) {
    const cells = [{ row, column }];
    
    // Forward direction
    let r = row + deltaRow;
    let c = column + deltaCol;
    while (
      r >= 0 && r < config.boardRows &&
      c >= 0 && c < config.boardCols &&
      this.board[r][c] === playerNumber
    ) {
      cells.push({ row: r, column: c });
      r += deltaRow;
      c += deltaCol;
    }

    // Backward direction
    r = row - deltaRow;
    c = column - deltaCol;
    while (
      r >= 0 && r < config.boardRows &&
      c >= 0 && c < config.boardCols &&
      this.board[r][c] === playerNumber
    ) {
      cells.unshift({ row: r, column: c });
      r -= deltaRow;
      c -= deltaCol;
    }

    return cells;
  }

  // Draw condition
  isBoardFull() {
    return this.board[0].every(cell => cell !== 0);
  }

  getState() {
    // Return a deep copy of the board to prevent mutation
    return {
      id: this.id,
      board: this.board.map(row => [...row]), // Deep copy each row
      currentPlayer: this.currentPlayer,
      status: this.status,
      winner: this.winner,
      player1: this.player1?.username || null,
      player2: this.player2?.username || null,
      isBotGame: this.isBotGame,
      movesCount: this.moves.length
    };
  }

  // Get board copy (to prevent mutation)
  getBoard() {
    return this.board.map(row => [...row]);
  }

  // Player disconnected
  forfeit(playerNumber) {
    this.status = 'forfeited';
    this.winner = playerNumber === 1 ? 'player2' : 'player1';
    this.updatedAt = new Date();
  }
}
