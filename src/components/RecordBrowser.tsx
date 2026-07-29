import { useState, useEffect, useCallback } from 'react';
import { GameRecord, getAllRecords, deleteRecord, addRecord } from '../db/indexeddb';
import { useGameStore } from '../store/gameStore';
import { createInitialBoard, applyMove } from '../engine/board';
import { Board, Move } from '../engine/types';
import BoardCanvas from './BoardCanvas';

// Import classic games and seed to DB
import classicGames from '../data/classic-games';

let classicsSeeded = false;

async function seedClassics() {
  if (classicsSeeded) return;
  classicsSeeded = true;
  const existing = await getAllRecords();
  if (existing.some(r => r.isBuiltin)) return; // already seeded

  for (const game of classicGames) {
    const moves: Move[] = game.moves.map((m: [number, number, number, number, string, string, string | null, string | null]) => ({
      from: { row: m[0], col: m[1] },
      to: { row: m[2], col: m[3] },
      piece: { type: m[4] as Move['piece']['type'], side: m[5] as Move['piece']['side'] },
      captured: m[6] ? { type: m[6] as Move['piece']['type'], side: m[7] as Move['piece']['side'] } : null,
    }));

    await addRecord({
      title: game.title,
      moves,
      result: game.result,
      date: '2024-0' + (Math.floor(Math.random() * 9) + 1) + '-01',
      players: game.players,
      tags: game.tags,
      isBuiltin: true,
    });
  }
}

interface RecordBrowserProps {
  onClose: () => void;
  onPlayRecord: (record: GameRecord) => void;
}

export default function RecordBrowser({ onClose, onPlayRecord }: RecordBrowserProps) {
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    await seedClassics();
    const all = await getAllRecords();
    setRecords(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const filtered = search
    ? records.filter(r => {
        const q = search.toLowerCase();
        return r.title.toLowerCase().includes(q) ||
          (r.players?.red || '').toLowerCase().includes(q) ||
          (r.players?.black || '').toLowerCase().includes(q) ||
          (r.tags || []).some((t: string) => t.toLowerCase().includes(q));
      })
    : records;

  const handleDelete = async (id: number, isBuiltin: boolean) => {
    if (isBuiltin) {
      alert('经典棋谱不能删除');
      return;
    }
    if (confirm('确定删除这个棋谱吗？')) {
      await deleteRecord(id);
      loadRecords();
    }
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">棋谱库</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-lg"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="搜索棋谱（标题、选手、标签）..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {search ? '没有找到匹配的棋谱' : '暂无棋谱'}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(record => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{record.title}</span>
                      {record.isBuiltin && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 whitespace-nowrap">经典</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {record.players?.red || '红方'} vs {record.players?.black || '黑方'} · {resultText(record.result)} · {record.moves.length}步
                    </div>
                    {record.tags && record.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {record.tags.map((tag: string) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => record.id && onPlayRecord(record)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors whitespace-nowrap"
                    >
                      回放
                    </button>
                    <button
                      onClick={() => record.id && handleDelete(record.id, record.isBuiltin)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      disabled={record.isBuiltin}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500">
          共 {records.length} 个棋谱 · 点击"回放"查看对局 · 对局结束自动保存
        </div>
      </div>
    </div>
  );
}
