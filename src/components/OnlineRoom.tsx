import { useEffect, useRef, useState } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import { COS, PLAYABLE_ORDER } from '../game/data';
import { MISSIONS } from '../game/campaign';
import { ONLINE_DUEL } from '../game/onlineMission';
import { createGame, income } from '../game/engine';
import type { GameState, MissionDef, SaveData, Team } from '../game/types';
import GameView, { type OnlineControl, type OnlineSnapshot, type ScoreInfo } from './GameView';
import Portrait from './Portrait';
import { sfx } from '../game/audio';

type OnlineMode = 'pvp' | 'coop';
type Phase = 'home' | 'setup' | 'game';
type Wire =
  | { type: 'hello'; name: string }
  | { type: 'lobby'; mode: OnlineMode; missionIndex: number; hostCo: string; hostName: string }
  | { type: 'ready'; co: string; name: string }
  | { type: 'start'; mode: OnlineMode; mission: MissionDef; missionIndex: number; hostCo: string; guestCo: string; hostName: string; guestName: string; initial: GameState }
  | { type: 'action'; revision: number; event: 'action' | 'undo' | 'turn-start' | 'turn-end'; state: GameState }
  | { type: 'snapshot'; revision: number; activeSlot: 0 | 1; actorSlot: 0 | 1; undoSlot: 0 | 1 | null; state: GameState }
  | { type: 'restart-request' }
  | { type: 'leave' };

interface MatchConfig {
  mode: OnlineMode;
  mission: MissionDef;
  missionIndex: number;
  hostCo: string;
  guestCo: string;
  hostName: string;
  guestName: string;
}

interface Props {
  save: SaveData;
  onBack: () => void;
  onSettings: (s: SaveData['settings']) => void;
  onCoopComplete: (mission: MissionDef, index: number, co: string, won: boolean, score: ScoreInfo, gs: GameState) => number;
}

const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
const peerId = (code: string) => `ironfront-${code.toLowerCase()}`;
const clone = <T,>(v: T): T => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

function roomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const a = new Uint8Array(6);
  try { crypto.getRandomValues(a); }
  catch { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); }
  return [...a].map((n) => alphabet[n % alphabet.length]).join('');
}

export default function OnlineRoom({ save, onBack, onSettings, onCoopComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('home');
  const [role, setRole] = useState<'host' | 'guest' | null>(null);
  const [mode, setMode] = useState<OnlineMode>('pvp');
  const [code, setCode] = useState('');
  const [joinText, setJoinText] = useState('');
  const [hostCo, setHostCo] = useState(save.unlockedCos[0] ?? 'rhea');
  const [guestCo, setGuestCo] = useState('rhea');
  const [missionIndex, setMissionIndex] = useState(Math.max(1, Math.min(save.progress, MISSIONS.length - 1)));
  const [connected, setConnected] = useState(false);
  const [guestReady, setGuestReady] = useState(false);
  const [localReady, setLocalReady] = useState(false);
  const [hostName, setHostName] = useState('Commander');
  const [guestName, setGuestName] = useState('Commander');
  const [status, setStatus] = useState('Choose a mode to create a private room or join a friend.');
  const [error, setError] = useState('');
  const [match, setMatch] = useState<MatchConfig | null>(null);
  const [round, setRound] = useState(0);
  const [localSlot, setLocalSlot] = useState<0 | 1>(0);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [undoSlot, setUndoSlot] = useState<0 | 1 | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [snapshot, setSnapshot] = useState<OnlineSnapshot | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const revRef = useRef(0);
  const activeRef = useRef<0 | 1>(0);
  const undoRef = useRef<0 | 1 | null>(null);
  const currentStateRef = useRef<GameState | null>(null);
  const configRef = useRef<MatchConfig | null>(null);
  const roleRef = useRef<'host' | 'guest' | null>(null);
  const modeRef = useRef<OnlineMode>('pvp');
  const stateRef = useRef({ hostCo, guestCo, missionIndex, hostName, guestName, connected, phase, mode });
  stateRef.current = { hostCo, guestCo, missionIndex, hostName, guestName, connected, phase, mode };
  roleRef.current = role;
  modeRef.current = mode;

  const send = (data: Wire) => {
    const c = connRef.current;
    if (c?.open) c.send(data);
  };

  const cleanSession = (announce = true) => {
    if (announce) send({ type: 'leave' });
    connRef.current?.close();
    connRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    roleRef.current = null;
    currentStateRef.current = null;
    configRef.current = null;
    revRef.current = 0;
    activeRef.current = 0;
    undoRef.current = null;
    setRole(null); setConnected(false); setGuestReady(false); setLocalReady(false); setMatch(null); setSnapshot(null);
    setActiveSlot(0); setUndoSlot(null); setWaiting(false); setPhase('home');
    setError('');
  };

  const sendLobby = () => {
    if (roleRef.current !== 'host' || !connRef.current?.open) return;
    const s = stateRef.current;
    send({ type: 'lobby', mode: modeRef.current, missionIndex: s.missionIndex, hostCo: s.hostCo, hostName: s.hostName });
  };

  const makeInitial = (cfg: MatchConfig) => {
    const state = createGame(
      cfg.mission,
      cfg.hostCo,
      cfg.mode === 'pvp' ? cfg.guestCo : cfg.mission.enemyCo,
      { unitUps: {}, coRank: 0, skills: [] },
      cfg.mode === 'pvp' ? { weather: 'clear', fog: false, aiLevel: 0, dynamic: false } : undefined,
    );
    if (cfg.mode === 'pvp') state.funds[1] += income(state, 1);
    return state;
  };

  const startMatch = (cfg: MatchConfig, slot: 0 | 1, initial = makeInitial(cfg)) => {
    configRef.current = cfg;
    revRef.current = 1;
    activeRef.current = 0;
    undoRef.current = null;
    currentStateRef.current = clone(initial);
    setActiveSlot(0); setUndoSlot(null); setWaiting(false);
    setSnapshot({ revision: 1, activeSlot: 0, actorSlot: 0, undoSlot: null, state: clone(initial) });
    setLocalSlot(slot);
    setMatch(cfg);
    setRound((r) => r + 1);
    setPhase('game');
    setStatus(cfg.mode === 'coop' ? 'Co-op campaign · alternating field orders' : 'Private PvP · mirrored start, no upgrades');
  };

  const acceptHostMessage = (msg: Wire) => {
    if (roleRef.current !== 'host') return;
    if (msg.type === 'hello') {
      setGuestName(msg.name || 'Commander');
      setConnected(true);
      setGuestReady(false);
      sendLobby();
      setStatus('Opponent connected. Waiting for their officer selection.');
      return;
    }
    if (msg.type === 'ready') {
      setGuestCo(stateRef.current.mode === 'pvp' ? stateRef.current.hostCo : COS[msg.co] ? msg.co : 'rhea');
      setGuestName(msg.name || 'Commander');
      setGuestReady(true);
      setStatus('Both commanders ready. Launch when you are set.');
      sendLobby();
      return;
    }
    if (msg.type === 'leave') {
      setConnected(false); setGuestReady(false);
      setStatus('Opponent left the room. The room code is still active.');
      return;
    }
    if (msg.type === 'restart-request') {
      const cfg = configRef.current;
      if (cfg) {
        const initial = makeInitial(cfg);
        send({ type: 'start', ...cfg, initial });
        startMatch(cfg, 0, initial);
      }
      return;
    }
    if (msg.type !== 'action') return;
    const cfg = configRef.current;
    const cur = currentStateRef.current;
    if (!cfg || !cur || msg.revision !== revRef.current + 1 || !connRef.current?.open) {
      if (cur) send({ type: 'snapshot', revision: revRef.current, activeSlot: activeRef.current, actorSlot: 0, undoSlot: undoRef.current, state: clone(cur) });
      return;
    }
    const remoteTeam: Team = cfg.mode === 'pvp' ? 1 : 0;
    const undoIsLatest = msg.event !== 'undo' || undoRef.current === 1;
    const tokenOk = cfg.mode === 'pvp'
      ? cur.turn === 1 && msg.state.turn === (msg.event === 'turn-start' ? 0 : 1) && undoIsLatest
      : cur.turn === 0 && activeRef.current === 1 && (msg.event === 'action' || msg.event === 'undo') && msg.state.turn === 0 && undoIsLatest;
    const identityOk = msg.state.mission.id === cfg.mission.id
      && msg.state.cos[0] === cfg.hostCo
      && msg.state.cos[1] === (cfg.mode === 'pvp' ? cfg.guestCo : cfg.mission.enemyCo)
      && msg.state.w === cur.w && msg.state.h === cur.h;
    if (!tokenOk || !identityOk || (cfg.mode === 'pvp' && remoteTeam !== 1)) {
      send({ type: 'snapshot', revision: revRef.current, activeSlot: activeRef.current, actorSlot: 0, undoSlot: undoRef.current, state: clone(cur) });
      setError('A network order was rejected; the host board has been restored.');
      return;
    }
    const nextActive: 0 | 1 = cfg.mode === 'coop' ? (msg.event === 'undo' ? 1 : 0) : activeRef.current;
    const undoOwner = msg.event === 'action' || msg.event === 'undo' ? 1 : null;
    const canonical: OnlineSnapshot = { revision: msg.revision, activeSlot: nextActive, actorSlot: 1, undoSlot: undoOwner, state: clone(msg.state) };
    revRef.current = canonical.revision;
    activeRef.current = nextActive;
    currentStateRef.current = canonical.state;
    undoRef.current = undoOwner;
    setUndoSlot(undoOwner); setActiveSlot(nextActive); setSnapshot(canonical); setWaiting(false);
    send({ type: 'snapshot', ...canonical });
  };

  const onHostData = useRef(acceptHostMessage);
  onHostData.current = acceptHostMessage;

  const setupIncoming = (c: DataConnection) => {
    if (connRef.current && connRef.current.open) { c.close(); return; }
    connRef.current = c;
    c.on('open', () => {
      setConnected(true);
      setStatus('Opponent connected. Waiting for their officer selection.');
      sendLobby();
    });
    c.on('data', (raw) => onHostData.current(raw as Wire));
    c.on('close', () => { if (connRef.current === c) { setConnected(false); setGuestReady(false); setStatus('Opponent disconnected.'); } });
    c.on('error', (e) => { setError(`Connection error: ${e.message}`); });
  };

  const createRoom = () => {
    cleanSession(false);
    const c = roomCode();
    const peer = new Peer(peerId(c));
    peerRef.current = peer;
    roleRef.current = 'host';
    setRole('host'); setCode(c); setPhase('setup'); setStatus('Connecting to the room service…'); setError('');
    peer.on('open', () => setStatus('Room ready. Share the code and wait for a friend.'));
    peer.on('connection', setupIncoming);
    peer.on('error', (e) => setError(e.type === 'unavailable-id' ? 'That room code is already in use. Create a new room.' : `Room service error: ${e.message}`));
  };

  const joinRoom = () => {
    const c = cleanCode(joinText);
    if (c.length < 5) { setError('Enter the 6-character room code.'); return; }
    cleanSession(false);
    const peer = new Peer();
    peerRef.current = peer;
    roleRef.current = 'guest';
    setRole('guest'); setCode(c); setPhase('setup'); setStatus('Looking for your friend’s room…'); setError('');
    peer.on('open', () => {
      const conn = peer.connect(peerId(c), { reliable: true });
      connRef.current = conn;
      conn.on('open', () => {
        setConnected(true);
        setLocalReady(false);
        setStatus('Connected. Choose your commander, then mark ready.');
        conn.send({ type: 'hello', name: guestName } satisfies Wire);
      });
      conn.on('data', (raw) => {
        const msg = raw as Wire;
        if (msg.type === 'lobby') {
          if (msg.mode !== stateRef.current.mode || msg.missionIndex !== stateRef.current.missionIndex || msg.hostCo !== stateRef.current.hostCo) setLocalReady(false);
          setMode(msg.mode); setMissionIndex(msg.missionIndex); setHostCo(msg.hostCo); setGuestCo(msg.mode === 'pvp' ? msg.hostCo : guestCo); setHostName(msg.hostName);
          setStatus(msg.mode === 'coop' ? 'Choose an officer. You and the host share the campaign army.' : 'Choose an officer for the mirrored private match.');
        } else if (msg.type === 'start') {
          startMatch({ mode: msg.mode, mission: msg.mission, missionIndex: msg.missionIndex, hostCo: msg.hostCo, guestCo: msg.guestCo, hostName: msg.hostName, guestName: msg.guestName }, 1, msg.initial);
        } else if (msg.type === 'snapshot') {
          if (msg.revision < revRef.current) return;
          revRef.current = msg.revision;
          activeRef.current = msg.activeSlot;
          currentStateRef.current = msg.state;
          undoRef.current = msg.undoSlot;
          setUndoSlot(msg.undoSlot); setActiveSlot(msg.activeSlot); setSnapshot({ revision: msg.revision, activeSlot: msg.activeSlot, actorSlot: msg.actorSlot, undoSlot: msg.undoSlot, state: msg.state }); setWaiting(false);
        } else if (msg.type === 'leave') {
          setConnected(false); setStatus('Host ended the room.');
        }
      });
      conn.on('close', () => { setConnected(false); setStatus('Connection lost. Return to the room screen to reconnect.'); setWaiting(false); });
      conn.on('error', (e) => setError(`Connection error: ${e.message}`));
    });
    peer.on('error', (e) => setError(e.type === 'peer-unavailable' ? 'Room not found. Check the code and try again.' : `Connection error: ${e.message}`));
  };

  useEffect(() => {
    if (role !== 'guest' || !connected || !localReady || !connRef.current?.open) return;
    send({ type: 'ready', co: mode === 'pvp' ? hostCo : guestCo, name: guestName });
  }, [guestCo, guestName, hostCo, mode, connected, localReady, role]);

  useEffect(() => { sendLobby(); }, [mode, missionIndex, hostCo, hostName, connected]);

  useEffect(() => () => {
    connRef.current?.close();
    peerRef.current?.destroy();
  }, []);

  const begin = () => {
    if (role !== 'host' || !connected || !guestReady) return;
    const mission = mode === 'pvp' ? ONLINE_DUEL : MISSIONS[missionIndex];
    if (!mission) return;
    const selectedGuestCo = mode === 'pvp' ? hostCo : guestCo;
    const cfg: MatchConfig = { mode, mission, missionIndex: mode === 'pvp' ? -1 : missionIndex, hostCo, guestCo: selectedGuestCo, hostName, guestName };
    const initial = makeInitial(cfg);
    send({ type: 'start', ...cfg, initial });
    startMatch(cfg, 0, initial);
  };

  const publish = (state: GameState, event: 'action' | 'undo' | 'turn-start' | 'turn-end') => {
    if (!match || !connected || !connRef.current?.open) return;
    const revisionNext = revRef.current + 1;
    if (role === 'host') {
      let nextActive = activeRef.current;
      if (match.mode === 'coop' && event === 'action') nextActive = 1;
      if (match.mode === 'coop' && event === 'undo') nextActive = localSlot;
      if (match.mode === 'coop' && event === 'turn-end') nextActive = (1 - activeRef.current) as 0 | 1;
      const nextUndo: 0 | 1 | null = event === 'action' || event === 'undo' ? localSlot : null;
      const next: OnlineSnapshot = { revision: revisionNext, activeSlot: nextActive, actorSlot: localSlot, undoSlot: nextUndo, state: clone(state) };
      revRef.current = revisionNext; activeRef.current = nextActive; currentStateRef.current = next.state;
      undoRef.current = nextUndo;
      setUndoSlot(nextUndo); setActiveSlot(nextActive); setSnapshot(next);
      send({ type: 'snapshot', ...next });
    } else {
      if (waiting) return;
      if (match.mode === 'coop' && (event === 'action' ? activeRef.current !== 1 : event === 'undo' ? undoRef.current !== 1 : true)) return;
      if (match.mode === 'pvp' && state.turn !== 1 && event !== 'turn-start') return;
      setWaiting(true);
      send({ type: 'action', revision: revisionNext, event, state: clone(state) });
    }
  };

  const onlineControl: OnlineControl | null = match ? {
    mode: match.mode,
    localTeam: match.mode === 'pvp' && localSlot === 1 ? 1 : 0,
    slot: localSlot,
    isHost: role === 'host',
    connected,
    canAct: connected && (match.mode === 'pvp' ? !waiting : activeSlot === localSlot && !waiting && currentStateRef.current?.turn === 0),
    undoAllowed: connected && undoSlot === localSlot,
    opponentName: localSlot === 0 ? match.guestName : match.hostName,
    snapshot,
    publish,
  } : null;

  const backToLobby = () => {
    if (phase === 'game') {
      cleanSession();
      return;
    }
    cleanSession(false);
    onBack();
  };

  const missionChoices = MISSIONS.map((m, i) => ({ m, i })).filter(({ m, i }) => i > 0 && i <= Math.max(1, save.progress) && !m.tutorial);
  const selectCO = (id: string) => { setHostCo(id); if (mode === 'pvp') setGuestCo(id); setGuestReady(false); sfx.cursor(); };
  const selectGuestCO = (id: string) => { setGuestCo(id); setLocalReady(false); sfx.cursor(); };
  const selectMode = (next: OnlineMode) => { setMode(next); if (next === 'pvp') setGuestCo(hostCo); setGuestReady(false); setLocalReady(false); sfx.select(); };
  const selectMission = (next: number) => { setMissionIndex(next); setGuestReady(false); setLocalReady(false); };
  const gamePlayerCo = match ? match.hostCo : hostCo;
  const gameEnemyCo = match ? (match.mode === 'pvp' ? match.guestCo : match.mission.enemyCo) : 'rhea';

  return (
    <div className="absolute inset-0 bg-slate-950 text-white">
      {phase === 'game' && match && onlineControl ? (
        <>
          <GameView
            key={`${match.mode}-${role}-${match.mission.id}-${round}`}
            mission={match.mission}
            playerCo={gamePlayerCo}
            enemyCo={gameEnemyCo}
            save={save}
            opts={match.mode === 'coop' ? undefined : { weather: 'clear', fog: false, aiLevel: 0, dynamic: false }}
            isCampaign={match.mode === 'coop'}
            hasNext={false}
            onExit={backToLobby}
            onRestart={() => {
              if (role === 'host') {
                const initial = makeInitial(match);
                send({ type: 'start', ...match, initial });
                startMatch(match, localSlot, initial);
              } else {
                send({ type: 'restart-request' });
                setPhase('setup');
                setStatus('Restart request sent to the host…');
              }
            }}
            onNext={() => {}}
            onComplete={(won, score, gs) => {
              if (match.mode === 'coop') return onCoopComplete(match.mission, match.missionIndex, match.hostCo, won, score, gs);
              return -1;
            }}
            onSettings={onSettings}
            online={onlineControl}
          />
          <div className={`absolute z-[24] top-[63px] left-1/2 -translate-x-1/2 hud-panel px-3 py-1 text-[10px] sm:text-xs font-black border ${connected ? 'border-emerald-400 text-emerald-200' : 'border-rose-400 text-rose-200'}`}>
            {match.mode === 'pvp' ? `ONLINE DUEL · ${connected ? `VS ${onlineControl.opponentName}` : 'CONNECTION LOST'}` : `CO-OP CAMPAIGN · ${connected ? `${onlineControl.opponentName} · ${waiting ? 'SYNCING ORDERS' : onlineControl.canAct ? 'YOUR COMMAND' : 'PARTNER COMMAND'}` : 'CONNECTION LOST'}`}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col bg-grid">
          <div className="flex items-center gap-2 p-2 border-b-2 border-cyan-400/40 bg-slate-900/90">
            <button className="hud-btn w-11 h-10" onClick={backToLobby}>◀</button>
            <div className="font-black text-lg tracking-widest text-cyan-300 flex-1">ONLINE COMMAND</div>
            <div className="text-[10px] text-slate-400">PRIVATE · UNRANKED</div>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <div className="max-w-2xl mx-auto grid gap-3">
              <div className="text-center py-2">
                <div className="text-3xl sm:text-4xl font-black tracking-widest text-white">LINK UP</div>
                <div className="text-xs text-slate-400 mt-1">Turn-based private rooms · same starting funds · no progression upgrades</div>
              </div>
              {phase === 'home' ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <button className="hud-panel p-4 text-left border-cyan-400 hover:bg-slate-800" onClick={() => selectMode('pvp')}>
                      <div className={`font-black text-lg ${mode === 'pvp' ? 'text-cyan-200' : 'text-white'}`}>⚔ HEAD-TO-HEAD</div>
                      <div className="text-xs text-slate-400 mt-1">Private 1v1 on a mirrored map. Matching starting armies, income, funds and unit caps.</div>
                    </button>
                    <button className="hud-panel p-4 text-left border-emerald-400 hover:bg-slate-800" onClick={() => selectMode('coop')}>
                      <div className={`font-black text-lg ${mode === 'coop' ? 'text-emerald-200' : 'text-white'}`}>🤝 CO-OP CAMPAIGN</div>
                      <div className="text-xs text-slate-400 mt-1">Two commanders share a campaign army. Alternate orders; the host runs enemy turns.</div>
                    </button>
                  </div>
                  <div className="hud-panel p-3 grid gap-2">
                    <div className="text-xs text-slate-300">Both modes use private, unranked rooms. Online matches ignore saved unit upgrades, CO ranks and skills. Commanders keep their signature day-to-day advantages and powers.</div>
                    <button className="menu-btn bg-cyan-500 text-slate-950" onClick={createRoom}>CREATE ROOM</button>
                    <div className="flex gap-2">
                      <input value={joinText} onChange={(e) => setJoinText(cleanCode(e.target.value))} maxLength={8} placeholder="ROOM CODE" className="flex-1 min-w-0 h-11 rounded-lg bg-slate-950 border-2 border-slate-700 px-3 text-center font-black tracking-[0.25em] text-white placeholder:text-slate-600" />
                      <button className="hud-btn px-4" onClick={joinRoom}>JOIN</button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="hud-panel p-3 flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex-1 text-center sm:text-left">
                      <div className="text-[10px] text-slate-500 font-black tracking-widest">ROOM CODE</div>
                      <div className="text-3xl font-black tracking-[0.25em] text-cyan-200">{code}</div>
                      <div className="text-xs text-slate-400">{status}</div>
                    </div>
                    <button className="hud-btn px-4 h-11" onClick={() => { navigator.clipboard?.writeText(code); sfx.menu(); }}>COPY CODE</button>
                  </div>

                  {role === 'host' && (
                    <div className="hud-panel p-3">
                      <div className="text-xs font-black text-cyan-200 mb-2">MATCH TYPE</div>
                      <div className="flex gap-2">
                        <button className={`flex-1 menu-btn h-10 text-xs ${mode === 'pvp' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800'}`} onClick={() => selectMode('pvp')}>MIRROR DUEL</button>
                        <button className={`flex-1 menu-btn h-10 text-xs ${mode === 'coop' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800'}`} onClick={() => selectMode('coop')}>CO-OP STORY</button>
                      </div>
                      {mode === 'coop' && (
                        <div className="mt-3">
                          <div className="text-xs font-black text-slate-300 mb-1">CAMPAIGN OPERATION</div>
                          <select value={missionIndex} onChange={(e) => selectMission(Number(e.target.value))} className="h-11 w-full rounded-lg bg-slate-950 border-2 border-slate-700 px-3 text-sm font-bold text-white">
                            {missionChoices.map(({ m, i }) => <option key={m.id} value={i}>Mission {i} · {m.name}</option>)}
                          </select>
                          <div className="text-[10px] text-slate-500 mt-1">Both players share the host commander’s field bonuses. The partner commander is a co-op advisor.</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="hud-panel p-3">
                    <div className="text-xs font-black text-slate-300 mb-2">COMMANDERS</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-sky-300 font-bold mb-1">{role === 'host' ? 'YOU · HOST' : `${hostName} · HOST`}</div>
                        <div className="flex flex-wrap gap-1">{PLAYABLE_ORDER.filter((id) => role !== 'host' || save.unlockedCos.includes(id)).map((id) => (
                          <button key={id} disabled={role !== 'host'} onClick={() => selectCO(id)} className={`rounded-lg p-0.5 border-2 ${hostCo === id ? 'border-sky-300' : 'border-transparent opacity-50'}`}><Portrait id={id} size={42} /></button>
                        ))}</div>
                        <div className="text-[10px] text-slate-300 mt-1">{COS[hostCo].name}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-300 font-bold mb-1">{mode === 'pvp' ? 'MIRRORED · SAME CO FOR BOTH SIDES' : role === 'guest' ? 'YOU · CO-OP ADVISOR' : connected ? `${guestName} · CO-OP ADVISOR` : 'WAITING FOR GUEST'}</div>
                        {mode === 'pvp' ? (
                          <div className="flex items-center gap-2 p-1 rounded-lg border border-rose-400/50 bg-rose-500/10"><Portrait id={hostCo} size={42} /><div className="text-[10px] text-slate-200">{COS[hostCo].name}<br />Identical CO bonuses on both armies.</div></div>
                        ) : (
                          <div className="flex flex-wrap gap-1">{PLAYABLE_ORDER.filter((id) => role !== 'guest' || save.unlockedCos.includes(id)).map((id) => (
                            <button key={id} disabled={role !== 'guest'} onClick={() => selectGuestCO(id)} className={`rounded-lg p-0.5 border-2 ${guestCo === id ? 'border-rose-300' : 'border-transparent opacity-50'}`}><Portrait id={id} size={42} /></button>
                          ))}</div>
                        )}
                        <div className="text-[10px] text-slate-300 mt-1">{mode === 'pvp' ? 'Commander is mirrored for symmetrical CO powers.' : connected ? COS[guestCo].name : 'Room is private until a friend joins.'}</div>
                      </div>
                    </div>
                  </div>

                  {mode === 'pvp' && <div className="text-[11px] text-slate-400 text-center">Fair start: mirrored forces, identical funds, equivalent income, equal unit caps, and the same CO on both sides. Saved unit upgrades, CO ranks, and skills are disabled.</div>}
                  {error && <div className="hud-panel border-rose-500 p-2 text-xs text-rose-200">{error}</div>}
                  <div className="grid sm:grid-cols-2 gap-2">
                    {role === 'host' && <button disabled={!connected || !guestReady} className={`menu-btn ${connected && guestReady ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-500'}`} onClick={begin}>START MATCH ▶</button>}
                    {role === 'guest' && <button disabled={!connected} className={`menu-btn ${localReady ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-400 text-slate-950'}`} onClick={() => { setLocalReady(true); sfx.select(); }}>{localReady ? 'READY · WAITING FOR HOST' : 'READY TO DEPLOY ▶'}</button>}
                    <button className="menu-btn bg-slate-700" onClick={() => cleanSession()}>LEAVE ROOM</button>
                  </div>
                </>
              )}
              {error && phase === 'home' && <div className="hud-panel border-rose-500 p-2 text-xs text-rose-200">{error}</div>}
              <div className="text-center text-[10px] text-slate-600">Peer-to-peer room connection · HTTPS hosting required · No public matchmaking</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}