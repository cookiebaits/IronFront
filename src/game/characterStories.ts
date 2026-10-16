import { COS } from './data';
import type { MissionDef, Team, UnitType } from './types';

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
    case 'sora': // Air Specialist
      return Array.from({ length: 10 }, (_, i) => ({
        id: `story_sora_${i + 1}`,
        coId: 'sora',
        chapterIndex: i + 1,
        title: [
          'Sky Patrol', 'Thermal Drafts', 'Clouds of Ash', 'Winged Escort', 'Interception Grid',
          'Stratosphere Supremacy', 'Thunder Sweep', 'High Altitude Breach', 'Skybreaker Strike', 'Apex Sky Dominance',
        ][i],
        summary: `Sora's Air Wing Chapter ${i + 1}: Dominate the skies with Fighters, Bombers, Drones and Gunships tailored for high-altitude tactics.`,
        mission: {
          id: `story_sora_m${i + 1}`,
          name: `Sora Ch.${i + 1} — ${['Sky Patrol', 'Thermal Drafts', 'Clouds of Ash', 'Winged Escort', 'Interception Grid', 'Stratosphere Supremacy', 'Thunder Sweep', 'High Altitude Breach', 'Skybreaker Strike', 'Apex Sky Dominance'][i]}`,
          act: 1,
          par: 8 + i,
          map: sym(['mmf.f.A.', 'mH=c...m', 'mB==A...', '.A.=.t..', '...====.', 'fc..f...', 'm..c..f.', '..f.=...', 'mm..f...']),
          units: mir(16, [
            ['fighter', 2, 1], ['bomber', 3, 2], ['bcopter', 4, 3], ['gundrone', 2, 4], ['drone', 1, 5],
          ], [['bomber', 13, 5], ['drone', 14, 2], ['fighter', 12, 1]]),
          cos: ['sora'],
          enemyCo: i % 2 === 0 ? 'kaelen' : 'nyx',
          funds: [5000 + i * 500, 6000 + i * 500],
          weather: i % 3 === 1 ? 'snow' : 'clear',
          fog: false,
          unitCap: [16, 18],
          objective: { type: 'rout' },
          aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
          hint: 'Sora\'s Air Operations! Maintain air superiority with fighters, use bombers on airports, and refuel on properties.',
          briefing: [
            { who: 'sora', text: `Chapter ${i + 1}: Lieutenant Sora Akai taking flight! Air operations require precision and fuel control.` },
            { who: i % 2 === 0 ? 'kaelen' : 'nyx', text: 'You think the sky belongs to you alone, Sora? Prove it under fire!' },
          ],
          outro: [
            { who: 'sora', text: `Chapter ${i + 1} victory! Clear skies ahead. My flight wing grows stronger.` },
          ],
        },
      }));

    case 'dax': // Tread / Armor Specialist
      return Array.from({ length: 10 }, (_, i) => ({
        id: `story_dax_${i + 1}`,
        coId: 'dax',
        chapterIndex: i + 1,
        title: [
          'Iron Tread', 'Steel Vanguard', 'Canyon Blitz', 'Armor Shock', 'Tank Graveyard',
          'Heavy Assault', 'Paved Thunder', 'Breakthrough Column', 'Juggernaut Line', 'Iron Supremacy',
        ][i],
        summary: `Dax's Armored Battalion Chapter ${i + 1}: Command heavy tank columns, APCs, and tread units with Blitz boosts.`,
        mission: {
          id: `story_dax_m${i + 1}`,
          name: `Dax Ch.${i + 1} — ${['Iron Tread', 'Steel Vanguard', 'Canyon Blitz', 'Armor Shock', 'Tank Graveyard', 'Heavy Assault', 'Paved Thunder', 'Breakthrough Column', 'Juggernaut Line', 'Iron Supremacy'][i]}`,
          act: 1,
          par: 8 + i,
          map: sym(['mmmff..', 'mH=..f.', 'mB=c...', 'm.=..m.', '..===.=', 'fc.m...', 'm..f.c.', 'mm.t.f.', 'mmm.mm.']),
          units: mir(14, [
            ['tank', 3, 1], ['tank', 4, 4], ['heavy', 2, 3], ['apc', 2, 5], ['infantry', 4, 2], ['artillery', 1, 3], ['aa', 3, 6],
          ], [['heavy', 9, 3], ['tank', 10, 4]]),
          cos: ['dax'],
          enemyCo: i % 2 === 0 ? 'grimm' : 'volkov',
          funds: [5000 + i * 500, 6000 + i * 500],
          weather: 'clear',
          fog: false,
          unitCap: [16, 18],
          objective: { type: 'rout' },
          aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
          hint: 'Dax\'s Armor Column! Tread units deal +20% attack. Roll down paved roads for +1 move.',
          briefing: [
            { who: 'dax', text: `Chapter ${i + 1}: Major Dax Kord here! Time to roll heavy armor right over their defensive lines.` },
            { who: i % 2 === 0 ? 'grimm' : 'volkov', text: 'Tanks? My infantry horde and anti-tank guns will turn them into scrap!' },
          ],
          outro: [
            { who: 'dax', text: `Chapter ${i + 1} complete! Treads oiled, engines revved. On to the next line!` },
          ],
        },
      }));

    case 'mira': // Naval Specialist
      return Array.from({ length: 10 }, (_, i) => ({
        id: `story_mira_${i + 1}`,
        coId: 'mira',
        chapterIndex: i + 1,
        title: [
          'Coastal Watch', 'Saltmarch Tide', 'Reef Ambush', 'Torpedo Run', 'Monsoon Fleet',
          'Abyssal Passage', 'Storm Harbor', 'Battleship Row', 'Typhoon Surge', 'Oceanic Sovereignty',
        ][i],
        summary: `Mira's Naval Armada Chapter ${i + 1}: Lead Battleships, Cruisers, and Subs through rain, reefs, and open ocean.`,
        mission: {
          id: `story_mira_m${i + 1}`,
          name: `Mira Ch.${i + 1} — ${['Coastal Watch', 'Saltmarch Tide', 'Reef Ambush', 'Torpedo Run', 'Monsoon Fleet', 'Abyssal Passage', 'Storm Harbor', 'Battleship Row', 'Typhoon Surge', 'Oceanic Sovereignty'][i]}`,
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
      }));

    case 'brann': // Siege / Artillery Specialist
      return Array.from({ length: 10 }, (_, i) => ({
        id: `story_brann_${i + 1}`,
        coId: 'brann',
        chapterIndex: i + 1,
        title: [
          'Range Finder', 'Long Guns', 'Spotter Grid', 'Sandstorm Barrage', 'Fortress Siege',
          'Thunder Valley', 'Over-The-Horizon', 'Rockets Red Glare', 'Chokepoint Shelling', 'Global Battery',
        ][i],
        summary: `Brann's Siege Battery Chapter ${i + 1}: Master indirect fire with Artillery, Rockets, SAMs, and spotter networks.`,
        mission: {
          id: `story_brann_m${i + 1}`,
          name: `Brann Ch.${i + 1} — ${['Range Finder', 'Long Guns', 'Spotter Grid', 'Sandstorm Barrage', 'Fortress Siege', 'Thunder Valley', 'Over-The-Horizon', 'Rockets Red Glare', 'Chokepoint Shelling', 'Global Battery'][i]}`,
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
      }));

    default: // Generic / Rhea / Others
      return Array.from({ length: 10 }, (_, i) => ({
        id: `story_${coId}_${i + 1}`,
        coId,
        chapterIndex: i + 1,
        title: [
          'Tactical Readiness', 'Border Patrol', 'Field Command', 'Chokepoint Mastery', 'Combined Arms',
          'Vanguard Assault', 'Relay Defense', 'Counter Strike', 'Iron Defense', 'Apex Vanguard',
        ][i],
        summary: `${COS[coId]?.name ?? coId}'s Story Chapter ${i + 1}: Master combined arms tactics with a balanced force.`,
        mission: {
          id: `story_${coId}_m${i + 1}`,
          name: `${COS[coId]?.name.split(' ')[0] ?? coId} Ch.${i + 1} — ${['Tactical Readiness', 'Border Patrol', 'Field Command', 'Chokepoint Mastery', 'Combined Arms', 'Vanguard Assault', 'Relay Defense', 'Counter Strike', 'Iron Defense', 'Apex Vanguard'][i]}`,
          act: 1,
          par: 8 + i,
          map: sym(['mmf..f.', 'mH=c...', 'fB=d..c', '..f=.f.', '.c.dddd', 'f..f...', 'mm.c.ff', '.f...t.', 'mmm.f..']),
          units: mir(14, [
            ['infantry', 4, 1], ['tank', 4, 2], ['recon', 2, 5], ['artillery', 2, 3], ['mech', 4, 3],
          ], [['tank', 9, 3]]),
          cos: [coId],
          enemyCo: i % 2 === 0 ? 'grimm' : 'frost',
          funds: [4000 + i * 500, 4000 + i * 500],
          weather: 'clear',
          fog: false,
          unitCap: [14, 16],
          objective: { type: 'rout' },
          aiLevel: Math.min(3, 1 + Math.floor(i / 3)),
          hint: 'Combined Arms! Balance infantry capture, armor pushes, and artillery support.',
          briefing: [
            { who: coId, text: `Chapter ${i + 1}: ${COS[coId]?.name} leading the field. Execute combined arms strategy!` },
            { who: i % 2 === 0 ? 'grimm' : 'frost', text: 'You won\'t stand against our forces today!' },
          ],
          outro: [
            { who: coId, text: `Chapter ${i + 1} complete! Flawless command and tactical victory.` },
          ],
        },
      }));
  }
}
