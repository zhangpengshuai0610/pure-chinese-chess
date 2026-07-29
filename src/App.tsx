import { useState, useEffect, useCallback, useRef } from 'react';
import GameLayout from './components/GameLayout';
import RecordBrowser from './components/RecordBrowser';
import RecordPlayer from './components/RecordPlayer';
import { useGameStore } from './store/gameStore';
import { addRecord } from './db/indexeddb';
import { GameRecord } from './db/indexeddb';

type View = 'game' | 'records' | 'record-player';

function App() {
  const [view, setView] = useState<View>('game');
  const [currentRecord, setCurrentRecord] = useState<GameRecord | null>(null);
  const { initGame, gameStatus } = useGameStore();

  // Initialize AI worker ONCE
  useEffect(() => {
    initGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save completed game to records (防止重复保存)
  const savedRef = useRef(false);

  useEffect(() => {
    if ((gameStatus === 'red_win' || gameStatus === 'black_win' || gameStatus === 'draw') && !savedRef.current) {
      savedRef.current = true;
      const moves = useGameStore.getState().moveHistory;
      if (moves.length > 0) {
        const result = gameStatus;
        const date = new Date().toISOString().split('T')[0];
        const playerSide = useGameStore.getState().playerSide;
        const players = playerSide === 'red'
          ? { red: '玩家', black: 'AI' }
          : { red: 'AI', black: '玩家' };

        addRecord({
          title: `${players.red} vs ${players.black} · ${date}`,
          moves: [...moves],
          result,
          date,
          players,
          tags: [],
          isBuiltin: false,
        }).catch(console.error);
      }
    }
  }, [gameStatus]);

  // Handle RecordPlayer close: return to records view
  const handlePlayerClose = useCallback(() => {
    setCurrentRecord(null);
    setView('records');
  }, []);

  // Dark mode toggle
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dark-mode');
      if (stored !== null) return stored === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('dark-mode', String(darkMode));
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-light)] dark:bg-[var(--color-bg-dark)] transition-colors">
      {/* Nav bar */}
      <nav className="flex items-center justify-between px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => setView('game')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'game'
                ? 'bg-amber-500 text-white'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            对弈
          </button>
          <button
            onClick={() => setView('records')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'records'
                ? 'bg-amber-500 text-white'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            棋谱库
          </button>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-9 h-9 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-lg transition-colors"
          title={darkMode ? '切换亮色' : '切换暗色'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </nav>

      {/* Main content */}
      {view === 'game' && <GameLayout />}
      {view === 'records' && (
        <RecordBrowser
          onClose={() => setView('game')}
          onPlayRecord={(record) => {
            setCurrentRecord(record);
            setView('record-player');
          }}
        />
      )}
      {view === 'record-player' && currentRecord && (
        <RecordPlayer record={currentRecord} onClose={handlePlayerClose} />
      )}
    </div>
  );
}

export default App;
