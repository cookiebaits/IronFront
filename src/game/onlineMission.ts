import type { MissionDef, Team, UnitType } from './types';

const SWAP: Record<string, string> = { H: 'E', E: 'H', B: 'Y', Y: 'B', C: 'X', X: 'C' };

function mirrorMap(half: string[]) {
  return half.map((row) => row + row.split('').reverse().map((ch) => SWAP[ch] ?? ch).join(''));
}

function mirrorUnits(units: [UnitType, number, number][]): [UnitType, number, number, Team][] {
  const out: [UnitType, number, number, Team][] = [];
  for (const [type, x, y] of units) {
    out.push([type, x, y, 0]);
    out.push([type, 13 - x, y, 1]);
  }
  return out;
}

/** Fixed mirrored map, equal starting armies, funds, income, and production for fair private PvP. */
export const ONLINE_DUEL: MissionDef = {
  id: 'online-duel',
  name: 'Mirror Front',
  act: 0,
  map: mirrorMap([
    'mmf...m',
    'mHc....',
    'fB==.c.',
    '..=..t.',
    '.c.===.',
    'f...c..',
    'mm...f.',
    '..m....',
  ]),
  units: mirrorUnits([
    ['infantry', 4, 1],
    ['tank', 4, 3],
    ['recon', 3, 5],
    ['artillery', 2, 4],
    ['mech', 4, 6],
  ]),
  cos: [],
  enemyCo: 'rhea',
  funds: [7000, 7000],
  weather: 'clear',
  fog: false,
  unitCap: [14, 14],
  objective: { type: 'rout' },
  aiLevel: 0,
  briefing: [],
  outro: [],
  par: 12,
  hint: 'A mirrored private online battle. Both players start with the same army, income, funds, and unit cap.',
};