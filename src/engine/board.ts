import { Board, Piece, Side, ROWS, COLS } from './types';

// Initialize a standard Chinese Chess starting board
export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  );

  const set = (row: number, col: number, side: Side, type: Piece['type']) => {
    board[row][col] = { side, type };
  };

  // Black pieces (top, rows 0-4)
  set(0, 0, 'black', 'rook');
  set(0, 1, 'black', 'horse');
  set(0, 2, 'black', 'elephant');
  set(0, 3, 'black', 'advisor');
  set(0, 4, 'black', 'king');
  set(0, 5, 'black', 'advisor');
  set(0, 6, 'black', 'elephant');
  set(0, 7, 'black', 'horse');
  set(0, 8, 'black', 'rook');
  set(2, 1, 'black', 'cannon');
  set(2, 7, 'black', 'cannon');
  set(3, 0, 'black', 'pawn');
  set(3, 2, 'black', 'pawn');
  set(3, 4, 'black', 'pawn');
  set(3, 6, 'black', 'pawn');
  set(3, 8, 'black', 'pawn');

  // Red pieces (bottom, rows 5-9)
  set(9, 0, 'red', 'rook');
  set(9, 1, 'red', 'horse');
  set(9, 2, 'red', 'elephant');
  set(9, 3, 'red', 'advisor');
  set(9, 4, 'red', 'king');
  set(9, 5, 'red', 'advisor');
  set(9, 6, 'red', 'elephant');
  set(9, 7, 'red', 'horse');
  set(9, 8, 'red', 'rook');
  set(7, 1, 'red', 'cannon');
  set(7, 7, 'red', 'cannon');
  set(6, 0, 'red', 'pawn');
  set(6, 2, 'red', 'pawn');
  set(6, 4, 'red', 'pawn');
  set(6, 6, 'red', 'pawn');
  set(6, 8, 'red', 'pawn');

  return board;
}

// Check if a position is on the board
export function onBoard(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

// Get piece at position (null if empty or out of bounds)
export function getPiece(board: Board, row: number, col: number): Piece | null {
  if (!onBoard(row, col)) return null;
  return board[row][col];
}

// Apply a move on the board (mutates), returns captured piece
export function applyMove(board: Board, fromRow: number, fromCol: number, toRow: number, toCol: number): Piece | null {
  const captured = board[toRow][toCol];
  board[toRow][toCol] = board[fromRow][fromCol];
  board[fromRow][fromCol] = null;
  return captured;
}

// Deep clone a board
export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}
