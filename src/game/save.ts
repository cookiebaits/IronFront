import { emptyUpgrades } from './engine';
import type { GameState, HighScore, SaveData, Weather } from './types';

const KEY = 'ironfront_tactics_v1';

export function defaultSave(): SaveData {
  return {
    progress: 0,
    merits: 0,
    upgrades: emptyUpgrades(),
    mods: {},
    ownedMods: [],
    highscores: [],
    best: {},
    unlockedCos: ['rhea'],
    settings: { battleAnim: 'all', speed: 1, sfx: true },
    coRank: {},
    ownedSkills: [],
    loadout: {},
    unitUps: {},
    coPieces: {},
    tutorialComplete: false,
    missionAuditUnlocked: false,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const d = JSON.parse(raw);
    const def = defaultSave();
    return { ...def, ...d, coRank: d.coRank ?? {}, coPieces: d.coPieces ?? {}, tutorialComplete: d.tutorialComplete ?? (d.progress > 0), missionAuditUnlocked: d.missionAuditUnlocked ?? false, ownedSkills: d.ownedSkills ?? [], loadout: d.loadout ?? {}, unitUps: d.unitUps ?? {}, settings: { ...def.settings, ...(d.settings ?? {}) }, upgrades: { ...def.upgrades, ...(d.upgrades ?? {}) } };
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
