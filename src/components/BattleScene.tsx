import { useEffect, useRef } from 'react';
import { COS, UNITS } from '../game/data';
import { drawUnit, terrainSky } from '../game/draw';
import { sfx } from '../game/audio';
import type { AttackResult, Team, UnitType, Weather } from '../game/types';

interface Props {
  r: AttackResult;
  cos: [string, string];
  speed: number;
  weather: Weather;
  onDone: () => void;
}

const RAPID: UnitType[] = ['infantry', 'aa', 'recon', 'drone', 'gundrone'];
const BIG: UnitType[] = ['battleship', 'cruiser', 'sub', 'bomber', 'heavy', 'fighter'];
const count = (t: UnitType, hp: number) => (hp <= 0 ? 0 : BIG.includes(t) ? Math.ceil(hp / 34) : Math.ceil(hp / 20));
const SLOTS = [[0.58, 0.02], [0.34, 0.08], [0.8, 0.12], [0.48, 0.2], [0.22, 0.24]];

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; s: number; g: number }

export default function BattleScene({ r, cos, speed, weather, onDone }: Props) {
  const cv = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const c = cv.current!;
    const g = c.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.min(window.innerWidth, 820);
    const H = Math.min(340, Math.max(220, window.innerHeight * 0.42));
    c.width = W * dpr; c.height = H * dpr;
    c.style.width = W + 'px'; c.style.height = H + 'px';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const k = 1 / speed;
    const hasCounter = r.counter > 0;
    const T = {
      fire1: 700 * k, hit1: 1250 * k, drain1: 1750 * k,
      fire2: 2250 * k, hit2: 2800 * k, drain2: 3300 * k,
    };
    const end = (hasCounter ? T.drain2 : T.drain1) + 1000 * k;
    const parts: P[] = [];
    let shake = 0;
    const fired = { a: false, b: false, h1: false, h2: false };
    const alive = { L: count(r.aType, r.aBefore), R: count(r.dType, r.dBefore) };
    const PW = W / 2;
    const us = H * 0.3;
    const groundY = H * 0.62;

    const slotPos = (side: 0 | 1, i: number, type: UnitType) => {
      const [sx, sy] = SLOTS[i];
      const air = UNITS[type].cat === 'air';
      const x = side === 0 ? PW * sx * 0.95 : W - PW * sx * 0.95;
      const y = groundY + sy * H * 0.9 - (air ? H * 0.22 : 0);
      return { x, y };
    };
    const explode = (x: number, y: number, n = 18) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 4;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, life: 0, max: 30 + Math.random() * 30, c: ['#fde047', '#fb923c', '#ef4444', '#78716c'][i % 4], s: 3 + Math.random() * 5, g: 0.08 });
      }
    };
    const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));

    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const e = now - t0;
      if (e >= end && !doneRef.current) { doneRef.current = true; onDone(); return; }
      // hp
      const aHp = hasCounter ? lerp(r.aBefore, r.aAfter, (e - T.hit2) / (T.drain2 - T.hit2)) : r.aBefore;
      const dHp = lerp(r.dBefore, r.dAfter, (e - T.hit1) / (T.drain1 - T.hit1));
      // sounds & events
      if (!fired.a && e >= T.fire1) { fired.a = true; (RAPID.includes(r.aType) ? sfx.gun : sfx.shot)(); }
      if (!fired.h1 && e >= T.hit1) { fired.h1 = true; shake = 10; sfx.hit(); }
      if (hasCounter && !fired.b && e >= T.fire2) { fired.b = true; (RAPID.includes(r.dType) ? sfx.gun : sfx.shot)(); }
      if (hasCounter && !fired.h2 && e >= T.hit2) { fired.h2 = true; shake = 8; sfx.hit(); }
      const nL = count(r.aType, aHp), nR = count(r.dType, dHp);
      while (alive.R > nR) { alive.R--; const p = slotPos(1, alive.R, r.dType); explode(p.x, p.y - us * 0.2, 26); shake = 14; sfx.boom(); }
      while (alive.L > nL) { alive.L--; const p = slotPos(0, alive.L, r.aType); explode(p.x, p.y - us * 0.2, 26); shake = 14; sfx.boom(); }

      g.save();
      g.clearRect(0, 0, W, H);
      if (shake > 0) { g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.88; if (shake < 0.5) shake = 0; }
      // panels
      for (const side of [0, 1] as const) {
        const terr = side === 0 ? r.aTerrain : r.dTerrain;
        const [s1, s2, gr] = terrainSky(terr);
        const x0 = side === 0 ? 0 : PW;
        const grad = g.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, weather === 'sand' ? '#d6a35c' : weather === 'rain' ? '#64748b' : weather === 'snow' ? '#cbd5e1' : s1);
        grad.addColorStop(0.6, s2);
        g.fillStyle = grad; g.fillRect(x0, 0, PW, H);
        g.fillStyle = gr; g.fillRect(x0, groundY - us * 0.05, PW, H);
        g.fillStyle = 'rgba(0,0,0,0.12)';
        for (let i = 0; i < 6; i++) g.fillRect(x0 + ((i * 97 + (side ? 40 : 0)) % PW), groundY + 10 + ((i * 37) % (H - groundY - 10)), 18, 3);
        if (terr === 'forest') {
          for (let i = 0; i < 4; i++) { g.fillStyle = '#1b5e20'; g.beginPath(); g.arc(x0 + PW * (0.1 + i * 0.27), groundY - us * 0.25, us * 0.35, 0, Math.PI * 2); g.fill(); }
        }
        if (terr === 'mountain') {
          g.fillStyle = '#6d4c41'; g.beginPath(); g.moveTo(x0, groundY); g.lineTo(x0 + PW * 0.35, groundY - H * 0.35); g.lineTo(x0 + PW * 0.7, groundY); g.fill();
        }
        if (['city', 'hq', 'base'].includes(terr)) {
          g.fillStyle = 'rgba(55,65,81,0.6)';
          for (let i = 0; i < 4; i++) g.fillRect(x0 + PW * (0.05 + i * 0.25), groundY - H * (0.18 + (i % 2) * 0.1), PW * 0.15, H * 0.3);
        }
      }
      // divider
      g.fillStyle = '#0f172a'; g.fillRect(PW - 3, 0, 6, H);
      g.fillStyle = '#fbbf24'; g.fillRect(PW - 1, 0, 2, H);
      // weather fx
      if (weather === 'rain' || weather === 'snow') {
        g.strokeStyle = weather === 'rain' ? 'rgba(200,220,255,0.6)' : 'rgba(255,255,255,0.9)';
        g.lineWidth = weather === 'rain' ? 1.5 : 3;
        for (let i = 0; i < 40; i++) {
          const x = (i * 53 + e * (weather === 'rain' ? 0.3 : 0.05)) % W;
          const y = (i * 91 + e * (weather === 'rain' ? 0.9 : 0.12)) % H;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x - (weather === 'rain' ? 4 : 1), y + (weather === 'rain' ? 12 : 2)); g.stroke();
        }
      }
      // units
      const recoilL = e > T.fire1 && e < T.fire1 + 150 * k ? -4 : 0;
      const recoilR = hasCounter && e > T.fire2 && e < T.fire2 + 150 * k ? 4 : 0;
      const slideL = Math.min(1, e / (400 * k));
      for (let i = alive.L - 1; i >= 0; i--) {
        const p = slotPos(0, i, r.aType);
        drawUnit(g, r.aType, p.x - (1 - slideL) * PW + recoilL, p.y - us * 0.2, us, r.aTeam, 1, e + i * 90);
      }
      for (let i = alive.R - 1; i >= 0; i--) {
        const p = slotPos(1, i, r.dType);
        const flash = e > T.hit1 && e < T.hit1 + 120 * k;
        drawUnit(g, r.dType, p.x + (1 - slideL) * PW + recoilR, p.y - us * 0.2, us, r.dTeam, -1, e + i * 90, flash);
      }
      // projectiles
      const shots = (from: 0 | 1, n: number, type: UnitType, tType: UnitType, tAlive: number, tFire: number, tHit: number, indirect: boolean) => {
        if (e < tFire || e > tHit + 60 || n <= 0) return;
        for (let i = 0; i < n; i++) {
          const st = tFire + i * 50 * k;
          const prog = (e - st) / (tHit - tFire - 50 * k * (n - 1) + 1);
          if (prog < 0 || prog > 1) continue;
          const a = slotPos(from, i, type);
          const tb = slotPos((1 - from) as 0 | 1, i % Math.max(1, tAlive), tType);
          const sx = a.x + (from === 0 ? us * 0.45 : -us * 0.45), sy = a.y - us * 0.3;
          const tx = tb.x, ty = tb.y - us * 0.2;
          let x = sx + (tx - sx) * prog, y = sy + (ty - sy) * prog;
          if (indirect) {
            if (from === 0 && prog < 0.5) { x = sx + (PW - sx) * prog * 2; y = sy - (H * 0.9) * prog * 2; }
            else { const q = (prog - 0.5) * 2; x = tx + (from === 0 ? -1 : 1) * 40 * (1 - q); y = -20 + (ty + 20) * q; }
          } else y -= Math.sin(prog * Math.PI) * 10;
          if (prog < 0.12) { g.fillStyle = '#fef08a'; g.beginPath(); g.arc(sx, sy, us * 0.12, 0, Math.PI * 2); g.fill(); }
          const rapid = RAPID.includes(type);
          g.fillStyle = rapid ? '#fde047' : '#1f2937';
          g.strokeStyle = '#fbbf24'; g.lineWidth = 2;
          if (rapid) { g.fillRect(x - 6, y - 1, 12, 3); g.fillRect(x - 20, y + 5, 10, 2); }
          else { g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = 'rgba(200,200,200,0.5)'; g.beginPath(); g.arc(x - (from === 0 ? 10 : -10), y + 2, 4, 0, Math.PI * 2); g.fill(); }
          if (prog > 0.92) explode(tx + (Math.random() - 0.5) * 20, ty, 4);
        }
      };
      shots(0, count(r.aType, r.aBefore), r.aType, r.dType, Math.max(1, alive.R), T.fire1, T.hit1, r.indirect);
      if (hasCounter) shots(1, count(r.dType, r.dAfter), r.dType, r.aType, Math.max(1, alive.L), T.fire2, T.hit2, false);
      // particles
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life++;
        if (p.life > p.max) { parts.splice(i, 1); continue; }
        g.globalAlpha = 1 - p.life / p.max;
        g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.s * (1 - p.life / p.max * 0.5), 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
      g.restore();
      // HUD bars
      const bar = (side: 0 | 1, team: Team, type: UnitType, hp: number, coId: string) => {
        const x0 = side === 0 ? 10 : W - 10 - Math.min(260, PW - 20);
        const bw = Math.min(260, PW - 20);
        g.fillStyle = 'rgba(15,23,42,0.85)'; g.beginPath(); g.roundRect(x0, 10, bw, 46, 8); g.fill();
        g.fillStyle = team === 0 ? '#60a5fa' : '#f87171';
        g.font = 'bold 13px Oxanium, system-ui, sans-serif'; g.textBaseline = 'top';
        g.textAlign = side === 0 ? 'left' : 'right';
        g.fillText(`${COS[coId].name} · ${UNITS[type].name}`, side === 0 ? x0 + 10 : x0 + bw - 10, 16);
        g.fillStyle = '#334155'; g.fillRect(x0 + 10, 36, bw - 70, 10);
        const pct = Math.max(0, hp) / 100;
        g.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#facc15' : '#ef4444';
        g.fillRect(x0 + 10, 36, (bw - 70) * pct, 10);
        g.fillStyle = '#fff'; g.font = 'bold 18px Oxanium, system-ui, sans-serif'; g.textAlign = 'right';
        g.fillText(String(Math.ceil(Math.max(0, hp) / 10)), x0 + bw - 12, 31);
      };
      bar(0, r.aTeam, r.aType, aHp, cos[r.aTeam]);
      bar(1, r.dTeam, r.dType, dHp, cos[r.dTeam]);
      // damage pop
      g.textAlign = 'center'; g.font = '900 30px Oxanium, system-ui, sans-serif';
      if (e > T.hit1 && e < T.hit1 + 1300 * k) {
        const q = (e - T.hit1) / (1300 * k);
        g.globalAlpha = 1 - q; g.fillStyle = '#fde047'; g.strokeStyle = '#0f172a'; g.lineWidth = 5;
        const txt = r.dKilled ? 'DESTROYED!' : r.bossPhaseBreak ? 'SHIELD PHASE BROKEN!' : `-${r.dmg}%`;
        g.strokeText(txt, W * 0.75, H * 0.38 - q * 30); g.fillText(txt, W * 0.75, H * 0.38 - q * 30);
      }
      if (hasCounter && e > T.hit2 && e < T.hit2 + 1300 * k) {
        const q = (e - T.hit2) / (1300 * k);
        g.globalAlpha = 1 - q; g.fillStyle = '#fca5a5'; g.strokeStyle = '#0f172a'; g.lineWidth = 5;
        const txt = r.aKilled ? 'DESTROYED!' : `-${r.counter}%`;
        g.strokeText(txt, W * 0.25, H * 0.38 - q * 30); g.fillText(txt, W * 0.25, H * 0.38 - q * 30);
      }
      g.globalAlpha = 1;
      raf = requestAnimationFrame(safeFrame);
    };
    const safeFrame = (now: number) => {
      try { frame(now); } catch (err) {
        console.error('battle scene error', err);
        if (!doneRef.current) { doneRef.current = true; onDone(); }
      }
    };
    raf = requestAnimationFrame(safeFrame);
    const skip = (ev: KeyboardEvent) => { ev.preventDefault(); ev.stopPropagation(); if (!doneRef.current) { doneRef.current = true; onDone(); } };
    window.addEventListener('keydown', skip, true);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', skip, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 anim-fade"
      onPointerDown={() => { if (!doneRef.current) { doneRef.current = true; onDone(); } }}
    >
      <div className="relative rounded-xl overflow-hidden border-4 border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.4)] anim-zoom">
        <canvas ref={cv} className="block" />
        <div className="absolute bottom-1 right-2 text-[10px] text-white/70 font-bold tracking-widest">TAP TO SKIP</div>
      </div>
    </div>
  );
}
