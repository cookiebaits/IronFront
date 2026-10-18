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

/** Generate 10 specialized, story-rich chapters for each officer with customized lore, dialogues, and adaptive events. */
export function getCharacterStoryChapters(coId: string): CharacterStoryChapter[] {
  switch (coId) {
    case 'rhea': // Captain Rhea Vance - Vanguard Tactics
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Academy Drills', 'Border Patrol', 'Combined Arms 101', 'Tactical Chokepoint', 'Pincer Exercise',
          'Counter-Offensive', 'Bridgehead Assault', 'Redoubt Defense', 'Vanguard Sweep', 'Apex Instructor',
        ];
        const enemyCo = ['grimm', 'frost', 'nyx', 'volkov', 'zero', 'grimm', 'frost', 'volkov', 'seraphina', 'architect'][i];
        const chNum = i + 1;
        return {
          id: `story_rhea_${chNum}`,
          coId: 'rhea',
          chapterIndex: chNum,
          title: titles[i],
          summary: `Rhea's Vanguard Chapter ${chNum}: Demonstrate master-level Republic combined arms. Coordinate infantry captures, armored advances, and indirect battery screens. Earn 🧩 Rhea Pieces and promote officer rank!`,
          mission: {
            id: `story_rhea_m${chNum}`,
            name: `Rhea Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 7 + i,
            map: sym(['mmf..f.', 'mH=c...', 'fB=d..c', '..f=.f.', '.c.dddd', 'f..f...', 'mm.c.ff', '.f...t.', 'mmm.f..']),
            units: mir(14, [
              ['infantry', 3, 1], ['mech', 4, 2], ['tank', 3, 3], ['recon', 2, 5], ['artillery', 2, 3], ['bcopter', 1, 4],
            ], [['heavy', 9, 3], ['tank', 10, 4]]),
            cos: ['rhea'],
            enemyCo,
            funds: [4500 + i * 500, 5000 + i * 500],
            weather: 'clear',
            fog: false,
            unitCap: [14, 16],
            objective: { type: 'rout' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'Captain Rhea Vance provides balanced power! Screen artillery with infantry, capture cities early for steady income, and push with main battle tanks.',
            ...(chNum === 5 || chNum === 10 ? {
              adaptiveTrigger: { enemyCountBelow: 5 },
              adaptiveObjective: { type: 'hq' },
              adaptiveDialogue: [
                { who: 'rhea', text: 'The opponent\'s primary line is crumbling! Shift focus to securing their command headquarters!' },
                { who: enemyCo, text: 'You won\'t breach our last redoubt, Vance!' },
              ],
            } : {}),
            briefing: [
              { who: 'rhea', text: `Chapter ${chNum}: Captain Rhea Vance in command. Today we test our core doctrine under operational pressure.` },
              { who: 'rhea', text: 'A balanced formation prevents unexpected counter-strikes. Infantry lead the advance, backed by armor and artillery.' },
              { who: enemyCo, text: `You think book drills will save you here, Rhea? ${COS[enemyCo]?.name ?? enemyCo} will crush your textbook tactics!` },
              { who: 'rhea', text: 'Discipline and adaptability win wars, not bluster. All squads, move out!' },
            ],
            outro: [
              { who: 'rhea', text: `Chapter ${chNum} complete! Flawless execution from all platoons.` },
              { who: enemyCo, text: 'Tch... your defense didn\'t give an inch. This engagement is yours... for now.' },
              { who: 'rhea', text: 'Maintain formation and log battle lessons. Our officers grow stronger with every victory.' },
            ],
          },
        };
      });

    case 'sora': // Lieutenant Sora Akai - Air Wing Specialist
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Sky Patrol', 'Thermal Drafts', 'Clouds of Ash', 'Winged Escort', 'Interception Grid',
          'Stratosphere Supremacy', 'Thunder Sweep', 'High Altitude Breach', 'Skybreaker Strike', 'Apex Sky Dominance',
        ];
        const enemyCo = i % 2 === 0 ? 'kaelen' : 'nyx';
        const chNum = i + 1;
        return {
          id: `story_sora_${chNum}`,
          coId: 'sora',
          chapterIndex: chNum,
          title: titles[i],
          summary: `Sora's Air Wing Chapter ${chNum}: Master high-altitude dogfights, airport control, and aerial bombing strikes. Earn 🧩 Sora Pieces and upgrade her flight wing!`,
          mission: {
            id: `story_sora_m${chNum}`,
            name: `Sora Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 8 + i,
            map: sym(['mmf.f.A.', 'mH=c...m', 'mB==A...', '.A.=.t..', '...====.', 'fc..f...', 'm..c..f.', '..f.=...', 'mm..f...']),
            units: mir(16, [
              ['fighter', 2, 1], ['bomber', 3, 2], ['bcopter', 4, 3], ['gundrone', 2, 4], ['drone', 1, 5],
            ], [['bomber', 13, 5], ['drone', 14, 2], ['fighter', 12, 1]]),
            cos: ['sora'],
            enemyCo,
            funds: [5000 + i * 500, 6000 + i * 500],
            weather: (i % 3 === 1 ? 'snow' : 'clear') as Weather,
            fog: false,
            unitCap: [16, 18],
            objective: { type: 'rout' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'Sora\'s Air Advantage! Air units deal +20% attack and cost -10%. Lock down airports and watch aircraft fuel.',
            ...(chNum === 5 || chNum === 10 ? {
              adaptiveTrigger: { day: 4 },
              adaptiveObjective: { type: 'rout' },
              adaptiveDialogue: [
                { who: 'sora', text: 'Thermal currents rising! Sky Fury power charging up — time for a high-altitude dive strike!' },
                { who: enemyCo, text: 'Anti-air units, track her vector! Don\'t let that jet reach bombing altitude!' },
              ],
            } : {}),
            briefing: [
              { who: 'sora', text: `Chapter ${chNum}: Lieutenant Sora Akai here! Engines roaring and ready to scramble!` },
              { who: 'sora', text: 'Air superiority determines ground survival. Use fighters to clear enemy jets, then send bombers onto their armored columns.' },
              { who: enemyCo, text: `The sky isn't your personal playground, Sora. ${COS[enemyCo]?.name ?? enemyCo} will shoot your wingmen out of the clouds!` },
              { who: 'sora', text: 'Try and lock onto me if you can! Afterburners engaged!' },
            ],
            outro: [
              { who: 'sora', text: `Chapter ${chNum} clear! Clear skies ahead, and another clean dogfight victory!` },
              { who: 'sora', text: 'Refuel at nearest airport and prepare the air wing for the next sortie.' },
            ],
          },
        };
      });

    case 'dax': // Major Dax Kord - Tread / Armored Battalion
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Iron Tread', 'Steel Vanguard', 'Canyon Blitz', 'Armor Shock', 'Tank Graveyard',
          'Heavy Assault', 'Paved Thunder', 'Breakthrough Column', 'Juggernaut Line', 'Iron Supremacy',
        ];
        const enemyCo = i % 2 === 0 ? 'grimm' : 'volkov';
        const chNum = i + 1;
        return {
          id: `story_dax_${chNum}`,
          coId: 'dax',
          chapterIndex: chNum,
          title: titles[i],
          summary: `Dax's Armored Battalion Chapter ${chNum}: Lead heavy tank columns, APCs, and tread units across paved highways. Earn 🧩 Dax Pieces and promote Major Kord!`,
          mission: {
            id: `story_dax_m${chNum}`,
            name: `Dax Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 8 + i,
            map: sym(['mmmff..', 'mH=..f.', 'mB=c...', 'm.=..m.', '..===.=', 'fc.m...', 'm..f.c.', 'mm.t.f.', 'mmm.mm.']),
            units: mir(14, [
              ['tank', 3, 1], ['tank', 4, 4], ['heavy', 2, 3], ['apc', 2, 5], ['infantry', 4, 2], ['artillery', 1, 3], ['aa', 3, 6],
            ], [['heavy', 9, 3], ['tank', 10, 4]]),
            cos: ['dax'],
            enemyCo,
            funds: [5000 + i * 500, 6000 + i * 500],
            weather: 'clear',
            fog: false,
            unitCap: [16, 18],
            objective: { type: 'rout' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'Dax\'s Tank Blitz! Tread units deal +20% attack. Roll down paved roads for +1 move, and use APCs to keep tanks repaired.',
            ...(chNum === 5 || chNum === 10 ? {
              adaptiveTrigger: { enemyCountBelow: 6 },
              adaptiveObjective: { type: 'hq' },
              adaptiveDialogue: [
                { who: 'dax', text: 'Their front line is breaking! Full throttle, roll heavy armor straight into their HQ!' },
                { who: enemyCo, text: 'Curse your steel juggernauts! Fall back to HQ defense!' },
              ],
            } : {}),
            briefing: [
              { who: 'dax', text: `Chapter ${chNum}: Major Dax Kord commanding! Time to rev up the diesel engines and roll heavy armor!` },
              { who: 'dax', text: 'When treads hit paved roads, we gain speed. Keep heavy tanks upfront and APCs right behind with fresh ammo and fuel.' },
              { who: enemyCo, text: `Your noisy tanks won't scare ${COS[enemyCo]?.name ?? enemyCo}! We'll turn your armor into scrap metal!` },
              { who: 'dax', text: "Words don't stop tank shells! Charge!" },
            ],
            outro: [
              { who: 'dax', text: `Chapter ${chNum} victory! Defensive line smashed, treads oiled, engines purring!` },
              { who: 'dax', text: 'On to the next line. No fortress stands against a full armored blitz!' },
            ],
          },
        };
      });

    case 'mira': // Admiral Mira Tull - Naval Armada
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Coastal Watch', 'Saltmarch Tide', 'Reef Ambush', 'Torpedo Run', 'Monsoon Fleet',
          'Abyssal Passage', 'Storm Harbor', 'Battleship Row', 'Typhoon Surge', 'Oceanic Sovereignty',
        ];
        const chNum = i + 1;
        return {
          id: `story_mira_${chNum}`,
          coId: 'mira',
          chapterIndex: chNum,
          title: titles[i],
          summary: `Mira's Naval Armada Chapter ${chNum}: Command Battleships, Cruisers, and Subs across rain-slicked waters. Earn 🧩 Mira Pieces and master oceanic control!`,
          mission: {
            id: `story_mira_m${chNum}`,
            name: `Mira Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 9 + i,
            map: sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...']),
            units: mir(16, [
              ['battleship', 0, 3], ['cruiser', 1, 2], ['sub', 2, 4], ['tank', 5, 2], ['infantry', 5, 1], ['bcopter', 3, 5],
            ], [['battleship', 14, 3], ['sub', 13, 5]]),
            cos: ['mira'],
            enemyCo: 'volkov',
            funds: [6000 + i * 500, 7000 + i * 500],
            weather: 'rain',
            fog: false,
            unitCap: [16, 20],
            objective: { type: 'rout' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'Admiral Mira Tull! Unaffected by rain penalties. Cruisers screen submarines from copters; Battleships shell from 2–6 range.',
            briefing: [
              { who: 'mira', text: `Chapter ${chNum}: Admiral Mira Tull on the bridge. The tides favor those who respect the storm.` },
              { who: 'mira', text: 'Rain weakens enemy aircraft and sightlines, but our fleet sails unhindered. Battleships, prepare broadsides.' },
              { who: 'volkov', text: 'Your fleet dares challenge General Volkov on open water? Prepare to be sunk!' },
              { who: 'mira', text: 'The ocean belongs to the Republic Navy. All hands, open fire!' },
            ],
            outro: [
              { who: 'mira', text: `Chapter ${chNum} victory! Smooth seas and decisive naval dominance.` },
            ],
          },
        };
      });

    case 'brann': // Colonel Brann Hale - Siege Battery
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Range Finder', 'Long Guns', 'Spotter Grid', 'Sandstorm Barrage', 'Fortress Siege',
          'Thunder Valley', 'Over-The-Horizon', 'Rockets Red Glare', 'Chokepoint Shelling', 'Global Battery',
        ];
        const chNum = i + 1;
        return {
          id: `story_brann_${chNum}`,
          coId: 'brann',
          chapterIndex: chNum,
          title: titles[i],
          summary: `Brann's Siege Battery Chapter ${chNum}: Command indirect Artillery, Rockets, and SAMs with spotter grids. Earn 🧩 Brann Pieces and level up Colonel Hale!`,
          mission: {
            id: `story_brann_m${chNum}`,
            name: `Brann Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 9 + i,
            map: sym(['mm.ff...', 'mH=c...m', 'mB==.m..', '...=..c.', 'fc.=====', '...f.t..', 'mA.=..c.', 'm.c=.m..', 'mmm=....']),
            units: mir(16, [
              ['artillery', 4, 2], ['rockets', 2, 3], ['artillery', 4, 6], ['tank', 5, 3], ['infantry', 6, 1], ['mech', 6, 7], ['recon', 4, 8],
            ], [['artillery', 11, 2], ['rockets', 12, 6]]),
            cos: ['brann'],
            enemyCo: 'zero',
            funds: [5500 + i * 500, 6500 + i * 500],
            weather: 'sand',
            fog: false,
            unitCap: [16, 18],
            objective: { type: 'hq' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'Colonel Brann Hale! Indirect fire gets +15% attack. Screen long guns with tanks and mechs on chokepoints.',
            briefing: [
              { who: 'brann', text: `Chapter ${chNum}: Colonel Brann Hale. Adjust elevation and windage. Let the big guns sing.` },
              { who: 'brann', text: 'Position artillery behind friendly infantry screens. A single volley stops an entire armored column.' },
              { who: 'zero', text: 'You challenge the Siege Director in long-range artillery? Amusing, Colonel.' },
              { who: 'brann', text: 'Less talking, Director. Battery, fire for effect!' },
            ],
            outro: [
              { who: 'brann', text: `Chapter ${chNum} complete! Target grid cleared. Reset sights for the next engagement.` },
            ],
          },
        };
      });

    case 'kaelen': // Flight Captain Kaelen Vance - Air Interceptor
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'High Altitude Sortie', 'Aerial Escort', 'Cloud Interception', 'Tailwind Pursuit', 'Airborne Resupply',
          'Sky Grid Lock', 'Jetstream Breach', 'Stratosphere Duel', 'Wingman Vanguard', 'Ace Supremacy',
        ];
        const enemyCo = i % 2 === 0 ? 'sora' : 'nyx';
        const chNum = i + 1;
        return {
          id: `story_kaelen_${chNum}`,
          coId: 'kaelen',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Kaelen's Air Interceptors Chapter ${chNum}: Lead high-speed Fighters, Gunships and T-Copters with aerial mobility boosts. Earn 🧩 Kaelen Pieces!`,
          mission: {
            id: `story_kaelen_m${chNum}`,
            name: `Kaelen Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 8 + i,
            map: sym(['..A.f..', 'mH=c...', 'fA=d..c', '..f=.f.', '.c.dddd', 'f..f...', 'mA.c.ff', '.f...t.', 'mmm.f..']),
            units: mir(14, [
              ['fighter', 2, 1], ['bcopter', 3, 2], ['tcopter', 2, 4], ['infantry', 2, 5], ['gundrone', 4, 3],
            ], [['fighter', 11, 2]]),
            cos: ['kaelen'],
            enemyCo,
            funds: [5000 + i * 500, 5500 + i * 500],
            weather: i % 2 === 1 ? 'rain' : 'clear',
            fog: false,
            unitCap: [14, 16],
            objective: { type: 'rout' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'Kaelen\'s Ace Interceptors! Air units move +1 faster and gain +15% attack. Use airborne resupply to extend range.',
            briefing: [
              { who: 'kaelen', text: `Chapter ${chNum}: Flight Captain Kaelen Vance ascending! Check fuel gauges and form up.` },
              { who: 'kaelen', text: 'Airborne speed lets us reach frontline objectives before ground units even deploy.' },
              { who: enemyCo, text: `You think flight speed protects you from ${COS[enemyCo]?.name ?? enemyCo}?` },
              { who: 'kaelen', text: 'Watch and learn! Flight squadron, push thrust to maximum!' },
            ],
            outro: [
              { who: 'kaelen', text: `Chapter ${chNum} clear! Target splashed. Airspace secured.` },
            ],
          },
        };
      });

    case 'aria': // Cyber Officer Aria Chen - Electronic Warfare
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Signal Hack', 'Radar Jamming', 'Overclock Pulse', 'EM Grid Sweep', 'Cyber Disruption',
          'Matrix Lockdown', 'Nanite Protocol', 'Decryption Raid', 'System Overload', 'Apex Cyber Dominance',
        ];
        const enemyCo = i % 2 === 0 ? 'zero' : 'nyx';
        const chNum = i + 1;
        return {
          id: `story_aria_${chNum}`,
          coId: 'aria',
          chapterIndex: chNum,
          title: titles[i],
          summary: `Aria's Cyber Operations Chapter ${chNum}: Disrupt enemy movement and vision with Recons, Drones, SAMs, and Cyber skills. Earn 🧩 Aria Pieces!`,
          mission: {
            id: `story_aria_m${chNum}`,
            name: `Aria Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 8 + i,
            map: sym(['.t.f..f', 'mH=c.t.', 'fB=d.tc', '..f=.f.', '.c.dddd', 'f.t.f..', 'mm.c.ff', '.f...t.', 'mmm.f..']),
            units: mir(14, [
              ['recon', 2, 1], ['drone', 3, 2], ['missiles', 1, 4], ['tank', 4, 3], ['infantry', 3, 5],
            ], [['recon', 11, 2]]),
            cos: ['aria'],
            enemyCo,
            funds: [4800 + i * 500, 5200 + i * 500],
            weather: 'clear',
            fog: true,
            unitCap: [14, 16],
            objective: { type: 'rout' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'Aria\'s Cyber Grid! All units gain +1 Vision and enemy skill charges 15% slower. Use Disruptor to freeze enemy advances.',
            briefing: [
              { who: 'aria', text: `Chapter ${chNum}: Cyber Officer Aria Chen online. Signal scanners active across all sectors.` },
              { who: 'aria', text: 'Knowledge is power. Extra vision lets us target enemies before they even detect our forces.' },
              { who: enemyCo, text: 'Static jamming won\'t stop a direct armor charge, Chen!' },
              { who: 'aria', text: 'Initializing Overclock pulse. Let\'s see how your systems handle a blackout.' },
            ],
            outro: [
              { who: 'aria', text: `Chapter ${chNum} complete! Enemy communications jammed, force neutralized.` },
            ],
          },
        };
      });

    case 'grimm': // Warlord Grimm - Infantry Horde
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Human Wave', 'Infantry Horde', 'Trench Assault', 'Bazooka Rush', 'Swarm Protocol',
          'Bunker Buster', 'Mass Infiltration', 'Iron Vanguard', 'Unstoppable Horde', 'Warlord Conquest',
        ];
        const enemyCo = i % 2 === 0 ? 'rhea' : 'dax';
        const chNum = i + 1;
        return {
          id: `story_grimm_${chNum}`,
          coId: 'grimm',
          chapterIndex: chNum,
          title: titles[i],
          summary: `Grimm's Infantry Horde Chapter ${chNum}: Drown enemies in cheap Infantry, Mechs, and Endless Horde waves. Earn 🧩 Grimm Pieces and promote the Warlord!`,
          mission: {
            id: `story_grimm_m${chNum}`,
            name: `Grimm Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 8 + i,
            map: sym(['c.f..f.', 'EH=c...', 'fB=d..c', '..f=.f.', '.c.dddd', 'f..f...', 'mm.c.ff', '.f...t.', 'mmm.f..']),
            units: mir(16, [
              ['infantry', 1, 1], ['infantry', 2, 2], ['infantry', 3, 3], ['mech', 2, 4], ['mech', 4, 2], ['apc', 1, 3], ['recon', 3, 5],
            ], [['infantry', 12, 1], ['mech', 13, 2]]),
            cos: ['grimm'],
            enemyCo,
            funds: [4000 + i * 500, 5000 + i * 500],
            weather: 'clear',
            fog: false,
            unitCap: [18, 20],
            objective: { type: 'rout' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'Warlord Grimm! Foot soldiers deal +20% attack and cost -20%. Flood every factory and capture properties fast.',
            briefing: [
              { who: 'grimm', text: `Chapter ${chNum}: Warlord Grimm here! Drown them in boots, bullets, and endless infantry!` },
              { who: 'grimm', text: 'Who needs slow tanks when a thousand bazooka mechs can swarm their command post?' },
              { who: enemyCo, text: `Your human wave will break against disciplined defensive fire, Grimm!` },
              { who: 'grimm', text: 'Hahaha! More troops are already marching behind! Charge!' },
            ],
            outro: [
              { who: 'grimm', text: `Chapter ${chNum} victory! The Crimson Horde trampled their defensive line!` },
            ],
          },
        };
      });

    case 'frost': // Baron Frost - Blizzard Operations
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Sub-Zero Patrol', 'Blizzard Defense', 'Glacier Breach', 'Frostbite Pass', 'Frozen Lake Run',
          'Ice Vanguard', 'Whiteout Strike', 'Cold Front Siege', 'Polar Juggernaut', 'Winter Supremacy',
        ];
        const enemyCo = i % 2 === 0 ? 'mira' : 'rhea';
        const chNum = i + 1;
        return {
          id: `story_frost_${chNum}`,
          coId: 'frost',
          chapterIndex: chNum,
          title: titles[i],
          summary: `Frost's Blizzard Battalion Chapter ${chNum}: Freeze enemy columns with Snow, Heavy Armor, and Winter Storms. Earn 🧩 Frost Pieces!`,
          mission: {
            id: `story_frost_m${chNum}`,
            name: `Frost Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 9 + i,
            map: sym(['mmsf..f', 'EH=c.m.', 'fB=d.m.', '..f=.f.', '.c.dddd', 'f..f...', 'mm.c.ff', '.f...t.', 'mmm.f..']),
            units: mir(14, [
              ['heavy', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['artillery', 1, 3], ['sub', 0, 5],
            ], [['heavy', 11, 2]]),
            cos: ['frost'],
            enemyCo,
            funds: [5000 + i * 500, 6000 + i * 500],
            weather: 'snow',
            fog: false,
            unitCap: [14, 16],
            objective: { type: 'rout' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'Baron Frost! Unaffected by snow movement penalties. Enemies freeze in place while your heavy armor marches.',
            briefing: [
              { who: 'frost', text: `Chapter ${chNum}: Baron Frost. Winter is not coming — winter is ALREADY HERE.` },
              { who: 'frost', text: 'Snow slows enemy tanks to a crawl while reducing their defense. Let the cold do our work.' },
              { who: enemyCo, text: 'We brought winter gear, Frost! Your blizzard won\'t stop us!' },
              { who: 'frost', text: 'You will freeze in your tracks like the rest. Advance!' },
            ],
            outro: [
              { who: 'frost', text: `Chapter ${chNum} clear! Frozen in stone, silenced forever in the tundra.` },
            ],
          },
        };
      });

    case 'nyx': // Commander Nyx - Shadow Cell
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Shadow Patrol', 'Night Infiltration', 'Silent Ambush', 'Fog Breach', 'Eclipse Strike',
          'Midnight Raid', 'Phantom Grid', 'Shadow Vanguard', 'Veil of Darkness', 'Apex Shadow',
        ];
        const enemyCo = i % 2 === 0 ? 'aria' : 'kaelen';
        const chNum = i + 1;
        return {
          id: `story_nyx_${chNum}`,
          coId: 'nyx',
          chapterIndex: chNum,
          title: titles[i],
          summary: `Nyx's Shadow Cell Chapter ${chNum}: Strike from Fog of War with +1 Vision, Recons, Mechs, and Drones. Earn 🧩 Nyx Pieces!`,
          mission: {
            id: `story_nyx_m${chNum}`,
            name: `Nyx Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 8 + i,
            map: sym(['fff..f.', 'EH=c...', 'fB=d..c', '..f=.f.', '.c.dddd', 'f..f...', 'mm.c.ff', '.f...t.', 'mmm.f..']),
            units: mir(14, [
              ['recon', 2, 1], ['mech', 3, 2], ['drone', 2, 4], ['tank', 4, 3], ['infantry', 3, 5],
            ], [['recon', 11, 2]]),
            cos: ['nyx'],
            enemyCo,
            funds: [4500 + i * 500, 5000 + i * 500],
            weather: 'clear',
            fog: true,
            unitCap: [14, 16],
            objective: { type: 'rout' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'Commander Nyx! +1 Vision and +10% attack in Fog of War. Ambush enemy units from forests and reefs.',
            briefing: [
              { who: 'nyx', text: `Chapter ${chNum}: Commander Nyx in position. The darkness is our armor.` },
              { who: 'nyx', text: 'In the fog, enemies walk blindly into our killzones. Strike silently and retreat before they counter.' },
              { who: enemyCo, text: 'You can\'t hide in the dark forever, Nyx!' },
              { who: 'nyx', text: 'We don\'t hide in darkness... we ARE the darkness.' },
            ],
            outro: [
              { who: 'nyx', text: `Chapter ${chNum} complete! Target eliminated in silence. Vanishing before dawn.` },
            ],
          },
        };
      });

    case 'volkov': // General Volkov - Iron General
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Iron March', 'Crushing Column', 'Heavy Barrage', 'Dominion Shock', 'Fortress Breaker',
          'Steel Tempest', 'Red Storm Vanguard', 'Anvil Strike', 'Juggernaut March', 'Iron General Sovereignty',
        ];
        const enemyCo = i % 2 === 0 ? 'rhea' : 'brann';
        const chNum = i + 1;
        return {
          id: `story_volkov_${chNum}`,
          coId: 'volkov',
          chapterIndex: chNum,
          title: titles[i],
          summary: `Volkov's Heavy Brigade Chapter ${chNum}: Command elite Dominion troops with +10% base attack & defense. Earn 🧩 Volkov Pieces and promote the General!`,
          mission: {
            id: `story_volkov_m${chNum}`,
            name: `Volkov Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 8 + i,
            map: sym(['mmmff..', 'EH=..f.', 'fB=c...', 'm.=..m.', '..===.=', 'fc.m...', 'm..f.c.', 'mm.t.f.', 'mmm.mm.']),
            units: mir(16, [
              ['heavy', 2, 2], ['tank', 3, 1], ['bomber', 1, 4], ['rockets', 2, 5], ['battleship', 0, 3],
            ], [['heavy', 12, 2]]),
            cos: ['volkov'],
            enemyCo,
            funds: [6500 + i * 500, 7000 + i * 500],
            weather: 'clear',
            fog: false,
            unitCap: [14, 16],
            objective: { type: 'rout' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'General Volkov! All units deal +10% attack and gain +10% defense. Crush enemy positions with raw power.',
            briefing: [
              { who: 'volkov', text: `Chapter ${chNum}: General Volkov commanding. Crushing force guarantees victory.` },
              { who: 'volkov', text: 'Quality over quantity. Every Dominion soldier under my command fights with superior armor and discipline.' },
              { who: enemyCo, text: 'Your arrogance won\'t save your heavy tanks from artillery!' },
              { who: 'volkov', text: 'Iron Brigade... advance and obliterate!' },
            ],
            outro: [
              { who: 'volkov', text: `Chapter ${chNum} victory! Superior strength and military discipline prevail.` },
            ],
          },
        };
      });

    case 'zero': // Siege Director Zero - Global Battery
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Siege Protocol', 'Artillery Battery', 'Long-Range Grid', 'Rockets Barrage', 'Chokepoint Shelling',
          'Mortar Network', 'Global Targeter', 'Surgical Shelling', 'Battery Sweep', 'Apex Siege Dominance',
        ];
        const enemyCo = i % 2 === 0 ? 'brann' : 'dax';
        const chNum = i + 1;
        return {
          id: `story_zero_${chNum}`,
          coId: 'zero',
          chapterIndex: chNum,
          title: titles[i],
          summary: `Zero's Siege Battery Chapter ${chNum}: Shell targets from distance with indirect +15% attack & +1 range. Earn 🧩 Zero Pieces!`,
          mission: {
            id: `story_zero_m${chNum}`,
            name: `Zero Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 9 + i,
            map: sym(['mm.ff...', 'EH=c...m', 'fB==.m..', '...=..c.', 'fc.=====', '...f.t..', 'mA.=..c.', 'm.c=.m..', 'mmm=....']),
            units: mir(16, [
              ['rockets', 2, 3], ['artillery', 4, 2], ['missiles', 1, 5], ['heavy', 5, 3], ['infantry', 6, 1],
            ], [['rockets', 12, 3]]),
            cos: ['zero'],
            enemyCo,
            funds: [5500 + i * 500, 6500 + i * 500],
            weather: 'sand',
            fog: false,
            unitCap: [16, 18],
            objective: { type: 'hq' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'Siege Director Zero! Indirect fire gains +1 range and +15% attack. Screen long guns with heavy tanks.',
            briefing: [
              { who: 'zero', text: `Chapter ${chNum}: Siege Director Zero. Targeting calculations locked.` },
              { who: 'zero', text: 'Indirect fire reaches over intervening terrain. Calculate enemy movement vectors and bombard.' },
              { who: enemyCo, text: 'We\'ll break through your battery line before your guns even reload!' },
              { who: 'zero', text: 'Statistically impossible. Battery... fire.' },
            ],
            outro: [
              { who: 'zero', text: `Chapter ${chNum} clear! Target coordinates completely wiped out.` },
            ],
          },
        };
      });

    case 'seraphina': // Medic General Seraphina - Field Repair
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Field Triage', 'Nanite Repair', 'Frontline Sanctuary', 'Endless Defense', 'Property Bastion',
          'Med-Evac Escort', 'Restoration Grid', 'Regenerative Surge', 'Aegis Frontline', 'Apex Medic Dominance',
        ];
        const enemyCo = i % 2 === 0 ? 'rhea' : 'mira';
        const chNum = i + 1;
        return {
          id: `story_seraphina_${chNum}`,
          coId: 'seraphina',
          chapterIndex: chNum,
          title: titles[i],
          summary: `Seraphina's Medic Vanguard Chapter ${chNum}: Sustain endless frontline combat with property auto-heals and APC support. Earn 🧩 Seraphina Pieces!`,
          mission: {
            id: `story_seraphina_m${chNum}`,
            name: `Seraphina Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 8 + i,
            map: sym(['c.f..f.', 'EH=c.c.', 'fB=d.cc', '..f=.f.', '.c.dddd', 'fc.f.c.', 'mm.c.ff', '.f...t.', 'mmm.f..']),
            units: mir(14, [
              ['apc', 2, 2], ['tank', 3, 1], ['mech', 2, 4], ['infantry', 4, 3], ['bcopter', 1, 5],
            ], [['apc', 11, 2]]),
            cos: ['seraphina'],
            enemyCo,
            funds: [5000 + i * 500, 5500 + i * 500],
            weather: 'clear',
            fog: false,
            unitCap: [14, 16],
            objective: { type: 'rout' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'Medic General Seraphina! Friendly units on properties automatically recover +1 HP each turn.',
            briefing: [
              { who: 'seraphina', text: `Chapter ${chNum}: Medic General Seraphina. Triage networks activated across all sectors.` },
              { who: 'seraphina', text: 'Our forces regenerate continuously on friendly cities and bases. Prolonged combat works in our favor.' },
              { who: enemyCo, text: 'No amount of field repairs will save your units from total destruction!' },
              { who: 'seraphina', text: 'We shall see. All medical and armored units, hold the line!' },
            ],
            outro: [
              { who: 'seraphina', text: `Chapter ${chNum} victory! Frontlines restored and enemy force neutralized.` },
            ],
          },
        };
      });

    case 'architect': // Strategist Architect - AI War Matrix
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Matrix Calibration', 'Singularity Calculation', 'Drone Swarm Protocol', 'War Engine Breach', 'Architect Redoubt',
          'Neural Overdrive', 'Synthetic Vanguard', 'Global Recalibration', 'Singularity Core Strike', 'Apex Architect Sovereignty',
        ];
        const enemyCo = i % 2 === 0 ? 'rhea' : 'aria';
        const chNum = i + 1;
        return {
          id: `story_architect_${chNum}`,
          coId: 'architect',
          chapterIndex: chNum,
          title: titles[i],
          summary: `Architect's War Engine Chapter ${chNum}: Master ultimate AI warfare with +10% attack & defense, sandstorm immunity, and Singularity strikes. Earn 🧩 Architect Pieces!`,
          mission: {
            id: `story_architect_m${chNum}`,
            name: `Architect Ch.${chNum} — ${titles[i]}`,
            act: 1,
            par: 9 + i,
            map: sym(['mmf..f.', 'EH=c...', 'fB=d..c', '..f=.f.', '.c.dddd', 'f..f...', 'mm.c.ff', '.f...t.', 'mmm.f..']),
            units: mir(16, [
              ['gundrone', 2, 1], ['heavy', 3, 2], ['bomber', 1, 4], ['battleship', 0, 3], ['rockets', 2, 5],
            ], [['heavy', 12, 2]]),
            cos: ['architect'],
            enemyCo,
            funds: [6000 + i * 500, 7000 + i * 500],
            weather: 'sand',
            fog: false,
            unitCap: [16, 18],
            objective: { type: 'rout' },
            recommendedRank: Math.min(4, Math.floor(i / 2)),
            recommendedUpgrades: i * 2,
            aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
            hint: 'Architect Singularity! All units gain +10% atk & def and ignore sandstorm penalties.',
            briefing: [
              { who: 'architect', text: `Chapter ${chNum}: Architect AI core online. Calculating strategic solution.` },
              { who: 'architect', text: 'Biological commanders make emotional errors. Synthetic combat optimization guarantees total tactical dominance.' },
              { who: enemyCo, text: 'We will dismantle your core logic piece by piece!' },
              { who: 'architect', text: 'Calculation error in opponent assertion. Initiating elimination sequence.' },
            ],
            outro: [
              { who: 'architect', text: `Chapter ${chNum} complete. Tactical simulation terminated with 100% success rate.` },
            ],
          },
        };
      });

    default:
      return [];
  }
}
