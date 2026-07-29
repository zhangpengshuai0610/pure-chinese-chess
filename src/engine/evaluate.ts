import { Board, Side, ROWS, COLS, PieceType, oppositeSide } from './types';
import { getPiece } from './board';

// Piece-square tables for positional evaluation
// Values from standard Chinese Chess evaluation references

const KING_PST: number[][] = [
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,1],
  [1,2,3,4,4,4,3,2,1],
  [1,3,4,5,5,5,4,3,1],
  [1,1,4,5,5,5,4,1,1],
  [0,3,5,10,10,10,5,3,0],
  [0,1,5,10,10,10,5,1,0],
];

const HORSE_PST: number[][] = [
  [0,0,0,2,2,2,2,0,0],
  [0,2,6,2,4,6,2,6,0],
  [2,2,4,6,10,12,6,4,2],
  [2,4,6,8,8,6,8,6,4],
  [2,4,6,8,8,8,6,8,4],
  [2,4,8,8,10,6,4,10,4],
  [2,8,4,6,10,8,6,4,2],
  [2,6,4,8,8,6,4,10,2],
  [0,2,2,6,6,4,2,2,0],
  [0,0,2,4,4,2,2,0,0],
];

const CANNON_PST: number[][] = [
  [2,2,4,2,0,2,2,4,2],
  [2,2,2,2,0,2,2,4,2],
  [0,2,2,0,4,0,2,2,0],
  [0,0,2,0,4,0,2,0,0],
  [0,0,2,6,6,6,2,0,0],
  [0,2,2,6,8,6,4,0,0],
  [4,2,6,6,6,6,4,2,4],
  [2,6,6,6,4,6,4,2,2],
  [2,6,6,6,6,4,6,2,2],
  [2,2,4,4,4,4,2,2,2],
];

const ROOK_PST: number[][] = [
  [6,8,6,10,12,10,6,10,6],
  [8,8,8,12,14,12,10,12,8],
  [8,10,8,10,12,10,8,10,8],
  [8,10,12,12,14,12,10,12,10],
  [8,12,12,14,16,14,12,12,8],
  [10,14,12,14,14,12,14,12,10],
  [8,10,10,14,16,14,10,10,8],
  [6,10,8,12,12,12,8,10,6],
  [8,8,10,10,12,12,8,8,6],
  [6,8,8,10,12,10,8,8,6],
];

// Base material values (in centipawns)
const PIECE_VALUES: Record<PieceType, number> = {
  king: 10000,
  rook: 900,
  cannon: 480,
  horse: 420,
  elephant: 220,
  advisor: 220,
  pawn: 100,
};

// Cross-river pawn bonus
const PAWN_CROSSED_BONUS = 80;

function getPSTValue(table: number[][], row: number, col: number, side: Side): number {
  const r = side === 'red' ? row : (ROWS - 1 - row);
  return table[r][col];
}

// Evaluate board from red's perspective (positive = good for red)
export function evaluate(board: Board): number {
  let score = 0;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const piece = getPiece(board, r, c);
      if (!piece) continue;

      const sign = piece.side === 'red' ? 1 : -1;
      const value = PIECE_VALUES[piece.type];
      score += sign * value;

      // Positional bonus
      let pst = 0;
      const side = piece.side;
      switch (piece.type) {
        case 'king':
          pst = KING_PST[side === 'red' ? r : (ROWS - 1 - r)][c];
          break;
        case 'horse':
          pst = getPSTValue(HORSE_PST, r, c, side);
          break;
        case 'cannon':
          pst = getPSTValue(CANNON_PST, r, c, side);
          break;
        case 'rook':
          pst = getPSTValue(ROOK_PST, r, c, side);
          break;
        case 'pawn': {
          const crossed = side === 'red' ? r <= 4 : r >= 5;
          if (crossed) pst = PAWN_CROSSED_BONUS;
          // Pawn before crossing: positional value
          if (c === 0 || c === 2 || c === 4 || c === 6 || c === 8) {
            pst += 10 * (side === 'red' ? (9 - r) : r) / 2;
          }
          break;
        }
        case 'advisor':
        case 'elephant': {
          // Central position bonus for defensive pieces
          const centerDist = Math.abs(c - 4);
          pst = (1 - centerDist / 4) * 30;
          break;
        }
      }
      score += sign * pst;
    }
  }

  return score;
}
