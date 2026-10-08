import type { GameState, Owner, Team, TerrainType, UnitType, Weather } from './types';

export const PAL = [
  { main: '#3b82f6', dark: '#1e3a8a', light: '#93c5fd', glow: 'rgba(59,130,246,0.5)' },
  { main: '#ef4444', dark: '#7f1d1d', light: '#fca5a5', glow: 'rgba(239,68,68,0.5)' },
];
const OWNER_COL = (o: Owner) => (o === 0 ? '#60a5fa' : o === 1 ? '#f87171' : '#e5e7eb');
const OWNER_DARK = (o: Owner) => (o === 0 ? '#1d4ed8' : o === 1 ? '#b91c1c' : '#9ca3af');

function hash(x: number, y: number, k = 0) {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const GRASS = { clear: '#7cb342', rain: '#5f9a3a', snow: '#dfe9f2', sand: '#c9b072' } as Record<Weather, string>;
const GRASS2 = { clear: '#8bc34a', rain: '#6aa843', snow: '#eef4fa', sand: '#d6be80' } as Record<Weather, string>;

function isRoadish(t: TerrainType) { return t === 'road' || t === 'bridge' || t === 'city' || t === 'base' || t === 'hq' || t === 'airport' || t === 'port' || t === 'tower'; }
function isWaterish(t: TerrainType) { return t === 'river' || t === 'sea' || t === 'bridge' || t === 'reef' || t === 'shoal'; }

export function drawTerrainLayer(s: GameState, ts: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = s.w * ts; c.height = s.h * ts;
  const g = c.getContext('2d')!;
  const wx = s.weather;
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const t = s.tiles[y][x].t;
    const px = x * ts, py = y * ts;
    const nb = (dx: number, dy: number): TerrainType | null => {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= s.w || ny >= s.h) return null;
      return s.tiles[ny][nx].t;
    };
    // base
    if (t === 'sea' || t === 'reef') {
      g.fillStyle = wx === 'snow' ? '#2a5a9a' : '#1f5fae';
      g.fillRect(px, py, ts, ts);
      g.strokeStyle = 'rgba(255,255,255,0.18)';
      g.lineWidth = Math.max(1, ts / 28);
      for (let i = 0; i < 2; i++) {
        const yy = py + ts * (0.3 + i * 0.4) + hash(x, y, i) * 4;
        const xx = px + ts * 0.15 + hash(x, y, i + 3) * ts * 0.4;
        g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + ts * 0.12, yy - ts * 0.08, xx + ts * 0.25, yy); g.stroke();
      }
      // shore edges
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const n = nb(dx, dy);
        if (n && !isWaterish(n) && n !== 'port') {
          g.fillStyle = '#e8d39a';
          const b = ts * 0.12;
          if (dx === 1) g.fillRect(px + ts - b, py, b, ts);
          if (dx === -1) g.fillRect(px, py, b, ts);
          if (dy === 1) g.fillRect(px, py + ts - b, ts, b);
          if (dy === -1) g.fillRect(px, py, ts, b);
        }
      }
      if (t === 'reef') {
        g.fillStyle = '#5b6b7a';
        for (let i = 0; i < 4; i++) {
          g.beginPath();
          g.arc(px + ts * (0.25 + hash(x, y, i) * 0.5), py + ts * (0.25 + hash(x, y, i + 7) * 0.5), ts * (0.07 + hash(x, y, i + 2) * 0.06), 0, Math.PI * 2);
          g.fill();
        }
      }
      continue;
    }
    if (t === 'shoal') {
      g.fillStyle = '#e8d39a'; g.fillRect(px, py, ts, ts);
      g.fillStyle = 'rgba(31,95,174,0.35)';
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const n = nb(dx, dy);
        if (n === 'sea' || n === 'reef') {
          const b = ts * 0.25;
          if (dx === 1) g.fillRect(px + ts - b, py, b, ts);
          if (dx === -1) g.fillRect(px, py, b, ts);
          if (dy === 1) g.fillRect(px, py + ts - b, ts, b);
          if (dy === -1) g.fillRect(px, py, ts, b);
        }
      }
      continue;
    }
    g.fillStyle = (x + y) % 2 ? GRASS[wx] : GRASS2[wx];
    g.fillRect(px, py, ts, ts);
    g.fillStyle = 'rgba(0,0,0,0.06)';
    for (let i = 0; i < 3; i++) g.fillRect(px + hash(x, y, i) * ts, py + hash(x, y, i + 9) * ts, ts / 16, ts / 10);

    if (t === 'road' || t === 'bridge') {
      const rw = ts * 0.42;
      const o = (ts - rw) / 2;
      if (t === 'bridge') {
        g.fillStyle = '#4fa3e0';
        g.fillRect(px, py, ts, ts);
      }
      g.fillStyle = t === 'bridge' ? '#a1887f' : wx === 'snow' ? '#b8c2cc' : '#9e9e9e';
      g.fillRect(px + o, py + o, rw, rw);
      const conn = (n: TerrainType | null) => n && (isRoadish(n));
      if (conn(nb(1, 0))) g.fillRect(px + o, py + o, ts - o, rw);
      if (conn(nb(-1, 0))) g.fillRect(px, py + o, o + rw, rw);
      if (conn(nb(0, 1))) g.fillRect(px + o, py + o, rw, ts - o);
      if (conn(nb(0, -1))) g.fillRect(px + o, py, rw, o + rw);
      if (t === 'bridge') {
        g.strokeStyle = '#6d4c41'; g.lineWidth = Math.max(1, ts / 24);
        g.strokeRect(px + o, py + 1, rw, ts - 2);
      }
      continue;
    }
    if (t === 'river') {
      const rw = ts * 0.5, o = (ts - rw) / 2;
      g.fillStyle = '#4fa3e0';
      g.fillRect(px + o, py + o, rw, rw);
      const conn = (n: TerrainType | null) => n && (n === 'river' || n === 'bridge' || n === 'sea' || n === 'shoal');
      if (conn(nb(1, 0))) g.fillRect(px + o, py + o, ts - o, rw);
      if (conn(nb(-1, 0))) g.fillRect(px, py + o, o + rw, rw);
      if (conn(nb(0, 1))) g.fillRect(px + o, py + o, rw, ts - o);
      if (conn(nb(0, -1))) g.fillRect(px + o, py, rw, o + rw);
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.fillRect(px + ts * 0.4, py + ts * 0.45, ts * 0.2, ts / 20);
      continue;
    }
    if (t === 'forest') {
      for (const [ox, oy, r] of [[0.3, 0.38, 0.2], [0.7, 0.4, 0.19], [0.5, 0.68, 0.22]]) {
        const cx = px + ox * ts, cy = py + oy * ts;
        g.fillStyle = '#5d4037'; g.fillRect(cx - ts * 0.03, cy + r * ts * 0.6, ts * 0.06, ts * 0.12);
        g.fillStyle = wx === 'snow' ? '#2f6b45' : '#2e7d32';
        g.beginPath(); g.arc(cx, cy, r * ts, 0, Math.PI * 2); g.fill();
        g.fillStyle = wx === 'snow' ? '#ffffff' : '#43a047';
        g.beginPath(); g.arc(cx - r * ts * 0.3, cy - r * ts * 0.3, r * ts * 0.45, 0, Math.PI * 2); g.fill();
      }
      continue;
    }
    if (t === 'mountain') {
      g.fillStyle = '#795548';
      g.beginPath(); g.moveTo(px + ts * 0.05, py + ts * 0.9); g.lineTo(px + ts * 0.45, py + ts * 0.12); g.lineTo(px + ts * 0.85, py + ts * 0.9); g.fill();
      g.fillStyle = '#8d6e63';
      g.beginPath(); g.moveTo(px + ts * 0.4, py + ts * 0.9); g.lineTo(px + ts * 0.7, py + ts * 0.35); g.lineTo(px + ts * 0.98, py + ts * 0.9); g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.moveTo(px + ts * 0.33, py + ts * 0.34); g.lineTo(px + ts * 0.45, py + ts * 0.12); g.lineTo(px + ts * 0.57, py + ts * 0.34); g.lineTo(px + ts * 0.45, py + ts * 0.29); g.fill();
      continue;
    }
  }
  return c;
}

/** properties drawn dynamically since ownership changes */
export function drawProperty(g: CanvasRenderingContext2D, t: TerrainType, owner: Owner, px: number, py: number, ts: number, time: number, capture: number) {
  const col = OWNER_COL(owner), dk = OWNER_DARK(owner);
  const u = ts / 64;
  g.save();
  g.translate(px, py);
  g.scale(u, u);
  g.lineWidth = 2;
  g.strokeStyle = 'rgba(0,0,0,0.45)';
  if (t === 'city') {
    g.fillStyle = dk; g.fillRect(10, 22, 22, 34); g.strokeRect(10, 22, 22, 34);
    g.fillStyle = col; g.fillRect(30, 12, 24, 44); g.strokeRect(30, 12, 24, 44);
    g.fillStyle = '#fef9c3';
    for (let r = 0; r < 4; r++) for (let c2 = 0; c2 < 2; c2++) g.fillRect(34 + c2 * 10, 17 + r * 9, 6, 5);
    for (let r = 0; r < 3; r++) g.fillRect(15, 28 + r * 9, 12, 4);
  } else if (t === 'base') {
    g.fillStyle = col;
    g.beginPath(); g.moveTo(6, 56); g.lineTo(6, 30); g.lineTo(18, 22); g.lineTo(18, 30); g.lineTo(30, 22); g.lineTo(30, 30); g.lineTo(42, 22); g.lineTo(42, 56); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = dk; g.fillRect(44, 10, 10, 46); g.strokeRect(44, 10, 10, 46);
    g.fillStyle = '#374151'; g.fillRect(16, 40, 18, 16);
    const sm = (time / 900) % 1;
    g.fillStyle = `rgba(200,200,200,${0.6 - sm * 0.6})`;
    g.beginPath(); g.arc(49 + sm * 6, 6 - sm * 10, 4 + sm * 5, 0, Math.PI * 2); g.fill();
  } else if (t === 'airport') {
    g.fillStyle = '#6b7280'; g.fillRect(4, 38, 56, 14);
    g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) g.fillRect(8 + i * 14, 44, 8, 2);
    g.fillStyle = col; g.fillRect(36, 10, 14, 28); g.strokeRect(36, 10, 14, 28);
    g.fillStyle = dk; g.fillRect(32, 6, 22, 8); g.strokeRect(32, 6, 22, 8);
    g.fillStyle = '#a5f3fc'; g.fillRect(34, 8, 18, 4);
  } else if (t === 'port') {
    g.fillStyle = '#1f5fae'; g.fillRect(0, 40, 64, 24);
    g.fillStyle = '#8d6e63'; g.fillRect(4, 36, 56, 8);
    g.fillStyle = col; g.fillRect(8, 16, 20, 20); g.strokeRect(8, 16, 20, 20);
    g.strokeStyle = dk; g.lineWidth = 4;
    g.beginPath(); g.moveTo(42, 36); g.lineTo(42, 8); g.lineTo(60, 8); g.moveTo(58, 8); g.lineTo(58, 22); g.stroke();
  } else if (t === 'hq') {
    g.fillStyle = dk; g.fillRect(8, 28, 48, 28); g.strokeRect(8, 28, 48, 28);
    g.fillStyle = col; g.fillRect(20, 14, 24, 42); g.strokeRect(20, 14, 24, 42);
    g.fillStyle = '#fde047'; g.fillRect(28, 40, 8, 16);
    g.strokeStyle = '#111'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(32, 14); g.lineTo(32, 0); g.stroke();
    const wave = Math.sin(time / 200) * 2;
    g.fillStyle = col;
    g.beginPath(); g.moveTo(32, 0); g.lineTo(46, 3 + wave); g.lineTo(32, 8); g.fill();
    g.fillStyle = '#fef9c3'; for (let i = 0; i < 3; i++) g.fillRect(12, 32 + i * 7, 5, 4), g.fillRect(47, 32 + i * 7, 5, 4);
  } else if (t === 'tower') {
    g.strokeStyle = dk; g.lineWidth = 3;
    g.beginPath(); g.moveTo(18, 58); g.lineTo(32, 8); g.lineTo(46, 58); g.moveTo(23, 40); g.lineTo(41, 40); g.moveTo(27, 24); g.lineTo(37, 24); g.stroke();
    g.fillStyle = col; g.fillRect(14, 52, 36, 8);
    const blink = Math.sin(time / 300) > 0;
    g.fillStyle = blink ? '#fde047' : '#78350f';
    g.beginPath(); g.arc(32, 7, 4, 0, Math.PI * 2); g.fill();
  }
  if (capture < 20) {
    g.fillStyle = 'rgba(0,0,0,0.65)'; g.fillRect(4, 2, 30, 14);
    g.fillStyle = '#fde047'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(capture), 19, 9.5);
  }
  g.restore();
}

/** Draw a unit centered at (cx,cy) in a box of size s. Coordinates internally in a 64-unit space. */
export function drawUnit(g: CanvasRenderingContext2D, type: UnitType, cx: number, cy: number, s: number, team: Team, facing: 1 | -1, time: number, dim = false, shadow = true) {
  const p = PAL[team];
  const k = s / 64;
  g.save();
  g.translate(cx, cy);
  g.scale(k * facing, k);
  const air = ['drone', 'gundrone', 'tcopter', 'bcopter', 'fighter', 'bomber'].includes(type);
  const sea = ['cruiser', 'sub', 'battleship'].includes(type);
  const bob = air ? Math.sin(time / 260) * 2.5 : 0;
  if (shadow && !sea) {
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath(); g.ellipse(0, air ? 24 : 20, air ? 16 : 22, 5, 0, 0, Math.PI * 2); g.fill();
  }
  if (air) g.translate(0, -8 + bob);
  if (dim) g.globalAlpha = 0.55;
  g.lineWidth = 2;
  g.lineJoin = 'round';
  g.strokeStyle = '#0b1020';
  const M = p.main, D = p.dark, L = p.light;
  const rect = (x: number, y: number, w: number, h: number, f: string, r = 2) => {
    g.fillStyle = f; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); g.stroke();
  };
  const circ = (x: number, y: number, r: number, f: string) => { g.fillStyle = f; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke(); };
  const treads = (x: number, y: number, w: number, h: number) => {
    rect(x, y, w, h, '#2b2f3a', h / 2);
    const n = Math.max(3, Math.round(w / 9));
    const off = (time / 60) % 1;
    for (let i = 0; i < n; i++) { g.fillStyle = '#6b7280'; g.beginPath(); g.arc(x + h / 2 + ((i + off * 0) * (w - h)) / (n - 1), y + h / 2, h * 0.28, 0, Math.PI * 2); g.fill(); }
  };
  const wheel = (x: number, y: number, r: number) => { circ(x, y, r, '#1f2937'); g.fillStyle = '#9ca3af'; g.beginPath(); g.arc(x, y, r * 0.4, 0, Math.PI * 2); g.fill(); };
  const soldier = (ox: number, oy: number, heavy: boolean) => {
    const step = Math.sin(time / 180 + ox) * 2;
    rect(ox - 6 + step * 0.3, oy + 6, 5, 12, D, 1);
    rect(ox + 1 - step * 0.3, oy + 6, 5, 12, D, 1);
    rect(ox - 8, oy - 8, 16, 16, M, 4);
    circ(ox, oy - 14, 6, '#f5d0a9');
    g.fillStyle = D; g.beginPath(); g.arc(ox, oy - 15, 7, Math.PI, 0); g.fill(); g.stroke();
    if (heavy) {
      rect(ox - 12, oy - 6, 6, 12, '#4b5563', 2);
      rect(ox - 10, oy - 16, 30, 6, '#4b5563', 2);
      g.fillStyle = '#111'; g.fillRect(ox + 18, oy - 15, 3, 4);
    } else {
      g.strokeStyle = '#111'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(ox - 2, oy - 2); g.lineTo(ox + 16, oy - 4); g.stroke();
      g.lineWidth = 2; g.strokeStyle = '#0b1020';
    }
  };
  switch (type) {
    case 'infantry': soldier(-6, 2, false); soldier(8, 6, false); break;
    case 'mech': soldier(0, 4, true); break;
    case 'recon':
      rect(-22, -4, 44, 14, M, 4); rect(-8, -14, 18, 12, L, 3);
      g.fillStyle = '#a5f3fc'; g.fillRect(2, -12, 6, 8);
      rect(-4, -20, 12, 4, '#374151', 1);
      wheel(-13, 12, 7); wheel(13, 12, 7); break;
    case 'apc':
      treads(-24, 8, 48, 12);
      g.fillStyle = M; g.beginPath(); g.moveTo(-22, 8); g.lineTo(-22, -10); g.lineTo(12, -10); g.lineTo(24, 2); g.lineTo(24, 8); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = L; g.fillRect(-16, -6, 8, 6); g.fillRect(-4, -6, 8, 6);
      break;
    case 'tank':
      treads(-24, 8, 48, 12);
      rect(-22, -4, 44, 13, M, 3);
      rect(-12, -14, 22, 12, L, 5);
      rect(8, -11, 24, 5, D, 1);
      g.fillStyle = D; g.fillRect(-6, -18, 6, 4);
      break;
    case 'heavy':
      treads(-28, 8, 56, 14);
      rect(-26, -6, 52, 15, D, 3);
      rect(-24, -5, 48, 6, M, 2);
      rect(-14, -20, 28, 15, M, 6);
      rect(12, -16, 22, 7, '#1f2937', 2);
      rect(30, -17, 6, 9, '#1f2937', 1);
      break;
    case 'artillery':
      treads(-22, 8, 44, 12);
      rect(-20, -4, 36, 13, M, 3);
      g.save(); g.translate(-2, -6); g.rotate(-0.6);
      rect(-6, -5, 40, 6, D, 2); g.restore();
      rect(-14, -12, 16, 10, L, 3);
      break;
    case 'rockets':
      wheel(-16, 13, 7); wheel(0, 13, 7); wheel(16, 13, 7);
      rect(-26, -2, 52, 10, D, 2);
      rect(12, -14, 14, 13, M, 3); g.fillStyle = '#a5f3fc'; g.fillRect(18, -11, 6, 6);
      g.save(); g.translate(-10, -4); g.rotate(-0.45);
      rect(-14, -12, 30, 14, M, 2);
      g.fillStyle = '#fde047'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { g.beginPath(); g.arc(14, -8 + j * 6 + i * 0, 2.5, 0, Math.PI * 2); g.fill(); }
      g.restore();
      break;
    case 'aa':
      treads(-22, 8, 44, 12);
      rect(-20, -4, 40, 13, M, 3);
      rect(-10, -14, 18, 12, L, 4);
      g.save(); g.translate(2, -10); g.rotate(-0.7);
      rect(0, -5, 26, 3, '#1f2937', 1); rect(0, 1, 26, 3, '#1f2937', 1); g.restore();
      break;
    case 'missiles':
      wheel(-14, 13, 7); wheel(12, 13, 7);
      rect(-24, -2, 48, 10, D, 2);
      rect(12, -14, 12, 13, M, 3);
      g.save(); g.translate(-8, -6); g.rotate(-0.5);
      rect(-14, -10, 30, 6, '#f3f4f6', 3); rect(-14, -2, 30, 6, '#f3f4f6', 3);
      g.fillStyle = '#ef4444'; g.fillRect(14, -10, 4, 6); g.fillRect(14, -2, 4, 6);
      g.restore();
      break;
    case 'drone': {
      const spin = time / 30;
      g.strokeStyle = D; g.lineWidth = 4;
      g.beginPath(); g.moveTo(-18, -8); g.lineTo(18, 8); g.moveTo(-18, 8); g.lineTo(18, -8); g.stroke();
      g.lineWidth = 2; g.strokeStyle = '#0b1020';
      for (const [rx, ry] of [[-18, -8], [18, 8], [-18, 8], [18, -8]]) {
        g.fillStyle = 'rgba(220,220,220,0.5)'; g.beginPath(); g.ellipse(rx, ry, 10 * Math.abs(Math.cos(spin + rx)), 3, 0, 0, Math.PI * 2); g.fill();
      }
      rect(-9, -6, 18, 12, M, 5);
      circ(5, 0, 3, '#fde047');
      break;
    }
    case 'gundrone': {
      const spin = time / 25;
      // arms
      g.strokeStyle = '#1f2937'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(-20, -10); g.lineTo(20, 6); g.moveTo(-20, 6); g.lineTo(20, -10); g.stroke();
      g.lineWidth = 2; g.strokeStyle = '#0b1020';
      for (const [rx, ry] of [[-20, -10], [20, 6], [-20, 6], [20, -10]]) {
        circ(rx, ry, 3, D);
        g.fillStyle = 'rgba(220,220,220,0.55)';
        g.beginPath(); g.ellipse(rx, ry - 3, 11 * Math.abs(Math.cos(spin + rx * 0.1)), 2.5, 0, 0, Math.PI * 2); g.fill();
      }
      // armored body
      g.fillStyle = M; g.beginPath(); g.moveTo(-12, -8); g.lineTo(10, -8); g.lineTo(16, -2); g.lineTo(10, 6); g.lineTo(-12, 6); g.closePath(); g.fill(); g.stroke();
      rect(-8, -6, 10, 4, L, 1);
      circ(11, -2, 2.5, '#ef4444');
      // twin machine guns underneath
      rect(-6, 6, 10, 5, '#374151', 1);
      rect(2, 7, 22, 2.5, '#111827', 1);
      rect(2, 11, 22, 2.5, '#111827', 1);
      rect(-4, 13, 6, 6, '#a16207', 1); // ammo box
      // muzzle flash flicker
      if (Math.sin(time / 45) > 0.55) {
        g.fillStyle = '#fde047';
        g.beginPath(); g.moveTo(24, 8); g.lineTo(31, 6); g.lineTo(28, 9); g.lineTo(33, 12); g.lineTo(24, 12); g.closePath(); g.fill();
      }
      break;
    }
    case 'tcopter':
    case 'bcopter': {
      const tc = type === 'tcopter';
      rect(-30, -6, 26, 5, D, 2);
      rect(-34, -12, 6, 10, D, 2);
      if (tc) rect(-12, -12, 34, 20, M, 9); else rect(-10, -10, 28, 15, M, 7);
      g.fillStyle = '#a5f3fc'; g.beginPath(); g.ellipse(tc ? 14 : 12, tc ? -4 : -3, 6, 5, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#111'; g.beginPath(); g.moveTo(-8, 12); g.lineTo(16, 12); g.moveTo(-2, 8); g.lineTo(-2, 12); g.moveTo(10, 8); g.lineTo(10, 12); g.stroke();
      g.strokeStyle = '#0b1020';
      if (!tc) { rect(-4, 4, 16, 4, '#374151', 1); }
      rect(2, -16, 4, 5, '#374151', 1);
      const rw = 30 * Math.abs(Math.cos(time / 40));
      g.fillStyle = 'rgba(30,30,30,0.7)'; g.fillRect(4 - rw, -18, rw * 2, 3);
      break;
    }
    case 'fighter':
      g.fillStyle = M; g.beginPath(); g.moveTo(32, 0); g.lineTo(10, -5); g.lineTo(-26, -5); g.lineTo(-30, 4); g.lineTo(10, 5); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = D; g.beginPath(); g.moveTo(6, 2); g.lineTo(-14, 16); g.lineTo(-20, 16); g.lineTo(-10, 2); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-18, -4); g.lineTo(-28, -18); g.lineTo(-32, -18); g.lineTo(-28, -4); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#a5f3fc'; g.beginPath(); g.ellipse(10, -5, 8, 3.5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = `rgba(253,186,116,${0.6 + Math.sin(time / 50) * 0.3})`; g.beginPath(); g.moveTo(-30, -2); g.lineTo(-40, 0); g.lineTo(-30, 3); g.fill();
      break;
    case 'bomber':
      g.fillStyle = M; g.beginPath(); g.moveTo(32, 2); g.quadraticCurveTo(28, -8, 14, -8); g.lineTo(-28, -6); g.lineTo(-32, 6); g.lineTo(14, 8); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = D; g.beginPath(); g.moveTo(10, 0); g.lineTo(-16, 20); g.lineTo(-26, 20); g.lineTo(-12, 0); g.closePath(); g.fill(); g.stroke();
      rect(-10, 8, 12, 6, '#374151', 3);
      g.beginPath(); g.moveTo(-22, -5); g.lineTo(-30, -20); g.lineTo(-34, -20); g.lineTo(-32, -5); g.closePath(); g.fillStyle = D; g.fill(); g.stroke();
      g.fillStyle = '#a5f3fc'; g.fillRect(18, -6, 8, 4);
      break;
    case 'cruiser':
      g.fillStyle = D; g.beginPath(); g.moveTo(-30, 2); g.lineTo(32, 2); g.lineTo(24, 14); g.lineTo(-26, 14); g.closePath(); g.fill(); g.stroke();
      rect(-16, -10, 24, 12, M, 2); rect(-8, -20, 10, 10, L, 2);
      rect(10, -6, 10, 7, M, 2); rect(18, -5, 12, 3, '#1f2937', 1);
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(-28, 14, 54, 2);
      break;
    case 'sub':
      g.fillStyle = D; g.beginPath(); g.ellipse(0, 8, 32, 8, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      rect(-6, -6, 14, 12, M, 3);
      g.strokeStyle = '#111'; g.beginPath(); g.moveTo(4, -6); g.lineTo(4, -14); g.lineTo(9, -14); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(-30, 13, 60, 2);
      break;
    case 'battleship':
      g.fillStyle = D; g.beginPath(); g.moveTo(-32, 0); g.lineTo(34, 0); g.lineTo(26, 14); g.lineTo(-28, 14); g.closePath(); g.fill(); g.stroke();
      rect(-10, -14, 18, 14, M, 2); rect(-4, -24, 8, 10, L, 1);
      rect(12, -6, 12, 7, M, 3); rect(20, -6, 14, 3, '#1f2937', 1);
      rect(-26, -6, 12, 7, M, 3); rect(-14, -6, 12, 3, '#1f2937', 1);
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(-30, 14, 58, 2);
      break;
  }
  g.restore();
}

export function terrainSky(t: TerrainType): [string, string, string] {
  // sky top, sky bottom, ground
  switch (t) {
    case 'sea': case 'reef': return ['#7dd3fc', '#bae6fd', '#1f5fae'];
    case 'shoal': return ['#7dd3fc', '#e0f2fe', '#e8d39a'];
    case 'forest': return ['#86efac', '#bbf7d0', '#2e7d32'];
    case 'mountain': return ['#93c5fd', '#dbeafe', '#8d6e63'];
    case 'river': case 'bridge': return ['#93c5fd', '#dbeafe', '#4fa3e0'];
    case 'road': return ['#93c5fd', '#e0f2fe', '#9e9e9e'];
    case 'city': case 'base': case 'hq': case 'airport': case 'port': case 'tower': return ['#a5b4fc', '#e0e7ff', '#6b7280'];
    default: return ['#93c5fd', '#dbeafe', '#7cb342'];
  }
}
