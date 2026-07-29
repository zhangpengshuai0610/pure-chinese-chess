import { useGameStore } from '../store/gameStore';
import BoardCanvas from './BoardCanvas';
import SidePanel from './SidePanel';
import { useEffect, useState } from 'react';

export default function GameLayout() {
  const { gameStatus } = useGameStore();
  const gameOver = gameStatus.includes('win') || gameStatus === 'draw';
  const { hintMove } = useGameStore();

  const getResultText = () => {
    switch (gameStatus) {
      case 'red_win': return '红方获胜';
      case 'black_win': return '黑方获胜';
      case 'draw': return '和棋';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 min-h-screen">
      {/* Title */}
      <h1 className="text-3xl font-bold text-amber-800 dark:text-amber-400 tracking-wide select-none mt-1">
        🀄 Pure Chinese Chess
      </h1>

      {/* Hint instruction banner */}
      {hintMove && (
        <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-full font-medium animate-pulse">
          💡 蓝色箭头 + 脉冲光 = 提示走法 · 从高亮棋子走到绿色「推荐走这」圆圈
        </div>
      )}
      {gameStatus === 'red_check' || gameStatus === 'black_check' ? (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-4 py-1.5 rounded-full font-bold animate-pulse">
          ⚠️ 将军！必须应将
        </div>
      ) : null}

      {/* Main content */}
      <div className="flex gap-6 items-start flex-wrap justify-center max-w-4xl w-full">
        {/* Board */}
        <div className="flex-shrink-0">
          <BoardCanvas />
        </div>

        {/* Side panel */}
        <SidePanel />
      </div>

      {/* Game over overlay with animation */}
      {gameOver && <GameOverOverlay resultText={getResultText()} status={gameStatus} />}
    </div>
  );
}

function GameOverOverlay({ resultText, status }: { resultText: string; status: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const isRedWin = status === 'red_win';
  const isDraw = status === 'draw';

  return (
    <div className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white dark:bg-gray-800 rounded-3xl p-10 text-center shadow-2xl transform transition-all duration-500 ${visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-4'}`}>
        {/* Trophy */}
        <div className="text-7xl mb-4 animate-bounce">
          {isDraw ? '🤝' : '🏆'}
        </div>

        <h2 className={`text-4xl font-extrabold mb-3 ${
          isRedWin ? 'text-red-600 dark:text-red-400' :
          isDraw ? 'text-yellow-600 dark:text-yellow-400' :
          'text-gray-900 dark:text-gray-100'
        }`}>
          {resultText}
        </h2>

        <p className="text-gray-500 dark:text-gray-400 mb-8 text-base">
          {isRedWin ? '🎉 红方棋手获得胜利!' :
           isDraw ? '🤝 双方握手言和，和棋!' :
           '🎉 黑方棋手获得胜利!'}
        </p>

        <button
          onClick={() => useGameStore.getState().newGame()}
          className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg hover:shadow-xl text-lg"
        >
          再来一局
        </button>
      </div>
    </div>
  );
}
