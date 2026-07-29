// Chinese Chess engine types

export type Side = 'red' | 'black';
export type PieceType = 'king' | 'advisor' | 'elephant' | 'horse' | 'rook' | 'cannon' | 'pawn';

export interface Piece {
  type: PieceType;
  side: Side;
}

export type Board = (Piece | null)[][]; // 10 rows × 9 cols

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured: Piece | null;
}

export type GameStatus = 'playing' | 'red_check' | 'black_check' | 'red_win' | 'black_win' | 'draw';

export const ROWS = 10;
export const COLS = 9;

export const PIECE_CHARS: Record<PieceType, Record<Side, string>> = {
  king:    { red: '帅', black: '将' },
  advisor: { red: '仕', black: '士' },
  elephant:{ red: '相', black: '象' },
  horse:   { red: '馬', black: '馬' },
  rook:    { red: '車', black: '車' },
  cannon:  { red: '炮', black: '砲' },
  pawn:    { red: '兵', black: '卒' },
};

export function oppositeSide(side: Side): Side {
  return side === 'red' ? 'black' : 'red';
}

export function posEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}
