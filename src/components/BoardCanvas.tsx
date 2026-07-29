import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ROWS, COLS, PIECE_CHARS } from '../engine/types';
import { getPiece } from '../engine/board';
import type { Side } from '../engine/types';

const PAD = 40;
const CS = 58;
const R = 24;
const BW = PAD * 2 + 8 * CS;  // 562
const BH = PAD * 2 + 9 * CS;  // 620

// 动画
let anim: { piece: { type: string; side: string }; sx: number; sy: number; ex: number; ey: number; t0: number } | null = null;
let checkT0 = 0;

export default function BoardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const [fs, setFs] = useState(false);
  const storeRef = useRef(useGameStore);

  // 点击
  const onClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const pxW = c.width / dpr;
    const pxH = c.height / dpr;
    const sx = pxW / rect.width;
    const sy = pxH / rect.height;
    const mx = (e.clientX - rect.left) * sx;
    const my = (e.clientY - rect.top) * sy;
    const col = Math.round((mx - PAD) / CS);
    const row = Math.round((my - PAD) / CS);
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      storeRef.current.getState().selectCell(row, col);
    }
  }, []);

  // 绘制棋子
  const drawP = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string, side: string, s: number) => {
    const r = R * s;
    const dark = document.body.classList.contains('dark');
    const isR = side === 'red';
    ctx.save();
    ctx.beginPath(); ctx.arc(x + 2, y + 3, r, 0, Math.PI * 2);
    ctx.fillStyle = dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'; ctx.fill();
    const g = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, r);
    if (isR) {
      g.addColorStop(0, dark ? '#FCD5C0' : '#FFF5EE'); g.addColorStop(0.4, '#FADBD8');
      g.addColorStop(0.8, dark ? '#E8533A' : '#D44532'); g.addColorStop(1, dark ? '#B83A2A' : '#A93226');
    } else {
      g.addColorStop(0, dark ? '#D5D8DC' : '#F8F9FA'); g.addColorStop(0.4, '#ABB2B9');
      g.addColorStop(0.8, dark ? '#2C3E50' : '#283747'); g.addColorStop(1, '#1A1A2E');
    }
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = isR ? (dark ? '#C0392B' : '#943126') : (dark ? '#EAEAEA' : '#17202A');
    ctx.lineWidth = 1.8; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r - 4, 0, Math.PI * 2);
    ctx.strokeStyle = isR ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    const ch = PIECE_CHARS[type as keyof typeof PIECE_CHARS]?.[side as 'red'|'black'] || '?';
    ctx.font = `bold ${Math.round(22 * s)}px "KaiTi", "STKaiti", "楷体", serif`;
    ctx.fillStyle = isR ? '#FFFFFF' : (dark ? '#EAEAEA' : '#F0F0F0');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 2;
    ctx.fillText(ch, x, y + 1); ctx.shadowBlur = 0;
    ctx.restore();
  };

  // 主渲染
  const render = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    const dark = document.body.classList.contains('dark');
    const dpr = window.devicePixelRatio || 1;

    // 设置尺寸
    if (Math.round(c.width / dpr) !== BW || Math.round(c.height / dpr) !== BH) {
      c.width = Math.round(BW * dpr);
      c.height = Math.round(BH * dpr);
      c.style.width = BW + 'px';
      c.style.height = BH + 'px';
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const s = storeRef.current.getState();
    const { board, selectedRow, selectedCol, legalMoves, hintMove, lastMoveFrom, lastMoveTo, gameStatus } = s;

    // 背景
    const bg = dark ? '#5C4033' : '#E8C97A';
    ctx.fillStyle = bg; ctx.fillRect(0, 0, BW, BH);
    ctx.fillStyle = dark ? '#4A3228' : '#DEB86A';
    ctx.fillRect(PAD - 8, PAD - 8, 8*CS + 16, 9*CS + 16);
    ctx.fillStyle = bg; ctx.fillRect(PAD, PAD, 8*CS, 9*CS);

    // 将军闪烁
    let ca = 0;
    if (checkT0 > 0) {
      const e = now - checkT0;
      ca = e < 2000 ? 0.3 + 0.3 * Math.sin(e / 120) : 0;
      if (e >= 2000) checkT0 = 0;
    }

    const gc = ca > 0 ? `rgba(${dark?'255,100,100':'180,50,50'},${0.8+ca*0.5})` : (dark?'#D4A853':'#8B6914');
    ctx.strokeStyle = gc; ctx.lineWidth = 1 + (ca > 0 ? 1.5 : 0);

    // 网格
    for (let rr = 0; rr < 10; rr++) {
      const y = PAD + rr * CS;
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(PAD + 8*CS, y); ctx.stroke();
    }
    for (let cc = 0; cc < 9; cc++) {
      const x = PAD + cc * CS;
      if (cc === 0 || cc === 8) {
        ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, PAD + 9*CS); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, PAD + 4*CS); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, PAD + 5*CS); ctx.lineTo(x, PAD + 9*CS); ctx.stroke();
      }
    }
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(PAD+3*CS, PAD); ctx.lineTo(PAD+5*CS, PAD+2*CS); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD+5*CS, PAD); ctx.lineTo(PAD+3*CS, PAD+2*CS); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD+3*CS, PAD+7*CS); ctx.lineTo(PAD+5*CS, PAD+9*CS); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD+5*CS, PAD+7*CS); ctx.lineTo(PAD+3*CS, PAD+9*CS); ctx.stroke();

    // 楚河汉界
    ctx.font = 'bold 22px "KaiTi", serif'; ctx.fillStyle = gc;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('楚  河', PAD + 1.5*CS, PAD + 4.5*CS);
    ctx.fillText('汉  界', PAD + 6.5*CS, PAD + 4.5*CS);

    // 将军⚡
    if (ca > 0) {
      const kr = gameStatus.startsWith('red_check') ? 9 : 0;
      const p = 0.7 + 0.3 * Math.sin(now / 150);
      ctx.font = `bold ${Math.round(30*p)}px sans-serif`;
      ctx.fillStyle = `rgba(255,50,50,${0.8*p})`;
      ctx.fillText('⚡', PAD + 4*CS, PAD + kr*CS - 45);
    }

    // 最后一步
    if (lastMoveFrom && lastMoveTo) {
      ctx.fillStyle = dark ? 'rgba(240,185,11,0.25)' : 'rgba(180,140,20,0.35)';
      [lastMoveFrom, lastMoveTo].forEach(p => {
        ctx.fillRect(PAD + p.col*CS - CS/2, PAD + p.row*CS - CS/2, CS, CS);
      });
    }

    // 提示
    if (hintMove && !anim) {
      const fx = PAD + hintMove.from.col * CS;
      const fy = PAD + hintMove.from.row * CS;
      const tx = PAD + hintMove.to.col * CS;
      const ty = PAD + hintMove.to.row * CS;
      const p = 0.7 + 0.3 * Math.sin(now / 400);

      ctx.shadowColor = '#3B82F6'; ctx.shadowBlur = 18*p;
      ctx.fillStyle = 'rgba(59,130,246,0.45)';
      ctx.fillRect(fx - CS/2, fy - CS/2, CS, CS);
      ctx.shadowBlur = 0;

      // 箭头
      const dx = tx - fx, dy = ty - fy, dist = Math.sqrt(dx*dx+dy*dy);
      if (dist > 5) {
        const nx = dx/dist, ny = dy/dist;
        const sxx = fx + nx*(R+4), syy = fy + ny*(R+4), exx = tx - nx*(R+4), eyy = ty - ny*(R+4);
        ctx.beginPath(); ctx.moveTo(sxx, syy); ctx.lineTo(exx, eyy);
        ctx.strokeStyle = dark ? '#60A5FA' : '#3B82F6'; ctx.lineWidth = 3;
        ctx.setLineDash([6,4]); ctx.stroke(); ctx.setLineDash([]);
        const ang = Math.atan2(dy, dx), as = 12;
        ctx.beginPath(); ctx.moveTo(exx, eyy);
        ctx.lineTo(exx - as*Math.cos(ang-0.6), eyy - as*Math.sin(ang-0.6));
        ctx.lineTo(exx - as*Math.cos(ang+0.6), eyy - as*Math.sin(ang+0.6));
        ctx.closePath(); ctx.fillStyle = dark ? '#60A5FA' : '#3B82F6'; ctx.fill();
      }

      ctx.beginPath(); ctx.arc(tx, ty, 16+4*p, 0, Math.PI*2);
      ctx.fillStyle = dark ? 'rgba(34,197,94,0.55)' : 'rgba(34,197,94,0.6)'; ctx.fill();
      ctx.strokeStyle = dark ? '#4ADE80' : '#16A34A'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = dark ? '#4ADE80' : '#16A34A'; ctx.textAlign = 'center';
      ctx.fillText('推荐', tx, ty - 32);
      ctx.fillText('走这', tx, ty + 32);
    }

    // 选中
    if (selectedRow !== null && selectedCol !== null) {
      const sx = PAD + selectedCol * CS;
      const sy = PAD + selectedRow * CS;
      const p = 0.7 + 0.3 * Math.sin(now / 300);
      ctx.fillStyle = dark ? `rgba(240,185,11,${0.45*p})` : `rgba(200,150,20,${0.5*p})`;
      ctx.fillRect(sx - CS/2, sy - CS/2, CS, CS);

      for (const m of legalMoves) {
        const mx = PAD + m.col * CS;
        const my = PAD + m.row * CS;
        const cap = getPiece(board, m.row, m.col) !== null;
        if (cap) {
          ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI*2);
          ctx.strokeStyle = dark ? 'rgba(239,68,68,0.85)' : 'rgba(220,38,38,0.75)';
          ctx.lineWidth = 2.5; ctx.setLineDash([5,3]); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
        }
        ctx.beginPath(); ctx.arc(mx, my, cap ? 7 : 10, 0, Math.PI*2);
        ctx.fillStyle = dark ? 'rgba(72,187,120,0.85)' : 'rgba(72,187,120,0.75)';
        ctx.fill();
      }
    }

    // 棋子
    const skip = anim ? { x: anim.sx, y: anim.sy } : null;
    for (let rr = 0; rr < 10; rr++) {
      for (let cc = 0; cc < 9; cc++) {
        const p = getPiece(board, rr, cc);
        if (!p) continue;
        const px = PAD + cc * CS;
        const py = PAD + rr * CS;
        if (skip && Math.abs(px - skip.x) < 1 && Math.abs(py - skip.y) < 1) continue;
        drawP(ctx, px, py, p.type, p.side, 1);
      }
    }

    // 动画棋子
    if (anim) {
      const el = now - anim.t0;
      const t = Math.min(el / 220, 1);
      const e = 1 + 2.4*(t-1)*(t-1)*(t-1) + 1.7*(t-1)*(t-1);
      const x = anim.sx + (anim.ex - anim.sx) * e;
      const y = anim.sy + (anim.ey - anim.sy) * e;
      drawP(ctx, x, y, anim.piece.type, anim.piece.side, 1 + 0.06*Math.sin(t*Math.PI));
      if (t >= 1) anim = null;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, []);

  // 主循环
  useEffect(() => {
    let ok = true;
    const loop = () => { if (ok) { render(); rafRef.current = requestAnimationFrame(loop); } };
    rafRef.current = requestAnimationFrame(loop);
    return () => { ok = false; cancelAnimationFrame(rafRef.current); };
  }, [render]);

  // 动画触发
  useEffect(() => {
    const unsub = storeRef.current.subscribe((st, prev) => {
      if (st.moveHistory.length > prev.moveHistory.length && st.moveHistory.length > 0) {
        const m = st.moveHistory[st.moveHistory.length - 1];
        anim = {
          piece: m.piece,
          sx: PAD + m.from.col * CS, sy: PAD + m.from.row * CS,
          ex: PAD + m.to.col * CS, ey: PAD + m.to.row * CS,
          t0: performance.now(),
        };
      }
      if ((st.gameStatus === 'red_check' || st.gameStatus === 'black_check') &&
          !(prev.gameStatus === 'red_check' || prev.gameStatus === 'black_check')) {
        checkT0 = performance.now();
      }
    });
    return unsub;
  }, []);

  // 全屏
  const toggleFs = useCallback(() => {
    if (!fs) { containerRef.current?.requestFullscreen().catch(() => {}); setFs(true); }
    else { document.exitFullscreen().catch(() => {}); setFs(false); }
  }, [fs]);

  useEffect(() => {
    const h = () => { if (!document.fullscreenElement) setFs(false); };
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  return (
    <div ref={containerRef}
      className={`relative group ${fs ? 'flex items-center justify-center bg-[#2C1810] dark:bg-[#0D0D1A] min-h-screen p-4' : ''}`}
    >
      <button onClick={toggleFs}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-lg bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm cursor-pointer"
        title={fs ? '退出全屏 (Esc)' : '全屏'}
      >{fs ? '⊠' : '⛶'}</button>
      <canvas ref={canvasRef} onClick={onClick}
        className="rounded-xl shadow-xl cursor-pointer select-none block"
        style={{ maxWidth: fs ? 'none' : Math.min(BW, 520) + 'px', width: '100%' }}
      />
    </div>
  );
}
