import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ARMOR_NAMES, CAT_NAMES, COS, MODS, PLAYABLE_ORDER, TERRAIN, TERRAIN_BONUS, UNITS, UNIT_ORDER, WEATHER_INFO, ultimateCost } from '../game/data';
import { ACTS, ACT_INTROS, MISSIONS, REWARDS } from '../game/campaign';
import { RANK_NAMES, SKILLS, rankSlots } from '../game/data';
import { drawUnit } from '../game/draw';
import { sfx } from '../game/audio';
import Portrait from './Portrait';
import COInfo, { PowerExplainer } from './COInfo';
import { UnitIcon } from './GameView';
import type { Category, Dialogue, ModId, SaveData, UnitType, Weather } from '../game/types';
import { deleteSlot, loadSlots, writeSlot, type ResumeSave, type SaveSlot } from '../game/save';

/* ---------------- Title ---------------- */
export function TitleBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    let raf = 0;
    const units: { type: UnitType; x: number; y: number; sp: number; team: 0 | 1; s: number }[] = [];
    const types: UnitType[] = ['tank', 'heavy', 'recon', 'artillery', 'infantry', 'apc', 'rockets', 'aa'];
    const air: UnitType[] = ['fighter', 'bcopter', 'drone', 'bomber'];
    const resize = () => { const d = Math.min(2, window.devicePixelRatio || 1); c.width = innerWidth * d; c.height = innerHeight * d; g.setTransform(d, 0, 0, d, 0, 0); };
    resize();
    addEventListener('resize', resize);
    for (let i = 0; i < 9; i++) {
      const isAir = i % 3 === 0;
      units.push({ type: isAir ? air[i % air.length] : types[i % types.length], x: Math.random() * innerWidth, y: isAir ? 0.18 + Math.random() * 0.25 : 0.72 + Math.random() * 0.16, sp: 0.3 + Math.random() * 0.6, team: i % 2 ? 1 : 0, s: isAir ? 56 : 64 + Math.random() * 30 });
    }
    const frame = (t: number) => {
      const W = innerWidth, H = innerHeight;
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0b1631'); sky.addColorStop(0.55, '#3b2f5e'); sky.addColorStop(0.7, '#f59e0b');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(253,224,71,0.25)'; g.beginPath(); g.arc(W * 0.7, H * 0.62, H * 0.14, 0, Math.PI * 2); g.fill();
      // mountains: static ridge lines (no scrolling, which looked jittery)
      for (let L = 0; L < 3; L++) {
        g.fillStyle = ['#1e1b4b', '#172554', '#0f172a'][L];
        g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W + 40; x += 40) {
          g.lineTo(x, H * (0.58 + L * 0.06) - Math.abs(Math.sin((x + L * 300) * 0.013)) * H * (0.12 - L * 0.03));
        }
        g.lineTo(W, H); g.fill();
      }
      g.fillStyle = '#14532d'; g.fillRect(0, H * 0.78, W, H);
      g.fillStyle = '#166534'; for (let i = 0; i < 30; i++) g.fillRect(((i * 137 - t * 0.04) % (W + 60) + W + 60) % (W + 60) - 30, H * 0.8 + (i * 53) % (H * 0.18), 30, 4);
      for (const u of units) {
        u.x += u.sp * (u.team === 0 ? 1 : -1);
        if (u.x > W + 80) u.x = -80; if (u.x < -80) u.x = W + 80;
        drawUnit(g, u.type, u.x, H * u.y, u.s, u.team, u.team === 0 ? 1 : -1, t);
      }
      // tracer
      g.strokeStyle = 'rgba(253,224,71,0.5)'; g.lineWidth = 2;
      const tp = (t / 900) % 1;
      g.beginPath(); g.moveTo(W * (0.1 + tp * 0.8), H * (0.8 - Math.sin(tp * Math.PI) * 0.4)); g.lineTo(W * (0.1 + tp * 0.8) + 10, H * (0.8 - Math.sin(tp * Math.PI) * 0.4) - 4); g.stroke();
      g.fillStyle = 'rgba(2,6,23,0.35)'; g.fillRect(0, 0, W, H);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

export interface ResumeInfo { mission: string; day: number }
export function Title({ save, onNav, onQuick, resume, onContinue }: { save: SaveData; onNav: (s: string) => void; onQuick: () => void; resume?: ResumeInfo | null; onContinue?: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onQuick(); } };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [onQuick]);
  const fresh = save.progress === 0;
  return (
    <div className="absolute inset-0 overflow-hidden title-page">
      <TitleBg />
      <div className="title-scroll relative z-10 h-full overflow-auto">
        <div className="title-layout">
          <div className="title-brand text-center anim-title">
            <div className="title-kicker tracking-[0.5em] text-amber-300 font-bold">TURN-BASED WARFARE</div>
            <h1 className="title-logo font-black tracking-tight text-white leading-none title-text">IRON FRONT</h1>
            <div className="title-subtitle font-black tracking-[0.4em] text-amber-400">TACTICS</div>
            <div className="title-tagline text-xs text-slate-300/75 mt-3 hidden landscape:block">Command. Capture. Outthink.</div>
          </div>
          <div className="title-actions grid gap-2 anim-slide-up">
            {resume && onContinue && (
              <button className="menu-btn title-primary h-auto py-2 bg-emerald-500 text-slate-950 text-lg shadow-[0_0_24px_rgba(16,185,129,0.55)] leading-tight" onClick={() => { sfx.select(); onContinue(); }}>
                ⏯ CONTINUE BATTLE
                <span className="block text-[11px] font-bold opacity-80">{resume.mission} · Day {resume.day} · auto-saved</span>
              </button>
            )}
            <button className="menu-btn title-primary bg-amber-400 text-slate-900 text-lg shadow-[0_0_24px_rgba(251,191,36,0.5)]" onClick={() => { sfx.select(); fresh ? onNav('campaign-start') : onNav('campaign'); }}>
              {fresh ? '▶ START CAMPAIGN' : '▶ CAMPAIGN'}
            </button>
            <button className="menu-btn title-primary bg-rose-600" onClick={() => { sfx.select(); onQuick(); }}>⚡ QUICK BATTLE <span className="text-xs opacity-70">(Enter)</span></button>
            <button className="menu-btn title-primary bg-cyan-700 border-cyan-400" onClick={() => { sfx.select(); onNav('online'); }}>🌐 ONLINE / CO-OP</button>
            <div className="grid grid-cols-3 title-secondary-grid gap-2">
              <button className="menu-btn bg-slate-700/90 text-sm" onClick={() => onNav('skirmish')}>⚔ Skirmish</button>
              <button className="menu-btn bg-slate-700/90 text-sm" onClick={() => onNav('workshop')}>🎖 Command HQ</button>
              <button className="menu-btn bg-slate-700/90 text-sm" onClick={() => onNav('scores')}>🏆 Scores</button>
              <button className="menu-btn bg-slate-700/90 text-sm" onClick={() => onNav('help')}>📖 Manual</button>
              <button className="menu-btn bg-emerald-800/90 text-sm col-span-2" onClick={() => onNav('saves')}>💾 Save / Load</button>
            </div>
            <div className="title-progress text-[11px] text-slate-300/80 text-center">🪙 <b className="text-amber-300">{save.merits}</b> · 🧩 <b className="text-fuchsia-300">{Object.values(save.coPieces ?? {}).reduce((a, b) => a + b, 0)}</b> · Campaign {Math.min(save.progress, MISSIONS.length)}/{MISSIONS.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Shell ---------------- */
function Screen({ title, onBack, children, right }: { title: string; onBack: () => void; children: ReactNode; right?: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [onBack]);
  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950 bg-grid">
      <div className="flex items-center gap-2 p-2 border-b-2 border-amber-500/40 bg-slate-900/90">
        <button className="hud-btn w-11 h-10" onClick={onBack}>◀</button>
        <div className="font-black text-lg tracking-widest text-amber-300 flex-1 truncate">{title}</div>
        {right}
      </div>
      <div className="flex-1 overflow-auto p-3 anim-fade">{children}</div>
    </div>
  );
}

/* ---------------- Campaign ---------------- */
export function Campaign({ save, onBack, onPick, onHQ, resume, onContinue }: { save: SaveData; onBack: () => void; onPick: (i: number) => void; onHQ?: () => void; resume?: ResumeInfo | null; onContinue?: () => void }) {
  return (
    <Screen title="CAMPAIGN" onBack={onBack} right={onHQ ? <button className="hud-btn px-3 h-9 text-xs font-black text-amber-300" onClick={() => { sfx.select(); onHQ(); }}>🎖 COMMAND HQ</button> : undefined}>
      <div className="max-w-3xl mx-auto mb-3 flex flex-wrap items-center gap-2">
        <div className="text-xs font-bold"><span className="text-amber-300">🪙 {save.merits}</span> <span className="text-fuchsia-300 ml-2">🧩 {Object.values(save.coPieces ?? {}).reduce((a, b) => a + b, 0)}</span></div>
        {resume && onContinue && (
          <button className="ml-auto rounded-lg border-2 border-emerald-300 bg-emerald-500 px-3 py-1.5 text-left text-slate-950 font-black text-xs leading-tight shadow-[0_0_14px_rgba(16,185,129,0.5)]" onClick={() => { sfx.select(); onContinue(); }}>
            ⏯ CONTINUE BATTLE<span className="block text-[10px] font-bold opacity-75">{resume.mission} · Day {resume.day}</span>
          </button>
        )}
      </div>
      <div className="max-w-3xl mx-auto">
        {ACTS.map((act, ai) => (
          <div key={act} className="mb-5">
            <div className="text-sm font-black tracking-widest text-slate-400 border-b border-slate-800 pb-1">{act}</div>
            <div className="text-[11px] text-slate-500 italic mb-2 mt-1">{ai <= Math.max(0, MISSIONS[Math.min(save.progress, MISSIONS.length - 1)].act) ? ACT_INTROS[ai] : 'Classified. Keep advancing the campaign.'}</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {MISSIONS.map((m, i) => ({ m, i })).filter(({ m }) => m.act === ai).map(({ m, i }) => {
                const locked = i > save.progress;
                const best = save.best[m.id];
                return (
                  <button key={m.id} disabled={locked} onClick={() => { sfx.select(); onPick(i); }}
                    className={`text-left p-2.5 rounded-xl border-2 flex gap-3 items-center transition active:scale-[0.98] ${locked ? 'border-slate-800 bg-slate-900/60 opacity-50' : i === save.progress ? 'border-amber-400 bg-slate-800 shadow-[0_0_16px_rgba(251,191,36,0.25)]' : 'border-slate-700 bg-slate-800/80 hover:border-sky-400'}`}>
                    {locked ? <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center text-2xl">🔒</div> : <Portrait id={m.enemyCo} size={56} />}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-slate-400 font-bold">{m.tutorial ? 'TUTORIAL' : `MISSION ${i}`}</div>
                      <div className="font-black text-white truncate">{m.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{locked ? 'Complete previous mission' : m.hint}</div>
                      <div className="text-[11px] mt-0.5 flex gap-2 text-slate-300">
                        <span>{WEATHER_INFO[m.weather].icon}{m.weatherPool ? '🔄' : ''}</span>
                        {m.fog && <span>🌫 Fog</span>}
                        <span>{m.objective.type === 'rout' ? '⚔ Rout' : m.objective.type === 'hq' ? '🏛 HQ' : `🛡 Survive ${m.objective.days}d`}</span>
                        <span>Lv{m.aiLevel}</span>
                      </div>
                      {!locked && REWARDS[m.id] && SKILLS[REWARDS[m.id]] && (
                        <div className={`text-[10px] mt-0.5 font-bold ${save.ownedSkills.includes(REWARDS[m.id]) ? 'text-slate-500' : 'text-emerald-300'}`}>
                          🎁 {save.ownedSkills.includes(REWARDS[m.id]) ? 'Owned' : 'Reward'}: {SKILLS[REWARDS[m.id]].icon} {SKILLS[REWARDS[m.id]].name}
                        </div>
                      )}
                    </div>
                    {best && <div className={`rank-badge-sm rank-${best.rank}`}>{best.rank}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/* ---------------- CO select ---------------- */
export function COSelect({ save, allowed, title, onBack, onPick, enemyCo }: { save: SaveData; allowed: string[]; title: string; onBack: () => void; onPick: (id: string) => void; enemyCo?: string }) {
  const list = allowed.filter((c) => save.unlockedCos.includes(c));
  const [sel, setSel] = useState(list[list.length - 1] ?? 'rhea');
  const [foeInfo, setFoeInfo] = useState(false);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const i = list.indexOf(sel);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setSel(list[(i + 1) % list.length]);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setSel(list[(i - 1 + list.length) % list.length]);
      if (e.key === 'Enter') onPick(sel);
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [sel, list, onPick]);
  const co = COS[sel];
  return (
    <Screen title={title} onBack={onBack}>
      <div className="max-w-3xl mx-auto">
        <div className="text-xs text-slate-400 mb-2">Choose your Commanding Officer</div>
        <div className="flex gap-2 flex-wrap mb-3">
          {list.map((id) => (
            <button key={id} onClick={() => { setSel(id); sfx.cursor(); }} className={`rounded-xl p-1 border-2 transition ${sel === id ? 'border-amber-400 scale-105 shadow-[0_0_14px_rgba(251,191,36,0.4)]' : 'border-transparent opacity-70'}`}>
              <Portrait id={id} size={64} />
              <div className="text-[10px] font-bold text-center mt-0.5 text-slate-200">{COS[id].name.split(' ')[0]}</div>
            </button>
          ))}
          {allowed.filter((c) => !save.unlockedCos.includes(c)).map((id) => (
            <div key={id} className="rounded-xl p-1 border-2 border-transparent opacity-40">
              <div className="w-16 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-2xl">🔒</div>
              <div className="text-[10px] text-center mt-0.5">???</div>
            </div>
          ))}
        </div>
        <div className="hud-panel p-3 flex gap-3 flex-col sm:flex-row anim-fade" key={sel}>
          <Portrait id={sel} size={150} className="self-center" />
          <div className="flex-1 text-sm">
            <div className="text-xs font-bold" style={{ color: co.color }}>{co.title.toUpperCase()}</div>
            <div className="text-2xl font-black text-white">{co.name}</div>
            <div className="text-[11px] font-bold text-amber-300">★ {RANK_NAMES[save.coRank[sel] ?? 0]} · Skills: {(save.loadout[sel] ?? []).slice(0, rankSlots(save.coRank[sel] ?? 0)).filter((id) => SKILLS[id]).map((id) => `${SKILLS[id].icon} ${SKILLS[id].name}`).join(', ') || <span className="text-slate-500">none equipped (Command HQ)</span>}</div>
            <div className="text-slate-300 text-xs mt-1 italic">{co.bio}</div>
            <div className="mt-2 text-slate-200"><b className="text-slate-400 text-xs">DAY-TO-DAY (always on):</b> {co.d2d}</div>
            <div className="mt-2 grid gap-2">
              <div className="rounded-lg border-2 border-fuchsia-400/70 bg-fuchsia-400/5 p-2">
                <div className="text-[10px] font-black text-fuchsia-300 tracking-widest">✦ ULTIMATE · {ultimateCost(co.id)}</div>
                <div className="font-black text-white">{co.superName}</div>
                <div className="text-slate-300 text-xs">{co.superDesc}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="hud-panel p-2.5 mt-2"><PowerExplainer /></div>
        {enemyCo && (
          <button className="mt-3 flex items-center gap-2 text-xs text-slate-400 text-left w-full hud-panel p-2" onClick={() => setFoeInfo(true)}>
            <span>Opponent:</span><Portrait id={enemyCo} size={32} /><span className="flex-1"><b className="text-rose-300">{COS[enemyCo].title} {COS[enemyCo].name}</b> — {COS[enemyCo].d2d}</span>
            <span className="text-rose-300 font-bold whitespace-nowrap">ⓘ Powers</span>
          </button>
        )}
        {foeInfo && enemyCo && <COInfo coId={enemyCo} isEnemy onClose={() => setFoeInfo(false)} />}
        <button className="menu-btn bg-amber-400 text-slate-900 w-full mt-4 text-lg" onClick={() => { sfx.select(); onPick(sel); }}>DEPLOY WITH {co.name.toUpperCase()} ▶</button>
      </div>
    </Screen>
  );
}

/* ---------------- Dialogue ---------------- */
export function DialogueScreen({ lines, title, onDone }: { lines: Dialogue[]; title: string; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [chars, setChars] = useState(0);
  const line = lines[i];
  useEffect(() => {
    setChars(0);
    const id = setInterval(() => setChars((c) => c + 2), 22);
    return () => clearInterval(id);
  }, [i]);
  const full = !line || chars >= line.text.length;
  const next = () => {
    if (!line) { onDone(); return; }
    if (!full) { setChars(9999); return; }
    sfx.cursor();
    if (i + 1 >= lines.length) onDone(); else setI(i + 1);
  };
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') { e.preventDefault(); nextRef.current(); }
      if (e.key === 'Escape') onDone();
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [onDone]);
  if (!line) return null;
  const co = COS[line.who];
  const right = co?.faction === 'crimson';
  return (
    <div className="absolute inset-0 overflow-hidden" onClick={next}>
      <TitleBg />
      <div className="absolute top-3 left-0 right-0 text-center z-10">
        <div className="text-xs tracking-[0.4em] text-amber-300 font-bold">BRIEFING</div>
        <div className="text-2xl font-black text-white">{title}</div>
      </div>
      <button className="absolute top-3 right-3 z-20 hud-btn px-3 h-9 text-xs font-bold" onClick={(e) => { e.stopPropagation(); onDone(); }}>SKIP ▶▶</button>
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 flex flex-col items-stretch">
        <div className={`flex ${right ? 'justify-end' : 'justify-start'} mb-[-12px] relative z-10`} key={i}>
          <div className={right ? 'anim-slide-left' : 'anim-slide-right'}>
            <Portrait id={line.who} size={Math.min(170, innerHeight * 0.26)} className="shadow-2xl" />
          </div>
        </div>
        <div className="hud-panel border-amber-400/70 p-4 pt-5 min-h-[120px] max-w-3xl w-full mx-auto">
          <div className="text-sm font-black mb-1" style={{ color: co?.color ?? '#fbbf24' }}>{co ? `${co.title} ${co.name}` : 'HQ Radio'}</div>
          <div className="text-white text-base sm:text-lg leading-snug">{line.text.slice(0, chars)}{!full && <span className="animate-pulse">▌</span>}</div>
          <div className="text-right text-[10px] text-slate-400 mt-2">{i + 1}/{lines.length} · tap to continue ▼</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Workshop ---------------- */
const TIER_COST = [300, 600, 1000];
export function Workshop({ save, onBack, onSave }: { save: SaveData; onBack: () => void; onSave: (s: SaveData) => void }) {
  const [tab, setTab] = useState<'up' | 'mods'>('up');
  const buyTier = (kind: 'atk' | 'def', cat: Category) => {
    const tier = save.upgrades[kind][cat];
    if (tier >= 3 || save.merits < TIER_COST[tier]) { sfx.cancel(); return; }
    sfx.build();
    onSave({ ...save, merits: save.merits - TIER_COST[tier], upgrades: { ...save.upgrades, [kind]: { ...save.upgrades[kind], [cat]: tier + 1 } } });
  };
  const buyMod = (m: ModId) => {
    if (save.ownedMods.includes(m) || save.merits < MODS[m].price) { sfx.cancel(); return; }
    sfx.build();
    onSave({ ...save, merits: save.merits - MODS[m].price, ownedMods: [...save.ownedMods, m] });
  };
  const equip = (t: UnitType, m: ModId | null) => {
    sfx.menu();
    const mods = { ...save.mods };
    if (m) mods[t] = m; else delete mods[t];
    onSave({ ...save, mods });
  };
  return (
    <Screen title="WORKSHOP" onBack={onBack} right={<div className="text-sm text-emerald-300 font-black">🎖 {save.merits}</div>}>
      <div className="max-w-3xl mx-auto">
        <div className="text-xs text-slate-400 mb-2">Earn merits from battles. Upgrades apply to all your units in every mode.</div>
        <div className="flex gap-2 mb-3">
          <button className={`flex-1 menu-btn text-sm ${tab === 'up' ? 'bg-amber-400 text-slate-900' : 'bg-slate-800'}`} onClick={() => setTab('up')}>Upgrades</button>
          <button className={`flex-1 menu-btn text-sm ${tab === 'mods' ? 'bg-amber-400 text-slate-900' : 'bg-slate-800'}`} onClick={() => setTab('mods')}>Vehicle Mods</button>
        </div>
        {tab === 'up' ? (
          <div className="grid gap-2">
            {(Object.keys(CAT_NAMES) as Category[]).map((cat) => (
              <div key={cat} className="hud-panel p-2.5">
                <div className="font-black text-white mb-1">{CAT_NAMES[cat]}</div>
                <div className="text-[10px] text-slate-400 mb-2">{TERRAIN_BONUS[cat]}</div>
                <div className="grid grid-cols-2 gap-2">
                  {(['atk', 'def'] as const).map((kind) => {
                    const tier = save.upgrades[kind][cat];
                    return (
                      <button key={kind} onClick={() => buyTier(kind, cat)} disabled={tier >= 3}
                        className="bg-slate-800 rounded-lg p-2 border border-slate-600 text-left active:scale-95 disabled:opacity-60">
                        <div className="text-xs font-bold text-slate-200">{kind === 'atk' ? '💥 Firepower' : '🛡 Armor'} <span className="text-amber-300">+{tier * 5}%</span></div>
                        <div className="flex gap-1 my-1">{[0, 1, 2].map((t) => <div key={t} className={`h-1.5 flex-1 rounded ${t < tier ? 'bg-amber-400' : 'bg-slate-700'}`} />)}</div>
                        <div className={`text-[11px] ${tier >= 3 ? 'text-emerald-300' : save.merits >= TIER_COST[tier] ? 'text-emerald-300' : 'text-slate-500'}`}>{tier >= 3 ? 'MAXED' : `Upgrade: ${TIER_COST[tier]} merits`}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(Object.keys(MODS) as ModId[]).map((m) => {
                const owned = save.ownedMods.includes(m);
                return (
                  <button key={m} onClick={() => buyMod(m)} className={`hud-panel p-2 text-left ${owned ? 'border-emerald-500' : ''}`}>
                    <div className="font-bold text-white text-sm">{MODS[m].icon} {MODS[m].name}</div>
                    <div className="text-[11px] text-slate-300">{MODS[m].desc}</div>
                    <div className={`text-[11px] font-bold mt-1 ${owned ? 'text-emerald-300' : save.merits >= MODS[m].price ? 'text-amber-300' : 'text-slate-500'}`}>{owned ? 'UNLOCKED' : `Unlock: ${MODS[m].price}`}</div>
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-slate-400 mb-2">Equip one mod per unit type:</div>
            <div className="grid gap-1.5">
              {UNIT_ORDER.map((t) => (
                <div key={t} className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-lg p-1.5">
                  <UnitIcon type={t} size={36} />
                  <div className="text-sm font-bold text-white w-24 truncate">{UNITS[t].name}</div>
                  <div className="flex gap-1 flex-wrap flex-1 justify-end">
                    <button onClick={() => equip(t, null)} className={`text-[11px] px-2 py-1 rounded border ${!save.mods[t] ? 'bg-slate-600 border-slate-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>None</button>
                    {save.ownedMods.map((m) => (
                      <button key={m} onClick={() => equip(t, m)} className={`text-[11px] px-2 py-1 rounded border ${save.mods[t] === m ? 'bg-amber-400 text-slate-900 border-amber-200 font-bold' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>{MODS[m].icon}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Screen>
  );
}

/* ---------------- High scores ---------------- */
export function HighScores({ save, onBack }: { save: SaveData; onBack: () => void }) {
  return (
    <Screen title="HIGH SCORES" onBack={onBack}>
      <div className="max-w-2xl mx-auto">
        {save.highscores.length === 0 && <div className="text-center text-slate-400 mt-10">No scores yet. Go win some battles, Commander!</div>}
        <div className="grid gap-1.5">
          {save.highscores.map((h, i) => (
            <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border ${i === 0 ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-900/80'}`}>
              <div className={`w-8 text-center font-black text-lg ${i < 3 ? 'text-amber-300' : 'text-slate-500'}`}>{i + 1}</div>
              <Portrait id={h.co} size={36} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{h.mission}</div>
                <div className="text-[11px] text-slate-400">{COS[h.co]?.name} · {h.date}</div>
              </div>
              <div className={`rank-badge-sm rank-${h.rank}`}>{h.rank}</div>
              <div className="font-black text-amber-300 w-16 text-right">{h.score}</div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

/* ---------------- Skirmish ---------------- */
export interface SkirmishCfg { mapIdx: number; co: string; enemy: string; weather: Weather | 'default' | 'dynamic'; fog: boolean; ai: number }
export function Skirmish({ save, onBack, onStart }: { save: SaveData; onBack: () => void; onStart: (c: SkirmishCfg) => void }) {
  const maps = MISSIONS.map((m, i) => ({ m, i })).filter(({ i }) => i <= Math.max(1, save.progress) && i > 0);
  const [info, setInfo] = useState<string | null>(null);
  const [cfg, setCfg] = useState<SkirmishCfg>({ mapIdx: maps[0]?.i ?? 1, co: save.unlockedCos[0], enemy: 'grimm', weather: 'default', fog: false, ai: 2 });
  const sel = (k: keyof SkirmishCfg, v: SkirmishCfg[keyof SkirmishCfg]) => { sfx.cursor(); setCfg({ ...cfg, [k]: v }); };
  const chip = (on: boolean) => `px-2.5 py-1.5 rounded-lg text-xs font-bold border ${on ? 'bg-amber-400 text-slate-900 border-amber-200' : 'bg-slate-800 border-slate-700 text-slate-300'}`;
  return (
    <Screen title="SKIRMISH" onBack={onBack}>
      <div className="max-w-3xl mx-auto grid gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-1 font-bold">MAP <span className="font-normal">(unlock more via campaign)</span></div>
          <div className="flex flex-wrap gap-1.5">{maps.map(({ m, i }) => <button key={m.id} className={chip(cfg.mapIdx === i)} onClick={() => sel('mapIdx', i)}>{m.name}</button>)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1 font-bold">YOUR CO</div>
          <div className="flex flex-wrap gap-1.5">{PLAYABLE_ORDER.filter((c) => save.unlockedCos.includes(c)).map((c) => (
            <button key={c} onClick={() => sel('co', c)} className={`rounded-lg p-0.5 border-2 ${cfg.co === c ? 'border-amber-400' : 'border-transparent opacity-60'}`}><Portrait id={c} size={48} /></button>
          ))}</div>
          <div className="text-[11px] text-slate-300 mt-1">{COS[cfg.co].name}: {COS[cfg.co].d2d} <button className="text-sky-300 font-bold underline" onClick={() => setInfo(cfg.co)}>ⓘ Powers</button></div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1 font-bold">ENEMY CO</div>
          <div className="flex flex-wrap gap-1.5">{PLAYABLE_ORDER.map((c) => (
            <button key={c} onClick={() => sel('enemy', c)} className={`rounded-lg p-0.5 border-2 ${cfg.enemy === c ? 'border-rose-400' : 'border-transparent opacity-60'}`}><Portrait id={c} size={48} /></button>
          ))}</div>
          <div className="text-[11px] text-slate-300 mt-1">{COS[cfg.enemy].name}: {COS[cfg.enemy].d2d} <button className="text-rose-300 font-bold underline" onClick={() => setInfo(cfg.enemy)}>ⓘ Powers</button></div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1 font-bold">WEATHER</div>
          <div className="flex flex-wrap gap-1.5">
            {(['default', 'clear', 'rain', 'snow', 'sand', 'dynamic'] as const).map((w) => (
              <button key={w} className={chip(cfg.weather === w)} onClick={() => sel('weather', w)}>{w === 'default' ? 'Map default' : w === 'dynamic' ? '🔄 Dynamic' : `${WEATHER_INFO[w].icon} ${WEATHER_INFO[w].name}`}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-6 flex-wrap">
          <div>
            <div className="text-xs text-slate-400 mb-1 font-bold">FOG OF WAR</div>
            <div className="flex gap-1.5"><button className={chip(!cfg.fog)} onClick={() => sel('fog', false)}>Off</button><button className={chip(cfg.fog)} onClick={() => sel('fog', true)}>On</button></div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1 font-bold">AI LEVEL</div>
            <div className="flex gap-1.5">{[1, 2, 3].map((l) => <button key={l} className={chip(cfg.ai === l)} onClick={() => sel('ai', l)}>{['', 'Recruit', 'Veteran', 'Elite'][l]}</button>)}</div>
          </div>
        </div>
        <button className="menu-btn bg-amber-400 text-slate-900 text-lg" onClick={() => { sfx.select(); onStart(cfg); }}>START BATTLE ▶</button>
      </div>
      {info && <COInfo coId={info} isEnemy={info === cfg.enemy && info !== cfg.co} onClose={() => setInfo(null)} />}
    </Screen>
  );
}

/* ---------------- Save / Load profiles ---------------- */
export function SaveManager({ save, battle, onBack, onLoad }: { save: SaveData; battle: ResumeSave | null; onBack: () => void; onLoad: (slot: SaveSlot) => void }) {
  const [slots, setSlots] = useState(() => loadSlots());
  const [name, setName] = useState('Commander');
  const ids = ['slot1', 'slot2', 'slot3'];
  const refresh = () => setSlots(loadSlots());
  return (
    <Screen title="SAVE / LOAD" onBack={onBack}>
      <div className="max-w-2xl mx-auto grid gap-3">
        <div className="hud-panel p-3">
          <div className="font-black text-emerald-300">CURRENT PROFILE</div>
          <div className="text-xs text-slate-300 mt-1">Campaign {save.progress}/{MISSIONS.length} · 🪙 {save.merits} · {battle ? `${battle.missionId}, Day ${battle.day}` : 'No battle in progress'}</div>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} className="mt-2 w-full h-10 rounded-lg border-2 border-slate-700 bg-slate-950 px-3 text-sm font-bold text-white" placeholder="Save name" />
        </div>
        {ids.map((id, i) => {
          const slot = slots[id];
          return (
            <div key={id} className="hud-panel p-3 flex gap-3 items-center">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center font-black text-slate-300">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-white truncate">{slot?.name ?? 'Empty Save Slot'}</div>
                <div className="text-[11px] text-slate-400">{slot ? `Campaign ${slot.progress.progress}/${MISSIONS.length} · 🪙 ${slot.progress.merits} · ${slot.battle ? `${slot.battle.missionId} Day ${slot.battle.day}` : 'No active battle'} · ${new Date(slot.savedAt).toLocaleString()}` : 'Save progression and the current campaign battle here.'}</div>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                <button className="hud-btn h-10 px-3 text-xs" onClick={() => { writeSlot(id, name, save, battle); sfx.build(); refresh(); }}>SAVE</button>
                <button disabled={!slot} className="hud-btn h-10 px-3 text-xs disabled:opacity-40" onClick={() => slot && onLoad(slot)}>LOAD</button>
                <button disabled={!slot} className="h-10 px-2 rounded-lg bg-rose-900 border border-rose-700 text-[10px] font-bold disabled:opacity-30" onClick={() => { if (slot && confirm(`Delete ${slot.name}?`)) { deleteSlot(id); refresh(); } }}>DELETE</button>
              </div>
            </div>
          );
        })}
        <div className="text-[10px] text-slate-500 text-center">Saved for this person in this browser on the hosted game. Clearing browser site data removes these slots.</div>
      </div>
    </Screen>
  );
}

/* ---------------- Help ---------------- */
export function Help({ onBack, onTutorial }: { onBack: () => void; onTutorial: () => void }) {
  return (
    <Screen title="FIELD MANUAL" onBack={onBack}>
      <div className="max-w-3xl mx-auto text-sm text-slate-300 grid gap-4">
        <button className="menu-btn bg-amber-400 text-slate-900" onClick={onTutorial}>🎓 Play Boot Camp Tutorial</button>
        <section className="hud-panel p-3">
          <h3 className="font-black text-amber-300 mb-1">CONTROLS</h3>
          <p><b>Touch:</b> tap a unit → tap a blue tile → choose an action. Drag to pan. Tap an enemy to inspect threats. Tap a base to deploy. With a unit selected, tap a red-outlined enemy to attack. <b>Double-tap any unit to inspect movement and weapon range.</b> You get <b>one UNDO per turn</b> (↶ button); it reverses only the most recent action.</p>
          <p className="mt-1"><b>Keyboard:</b> Arrows/WASD move cursor · Enter/Space/Z confirm · Esc/X cancel · E end turn · Q/Tab next unit · C Power · V Super · I intel · P pause · +/− zoom.</p>
        </section>
        <section className="hud-panel p-3">
          <h3 className="font-black text-amber-300 mb-1">RULES OF ENGAGEMENT</h3>
          <ul className="list-disc pl-5 grid gap-0.5">
            <li>Damage scales with attacker HP. Defenders get ★ terrain stars × HP as protection (air units get none).</li>
            <li>Direct units counter-attack adjacent attackers. Indirect units (artillery, rockets, missiles, battleships) cannot move and fire in the same turn and never counter. Indirect fire ignores intervening units: it shoots over occupied squares.</li>
            <li>Infantry & Mechs capture properties (20 points; capture rate = HP). Moving off resets progress.</li>
            <li>Cities, bases, airports, ports and HQs pay +1000G per day. Units can repair on friendly properties for funds. Capture the enemy HQ to win instantly, or rout all enemy units on rout missions.</li>
            <li><b>Cities vs Radio Towers:</b> a City pays +1,000G a day and repairs 2 HP (for a fee). A Radio Tower pays no gold, but heals units on or beside it +1 HP free, gives +10% attack, and grants +1 movement to all your units every 3rd turn. Both give ★★★ defense (like a forest ★★).</li>
            <li>Units are limited per mission — check the slot counter. Each factory deploys once per day.</li>
            <li>Kills grant veteran chevrons (+5% attack each, max 3).</li>
            <li>The CO meter charges from damage dealt/taken, kills and captures. Power at the white line, Super when full.</li>
            <li>Fog of War: you only see what your units see. Forests and reefs hide units unless adjacent. Moving into a hidden enemy triggers an ambush.</li>
          </ul>
        </section>
        <section className="hud-panel p-3">
          <h3 className="font-black text-amber-300 mb-1">WEATHER</h3>
          {(Object.keys(WEATHER_INFO) as Weather[]).map((w) => <div key={w}><b>{WEATHER_INFO[w].icon} {WEATHER_INFO[w].name}:</b> {WEATHER_INFO[w].desc}</div>)}
        </section>
        <section className="hud-panel p-3">
          <h3 className="font-black text-amber-300 mb-1">TERRAIN</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
            {Object.entries(TERRAIN).map(([k, t]) => <div key={k}>{t.name} <span className="text-amber-300">{'★'.repeat(t.def) || '—'}</span></div>)}
          </div>
          <div className="mt-2 text-xs grid gap-1">
            <div><b>Mountains:</b> Infantry and Mechs only; each tile costs 2 movement.</div>
            <div><b>Forest:</b> Infantry, Mechs and vehicles move through at normal cost. Defense stars protect every ground unit; no forest movement penalty.</div>
            <div><b>Open ground:</b> no terrain defense or attack bonus, and no movement penalty.</div>
            <div><b>Paved roads:</b> ground vehicles (including artillery trucks) starting a move on a road gain +1 movement for that move.</div>
            {(Object.keys(TERRAIN_BONUS) as Category[]).map((c) => <div key={c}><b>{CAT_NAMES[c]}:</b> {TERRAIN_BONUS[c]}</div>)}
          </div>
        </section>
        <section className="hud-panel p-3">
          <h3 className="font-black text-amber-300 mb-1">AIR REFUEL</h3>
          <p>Every air unit has a finite fuel tank. Fuel is spent for each tile flown, and weather can increase the cost. Land on a captured city, base, HQ or airport at the start of your turn to refill. Double-tap an aircraft to inspect its remaining fuel.</p>
        </section>
        <section className="hud-panel p-3">
          <h3 className="font-black text-amber-300 mb-2">UNITS</h3>
          <div className="grid gap-1.5">
            {UNIT_ORDER.map((t) => {
              const d = UNITS[t];
              return (
                <div key={t} className="flex gap-2 items-center border-b border-slate-800 pb-1.5">
                  <UnitIcon type={t} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm">{d.name} <span className="text-amber-300 text-xs">{d.cost}G</span> <span className="text-[10px] text-slate-400">Mv{d.move} {d.moveType} · Rng {d.range[0]}-{d.range[1]}</span></div>
                    <div className="text-[11px] text-slate-400">{d.desc}</div>
                    <div className="text-[10px] text-slate-500">Strong vs: {Object.entries(d.dmg).filter(([, v]) => (v ?? 0) >= 55).map(([a]) => ARMOR_NAMES[a as keyof typeof ARMOR_NAMES]).join(', ') || '—'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Screen>
  );
}
