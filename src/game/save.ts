import { getGraphicsPreset } from '../utils/hardware';
import { emptyUpgrades } from './engine';
import type { GameState, HighScore, SaveData, Settings, Weather } from './types';
import { MISSIONS } from './campaign';

const KEY = 'ironfront_tactics_v1';

export function defaultSettings(): Settings {
  const autoPreset = getGraphicsPreset('auto');
  return {
    battleAnim: 'all',
    speed: 1,
    sfx: true,
    graphicsQuality: 'auto',
    fpsTarget: 'uncapped',
    dprScale: 'auto',
    particles: 'full',
    shadows: true,
    weatherEffects: true,
    ...autoPreset,
  };
}

export function defaultSave(): SaveData {
  return {
    progress: 0,
    merits: 0,
    gems: 0,
    afkHarvest: { lastClaimTime: Date.now(), level: 1 },
    upgrades: emptyUpgrades(),
    mods: {},
    ownedMods: [],
    highscores: [],
    best: {},
    unlockedCos: ['rhea'],
    settings: defaultSettings(),
    coRank: {},
    ownedSkills: [],
    loadout: {},
    unitUps: {},
    coPieces: {},
    tutorialComplete: false,
    missionAuditUnlocked: false,
    normalCleared: {},
    fogCleared: {},
    advancedUnlocked: false,
    advancedMode: false,
    storyCleared: {},
    ownedSkins: ['default'],
    activeSkin: 'default',
    diamondPerks: [],
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const d = JSON.parse(raw);
    const def = defaultSave();
    const mergedSettings: Settings = { ...def.settings, ...(d.settings ?? {}) };
    // Backfill normalCleared for existing progress
    const normalCleared: Record<string, boolean> = d.normalCleared ?? {};
    if (d.progress > 0) {
      MISSIONS.forEach((m, idx) => {
        if (idx < d.progress) normalCleared[m.id] = true;
      });
    }
    const advancedUnlocked = d.advancedUnlocked ?? (d.progress >= MISSIONS.length - 1 || Object.keys(normalCleared).length >= MISSIONS.length - 1);
    const afkHarvest = d.afkHarvest && typeof d.afkHarvest.lastClaimTime === 'number'
      ? { lastClaimTime: d.afkHarvest.lastClaimTime, level: d.afkHarvest.level ?? 1 }
      : { lastClaimTime: Date.now(), level: 1 };
    return {
      ...def,
      ...d,
      afkHarvest,
      coRank: d.coRank ?? {},
      coPieces: d.coPieces ?? {},
      tutorialComplete: d.tutorialComplete ?? (d.progress > 0),
      missionAuditUnlocked: d.missionAuditUnlocked ?? false,
      normalCleared,
      fogCleared: d.fogCleared ?? {},
      advancedUnlocked,
      advancedMode: d.advancedMode ?? false,
      storyCleared: d.storyCleared ?? {},
      ownedSkins: d.ownedSkins ?? ['default'],
      activeSkin: d.activeSkin ?? 'default',
      diamondPerks: d.diamondPerks ?? [],
      ownedSkills: d.ownedSkills ?? [],
      loadout: d.loadout ?? {},
      unitUps: d.unitUps ?? {},
      settings: mergedSettings,
      upgrades: { ...def.upgrades, ...(d.upgrades ?? {}) },
    };
  } catch {
    return defaultSave();
  }
}

export function writeSave(s: SaveData) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/* ---------------- Campaign battle auto-save (resume where you left off) ---------------- */
const RESUME_KEY = 'ironfront_resume_v1';

export interface ResumeSave {
  v: 1;
  missionId: string;
  idx: number;
  playerCo: string;
  enemyCo: string;
  opts?: { weather?: Weather; fog?: boolean; aiLevel?: number; dynamic?: boolean };
  day: number;
  savedAt: number;
  /** Full battle state. The mission definition is stored by id, not duplicated here. */
  state: Omit<GameState, 'mission'>;
}

export function writeResume(r: Omit<ResumeSave, 'v' | 'savedAt'>) {
  try { localStorage.setItem(RESUME_KEY, JSON.stringify({ ...r, v: 1, savedAt: Date.now() })); } catch { /* storage full or blocked */ }
}

export function loadResume(): ResumeSave | null {
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as ResumeSave;
    if (r?.v !== 1 || !r.state || !Array.isArray(r.state.units) || !Array.isArray(r.state.tiles)) return null;
    return r;
  } catch {
    return null;
  }
}

export function clearResume() {
  try { localStorage.removeItem(RESUME_KEY); } catch { /* ignore */ }
}

/* ---------------- Named save slots (retained by the web host's browser storage) ---------------- */
export interface SaveSlot {
  name: string;
  savedAt: number;
  progress: SaveData;
  battle: ResumeSave | null;
}

const SLOT_KEY = 'ironfront_save_slots_v1';
export function loadSlots(): Record<string, SaveSlot> {
  try { return JSON.parse(localStorage.getItem(SLOT_KEY) ?? '{}') as Record<string, SaveSlot>; }
  catch { return {}; }
}
export function writeSlot(id: string, name: string, progress: SaveData, battle: ResumeSave | null) {
  const slots = loadSlots();
  slots[id] = { name: name.trim().slice(0, 24) || 'Commander', savedAt: Date.now(), progress, battle };
  localStorage.setItem(SLOT_KEY, JSON.stringify(slots));
}
export function deleteSlot(id: string) {
  const slots = loadSlots(); delete slots[id]; localStorage.setItem(SLOT_KEY, JSON.stringify(slots));
}

export function addHighScore(s: SaveData, h: HighScore): { save: SaveData; place: number } {
  const list = [...s.highscores, h].sort((a, b) => b.score - a.score).slice(0, 10);
  const place = list.indexOf(h);
  return { save: { ...s, highscores: list }, place };
}
