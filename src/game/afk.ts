import type { SaveData } from './types';

export interface AfkHarvestData {
  lastClaimTime: number; // timestamp in ms
  level: number; // 1 to 5
}

export interface HarvesterLevelDef {
  level: number;
  name: string;
  ratePerHour: number;
  upgradeCost: number; // 0 for level 1
  desc: string;
}

export const MAX_HARVEST_HOURS = 21.6;
export const MAX_HARVEST_SECONDS = MAX_HARVEST_HOURS * 3600;

export const HARVESTER_LEVELS: HarvesterLevelDef[] = [
  { level: 1, name: 'Gold Drill Lv.1', ratePerHour: 500, upgradeCost: 0, desc: 'Standard gold harvesting rig. Produces 500 Gold/hr (Max 10,800 Gold / 21.6h).' },
  { level: 2, name: 'Gold Excavator Lv.2', ratePerHour: 800, upgradeCost: 8000, desc: 'Enhanced hydraulic drill array. Produces 800 Gold/hr (Max 17,280 Gold / 21.6h).' },
  { level: 3, name: 'Deep Core Miner Lv.3', ratePerHour: 1200, upgradeCost: 16000, desc: 'Heavy magma core extractor. Produces 1,200 Gold/hr (Max 25,920 Gold / 21.6h).' },
  { level: 4, name: 'Automated Foundry Lv.4', ratePerHour: 1700, upgradeCost: 28000, desc: 'Automated refining plant. Produces 1,700 Gold/hr (Max 36,720 Gold / 21.6h).' },
  { level: 5, name: 'Quantum Harvester Lv.5', ratePerHour: 2400, upgradeCost: 45000, desc: 'Orbital energy collector. Produces 2,400 Gold/hr (Max 51,840 Gold / 21.6h).' },
];

export function getHarvesterLevel(level: number): HarvesterLevelDef {
  const idx = Math.max(0, Math.min(HARVESTER_LEVELS.length - 1, (level || 1) - 1));
  return HARVESTER_LEVELS[idx];
}

export interface AfkStatus {
  level: number;
  levelDef: HarvesterLevelDef;
  nextLevelDef: HarvesterLevelDef | null;
  pendingGold: number;
  maxGold: number;
  elapsedSeconds: number;
  cappedSeconds: number;
  capReached: boolean;
  progressPercent: number;
  ratePerHour: number;
  ratePerSec: number;
}

export function isHarvesterUnlocked(save: SaveData): boolean {
  return Boolean(save.tutorialComplete || save.progress > 0);
}

export function getAfkStatus(save: SaveData, now = Date.now()): AfkStatus {
  const unlocked = isHarvesterUnlocked(save);
  const afk = save.afkHarvest ?? { lastClaimTime: now, level: 1 };
  const level = Math.max(1, Math.min(HARVESTER_LEVELS.length, afk.level ?? 1));
  const levelDef = getHarvesterLevel(level);
  const nextLevelDef = level < HARVESTER_LEVELS.length ? getHarvesterLevel(level + 1) : null;

  const lastClaim = afk.lastClaimTime && afk.lastClaimTime > 0 ? afk.lastClaimTime : now;
  const rawElapsedSec = unlocked ? Math.max(0, Math.floor((now - lastClaim) / 1000)) : 0;
  const cappedSeconds = Math.min(rawElapsedSec, MAX_HARVEST_SECONDS);
  const capReached = rawElapsedSec >= MAX_HARVEST_SECONDS;

  const ratePerSec = levelDef.ratePerHour / 3600;
  const pendingGold = unlocked ? Math.floor(cappedSeconds * ratePerSec) : 0;
  const maxGold = Math.floor(MAX_HARVEST_SECONDS * ratePerSec);
  const progressPercent = Math.min(100, (cappedSeconds / MAX_HARVEST_SECONDS) * 100);

  return {
    level,
    levelDef,
    nextLevelDef,
    pendingGold,
    maxGold,
    elapsedSeconds: rawElapsedSec,
    cappedSeconds,
    capReached,
    progressPercent,
    ratePerHour: levelDef.ratePerHour,
    ratePerSec,
  };
}

export function claimAfkGold(save: SaveData, now = Date.now()): { save: SaveData; claimed: number } {
  const status = getAfkStatus(save, now);
  if (status.pendingGold <= 0) {
    return { save, claimed: 0 };
  }

  const currentAfk = save.afkHarvest ?? { lastClaimTime: now, level: 1 };
  const newAfk: AfkHarvestData = {
    ...currentAfk,
    lastClaimTime: now,
  };

  const updatedSave: SaveData = {
    ...save,
    merits: save.merits + status.pendingGold,
    afkHarvest: newAfk,
  };

  return { save: updatedSave, claimed: status.pendingGold };
}

export function upgradeAfkHarvester(save: SaveData, now = Date.now()): { save: SaveData; success: boolean; msg: string } {
  const status = getAfkStatus(save, now);
  if (!status.nextLevelDef) {
    return { save, success: false, msg: 'Harvester is already at maximum level!' };
  }

  const cost = status.nextLevelDef.upgradeCost;
  if (save.merits < cost) {
    return { save, success: false, msg: `Need ${cost - save.merits} more Gold to upgrade.` };
  }

  const currentAfk = save.afkHarvest ?? { lastClaimTime: now, level: 1 };
  const { save: claimedSave } = claimAfkGold(save, now);

  const updatedAfk: AfkHarvestData = {
    ...(claimedSave.afkHarvest ?? currentAfk),
    level: currentAfk.level + 1,
    lastClaimTime: now,
  };

  const finalSave: SaveData = {
    ...claimedSave,
    merits: claimedSave.merits - cost,
    afkHarvest: updatedAfk,
  };

  return {
    save: finalSave,
    success: true,
    msg: `Upgraded Harvester to ${status.nextLevelDef.name}!`,
  };
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}
