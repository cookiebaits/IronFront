import { MOVE_COST, TERRAIN, UNITS, buildsAt, coCost, weatherCost } from './data';
import {
  DIRS, calcDamage, canActivate, canAttackAny, canAttackType, canStop, dist, dispHp, effWeather, inBounds, isIndirect,
  isRefuelSite, pathTo, reachable, targetsFrom, unitAt, unitCount, unitMods,
} from './engine';
import type { GameState, Team, Unit, UnitType } from './types';

export interface AIPlan {
  unitId: number;
  path: [number, number][];
  action: 'attack' | 'capture' | 'wait';
  targetId?: number;
}

const PROP_VALUE: Record<string, number> = { hq: 9000, base: 5000, airport: 3500, port: 2500, city: 2800, tower: 3500 };

/** distance field from a goal tile for a given unit's movement profile (ignoring units) */
function distanceField(s: GameState, u: Unit, gx: number, gy: number): Float32Array {
  const N = s.w * s.h;
  const d = new Float32Array(N).fill(Infinity);
  const mt = UNITS[u.type].moveType;
  const w = effWeather(s, u.team);
  const cost = (x: number, y: number) => {
    const t = s.tiles[y][x].t;
    return weatherCost(MOVE_COST[t][mt], mt, t, w);
  };
  const start = gy * s.w + gx;
  d[start] = 0;
  const open = [start];
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (d[open[i]] < d[open[bi]]) bi = i;
    const cur = open.splice(bi, 1)[0];
    const cx = cur % s.w, cy = Math.floor(cur / s.w);
    const cc = cost(cx, cy);
    const base = d[cur] + (isFinite(cc) ? cc : 99);
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (!inBounds(s, nx, ny)) continue;
      if (!isFinite(cost(nx, ny))) continue;
      const k = ny * s.w + nx;
      if (base < d[k]) { d[k] = base; open.push(k); }
    }
  }
  return d;
}

/** For each tile, list of enemy (player) units able to attack it next turn */
export function threatMap(s: GameState, team: Team): Map<number, Unit[]> {
  const out = new Map<number, Unit[]>();
  for (const e of s.units) {
    if (e.team === team || !canAttackAny(e.type)) continue;
    const m = unitMods(s, e);
    const origins = isIndirect(e.type) ? [e.y * s.w + e.x] : [...reachable(s, e, null).keys()];
    const seen = new Set<number>();
    for (const k of origins) {
      const ox = k % s.w, oy = Math.floor(k / s.w);
      for (let dy = -m.rmax; dy <= m.rmax; dy++) for (let dx = -m.rmax; dx <= m.rmax; dx++) {
        const dd = Math.abs(dx) + Math.abs(dy);
        if (dd < m.rmin || dd > m.rmax) continue;
        const x = ox + dx, y = oy + dy;
        if (!inBounds(s, x, y)) continue;
        const kk = y * s.w + x;
        if (seen.has(kk)) continue;
        seen.add(kk);
        const arr = out.get(kk);
        if (arr) arr.push(e); else out.set(kk, [e]);
      }
    }
  }
  return out;
}

function threatValue(s: GameState, u: Unit, x: number, y: number, threats: Map<number, Unit[]>): number {
  const list = threats.get(y * s.w + x);
  if (!list) return 0;
  let total = 0;
  const fake = { ...u, x, y };
  for (const e of list) {
    if (!canAttackType(e.type, u.type)) continue;
    total += calcDamage(s, e, e.x, e.y, fake, x, y, e.hp, 4);
  }
  return Math.min(u.hp, total);
}

export function nextAIUnit(s: GameState, team: Team): Unit | null {
  const units = s.units.filter((u) => u.team === team && !u.moved);
  if (!units.length) return null;
  units.sort((a, b) => score(b) - score(a));
  return units[0];
  function score(u: Unit) {
    let v = 0;
    if (isIndirect(u.type)) v += 1000;
    if (u.capturing) v += 800;
    if (targetsFrom(s, u, u.x, u.y, false).length) v += 300;
    v += UNITS[u.type].cost / 100;
    return v;
  }
}

export function planAIUnit(s: GameState, u: Unit, threats: Map<number, Unit[]>): AIPlan {
  const team = u.team;
  const lvl = s.aiLevel;
  const reach = reachable(s, u, null);
  const def = UNITS[u.type];
  const myVal = def.cost * (u.hp / 100);
  const riskW = lvl <= 0 ? 0 : lvl === 1 ? 0.35 : lvl === 2 ? 0.7 : 0.9;

  // Low-fuel aircraft prioritize the nearest friendly refuel site over combat.
  if (def.moveType === 'air' && u.fuel !== undefined && u.fuel <= unitMods(s, u).move + 3) {
    let fx = -1, fy = -1, nearest = Infinity;
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      if (!isRefuelSite(s, team, x, y)) continue;
      const occ = unitAt(s, x, y);
      if (occ && occ.id !== u.id) continue;
      const d = dist(u.x, u.y, x, y);
      if (d < nearest) { nearest = d; fx = x; fy = y; }
    }
    if (fx >= 0) {
      const field = distanceField(s, u, fx, fy);
      let bestK = u.y * s.w + u.x, best = field[bestK];
      for (const [k] of reach) {
        const x = k % s.w, y = Math.floor(k / s.w);
        if (canStop(s, u, x, y) !== 'ok') continue;
        const val = field[k] + threatValue(s, u, x, y, threats) * (lvl >= 2 ? 0.04 : 0.01);
        if (val < best) { best = val; bestK = k; }
      }
      return { unitId: u.id, path: pathTo(s, reach, bestK % s.w, Math.floor(bestK / s.w)), action: 'wait' };
    }
  }

  // pick strategic goal
  const enemies = s.units.filter((e) => e.team !== team);
  let goalX = -1, goalY = -1, goalScore = -Infinity;
  if (def.capture) {
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const t = s.tiles[y][x];
      if (!TERRAIN[t.t].prop || t.owner === team) continue;
      const occ = unitAt(s, x, y);
      if (occ && occ.id !== u.id && occ.team === team) continue;
      const v = (PROP_VALUE[t.t] ?? 2000) * (t.owner === -1 ? 1 : 1.3) / (dist(u.x, u.y, x, y) + 2);
      if (v > goalScore) { goalScore = v; goalX = x; goalY = y; }
    }
  }
  if (canAttackAny(u.type)) {
    for (const e of enemies) {
      if (!canAttackType(u.type, e.type)) continue;
      const base = def.dmg[UNITS[e.type].armor] ?? 0;
      const v = (base * UNITS[e.type].cost) / 2500 / (dist(u.x, u.y, e.x, e.y) + 2);
      if (v > goalScore) { goalScore = v; goalX = e.x; goalY = e.y; }
    }
  }
  // threatened HQ? defend
  let hqX = -1, hqY = -1;
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.tiles[y][x].t === 'hq' && s.tiles[y][x].owner === team) { hqX = x; hqY = y; }
  if (hqX >= 0 && canAttackAny(u.type)) {
    const intruder = enemies.find((e) => UNITS[e.type].capture && dist(e.x, e.y, hqX, hqY) <= 4);
    if (intruder && canAttackType(u.type, intruder.type) && dist(u.x, u.y, intruder.x, intruder.y) < 10) {
      goalX = intruder.x; goalY = intruder.y; goalScore = 1e9;
    }
  }
  if (goalX < 0) {
    // go toward enemy HQ or nearest enemy
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.tiles[y][x].t === 'hq' && s.tiles[y][x].owner !== team) { goalX = x; goalY = y; }
    if (goalX < 0 && enemies.length) { goalX = enemies[0].x; goalY = enemies[0].y; }
  }
  const field = goalX >= 0 ? distanceField(s, u, goalX, goalY) : null;

  let best: AIPlan = { unitId: u.id, path: [[u.x, u.y]], action: 'wait' };
  let bestScore = -Infinity;
  const moveMax = unitMods(s, u).move;

  for (const [k] of reach) {
    const x = k % s.w, y = Math.floor(k / s.w);
    if (canStop(s, u, x, y) !== 'ok') continue;
    const moved = x !== u.x || y !== u.y;
    const tile = s.tiles[y][x];
    const stars = def.cat === 'air' ? 0 : TERRAIN[tile.t].def;
    // positional
    let pos = 0;
    if (field) {
      const dd = field[k];
      pos -= (isFinite(dd) ? dd : 60) * 60;
      if (isIndirect(u.type)) {
        // indirect: prefer staying at range from enemies
        const m = unitMods(s, u, x, y);
        let near = 99;
        for (const e of enemies) near = Math.min(near, dist(x, y, e.x, e.y));
        if (near <= m.rmax + 1 && near >= m.rmin) pos += 400;
        if (near <= 2) pos -= 600;
      }
    }
    pos += stars * 25;
    const fakeU = { ...u, x, y } as Unit;
    const risk = riskW > 0 ? threatValue(s, fakeU, x, y, threats) : 0;
    pos -= (risk / 100) * myVal * riskW;
    if (s.tiles[y][x].owner === team && u.hp < 50 && ['city', 'base', 'hq'].includes(tile.t) && def.cat !== 'air' && def.cat !== 'naval') pos += 500;
    if (lvl <= 0) pos += Math.random() * 300;

    // wait
    if (pos > bestScore) { bestScore = pos; best = { unitId: u.id, path: pathTo(s, reach, x, y), action: 'wait' }; }

    // capture
    if (def.capture && TERRAIN[tile.t].prop && tile.owner !== team) {
      const left = tile.capture - dispHp(u.hp);
      let v = (PROP_VALUE[tile.t] ?? 2000) * (left <= 0 ? 1.6 : 1) + (u.capturing && !moved ? 2500 : 0) + 1500;
      if (tile.t === 'hq' && left <= 0) v = 1e8;
      const sc = v + pos * 0.3 + 2000;
      if (sc > bestScore) { bestScore = sc; best = { unitId: u.id, path: pathTo(s, reach, x, y), action: 'capture' }; }
    }

    // attack
    const targets = targetsFrom(s, u, x, y, moved);
    for (const t of targets) {
      const dmg = Math.min(t.hp, calcDamage(s, fakeU, x, y, t, t.x, t.y, u.hp, 4));
      const kill = dmg >= t.hp;
      let v = (dmg / 100) * UNITS[t.type].cost * 1.2;
      if (kill) v += UNITS[t.type].cost * 0.6 + 800;
      if (UNITS[t.type].capture && s.tiles[t.y][t.x].owner === team) v += 2500; // stop captures
      if (t.capturing) v += 1500;
      let counter = 0;
      if (!kill && !isIndirect(t.type) && dist(x, y, t.x, t.y) === 1 && canAttackType(t.type, u.type)) {
        const tmp = { ...t, hp: t.hp - dmg } as Unit;
        counter = calcDamage(s, tmp, t.x, t.y, fakeU, x, y, t.hp - dmg, 4);
      }
      v -= (Math.min(counter, u.hp) / 100) * myVal * (lvl >= 2 ? 1 : 0.6);
      const sc = v + pos * 0.25 + 600;
      if (sc > bestScore) { bestScore = sc; best = { unitId: u.id, path: pathTo(s, reach, x, y), action: 'attack', targetId: t.id }; }
    }
  }
  void moveMax;
  return best;
}

export function planBuilds(s: GameState, team: Team): { x: number; y: number; type: UnitType }[] {
  const out: { x: number; y: number; type: UnitType }[] = [];
  const co = s.cos[team];
  const foes = s.units.filter((u) => u.team !== team);
  let funds = s.funds[team];
  let count = unitCount(s, team);
  const capturers = s.units.filter((u) => u.team === team && UNITS[u.type].capture).length;
  const neutral = s.tiles.flat().filter((t) => TERRAIN[t.t].prop && t.owner !== team).length;
  const factories: [number, number][] = [];
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const t = s.tiles[y][x];
    if (t.owner === team && buildsAt(t.t).length && !unitAt(s, x, y)) factories.push([x, y]);
  }
  // build at the factories closest to enemies first
  factories.sort((a, b) => nearestFoe(a) - nearestFoe(b));
  function nearestFoe([x, y]: [number, number]) {
    let n = 99;
    for (const f of foes) n = Math.min(n, dist(x, y, f.x, f.y));
    return n;
  }
  const reserve = s.aiLevel >= 2 ? 0 : 1000;
  for (const [x, y] of factories) {
    if (count >= s.unitCap[team]) break;
    const opts = buildsAt(s.tiles[y][x].t);
    let bestT: UnitType | null = null, bestV = -Infinity;
    for (const type of opts) {
      const cost = coCost(co, type);
      if (cost > funds - reserve && !(type === 'infantry' && cost <= funds)) continue;
      const d = UNITS[type];
      let v = 0;
      for (const f of foes) {
        const b = d.dmg[UNITS[f.type].armor] ?? 0;
        v += b * UNITS[f.type].cost * (f.hp / 100);
        const fb = UNITS[f.type].dmg[d.armor] ?? 0;
        v -= fb * cost * 0.35;
      }
      v = v / Math.sqrt(cost);
      if (d.capture && capturers < 3 && neutral > 0) v += 600;
      if (d.carry) v -= 400;
      if (type === 'missiles' || type === 'fighter' || type === 'aa') {
        const air = foes.filter((f) => UNITS[f.type].cat === 'air').length;
        if (!air) v -= 2000;
      }
      v += Math.random() * 60;
      if (v > bestV) { bestV = v; bestT = type; }
    }
    if (bestT) {
      out.push({ x, y, type: bestT });
      funds -= coCost(co, bestT);
      count++;
    }
  }
  return out;
}

export function aiPowerChoice(s: GameState, team: Team): 0 | 1 | 2 {
  if (s.aiLevel <= 0) return 0;
  const mine = s.units.filter((u) => u.team === team).length;
  if (mine < 2) return 0;
  if (canActivate(s, team, 2)) return 2;
  return 0;
}
