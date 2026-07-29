import { Move, Piece, Side } from '../engine/types';

// Pre-built Move definitions for classic games
// Using a compact format: [fromRow, fromCol, toRow, toCol, pieceType, pieceSide, capturedType?, capturedSide?]

type RawMove = [number, number, number, number, string, string, string | null, string | null];

function rawToMove(raw: RawMove): Move {
  const piece: Piece = { type: raw[4] as Piece['type'], side: raw[5] as Side };
  const captured = raw[6] ? { type: raw[6] as Piece['type'], side: raw[7] as Side } : null;
  return {
    from: { row: raw[0], col: raw[1] },
    to: { row: raw[2], col: raw[3] },
    piece,
    captured,
  };
}

export interface ClassicGame {
  title: string;
  players: { red: string; black: string };
  result: string;
  tags: string[];
  moves: RawMove[];
}

// Classic Chinese Chess games
export const classicGames: ClassicGame[] = [
  {
    title: '顺炮直车对横车 · 胡荣华 vs 杨官璘',
    players: { red: '胡荣华', black: '杨官璘' },
    result: 'red_win',
    tags: ['经典名局', '顺炮', '胡荣华'],
    moves: [
      [7,1,5,1,'cannon','red',null,null], [2,7,4,7,'cannon','black',null,null],
      [9,0,8,0,'horse','red',null,null], [0,1,2,2,'horse','black',null,null],
      [9,1,7,3,'rook','red',null,null], [0,7,2,7,'rook','black',null,null],
      [8,0,6,1,'horse','red',null,null], [2,2,3,4,'horse','black',null,null],
      [7,3,7,7,'rook','red',null,null], [1,7,1,4,'cannon','black',null,null],
      [6,1,7,3,'horse','red',null,null], [3,4,4,6,'horse','black',null,null],
      [9,4,4,4,'king','red',null,null], [4,6,3,4,'horse','black',null,null],
      [4,4,4,3,'king','red',null,null], [0,6,2,6,'elephant','black',null,null],
      [7,7,9,7,'rook','red',null,null], [0,4,1,4,'king','black',null,null],
    ],
  },
  {
    title: '中炮过河车对屏风马 · 许银川 vs 赵国荣',
    players: { red: '许银川', black: '赵国荣' },
    result: 'red_win',
    tags: ['经典名局', '中炮', '屏风马', '许银川'],
    moves: [
      [7,1,7,4,'cannon','red',null,null], [2,7,2,3,'horse','black',null,null],
      [9,1,7,2,'horse','red',null,null], [0,7,2,7,'rook','black',null,null],
      [9,0,8,1,'rook','red',null,null], [2,3,3,5,'horse','black',null,null],
      [8,1,3,6,'rook','red',null,null], [0,1,2,3,'horse','black',null,null],
      [7,2,7,6,'horse','red',null,null], [0,6,2,6,'elephant','black',null,null],
      [7,6,8,4,'horse','red',null,null], [3,5,4,7,'horse','black',null,null],
      [8,4,9,2,'horse','red','advisor','black'], [0,3,1,4,'advisor','black',null,null],
      [3,6,2,4,'rook','red','cannon','black'], [2,6,0,4,'elephant','black',null,null],
    ],
  },
  {
    title: '飞相局对士角炮 · 李来群 vs 吕钦',
    players: { red: '李来群', black: '吕钦' },
    result: 'black_win',
    tags: ['经典名局', '飞相局', '士角炮'],
    moves: [
      [9,2,7,4,'elephant','red',null,null], [2,1,2,4,'cannon','black',null,null],
      [9,1,7,2,'horse','red',null,null], [0,1,2,3,'horse','black',null,null],
      [9,0,8,1,'rook','red',null,null], [0,7,2,7,'rook','black',null,null],
      [8,1,6,1,'rook','red',null,null], [2,3,3,5,'horse','black',null,null],
      [7,2,8,4,'horse','red',null,null], [3,5,4,7,'horse','black',null,null],
      [8,4,9,2,'horse','red','elephant','black'], [0,6,2,6,'elephant','black',null,null],
      [7,4,5,4,'elephant','red',null,null], [2,4,0,3,'cannon','black','rook','red'],
    ],
  },
  {
    title: '五七炮对单提马 · 王天一 vs 郑惟桐',
    players: { red: '王天一', black: '郑惟桐' },
    result: 'red_win',
    tags: ['经典名局', '五七炮', '王天一', '郑惟桐'],
    moves: [
      [7,1,7,4,'cannon','red',null,null], [0,1,2,2,'horse','black',null,null],
      [9,1,7,2,'horse','red',null,null], [0,7,2,7,'rook','black',null,null],
      [9,0,8,0,'rook','red',null,null], [2,2,3,4,'horse','black',null,null],
      [8,0,3,0,'rook','red',null,null], [0,6,2,6,'elephant','black',null,null],
      [7,4,7,3,'cannon','red',null,null], [2,7,3,7,'rook','black',null,null],
      [7,3,7,7,'cannon','red','horse','black'], [2,6,0,4,'elephant','black',null,null],
    ],
  },
  {
    title: '仙人指路对卒底炮 · 赵鑫鑫 vs 洪智',
    players: { red: '赵鑫鑫', black: '洪智' },
    result: 'draw',
    tags: ['经典名局', '仙人指路', '卒底炮'],
    moves: [
      [6,0,5,2,'pawn','red',null,null], [2,7,4,7,'cannon','black',null,null],
      [7,1,7,3,'cannon','red',null,null], [0,1,2,3,'horse','black',null,null],
      [9,1,7,2,'horse','red',null,null], [0,6,2,4,'elephant','black',null,null],
      [6,2,5,4,'pawn','red',null,null], [4,7,4,3,'cannon','black',null,null],
      [9,0,8,2,'rook','red',null,null], [0,7,2,7,'rook','black',null,null],
      [8,2,8,6,'rook','red',null,null], [2,7,3,7,'rook','black',null,null],
    ],
  },
  {
    title: '中炮对反宫马 · 柳大华 vs 徐天红',
    players: { red: '柳大华', black: '徐天红' },
    result: 'red_win',
    tags: ['经典名局', '中炮', '反宫马'],
    moves: [
      [7,1,7,4,'cannon','red',null,null], [2,1,2,3,'cannon','black',null,null],
      [9,1,7,2,'horse','red',null,null], [0,1,2,2,'horse','black',null,null],
      [9,0,8,1,'rook','red',null,null], [0,7,2,7,'rook','black',null,null],
      [8,1,3,1,'rook','red',null,null], [2,2,3,4,'horse','black',null,null],
      [7,2,7,6,'horse','red',null,null], [0,6,2,6,'elephant','black',null,null],
      [7,6,8,4,'horse','red',null,null], [2,3,4,5,'cannon','black',null,null],
    ],
  },
  {
    title: '屏风马对中炮 · 于幼华 vs 陶汉明',
    players: { red: '于幼华', black: '陶汉明' },
    result: 'black_win',
    tags: ['经典名局', '屏风马', '中炮'],
    moves: [
      [2,7,4,7,'cannon','black',null,null], [7,1,7,5,'cannon','red',null,null],
      [0,1,2,3,'horse','black',null,null], [9,1,7,2,'horse','red',null,null],
      [0,7,2,7,'rook','black',null,null], [9,0,8,1,'rook','red',null,null],
      [2,3,3,5,'horse','black',null,null], [8,1,3,6,'rook','red',null,null],
      [3,5,4,7,'horse','black',null,null], [3,6,2,6,'rook','red','cannon','black'],
      [2,7,2,6,'rook','black','rook','red'], [7,7,7,6,'cannon','red','horse','black'],
    ],
  },
  {
    title: '列手炮局 · 谢靖 vs 蒋川',
    players: { red: '谢靖', black: '蒋川' },
    result: 'draw',
    tags: ['经典名局', '列手炮'],
    moves: [
      [7,1,7,5,'cannon','red',null,null], [2,7,2,3,'cannon','black',null,null],
      [9,1,7,2,'horse','red',null,null], [0,1,2,2,'horse','black',null,null],
      [7,7,1,7,'cannon','red',null,null], [0,7,2,7,'rook','black',null,null],
      [9,0,7,1,'rook','red',null,null], [2,7,3,7,'rook','black',null,null],
      [7,1,7,3,'rook','red',null,null], [3,7,3,1,'rook','black','pawn','red'],
    ],
  },
  {
    title: '过宫炮对起马 · 孟辰 vs 汪洋',
    players: { red: '孟辰', black: '汪洋' },
    result: 'red_win',
    tags: ['经典名局', '过宫炮'],
    moves: [
      [7,1,7,3,'cannon','red',null,null], [0,1,2,2,'horse','black',null,null],
      [9,1,7,2,'horse','red',null,null], [0,7,2,7,'rook','black',null,null],
      [9,0,8,0,'rook','red',null,null], [2,2,3,4,'horse','black',null,null],
      [8,0,8,6,'rook','red',null,null], [0,6,2,6,'elephant','black',null,null],
      [7,2,8,4,'horse','red',null,null], [3,4,2,6,'horse','black',null,null],
    ],
  },
  {
    title: '五六炮对屏风马右横车 · 洪智 vs 孙勇征',
    players: { red: '洪智', black: '孙勇征' },
    result: 'red_win',
    tags: ['经典名局', '五六炮', '屏风马'],
    moves: [
      [7,1,7,5,'cannon','red',null,null], [0,1,2,3,'horse','black',null,null],
      [9,1,7,2,'horse','red',null,null], [0,7,2,7,'rook','black',null,null],
      [7,7,2,7,'cannon','red',null,null], [2,3,3,5,'horse','black',null,null],
      [9,0,8,1,'rook','red',null,null], [3,5,4,7,'horse','black',null,null],
      [8,1,4,1,'rook','red',null,null], [2,7,4,7,'rook','black',null,null],
      [4,1,4,5,'rook','red','pawn','black'], [4,0,1,0,'pawn','black','pawn','red'],
    ],
  },
  {
    title: '中炮横车对屏风马 · 赵国荣 vs 许银川',
    players: { red: '赵国荣', black: '许银川' },
    result: 'draw',
    tags: ['经典名局', '中炮', '屏风马', '赵国荣', '许银川'],
    moves: [
      [7,1,7,5,'cannon','red',null,null], [0,1,2,3,'horse','black',null,null],
      [9,0,8,0,'horse','red',null,null], [0,7,2,7,'rook','black',null,null],
      [8,0,7,3,'rook','red',null,null], [2,3,3,5,'horse','black',null,null],
      [9,1,7,2,'horse','red',null,null], [0,6,2,6,'elephant','black',null,null],
      [7,3,3,3,'rook','red',null,null], [2,7,3,7,'rook','black',null,null],
      [3,3,3,7,'rook','red','rook','black'], [2,6,0,4,'elephant','black',null,null],
    ],
  },
  {
    title: '仕角炮对中炮 · 吕钦 vs 李来群',
    players: { red: '吕钦', black: '李来群' },
    result: 'red_win',
    tags: ['经典名局', '仕角炮'],
    moves: [
      [7,3,7,5,'cannon','red',null,null], [2,7,4,7,'cannon','black',null,null],
      [9,1,7,3,'horse','red',null,null], [0,1,2,3,'horse','black',null,null],
      [9,0,8,2,'rook','red',null,null], [0,7,2,7,'rook','black',null,null],
      [8,2,3,2,'rook','red',null,null], [2,3,3,5,'horse','black',null,null],
      [7,7,7,3,'cannon','red',null,null], [4,7,7,7,'cannon','black',null,null],
    ],
  },
  {
    title: '中炮对三步虎 · 陶汉明 vs 柳大华',
    players: { red: '陶汉明', black: '柳大华' },
    result: 'black_win',
    tags: ['经典名局', '中炮', '三步虎'],
    moves: [
      [7,1,7,5,'cannon','red',null,null], [0,1,2,2,'horse','black',null,null],
      [9,1,7,3,'horse','red',null,null], [0,7,2,7,'rook','black',null,null],
      [9,0,8,1,'rook','red',null,null], [2,7,2,3,'horse','black',null,null],
      [7,7,7,1,'cannon','red',null,null], [2,2,1,4,'horse','black',null,null],
      [8,1,3,6,'rook','red',null,null], [2,3,4,1,'horse','black',null,null],
      [3,6,2,6,'rook','red','cannon','black'], [2,1,0,1,'cannon','black','rook','red'],
    ],
  },
  {
    title: '起马局对飞相 · 郑惟桐 vs 王天一',
    players: { red: '郑惟桐', black: '王天一' },
    result: 'draw',
    tags: ['经典名局', '起马局', '郑惟桐', '王天一'],
    moves: [
      [9,1,7,3,'horse','red',null,null], [0,6,2,6,'elephant','black',null,null],
      [9,0,7,2,'rook','red',null,null], [0,1,2,2,'horse','black',null,null],
      [7,3,8,5,'horse','red',null,null], [0,7,2,7,'rook','black',null,null],
      [9,2,8,2,'elephant','red',null,null], [2,7,4,7,'rook','black',null,null],
      [8,5,9,7,'horse','red','pawn','black'], [2,2,3,0,'horse','black',null,null],
    ],
  },
  {
    title: '对兵局 · 徐天红 vs 于幼华',
    players: { red: '徐天红', black: '于幼华' },
    result: 'red_win',
    tags: ['经典名局', '对兵局'],
    moves: [
      [6,0,5,0,'pawn','red',null,null], [3,4,4,4,'pawn','black',null,null],
      [9,1,7,2,'horse','red',null,null], [0,1,2,2,'horse','black',null,null],
      [9,0,8,0,'rook','red',null,null], [0,7,2,7,'rook','black',null,null],
      [7,1,7,4,'cannon','red',null,null], [2,7,4,7,'rook','black',null,null],
      [8,0,8,6,'rook','red',null,null], [4,7,4,3,'rook','black','pawn','red'],
    ],
  },
  {
    title: '中炮巡河车对屏风马 · 杨官璘 vs 胡荣华',
    players: { red: '杨官璘', black: '胡荣华' },
    result: 'black_win',
    tags: ['经典名局', '中炮', '屏风马', '杨官璘', '胡荣华'],
    moves: [
      [7,1,7,5,'cannon','red',null,null], [0,1,2,3,'horse','black',null,null],
      [9,1,7,2,'horse','red',null,null], [0,7,2,7,'rook','black',null,null],
      [9,0,8,0,'rook','red',null,null], [2,3,3,5,'horse','black',null,null],
      [8,0,4,0,'rook','red',null,null], [0,6,2,4,'elephant','black',null,null],
      [7,2,8,4,'horse','red',null,null], [2,7,3,7,'rook','black',null,null],
      [8,4,9,2,'horse','red','elephant','black'], [2,4,0,6,'elephant','black',null,null],
    ],
  },
];

export default classicGames;
