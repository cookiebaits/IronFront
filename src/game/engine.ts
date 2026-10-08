import { CHAR_MAP, COS, MOVE_COST, SKILLS, TERRAIN, UNITS, buildsAt, coCost, ultimateCost, upgradeEffects, weatherCost } from './data';
import type {
  AttackResult, GameState, MissionDef, PlayerLoadout, PowerEffect, Team, TerrainType, Tile, Unit, UnitType, Upgrades, Weather,
} from './types';

export const emptyUpgrades = (): Upgrades => ({
  atk: { infantry: 0, vehicle: 0, artillery: 0, air: 0, naval: 0 },
  def: { infantry: 0, vehicle: 0, artillery: 0, air: 0, naval: 0 },
});

export function createGame(
  m: MissionDef,
  playerCo: string,
  enemyCo: string,
  loadout: PlayerLoadout,
  opts?: { weather?: Weather; fog?: boolean; aiLevel?: number; dynamic?: boolean },
): GameState {
  const h = m.map.length;
  const w = Math.max(...m.map.map((r) => r.length));
  const tiles: Tile[][] = [];
  for (let y = 0; y < h; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < w; x++) {
      const ch = m.map[y][x] ?? '.';
      const def = CHAR_MAP[ch] ?? CHAR_MAP['.'];
      row.push({ t: def.t, owner: def.owner, capture: 20 });
    }
    tiles.push(row);
  }
  const weather = opts?.weather ?? m.weather;
  const s: GameState = {
    w, h, tiles, units: [], day: 1, turn: 0,
    funds: [m.funds[0], m.funds[1]],
    cos: [playerCo, enemyCo],
    meter: [0, 0], skillMeter: [0, 0], power: [0, 0], debuff: [0, 0],
    weather, baseWeather: weather,
    weatherPool: opts?.dynamic === false ? null : opts?.dynamic ? ['clear', 'clear', 'rain', 'snow', 'sand'] : m.weatherPool ?? null,
    weatherTimer: 0,
    fog: opts?.fog ?? m.fog,
    unitCap: [m.unitCap[0], m.unitCap[1]],
    mission: m,
    stats: { kills: [0, 0], lost: [0, 0], captures: [0, 0], dmg: [0, 0] },
    nextId: 1, winner: null, hadUnits: [false, false],
    unitUps: loadout.unitUps ?? {},
    skills: [loadout.skills.filter((id) => SKILLS[id]), []],
    skillFx: [null, null],
    skillWeatherImmune: [false, false],
    meterMax: [ultimateCost(playerCo), ultimateCost(enemyCo)],
    skillMeterMax: [Math.max(1, ...loadout.skills.map((id) => SKILLS[id]?.cost ?? 0)), 1],
    coRank: [loadout.coRank ?? 0, 0],
    radioCycle: [0, 0],
    radioMove: [false, false],
    aiLevel: opts?.aiLevel ?? m.aiLevel,
    built: tiles.map((r) => r.map(() => false)),
    log: [],
  };
  for (const [type, x, y, team] of m.units) {
    if (x < w && y < h) addUnit(s, type, x, y, team);
  }
  if (m.boss) {
    const boss = s.units.find((u) => u.type === m.boss!.type && u.team === m.boss!.team && u.x === m.boss!.x && u.y === m.boss!.y)
      ?? addUnit(s, m.boss.type, m.boss.x, m.boss.y, m.boss.team);
    boss.boss = m.boss.name;
    boss.bossPhases = Math.max(1, m.boss.phases ?? 3);
    boss.hp = 100;
  }
  // income for the first turn
  s.funds[0] += income(s, 0);
  return s;
}

export function addUnit(s: GameState, type: UnitType, x: number, y: number, team: Team): Unit {
  const u: Unit = { id: s.nextId++, type, team, x, y, hp: 100, moved: false, cargo: null, capturing: false, vet: 0, facing: team === 0 ? 1 : -1, fuel: UNITS[type].fuel };
  s.units.push(u);
  s.hadUnits[team] = true;
  return u;
}

export const dispHp = (hp: number) => Math.max(0, Math.min(10, Math.ceil(hp / 10)));
export const inBounds = (s: GameState, x: number, y: number) => x >= 0 && y >= 0 && x < s.w && y < s.h;
export const tileAt = (s: GameState, x: number, y: number) => s.tiles[y][x];
export const unitAt = (s: GameState, x: number, y: number) => s.units.find((u) => u.x === x && u.y === y) ?? null;
export const unitById = (s: GameState, id: number) => s.units.find((u) => u.id === id) ?? null;
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.abs(ax - bx) + Math.abs(ay - by);
export const isAir = (t: UnitType) => UNITS[t].moveType === 'air';
export const isRefuelSite = (s: GameState, team: Team, x: number, y: number) => {
  const tile = s.tiles[y]?.[x];
  return !!tile && tile.owner === team && ['city', 'base', 'hq', 'airport'].includes(tile.t);
};
export const isIndirect = (t: UnitType) => !!UNITS[t].indirect;
export const canAttackType = (a: UnitType, d: UnitType) => (UNITS[a].dmg[UNITS[d].armor] ?? 0) > 0;
export const canAttackAny = (a: UnitType) => Object.keys(UNITS[a].dmg).length > 0;
export const unitCount = (s: GameState, team: Team) =>
  s.units.reduce((n, u) => n + (u.team === team ? 1 + (u.cargo ? 1 : 0) : 0), 0);

export function effWeather(s: GameState, team: Team): Weather {
  if (s.skillWeatherImmune[team]) return 'clear';
  const imm = COS[s.cos[team]]?.immune;
  if (imm && imm === s.weather) return 'clear';
  return s.weather;
}

export interface Mods { atk: number; def: number; move: number; rmin: number; rmax: number; vision: number }

export function unitMods(s: GameState, u: Unit, x = u.x, y = u.y): Mods {
  const d = UNITS[u.type];
  const co = s.cos[u.team];
  const rawPl = s.power[u.team];
  const pl = rawPl <= 2 ? rawPl : 0; // 3 = tactical skill (signature boosts off)
  const w = effWeather(s, u.team);
  let atk = 100, def = 100, move = d.move, rmax = d.range[1], vision = d.vision;
  const rmin = d.range[0];
  const treads = d.moveType === 'treads';
  const air = d.cat === 'air';
  const indirect = !!d.indirect;
  if (rawPl > 0) def += 10;
  if (u.boss) { atk += 20; def += 15; }
  if (s.radioMove[u.team]) move += 1;
  const fx = s.skillFx[u.team];
  if (fx) { atk += fx.atk; def += fx.def; move += fx.move; }
  atk += s.coRank[u.team] * 3; def += s.coRank[u.team] * 3;
  switch (co) {
    case 'rhea':
      if (pl === 1) { move += 1; atk += 10; }
      if (pl === 2) { move += 1; atk += 25; }
      break;
    case 'dax':
      if (treads) atk += 20;
      if (d.cat === 'infantry') atk -= 10;
      if (pl >= 1 && treads) { move += 2; atk += pl === 1 ? 10 : 40; if (pl === 2) def += 20; }
      break;
    case 'sora':
      if (air) atk += 20;
      if (d.cat === 'naval') atk -= 10;
      if (pl >= 1 && air) move += 2;
      if (pl === 2 && air) atk += 40;
      break;
    case 'mira':
      if (d.cat === 'naval') atk += 20;
      if (pl === 2 && d.cat === 'naval') move += 2;
      break;
    case 'brann':
      if (indirect) atk += 15; else if (canAttackAny(u.type)) atk -= 10;
      if (pl >= 1 && indirect) { rmax += 1; if (pl === 1) atk += 15; }
      break;
    case 'grimm':
      if (d.cat === 'infantry') atk += 20;
      if (d.cat === 'vehicle' || d.cat === 'artillery') def -= 10;
      if (pl >= 1 && d.cat === 'infantry') { move += 2; atk += pl === 1 ? 20 : 40; }
      break;
    case 'nyx':
      vision += 1;
      if (s.fog) atk += 10;
      if (pl === 1) { move += 1; atk += 20; }
      if (pl === 2) { move += 2; atk += 30; }
      break;
    case 'volkov':
      atk += 10; def += 10;
      if (pl === 1) atk += 20;
      if (pl === 2) { atk += 40; def += 20; }
      break;
    case 'architect':
      atk += 10; def += 10;
      if (pl === 2) { atk += 30; def += 30; }
      break;
  }
  // weather
  const skyFury = co === 'sora' && pl === 2 && air;
  if (!skyFury) {
    if (w === 'rain') { if (air) atk -= 10; vision -= 1; }
    if (w === 'snow') def -= 10;
    if (w === 'sand') { atk -= 10; if (air) atk -= 10; if (indirect) rmax -= 1; }
  }
  // terrain bonus
  if (inBounds(s, x, y)) {
    const t = s.tiles[y][x].t;
    if (d.cat === 'artillery') {
      if (t === 'city' || t === 'base' || t === 'hq') atk += 15;
    } else if (d.cat === 'naval') {
      if (t === 'reef') def += 15;
    }
  }
  // Vehicles get a one-tile road march bonus when starting their movement on paved road.
  const vehicle = d.cat === 'vehicle' || d.cat === 'artillery';
  if (vehicle && s.tiles[u.y]?.[u.x]?.t === 'road') move += 1;
  // comm towers
  let towers = 0;
  for (const row of s.tiles) for (const tl of row) if (tl.t === 'tower' && tl.owner === u.team) towers++;
  atk += towers * 10;
  // player upgrades & mods
  if (u.team === 0) {
    const ue = upgradeEffects(s.unitUps[u.type], indirect);
    atk += ue.atk; def += ue.def; move += ue.move; vision += ue.vision; rmax += ue.rmax;
  } else {
    // AI difficulty scaling
    atk += Math.max(0, s.aiLevel - 1) * 5;
  }
  atk += u.vet * 5;
  move -= s.debuff[u.team];
  return { atk, def, move: Math.max(0, move), rmin, rmax: Math.max(rmin, rmax), vision: Math.max(1, vision) };
}

export function moveCost(s: GameState, u: Unit, x: number, y: number): number {
  const t = s.tiles[y][x].t;
  const mt = UNITS[u.type].moveType;
  return weatherCost(MOVE_COST[t][mt], mt, t, effWeather(s, u.team));
}

export function passableFor(type: UnitType, t: TerrainType): boolean {
  return isFinite(MOVE_COST[t][UNITS[type].moveType]);
}

export interface ReachNode { cost: number; prev: number }

/** Dijkstra over the grid. visibleTo: if set, only enemies visible to that team block movement */
export function reachable(s: GameState, u: Unit, vis?: Set<number> | null, maxOverride?: number): Map<number, ReachNode> {
  const max = Math.min(maxOverride ?? unitMods(s, u).move, u.fuel ?? Infinity);
  const res = new Map<number, ReachNode>();
  const start = u.y * s.w + u.x;
  res.set(start, { cost: 0, prev: -1 });
  const open: number[] = [start];
  const occ = new Map<number, Unit>();
  for (const o of s.units) occ.set(o.y * s.w + o.x, o);
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (res.get(open[i])!.cost < res.get(open[bi])!.cost) bi = i;
    const cur = open.splice(bi, 1)[0];
    const cc = res.get(cur)!.cost;
    const cx = cur % s.w, cy = Math.floor(cur / s.w);
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (!inBounds(s, nx, ny)) continue;
      const k = ny * s.w + nx;
      const o = occ.get(k);
      if (o && o.team !== u.team && (!vis || vis.has(k))) continue;
      const c = cc + moveCost(s, u, nx, ny);
      if (c > max) continue;
      // Keep a one-tile reserve unless the move lands on a friendly refueling property.
      if (u.fuel !== undefined && c >= u.fuel && !isRefuelSite(s, u.team, nx, ny)) continue;
      const ex = res.get(k);
      if (!ex || ex.cost > c) {
        res.set(k, { cost: c, prev: cur });
        if (!open.includes(k)) open.push(k);
      }
    }
  }
  return res;
}

export const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function pathTo(s: GameState, reach: Map<number, ReachNode>, x: number, y: number): [number, number][] {
  const out: [number, number][] = [];
  let k = y * s.w + x;
  while (k !== -1 && reach.has(k)) {
    out.unshift([k % s.w, Math.floor(k / s.w)]);
    k = reach.get(k)!.prev;
  }
  return out;
}

export function canCarry(t: Unit, cargo: Unit) {
  return !!UNITS[t.type].carry?.includes(cargo.type) && !t.cargo && t.team === cargo.team && t.id !== cargo.id;
}

export function canStop(s: GameState, u: Unit, x: number, y: number): 'ok' | 'load' | null {
  const o = unitAt(s, x, y);
  if (!o || o.id === u.id) return 'ok';
  if (canCarry(o, u)) return 'load';
  return null;
}

/** targets attackable by u standing at (x,y). moved: whether unit moved this action */
export function targetsFrom(s: GameState, u: Unit, x: number, y: number, moved: boolean, vis?: Set<number> | null): Unit[] {
  if (!canAttackAny(u.type)) return [];
  const m = unitMods(s, u, x, y);
  if (isIndirect(u.type) && moved) return [];
  return s.units.filter((o) => {
    if (o.team === u.team) return false;
    if (vis && !vis.has(o.y * s.w + o.x)) return false;
    const d = dist(x, y, o.x, o.y);
    return d >= m.rmin && d <= m.rmax && canAttackType(u.type, o.type);
  });
}

export function calcDamage(s: GameState, a: Unit, ax: number, ay: number, d: Unit, dx: number, dy: number, aHp = a.hp, luck = 0): number {
  const base = UNITS[a.type].dmg[UNITS[d.type].armor] ?? 0;
  if (!base) return 0;
  const am = unitMods(s, a, ax, ay);
  const dm = unitMods(s, d, dx, dy);
  const ah = Math.min(10, dispHp(aHp)), dh = Math.min(10, dispHp(d.hp));
  const stars = isAir(d.type) ? 0 : TERRAIN[s.tiles[dy][dx].t].def;
  let dmg = base * (am.atk / 100) * (ah / 10) * ((100 - stars * dh) / 100) * (100 / Math.max(10, dm.def));
  if (d.boss) dmg *= 0.72;
  dmg += luck * (ah / 10);
  return Math.max(0, Math.floor(dmg));
}

export function forecast(s: GameState, a: Unit, ax: number, ay: number, d: Unit) {
  const lo = calcDamage(s, a, ax, ay, d, d.x, d.y, a.hp, 0);
  const hi = calcDamage(s, a, ax, ay, d, d.x, d.y, a.hp, 9);
  let counter = 0;
  const remaining = d.hp - lo;
  if (remaining > 0 && !isIndirect(d.type) && dist(ax, ay, d.x, d.y) === 1 && canAttackType(d.type, a.type)) {
    const tmp = { ...d, hp: remaining };
    counter = calcDamage(s, tmp, d.x, d.y, a, ax, ay, remaining, 4);
  }
  return { lo: Math.min(lo, d.hp), hi: Math.min(hi, d.hp), counter: Math.min(counter, a.hp) };
}

function chargeMeter(s: GameState, team: Team, amt: number) {
  const rankBoost = 1 + s.coRank[team] * 0.06;
  if (s.power[team] === 0) s.meter[team] = Math.min(s.meterMax[team], s.meter[team] + amt * rankBoost);
  // Skills intentionally charge 35% slower than Power / Super.
  if (s.power[team] !== 3) s.skillMeter[team] = Math.min(s.skillMeterMax[team], s.skillMeter[team] + amt * rankBoost * 0.65);
}

function dmgCharge(dmg: number, t: UnitType) {
  return (dmg / 10) * (1 + UNITS[t].cost / 12000) * 0.9;
}

export function removeUnit(s: GameState, u: Unit) {
  if (u.capturing) s.tiles[u.y][u.x].capture = 20;
  s.units = s.units.filter((o) => o.id !== u.id);
  s.stats.lost[u.team] += 1 + (u.cargo ? 1 : 0);
  s.stats.kills[(1 - u.team) as Team] += 1 + (u.cargo ? 1 : 0);
}

export function resolveAttack(s: GameState, a: Unit, d: Unit, rng = Math.random): AttackResult {
  const res: AttackResult = {
    attackerId: a.id, defenderId: d.id, aType: a.type, dType: d.type, aTeam: a.team, dTeam: d.team,
    aBefore: a.hp, dBefore: d.hp, aAfter: a.hp, dAfter: d.hp, dmg: 0, counter: 0, aKilled: false, dKilled: false,
    ax: a.x, ay: a.y, dx: d.x, dy: d.y, aTerrain: s.tiles[a.y][a.x].t, dTerrain: s.tiles[d.y][d.x].t,
    indirect: dist(a.x, a.y, d.x, d.y) > 1,
  };
  a.facing = d.x < a.x ? -1 : d.x > a.x ? 1 : a.facing;
  d.facing = a.x < d.x ? -1 : a.x > d.x ? 1 : d.facing;
  const dmg = Math.min(d.hp, calcDamage(s, a, a.x, a.y, d, d.x, d.y, a.hp, Math.floor(rng() * 10)));
  d.hp -= dmg;
  res.dmg = dmg;
  s.stats.dmg[a.team] += dmg;
  chargeMeter(s, a.team, dmgCharge(dmg, d.type));
  chargeMeter(s, d.team, dmgCharge(dmg, d.type) * 0.5);
  if (d.hp <= 0) {
    res.dAfter = 0;
    if (d.boss && (d.bossPhases ?? 1) > 1) {
      d.bossPhases = (d.bossPhases ?? 1) - 1;
      d.hp = 100;
      res.bossPhaseBreak = true;
      chargeMeter(s, a.team, 8);
    } else {
      res.dKilled = true;
      a.vet = Math.min(3, a.vet + 1);
      chargeMeter(s, a.team, 8);
      removeUnit(s, d);
    }
  } else {
    res.dAfter = d.hp;
    if (!res.indirect && !isIndirect(d.type) && canAttackType(d.type, a.type)) {
      const c = Math.min(a.hp, calcDamage(s, d, d.x, d.y, a, a.x, a.y, d.hp, Math.floor(rng() * 10)));
      a.hp -= c;
      res.counter = c;
      s.stats.dmg[d.team] += c;
      chargeMeter(s, d.team, dmgCharge(c, a.type));
      chargeMeter(s, a.team, dmgCharge(c, a.type) * 0.5);
      if (a.hp <= 0) {
        res.aKilled = true;
        d.vet = Math.min(3, d.vet + 1);
        chargeMeter(s, d.team, 8);
        removeUnit(s, a);
      }
    }
  }
  res.aAfter = Math.max(0, a.hp);
  checkRout(s);
  return res;
}

export function checkRout(s: GameState) {
  if (s.winner !== null) return;
  for (const t of [0, 1] as Team[]) {
    if (s.hadUnits[t] && unitCount(s, t) === 0) {
      // No units left means immediate defeat, even if the side still owns a factory.
      s.winner = (1 - t) as Team;
    }
  }
}

/** Commit a move. Returns tile reached (may stop early due to ambush). */
export function commitMove(s: GameState, u: Unit, path: [number, number][]): { x: number; y: number; ambush: boolean } {
  let lastX = u.x, lastY = u.y, ambush = false, fuelSpent = 0;
  for (let i = 1; i < path.length; i++) {
    const [px, py] = path[i];
    const o = unitAt(s, px, py);
    if (o && o.team !== u.team) { ambush = true; break; }
    lastX = px; lastY = py;
    if (u.fuel !== undefined) fuelSpent += moveCost(s, u, px, py);
  }
  // if we'd stop on an occupied tile due to ambush, walk back
  if (ambush) {
    let idx = path.findIndex(([px, py]) => px === lastX && py === lastY);
    while (idx > 0) {
      const o = unitAt(s, path[idx][0], path[idx][1]);
      if (!o || o.id === u.id) break;
      idx--;
    }
    lastX = path[Math.max(0, idx)][0]; lastY = path[Math.max(0, idx)][1];
  }
  if ((lastX !== u.x || lastY !== u.y) && u.capturing) {
    s.tiles[u.y][u.x].capture = 20;
    u.capturing = false;
  }
  if (lastX !== u.x) u.facing = lastX < u.x ? -1 : 1;
  u.x = lastX; u.y = lastY;
  if (u.fuel !== undefined) u.fuel = Math.max(0, u.fuel - fuelSpent);
  return { x: lastX, y: lastY, ambush };
}

export function loadInto(s: GameState, u: Unit, transport: Unit) {
  if (u.capturing) { s.tiles[u.y][u.x].capture = 20; u.capturing = false; }
  s.units = s.units.filter((o) => o.id !== u.id);
  u.moved = true;
  transport.cargo = u;
}

export function dropTiles(s: GameState, t: Unit): [number, number][] {
  if (!t.cargo) return [];
  const out: [number, number][] = [];
  for (const [dx, dy] of DIRS) {
    const nx = t.x + dx, ny = t.y + dy;
    if (!inBounds(s, nx, ny)) continue;
    if (unitAt(s, nx, ny)) continue;
    if (!passableFor(t.cargo.type, s.tiles[ny][nx].t)) continue;
    out.push([nx, ny]);
  }
  return out;
}

export function dropCargo(s: GameState, t: Unit, x: number, y: number) {
  const c = t.cargo!;
  t.cargo = null;
  c.x = x; c.y = y; c.moved = true; c.capturing = false;
  s.units.push(c);
}

export function capture(s: GameState, u: Unit): { done: boolean; hq: boolean } {
  const tile = s.tiles[u.y][u.x];
  tile.capture -= dispHp(u.hp);
  u.capturing = true;
  chargeMeter(s, u.team, 3);
  if (tile.capture <= 0) {
    const wasHq = tile.t === 'hq';
    tile.owner = u.team;
    tile.capture = 20;
    u.capturing = false;
    s.stats.captures[u.team]++;
    chargeMeter(s, u.team, 10);
    if (wasHq) {
      s.winner = u.team;
      return { done: true, hq: true };
    }
    return { done: true, hq: false };
  }
  return { done: false, hq: false };
}

export function income(s: GameState, team: Team) {
  let n = 0;
  for (const r of s.tiles) for (const t of r) if (t.owner === team && TERRAIN[t.t].income) n++;
  return n * 1000;
}

export function canBuildHere(s: GameState, team: Team, x: number, y: number): boolean {
  const t = s.tiles[y][x];
  return t.owner === team && buildsAt(t.t).length > 0 && !unitAt(s, x, y) && !s.built[y][x];
}

export function buildUnit(s: GameState, team: Team, x: number, y: number, type: UnitType): Unit | null {
  const cost = costFor(s, team, type);
  if (s.funds[team] < cost || unitCount(s, team) >= s.unitCap[team] || !canBuildHere(s, team, x, y)) return null;
  s.funds[team] -= cost;
  const u = addUnit(s, type, x, y, team);
  u.moved = true;
  s.built[y][x] = true;
  return u;
}

export function canActivate(s: GameState, team: Team, level: 1 | 2) {
  // The old basic Power is retired: only one harder-to-charge Ultimate remains.
  return level === 2 && s.power[team] === 0 && s.meter[team] >= ultimateCost(s.cos[team]);
}

function damageAll(s: GameState, team: Team, amt: number, eff: PowerEffect) {
  for (const u of s.units) if (u.team === team) {
    const d = Math.min(u.hp - 1, amt);
    if (d > 0) { u.hp -= d; eff.hits.push({ x: u.x, y: u.y, dmg: d }); }
  }
}
function healAll(s: GameState, team: Team, amt: number, eff: PowerEffect, filter?: (u: Unit) => boolean) {
  for (const u of s.units) if (u.team === team && (!filter || filter(u))) {
    u.hp = Math.min(100, u.hp + amt);
    eff.heals.push({ x: u.x, y: u.y });
  }
}
function setWeather(s: GameState, w: Weather, days: number, eff: PowerEffect) {
  s.weather = w;
  s.weatherTimer = days * 2;
  // Ordinary CO powers affect both sides; activateSkill opts its owner back out immediately after this.
  s.skillWeatherImmune = [false, false];
  eff.weather = w;
}

export function activatePower(s: GameState, team: Team, level: 1 | 2): PowerEffect {
  level = 2; // basic Power is retired; keep the parameter for save/API compatibility
  const co = COS[s.cos[team]];
  const foe = (1 - team) as Team;
  const eff: PowerEffect = { team, level, name: co.superName, hits: [], heals: [] };
  eff.level = level;
  eff.name = co.superName;
  s.meter[team] = Math.max(0, s.meter[team] - ultimateCost(co.id));
  s.power[team] = level;
  switch (co.id) {
    case 'rhea': if (level === 2) healAll(s, team, 20, eff); break;
    case 'mira':
      setWeather(s, 'rain', level, eff);
      damageAll(s, foe, 20, eff);
      break;
    case 'frost':
      setWeather(s, 'snow', level, eff);
      if (level === 2) damageAll(s, foe, 20, eff);
      break;
    case 'grimm': if (level === 2) healAll(s, team, 30, eff, (u) => UNITS[u.type].cat === 'infantry'); break;
    case 'nyx': if (level === 2) s.debuff[foe] = 1; break;
    case 'volkov': if (level === 2) healAll(s, team, 20, eff); break;
    case 'architect':
      damageAll(s, foe, 20, eff); s.debuff[foe] = 1;
      break;
    case 'brann':
      if (level === 2) {
        const centers: { x: number; y: number }[] = [];
        const hitIds = new Set<number>();
        for (let n = 0; n < 2; n++) {
          let best = -1, bx = 0, by = 0;
          for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
            let v = 0;
            for (const u of s.units) if (u.team === foe && !hitIds.has(u.id) && dist(x, y, u.x, u.y) <= 2) v += UNITS[u.type].cost * Math.min(u.hp - 1, 30);
            if (v > best) { best = v; bx = x; by = y; }
          }
          if (best <= 0) break;
          centers.push({ x: bx, y: by });
          for (const u of s.units) if (u.team === foe && !hitIds.has(u.id) && dist(bx, by, u.x, u.y) <= 2) {
            const d = Math.min(u.hp - 1, 30);
            hitIds.add(u.id);
            if (d > 0) { u.hp -= d; eff.hits.push({ x: u.x, y: u.y, dmg: d }); }
          }
        }
        eff.centers = centers;
      }
      break;
  }
  return eff;
}

export function costFor(s: GameState, team: Team, type: UnitType): number {
  let c = coCost(s.cos[team], type);
  if (team === 0) c *= upgradeEffects(s.unitUps[type], isIndirect(type)).costMul;
  return Math.max(100, Math.round(c / 100) * 100);
}

export function canUseSkill(s: GameState, team: Team, id: string) {
  const sk = SKILLS[id];
  return !!sk && s.power[team] === 0 && s.skillMeter[team] >= sk.cost && s.skills[team].includes(id);
}

function clusterStrike(s: GameState, foe: Team, n: number, amt: number, eff: PowerEffect) {
  const centers: { x: number; y: number }[] = [];
  const hit = new Set<number>();
  for (let i = 0; i < n; i++) {
    let best = -1, bx = 0, by = 0;
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      let v = 0;
      for (const u of s.units) if (u.team === foe && !hit.has(u.id) && dist(x, y, u.x, u.y) <= 2) v += UNITS[u.type].cost * Math.min(u.hp - 1, amt);
      if (v > best) { best = v; bx = x; by = y; }
    }
    if (best <= 0) break;
    centers.push({ x: bx, y: by });
    for (const u of s.units) if (u.team === foe && !hit.has(u.id) && dist(bx, by, u.x, u.y) <= 2) {
      hit.add(u.id);
      const d = Math.min(u.hp - 1, amt);
      if (d > 0) { u.hp -= d; eff.hits.push({ x: u.x, y: u.y, dmg: d }); }
    }
  }
  eff.centers = centers;
}

/** Activate a purchasable tactical skill from the CO's loadout. */
export function activateSkill(s: GameState, team: Team, id: string): PowerEffect {
  const sk = SKILLS[id];
  const foe = (1 - team) as Team;
  const eff: PowerEffect = { team, level: 3, name: sk.name, desc: sk.desc, hits: [], heals: [] };
  s.skillMeter[team] = Math.max(0, s.skillMeter[team] - sk.cost);
  s.power[team] = 3;
  s.skillFx[team] = { atk: sk.atk ?? 0, def: sk.def ?? 0, move: sk.move ?? 0 };
  if (sk.weather) { setWeather(s, sk.weather, sk.days ?? 1, eff); s.skillWeatherImmune[team] = true; }
  if (sk.dmg) damageAll(s, foe, sk.dmg, eff);
  if (sk.heal) healAll(s, team, sk.heal, eff);
  if (sk.debuff) s.debuff[foe] = Math.max(s.debuff[foe], sk.debuff);
  if (sk.clusters) clusterStrike(s, foe, sk.clusters, sk.clusterDmg ?? 30, eff);
  if (sk.funds) { const f = Math.min(30000, income(s, team) * sk.funds); s.funds[team] += f; eff.funds = f; }
  return eff;
}

export interface TurnStartInfo {
  income: number;
  repairs: { x: number; y: number; amount?: number }[];
  refuels: { x: number; y: number }[];
  weatherChanged: boolean;
  radioMove: boolean;
}

export function endTurn(s: GameState, rng = Math.random): TurnStartInfo {
  const prev = s.turn;
  for (const u of s.units) u.moved = false;
  s.debuff[prev] = 0;
  s.radioMove[prev] = false;
  s.turn = (1 - prev) as Team;
  if (s.turn === 0) s.day++;
  s.built = s.tiles.map((r) => r.map(() => false));
  const t = s.turn;
  s.power[t] = 0;
  s.skillFx[t] = null;
  s.radioMove[t] = false;
  const hasRadioTower = s.tiles.some((row) => row.some((tile) => tile.t === 'tower' && tile.owner === t));
  if (hasRadioTower) {
    s.radioCycle[t]++;
    if (s.radioCycle[t] >= 3) { s.radioCycle[t] = 0; s.radioMove[t] = true; }
  } else s.radioCycle[t] = 0;
  // weather
  let weatherChanged = false;
  if (s.weatherTimer > 0) {
    s.weatherTimer--;
    if (s.weatherTimer === 0) { s.weather = s.baseWeather; s.skillWeatherImmune = [false, false]; weatherChanged = true; }
  } else if (s.weatherPool && t === 0 && rng() < 0.35) {
    const nw = s.weatherPool[Math.floor(rng() * s.weatherPool.length)];
    if (nw !== s.weather) { s.weather = nw; s.baseWeather = nw; s.skillWeatherImmune = [false, false]; weatherChanged = true; }
  }
  // income
  const inc = income(s, t);
  s.funds[t] += inc;
  // repairs
  const repairs: { x: number; y: number; amount?: number }[] = [];
  const refuels: { x: number; y: number }[] = [];
  for (const u of s.units) {
    if (u.team !== t) continue;
    const tile = s.tiles[u.y][u.x];
    const d = UNITS[u.type];
    const airRefuel = d.moveType === 'air' && tile.owner === t && ['city', 'base', 'hq', 'airport'].includes(tile.t);
    if (airRefuel && d.fuel && u.fuel !== d.fuel) {
      u.fuel = d.fuel;
      refuels.push({ x: u.x, y: u.y });
    }
    // A friendly radio tower repairs units on or beside it by +1 HP (10 internal points), free of charge.
    // (HP is shown in tenths, so the old +2 internal points was invisible on the HP badge.)
    const nearTower = s.tiles.some((row, y) => row.some((rt, x) =>
      rt.t === 'tower' && rt.owner === t && dist(x, y, u.x, u.y) <= 1,
    ));
    if (nearTower && u.hp < 100) {
      const gain = Math.min(10, 100 - u.hp);
      u.hp += gain;
      repairs.push({ x: u.x, y: u.y, amount: gain });
    }
    let ok = false;
    if (tile.owner === t) {
      if (d.cat === 'air') ok = tile.t === 'airport';
      else if (d.cat === 'naval') ok = tile.t === 'port';
      else ok = ['city', 'base', 'hq'].includes(tile.t);
    }
    if (ok && u.hp < 100) {
      const cost = Math.round(d.cost * 0.1);
      const amt = Math.min(20, 100 - u.hp);
      const price = Math.round((cost * amt) / 10);
      if (s.funds[t] >= price) {
        s.funds[t] -= price;
        u.hp += amt;
        repairs.push({ x: u.x, y: u.y, amount: amt });
      }
    }
    if (d.supply) {
      for (const o of s.units) if (o.team === t && o.id !== u.id && dist(o.x, o.y, u.x, u.y) === 1 && o.hp < 100) {
        o.hp = Math.min(100, o.hp + 10);
        repairs.push({ x: o.x, y: o.y, amount: 10 });
      }
    }
  }
  // objectives
  checkRout(s);
  const obj = s.mission.objective;
  if (t === 0 && s.winner === null) {
    if (obj.type === 'survive' && s.day > obj.days) s.winner = 0;
    else if (s.mission.dayLimit && s.day > s.mission.dayLimit) s.winner = 1;
  }
  return { income: inc, repairs, refuels, weatherChanged, radioMove: s.radioMove[t] };
}

export function visibility(s: GameState, team: Team): Set<number> | null {
  if (!s.fog) return null;
  const vis = new Set<number>();
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    if (s.tiles[y][x].owner === team) vis.add(y * s.w + x);
  }
  for (const u of s.units) {
    if (u.team !== team) continue;
    const v = unitMods(s, u).vision;
    for (let dy = -v; dy <= v; dy++) for (let dx = -v; dx <= v; dx++) {
      const d = Math.abs(dx) + Math.abs(dy);
      if (d > v) continue;
      const x = u.x + dx, y = u.y + dy;
      if (!inBounds(s, x, y)) continue;
      const tt = s.tiles[y][x].t;
      if ((tt === 'forest' || tt === 'reef') && d > 1) continue;
      vis.add(y * s.w + x);
    }
  }
  return vis;
}

export function attackRangeTiles(s: GameState, u: Unit, reach: Map<number, ReachNode>): Set<number> {
  const out = new Set<number>();
  if (!canAttackAny(u.type)) return out;
  const m = unitMods(s, u);
  const origins: number[] = isIndirect(u.type) ? [u.y * s.w + u.x] : [...reach.keys()].filter((k) => {
    const x = k % s.w, y = Math.floor(k / s.w);
    return canStop(s, u, x, y) === 'ok';
  });
  for (const k of origins) {
    const ox = k % s.w, oy = Math.floor(k / s.w);
    for (let dy = -m.rmax; dy <= m.rmax; dy++) for (let dx = -m.rmax; dx <= m.rmax; dx++) {
      const d = Math.abs(dx) + Math.abs(dy);
      if (d < m.rmin || d > m.rmax) continue;
      const x = ox + dx, y = oy + dy;
      if (inBounds(s, x, y)) out.add(y * s.w + x);
    }
  }
  return out;
}

export function computeScore(s: GameState, won: boolean, team: Team = 0) {
  const par = s.mission.par;
  const speed = Math.max(0, Math.min(1500, 1500 - Math.max(0, s.day - par) * 120));
  const power = Math.min(1500, s.stats.kills[team] * 90 + Math.floor(s.stats.dmg[team] / 10) * 4);
  const technique = Math.max(0, 1200 - s.stats.lost[team] * 110) + s.stats.captures[team] * 40;
  const mult = 1 + s.aiLevel * 0.2;
  const total = Math.round(((won ? 800 : 0) + (won ? speed : 0) + power + (won ? technique : technique / 3)) * mult);
  let rank = 'C';
  if (won) {
    if (total >= 4800) rank = 'S';
    else if (total >= 3800) rank = 'A';
    else if (total >= 2800) rank = 'B';
  } else rank = 'D';
  return { speed, power, technique, total, rank, merits: Math.round(total / (won ? 8 : 20)) };
}
