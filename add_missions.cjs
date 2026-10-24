const fs = require('fs');

const path = 'src/game/campaign.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Insert Acts
const actMatch = code.match(/export const ACTS = \[(.*?)\];/s);
if (!actMatch) throw new Error('ACTS not found');
const existingActsStr = actMatch[1];
const newActs = [
  'Act XXI — The Crimson Rebellion',
  'Act XXII — Naval Blockade',
  'Act XXIII — The Desert Scourge',
  'Act XXIV — Aerial Dominance',
  'Act XXV — The Frozen Tundra',
  'Act XXVI — Cyber Overload',
  'Act XXVII — The Shadow War',
  'Act XXVIII — Nanite Plague',
  'Act XXIX — Architects Echo',
  'Act XXX — Sovereign Core',
  'Act XXXI — The Last Alliance',
  'Act XXXII — Eternal Peace'
];
const newActsStr = newActs.map(a => `'${a}'`).join(', ');
code = code.replace(actMatch[0], `export const ACTS = [${existingActsStr}, ${newActsStr}];`);

// 2. Insert Act Intros
const actIntroMatch = code.match(/export const ACT_INTROS = \[\n([\s\S]*?)\];/);
if (!actIntroMatch) throw new Error('ACT_INTROS not found');
const newIntros = [
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
  'Eternal Peace: The apocalyptic final battles against the Omega Titan. Bring true peace to the world.'
];
const newIntrosStr = newIntros.map(a => `  '${a}',`).join('\n');
code = code.replace(actIntroMatch[0], `export const ACT_INTROS = [\n${actIntroMatch[1]}${newIntrosStr}\n];`);

// 3. Insert Missions
// Find the end of the MISSIONS array
const missionsEndIndex = code.indexOf('];\n\n/** First-clear skill rewards');
if (missionsEndIndex === -1) throw new Error('MISSIONS end not found');

let newMissions = [];
let actIndex = 21; // Since original ends at Act 20 (index 20)

for (let i = 38; i <= 74; i++) {
  // Determine act and enemy/ally based on the arc
  if (i === 41) actIndex++;
  if (i === 44) actIndex++;
  if (i === 47) actIndex++;
  if (i === 50) actIndex++;
  if (i === 53) actIndex++;
  if (i === 56) actIndex++;
  if (i === 59) actIndex++;
  if (i === 62) actIndex++;
  if (i === 66) actIndex++;
  if (i === 69) actIndex++;
  if (i === 72) actIndex++;

  let enemyCo = 'grimm';
  let enemyCo2 = undefined;
  let allyCo = undefined;
  let weather = "'clear'";
  let map = "sym(['mmf...f..', 'mH=c...m.', 'fB==..f..', '..f=..c..', '.A.====..', 'f..c.f...', 'mm.f..m..', '...=c....', 'mm..f....'])";
  let objective = "{ type: 'rout' }";
  let unitsStr = "mir(16, [['infantry', 3, 1], ['tank', 4, 2], ['recon', 2, 5]], [['artillery', 12, 6], ['tank', 11, 3]])";
  let funds = "[6000, 6000]";
  let weatherPool = undefined;
  let adaptive = "";

  if (actIndex === 21) {
    enemyCo = 'grimm'; enemyCo2 = 'volkov'; allyCo = 'dax'; weather = "'rain'"; weatherPool = "['rain', 'clear']";
    unitsStr = "mir(16, [['infantry', 3, 1], ['heavy', 4, 3], ['artillery', 2, 5]], [['heavy', 11, 4], ['rockets', 12, 6], ['tank', 10, 2]])";
  } else if (actIndex === 22) {
    enemyCo = 'volkov'; allyCo = 'mira'; weather = "'clear'"; weatherPool = "['clear', 'rain']";
    map = "sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...'])";
    unitsStr = "mir(16, [['battleship', 0, 5], ['cruiser', 1, 7], ['sub', 2, 8]], [['battleship', 15, 6], ['cruiser', 14, 2]])";
  } else if (actIndex === 23) {
    enemyCo = 'zero'; weather = "'sand'"; weatherPool = "['sand']";
    unitsStr = "mir(16, [['mech', 3, 1], ['tank', 4, 4], ['artillery', 2, 5]], [['rockets', 12, 6], ['artillery', 11, 2]])";
  } else if (actIndex === 24) {
    enemyCo = 'kaelen'; allyCo = 'sora'; weather = "'clear'";
    map = "sym(['mmmf..A.', 'mZ=....m', 'f..A.f..', '..f..f..', '.A......', 'f....f..', 'm..f....', '....A...', 'mmm.f...'])";
    unitsStr = "mir(16, [['fighter', 2, 1], ['bomber', 3, 2], ['bcopter', 4, 3]], [['fighter', 13, 2], ['bomber', 14, 5]])";
  } else if (actIndex === 25) {
    enemyCo = 'architect'; allyCo = 'frost'; weather = "'snow'"; weatherPool = "['snow']";
    unitsStr = "mir(16, [['tank', 3, 1], ['heavy', 4, 4]], [['heavy', 11, 3], ['mech', 12, 5]])";
  } else if (actIndex === 26) {
    enemyCo = 'aria'; weather = "'rain'";
    unitsStr = "mir(16, [['infantry', 3, 1], ['recon', 4, 2], ['drone', 5, 5]], [['gundrone', 12, 4], ['drone', 11, 6]])";
  } else if (actIndex === 27) {
    enemyCo = 'nyx'; enemyCo2 = 'zero'; weather = "'rain'"; weatherPool = "['rain', 'clear']";
    unitsStr = "mir(16, [['recon', 2, 2], ['tank', 4, 4], ['artillery', 3, 5]], [['rockets', 13, 7], ['heavy', 11, 3]])";
  } else if (actIndex === 28) {
    enemyCo = 'seraphina'; weather = "'clear'";
    unitsStr = "mir(16, [['infantry', 3, 1], ['heavy', 4, 3], ['bomber', 5, 6]], [['heavy', 12, 4], ['aa', 11, 2]])";
  } else if (actIndex === 29) {
    enemyCo = 'architect'; weather = "'sand'"; weatherPool = "['sand', 'rain']";
    unitsStr = "mir(16, [['battleship', 0, 5], ['tank', 4, 2], ['artillery', 2, 5]], [['heavy', 12, 4], ['battleship', 15, 6]])";
    map = "sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...'])";
  } else if (actIndex === 30) {
    enemyCo = 'architect'; allyCo = 'sora'; weather = "'snow'";
    map = "sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...'])";
    unitsStr = "mir(16, [['fighter', 2, 1], ['bomber', 3, 2], ['heavy', 4, 5]], [['bomber', 14, 5], ['heavy', 12, 3]])";
  } else if (actIndex === 31) {
    enemyCo = 'architect'; enemyCo2 = 'aria'; allyCo = 'volkov'; weather = "'clear'"; weatherPool = "['clear', 'snow']";
    unitsStr = "mir(16, [['heavy', 3, 2], ['heavy', 4, 4], ['rockets', 2, 6]], [['heavy', 12, 3], ['rockets', 11, 6], ['bomber', 13, 2]])";
  } else if (actIndex === 32) {
    enemyCo = 'architect'; enemyCo2 = 'architect'; allyCo = 'brann'; weather = "'clear'"; weatherPool = "['clear', 'sand', 'snow', 'rain']";
    unitsStr = "mir(16, [['battleship', 0, 5], ['heavy', 4, 2], ['rockets', 3, 4], ['bomber', 2, 6]], [['heavy', 11, 3], ['battleship', 15, 7], ['bomber', 13, 2]])";
    map = "sym(['wwsmmf..', 'wP=H=c..', 'wws.B=..', 'wwsfA.=t', 'rws.c...', 'wws.====', 'wwsf..c.', 'wPs.B=..', 'wwsmf...'])";
    if (i === 74) {
      adaptive = "boss: { x: 12, y: 4, team: 1, type: 'heavy', name: 'OMEGA TITAN', hp: 100, phases: 8 },\n    adaptiveTrigger: { bossPhaseBreak: true, reinforcements: [['bomber', 2, 3, 0], ['heavy', 2, 4, 0], ['battleship', 0, 6, 0]], fundsBonus: [20000, 0] },\n    adaptiveObjective: { type: 'rout' },\n    adaptiveDialogue: [{ who: 'architect', text: 'TITAN SHIELDS COMPROMISED. INITIATING FINAL WIPE.' }, { who: 'rhea', text: 'All allied forces, strike now!!' }],";
    }
  }

  let m = `  {
    id: 'm${i}', name: 'Mission ${i}', act: ${actIndex}, par: 15, cos: ['rhea', 'dax', 'sora', 'mira', 'brann'], enemyCo: '${enemyCo}'${enemyCo2 ? `, enemyCo2: '${enemyCo2}'` : ''}${allyCo ? `, allyCo: '${allyCo}'` : ''},
    map: ${map},
    units: ${unitsStr},
    funds: ${funds}, weather: ${weather}${weatherPool ? `, weatherPool: ${weatherPool}` : ''}, fog: ${i % 3 === 0 ? 'true' : 'false'}, unitCap: [24, 28], objective: ${objective},
    ${adaptive}
    aiLevel: 3,
    hint: 'Command your forces effectively to overcome the enemy strategy.',
    briefing: [
      { who: 'narrator', text: 'The war continues...' },
      { who: 'rhea', text: 'Commander, the enemy is entrenched. We must break their lines.' },
    ],
    outro: [
      { who: 'rhea', text: 'Mission accomplished. Let us move to the next sector.' }
    ],
  },`;
  newMissions.push(m);
}

const finalMissionsStr = '\n' + newMissions.join('\n') + '\n';
code = code.substring(0, missionsEndIndex) + finalMissionsStr + code.substring(missionsEndIndex);

// 4. Update REWARDS
const rewardsMatch = code.match(/export const REWARDS: Record<string, string> = {([\s\S]*?)};/);
if (!rewardsMatch) throw new Error('REWARDS not found');
let rewardsInner = rewardsMatch[1];
let newRewards = [];
const skills = ['rally', 'rain', 'fortify', 'snow', 'repair', 'barrage', 'emp', 'warbonds', 'tempest', 'strike', 'bombard', 'meteor', 'clear', 'blitz', 'whiteout', 'fury', 'airstrike', 'stealth', 'overdrive', 'nanite', 'orbital', 'aegis', 'supply'];
for (let i = 38; i <= 74; i++) {
  newRewards.push(`m${i}: '${skills[i % skills.length]}'`);
}
const rewardsReplacement = rewardsInner.trim() + ',\n  ' + newRewards.join(', ') + '\n';
code = code.replace(rewardsMatch[1], '\n  ' + rewardsReplacement);

fs.writeFileSync(path, code);
console.log("Successfully generated 37 new missions.");
