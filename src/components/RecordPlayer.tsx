import { useState, useEffect, useRef } from 'react';
import { GameRecord } from '../db/indexeddb';
import { createInitialBoard, applyMove } from '../engine/board';
import { Board, Move } from '../engine/types';
import BoardCanvas from './BoardCanvas';

interface RecordPlayerProps {
  record: GameRecord;
  onClose: () => void;
}

export default function RecordPlayer({ record, onClose }: RecordPlayerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 0.5x, 1x, 2x
  const intervalRef = useRef<number | null>(null);

  const moves = record.moves;
  const totalSteps = moves.length;

  // Build board at current step
  const board = createInitialBoard();
  for (let i = 0; i < currentStep; i++) {
    const m = moves[i];
    applyMove(board, m.from.row, m.from.col, m.to.row, m.to.col);
  }

  const currentMove = currentStep > 0 ? moves[currentStep - 1] : null;

  // Play logic
  useEffect(() => {
    if (playing) {
      const delay = 1000 / speed;
      intervalRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= totalSteps) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, totalSteps]);

  const stepForward = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const stepBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStart = () => { setPlaying(false); setCurrentStep(0); };
  const goToEnd = () => { setPlaying(false); setCurrentStep(totalSteps); };

  const togglePlay = () => setPlaying(!playing);

  const pieceChars: Record<string, Record<string, string>> = {
    king: { red: '帅', black: '将' },
    advisor: { red: '仕', black: '士' },
    elephant: { red: '相', black: '象' },
    horse: { red: '馬', black: '馬' },
    rook: { red: '車', black: '車' },
    cannon: { red: '炮', black: '砲' },
    pawn: { red: '兵', black: '卒' },
  };

  const formatMove = (move: Move) => {
    const piece = pieceChars[move.piece.type][move.piece.side];
    const from = `(${move.from.col},${move.from.row})`;
    const to = `(${move.to.col},${move.to.row})`;
    return `${piece}${from}→${to}`;
  };

  const resultText = (r: string) => {
    switch (r) {
      case 'red_win': return '红胜';
      case 'black_win': return '黑胜';
      case 'draw': return '和棋';
      default: return '未知';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold">{record.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {record.players?.red || '红方'} vs {record.players?.black || '黑方'} · {resultText(record.result)} · {totalSteps}步
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-lg"
          >
            ✕
          </button>
        </div>

        {/* Board + Controls */}
        <div className="flex flex-col lg:flex-row gap-4 p-5 items-center">
          {/* Mini board display */}
          <div className="flex-shrink-0 border-4 border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden scale-75 origin-top lg:origin-center">
            <div className="pointer-events-none">
              {/* We render the board state visually using a simple grid */}
              <BoardView board={board} currentMove={currentMove} />
            </div>
          </div>

          {/* Controls and move list */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
            {/* Playback controls */}
            <div className="flex items-center justify-center gap-2">
              <button onClick={goToStart} className="w-8 h-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-sm" title="开头">
                ⏮
              </button>
              <button onClick={stepBack} className="w-8 h-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-sm" title="上一步">
                ⏪
              </button>
              <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center text-lg" title={playing ? '暂停' : '播放'}>
                {playing ? '⏸' : '▶'}
              </button>
              <button onClick={stepForward} className="w-8 h-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-sm" title="下一步">
                ⏩
              </button>
              <button onClick={goToEnd} className="w-8 h-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-sm" title="结尾">
                ⏭
              </button>
            </div>

            {/* Speed control */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500">速度:</span>
              {[0.5, 1, 2].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    speed === s
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-10 text-right">{currentStep}</span>
              <input
                type="range"
                min={0}
                max={totalSteps}
                value={currentStep}
                onChange={e => { setPlaying(false); setCurrentStep(Number(e.target.value)); }}
                className="flex-1 accent-amber-500"
              />
              <span className="text-xs text-gray-500 w-10">{totalSteps}</span>
            </div>

            {/* Current move info */}
            {currentMove && (
              <div className="text-center text-sm font-medium text-amber-700 dark:text-amber-400">
                第 {currentStep} 步: {formatMove(currentMove)}
                {currentMove.captured && <span className="text-red-500 ml-1">吃子!</span>}
              </div>
            )}

            {/* Move list */}
            <div className="flex-1 max-h-40 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs font-mono">
                {moves.map((m, i) => (
                  <div
                    key={i}
                    onClick={() => { setPlaying(false); setCurrentStep(i + 1); }}
                    className={`cursor-pointer py-0.5 px-1 rounded truncate ${
                      i === currentStep - 1
                        ? 'bg-amber-200 dark:bg-amber-800 font-bold'
                        : m.piece.side === 'red'
                          ? 'text-red-600 dark:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {i + 1}. {formatMove(m)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small board view component (grid-based, not canvas, for simplicity in record player)
function BoardView({ board, currentMove }: { board: Board; currentMove: Move | null }) {
  const isDark = document.body.classList.contains('dark');
  const pieceChars: Record<string, Record<string, string>> = {
    king: { red: '帅', black: '将' },
    advisor: { red: '仕', black: '士' },
    elephant: { red: '相', black: '象' },
    horse: { red: '馬', black: '馬' },
    rook: { red: '車', black: '車' },
    cannon: { red: '炮', black: '砲' },
    pawn: { red: '兵', black: '卒' },
  };

  const rows = 10;
  const cols = 9;

  return (
    <div
      className="inline-grid gap-0 p-1 rounded-lg"
      style={{
        gridTemplateColumns: `repeat(${cols}, 36px)`,
        gridTemplateRows: `repeat(${rows}, 36px)`,
        backgroundColor: isDark ? '#5C4033' : '#E8C97A',
      }}
    >
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const piece = board[r][c];
          const isRiver = r === 4 || r === 5;
          const isCurrentFrom = currentMove && r === currentMove.from.row && c === currentMove.from.col;
          const isCurrentTo = currentMove && r === currentMove.to.row && c === currentMove.to.col;

          return (
            <div
              key={`${r}-${c}`}
              className={`flex items-center justify-center text-xs font-bold select-none
                ${isCurrentFrom ? 'bg-amber-400/60 dark:bg-amber-500/60 rounded' : ''}
                ${isCurrentTo ? 'bg-amber-300/60 dark:bg-amber-400/60 rounded' : ''}
              `}
              style={{
                backgroundColor: isRiver ? (isDark ? '#5C5033' : '#D4BE7A') : 'transparent',
              }}
            >
              {piece ? (
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs
                  ${piece.side === 'red'
                    ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-500'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-600'
                  } border-2 shadow-sm`}
                >
                  {pieceChars[piece.type][piece.side]}
                </span>
              ) : (
                <span className="w-7 h-7 flex items-center justify-center text-[8px] text-gray-400 dark:text-gray-600">
                  {r === 4 && c === 0 ? '楚' : r === 4 && c === 1 ? '河' :
                   r === 5 && c === 7 ? '汉' : r === 5 && c === 8 ? '界' : ''}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
