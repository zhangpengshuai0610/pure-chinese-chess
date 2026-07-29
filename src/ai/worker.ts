import type { Board, Side, Position } from '../engine/types';
import { cloneBoard } from '../engine/board';
import { generateAllLegalMoves } from '../engine/moves';
import { search } from './search';

export type Difficulty = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS' | 'Max';

const CONFIG: Record<Difficulty, { depth: number; noise: number; timeLimit: number }> = {
  D:     { depth: 1,  noise: 0.30, timeLimit: 500  },
  C:     { depth: 2,  noise: 0.20, timeLimit: 1000 },
  B:     { depth: 3,  noise: 0.10, timeLimit: 1500 },
  A:     { depth: 4,  noise: 0.05, timeLimit: 2000 },
  S:     { depth: 5,  noise: 0.02, timeLimit: 2500 },
  SS:    { depth: 6,  noise: 0.00, timeLimit: 3000 },
  SSS:   { depth: 8,  noise: 0.00, timeLimit: 5000 },
  Max:   { depth: 12, noise: 0.00, timeLimit: 10000 },
};

export interface AIRequest {
  type: 'search' | 'hint';
  board: Board;
  side: Side;
  difficulty: Difficulty;
}

export interface AIResponse {
  type: 'search' | 'hint';
  from: Position;
  to: Position;
}

self.onmessage = (e: MessageEvent<AIRequest>) => {
  const { type, board, side, difficulty } = e.data;
  const config = CONFIG[difficulty];
  const boardCopy = cloneBoard(board);

  if (type === 'hint') {
    const result = search(boardCopy, side, 6, 3000);
    if (result) {
      self.postMessage({ type: 'hint', from: result.from, to: result.to } as AIResponse);
    }
    return;
  }

  const result = search(boardCopy, side, config.depth, config.timeLimit);

  if (result) {
    if (config.noise > 0 && Math.random() < config.noise) {
      const allMoves = generateAllLegalMoves(boardCopy, side);
      if (allMoves.length > 1) {
        const filtered = allMoves.filter(
          m => !(m.from.row === result.from.row && m.from.col === result.from.col &&
                  m.to.row === result.to.row && m.to.col === result.to.col)
        );
        if (filtered.length > 0) {
          const rm = filtered[Math.floor(Math.random() * filtered.length)];
          self.postMessage({ type: 'search', from: rm.from, to: rm.to } as AIResponse);
          return;
        }
      }
    }
    self.postMessage({ type: 'search', from: result.from, to: result.to } as AIResponse);
  }
};
