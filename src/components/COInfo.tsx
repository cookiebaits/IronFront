import { useEffect } from 'react';
import { COS, RANK_NAMES, SKILLS, WEATHER_INFO, rankDesc, ultimateCost } from '../game/data';
import Portrait from './Portrait';

interface Props {
  coId: string;
  onClose: () => void;
  meter?: number;
  meterMax?: number;
  skillMeter?: number;
  skillMeterMax?: number;
  active?: number; // 0 none, 1 power, 2 super, 3 skill
  isEnemy?: boolean;
  onActivate?: (level: 2) => void;
  canSuper?: boolean;
  rank?: number;
  skills?: string[];
  canSkill?: (id: string) => boolean;
  onSkill?: (id: string) => void;
}

export function PowerExplainer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`grid gap-2 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
      <div className="rounded-lg border border-fuchsia-400/60 bg-fuchsia-400/10 p-2">
        <div className="font-black text-fuchsia-300">✦ CO ULTIMATE</div>
        <ul className="text-slate-300 mt-0.5 leading-snug list-disc pl-3.5">
          <li>One powerful CO ability</li>
          <li>Charges 20% slower than the old Super gauge</li>
          <li>Empties the whole meter</li>
        </ul>
      </div>
      <div className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 p-2">
        <div className="font-black text-emerald-300">🎴 TACTICAL SKILLS</div>
        <div className="text-slate-300 leading-snug">Skills use their <b className="text-white">own green gauge</b>, which charges 35% slower than the Ultimate. Enemy restrictions never affect the CO who used the skill.</div>
      </div>
      <div className="text-slate-400 leading-snug">
        Ultimate and Skill charge separately. Both fill through combat and captures.
      </div>
    </div>
  );
}

export default function COInfo({ coId, onClose, meter, meterMax, skillMeter, skillMeterMax, active, isEnemy, onActivate, canSuper, rank, skills, canSkill, onSkill }: Props) {
  const co = COS[coId];
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  }, [onClose]);
  if (!co) return null;
  const showMeter = meter !== undefined;
  const max = meterMax ?? ultimateCost(co.id);
  const m = meter ?? 0;
  const pct = Math.min(100, (m / max) * 100);
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 anim-fade p-2" onClick={onClose}>
      <div className="hud-panel p-3 w-[min(500px,96vw)] max-h-[92vh] overflow-auto anim-zoom" style={{ borderColor: co.color }} onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-3 items-start">
          <Portrait id={coId} size={96} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black tracking-widest" style={{ color: co.color }}>{isEnemy ? 'ENEMY · ' : ''}{co.title.toUpperCase()}</div>
            <div className="text-xl font-black text-white leading-tight">{co.name}</div>
            {rank !== undefined && <div className="text-[11px] font-bold text-amber-300">★ Rank {rank}: {RANK_NAMES[rank]} <span className="text-slate-400 font-normal">· {rankDesc(rank)}</span></div>}
            <div className="text-[11px] text-slate-400 italic leading-snug mt-0.5">{co.bio}</div>
          </div>
          <button className="hud-btn w-9 h-9 shrink-0" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="mt-3 rounded-lg bg-slate-800/80 border border-slate-700 p-2">
          <div className="text-[10px] font-black text-slate-400 tracking-widest">ALWAYS ACTIVE (DAY-TO-DAY)</div>
          <div className="text-sm text-slate-100">{co.d2d}{co.immune ? ` (${WEATHER_INFO[co.immune].icon} immune to ${WEATHER_INFO[co.immune].name.toLowerCase()})` : ''}</div>
        </div>

        {showMeter && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>CHARGE {Math.floor(m)} / {max}</span>
              <span>{active === 3 ? <b className="text-emerald-300">SKILL ACTIVE</b> : active === 2 ? <b className="text-fuchsia-300">ULTIMATE ACTIVE</b> : m >= ultimateCost(co.id) ? <b className="text-fuchsia-300">ULTIMATE READY</b> : 'Charging...'}</span>
            </div>
            <div className="relative h-4 rounded-full bg-slate-800 border border-slate-600 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-300 to-fuchsia-400" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-right text-[9px] text-fuchsia-300 mt-0.5">✦ Ultimate ({ultimateCost(co.id)})</div>
          </div>
        )}

        {skills && skills.length > 0 && skillMeter !== undefined && (
          <div className="mt-2 rounded-lg border border-emerald-500/50 bg-emerald-500/5 p-2">
            <div className="flex justify-between text-[10px] font-black text-emerald-300 mb-1"><span>🎴 SKILL CHARGE</span><span>{Math.floor(skillMeter)} / {skillMeterMax ?? 1}</span></div>
            <div className="relative h-3 rounded-full bg-slate-900 border border-slate-600 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-700 to-emerald-300" style={{ width: `${Math.min(100, (skillMeter / Math.max(1, skillMeterMax ?? 1)) * 100)}%` }} />
              {skills.map((id) => SKILLS[id] && <div key={id} className="absolute top-0 bottom-0 w-px bg-white/80" style={{ left: `${Math.min(99, (SKILLS[id].cost / Math.max(1, skillMeterMax ?? 1)) * 100)}%` }} />)}
            </div>
            <div className="text-[9px] text-slate-400 mt-1">Separate from Ultimate · slower charge</div>
          </div>
        )}

        <div className="mt-3 grid gap-2">
          <div className="rounded-lg border-2 border-fuchsia-400/70 bg-fuchsia-400/5 p-2.5 flex flex-col">
            <div className="flex justify-between items-baseline">
              <div className="text-[10px] font-black tracking-widest text-fuchsia-300">✦ CO ULTIMATE</div>
              <div className="text-[10px] text-slate-400">Charge {ultimateCost(co.id)}</div>
            </div>
            <div className="text-lg font-black text-white leading-tight">{co.superName}</div>
            <div className="text-xs text-slate-300 mt-1 flex-1">{co.superDesc}</div>
            {onActivate && !isEnemy && (
              <button disabled={!canSuper} onClick={() => onActivate(2)}
                className={`mt-2 h-10 rounded-lg font-black text-sm border-2 ${canSuper ? 'bg-fuchsia-500 text-white border-fuchsia-300 shadow-[0_0_12px_#d946ef]' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                {canSuper ? 'ULTIMATE ACTIVATE' : active ? 'Already active' : `Need ${ultimateCost(co.id)}`}
              </button>
            )}
          </div>
        </div>

        {skills && skills.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] font-black tracking-widest text-emerald-300 mb-1">🎴 EQUIPPED TACTICAL SKILLS</div>
            <div className="grid gap-1.5">
              {skills.map((id) => {
                const sk = SKILLS[id];
                if (!sk) return null;
                const ready = canSkill?.(id) ?? false;
                return (
                  <div key={id} className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/5 p-2">
                    <div className="text-2xl w-8 text-center">{sk.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-white">{sk.name} <span className="text-[10px] text-slate-400 font-bold">{sk.kind} · Charge {sk.cost}</span></div>
                      <div className="text-[11px] text-slate-300">{sk.desc}</div>
                    </div>
                    {onSkill && !isEnemy && (
                      <button disabled={!ready} onClick={() => onSkill(id)}
                        className={`h-10 px-3 rounded-lg font-black text-xs border-2 shrink-0 ${ready ? 'bg-emerald-500 text-white border-emerald-300 shadow-[0_0_12px_#10b981]' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                        {ready ? 'USE' : active ? 'Active' : `${sk.cost}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-3"><PowerExplainer compact /></div>
      </div>
    </div>
  );
}
