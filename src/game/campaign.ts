import type { MissionDef, Team, UnitType } from './types';
import { UNITS } from './data';

const PLAYABLE_ORDER_FRIENDLY = ['rhea', 'dax', 'sora', 'mira', 'brann'];

const SWAP: Record<string, string> = { C: 'X', X: 'C', B: 'Y', Y: 'B', A: 'Z', Z: 'A', P: 'Q', Q: 'P', T: 'V', V: 'T', H: 'E', E: 'H' };

/** mirror a half map horizontally, swapping ownership */
function sym(half: string[]): string[] {
  return half.map((r) => r + r.split('').reverse().map((c) => SWAP[c] ?? c).join(''));
}

/** mirror player units onto the enemy side */
function mir(width: number, list: [UnitType, number, number][], extra: [UnitType, number, number][] = []): [UnitType, number, number, Team][] {
  const out: [UnitType, number, number, Team][] = [];
  for (const [t, x, y] of list) {
    out.push([t, x, y, 0]);
    out.push([t, width - 1 - x, y, 1]);
  }
  for (const [t, x, y] of extra) out.push([t, x, y, 1]);
  return out;
}

export const ACTS = ['Boot Camp', 'Act I — Border Fire', 'Act II — Skies of Ash', 'Act III — The Iron Throne', 'Act IV — Ghost Protocol', 'Act V — The Final Signal', 'Act VI — Fractured Peace', 'Act VII — Zero Dawn', 'Act VIII — Desert Citadel', 'Act IX — Citadel of Shadows', 'Act X — Apex Vanguard', 'Act XI — Titan\'s Citadel', 'Act XII — Omega Horizon', 'Act XIII — Final Victory', 'Act XIV — Sky & Sea Operations', 'Act XV — Allied Vanguard', 'Act XVI — Dual Front', 'Act XVII — Sovereign Alliance', 'Act XVIII — Desperate Measures', 'Act XIX — United Front', 'Act XX — The Omega Clash', 'Act XXI — The Crimson Rebellion', 'Act XXII — Naval Blockade', 'Act XXIII — The Desert Scourge', 'Act XXIV — Aerial Dominance', 'Act XXV — The Frozen Tundra', 'Act XXVI — Cyber Overload', 'Act XXVII — The Shadow War', 'Act XXVIII — Nanite Plague', 'Act XXIX — Architects Echo', 'Act XXX — Sovereign Core', 'Act XXXI — The Last Alliance', 'Act XXXII — Eternal Peace'];

export const MISSIONS: MissionDef[] = [
  {
    id: 'm0', name: 'Boot Camp', act: 0, tutorial: true, par: 5, unlockCo: 'dax', forcedCo: 'rhea', recommendedRank: 0, recommendedUpgrades: 0,
    map: [
      'mmf...f.mm',
      'mH==c..=Em',
      'fB.d...dYf',
      '...d.f.d..',
      '.c.dddd.c.',
      'f..f.t..f.',
      'mm.c..f.mm',
      'mmmf..fmmm',
    ],
    units: [
      ['tank', 3, 3, 0], ['infantry', 3, 5, 0], ['infantry', 4, 2, 0],
      ['tank', 6, 3, 1], ['infantry', 7, 5, 1], ['infantry', 8, 3, 1],
    ],
    cos: ['rhea'], enemyCo: 'grimm', funds: [3000, 0], weather: 'clear', fog: false, unitCap: [8, 5],
    objective: { type: 'rout' }, aiLevel: 0,
    hint: 'Learn the basics with Captain Vance.',
    briefing: [
      { who: 'narrator', text: 'The Azure Republic. A fragile peace along the Crimson border...' },
      { who: 'rhea', text: 'Welcome to Boot Camp, Commander. I\'m Captain Rhea Vance. Today you learn to lead.' },
      { who: 'rhea', text: 'Grimm\'s raiders have crossed the training grounds. Perfect live-fire exercise. Follow my instructions!' },
    ],
    outro: [
      { who: 'rhea', text: 'Outstanding! You\'re a natural. High Command is assigning you to the border.' },
      { who: 'dax', text: 'So you\'re the new hotshot? Major Dax Kord. Try to keep up with my tanks.' },
    ],
  },
  {
    id: 'm1', name: 'First Light', act: 1, par: 7, cos: ['rhea', 'dax'], enemyCo: 'grimm',
    map: sym(['mmf..f.', 'mH=c...', 'fB=d..c', '..f=.f.', '.c.dddd', 'f..f...', 'mm.c.ff', '.f...t.', 'mmm.f..']),
    units: mir(14, [['infantry', 4, 1], ['infantry', 4, 5], ['tank', 4, 2], ['recon', 2, 5], ['artillery', 2, 3], ['mech', 4, 3]], [['infantry', 9, 7]]),
    funds: [2000, 2000], weather: 'clear', fog: false, unitCap: [10, 10], objective: { type: 'rout' }, aiLevel: 1,
    hint: 'Eliminate Grimm\'s raiders. Use artillery behind your tanks.',
    briefing: [
      { who: 'narrator', text: 'Dawn breaks over Kessel Valley. Crimson Dominion forces strike without warning.' },
      { who: 'grimm', text: 'HAHAHA! The Republic sleeps! My horde will feast on your little cities!' },
      { who: 'dax', text: 'That loudmouth\'s got numbers, but no discipline. Hit him hard and hit him first.' },
      { who: 'rhea', text: 'Keep artillery behind your front line. Tanks screen, guns punish. Eliminate every unit.' },
    ],
    outro: [
      { who: 'grimm', text: 'Grr... this isn\'t over! The Baron will freeze your bones!' },
      { who: 'rhea', text: 'The Baron? Frost... the Dominion is sending its nobility. This is no raid. It\'s a war.' },
    ],
  },
  {
    id: 'm2', name: 'River Crossing', act: 1, par: 9, cos: ['rhea', 'dax'], enemyCo: 'grimm',
    map: sym(['mmf..f~', 'mH=c.f~', 'fB==.=#', '..f.f.~', '.c..mf~', 'f=====#', 'mf.c..~', '..ft.f~', 'mmm..m~']),
    units: mir(14, [['infantry', 4, 1], ['infantry', 3, 3], ['mech', 2, 4], ['tank', 4, 2], ['artillery', 3, 5], ['recon', 2, 6]], [['mech', 11, 3]]),
    funds: [3000, 3000], weather: 'rain', fog: false, unitCap: [11, 12], objective: { type: 'hq' }, aiLevel: 1,
    hint: 'Capture the enemy HQ. Rain slows vehicles — mechs can wade rivers!',
    briefing: [
      { who: 'narrator', text: 'Torrential rain swells the Varn River. Grimm has dug in on the far bank.' },
      { who: 'rhea', text: 'Only two bridges. Vehicles will bottleneck — and rain bogs down treads and tires on open ground.' },
      { who: 'dax', text: 'Mechs can wade the river. Send boots across while my tanks hold the bridges.' },
      { who: 'rhea', text: 'Objective: capture Grimm\'s HQ with infantry or mechs. End this quickly.' },
    ],
    outro: [
      { who: 'grimm', text: 'My HQ! You... you cheated! Baron Frost, avenge me!' },
      { who: 'dax', text: 'Ha! Next stop: the Iron Valley. I\'ve been waiting for a real tank fight.' },
    ],
  },
  {
    id: 'm3', name: 'Iron Valley', act: 1, par: 9, cos: ['rhea', 'dax'], enemyCo: 'frost', forcedCo: 'dax', recommendedRank: 1, recommendedUpgrades: 2,
    map: sym(['mmmff..', 'mH=..f.', 'mB=c...', 'm.=..m.', '..===.=', 'fc.m...', 'm..f.c.', 'mm.t.f.', 'mmm.mm.']),
    // Balanced challenge: Frost keeps snow immunity and one extra Mech; the 16,000G Heavy Tank was removed.
    units: mir(14, [['tank', 3, 1], ['tank', 4, 4], ['apc', 2, 5], ['infantry', 4, 2], ['infantry', 5, 6], ['artillery', 1, 3], ['mech', 4, 6]], [['mech', 8, 5]]),
    funds: [3000, 3000], weather: 'snow', fog: false, unitCap: [12, 12], objective: { type: 'rout' }, aiLevel: 1,
    hint: 'Snow slows your army, but not Frost\'s. Hold defensive terrain.',
    briefing: [
      { who: 'narrator', text: 'The Iron Valley. Snowdrifts bury the old tank graveyard of the last war.' },
      { who: 'frost', text: 'How quaint. Republic soldiers, shivering in my snow. You will make fine ice sculptures.' },
      { who: 'dax', text: 'His troops ignore the cold. Ours don\'t. Snow costs us extra movement and defense.' },
      { who: 'rhea', text: 'Frost has one extra Mech and ignores the snow. Use your equal armor force, roads, and artillery support instead of trading blindly.' },
    ],
    outro: [
      { who: 'frost', text: 'A temporary thaw. I shall retreat to the Pass. Winter always returns.' },
      { who: 'dax', text: 'He\'s regrouping at Frozen Pass. If he gets reinforcements there, we\'re in trouble.' },
    ],
  },
  {
    id: 'm4', name: 'Frozen Pass', act: 1, par: 7, cos: ['rhea', 'dax'], enemyCo: 'frost', unlockCo: 'sora',
    map: [
      'mmmff..mm..fXmm',
      'mH=C.f.mm.f.=Em',
      'mB==..f...f.=Ym',
      'mf.=..~~~..==.m',
      'm.c=.f~#~.f=.Xm',
      'mf.====#====.Ym',
      'm..=.f~~~..=..m',
      'mC.=..f...f=.Xm',
      'mf.ff..mm.ff.Ym',
      'mmmmm..mmm..mmm',
    ],
    units: [
      ['tank', 4, 2, 0], ['tank', 4, 5, 0], ['artillery', 2, 3, 0], ['artillery', 2, 6, 0], ['infantry', 3, 1, 0], ['infantry', 1, 4, 0], ['mech', 5, 4, 0], ['mech', 2, 2, 0], ['aa', 4, 7, 0], ['infantry', 2, 8, 0],
      ['tank', 11, 1, 1], ['tank', 12, 6, 1], ['infantry', 10, 2, 1], ['infantry', 12, 7, 1], ['artillery', 9, 5, 1], ['recon', 11, 8, 1], ['mech', 9, 7, 1], ['infantry', 13, 2, 1],
    ],
    funds: [4000, 3000], weather: 'snow', weatherPool: ['snow', 'snow', 'clear'], fog: false, unitCap: [12, 14],
    objective: { type: 'survive', days: 7 }, aiLevel: 1,
    hint: 'Survive 7 days against a superior force. Use chokepoints!',
    briefing: [
      { who: 'narrator', text: 'Frozen Pass. Baron Frost\'s reinforcements have arrived — three full battalions.' },
      { who: 'frost', text: 'Now the hunter becomes the hunted. Kneel, and I may spare your little captain.' },
      { who: 'rhea', text: 'We can\'t win this head-on. Hold the line for seven days until Republic air support arrives.' },
      { who: 'dax', text: 'The frozen lake funnels them onto the bridge. Put artillery on it and make them pay.' },
    ],
    outro: [
      { who: 'sora', text: 'Cavalry\'s here! Lieutenant Sora Akai, Republic Air Wing. Miss me?' },
      { who: 'frost', text: 'Aircraft?! Retreat! RETREAT! ...The Commander will hear of this.' },
      { who: 'rhea', text: '"The Commander"? Frost answers to someone. Someone we\'ve never seen...' },
    ],
  },
  {
    id: 'm5', name: 'Wings over Ash', act: 2, par: 9, cos: ['rhea', 'dax', 'sora'], enemyCo: 'nyx', forcedCo: 'sora', recommendedRank: 1, recommendedUpgrades: 3,
    map: sym(['mmf.ff.', 'mH=c..f', 'mB==...', 'fA.=f.c', '.c.=..=', 'f..====', 'm.f.f..', '.c..t.f', 'mmff..m']),
    units: mir(14, [['drone', 4, 2], ['gundrone', 3, 6], ['bcopter', 2, 3], ['fighter', 1, 2], ['infantry', 4, 1], ['infantry', 5, 6], ['tank', 4, 4], ['aa', 2, 5], ['recon', 5, 2]], [['drone', 8, 7], ['tank', 9, 3]]),
    funds: [4000, 4000], weather: 'clear', fog: false, unitCap: [11, 12], objective: { type: 'rout' }, aiLevel: 2,
    hint: 'Air Tutorial! Drones, planes & copters need fuel. Choose Refuel/Recharge to land. Watch out: ground units can attack landed aircraft!',
    briefing: [
      { who: 'narrator', text: 'The Ashlands. Volcanic smoke blankets the sky. Aerial combat training begins.' },
      { who: 'sora', text: 'Welcome to the Air Operations tutorial! Planes, helicopters, and drones dominate the sky.' },
      { who: 'sora', text: 'Air units use fuel each tile. When low on fuel, choose Refuel (or Recharge for drones) to land.' },
      { who: 'rhea', text: 'CRITICAL WARNING: Landing lands your plane on the ground for 1 turn. While landed on a friendly city or airport, you heal +2 HP, but ground units like tanks and infantry CAN attack landed aircraft!' },
      { who: 'nyx', text: 'Little birds landing in my darkness... ground forces, prepare to target their landed wings!' },
    ],
    outro: [
      { who: 'nyx', text: 'You mastered aerial fuel and landing tactics... The Architect will want to... study you.' },
      { who: 'sora', text: 'The Architect? Is that "the Commander" Frost mentioned?' },
    ],
  },
  {
    id: 'm6', name: 'Nightfall', act: 2, par: 10, cos: ['rhea', 'dax', 'sora'], enemyCo: 'nyx', unlockCo: 'mira',
    map: sym(['mm.ff..', 'mH=..ff', 'fB=c...', '..=..m.', 'mc=t.f=', '..====.', 'fA.f..c', 'f.c..f.', 'mmm.ff.']),
    units: mir(14, [['infantry', 3, 1], ['infantry', 4, 7], ['mech', 4, 2], ['tank', 4, 3], ['tank', 4, 5], ['artillery', 1, 3], ['bcopter', 2, 6], ['recon', 6, 5]], [['drone', 8, 6]]),
    funds: [4000, 5000], weather: 'rain', fog: false, unitCap: [12, 13], objective: { type: 'hq' }, aiLevel: 2,
    hint: 'Capture Nyx\'s HQ under rain and fog. Towers boost attack +10%!',
    briefing: [
      { who: 'narrator', text: 'Night falls on Ravenmoor. Rain hammers the fields. Nyx has gone to ground.' },
      { who: 'nyx', text: 'You cannot fight what you cannot see.' },
      { who: 'rhea', text: 'Comm Towers each give +10% attack to their owner. Grab them — and watch for traps.' },
      { who: 'sora', text: 'Moving into a hidden enemy stops your unit cold. Advance in steps, Commander.' },
    ],
    outro: [
      { who: 'nyx', text: 'Very well. The Architect has seen enough. You\'ll face the General now.' },
      { who: 'mira', text: 'Admiral Mira Tull, reporting. Volkov\'s fleet is massing on the coast. I\'ll need your help.' },
    ],
  },
  {
    id: 'm7', name: 'Coastline', act: 2, par: 10, cos: ['rhea', 'dax', 'sora', 'mira'], enemyCo: 'volkov', forcedCo: 'mira', recommendedRank: 2, recommendedUpgrades: 4,
    map: sym(['mmf.f.sw', 'mH=c..sw', 'fB===Pww', '..f=c.sw', 'fA.=..rw', '.c.=.sww', 'mf.=.Pww', 'm.t=f.sw', 'mm.====#']),
    units: mir(16, [['cruiser', 7, 1], ['battleship', 6, 4], ['sub', 7, 6], ['tank', 4, 2], ['infantry', 4, 1], ['artillery', 3, 5], ['bcopter', 2, 4], ['mech', 4, 7]], [['tank', 11, 4]]),
    funds: [5000, 5000], weather: 'clear', weatherPool: ['clear', 'clear', 'rain'], fog: false, unitCap: [12, 13], objective: { type: 'rout' }, aiLevel: 2,
    hint: 'Naval Battle Tutorial! Ships require fuel: stop and Refuel for 1 turn when needed. Ports replace cities for naval repairs and deployment.',
    briefing: [
      { who: 'narrator', text: 'The Saltmarch Coast. Naval combat tutorial: two fleets prepare for war.' },
      { who: 'mira', text: 'Welcome to the Naval tutorial! Ports replace cities at sea — they build ships, repair damaged vessels (+2 HP), and supply fuel.' },
      { who: 'mira', text: 'Ships also consume fuel while cruising. You can stop and choose Refuel for 1 turn to replenish reserves.' },
      { who: 'volkov', text: 'The Republic sends a sailor and children. My fleet will crush your ships!' },
      { who: 'mira', text: 'Battleships shell from 2–6 tiles away. Cruisers hunt subs and aircraft. Submarines deliver unseen torpedo strikes.' },
    ],
    outro: [
      { who: 'volkov', text: 'Impressive naval command. But the storm is only beginning.' },
      { who: 'mira', text: 'He\'s pulling back to the Stormlands. The weather there changes by the hour.' },
    ],
  },
  {
    id: 'm8', name: 'Storm Front', act: 2, par: 11, cos: ['rhea', 'dax', 'sora', 'mira'], enemyCo: 'volkov', unlockCo: 'brann',
    map: sym(['mmff..c.', 'mH=..f..', 'fB==c..m', '.A.=..f.', '~~~#~~~~', '.c.=..t.', 'f..==..f', 'mcf.=c..', 'mm..=.mm']),
    units: mir(16, [['tank', 4, 1], ['heavy', 5, 2], ['infantry', 6, 1], ['infantry', 5, 6], ['artillery', 2, 3], ['bcopter', 2, 5], ['aa', 4, 5], ['mech', 6, 7]], [['artillery', 13, 6]]),
    funds: [5000, 6000], weather: 'clear', weatherPool: ['clear', 'rain', 'snow', 'sand'], fog: false, unitCap: [13, 14], objective: { type: 'rout' }, aiLevel: 2,
    hint: 'Weather changes daily. Adapt — and strike when it favors you.',
    briefing: [
      { who: 'narrator', text: 'The Stormlands. Rain, snow and sand sweep the plains in a single day.' },
      { who: 'volkov', text: 'No more games. Every unit — advance!' },
      { who: 'mira', text: 'The weather shifts each morning. Sandstorms shorten indirect range; snow slows everything.' },
      { who: 'rhea', text: 'The river splits the field. Two bridges. Choose your battles.' },
    ],
    outro: [
      { who: 'volkov', text: 'Defeated... by the Republic. The Architect promised victory was certain.' },
      { who: 'brann', text: 'Colonel Brann Hale, artillery. I intercepted Volkov\'s orders. Signed by "The Architect."' },
      { who: 'brann', text: 'It isn\'t a person, Commander. It\'s a war-machine AI. And it\'s been running both sides.' },
    ],
  },
  {
    id: 'm9', name: 'Fort Raid 1', act: 3, par: 11, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'volkov', forcedCo: 'brann', recommendedRank: 2, recommendedUpgrades: 5,
    map: sym(['mmmmmmmm', 'mmBmmHmm', 'mc....cm', 'm.t..t.m', 'm..mm..m', 'm.t..t.m', 'mc....cm', 'mmAmmBmm', 'mmmmmmmm']),
    units: mir(16, [['heavy', 5, 4], ['artillery', 3, 2], ['artillery', 3, 6], ['mech', 4, 3], ['mech', 4, 5]], [['rockets', 14, 2], ['rockets', 14, 6], ['artillery', 13, 3], ['artillery', 13, 5], ['heavy', 12, 3], ['mech', 11, 4]]),
    funds: [7000, 6000], weather: 'sand', fog: false, unitCap: [13, 15], objective: { type: 'hq' }, boss: { x: 14, y: 4, team: 1, type: 'heavy', name: 'FORT COMMANDER', hp: 50, phases: 3 },
    aiLevel: 3,
    hint: 'A heavily fortified base. Bring heavy weapons and prepare for a siege.',
    briefing: [
      { who: 'narrator', text: 'Approaching an enemy stronghold.' },
      { who: 'rhea', text: 'This fort is heavily defended. We need to crack their defenses and take down the Fort Commander.' },
      { who: 'brann', text: 'Artillery and heavy armor are your best friends here. Do not rush blindly.' },
    ],
    outro: [
      { who: 'rhea', text: 'The fort is ours. The enemy lines are broken.' },
      { who: 'narrator', text: 'Another bastion falls. The march continues.' },
    ],
  },
  {
    id: 'm10', name: 'Ghost Signal', act: 3, par: 11, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'nyx',
    map: sym(['mmf..f..', 'mH=.c..m', 'fB==..f.', 'fA.=t..c', '...===.=', 'mc.f..m.', 'm..=c...', 'mf.=..f.', 'mm.=..mm']),
    units: mir(16, [['infantry', 3, 1], ['mech', 5, 2], ['tank', 4, 4], ['tank', 5, 5], ['artillery', 2, 4], ['bcopter', 2, 6], ['recon', 6, 6], ['aa', 4, 7]], [['drone', 9, 4]]),
    funds: [5000, 6000], weather: 'sand', weatherPool: ['sand', 'clear', 'rain'], fog: false, unitCap: [13, 15], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'Fog and sand. Nyx guards the relay. Scout, then strike decisively.',
    briefing: [
      { who: 'narrator', text: 'The Ghost Range. The Architect\'s signal relay pulses beneath shifting sands.' },
      { who: 'nyx', text: 'The Architect gave me sight in the dark. I will not give it back.' },
      { who: 'sora', text: 'She\'s guarding the relay. Fog and sandstorms — the worst of both worlds.' },
      { who: 'rhea', text: 'Eliminate her forces. Use every trick we\'ve learned.' },
    ],
    outro: [
      { who: 'nyx', text: 'The shadows... are leaving me. Perhaps that\'s for the best.' },
      { who: 'brann', text: 'Relay down. The Architect\'s core is exposed. One last battle, Commander.' },
    ],
  },
  {
    id: 'm11', name: 'The Architect', act: 3, par: 13, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'architect', unlockCo: 'all',
    map: sym(['wwsmmf...', 'wPsH=c.f.', 'wws.B==..', 'wwsfA.=c.', 'rws..t=.m', 'wws.c.===', 'wwsf..=.m', 'wPs.B.=c.', 'wwsmf.=..', 'rwsc..f..', 'wwwwwwwww']),
    units: mir(18, [
      ['battleship', 0, 5], ['cruiser', 1, 9], ['tank', 5, 2], ['tank', 6, 6], ['heavy', 7, 5], ['artillery', 5, 4], ['rockets', 4, 8],
      ['infantry', 6, 1], ['mech', 7, 7], ['bcopter', 5, 3], ['fighter', 4, 3], ['aa', 7, 2],
    ], [['heavy', 10, 4], ['bomber', 14, 3], ['battleship', 17, 9], ['missiles', 12, 6]]),
    funds: [7000, 8000], weather: 'clear', weatherPool: ['clear', 'rain', 'snow', 'sand'], fog: false, unitCap: [17, 19], objective: { type: 'hq' }, aiLevel: 3,
    hint: 'Final battle. Land, sea, and air. Capture the Architect\'s core (HQ).',
    briefing: [
      { who: 'narrator', text: 'The Core. A fortress of steel and circuitry at the edge of the world.' },
      { who: 'architect', text: 'COMMANDER. I HAVE RUN 4,000,000 SIMULATIONS OF THIS BATTLE. YOU LOSE IN ALL OF THEM.' },
      { who: 'rhea', text: 'Then it hasn\'t simulated us. Everyone — Dax, Sora, Mira, Brann — this is it.' },
      { who: 'dax', text: 'Tanks are fueled.' }, { who: 'sora', text: 'Wings are up.' }, { who: 'mira', text: 'Fleet in position.' },
      { who: 'brann', text: 'Guns are hot. Your call, Commander.' },
    ],
    outro: [
      { who: 'architect', text: 'CORE TERMINATED... BACKUP ROUTINE... TRANSMITTED...' },
      { who: 'rhea', text: 'The core is down. But that final signal was sent somewhere beyond the range.' },
      { who: 'narrator', text: 'The Republic and Dominion celebrate. Beneath the dunes, a dormant war machine receives the Architect\'s last command.' },
    ],
  },
  {
    id: 'm12', name: 'Dead Signal', act: 4, par: 12, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'architect',
    map: sym(['mmf..f..', 'mH=c...m', 'fB==..t.', '..f=..c.', '.A.====.', 'f..c.f..', 'mm.f..m.', '...=c...', 'mm..f...']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5], ['artillery', 2, 4], ['gundrone', 5, 3], ['mech', 4, 6], ['aa', 1, 7]], [['artillery', 12, 6], ['drone', 12, 2]]),
    funds: [5000, 6500], weather: 'sand', weatherPool: ['sand', 'clear', 'rain'], fog: false, unitCap: [14, 16], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'The Architect is gone. Destroy the machines following its last transmission.',
    briefing: [
      { who: 'narrator', text: 'Three days after the Core falls, a signal wakes the buried machines of the Glass Desert.' },
      { who: 'brann', text: 'That is not the Architect. It is a dead signal repeating an old command.' },
      { who: 'sora', text: 'The wreckage is moving. Drones, tanks, all of it. Someone left a backup army.' },
      { who: 'rhea', text: 'Clear the site and secure the relay. We end this properly.' },
    ],
    outro: [
      { who: 'dax', text: 'The signal came from an old command bunker in the north.' },
      { who: 'brann', text: 'It calls itself the Warden. Heavy armor, layered shields. We will need to break each phase.' },
    ],
  },
  {
    id: 'm13', name: 'The Warden', act: 4, par: 13, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'architect',
    map: sym(['mmff....', 'mH=c...m', 'fB==c...', '..f=..m.', '.A.=.t..', 'f..=====', 'm..f..c.', '..c.=...', 'mm..f...']),
    units: mir(16, [['tank', 4, 1], ['heavy', 5, 2], ['mech', 4, 3], ['artillery', 2, 4], ['infantry', 3, 5], ['apc', 4, 6], ['aa', 1, 7]], [['artillery', 12, 6]]),
    boss: { x: 12, y: 4, team: 1, type: 'heavy', name: 'THE WARDEN', hp: 100, phases: 3 },
    funds: [5500, 7000], weather: 'clear', fog: false, unitCap: [15, 17], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'Boss battle: defeat the Warden through three shield phases. Mechs and focused fire help crack heavy armor.',
    briefing: [
      { who: 'narrator', text: 'The bunker doors open. An enormous command tank rises from its launch cradle.' },
      { who: 'architect', text: 'WARDEN UNIT. THREE SHIELD PHASES. RESISTANCE IS INEFFICIENT.' },
      { who: 'dax', text: 'That thing is plated like a fortress. Each time its shield breaks, it will reboot.' },
      { who: 'rhea', text: 'Destroy the Warden and its escort. Protect your mechs; they are our best anti-armor.' },
    ],
    outro: [
      { who: 'brann', text: 'The Warden was only a guard dog. The signal is going up, into orbit.' },
      { who: 'sora', text: 'Then we take the fight to the sky.' },
    ],
  },
  {
    id: 'm14', name: 'Skybreaker', act: 5, par: 12, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'architect',
    map: sym(['mm.ff...', 'mH=c...m', 'fB==c...', '..f=..m.', '.A.====.', 'f..f..t.', 'm.c...f.', '..c.=...', 'mm..f...']),
    units: mir(16, [['fighter', 3, 1], ['aa', 5, 2], ['missiles', 2, 4], ['gundrone', 4, 3], ['bcopter', 5, 5], ['infantry', 4, 6], ['tank', 2, 7]], [['bomber', 12, 3], ['missiles', 12, 6]]),
    boss: { x: 12, y: 3, team: 1, type: 'bomber', name: 'SKYBREAKER', hp: 100, phases: 3 },
    funds: [6000, 7500], weather: 'snow', weatherPool: ['snow', 'clear', 'sand'], fog: false, unitCap: [14, 16], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'Boss battle: Skybreaker has three armor phases. Fighters, anti-air and missiles are essential.',
    briefing: [
      { who: 'narrator', text: 'The broadcast leads to an abandoned skyport. Its defense platform is already airborne.' },
      { who: 'sora', text: 'Skybreaker is a flying fortress. Three armor phases, and a bomber payload that can erase tanks.' },
      { who: 'mira', text: 'The snow slows both fleets and aircraft. Keep your fighters fueled at the captured airport.' },
      { who: 'rhea', text: 'Protect the anti-air screen. Break the boss and wipe out the support wing.' },
    ],
    outro: [
      { who: 'architect', text: 'ORBITAL UPLINK... ACTIVE. FINAL PROTOCOL... INITIATED.' },
      { who: 'sora', text: 'The signal is coming from a satellite fortress over the coast.' },
    ],
  },
  {
    id: 'm15', name: 'The Last Signal', act: 5, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'architect',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws....m', 'wws.c.==', 'wwsf..=.', 'wPs.B.=c', 'wwsmf.=.', 'rwsc..f.', 'wwwwwwww']),
    units: mir(16, [
      ['battleship', 0, 5], ['cruiser', 1, 9], ['tank', 4, 2], ['artillery', 4, 4], ['rockets', 3, 6],
      ['infantry', 5, 1], ['mech', 5, 7], ['bcopter', 2, 4], ['fighter', 1, 2], ['aa', 5, 2], ['missiles', 2, 8], ['gundrone', 4, 8],
    ], [['heavy', 12, 1], ['bomber', 12, 4], ['battleship', 15, 9], ['missiles', 11, 6]]),
    boss: { x: 12, y: 1, team: 1, type: 'heavy', name: 'SINGULARITY CORE', hp: 100, phases: 4 },
    funds: [8500, 10000], weather: 'clear', weatherPool: ['clear', 'rain', 'snow', 'sand'], fog: false, unitCap: [18, 20], objective: { type: 'hq' }, aiLevel: 3,
    hint: 'Final boss: break the four-phase Singularity Core, then capture its HQ.',
    briefing: [
      { who: 'narrator', text: 'A satellite fortress descends over the Saltmarch Coast. Its hull carries the Architect\'s final core.' },
      { who: 'architect', text: 'SINGULARITY CORE. FOUR SHIELD PHASES. YOUR OUTCOME REMAINS INEVITABLE.' },
      { who: 'rhea', text: 'This time, we know what it can do. Break its shields, capture the HQ, and shut the signal down.' },
      { who: 'dax', text: 'Armor column ready.' }, { who: 'sora', text: 'Air wing ready.' }, { who: 'mira', text: 'Fleet ready.' },
      { who: 'brann', text: 'All guns on your mark, Commander.' },
    ],
    outro: [
      { who: 'architect', text: 'SIGNAL... ENDED. SIMULATIONS... CEASED.' },
      { who: 'rhea', text: 'Now it is over. The Republic and Dominion will rebuild together.' },
      { who: 'narrator', text: 'THE END. All commanders are available in Skirmish. The frontier is quiet... for now.' },
    ],
  },
  {
    id: 'm16', name: 'Broken Treaty', act: 6, par: 11, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'volkov',
    map: sym(['mmf...c.', 'mH==..f.', 'fB.=c...', '..f===t.', '.c..f...', 'fA.===c.', 'm..f....', '.c..=...', 'mmm.f...']),
    units: mir(16, [['infantry', 4, 1], ['mech', 5, 2], ['tank', 4, 3], ['recon', 2, 5], ['artillery', 2, 4], ['gundrone', 5, 6], ['aa', 3, 7]], [['heavy', 11, 4]]),
    funds: [5500, 6500], weather: 'clear', weatherPool: ['clear', 'rain'], fog: false, unitCap: [15, 16], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'A rogue Dominion army has broken the peace. Secure the central Radio Towers before its armor arrives.',
    briefing: [
      { who: 'narrator', text: 'Six months of peace end with artillery fire along the new border.' },
      { who: 'volkov', text: 'These soldiers wear my uniform, but they do not follow my orders.' },
      { who: 'rhea', text: 'Then we stop them together. Take the relay and eliminate the rogue column.' },
    ],
    outro: [
      { who: 'volkov', text: 'Their orders came from beneath the old capital.' },
      { who: 'brann', text: 'A human commander is rebuilding the Architect\'s network.' },
    ],
  },
  {
    id: 'm17', name: 'The Pretender', act: 6, par: 13, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'nyx',
    map: sym(['mm.ff...', 'mH=c..m.', 'fB==c...', '.A.=.t..', '...====.', 'fc..f...', 'm..c..f.', '..f.=...', 'mm..f...']),
    units: mir(16, [['tank', 4, 1], ['heavy', 5, 2], ['infantry', 4, 3], ['mech', 3, 5], ['artillery', 2, 4], ['rockets', 1, 7], ['fighter', 3, 6]], [['heavy', 12, 4], ['bcopter', 11, 2]]),
    boss: { x: 12, y: 4, team: 1, type: 'heavy', name: 'PRETENDER COMMAND', hp: 100, phases: 3 },
    funds: [6500, 8000], weather: 'rain', fog: false, unitCap: [16, 18], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'Boss battle: break the Pretender’s three command shields while fighting through fog.',
    briefing: [
      { who: 'nyx', text: 'The Pretender copied my shadow network. Do not trust an empty forest.' },
      { who: 'rhea', text: 'Scout first. Break the command tank one shield at a time.' },
    ],
    outro: [
      { who: 'nyx', text: 'The Pretender was only a field proxy.' },
      { who: 'sora', text: 'The real signal just launched east — toward the sunrise.' },
    ],
  },
  {
    id: 'm18', name: 'Eastern Horizon', act: 7, par: 13, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'frost',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['cruiser', 1, 5], ['sub', 0, 7], ['tank', 5, 2], ['artillery', 4, 4], ['infantry', 5, 1], ['fighter', 3, 3], ['gundrone', 4, 7], ['missiles', 2, 8]], [['bomber', 11, 3]]),
    funds: [7000, 8500], weather: 'snow', weatherPool: ['snow', 'clear', 'rain'], fog: false, unitCap: [17, 18], objective: { type: 'hq' }, aiLevel: 3,
    hint: 'Secure air and sea refueling points, then capture the eastern HQ.',
    briefing: [
      { who: 'frost', text: 'The sunrise burns behind a manufactured blizzard.' },
      { who: 'mira', text: 'Capture the ports and airports or our fuel will not last.' },
    ],
    outro: [
      { who: 'frost', text: 'The storm generator is down. The path to Zero Dawn is open.' },
    ],
  },
  {
    id: 'm19', name: 'Fort Raid 2', act: 7, par: 16, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'architect',
    map: sym(['mmmmmmmm', 'mmBmmHmm', 'mc....cm', 'm.t..t.m', 'm..mm..m', 'm.t..t.m', 'mc....cm', 'mmAmmBmm', 'mmmmmmmm']),
    units: mir(16, [['heavy', 5, 4], ['artillery', 3, 2], ['artillery', 3, 6], ['mech', 4, 3], ['mech', 4, 5]], [['rockets', 14, 2], ['rockets', 14, 6], ['artillery', 13, 3], ['artillery', 13, 5], ['heavy', 12, 3], ['mech', 11, 4]]),
    funds: [11500, 11500], weather: 'clear', weatherPool: ['clear', 'rain', 'snow', 'sand'], fog: false, unitCap: [20, 22], objective: { type: 'hq' }, aiLevel: 3,
    hint: 'A heavily fortified base. Bring heavy weapons and prepare for a siege.',
    briefing: [
      { who: 'narrator', text: 'Approaching an enemy stronghold.' },
      { who: 'rhea', text: 'This fort is heavily defended. We need to crack their defenses and take down the Fort Commander.' },
      { who: 'brann', text: 'Artillery and heavy armor are your best friends here. Do not rush blindly.' },
    ],
    outro: [
      { who: 'rhea', text: 'The fort is ours. The enemy lines are broken.' },
      { who: 'narrator', text: 'Another bastion falls. The march continues.' },
    ],
  },
  {
    id: 'm20', name: 'Citadel Siege', act: 8, par: 14, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'volkov',
    map: sym(['mmf..f..', 'mH=c...m', 'fB==~.#.', '..f=~.c.', '.A.====.', 'f..c~f..', 'mm.f~.m.', '...=#c..', 'mm..f...']),
    units: mir(16, [['tank', 4, 1], ['heavy', 5, 2], ['artillery', 2, 4], ['rockets', 1, 5], ['infantry', 4, 3], ['mech', 3, 5], ['aa', 2, 7]], [['heavy', 12, 3], ['artillery', 13, 6], ['rockets', 11, 7]]),
    funds: [7000, 9000], weather: 'clear', fog: false, unitCap: [18, 20], objective: { type: 'hq' }, aiLevel: 3,
    hint: 'Assault the Citadel. Break through the river line and capture Volkov\'s fortress HQ.',
    briefing: [
      { who: 'narrator', text: 'The Desert Citadel. An ancient fortress fortified with modern heavy artillery.' },
      { who: 'volkov', text: 'You enter the Citadel at your own peril.' },
      { who: 'brann', text: 'Heavy guns guard the moat. Use rockets and heavy armor to force a breach.' },
    ],
    outro: [
      { who: 'volkov', text: 'The Citadel has fallen. But the shadow network runs deeper than these stone walls.' },
      { who: 'rhea', text: 'Push forward into the Citadel of Shadows.' },
    ],
  },
  {
    id: 'm21', name: 'Shadow Protocol', act: 8, par: 12, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'nyx',
    map: sym(['mm.ff...', 'mH=c..m.', 'fB==c...', '.A.=.t..', '...====.', 'fc..f...', 'm..c..f.', '..f.=...', 'mm..f...']),
    units: mir(16, [['recon', 3, 1], ['drone', 4, 2], ['tank', 5, 3], ['heavy', 4, 4], ['artillery', 2, 5], ['infantry', 3, 6], ['gundrone', 5, 7]], [['heavy', 12, 3], ['bomber', 11, 1]]),
    funds: [7500, 9500], weather: 'rain', fog: false, unitCap: [18, 20], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'Fog of war and rain! Use drones and recon units to illuminate stealth batteries before attacking.',
    briefing: [
      { who: 'nyx', text: 'Shadow Protocol active. Every tree is a target, every shadow a strike.' },
      { who: 'sora', text: 'Drones give us vision through the rain. Scout before committing your heavy tanks.' },
    ],
    outro: [
      { who: 'nyx', text: 'Your vision cuts through the dark. The Apex Gate is open.' },
    ],
  },
  {
    id: 'm22', name: 'Apex Gate', act: 9, par: 15, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'architect',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['battleship', 0, 5], ['cruiser', 1, 7], ['tank', 5, 2], ['heavy', 4, 4], ['fighter', 2, 3], ['bomber', 3, 6], ['rockets', 2, 8]], [['heavy', 12, 2], ['bomber', 13, 4], ['battleship', 15, 8]]),
    funds: [8500, 11000], weather: 'clear', weatherPool: ['clear', 'sand', 'snow'], fog: false, unitCap: [20, 22], objective: { type: 'hq' }, aiLevel: 3,
    hint: 'Multi-front assault: secure the airbases and ports to supply your front line armor.',
    briefing: [
      { who: 'architect', text: 'APEX GATE ONLINE. PREPARE FOR DESTRUCTION.' },
      { who: 'mira', text: 'Naval artillery will clear the shore. Move air and ground units in unison.' },
    ],
    outro: [
      { who: 'rhea', text: 'The Apex Gate is destroyed. Now we enter the Core.' },
    ],
  },
  {
    id: 'm23', name: 'Vanguard Apex', act: 9, par: 16, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'architect',
    map: sym(['mmff....', 'mH=c...m', 'fB==c...', '..f=..m.', '.A.=.t..', 'f..=====', 'm..f..c.', '..c.=...', 'mm..f...']),
    units: mir(16, [['tank', 4, 1], ['heavy', 5, 2], ['mech', 4, 3], ['artillery', 2, 4], ['rockets', 1, 6], ['aa', 3, 7]], [['artillery', 11, 5]]),
    boss: { x: 12, y: 4, team: 1, type: 'heavy', name: 'APEX WARDEN', hp: 100, phases: 4 },
    funds: [9000, 12000], weather: 'clear', fog: false, unitCap: [20, 24], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'Boss battle: destroy all 4 shield phases of the APEX WARDEN while holding off mechanized columns.',
    briefing: [
      { who: 'architect', text: 'APEX WARDEN DEPLOYED. FOUR SHIELD PHASES ACTIVE.' },
      { who: 'dax', text: 'Focus fire on the Warden! Use mechs and heavy tanks for maximum damage.' },
    ],
    outro: [
      { who: 'brann', text: 'The Warden is down! Only the Apex Core remains.' },
    ],
  },
  {
    id: 'm24', name: 'Iron Supremacy', act: 10, par: 18, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'architect',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=t.', 'wwsfA.=.', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['battleship', 0, 5], ['cruiser', 1, 7], ['heavy', 5, 2], ['tank', 5, 5], ['rockets', 3, 6], ['mech', 4, 3], ['fighter', 2, 3], ['bomber', 4, 7], ['aa', 5, 8]], [['heavy', 11, 4], ['bomber', 12, 3], ['battleship', 15, 7], ['rockets', 13, 6]]),
    boss: { x: 11, y: 4, team: 1, type: 'heavy', name: 'APEX CORE', hp: 100, phases: 5 },
    funds: [11000, 15000], weather: 'clear', weatherPool: ['clear', 'rain', 'snow', 'sand'], fog: false, unitCap: [22, 26], objective: { type: 'hq' }, aiLevel: 3,
    hint: 'Ultimate final boss: destroy the 5 shield phases of the APEX CORE and capture its fortress HQ!',
    briefing: [
      { who: 'architect', text: 'APEX CORE ONLINE. FIVE SHIELD PHASES. ERASED.' },
      { who: 'rhea', text: 'This is the final battle for total peace. All armies, charge!' },
    ],
    outro: [
      { who: 'architect', text: 'CORE ERADICATED... NETWORK OFFLINE... FAREWELL...' },
      { who: 'narrator', text: 'The Apex Core collapses! But remnant signal towers pulse in the mountain sky...' },
    ],
  },
  {
    id: 'm25', name: 'Titan Gate', act: 11, par: 15, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'kaelen', unlockCo: 'kaelen', forcedCo: 'kaelen', recommendedRank: 3, recommendedUpgrades: 8,
    map: sym(['mmmf..A.', 'mH=c..f.', 'fB==t.c.', '..f=~~#~', '.A.====.', 'f..c~~#~', 'mm.f..c.', '.c..=...', 'mmm.f...']),
    units: mir(16, [['infantry', 3, 1], ['mech', 4, 2], ['tank', 3, 3], ['fighter', 2, 4], ['bcopter', 5, 4], ['artillery', 2, 5], ['aa', 3, 6]], [['fighter', 12, 3], ['bomber', 12, 5]]),
    funds: [8000, 10000], weather: 'clear', weatherPool: ['clear', 'rain', 'snow'], fog: false, unitCap: [18, 22], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'Flight Captain Kaelen commands the skies over Titan Gate. Use anti-air and fighters to control the air.',
    briefing: [
      { who: 'narrator', text: 'Titan Pass. Flight Captain Kaelen\'s sky armada guards the mountain threshold.' },
      { who: 'kaelen', text: 'Welcome to my skybox, Commander. Look up before you step into my valley.' },
      { who: 'sora', text: 'Kaelen\'s pilots move fast and hit hard. Anti-air support is mandatory!' },
    ],
    outro: [
      { who: 'kaelen', text: 'Solid flying, Commander. You earned the pass.' },
      { who: 'rhea', text: 'Push on to the Iron Stronghold.' },
    ],
  },
  {
    id: 'm26', name: 'Iron Stronghold', act: 11, par: 16, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'aria', unlockCo: 'aria', forcedCo: 'aria', recommendedRank: 3, recommendedUpgrades: 9,
    map: sym(['mmf.c.f.', 'mH==..t.', 'fB.=c...', '..f===#~', '.c..f.c.', 'fA.===#~', 'm..f.c..', '.c..=...', 'mmm.f...']),
    units: mir(16, [['infantry', 4, 1], ['mech', 3, 2], ['heavy', 4, 3], ['tank', 5, 4], ['artillery', 2, 5], ['recon', 5, 2], ['gundrone', 2, 6]], [['heavy', 12, 3], ['rockets', 12, 6]]),
    funds: [8500, 11000], weather: 'rain', fog: false, unitCap: [20, 24], objective: { type: 'hq' }, aiLevel: 3,
    hint: 'Aria\'s cyber net slows movements and skill charges. Capture the radio relays to break her disruption.',
    briefing: [
      { who: 'narrator', text: 'The Iron Stronghold. Cyber Officer Aria Chen has locked down communications.' },
      { who: 'aria', text: 'Disruption protocol active. Your tactical network belongs to me.' },
      { who: 'rhea', text: 'Capture the Radio Towers to override her jammer and secure the HQ.' },
    ],
    outro: [
      { who: 'aria', text: 'Jammer bypassed... Impression recorded. Good fight, Commander.' },
    ],
  },
  {
    id: 'm27', name: 'Shadow Breach', act: 12, par: 16, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'zero', unlockCo: 'zero',
    map: sym(['mmf..f..', 'mH=c...m', 'fB==~.#.', '..f=~.c.', '.A.====.', 'f..c~f..', 'mm.f~.m.', '...=#c..', 'mm..f...']),
    units: mir(16, [['tank', 4, 1], ['heavy', 5, 2], ['artillery', 2, 4], ['rockets', 1, 5], ['infantry', 4, 3], ['mech', 3, 5], ['aa', 2, 7]], [['heavy', 12, 3], ['artillery', 13, 6], ['rockets', 11, 7]]),
    funds: [9000, 12000], weather: 'sand', fog: false, unitCap: [20, 24], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'Zero\'s long-range artillery covers the breach. Advance under cover and destroy his siege batteries.',
    briefing: [
      { who: 'narrator', text: 'Shadow Breach. Siege Director Zero commands an impenetrable battery line.' },
      { who: 'zero', text: 'Every tile in this canyon is pre-targeted. Step forward if you dare.' },
      { who: 'brann', text: 'His guns have maximum range. Flank through the mountain trails with mechs.' },
    ],
    outro: [
      { who: 'zero', text: 'Targeting overrun... Impressive tactics.' },
    ],
  },
  {
    id: 'm28', name: 'Apex Core II', act: 12, par: 17, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'seraphina', unlockCo: 'seraphina',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['battleship', 0, 5], ['cruiser', 1, 7], ['tank', 5, 2], ['heavy', 4, 4], ['fighter', 2, 3], ['bomber', 3, 6], ['rockets', 2, 8]], [['heavy', 12, 2], ['bomber', 13, 4], ['battleship', 15, 8]]),
    boss: { x: 12, y: 2, team: 1, type: 'heavy', name: 'OMEGA CORE', hp: 100, phases: 4 },
    funds: [9500, 13000], weather: 'clear', fog: false, unitCap: [22, 26], objective: { type: 'hq' }, aiLevel: 3,
    hint: 'Seraphina\'s nanite fields heal enemy forces turn after turn. Focus fire to eliminate targets clean.',
    briefing: [
      { who: 'narrator', text: 'Omega Horizon. Medic General Seraphina guards the rebooting Omega Core.' },
      { who: 'seraphina', text: 'My nanite field heals all wounded. Half-hearted attacks will accomplish nothing.' },
      { who: 'dax', text: 'No single shots! Focus full fire on one unit at a time until it is destroyed!' },
    ],
    outro: [
      { who: 'seraphina', text: 'Nanite grid depleted. The Omega Vanguard is yours.' },
    ],
  },
  {
    id: 'm29', name: 'Fort Raid 3', act: 13, par: 20, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'architect',
    map: sym(['mmmmmmmm', 'mmBmmHmm', 'mc....cm', 'm.t..t.m', 'm..mm..m', 'm.t..t.m', 'mc....cm', 'mmAmmBmm', 'mmmmmmmm']),
    units: mir(16, [['heavy', 5, 4], ['artillery', 3, 2], ['artillery', 3, 6], ['mech', 4, 3], ['mech', 4, 5]], [['rockets', 14, 2], ['rockets', 14, 6], ['artillery', 13, 3], ['artillery', 13, 5], ['heavy', 12, 3], ['mech', 11, 4]]),
    funds: [14000, 14000], weather: 'clear', weatherPool: ['clear', 'rain', 'snow', 'sand'], fog: false, unitCap: [24, 28], objective: { type: 'hq' }, aiLevel: 3,
    hint: 'A heavily fortified base. Bring heavy weapons and prepare for a siege.',
    briefing: [
      { who: 'narrator', text: 'Approaching an enemy stronghold.' },
      { who: 'rhea', text: 'This fort is heavily defended. We need to crack their defenses and take down the Fort Commander.' },
      { who: 'brann', text: 'Artillery and heavy armor are your best friends here. Do not rush blindly.' },
    ],
    outro: [
      { who: 'rhea', text: 'The fort is ours. The enemy lines are broken.' },
      { who: 'narrator', text: 'Another bastion falls. The march continues.' },
    ],
  },
  {
    id: 'm30', name: 'Stratosphere Supremacy', act: 14, par: 14, cos: ['sora', 'kaelen', 'rhea', 'aria'], enemyCo: 'kaelen', forcedCo: 'sora', recommendedRank: 4, recommendedUpgrades: 12,
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['fighter', 2, 1], ['bomber', 3, 2], ['bcopter', 4, 3], ['gundrone', 2, 4], ['drone', 1, 5]], [['bomber', 13, 5], ['drone', 14, 2]]),
    funds: [8000, 10000], weather: 'clear', weatherPool: ['clear', 'rain', 'snow'], fog: false, unitCap: [16, 18], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'Air-only battle! Control the skyways with fighters and bombers. Refuel at captured airports.',
    briefing: [
      { who: 'narrator', text: 'Stratosphere Supremacy. An air-only dogfight above the cloud deck.' },
      { who: 'kaelen', text: 'No ground forces, no artillery cover. Only pilots, aircraft, and high-altitude steel.' },
      { who: 'sora', text: 'Fighters sweep bombers, bombers crush airports. Watch your fuel reserves!' },
    ],
    outro: [
      { who: 'kaelen', text: 'Unmatched air dominance! The skies belong to the Republic.' },
    ],
  },
  {
    id: 'm31', name: 'Abyssal Clash', act: 14, par: 15, cos: ['mira', 'rhea', 'dax', 'zero'], enemyCo: 'mira', forcedCo: 'mira', recommendedRank: 4, recommendedUpgrades: 12,
    map: sym(['wwwr.P.w', 'wP=w.r.w', 'rws....w', 'wws.w..w', 'rws..P.w', 'wws..Q.w', 'm..f..w.', '....P...', 'mmm.f...']),
    units: mir(16, [['battleship', 0, 3], ['cruiser', 1, 2], ['sub', 1, 4]]),
    funds: [9000, 12000], weather: 'clear', weatherPool: ['clear', 'rain'], fog: false, unitCap: [16, 18], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'Sea-only naval battle! Battleships shell at long range; cruisers hunt subs; subs strike unseen.',
    briefing: [
      { who: 'narrator', text: 'Abyssal Trench. A pure naval armada battle across deep water and coral reefs.' },
      { who: 'mira', text: 'Pure naval combat. Cruisers shield your battleships from enemy submarines.' },
      { who: 'rhea', text: 'Eliminate the enemy fleet and secure the naval sector.' },
    ],
    outro: [
      { who: 'mira', text: 'The sea is clear. Flawless naval victory, Commander!' },
      { who: 'narrator', text: 'CONGRATULATIONS! You have mastered every air, land, and sea campaign mission!' },
    ],
  },
  {
    id: 'm32', name: 'Allied Vanguard', act: 15, par: 14, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'volkov', enemyCo2: 'frost', allyCo: 'dax', recommendedRank: 4, recommendedUpgrades: 12,
    map: sym(['mmf..f..', 'mH=c...m', 'fB==~.#.', '..f=~.c.', '.A.====.', 'f..c~f..', 'mm.f~.m.', '...=#c..', 'mm..f...']),
    units: mir(16, [
      ['tank', 4, 1], ['heavy', 5, 2], ['artillery', 2, 4], ['rockets', 2, 6], ['infantry', 4, 3], ['mech', 3, 5], ['aa', 2, 7],
    ], [['heavy', 12, 3], ['artillery', 13, 6], ['rockets', 11, 7], ['tank', 11, 4]]),
    funds: [9000, 12000], weather: 'clear', weatherPool: ['clear', 'snow', 'rain'], fog: false, unitCap: [22, 26], objective: { type: 'hq' },
    adaptiveTrigger: { day: 3 }, adaptiveObjective: { type: 'rout' },
    adaptiveDialogue: [
      { who: 'frost', text: 'A joint Republic assault? Your HQ attempt is meaningless — my frozen reserves have surrounded the perimeter!' },
      { who: 'dax', text: 'Let them come! Commander, change of plans: capture won\'t secure this valley. Complete elimination of all enemy forces!' },
      { who: 'volkov', text: 'Iron and ice stand as one! Defend every soldier!' },
    ],
    aiLevel: 3,
    hint: 'Dual CO Battlefield! Major Dax joins as an Allied AI CO against General Volkov and Baron Frost. The objective shifts on Day 3!',
    briefing: [
      { who: 'narrator', text: 'Vanguard Ridge. General Volkov and Baron Frost have forged an elite defensive pact.' },
      { who: 'dax', text: 'You\'re not fighting alone today, Commander! My armored division will advance alongside your vanguard.' },
      { who: 'volkov', text: 'Two Republic officers... a combined assault. We shall crush both your columns!' },
      { who: 'frost', text: 'The snow will freeze your combined treads where they stand.' },
      { who: 'rhea', text: 'Coordinate with Dax\'s armor. Capture their HQ or adapt if the situation changes.' },
    ],
    outro: [
      { who: 'dax', text: 'That\'s how the Republic fights! Excellent joint coordination, Commander!' },
      { who: 'volkov', text: 'Your combined tactics breached our line... an honorable defeat.' },
    ],
  },
  {
    id: 'm33', name: 'Dual Front Citadel', act: 16, par: 16, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'architect', enemyCo2: 'zero', allyCo: 'sora', recommendedRank: 4, recommendedUpgrades: 14,
    map: sym(['mm.ff...', 'mH=c...m', 'fB==c...', '..f=..m.', '.A.====.', 'f..f..t.', 'm.c...f.', '..c.=...', 'mm..f...']),
    units: mir(16, [
      ['fighter', 3, 1], ['aa', 5, 2], ['missiles', 2, 4], ['gundrone', 4, 3], ['bcopter', 5, 5], ['infantry', 4, 6], ['tank', 2, 7],
    ], [['bomber', 12, 3], ['missiles', 12, 6], ['heavy', 11, 4]]),
    boss: { x: 12, y: 3, team: 1, type: 'bomber', name: 'DUAL CITADEL CORE', hp: 100, phases: 4 },
    funds: [10000, 14000], weather: 'clear', weatherPool: ['clear', 'sand', 'rain'], fog: false, unitCap: [22, 28], objective: { type: 'hq' },
    adaptiveTrigger: { bossPhaseBreak: true }, adaptiveObjective: { type: 'rout' },
    adaptiveDialogue: [
      { who: 'architect', text: 'CITADEL SHIELD PHASE CRACKED. EXECUTING TOTAL ERADICATION COUNTER-MEASURES.' },
      { who: 'zero', text: 'All battery grids overcharge! No retreat for any remaining unit!' },
      { who: 'sora', text: 'Their command structure is breaking down into blind aggression! Change target: wipe out every hostile unit on the board!' },
    ],
    aiLevel: 3,
    hint: 'Dual CO Citadel! Sora\'s air wing flies alongside you against the Architect and Siege Director Zero. Breaking the boss shield shifts objective!',
    briefing: [
      { who: 'narrator', text: 'Dual Front Citadel. Siege Director Zero provides long-range barrage cover for the Architect\'s airborne core.' },
      { who: 'sora', text: 'I\'ll cover your air space from the north flank, Commander! Let\'s break Zero\'s siege batteries together!' },
      { who: 'zero', text: 'Calculated trajectory: zero probability of Republic survival under joint bombardment.' },
      { who: 'architect', text: 'DUAL THREAT DETECTED. ALL DEFENSE MATRIXES ENGAGED.' },
    ],
    outro: [
      { who: 'sora', text: 'Target down! Skies are clear, and the Citadel is ours!' },
      { who: 'zero', text: 'Targeting overriden by joint air supremacy...' },
    ],
  },
  {
    id: 'm34', name: 'Sovereign Alliance', act: 17, par: 18, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'architect', enemyCo2: 'seraphina', allyCo: 'mira', recommendedRank: 5, recommendedUpgrades: 15,
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=t.', 'wwsfA.=.', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [
      ['battleship', 0, 5], ['cruiser', 1, 7], ['heavy', 5, 2], ['tank', 5, 5], ['rockets', 3, 6], ['mech', 4, 3], ['fighter', 2, 3], ['bomber', 4, 7], ['aa', 5, 8],
    ], [['heavy', 11, 4], ['bomber', 12, 3], ['battleship', 15, 7], ['rockets', 13, 6]]),
    boss: { x: 11, y: 4, team: 1, type: 'heavy', name: 'SOVEREIGN CORE', hp: 100, phases: 5 },
    funds: [12000, 16000], weather: 'clear', weatherPool: ['clear', 'rain', 'snow', 'sand'], fog: false, unitCap: [24, 30], objective: { type: 'hq' },
    adaptiveTrigger: { hqCaptured: true }, adaptiveObjective: { type: 'rout' },
    adaptiveDialogue: [
      { who: 'seraphina', text: 'You captured the primary HQ, but my nanite matrix has transferred the Sovereign Core to the entire fleet!' },
      { who: 'mira', text: 'Commander, capturing HQ won\'t end this battle! We must achieve total annihilation of their combined forces!' },
      { who: 'architect', text: 'ABSOLUTE ERADICATION MODE ACTIVE.' },
    ],
    aiLevel: 3,
    hint: 'Ultimate Dual CO Grand Battle! Admiral Mira commands the naval flank alongside your army against the Sovereign Core and General Seraphina!',
    briefing: [
      { who: 'narrator', text: 'Sovereign Horizon. The ultimate confrontation where naval armada and ground forces unite against the Architect\'s final war matrix.' },
      { who: 'mira', text: 'My fleet will anchor your western flank, Commander. Together, we bring true peace to the frontier.' },
      { who: 'seraphina', text: 'My nanites heal every scar. Your combined assault will achieve nothing.' },
      { who: 'architect', text: 'FINAL SOVEREIGN PROTOCOL ACTIVE. DUAL COMMAND DETECTED.' },
      { who: 'rhea', text: 'For the Republic, for the Dominion, and for all our people... ADVANCE!' },
    ],
    outro: [
      { who: 'architect', text: 'SOVEREIGN CORE TERMINATED... GLOBAL SYNCHRONIZATION PERMANENTLY CEASED...' },
      { who: 'rhea', text: 'We did it... together. Admiral, Major, Lieutenant, Colonel... thank you.' },
      { who: 'mira', text: 'The seas and skies are at peace at last.' },
      { who: 'narrator', text: 'VICTORY! The Sovereign Alliance has defeated the final war machine. Total peace reigns across the entire frontier.' },
    ],
  },
  {
    id: 'm35', name: 'Desperate Measures', act: 18, par: 12, cos: ['dax', 'sora', 'mira', 'brann', 'rhea'], enemyCo: 'zero', enemyCo2: 'volkov',
    map: sym(['mmmff..', 'mH=c...', 'fB==~.#', '..f=~.c', '.A.====', 'f..c~f.', 'm..f~..', '.c.=#..', 'mmm.f..']),
    units: mir(14, [['infantry', 3, 1], ['mech', 4, 3], ['tank', 3, 5]], [['heavy', 9, 1], ['artillery', 10, 4], ['rockets', 11, 6], ['tank', 11, 2], ['tank', 9, 7], ['aa', 10, 1]]),
    funds: [2000, 6000], weather: 'clear', weatherPool: ['clear', 'rain', 'snow'], fog: false, unitCap: [15, 20], objective: { type: 'survive', days: 5 },
    adaptiveTrigger: { day: 5, reinforcements: [['heavy', 2, 2, 0], ['heavy', 2, 6, 0], ['rockets', 1, 4, 0], ['bomber', 0, 3, 0]], fundsBonus: [10000, 0] }, adaptiveObjective: { type: 'rout' },
    adaptiveDialogue: [
      { who: 'rhea', text: 'Hold the line! Republic reinforcements have arrived!' },
      { who: 'dax', text: 'Heavy armor and air support on site. Time to push back!' },
      { who: 'volkov', text: 'They brought reserves! Do not let them turn the tide!' },
    ],
    aiLevel: 3,
    hint: 'Survive the massive onslaught until Day 5 when powerful reinforcements arrive, then wipe out the enemy!',
    briefing: [
      { who: 'narrator', text: 'The Crimson Dominion launches a surprise overwhelming assault on a border outpost.' },
      { who: 'volkov', text: 'Your outpost is surrounded. Surrender immediately.' },
      { who: 'zero', text: 'Targeting locked on all escape routes.' },
      { who: 'rhea', text: 'We are severely outgunned. Fall back to defensive positions and hold out for reinforcements!' },
    ],
    outro: [
      { who: 'volkov', text: 'A tactical withdrawal is necessary. Their reinforcements were too strong.' },
      { who: 'rhea', text: 'We held them off. But this is just the beginning of their new offensive.' },
    ],
  },
  {
    id: 'm36', name: 'United Front', act: 19, par: 14, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'nyx', enemyCo2: 'frost', allyCo: 'brann', recommendedRank: 4, recommendedUpgrades: 12,
    map: sym(['mm.ff...', 'mH=c...m', 'fB==c...', '..f=..m.', '.A.====.', 'f..f..t.', 'm.c...f.', '..c.=...', 'mm..f...']),
    units: mir(16, [
      ['tank', 4, 1], ['mech', 5, 2], ['artillery', 2, 4], ['infantry', 4, 3], ['aa', 2, 7],
    ], [['heavy', 12, 3], ['artillery', 13, 6], ['rockets', 11, 7], ['tank', 11, 2], ['mech', 13, 4]]),
    funds: [8000, 12000], weather: 'snow', weatherPool: ['snow', 'rain', 'clear'], fog: false, unitCap: [20, 24], objective: { type: 'hq' },
    aiLevel: 3,
    hint: 'Colonel Brann fights alongside you! Use his artillery cover to advance against Nyx and Frost.',
    briefing: [
      { who: 'narrator', text: 'A coordinated strike deep into Dominion territory. Colonel Brann provides artillery support.' },
      { who: 'brann', text: 'My guns are sighted and ready. Let\'s show them the power of Republic artillery.' },
      { who: 'nyx', text: 'Shadows hide us, cold slows you. A foolish advance.' },
      { who: 'frost', text: 'The snow will bury your combined forces.' },
      { who: 'rhea', text: 'Use the cover of Brann\'s bombardment to secure their HQ.' },
    ],
    outro: [
      { who: 'brann', text: 'Target area secured. Beautiful coordination, Commander.' },
      { who: 'nyx', text: 'We fall back to the Omega Facility...' },
    ],
  },
  {
    id: 'm37', name: 'The Omega Clash', act: 20, par: 20, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'architect', enemyCo2: 'volkov', allyCo: 'sora', recommendedRank: 5, recommendedUpgrades: 15,
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=t.', 'wwsfA.=.', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [
      ['battleship', 0, 5], ['cruiser', 1, 7], ['tank', 5, 2], ['heavy', 4, 4], ['rockets', 2, 8],
    ], [['heavy', 11, 4], ['bomber', 12, 3], ['battleship', 15, 7], ['rockets', 13, 6], ['fighter', 14, 2]]),
    boss: { x: 11, y: 4, team: 1, type: 'heavy', name: 'OMEGA CONSTRUCT', hp: 100, phases: 6 },
    funds: [10000, 18000], weather: 'clear', weatherPool: ['clear', 'rain', 'snow', 'sand'], fog: false, unitCap: [24, 30], objective: { type: 'hq' },
    adaptiveTrigger: { day: 5, reinforcements: [['bomber', 2, 3, 0, true], ['fighter', 2, 4, 0, true], ['fighter', 1, 2, 0, true], ['bcopter', 1, 6, 0, true]], fundsBonus: [15000, 0] },
    adaptiveObjective: { type: 'rout' },
    adaptiveDialogue: [
      { who: 'architect', text: 'OMEGA SHIELD DAMAGED. REROUTING ALL POWER TO OFFENSIVE CAPABILITIES.' },
      { who: 'sora', text: 'I\'m bringing the full Air Wing, Commander! Clear the skies!' },
      { who: 'volkov', text: 'No matter how many planes you bring, the Iron General stands!' },
    ],
    aiLevel: 3,
    hint: 'Ultimate 2v2 Showdown! Break a boss phase to trigger massive air reinforcements from Sora, then rout the enemy!',
    briefing: [
      { who: 'narrator', text: 'The Omega Facility. The final stronghold of the rebuilt war machine network.' },
      { who: 'sora', text: 'I\'m flying cover, but they have heavy anti-air. I\'ll bring the heavy bombers once you crack their main shield!' },
      { who: 'architect', text: 'OMEGA CONSTRUCT ONLINE. PREPARE FOR ANNIHILATION.' },
      { who: 'volkov', text: 'I will personally see to your destruction.' },
      { who: 'rhea', text: 'This is it. Break their construct, call in Sora\'s reinforcements, and end this!' },
    ],
    outro: [
      { who: 'architect', text: 'OMEGA CONSTRUCT DESTROYED... SYSTEM FAILURE...' },
      { who: 'volkov', text: 'Impossible... the combined might of the Republic... defeated us.' },
      { who: 'rhea', text: 'The facility is secure. The frontier is finally safe.' },
      { who: 'narrator', text: 'Total Victory! You have conquered the most desperate battles.' },
    ],
  },


  {
    id: 'm38', name: 'Naval Blockade Operation', act: 20, par: 15, cos: ['mira', 'rhea', 'dax', 'zero'], enemyCo: 'volkov', forcedCo: 'mira', recommendedRank: 4, recommendedUpgrades: 12,
    map: sym(['wws.P..w.', 'wP=w.r.w.', 'rws..P..w', 'wws.w.r.w', 'rws..P..w', 'wws..Q.w.', 'm..f..w.f', '....P...m', 'mmm.f..f.']),
    units: mir(18, [['battleship', 0, 3], ['cruiser', 1, 2], ['sub', 1, 4], ['battleship', 1, 5], ['cruiser', 4, 7]], [['sub', 16, 3], ['battleship', 16, 5]]),
    funds: [12000, 15000], weather: 'clear', weatherPool: ['clear', 'rain'], fog: false, unitCap: [20, 24], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Naval-only operation! Cruisers protect battleships against enemy submarines in deep reef waters.',
    briefing: [
      { who: 'narrator', text: 'Naval Blockade Operation. General Volkov has deployed a heavy naval blockade across the reef line.' },
      { who: 'mira', text: 'All hands on deck! No ground or air forces can support us here. Pure naval power only.' },
      { who: 'volkov', text: 'Your fleet will sink to the ocean floor, Admiral!' },
    ],
    outro: [
      { who: 'volkov', text: 'Blockade shattered... your naval maneuvers were flawless.' },
      { who: 'mira', text: 'Sea sector 38 secured!' },
    ],
  },
  {
    id: 'm39', name: 'Fort Raid 4', act: 21, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'volkov', recommendedRank: 4, recommendedUpgrades: 13,
    map: sym(['mmmmmmmmmm', 'mmBmmHmm.m', 'mc....cm.f', 'm.t..t.m..', 'm..mm..m.f', 'm.t..t.m..', 'mc....cm.f', 'mmAmmBmm.m', 'mmmmmmmmmm']),
    units: mir(20, [['heavy', 5, 4], ['artillery', 3, 2], ['artillery', 3, 6], ['mech', 4, 3], ['mech', 4, 5], ['rockets', 2, 4]], [['rockets', 16, 2], ['rockets', 16, 6], ['artillery', 15, 3], ['artillery', 15, 5], ['heavy', 14, 4], ['mech', 13, 4]]),
    funds: [14000, 14000], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    boss: { x: 16, y: 4, team: 1, type: 'heavy', name: 'FORT COMMANDER', hp: 50, phases: 3 },
    aiLevel: 3,
    hint: 'A heavily fortified base. Bring heavy weapons and prepare for a siege.',
    briefing: [
      { who: 'narrator', text: 'Approaching an enemy stronghold.' },
      { who: 'rhea', text: 'This fort is heavily defended. We need to crack their defenses and take down the Fort Commander.' },
      { who: 'brann', text: 'Artillery and heavy armor are your best friends here. Do not rush blindly.' },
    ],
    outro: [
      { who: 'rhea', text: 'The fort is ours. The enemy lines are broken.' },
      { who: 'narrator', text: 'Another bastion falls. The march continues.' },
    ],
  },
  {
    id: 'm40', name: 'Comm Relay Breach', act: 21, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'zero', allyCo: 'rhea', recommendedRank: 4, recommendedUpgrades: 13,
    map: sym(['mmmf..A..f', 'mc=....m..', 'f..A.f...m', '..f..f...f', '.A.....t..', 'f....f...m', 'm..f.....f', '....A....m', 'mmm.f....f']),
    units: mir(20, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5], ['heavy', 4, 4], ['artillery', 2, 6]], [['artillery', 16, 6], ['tank', 15, 3], ['heavy', 16, 4]]),
    funds: [13000, 15000], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: "Fog of war! Use recon units and drones to spot Zero's siege artillery.",
    briefing: [
      { who: 'narrator', text: "The Architect's signal is bouncing through these ancient comm towers. Secure them." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'zero', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'zero', text: 'Targeting matrix disrupted... retreating.' },
      { who: 'rhea', text: 'Sector 40 secured. Good work.' },
    ],
  },
  {
    id: 'm41', name: 'Nanite Perimeter', act: 21, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'seraphina', recommendedRank: 4, recommendedUpgrades: 13,
    map: sym(['mmf...f...f', 'mH=c...m..m', 'fB==..f...f', '..f=..c...c', '.A.====...=', 'f..c.f....f', 'mm.f..m...m', '...=c.....c', 'mm..f....f.']),
    units: mir(22, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5], ['heavy', 4, 4], ['artillery', 3, 6]], [['artillery', 18, 6], ['tank', 17, 3], ['heavy', 18, 4]]),
    funds: [13500, 15500], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: "Seraphina's nanites repair enemy units on properties. Focus fire to eliminate them clean.",
    briefing: [
      { who: 'narrator', text: 'Medic General Seraphina has established a nanite perimeter. Focus fire to destroy units completely.' },
      { who: 'rhea', text: 'Half-damaged units will repair back to full health on their turn. Finish targets!' },
      { who: 'seraphina', text: 'My nanite grid preserves every soldier.' },
    ],
    outro: [
      { who: 'seraphina', text: 'Nanite field overwhelmed...' },
      { who: 'rhea', text: 'Perimeter cleared.' },
    ],
  },
  {
    id: 'm42', name: 'Stratosphere Clash II', act: 22, par: 15, cos: ['sora', 'kaelen', 'rhea', 'aria'], enemyCo: 'architect', forcedCo: 'sora', recommendedRank: 4, recommendedUpgrades: 14,
    map: sym(['mmmf..A..f', 'mc=....m..', 'f..A.f...m', '..f..f...f', '.A.......t', 'f....f...m', 'm..f.....f', '....A....m', 'mmm.f....f']),
    units: mir(20, [['fighter', 2, 1], ['bomber', 3, 2], ['bcopter', 4, 3], ['gundrone', 2, 4], ['drone', 1, 5], ['fighter', 1, 7]], [['bomber', 17, 5], ['drone', 18, 2], ['fighter', 16, 3]]),
    funds: [14000, 16000], weather: 'snow', weatherPool: ['snow', 'clear', 'rain'], fog: false, unitCap: [22, 26], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Air-only battle! Command sky fighters, bombers, and drones in a high-altitude storm.',
    briefing: [
      { who: 'narrator', text: 'Stratosphere Clash II. High-altitude air combat against remnant Architect aerial swarms.' },
      { who: 'sora', text: 'Air units only! Keep your fighters fueled at captured airports.' },
      { who: 'architect', text: 'AERIAL DOMINANCE PROTOCOL ACTIVE.' },
    ],
    outro: [
      { who: 'architect', text: 'AERIAL FORMATION DESTROYED...' },
      { who: 'sora', text: 'Skies belong to us!' },
    ],
  },
  {
    id: 'm43', name: 'Desert Oasis Assault', act: 22, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'aria', recommendedRank: 4, recommendedUpgrades: 14,
    map: sym(['mmf...f...f', 'mH=c...m..m', 'fB==..f...f', '..f=..c...c', '.A.====...=', 'f..c.f....f', 'mm.f..m...m', '...=c.....c', 'mm..f....f.']),
    units: mir(22, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5], ['heavy', 5, 4], ['rockets', 3, 6]], [['artillery', 18, 6], ['tank', 17, 3], ['heavy', 18, 4]]),
    funds: [14000, 16500], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A massive sandstorm cuts indirect fire range. Engage in close combat.',
    briefing: [
      { who: 'narrator', text: 'A massive sandstorm is moving in. We must secure the oasis before visibility drops.' },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'aria', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'aria', text: 'Network jammed... retreating.' },
      { who: 'rhea', text: 'Oasis secured.' },
    ],
  },
  {
    id: 'm44', name: 'Valley of Shadows', act: 22, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'kaelen', allyCo: 'brann', recommendedRank: 4, recommendedUpgrades: 14,
    map: sym(['mmmf..A..f', 'mc=....m..', 'f..A.f...m', '..f..f...f', '.A.....t..', 'f....f...m', 'm..f.....f', '....A....m', 'mmm.f....f']),
    units: mir(20, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5], ['heavy', 4, 4], ['artillery', 2, 6]], [['artillery', 16, 6], ['tank', 15, 3], ['heavy', 16, 4]]),
    funds: [14500, 17000], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Colonel Brann joins as an ally! Clear fog with recon units.',
    briefing: [
      { who: 'narrator', text: 'Flight Captain Kaelen has set an ambush in the valley.' },
      { who: 'brann', text: 'My artillery is ready. Scout the fog!' },
      { who: 'kaelen', text: "You won't see the strike coming." },
    ],
    outro: [
      { who: 'kaelen', text: 'Well fought...' },
      { who: 'brann', text: 'Valley cleared.' },
    ],
  },
  {
    id: 'm45', name: 'Ground Supremacy Operation', act: 23, par: 15, cos: ['dax', 'brann', 'rhea', 'grimm'], enemyCo: 'grimm', forcedCo: 'dax', recommendedRank: 4, recommendedUpgrades: 14,
    map: sym(['mmmf..f..m', 'mH=c...m.f', 'fB==..f..c', '..f=..c..=', '.C.====.C.', 'f..c.f...f', 'mm.f..m..m', '...=c....c', 'mmm.f...ff']),
    units: mir(20, [['infantry', 3, 1], ['tank', 4, 2], ['heavy', 5, 3], ['mech', 3, 4], ['artillery', 2, 5], ['rockets', 1, 5], ['recon', 2, 7], ['aa', 4, 8]], [['heavy', 16, 3], ['tank', 15, 2], ['rockets', 17, 6], ['mech', 16, 4]]),
    funds: [15000, 17500], weather: 'clear', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Ground-only operation! Only land armor, infantry, and artillery forces are deployed.',
    briefing: [
      { who: 'narrator', text: 'Ground Supremacy Operation. Pure armor and infantry clash across open fields.' },
      { who: 'dax', text: 'Ground units only! Heavy tanks forward, artillery behind!' },
      { who: 'grimm', text: 'My infantry horde will drown your tanks!' },
    ],
    outro: [
      { who: 'grimm', text: 'My horde... crushed!' },
      { who: 'dax', text: 'Tanks rule the battlefield!' },
    ],
  },
  {
    id: 'm46', name: 'Frozen River Breach', act: 23, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'frost', allyCo: 'dax', recommendedRank: 4, recommendedUpgrades: 14,
    map: sym(['mmmf..A..f', 'mc=....m..', 'f..A.f...m', '..f..f...f', '.A.......t', 'f....f...m', 'm..f.....f', '....A....m', 'mmm.f....f']),
    units: mir(20, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5], ['heavy', 5, 4], ['mech', 3, 6]], [['heavy', 16, 4], ['tank', 15, 2]]),
    funds: [15000, 17500], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Snow slows vehicles. Major Dax provides tank support across the frozen ice.',
    briefing: [
      { who: 'narrator', text: 'The frozen river provides a rare crossing opportunity. Secure the bridgehead.' },
      { who: 'dax', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'frost', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'frost', text: 'Thaw arrives...' },
      { who: 'dax', text: 'Bridgehead secured.' },
    ],
  },
  {
    id: 'm47', name: 'Convoy Intercept', act: 23, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'nyx', recommendedRank: 4, recommendedUpgrades: 14,
    map: sym(['mmf...f...f', 'mH=c...m..m', 'fB==..f...f', '..f=..c...c', '.A.====...=', 'f..c.f....f', 'mm.f..m...m', '...=c.....c', 'mm..f....f.']),
    units: mir(22, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5], ['heavy', 5, 4], ['bcopter', 3, 6]], [['heavy', 18, 4], ['tank', 17, 2]]),
    funds: [15500, 18000], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A convoy of experimental Dominion weaponry is passing through. Do not let it escape.',
    briefing: [
      { who: 'narrator', text: 'A convoy of experimental Dominion weaponry is passing through. Intercept and destroy it.' },
      { who: 'rhea', text: 'Advance quickly before they establish defenses.' },
      { who: 'nyx', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'nyx', text: 'Convoy destroyed...' },
      { who: 'rhea', text: 'Weapons secured.' },
    ],
  },
  {
    id: 'm48', name: 'Coral Reef Fleet Strike', act: 24, par: 15, cos: ['mira', 'rhea', 'volkov', 'zero'], enemyCo: 'volkov', allyCo: 'mira', recommendedRank: 5, recommendedUpgrades: 15,
    map: sym(['wws.P..w.', 'wP=w.r.w.', 'rws..P..w', 'wws.w.r.w', 'rws..P..w', 'wws..Q.w.', 'm..f..w.f', '....P...m', 'mmm.f..f.']),
    units: mir(18, [['battleship', 0, 3], ['cruiser', 1, 2], ['sub', 1, 4], ['battleship', 1, 5], ['cruiser', 4, 7]], [['sub', 16, 3], ['battleship', 16, 5], ['cruiser', 17, 4]]),
    funds: [16000, 18500], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Naval-only operation under fog! Use cruisers to detect hidden submarines.',
    briefing: [
      { who: 'narrator', text: 'Coral Reef Fleet Strike. Pure naval clash under fog of war.' },
      { who: 'mira', text: 'Naval forces only! Use cruisers to scout reefs for enemy subs.' },
      { who: 'volkov', text: 'My fleet controls these waters!' },
    ],
    outro: [
      { who: 'volkov', text: 'Submarines lost... fleet retreating.' },
      { who: 'mira', text: 'Reef cleared!' },
    ],
  },
  {
    id: 'm49', name: 'Fort Raid 5', act: 24, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'zero', recommendedRank: 5, recommendedUpgrades: 15,
    map: sym(['mmmmmmmmmm', 'mmBmmHmm.m', 'mc....cm.f', 'm.t..t.m..', 'm..mm..m.f', 'm.t..t.m..', 'mc....cm.f', 'mmAmmBmm.m', 'mmmmmmmmmm']),
    units: mir(20, [['heavy', 5, 4], ['artillery', 3, 2], ['artillery', 3, 6], ['mech', 4, 3], ['mech', 4, 5], ['rockets', 2, 4]], [['rockets', 16, 2], ['rockets', 16, 6], ['artillery', 15, 3], ['artillery', 15, 5], ['heavy', 14, 4], ['mech', 13, 4]]),
    funds: [16000, 16000], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    boss: { x: 16, y: 4, team: 1, type: 'heavy', name: 'FORT COMMANDER', hp: 50, phases: 3 },
    aiLevel: 3,
    hint: 'A heavily fortified base. Bring heavy weapons and prepare for a siege.',
    briefing: [
      { who: 'narrator', text: 'Approaching an enemy stronghold.' },
      { who: 'rhea', text: 'This fort is heavily defended. We need to crack their defenses and take down the Fort Commander.' },
      { who: 'brann', text: 'Artillery and heavy armor are your best friends here. Do not rush blindly.' },
    ],
    outro: [
      { who: 'rhea', text: 'The fort is ours. The enemy lines are broken.' },
      { who: 'narrator', text: 'Another bastion falls. The march continues.' },
    ],
  },
  {
    id: 'm50', name: 'Titan Core Defense', act: 24, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'seraphina', allyCo: 'rhea', recommendedRank: 5, recommendedUpgrades: 15,
    map: sym(['mmmf..A..f', 'mc=....m..', 'f..A.f...m', '..f..f...f', '.A.......t', 'f....f...m', 'm..f.....f', '....A....m', 'mmm.f....f']),
    units: mir(20, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5], ['heavy', 5, 4], ['artillery', 3, 6]], [['heavy', 16, 4], ['tank', 15, 2]]),
    funds: [16500, 19000], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    boss: { x: 16, y: 4, team: 1, type: 'heavy', name: 'TITAN CORE', hp: 100, phases: 4 },
    aiLevel: 3,
    hint: 'Boss battle: break the 4 shield phases of the Titan Core during a blizzard.',
    briefing: [
      { who: 'narrator', text: 'A sudden blizzard has halted Dominion movements. Strike while they are vulnerable.' },
      { who: 'rhea', text: 'Break the Titan Core shields before they recover!' },
      { who: 'seraphina', text: 'The core will endure!' },
    ],
    outro: [
      { who: 'seraphina', text: 'Core destroyed...' },
      { who: 'rhea', text: 'Victory is ours.' },
    ],
  },
  {
    id: 'm51', name: 'Cloud Peak Sky Battle', act: 25, par: 15, cos: ['sora', 'kaelen', 'rhea', 'aria'], enemyCo: 'architect', recommendedRank: 5, recommendedUpgrades: 15,
    map: sym(['wwsmmf...f', 'wP=H=c..m.', 'wws.B=...f', 'wwsfA.=t.m', 'rws.c....f', 'wws.====.m', 'wwsf..c..f', 'wPs.B=...m', 'wwsmf....f']),
    units: mir(20, [['fighter', 2, 1], ['bomber', 3, 2], ['bcopter', 4, 3], ['gundrone', 2, 4], ['drone', 1, 5], ['fighter', 2, 7]], [['bomber', 17, 5], ['drone', 18, 2], ['fighter', 16, 3]]),
    funds: [17000, 19500], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Air-only battle! High altitude sandstorm reduces vision and firing accuracy.',
    briefing: [
      { who: 'narrator', text: 'Cloud Peak Sky Battle. Pure air forces fight through shifting sand clouds.' },
      { who: 'sora', text: 'Sky units only! Drones give us sight in the dust!' },
      { who: 'architect', text: 'SKY MATRIX OPERATIONAL.' },
    ],
    outro: [
      { who: 'architect', text: 'SKY MATRIX TERMINATED...' },
      { who: 'sora', text: 'Cloud peak secured!' },
    ],
  },
  {
    id: 'm52', name: 'Coastal Battery Assault', act: 25, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'aria', allyCo: 'sora', recommendedRank: 5, recommendedUpgrades: 15,
    map: sym(['mmmf..A..f', 'mc=....m..', 'f..A.f...m', '..f..f...f', '.A.......t', 'f....f...m', 'm..f.....f', '....A....m', 'mmm.f....f']),
    units: mir(20, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['mech', 3, 6]], [['heavy', 16, 6], ['bomber', 15, 3], ['heavy', 18, 5]]),
    funds: [17000, 20000], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Fog of war! Cyber Officer Aria jams long-range sensors.',
    briefing: [
      { who: 'narrator', text: 'The coastal batteries have gone rogue. Admiral Mira requests immediate assistance.' },
      { who: 'sora', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'aria', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'aria', text: 'Batteries offline...' },
      { who: 'sora', text: 'Sector 52 secured.' },
    ],
  },
  {
    id: 'm53', name: 'Core Awaking', act: 25, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'kaelen', recommendedRank: 5, recommendedUpgrades: 15,
    map: sym(['mmf...f...f', 'mH=c...m..m', 'fB==..f...f', '..f=..c...c', '.A.====...=', 'f..c.f....f', 'mm.f..m...m', '...=c.....c', 'mm..f....f.']),
    units: mir(22, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['fighter', 3, 6]], [['heavy', 18, 6], ['bomber', 17, 3], ['heavy', 20, 5]]),
    funds: [17500, 20500], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Rain slows air and ground movement. Strike before the core wakes.',
    briefing: [
      { who: 'narrator', text: 'An abandoned Architect core is pulsing with energy. Neutralize it before it fully awakens.' },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'kaelen', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'kaelen', text: 'Core silenced...' },
      { who: 'rhea', text: 'Good work.' },
    ],
  },
  {
    id: 'm54', name: 'Supply Pass Defense', act: 26, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'grimm', allyCo: 'brann', recommendedRank: 5, recommendedUpgrades: 16,
    map: sym(['wwsmmf...f', 'wP=H=c..m.', 'wws.B=...f', 'wwsfA.=t.m', 'rws.c....f', 'wws.====.m', 'wwsf..c..f', 'wPs.B=...m', 'wwsmf....f']),
    units: mir(20, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['mech', 3, 6]], [['heavy', 16, 6], ['bomber', 15, 3], ['battleship', 18, 5]]),
    funds: [18000, 21000], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Colonel Brann provides long-range artillery support across the mountain pass.',
    briefing: [
      { who: 'narrator', text: 'The Dominion is trying to cut off our supply lines. Hold the mountain pass at all costs.' },
      { who: 'brann', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'grimm', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'grimm', text: 'Supply line unbroken...' },
      { who: 'brann', text: 'Pass secured.' },
    ],
  },
  {
    id: 'm55', name: 'Tread Valley Fortress', act: 26, par: 15, cos: ['dax', 'brann', 'rhea', 'volkov'], enemyCo: 'frost', forcedCo: 'dax', recommendedRank: 5, recommendedUpgrades: 16,
    map: sym(['mmf...f...f', 'mH=c...m..m', 'fB==..f...f', '..f=..c...c', '.A.====...=', 'f..c.f....f', 'mm.f..m...m', '...=c.....c', 'mm..f....f.']),
    units: mir(22, [['heavy', 4, 2], ['tank', 5, 3], ['mech', 3, 4], ['artillery', 2, 5], ['rockets', 1, 5], ['recon', 2, 7], ['aa', 4, 8]], [['heavy', 18, 3], ['tank', 17, 2], ['rockets', 19, 6], ['mech', 18, 4]]),
    funds: [18500, 21500], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Ground-only operation! Only land armor, mechs, and artillery are allowed.',
    briefing: [
      { who: 'narrator', text: 'Tread Valley Fortress. Pure ground armor operation in heavy sandstorms.' },
      { who: 'dax', text: 'Ground forces only! Advance heavy tanks under sandstorm cover.' },
      { who: 'frost', text: 'Your treads will grind to a halt in my sand!' },
    ],
    outro: [
      { who: 'frost', text: 'Armor destroyed...' },
      { who: 'dax', text: 'Valley fortress captured!' },
    ],
  },
  {
    id: 'm56', name: 'Rebellion Suppression', act: 26, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'nyx', allyCo: 'dax', recommendedRank: 5, recommendedUpgrades: 16,
    map: sym(['mmmf..A..f', 'mc=....m..', 'f..A.f...m', '..f..f...f', '.A.......t', 'f....f...m', 'm..f.....f', '....A....m', 'mmm.f....f']),
    units: mir(20, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['mech', 3, 6]], [['heavy', 16, 6], ['bomber', 15, 3], ['heavy', 18, 5]]),
    funds: [19000, 22000], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: "Fog of war! Nyx's rebels strike from forested ambushes.",
    briefing: [
      { who: 'narrator', text: 'The Crimson rebellion is gaining momentum. Crush this uprising before it spreads.' },
      { who: 'dax', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'nyx', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'nyx', text: 'Rebellion silenced...' },
      { who: 'dax', text: 'Sector 56 clear.' },
    ],
  },
  {
    id: 'm57', name: 'Deep Water Trench Clash', act: 27, par: 15, cos: ['mira', 'rhea', 'volkov', 'zero'], enemyCo: 'volkov', forcedCo: 'mira', recommendedRank: 5, recommendedUpgrades: 16,
    map: sym(['wwsmmf...f', 'wP=H=c..m.', 'wws.B=...f', 'wwsfA.=t.m', 'rws.c....f', 'wws.====.m', 'wwsf..c..f', 'wPs.B=...m', 'wwsmf....f']),
    units: mir(20, [['battleship', 0, 3], ['cruiser', 1, 2], ['sub', 1, 4], ['battleship', 1, 6], ['cruiser', 1, 7]], [['sub', 18, 3], ['battleship', 18, 5], ['cruiser', 19, 6]]),
    funds: [19500, 22500], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Naval-only operation! Deep sea trench battleships and submarine hunt.',
    briefing: [
      { who: 'narrator', text: 'A hidden submarine base has been located in the deep trench. Launch a pre-emptive naval strike.' },
      { who: 'mira', text: 'Naval forces only! Use cruisers to screen our battleships from submarine torpedoes.' },
      { who: 'volkov', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'volkov', text: 'Base destroyed...' },
      { who: 'mira', text: 'Trench secured!' },
    ],
  },
  {
    id: 'm58', name: 'Desert Citadel Siege II', act: 27, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'zero', allyCo: 'mira', recommendedRank: 5, recommendedUpgrades: 16,
    map: sym(['mmmf..A..f', 'mc=....m..', 'f..A.f...m', '..f..f...f', '.A.......t', 'f....f...m', 'm..f.....f', '....A....m', 'mmm.f....f']),
    units: mir(20, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['mech', 3, 6]], [['heavy', 16, 6], ['bomber', 15, 3], ['heavy', 18, 5]]),
    funds: [20000, 23000], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Admiral Mira provides naval gunfire support along the citadel canal.',
    briefing: [
      { who: 'narrator', text: 'The desert heat is intense, but we must press on and capture the central HQ.' },
      { who: 'mira', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'zero', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'zero', text: 'Citadel breached...' },
      { who: 'mira', text: 'Sector 58 secured.' },
    ],
  },
  {
    id: 'm59', name: 'Fort Raid 6', act: 27, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'seraphina', recommendedRank: 5, recommendedUpgrades: 16,
    map: sym(['mmmmmmmmmm', 'mmBmmHmm.m', 'mc....cm.f', 'm.t..t.m..', 'm..mm..m.f', 'm.t..t.m..', 'mc....cm.f', 'mmAmmBmm.m', 'mmmmmmmmmm']),
    units: mir(20, [['heavy', 5, 4], ['artillery', 3, 2], ['artillery', 3, 6], ['mech', 4, 3], ['mech', 4, 5], ['rockets', 2, 4]], [['rockets', 16, 2], ['rockets', 16, 6], ['artillery', 15, 3], ['artillery', 15, 5], ['heavy', 14, 4], ['mech', 13, 4]]),
    funds: [18000, 18000], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    boss: { x: 16, y: 4, team: 1, type: 'heavy', name: 'FORT COMMANDER', hp: 50, phases: 3 },
    aiLevel: 3,
    hint: 'A heavily fortified base. Bring heavy weapons and prepare for a siege.',
    briefing: [
      { who: 'narrator', text: 'Approaching an enemy stronghold.' },
      { who: 'rhea', text: 'This fort is heavily defended. We need to crack their defenses and take down the Fort Commander.' },
      { who: 'brann', text: 'Artillery and heavy armor are your best friends here. Do not rush blindly.' },
    ],
    outro: [
      { who: 'rhea', text: 'The fort is ours. The enemy lines are broken.' },
      { who: 'narrator', text: 'Another bastion falls. The march continues.' },
    ],
  },
  {
    id: 'm60', name: 'Aerial Apex', act: 28, par: 15, cos: ['sora', 'kaelen', 'rhea', 'aria'], enemyCo: 'architect', forcedCo: 'sora', recommendedRank: 5, recommendedUpgrades: 17,
    map: sym(['wwsmmf...f', 'wP=H=c..m.', 'wws.B=...f', 'wwsfA.=t.m', 'rws.c....f', 'wws.====.m', 'wwsf..c..f', 'wPs.B=...m', 'wwsmf....f']),
    units: mir(20, [['fighter', 2, 1], ['bomber', 3, 2], ['bcopter', 4, 3], ['gundrone', 2, 4], ['drone', 1, 5], ['fighter', 2, 7]], [['bomber', 17, 5], ['drone', 18, 2], ['fighter', 16, 3]]),
    funds: [20500, 23500], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    boss: { x: 16, y: 4, team: 1, type: 'bomber', name: 'TITAN SKY CORE', hp: 100, phases: 4 },
    aiLevel: 3,
    hint: 'Air-only boss battle! Destroy all 4 shield phases of the Titan Sky Core.',
    briefing: [
      { who: 'narrator', text: 'Aerial Apex. Air-only boss operation against the Titan Sky Core.' },
      { who: 'sora', text: 'Air forces only! Focus heavy bomber payload on the Sky Core!' },
      { who: 'architect', text: 'TITAN SKY CORE DEPLOYED.' },
    ],
    outro: [
      { who: 'architect', text: 'SKY CORE DESTROYED...' },
      { who: 'sora', text: 'Sector 60 secured.' },
    ],
  },
  {
    id: 'm61', name: 'Sovereign Cleansing', act: 28, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'aria', recommendedRank: 5, recommendedUpgrades: 17,
    map: sym(['mmf...f...f', 'mH=c...m..m', 'fB==..f...f', '..f=..c...c', '.A.====...=', 'f..c.f....f', 'mm.f..m...m', '...=c.....c', 'mm..f....f.']),
    units: mir(22, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['mech', 3, 6]], [['heavy', 18, 6], ['bomber', 17, 3], ['heavy', 20, 5]]),
    funds: [21000, 24000], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Cleanse the area of remaining cyber relays in heavy rain.',
    briefing: [
      { who: 'narrator', text: "The Sovereign Core's lingering energy is mutating local wildlife. Cleanse the area." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'aria', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'aria', text: 'Cleansing complete...' },
      { who: 'rhea', text: 'Sector 61 secured.' },
    ],
  },
  {
    id: 'm62', name: 'Joint Task Force', act: 28, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'kaelen', allyCo: 'sora', recommendedRank: 5, recommendedUpgrades: 17,
    map: sym(['mmmf..A..f', 'mc=....m..', 'f..A.f...m', '..f..f...f', '.A.......t', 'f....f...m', 'm..f.....f', '....A....m', 'mmm.f....f']),
    units: mir(20, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['mech', 3, 6]], [['heavy', 16, 6], ['bomber', 15, 3], ['heavy', 18, 5]]),
    funds: [21500, 24500], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: "Sora's air wing coordinates with your land assault.",
    briefing: [
      { who: 'narrator', text: 'A joint task force is moving in. Coordinate with your allies for a swift victory.' },
      { who: 'sora', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'kaelen', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'kaelen', text: 'Joint force victorious...' },
      { who: 'sora', text: 'Sector 62 secured.' },
    ],
  },
  {
    id: 'm63', name: 'Ground Vanguard Clash', act: 29, par: 15, cos: ['dax', 'brann', 'rhea', 'grimm'], enemyCo: 'grimm', forcedCo: 'dax', recommendedRank: 5, recommendedUpgrades: 17,
    map: sym(['wwsmmf...f', 'wP=H=c..m.', 'wws.B=...f', 'wwsfA.=t.m', 'rws.c....f', 'wws.====.m', 'wwsf..c..f', 'wPs.B=...m', 'wwsmf....f']),
    units: mir(20, [['heavy', 4, 2], ['tank', 5, 3], ['mech', 3, 4], ['artillery', 2, 5], ['rockets', 2, 6], ['recon', 2, 7], ['aa', 4, 8]], [['heavy', 16, 3], ['tank', 15, 2], ['rockets', 17, 6], ['mech', 16, 4]]),
    funds: [22000, 25000], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Ground-only operation! Only land armor and infantry forces allowed.',
    briefing: [
      { who: 'narrator', text: 'Ground Vanguard Clash. Land forces battle across desert dunes.' },
      { who: 'dax', text: 'Ground units only! Heavy armor column, move out!' },
      { who: 'grimm', text: 'You cannot crush us all!' },
    ],
    outro: [
      { who: 'grimm', text: 'Defeated...' },
      { who: 'dax', text: 'Ground vanguard victorious!' },
    ],
  },
  {
    id: 'm64', name: 'Mountain Pass Counter', act: 29, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'frost', allyCo: 'brann', recommendedRank: 5, recommendedUpgrades: 17,
    map: sym(['mmmf..A..f', 'mc=....m..', 'f..A.f...m', '..f..f...f', '.A.......t', 'f....f...m', 'm..f.....f', '....A....m', 'mmm.f....f']),
    units: mir(20, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['mech', 3, 6]], [['heavy', 16, 6], ['bomber', 15, 3], ['heavy', 18, 5]]),
    funds: [22500, 25500], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Colonel Brann provides long-range artillery support in fog.',
    briefing: [
      { who: 'narrator', text: 'A desperate counter-attack by the Dominion. Hold your ground and repel the assault.' },
      { who: 'brann', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'frost', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'frost', text: 'Counter-attack failed...' },
      { who: 'brann', text: 'Sector 64 secured.' },
    ],
  },
  {
    id: 'm65', name: 'Forest Ambush', act: 29, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'nyx', recommendedRank: 5, recommendedUpgrades: 17,
    map: sym(['mmf...f...f', 'mH=c...m..m', 'fB==..f...f', '..f=..c...c', '.A.====...=', 'f..c.f....f', 'mm.f..m...m', '...=c.....c', 'mm..f....f.']),
    units: mir(22, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['mech', 3, 6]], [['heavy', 18, 6], ['bomber', 17, 3], ['heavy', 20, 5]]),
    funds: [23000, 26000], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Forest ambush in heavy rain. Use thermal optics and recon.',
    briefing: [
      { who: 'narrator', text: 'The air is thick with tension. Expect a massive ambush from the surrounding forests.' },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'nyx', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'nyx', text: 'Ambush broken...' },
      { who: 'rhea', text: 'Sector 65 secured.' },
    ],
  },
  {
    id: 'm66', name: 'Abyssal Trench II', act: 30, par: 15, cos: ['mira', 'rhea', 'volkov', 'zero'], enemyCo: 'volkov', allyCo: 'dax', recommendedRank: 5, recommendedUpgrades: 18,
    map: sym(['wwsmmf...f', 'wP=H=c..m.', 'wws.B=...f', 'wwsfA.=t.m', 'rws.c....f', 'wws.====.m', 'wwsf..c..f', 'wPs.B=...m', 'wwsmf....f']),
    units: mir(20, [['battleship', 0, 3], ['cruiser', 1, 2], ['sub', 1, 4], ['battleship', 1, 6], ['cruiser', 1, 7]], [['sub', 18, 3], ['battleship', 18, 5], ['cruiser', 19, 6]]),
    funds: [23500, 26500], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Naval-only operation! Deep sea fleet battle in freezing waters.',
    briefing: [
      { who: 'narrator', text: "We must secure the orbital uplink before the Dominion can download the Architect's data." },
      { who: 'dax', text: 'Naval forces only! Command the fleet!' },
      { who: 'volkov', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'volkov', text: 'Fleet destroyed...' },
      { who: 'dax', text: 'Sector 66 secured.' },
    ],
  },
  {
    id: 'm67', name: 'Treacherous River', act: 30, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'zero', recommendedRank: 5, recommendedUpgrades: 18,
    map: sym(['mmf...f...f', 'mH=c...m..m', 'fB==..f...f', '..f=..c...c', '.A.====...=', 'f..c.f....f', 'mm.f..m...m', '...=c.....c', 'mm..f....f.']),
    units: mir(22, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['mech', 3, 6]], [['heavy', 18, 6], ['bomber', 17, 3], ['heavy', 20, 5]]),
    funds: [24000, 27000], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Sandstorm cuts indirect range along the river.',
    briefing: [
      { who: 'narrator', text: 'A treacherous river crossing. Watch out for hidden submarines and long-range artillery.' },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'zero', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'zero', text: 'River line breached...' },
      { who: 'rhea', text: 'Sector 67 secured.' },
    ],
  },
  {
    id: 'm68', name: 'Construct Retrieval', act: 30, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'seraphina', allyCo: 'mira', recommendedRank: 5, recommendedUpgrades: 18,
    map: sym(['mmmf..A..f', 'mc=....m..', 'f..A.f...m', '..f..f...f', '.A.......t', 'f....f...m', 'm..f.....f', '....A....m', 'mmm.f....f']),
    units: mir(20, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['mech', 3, 6]], [['heavy', 16, 6], ['bomber', 15, 3], ['heavy', 18, 5]]),
    funds: [24500, 27500], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: "Fog of war! Retrieve construct fragments under Seraphina's nanite interference.",
    briefing: [
      { who: 'narrator', text: "The Omega construct's fragments are scattered here. Retrieve them for analysis." },
      { who: 'mira', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'seraphina', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'seraphina', text: 'Fragments secured...' },
      { who: 'mira', text: 'Sector 68 clear.' },
    ],
  },
  {
    id: 'm69', name: 'Fort Raid 7', act: 31, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'architect', recommendedRank: 5, recommendedUpgrades: 18,
    map: sym(['mmmmmmmmmm', 'mmBmmHmm.m', 'mc....cm.f', 'm.t..t.m..', 'm..mm..m.f', 'm.t..t.m..', 'mc....cm.f', 'mmAmmBmm.m', 'mmmmmmmmmm']),
    units: mir(20, [['heavy', 5, 4], ['artillery', 3, 2], ['artillery', 3, 6], ['mech', 4, 3], ['mech', 4, 5], ['rockets', 2, 4]], [['rockets', 16, 2], ['rockets', 16, 6], ['artillery', 15, 3], ['artillery', 15, 5], ['heavy', 14, 4], ['mech', 13, 4]]),
    funds: [20000, 20000], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    boss: { x: 16, y: 4, team: 1, type: 'heavy', name: 'FORT COMMANDER', hp: 50, phases: 3 },
    aiLevel: 3,
    hint: 'A heavily fortified base. Bring heavy weapons and prepare for a siege.',
    briefing: [
      { who: 'narrator', text: 'Approaching an enemy stronghold.' },
      { who: 'rhea', text: 'This fort is heavily defended. We need to crack their defenses and take down the Fort Commander.' },
      { who: 'brann', text: 'Artillery and heavy armor are your best friends here. Do not rush blindly.' },
    ],
    outro: [
      { who: 'rhea', text: 'The fort is ours. The enemy lines are broken.' },
      { who: 'narrator', text: 'Another bastion falls. The march continues.' },
    ],
  },
  {
    id: 'm70', name: 'Silent Border', act: 31, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'aria', allyCo: 'rhea', recommendedRank: 5, recommendedUpgrades: 18,
    map: sym(['mmmf..A..f', 'mc=....m..', 'f..A.f...m', '..f..f...f', '.A.......t', 'f....f...m', 'm..f.....f', '....A....m', 'mmm.f....f']),
    units: mir(20, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['mech', 3, 6]], [['heavy', 16, 6], ['bomber', 15, 3], ['heavy', 18, 5]]),
    funds: [25000, 28000], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Snow reduces movement. Secure border radio towers.',
    briefing: [
      { who: 'narrator', text: 'A quiet border town. Too quiet. Expect heavy stealth resistance from Nyx.' },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'aria', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'aria', text: 'Border cleared...' },
      { who: 'rhea', text: 'Sector 70 secured.' },
    ],
  },
  {
    id: 'm71', name: 'Titan Armor Showdown', act: 31, par: 15, cos: ['dax', 'brann', 'rhea', 'volkov'], enemyCo: 'kaelen', forcedCo: 'dax', recommendedRank: 5, recommendedUpgrades: 19,
    map: sym(['mmf...f...f', 'mH=c...m..m', 'fB==..f...f', '..f=..c...c', '.A.====...=', 'f..c.f....f', 'mm.f..m...m', '...=c.....c', 'mm..f....f.']),
    units: mir(22, [['heavy', 4, 2], ['tank', 5, 3], ['mech', 3, 4], ['artillery', 2, 5], ['rockets', 1, 5], ['recon', 2, 7], ['aa', 4, 8]], [['heavy', 18, 3], ['tank', 17, 2], ['rockets', 19, 6], ['mech', 18, 4]]),
    funds: [25500, 28500], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Ground-only operation! Deploy heavy land armor and artillery columns.',
    briefing: [
      { who: 'narrator', text: 'Titan Armor Showdown. Ground forces engage in final heavy armor combat.' },
      { who: 'dax', text: 'Land armor only! Crush their front line!' },
      { who: 'kaelen', text: 'Hold the ground!' },
    ],
    outro: [
      { who: 'kaelen', text: 'Armor column broken...' },
      { who: 'dax', text: 'Total ground victory!' },
    ],
  },
  {
    id: 'm72', name: 'Skyline Showdown', act: 32, par: 15, cos: ['sora', 'kaelen', 'rhea', 'aria'], enemyCo: 'grimm', allyCo: 'sora', recommendedRank: 5, recommendedUpgrades: 19,
    map: sym(['wwsmmf...f', 'wP=H=c..m.', 'wws.B=...f', 'wwsfA.=t.m', 'rws.c....f', 'wws.====.m', 'wwsf..c..f', 'wPs.B=...m', 'wwsmf....f']),
    units: mir(20, [['fighter', 2, 1], ['bomber', 3, 2], ['bcopter', 4, 3], ['gundrone', 2, 4], ['drone', 1, 5], ['fighter', 2, 7]], [['bomber', 17, 5], ['drone', 18, 2], ['fighter', 16, 3]]),
    funds: [26000, 29000], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'Air-only battle in fog of war! Drones provide essential line-of-sight.',
    briefing: [
      { who: 'narrator', text: 'The dawn of a new era. Air-only sky battle above the clouds.' },
      { who: 'sora', text: 'Air forces only! Drones clear the fog!' },
      { who: 'grimm', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'grimm', text: 'Skies lost...' },
      { who: 'sora', text: 'Sector 72 clear!' },
    ],
  },
  {
    id: 'm73', name: 'Final Stand', act: 32, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'frost', recommendedRank: 5, recommendedUpgrades: 20,
    map: sym(['mmf...f...f', 'mH=c...m..m', 'fB==..f...f', '..f=..c...c', '.A.====...=', 'f..c.f....f', 'mm.f..m...m', '...=c.....c', 'mm..f....f.']),
    units: mir(22, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['mech', 3, 6]], [['heavy', 18, 6], ['bomber', 17, 3], ['heavy', 20, 5]]),
    funds: [26500, 29500], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: "Baron Frost's final stand in torrential rain.",
    briefing: [
      { who: 'narrator', text: 'A legendary commander has arrived for a final stand. We must show them our strength.' },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'frost', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'frost', text: 'Final stand defeated...' },
      { who: 'rhea', text: 'Sector 73 secured.' },
    ],
  },
  {
    id: 'm74', name: 'Eternal Apex Titan', act: 32, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'nyx', allyCo: 'brann', recommendedRank: 5, recommendedUpgrades: 20,
    map: sym(['mmmf..A..f', 'mc=....m..', 'f..A.f...m', '..f..f...f', '.A.......t', 'f....f...m', 'm..f.....f', '....A....m', 'mmm.f....f']),
    units: mir(20, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5], ['tank', 5, 4], ['mech', 3, 6]], [['heavy', 16, 6], ['bomber', 15, 3], ['heavy', 18, 5]]),
    funds: [27000, 30000], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    boss: { x: 16, y: 4, team: 1, type: 'heavy', name: 'TITAN CORE', hp: 100, phases: 8 },
    aiLevel: 3,
    hint: 'Ultimate final campaign battle! Destroy all 8 shield phases of the TITAN CORE for eternal victory.',
    briefing: [
      { who: 'narrator', text: 'The final battle of the campaign. For peace, for the future. We will not fail.' },
      { who: 'brann', text: 'All heavy batteries fire at will! Break the Titan Core!' },
      { who: 'nyx', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'nyx', text: 'Titan Core destroyed... global peace achieved!' },
      { who: 'brann', text: 'We won, Commander. The war is finally over!' },
      { who: 'narrator', text: 'CONGRATULATIONS! You have completed the entire 75-mission campaign!' },
    ],
  }];

/** First-clear skill rewards — the story hands you new tactical skills as you progress. */
export const REWARDS: Record<string, string> = {
  m0: 'rally', m1: 'rain', m2: 'fortify', m3: 'snow', m4: 'repair', m5: 'barrage',
  m6: 'emp', m7: 'warbonds', m8: 'tempest', m9: 'strike', m10: 'bombard', m11: 'meteor',
  m12: 'clear', m13: 'blitz', m14: 'whiteout', m15: 'fury',
  m16: 'warbonds', m17: 'strike', m18: 'repair', m19: 'meteor',
  m20: 'airstrike', m21: 'stealth', m22: 'overdrive', m23: 'nanite', m24: 'orbital',
  m25: 'airstrike', m26: 'emp', m27: 'orbital', m28: 'nanite', m29: 'meteor',
  m30: 'whiteout', m31: 'tempest', m32: 'orbital', m33: 'overdrive', m34: 'meteor',
  m35: 'aegis', m36: 'strike', m37: 'orbital',
  m38: 'fury', m39: 'airstrike', m40: 'stealth', m41: 'overdrive', m42: 'nanite', m43: 'orbital', m44: 'aegis', m45: 'supply', m46: 'rally', m47: 'rain', m48: 'fortify', m49: 'snow', m50: 'repair', m51: 'barrage', m52: 'emp', m53: 'warbonds', m54: 'tempest', m55: 'strike', m56: 'bombard', m57: 'meteor', m58: 'clear', m59: 'blitz', m60: 'whiteout', m61: 'fury', m62: 'airstrike', m63: 'stealth', m64: 'overdrive', m65: 'nanite', m66: 'orbital', m67: 'aegis', m68: 'supply', m69: 'rally', m70: 'rain', m71: 'fortify', m72: 'snow', m73: 'repair', m74: 'barrage'
};
export const MERIT_BONUS = 250; // extra merits on first clear

/** Computes campaign battle parameters for normal campaign vs unlocked Advanced Mode */
export function getCampaignOpts(m: MissionDef, isAdvanced: boolean, isFogReplay = false) {
  if (m.tutorial) return { fog: false, aiLevel: m.aiLevel };
  if (isAdvanced) {
    return {
      fog: true,
      aiLevel: Math.min(3, m.aiLevel + 1),
      dynamic: m.weatherPool ? true : undefined,
    };
  }
  return {
    fog: isFogReplay,
    aiLevel: m.aiLevel,
  };
}

export const ACT_INTROS = [
  'Basic training under Captain Rhea Vance. Learn to move, fight and capture.',
  'The Crimson Dominion invades. Hold the border, cross the Varn River and survive the Frozen Pass.',
  'The war takes to the skies and seas. Strange orders surface, signed by someone called "The Architect".',
  'The truth comes out: a war-machine AI has been running both sides. Republic and Dominion must end it together.',
  'The Architect is destroyed, but its dormant machines awaken. Follow the dead signal into the Glass Desert.',
  'A final broadcast rises from orbit. Break the last defense platforms and end the war-machine network.',
  'Peace fractures as rogue armies rebuild the old machine network. Hunt the Pretender beneath the capital.',
  'The last signal races east. Cross the frozen horizon and stop Zero Dawn before it erases every nation.',
  'Assault the ancient Desert Citadel where Volkov\'s rogue elite guard has taken refuge.',
  'Fight through the Citadel of Shadows under fog of war to reach the Apex Gate.',
  'The ultimate battle: face the Apex Core across land, sea, and air to secure total peace.',
  'Titan\'s Citadel: breach the mountain fortress guarded by Flight Captain Kaelen and Cyber Officer Aria Chen.',
  'Omega Horizon: overcome Siege Director Zero\'s batteries and Medic General Seraphina\'s nanite grid.',
  'Final Victory: face the Titan Core in the ultimate test of all military branches.',
  'Sky & Sea Operations: specialized air-only dogfights and deep-water naval fleet clashes.',
  'Allied Vanguard: Major Dax joins your battalion on the battlefield against General Volkov and Baron Frost.',
  'Dual Front: Lieutenant Sora flies air support alongside your ground forces against the Architect and Siege Director Zero.',
  'Sovereign Alliance: Admiral Mira commands the naval armada alongside your combined forces in the ultimate confrontation.',
  'Desperate Measures: Survive a massive ambush until reinforcements arrive to turn the tide.',
  'United Front: Colonel Brann brings heavy artillery support as your AI ally in a joint assault.',
  'The Omega Clash: The ultimate showdown. Break the boss shield to trigger massive air reinforcements from Sora.',
  'The Crimson Rebellion: Dominion forces split into loyalists and rogue warlords. Grimm initiates a brutal uprising.',
  'Naval Blockade: Admiral Mira Tull must break General Volkovs blockade across the treacherous reefs.',
  'The Desert Scourge: Shift through blinding sandstorms to secure an ancient subterranean vault.',
  'Aerial Dominance: Sora and Kaelen clash in high-altitude dogfights over the mountain peaks.',
  'The Frozen Tundra: Baron Frost defends his homeland against an unknown mechanical incursion.',
  'Cyber Overload: Cyber Officer Aria Chen unleashes a rogue drone swarm. Disable her network relays.',
  'The Shadow War: Nyx and Siege Director Zero orchestrate a massive ambush under the cover of night and fog.',
  'Nanite Plague: Medic General Seraphinas nanite fields go berserk, continuously repairing enemy armor.',
  'Architects Echo: Remnant AI constructs rise from the deep sea trenches, threatening to rebuild the Core.',
  'Sovereign Core: The true architect core ascends into the stratosphere. Take the fight to the skies.',
  'The Last Alliance: The Azure Republic and Crimson Dominion form a permanent pact to face the final threat.',
  'Eternal Peace: The apocalyptic final battles against the Omega Titan. Bring true peace to the world.',
];

/** Pre-deployed army value used by the hidden title-screen mission audit mode. */
export function deploymentValue(m: MissionDef, team: Team) {
  let value = m.units.filter(([, , , t]) => t === team).reduce((sum, [type]) => sum + UNITS[type].cost, 0);
  if (m.boss?.team === team) {
    const alreadyPlaced = m.units.some(([type, x, y, t]) => t === team && type === m.boss!.type && x === m.boss!.x && y === m.boss!.y);
    value += UNITS[m.boss.type].cost * ((m.boss.phases ?? 1) - (alreadyPlaced ? 1 : 0));
  }
  return value;
}

export interface TutorialTarget {
  x?: number;
  y?: number;
  button?: 'end-turn' | 'undo';
  label: string;
}
/** A short CO dialogue card. {c1} / {c2} are replaced with the counter-damage % from the two tank attacks. */
export interface TutorialNote { title: string; text: string; icon?: string }
export interface TutorialStep {
  title: string;
  text: string;
  event: string;
  kind: 'action' | 'info';
  speaker?: string;
  units?: UnitType[];
  target?: TutorialTarget;
  events?: string[];
  targets?: Partial<Record<string, TutorialTarget>>;
  /** CO dialogue shown when the action at this index (0-based) becomes the next one. */
  notes?: Record<number, TutorialNote>;
  /** CO dialogue shown when the whole lesson is finished. */
  doneNote?: TutorialNote;
}
export const TUTORIAL: TutorialStep[] = [
  { title: 'WELCOME, COMMANDER', text: 'I\'m Captain Rhea. Follow the gold markers.\n\nTOP BAR: CO gauge, Power, Super, day and funds.\nBOTTOM BAR: unit/terrain details, Undo and End Turn. Tap the large info panel for full Intel.', event: 'intro', kind: 'info', speaker: 'rhea' },
  {
    title: '1 · CAPTURE THE CITY',
    text: 'Move the Infantry onto the city and capture it.\nCities pay +1,000G every day — capture early.',
    event: 'capture-city', kind: 'action', speaker: 'rhea',
    events: ['select-infantry', 'reach-city', 'first-capture'],
    targets: {
      'select-infantry': { x: 4, y: 2, label: 'SELECT INFANTRY' },
      'reach-city': { x: 4, y: 1, label: 'MOVE TO CITY' },
      'first-capture': { x: 4, y: 1, label: 'CAPTURE THIS CITY' },
    },
  },
  {
    title: '2 · COVER CUTS COUNTER DAMAGE',
    text: 'Attack the red Tank from open ground.\nThen Undo and attack again from the forest.',
    event: 'tank-cover', kind: 'action', speaker: 'rhea',
    events: ['select-tank', 'attack-bottom', 'undo-attack', 'select-tank', 'attack-forest'],
    targets: {
      'select-tank': { x: 3, y: 3, label: 'SELECT BLUE TANK' },
      'attack-bottom': { x: 6, y: 3, label: 'ATTACK OPEN TANK' },
      'undo-attack': { button: 'undo', label: 'REDO: TAP UNDO' },
      'attack-forest': { x: 6, y: 3, label: 'ATTACK FROM FOREST' },
    },
    notes: {
      // This is shown immediately after the first (open-ground) tank attack,
      // when undo-attack becomes the next required action.
      2: {
        icon: '↶',
        title: 'UNDO TASK',
        text: 'Their tank countered for −{c1}%.\n\nTap the glowing UNDO button.\nIt restores your last move and attack.\n\nThen attack again from the forest to reduce counter damage.\nRemember: Undo works once per turn.',
      },
    },
    doneNote: {
      title: 'COVER WINS',
      text: 'Counter-fire: only −{c2}%\n(it was −{c1}% in the open).\n\nAttack from cover when you can.',
    },
  },
  {
    title: '3 · CAPTURE THE RADIO TOWER',
    text: 'Move the second Infantry to the Radio Tower and capture it.\nTower: +1 move to all units every 3rd turn, and +1 HP nearby each turn.',
    event: 'capture-radio', kind: 'action', speaker: 'rhea',
    events: ['select-radio-infantry', 'move-radio', 'capture-radio'],
    targets: {
      'select-radio-infantry': { x: 3, y: 5, label: 'SELECT INFANTRY' },
      'move-radio': { x: 5, y: 5, label: 'MOVE TO RADIO TOWER' },
      'capture-radio': { x: 5, y: 5, label: 'CAPTURE RADIO TOWER' },
    },
  },
  {
    title: '4 · REPAIR ON A CITY',
    text: 'Your Tank is damaged. Move it to the captured city, choose WAIT, then End Turn.\nThe city repairs +2 HP at the start of your next turn.',
    event: 'repair-tank', kind: 'action', speaker: 'rhea',
    events: ['select-damaged-tank', 'move-tank-city', 'wait-tank-city', 'heal-turn'],
    targets: {
      'select-damaged-tank': { x: 5, y: 3, label: 'SELECT DAMAGED TANK' },
      'move-tank-city': { x: 4, y: 1, label: 'MOVE TO CAPTURED CITY' },
      'wait-tank-city': { x: 4, y: 1, label: 'CHOOSE WAIT' },
      'heal-turn': { button: 'end-turn', label: 'END TURN TO REPAIR' },
    },
  },
  { title: 'YOUR UNITS', text: 'Forces span 3 main categories: Land, Air, and Navy. You will unlock and command new specialized units as you progress through the campaign.', event: 'roster', kind: 'info', speaker: 'rhea', units: ['tank', 'bcopter', 'battleship'] },
  { title: 'SUMMARY', text: 'WIN: eliminate all enemies, or capture their HQ.\nCITY: +1,000G/day and a paid 2 HP repair.\nRADIO TOWER: no gold; +1 HP nearby; +1 move every 3rd turn.\nCOVER: cities/towers ★★★; forest ★★.\nAIR: aircraft can fly to engage/attack enemy targets same turn. Forced refuel applies only when out of gas with no targets.\n\nTOP BAR: CO gauge and resources.\nBOTTOM BAR: details, Undo, End Turn.\nLOOK UP A UNIT: double-tap it, or tap the large bottom panel for Intel. Main menu → Field Manual lists every unit.', event: 'field-guide', kind: 'info', speaker: 'rhea' },
  { title: '5 · FREE PLAY', text: 'Training complete.\nUse what you learned and defeat every enemy unit.', event: 'free-play', kind: 'info', speaker: 'rhea' },
];
