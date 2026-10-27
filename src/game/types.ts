export type Team = 0 | 1;
export type Owner = Team | -1;

export type TerrainType =
  | 'plain' | 'forest' | 'mountain' | 'road' | 'dirt_road' | 'bridge' | 'river' | 'sea' | 'shoal' | 'reef'
  | 'city' | 'base' | 'airport' | 'port' | 'hq' | 'tower';

export type MoveType = 'foot' | 'mech' | 'treads' | 'tires' | 'air' | 'sea';
export type ArmorClass = 'INF' | 'LIGHT' | 'TANK' | 'HEAVY' | 'HELI' | 'PLANE' | 'SHIP' | 'SUB';
export type Category = 'infantry' | 'vehicle' | 'artillery' | 'air' | 'naval';
export type UnitType =
  | 'infantry' | 'mech' | 'recon' | 'apc' | 'tank' | 'heavy' | 'artillery' | 'rockets' | 'aa' | 'missiles'
  | 'drone' | 'gundrone' | 'tcopter' | 'bcopter' | 'fighter' | 'bomber'
  | 'cruiser' | 'sub' | 'battleship';
export type Weather = 'clear' | 'rain' | 'snow' | 'sand';
export type ModId = 'armor' | 'weapons' | 'engine' | 'optics' | 'targeting' | 'coating' | 'composite';
export type TrackId = 'fire' | 'armor' | 'mobility' | 'economy' | 'range' | 'tactical' | 'veterancy' | 'logistics';
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
  landed?: boolean;
  boss?: string;
  bossPhases?: number;
  isAlly?: boolean;
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

export interface AdaptiveTrigger {
  day?: number;
  bossPhaseBreak?: boolean;
  enemyCountBelow?: number;
  hqCaptured?: boolean;
  reinforcements?: [UnitType, number, number, Team, boolean?][];
  fundsBonus?: [number, number];
}

export interface MissionDef {
  id: string;
  name: string;
  act: number;
  map: string[];
  units: [UnitType, number, number, Team][];
  cos: string[]; // allowed player cos
  enemyCo: string;
  allyCo?: string; // optional Allied AI CO playing on team 0 or ally team
  enemyCo2?: string; // second enemy CO for dual CO battles
  funds: [number, number];
  weather: Weather;
  weatherPool?: Weather[];
  fog: boolean;
  unitCap: [number, number];
  objective: Objective;
  adaptiveTrigger?: AdaptiveTrigger;
  adaptiveObjective?: Objective;
  adaptiveDialogue?: Dialogue[];
  dayLimit?: number;
  aiLevel: number;
  briefing: Dialogue[];
  outro: Dialogue[];
  tutorial?: boolean;
  boss?: BossDef;
  par: number; // par days for score
  unlockCo?: string;
  forcedCo?: string; // pre-selected forced CO for story focus
  recommendedRank?: number; // recommended CO rank/level
  recommendedUpgrades?: number; // recommended total upgrade tiers
  hint: string;
}

export interface Upgrades {
  atk: Record<Category, number>;
  def: Record<Category, number>;
}

export interface AfkHarvestData {
  lastClaimTime: number;
  level: number;
}

export interface SaveData {
  progress: number; // index of highest unlocked mission
  merits: number;
  gems?: number; // premium currency earned from battle victories & achievements
  afkHarvest?: AfkHarvestData;
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
  /** Track cleared mission IDs in normal mode vs fog replay mode */
  normalCleared?: Record<string, boolean>;
  fogCleared?: Record<string, boolean>;
  advancedUnlocked?: boolean;
  advancedMode?: boolean;
  /** Cleared character story chapters per CO ID (1..10) */
  storyCleared?: Record<string, Record<number, boolean>>;
}

export type GraphicsQuality = 'auto' | 'ultra' | 'high' | 'medium' | 'low';
export type FpsTarget = 'uncapped' | 120 | 60 | 30;
export type DprOption = 'auto' | 2 | 1.5 | 1 | 0.75;
export type ParticleOption = 'full' | 'medium' | 'low' | 'off';

export interface Settings {
  battleAnim: 'all' | 'player' | 'off';
  speed: number; // 0.75 slow, 1 normal, 1.5 fast
  sfx: boolean;
  graphicsQuality: GraphicsQuality;
  fpsTarget: FpsTarget;
  dprScale: DprOption;
  particles: ParticleOption;
  shadows: boolean;
  weatherEffects: boolean;
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
  allyCo?: string;
  enemyCo2?: string;
  adaptiveTriggered?: boolean;
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
