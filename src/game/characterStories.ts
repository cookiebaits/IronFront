import { COS } from './data';
import type { MissionDef, Team, UnitType, Weather } from './types';

const SWAP: Record<string, string> = { C: 'X', X: 'C', B: 'Y', Y: 'B', A: 'Z', Z: 'A', P: 'Q', Q: 'P', T: 'V', V: 'T', H: 'E', E: 'H' };

function sym(half: string[]): string[] {
  return half.map((r) => r + r.split('').reverse().map((c) => SWAP[c] ?? c).join(''));
}

function mir(width: number, list: [UnitType, number, number][], extra: [UnitType, number, number][] = []): [UnitType, number, number, Team][] {
  const out: [UnitType, number, number, Team][] = [];
  for (const [t, x, y] of list) {
    out.push([t, x, y, 0]);
    out.push([t, width - 1 - x, y, 1]);
  }
  for (const [t, x, y] of extra) out.push([t, x, y, 1]);
  return out;
}

export interface CharacterStoryChapter {
  id: string;
  coId: string;
  chapterIndex: number; // 1 to 10
  title: string;
  summary: string;
  mission: MissionDef;
}

/** Pre-designed unique map layouts across different terrains and tactical themes. */
const STORY_MAP_TEMPLATES: string[][] = [
  // 0: Classic Valley Chokepoint
  sym(['mmf..f.', 'mH=c...', 'fB=d..c', '..f=.f.', '.c.dddd', 'f..f...', 'mm.c.ff', '.f...t.', 'mmm.f..']),
  // 1: River Delta Bridgehead
  sym(['mmf..f~', 'mH=c.f~', 'fB==.=#', '..f.f.~', '.c..mf~', 'f=====#', 'mf.c..~', '..ft.f~', 'mmm..m~']),
  // 2: Mountain Pass & Highway
  sym(['mmmff..', 'mH=..f.', 'mB=c...', 'm.=..m.', '..===.=', 'fc.m...', 'm..f.c.', 'mm.t.f.', 'mmm.mm.']),
  // 3: Airfield & Open Plains
  sym(['mmf.f.A.', 'mH=c...m', 'mB==A...', '.A.=.t..', '...====.', 'fc..f...', 'm..c..f.', '..f.=...', 'mm..f...']),
  // 4: Coastal Archipelago
  sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
  // 5: Desert Dunes & Dirt Roads
  sym(['m.d..f.', 'mH=c.d.', 'fB=d..c', 'd.f=.f.', '.c.dddd', 'f..d...', 'mm.c.fd', '.d...t.', 'mmm.d..']),
  // 6: Forest Ridge & Radio Towers
  sym(['.t.f..f', 'mH=c.t.', 'fB=d.tc', '..f=.f.', '.c.dddd', 'f.t.f..', 'mm.c.ff', '.f...t.', 'mmm.f..']),
  // 7: Fortress Moat & River Bridges
  sym(['mmf..f..', 'mH=c...m', 'fB==~.#.', '..f=~.c.', '.A.====.', 'f..c~f..', 'mm.f~.m.', '...=#c..', 'mm..f...']),
  // 8: Deep Trench & Urban Center
  sym(['c.f..f.', 'EH=c...', 'fB=d..c', '..f=.f.', '.c.dddd', 'f..f...', 'mm.c.ff', '.f...t.', 'mmm.f..']),
  // 9: Glacier Pass & Snow
  sym(['mmsf..f', 'EH=c.m.', 'fB=d.m.', '..f=.f.', '.c.dddd', 'f..f...', 'mm.c.ff', '.f...t.', 'mmm.f..']),
];

/** Unit loadout presets matching CO tactical specialties. */
const CO_SPECIALTY_UNITS: Record<string, [UnitType, number, number][][]> = {
  rhea: [
    [['infantry', 3, 1], ['mech', 4, 2], ['tank', 3, 3], ['recon', 2, 5], ['artillery', 2, 3], ['bcopter', 1, 4]],
    [['infantry', 3, 1], ['mech', 4, 2], ['tank', 3, 3], ['heavy', 2, 4], ['artillery', 2, 3], ['recon', 1, 5]],
  ],
  sora: [
    [['fighter', 2, 1], ['bomber', 3, 2], ['bcopter', 4, 3], ['gundrone', 2, 4], ['drone', 1, 5]],
    [['fighter', 2, 1], ['bomber', 3, 2], ['bcopter', 4, 3], ['gundrone', 2, 4], ['tcopter', 1, 5], ['infantry', 2, 5]],
  ],
  dax: [
    [['tank', 3, 1], ['tank', 4, 4], ['heavy', 2, 3], ['apc', 2, 5], ['infantry', 4, 2], ['artillery', 1, 3], ['aa', 3, 6]],
    [['heavy', 3, 1], ['heavy', 4, 4], ['tank', 2, 3], ['apc', 2, 5], ['mech', 4, 2], ['rockets', 1, 3], ['aa', 3, 6]],
  ],
  mira: [
    [['battleship', 0, 3], ['cruiser', 1, 2], ['sub', 2, 4], ['tank', 5, 2], ['infantry', 5, 1], ['bcopter', 3, 5]],
    [['battleship', 0, 3], ['battleship', 0, 5], ['cruiser', 1, 2], ['sub', 2, 4], ['heavy', 5, 2], ['fighter', 3, 5]],
  ],
  brann: [
    [['artillery', 4, 2], ['rockets', 2, 3], ['artillery', 4, 6], ['tank', 5, 3], ['infantry', 6, 1], ['mech', 6, 7], ['recon', 4, 8]],
    [['rockets', 4, 2], ['rockets', 2, 3], ['missiles', 4, 6], ['heavy', 5, 3], ['mech', 6, 1], ['mech', 6, 7], ['apc', 4, 8]],
  ],
  kaelen: [
    [['fighter', 2, 1], ['bcopter', 3, 2], ['tcopter', 2, 4], ['infantry', 2, 5], ['gundrone', 4, 3]],
    [['fighter', 2, 1], ['bomber', 3, 2], ['bcopter', 3, 4], ['gundrone', 4, 3], ['drone', 1, 5]],
  ],
  aria: [
    [['recon', 2, 1], ['drone', 3, 2], ['missiles', 1, 4], ['tank', 4, 3], ['infantry', 3, 5]],
    [['recon', 2, 1], ['gundrone', 3, 2], ['missiles', 1, 4], ['heavy', 4, 3], ['mech', 3, 5]],
  ],
  grimm: [
    [['infantry', 1, 1], ['infantry', 2, 2], ['infantry', 3, 3], ['mech', 2, 4], ['mech', 4, 2], ['apc', 1, 3], ['recon', 3, 5]],
    [['infantry', 1, 1], ['infantry', 2, 2], ['mech', 3, 3], ['mech', 2, 4], ['mech', 4, 2], ['apc', 1, 3], ['tank', 3, 5]],
  ],
  frost: [
    [['heavy', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['artillery', 1, 3], ['sub', 0, 5]],
    [['heavy', 2, 2], ['heavy', 3, 1], ['mech', 2, 4], ['rockets', 1, 3], ['bcopter', 2, 5]],
  ],
  nyx: [
    [['recon', 2, 1], ['mech', 3, 2], ['drone', 2, 4], ['tank', 4, 3], ['infantry', 3, 5]],
    [['recon', 2, 1], ['mech', 3, 2], ['gundrone', 2, 4], ['heavy', 4, 3], ['bcopter', 3, 5]],
  ],
  volkov: [
    [['heavy', 2, 2], ['tank', 3, 1], ['bomber', 1, 4], ['rockets', 2, 5], ['battleship', 0, 3]],
    [['heavy', 2, 2], ['heavy', 3, 1], ['bomber', 1, 4], ['rockets', 2, 5], ['fighter', 2, 3]],
  ],
  zero: [
    [['rockets', 2, 3], ['artillery', 4, 2], ['missiles', 1, 5], ['heavy', 5, 3], ['infantry', 6, 1]],
    [['rockets', 2, 3], ['rockets', 4, 2], ['missiles', 1, 5], ['heavy', 5, 3], ['mech', 6, 1]],
  ],
  seraphina: [
    [['apc', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['infantry', 4, 3], ['bcopter', 1, 5]],
    [['apc', 2, 2], ['heavy', 3, 1], ['mech', 2, 4], ['infantry', 4, 3], ['tcopter', 1, 5], ['mech', 2, 5]],
  ],
  architect: [
    [['gundrone', 2, 1], ['heavy', 3, 2], ['bomber', 1, 4], ['battleship', 0, 3], ['rockets', 2, 5]],
    [['gundrone', 2, 1], ['heavy', 3, 2], ['bomber', 1, 4], ['fighter', 2, 3], ['rockets', 2, 5]],
  ],
};

const ENEMY_ROTATIONS: Record<string, string[]> = {
  rhea: ['grimm', 'frost', 'nyx', 'volkov', 'zero', 'grimm', 'frost', 'volkov', 'seraphina', 'architect'],
  sora: ['kaelen', 'nyx', 'kaelen', 'nyx', 'sora', 'architect', 'kaelen', 'nyx', 'architect', 'architect'],
  dax: ['grimm', 'volkov', 'grimm', 'volkov', 'zero', 'grimm', 'volkov', 'architect', 'seraphina', 'architect'],
  mira: ['volkov', 'frost', 'volkov', 'frost', 'mira', 'volkov', 'architect', 'seraphina', 'architect', 'architect'],
  brann: ['zero', 'volkov', 'zero', 'volkov', 'zero', 'architect', 'zero', 'seraphina', 'architect', 'architect'],
  kaelen: ['sora', 'nyx', 'sora', 'nyx', 'aria', 'sora', 'nyx', 'kaelen', 'architect', 'architect'],
  aria: ['zero', 'nyx', 'zero', 'nyx', 'aria', 'zero', 'nyx', 'seraphina', 'architect', 'architect'],
  grimm: ['rhea', 'dax', 'rhea', 'dax', 'brann', 'rhea', 'dax', 'volkov', 'architect', 'architect'],
  frost: ['mira', 'rhea', 'mira', 'rhea', 'sora', 'mira', 'rhea', 'volkov', 'architect', 'architect'],
  nyx: ['aria', 'kaelen', 'aria', 'kaelen', 'sora', 'aria', 'kaelen', 'seraphina', 'architect', 'architect'],
  volkov: ['rhea', 'brann', 'rhea', 'brann', 'dax', 'rhea', 'brann', 'volkov', 'architect', 'architect'],
  zero: ['brann', 'dax', 'brann', 'dax', 'brann', 'dax', 'brann', 'seraphina', 'architect', 'architect'],
  seraphina: ['rhea', 'mira', 'rhea', 'mira', 'rhea', 'mira', 'rhea', 'seraphina', 'architect', 'architect'],
  architect: ['rhea', 'aria', 'sora', 'dax', 'mira', 'brann', 'kaelen', 'volkov', 'seraphina', 'architect'],
};

const CO_CHAPTER_TITLES: Record<string, string[]> = {
  rhea: ['Academy Drills', 'Border Patrol', 'Combined Arms 101', 'Tactical Chokepoint', 'Pincer Exercise', 'Counter-Offensive', 'Bridgehead Assault', 'Redoubt Defense', 'Vanguard Sweep', 'Apex Instructor'],
  sora: ['Sky Patrol', 'Thermal Drafts', 'Clouds of Ash', 'Winged Escort', 'Interception Grid', 'Stratosphere Supremacy', 'Thunder Sweep', 'High Altitude Breach', 'Skybreaker Strike', 'Apex Sky Dominance'],
  dax: ['Iron Tread', 'Steel Vanguard', 'Canyon Blitz', 'Armor Shock', 'Tank Graveyard', 'Heavy Assault', 'Paved Thunder', 'Breakthrough Column', 'Juggernaut Line', 'Iron Supremacy'],
  mira: ['Coastal Watch', 'Saltmarch Tide', 'Reef Ambush', 'Torpedo Run', 'Monsoon Fleet', 'Abyssal Passage', 'Storm Harbor', 'Battleship Row', 'Typhoon Surge', 'Oceanic Sovereignty'],
  brann: ['Range Finder', 'Long Guns', 'Spotter Grid', 'Sandstorm Barrage', 'Fortress Siege', 'Thunder Valley', 'Over-The-Horizon', 'Rockets Red Glare', 'Chokepoint Shelling', 'Global Battery'],
  kaelen: ['High Altitude Sortie', 'Aerial Escort', 'Cloud Interception', 'Tailwind Pursuit', 'Airborne Resupply', 'Sky Grid Lock', 'Jetstream Breach', 'Stratosphere Duel', 'Wingman Vanguard', 'Ace Supremacy'],
  aria: ['Signal Hack', 'Radar Jamming', 'Overclock Pulse', 'EM Grid Sweep', 'Cyber Disruption', 'Matrix Lockdown', 'Nanite Protocol', 'Decryption Raid', 'System Overload', 'Apex Cyber Dominance'],
  grimm: ['Human Wave', 'Infantry Horde', 'Trench Assault', 'Bazooka Rush', 'Swarm Protocol', 'Bunker Buster', 'Mass Infiltration', 'Iron Vanguard', 'Unstoppable Horde', 'Warlord Conquest'],
  frost: ['Sub-Zero Patrol', 'Blizzard Defense', 'Glacier Breach', 'Frostbite Pass', 'Frozen Lake Run', 'Ice Vanguard', 'Whiteout Strike', 'Cold Front Siege', 'Polar Juggernaut', 'Winter Supremacy'],
  nyx: ['Shadow Patrol', 'Night Infiltration', 'Silent Ambush', 'Fog Breach', 'Eclipse Strike', 'Midnight Raid', 'Phantom Grid', 'Shadow Vanguard', 'Veil of Darkness', 'Apex Shadow'],
  volkov: ['Iron March', 'Crushing Column', 'Heavy Barrage', 'Dominion Shock', 'Fortress Breaker', 'Steel Tempest', 'Red Storm Vanguard', 'Anvil Strike', 'Juggernaut March', 'Iron General Sovereignty'],
  zero: ['Siege Protocol', 'Artillery Battery', 'Long-Range Grid', 'Rockets Barrage', 'Chokepoint Shelling', 'Mortar Network', 'Global Targeter', 'Surgical Shelling', 'Battery Sweep', 'Apex Siege Dominance'],
  seraphina: ['Field Triage', 'Nanite Repair', 'Frontline Sanctuary', 'Endless Defense', 'Property Bastion', 'Med-Evac Escort', 'Restoration Grid', 'Regenerative Surge', 'Aegis Frontline', 'Apex Medic Dominance'],
  architect: ['Matrix Calibration', 'Singularity Calculation', 'Drone Swarm Protocol', 'War Engine Breach', 'Architect Redoubt', 'Neural Overdrive', 'Synthetic Vanguard', 'Global Recalibration', 'Singularity Core Strike', 'Apex Architect Sovereignty'],
};

/** Generate 10 specialized, story-rich chapters for each officer with customized lore, dialogues, and adaptive events. */
export function getCharacterStoryChapters(coId: string): CharacterStoryChapter[] {
  const titles = CO_CHAPTER_TITLES[coId] ?? Array.from({ length: 10 }, (_, i) => `Chapter ${i + 1}`);
  const enemies = ENEMY_ROTATIONS[coId] ?? Array.from({ length: 10 }, () => 'grimm');
  const coDef = COS[coId];

  return Array.from({ length: 10 }, (_, i) => {
    const chNum = i + 1;
    const enemyCo = enemies[i];
    const mapTemplate = STORY_MAP_TEMPLATES[(i + (coId.charCodeAt(0) % 10)) % STORY_MAP_TEMPLATES.length];
    const unitPresets = CO_SPECIALTY_UNITS[coId] ?? CO_SPECIALTY_UNITS.rhea;
    const myUnits = unitPresets[i % unitPresets.length];
    const enemyExtras: [UnitType, number, number][] = i >= 4 ? [['heavy', 9, 3], ['tank', 10, 4]] : [['tank', 9, 3]];

    const weatherList: Weather[] = ['clear', 'clear', 'rain', 'snow', 'sand'];
    const weather = (coId === 'frost' ? 'snow' : coId === 'mira' ? 'rain' : coId === 'zero' || coId === 'brann' ? 'sand' : weatherList[i % weatherList.length]) as Weather;
    const fog = coId === 'nyx' || coId === 'aria' || i >= 6;

    return {
      id: `story_${coId}_${chNum}`,
      coId,
      chapterIndex: chNum,
      title: titles[i],
      summary: `${coDef?.name ?? coId}'s Story Chapter ${chNum}: Demonstrate master-level ${coDef?.d2d ?? 'tactics'} in this specialized mission. Earn 🧩 ${coDef?.name ?? coId} Pieces and promote officer rank!`,
      mission: {
        id: `story_${coId}_m${chNum}`,
        name: `${coDef?.name.split(' ')[0] ?? coId} Ch.${chNum} — ${titles[i]}`,
        act: 1,
        par: 7 + i,
        map: mapTemplate,
        units: mir(14, myUnits, enemyExtras),
        cos: [coId],
        enemyCo,
        funds: [4500 + i * 500, 5000 + i * 500],
        weather,
        fog,
        unitCap: [14 + Math.floor(i / 2), 16 + Math.floor(i / 2)],
        objective: { type: 'rout' },
        recommendedRank: Math.min(4, Math.floor(i / 2)),
        recommendedUpgrades: i * 2,
        aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
        hint: `${coDef?.name ?? coId}'s specialty: ${coDef?.d2d ?? 'balanced warfare'}. Use tailored unit strengths and terrain to achieve victory!`,
        ...(chNum === 5 || chNum === 10 ? {
          adaptiveTrigger: { enemyCountBelow: 5 },
          adaptiveObjective: { type: 'hq' },
          adaptiveDialogue: [
            { who: coId, text: 'The opponent\'s primary line is crumbling! Shift focus to securing their command headquarters!' },
            { who: enemyCo, text: 'You won\'t breach our last redoubt!' },
          ],
        } : {}),
        briefing: [
          { who: coId, text: `Chapter ${chNum}: ${coDef?.title ?? 'Officer'} ${coDef?.name ?? coId} in command. Deploying specialized battle formation.` },
          { who: coId, text: `Remember our core tactical advantage: ${coDef?.d2d ?? 'combined arms supremacy'}.` },
          { who: enemyCo, text: `You think your specialized tactics can defeat ${COS[enemyCo]?.name ?? enemyCo}? Prepare for battle!` },
          { who: coId, text: 'All squads, advance and execute mission directives!' },
        ],
        outro: [
          { who: coId, text: `Chapter ${chNum} complete! Flawless execution from all platoons.` },
          { who: enemyCo, text: 'Tch... your tactical execution was flawless. We yield this sector...' },
          { who: coId, text: 'Maintain formation and log battle data. Our officers grow stronger with every victory!' },
        ],
      },
    };
  });
}
