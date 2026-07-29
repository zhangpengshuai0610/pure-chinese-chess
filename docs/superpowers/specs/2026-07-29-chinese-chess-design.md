# 中国象棋 · 设计文档

**日期**: 2026-07-29
**状态**: 待实现

---

## 一、产品概述

单机版中国象棋网页应用，支持人机对弈。核心体验：流畅的对弈交互 + 可靠 AI 对手 + 丰富的棋谱资源。

## 二、核心需求

| 需求 | 说明 |
|------|------|
| 单机 AI 对战 | 人在浏览器与 AI 对弈，无需联网 |
| 三级难度 | 初级 / 中级 / 高级，控制搜索深度和随机噪声 |
| 无限悔棋 | 走法历史栈，可退回到任意步 |
| 无限提示 | 实时分析当前局面，高亮推荐走法 |
| 经典棋谱库 | 预置 ~50 局名局，可浏览、搜索、回放 |
| 对局记录 | 每局自动保存，可回放、导出 |

## 三、技术栈

| 层面 | 技术 | 理由 |
|------|------|------|
| 框架 | React 18 + TypeScript | 复杂交互状态管理 |
| 构建 | Vite | 开发快，HMR 即时 |
| 样式 | Tailwind CSS 4 | 主题切换，原子化 |
| 状态 | Zustand | 轻量，无模板代码 |
| 棋盘 | Canvas API | 高性能渲染，流畅动画 |
| AI | 自写引擎，Web Worker | 不阻塞主线程 |
| 存储 | IndexedDB (idb 库) | 大量棋谱离线存储 |
| 动画 | 纯 CSS + requestAnimationFrame | 零依赖 |
| 部署 | Vercel | 免费，全球 CDN |

## 四、架构

```
浏览器主线程                     Web Worker 线程
┌──────────────────┐           ┌──────────────┐
│  React UI 层     │           │  AI 引擎      │
│  (Canvas + 组件)  │◄─────────│  - 走法生成   │
│                  │ postMessage│  - 局面评估   │
│  游戏状态管理     │──────────►│  - Alpha-Beta │
│  (Zustand Store) │           │  - 搜索控制   │
│                  │           └──────────────┘
│  IndexedDB 操作   │
│  (棋谱/对局 CRUD) │
└──────────────────┘
```

## 五、组件树

```
App
├── ThemeProvider          # 明暗主题 + 跟随系统
├── GameLayout
│   ├── TopBar             # 对手信息、计时
│   ├── BoardCanvas        # Canvas 棋盘（核心）
│   ├── SidePanel
│   │   ├── ActionButtons  # 新游戏、悔棋、提示
│   │   ├── DifficultySelect
│   │   └── MoveHistory    # 走法记录
│   ├── BottomBar          # 己方信息、难度
│   └── RecordBrowser      # 棋谱浏览器（弹窗）
│       ├── RecordList     # 棋谱列表 + 搜索
│       └── RecordPlayer   # 回放播放器
```

## 六、核心数据模型

```typescript
type Side = 'red' | 'black';
type PieceType = 'king' | 'advisor' | 'elephant' | 'horse' | 'rook' | 'cannon' | 'pawn';

interface Piece {
  type: PieceType;
  side: Side;
}

type Board = (Piece | null)[][];  // 10×9

interface Move {
  from: [number, number];
  to: [number, number];
  captured?: Piece;
  piece: Piece;
}

interface GameState {
  board: Board;
  currentTurn: Side;
  moveHistory: Move[];
  gameStatus: 'playing' | 'check' | 'checkmate' | 'stalemate';
  difficulty: 'easy' | 'medium' | 'hard';
  playerSide: Side;
  selectedPos: [number, number] | null;
  legalMoves: [number, number][];
  hintMove: Move | null;
  lastMove: Move | null;
}

interface GameRecord {
  id: string;
  title: string;
  moves: Move[];
  result: string;
  date: string;
  players: { red: string; black: string };
  tags: string[];
  isBuiltin: boolean;
}
```

## 七、AI 引擎设计

### 难度控制

| 难度 | 搜索深度 | 随机噪声 | 特点 |
|------|---------|---------|------|
| 初级 | 1-2 | 20% | 会犯明显错误，适合新手 |
| 中级 | 3-4 | 5% | 具备基本棋力 |
| 高级 | 5-6 | 0% | 开局库辅助，较强棋力 |

### 算法

- **搜索**: Alpha-Beta 剪枝 + 迭代加深 + 置换表 (Zobrist Hash)
- **评估**: 子力价值 + 位置表 (Piece-Square Table) + 机动性 + 将军奖励
- **排序**: MVV-LVA 吃子启发 + 杀手启发 + 历史启发

### 开局库

存储常用开局前 8-12 步的走法序列，高级 AI 优先匹配开局库，避免开局阶段的深度搜索。

## 八、功能实现

### 悔棋
`moveHistory` 栈 pop 两次（撤销最近一次 AI 走子 + 玩家走子），还原棋盘状态。每次玩家走子后 push 当前走法。

### 提示
当前局面发送给 Web Worker 中的 AI，搜索单步最佳走法，返回后在 Canvas 上绿色圆点高亮目标格。

### 棋谱回放
从开局状态开始，逐步应用 `moveHistory` 中的每一步。支持：播放/暂停、步进/步退、速度调节(0.5x / 1x / 2x)、跳到开头/末尾。

### 经典棋谱
预置约 50 局精选名局为静态 JSON 数据，应用首次启动时写入 IndexedDB。棋谱格式兼容 PGN 的中国象棋变体。

### 对局保存
每局结束后自动存入 IndexedDB，包含完整走法列表和元信息（日期、结果、对战方）。

## 九、视觉设计

### 配色

亮色模式:
- 背景: `#FEF9EF` 象牙白
- 棋盘: `#E8C97A` 浅胡桃木 + `#C8A45C` 深棕格线
- 红方: `#C0392B` 深红
- 黑方: `#1A1A2E` 深黑

暗色模式:
- 背景: `#1A1A2E` 深灰
- 棋盘: `#5C4033` 暗柚木 + `#D4A853` 金色格线
- 红方: `#E74C3C` 亮红
- 黑方: `#EAEAEA` 亮白

### 棋子
扁平圆形 + 文字 + box-shadow 立体感。选中时外发光。最后一步走子淡色框高亮。

### 交互反馈
- 走法提示：绿色圆点标记目标格
- 将军：红色闪烁棋盘边框
- 吃子：棋子抖动 + 放大
- 胜负：半透明遮罩 + 结果文字居中

## 十、文件结构

```
chinese-chess/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── vercel.json
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── engine/               # 规则引擎
│   │   ├── board.ts          # 棋盘初始化、走子、撤销
│   │   ├── moves.ts          # 走法生成器
│   │   ├── rules.ts          # 合法性校验、将军检测
│   │   ├── evaluate.ts       # 局面评估函数
│   │   └── types.ts          # 引擎类型定义
│   ├── ai/                   # AI 引擎
│   │   ├── search.ts         # Alpha-Beta 搜索
│   │   ├── opening.ts        # 开局库
│   │   ├── worker.ts         # Web Worker 入口
│   │   └── transposition.ts  # 置换表
│   ├── components/           # UI 组件
│   │   ├── Board.tsx         # Canvas 棋盘
│   │   ├── TopBar.tsx        # 顶栏
│   │   ├── SidePanel.tsx     # 侧边栏
│   │   ├── ActionButtons.tsx # 操作按钮
│   │   ├── MoveHistory.tsx   # 走法记录
│   │   ├── RecordBrowser.tsx # 棋谱浏览器
│   │   ├── RecordPlayer.tsx  # 棋谱播放器
│   │   ├── DifficultySelect.tsx
│   │   └── GameResult.tsx    # 胜负弹窗
│   ├── store/                # 状态管理
│   │   └── gameStore.ts      # Zustand store
│   ├── db/                   # 数据层
│   │   └── indexeddb.ts      # IndexedDB 操作
│   ├── data/                 # 静态数据
│   │   └── classic-games.ts  # 经典棋谱 JSON
│   └── hooks/                # 自定义 hooks
│       ├── useBoardCanvas.ts # Canvas 绘制逻辑
│       └── useAIWorker.ts    # Web Worker 通信
```

## 十一、开发阶段

### 阶段 1: 项目骨架 + 棋盘渲染（1-2 天）
- Vite + React + TS + Tailwind 初始化
- Canvas 棋盘 + 棋子绘制
- 点击选子、走子交互
- 暗色/亮色主题

### 阶段 2: 规则引擎 + 人机对弈（2-3 天）
- 完整规则引擎（走法生成、合法性、将军）
- AI 引擎 + Web Worker
- 三级难度控制
- 人和 AI 轮流下棋

### 阶段 3: 功能打磨（1-2 天）
- 悔棋、提示
- 走法历史面板
- 计时器
- 胜负判定 UI

### 阶段 4: 棋谱系统（2-3 天）
- IndexedDB 数据层
- 经典棋谱预置数据
- 棋谱浏览 + 搜索
- 棋谱回放播放器
- 对局自动保存

### 阶段 5: 部署上线（0.5 天）
- Vercel 部署
- 测试和修复
