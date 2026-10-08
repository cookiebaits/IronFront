import { useEffect, useState } from 'react';
import {
  COS, CO_PIECES, CO_PRICE, PLAYABLE_ORDER, RANK_MAX, RANK_NAMES, RANK_PRICE, SKILLS, SKILL_ORDER, TRACKS, TRACK_MAX, TRACK_ORDER, TRACK_PRICE,
  UNITS, UNIT_ORDER, rankDesc, rankSlots, ultimateCost, upgradeEffects,
} from '../game/data';
import { REWARDS, MISSIONS } from '../game/campaign';
import { piecesHave } from '../game/unlocks';
import { sfx } from '../game/audio';
import Portrait from './Portrait';
import COInfo from './COInfo';
import { UnitIcon } from './GameView';
import type { SaveData, TrackId, UnitType } from '../game/types';

type Tab = 'cos' | 'skills' | 'units';

const KIND_COLOR: Record<string, string> = {
  Boost: 'text-amber-300 border-amber-400/50',
  Weather: 'text-sky-300 border-sky-400/50',
  'Global Damage': 'text-rose-300 border-rose-400/50',
  Support: 'text-emerald-300 border-emerald-400/50',
  Control: 'text-fuchsia-300 border-fuchsia-400/50',
};

export default function CommandHQ({ save, onBack, onSave, next }: { save: SaveData; onBack: () => void; onSave: (s: SaveData) => void; next?: { label: string; onGo: () => void } }) {
  const [tab, setTab] = useState<Tab>('cos');
  const [selCo, setSelCo] = useState<string>(save.unlockedCos[save.unlockedCos.length - 1] ?? 'rhea');
  const [selUnit, setSelUnit] = useState<UnitType>('tank');
  const [slotPick, setSlotPick] = useState<number | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !info && slotPick === null) onBack(); };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [onBack, info, slotPick]);

  const toast = (t: string) => { setFlash(t); setTimeout(() => setFlash(null), 1400); };
  const spend = (price: number, next: SaveData, msg: string) => {
    if (save.merits < price) { sfx.cancel(); toast('Not enough gold'); return; }
    sfx.build(); toast(msg);
    onSave({ ...next, merits: save.merits - price });
  };

  /* ---------- Officers ---------- */
  const co = COS[selCo];
  const owned = save.unlockedCos.includes(selCo);
  const rank = save.coRank[selCo] ?? 0;
  const slots = rankSlots(rank);
  const loadout = (save.loadout[selCo] ?? []).slice(0, slots);

  const needPieces = CO_PIECES[selCo] ?? 0;
  const havePieces = piecesHave(save, selCo);
  const price = CO_PRICE[selCo] ?? 1500;
  const piecesOk = havePieces >= needPieces;
  const hire = () => {
    // Unlocking needs BOTH enough CO Pieces and the Gold price.
    if (!piecesOk) { sfx.cancel(); toast(`Need ${needPieces - havePieces} more CO Pieces`); return; }
    spend(price, { ...save, unlockedCos: [...save.unlockedCos, selCo] }, `${co.name} joined your command!`);
  };
  const rankUp = () => {
    if (rank >= RANK_MAX) return;
    spend(RANK_PRICE[rank], { ...save, coRank: { ...save.coRank, [selCo]: rank + 1 } }, `${co.name} promoted to ${RANK_NAMES[rank + 1]}!`);
  };
  const equip = (slot: number, id: string | null) => {
    const cur = [...loadout];
    while (cur.length < slots) cur.push('');
    const existing = id ? cur.indexOf(id) : -1;
    if (existing >= 0) cur[existing] = '';
    cur[slot] = id ?? '';
    sfx.menu();
    onSave({ ...save, loadout: { ...save.loadout, [selCo]: cur.filter((x, i) => i < slots && (x || i < slots)).map((x) => x).filter(Boolean) } });
    setSlotPick(null);
  };

  /* ---------- Skills ---------- */
  const buySkill = (id: string) => {
    if (save.ownedSkills.includes(id)) return;
    spend(SKILLS[id].price, { ...save, ownedSkills: [...save.ownedSkills, id] }, `Learned ${SKILLS[id].name}!`);
  };
  const rewardMission = (id: string) => {
    const mid = Object.entries(REWARDS).find(([, s]) => s === id)?.[0];
    return mid ? MISSIONS.find((m) => m.id === mid)?.name : undefined;
  };

  /* ---------- Units ---------- */
  const ups = save.unitUps[selUnit] ?? {};
  const indirect = !!UNITS[selUnit].indirect;
  const eff = upgradeEffects(ups, indirect);
  const setTrack = (t: TrackId, delta: 1 | -1) => {
    const lv = ups[t] ?? 0;
    const nl = lv + delta;
    if (nl < 0 || nl > TRACK_MAX) return;
    const nextUps = { ...save.unitUps, [selUnit]: { ...ups, [t]: nl } };
    if (delta === 1) spend(TRACK_PRICE[lv], { ...save, unitUps: nextUps }, `${UNITS[selUnit].name}: ${TRACKS[t].name} Lv${nl}`);
    else { sfx.cancel(); toast(`Refunded ${TRACK_PRICE[nl]} gold`); onSave({ ...save, unitUps: nextUps, merits: save.merits + TRACK_PRICE[nl] }); }
  };
  const d = UNITS[selUnit];
  const stat = (label: string, base: string | number, now: string | number, better: boolean | null) => (
    <div className="bg-slate-900/80 rounded-lg p-1.5 text-center border border-slate-700">
      <div className="text-[9px] text-slate-400 font-bold">{label}</div>
      <div className={`text-sm font-black ${better === null ? 'text-white' : better ? 'text-emerald-300' : 'text-rose-300'}`}>{now}</div>
      {String(base) !== String(now) && <div className="text-[9px] text-slate-500 line-through">{base}</div>}
    </div>
  );

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950 bg-grid">
      <div className="flex items-center gap-2 p-2 border-b-2 border-amber-500/40 bg-slate-900/90">
        <button className="hud-btn w-11 h-10" onClick={onBack}>◀</button>
        <div className="flex-1 min-w-0">
          <div className="font-black text-lg tracking-widest text-amber-300 truncate leading-tight">{next ? 'MISSION PREP' : 'COMMAND HQ'}</div>
          {next && <div className="text-[10px] text-slate-400 truncate">Promote officers, equip skills, upgrade units, unlock new COs — then deploy.</div>}
        </div>
        <div className="text-sm font-black text-right leading-tight"><span className="text-amber-300">🪙 {save.merits}</span><span className="block text-[10px] text-fuchsia-300">🧩 {Object.values(save.coPieces ?? {}).reduce((a, b) => a + b, 0)} pieces</span></div>
      </div>
      <div className="flex gap-1.5 p-2 bg-slate-900/60">
        {([['cos', '👤 Officers'], ['skills', '🎴 Skills'], ['units', '🔧 Units']] as [Tab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => { sfx.cursor(); setTab(t); }} className={`flex-1 menu-btn h-10 text-sm ${tab === t ? 'bg-amber-400 text-slate-900' : 'bg-slate-800'}`}>{l}</button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3 anim-fade" key={tab}>
        <div className="max-w-3xl mx-auto">
          {tab === 'cos' && (
            <>
              <div className="text-xs text-slate-400 mb-2">Collect 🧩 CO Pieces from battles, then pay Gold to unlock new officers. Locked officers can be previewed. Promote them and equip tactical skills.</div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {PLAYABLE_ORDER.map((id) => {
                  const own = save.unlockedCos.includes(id);
                  const r = save.coRank[id] ?? 0;
                  return (
                    <button key={id} onClick={() => { sfx.cursor(); setSelCo(id); }}
                      className={`shrink-0 rounded-xl p-1 border-2 transition ${selCo === id ? 'border-amber-400 scale-105' : 'border-transparent'} ${own ? '' : 'opacity-60 grayscale'}`}>
                      <Portrait id={id} size={58} />
                      <div className="text-[10px] font-bold text-center text-slate-200 mt-0.5">{COS[id].name.split(' ')[0]}</div>
                      <div className="text-[9px] text-center text-amber-300 h-3">{own ? '★'.repeat(r) || '·' : <span className={piecesHave(save, id) >= (CO_PIECES[id] ?? 0) ? 'text-emerald-300' : 'text-fuchsia-300'}>🧩{piecesHave(save, id)}/{CO_PIECES[id]}</span>}</div>
                    </button>
                  );
                })}
              </div>

              <div className="hud-panel p-3 mt-1" style={{ borderColor: co.color }}>
                <div className="flex gap-3">
                  <Portrait id={selCo} size={92} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black tracking-widest" style={{ color: co.color }}>{co.faction === 'azure' ? 'AZURE REPUBLIC' : 'CRIMSON DOMINION'} · {co.title.toUpperCase()}</div>
                    <div className="text-xl font-black text-white leading-tight">{co.name}</div>
                    <div className="text-[11px] text-slate-300">{co.d2d}</div>
                    <div className="text-[11px] mt-1"><span className="text-fuchsia-300 font-bold">✦ {co.superName}</span> <span className="text-slate-500">(Ultimate charge {ultimateCost(co.id)})</span></div>
                    <button className="text-[11px] text-sky-300 underline font-bold mt-0.5" onClick={() => setInfo(selCo)}>ⓘ Full power details</button>
                  </div>
                </div>

                {!owned ? (
                  <div className="mt-3">
                    <div className="rounded-lg border border-fuchsia-400/50 bg-fuchsia-500/5 p-2">
                      <div className="text-[10px] font-black tracking-widest text-fuchsia-300 mb-1">🔒 LOCKED · PREVIEW ONLY</div>
                      <div className="text-xs text-slate-300">You can preview {co.name}'s powers, but to unlock them you need <b className="text-fuchsia-200">{needPieces} CO Pieces</b> and <b className="text-amber-300">{price} Gold</b>.</div>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                        <span className={piecesOk ? 'text-emerald-300' : 'text-fuchsia-300'}>🧩 Pieces {havePieces}/{needPieces}</span>
                        <span className={save.merits >= price ? 'text-emerald-300' : 'text-amber-300'}>🪙 Gold {save.merits}/{price}</span>
                      </div>
                      <div className="h-2.5 mt-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700"><div className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-300 transition-all" style={{ width: `${Math.min(100, (havePieces / Math.max(1, needPieces)) * 100)}%` }} /></div>
                      <div className="text-[10px] text-slate-400 mt-1">Earn pieces from every battle (more for wins and S/A ranks) and from first-time story clears.</div>
                    </div>
                    <button className="menu-btn w-full mt-2 bg-slate-700 text-sm" onClick={() => setInfo(selCo)}>👁 Preview {co.name}'s Powers</button>
                    <button disabled={!piecesOk || save.merits < price} className={`menu-btn w-full mt-2 ${piecesOk && save.merits >= price ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-500'}`} onClick={hire}>
                      {!piecesOk ? `NEED ${needPieces - havePieces} MORE PIECES` : save.merits < price ? `NEED ${price - save.merits} MORE GOLD` : `UNLOCK · 🪙 ${price}`}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 rounded-lg bg-slate-900/80 border border-slate-700 p-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-[10px] font-black text-slate-400 tracking-widest">RANK</div>
                          <div className="font-black text-amber-300">{'★'.repeat(rank)}{'☆'.repeat(RANK_MAX - rank)} {RANK_NAMES[rank]}</div>
                        </div>
                        {rank < RANK_MAX ? (
                          <button className={`menu-btn h-11 text-sm ${save.merits >= RANK_PRICE[rank] ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-500'}`} onClick={rankUp}>Promote · 🪙 {RANK_PRICE[rank]}</button>
                        ) : <div className="text-emerald-300 font-black text-sm">MAX RANK</div>}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1">Now: {rankDesc(rank)}</div>
                      {rank < RANK_MAX && <div className="text-[11px] text-emerald-300">Next: {rankDesc(rank + 1)}</div>}
                    </div>

                    <div className="mt-3">
                      <div className="text-[10px] font-black text-emerald-300 tracking-widest mb-1">🎴 SKILL SLOTS ({slots}) · tap a slot to equip</div>
                      <div className="grid gap-1.5">
                        {Array.from({ length: slots }).map((_, i) => {
                          const sk = loadout[i] ? SKILLS[loadout[i]] : null;
                          return (
                            <button key={i} onClick={() => { sfx.menu(); setSlotPick(i); }} className="flex items-center gap-2 p-2 rounded-lg border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 text-left active:scale-[0.99]">
                              <div className="text-2xl w-8 text-center">{sk ? sk.icon : '＋'}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-black text-white">{sk ? sk.name : 'Empty slot'}</div>
                                <div className="text-[11px] text-slate-400 truncate">{sk ? `${sk.kind} · Charge ${sk.cost} · ${sk.desc}` : 'Equip a skill you own'}</div>
                              </div>
                            </button>
                          );
                        })}
                        {rank < RANK_MAX && slots < rankSlots(RANK_MAX) && <div className="text-[10px] text-slate-500">More slots at rank {slots * 2} ({RANK_NAMES[slots * 2]}).</div>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {tab === 'skills' && (
            <>
              <div className="text-xs text-slate-400 mb-2">Tactical skills can be equipped on any officer. <b className="text-white">The stronger the skill, the more charge it costs.</b> Some are unlocked for free by clearing story missions.</div>
              <div className="grid gap-1.5">
                {SKILL_ORDER.map((id) => {
                  const sk = SKILLS[id];
                  const have = save.ownedSkills.includes(id);
                  const rm = rewardMission(id);
                  return (
                    <div key={id} className={`flex items-center gap-2 p-2 rounded-xl border bg-slate-900/80 ${have ? 'border-emerald-500/60' : 'border-slate-700'}`}>
                      <div className="text-3xl w-10 text-center">{sk.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-white">{sk.name}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${KIND_COLOR[sk.kind]}`}>{sk.kind.toUpperCase()}</span>
                        </div>
                        <div className="text-[11px] text-slate-300">{sk.desc}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] text-slate-400 font-bold w-14">CHARGE {sk.cost}</span>
                          <div className="flex-1 h-1.5 bg-slate-800 rounded overflow-hidden max-w-[180px]"><div className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500" style={{ width: `${(sk.cost / 130) * 100}%` }} /></div>
                        </div>
                        {!have && rm && <div className="text-[10px] text-sky-300 mt-0.5">🎁 Free reward: {rm}</div>}
                      </div>
                      {have ? <div className="text-emerald-300 text-xs font-black">OWNED</div> : (
                        <button onClick={() => buySkill(id)} className={`menu-btn h-10 text-xs ${save.merits >= sk.price ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>🪙 {sk.price}</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === 'units' && (
            <>
              <div className="text-xs text-slate-400 mb-2">Every upgrade has a trade-off. Mix the paths to build each unit your way. Refunds are free and give back all the merits.</div>
              <div className="flex gap-1.5 overflow-x-auto pb-2">
                {UNIT_ORDER.map((t) => {
                  const u = save.unitUps[t];
                  const n = u ? TRACK_ORDER.reduce((a, k) => a + (u[k] ?? 0), 0) : 0;
                  return (
                    <button key={t} onClick={() => { sfx.cursor(); setSelUnit(t); }} className={`shrink-0 rounded-lg p-1 border-2 relative ${selUnit === t ? 'border-amber-400 bg-slate-800' : 'border-transparent'}`}>
                      <UnitIcon type={t} size={44} />
                      {n > 0 && <span className="absolute -top-1 -right-1 bg-emerald-500 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{n}</span>}
                    </button>
                  );
                })}
              </div>
              <div className="hud-panel p-3">
                <div className="flex items-center gap-3">
                  <UnitIcon type={selUnit} size={64} />
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-black text-white">{d.name}</div>
                    <div className="text-[11px] text-slate-400">{d.desc}</div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mt-3">
                  {stat('ATTACK', '100%', `${100 + eff.atk}%`, eff.atk === 0 ? null : eff.atk > 0)}
                  {stat('DEFENSE', '100%', `${100 + eff.def}%`, eff.def === 0 ? null : eff.def > 0)}
                  {stat('MOVE', d.move, Math.max(1, d.move + eff.move), eff.move === 0 ? null : eff.move > 0)}
                  {stat('RANGE', `${d.range[0]}-${d.range[1]}`, `${d.range[0]}-${d.range[1] + eff.rmax}`, eff.rmax ? true : null)}
                  {stat('COST', `${d.cost}`, `${Math.round((d.cost * eff.costMul) / 100) * 100}`, eff.costMul === 1 ? null : eff.costMul < 1)}
                </div>
                <div className="grid gap-2 mt-3">
                  {TRACK_ORDER.filter((t) => !TRACKS[t].indirectOnly || indirect).map((t) => {
                    const lv = ups[t] ?? 0;
                    const tr = TRACKS[t];
                    return (
                      <div key={t} className="rounded-lg bg-slate-900/80 border border-slate-700 p-2 flex items-center gap-2">
                        <div className="text-2xl w-8 text-center">{tr.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black text-white">{tr.name} <span className="text-amber-300">Lv {lv}/{TRACK_MAX}</span></div>
                          <div className="text-[11px] text-emerald-300">▲ {tr.up}</div>
                          <div className="text-[11px] text-rose-300">▼ {tr.down}</div>
                          <div className="flex gap-1 mt-1">{Array.from({ length: TRACK_MAX }).map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded ${i < lv ? 'bg-amber-400' : 'bg-slate-700'}`} />)}</div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button disabled={lv >= TRACK_MAX} onClick={() => setTrack(t, 1)} className={`h-9 px-2 rounded-lg text-xs font-black border-2 ${lv < TRACK_MAX && save.merits >= TRACK_PRICE[lv] ? 'bg-amber-400 text-slate-900 border-amber-200' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>{lv >= TRACK_MAX ? 'MAX' : `▲ ${TRACK_PRICE[lv]}`}</button>
                          <button disabled={lv <= 0} onClick={() => setTrack(t, -1)} className={`h-7 px-2 rounded-lg text-[10px] font-bold border ${lv > 0 ? 'bg-slate-700 border-slate-500 text-slate-200' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>▼ Refund</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {next && (
        <div className="p-2 border-t-2 border-emerald-400/50 bg-slate-900/95">
          <button className="menu-btn w-full bg-emerald-400 text-slate-950 text-base shadow-[0_0_20px_rgba(52,211,153,0.5)]" onClick={() => { sfx.select(); next.onGo(); }}>{next.label}</button>
        </div>
      )}

      {slotPick !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 anim-fade p-2" onClick={() => setSlotPick(null)}>
          <div className="hud-panel p-3 w-[min(440px,96vw)] max-h-[85vh] overflow-auto anim-zoom" onClick={(e) => e.stopPropagation()}>
            <div className="font-black text-emerald-300 mb-2">Equip skill · Slot {slotPick + 1}</div>
            {save.ownedSkills.length === 0 && <div className="text-xs text-slate-400 mb-2">You don't own any skills yet. Buy them in the Skills tab, or earn them from story missions.</div>}
            <div className="grid gap-1.5">
              <button className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-left text-sm font-bold text-slate-300" onClick={() => equip(slotPick, null)}>✕ Empty slot</button>
              {SKILL_ORDER.filter((id) => save.ownedSkills.includes(id)).map((id) => {
                const sk = SKILLS[id];
                const inUse = loadout.includes(id);
                return (
                  <button key={id} onClick={() => equip(slotPick, id)} className={`flex items-center gap-2 p-2 rounded-lg border text-left ${inUse ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-700 bg-slate-900'}`}>
                    <div className="text-2xl w-8 text-center">{sk.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-white">{sk.name} <span className="text-[10px] text-slate-400">Charge {sk.cost}</span></div>
                      <div className="text-[11px] text-slate-400">{sk.desc}</div>
                    </div>
                    {inUse && <span className="text-[10px] text-emerald-300 font-black">EQUIPPED</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {info && <COInfo coId={info} onClose={() => setInfo(null)} rank={save.unlockedCos.includes(info) ? save.coRank[info] ?? 0 : undefined} skills={save.unlockedCos.includes(info) ? loadout : undefined} />}
      {flash && <div className={`absolute ${next ? 'bottom-20' : 'bottom-6'} left-1/2 -translate-x-1/2 z-50 hud-panel border-amber-400 px-4 py-2 font-black text-amber-300 anim-pop`}>{flash}</div>}
    </div>
  );
}
