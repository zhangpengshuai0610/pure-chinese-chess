import { create } from 'zustand';
import type { Board, Side, Move, Position, GameStatus } from '../engine/types';
import { oppositeSide } from '../engine/types';
import { createInitialBoard, cloneBoard, applyMove, getPiece } from '../engine/board';
import { generateLegalMoves, checkGameStatus } from '../engine/moves';
import type { Difficulty, AIRequest, AIResponse } from '../ai/worker';

// ====== 音效引擎 (Web Audio API) ======
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// 下子音效 — 清脆木质敲击声
function playMoveSound() {
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(800, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.12);
  } catch {}
}

// 吃子音效 — 重击 + 破空声
function playCaptureSound() {
  try {
    const ctx = getAudioCtx();
    // 低频重击
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.connect(g1); g1.connect(ctx.destination);
    o1.type = 'triangle';
    o1.frequency.setValueAtTime(200, ctx.currentTime);
    o1.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.25);
    g1.gain.setValueAtTime(0.4, ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    o1.start(ctx.currentTime);
    o1.stop(ctx.currentTime + 0.3);
    // 高频碎裂
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const g2 = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    noise.connect(filter); filter.connect(g2); g2.connect(ctx.destination);
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, ctx.currentTime);
    g2.gain.setValueAtTime(0.15, ctx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.1);
  } catch {}
}

// 将军音效 — 警报双音 + 低频嗡鸣
function playCheckSound() {
  try {
    const ctx = getAudioCtx();
    // 双频警报
    [800, 1000].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'square';
      o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.15);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + i * 0.12 + 0.15);
    });
    // 低频嗡鸣
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.connect(g2); g2.connect(ctx.destination);
    o2.type = 'sawtooth';
    o2.frequency.setValueAtTime(55, ctx.currentTime);
    g2.gain.setValueAtTime(0.1, ctx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o2.start(ctx.currentTime);
    o2.stop(ctx.currentTime + 0.4);
  } catch {}
}

// 胜利音效 — 上行琶音 + 钟声
function playWinSound() {
  try {
    const ctx = getAudioCtx();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      o.start(ctx.currentTime + i * 0.15);
      o.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch {}
}

// 和棋音效
function playDrawSound() {
  try {
    const ctx = getAudioCtx();
    [440, 550].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);
      g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.3);
      o.start(ctx.currentTime + i * 0.2);
      o.stop(ctx.currentTime + i * 0.2 + 0.3);
    });
  } catch {}
}

// 提示音效
function playHintSound() {
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(1200, ctx.currentTime);
    o.frequency.setValueAtTime(1600, ctx.currentTime + 0.06);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.2);
  } catch {}
}

// 导出音效函数供 Board 使用
export const sounds = {
  move: playMoveSound,
  capture: playCaptureSound,
  check: playCheckSound,
  win: playWinSound,
  draw: playDrawSound,
  hint: playHintSound,
};

// ====== Store ======

interface GameStore {
  board: Board;
  currentTurn: Side;
  playerSide: Side;
  gameStatus: GameStatus;
  difficulty: Difficulty;

  selectedRow: number | null;
  selectedCol: number | null;
  legalMoves: Position[];

  moveHistory: Move[];
  hintMove: { from: Position; to: Position } | null;
  lastMoveFrom: Position | null;
  lastMoveTo: Position | null;

  // 内部锁 — 防止多 Worker 同时走子
  _aiBusy: boolean;
  _gameId: number; // 递增 ID，忽略过期 Worker 消息

  initGame: () => void;
  selectCell: (row: number, col: number) => void;
  makeMove: (fromRow: number, fromCol: number, toRow: number, toCol: number) => boolean;
  undoMove: () => void;
  requestHint: () => void;
  clearHint: () => void;
  setDifficulty: (d: Difficulty) => void;
  setPlayerSide: (s: Side) => void;
  newGame: () => void;
  requestAIMove: () => void;
}

// 全局单例 Worker
let _worker: Worker | null = null;
// 上次 init 时间戳 — 防 StrictMode 双重 init
let _lastInitTime = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  board: createInitialBoard(),
  currentTurn: 'red',
  playerSide: 'red',
  gameStatus: 'playing',
  difficulty: 'B',
  selectedRow: null,
  selectedCol: null,
  legalMoves: [],
  moveHistory: [],
  hintMove: null,
  lastMoveFrom: null,
  lastMoveTo: null,
  _aiBusy: false,
  _gameId: 0,

  initGame: () => {
    const now = Date.now();
    if (now - _lastInitTime < 500) return; // StrictMode re-mount guard
    _lastInitTime = now;

    // 复用过已存在的 Worker
    if (_worker) return;

    const worker = new Worker(new URL('../ai/worker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (e: MessageEvent<AIResponse>) => {
      const state = get();
      if (e.data.type === 'hint') {
        set({ hintMove: { from: e.data.from, to: e.data.to } });
        sounds.hint();
        return;
      }

      // AI 走棋
      if (state.gameStatus !== 'playing' && state.gameStatus !== 'red_check' && state.gameStatus !== 'black_check') return;

      const { from, to } = e.data;
      const legal = generateLegalMoves(state.board, from.row, from.col);
      const isLegal = legal.some(m => m.row === to.row && m.col === to.col);
      if (!isLegal) return;

      get().makeMove(from.row, from.col, to.row, to.col);
    };

    _worker = worker;
  },

  selectCell: (row: number, col: number) => {
    const state = get();
    if (state.gameStatus.includes('win') || state.gameStatus === 'draw') return;
    if (state.currentTurn !== state.playerSide) return;

    const piece = getPiece(state.board, row, col);

    if (state.selectedRow !== null && state.selectedCol !== null) {
      const legalIdx = state.legalMoves.findIndex(m => m.row === row && m.col === col);
      if (legalIdx >= 0) {
        get().makeMove(state.selectedRow, state.selectedCol, row, col);
        return;
      }
      if (piece && piece.side === state.playerSide) {
        const moves = generateLegalMoves(state.board, row, col);
        set({ selectedRow: row, selectedCol: col, legalMoves: moves });
        return;
      }
      set({ selectedRow: null, selectedCol: null, legalMoves: [] });
      return;
    }

    if (piece && piece.side === state.playerSide) {
      const moves = generateLegalMoves(state.board, row, col);
      set({ selectedRow: row, selectedCol: col, legalMoves: moves });
    }
  },

  makeMove: (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    const state = get();

    // 检查是否是当前方的回合
    const piece = getPiece(state.board, fromRow, fromCol);
    if (!piece || piece.side !== state.currentTurn) return false;

    try {
      const board = cloneBoard(state.board);
      const piece = getPiece(board, fromRow, fromCol)!;
      const captured = getPiece(board, toRow, toCol);

      applyMove(board, fromRow, fromCol, toRow, toCol);

      const move: Move = {
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        piece,
        captured,
      };

      const nextTurn = oppositeSide(state.currentTurn);
      const status = checkGameStatus(board, nextTurn) as GameStatus;

      // 音效
      const isLastMoveByPlayer = state.currentTurn === state.playerSide;
      if (captured) {
        sounds.capture();
      } else {
        sounds.move();
      }
      if (isLastMoveByPlayer && (status === 'black_check' || status === 'red_check')) {
        sounds.check();
        // 延迟播放将军语音效果
        setTimeout(() => {
          if (get().gameStatus === 'black_check' || get().gameStatus === 'red_check') {
            sounds.check();
          }
        }, 400);
      }
      if (status === 'red_win' || status === 'black_win') {
        sounds.win();
      } else if (status === 'draw') {
        sounds.draw();
      }

      set({
        board,
        currentTurn: nextTurn,
        gameStatus: status,
        selectedRow: null,
        selectedCol: null,
        legalMoves: [],
        moveHistory: [...state.moveHistory, move],
        hintMove: null,
        lastMoveFrom: { row: fromRow, col: fromCol },
        lastMoveTo: { row: toRow, col: toCol },
      });

      // 如果游戏继续且轮到AI
      if (status === 'playing' || status === 'red_check' || status === 'black_check') {
        const newState = get();
        if (newState.currentTurn !== newState.playerSide) {
          setTimeout(() => {
            get().requestAIMove();
          }, 300); // 加长延迟让动画播放
        }
      }

      return true;
    } catch {
      return false;
    }
  },

  undoMove: () => {
    const state = get();
    const history = [...state.moveHistory];
    if (history.length === 0) return;

    // 同时暂停AI的思考
    const undoCount = history.length >= 2 && state.playerSide !== state.currentTurn ? 2 : 1;
    const newHistory = history.slice(0, history.length - undoCount);
    const board = createInitialBoard();

    for (const m of newHistory) {
      applyMove(board, m.from.row, m.from.col, m.to.row, m.to.col);
    }

    const lastMove = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;

    set({
      board,
      currentTurn: state.playerSide,
      gameStatus: 'playing',
      moveHistory: newHistory,
      selectedRow: null,
      selectedCol: null,
      legalMoves: [],
      hintMove: null,
      lastMoveFrom: lastMove ? lastMove.from : null,
      lastMoveTo: lastMove ? lastMove.to : null,
    });
  },

  requestHint: () => {
    const state = get();
    if (state.gameStatus !== 'playing' && state.gameStatus !== 'red_check' && state.gameStatus !== 'black_check') return;
    if (state.currentTurn !== state.playerSide) return;
    if (!_worker) return;

    const msg: AIRequest = {
      type: 'hint',
      board: state.board,
      side: state.playerSide,
      difficulty: 'SSS',
    };
    _worker.postMessage(msg);
  },

  clearHint: () => set({ hintMove: null }),

  setDifficulty: (d: Difficulty) => set({ difficulty: d }),
  setPlayerSide: (s: Side) => set({ playerSide: s }),

  newGame: () => {
    const state = get();
    const newId = state._gameId + 1;

    set({
      board: createInitialBoard(),
      currentTurn: 'red',
      gameStatus: 'playing',
      moveHistory: [],
      selectedRow: null,
      selectedCol: null,
      legalMoves: [],
      hintMove: null,
      lastMoveFrom: null,
      lastMoveTo: null,
      _gameId: newId,
    });

    // 如果玩家选黑方，AI 先走
    if (state.playerSide === 'black') {
      setTimeout(() => {
        get().requestAIMove();
      }, 300);
    }
  },

  requestAIMove: () => {
    const state = get();
    if (state.currentTurn === state.playerSide) return;
    if (state.gameStatus !== 'playing' && state.gameStatus !== 'red_check' && state.gameStatus !== 'black_check') return;

    if (!_worker) return;

    const msg: AIRequest = {
      type: 'search',
      board: state.board,
      side: state.currentTurn,
      difficulty: state.difficulty,
    };

    _worker.postMessage(msg);
  },
}));
