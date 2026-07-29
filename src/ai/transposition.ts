// Zobrist Hashing Transposition Table
import type { Board, Piece, Side } from '../engine/types';
import { ROWS, COLS } from '../engine/types';

const PIECE_TYPES = ['king','advisor','elephant','horse','rook','cannon','pawn'];
const _SIDES: Side[] = ['red','black'];

// Generate random Zobrist keys
let zobristTable: bigint[][][] = []; // [row][col][piece_index]

function pieceIndex(piece: Piece): number {
  const ti = PIECE_TYPES.indexOf(piece.type);
  const si = piece.side === 'red' ? 0 : 1;
  return ti * 2 + si;
}

function initZobrist() {
  zobristTable = [];
  for (let r = 0; r < ROWS; r++) {
    zobristTable[r] = [];
    for (let c = 0; c < COLS; c++) {
      zobristTable[r][c] = [];
      for (let i = 0; i < 14; i++) {
        zobristTable[r][c][i] = randomBigInt();
      }
    }
  }
  // Side to move key
  zobristTable.push([[randomBigInt()]]); // index: ROWS
}

function randomBigInt(): bigint {
  const a = BigInt(Math.floor(Math.random() * 2**32));
  const b = BigInt(Math.floor(Math.random() * 2**32));
  return (a << 32n) | b;
}

let initialized = false;

export function computeHash(board: Board, currentTurn: Side): bigint {
  if (!initialized) { initZobrist(); initialized = true; }

  let hash = 0n;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p) {
        hash ^= zobristTable[r][c][pieceIndex(p)];
      }
    }
  }
  // XOR side to move
  if (currentTurn === 'red') {
    hash ^= zobristTable[ROWS][0][0];
  }
  return hash;
}

// Simple transposition table
interface TTEntry {
  hash: bigint;
  depth: number;
  score: number;
  flag: 'exact' | 'alpha' | 'beta';
  bestMove?: { from: {row:number,col:number}; to: {row:number,col:number} };
}

const MAX_TT_SIZE = 1 << 20; // ~1M entries
const tt: (TTEntry | null)[] = new Array(MAX_TT_SIZE).fill(null);

function ttIndex(hash: bigint): number {
  return Number(hash % BigInt(MAX_TT_SIZE));
}

export function ttProbe(hash: bigint, depth: number, alpha: number, beta: number): { score: number; bestMove?: TTEntry['bestMove']; hit: boolean } {
  const entry = tt[ttIndex(hash)];
  if (entry && entry.hash === hash && entry.depth >= depth) {
    if (entry.flag === 'exact') return { score: entry.score, bestMove: entry.bestMove, hit: true };
    if (entry.flag === 'alpha' && entry.score <= alpha) return { score: alpha, bestMove: entry.bestMove, hit: true };
    if (entry.flag === 'beta' && entry.score >= beta) return { score: beta, bestMove: entry.bestMove, hit: true };
  }
  return { score: 0, bestMove: entry?.bestMove, hit: false };
}

export function ttStore(hash: bigint, depth: number, score: number, flag: 'exact'|'alpha'|'beta', bestMove?: TTEntry['bestMove']) {
  tt[ttIndex(hash)] = { hash, depth, score, flag, bestMove };
}

export function ttClear() {
  for (let i = 0; i < MAX_TT_SIZE; i++) tt[i] = null;
}
