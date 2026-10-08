import type { MissionDef, Team, UnitType } from './types';

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

export const ACTS = ['Boot Camp', 'Act I — Border Fire', 'Act II — Skies of Ash', 'Act III — The Iron Throne', 'Act IV — Ghost Protocol', 'Act V — The Final Signal', 'Act VI — Fractured Peace', 'Act VII — Zero Dawn'];

export const MISSIONS: MissionDef[] = [
  {
    id: 'm0', name: 'Boot Camp', act: 0, tutorial: true, par: 5, unlockCo: 'dax',
    map: [
      'mmf...f.mm',
      'mH==c..=Em',
      'fB.=...=Yf',
      '...=.f.=..',
      '.c.====.c.',
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
    map: sym(['mmf..f.', 'mH=c...', 'fB==..c', '..f=.f.', '.c.====', 'f..f...', 'mm.c.ff', '.f...t.', 'mmm.f..']),
    units: mir(14, [['infantry', 4, 1], ['infantry', 4, 5], ['tank', 4, 2], ['recon', 2, 5], ['artillery', 2, 3], ['mech', 4, 3]], [['infantry', 9, 7]]),
    funds: [2000, 2000], weather: 'clear', fog: false, unitCap: [10, 10], objective: { type: 'rout' }, aiLevel: 1,
    hint: 'Rout Grimm\'s raiders. Use artillery behind your tanks.',
    briefing: [
      { who: 'narrator', text: 'Dawn breaks over Kessel Valley. Crimson Dominion forces strike without warning.' },
      { who: 'grimm', text: 'HAHAHA! The Republic sleeps! My horde will feast on your little cities!' },
      { who: 'dax', text: 'That loudmouth\'s got numbers, but no discipline. Hit him hard and hit him first.' },
      { who: 'rhea', text: 'Keep artillery behind your front line. Tanks screen, guns punish. Rout every unit.' },
    ],
    outro: [
      { who: 'grimm', text: 'Grr... this isn\'t over! The Baron will freeze your bones!' },
      { who: 'rhea', text: 'The Baron? Frost... the Dominion is sending its nobility. This is no raid. It\'s a war.' },
    ],
  },
  {
    id: 'm2', name: 'River Crossing', act: 1, par: 9, cos: ['rhea', 'dax'], enemyCo: 'grimm',
    map: sym(['mmf..f~', 'mH=c.f~', 'fB==.=#', '..f.f.~', '.c..mf~', 'f=====#', 'mf.c..~', '..ft.f~', 'mmm..m~']),
    units: mir(14, [['infantry', 4, 1], ['infantry', 3, 3], ['mech', 2, 4], ['tank', 4, 2], ['artillery', 3, 5], ['recon', 2, 6]], [['artillery', 10, 3], ['tank', 9, 7]]),
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
    id: 'm3', name: 'Iron Valley', act: 1, par: 9, cos: ['rhea', 'dax'], enemyCo: 'frost',
    map: sym(['mmmff..', 'mH=..f.', 'mB=c...', 'm.=..m.', '..===.=', 'fc.m...', 'm..f.c.', 'mm.t.f.', 'mmm.mm.']),
    units: mir(14, [['tank', 3, 1], ['tank', 4, 4], ['apc', 2, 5], ['infantry', 4, 2], ['infantry', 5, 6], ['artillery', 1, 3], ['mech', 4, 6]], [['heavy', 8, 5]]),
    funds: [3000, 3000], weather: 'snow', fog: false, unitCap: [11, 12], objective: { type: 'rout' }, aiLevel: 1,
    hint: 'Snow slows your army, but not Frost\'s. Hold defensive terrain.',
    briefing: [
      { who: 'narrator', text: 'The Iron Valley. Snowdrifts bury the old tank graveyard of the last war.' },
      { who: 'frost', text: 'How quaint. Republic soldiers, shivering in my snow. You will make fine ice sculptures.' },
      { who: 'dax', text: 'His troops ignore the cold. Ours don\'t. Snow costs us extra movement and defense.' },
      { who: 'rhea', text: 'He has a Heavy Tank. Mechs and focused fire, Commander. Don\'t trade blow for blow.' },
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
      ['tank', 4, 2, 0], ['tank', 4, 5, 0], ['artillery', 2, 3, 0], ['artillery', 2, 6, 0], ['infantry', 3, 1, 0], ['mech', 5, 4, 0], ['aa', 4, 7, 0], ['infantry', 2, 8, 0],
      ['tank', 11, 1, 1], ['tank', 12, 4, 1], ['heavy', 12, 6, 1], ['infantry', 10, 2, 1], ['infantry', 12, 7, 1], ['artillery', 9, 5, 1], ['recon', 11, 8, 1], ['artillery', 12, 3, 1], ['mech', 9, 7, 1],
    ],
    funds: [2000, 4000], weather: 'snow', weatherPool: ['snow', 'snow', 'clear'], fog: false, unitCap: [11, 14],
    objective: { type: 'survive', days: 7 }, aiLevel: 2,
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
    id: 'm5', name: 'Wings over Ash', act: 2, par: 9, cos: ['rhea', 'dax', 'sora'], enemyCo: 'nyx',
    map: sym(['mmf.ff.', 'mH=c..f', 'mB==...', 'fA.=f.c', '.c.=..=', 'f..====', 'm.f.f..', '.c..t.f', 'mmff..m']),
    units: mir(14, [['drone', 4, 2], ['gundrone', 3, 6], ['bcopter', 2, 3], ['infantry', 4, 1], ['infantry', 5, 6], ['tank', 4, 4], ['aa', 2, 5], ['recon', 5, 2]], [['bcopter', 8, 7]]),
    funds: [4000, 4000], weather: 'clear', fog: true, unitCap: [11, 12], objective: { type: 'rout' }, aiLevel: 2,
    hint: 'Fog of war! Use drones & recon to scout. Enemies hide in forests.',
    briefing: [
      { who: 'narrator', text: 'The Ashlands. Volcanic smoke blankets the sky. Visibility: near zero.' },
      { who: 'sora', text: 'Fog of war, Commander. You only see what your units can see. Forests hide everything.' },
      { who: 'nyx', text: 'Little birds, flying blind into my darkness. How... delicious.' },
      { who: 'sora', text: 'Commander Nyx. She ambushes from the shadows. Scout with drones before you commit!' },
    ],
    outro: [
      { who: 'nyx', text: 'You see more than most. The Architect will want to... study you.' },
      { who: 'sora', text: 'The Architect? Is that "the Commander" Frost mentioned?' },
    ],
  },
  {
    id: 'm6', name: 'Nightfall', act: 2, par: 10, cos: ['rhea', 'dax', 'sora'], enemyCo: 'nyx', unlockCo: 'mira',
    map: sym(['mm.ff..', 'mH=..ff', 'fB=c...', '..=..m.', 'mc=t.f=', '..====.', 'fA.f..c', 'f.c..f.', 'mmm.ff.']),
    units: mir(14, [['infantry', 3, 1], ['infantry', 4, 7], ['mech', 4, 2], ['tank', 4, 3], ['tank', 4, 5], ['artillery', 1, 3], ['bcopter', 2, 6], ['recon', 6, 5]], [['tank', 9, 3], ['drone', 8, 6]]),
    funds: [4000, 5000], weather: 'rain', fog: true, unitCap: [12, 13], objective: { type: 'hq' }, aiLevel: 2,
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
    id: 'm7', name: 'Coastline', act: 2, par: 10, cos: ['rhea', 'dax', 'sora', 'mira'], enemyCo: 'volkov',
    map: sym(['mmf.f.sw', 'mH=c..sw', 'fB===Pww', '..f=c.sw', 'fA.=..rw', '.c.=.sww', 'mf.=.Pww', 'm.t=f.sw', 'mm.====#']),
    units: mir(16, [['cruiser', 7, 1], ['battleship', 6, 4], ['sub', 7, 6], ['tank', 4, 2], ['infantry', 4, 1], ['artillery', 3, 5], ['bcopter', 2, 4], ['mech', 4, 7]], [['tank', 11, 4]]),
    funds: [5000, 5000], weather: 'clear', weatherPool: ['clear', 'clear', 'rain'], fog: false, unitCap: [12, 13], objective: { type: 'rout' }, aiLevel: 2,
    hint: 'Naval battle! Battleships outrange everything. Subs hunt ships.',
    briefing: [
      { who: 'narrator', text: 'The Saltmarch Coast. Two fleets face each other across a narrow strait.' },
      { who: 'volkov', text: 'The Republic sends a sailor and children. The Iron General is insulted.' },
      { who: 'mira', text: 'Battleships hit from 2 to 6 tiles but can\'t move and fire. Cruisers hunt subs and aircraft.' },
      { who: 'mira', text: 'Only the southern bridge links the shores. Control the sea, and the land follows.' },
    ],
    outro: [
      { who: 'volkov', text: 'Impressive. But the storm is only beginning.' },
      { who: 'mira', text: 'He\'s pulling back to the Stormlands. The weather there changes by the hour.' },
    ],
  },
  {
    id: 'm8', name: 'Storm Front', act: 2, par: 11, cos: ['rhea', 'dax', 'sora', 'mira'], enemyCo: 'volkov', unlockCo: 'brann',
    map: sym(['mmff..c.', 'mH=..f..', 'fB==c..m', '.A.=..f.', '~~~#~~~~', '.c.=..t.', 'f..==..f', 'mcf.=c..', 'mm..=.mm']),
    units: mir(16, [['tank', 4, 1], ['heavy', 5, 2], ['infantry', 6, 1], ['infantry', 5, 6], ['artillery', 2, 3], ['bcopter', 2, 5], ['aa', 4, 5], ['mech', 6, 7]], [['rockets', 13, 6]]),
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
    id: 'm9', name: 'Long Guns', act: 3, par: 11, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: 'volkov',
    map: sym(['mm.ff...', 'mH=c...m', 'mB==.m..', '...=..c.', 'fc.=====', '...f.t..', 'mA.=..c.', 'm.c=.m..', 'mmm=....']),
    units: mir(16, [['artillery', 4, 2], ['rockets', 2, 3], ['artillery', 4, 6], ['tank', 5, 3], ['tank', 5, 5], ['infantry', 6, 1], ['mech', 6, 7], ['recon', 4, 8]], [['heavy', 10, 4], ['artillery', 9, 7]]),
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
    units: mir(16, [['infantry', 3, 1], ['mech', 5, 2], ['tank', 4, 4], ['tank', 5, 5], ['artillery', 2, 4], ['bcopter', 2, 6], ['recon', 6, 6], ['aa', 4, 7]], [['bcopter', 9, 4], ['tank', 9, 1]]),
    funds: [5000, 6000], weather: 'sand', weatherPool: ['sand', 'clear', 'rain'], fog: true, unitCap: [13, 15], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'Fog and sand. Nyx guards the relay. Scout, then strike decisively.',
    briefing: [
      { who: 'narrator', text: 'The Ghost Range. The Architect\'s signal relay pulses beneath shifting sands.' },
      { who: 'nyx', text: 'The Architect gave me sight in the dark. I will not give it back.' },
      { who: 'sora', text: 'She\'s guarding the relay. Fog and sandstorms — the worst of both worlds.' },
      { who: 'rhea', text: 'Rout her forces. Use every trick we\'ve learned.' },
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
    ], [['heavy', 10, 4], ['bomber', 12, 3], ['battleship', 17, 9], ['missiles', 11, 6]]),
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
    units: mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5], ['artillery', 2, 4], ['gundrone', 5, 3], ['mech', 4, 6], ['aa', 1, 7]], [['rockets', 11, 6], ['bcopter', 12, 2]]),
    funds: [5000, 6500], weather: 'sand', weatherPool: ['sand', 'clear', 'rain'], fog: true, unitCap: [14, 16], objective: { type: 'rout' }, aiLevel: 3,
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
    units: mir(16, [['tank', 4, 1], ['heavy', 5, 2], ['mech', 4, 3], ['artillery', 2, 4], ['infantry', 3, 5], ['apc', 4, 6], ['aa', 1, 7]], [['rockets', 12, 6], ['bcopter', 10, 2], ['heavy', 3, 4]]),
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
    units: mir(16, [['fighter', 3, 1], ['aa', 5, 2], ['missiles', 2, 4], ['gundrone', 4, 3], ['bcopter', 5, 5], ['infantry', 4, 6], ['tank', 2, 7]], [['fighter', 11, 1], ['bomber', 12, 3], ['missiles', 12, 6]]),
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
    units: mir(16, [['infantry', 4, 1], ['mech', 5, 2], ['tank', 4, 3], ['recon', 2, 5], ['artillery', 2, 4], ['gundrone', 5, 6], ['aa', 3, 7]], [['heavy', 11, 4], ['rockets', 13, 7]]),
    funds: [5500, 6500], weather: 'clear', weatherPool: ['clear', 'rain'], fog: false, unitCap: [15, 16], objective: { type: 'rout' }, aiLevel: 3,
    hint: 'A rogue Dominion army has broken the peace. Secure the central Radio Towers before its armor arrives.',
    briefing: [
      { who: 'narrator', text: 'Six months of peace end with artillery fire along the new border.' },
      { who: 'volkov', text: 'These soldiers wear my uniform, but they do not follow my orders.' },
      { who: 'rhea', text: 'Then we stop them together. Take the relay and rout the rogue column.' },
    ],
    outro: [
      { who: 'volkov', text: 'Their orders came from beneath the old capital.' },
      { who: 'brann', text: 'A human commander is rebuilding the Architect\'s network.' },
    ],
  },
  {
    id: 'm17', name: 'The Pretender', act: 6, par: 13, cos: PLAYABLE_ORDER_FRIENDLY, enemyCo: 'nyx',
    map: sym(['mm.ff...', 'mH=c..m.', 'fB==c...', '.A.=.t..', '...====.', 'fc..f...', 'm..c..f.', '..f.=...', 'mm..f...']),
    units: mir(16, [['tank', 4, 1], ['heavy', 5, 2], ['infantry', 4, 3], ['mech', 3, 5], ['artillery', 2, 4], ['rockets', 1, 7], ['fighter', 3, 6]], [['heavy', 12, 4], ['bcopter', 11, 1]]),
    boss: { x: 12, y: 4, team: 1, type: 'heavy', name: 'PRETENDER COMMAND', hp: 100, phases: 3 },
    funds: [6500, 8000], weather: 'rain', fog: true, unitCap: [16, 18], objective: { type: 'rout' }, aiLevel: 3,
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
    units: mir(16, [['cruiser', 1, 5], ['sub', 0, 7], ['tank', 5, 2], ['artillery', 4, 4], ['infantry', 5, 1], ['fighter', 3, 3], ['gundrone', 4, 7], ['missiles', 2, 8]], [['battleship', 15, 5], ['bomber', 11, 3]]),
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
];

/** First-clear skill rewards — the story hands you new tactical skills as you progress. */
export const REWARDS: Record<string, string> = {
  m0: 'rally', m1: 'rain', m2: 'fortify', m3: 'snow', m4: 'repair', m5: 'barrage',
  m6: 'emp', m7: 'warbonds', m8: 'tempest', m9: 'strike', m10: 'bombard', m11: 'meteor',
  m12: 'clear', m13: 'blitz', m14: 'whiteout', m15: 'fury',
  m16: 'warbonds', m17: 'strike', m18: 'repair', m19: 'meteor',
};
export const MERIT_BONUS = 250; // extra merits on first clear

export const ACT_INTROS = [
  'Basic training under Captain Rhea Vance. Learn to move, fight and capture.',
  'The Crimson Dominion invades. Hold the border, cross the Varn River and survive the Frozen Pass.',
  'The war takes to the skies and seas. Strange orders surface, signed by someone called "The Architect".',
  'The truth comes out: a war-machine AI has been running both sides. Republic and Dominion must end it together.',
  'The Architect is destroyed, but its dormant machines awaken. Follow the dead signal into the Glass Desert.',
  'A final broadcast rises from orbit. Break the last defense platforms and end the war-machine network.',
  'Peace fractures as rogue armies rebuild the old machine network. Hunt the Pretender beneath the capital.',
  'The last signal races east. Cross the frozen horizon and stop Zero Dawn before it erases every nation.',
];

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
    text: 'Move the top Infantry onto the city and capture it.\nCities pay +1,000G every day — capture early.',
    event: 'capture-city', kind: 'action', speaker: 'rhea',
    events: ['select-infantry', 'reach-city', 'first-capture'],
    targets: {
      'select-infantry': { x: 4, y: 2, label: 'SELECT TOP INFANTRY' },
      'reach-city': { x: 4, y: 1, label: 'MOVE TO TOP CITY' },
      'first-capture': { x: 4, y: 1, label: 'CAPTURE THIS CITY' },
    },
  },
  {
    title: '2 · COVER CUTS COUNTER DAMAGE',
    text: 'Attack the red Tank from below.\nThen Undo and attack again from the forest.',
    event: 'tank-cover', kind: 'action', speaker: 'rhea',
    events: ['select-tank', 'attack-bottom', 'undo-attack', 'select-tank', 'attack-forest'],
    targets: {
      'select-tank': { x: 3, y: 3, label: 'SELECT BLUE TANK' },
      'attack-bottom': { x: 6, y: 3, label: 'ATTACK FROM BELOW' },
      'undo-attack': { button: 'undo', label: 'REDO: TAP UNDO' },
      'attack-forest': { x: 6, y: 3, label: 'ATTACK FROM THE FOREST' },
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
    text: 'Move the lower Infantry to the Radio Tower and capture it.\nTower: +1 move to all units every 3rd turn, and +1 HP nearby each turn.',
    event: 'capture-radio', kind: 'action', speaker: 'rhea',
    events: ['select-radio-infantry', 'move-radio', 'capture-radio'],
    targets: {
      'select-radio-infantry': { x: 3, y: 5, label: 'SELECT LOWER INFANTRY' },
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
  { title: 'YOUR UNITS', text: 'Ground, artillery, air and navy. Aircraft need fuel; artillery can\'t move and fire. Scroll to see all 19.', event: 'roster', kind: 'info', speaker: 'rhea', units: ['infantry', 'mech', 'recon', 'apc', 'tank', 'heavy', 'aa', 'artillery', 'rockets', 'missiles', 'drone', 'gundrone', 'tcopter', 'bcopter', 'fighter', 'bomber', 'cruiser', 'sub', 'battleship'] },
  { title: 'SUMMARY', text: 'WIN: rout all enemies, or capture their HQ.\nCITY: +1,000G/day and a paid 2 HP repair.\nRADIO TOWER: no gold; +1 HP nearby; +1 move every 3rd turn.\nCOVER: cities/towers ★★★; forest ★★.\nAIR: refuel at friendly properties.\n\nTOP BAR: CO gauge and resources.\nBOTTOM BAR: details, Undo, End Turn.\nLOOK UP A UNIT: double-tap it, or tap the large bottom panel for Intel. Main menu → Field Manual lists every unit.', event: 'field-guide', kind: 'info', speaker: 'rhea' },
  { title: '5 · FREE PLAY', text: 'Training complete.\nUse what you learned and defeat every enemy unit.', event: 'free-play', kind: 'info', speaker: 'rhea' },
];
