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

/** Generate 10 specialized story chapters for each officer with vehicles and maps matching their abilities. */
export function getCharacterStoryChapters(coId: string): CharacterStoryChapter[] {
  switch (coId) {
    case 'rhea': // Vanguard Instructor / Balanced Combined Arms
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Academy Drills', 'Border Patrol', 'Combined Arms 101', 'Tactical Chokepoint', 'Pincer Exercise',
          'Counter-Offensive', 'Bridgehead Assault', 'Redoubt Defense', 'Vanguard Sweep', 'Apex Instructor',
        ];
        const enemyCo = ['grimm', 'frost', 'nyx', 'volkov', 'zero', 'grimm', 'frost', 'volkov', 'seraphina', 'architect'][i];
        return {
          id: `story_rhea_${i + 1}`,
          coId: 'rhea',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Rhea's Vanguard Chapter ${i + 1}: Master balanced tactics across infantry, armor, artillery, and air support. Earn CO Pieces and level up Captain Rhea Vance!`,
          mission: {
            id: `story_rhea_m${i + 1}`,
            name: `Rhea Ch.${i + 1} — ${titles[i]}`,
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
            hint: 'Captain Rhea Vance provides reliable combined arms! Use infantry for captures and tanks as anvil.',
            briefing: [
              { who: 'rhea', text: `Chapter ${i + 1}: Captain Rhea Vance reporting. Flawless fundamentals win battles.` },
              { who: enemyCo, text: 'Let us see if your republic doctrine holds under fire!' },
            ],
            outro: [
              { who: 'rhea', text: `Chapter ${i + 1} complete! Solid tactical execution, Commander.` },
            ],
          },
        };
      });

    case 'sora': // Air Specialist
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Sky Patrol', 'Thermal Drafts', 'Clouds of Ash', 'Winged Escort', 'Interception Grid',
          'Stratosphere Supremacy', 'Thunder Sweep', 'High Altitude Breach', 'Skybreaker Strike', 'Apex Sky Dominance',
        ];
        const enemyCo = i % 2 === 0 ? 'kaelen' : 'nyx';
        return {
          id: `story_sora_${i + 1}`,
          coId: 'sora',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Sora's Air Wing Chapter ${i + 1}: Dominate the skies with Fighters, Bombers, Drones and Gunships tailored for high-altitude tactics.`,
          mission: {
            id: `story_sora_m${i + 1}`,
            name: `Sora Ch.${i + 1} — ${titles[i]}`,
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
            hint: 'Sora\'s Air Operations! Maintain air superiority with fighters, use bombers on airports, and refuel on properties.',
            briefing: [
              { who: 'sora', text: `Chapter ${i + 1}: Lieutenant Sora Akai taking flight! Air operations require precision and fuel control.` },
              { who: enemyCo, text: 'You think the sky belongs to you alone, Sora? Prove it under fire!' },
            ],
            outro: [
              { who: 'sora', text: `Chapter ${i + 1} victory! Clear skies ahead. My flight wing grows stronger.` },
            ],
          },
        };
      });

    case 'dax': // Tread / Armor Specialist
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Iron Tread', 'Steel Vanguard', 'Canyon Blitz', 'Armor Shock', 'Tank Graveyard',
          'Heavy Assault', 'Paved Thunder', 'Breakthrough Column', 'Juggernaut Line', 'Iron Supremacy',
        ];
        const enemyCo = i % 2 === 0 ? 'grimm' : 'volkov';
        return {
          id: `story_dax_${i + 1}`,
          coId: 'dax',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Dax's Armored Battalion Chapter ${i + 1}: Command heavy tank columns, APCs, and tread units with Blitz boosts.`,
          mission: {
            id: `story_dax_m${i + 1}`,
            name: `Dax Ch.${i + 1} — ${titles[i]}`,
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
            hint: 'Dax\'s Armor Column! Tread units deal +20% attack. Roll down paved roads for +1 move.',
            briefing: [
              { who: 'dax', text: `Chapter ${i + 1}: Major Dax Kord here! Time to roll heavy armor right over their defensive lines.` },
              { who: enemyCo, text: 'Tanks? My infantry horde and anti-tank guns will turn them into scrap!' },
            ],
            outro: [
              { who: 'dax', text: `Chapter ${i + 1} complete! Treads oiled, engines revved. On to the next line!` },
            ],
          },
        };
      });

    case 'mira': // Naval Specialist
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Coastal Watch', 'Saltmarch Tide', 'Reef Ambush', 'Torpedo Run', 'Monsoon Fleet',
          'Abyssal Passage', 'Storm Harbor', 'Battleship Row', 'Typhoon Surge', 'Oceanic Sovereignty',
        ];
        return {
          id: `story_mira_${i + 1}`,
          coId: 'mira',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Mira's Naval Armada Chapter ${i + 1}: Lead Battleships, Cruisers, and Subs through rain, reefs, and open ocean.`,
          mission: {
            id: `story_mira_m${i + 1}`,
            name: `Mira Ch.${i + 1} — ${titles[i]}`,
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
            hint: 'Mira\'s Naval Operations! Unaffected by rain. Cruisers screen submarines; Battleships shell from 2–6 range.',
            briefing: [
              { who: 'mira', text: `Chapter ${i + 1}: Admiral Mira Tull commanding. The sea is our domain, and rain is our shield.` },
              { who: 'volkov', text: 'You test your fleet against the General? Prepare to sink!' },
            ],
            outro: [
              { who: 'mira', text: `Chapter ${i + 1} victory! Smooth waters and decisive naval dominance.` },
            ],
          },
        };
      });

    case 'brann': // Siege / Artillery Specialist
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Range Finder', 'Long Guns', 'Spotter Grid', 'Sandstorm Barrage', 'Fortress Siege',
          'Thunder Valley', 'Over-The-Horizon', 'Rockets Red Glare', 'Chokepoint Shelling', 'Global Battery',
        ];
        return {
          id: `story_brann_${i + 1}`,
          coId: 'brann',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Brann's Siege Battery Chapter ${i + 1}: Master indirect fire with Artillery, Rockets, SAMs, and spotter networks.`,
          mission: {
            id: `story_brann_m${i + 1}`,
            name: `Brann Ch.${i + 1} — ${titles[i]}`,
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
            hint: 'Brann\'s Artillery Net! Indirect fire gets +15% attack. Screen your long guns with tanks and mechs.',
            briefing: [
              { who: 'brann', text: `Chapter ${i + 1}: Colonel Brann Hale. Patient aiming, precise artillery. Let the big guns sing.` },
              { who: 'zero', text: 'You challenge the Siege Director in long-range fire? Calculated foolishness.' },
            ],
            outro: [
              { who: 'brann', text: `Chapter ${i + 1} complete! Target eliminated cleanly. Reset the sights for the next engagement.` },
            ],
          },
        };
      });

    case 'kaelen': // Flight Captain / Air Interceptor
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'High Altitude Sortie', 'Aerial Escort', 'Cloud Interception', 'Tailwind Pursuit', 'Airborne Resupply',
          'Sky Grid Lock', 'Jetstream Breach', 'Stratosphere Duel', 'Wingman Vanguard', 'Ace Supremacy',
        ];
        const enemyCo = i % 2 === 0 ? 'sora' : 'nyx';
        return {
          id: `story_kaelen_${i + 1}`,
          coId: 'kaelen',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Kaelen's Air Interceptors Chapter ${i + 1}: Lead high-speed Fighters, Gunships and T-Copters with aerial mobility boosts.`,
          mission: {
            id: `story_kaelen_m${i + 1}`,
            name: `Kaelen Ch.${i + 1} — ${titles[i]}`,
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
            hint: 'Kaelen\'s Ace Interceptors! Air units move +1 faster and gain +15% attack.',
            briefing: [
              { who: 'kaelen', text: `Chapter ${i + 1}: Flight Captain Kaelen Vance ascending! Check fuel gauges and lock onto targets.` },
              { who: enemyCo, text: 'You think speed alone can outfly my weapons grid?' },
            ],
            outro: [
              { who: 'kaelen', text: `Chapter ${i + 1} clear! Target splashed. Sky control maintained.` },
            ],
          },
        };
      });

    case 'aria': // Cyber Officer / Electronic Warfare
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Signal Hack', 'Radar Jamming', 'Overclock Pulse', 'EM Grid Sweep', 'Cyber Disruption',
          'Matrix Lockdown', 'Nanite Protocol', 'Decryption Raid', 'System Overload', 'Apex Cyber Dominance',
        ];
        const enemyCo = i % 2 === 0 ? 'zero' : 'nyx';
        return {
          id: `story_aria_${i + 1}`,
          coId: 'aria',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Aria's Cyber Operations Chapter ${i + 1}: Disrupt enemy movement and vision with Recons, Drones, SAMs, and Cyber skills.`,
          mission: {
            id: `story_aria_m${i + 1}`,
            name: `Aria Ch.${i + 1} — ${titles[i]}`,
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
            hint: 'Aria\'s Cyber Grid! +1 Vision on all units. Use Disruptor to freeze enemy pushes.',
            briefing: [
              { who: 'aria', text: `Chapter ${i + 1}: Cyber Officer Aria Chen online. Disrupting enemy sensors now.` },
              { who: enemyCo, text: 'Your static interference won\'t hold against raw firepower!' },
            ],
            outro: [
              { who: 'aria', text: `Chapter ${i + 1} complete! Enemy systems jammed and force eliminated.` },
            ],
          },
        };
      });

    case 'grimm': // Warlord / Infantry Horde
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Human Wave', 'Infantry Horde', 'Trench Assault', 'Bazooka Rush', 'Swarm Protocol',
          'Bunker Buster', 'Mass Infiltration', 'Iron Vanguard', 'Unstoppable Horde', 'Warlord Conquest',
        ];
        const enemyCo = i % 2 === 0 ? 'rhea' : 'dax';
        return {
          id: `story_grimm_${i + 1}`,
          coId: 'grimm',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Grimm's Infantry Horde Chapter ${i + 1}: Overwhelm defenses with cheap Infantry, Mechs, APCs, and Endless Horde waves.`,
          mission: {
            id: `story_grimm_m${i + 1}`,
            name: `Grimm Ch.${i + 1} — ${titles[i]}`,
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
            hint: 'Grimm\'s Horde! Foot units deal +20% attack and cost -20%. Flood every factory and property.',
            briefing: [
              { who: 'grimm', text: `Chapter ${i + 1}: Warlord Grimm! Drown them in boots, bullets, and endless infantry!` },
              { who: enemyCo, text: 'Your horde will shatter against disciplined lines!' },
            ],
            outro: [
              { who: 'grimm', text: `Chapter ${i + 1} victory! The Dominion horde advances over their positions!` },
            ],
          },
        };
      });

    case 'frost': // Baron / Blizzard Operations
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Sub-Zero Patrol', 'Blizzard Defense', 'Glacier Breach', 'Frostbite Pass', 'Frozen Lake Run',
          'Ice Vanguard', 'Whiteout Strike', 'Cold Front Siege', 'Polar Juggernaut', 'Winter Supremacy',
        ];
        const enemyCo = i % 2 === 0 ? 'mira' : 'rhea';
        return {
          id: `story_frost_${i + 1}`,
          coId: 'frost',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Frost's Blizzard Battalion Chapter ${i + 1}: Freeze enemy columns with Snow, Heavy Armor, and Winter Storms.`,
          mission: {
            id: `story_frost_m${i + 1}`,
            name: `Frost Ch.${i + 1} — ${titles[i]}`,
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
            hint: 'Baron Frost! Completely immune to snow move penalties. Enemies freeze while you march.',
            briefing: [
              { who: 'frost', text: `Chapter ${i + 1}: Baron Frost. Winter is not coming — winter is ALREADY HERE.` },
              { who: enemyCo, text: 'We will melt your frozen armies down to slush!' },
            ],
            outro: [
              { who: 'frost', text: `Chapter ${i + 1} clear! Frozen in stone, silenced forever.` },
            ],
          },
        };
      });

    case 'nyx': // Commander / Shadow Night Raids
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Shadow Patrol', 'Night Infiltration', 'Silent Ambush', 'Fog Breach', 'Eclipse Strike',
          'Midnight Raid', 'Phantom Grid', 'Shadow Vanguard', 'Veil of Darkness', 'Apex Shadow',
        ];
        const enemyCo = i % 2 === 0 ? 'aria' : 'kaelen';
        return {
          id: `story_nyx_${i + 1}`,
          coId: 'nyx',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Nyx's Shadow Cell Chapter ${i + 1}: Strike from the Fog of War with +1 Vision, Recons, Mechs, and Drones.`,
          mission: {
            id: `story_nyx_m${i + 1}`,
            name: `Nyx Ch.${i + 1} — ${titles[i]}`,
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
            hint: 'Commander Nyx! +1 Vision and +10% attack in Fog of War. Ambush enemies from forests.',
            briefing: [
              { who: 'nyx', text: `Chapter ${i + 1}: Commander Nyx in the shadows. They won't see us until it's too late.` },
              { who: enemyCo, text: 'You think darkness will hide you from radar?' },
            ],
            outro: [
              { who: 'nyx', text: `Chapter ${i + 1} complete! Slain in darkness, vanishing before dawn.` },
            ],
          },
        };
      });

    case 'volkov': // Iron General / Heavy Assault
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Iron March', 'Crushing Column', 'Heavy Barrage', 'Dominion Shock', 'Fortress Breaker',
          'Steel Tempest', 'Red Storm Vanguard', 'Anvil Strike', 'Juggernaut March', 'Iron General Sovereignty',
        ];
        const enemyCo = i % 2 === 0 ? 'rhea' : 'brann';
        return {
          id: `story_volkov_${i + 1}`,
          coId: 'volkov',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Volkov's Heavy Brigade Chapter ${i + 1}: Lead expensive elite forces with +10% base attack & defense across all units.`,
          mission: {
            id: `story_volkov_m${i + 1}`,
            name: `Volkov Ch.${i + 1} — ${titles[i]}`,
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
            hint: 'General Volkov! All units +10% attack & defense. Higher deployment cost but devastating firepower.',
            briefing: [
              { who: 'volkov', text: `Chapter ${i + 1}: General Volkov commanding. Crushing force guarantees victory.` },
              { who: enemyCo, text: 'Your expensive war machines will burn just like the rest!' },
            ],
            outro: [
              { who: 'volkov', text: `Chapter ${i + 1} victory! Absolute strength prevails.` },
            ],
          },
        };
      });

    case 'zero': // Siege Director / Global Battery
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Siege Protocol', 'Artillery Battery', 'Long-Range Grid', 'Rockets Barrage', 'Chokepoint Shelling',
          'Mortar Network', 'Global Targeter', 'Surgical Shelling', 'Battery Sweep', 'Apex Siege Dominance',
        ];
        const enemyCo = i % 2 === 0 ? 'brann' : 'dax';
        return {
          id: `story_zero_${i + 1}`,
          coId: 'zero',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Zero's Siege Battery Chapter ${i + 1}: Crush targets from distance with indirect +15% attack & +1 range.`,
          mission: {
            id: `story_zero_m${i + 1}`,
            name: `Zero Ch.${i + 1} — ${titles[i]}`,
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
            hint: 'Siege Director Zero! Indirect fire gets +1 range and +15% attack. Screen long guns with armor.',
            briefing: [
              { who: 'zero', text: `Chapter ${i + 1}: Siege Director Zero. Calculations verified. Open long-range fire.` },
              { who: enemyCo, text: 'We will close the gap and break your artillery battery!' },
            ],
            outro: [
              { who: 'zero', text: `Chapter ${i + 1} clear! Target coordinates eradicated.` },
            ],
          },
        };
      });

    case 'seraphina': // Medic General / Nanite Frontlines
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Field Triage', 'Nanite Repair', 'Frontline Sanctuary', 'Endless Defense', 'Property Bastion',
          'Med-Evac Escort', 'Restoration Grid', 'Regenerative Surge', 'Aegis Frontline', 'Apex Medic Dominance',
        ];
        const enemyCo = i % 2 === 0 ? 'rhea' : 'mira';
        return {
          id: `story_seraphina_${i + 1}`,
          coId: 'seraphina',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Seraphina's Medic Vanguard Chapter ${i + 1}: Sustain frontline combat with property auto-heals and APC repair support.`,
          mission: {
            id: `story_seraphina_m${i + 1}`,
            name: `Seraphina Ch.${i + 1} — ${titles[i]}`,
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
              { who: 'seraphina', text: `Chapter ${i + 1}: Medic General Seraphina. Nanite triage networks initialized.` },
              { who: enemyCo, text: 'No amount of healing will save your army from total destruction!' },
            ],
            outro: [
              { who: 'seraphina', text: `Chapter ${i + 1} victory! Troops restored and field secured.` },
            ],
          },
        };
      });

    case 'architect': // Strategist Architect / AI War Matrix
      return Array.from({ length: 10 }, (_, i) => {
        const titles = [
          'Matrix Calibration', 'Singularity Calculation', 'Drone Swarm Protocol', 'War Engine Breach', 'Architect Redoubt',
          'Neural Overdrive', 'Synthetic Vanguard', 'Global Recalibration', 'Singularity Core Strike', 'Apex Architect Sovereignty',
        ];
        const enemyCo = i % 2 === 0 ? 'rhea' : 'aria';
        return {
          id: `story_architect_${i + 1}`,
          coId: 'architect',
          chapterIndex: i + 1,
          title: titles[i],
          summary: `Architect's War Engine Chapter ${i + 1}: Master ultimate AI warfare with +10% attack & defense, sandstorm immunity, and Singularity strikes.`,
          mission: {
            id: `story_architect_m${i + 1}`,
            name: `Architect Ch.${i + 1} — ${titles[i]}`,
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
            hint: 'Architect Singularity! All units gain +10% atk & def, unaffected by sandstorms.',
            briefing: [
              { who: 'architect', text: `Chapter ${i + 1}: Architect AI core engaged. Probability of victory: 99.8%.` },
              { who: enemyCo, text: 'We will dismantle your machine intelligence piece by piece!' },
            ],
            outro: [
              { who: 'architect', text: `Chapter ${i + 1} calculation complete. Enemy force eradicated.` },
            ],
          },
        };
      });

    default:
      return [];
  }
}
