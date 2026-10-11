import { useEffect, useRef, useState } from 'react';
import { COS, SKILLS, TERRAIN, TERRAIN_BONUS, TRACKS, TRACK_ORDER, UNITS, WEATHER_INFO, buildsAt, rankSlots, ultimateCost } from '../game/data';
import { REWARDS } from '../game/campaign';
import {
  activatePower, activateSkill, attackRangeTiles, buildUnit, canActivate, canAttackType, canBuildHere, canStop, canUseSkill, capture, commitMove, computeScore, costFor, createGame, dist, isIndirect, removeUnit,
  dispHp, dropCargo, dropTiles, endTurn, forecast, inBounds, loadInto, pathTo, reachable, resolveAttack, targetsFrom,
  unitAt, unitById, unitCount, unitMods, visibility, type ReachNode, type TurnStartInfo,
} from '../game/engine';
import { aiPowerChoice, nextAIUnit, planAIUnit, planBuilds, threatMap } from '../game/ai';
import { drawProperty, drawTerrainLayer, drawUnit } from '../game/draw';
import { sfx } from '../game/audio';
import { TUTORIAL } from '../game/campaign';
import { getLastDrops, type PieceDrop } from '../game/unlocks';
import BattleScene from './BattleScene';
import Portrait from './Portrait';
import COInfo from './COInfo';
import { GraphicsSettingsModal } from './GraphicsSettingsModal';
import type { AttackResult, GameState, MissionDef, PowerEffect, SaveData, Settings, Team, Unit, UnitType, Weather } from '../game/types';

export type ScoreInfo = ReturnType<typeof computeScore>;

export interface OnlineSnapshot {
  revision: number;
  activeSlot: 0 | 1;
  actorSlot: 0 | 1;
  undoSlot: 0 | 1 | null;
  state: GameState;
}
export interface OnlineControl {
  mode: 'pvp' | 'coop';
  localTeam: Team;
  slot: 0 | 1;
  isHost: boolean;
  connected: boolean;
  canAct: boolean;
  undoAllowed: boolean;
  opponentName: string;
  snapshot: OnlineSnapshot | null;
  publish: (state: GameState, event: 'action' | 'undo' | 'turn-start' | 'turn-end') => void;
}

interface Props {
  mission: MissionDef;
  playerCo: string;
  enemyCo: string;
  save: SaveData;
  opts?: { weather?: Weather; fog?: boolean; aiLevel?: number; dynamic?: boolean };
  isCampaign: boolean;
  hasNext: boolean;
  onExit: () => void;
  onRestart: () => void;
  onNext: () => void;
  onComplete: (won: boolean, score: ScoreInfo, gs: GameState) => number;
  onSettings: (s: Settings) => void;
  online?: OnlineControl;
  /** A saved battle to continue (campaign auto-save). */
  resume?: GameState;
  /** Called at the start of each of your turns (and when the app is backgrounded) so the battle can be resumed. */
  onAutosave?: (gs: GameState) => void;
}

type Mode = 'idle' | 'selected' | 'moving' | 'menu' | 'target' | 'drop' | 'busy' | 'build';
type MenuId = 'fire' | 'capture' | 'load' | 'drop' | 'wait' | 'cancel';
interface UI {
  mode: Mode;
  selId: number | null;
  reach: Map<number, ReachNode> | null;
  stops: Set<number>;
  atk: Set<number>;
  danger: { reach: Set<number>; atk: Set<number> } | null;
  pending: { x: number; y: number; path: [number, number][]; ambush: boolean; committed?: boolean } | null;
  targets: Unit[];
  tIdx: number;
  drops: [number, number][];
  menu: { id: MenuId; label: string }[];
  mIdx: number;
  cursor: { x: number; y: number };
  build: { x: number; y: number; list: UnitType[] } | null;
  bIdx: number;
}
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; s: number; g: number; k: 0 | 1 | 2 }
interface Float { x: number; y: number; text: string; c: string; t0: number; dur: number; size: number }
interface Anim { path: [number, number][]; t0: number; per: number; resolve: () => void; last: number }

// HUD heights reserved above/below the map. These update dynamically based on element measurements.
let TOP = 90, BOT = 104;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/** The retired basic Power no longer creates a ready notice; only the Ultimate does. */
function chargeLevelFor(s: GameState, team: Team): 0 | 2 {
  return s.meter[team] >= ultimateCost(s.cos[team]) ? 2 : 0;
}

export default function GameView(props: Props) {
  const { mission, save } = props;
  const settings = save.settings;
  const speed = settings.speed;
  const isVert = props.opts?.vertical ?? (typeof window !== 'undefined' && window.innerHeight > window.innerWidth);
  const gsRef = useRef<GameState>(null as unknown as GameState);
  if (!gsRef.current && props.resume) {
    // Continue a saved battle: the saved state has no mission object (stored by id), so re-attach it.
    gsRef.current = { ...JSON.parse(JSON.stringify(props.resume)), mission } as GameState;
  }
  if (!gsRef.current) {
    const rank = props.online ? 0 : save.coRank?.[props.playerCo] ?? 0;
    const skills = props.online ? [] : (save.loadout?.[props.playerCo] ?? []).filter((id) => SKILLS[id] && save.ownedSkills.includes(id)).slice(0, rankSlots(rank));
    gsRef.current = createGame(mission, props.playerCo, props.enemyCo, { unitUps: props.online ? {} : save.unitUps ?? {}, coRank: rank, skills }, { ...props.opts, vertical: isVert });
  }
  const gs = gsRef.current;
  // Forward-compatible resume migration for saves made before the separate skill gauge.
  gs.skillMeter ??= [0, 0];
  gs.skillMeterMax ??= [Math.max(1, ...gs.skills[0].map((id) => SKILLS[id]?.cost ?? 0)), Math.max(1, ...gs.skills[1].map((id) => SKILLS[id]?.cost ?? 0))];
  gs.skillWeatherImmune ??= [false, false];
  // Skill costs no longer extend the Power/Super meter.
  gs.meterMax = [ultimateCost(gs.cos[0]), ultimateCost(gs.cos[1])];
  const localTeam: Team = props.online?.localTeam ?? 0;
  const isLocalTurn = () => gs.turn === localTeam && (!propsRef.current.online || propsRef.current.online.canAct);

  const [uiTick, setTick] = useState(0);
  const lastProgress = useRef(performance.now());
  const aiToken = useRef(0);
  const propsRef = useRef(props);
  propsRef.current = props;
  const bump = () => { lastProgress.current = performance.now(); setTick((t) => t + 1); };
  const ui = useRef<UI>({
    mode: 'idle', selId: null, reach: null, stops: new Set(), atk: new Set(), danger: null, pending: null,
    targets: [], tIdx: 0, drops: [], menu: [], mIdx: 0, cursor: { x: 0, y: 0 }, build: null, bIdx: 0,
  });
  const cvRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const topHudRef = useRef<HTMLDivElement>(null);
  const bottomHudRef = useRef<HTMLDivElement>(null);
  const cam = useRef({ x: 0, y: 0, tx: null as number | null, ty: null as number | null });
  const view = useRef({ vw: 0, vh: 0, ts: 56, zoom: isVert ? 1.0 : 0.75, dpr: 1 });
  const anims = useRef(new Map<number, Anim>());
  const parts = useRef<Particle[]>([]);
  const floats = useRef<Float[]>([]);
  const shake = useRef(0);
  const visRef = useRef<Set<number> | null>(null);
  const terrCache = useRef<{ key: string; c: HTMLCanvasElement | null }>({ key: '', c: null });

  const [battle, setBattle] = useState<{ r: AttackResult; done: () => void } | null>(null);
  const [powerFx, setPowerFx] = useState<{ co: string; name: string; level: number; team: Team; desc?: string } | null>(null);
  const [banner, setBanner] = useState<{ text: string; sub: string; team: Team } | null>(null);
  const [paused, setPaused] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [over, setOver] = useState<{ won: boolean; score: ScoreInfo; place: number; reward?: string | null; drops?: PieceDrop[] } | null>(null);
  const [tutIndex, setTutIndex] = useState(0);
  const tutIndexRef = useRef(0);
  tutIndexRef.current = tutIndex;
  const tutActionIndex = useRef(0);
  const tut = mission.tutorial && tutIndex < TUTORIAL.length ? tutIndex : -1;
  const guideStep = tut >= 0 ? TUTORIAL[tut] : null;
  const guideEvent = () => {
    if (!mission.tutorial) return '';
    const step = TUTORIAL[tutIndexRef.current];
    return step?.events?.[tutActionIndex.current] ?? step?.event ?? 'complete';
  };
  const guideTarget = () => {
    const step = TUTORIAL[tutIndexRef.current];
    return step?.targets?.[guideEvent()] ?? step?.target;
  };
  const [tutorialDismissed, setTutorialDismissed] = useState(false);
  const tutorialDismissedRef = useRef(tutorialDismissed);
  tutorialDismissedRef.current = tutorialDismissed;
  const [tutNote, setTutNote] = useState<{ title: string; text: string; icon?: string } | null>(null);
  // Counter-damage % from the two tank attacks, quoted in the CO dialogue.
  const tutCounters = useRef<[number, number]>([0, 0]);
  const fillNote = (n: { title: string; text: string; icon?: string }) => ({
    ...n,
    text: n.text.replace('{c1}', String(tutCounters.current[0])).replace('{c2}', String(tutCounters.current[1])),
  });
  const isUndoEvent = (e: string) => e === 'undo' || e === 'undo-attack';
  // The full briefing waits while a CO dialogue card is showing, so cards never overlap.
  const briefingOpen = !!(mission.tutorial && guideStep && !tutorialDismissed && !tutNote);
  // Any tutorial card (full briefing or short note) pauses all battlefield input.
  const tutorialPromptOpen = briefingOpen || !!tutNote;
  const [showIntel, setShowIntel] = useState(false);
  const [coInfo, setCoInfo] = useState<Team | null>(null);
  const [showGraphicsSettings, setShowGraphicsSettings] = useState(false);
  const [rangePeek, setRangePeek] = useState<{ text: string; until: number } | null>(null);
  const [chargeFx, setChargeFx] = useState<{ team: Team; level: 1 | 2; id: number } | null>(null);
  const chargeFxRef = useRef<{ team: Team; level: 1 | 2; id: number } | null>(null);
  const chargeFxId = useRef(0);
  const chargeFxQueue = useRef<{ team: Team; level: 1 | 2; id: number }[]>([]);
  const [fxClosing, setFxClosing] = useState(false);
  const fxClosingRef = useRef(false);
  // When resuming a saved battle, start from the saved charge so old "ready" banners don't replay.
  const chargeLevels = useRef<[number, number]>(props.resume ? [chargeLevelFor(gs, 0), chargeLevelFor(gs, 1)] : [0, 0]);
  const lastTap = useRef<{ x: number; y: number; at: number } | null>(null);
  const finished = useRef(false);

  // ---------- undo (one per turn) ----------
  const clone = <T,>(o: T): T => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));
  const undoSnap = useRef<GameState | null>(null);
  const undoUsedDay = useRef(-1);
  const saveSnap = () => {
    if (gs.turn !== localTeam || !isLocalTurn() || undoUsedDay.current === gs.day) return;
    try { undoSnap.current = clone(gs); } catch { undoSnap.current = null; }
  };
  const canUndo = () => gs.turn === localTeam && (isLocalTurn() || !!propsRef.current.online?.undoAllowed) && gs.winner === null && !finished.current && undoUsedDay.current !== gs.day && !!undoSnap.current
    && (ui.current.mode === 'idle' || ui.current.mode === 'selected')
    && (!mission.tutorial || isUndoEvent(guideEvent()) || guideEvent() === 'field-guide');
  const doUndo = () => {
    // Capture the lesson event before restoring the game snapshot. Tutorial state is not part
    // of the game snapshot; advancing with this exact event prevents "USED" from getting stuck.
    const lessonUndoEvent = guideEvent();
    if (mission.tutorial && !isUndoEvent(lessonUndoEvent) && lessonUndoEvent !== 'field-guide') { sfx.cancel(); return; }
    if (!canUndo() || !undoSnap.current) { sfx.cancel(); return; }
    Object.assign(gs, clone(undoSnap.current));
    undoSnap.current = null;
    undoUsedDay.current = gs.day;
    anims.current.clear();
    resetUI();
    refreshVis();
    terrCache.current.key = '';
    sfx.cancel();
    shake.current = 4;
    float(ui.current.cursor.x, ui.current.cursor.y, '↶ UNDO', '#a5f3fc', 1.1);
    if (mission.tutorial && isUndoEvent(lessonUndoEvent)) {
      setTutNote(null);
      setTutorialDismissed(true);
      tutEvent(lessonUndoEvent);
    }
    propsRef.current.online?.publish(gs, 'undo');
    bump();
  };

  const refreshVis = () => { visRef.current = visibility(gs, localTeam); };
  const isVis = (x: number, y: number) => !visRef.current || visRef.current.has(y * gs.w + x);

  // A grouped lesson keeps one briefing open while its required actions advance in sequence.
  const tutEvent = (e: string) => {
    if (!mission.tutorial) return;
    const step = TUTORIAL[tutIndexRef.current];
    if (!step) return;
    if (step.events) {
      if (step.events[tutActionIndex.current] !== e) return;
      tutActionIndex.current++;
      if (tutActionIndex.current < step.events.length) {
        setTutorialDismissed(true);
        // CO dialogue tied to this exact step (e.g. "Capture first!" right after the forest move).
        const note = step.notes?.[tutActionIndex.current];
        if (note) setTutNote(fillNote(note));
        const nextTarget = step.targets?.[step.events[tutActionIndex.current]];
        if (nextTarget?.x !== undefined && nextTarget.y !== undefined) {
          ui.current.cursor = { x: nextTarget.x, y: nextTarget.y };
          centerOn(nextTarget.x, nextTarget.y);
        }
        bump();
        return;
      }
      tutActionIndex.current = 0;
      if (step.doneNote) setTutNote(fillNote(step.doneNote));
    } else if (step.event !== e) return;
    tutIndexRef.current++;
    setTutorialDismissed(false);
    setTutIndex(tutIndexRef.current);
  };
  const focusTutorialTarget = () => {
    let target = guideTarget();
    if (target?.x === undefined || target.y === undefined) return;
    if (isVert) {
      const origW = Math.max(...mission.map.map((r) => r.length));
      target = { ...target, x: target.y, y: origW - 1 - target.x };
    }
    ui.current.cursor = { x: target.x, y: target.y };
    centerOn(target.x, target.y);
  };
  const continueTutorialPrompt = () => {
    if (tutNote) { sfx.select(); setTutNote(null); bump(); return; }
    if (!guideStep) return;
    sfx.select();
    if (guideStep.kind === 'info') tutEvent(guideStep.event);
    else { setTutorialDismissed(true); focusTutorialTarget(); bump(); }
  };

  // "Power / Ultimate ready" notices wait until any battle cut-scene has finished,
  // then pause a beat so the player sees the animation play out before the banner.
  // ---- "Power / Ultimate ready" notices ----
  // 1) Detect new charge levels only after any battle cut-scene has finished.
  // 2) Notices are queued PER CO and only shown on that CO's own turn, one at a time:
  //    if both COs fill up together, the CO whose turn it is shows first; the opponent's
  //    banner waits until their turn starts. Banners never overlap other banners/cut-ins.
  useEffect(() => {
    if (battle) return;
    const delay = window.setTimeout(() => {
      let queued = false;
      for (const team of [0, 1] as Team[]) {
        const next = chargeLevelFor(gs, team), prev = chargeLevels.current[team];
        if (next > prev && next > 0) {
          const queue = chargeFxQueue.current.filter((n) => n.team !== team || n.level > next);
          queue.push({ team, level: next as 1 | 2, id: ++chargeFxId.current });
          chargeFxQueue.current = queue;
          queued = true;
        }
        chargeLevels.current[team] = next;
      }
      if (queued) bump(); // re-run the display pump below
    }, 500);
    return () => window.clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiTick, gs, battle]);

  const finishChargeFx = (id: number) => {
    if (chargeFxRef.current?.id !== id) return;
    chargeFxRef.current = null;
    fxClosingRef.current = false;
    setFxClosing(false);
    setChargeFx(null);
  };
  /** Tap / click / key: shorten the animation and close the banner. */
  const dismissChargeFx = () => {
    const cur = chargeFxRef.current;
    if (!cur || fxClosingRef.current) return;
    fxClosingRef.current = true;
    setFxClosing(true);
    window.setTimeout(() => finishChargeFx(cur.id), 260);
  };

  useEffect(() => {
    if (chargeFx || battle || banner || powerFx || over || tutorialPromptOpen) return;
    const queue = chargeFxQueue.current;
    for (let i = queue.length - 1; i >= 0; i--) if (chargeLevelFor(gs, queue[i].team) < queue[i].level) queue.splice(i, 1); // stale
    const idx = queue.findIndex((n) => n.team === gs.turn);
    if (idx < 0) return;
    const [n] = queue.splice(idx, 1);
    sfx.charge();
    shake.current = Math.max(shake.current, n.level === 2 ? 14 : 7);
    for (const u of gs.units) if (u.team === n.team) sparkle(u.x, u.y, n.level === 2 ? ['#f0abfc', '#fde047', '#fff'] : ['#fde047', '#38bdf8', '#fff'], n.level === 2 ? 12 : 6);
    chargeFxRef.current = n;
    fxClosingRef.current = false;
    setFxClosing(false);
    setChargeFx(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiTick, chargeFx, battle, banner, powerFx, over, tutorialPromptOpen]);

  useEffect(() => {
    if (!chargeFx) return;
    const id = chargeFx.id;
    const timeout = window.setTimeout(() => finishChargeFx(id), chargeFx.level === 2 ? 4700 : 3100);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargeFx?.id]);

  /** AI turn helper: wait for any pending banner for this team so banners never overlap AI action. */
  const waitForChargeFx = async (team: Team) => {
    for (let i = 0; i < 90; i++) {
      const pending = chargeFxQueue.current.some((n) => n.team === team && chargeLevelFor(gs, n.team) >= n.level);
      if (!chargeFxRef.current && !pending) return;
      await sleep(100);
    }
  };

  // ---------- camera ----------
  const computeTs = () => {
    const v = view.current;
    const availableH = Math.max(100, v.vh - TOP - BOT);
    const availableW = Math.max(100, v.vw - 8);
    // Expand baseline scale so the map stretches comfortably across wide/landscape screens
    const baseW = availableW / gs.w;
    const baseH = availableH / gs.h;
    // Allow tile size to fill width or height naturally for landscape baselines (e.g. Pixel 9)
    const base = Math.max(baseW, baseH);
    const minTile = v.vh < 520 ? 24 : 32;
    v.ts = Math.round(Math.max(minTile, Math.min(110, base)) * v.zoom);
  };
  const camBounds = () => {
    const v = view.current;
    const MW = gs.w * v.ts, MH = gs.h * v.ts;
    const avH = v.vh - TOP - BOT;
    const bx: [number, number] = MW <= v.vw ? [-(v.vw - MW) / 2, -(v.vw - MW) / 2] : [-16, MW - v.vw + 16];
    const by: [number, number] = MH <= avH ? [-(TOP + (avH - MH) / 2), -(TOP + (avH - MH) / 2)] : [-TOP - 8, MH - v.vh + BOT + 8];
    return { bx, by };
  };
  const clampCam = () => {
    const { bx, by } = camBounds();
    cam.current.x = Math.max(bx[0], Math.min(bx[1], cam.current.x));
    cam.current.y = Math.max(by[0], Math.min(by[1], cam.current.y));
  };
  const centerOn = (x: number, y: number, smooth = true) => {
    const v = view.current;
    const tx = x * v.ts + v.ts / 2 - v.vw / 2;
    const ty = y * v.ts + v.ts / 2 - (TOP + (v.vh - TOP - BOT) / 2);
    const { bx, by } = camBounds();
    const cx = Math.max(bx[0], Math.min(bx[1], tx));
    const cy = Math.max(by[0], Math.min(by[1], ty));
    if (smooth) { cam.current.tx = cx; cam.current.ty = cy; } else { cam.current.x = cx; cam.current.y = cy; }
  };
  const ensureVisible = (x: number, y: number) => {
    const v = view.current;
    const sx = x * v.ts - cam.current.x, sy = y * v.ts - cam.current.y;
    if (sx < v.ts * 0.5 || sx > v.vw - v.ts * 1.5 || sy < TOP + v.ts * 0.3 || sy > v.vh - BOT - v.ts * 1.3) centerOn(x, y);
  };

  // ---------- fx ----------
  const wc = (x: number, y: number) => ({ px: x * view.current.ts + view.current.ts / 2, py: y * view.current.ts + view.current.ts / 2 });
  const explosion = (x: number, y: number, big = true) => {
    const { px, py } = wc(x, y);
    const ts = view.current.ts;
    const n = big ? 34 : 12;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (Math.random() * 3 + 1) * ts / 40;
      parts.current.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - ts / 60, life: 0, max: 25 + Math.random() * 30, c: ['#fde047', '#fb923c', '#ef4444', '#f97316'][i % 4], s: ts / 14 + Math.random() * ts / 10, g: 0.05, k: 0 });
    }
    if (big) {
      for (let i = 0; i < 10; i++) parts.current.push({ x: px + (Math.random() - 0.5) * ts * 0.5, y: py, vx: (Math.random() - 0.5) * 0.6, vy: -0.6 - Math.random(), life: 0, max: 60 + Math.random() * 30, c: '#57534e', s: ts / 8, g: -0.005, k: 1 });
      parts.current.push({ x: px, y: py, vx: 0, vy: 0, life: 0, max: 24, c: '#fff7ed', s: ts * 0.9, g: 0, k: 2 });
      shake.current = Math.max(shake.current, 14);
    } else shake.current = Math.max(shake.current, 5);
  };
  const sparkle = (x: number, y: number, colors: string[], n = 20) => {
    const { px, py } = wc(x, y);
    const ts = view.current.ts;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (Math.random() * 2 + 1) * ts / 40;
      parts.current.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - ts / 30, life: 0, max: 40 + Math.random() * 25, c: colors[i % colors.length], s: ts / 18 + Math.random() * ts / 18, g: 0.06, k: 0 });
    }
  };
  const float = (x: number, y: number, text: string, c = '#fde047', size = 1) => {
    const { px, py } = wc(x, y);
    floats.current.push({ x: px, y: py - view.current.ts * 0.3, text, c, t0: performance.now(), dur: 1300, size });
  };

  const animateMove = (u: Unit, path: [number, number][]) => new Promise<void>((resolve) => {
    if (path.length < 2) { resolve(); return; }
    const per = 150 / speed;
    let done = false;
    const fin = () => {
      if (done) return;
      done = true;
      if (anims.current.get(u.id)?.resolve === fin) anims.current.delete(u.id);
      resolve();
    };
    anims.current.set(u.id, { path, t0: performance.now(), per, resolve: fin, last: -1 });
    // fail-safe: never wait on an animation forever (e.g. backgrounded tab, render hiccup)
    setTimeout(fin, path.length * per + 700);
  });

  const playBattle = (r: AttackResult, mine: boolean) => new Promise<void>((resolve) => {
    const mode = propsRef.current.save.settings.battleAnim;
    const visible = isVis(r.ax, r.ay) || isVis(r.dx, r.dy);
    if (mode === 'off' || (mode === 'player' && !mine) || !visible) { resolve(); return; }
    let fin = false;
    const done = () => { if (fin) return; fin = true; setBattle(null); resolve(); };
    setBattle({ r, done });
    setTimeout(done, 9000 / speed + 1500);
  });

  // ---------- selection ----------
  const resetUI = () => {
    const u = ui.current;
    u.mode = 'idle'; u.selId = null; u.reach = null; u.stops = new Set(); u.atk = new Set(); u.pending = null;
    u.targets = []; u.drops = []; u.menu = []; u.build = null; u.danger = null;
  };

  const selectUnit = (unit: Unit) => {
    const u = ui.current;
    refreshVis();
    const reach = reachable(gs, unit, visRef.current);
    const stops = new Set<number>();
    for (const k of reach.keys()) if (canStop(gs, unit, k % gs.w, Math.floor(k / gs.w))) stops.add(k);
    u.mode = 'selected'; u.selId = unit.id; u.reach = reach; u.stops = stops;
    u.atk = attackRangeTiles(gs, unit, reach);
    u.danger = null;
    sfx.select();
    if (mission.tutorial && guideEvent() === 'select-infantry' && unit.type === 'infantry' && unit.x === 4 && unit.y === 2) tutEvent('select-infantry');
    if (mission.tutorial && guideEvent() === 'select-capturer' && unit.capturing && unit.x === 4 && unit.y === 1) tutEvent('select-capturer');
    if (mission.tutorial && guideEvent() === 'select-support-infantry' && unit.type === 'infantry' && unit.x === 2 && unit.y === 4) tutEvent('select-support-infantry');
    if (mission.tutorial && guideEvent() === 'select-tank' && unit.type === 'tank' && unit.x === 3 && unit.y === 3) tutEvent('select-tank');
    if (mission.tutorial && guideEvent() === 'select-radio-infantry' && unit.type === 'infantry' && unit.x === 3 && unit.y === 5) tutEvent('select-radio-infantry');
    if (mission.tutorial && guideEvent() === 'select-damaged-tank' && unit.type === 'tank' && unit.x === 5 && unit.y === 3) tutEvent('select-damaged-tank');
    bump();
  };

  const showDanger = (unit: Unit) => {
    const reach = reachable(gs, unit, null);
    const r = new Set<number>();
    for (const k of reach.keys()) if (canStop(gs, unit, k % gs.w, Math.floor(k / gs.w))) r.add(k);
    ui.current.danger = { reach: r, atk: attackRangeTiles(gs, unit, reach) };
    sfx.menu();
    bump();
  };

  const openMenu = (unit: Unit, px: number, py: number) => {
    const u = ui.current;
    const moved = px !== unit.x || py !== unit.y;
    const stop = canStop(gs, unit, px, py);
    const menu: { id: MenuId; label: string }[] = [];
    if (u.pending?.ambush) {
      menu.push({ id: 'wait', label: 'Wait' });
    } else if (stop === 'load') {
      menu.push({ id: 'load', label: 'Load' });
    } else {
      const targets = targetsFrom(gs, unit, px, py, moved, visRef.current);
      if (targets.length) menu.push({ id: 'fire', label: 'Fire' });
      const tile = gs.tiles[py][px];
      if (UNITS[unit.type].capture && TERRAIN[tile.t].prop && tile.owner !== unit.team) menu.push({ id: 'capture', label: 'Capture' });
      if (unit.cargo) {
        const ox = unit.x, oy = unit.y;
        unit.x = px; unit.y = py;
        const d = dropTiles(gs, unit);
        unit.x = ox; unit.y = oy;
        if (d.length) menu.push({ id: 'drop', label: 'Drop' });
      }
      menu.push({ id: 'wait', label: 'Wait' });
    }
    if (!u.pending?.ambush && !u.pending?.committed) menu.push({ id: 'cancel', label: 'Cancel' });
    if (mission.tutorial && (guideEvent() === 'first-capture' || guideEvent() === 'capture-radio')) {
      u.menu = menu.filter((m) => m.id === 'capture');
    } else if (mission.tutorial && (guideEvent() === 'wait-tank-city')) {
      u.menu = menu.filter((m) => m.id === 'wait');
    } else u.menu = menu;
    u.mIdx = 0; u.mode = 'menu';
    if (!u.pending) u.pending = { x: px, y: py, path: [[unit.x, unit.y]], ambush: false };
    sfx.menu();
    bump();
  };

  const truncateForAmbush = (unit: Unit, path: [number, number][]) => {
    let ambush = false;
    let end = path.length - 1;
    for (let i = 1; i < path.length; i++) {
      const o = unitAt(gs, path[i][0], path[i][1]);
      if (o && o.team !== unit.team) { ambush = true; end = i - 1; break; }
    }
    if (ambush) {
      while (end > 0) {
        const o = unitAt(gs, path[end][0], path[end][1]);
        if (!o || o.id === unit.id) break;
        end--;
      }
    }
    return { path: path.slice(0, end + 1), ambush };
  };

  const finishAction = () => {
    resetUI();
    refreshVis();
    checkOver();
    propsRef.current.online?.publish(gs, 'action');
    bump();
  };

  const commitPending = (unit: Unit) => {
    const p = ui.current.pending;
    if (p && p.path.length > 1) commitMove(gs, unit, p.path);
  };

  const doAttack = async (attacker: Unit, target: Unit, mine: boolean) => {
    // Tutorial fights use a fixed (zero) luck roll so the "cover cuts counter damage" numbers are always honest.
    const r = mission.tutorial ? resolveAttack(gs, attacker, target, () => 0) : resolveAttack(gs, attacker, target);
    refreshVis();
    await playBattle(r, mine);
    if (r.dKilled) { explosion(r.dx, r.dy); sfx.boom(); float(r.dx, r.dy, 'DESTROYED', '#fca5a5', 1.1); }
    else if (r.bossPhaseBreak) { explosion(r.dx, r.dy); sfx.boom(); float(r.dx, r.dy, `SHIELD PHASE BROKEN · ${unitById(gs, r.defenderId)?.bossPhases ?? 1} LEFT`, '#fde047', 0.9); }
    else { explosion(r.dx, r.dy, false); float(r.dx, r.dy, `-${r.dmg}%`); sfx.hit(); }
    if (r.counter > 0) {
      await sleep(260 / speed);
      if (r.aKilled) { explosion(r.ax, r.ay); sfx.boom(); float(r.ax, r.ay, 'DESTROYED', '#fca5a5', 1.1); }
      else { explosion(r.ax, r.ay, false); float(r.ax, r.ay, `-${r.counter}%`, '#fca5a5'); }
    }
    bump();
    await sleep(350 / speed);
    return r;
  };

  const chooseMenu = async (id: MenuId) => {
    const u = ui.current;
    const unit = u.selId != null ? unitById(gs, u.selId) : null;
    if (!unit || !u.pending) return;
    if (mission.tutorial && (guideEvent() === 'first-capture' || guideEvent() === 'capture-radio') && id !== 'capture') return;
    if (mission.tutorial && guideEvent() === 'wait-tank-city' && id !== 'wait') return;
    const { x: px, y: py } = u.pending;
    if (id === 'cancel') {
      if (u.pending.ambush || u.pending.committed) return;
      sfx.cancel();
      u.pending = null;
      selectUnit(unit);
      return;
    }
    if (id === 'fire') {
      u.targets = targetsFrom(gs, unit, px, py, px !== unit.x || py !== unit.y, visRef.current);
      u.tIdx = 0; u.mode = 'target';
      if (u.targets[0]) u.cursor = { x: u.targets[0].x, y: u.targets[0].y };
      sfx.menu(); bump();
      return;
    }
    if (id === 'drop') {
      saveSnap();
      commitPending(unit);
      u.pending = { x: unit.x, y: unit.y, path: [[unit.x, unit.y]], ambush: false, committed: true };
      u.drops = dropTiles(gs, unit);
      u.mode = 'drop';
      sfx.menu(); bump();
      return;
    }
    if (!u.pending.committed) saveSnap();
    commitPending(unit);
    if (id === 'wait') {
      unit.moved = true;
      sfx.move();
      if (u.pending.ambush) { float(unit.x, unit.y, 'AMBUSH!', '#f87171', 1.2); shake.current = 10; }
      if (mission.tutorial && guideEvent() === 'wait-tank-city' && unit.type === 'tank' && unit.x === 4 && unit.y === 1) tutEvent('wait-tank-city');
    } else if (id === 'capture') {
      // Boot Camp properties are weakened so each lesson demonstrates capture in one action.
      if (mission.tutorial && (guideEvent() === 'first-capture' || guideEvent() === 'capture-radio')) {
        gs.tiles[unit.y][unit.x].capture = dispHp(unit.hp);
      }
      const res = capture(gs, unit);
      unit.moved = true;
      if (res.done) { sfx.capture(); sparkle(unit.x, unit.y, ['#60a5fa', '#fde047', '#fff'], 36); float(unit.x, unit.y, 'CAPTURED!', '#93c5fd', 1.2); shake.current = 6; }
      else { sfx.select(); float(unit.x, unit.y, `${gs.tiles[unit.y][unit.x].capture} left`, '#fde047'); }
      if (mission.tutorial && guideEvent() === 'first-capture') tutEvent('first-capture');
      if (mission.tutorial && guideEvent() === 'capture-radio' && res.done) {
        // Move the city-capturing infantry aside so the damaged Tank can use the captured city.
        const cityInf = gs.units.find((o) => o.team === 0 && o.type === 'infantry' && o.x === 4 && o.y === 1);
        if (cityInf) { cityInf.x = 3; cityInf.y = 1; cityInf.moved = true; }
        tutEvent('capture-radio');
      }
    } else if (id === 'load') {
      const tr = gs.units.find((o) => o.x === unit.x && o.y === unit.y && o.id !== unit.id && o.team === unit.team) ?? null;
      // commitMove placed unit on transport tile
      if (tr) { loadInto(gs, unit, tr); sfx.build(); float(tr.x, tr.y, 'LOADED', '#93c5fd'); }
    }
    finishAction();
  };

  const confirmAttack = async (target: Unit) => {
    const u = ui.current;
    const unit = u.selId != null ? unitById(gs, u.selId) : null;
    if (!unit) return;
    if (!u.pending?.committed) saveSnap();
    commitPending(unit);
    unit.moved = true;
    u.mode = 'busy'; u.pending = null; u.targets = [];
    bump();
    try {
      const r = await doAttack(unit, target, true);
      if (mission.tutorial) {
        const ev = guideEvent();
        // Remember the counter-fire so the CO can quote it ("Their tank hit back for −X%").
        if (ev === 'attack-bottom') { tutCounters.current[0] = r.counter; tutEvent(ev); }
        else if (ev === 'attack-forest') {
          tutCounters.current[1] = r.counter;
          // Finish the training target after the covered exchange so the next lesson can teach tower capture.
          const survivingTarget = unitById(gs, r.defenderId);
          if (survivingTarget) {
            removeUnit(gs, survivingTarget);
            explosion(r.dx, r.dy);
            sfx.boom();
            float(r.dx, r.dy, 'TARGET DESTROYED', '#fde047', 0.85);
          }
          // The tank has completed the combat lesson but can still be used for the later repair lesson.
          const trainingTank = unitById(gs, r.attackerId);
          if (trainingTank) trainingTank.moved = false;
          tutEvent(ev);
        }
      }
    } catch (err) {
      console.error('attack error', err);
    } finally {
      finishAction();
    }
  };

  // ---------- tap handling ----------
  const handleTap = async (x: number, y: number) => {
    if (!inBounds(gs, x, y)) return;
    if (tutorialPromptOpen) return;
    const u = ui.current;
    u.cursor = { x, y };
    if (!isLocalTurn() || gs.winner !== null) return;
    if (mission.tutorial && guideStep) {
      const clicked = unitAt(gs, x, y);
      const blocked = (message: string) => { float(x, y, message, '#fde047', 0.72); sfx.cancel(); };
      const event = guideEvent();
      if (event === 'select-infantry' && !(clicked?.team === 0 && clicked.type === 'infantry' && x === 4 && y === 2)) { blocked('SELECT THE MARKED INFANTRY'); return; }
      if (event === 'reach-city' && (ui.current.mode !== 'selected' || x !== 4 || y !== 1)) { blocked('MOVE TO THE CITY'); return; }
      if (event === 'select-radio-infantry' && !(clicked?.team === 0 && clicked.type === 'infantry' && x === 3 && y === 5)) { blocked('SELECT THE LOWER INFANTRY'); return; }
      if (event === 'move-radio' && (ui.current.mode !== 'selected' || x !== 5 || y !== 5)) { blocked('MOVE TO THE RADIO TOWER'); return; }
      if (event === 'select-damaged-tank' && !(clicked?.team === 0 && clicked.type === 'tank' && x === 5 && y === 3)) { blocked('SELECT THE DAMAGED TANK'); return; }
      if (event === 'move-tank-city' && (ui.current.mode !== 'selected' || x !== 4 || y !== 1)) { blocked('MOVE THE TANK TO THE CITY'); return; }
      if (event === 'select-tank' && !(clicked?.team === 0 && clicked.type === 'tank' && x === 3 && y === 3)) { blocked('SELECT THE BLUE TANK'); return; }
      if ((event === 'attack-bottom' || event === 'attack-forest') && !(clicked?.team === 1 && clicked.type === 'tank' && x === 6 && y === 3)) { blocked('TARGET THE RED TANK'); return; }
      if (event === 'heal-turn') { blocked('USE END TURN TO REPAIR'); return; }
      if (isUndoEvent(event) || event === 'field-guide') { blocked(isUndoEvent(event) ? 'USE THE CYAN UNDO BUTTON' : 'READ THE FIELD GUIDE'); return; }
    }
    switch (u.mode) {
      case 'busy': case 'moving': return;
      case 'build': u.build = null; u.mode = 'idle'; bump(); return;
      case 'menu': {
        // tapping elsewhere cancels the move (unless the move is already locked in)
        if (u.pending?.ambush || u.pending?.committed) { sfx.cursor(); return; }
        chooseMenu('cancel');
        return;
      }
      case 'target': {
        const t = u.targets.find((o) => o.x === x && o.y === y);
        if (!t) {
          const su = u.selId != null ? unitById(gs, u.selId) : null;
          sfx.cancel();
          if (su && u.pending) openMenu(su, u.pending.x, u.pending.y); else { resetUI(); bump(); }
          return;
        }
        const idx = u.targets.indexOf(t);
        if (idx === u.tIdx) { confirmAttack(t); return; }
        u.tIdx = idx; sfx.cursor(); bump();
        return;
      }
      case 'drop': {
        const d = u.drops.find(([dx, dy]) => dx === x && dy === y);
        const unit = u.selId != null ? unitById(gs, u.selId) : null;
        if (!unit) { finishAction(); return; }
        if (!d) { sfx.cancel(); openMenu(unit, unit.x, unit.y); return; }
        dropCargo(gs, unit, x, y);
        unit.moved = true;
        sfx.build(); sparkle(x, y, ['#93c5fd', '#fff'], 12);
        finishAction();
        return;
      }
      case 'selected': {
        const unit = u.selId != null ? unitById(gs, u.selId) : null;
        if (!unit) { resetUI(); bump(); return; }
        const k = y * gs.w + x;
        if (x === unit.x && y === unit.y) { u.pending = null; openMenu(unit, x, y); return; }
        // Direct targeting: tap an enemy to attack it (works for rockets, artillery & every other unit)
        const enemy = unitAt(gs, x, y);
        if (enemy && enemy.team !== unit.team && isVis(x, y)) {
          const here = targetsFrom(gs, unit, unit.x, unit.y, false, visRef.current);
          const hi = here.findIndex((t) => t.id === enemy.id);
          if (hi >= 0) {
            u.pending = { x: unit.x, y: unit.y, path: [[unit.x, unit.y]], ambush: false };
            u.targets = here; u.tIdx = hi; u.mode = 'target';
            sfx.menu(); bump();
            return;
          }
          if (!canAttackType(unit.type, enemy.type)) { float(x, y, "CAN'T TARGET", '#fca5a5', 0.8); sfx.cancel(); return; }
          if (isIndirect(unit.type)) { float(x, y, 'OUT OF RANGE', '#fca5a5', 0.8); sfx.cancel(); return; }
          if (u.reach) {
            let bestK = -1, bestScore = -Infinity;
            // Tutorial: first strike from the open ground south of the enemy, then redo from the forest.
            const lessonEvent = mission.tutorial ? guideEvent() : '';
            const forcedTile = lessonEvent === 'attack-bottom' ? 4 * gs.w + 6 : lessonEvent === 'attack-forest' ? 3 * gs.w + 5 : -1;
            for (const kk of u.stops) {
              if (forcedTile >= 0 && kk !== forcedTile) continue;
              const sx = kk % gs.w, sy = Math.floor(kk / gs.w);
              if (canStop(gs, unit, sx, sy) !== 'ok') continue;
              const m = unitMods(gs, unit, sx, sy);
              const dd = dist(sx, sy, enemy.x, enemy.y);
              if (dd < m.rmin || dd > m.rmax) continue;
              const sc = TERRAIN[gs.tiles[sy][sx].t].def * 10 - (u.reach.get(kk)?.cost ?? 0);
              if (sc > bestScore) { bestScore = sc; bestK = kk; }
            }
            if (bestK >= 0) {
              const tx = bestK % gs.w, ty = Math.floor(bestK / gs.w);
              const { path, ambush } = truncateForAmbush(unit, pathTo(gs, u.reach, tx, ty));
              u.mode = 'moving';
              bump();
              await animateMove(unit, path);
              const [ex, ey] = path[path.length - 1];
              u.pending = { x: ex, y: ey, path, ambush };
              if (ambush) { float(ex, ey, '!', '#f87171', 1.5); sfx.cancel(); shake.current = 8; openMenu(unit, ex, ey); return; }
              const tg = targetsFrom(gs, unit, ex, ey, path.length > 1, visRef.current);
              const ti = tg.findIndex((t) => t.id === enemy.id);
              if (ti < 0) { openMenu(unit, ex, ey); return; }
              u.targets = tg; u.tIdx = ti; u.mode = 'target';
              sfx.menu(); bump();
              return;
            }
          }
          float(x, y, 'OUT OF RANGE', '#fca5a5', 0.8); sfx.cancel();
          return;
        }
        if (u.stops.has(k) && u.reach) {
          const full = pathTo(gs, u.reach, x, y);
          const { path, ambush } = truncateForAmbush(unit, full);
          u.mode = 'moving';
          bump();
          await animateMove(unit, path);
          const [ex, ey] = path[path.length - 1];
          u.pending = { x: ex, y: ey, path, ambush };
          if (mission.tutorial && guideEvent() === 'reach-city' && ex === 4 && ey === 1) tutEvent('reach-city');
          if (mission.tutorial && guideEvent() === 'move-radio' && unit.type === 'infantry' && ex === 5 && ey === 5) tutEvent('move-radio');
          if (mission.tutorial && guideEvent() === 'move-tank-city' && unit.type === 'tank' && ex === 4 && ey === 1) tutEvent('move-tank-city');
          if (ambush) { float(ex, ey, '!', '#f87171', 1.5); sfx.cancel(); shake.current = 8; }
          openMenu(unit, ex, ey);
          return;
        }
        // tapped elsewhere: maybe select another unit
        const other = unitAt(gs, x, y);
        resetUI();
        if (other && other.team === localTeam && !other.moved) { selectUnit(other); return; }
        sfx.cancel(); bump();
        return;
      }
      case 'idle': {
        const unit = unitAt(gs, x, y);
        if (unit && isVis(x, y)) {
          if (unit.team === localTeam && !unit.moved) { selectUnit(unit); return; }
          if (u.danger) { u.danger = null; bump(); }
          showDanger(unit);
          return;
        }
        if (u.danger) { u.danger = null; bump(); }
        if (canBuildHere(gs, localTeam, x, y)) {
          u.build = { x, y, list: buildsAt(gs.tiles[y][x].t) };
          u.bIdx = 0; u.mode = 'build';
          sfx.menu(); bump();
          return;
        }
        sfx.cursor();
        bump();
      }
    }
  };

  const doBuild = (type: UnitType) => {
    const b = ui.current.build;
    if (!b) return;
    if (mission.tutorial && guideEvent() === 'build-infantry' && (type !== 'infantry' || b.x !== 1 || b.y !== 2)) {
      float(b.x, b.y, 'BUILD INFANTRY AT BASE', '#fde047', 0.8);
      sfx.cancel();
      return;
    }
    const prevSnap = undoSnap.current;
    saveSnap();
    const nu = buildUnit(gs, localTeam, b.x, b.y, type);
    if (!nu) { undoSnap.current = prevSnap; sfx.cancel(); return; }
    sfx.build();
    sparkle(b.x, b.y, ['#60a5fa', '#e0f2fe', '#fde047'], 24);
    float(b.x, b.y, UNITS[type].name, '#93c5fd');
    if (mission.tutorial) tutEvent('build-infantry');
    resetUI(); refreshVis();
    propsRef.current.online?.publish(gs, 'action');
    bump();
  };

  const cancel = () => {
    const u = ui.current;
    if (u.mode === 'menu') { chooseMenu('cancel'); return; }
    if (u.mode === 'drop') {
      const unit = u.selId != null ? unitById(gs, u.selId) : null;
      sfx.cancel();
      if (unit) openMenu(unit, unit.x, unit.y); else finishAction();
      return;
    }
    if (u.mode === 'target') {
      const su = u.selId != null ? unitById(gs, u.selId) : null;
      sfx.cancel();
      if (su && u.pending) openMenu(su, u.pending.x, u.pending.y); else { resetUI(); bump(); }
      return;
    }
    if (u.mode === 'selected' || u.mode === 'build' || u.danger) { resetUI(); sfx.cancel(); bump(); return; }
    if (u.mode === 'idle') setPaused(true);
  };

  const nextUnit = () => {
    if (ui.current.mode !== 'idle' && ui.current.mode !== 'selected') return;
    const list = gs.units.filter((o) => o.team === localTeam && !o.moved);
    if (!list.length) return;
    const curId = ui.current.selId;
    const idx = list.findIndex((o) => o.id === curId);
    const n = list[(idx + 1) % list.length];
    resetUI();
    ui.current.cursor = { x: n.x, y: n.y };
    centerOn(n.x, n.y);
    selectUnit(n);
  };

  // ---------- powers ----------
  const applyPowerFx = async (eff: PowerEffect) => {
    sfx.power();
    setPowerFx({ co: gs.cos[eff.team], name: eff.name, level: eff.level, team: eff.team, desc: eff.desc });
    shake.current = 18;
    await sleep(1700 / Math.min(speed, 1.2));
    setPowerFx(null);
    if (eff.centers) for (const c of eff.centers) { explosion(c.x, c.y); sfx.boom(); await sleep(200); }
    for (const h of eff.hits) { if (isVis(h.x, h.y)) { explosion(h.x, h.y, false); float(h.x, h.y, `-${Math.ceil(h.dmg / 10)}HP`, '#fca5a5'); } }
    for (const h of eff.heals) { sparkle(h.x, h.y, ['#4ade80', '#bbf7d0'], 10); }
    if (eff.heals.length) sfx.heal();
    if (eff.funds) {
      const anchor = gs.units.find((o) => o.team === eff.team) ?? { x: ui.current.cursor.x, y: ui.current.cursor.y };
      float(anchor.x, anchor.y, `+${eff.funds.toLocaleString()}G`, '#fde047', 1.3);
      sfx.capture();
    }
    if (eff.weather) setBanner({ text: `${WEATHER_INFO[eff.weather].icon} ${WEATHER_INFO[eff.weather].name}!`, sub: WEATHER_INFO[eff.weather].desc, team: eff.team });
    terrCache.current.key = '';
    bump();
    await sleep(eff.weather ? 1200 : 500);
    setBanner(null);
  };

  const playerPower = async (level: 1 | 2) => {
    if (mission.tutorial && guideEvent() !== 'field-guide') return;
    if (!isLocalTurn() || ui.current.mode !== 'idle' || !canActivate(gs, localTeam, level)) return;
    saveSnap();
    ui.current.mode = 'busy';
    try {
      const eff = activatePower(gs, localTeam, level);
      await applyPowerFx(eff);
    } catch (err) {
      console.error('power error', err);
      setPowerFx(null); setBanner(null);
    }
    ui.current.mode = 'idle';
    refreshVis();
    checkOver();
    propsRef.current.online?.publish(gs, 'action');
    bump();
  };

  const playerSkill = async (id: string) => {
    if (mission.tutorial && guideEvent() !== 'field-guide') return;
    if (!isLocalTurn() || ui.current.mode !== 'idle' || !canUseSkill(gs, localTeam, id)) return;
    saveSnap();
    ui.current.mode = 'busy';
    try {
      const eff = activateSkill(gs, localTeam, id);
      await applyPowerFx(eff);
    } catch (err) {
      console.error('skill error', err);
      setPowerFx(null); setBanner(null);
    }
    ui.current.mode = 'idle';
    refreshVis();
    checkOver();
    propsRef.current.online?.publish(gs, 'action');
    bump();
  };

  // ---------- turns ----------
  const showBanner = async (text: string, sub: string, team: Team, ms = 1300) => {
    setBanner({ text, sub, team });
    sfx.turn();
    await sleep(ms / Math.min(speed, 1.3));
    setBanner(null);
  };

  const startOfTurnFx = (info: TurnStartInfo, team: Team) => {
    for (const r of info.repairs) if (team === localTeam || isVis(r.x, r.y)) { sparkle(r.x, r.y, ['#4ade80', '#fff'], 8); float(r.x, r.y, `+${Math.max(1, Math.round((r.amount ?? 10) / 10))} HP`, '#4ade80', 0.8); }
    for (const r of info.refuels) if (team === localTeam || isVis(r.x, r.y)) { sparkle(r.x, r.y, ['#38bdf8', '#fff'], 10); float(r.x, r.y, 'REFUELED', '#7dd3fc', 0.8); }
    if (info.radioMove) {
      const u = gs.units.find((o) => o.team === team);
      if (u && (team === localTeam || isVis(u.x, u.y))) { sparkle(u.x, u.y, ['#22d3ee', '#fde047', '#fff'], 20); float(u.x, u.y, 'RADIO BOOST +1 MOVE', '#67e8f9', 0.9); }
    }
    if (info.weatherChanged) terrCache.current.key = '';
  };

  const endPlayerTurn = async () => {
    if (!isLocalTurn() || gs.winner !== null) return;
    if (propsRef.current.online?.mode === 'coop' && !propsRef.current.online.isHost) return;
    if (mission.tutorial && guideEvent() !== 'heal-turn' && guideEvent() !== 'complete') return;
    const unissuedTutorialUnit = mission.tutorial && guideEvent() === 'heal-turn'
      ? gs.units.find((u) => u.team === localTeam && !u.moved)
      : undefined;
    if (unissuedTutorialUnit) {
      ui.current.cursor = { x: unissuedTutorialUnit.x, y: unissuedTutorialUnit.y };
      centerOn(unissuedTutorialUnit.x, unissuedTutorialUnit.y);
      float(unissuedTutorialUnit.x, unissuedTutorialUnit.y, 'THIS UNIT STILL NEEDS ORDERS', '#fde047', 0.65);
      sfx.cancel();
      bump();
      return;
    }
    setConfirmEnd(false);
    resetUI();
    undoSnap.current = null;
    ui.current.mode = 'busy';
    bump();
    try {
      const info = endTurn(gs);
      startOfTurnFx(info, gs.turn);
      checkOver();
      if (gs.winner !== null) return;
      if (propsRef.current.online) {
        propsRef.current.online.publish(gs, 'turn-start');
        ui.current.mode = 'idle';
        if (propsRef.current.online.mode === 'pvp') {
          await showBanner(`${COS[gs.cos[gs.turn]].title} TURN`, `${COS[gs.cos[gs.turn]].name}${info.radioMove ? ' · RADIO RELAY +1 MOVE' : ''}`, gs.turn);
          bump();
          return;
        }
      }
      await showBanner('ENEMY TURN', `${COS[gs.cos[1]].title} ${COS[gs.cos[1]].name}${info.radioMove ? ' · RADIO RELAY +1 MOVE' : ''}`, 1);
    } catch (err) {
      console.error('end turn error', err);
    }
    await runAI();
    if (mission.tutorial && guideEvent() === 'heal-turn') tutEvent('heal-turn');
  };

  /** Hand control back to the player no matter what state the enemy turn was in. */
  const recoverToPlayer = () => {
    aiToken.current++;
    setBattle(null); setPowerFx(null); setBanner(null);
    for (const a of [...anims.current.values()]) a.resolve();
    anims.current.clear();
    if (gs.winner === null && gs.turn === 1) {
      try { const info = endTurn(gs); startOfTurnFx(info, 0); } catch (err) { console.error(err); }
    }
    resetUI();
    ui.current.mode = 'idle';
    refreshVis();
    checkOver();
    bump();
  };
  const recoverRef = useRef(recoverToPlayer);
  recoverRef.current = recoverToPlayer;

  const runAI = async () => {
    const token = ++aiToken.current;
    try {
      await runAIInner(token);
    } catch (err) {
      console.error('AI error', err);
      if (token === aiToken.current) recoverToPlayer();
    }
  };

  const runAIInner = async (token: number) => {
    if (mission.tutorial && guideEvent() !== 'complete') {
      await sleep(220 / speed);
      const info = endTurn(gs);
      refreshVis();
      startOfTurnFx(info, localTeam);
      const sub = `+${info.income}G · Training exercise${info.radioMove ? ' · RADIO RELAY +1 MOVE' : ''}`;
      await showBanner(`DAY ${gs.day}`, sub, 0);
      ui.current.mode = 'idle';
      bump();
      return;
    }
    // If this CO has an "ultimate ready" banner waiting for their turn, let it play before they act.
    await waitForChargeFx(1);
    try {
      const pc = aiPowerChoice(gs, 1);
      if (pc) { const eff = activatePower(gs, 1, pc); await applyPowerFx(eff); }
    } catch (err) { console.error('AI power error', err); setPowerFx(null); }
    let threats = threatMap(gs, 1);
    for (let guard = 0; guard < 80; guard++) {
      if (token !== aiToken.current) return;
      await waitForChargeFx(1);
      if (gs.winner !== null) break;
      const u = nextAIUnit(gs, 1);
      if (!u) break;
      let plan: ReturnType<typeof planAIUnit>;
      try { plan = planAIUnit(gs, u, threats); } catch (err) { console.error('AI plan error', err); u.moved = true; continue; }
      if (!plan.path.length) plan.path = [[u.x, u.y]];
      const end = plan.path[plan.path.length - 1];
      const seen = isVis(u.x, u.y) || isVis(end[0], end[1]);
      if (seen) {
        centerOn(end[0], end[1]);
        await sleep(140 / speed);
        await animateMove(u, plan.path);
      }
      commitMove(gs, u, plan.path);
      u.moved = true;
      if (plan.action === 'attack' && plan.targetId != null) {
        const t = unitById(gs, plan.targetId);
        if (t) {
          await doAttack(u, t, false);
          threats = threatMap(gs, 1);
        }
      } else if (plan.action === 'capture') {
        const res = capture(gs, u);
        if (isVis(u.x, u.y)) {
          if (res.done) { sfx.capture(); sparkle(u.x, u.y, ['#f87171', '#fde047'], 26); float(u.x, u.y, 'CAPTURED!', '#fca5a5'); }
          else float(u.x, u.y, `${gs.tiles[u.y][u.x].capture} left`, '#fca5a5');
          await sleep(300 / speed);
        }
      }
      refreshVis();
      bump();
      checkOver();
      if (seen) await sleep(90 / speed);
    }
    if (gs.winner === null && token === aiToken.current) {
      let builds: ReturnType<typeof planBuilds> = [];
      try { builds = planBuilds(gs, 1); } catch (err) { console.error('AI build error', err); }
      for (const b of builds) {
        const nu = buildUnit(gs, 1, b.x, b.y, b.type);
        if (nu && isVis(b.x, b.y)) { sparkle(b.x, b.y, ['#f87171', '#fde047'], 16); sfx.build(); await sleep(200 / speed); }
      }
    }
    checkOver();
    if (token !== aiToken.current) return;
    if (gs.winner !== null) { bump(); return; }
    const info = endTurn(gs);
    refreshVis();
    startOfTurnFx(info, localTeam);
    if (propsRef.current.online?.mode === 'coop' && propsRef.current.online.isHost) {
      propsRef.current.online.publish(gs, 'turn-end');
    }
    checkOver();
    bump();
    if (gs.winner !== null) return;
    // Auto-save at the start of every full turn so the battle can be resumed after closing the app.
    autosave();
    const hq = gs.units.find((o) => o.team === localTeam);
    if (hq) centerOn(hq.x, hq.y);
    const obj = gs.mission.objective;
    const sub = `+${info.income}G${info.radioMove ? ' · 📡 RADIO RELAY +1 MOVE' : ''}${info.weatherChanged ? ` · ${WEATHER_INFO[gs.weather].icon} ${WEATHER_INFO[gs.weather].name}` : ''}${obj.type === 'survive' ? ` · Survive until day ${obj.days + 1}` : ''}`;
    await showBanner(`DAY ${gs.day}`, sub, 0);
    ui.current.mode = 'idle';
    bump();
  };

  const checkOver = () => {
    if (gs.winner === null || finished.current) return;
    finished.current = true;
    const won = gs.winner === localTeam;
    const score = computeScore(gs, won, localTeam);
    setTimeout(() => {
      won ? sfx.victory() : sfx.defeat();
      const rid = REWARDS[gs.mission.id];
      const reward = won && propsRef.current.isCampaign && rid && !propsRef.current.save.ownedSkills.includes(rid) ? rid : null;
      const place = propsRef.current.online?.mode === 'pvp' ? -1 : propsRef.current.onComplete(won, score, gs);
      setOver({ won, score, place, reward, drops: propsRef.current.online?.mode === 'pvp' ? [] : getLastDrops() });
    }, 900);
  };

  const restart = () => props.onRestart();

  /** Save a resumable snapshot (campaign battles only; the parent decides whether to keep it). */
  const autosave = () => {
    if (gs.winner !== null || finished.current || mission.tutorial || propsRef.current.online) return;
    try { propsRef.current.onAutosave?.(gs); } catch (err) { console.warn('autosave failed', err); }
  };
  // Also save when the app goes to the background, but only between actions (never mid-animation).
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && gs.turn === localTeam && (ui.current.mode === 'idle' || ui.current.mode === 'selected') && !battle) autosave();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => { document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', onHide); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle]);

  // ---------- keyboard ----------
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e: KeyboardEvent) => {
    const k = e.key;
    // Any key closes an open ready-banner first.
    if (chargeFxRef.current) { e.preventDefault(); dismissChargeFx(); return; }
    if (tutorialPromptOpen) {
      if (k === 'Enter' || k === ' ' || k === 'z' || k === 'Z') { e.preventDefault(); continueTutorialPrompt(); }
      return;
    }
    if (over) {
      if (k === 'r' || k === 'R' || k === 'Enter') restart();
      if ((k === 'n' || k === 'N') && over.won && props.hasNext) props.onNext();
      if (k === 'Escape') props.onExit();
      return;
    }
      if (battle || powerFx || coInfo !== null) return;
    if (paused) { if (k === 'Escape' || k === 'p' || k === 'P') setPaused(false); return; }
    if (confirmEnd) { if (k === 'Enter' || k === 'e' || k === 'E') endPlayerTurn(); if (k === 'Escape') setConfirmEnd(false); return; }
    const u = ui.current;
    const arrows: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    const dir = arrows[k];
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab'].includes(k)) e.preventDefault();
    if (u.mode === 'menu') {
      if (dir) { u.mIdx = (u.mIdx + (dir[1] || dir[0]) + u.menu.length) % u.menu.length; sfx.cursor(); bump(); }
      else if (k === 'Enter' || k === ' ' || k === 'z') chooseMenu(u.menu[u.mIdx].id);
      else if (k === 'Escape' || k === 'x' || k === 'Backspace') cancel();
      return;
    }
    if (u.mode === 'build' && u.build) {
      if (dir) { u.bIdx = (u.bIdx + (dir[1] || dir[0]) + u.build.list.length) % u.build.list.length; sfx.cursor(); bump(); }
      else if (k === 'Enter' || k === ' ' || k === 'z') doBuild(u.build.list[u.bIdx]);
      else if (k === 'Escape' || k === 'x' || k === 'Backspace') cancel();
      return;
    }
    if (u.mode === 'target') {
      if (dir && u.targets.length) { u.tIdx = (u.tIdx + (dir[0] || dir[1]) + u.targets.length) % u.targets.length; const t = u.targets[u.tIdx]; u.cursor = { x: t.x, y: t.y }; sfx.cursor(); bump(); }
      else if ((k === 'Enter' || k === ' ' || k === 'z') && u.targets[u.tIdx]) confirmAttack(u.targets[u.tIdx]);
      else if (k === 'Escape' || k === 'x' || k === 'Backspace') cancel();
      return;
    }
    if (u.mode === 'busy' || u.mode === 'moving') return;
    if (dir) {
      const nx = Math.max(0, Math.min(gs.w - 1, u.cursor.x + dir[0]));
      const ny = Math.max(0, Math.min(gs.h - 1, u.cursor.y + dir[1]));
      u.cursor = { x: nx, y: ny };
      ensureVisible(nx, ny);
      sfx.cursor();
      bump();
      return;
    }
    if (k === 'Enter' || k === ' ' || k === 'z' || k === 'Z') handleTap(u.cursor.x, u.cursor.y);
    else if (k === 'Escape' || k === 'x' || k === 'X' || k === 'Backspace') cancel();
    else if (k === 'e' || k === 'E') requestEnd();
    else if (k === 'Tab' || k === 'q' || k === 'Q') nextUnit();
    else if (k === 'p' || k === 'P') setPaused(true);
    else if (k === 'c' || k === 'C') playerPower(1);
    else if (k === 'v' || k === 'V') playerPower(2);
    else if (k === 'i' || k === 'I') setShowIntel((v) => !v);
    else if (k === 'u' || k === 'U') doUndo();
    else if (k === '+' || k === '=') zoom(1);
    else if (k === '-') zoom(-1);
  };

  const requestEnd = () => {
    if (!isLocalTurn() || ui.current.mode === 'busy' || ui.current.mode === 'moving') return;
    if (propsRef.current.online?.mode === 'coop' && !propsRef.current.online.isHost) return;
    if (mission.tutorial && guideEvent() !== 'heal-turn' && guideEvent() !== 'complete') {
      float(ui.current.cursor.x, ui.current.cursor.y, 'FOLLOW THE FIELD BRIEFING', '#fde047', 0.75);
      sfx.cancel();
      return;
    }
    const leftUnit = gs.units.find((o) => o.team === localTeam && !o.moved);
    if (mission.tutorial && guideEvent() === 'heal-turn' && leftUnit) {
      ui.current.cursor = { x: leftUnit.x, y: leftUnit.y };
      centerOn(leftUnit.x, leftUnit.y);
      float(leftUnit.x, leftUnit.y, 'THIS UNIT STILL NEEDS ORDERS', '#fde047', 0.65);
      sfx.cancel();
      bump();
      return;
    }
    const left = !!leftUnit;
    if (left) setConfirmEnd(true); else endPlayerTurn();
  };

  const zoom = (d: number) => {
    const v = view.current;
    const cx = cam.current.x + v.vw / 2, cy = cam.current.y + v.vh / 2;
    const old = v.ts;
    v.zoom = Math.max(0.6, Math.min(1.8, v.zoom + d * 0.2));
    computeTs();
    cam.current.x = (cx / old) * v.ts - v.vw / 2;
    cam.current.y = (cy / old) * v.ts - v.vh / 2;
    cam.current.tx = null;
    clampCam();
    terrCache.current.key = '';
    bump();
  };
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const handleDoubleTap = (x: number, y: number) => {
    if (!inBounds(gs, x, y) || !isLocalTurn() || !isVis(x, y)) return;
    if (tutorialPromptOpen) return;
    if (mission.tutorial && guideEvent() !== 'field-guide') return;
    const unit = unitAt(gs, x, y);
    if (!unit) return;
    if (unit.team === localTeam && !unit.moved) selectUnit(unit); else showDanger(unit);
    const d = UNITS[unit.type];
    const m = unitMods(gs, unit);
    const targetCount = targetsFrom(gs, unit, unit.x, unit.y, false, visRef.current).length;
    const fuel = d.fuel ? ` · FUEL ${unit.fuel ?? 0}/${d.fuel}` : '';
    const indirect = d.indirect ? ' · INDIRECT FIRE OVER BLOCKERS' : '';
    setRangePeek({ text: `${d.name.toUpperCase()} · MOVE ${m.move} · WEAPON ${m.rmin}-${m.rmax} · ${targetCount} TARGET${targetCount === 1 ? '' : 'S'}${fuel}${indirect}`, until: performance.now() + 2600 });
    window.setTimeout(() => setRangePeek((r) => r && r.until <= performance.now() ? null : r), 2700);
  };
  const doubleTapRef = useRef(handleDoubleTap);
  doubleTapRef.current = handleDoubleTap;

  // ---------- main loop & input ----------
  useEffect(() => {
    const cv = cvRef.current!;
    const wrap = wrapRef.current!;
    const g = cv.getContext('2d')!;
    let raf = 0;
    refreshVis();
    let first = true;

    const onResize = () => {
      const v = view.current;
      const st = propsRef.current.save.settings;
      const native = window.devicePixelRatio || 1;
      const dprOpt = st.dprScale ?? 'auto';
      v.dpr = dprOpt === 'auto' ? Math.min(2, native) : typeof dprOpt === 'number' ? dprOpt : Math.min(2, native);
      v.vw = wrap.clientWidth; v.vh = wrap.clientHeight;

      if (topHudRef.current) {
        TOP = Math.ceil(topHudRef.current.getBoundingClientRect().height) + 4;
      } else {
        TOP = v.vh < 520 ? 56 : 72;
      }
      if (bottomHudRef.current) {
        BOT = Math.ceil(bottomHudRef.current.getBoundingClientRect().height) + 4;
      } else {
        BOT = v.vh < 520 ? 56 : 72;
      }

      cv.width = v.vw * v.dpr; cv.height = v.vh * v.dpr;
      cv.style.width = v.vw + 'px'; cv.style.height = v.vh + 'px';
      computeTs();
      clampCam();
      terrCache.current.key = '';
      if (first) {
        first = false;
        const pu = gs.units.find((o) => o.team === localTeam);
        if (pu) { ui.current.cursor = { x: pu.x, y: pu.y }; centerOn(pu.x, pu.y, false); }
        bump();
      }
    };
    onResize();
    window.addEventListener('resize', onResize);

    // pointer & pinch-to-zoom tracking
    let down: { x: number; y: number; cx: number; cy: number; id: number; panned: boolean } | null = null;
    const activePointers = new Map<number, { x: number; y: number }>();
    let initialPinchDist = 0;
    let initialPinchZoom = 1;

    const onDown = (e: PointerEvent) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        initialPinchZoom = view.current.zoom;
        if (down) down.panned = true; // prevent tap on gesture end
      } else if (activePointers.size === 1) {
        down = { x: e.clientX, y: e.clientY, cx: cam.current.x, cy: cam.current.y, id: e.pointerId, panned: false };
        cam.current.tx = null;
      }
    };
    const tileFromEvent = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const ts = view.current.ts;
      return { x: Math.floor((e.clientX - r.left + cam.current.x) / ts), y: Math.floor((e.clientY - r.top + cam.current.y) / ts) };
    };
    const onMove = (e: PointerEvent) => {
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (activePointers.size === 2 && initialPinchDist > 0) {
        const pts = Array.from(activePointers.values());
        const distNow = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const scale = distNow / initialPinchDist;
        const targetZoom = Math.max(0.4, Math.min(2.0, initialPinchZoom * scale));
        const deltaZoom = (targetZoom - view.current.zoom) / 0.2;
        if (Math.abs(deltaZoom) > 0.05) {
          zoomRef.current(deltaZoom);
        }
      } else if (down && down.id === e.pointerId && activePointers.size === 1) {
        const dx = e.clientX - down.x, dy = e.clientY - down.y;
        if (!down.panned && Math.hypot(dx, dy) > 10) down.panned = true;
        if (down.panned) { cam.current.x = down.cx - dx; cam.current.y = down.cy - dy; clampCam(); }
      } else if (e.pointerType === 'mouse') {
        const t = tileFromEvent(e);
        if (inBounds(gs, t.x, t.y) && (t.x !== ui.current.cursor.x || t.y !== ui.current.cursor.y)) {
          const m = ui.current.mode;
          if (m === 'idle' || m === 'selected' || m === 'target' || m === 'drop') { ui.current.cursor = t; bump(); }
        }
      }
    };
    const onUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) {
        initialPinchDist = 0;
      }
      if (!down || down.id !== e.pointerId) return;
      const wasPan = down.panned;
      down = null;
      if (wasPan) return;
      const t = tileFromEvent(e);
      const now = performance.now();
      const prev = lastTap.current;
      if (prev && prev.x === t.x && prev.y === t.y && now - prev.at <= 360) {
        lastTap.current = null;
        doubleTapRef.current(t.x, t.y);
        return;
      }
      lastTap.current = { x: t.x, y: t.y, at: now };
      handleTapRef.current(t.x, t.y);
    };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); zoomRef.current(e.deltaY < 0 ? 1 : -1); };
    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    cv.addEventListener('wheel', onWheel, { passive: false });
    const onKey = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener('keydown', onKey);

    const draw = (now: number, dtFactor = 1.0) => {
      const v = view.current;
      const ts = v.ts;
      const s = gsRef.current;
      const U = ui.current;
      const st = propsRef.current.save.settings;
      // camera smoothing with dtFactor
      if (cam.current.tx != null && cam.current.ty != null) {
        const camAlpha = 1 - Math.pow(1 - 0.15, dtFactor);
        cam.current.x += (cam.current.tx - cam.current.x) * camAlpha;
        cam.current.y += (cam.current.ty - cam.current.y) * camAlpha;
        if (Math.abs(cam.current.tx - cam.current.x) < 0.5 && Math.abs(cam.current.ty - cam.current.y) < 0.5) cam.current.tx = cam.current.ty = null;
      }
      g.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
      g.fillStyle = '#0b1220';
      g.fillRect(0, 0, v.vw, v.vh);
      g.save();
      let sx = 0, sy = 0;
      if (shake.current > 0.3) {
        sx = (Math.random() - 0.5) * shake.current; sy = (Math.random() - 0.5) * shake.current;
        shake.current *= Math.pow(0.88, dtFactor);
      } else shake.current = 0;
      g.translate(Math.round(-cam.current.x + sx), Math.round(-cam.current.y + sy));
      // map frame
      g.fillStyle = '#020617';
      g.fillRect(-6, -6, s.w * ts + 12, s.h * ts + 12);
      // terrain
      const key = `${ts}|${s.weather}`;
      if (terrCache.current.key !== key) { terrCache.current = { key, c: drawTerrainLayer(s, ts) }; }
      if (terrCache.current.c) g.drawImage(terrCache.current.c, 0, 0);
      // animated water shimmer
      // properties
      for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
        const tl = s.tiles[y][x];
        if (TERRAIN[tl.t].prop) drawProperty(g, tl.t, tl.owner, x * ts, y * ts, ts, now, tl.capture);
      }
      // fog
      const vis = visRef.current;
      if (vis) {
        g.fillStyle = 'rgba(8,12,28,0.5)';
        for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (!vis.has(y * s.w + x)) g.fillRect(x * ts, y * ts, ts, ts);
      }
      // grid
      g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1;
      g.beginPath();
      for (let x = 0; x <= s.w; x++) { g.moveTo(x * ts + 0.5, 0); g.lineTo(x * ts + 0.5, s.h * ts); }
      for (let y = 0; y <= s.h; y++) { g.moveTo(0, y * ts + 0.5); g.lineTo(s.w * ts, y * ts + 0.5); }
      g.stroke();
      // highlights
      const pulse = 0.75 + Math.sin(now / 220) * 0.25;
      const fillSet = (set: Set<number>, col: string, skip?: Set<number>) => {
        g.fillStyle = col;
        for (const k of set) { if (skip && skip.has(k)) continue; const x = k % s.w, y = Math.floor(k / s.w); g.fillRect(x * ts + 1, y * ts + 1, ts - 2, ts - 2); }
      };
      if (U.danger) {
        fillSet(U.danger.atk, `rgba(239,68,68,${0.28 * pulse})`, U.danger.reach);
        fillSet(U.danger.reach, `rgba(249,115,22,${0.35 * pulse})`);
      }
      if (U.mode === 'selected' || U.mode === 'moving') {
        fillSet(U.atk, `rgba(239,68,68,${0.18})`, U.stops);
        fillSet(U.stops, `rgba(56,189,248,${0.42 * pulse})`);
        // path preview
        if (U.mode === 'selected' && U.reach) {
          const k = U.cursor.y * s.w + U.cursor.x;
          if (U.stops.has(k)) {
            const p = pathTo(s, U.reach, U.cursor.x, U.cursor.y);
            if (p.length > 1) {
              g.strokeStyle = '#fde047'; g.lineWidth = ts * 0.14; g.lineCap = 'round'; g.lineJoin = 'round';
              g.beginPath();
              p.forEach(([px, py], i) => { const cx = px * ts + ts / 2, cy = py * ts + ts / 2; if (i) g.lineTo(cx, cy); else g.moveTo(cx, cy); });
              g.stroke();
              const [lx, ly] = p[p.length - 1];
              g.fillStyle = '#fde047'; g.beginPath(); g.arc(lx * ts + ts / 2, ly * ts + ts / 2, ts * 0.16, 0, Math.PI * 2); g.fill();
            }
          }
        }
      }
      if (U.mode === 'target') {
        U.targets.forEach((t, i) => {
          g.fillStyle = `rgba(239,68,68,${(i === U.tIdx ? 0.55 : 0.3) * pulse})`;
          g.fillRect(t.x * ts + 1, t.y * ts + 1, ts - 2, ts - 2);
        });
      }
      if (U.mode === 'drop') {
        g.fillStyle = `rgba(74,222,128,${0.45 * pulse})`;
        for (const [x, y] of U.drops) g.fillRect(x * ts + 1, y * ts + 1, ts - 2, ts - 2);
      }
      // mark enemies the selected unit can hit (tap them to fire)
      if (U.mode === 'selected' && U.selId != null) {
        const su = s.units.find((o) => o.id === U.selId);
        if (su) for (const e of s.units) {
          if (e.team === su.team) continue;
          const k = e.y * s.w + e.x;
          if (!U.atk.has(k) || !canAttackType(su.type, e.type) || (vis && !vis.has(k))) continue;
          g.strokeStyle = `rgba(254,202,202,${pulse})`; g.lineWidth = 3;
          g.strokeRect(e.x * ts + 3, e.y * ts + 3, ts - 6, ts - 6);
          g.fillStyle = `rgba(239,68,68,${0.25 * pulse})`;
          g.fillRect(e.x * ts + 3, e.y * ts + 3, ts - 6, ts - 6);
        }
      }
      // units
      const order = [...s.units].sort((a, b) => a.y - b.y);
      for (const u of order) {
        let ux = u.x, uy = u.y;
        let facing = u.facing;
        const an = anims.current.get(u.id);
        if (an) {
          const el = (now - an.t0) / an.per;
          const i = Math.min(an.path.length - 1, Math.floor(el));
          const f = el - i;
          if (i >= an.path.length - 1) {
            [ux, uy] = an.path[an.path.length - 1];
            anims.current.delete(u.id);
            an.resolve();
          } else {
            const [ax, ay] = an.path[i], [bx, by] = an.path[i + 1];
            const e2 = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
            ux = ax + (bx - ax) * e2; uy = ay + (by - ay) * e2;
            if (bx !== ax) facing = bx > ax ? 1 : -1;
            if (i !== an.last) {
              an.last = i; sfx.move();
              const pOpt = st.particles ?? 'full';
              const pProb = pOpt === 'full' ? 0.7 : pOpt === 'medium' ? 0.4 : pOpt === 'low' ? 0.2 : 0;
              if (pProb > 0 && Math.random() < pProb && UNITS[u.type].cat !== 'air') parts.current.push({ x: ax * ts + ts / 2, y: ay * ts + ts * 0.8, vx: 0, vy: -0.3, life: 0, max: 30, c: 'rgba(180,170,150,0.6)', s: ts / 10, g: -0.003, k: 1 });
            }
          }
          u.facing = facing;
        } else if (U.pending && U.selId === u.id && (U.mode === 'menu' || U.mode === 'target' || U.mode === 'busy')) {
          ux = U.pending.x; uy = U.pending.y;
        }
        const tvx = Math.round(ux), tvy = Math.round(uy);
        if (u.team !== localTeam && vis && !vis.has(tvy * s.w + tvx)) continue;
        const cx = ux * ts + ts / 2, cy = uy * ts + ts / 2 + ts * 0.04;
        const dim = u.moved && u.team === s.turn && !an;
        if (U.selId === u.id) {
          g.strokeStyle = `rgba(253,224,71,${pulse})`; g.lineWidth = 3;
          g.beginPath(); g.ellipse(cx, cy + ts * 0.28, ts * 0.4, ts * 0.14, 0, 0, Math.PI * 2); g.stroke();
        }
        drawUnit(g, u.type, cx, cy, ts * 0.86, u.team, u.facing, now + u.id * 137, dim);
        // badges
        const hp = dispHp(u.hp);
        if (hp < 10) {
          g.fillStyle = 'rgba(2,6,23,0.85)'; g.fillRect(cx + ts * 0.14, cy + ts * 0.12, ts * 0.32, ts * 0.3);
          g.fillStyle = hp <= 3 ? '#f87171' : '#fff'; g.font = `bold ${Math.round(ts * 0.26)}px Oxanium, sans-serif`;
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(String(hp), cx + ts * 0.3, cy + ts * 0.28);
        }
        if (u.capturing) {
          g.fillStyle = '#fde047'; g.fillRect(cx - ts * 0.46, cy + ts * 0.12, ts * 0.26, ts * 0.26);
          g.fillStyle = '#111'; g.font = `bold ${Math.round(ts * 0.2)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText('C', cx - ts * 0.33, cy + ts * 0.26);
        }
        if (u.cargo) {
          g.fillStyle = '#22d3ee'; g.beginPath(); g.arc(cx - ts * 0.34, cy - ts * 0.3, ts * 0.1, 0, Math.PI * 2); g.fill();
        }
        if (u.boss) {
          g.fillStyle = '#7f1d1d'; g.fillRect(cx - ts * 0.3, cy - ts * 0.48, ts * 0.6, ts * 0.17);
          g.fillStyle = '#fecaca'; g.font = `900 ${Math.round(ts * 0.11)}px Oxanium, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(`BOSS ×${u.bossPhases ?? 1}`, cx, cy - ts * 0.395);
        }
        if (UNITS[u.type].fuel && u.fuel !== undefined) {
          const fw = ts * 0.42, fx = cx - fw / 2, fy = cy + ts * 0.36;
          g.fillStyle = 'rgba(2,6,23,0.88)'; g.fillRect(fx, fy, fw, ts * 0.07);
          g.fillStyle = u.fuel <= 5 ? '#fb7185' : '#38bdf8'; g.fillRect(fx, fy, fw * (u.fuel / (UNITS[u.type].fuel ?? 1)), ts * 0.07);
        }
        if (u.vet > 0) {
          g.fillStyle = '#fbbf24';
          for (let i = 0; i < u.vet; i++) { g.beginPath(); const vx = cx - ts * 0.42, vy = cy - ts * 0.38 + i * ts * 0.11; g.moveTo(vx, vy); g.lineTo(vx + ts * 0.08, vy + ts * 0.06); g.lineTo(vx + ts * 0.16, vy); g.lineTo(vx + ts * 0.16, vy + ts * 0.04); g.lineTo(vx + ts * 0.08, vy + ts * 0.1); g.lineTo(vx, vy + ts * 0.04); g.fill(); }
        }
      }
      // crosshair on target
      if (U.mode === 'target' && U.targets[U.tIdx]) {
        const t = U.targets[U.tIdx];
        const cx = t.x * ts + ts / 2, cy = t.y * ts + ts / 2;
        g.strokeStyle = '#fff'; g.lineWidth = 3;
        const r = ts * (0.38 + Math.sin(now / 120) * 0.04);
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.moveTo(cx - r - 6, cy); g.lineTo(cx - r + 8, cy); g.moveTo(cx + r - 8, cy); g.lineTo(cx + r + 6, cy); g.moveTo(cx, cy - r - 6); g.lineTo(cx, cy - r + 8); g.moveTo(cx, cy + r - 8); g.lineTo(cx, cy + r + 6); g.stroke();
      }
      const liveLesson = mission.tutorial ? TUTORIAL[tutIndexRef.current] : null;
      const lessonTarget = liveLesson ? liveLesson.targets?.[guideEvent()] ?? liveLesson.target : undefined;
      if (lessonTarget && lessonTarget.x !== undefined && lessonTarget.y !== undefined && tutorialDismissedRef.current) {
        const tx = lessonTarget.x, ty = lessonTarget.y;
        const cx = tx * ts + ts / 2, cy = ty * ts + ts / 2;
        const beat = 0.5 + 0.5 * Math.sin(now / 180);
        g.save();
        g.strokeStyle = '#fde047';
        g.fillStyle = `rgba(250,204,21,${0.11 + beat * 0.12})`;
        g.lineWidth = 3 + beat * 2;
        g.shadowColor = '#facc15';
        g.shadowBlur = 18 + beat * 12;
        g.beginPath();
        g.arc(cx, cy, ts * (0.4 + beat * 0.08), 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.beginPath();
        g.moveTo(cx, cy - ts * 0.54);
        g.lineTo(cx - ts * 0.13, cy - ts * 0.72);
        g.lineTo(cx + ts * 0.13, cy - ts * 0.72);
        g.closePath();
        g.fillStyle = '#fde047';
        g.fill();
        g.shadowBlur = 0;
        g.font = `900 ${Math.max(9, Math.round(ts * 0.17))}px Oxanium, sans-serif`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        const label = lessonTarget.label;
        const width = g.measureText(label).width + 14;
        const lx = cx - width / 2, ly = cy - ts * 0.88;
        g.fillStyle = 'rgba(15,23,42,0.94)';
        g.strokeStyle = '#fde047'; g.lineWidth = 1.5;
        g.beginPath(); g.roundRect(lx, ly - 10, width, 21, 6); g.fill(); g.stroke();
        g.fillStyle = '#fef3c7'; g.fillText(label, cx, ly + 0.5);
        g.restore();
      }
      // cursor
      if (s.turn === 0 && U.mode !== 'busy') {
        const cx = U.cursor.x * ts, cy = U.cursor.y * ts;
        const o = Math.sin(now / 160) * 2.5;
        const L = ts * 0.28;
        g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.lineCap = 'square';
        g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 4;
        g.beginPath();
        g.moveTo(cx - o, cy - o + L); g.lineTo(cx - o, cy - o); g.lineTo(cx - o + L, cy - o);
        g.moveTo(cx + ts + o - L, cy - o); g.lineTo(cx + ts + o, cy - o); g.lineTo(cx + ts + o, cy - o + L);
        g.moveTo(cx - o, cy + ts + o - L); g.lineTo(cx - o, cy + ts + o); g.lineTo(cx - o + L, cy + ts + o);
        g.moveTo(cx + ts + o - L, cy + ts + o); g.lineTo(cx + ts + o, cy + ts + o); g.lineTo(cx + ts + o, cy + ts + o - L);
        g.stroke();
        g.shadowBlur = 0;
      }
      // particles
      const P = parts.current;
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.x += p.vx * dtFactor; p.y += p.vy * dtFactor; p.vy += p.g * dtFactor; p.life += dtFactor;
        if (p.life > p.max) { P.splice(i, 1); continue; }
        const q = p.life / p.max;
        if (p.k === 2) {
          g.strokeStyle = `rgba(255,247,237,${1 - q})`; g.lineWidth = 4 * (1 - q);
          g.beginPath(); g.arc(p.x, p.y, p.s * q * 1.3, 0, Math.PI * 2); g.stroke();
          continue;
        }
        g.globalAlpha = p.k === 1 ? 0.5 * (1 - q) : 1 - q;
        g.fillStyle = p.c;
        g.beginPath(); g.arc(p.x, p.y, p.s * (p.k === 1 ? 0.6 + q : 1 - q * 0.6), 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
      // floats
      const F = floats.current;
      for (let i = F.length - 1; i >= 0; i--) {
        const f = F[i];
        const q = (now - f.t0) / f.dur;
        if (q >= 1) { F.splice(i, 1); continue; }
        const pop = q < 0.15 ? q / 0.15 : 1;
        g.globalAlpha = q > 0.7 ? 1 - (q - 0.7) / 0.3 : 1;
        g.font = `900 ${Math.round(ts * 0.34 * f.size * (0.6 + pop * 0.4))}px Oxanium, sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 4; g.strokeStyle = '#0f172a';
        g.strokeText(f.text, f.x, f.y - q * ts * 0.7);
        g.fillStyle = f.c; g.fillText(f.text, f.x, f.y - q * ts * 0.7);
      }
      g.globalAlpha = 1;
      g.restore();
      // weather overlay (screen space)
      const w = s.weather;
      const allowWeather = st.weatherEffects ?? true;
      if (allowWeather && (w === 'rain' || w === 'snow' || w === 'sand')) {
        if (w === 'sand') { g.fillStyle = 'rgba(214,163,92,0.16)'; g.fillRect(0, 0, v.vw, v.vh); }
        g.strokeStyle = w === 'rain' ? 'rgba(186,215,255,0.45)' : w === 'snow' ? 'rgba(255,255,255,0.85)' : 'rgba(230,190,120,0.5)';
        g.lineWidth = w === 'snow' ? 3 : 1.5;
        g.lineCap = 'round';
        g.beginPath();
        const pOpt = st.particles ?? 'full';
        const n = pOpt === 'full' ? 60 : pOpt === 'medium' ? 35 : pOpt === 'low' ? 15 : 0;
        for (let i = 0; i < n; i++) {
          const spd = w === 'rain' ? 0.9 : w === 'snow' ? 0.08 : 0.5;
          const x = ((i * 97.3 + now * (w === 'sand' ? 0.6 : w === 'rain' ? 0.25 : 0.03 + Math.sin(i) * 0.02)) % (v.vw + 40)) - 20;
          if (x < -20 || x > v.vw + 20) continue;
          const y = ((i * 61.7 + now * spd * (w === 'sand' ? 0.2 : 1)) % (v.vh + 40)) - 20;
          if (w === 'rain') { g.moveTo(x, y); g.lineTo(x - 3, y + 14); }
          else if (w === 'snow') { g.moveTo(x, y); g.lineTo(x + 0.5, y + 0.5); }
          else { g.moveTo(x, y); g.lineTo(x + 18, y + 2); }
        }
        g.stroke();
      }
    };
    let lastRenderTime = 0;
    let lastFrameTimestamp = 0;
    let errCount = 0;
    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      const st = propsRef.current.save.settings;
      const targetFps = st.fpsTarget ?? 'uncapped';
      if (targetFps !== 'uncapped' && typeof targetFps === 'number') {
        const minInterval = 1000 / targetFps;
        if (now - lastRenderTime < minInterval - 1.5) return;
      }
      const rawDt = lastFrameTimestamp ? (now - lastFrameTimestamp) / 1000 : 0.016667;
      lastFrameTimestamp = now;
      lastRenderTime = now;
      const dtFactor = Math.min(3.0, Math.max(0.1, rawDt / 0.016667));

      try {
        g.globalAlpha = 1;
        g.shadowBlur = 0;
        draw(now, dtFactor);
      } catch (err) {
        if (errCount++ < 5) console.error('render error', err);
        try { g.restore(); } catch { /* ignore */ }
      }
    };
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      cv.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      cv.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTapRef = useRef(handleTap);
  handleTapRef.current = handleTap;

  // ---------- watchdog: guarantees the game can never soft-lock ----------
  const overlayRef = useRef(false);
  overlayRef.current = !!(battle || powerFx || banner || over || paused || confirmEnd || coInfo !== null);
  useEffect(() => {
    const id = setInterval(() => {
      if (finished.current || gsRef.current.winner !== null) return;
      const now = performance.now();
      if (overlayRef.current) { lastProgress.current = now; return; }
      const stuckFor = now - lastProgress.current;
      const m = ui.current.mode;
      if (propsRef.current.online) {
        if (isLocalTurn() && (m === 'busy' || m === 'moving') && stuckFor > 6000) {
          console.warn('watchdog: unlocking stalled online input without changing the synchronized board');
          for (const a of [...anims.current.values()]) a.resolve();
          anims.current.clear();
          resetUI();
          ui.current.mode = 'idle';
          bump();
        }
        return;
      }
      if (gsRef.current.turn === 0 && (m === 'busy' || m === 'moving') && stuckFor > 6000) {
        console.warn('watchdog: unlocking player input');
        for (const a of [...anims.current.values()]) a.resolve();
        anims.current.clear();
        resetUI();
        ui.current.mode = 'idle';
        bump();
      } else if (gsRef.current.turn === 1 && stuckFor > 12000) {
        console.warn('watchdog: recovering stalled enemy turn');
        recoverRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // initial banner
  useEffect(() => {
    if (mission.tutorial) {
      ui.current.mode = 'idle';
      bump();
      return;
    }
    const obj = mission.objective;
    const sub = obj.type === 'rout' ? 'Objective: Rout all enemy units' : obj.type === 'hq' ? 'Objective: Capture the enemy HQ' : `Objective: Survive ${obj.days} days`;
    ui.current.mode = 'busy';
    (async () => {
      if (props.resume) await showBanner('BATTLE RESUMED', `${mission.name} · Day ${gs.day}`, 0, 1500);
      else await showBanner(mission.name.toUpperCase(), sub, 0, 1600);
      ui.current.mode = 'idle';
      bump();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appliedRevision = useRef(0);
  useEffect(() => {
    const incoming = props.online?.snapshot;
    if (!incoming || incoming.revision <= appliedRevision.current) return;
    appliedRevision.current = incoming.revision;
    for (const anim of [...anims.current.values()]) anim.resolve();
    anims.current.clear();
    if (incoming.actorSlot !== props.online?.slot) undoSnap.current = null;
    Object.assign(gs, clone(incoming.state));
    resetUI();
    ui.current.mode = 'idle';
    refreshVis();
    terrCache.current.key = '';
    bump();
    checkOver();
    // The receiving client adopts the host's canonical board snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.online?.snapshot?.revision]);

  // ---------- HUD ----------
  const U = ui.current;
  const enemyTeam = (1 - localTeam) as Team;
  const myCo = COS[gs.cos[localTeam]], foeCo = COS[gs.cos[enemyTeam]];
  const playerRadio = gs.tiles.some((row) => row.some((tile) => tile.t === 'tower' && tile.owner === localTeam));
  const currentLesson = mission.tutorial ? TUTORIAL[tutIndexRef.current] : undefined;
  const lessonTarget = currentLesson ? currentLesson.targets?.[guideEvent()] ?? currentLesson.target : undefined;
  const highlightEndTurn = !tutorialPromptOpen && lessonTarget?.button === 'end-turn';
  const highlightUndo = !tutorialPromptOpen && lessonTarget?.button === 'undo';
  const cur = inBounds(gs, U.cursor.x, U.cursor.y) ? U.cursor : { x: 0, y: 0 };
  const curTile = gs.tiles[cur.y][cur.x];
  const curUnitRaw = unitAt(gs, cur.x, cur.y);
  const curUnit = curUnitRaw && isVis(cur.x, cur.y) ? curUnitRaw : null;
  const selUnit = U.selId != null ? unitById(gs, U.selId) : null;
  const allMoved = gs.turn === localTeam && !gs.units.some((o) => o.team === localTeam && !o.moved);
  const readySkill = gs.skills[localTeam].find((id) => canUseSkill(gs, localTeam, id));
  const v = view.current;
  // Keep both HUD rows aligned to the visible map instead of the browser edge.
  const hudVw = v.vw || window.innerWidth;
  const hudVh = v.vh || window.innerHeight;
  // HUD uses the full safe landscape width. The map stays centered beneath it.
  const hudWidth = Math.max(300, hudVw - 12);
  const bottomHudHeight = hudVh < 520 ? 58 : 72;
  const topHudY = 2;
  const bottomHudY = hudVh - bottomHudHeight - 4;

  const terrainText = (() => {
    const owner = curTile.owner === localTeam ? 'Yours' : curTile.owner === enemyTeam ? 'Enemy' : 'Neutral';
    switch (curTile.t) {
      case 'plain': return 'Open ground. No extra protection or movement penalty.';
      case 'forest': return 'Forest cover. ★★ lowers damage. No movement penalty.';
      case 'mountain': return 'Strong cover. Infantry and Mechs only; costs 2 movement.';
      case 'road': return 'Paved road. Vehicles starting here gain +1 movement.';
      case 'bridge': return 'Crossing tile with no extra protection.';
      case 'river': return 'Infantry and Mechs can cross; vehicles cannot.';
      case 'sea': return 'Open water for naval and air units.';
      case 'shoal': return 'Coastal ground. Land and air units can enter.';
      case 'reef': return 'Naval cover that improves ship defense.';
      case 'city': return `${owner} City. +1,000G/day; repairs units for a fee.`;
      case 'base': return `${owner} Base. Builds ground units, pays +1,000G/day, and repairs.`;
      case 'airport': return `${owner} Airport. Builds and refuels aircraft; pays +1,000G/day.`;
      case 'port': return `${owner} Port. Builds and repairs ships; pays +1,000G/day.`;
      case 'hq': return `${owner} HQ. Capture the enemy HQ to win.`;
      case 'tower': return `${owner} Radio Tower. +10% attack; +1 HP nearby; +1 move every 3rd turn.`;
    }
  })();

  const menuPos = (() => {
    if (!U.pending) return { left: 0, top: 0 };
    const sx = U.pending.x * v.ts - cam.current.x + v.ts + 8;
    const sy = U.pending.y * v.ts - cam.current.y - 10;
    const w = 130, h = U.menu.length * 46 + 8;
    let left = sx, top = sy;
    if (left + w > v.vw - 6) left = U.pending.x * v.ts - cam.current.x - w - 8;
    top = Math.max(TOP + 6, Math.min(v.vh - BOT - h - 6, top));
    left = Math.max(6, left);
    return { left, top };
  })();

  const fc = U.mode === 'target' && selUnit && U.pending && U.targets[U.tIdx] ? forecast(gs, selUnit, U.pending.x, U.pending.y, U.targets[U.tIdx]) : null;

  const meterBar = (team: Team) => {
    const co = COS[gs.cos[team]];
    const cost = ultimateCost(co.id);
    const pct = Math.min(100, (gs.meter[team] / cost) * 100);
    const ultimateReady = gs.meter[team] >= cost;
    return (
      <div className={`relative h-3 w-full rounded-full bg-slate-950 overflow-hidden border transition-all duration-300 ${ultimateReady ? 'border-fuchsia-200 shadow-[0_0_12px_rgba(232,121,249,0.9)] gauge-ultimate-ready' : 'border-slate-600'}`} title={ultimateReady ? `${co.superName} ready` : `${Math.floor(gs.meter[team])} / ${cost} to ${co.superName}`}>
        <div className={`h-full transition-[width] duration-700 ${gs.power[team] ? 'bg-fuchsia-300' : ultimateReady ? 'bg-gradient-to-r from-fuchsia-600 via-fuchsia-400 to-pink-200' : 'bg-gradient-to-r from-amber-500 to-yellow-200'}`} style={{ width: `${gs.power[team] ? 100 : pct}%` }} />
        {ultimateReady && <div className="absolute inset-0 gauge-sheen" />}
      </div>
    );
  };
  const skillBar = (team: Team) => {
    const equipped = gs.skills[team].filter((id) => SKILLS[id]);
    if (!equipped.length) return null;
    const max = Math.max(1, gs.skillMeterMax[team]);
    const pct = Math.min(100, (gs.skillMeter[team] / max) * 100);
    const ready = equipped.some((id) => canUseSkill(gs, team, id));
    return (
      <div className="flex items-center gap-1 mt-1" title={`Tactical Skill charge ${Math.floor(gs.skillMeter[team])}/${max} · charges 35% slower`}>
        <span className="text-[8px] font-black tracking-wider text-emerald-300 shrink-0">SKILL</span>
        <div className={`relative h-2 flex-1 rounded-full overflow-hidden border bg-slate-950 ${ready ? 'border-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'border-slate-600'}`}>
          <div className={`h-full transition-all duration-500 ${ready ? 'bg-emerald-300' : 'bg-gradient-to-r from-emerald-700 to-emerald-400'}`} style={{ width: `${pct}%` }} />
          {equipped.map((id) => <div key={id} className="absolute top-0 bottom-0 w-px bg-white/70" style={{ left: `${Math.min(99, (SKILLS[id].cost / max) * 100)}%` }} />)}
        </div>
      </div>
    );
  };

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden select-none touch-none bg-slate-950">
      <canvas ref={cvRef} className="absolute inset-0" />

      {/* TOP HUD */}
      <div ref={topHudRef} className="battle-top-hud absolute left-1/2 -translate-x-1/2 z-20 flex items-stretch justify-center gap-1 p-1 pointer-events-none" style={{ top: topHudY, width: hudWidth }}>
        <button className="battle-pause pointer-events-auto hud-btn w-10 text-base" onClick={() => setPaused(true)} aria-label="Pause">⏸</button>
        <div className={`battle-co-panel pointer-events-auto hud-panel flex items-center gap-1.5 px-1.5 py-0.5 min-w-0 flex-1 ${gs.meter[localTeam] >= ultimateCost(myCo.id) ? 'border-fuchsia-300 shadow-[0_0_20px_rgba(232,121,249,0.55)]' : ''}`}>
          <button className="relative shrink-0 active:scale-95 transition" onClick={() => { sfx.menu(); setCoInfo(localTeam); }} aria-label="Commander info">
            <Portrait id={gs.cos[localTeam]} size={38} />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-sky-500 text-[9px] font-black flex items-center justify-center border border-white">i</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <button className="text-xs font-black text-sky-300 truncate underline decoration-dotted underline-offset-2" onClick={() => { sfx.menu(); setCoInfo(localTeam); }}>{myCo.name}</button>
              <span className={`text-[9px] font-black truncate ${gs.meter[localTeam] >= ultimateCost(myCo.id) ? 'text-fuchsia-200' : 'text-slate-400'}`}>
                {gs.power[localTeam] === 2 ? myCo.superName : gs.meter[localTeam] >= ultimateCost(myCo.id) ? 'ULTIMATE READY' : ''}
              </span>
            </div>
            {meterBar(localTeam)}
            {skillBar(localTeam)}
            <div className="flex gap-1 mt-0.5">
              <button disabled={!canActivate(gs, localTeam, 2) || !isLocalTurn() || U.mode !== 'idle'} onClick={() => playerPower(2)}
                className={`flex-1 text-[8.5px] font-black rounded px-1 py-0.5 border ${canActivate(gs, localTeam, 2) && isLocalTurn() ? 'bg-fuchsia-500 text-white border-fuchsia-300 animate-pulse shadow-[0_0_10px_#d946ef]' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>ULTIMATE ACTIVATE</button>
              {gs.skills[localTeam].length > 0 && (
                <button disabled={!readySkill || !isLocalTurn() || U.mode !== 'idle'} onClick={() => readySkill && playerSkill(readySkill)}
                  className={`flex-1 text-[8.5px] font-black rounded px-1 py-0.5 border ${isLocalTurn() && readySkill ? 'bg-emerald-500 text-white border-emerald-300 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-slate-800 text-slate-400 border-slate-700'}`} title={readySkill ? `Activate ${SKILLS[readySkill].name}` : 'Skill is still charging'}>SKILL ACTIVATE</button>
              )}
            </div>
          </div>
        </div>
        <div className="battle-middle-panel pointer-events-auto hud-panel px-1.5 py-0.5 flex flex-col justify-between items-center min-w-[125px] shrink-0">
          <div className="flex items-center justify-between w-full gap-1 border-b border-slate-700/80 pb-0.5">
            <div className="text-[10px] font-black text-slate-300 leading-tight">
              DAY <span className="text-xs font-black text-white">{gs.day}</span>
              {mission.objective.type === 'survive' ? <span className="text-[8.5px] text-slate-400">/{mission.objective.days + 1}</span> : mission.dayLimit ? <span className="text-[8.5px] text-slate-400">/{mission.dayLimit}</span> : null}
            </div>
            <div className="text-xs font-black text-amber-300 leading-tight">{gs.funds[localTeam].toLocaleString()}G</div>
          </div>
          <div className="flex items-center justify-between w-full gap-1 text-[8.5px] leading-tight pt-0.5">
            <div className="flex items-center gap-0.5" title={WEATHER_INFO[gs.weather].desc}>
              <span className="text-[10px]">{WEATHER_INFO[gs.weather].icon}</span>
              <span className="text-slate-300 font-bold text-[8px]">{WEATHER_INFO[gs.weather].name}</span>
            </div>
            <div className={`font-black text-[8px] ${playerRadio ? gs.radioMove[localTeam] ? 'text-cyan-200 animate-pulse' : 'text-cyan-400' : 'text-slate-500'}`} title={playerRadio ? 'Radio Tower: +1 HP to units on/next to it; +1 move for all units every 3rd turn; ★★★ defense' : 'Capture a Radio Tower'}>
              📡 {playerRadio ? gs.radioMove[localTeam] ? 'BOOST' : `${gs.radioCycle[localTeam]}/3` : 'NO RELAY'}
            </div>
            <div className="text-slate-300 font-bold text-[8px]">
              Units <span className="text-white">{unitCount(gs, localTeam)}/{gs.unitCap[localTeam]}</span>
            </div>
            <div className="text-rose-300 font-bold text-[8px]">
              Foe <span className="text-white">{gs.units.filter((o) => o.team === enemyTeam && isVis(o.x, o.y)).length}{gs.fog ? '?' : ''}</span>
            </div>
          </div>
        </div>
        <div className={`battle-co-panel pointer-events-auto hud-panel flex items-center gap-1.5 px-1.5 py-0.5 min-w-0 flex-1 cursor-pointer ${gs.meter[enemyTeam] >= ultimateCost(foeCo.id) ? 'border-fuchsia-300 shadow-[0_0_20px_rgba(232,121,249,0.55)]' : ''}`} onClick={() => { sfx.menu(); setCoInfo(enemyTeam); }}>
          <div className="relative shrink-0">
            <Portrait id={gs.cos[enemyTeam]} size={38} />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-[9px] font-black flex items-center justify-center border border-white">i</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-rose-300 truncate">{foeCo.name}</div>
            {meterBar(enemyTeam)}
            {skillBar(enemyTeam)}
            <div className={`text-[9px] font-black truncate mt-0.5 ${gs.meter[enemyTeam] >= ultimateCost(foeCo.id) ? 'text-fuchsia-200' : 'text-slate-400'}`}>
              {gs.power[enemyTeam] ? foeCo.superName + ' active!' : gs.meter[enemyTeam] >= ultimateCost(foeCo.id) ? 'ULTIMATE READY' : props.online ? props.online.opponentName : `Lv ${gs.aiLevel} AI`}
            </div>
          </div>
        </div>
      </div>

      {/* In-battle briefing: the dimmed battlefield stays visible, but all game input is paused. */}
      {tutNote && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-950/70 backdrop-blur-[2px] p-3 pointer-events-auto anim-fade" role="dialog" aria-modal="true">
          <div className="hud-panel border-cyan-300 bg-slate-950/90 p-4 w-[min(460px,94vw)] shadow-[0_16px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(34,211,238,0.35)] anim-zoom">
            {/* CO dialogue: portrait + short speech */}
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <Portrait id="rhea" size={64} className="shadow-lg" />
                {tutNote.icon && <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-cyan-500 border-2 border-cyan-100 flex items-center justify-center text-base font-black shadow-[0_0_12px_rgba(34,211,238,0.7)]">{tutNote.icon}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-black tracking-[0.25em] text-cyan-300">CAPT. RHEA · UNDO TASK</div>
                <div className="text-lg font-black text-white tracking-wide leading-tight">{tutNote.title}</div>
                <div className="mt-2 rounded-xl rounded-tl-sm bg-slate-800/90 border border-slate-600 px-3 py-2 text-sm text-slate-100 leading-relaxed whitespace-pre-line">{tutNote.text}</div>
              </div>
            </div>
            <button autoFocus className="menu-btn h-11 w-full mt-4 bg-cyan-400 text-slate-900" onClick={continueTutorialPrompt}>GOT IT ▸</button>
          </div>
        </div>
      )}

      {briefingOpen && guideStep && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-950/70 backdrop-blur-[2px] p-3 pointer-events-auto anim-fade" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
          <div className="hud-panel border-amber-400/90 bg-slate-950/90 p-3 sm:p-4 w-[min(620px,96vw)] max-h-[84vh] overflow-auto shadow-[0_16px_60px_rgba(0,0,0,0.8)] anim-zoom">
            <div className="flex gap-3 items-start">
              <Portrait id={guideStep.speaker ?? 'rhea'} size={52} className="shadow-lg" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2 items-start">
                  <div className="min-w-0">
                    <div className="text-[9px] font-black tracking-[0.25em] text-amber-400">BATTLEFIELD BRIEFING</div>
                    <div id="tutorial-title" className="text-base sm:text-lg font-black tracking-wide text-white">{guideStep.title}</div>
                  </div>
                  <div className="text-[9px] font-black tracking-widest text-slate-500 shrink-0">LESSON {tut + 1}/{TUTORIAL.length}{guideStep.events ? ` · ORDER ${tutActionIndex.current + 1}/${guideStep.events.length}` : ''}</div>
                </div>
                <div className="text-xs sm:text-sm text-slate-100 leading-relaxed mt-2 whitespace-pre-line">{guideStep.text}</div>
                {guideStep.kind === 'action' && guideTarget() && <div className="mt-2 rounded-md bg-amber-400/10 border border-amber-400/40 px-2 py-1 text-[10px] sm:text-xs font-black text-amber-200">NEXT: {guideTarget()!.label}</div>}
              </div>
            </div>

            {guideStep.units && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3">
                {guideStep.units.map((type) => {
                  const d = UNITS[type];
                  return (
                    <div key={type} className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/80 p-1.5">
                      <UnitIcon type={type} size={42} />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white">{d.name} <span className="text-[9px] text-amber-300">{d.cost.toLocaleString()}G</span></div>
                        <div className="text-[10px] text-slate-300 leading-snug">{d.desc}</div>
                        <div className="text-[9px] text-slate-500">Move {d.move} · Range {d.range[0]}–{d.range[1]}{d.fuel ? ` · Fuel ${d.fuel}` : ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800">
              <div className="text-[9px] text-slate-500 flex-1">
                {guideStep.kind === 'info' ? 'The battle is paused while this briefing is open.' : 'Dismiss this briefing, then complete the instructed battlefield action.'}
              </div>
              {save.tutorialComplete && tut === 0 && (
                <button className="menu-btn h-11 min-w-[130px] bg-slate-700 text-slate-200 text-xs" onClick={() => {
                  tutIndexRef.current = TUTORIAL.length;
                  tutActionIndex.current = 0;
                  setTutIndex(TUTORIAL.length);
                  setTutorialDismissed(true);
                  setTutNote(null);
                  sfx.cancel();
                  bump();
                }}>SKIP TUTORIAL</button>
              )}
              <button autoFocus className="menu-btn h-11 min-w-[164px] bg-amber-400 text-slate-900" onClick={continueTutorialPrompt}>
                {guideStep.kind === 'info' ? (guideStep.event === 'field-guide' ? 'BEGIN THE BATTLE ▶' : 'CONTINUE ▸') : 'ENTER THE FIELD ▸'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rangePeek && rangePeek.until > performance.now() && (
        <div className="absolute z-30 top-[72px] left-1/2 -translate-x-1/2 max-w-[94vw] hud-panel border-cyan-300 px-3 py-2 text-[11px] sm:text-sm font-black text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.35)] pointer-events-none anim-pop">
          {rangePeek.text}
        </div>
      )}

      {/* BOTTOM HUD */}
      <div ref={bottomHudRef} className="battle-bottom-hud absolute left-1/2 -translate-x-1/2 z-20 flex items-end justify-center gap-1.5 p-1.5 pointer-events-none" style={{ top: bottomHudY, width: hudWidth }}>
        <div className="pointer-events-auto hud-panel px-3 py-1.5 flex gap-3 items-center min-w-0 flex-1 cursor-pointer border-amber-400/50 overflow-hidden" style={{ height: bottomHudHeight }} onClick={() => setShowIntel(true)} title="Tap for full Intel">
          <div className="min-w-[110px] sm:min-w-[130px] shrink-0 pr-2 border-r border-slate-600 flex flex-col justify-center">
            <div className="text-xs sm:text-sm font-black text-white leading-tight truncate">{TERRAIN[curTile.t].name}</div>
            <div className="text-xs font-black text-amber-300 leading-tight mt-0.5">
              Defense <span className="text-sm">{'★'.repeat(Math.max(1, TERRAIN[curTile.t].def))}</span>
            </div>
            {curTile.capture < 20 && <div className="text-[10px] text-amber-300 font-bold">Cap: {curTile.capture}/20</div>}
          </div>
          {curUnit ? (() => {
            const d = UNITS[curUnit.type], m = unitMods(gs, curUnit);
            return (
              <div className="min-w-0 flex-1 flex items-center gap-2 sm:gap-3">
                <div className="shrink-0"><UnitIcon type={curUnit.type} team={curUnit.team} size={42} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <div className={`text-sm sm:text-base font-black leading-none ${curUnit.team === localTeam ? 'text-sky-300' : 'text-rose-300'}`}>{d.name} {curUnit.vet ? '★'.repeat(curUnit.vet) : ''}</div>
                    <div className="text-xs font-black text-white">HP {dispHp(curUnit.hp)}/10</div>
                  </div>
                  <div className="flex gap-2 sm:gap-3 flex-wrap mt-1 text-xs font-black leading-none">
                    <span className="text-cyan-300">MOVE {m.move}</span>
                    <span className="text-rose-300">ATTACK {m.rmin === m.rmax ? `${m.rmax}` : `${m.rmin}–${m.rmax}`}</span>
                    <span className="text-amber-300">ATK {m.atk}%</span>
                    <span className="text-emerald-300">DEF {m.def}%</span>
                    {d.fuel && <span className="text-sky-300">FUEL {curUnit.fuel ?? 0}/{d.fuel}</span>}
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="min-w-0 flex-1 flex items-center">
              <div className="text-xs sm:text-sm font-black text-slate-400">Select a unit or terrain tile</div>
            </div>
          )}
        </div>
        {/* Action controls: Bigger, wider UNDO button sitting above END TURN */}
        <div className="pointer-events-auto flex flex-col gap-1 w-[110px] sm:w-[130px] shrink-0" style={{ height: bottomHudHeight }}>
          <button
            className={`relative flex-1 rounded-xl font-black text-xs sm:text-sm border-2 transition-all active:scale-95 flex items-center justify-center ${canUndo() ? 'bg-cyan-600 border-cyan-300 text-white shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-800 border-slate-700 text-slate-500'} ${highlightUndo ? 'tutorial-end-glow' : ''}`}
            onClick={doUndo} title="Undo last action (once per turn) — U">
            {highlightUndo && <span className="tutorial-button-label">TAP HERE</span>}↶ {undoUsedDay.current === gs.day ? 'USED' : 'UNDO'}
          </button>
          <button
            className={`relative flex-1 rounded-xl font-black text-xs sm:text-sm border-2 transition-all active:scale-95 flex items-center justify-center ${!isLocalTurn() || (props.online?.mode === 'coop' && !props.online.isHost) ? 'bg-slate-800 border-slate-700 text-slate-500' : allMoved ? 'bg-amber-400 border-amber-200 text-slate-900 shadow-[0_0_20px_#fbbf24] animate-pulse' : 'bg-sky-600 border-sky-300 text-white'} ${highlightEndTurn ? 'tutorial-end-glow' : ''}`}
            onClick={requestEnd} disabled={!isLocalTurn() || (props.online?.mode === 'coop' && !props.online.isHost)}>
            {highlightEndTurn && <span className="tutorial-button-label">TAP HERE</span>} END TURN
          </button>
        </div>
      </div>

      {/* Action menu */}
      {U.mode === 'menu' && U.pending && (
        <div className="absolute z-30 hud-panel p-1 flex flex-col gap-1 w-[130px] anim-pop" style={menuPos}>
          {U.menu.map((m, i) => (
            <button key={m.id}
              className={`h-10 rounded-md text-sm font-black tracking-wide text-left px-3 border transition-colors ${i === U.mIdx ? 'bg-amber-400 text-slate-900 border-amber-200' : m.id === 'cancel' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-700 text-white border-slate-600'}`}
              onPointerEnter={() => { U.mIdx = i; bump(); }}
              onClick={() => chooseMenu(m.id)}>
              {m.id === 'fire' ? '🎯 ' : m.id === 'capture' ? '🚩 ' : m.id === 'wait' ? '⏹ ' : m.id === 'load' ? '⬇ ' : m.id === 'drop' ? '⬆ ' : '↩ '}{m.label}
            </button>
          ))}
        </div>
      )}

      {/* Forecast */}
      {fc && selUnit && U.targets[U.tIdx] && (
        <div className="absolute z-30 left-1/2 -translate-x-1/2 top-[70px] hud-panel border-rose-400 px-3 py-2 flex items-center gap-3 anim-pop">
          <div className="text-center">
            <div className="text-[10px] text-slate-400">DAMAGE</div>
            <div className="text-2xl font-black text-amber-300">{fc.lo}–{fc.hi}%</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400">COUNTER</div>
            <div className="text-lg font-black text-rose-300">{fc.counter ? `~${fc.counter}%` : '—'}</div>
          </div>
          <button className="h-11 px-4 rounded-lg bg-rose-500 border-2 border-rose-300 text-white font-black active:scale-95" onClick={() => confirmAttack(U.targets[U.tIdx])}>FIRE!</button>
          <button className="h-11 px-2 rounded-lg bg-slate-700 text-slate-200 font-bold" onClick={() => { U.mode = 'menu'; bump(); }}>↩</button>
        </div>
      )}
      {U.mode === 'drop' && <div className="absolute z-30 left-1/2 -translate-x-1/2 top-[70px] hud-panel px-3 py-2 text-sm font-bold text-green-300">Choose a green tile to drop cargo</div>}

      {/* Build menu */}
      {U.mode === 'build' && U.build && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 anim-fade p-2" onClick={() => { resetUI(); bump(); }}>
          <div className="hud-panel border-sky-400 p-3 w-[min(940px,98vw)] max-h-[96vh] overflow-y-auto overflow-x-hidden anim-zoom" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <div className="font-black text-sky-300">DEPLOY — {TERRAIN[gs.tiles[U.build.y][U.build.x].t].name}</div>
              <div className="text-xs text-slate-300"><span className="text-amber-300 font-bold">{gs.funds[localTeam].toLocaleString()}G</span> · Slots {unitCount(gs, localTeam)}/{gs.unitCap[localTeam]}</div>
            </div>
            {unitCount(gs, localTeam) >= gs.unitCap[localTeam] && <div className="text-xs text-rose-300 mb-2">Unit limit reached! Lose or merge units before deploying more.</div>}
            <div className="grid md:grid-cols-2 gap-1.5">
              {U.build.list.map((t, i) => {
                const cost = costFor(gs, localTeam, t);
                const ups = save.unitUps?.[t];
                const upTxt = ups ? TRACK_ORDER.filter((k) => ups[k]).map((k) => `${TRACKS[k].icon}${ups[k]}`).join(' ') : '';
                const ok = cost <= gs.funds[localTeam] && unitCount(gs, localTeam) < gs.unitCap[localTeam];
                const d = UNITS[t];
                return (
                  <button key={t} disabled={!ok} onClick={() => doBuild(t)} onPointerEnter={() => { U.bIdx = i; bump(); }}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition ${i === U.bIdx && ok ? 'bg-sky-700 border-sky-300' : ok ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-800 opacity-50'}`}>
                    <UnitIcon type={t} />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="text-sm font-bold text-white flex justify-between gap-2"><span className="min-w-0 truncate">{d.name} <span className="text-[10px] text-emerald-300">{upTxt}</span></span><span className="text-amber-300 shrink-0">{cost.toLocaleString()}G</span></div>
                      <div className="text-[10px] text-slate-400 leading-snug line-clamp-2">Mv {d.move} · Rng {d.range[0]}-{d.range[1]} · {d.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Intel */}
      {showIntel && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 anim-fade" onClick={() => setShowIntel(false)}>
          <div className="hud-panel p-3 w-[min(480px,94vw)] max-h-[82vh] overflow-auto text-sm anim-zoom" onClick={(e) => e.stopPropagation()}>
            <div className="font-black text-amber-300 mb-2">INTEL</div>
            {curUnit && (
              <div className="mb-3">
                <div className="font-bold text-white">{UNITS[curUnit.type].name} — {UNITS[curUnit.type].desc}</div>
                <div className="text-xs text-slate-300 mt-1">Terrain bonus: {TERRAIN_BONUS[UNITS[curUnit.type].cat]}</div>
                <div className="text-xs text-slate-300">Move type: {UNITS[curUnit.type].moveType} · Vision {unitMods(gs, curUnit).vision}</div>
              </div>
            )}
            <div className="text-xs text-slate-300 mb-2"><b className="text-white">{WEATHER_INFO[gs.weather].icon} {WEATHER_INFO[gs.weather].name}:</b> {WEATHER_INFO[gs.weather].desc}</div>
            {[0, 1].map((t) => {
              const co = COS[gs.cos[t]];
              return (
                <div key={t} className="flex gap-2 mb-2 cursor-pointer rounded-lg hover:bg-slate-800/60 p-1" onClick={() => { setShowIntel(false); setCoInfo(t as Team); }}>
                  <Portrait id={co.id} size={48} />
                  <div className="text-xs">
                    <div className={`font-bold ${t === 0 ? 'text-sky-300' : 'text-rose-300'}`}>{co.title} {co.name}</div>
                    <div className="text-slate-300">{co.d2d}</div>
                    <div className="text-fuchsia-300">✦ Ultimate · {co.superName}: <span className="text-slate-300">{co.superDesc}</span></div>
                  </div>
                </div>
              );
            })}
            <div className="text-xs text-slate-400">Hint: {mission.hint}</div>
            <button className="mt-3 w-full h-10 rounded-lg bg-slate-700 font-bold" onClick={() => setShowIntel(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Banner */}
      {banner && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className={`w-full py-4 text-center anim-banner ${banner.team === localTeam ? 'bg-gradient-to-r from-transparent via-sky-700/95 to-transparent' : 'bg-gradient-to-r from-transparent via-rose-700/95 to-transparent'}`}>
            <div className="text-4xl sm:text-5xl font-black tracking-widest text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.6)]">{banner.text}</div>
            <div className="text-sm text-white/90 font-bold mt-1 px-4">{banner.sub}</div>
          </div>
        </div>
      )}

      {chargeFx && (
        chargeFx.level === 2 ? (
          <div key={chargeFx.id} onPointerDown={(e) => { e.stopPropagation(); dismissChargeFx(); }} role="button" aria-label="Dismiss ultimate banner"
            className={`absolute inset-0 z-[45] flex items-center justify-center p-3 pointer-events-auto cursor-pointer ultimate-alert ${fxClosing ? 'ultimate-closing' : ''} ${chargeFx.team === localTeam ? 'ultimate-alert-player' : 'ultimate-alert-enemy'}`}>
            <div className="ultimate-backdrop" />
            <div className="ultimate-rays" />
            <div className="relative flex flex-col sm:flex-row items-center gap-3 sm:gap-5 w-[min(720px,96vw)] px-4 py-5 sm:px-7 sm:py-6 border-2 border-fuchsia-200/90 bg-slate-950/80 shadow-[0_0_70px_rgba(217,70,239,0.55)] ultimate-panel">
              <div className="ultimate-ring" />
              <Portrait id={gs.cos[chargeFx.team]} size={112} className="ultimate-portrait" />
              <div className="relative text-center sm:text-left flex-1">
                <div className="text-[10px] sm:text-xs font-black tracking-[0.32em] text-fuchsia-200">{chargeFx.team === localTeam ? 'COMMANDER ULTIMATE' : 'ENEMY COMMANDER ULTIMATE'}</div>
                <div className="text-3xl sm:text-5xl font-black italic tracking-wide text-white drop-shadow-[0_4px_0_rgba(88,28,135,0.9)]">{COS[gs.cos[chargeFx.team]].superName.toUpperCase()}</div>
                <div className="text-xs sm:text-sm font-bold text-fuchsia-100 mt-1">ULTIMATE READY</div>
                <div className="text-xs sm:text-sm font-bold text-fuchsia-50 mt-1.5 leading-snug">{COS[gs.cos[chargeFx.team]].superDesc}</div>
                <div className="text-[10px] sm:text-xs text-slate-200 mt-1">{chargeFx.team === localTeam ? 'Tap SUPER or your CO portrait to unleash it.' : 'The opposing commander can unleash their ultimate.'}</div>
                <div className="text-[9px] tracking-[0.25em] text-white/50 mt-2 font-black">TAP ANYWHERE TO CLOSE</div>
              </div>
              <div className="ultimate-seal" aria-hidden="true">✦</div>
            </div>
          </div>
        ) : (
          <div key={chargeFx.id} onPointerDown={(e) => { e.stopPropagation(); dismissChargeFx(); }} className={`absolute z-[35] top-[74px] left-1/2 -translate-x-1/2 cursor-pointer anim-charge ${fxClosing ? 'ultimate-closing' : ''}`}>
            <div className="hud-panel px-4 py-2 border-2 border-amber-300 flex items-center gap-2 shadow-[0_0_28px_rgba(250,204,21,0.6)]">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="text-xs font-black tracking-[0.2em] text-amber-200">CO POWER READY</div>
                <div className="text-[10px] text-white font-bold">{COS[gs.cos[chargeFx.team]].name} · {COS[gs.cos[chargeFx.team]].powerName}</div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Power cut-in */}
      {powerFx && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="absolute inset-0 anim-flash" style={{ background: COS[powerFx.co].color }} />
          <div className="absolute inset-0 power-rays" />
          <div className="relative flex items-center gap-4 anim-cutin">
            <Portrait id={powerFx.co} size={140} className="shadow-2xl" />
            <div>
              <div className="text-sm font-black text-white/80 tracking-[0.3em]">{powerFx.level === 3 ? 'TACTICAL SKILL' : 'CO ULTIMATE'}</div>
              <div className="text-4xl sm:text-6xl font-black text-white italic drop-shadow-[0_4px_0_rgba(0,0,0,0.7)]">{powerFx.name}!</div>
              <div className="text-sm text-white font-bold mt-1">{powerFx.desc ?? (powerFx.level === 2 ? COS[powerFx.co].superDesc : COS[powerFx.co].powerDesc)}</div>
            </div>
          </div>
        </div>
      )}

      {coInfo !== null && (
        <COInfo
          coId={gs.cos[coInfo]}
          isEnemy={coInfo !== localTeam}
          meter={gs.meter[coInfo]}
          meterMax={gs.meterMax[coInfo]}
          skillMeter={gs.skillMeter[coInfo]}
          skillMeterMax={gs.skillMeterMax[coInfo]}
          rank={coInfo === localTeam ? gs.coRank[localTeam] : undefined}
          skills={gs.skills[coInfo]}
          canSkill={(id) => coInfo === localTeam && isLocalTurn() && U.mode === 'idle' && canUseSkill(gs, localTeam, id)}
          onSkill={(id) => { setCoInfo(null); playerSkill(id); }}
          active={gs.power[coInfo]}
          onClose={() => setCoInfo(null)}
          canSuper={coInfo === localTeam && isLocalTurn() && U.mode === 'idle' && canActivate(gs, localTeam, 2)}
          onActivate={(lvl) => { setCoInfo(null); playerPower(lvl); }}
        />
      )}

      {battle && <BattleScene key={`${battle.r.attackerId}-${battle.r.defenderId}-${battle.r.dBefore}-${battle.r.aBefore}`} r={battle.r} cos={gs.cos} speed={speed} weather={gs.weather} onDone={battle.done} />}

      {/* End turn confirm */}
      {confirmEnd && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 anim-fade">
          <div className="hud-panel p-4 w-[min(340px,90vw)] text-center anim-zoom">
            <div className="font-black text-white mb-1">End turn?</div>
            <div className="text-xs text-slate-300 mb-3">Some units haven't acted yet.</div>
            <div className="flex gap-2">
              <button className="flex-1 h-11 rounded-lg bg-slate-700 font-bold" onClick={() => setConfirmEnd(false)}>Back</button>
              <button className="flex-1 h-11 rounded-lg bg-amber-400 text-slate-900 font-black" onClick={endPlayerTurn}>End Turn</button>
            </div>
          </div>
        </div>
      )}

      {/* Pause */}
      {paused && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 anim-fade">
          {showGraphicsSettings ? (
            <GraphicsSettingsModal
              settings={settings}
              onSave={(st) => props.onSettings(st)}
              onClose={() => setShowGraphicsSettings(false)}
            />
          ) : (
            <div className="hud-panel p-5 w-[min(360px,92vw)] max-h-[96vh] overflow-auto anim-zoom">
              <div className="text-3xl font-black text-center text-amber-300 mb-1 tracking-widest">PAUSED</div>
              <div className="text-center text-xs text-slate-400 mb-4">{mission.name} · Day {gs.day}</div>
              <div className="grid gap-2">
                <button className="menu-btn bg-sky-600" onClick={() => setPaused(false)}>▶ Resume</button>
                <button className="menu-btn bg-slate-700" onClick={restart}>↻ Restart Mission</button>
                <button className="menu-btn bg-slate-700" onClick={() => { setPaused(false); setShowIntel(true); }}>ℹ Intel & COs</button>
                <button className="menu-btn bg-amber-600 text-sm font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]" onClick={() => setShowGraphicsSettings(true)}>
                  ⚙️ Graphics & Performance Settings
                </button>
                <button className="menu-btn bg-slate-800 text-sm" onClick={() => props.onSettings({ ...settings, battleAnim: settings.battleAnim === 'all' ? 'player' : settings.battleAnim === 'player' ? 'off' : 'all' })}>
                  Battle Scenes: <b className="text-amber-300">{settings.battleAnim === 'all' ? 'All' : settings.battleAnim === 'player' ? 'Mine only' : 'Off'}</b>
                </button>
                <button className="menu-btn bg-slate-800 text-sm" onClick={() => props.onSettings({ ...settings, speed: settings.speed === 0.75 ? 1 : settings.speed === 1 ? 1.5 : 0.75 })}>
                  Anim Speed: <b className="text-amber-300">{settings.speed === 0.75 ? 'Slow' : settings.speed === 1 ? 'Normal' : 'Fast'}</b>
                </button>
                <button className="menu-btn bg-slate-800 text-sm" onClick={() => props.onSettings({ ...settings, sfx: !settings.sfx })}>
                  Sound: <b className="text-amber-300">{settings.sfx ? 'On' : 'Off'}</b>
                </button>
                <button className="menu-btn bg-rose-700" onClick={props.onExit}>✕ Quit to Menu</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game over */}
      {over && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 anim-fade p-2">
          <div className={`hud-panel p-5 w-[min(420px,94vw)] max-h-[94vh] overflow-auto text-center anim-zoom ${over.won ? 'border-amber-400' : 'border-rose-500'}`}>
            <div className={`text-5xl font-black tracking-widest ${over.won ? 'text-amber-300' : 'text-rose-400'} anim-banner`}>{over.won ? 'VICTORY' : 'DEFEAT'}</div>
            <div className="text-xs text-slate-400 mt-1">{mission.name} · {gs.day} days · {myCo.name}</div>
            <div className="flex items-center justify-center gap-4 my-4">
              <div className={`rank-badge rank-${over.score.rank}`}>{over.score.rank}</div>
              <div className="text-left text-sm">
                <div className="flex justify-between gap-4"><span className="text-slate-400">Speed</span><b>{over.won ? over.score.speed : 0}</b></div>
                <div className="flex justify-between gap-4"><span className="text-slate-400">Power</span><b>{over.score.power}</b></div>
                <div className="flex justify-between gap-4"><span className="text-slate-400">Technique</span><b>{Math.round(over.won ? over.score.technique : over.score.technique / 3)}</b></div>
                <div className="flex justify-between gap-4 border-t border-slate-600 mt-1 pt-1"><span className="text-amber-300 font-bold">SCORE</span><b className="text-amber-300 text-lg">{over.score.total}</b></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div className="bg-slate-800 rounded p-1.5"><div className="text-slate-400">Destroyed</div><b className="text-lg">{gs.stats.kills[localTeam]}</b></div>
              <div className="bg-slate-800 rounded p-1.5"><div className="text-slate-400">Lost</div><b className="text-lg">{gs.stats.lost[localTeam]}</b></div>
              <div className="bg-slate-800 rounded p-1.5"><div className="text-slate-400">Captured</div><b className="text-lg">{gs.stats.captures[localTeam]}</b></div>
            </div>
            <div className="text-sm text-amber-300 font-bold">+{over.score.merits} 🪙 Gold earned</div>
            {over.drops && over.drops.length > 0 && (
              <div className="mt-2 grid gap-1.5">
                {over.drops.map((d) => (
                  <div key={d.co} className="rounded-lg border-2 border-fuchsia-400/70 bg-fuchsia-500/10 p-1.5 flex items-center gap-2 text-left anim-pop">
                    <Portrait id={d.co} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-black tracking-widest text-fuchsia-300">🧩 CO PIECES{d.story ? ' · STORY BONUS' : ''}</div>
                      <div className="text-sm font-black text-white truncate">{COS[d.co]?.name} <span className="text-fuchsia-200">+{d.n}</span></div>
                    </div>
                  </div>
                ))}
                <div className="text-[10px] text-slate-400">Collect enough pieces, then unlock them in Command HQ.</div>
              </div>
            )}
            {over.reward && SKILLS[over.reward] && (
              <div className="mt-2 rounded-lg border-2 border-emerald-400 bg-emerald-500/10 p-2 text-sm anim-pop">
                <div className="text-[10px] font-black tracking-widest text-emerald-300">🎁 STORY REWARD UNLOCKED</div>
                <div className="font-black text-white">{SKILLS[over.reward].icon} {SKILLS[over.reward].name}</div>
                <div className="text-[11px] text-slate-300">{SKILLS[over.reward].desc} Equip it in Command HQ.</div>
              </div>
            )}
            {over.place >= 0 && <div className="text-sm text-amber-300 font-black mt-1 animate-pulse">🏆 NEW HIGH SCORE — #{over.place + 1}</div>}
            <div className="grid gap-2 mt-4">
              {over.won && props.hasNext && <button className="menu-btn bg-amber-400 text-slate-900" onClick={props.onNext}>Prep Next Mission ▶ <span className="text-xs opacity-60">(N)</span></button>}
              <button className="menu-btn bg-sky-600" onClick={restart}>↻ Retry <span className="text-xs opacity-60">(R)</span></button>
              <button className="menu-btn bg-slate-700" onClick={props.onExit}>Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function UnitIcon({ type, team = 0, size = 40 }: { type: UnitType; team?: Team; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = size * dpr; c.height = size * dpr;
    const g = c.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, size, size);
    drawUnit(g, type, size / 2, size / 2 + 2, size * 0.95, team, 1, 0);
  }, [type, team, size]);
  return <canvas ref={ref} style={{ width: size, height: size }} className="shrink-0 rounded bg-slate-900/60" />;
}
