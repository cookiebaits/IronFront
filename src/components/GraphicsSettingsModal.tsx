import React, { useState } from 'react';
import type { DprOption, FpsTarget, GraphicsQuality, ParticleOption, Settings } from '../game/types';
import { detectHardware, getGraphicsPreset } from '../utils/hardware';

interface Props {
  settings: Settings;
  onSave: (st: Settings) => void;
  onClose: () => void;
}

export function GraphicsSettingsModal({ settings, onSave, onClose }: Props) {
  const [hw] = useState(() => detectHardware());
  const [current, setCurrent] = useState<Settings>(settings);

  const update = (patch: Partial<Settings>) => {
    const next = { ...current, ...patch };
    setCurrent(next);
    onSave(next);
  };

  const applyPreset = (preset: GraphicsQuality) => {
    const patch = getGraphicsPreset(preset);
    update({ ...patch, graphicsQuality: preset });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020617]/95 p-2 sm:p-4 anim-fade">
      <div className="relative w-full max-w-xl max-h-[96vh] overflow-y-auto bg-[#090d16] border-2 border-amber-500/80 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.3)] text-white p-4 sm:p-5 space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-widest text-amber-400 leading-tight">GRAPHICS & PERFORMANCE</h2>
              <p className="text-[11px] text-slate-400">Optimize frame rate, high refresh rate support, and visual quality.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-slate-300 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Hardware Specs Badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Hardware Detection</span>
            </div>
            <div className="text-xs font-semibold text-slate-200">
              {hw.cores} CPU Cores • ~{hw.memory}GB RAM • Tier: <span className="text-amber-400 font-bold uppercase">{hw.tier}</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md" title={hw.gpu}>
              GPU: {hw.gpu}
            </div>
          </div>
          <button
            onClick={() => applyPreset('auto')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-[11px] font-bold text-amber-300 transition shrink-0"
          >
            Auto Detect Best
          </button>
        </div>

        {/* Quality Presets */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quality Preset</label>
          <div className="grid grid-cols-5 gap-1.5">
            {(['auto', 'ultra', 'high', 'medium', 'low'] as GraphicsQuality[]).map((preset) => {
              const active = current.graphicsQuality === preset;
              return (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className={`py-1.5 px-1 rounded-lg font-bold text-[11px] uppercase tracking-wider border transition-all ${
                    active
                      ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* Performance & Refresh Rate Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Frame Rate / Refresh Rate Cap */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300">Target Refresh Rate / FPS</label>
              <span className="text-[11px] font-bold text-amber-400">{current.fpsTarget === 'uncapped' ? 'Uncapped (120Hz+)' : `${current.fpsTarget} FPS`}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['uncapped', 120, 60, 30] as FpsTarget[]).map((target) => (
                <button
                  key={String(target)}
                  onClick={() => update({ fpsTarget: target })}
                  className={`py-1 rounded text-[10px] font-bold border transition ${
                    current.fpsTarget === target
                      ? 'bg-amber-400 border-amber-300 text-slate-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {target === 'uncapped' ? 'Max' : `${target}`}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Resolution Scale (DPR) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300">Resolution Scale (DPR)</label>
              <span className="text-[11px] font-bold text-amber-400">{current.dprScale === 'auto' ? 'Auto (Native)' : `${current.dprScale}x`}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['auto', 2, 1.5, 1] as DprOption[]).map((scale) => (
                <button
                  key={String(scale)}
                  onClick={() => update({ dprScale: scale })}
                  className={`py-1 rounded text-[10px] font-bold border transition ${
                    current.dprScale === scale
                      ? 'bg-amber-400 border-amber-300 text-slate-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {scale === 'auto' ? 'Auto' : `${scale}x`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Effects Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Particles Quality */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300">Particle Effects Density</label>
              <span className="text-[11px] font-bold text-amber-400 uppercase">{current.particles}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['full', 'medium', 'low', 'off'] as ParticleOption[]).map((p) => (
                <button
                  key={p}
                  onClick={() => update({ particles: p })}
                  className={`py-1 rounded text-[10px] font-bold uppercase border transition ${
                    current.particles === p
                      ? 'bg-amber-400 border-amber-300 text-slate-950'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Gameplay & Audio Options */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300">Gameplay & Sound</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => update({ sfx: !current.sfx })}
                className={`py-1 px-2 rounded text-[10px] font-bold border transition ${
                  current.sfx
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                Sound: {current.sfx ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => update({ weatherEffects: !current.weatherEffects })}
                className={`py-1 px-2 rounded text-[10px] font-bold border transition ${
                  current.weatherEffects
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                Weather FX: {current.weatherEffects ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-1 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black tracking-wider text-xs uppercase shadow-lg transition"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
