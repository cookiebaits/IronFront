export type Team = 0 | 1;
export type Owner = Team | -1;

export type TerrainType =
  | 'plain' | 'forest' | 'mountain' | 'road' | 'bridge' | 'river' | 'sea' | 'shoal' | 'reef'
  | 'city' | 'base' | 'airport' | 'port' | 'hq' | 'tower';

export type MoveType = 'foot' | 'mech' | 'treads' | 'tires' | 'air' | 'sea';
export type ArmorClass = 'INF' | 'LIGHT' | 'TANK' | 'HEAVY' | 'HELI' | 'PLANE' | 'SHIP' | 'SUB';
export type Category = 'infantry' | 'vehicle' | 'artillery' | 'air' | 'naval';
export type UnitType =
  | 'infantry' | 'mech' | 'recon' | 'apc' | 'tank' | 'heavy' | 'artillery' | 'rockets' | 'aa' | 'missiles'
  | 'drone' | 'gundrone' | 'tcopter' | 'bcopter' | 'fighter' | 'bomber'
  | 'cruiser' | 'sub' | 'battleship';
export type Weather = 'clear' | 'rain' | 'snow' | 'sand';
export type ModId = 'armor' | 'weapons' | 'engine' | 'optics';
export type TrackId = 'fire' | 'armor' | 'mobility' | 'economy' | 'range';
export type UnitUps = Partial<Record<TrackId, number>>;
export interface PlayerLoadout {
  unitUps: Partial<Record<UnitType, UnitUps>>;
  coRank: number;
  skills: string[];
}
export interface SkillFx { atk: number; def: number; move: number }

export interface Tile {
  t: TerrainType;
  owner: Owner;
  capture: number;
}

export interface Unit {
  id: number;
  type: UnitType;
  team: Team;
  x: number;
  y: number;
  hp: number; // 1..100
  moved: boolean;
  cargo: Unit | null;
  capturing: boolean;
  vet: number;
  facing: 1 | -1;
  fuel?: number;
  boss?: string;
  bossPhases?: number;
}

export interface UnitDef {
  name: string;
  cost: number;
  move: number;
  moveType: MoveType;
  armor: ArmorClass;
  cat: Category;
  range: [number, number];
  vision: number;
  dmg: Partial<Record<ArmorClass, number>>;
  capture?: boolean;
  indirect?: boolean; // cannot move & fire in the same turn, never counter-attacks
  carry?: UnitType[];
  supply?: boolean;
  fuel?: number;
  desc: string;
}

export interface BossDef {
  x: number;
  y: number;
  team: Team;
  type: UnitType;
  name: string;
  hp: number;
  phases?: number;
}

export interface Dialogue {
  who: string; // co id or 'narrator'
  text: string;
}

export type Objective =
  | { type: 'rout' }
  | { type: 'hq' }
  | { type: 'survive'; days: number };

export interface MissionDef {
  id: string;
  name: string;
  act: number;
  map: string[];
  units: [UnitType, number, number, Team][];
  cos: string[]; // allowed player cos
  enemyCo: string;
  funds: [number, number];
  weather: Weather;
  weatherPool?: Weather[];
  fog: boolean;
  unitCap: [number, number];
  objective: Objective;
  dayLimit?: number;
  aiLevel: number;
  briefing: Dialogue[];
  outro: Dialogue[];
  tutorial?: boolean;
  boss?: BossDef;
  par: number; // par days for score
  unlockCo?: string;
  hint: string;
}

export interface Upgrades {
  atk: Record<Category, number>;
  def: Record<Category, number>;
}

export interface SaveData {
  progress: number; // index of highest unlocked mission
  merits: number;
  upgrades: Upgrades;
  mods: Partial<Record<UnitType, ModId>>;
  ownedMods: ModId[];
  highscores: HighScore[];
  best: Record<string, { score: number; rank: string }>;
  unlockedCos: string[];
  settings: Settings;
  coRank: Record<string, number>;
  ownedSkills: string[];
  loadout: Record<string, string[]>;
  unitUps: Partial<Record<UnitType, UnitUps>>;
  /** Collected "CO Pieces" per officer. An officer needs enough pieces AND gold to be unlocked. */
  coPieces: Record<string, number>;
  /** Set after completing Boot Camp once; enables the Skip Tutorial option on replays. */
  tutorialComplete: boolean;
  /** Developer/player audit switch: all missions selectable without changing story progress. */
  missionAuditUnlocked: boolean;
}

export interface Settings {
  battleAnim: 'all' | 'player' | 'off';
  speed: number; // 0.75 slow, 1 normal, 1.5 fast
  sfx: boolean;
}

export interface HighScore {
  name: string;
  co: string;
  mission: string;
  score: number;
  rank: string;
  date: string;
}

export interface GameStats {
  kills: [number, number];
  lost: [number, number];
  captures: [number, number];
  dmg: [number, number];
}

export interface GameState {
  w: number;
  h: number;
  tiles: Tile[][];
  units: Unit[];
  day: number;
  turn: Team;
  funds: [number, number];
  cos: [string, string];
  meter: [number, number];
  /** Tactical-skill charge: separate from and slower than Power / Super charge. */
  skillMeter: [number, number];
  skillMeterMax: [number, number];
  power: [number, number]; // 0 none 1 power 2 super
  debuff: [number, number]; // move penalty applied on that team's turn
  weather: Weather;
  baseWeather: Weather;
  weatherPool: Weather[] | null;
  weatherTimer: number;
  fog: boolean;
  unitCap: [number, number];
  mission: MissionDef;
  stats: GameStats;
  nextId: number;
  winner: Team | null;
  hadUnits: [boolean, boolean];
  unitUps: Partial<Record<UnitType, UnitUps>>;
  skills: [string[], string[]];
  skillFx: [SkillFx | null, SkillFx | null];
  /** Weather created by your own tactical skill restricts only the enemy. */
  skillWeatherImmune: [boolean, boolean];
  meterMax: [number, number];
  coRank: [number, number];
  radioCycle: [number, number];
  radioMove: [boolean, boolean];
  aiLevel: number;
  built: boolean[][]; // per-turn production lock per property
  log: string[];
}

export interface AttackResult {
  attackerId: number;
  defenderId: number;
  aType: UnitType;
  dType: UnitType;
  aTeam: Team;
  dTeam: Team;
  aBefore: number;
  aAfter: number;
  dBefore: number;
  dAfter: number;
  dmg: number;
  counter: number;
  aKilled: boolean;
  dKilled: boolean;
  ax: number;
  ay: number;
  dx: number;
  dy: number;
  aTerrain: TerrainType;
  dTerrain: TerrainType;
  indirect: boolean;
  bossPhaseBreak?: boolean;
}

export interface PowerEffect {
  team: Team;
  level: 1 | 2 | 3;
  name: string;
  desc?: string;
  funds?: number;
  hits: { x: number; y: number; dmg: number }[];
  heals: { x: number; y: number }[];
  weather?: Weather;
  centers?: { x: number; y: number }[];
}
