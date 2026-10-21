import type { ArmorClass, Category, ModId, MoveType, Owner, TerrainType, UnitDef, UnitType, Weather } from './types';

export const TERRAIN: Record<TerrainType, { name: string; def: number; prop: boolean; income: boolean }> = {
  plain: { name: 'Fields', def: 0, prop: false, income: false },
  forest: { name: 'Forest', def: 2, prop: false, income: false },
  mountain: { name: 'Mountain', def: 4, prop: false, income: false },
  road: { name: 'Road', def: 0, prop: false, income: false },
  dirt_road: { name: 'Dirt Road', def: 0, prop: false, income: false },
  bridge: { name: 'Bridge', def: 0, prop: false, income: false },
  river: { name: 'River', def: 0, prop: false, income: false },
  sea: { name: 'Sea', def: 0, prop: false, income: false },
  shoal: { name: 'Shoal', def: 0, prop: false, income: false },
  reef: { name: 'Reef', def: 1, prop: false, income: false },
  city: { name: 'City', def: 3, prop: true, income: true },
  base: { name: 'Base', def: 3, prop: true, income: true },
  airport: { name: 'Airport', def: 3, prop: true, income: true },
  port: { name: 'Port', def: 3, prop: true, income: true },
  hq: { name: 'HQ', def: 4, prop: true, income: true },
  tower: { name: 'Radio Tower', def: 3, prop: true, income: false },
};

export const CHAR_MAP: Record<string, { t: TerrainType; owner: Owner }> = {
  '.': { t: 'plain', owner: -1 },
  f: { t: 'forest', owner: -1 },
  m: { t: 'mountain', owner: -1 },
  '=': { t: 'road', owner: -1 },
  d: { t: 'dirt_road', owner: -1 },
  '#': { t: 'bridge', owner: -1 },
  '~': { t: 'river', owner: -1 },
  w: { t: 'sea', owner: -1 },
  s: { t: 'shoal', owner: -1 },
  r: { t: 'reef', owner: -1 },
  c: { t: 'city', owner: -1 },
  C: { t: 'city', owner: 0 },
  X: { t: 'city', owner: 1 },
  b: { t: 'base', owner: -1 },
  B: { t: 'base', owner: 0 },
  Y: { t: 'base', owner: 1 },
  a: { t: 'airport', owner: -1 },
  A: { t: 'airport', owner: 0 },
  Z: { t: 'airport', owner: 1 },
  p: { t: 'port', owner: -1 },
  P: { t: 'port', owner: 0 },
  Q: { t: 'port', owner: 1 },
  t: { t: 'tower', owner: -1 },
  T: { t: 'tower', owner: 0 },
  V: { t: 'tower', owner: 1 },
  H: { t: 'hq', owner: 0 },
  E: { t: 'hq', owner: 1 },
};

const INF = Infinity;
const LAND1: Record<MoveType, number> = { foot: 1, mech: 1, treads: 1, tires: 1, air: 1, sea: INF };
export const MOVE_COST: Record<TerrainType, Record<MoveType, number>> = {
  plain: { foot: 1, mech: 1, treads: 1, tires: 1, air: 1, sea: INF },
  forest: { foot: 1, mech: 1, treads: 1, tires: 1, air: 1, sea: INF },
  mountain: { foot: 2, mech: 2, treads: INF, tires: INF, air: 1, sea: INF },
  road: LAND1, dirt_road: LAND1, bridge: LAND1, city: LAND1, base: LAND1, airport: LAND1, hq: LAND1, tower: LAND1,
  port: { foot: 1, mech: 1, treads: 1, tires: 1, air: 1, sea: 1 },
  river: { foot: 2, mech: 1, treads: INF, tires: INF, air: 1, sea: INF },
  sea: { foot: INF, mech: INF, treads: INF, tires: INF, air: 1, sea: 1 },
  shoal: { foot: 1, mech: 1, treads: 1, tires: 1, air: 1, sea: INF },
  reef: { foot: INF, mech: INF, treads: INF, tires: INF, air: 1, sea: 2 },
};

export function weatherCost(base: number, mt: MoveType, t: TerrainType, w: Weather): number {
  if (!isFinite(base)) return base;
  if (w === 'snow') {
    if (mt === 'air') return 2;
    if (mt === 'sea' && t === 'sea') return 2;
    if (mt === 'foot' && (t === 'plain' || t === 'mountain')) return base + 1;
    if ((mt === 'treads' || mt === 'tires') && t === 'plain') return base + 1;
  } else if (w === 'sand') {
    if (mt === 'tires' && (t === 'plain' || t === 'shoal')) return base + 1;
  }
  return base;
}

export const WEATHER_INFO: Record<Weather, { name: string; icon: string; desc: string }> = {
  clear: { name: 'Clear', icon: '☀️', desc: 'No effects.' },
  rain: { name: 'Rain', icon: '🌧️', desc: 'Air −10% attack. Vision −1.' },
  snow: { name: 'Snow', icon: '❄️', desc: 'Most ground +1 move cost. Air & sea move cost 2. Defense −10%.' },
  sand: { name: 'Sandstorm', icon: '🌪️', desc: 'All attacks −10%. Indirect max range −1. Air −20% attack.' },
};

export const UNITS: Record<UnitType, UnitDef> = {
  infantry: { name: 'Infantry', cost: 1000, move: 3, moveType: 'foot', armor: 'INF', cat: 'infantry', range: [1, 1], vision: 2, capture: true,
    dmg: { INF: 55, LIGHT: 14, TANK: 5, HEAVY: 1, HELI: 8 }, desc: 'Cheap foot soldiers. Capture properties. Strong from forests & mountains.' },
  mech: { name: 'Mech', cost: 2500, move: 2, moveType: 'mech', armor: 'INF', cat: 'infantry', range: [1, 1], vision: 2, capture: true,
    dmg: { INF: 65, LIGHT: 75, TANK: 55, HEAVY: 15, HELI: 9 }, desc: 'Bazooka troops. Cross rivers & mountains easily. Anti-armor.' },
  recon: { name: 'Recon', cost: 3800, move: 8, moveType: 'tires', armor: 'LIGHT', cat: 'vehicle', range: [1, 1], vision: 5,
    dmg: { INF: 75, LIGHT: 38, TANK: 6, HEAVY: 1, HELI: 12 }, desc: 'Fast scout with long vision. Shreds infantry.' },
  apc: { name: 'APC', cost: 5000, move: 6, moveType: 'treads', armor: 'LIGHT', cat: 'vehicle', range: [1, 1], vision: 2, carry: ['infantry', 'mech'], supply: true,
    dmg: {}, desc: 'Carries 1 foot unit. Repairs adjacent allies +1 HP each turn.' },
  tank: { name: 'Tank', cost: 7000, move: 6, moveType: 'treads', armor: 'TANK', cat: 'vehicle', range: [1, 1], vision: 3,
    dmg: { INF: 75, LIGHT: 70, TANK: 55, HEAVY: 15, HELI: 10, SHIP: 5 }, desc: 'Versatile main battle tank.' },
  heavy: { name: 'Heavy Tank', cost: 16000, move: 5, moveType: 'treads', armor: 'HEAVY', cat: 'vehicle', range: [1, 1], vision: 1,
    dmg: { INF: 105, LIGHT: 95, TANK: 85, HEAVY: 55, HELI: 12, SHIP: 15 }, desc: 'Armored juggernaut. Slow but devastating.' },
  artillery: { name: 'Artillery', cost: 6000, move: 5, moveType: 'treads', armor: 'LIGHT', cat: 'artillery', range: [2, 3], vision: 1, indirect: true,
    dmg: { INF: 90, LIGHT: 80, TANK: 70, HEAVY: 45, SHIP: 55, SUB: 55 }, desc: 'Indirect fire 2–3. Cannot move and fire.' },
  rockets: { name: 'Rockets', cost: 15000, move: 2, moveType: 'tires', armor: 'LIGHT', cat: 'artillery', range: [1, 6], vision: 2, indirect: true,
    dmg: { INF: 95, LIGHT: 90, TANK: 80, HEAVY: 60, HELI: 70, PLANE: 50, SHIP: 65, SUB: 65 }, desc: 'Barrage range 1–6, hits ground, air & sea. Cannot move and fire.' },
  aa: { name: 'Anti-Air', cost: 7500, move: 6, moveType: 'treads', armor: 'LIGHT', cat: 'vehicle', range: [1, 1], vision: 2,
    dmg: { INF: 110, LIGHT: 55, TANK: 25, HEAVY: 10, HELI: 125, PLANE: 70 }, desc: 'Flak cannons. Deadly to aircraft and infantry.' },
  missiles: { name: 'Missiles', cost: 12000, move: 4, moveType: 'tires', armor: 'LIGHT', cat: 'artillery', range: [3, 5], vision: 5, indirect: true,
    dmg: { HELI: 120, PLANE: 100 }, desc: 'Long-range SAM. Air targets only.' },
  drone: { name: 'Drone', cost: 4000, move: 7, moveType: 'air', armor: 'HELI', cat: 'air', range: [1, 1], vision: 4, fuel: 18,
    dmg: { INF: 45, LIGHT: 30, TANK: 12, HEAVY: 5, HELI: 35, SHIP: 8 }, desc: 'Cheap flying harasser with long vision.' },
  gundrone: { name: 'Gun Drone', cost: 5500, move: 7, moveType: 'air', armor: 'HELI', cat: 'air', range: [1, 1], vision: 3, fuel: 18,
    dmg: { INF: 85, LIGHT: 50, TANK: 12, HEAVY: 5, HELI: 60, PLANE: 20, SHIP: 6 }, desc: 'Twin machine-gun drone. Shreds infantry, light vehicles & copters.' },
  tcopter: { name: 'T-Copter', cost: 4800, move: 5, moveType: 'air', armor: 'HELI', cat: 'air', range: [1, 1], vision: 2, fuel: 25, carry: ['infantry', 'mech'],
    dmg: {}, desc: 'Transport helicopter. Carries 1 foot unit over any terrain.' },
  bcopter: { name: 'Gunship', cost: 9000, move: 5, moveType: 'air', armor: 'HELI', cat: 'air', range: [1, 1], vision: 3, fuel: 18,
    dmg: { INF: 75, LIGHT: 60, TANK: 55, HEAVY: 25, HELI: 65, SHIP: 25, SUB: 25 }, desc: 'Attack helicopter. Ignores terrain.' },
  fighter: { name: 'Fighter', cost: 20000, move: 8, moveType: 'air', armor: 'PLANE', cat: 'air', range: [1, 1], vision: 2, fuel: 18,
    dmg: { HELI: 100, PLANE: 60 }, desc: 'Air superiority jet. Attacks aircraft only.' },
  bomber: { name: 'Bomber', cost: 22000, move: 6, moveType: 'air', armor: 'PLANE', cat: 'air', range: [1, 1], vision: 2, fuel: 18,
    dmg: { INF: 110, LIGHT: 100, TANK: 105, HEAVY: 95, SHIP: 75, SUB: 95 }, desc: 'Heavy bomber. Obliterates ground & sea.' },
  cruiser: { name: 'Cruiser', cost: 18000, move: 6, moveType: 'sea', armor: 'SHIP', cat: 'naval', range: [1, 1], vision: 3, fuel: 25,
    dmg: { HELI: 115, PLANE: 65, SUB: 90, SHIP: 25 }, desc: 'Escort ship. Hunts subs and aircraft.' },
  sub: { name: 'Submarine', cost: 20000, move: 5, moveType: 'sea', armor: 'SUB', cat: 'naval', range: [1, 1], vision: 5, fuel: 20,
    dmg: { SHIP: 75, SUB: 55 }, desc: 'Stealth hunter-killer of ships.' },
  battleship: { name: 'Battleship', cost: 26000, move: 5, moveType: 'sea', armor: 'SHIP', cat: 'naval', range: [2, 6], vision: 2, fuel: 25, indirect: true,
    dmg: { INF: 95, LIGHT: 90, TANK: 75, HEAVY: 55, SHIP: 50, SUB: 65 }, desc: 'Massive naval guns, range 2–6.' },
};

export const UNIT_ORDER: UnitType[] = [
  'infantry', 'mech', 'recon', 'apc', 'tank', 'heavy', 'artillery', 'rockets', 'aa', 'missiles',
  'drone', 'gundrone', 'tcopter', 'bcopter', 'fighter', 'bomber', 'cruiser', 'sub', 'battleship',
];

/* ---------------- Unit upgrade tracks (every upgrade has a trade-off) ---------------- */
import type { TrackId, UnitUps } from './types';
export const TRACK_ORDER: TrackId[] = ['fire', 'armor', 'mobility', 'economy', 'range', 'tactical', 'veterancy', 'logistics'];
export const TRACKS: Record<TrackId, { name: string; icon: string; up: string; down: string; indirectOnly?: boolean }> = {
  fire: { name: 'Firepower', icon: '💥', up: '+10% attack / lvl', down: '+8% deploy cost / lvl' },
  armor: { name: 'Heavy Plating', icon: '🛡️', up: '+12% defense / lvl', down: '−1 move at Lv2+, +4% cost / lvl' },
  mobility: { name: 'Light Frame', icon: '⚙️', up: '+1 move (Lv1, Lv3, Lv5), +1 vision / lvl', down: '−7% defense / lvl' },
  economy: { name: 'Mass Production', icon: '🏭', up: '−10% deploy cost / lvl', down: '−6% attack, −3% defense / lvl' },
  range: { name: 'Extended Barrel', icon: '🎯', up: '+1 max range / lvl', down: '−1 move at Lv2+, +10% cost / lvl', indirectOnly: true },
  tactical: { name: 'Tactical Subsystems', icon: '📡', up: '+10% skill charge speed / lvl', down: '+5% deploy cost / lvl' },
  veterancy: { name: 'Veterancy', icon: '⭐', up: '+5% attack & +15% veteran exp / lvl', down: '+6% deploy cost / lvl' },
  logistics: { name: 'Logistics', icon: '📦', up: '+20% fuel/ammo & +5% income bonus', down: '−3% defense / lvl' },
};
export const TRACK_PRICE = [600, 1200, 2200, 3800, 6000];
export const TRACK_MAX = 5;

export function upgradeEffects(u: UnitUps | undefined, indirect: boolean) {
  const f = u?.fire ?? 0, a = u?.armor ?? 0, m = u?.mobility ?? 0, e = u?.economy ?? 0, r = indirect ? u?.range ?? 0 : 0, t = u?.tactical ?? 0, v = u?.veterancy ?? 0, l = u?.logistics ?? 0;
  return {
    atk: f * 10 - e * 6 + v * 5,
    def: a * 12 - m * 7 - e * 3 - l * 3,
    move: (a >= 2 ? -1 : 0) + [0, 1, 1, 2, 2, 3][Math.min(5, m)] + (r >= 2 ? -1 : 0),
    vision: m,
    rmax: r,
    tacticalCharge: t * 10,
    costMul: Math.max(0.5, 1 + f * 0.08 + a * 0.04 - e * 0.1 + r * 0.1 + t * 0.05 + v * 0.06),
  };
}

/* ---------------- CO tactical skills (stronger = longer charge) ---------------- */
export interface SkillDef {
  id: string; name: string; icon: string; cost: number; price: number; kind: 'Boost' | 'Weather' | 'Global Damage' | 'Support' | 'Control';
  desc: string; atk?: number; def?: number; move?: number; heal?: number; dmg?: number; weather?: Weather; days?: number; debuff?: number; funds?: number; clusters?: number; clusterDmg?: number;
}
export const SKILLS: Record<string, SkillDef> = {
  clear: { id: 'clear', name: 'Clear Skies', icon: '☀️', cost: 20, price: 350, kind: 'Weather', weather: 'clear', days: 2, desc: 'Clear weather for 2 days. Cancels enemy storms.' },
  rain: { id: 'rain', name: 'Rain Dance', icon: '🌧️', cost: 30, price: 600, kind: 'Weather', weather: 'rain', days: 2, desc: 'Enemy-only rain restrictions for 2 days. Weakens enemy air and vision.' },
  rally: { id: 'rally', name: 'Rally', icon: '📣', cost: 35, price: 600, kind: 'Boost', atk: 10, move: 1, desc: 'All units +1 move, +10% attack.' },
  snow: { id: 'snow', name: 'Cold Front', icon: '❄️', cost: 40, price: 750, kind: 'Weather', weather: 'snow', days: 2, desc: 'Enemy-only snow restrictions for 2 days. Slows the enemy army.' },
  sand: { id: 'sand', name: 'Dust Storm', icon: '🌪️', cost: 40, price: 750, kind: 'Weather', weather: 'sand', days: 2, desc: 'Enemy-only sandstorm: −10% attack and shorter enemy ranged fire.' },
  fortify: { id: 'fortify', name: 'Iron Wall', icon: '🛡️', cost: 40, price: 750, kind: 'Boost', def: 35, desc: 'All units +35% defense.' },
  warbonds: { id: 'warbonds', name: 'War Bonds', icon: '💰', cost: 45, price: 900, kind: 'Support', funds: 3, desc: 'Gain funds equal to 3 days of income.' },
  blitz: { id: 'blitz', name: 'Blitz', icon: '💨', cost: 50, price: 1000, kind: 'Boost', move: 2, desc: 'All units +2 move.' },
  repair: { id: 'repair', name: 'Field Repair', icon: '🔧', cost: 50, price: 1000, kind: 'Support', heal: 30, desc: 'All units recover 3 HP.' },
  barrage: { id: 'barrage', name: 'Barrage', icon: '💥', cost: 55, price: 1200, kind: 'Global Damage', dmg: 10, desc: 'ALL enemy units take 1 HP damage.' },
  fury: { id: 'fury', name: 'Berserk', icon: '😡', cost: 55, price: 1200, kind: 'Boost', atk: 35, desc: 'All units +35% attack.' },
  emp: { id: 'emp', name: 'EMP Pulse', icon: '⚡', cost: 65, price: 1400, kind: 'Control', debuff: 2, desc: 'Enemy units −2 move on their next turn.' },
  strike: { id: 'strike', name: 'Precision Strike', icon: '🎯', cost: 70, price: 1500, kind: 'Global Damage', clusters: 1, clusterDmg: 40, desc: '4 HP strike on the densest enemy cluster (radius 2).' },
  bombard: { id: 'bombard', name: 'Bombardment', icon: '☄️', cost: 85, price: 1800, kind: 'Global Damage', dmg: 20, desc: 'ALL enemy units take 2 HP damage.' },
  tempest: { id: 'tempest', name: 'Tempest', icon: '⛈️', cost: 90, price: 2000, kind: 'Weather', weather: 'rain', days: 2, dmg: 10, debuff: 1, desc: 'Enemy-only rain + all enemies take 1 HP and −1 move.' },
  whiteout: { id: 'whiteout', name: 'Whiteout', icon: '🌨️', cost: 110, price: 2400, kind: 'Weather', weather: 'snow', days: 2, dmg: 20, desc: 'Enemy-only snow + all enemies take 2 HP.' },
  meteor: { id: 'meteor', name: 'Armageddon', icon: '🌋', cost: 130, price: 3000, kind: 'Global Damage', dmg: 30, debuff: 1, desc: 'ALL enemies take 3 HP and −1 move next turn.' },
  airstrike: { id: 'airstrike', name: 'Air Strike', icon: '🛩️', cost: 75, price: 1200, kind: 'Global Damage', dmg: 15, desc: 'All enemy ground & air units take 1.5 HP damage.' },
  nanite: { id: 'nanite', name: 'Nanite Surge', icon: '🧪', cost: 60, price: 1100, kind: 'Support', heal: 40, desc: 'All friendly units recover 4 HP and refuel.' },
  overdrive: { id: 'overdrive', name: 'Overdrive', icon: '⚡', cost: 80, price: 1500, kind: 'Boost', move: 2, atk: 20, desc: 'All units +2 move, +20% attack.' },
  aegis: { id: 'aegis', name: 'Aegis Shield', icon: '🛡️', cost: 95, price: 1800, kind: 'Boost', def: 50, desc: 'All friendly units gain +50% defense for 1 turn.' },
  stealth: { id: 'stealth', name: 'Ghost Camo', icon: '🌫️', cost: 70, price: 1200, kind: 'Control', debuff: 1, desc: 'Enemy units −1 move next turn, friendly units gain cover.' },
  supply: { id: 'supply', name: 'Airborne Resupply', icon: '📦', cost: 45, price: 750, kind: 'Support', funds: 2, heal: 20, desc: 'Gain 2 days income and heal all units 2 HP.' },
  orbital: { id: 'orbital', name: 'Orbital Beam', icon: '📡', cost: 120, price: 2500, kind: 'Global Damage', clusters: 1, clusterDmg: 50, desc: 'Devastating 5 HP beam strike on the dense enemy cluster.' },
};
export const SKILL_ORDER = Object.values(SKILLS).sort((a, b) => a.cost - b.cost).map((s) => s.id);

/* ---------------- CO ranks & hiring ---------------- */
export const RANK_PRICE = [1500, 3000, 5000, 8000];
export const RANK_MAX = 4;
export const RANK_NAMES = ['Recruit', 'Veteran', 'Elite', 'Ace', 'Legend'];
export const rankSlots = (rank: number) => 1 + Math.floor(rank / 2);
export const rankDesc = (rank: number) => `+${rank * 3}% atk & def · +${rank * 6}% charge speed · ${rankSlots(rank)} skill slot${rankSlots(rank) > 1 ? 's' : ''}`;
export const CO_PRICE: Record<string, number> = { rhea: 0, dax: 4000, sora: 5500, mira: 6000, brann: 6000, grimm: 8500, frost: 9500, nyx: 11000, volkov: 14000, architect: 20000 };
/** CO Pieces required (in addition to Gold) to unlock each officer. Rhea is free. */
export const CO_PIECES: Record<string, number> = { rhea: 0, dax: 12, sora: 16, mira: 16, brann: 16, grimm: 20, frost: 20, nyx: 24, volkov: 28, architect: 40 };

/** Only the Ultimate is field-activatable. It charges 20% slower than the old Super threshold. */
export function ultimateCost(coId: string) {
  const co = COS[coId];
  return Math.ceil((co?.superCost ?? 100) * 1.2 / 5) * 5;
}

export function buildsAt(t: TerrainType): UnitType[] {
  if (t === 'base') return UNIT_ORDER.filter((u) => !['air', 'sea'].includes(UNITS[u].moveType));
  if (t === 'airport') return UNIT_ORDER.filter((u) => UNITS[u].moveType === 'air');
  if (t === 'port') return UNIT_ORDER.filter((u) => UNITS[u].moveType === 'sea');
  return [];
}

export const TERRAIN_BONUS: Record<Category, string> = {
  infantry: 'Forest/mountain terrain stars improve defense. Mountains cost 2 movement.',
  vehicle: 'Forest provides cover. Starting a move on paved road grants +1 movement.',
  artillery: 'Fortified on city/base/HQ: +15% atk. Indirect fire can shoot over units.',
  air: 'Fuel is spent per tile; refuel on a captured city, base, HQ or airport.',
  naval: 'Reef +15% def · Port repairs',
};

export const CAT_NAMES: Record<Category, string> = {
  infantry: 'Infantry', vehicle: 'Vehicles', artillery: 'Artillery', air: 'Air', naval: 'Naval',
};

export const MODS: Record<ModId, { name: string; icon: string; desc: string; price: number }> = {
  armor: { name: 'Reactive Armor', icon: '🛡️', desc: '+15% defense', price: 600 },
  weapons: { name: 'AP Munitions', icon: '💥', desc: '+15% attack', price: 600 },
  engine: { name: 'Turbo Engine', icon: '⚙️', desc: '+1 movement', price: 900 },
  optics: { name: 'Target Optics', icon: '🔭', desc: '+2 vision, indirect +1 max range', price: 800 },
  targeting: { name: 'Targeting Matrix', icon: '🎯', desc: '+10% attack & +1 vision', price: 700 },
  coating: { name: 'Nanite Coating', icon: '🧪', desc: 'Heals 1 HP each turn', price: 850 },
  composite: { name: 'Composite Armor', icon: '🧱', desc: '+20% defense vs indirect fire', price: 750 },
};

export const ARMOR_NAMES: Record<ArmorClass, string> = {
  INF: 'Infantry', LIGHT: 'Light veh.', TANK: 'Tank', HEAVY: 'Heavy', HELI: 'Heli/Drone', PLANE: 'Plane', SHIP: 'Ship', SUB: 'Sub',
};

export interface CODef {
  id: string;
  name: string;
  title: string;
  faction: 'azure' | 'crimson';
  color: string;
  bio: string;
  d2d: string;
  powerName: string;
  powerDesc: string;
  superName: string;
  superDesc: string;
  powerCost: number;
  superCost: number;
  immune?: Weather;
  emoji: string;
}

export const COS: Record<string, CODef> = {
  rhea: { id: 'rhea', name: 'Rhea Vance', title: 'Captain', faction: 'azure', color: '#3b82f6', emoji: '🎖️',
    bio: 'A steady field captain and the Republic\'s best instructor. Balanced, reliable, never panics.',
    d2d: 'All units +5% attack. Naval −10% defense.', powerName: 'Rally Cry', powerDesc: 'All units +1 move, +10% attack.',
    superName: 'Vanguard', superDesc: 'All units heal 2 HP, +25% attack, +15% defense, +1 move.', powerCost: 40, superCost: 90 },
  dax: { id: 'dax', name: 'Dax Kord', title: 'Major', faction: 'azure', color: '#f59e0b', emoji: '🛞',
    bio: 'Hot-headed armor commander. Believes every problem can be solved with more tanks.',
    d2d: 'Tread units +20% attack. Infantry −10% attack.', powerName: 'Steel Rush', powerDesc: 'Tread units +2 move, +10% attack.',
    superName: 'Blitzkrieg', superDesc: 'Tread units +2 move, +40% attack, +20% defense.', powerCost: 50, superCost: 100 },
  sora: { id: 'sora', name: 'Sora Akai', title: 'Lieutenant', faction: 'azure', color: '#06b6d4', emoji: '✈️',
    bio: 'Prodigy pilot who never lost a dogfight. Cocky, brilliant, and fiercely loyal.',
    d2d: 'Air units +20% attack, −10% cost. Naval −10% attack.', powerName: 'Tailwind', powerDesc: 'Air units +2 move.',
    superName: 'Sky Fury', superDesc: 'Air units +2 move, +40% attack, ignore weather.', powerCost: 45, superCost: 100 },
  mira: { id: 'mira', name: 'Mira Tull', title: 'Admiral', faction: 'azure', color: '#14b8a6', emoji: '⚓',
    bio: 'Veteran admiral who reads storms like maps. Calm as still water, deadly as a tide.',
    d2d: 'Naval +20% attack. Unaffected by rain. Air units −10% attack.', powerName: 'Monsoon', powerDesc: 'Rain for 1 day. Enemies take 1 HP damage.',
    superName: 'Typhoon', superDesc: 'Rain for 2 days. Enemies take 2 HP. Naval +2 move.', powerCost: 55, superCost: 110, immune: 'rain' },
  brann: { id: 'brann', name: 'Brann Hale', title: 'Colonel', faction: 'azure', color: '#a3e635', emoji: '🎯',
    bio: 'Grizzled artillery colonel. Patient, methodical, and terrifyingly precise.',
    d2d: 'Indirect +15% attack. Direct −10% attack.', powerName: 'Spotter Net', powerDesc: 'Indirect +1 range, +15% attack.',
    superName: 'Thunder Barrage', superDesc: '3 HP strikes on 2 enemy clusters. Indirect +1 range.', powerCost: 50, superCost: 110 },
  kaelen: { id: 'kaelen', name: 'Kaelen Vance', title: 'Flight Captain', faction: 'azure', color: '#0284c7', emoji: '✈️',
    bio: 'Ace squadron commander. Master of high-altitude dominance and aerial strikes.',
    d2d: 'Air units +15% attack, +1 move. Naval −10% defense.', powerName: 'Tailwind', powerDesc: 'Air units +1 move, +10% attack.',
    superName: 'Sky Supremacy', superDesc: 'Air units +2 move, +35% attack. Ground units +1 move.', powerCost: 45, superCost: 95 },
  aria: { id: 'aria', name: 'Aria Chen', title: 'Cyber Officer', faction: 'azure', color: '#8b5cf6', emoji: '⚡',
    bio: 'Master of cyber warfare and electronic countermeasures. Disruption is her art.',
    d2d: 'Vision +1. Enemy skill charge 15% slower. Direct units −10% attack.', powerName: 'Disruptor', powerDesc: 'All enemy units −1 move on next turn.',
    superName: 'Overclock', superDesc: 'All enemy units −2 move. Friendly units +25% attack.', powerCost: 50, superCost: 100 },
  grimm: { id: 'grimm', name: 'Grimm', title: 'Warlord', faction: 'crimson', color: '#ef4444', emoji: '💀',
    bio: 'Brutal Dominion warlord who drowns enemies in endless infantry waves.',
    d2d: 'Infantry +20% attack, −20% cost. Vehicles −10% defense.', powerName: 'Human Wave', powerDesc: 'Infantry +2 move, +20% attack.',
    superName: 'Endless Horde', superDesc: 'Infantry +2 move, +40% attack, heal 3 HP.', powerCost: 40, superCost: 90 },
  frost: { id: 'frost', name: 'Frost', title: 'Baron', faction: 'crimson', color: '#93c5fd', emoji: '🧊',
    bio: 'Aristocrat of the northern wastes. Fights best when the world freezes.',
    d2d: 'Unaffected by snow. Vehicles −10% attack.', powerName: 'Blizzard', powerDesc: 'Snow for 1 day.',
    superName: 'Winter Storm', superDesc: 'Snow for 2 days. Enemies take 2 HP.', powerCost: 50, superCost: 95, immune: 'snow' },
  nyx: { id: 'nyx', name: 'Nyx', title: 'Commander', faction: 'crimson', color: '#a855f7', emoji: '🌙',
    bio: 'Shadow tactician. Strikes from darkness and vanishes before dawn.',
    d2d: '+1 vision. +10% attack in fog. Indirect units −10% attack.', powerName: 'Night Raid', powerDesc: 'All units +1 move, +20% attack.',
    superName: 'Shadow Strike', superDesc: 'All units +2 move, +30% attack. Enemies −1 move next turn.', powerCost: 45, superCost: 95 },
  volkov: { id: 'volkov', name: 'Volkov', title: 'General', faction: 'crimson', color: '#dc2626', emoji: '🐻',
    bio: 'The Iron General. Commands the Dominion\'s elite with crushing force.',
    d2d: 'All units +10% atk & def. Units cost +15%. Air units −10% atk & def.', powerName: 'Iron Fist', powerDesc: '+20% attack.',
    superName: 'Red Storm', superDesc: '+40% attack, +20% defense, heal 2 HP.', powerCost: 60, superCost: 120 },
  zero: { id: 'zero', name: 'Zero', title: 'Siege Director', faction: 'crimson', color: '#be123c', emoji: '🎯',
    bio: 'Cold-blooded siege strategist. Specializes in long-range destruction.',
    d2d: 'Indirect fire +15% attack, +1 max range. Direct units −10% defense.', powerName: 'Artillery Sweep', powerDesc: 'Indirect units +1 range, +15% attack.',
    superName: 'Global Siege', superDesc: 'All enemy units take 2 HP damage and −15% defense.', powerCost: 55, superCost: 110 },
  seraphina: { id: 'seraphina', name: 'Seraphina', title: 'Medic General', faction: 'crimson', color: '#059669', emoji: '🏥',
    bio: 'Renowned military doctor whose nanite fields keep troops in the fight endlessly.',
    d2d: 'Units on properties heal +1 HP/turn. All units −10% attack.', powerName: 'Field Triage', powerDesc: 'All friendly units recover 2 HP.',
    superName: 'Nanite Restoration', superDesc: 'All friendly units recover 4 HP and +30% defense.', powerCost: 45, superCost: 95 },
  architect: { id: 'architect', name: 'Architect', title: 'Strategist', faction: 'crimson', color: '#e11d48', emoji: '🔺',
    bio: 'A war-machine intelligence that orchestrated the entire conflict. Calculates everything.',
    d2d: 'All units +10% atk & def. Unaffected by sand. Air units −10% attack.', powerName: 'Recalibrate', powerDesc: 'All units heal 3 HP.',
    superName: 'Singularity', superDesc: '+30% atk & def. Enemies take 2 HP and −1 move next turn.', powerCost: 60, superCost: 110, immune: 'sand' },
};

export const PLAYABLE_ORDER = ['rhea', 'dax', 'sora', 'mira', 'brann', 'kaelen', 'aria', 'grimm', 'frost', 'nyx', 'volkov', 'zero', 'seraphina', 'architect'];

export function coCost(coId: string, type: UnitType): number {
  const d = UNITS[type];
  let c = d.cost;
  if (coId === 'sora' && d.cat === 'air') c *= 0.9;
  if (coId === 'grimm' && d.cat === 'infantry') c *= 0.8;
  if (coId === 'volkov') c *= 1.15;
  return Math.round(c / 100) * 100;
}
