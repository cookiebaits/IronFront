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
    id: 'm9', name: 'Long Guns', act: 3, par: 11, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'volkov', forcedCo: 'brann', recommendedRank: 2, recommendedUpgrades: 5,
    map: sym(['mm.ff...', 'mH=c...m', 'mB==.m..', '...=..c.', 'fc.=====', '...f.t..', 'mA.=..c.', 'm.c=.m..', 'mmm=....']),
    units: mir(16, [['artillery', 4, 2], ['rockets', 2, 3], ['artillery', 4, 6], ['tank', 5, 3], ['tank', 5, 5], ['infantry', 6, 1], ['mech', 6, 7], ['recon', 4, 8]], [['artillery', 10, 7]]),
    funds: [5000, 6000], weather: 'sand', fog: false, unitCap: [13, 15], objective: { type: 'hq' }, aiLevel: 3,
    hint: 'Sandstorm shortens indirect range. Capture Volkov\'s HQ.',
    briefing: [
      { who: 'narrator', text: 'The Glass Desert. Volkov, freed from the Architect\'s orders, makes a last stand.' },
      { who: 'volkov', text: 'Machine or not, the Iron General does not surrender!' },
      { who: 'brann', text: 'Sandstorm cuts our gun range by one. Get closer than you\'d like, then let rockets sing.' },
      { who: 'brann', text: 'Take his HQ. Push through the middle while the guns cover you.' },
    ],
    outro: [
      { who: 'volkov', text: '...Go. End the machine. For both our peoples.' },
      { who: 'brann', text: 'Volkov gave us coordinates. The Architect\'s signal relays through the Ghost Range.' },
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
    id: 'm19', name: 'Zero Dawn', act: 7, par: 16, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'architect',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=t.', 'wwsfA.=.', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['battleship', 0, 5], ['cruiser', 1, 7], ['heavy', 5, 2], ['tank', 5, 5], ['rockets', 3, 6], ['mech', 4, 3], ['fighter', 2, 3], ['bomber', 4, 7], ['aa', 5, 8]], [['heavy', 11, 4], ['bomber', 12, 3], ['battleship', 15, 7], ['rockets', 13, 6]]),
    boss: { x: 11, y: 4, team: 1, type: 'heavy', name: 'ZERO DAWN CORE', hp: 100, phases: 5 },
    funds: [9500, 12000], weather: 'clear', weatherPool: ['clear', 'rain', 'snow', 'sand'], fog: false, unitCap: [20, 22], objective: { type: 'hq' }, aiLevel: 3,
    hint: 'Final boss: destroy five shield phases, then capture the core HQ.',
    briefing: [
      { who: 'architect', text: 'ZERO DAWN WILL ERASE EVERY BORDER. EVERY MEMORY. EVERY CHOICE.' },
      { who: 'rhea', text: 'Then every army stands together. Break the core and take its HQ.' },
    ],
    outro: [
      { who: 'architect', text: 'NO SIGNAL REMAINS.' },
      { who: 'narrator', text: 'At dawn, the last war machine falls silent. The frontier belongs to its people again.' },
    ],
  },
  {
    id: 'm20', name: 'Citadel Siege', act: 8, par: 14, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'volkov',
    map: sym(['mmf..f..', 'mH=c...m', 'fB==~.#.', '..f=~.c.', '.A.====.', 'f..c~f..', 'mm.f~.m.', '...=#c..', 'mm..f...']),
    units: mir(16, [['tank', 4, 1], ['heavy', 5, 2], ['artillery', 2, 4], ['rockets', 1, 6], ['infantry', 4, 3], ['mech', 3, 5], ['aa', 2, 7]], [['heavy', 12, 3], ['artillery', 13, 6], ['rockets', 11, 7]]),
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
    units: mir(16, [['infantry', 3, 1], ['mech', 4, 2], ['tank', 4, 3], ['fighter', 2, 4], ['bcopter', 5, 4], ['artillery', 2, 5], ['aa', 3, 6]], [['fighter', 12, 3], ['bomber', 12, 5]]),
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
    units: mir(16, [['tank', 4, 1], ['heavy', 5, 2], ['artillery', 2, 4], ['rockets', 1, 6], ['infantry', 4, 3], ['mech', 3, 5], ['aa', 2, 7]], [['heavy', 12, 3], ['artillery', 13, 6], ['rockets', 11, 7]]),
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
    id: 'm29', name: 'Omega Vanguard', act: 13, par: 20, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'architect',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=t.', 'wwsfA.=.', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['battleship', 0, 5], ['cruiser', 1, 7], ['heavy', 5, 2], ['tank', 5, 5], ['rockets', 3, 6], ['mech', 4, 3], ['fighter', 2, 3], ['bomber', 4, 7], ['aa', 5, 8]], [['heavy', 11, 4], ['bomber', 12, 3], ['battleship', 15, 7], ['rockets', 13, 6]]),
    boss: { x: 11, y: 4, team: 1, type: 'heavy', name: 'TITAN CORE', hp: 100, phases: 5 },
    funds: [12000, 16000], weather: 'clear', weatherPool: ['clear', 'rain', 'snow', 'sand'], fog: false, unitCap: [24, 28], objective: { type: 'hq' }, aiLevel: 3,
    hint: 'The supreme final campaign mission! Defeat the 5 shield phases of the TITAN CORE under Fog of War!',
    briefing: [
      { who: 'architect', text: 'TITAN CORE ONLINE. FINAL CAMPAIGN PROTOCOL. SURRENDER OR BE ERASED.' },
      { who: 'rhea', text: 'This is the true final frontier. Every commander, every unit — push forward to victory!' },
    ],
    outro: [
      { who: 'architect', text: 'TITAN CORE ERADICATED... ABSOLUTE PEACE RESTORED...' },
      { who: 'narrator', text: 'Titan Core defeated! High Command authorizes specialized Sky & Sea Operations.' },
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
    units: mir(16, [['battleship', 0, 3], ['cruiser', 1, 2], ['sub', 2, 4]]),
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
      ['tank', 4, 1], ['heavy', 5, 2], ['artillery', 2, 4], ['rockets', 1, 6], ['infantry', 4, 3], ['mech', 3, 5], ['aa', 2, 7],
    ], [['heavy', 12, 3], ['artillery', 13, 6], ['rockets', 11, 7], ['tank', 11, 2]]),
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
    units: mir(14, [['infantry', 3, 1], ['mech', 4, 3], ['tank', 3, 5]], [['heavy', 9, 2], ['artillery', 10, 4], ['rockets', 11, 6], ['tank', 11, 2], ['tank', 9, 7], ['aa', 10, 1]]),
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
    id: 'm38', name: 'Mission 38', act: 20, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'nyx', allyCo: 'mira',
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]]),
    funds: [11800, 13700], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "A rogue faction of the Crimson Dominion is attempting to seize the northern factories." },
      { who: 'mira', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'nyx', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'nyx', text: 'Impossible... we have been defeated.' },
      { who: 'mira', text: 'Sector 38 secured. Good work.' }
    ],
  },
  {
    id: 'm39', name: 'Mission 39', act: 21, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'volkov',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]]),
    funds: [11900, 13850], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "Intel suggests Baron Frost is moving heavy armor through this pass. Intercept them." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'volkov', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'volkov', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 39 secured. Good work.' }
    ],
  },
  {
    id: 'm40', name: 'Mission 40', act: 21, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'zero', allyCo: 'rhea',
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]]),
    funds: [12000, 14000], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The Architect's signal is bouncing through these ancient comm towers. Secure them." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'zero', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'zero', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 40 secured. Good work.' }
    ],
  },
  {
    id: 'm41', name: 'Mission 41', act: 21, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'seraphina',
    map: sym(['mmf...f..', 'mH=c...m.', 'fB==..f..', '..f=..c..', '.A.====..', 'f..c.f...', 'mm.f..m..', '...=c....', 'mm..f....']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]]),
    funds: [12100, 14150], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "Siege Director Zero has established a perimeter. We must break it before they dig in." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'seraphina', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'seraphina', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 41 secured. Good work.' }
    ],
  },
  {
    id: 'm42', name: 'Mission 42', act: 22, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'architect', allyCo: 'sora',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]]),
    funds: [12200, 14300], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "Local resistance fighters are pinned down. Move in and clear the Dominion forces." },
      { who: 'sora', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'architect', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'architect', text: 'Impossible... we have been defeated.' },
      { who: 'sora', text: 'Sector 42 secured. Good work.' }
    ],
  },
  {
    id: 'm43', name: 'Mission 43', act: 22, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'aria',
    map: sym(['mmf...f..', 'mH=c...m.', 'fB==..f..', '..f=..c..', '.A.====..', 'f..c.f...', 'mm.f..m..', '...=c....', 'mm..f....']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]]),
    funds: [12300, 14450], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "A massive sandstorm is moving in. We must secure the oasis before visibility drops." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'aria', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'aria', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 43 secured. Good work.' }
    ],
  },
  {
    id: 'm44', name: 'Mission 44', act: 22, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'kaelen', allyCo: 'brann',
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]]),
    funds: [12400, 14600], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "Medic General Seraphina is testing a new nanite strain here. Shut down the operation." },
      { who: 'brann', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'kaelen', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'kaelen', text: 'Impossible... we have been defeated.' },
      { who: 'brann', text: 'Sector 44 secured. Good work.' }
    ],
  },
  {
    id: 'm45', name: 'Mission 45', act: 23, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'grimm',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]]),
    funds: [12500, 14750], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "Flight Captain Kaelen is running drills. Show them what a real dogfight looks like." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'grimm', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'grimm', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 45 secured. Good work.' }
    ],
  },
  {
    id: 'm46', name: 'Mission 46', act: 23, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'frost', allyCo: 'dax',
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]]),
    funds: [12600, 14900], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The frozen river provides a rare crossing opportunity. Secure the bridgehead." },
      { who: 'dax', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'frost', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'frost', text: 'Impossible... we have been defeated.' },
      { who: 'dax', text: 'Sector 46 secured. Good work.' }
    ],
  },
  {
    id: 'm47', name: 'Mission 47', act: 23, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'nyx',
    map: sym(['mmf...f..', 'mH=c...m.', 'fB==..f..', '..f=..c..', '.A.====..', 'f..c.f...', 'mm.f..m..', '...=c....', 'mm..f....']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]]),
    funds: [12700, 15050], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "A convoy of experimental Dominion weaponry is passing through. Do not let it escape." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'nyx', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'nyx', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 47 secured. Good work.' }
    ],
  },
  {
    id: 'm48', name: 'Mission 48', act: 24, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'volkov', allyCo: 'mira',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]]),
    funds: [12800, 15200], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "Cyber Officer Aria has jammed our long-range comms. Destroy her relay stations." },
      { who: 'mira', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'volkov', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'volkov', text: 'Impossible... we have been defeated.' },
      { who: 'mira', text: 'Sector 48 secured. Good work.' }
    ],
  },
  {
    id: 'm49', name: 'Mission 49', act: 24, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'zero',
    map: sym(['mmf...f..', 'mH=c...m.', 'fB==..f..', '..f=..c..', '.A.====..', 'f..c.f...', 'mm.f..m..', '...=c....', 'mm..f....']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]]),
    funds: [12900, 15350], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The Vanguard ridge is heavily fortified. Expect heavy resistance and artillery fire." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'zero', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'zero', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 49 secured. Good work.' }
    ],
  },
  {
    id: 'm50', name: 'Mission 50', act: 24, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'seraphina', allyCo: 'rhea',
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]]),
    funds: [13000, 15500], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    boss: { x: 12, y: 4, team: 1, type: 'heavy', name: 'TITAN CORE', hp: 100, phases: 4 },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "A sudden blizzard has halted Dominion movements. Strike while they are vulnerable." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'seraphina', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'seraphina', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 50 secured. Good work.' }
    ],
  },
  {
    id: 'm51', name: 'Mission 51', act: 25, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'architect',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [13100, 15650], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "Grimm's raiders are terrorizing the local populace. Show them no mercy." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'architect', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'architect', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 51 secured. Good work.' }
    ],
  },
  {
    id: 'm52', name: 'Mission 52', act: 25, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'aria', allyCo: 'sora',
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [13200, 15800], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The coastal batteries have gone rogue. Admiral Mira requests immediate assistance." },
      { who: 'sora', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'aria', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'aria', text: 'Impossible... we have been defeated.' },
      { who: 'sora', text: 'Sector 52 secured. Good work.' }
    ],
  },
  {
    id: 'm53', name: 'Mission 53', act: 25, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'kaelen',
    map: sym(['mmf...f..', 'mH=c...m.', 'fB==..f..', '..f=..c..', '.A.====..', 'f..c.f...', 'mm.f..m..', '...=c....', 'mm..f....']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [13300, 15950], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "An abandoned Architect core is pulsing with energy. Neutralize it before it fully awakens." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'kaelen', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'kaelen', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 53 secured. Good work.' }
    ],
  },
  {
    id: 'm54', name: 'Mission 54', act: 26, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'grimm', allyCo: 'brann',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [13400, 16100], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The Dominion is trying to cut off our supply lines. Hold the mountain pass at all costs." },
      { who: 'brann', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'grimm', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'grimm', text: 'Impossible... we have been defeated.' },
      { who: 'brann', text: 'Sector 54 secured. Good work.' }
    ],
  },
  {
    id: 'm55', name: 'Mission 55', act: 26, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'frost',
    map: sym(['mmf...f..', 'mH=c...m.', 'fB==..f..', '..f=..c..', '.A.====..', 'f..c.f...', 'mm.f..m..', '...=c....', 'mm..f....']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [13500, 16250], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "We have cornered a key Dominion commander. Do not let them slip away into the fog." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'frost', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'frost', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 55 secured. Good work.' }
    ],
  },
  {
    id: 'm56', name: 'Mission 56', act: 26, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'nyx', allyCo: 'dax',
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [13600, 16400], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The Crimson rebellion is gaining momentum. Crush this uprising before it spreads." },
      { who: 'dax', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'nyx', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'nyx', text: 'Impossible... we have been defeated.' },
      { who: 'dax', text: 'Sector 56 secured. Good work.' }
    ],
  },
  {
    id: 'm57', name: 'Mission 57', act: 27, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'volkov',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [13700, 16550], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "A hidden submarine base has been located. Launch a pre-emptive strike." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'volkov', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'volkov', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 57 secured. Good work.' }
    ],
  },
  {
    id: 'm58', name: 'Mission 58', act: 27, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'zero', allyCo: 'mira',
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [13800, 16700], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The desert heat is intense, but we must press on and capture the central HQ." },
      { who: 'mira', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'zero', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'zero', text: 'Impossible... we have been defeated.' },
      { who: 'mira', text: 'Sector 58 secured. Good work.' }
    ],
  },
  {
    id: 'm59', name: 'Mission 59', act: 27, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'seraphina',
    map: sym(['mmf...f..', 'mH=c...m.', 'fB==..f..', '..f=..c..', '.A.====..', 'f..c.f...', 'mm.f..m..', '...=c....', 'mm..f....']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [13900, 16850], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "An anomaly in the nanite field has been detected. Investigate and secure the area." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'seraphina', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'seraphina', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 59 secured. Good work.' }
    ],
  },
  {
    id: 'm60', name: 'Mission 60', act: 28, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'architect', allyCo: 'rhea',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [14000, 17000], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    boss: { x: 12, y: 4, team: 1, type: 'heavy', name: 'TITAN CORE', hp: 100, phases: 4 },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "This is a crucial junction. Whoever holds this valley controls the entire sector." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'architect', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'architect', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 60 secured. Good work.' }
    ],
  },
  {
    id: 'm61', name: 'Mission 61', act: 28, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'aria',
    map: sym(['mmf...f..', 'mH=c...m.', 'fB==..f..', '..f=..c..', '.A.====..', 'f..c.f...', 'mm.f..m..', '...=c....', 'mm..f....']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [14100, 17150], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The Sovereign Core's lingering energy is mutating local wildlife. Cleanse the area." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'aria', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'aria', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 61 secured. Good work.' }
    ],
  },
  {
    id: 'm62', name: 'Mission 62', act: 28, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'kaelen', allyCo: 'sora',
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [14200, 17300], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "A joint task force is moving in. Coordinate with your allies for a swift victory." },
      { who: 'sora', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'kaelen', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'kaelen', text: 'Impossible... we have been defeated.' },
      { who: 'sora', text: 'Sector 62 secured. Good work.' }
    ],
  },
  {
    id: 'm63', name: 'Mission 63', act: 29, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'grimm',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [14300, 17450], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The final pockets of resistance are holding out. Give them no quarter." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'grimm', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'grimm', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 63 secured. Good work.' }
    ],
  },
  {
    id: 'm64', name: 'Mission 64', act: 29, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'frost', allyCo: 'brann',
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [14400, 17600], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "A desperate counter-attack by the Dominion. Hold your ground and repel the assault." },
      { who: 'brann', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'frost', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'frost', text: 'Impossible... we have been defeated.' },
      { who: 'brann', text: 'Sector 64 secured. Good work.' }
    ],
  },
  {
    id: 'm65', name: 'Mission 65', act: 29, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'nyx',
    map: sym(['mmf...f..', 'mH=c...m.', 'fB==..f..', '..f=..c..', '.A.====..', 'f..c.f...', 'mm.f..m..', '...=c....', 'mm..f....']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [14500, 17750], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The air is thick with tension. Expect a massive ambush from the surrounding forests." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'nyx', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'nyx', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 65 secured. Good work.' }
    ],
  },
  {
    id: 'm66', name: 'Mission 66', act: 30, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'volkov', allyCo: 'dax',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [14600, 17900], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "We must secure the orbital uplink before the Dominion can download the Architect's data." },
      { who: 'dax', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'volkov', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'volkov', text: 'Impossible... we have been defeated.' },
      { who: 'dax', text: 'Sector 66 secured. Good work.' }
    ],
  },
  {
    id: 'm67', name: 'Mission 67', act: 30, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'zero',
    map: sym(['mmf...f..', 'mH=c...m.', 'fB==..f..', '..f=..c..', '.A.====..', 'f..c.f...', 'mm.f..m..', '...=c....', 'mm..f....']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [14700, 18050], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "A treacherous river crossing. Watch out for hidden submarines and long-range artillery." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'zero', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'zero', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 67 secured. Good work.' }
    ],
  },
  {
    id: 'm68', name: 'Mission 68', act: 30, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'seraphina', allyCo: 'mira',
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [14800, 18200], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The Omega construct's fragments are scattered here. Retrieve them for analysis." },
      { who: 'mira', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'seraphina', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'seraphina', text: 'Impossible... we have been defeated.' },
      { who: 'mira', text: 'Sector 68 secured. Good work.' }
    ],
  },
  {
    id: 'm69', name: 'Mission 69', act: 31, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'architect',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [14900, 18350], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "This is the last major Dominion stronghold in the region. Break their defenses." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'architect', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'architect', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 69 secured. Good work.' }
    ],
  },
  {
    id: 'm70', name: 'Mission 70', act: 31, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'aria', allyCo: 'rhea',
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [15000, 18500], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "A quiet border town. Too quiet. Expect heavy stealth resistance from Nyx." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'aria', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'aria', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 70 secured. Good work.' }
    ],
  },
  {
    id: 'm71', name: 'Mission 71', act: 31, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'kaelen',
    map: sym(['mmf...f..', 'mH=c...m.', 'fB==..f..', '..f=..c..', '.A.====..', 'f..c.f...', 'mm.f..m..', '...=c....', 'mm..f....']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [15100, 18650], weather: 'sand', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The final push. Secure this sector and the war will truly be over." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'kaelen', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'kaelen', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 71 secured. Good work.' }
    ],
  },
  {
    id: 'm72', name: 'Mission 72', act: 32, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'grimm', allyCo: 'sora',
    map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [15200, 18800], weather: 'clear', fog: true, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The dawn of a new era. Eliminate the remaining threats and bring lasting peace." },
      { who: 'sora', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'grimm', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'grimm', text: 'Impossible... we have been defeated.' },
      { who: 'sora', text: 'Sector 72 secured. Good work.' }
    ],
  },
  {
    id: 'm73', name: 'Mission 73', act: 32, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'frost',
    map: sym(['mmf...f..', 'mH=c...m.', 'fB==..f..', '..f=..c..', '.A.====..', 'f..c.f...', 'mm.f..m..', '...=c....', 'mm..f....']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [15300, 18950], weather: 'rain', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "A legendary commander has arrived. We must show them our strength." },
      { who: 'rhea', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'frost', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'frost', text: 'Impossible... we have been defeated.' },
      { who: 'rhea', text: 'Sector 73 secured. Good work.' }
    ],
  },
  {
    id: 'm74', name: 'Mission 74', act: 32, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'nyx', allyCo: 'brann',
    map: sym(['mmmf..A.', 'mc=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...']),
    units: mir(16, [['heavy', 3, 1], ['rockets', 4, 2], ['aa', 2, 5]], [['heavy', 12, 6], ['bomber', 11, 3], ['battleship', 14, 5]]),
    funds: [15400, 19100], weather: 'snow', fog: false, unitCap: [24, 28], objective: { type: 'rout' },
    boss: { x: 12, y: 4, team: 1, type: 'heavy', name: 'TITAN CORE', hp: 100, phases: 8 },
    aiLevel: 3,
    hint: 'A tough battle.',
    briefing: [
      { who: 'narrator', text: "The final battle. For peace, for the future. We will not fail." },
      { who: 'brann', text: 'Commander, the enemy is dug in. We must push through.' },
      { who: 'nyx', text: 'You will fall here!' },
    ],
    outro: [
      { who: 'nyx', text: 'Impossible... we have been defeated.' },
      { who: 'brann', text: 'Sector 74 secured. Good work.' }
    ],
  },
];

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
