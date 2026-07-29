import { useGameStore } from '../store/gameStore';
import type { Difficulty } from '../ai/worker';

const D_OPTIONS: { key: Difficulty; label: string; color: string }[] = [
  { key: 'D',     label: 'D',  color: 'bg-emerald-500' },
  { key: 'C',     label: 'C',  color: 'bg-green-500' },
  { key: 'B',     label: 'B',  color: 'bg-lime-500' },
  { key: 'A',     label: 'A',  color: 'bg-yellow-500' },
  { key: 'S',     label: 'S',  color: 'bg-orange-500' },
  { key: 'SS',    label: 'SS', color: 'bg-red-500' },
  { key: 'SSS',   label: 'SSS',color: 'bg-purple-500' },
  { key: 'Max',   label: 'MAX',color: 'bg-black dark:bg-white dark:text-black' },
];

export default function SidePanel() {
  const {
    currentTurn, playerSide, gameStatus, difficulty,
    moveHistory, undoMove, requestHint, newGame,
    setDifficulty, setPlayerSide,
  } = useGameStore();

  const isPlayerTurn = currentTurn === playerSide;
  const gameOver = gameStatus.includes('win') || gameStatus === 'draw';

  const getStatusText = () => {
    const statusMap: Record<string, string> = {
      playing: isPlayerTurn ? '轮到你走棋' : 'AI 思考中...',
      red_check: '红方被将军!',
      black_check: '黑方被将军!',
      red_win: '红方获胜!',
      black_win: '黑方获胜!',
      draw: '和棋!',
    };
    return statusMap[gameStatus] || gameStatus;
  };

  const statusColor = () => {
    if (gameStatus.includes('win') || gameStatus === 'draw') return 'text-yellow-500';
    if (gameStatus.includes('check')) return 'text-red-500';
    return isPlayerTurn ? 'text-green-500' : 'text-blue-400';
  };

  // Format move for display
  const formatMove = (move: typeof moveHistory[0], index: number) => {
    const pieceChars: Record<string, Record<string, string>> = {
      king: { red: '帅', black: '将' },
      advisor: { red: '仕', black: '士' },
      elephant: { red: '相', black: '象' },
      horse: { red: '馬', black: '馬' },
      rook: { red: '車', black: '車' },
      cannon: { red: '炮', black: '砲' },
      pawn: { red: '兵', black: '卒' },
    };
    const piece = pieceChars[move.piece.type][move.piece.side];
    const from = `(${move.from.col},${move.from.row})`;
    const to = `(${move.to.col},${move.to.row})`;
    const capture = move.captured ? '吃' : '';
    const num = index + 1;
    return `${num}. ${piece}${from}→${to}${capture}`;
  };

  return (
    <div className="flex flex-col gap-3 w-64 p-4 rounded-xl bg-[var(--color-panel-light)] dark:bg-[var(--color-panel-dark)] shadow-lg">
      {/* Status */}
      <div className={`text-center py-2 px-3 rounded-lg font-bold text-sm ${statusColor()} bg-white/50 dark:bg-white/5`}>
        {getStatusText()}
      </div>

      {/* Difficulty */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">难度等级 · {difficulty}</label>
        <div className="grid grid-cols-4 gap-2">
          {(D_OPTIONS as { key: string; label: string; color: string }[]).map(d => (
            <button
              key={d.key}
              onClick={() => setDifficulty(d.key as Difficulty)}
              className={`py-2 text-sm font-bold rounded-xl transition-all active:scale-95 ${
                difficulty === d.key
                  ? d.color + ' text-white shadow-md scale-105'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Side choice */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">执子颜色</label>
        <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          {(['red', 'black'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setPlayerSide(s); newGame(); }}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                playerSide === s
                  ? s === 'red' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                  : 'bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10'
              }`}
            >
              {{ red: '红方', black: '黑方' }[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={newGame}
          className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all active:scale-95"
        >
          新游戏
        </button>
        <div className="flex gap-2">
          <button
            onClick={undoMove}
            disabled={moveHistory.length === 0 || gameOver}
            className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-all active:scale-95"
          >
            悔棋
          </button>
          <button
            onClick={requestHint}
            disabled={!isPlayerTurn || gameOver}
            className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-all active:scale-95"
          >
            提示
          </button>
        </div>
      </div>

      {/* Move history */}
      <div className="flex-1 min-h-0">
        <h3 className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">走法记录</h3>
        <div className="h-40 overflow-y-auto rounded-lg bg-white/50 dark:bg-white/5 p-2 text-xs font-mono leading-relaxed">
          {moveHistory.length === 0 ? (
            <span className="text-gray-400">暂无走法记录</span>
          ) : (
            moveHistory.map((m, i) => (
              <div key={i} className={m.piece.side === 'red' ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}>
                {formatMove(m, i)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
