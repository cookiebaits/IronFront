import { COS } from './data';
import type { Dialogue, MissionDef, Team, UnitType, Weather } from './types';

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

const SEA_TILES = new Set(['w', 's', 'r', 'P', 'Q']);

/** Replaces naval units placed on non-sea tiles with ground equivalents so units aren't trapped on land. */
function sanitizeUnitsForMap(map: string[], units: [UnitType, number, number, Team][]): [UnitType, number, number, Team][] {
  return units.map(([type, x, y, team]) => {
    const tile = map[y]?.[x];
    if (tile && !SEA_TILES.has(tile)) {
      if (type === 'battleship') return ['rockets', x, y, team];
      if (type === 'cruiser') return ['aa', x, y, team];
      if (type === 'sub') return ['recon', x, y, team];
      if ((type as string) === 'carrier') return ['heavy', x, y, team];
    }
    return [type, x, y, team];
  });
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
  valerie: [
    [['mech', 2, 2], ['tank', 3, 1], ['tank', 2, 4], ['infantry', 4, 3], ['artillery', 1, 5]],
    [['heavy', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['apc', 4, 3], ['rockets', 1, 5]],
  ],
  malakor: [
    [['heavy', 2, 2], ['artillery', 3, 1], ['rockets', 2, 4], ['tank', 4, 3], ['aa', 1, 5]],
    [['heavy', 2, 2], ['heavy', 3, 1], ['artillery', 2, 4], ['rockets', 4, 3], ['missiles', 1, 5]],
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
  valerie: ['grimm', 'volkov', 'kaelen', 'frost', 'zero', 'malakor', 'volkov', 'architect', 'malakor', 'architect'],
  kaelen: ['sora', 'nyx', 'sora', 'nyx', 'aria', 'sora', 'nyx', 'kaelen', 'architect', 'architect'],
  aria: ['zero', 'nyx', 'zero', 'nyx', 'aria', 'zero', 'nyx', 'seraphina', 'architect', 'architect'],
  grimm: ['rhea', 'dax', 'rhea', 'dax', 'brann', 'rhea', 'dax', 'volkov', 'architect', 'architect'],
  frost: ['mira', 'rhea', 'mira', 'rhea', 'sora', 'mira', 'rhea', 'volkov', 'architect', 'architect'],
  nyx: ['aria', 'kaelen', 'aria', 'kaelen', 'sora', 'aria', 'kaelen', 'seraphina', 'architect', 'architect'],
  volkov: ['rhea', 'brann', 'rhea', 'brann', 'dax', 'rhea', 'brann', 'volkov', 'architect', 'architect'],
  zero: ['brann', 'dax', 'brann', 'dax', 'brann', 'dax', 'brann', 'seraphina', 'architect', 'architect'],
  seraphina: ['rhea', 'mira', 'rhea', 'mira', 'rhea', 'mira', 'rhea', 'seraphina', 'architect', 'architect'],
  architect: ['rhea', 'aria', 'sora', 'dax', 'mira', 'brann', 'kaelen', 'volkov', 'seraphina', 'architect'],
  malakor: ['valerie', 'rhea', 'dax', 'brann', 'mira', 'valerie', 'rhea', 'architect', 'valerie', 'architect'],
};

const CO_CHAPTER_TITLES: Record<string, string[]> = {
  rhea: ['Academy Drills', 'Border Patrol', 'Combined Arms 101', 'Tactical Chokepoint', 'Pincer Exercise', 'Counter-Offensive', 'Bridgehead Assault', 'Redoubt Defense', 'Vanguard Sweep', 'Apex Instructor'],
  sora: ['Sky Patrol', 'Thermal Drafts', 'Clouds of Ash', 'Winged Escort', 'Interception Grid', 'Stratosphere Supremacy', 'Thunder Sweep', 'High Altitude Breach', 'Skybreaker Strike', 'Apex Sky Dominance'],
  dax: ['Iron Tread', 'Steel Vanguard', 'Canyon Blitz', 'Armor Shock', 'Tank Graveyard', 'Heavy Assault', 'Paved Thunder', 'Breakthrough Column', 'Juggernaut Line', 'Iron Supremacy'],
  mira: ['Coastal Watch', 'Saltmarch Tide', 'Reef Ambush', 'Torpedo Run', 'Monsoon Fleet', 'Abyssal Passage', 'Storm Harbor', 'Battleship Row', 'Typhoon Surge', 'Oceanic Sovereignty'],
  brann: ['Range Finder', 'Long Guns', 'Spotter Grid', 'Sandstorm Barrage', 'Fortress Siege', 'Thunder Valley', 'Over-The-Horizon', 'Rockets Red Glare', 'Chokepoint Shelling', 'Global Battery'],
  valerie: ['Spearhead Patrol', 'Vanguard Breach', 'Rapid Response', 'Armor Drop', 'Shock Column', 'Pincer Vanguard', 'Reinforcement Grid', 'Iron Spear', 'Vanguard Redoubt', 'Apex Vanguard Dominance'],
  kaelen: ['High Altitude Sortie', 'Aerial Escort', 'Cloud Interception', 'Tailwind Pursuit', 'Airborne Resupply', 'Sky Grid Lock', 'Jetstream Breach', 'Stratosphere Duel', 'Wingman Vanguard', 'Ace Supremacy'],
  aria: ['Signal Hack', 'Radar Jamming', 'Overclock Pulse', 'EM Grid Sweep', 'Cyber Disruption', 'Matrix Lockdown', 'Nanite Protocol', 'Decryption Raid', 'System Overload', 'Apex Cyber Dominance'],
  grimm: ['Human Wave', 'Infantry Horde', 'Trench Assault', 'Bazooka Rush', 'Swarm Protocol', 'Bunker Buster', 'Mass Infiltration', 'Iron Vanguard', 'Unstoppable Horde', 'Warlord Conquest'],
  frost: ['Sub-Zero Patrol', 'Blizzard Defense', 'Glacier Breach', 'Frostbite Pass', 'Frozen Lake Run', 'Ice Vanguard', 'Whiteout Strike', 'Cold Front Siege', 'Polar Juggernaut', 'Winter Supremacy'],
  nyx: ['Shadow Patrol', 'Night Infiltration', 'Silent Ambush', 'Fog Breach', 'Eclipse Strike', 'Midnight Raid', 'Phantom Grid', 'Shadow Vanguard', 'Veil of Darkness', 'Apex Shadow'],
  volkov: ['Iron March', 'Crushing Column', 'Heavy Barrage', 'Dominion Shock', 'Fortress Breaker', 'Steel Tempest', 'Red Storm Vanguard', 'Anvil Strike', 'Juggernaut March', 'Iron General Sovereignty'],
  zero: ['Siege Protocol', 'Artillery Battery', 'Long-Range Grid', 'Rockets Barrage', 'Chokepoint Shelling', 'Mortar Network', 'Global Targeter', 'Surgical Shelling', 'Battery Sweep', 'Apex Siege Dominance'],
  seraphina: ['Field Triage', 'Nanite Repair', 'Frontline Sanctuary', 'Endless Defense', 'Property Bastion', 'Med-Evac Escort', 'Restoration Grid', 'Regenerative Surge', 'Aegis Frontline', 'Apex Medic Dominance'],
  architect: ['Matrix Calibration', 'Singularity Calculation', 'Drone Swarm Protocol', 'War Engine Breach', 'Architect Redoubt', 'Neural Overdrive', 'Synthetic Vanguard', 'Global Recalibration', 'Singularity Core Strike', 'Apex Architect Sovereignty'],
  malakor: ['Dread March', 'Shadow Shock', 'Iron Summon', 'Siege Barrage', 'Dark Legion', 'Heavy Onslaught', 'Dread Redoubt', 'Iron Fortress', 'Warlord Vanguard', 'Apex Malakor Sovereignty'],
};

/** Generate 10 specialized, story-rich chapters for each officer with customized lore, dialogues, and adaptive events. */
function getValerieStoryChapters(): CharacterStoryChapter[] {
  const valerieChapters: {
    title: string;
    summary: string;
    enemyCo: string;
    allyCo?: string;
    enemyCo2?: string;
    mapIdx: number;
    myUnits: [UnitType, number, number][];
    enemyUnits: [UnitType, number, number][];
    weather: Weather;
    fog: boolean;
    hint: string;
    briefing: Dialogue[];
    outro: Dialogue[];
    adaptiveTrigger?: MissionDef['adaptiveTrigger'];
    adaptiveObjective?: MissionDef['adaptiveObjective'];
    adaptiveDialogue?: Dialogue[];
  }[] = [
    {
      title: 'Echoes of the Past',
      summary: 'Valerie encounters a hostile Crimson vanguard whose tactical signatures mirror her own family armor techniques.',
      enemyCo: 'malakor',
      mapIdx: 0,
      myUnits: [['mech', 2, 2], ['tank', 3, 1], ['tank', 2, 4], ['infantry', 4, 3], ['artillery', 1, 5]],
      enemyUnits: [['heavy', 9, 3], ['artillery', 10, 2], ['rockets', 9, 5], ['tank', 8, 4]],
      weather: 'clear',
      fog: false,
      hint: 'Valerie\'s Spearhead doctrine excels with mobile Mech & Tank pushes. Breach Malakor\'s defensive line!',
      briefing: [
        { who: 'valerie', text: 'Command HQ, this is Spearhead Valerie. I was separated from my twin sister Malakor during the Shadow War, and I\'ve intercepted a Crimson armored column along the border.' },
        { who: 'valerie', text: 'Wait... their reinforcement calling signals... they\'re identical to the Vanguard doctrine my family used before we were separated!' },
        { who: 'malakor', text: 'Azure Republic trespassers! I am Malakor, Shadow Warlord of Crimson. You will be crushed under heavy treads!' },
        { who: 'valerie', text: 'Malakor?! That name... could it really be my twin sister from whom I was separated?!' },
      ],
      outro: [
        { who: 'valerie', text: 'Malakor! Hold your fire! Look at the twin silver pendant on my neck—it matches yours!' },
        { who: 'malakor', text: 'Tch... a cheap Azure trick! My family perished in the Shadow War! Fall back, heavy squads!' },
        { who: 'valerie', text: 'It IS her! I must follow her retreat and discover the truth!' },
      ],
    },
    {
      title: 'Shadows in the Canyon',
      summary: 'Valerie pursues Malakor into a narrow canyon, attempting to establish radio contact while navigating enemy ambushes.',
      enemyCo: 'malakor',
      mapIdx: 2,
      myUnits: [['heavy', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['apc', 4, 3], ['rockets', 1, 5]],
      enemyUnits: [['heavy', 9, 2], ['rockets', 10, 3], ['artillery', 8, 4], ['heavy', 9, 5]],
      weather: 'clear',
      fog: false,
      hint: 'Use narrow canyon bottlenecks to shield your armor from Malakor\'s heavy siege fire.',
      briefing: [
        { who: 'valerie', text: 'Malakor! Please listen to me! We were separated fifteen years ago when Crimson raiders sacked our home!' },
        { who: 'malakor', text: 'Silence! I was raised in the Dominion iron pits. Power is the only bloodline that matters!' },
        { who: 'valerie', text: 'I won\'t give up on you, sister! I will fight through your line until you listen!' },
      ],
      outro: [
        { who: 'malakor', text: 'Why do you fight with such persistence... sister? No, the Dominion demands strength, not sentiment!' },
        { who: 'valerie', text: 'Her hesitation was real. She remembers our past!' },
      ],
    },
    {
      title: 'Iron and Blood',
      summary: 'Malakor unleashes a crushing siege battery at the river bridgehead to test Valerie\'s tactical resolve.',
      enemyCo: 'malakor',
      mapIdx: 1,
      myUnits: [['tank', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['infantry', 4, 3], ['rockets', 1, 5]],
      enemyUnits: [['heavy', 9, 2], ['artillery', 10, 1], ['rockets', 9, 4], ['aa', 8, 5]],
      weather: 'rain',
      fog: false,
      hint: 'Rain dampens visibility and air support. Rely on Valerie\'s rapid Mech vanguard to secure the bridge.',
      briefing: [
        { who: 'malakor', text: 'If you claim to be my twin, prove your Vanguard doctrine against my Iron Siege!' },
        { who: 'valerie', text: 'I will demonstrate the true purpose of our family\'s strength: protecting others, not waging senseless war!' },
      ],
      outro: [
        { who: 'valerie', text: 'Bridgehead secured! Malakor, look around you—the Dominion is using your strength to destroy innocent lives!' },
        { who: 'malakor', text: 'Ghh... The General promised me the Dominion would bring order...' },
      ],
    },
    {
      title: 'Corrupted Resonance',
      summary: 'The Architect installs cybernetic shock inhibitors into Malakor\'s command armor to enforce absolute obedience.',
      enemyCo: 'malakor',
      mapIdx: 6,
      myUnits: [['heavy', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['artillery', 1, 5], ['recon', 3, 3]],
      enemyUnits: [['heavy', 9, 3], ['rockets', 10, 2], ['artillery', 9, 5], ['missiles', 8, 4]],
      weather: 'clear',
      fog: true,
      hint: 'Fog of war operation. Target Malakor\'s lead command unit to disable the Architect\'s control signal.',
      briefing: [
        { who: 'valerie', text: 'Malakor\'s radio transmissions sound altered... unnaturally cold.' },
        { who: 'malakor', text: 'DIRECTIVE RECEIVED. PURGE AZURE SPEARHEAD. ELIMINATE VALERIE.' },
        { who: 'valerie', text: 'They\'ve placed a cybernetic inhibitor on her! Squads, disable her armor without killing her!' },
      ],
      outro: [
        { who: 'valerie', text: 'Inhibitor destroyed! Malakor, wake up!' },
        { who: 'malakor', text: 'Valerie...? My mind... the Architect... he put neural shackles on me...' },
      ],
    },
    {
      title: 'Breakthrough at Solaria',
      summary: 'The battle reaches Solaria, the ruins of their childhood home where Valerie fights to shatter Malakor\'s lingering doubts.',
      enemyCo: 'malakor',
      mapIdx: 5,
      myUnits: [['heavy', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['rockets', 1, 5], ['tank', 4, 3]],
      enemyUnits: [['heavy', 9, 2], ['rockets', 10, 3], ['heavy', 8, 4], ['artillery', 9, 5]],
      weather: 'sand',
      fog: false,
      hint: 'Sandstorm cuts indirect fire range. Engage Malakor in close-quarters armor combat in the ruins of Solaria.',
      adaptiveTrigger: { enemyCountBelow: 4 },
      adaptiveObjective: { type: 'hq' },
      adaptiveDialogue: [
        { who: 'malakor', text: 'These ruins... the old watchtower... I remember this place! We used to play here before the fire!' },
        { who: 'valerie', text: 'Yes, Malakor! Solaria was our home! Come back to us!' },
      ],
      briefing: [
        { who: 'valerie', text: 'We stand in Solaria, sister. Look at these stones. This is where our story began.' },
        { who: 'malakor', text: 'The ruins of my past... The Architect said my memory was a weakness, but it\'s all I have left!' },
      ],
      outro: [
        { who: 'malakor', text: 'I... I cannot fight you anymore, sister. My hands refuse to order the strike.' },
        { who: 'volkov', text: 'TREASON! Malakor has failed the Crimson Dominion! Arrest her and prepare the execution squad!' },
        { who: 'valerie', text: 'VOLKOV! Release my sister!' },
      ],
    },
    {
      title: 'The Redoubt Siege',
      summary: 'General Volkov imprisons Malakor for high treason. Valerie leads a daring fortress breach to rescue her twin.',
      enemyCo: 'volkov',
      mapIdx: 8,
      myUnits: [['heavy', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['rockets', 1, 5], ['artillery', 2, 3]],
      enemyUnits: [['heavy', 9, 3], ['rockets', 10, 2], ['heavy', 9, 5], ['artillery', 8, 4]],
      weather: 'clear',
      fog: false,
      hint: 'Breach Volkov\'s fortified bunker line with heavy artillery support and rapid vanguard mechs.',
      briefing: [
        { who: 'volkov', text: 'Foolish Azure girl! You dare assault General Volkov\'s iron redoubt for a traitor?' },
        { who: 'valerie', text: 'Malakor is my sister, and she is a free woman! Break their gates!' },
      ],
      outro: [
        { who: 'valerie', text: 'Fortress breached! Malakor, you\'re safe!' },
        { who: 'malakor', text: 'Valerie... you risked everything for me after all I\'ve done?' },
        { who: 'valerie', text: 'Always, sister. Family never turns its back.' },
      ],
    },
    {
      title: 'Bloodline Redemption',
      summary: 'Malakor tests her newly regained freedom in a tactical trial alongside Valerie to prove she is ready to stand against Crimson.',
      enemyCo: 'malakor',
      mapIdx: 7,
      myUnits: [['heavy', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['apc', 4, 3], ['artillery', 1, 5]],
      enemyUnits: [['heavy', 9, 2], ['heavy', 10, 3], ['rockets', 9, 5], ['artillery', 8, 4]],
      weather: 'clear',
      fog: false,
      hint: 'A duel of twins! Prove your Vanguard mastery to seal Malakor\'s redemption and join forces.',
      briefing: [
        { who: 'malakor', text: 'Before I can wear Azure colors, Valerie... duel me once more. Show me that our twin Vanguard can withstand the Architect\'s full fury.' },
        { who: 'valerie', text: 'With honor, Malakor! Let\'s test our bonds in live battle!' },
      ],
      outro: [
        { who: 'malakor', text: 'Flawless execution... Sister, my heavy siege units and your mobile vanguard are two halves of the same sword!' },
        { who: 'valerie', text: 'Together, no war machine can stand against us!' },
      ],
    },
    {
      title: 'Twin Vanguard Rising',
      summary: 'Reunited at last, Valerie and Malakor launch a joint offensive against Siege Director Zero\'s artillery battery.',
      enemyCo: 'zero',
      allyCo: 'malakor',
      mapIdx: 3,
      myUnits: [['heavy', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['rockets', 1, 5], ['aa', 2, 3]],
      enemyUnits: [['rockets', 9, 2], ['artillery', 10, 3], ['heavy', 9, 5], ['missiles', 8, 4]],
      weather: 'sand',
      fog: false,
      hint: 'Malakor fights as your allied AI commander (`allyCo: malakor`)! Coordinate vanguard and heavy siege strikes.',
      briefing: [
        { who: 'zero', text: 'Target acquired: Valerie and the traitor Malakor. Prepare global artillery barrage.' },
        { who: 'malakor', text: 'Zero! Your long-range guns won\'t save you from the combined twin vanguard!' },
        { who: 'valerie', text: 'Vanguard Call and Dread Summon active! Charge!' },
      ],
      outro: [
        { who: 'zero', text: 'Artillery grid destroyed... Their reinforcement synergy is unnatural!' },
        { who: 'valerie', text: 'Great work, Malakor! The Architect\'s citadel is right ahead!' },
      ],
    },
    {
      title: 'Architect\'s Ultimatum',
      summary: 'Valerie and Malakor smash through General Volkov\'s final perimeter guard outside the Singularity Citadel.',
      enemyCo: 'volkov',
      allyCo: 'malakor',
      mapIdx: 9,
      myUnits: [['heavy', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['rockets', 1, 5], ['heavy', 3, 3]],
      enemyUnits: [['heavy', 9, 3], ['heavy', 10, 2], ['rockets', 9, 5], ['bomber', 8, 4]],
      weather: 'snow',
      fog: false,
      hint: 'Snow reduces mobility. Advance steadily with Valerie\'s tanks and Malakor\'s heavy artillery.',
      briefing: [
        { who: 'volkov', text: 'You will not breach the Citadel! The Architect\'s war machine is absolute!' },
        { who: 'malakor', text: 'I served your false promise for years, Volkov. Today, my sister and I break your empire!' },
      ],
      outro: [
        { who: 'volkov', text: 'Crushed... by twin commanders...' },
        { who: 'valerie', text: 'The outer defenses are down! Only The Architect remains!' },
      ],
    },
    {
      title: 'Twin Vanguard Reunion — The Final Stand',
      summary: 'The ultimate battle! Valerie and her redeemed twin sister Malakor unite in a Dual CO battle against The Architect and General Volkov!',
      enemyCo: 'architect',
      enemyCo2: 'volkov',
      allyCo: 'malakor',
      mapIdx: 8,
      myUnits: [['heavy', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['rockets', 1, 5], ['heavy', 3, 3], ['artillery', 2, 3]],
      enemyUnits: [['heavy', 9, 3], ['gundrone', 10, 2], ['bomber', 9, 5], ['rockets', 8, 4], ['heavy', 10, 4]],
      weather: 'clear',
      fog: false,
      hint: 'DUAL CO BATTLE! Malakor fights alongside you against The Architect and Volkov. Unleash Spearhead & Dread summons to win!',
      adaptiveTrigger: { enemyCountBelow: 4 },
      adaptiveObjective: { type: 'hq' },
      adaptiveDialogue: [
        { who: 'architect', text: 'CRITICAL ERROR: TWIN SYNERGY EXCEEDS MAXIMUM THREAT THRESHOLD. RECALIBRATING DESTRUCTION PROTOCOL!' },
        { who: 'malakor', text: 'Your calculations are obsolete, Architect! Spearhead Assault and Iron Legion combined!' },
        { who: 'valerie', text: 'Together as one! Full vanguard charge!' },
      ],
      briefing: [
        { who: 'architect', text: 'I am The Architect. Human sentiment is an anomaly to be erased. Prepare for total annihilation.' },
        { who: 'volkov', text: 'Dominion forces, execute total termination protocol!' },
        { who: 'valerie', text: 'Malakor, are you ready? This is our final battle for Solaria and the Republic!' },
        { who: 'malakor', text: 'Side-by-side forever, sister. Let\'s destroy this war machine once and for all!' },
      ],
      outro: [
        { who: 'architect', text: 'SYSTEM COLLAPSE... CALCULATION FAILED... IMPOSSIBLE...' },
        { who: 'volkov', text: 'No... the Dominion... shattered...' },
        { who: 'valerie', text: 'We won, Malakor! Solaria is safe, and the Republic is at peace!' },
        { who: 'malakor', text: 'Thank you for never giving up on me, Valerie. The separated twins are finally home.' },
      ],
    },
  ];

  return valerieChapters.map((ch, i) => {
    const chNum = i + 1;
    const mapTemplate = STORY_MAP_TEMPLATES[ch.mapIdx % STORY_MAP_TEMPLATES.length];

    return {
      id: `story_valerie_${chNum}`,
      coId: 'valerie',
      chapterIndex: chNum,
      title: ch.title,
      summary: ch.summary,
      mission: {
        id: `story_valerie_m${chNum}`,
        name: `Valerie Ch.${chNum} — ${ch.title}`,
        act: 1,
        par: 8 + i,
        map: mapTemplate,
        units: sanitizeUnitsForMap(mapTemplate, mir(14, ch.myUnits, ch.enemyUnits)),
        cos: ['valerie'],
        enemyCo: ch.enemyCo,
        allyCo: ch.allyCo,
        enemyCo2: ch.enemyCo2,
        funds: [5000 + i * 500, 5500 + i * 500],
        weather: ch.weather,
        fog: ch.fog,
        unitCap: [16 + Math.floor(i / 2), 18 + Math.floor(i / 2)],
        objective: { type: 'rout' },
        recommendedRank: Math.min(4, Math.floor(i / 2)),
        recommendedUpgrades: i * 2,
        aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
        hint: ch.hint,
        ...(ch.adaptiveTrigger ? {
          adaptiveTrigger: ch.adaptiveTrigger,
          adaptiveObjective: ch.adaptiveObjective,
          adaptiveDialogue: ch.adaptiveDialogue,
        } : {}),
        briefing: ch.briefing,
        outro: ch.outro,
      },
    };
  });
}

export function getCharacterStoryChapters(coId: string): CharacterStoryChapter[] {
  if (coId === 'valerie' || coId === 'malakor') {
    return getValerieStoryChapters();
  }

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
        units: sanitizeUnitsForMap(mapTemplate, mir(14, myUnits, enemyExtras)),
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
