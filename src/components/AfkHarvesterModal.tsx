import { useEffect, useState } from 'react';
import { claimAfkGold, formatDuration, getAfkStatus, HARVESTER_LEVELS, MAX_HARVEST_HOURS, upgradeAfkHarvester } from '../game/afk';
import { sfx } from '../game/audio';
import type { SaveData } from '../game/types';

export default function AfkHarvesterModal({ save, onSave, onClose }: { save: SaveData; onSave: (s: SaveData) => void; onClose: () => void }) {
  const [now, setNow] = useState<number>(Date.now());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const status = getAfkStatus(save, now);

  const handleClaim = () => {
    if (status.pendingGold <= 0) {
      sfx.cancel();
      toast('No gold ready to claim yet.');
      return;
    }
    const { save: nextSave, claimed } = claimAfkGold(save, now);
    sfx.build();
    onSave(nextSave);
    toast(`Claimed +${claimed.toLocaleString()} 🪙 Gold!`);
  };

  const handleUpgrade = () => {
    const res = upgradeAfkHarvester(save, now);
    if (!res.success) {
      sfx.cancel();
      toast(res.msg);
      return;
    }
    sfx.build();
    onSave(res.save);
    toast(res.msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 anim-fade" onClick={onClose}>
      <div className="hud-panel p-4 sm:p-6 w-[min(540px,96vw)] border-2 border-amber-400 bg-slate-950/95 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.3)] anim-zoom flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-amber-500/40 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-lg text-slate-950 font-black shrink-0">
              ⛏️
            </div>
            <div>
              <div className="text-[10px] font-black tracking-widest text-amber-400 uppercase">AFK AUTOMATED RESOURCE SYSTEM</div>
              <h2 className="text-xl font-black text-white leading-tight">GOLD HARVESTER</h2>
              <div className="text-xs text-slate-300 font-bold mt-0.5">
                Current: <span className="text-amber-300">{status.levelDef.name}</span> ({status.ratePerHour.toLocaleString()} Gold/hr)
              </div>
            </div>
          </div>
          <button className="hud-btn w-9 h-9 text-slate-400 hover:text-white text-base" onClick={onClose}>✕</button>
        </div>

        {/* Live Harvester Display Box */}
        <div className={`rounded-xl border-2 p-4 flex flex-col gap-3 relative overflow-hidden ${status.capReached ? 'border-rose-500/80 bg-rose-950/30' : 'border-amber-400/60 bg-slate-900/90'}`}>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-[10px] font-black tracking-wider text-slate-400">UNCLAIMED HARVESTED GOLD</div>
              <div className="text-3xl font-black text-amber-300 tracking-tight flex items-center gap-2">
                <span>🪙 +{status.pendingGold.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">/{status.maxGold.toLocaleString()} Max</span>
              </div>
            </div>
            <button
              disabled={status.pendingGold <= 0}
              onClick={handleClaim}
              className={`menu-btn h-12 px-5 text-sm font-black shadow-lg transition active:scale-95 ${status.pendingGold > 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.5)]' : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}`}
            >
              CLAIM GOLD 🪙
            </button>
          </div>

          {/* Progress Bar & Cap Alert */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-slate-300">Harvest Time: <b className="text-white">{formatDuration(status.cappedSeconds)}</b> / {MAX_HARVEST_HOURS}h Max</span>
              <span className={status.capReached ? 'text-rose-400 font-black animate-pulse' : 'text-amber-300'}>
                {status.progressPercent.toFixed(1)}% Full
              </span>
            </div>

            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${status.capReached ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 animate-pulse' : 'bg-gradient-to-r from-amber-500 to-amber-300'}`}
                style={{ width: `${status.progressPercent}%` }}
              />
            </div>

            {status.capReached ? (
              <div className="text-[11px] font-black text-rose-300 bg-rose-900/60 border border-rose-500/60 p-2 rounded-lg text-center mt-1">
                ⚠️ STORAGE FULL (24 HOURS REACHED)! Harvesting paused until claimed.
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 italic">
                • Generates gold continuously up to 24 hours offline or online. Claim anytime to keep harvesting!
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Harvester Section */}
        <div className="hud-panel p-3 bg-slate-900/80 border-slate-700 rounded-xl flex flex-col gap-2">
          <div className="text-xs font-black text-amber-300 tracking-wider flex items-center justify-between">
            <span>UPGRADE HARVESTER CAPACITY & RATE</span>
            <span className="text-slate-400 font-bold">Your Gold: 🪙 {save.merits.toLocaleString()}</span>
          </div>

          {status.nextLevelDef ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <div className="flex-1 min-w-0 text-xs">
                <div className="font-black text-white text-sm">{status.nextLevelDef.name}</div>
                <div className="text-emerald-300 font-bold mt-0.5">
                  ▲ Production: {status.nextLevelDef.ratePerHour.toLocaleString()} Gold/hr (Max {Math.floor(24 * status.nextLevelDef.ratePerHour).toLocaleString()} Gold / 24h)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{status.nextLevelDef.desc}</div>
              </div>
              <button
                disabled={save.merits < status.nextLevelDef.upgradeCost}
                onClick={handleUpgrade}
                className={`menu-btn h-12 px-4 text-xs font-black shrink-0 transition active:scale-95 ${save.merits >= status.nextLevelDef.upgradeCost ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.4)]' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
              >
                UPGRADE · 🪙 {status.nextLevelDef.upgradeCost.toLocaleString()}
              </button>
            </div>
          ) : (
            <div className="text-center py-3 text-xs font-black text-emerald-300 bg-emerald-950/40 border border-emerald-800 rounded-lg">
              ✨ MAXIMUM HARVESTER LEVEL REACHED (Level 5 Quantum Harvester)
            </div>
          )}
        </div>

        {/* All Harvester Levels Overview */}
        <div className="hud-panel p-3 bg-slate-900/60 border-slate-800 rounded-xl text-xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">HARVESTER TIER OVERVIEW</div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 text-[10px]">
            {HARVESTER_LEVELS.map((lvl) => {
              const isCurrent = lvl.level === status.level;
              return (
                <div key={lvl.level} className={`p-1.5 rounded border flex flex-col justify-between ${isCurrent ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-black' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
                  <div>
                    <div className="font-bold truncate">{lvl.name}</div>
                    <div className={isCurrent ? 'text-amber-300' : 'text-slate-300'}>{lvl.ratePerHour} G/hr</div>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">24h: {(lvl.ratePerHour * 24).toLocaleString()}G</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 hud-panel border-amber-400 px-4 py-2 font-black text-amber-300 bg-slate-950 shadow-2xl anim-pop text-sm">
            {toastMsg}
          </div>
        )}
      </div>
    </div>
  );
}
