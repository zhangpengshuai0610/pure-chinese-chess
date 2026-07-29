import { Board, Piece, Side, Position, ROWS, COLS, oppositeSide } from './types';
import { onBoard, getPiece } from './board';

// Generate all pseudo-legal moves for a piece at (row, col)
// Does NOT check if the move leaves own king in check
export function generatePieceMoves(board: Board, row: number, col: number): Position[] {
  const piece = board[row][col];
  if (!piece) return [];

  switch (piece.type) {
    case 'king':    return generateKingMoves(board, row, col, piece.side);
    case 'advisor': return generateAdvisorMoves(board, row, col, piece.side);
    case 'elephant':return generateElephantMoves(board, row, col, piece.side);
    case 'horse':   return generateHorseMoves(board, row, col, piece.side);
    case 'rook':    return generateRookMoves(board, row, col, piece.side);
    case 'cannon':  return generateCannonMoves(board, row, col, piece.side);
    case 'pawn':    return generatePawnMoves(board, row, col, piece.side);
  }
}

function isEnemy(board: Board, row: number, col: number, side: Side): boolean {
  const p = getPiece(board, row, col);
  return p !== null && p.side !== side;
}

function isEmpty(board: Board, row: number, col: number): boolean {
  return onBoard(row, col) && board[row][col] === null;
}

function canMoveTo(board: Board, row: number, col: number, side: Side): boolean {
  return onBoard(row, col) && (isEmpty(board, row, col) || isEnemy(board, row, col, side));
}

// King: 9-palace, one step orthogonally
function generateKingMoves(board: Board, row: number, col: number, side: Side): Position[] {
  const moves: Position[] = [];
  const rMin = side === 'red' ? 7 : 0;
  const rMax = side === 'red' ? 9 : 2;

  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of dirs) {
    const r = row + dr, c = col + dc;
    if (r >= rMin && r <= rMax && c >= 3 && c <= 5 && canMoveTo(board, r, c, side)) {
      moves.push({ row: r, col: c });
    }
  }

  // Flying general: king captures opposing king if on same column with nothing in between
  const oppSide = oppositeSide(side);
  for (let r = row - 1; r >= 0; r--) {
    const p = getPiece(board, r, col);
    if (p) {
      if (p.type === 'king' && p.side === oppSide) {
        moves.push({ row: r, col });
      }
      break;
    }
  }
  for (let r = row + 1; r < ROWS; r++) {
    const p = getPiece(board, r, col);
    if (p) {
      if (p.type === 'king' && p.side === oppSide) {
        moves.push({ row: r, col });
      }
      break;
    }
  }

  return moves;
}

// Advisor: 9-palace, one step diagonally
function generateAdvisorMoves(board: Board, row: number, col: number, side: Side): Position[] {
  const moves: Position[] = [];
  const rMin = side === 'red' ? 7 : 0;
  const rMax = side === 'red' ? 9 : 2;

  const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
  for (const [dr, dc] of dirs) {
    const r = row + dr, c = col + dc;
    if (r >= rMin && r <= rMax && c >= 3 && c <= 5 && canMoveTo(board, r, c, side)) {
      moves.push({ row: r, col: c });
    }
  }
  return moves;
}

// Elephant: one step diagonally + block check, cannot cross river
function generateElephantMoves(board: Board, row: number, col: number, side: Side): Position[] {
  const moves: Position[] = [];
  const rMin = side === 'red' ? 5 : 0;
  const rMax = side === 'red' ? 9 : 4;

  const dirs: [number, number, number, number][] = [
    [-2,-2,-1,-1], [-2,2,-1,1], [2,-2,1,-1], [2,2,1,1]
  ];
  for (const [dr, dc, br, bc] of dirs) {
    const r = row + dr, c = col + dc;
    const blockR = row + br, blockC = col + bc;
    if (r >= rMin && r <= rMax && onBoard(r, c) &&
        isEmpty(board, blockR, blockC) &&
        canMoveTo(board, r, c, side)) {
      moves.push({ row: r, col: c });
    }
  }
  return moves;
}

// Horse: L-shape with blocking check
function generateHorseMoves(board: Board, row: number, col: number, side: Side): Position[] {
  const moves: Position[] = [];

  const legs: [number, number, number, number, number, number][] = [
    [-2,-1,-1,0,-2,-1], [-2,1,-1,0,-2,1],
    [2,-1,1,0,2,-1],   [2,1,1,0,2,1],
    [-1,-2,0,-1,-1,-2], [1,-2,0,-1,1,-2],
    [-1,2,0,1,-1,2],   [1,2,0,1,1,2],
  ];
  for (const [dr, dc, lr, lc] of legs) {
    const r = row + dr, c = col + dc;
    const legR = row + lr, legC = col + lc;
    if (onBoard(r, c) && isEmpty(board, legR, legC) && canMoveTo(board, r, c, side)) {
      moves.push({ row: r, col: c });
    }
  }
  return moves;
}

// Rook: straight line
function generateRookMoves(board: Board, row: number, col: number, side: Side): Position[] {
  const moves: Position[] = [];
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

  for (const [dr, dc] of dirs) {
    let r = row + dr, c = col + dc;
    while (onBoard(r, c)) {
      if (isEmpty(board, r, c)) {
        moves.push({ row: r, col: c });
      } else {
        if (isEnemy(board, r, c, side)) {
          moves.push({ row: r, col: c });
        }
        break;
      }
      r += dr; c += dc;
    }
  }
  return moves;
}

// Cannon: straight line, must jump exactly one piece to capture
function generateCannonMoves(board: Board, row: number, col: number, side: Side): Position[] {
  const moves: Position[] = [];
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

  for (const [dr, dc] of dirs) {
    let r = row + dr, c = col + dc;
    // Move without capturing (until first piece)
    while (onBoard(r, c) && isEmpty(board, r, c)) {
      moves.push({ row: r, col: c });
      r += dr; c += dc;
    }
    // Jump over exactly one piece to capture
    if (onBoard(r, c)) {
      r += dr; c += dc;
      while (onBoard(r, c) && isEmpty(board, r, c)) {
        r += dr; c += dc;
      }
      if (onBoard(r, c) && isEnemy(board, r, c, side)) {
        moves.push({ row: r, col: c });
      }
    }
  }
  return moves;
}

// Pawn: forward only before crossing river; forward + sideways after
function generatePawnMoves(board: Board, row: number, col: number, side: Side): Position[] {
  const moves: Position[] = [];
  const forward = side === 'red' ? -1 : 1;
  const riverRow = side === 'red' ? 5 : 4;

  // Forward
  const fr = row + forward;
  if (onBoard(fr, col) && canMoveTo(board, fr, col, side)) {
    moves.push({ row: fr, col });
  }

  // After crossing river: sideways
  const crossed = side === 'red' ? row <= riverRow : row >= riverRow;
  if (crossed) {
    for (const dc of [-1, 1]) {
      const c = col + dc;
      if (onBoard(row, c) && canMoveTo(board, row, c, side)) {
        moves.push({ row, col: c });
      }
    }
  }

  return moves;
}

// Find king position for a given side
export function findKing(board: Board, side: Side): Position | null {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.type === 'king' && p.side === side) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

// Check if the given side is in check
export function isInCheck(board: Board, side: Side): boolean {
  const kingPos = findKing(board, side);
  if (!kingPos) return true; // king captured = in check

  const oppSide = oppositeSide(side);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.side === oppSide) {
        const moves = generatePieceMoves(board, r, c);
        if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
          return true;
        }
      }
    }
  }

  // Flying general check
  return kingsAreFacing(board);
}

// Check if the two kings are facing each other on the same column
export function kingsAreFacing(board: Board): boolean {
  let redKingCol = -1, blackKingCol = -1;
  let redKingRow = -1, blackKingRow = -1;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.type === 'king') {
        if (p.side === 'red') { redKingRow = r; redKingCol = c; }
        else { blackKingRow = r; blackKingCol = c; }
      }
    }
  }

  if (redKingCol !== blackKingCol) return false;
  const minRow = Math.min(redKingRow, blackKingRow);
  const maxRow = Math.max(redKingRow, blackKingRow);
  for (let r = minRow + 1; r < maxRow; r++) {
    if (board[r][redKingCol] !== null) return false;
  }
  return true;
}

// Generate all legal moves for a piece (filters out moves that leave own king in check)
export function generateLegalMoves(board: Board, row: number, col: number): Position[] {
  const piece = board[row][col];
  if (!piece) return [];

  const pseudoMoves = generatePieceMoves(board, row, col);
  return pseudoMoves.filter(to => {
    // Simulate the move
    const captured = board[to.row][to.col];
    board[to.row][to.col] = piece;
    board[row][col] = null;

    const inCheck = isInCheck(board, piece.side);

    // Undo
    board[row][col] = piece;
    board[to.row][to.col] = captured;

    return !inCheck;
  });
}

// Generate all legal moves for a side
export function generateAllLegalMoves(board: Board, side: Side): { from: Position; to: Position }[] {
  const moves: { from: Position; to: Position }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.side === side) {
        const legal = generateLegalMoves(board, r, c);
        for (const to of legal) {
          moves.push({ from: { row: r, col: c }, to });
        }
      }
    }
  }
  return moves;
}

// Check game status
export function checkGameStatus(board: Board, currentTurn: Side): 'playing' | string {
  const inCheck = isInCheck(board, currentTurn);
  const hasLegalMove = generateAllLegalMoves(board, currentTurn).length > 0;

  if (!hasLegalMove) {
    if (inCheck) {
      return currentTurn === 'red' ? 'black_win' : 'red_win'; // Checkmate
    }
    return 'draw'; // Stalemate
  }

  if (inCheck) {
    return currentTurn === 'red' ? 'red_check' : 'black_check';
  }

  return 'playing';
}
