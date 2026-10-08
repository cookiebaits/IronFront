import { CO_PIECES, PLAYABLE_ORDER } from './data';
import type { SaveData } from './types';

export interface PieceDrop { co: string; n: number; story?: boolean }

let lastDrops: PieceDrop[] = [];
/** Pieces granted by the most recently finished battle (shown on the results screen). */
export const getLastDrops = () => lastDrops;

export const piecesNeeded = (co: string) => CO_PIECES[co] ?? 0;
export const piecesHave = (s: SaveData, co: string) => s.coPieces?.[co] ?? 0;
export const canUnlockCo = (s: SaveData, co: string, price: number) =>
  !s.unlockedCos.includes(co) && piecesHave(s, co) >= piecesNeeded(co) && s.merits >= price;

/**
 * Grants CO Pieces after a battle.
 *  - Every battle drops a few pieces for a random officer you haven't unlocked yet
 *    (more for a win, more again for an S/A rank).
 *  - First-time story clears can also hand out a full bundle for the officer they introduce.
 * Pieces never unlock anyone by themselves: you still pay the Gold price in Command HQ.
 */
export function awardPieces(s: SaveData, o: { won: boolean; rank: string; storyCo?: string }): SaveData {
  const pieces: Record<string, number> = { ...(s.coPieces ?? {}) };
  const drops: PieceDrop[] = [];
  const locked = () => PLAYABLE_ORDER.filter((id) => !s.unlockedCos.includes(id) && piecesNeeded(id) > 0);

  const give = (co: string, n: number, story = false) => {
    const need = piecesNeeded(co);
    const cur = pieces[co] ?? 0;
    const add = Math.min(n, Math.max(0, need - cur));
    if (add <= 0) return;
    pieces[co] = cur + add;
    drops.push({ co, n: add, story });
  };

  if (o.storyCo === 'all') for (const id of locked()) give(id, Math.ceil(piecesNeeded(id) / 2), true);
  else if (o.storyCo && locked().includes(o.storyCo)) give(o.storyCo, piecesNeeded(o.storyCo), true);

  const candidates = locked().filter((id) => (pieces[id] ?? 0) < piecesNeeded(id) && !drops.some((d) => d.co === id));
  if (candidates.length) {
    const amount = (o.won ? 2 : 1) + (o.rank === 'S' ? 2 : o.rank === 'A' ? 1 : 0);
    give(candidates[Math.floor(Math.random() * candidates.length)], amount);
  }

  lastDrops = drops;
  return { ...s, coPieces: pieces };
}
