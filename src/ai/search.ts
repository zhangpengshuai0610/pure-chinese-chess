import type { Board, Side, Position } from '../engine/types';
import { oppositeSide } from '../engine/types';
import { cloneBoard, applyMove, getPiece } from '../engine/board';
import { generateAllLegalMoves, isInCheck } from '../engine/moves';
import { evaluate } from '../engine/evaluate';
import { computeHash, ttProbe, ttStore, ttClear } from './transposition';

// MVV-LVA ordering
const PIECE_ORDER: Record<string, number> = {
  king: 6, rook: 5, cannon: 4, horse: 3, elephant: 2, advisor: 1, pawn: 0
};

function moveScore(board: Board, from: Position, to: Position): number {
  const piece = getPiece(board, from.row, from.col)!;
  const captured = getPiece(board, to.row, to.col);
  if (captured) {
    return PIECE_ORDER[captured.type] * 100 + (10 - PIECE_ORDER[piece.type]);
  }
  return 0;
}

function orderMoves(
  board: Board,
  moves: { from: Position; to: Position }[],
  bestMove?: { from: Position; to: Position } | null
) {
  return moves.sort((a, b) => {
    // Best move from TT first
    if (bestMove && a.from.row === bestMove.from.row && a.from.col === bestMove.from.col &&
        a.to.row === bestMove.to.row && a.to.col === bestMove.to.col) return -1;
    if (bestMove && b.from.row === bestMove.from.row && b.from.col === bestMove.from.col &&
        b.to.row === bestMove.to.row && b.to.col === bestMove.to.col) return 1;
    return moveScore(board, b.from, b.to) - moveScore(board, a.from, a.to);
  });
}

let nodesSearched = 0;
let startTime = 0;
let maxTime = 3000; // Max search time in ms
let searchAborted = false;

const MAX_DEPTH = 20;

// Quiescence search to avoid horizon effect
function quiesce(board: Board, side: Side, alpha: number, beta: number, depth: number): number {
  nodesSearched++;
  if (Date.now() - startTime > maxTime) { searchAborted = true; return beta; }

  const standPat = evaluate(board) * (side === 'red' ? 1 : -1);
  if (depth >= MAX_DEPTH) return standPat;

  if (standPat >= beta) return beta;
  if (alpha < standPat) alpha = standPat;

  // Only consider capture moves
  const allMoves = generateAllLegalMoves(board, side);
  const captures = allMoves.filter(m => getPiece(board, m.to.row, m.to.col) !== null);
  const ordered = orderMoves(board, captures);

  for (const m of ordered) {
    const captured = board[m.to.row][m.to.col];
    board[m.to.row][m.to.col] = board[m.from.row][m.from.col];
    board[m.from.row][m.from.col] = null;

    const score = -quiesce(board, oppositeSide(side), -beta, -alpha, depth + 1);

    board[m.from.row][m.from.col] = board[m.to.row][m.to.col];
    board[m.to.row][m.to.col] = captured;

    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  return alpha;
}

function alphaBeta(
  board: Board,
  side: Side,
  depth: number,
  alpha: number,
  beta: number,
  hash: bigint,
): number {
  // TT probe
  const ttHit = ttProbe(hash, depth, alpha, beta);
  if (ttHit.hit) return ttHit.score;

  // Leaf node
  if (depth <= 0) {
    const qscore = quiesce(board, side, alpha, beta, 0);
    return qscore;
  }

  nodesSearched++;
  if (Date.now() - startTime > maxTime) { searchAborted = true; return beta; }

  const allMoves = generateAllLegalMoves(board, side);

  // Checkmate / stalemate
  if (allMoves.length === 0) {
    if (isInCheck(board, side)) {
      return -99999 + (MAX_DEPTH - depth); // checkmate, prefer faster mate
    }
    return 0; // stalemate
  }

  const ordered = orderMoves(board, allMoves, ttHit.bestMove);
  let bestScore = -Infinity;
  let bestMove: { from: Position; to: Position } | undefined;
  const origAlpha = alpha;

  for (const m of ordered) {
    const captured = board[m.to.row][m.to.col];
    board[m.to.row][m.to.col] = board[m.from.row][m.from.col];
    board[m.from.row][m.from.col] = null;

    const newHash = computeHash(board, oppositeSide(side));
    const score = -alphaBeta(board, oppositeSide(side), depth - 1, -beta, -alpha, newHash);

    board[m.from.row][m.from.col] = board[m.to.row][m.to.col];
    board[m.to.row][m.to.col] = captured;

    if (searchAborted) return beta;

    if (score > bestScore) {
      bestScore = score;
      bestMove = { from: m.from, to: m.to };
    }
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }

  // TT store
  const flag = bestScore <= origAlpha ? 'alpha' : bestScore >= beta ? 'beta' : 'exact';
  ttStore(hash, depth, bestScore, flag, bestMove);

  return bestScore;
}

// Main search entry point
export function search(
  board: Board,
  side: Side,
  depth: number,
  timeLimit: number = 3000,
): { from: Position; to: Position } | null {
  nodesSearched = 0;
  startTime = Date.now();
  maxTime = timeLimit;
  searchAborted = false;
  ttClear();

  const allMoves = generateAllLegalMoves(board, side);
  if (allMoves.length === 0) return null;

  let bestMove = allMoves[0];
  let bestScore = -Infinity;

  // Iterative deepening
  for (let d = 1; d <= depth; d++) {
    if (Date.now() - startTime > maxTime) break;

    let alpha = -Infinity;
    let beta = Infinity;
    let currentBest: { from: Position; to: Position } | null = null;
    let currentBestScore = -Infinity;

    const ordered = orderMoves(board, allMoves, bestMove ? { from: bestMove.from, to: bestMove.to } : null);

    for (const m of ordered) {
      const captured = board[m.to.row][m.to.col];
      board[m.to.row][m.to.col] = board[m.from.row][m.from.col];
      board[m.from.row][m.from.col] = null;

      const newHash = computeHash(board, oppositeSide(side));
      const score = -alphaBeta(board, oppositeSide(side), d - 1, -beta, -alpha, newHash);

      board[m.from.row][m.from.col] = board[m.to.row][m.to.col];
      board[m.to.row][m.to.col] = captured;

      if (score > currentBestScore) {
        currentBestScore = score;
        currentBest = { from: m.from, to: m.to };
      }
      if (score > alpha) alpha = score;
    }

    if (!searchAborted && currentBest) {
      bestMove = currentBest;
      bestScore = currentBestScore;
    }
  }

  console.log(`[AI] depth=${depth}, nodes=${nodesSearched}, time=${Date.now()-startTime}ms, bestScore=${bestScore}`);
  return { from: bestMove.from, to: bestMove.to };
}

export function searchHint(board: Board, side: Side): { from: Position; to: Position } | null {
  ttClear();
  const allMoves = generateAllLegalMoves(board, side);
  if (allMoves.length === 0) return null;

  let bestMove = allMoves[0];
  let bestEval = -Infinity;

  for (const m of allMoves) {
    const captured = board[m.to.row][m.to.col];
    board[m.to.row][m.to.col] = board[m.from.row][m.from.col];
    board[m.from.row][m.from.col] = null;

    const hash = computeHash(board, oppositeSide(side));

    let score: number;
    // Search one ply deeper for opponent to get a realistic evaluation
    score = -alphaBeta(board, oppositeSide(side), 1, -Infinity, Infinity, hash);

    board[m.from.row][m.from.col] = board[m.to.row][m.to.col];
    board[m.to.row][m.to.col] = captured;

    if (score > bestEval) {
      bestEval = score;
      bestMove = m;
    }
  }

  return { from: bestMove.from, to: bestMove.to };
}

// Opening book
export const openingBook: { moves: string[] }[] = [
  // 中炮对屏风马
  { moves: ['h9-g7','b2-e2','h7-f6','h0-g2','i9-h9','i0-h0','b9-c7','b0-a2','a9-b9','a0-a1'] },
  // 仙人指路
  { moves: ['c6-c5','c3-c4','b9-c7','b0-c2','h7-f6','h0-g2','h9-g7','a0-a1'] },
  // 飞相局
  { moves: ['b9-a7','g0-e2','h7-f6','h0-g2','h9-g7','i0-i1','i9-i8','b0-a2'] },
  // 过宫炮
  { moves: ['b9-c7','b2-c2','h7-f6','h0-g2','h9-g7','i0-h0','a9-a8','b0-a2'] },
  // 起马局
  { moves: ['b9-a7','h0-g2','h7-f6','b0-c2','h9-g7','i0-h0','i9-h9','a0-a1'] },
];

// Pick a random opening sequence
export function getOpeningMoves(): string[] {
  const book = openingBook[Math.floor(Math.random() * openingBook.length)];
  return book.moves;
}

// Convert algebraic notation like "h9-g7" to positions
// Note: h9 = col 7 row 0 (black side), using col letters a-i (left to right)
const COL_MAP: Record<string, number> = { a:0, b:1, c:2, d:3, e:4, f:5, g:6, h:7, i:8 };

export function algebraicToPos(alg: string): { from: Position; to: Position } {
  // e.g. "h9-g7"
  const [fromStr, toStr] = alg.split('-');
  const fromCol = COL_MAP[fromStr[0]];
  const fromRow = parseInt(fromStr[1]) - 1; // Convert to 0-indexed
  const toCol = COL_MAP[toStr[0]];
  const toRow = parseInt(toStr[1]) - 1;
  return {
    from: { row: fromRow, col: fromCol },
    to: { row: toRow, col: toCol },
  };
}
