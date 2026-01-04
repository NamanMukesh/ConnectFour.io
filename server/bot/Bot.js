import { config } from '../config/App.config.js';

export class Bot {
  constructor() {
    this.game = null;
  }

  setGame(game) {
    this.game = game;
  }

  // Make a strategic move
  makeMove() {
    if (!this.game || this.game.status !== 'active' || this.game.currentPlayer !== 2) {
      return null;
    }

    const column = this.chooseBestMove();
    if (column === null) {
      return null;
    }

    const result = this.game.makeMove(column, 2);
    return result;
  }

  // Choose the best move (strategic)
  chooseBestMove() {
    const board = this.game.getBoard();

    // Priority 1: Check if bot can win
    for (let col = 0; col < config.boardCols; col++) {
      if (this.isValidColumn(board, col)) {
        const row = this.getNextRow(board, col);
        if (this.wouldWin(board, row, col, 2)) {
          return col;
        }
      }
    }

    // Priority 2: Block player from winning
    for (let col = 0; col < config.boardCols; col++) {
      if (this.isValidColumn(board, col)) {
        const row = this.getNextRow(board, col);
        if (this.wouldWin(board, row, col, 1)) {
          return col;
        }
      }
    }

    // Priority 3: Create opportunities (try center columns first)
    const centerColumns = [3, 2, 4, 1, 5, 0, 6];
    for (const col of centerColumns) {
      if (this.isValidColumn(board, col)) {
        return col;
      }
    }

    return null;
  }

  // Check if column is valid
  isValidColumn(board, col) {
    return col >= 0 && col < config.boardCols && board[0][col] === 0;
  }

  // Get next available row in column
  getNextRow(board, col) {
    for (let row = config.boardRows - 1; row >= 0; row--) {
      if (board[row][col] === 0) {
        return row;
      }
    }
    return -1;
  }

  // Check if placing a piece would win
  wouldWin(board, row, col, player) {
    if (row === -1) return false;

    // Temporarily place piece
    board[row][col] = player;

    // Check all directions
    const directions = [
      { dr: 0, dc: 1 },   // Horizontal
      { dr: 1, dc: 0 },   // Vertical
      { dr: 1, dc: 1 },   // Diagonal
      { dr: 1, dc: -1 }   // Diagonal
    ];

    for (const dir of directions) {
      const count = this.countInDirection(board, row, col, player, dir.dr, dir.dc);
      if (count >= config.winLength) {
        board[row][col] = 0; // Restore
        return true;
      }
    }

    board[row][col] = 0; // Restore
    return false;
  }

  // Count consecutive pieces in a direction
  countInDirection(board, row, col, player, deltaRow, deltaCol) {
    let count = 1; // Count the current piece

    // Forward
    let r = row + deltaRow;
    let c = col + deltaCol;
    while (
      r >= 0 && r < config.boardRows &&
      c >= 0 && c < config.boardCols &&
      board[r][c] === player
    ) {
      count++;
      r += deltaRow;
      c += deltaCol;
    }

    // Backward
    r = row - deltaRow;
    c = col - deltaCol;
    while (
      r >= 0 && r < config.boardRows &&
      c >= 0 && c < config.boardCols &&
      board[r][c] === player
    ) {
      count++;
      r -= deltaRow;
      c -= deltaCol;
    }

    return count;
  }
}
