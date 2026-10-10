import { useCallback, useEffect, useState } from 'react';
import GameView, { type ScoreInfo } from './components/GameView';
import ErrorBoundary from './components/ErrorBoundary';
import { COSelect, Campaign, DialogueScreen, Help, HighScores, SaveManager, Skirmish, Title, type SkirmishCfg } from './components/Menus';
import CommandHQ from './components/Shop';
import OnlineRoom from './components/OnlineRoom';
import { MERIT_BONUS, MISSIONS, REWARDS } from './game/campaign';
import { PLAYABLE_ORDER, rankSlots } from './game/data';

/** Story missions accept any officer you've unlocked or hired (except the enemy CO you're fighting). */
const allowedFor = (m: MissionDef) => (m.tutorial ? ['rhea'] : PLAYABLE_ORDER.filter((c) => c !== m.enemyCo));
import { addHighScore, clearResume, loadResume, loadSave, writeResume, writeSave, type ResumeSave } from './game/save';
import { awardPieces } from './game/unlocks';
import { setSfx } from './game/audio';
import type { GameState, MissionDef, SaveData, Settings, Weather } from './game/types';

type ScreenId = 'title' | 'campaign' | 'coselect' | 'briefing' | 'game' | 'outro' | 'prep' | 'workshop' | 'scores' | 'skirmish' | 'help' | 'online' | 'saves';

interface GameCfg {
  mission: MissionDef;
  idx: number;
  playerCo: string;
  enemyCo: string;
  isCampaign: boolean;
  opts?: { weather?: Weather; fog?: boolean; aiLevel?: number; dynamic?: boolean };
  /** Present when continuing an auto-saved campaign battle. */
  resume?: GameState;
}

export default function App() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [resumeSave, setResumeSave] = useState<ResumeSave | null>(() => {
    const r = loadResume();
    // Drop saves for missions that no longer exist.
    if (r && !MISSIONS.some((m) => m.id === r.missionId)) { clearResume(); return null; }
    return r;
  });
  const [screen, setScreen] = useState<ScreenId>('title');
  const [idx, setIdx] = useState(0);
  const [cfg, setCfg] = useState<GameCfg | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [won, setWon] = useState(false);
  const [dismissRotate, setDismissRotate] = useState(false);

  useEffect(() => { setSfx(save.settings.sfx); }, [save.settings.sfx]);

  const persist = useCallback((s: SaveData) => { setSave(s); writeSave(s); }, []);

  const pickMission = (i: number) => {
    const m = MISSIONS[i];
    if (!m) { setScreen('campaign'); return; }
    setIdx(i);
    const avail = allowedFor(m).filter((c) => save.unlockedCos.includes(c));
    if (avail.length <= 1) {
      const next = { mission: m, idx: i, playerCo: avail[0] ?? 'rhea', enemyCo: m.enemyCo, isCampaign: true };
      if (m.tutorial) startGame(next);
      else { setCfg(next); setScreen('briefing'); }
    } else setScreen('coselect');
  };

  const startGame = (c: GameCfg) => {
    setCfg(c);
    setWon(false);
    setGameKey((k) => k + 1);
    setScreen('game');
  };

  const quick = () => {
    const co = save.unlockedCos.includes('dax') ? 'dax' : 'rhea';
    startGame({ mission: MISSIONS[1], idx: 1, playerCo: co, enemyCo: 'grimm', isCampaign: false, opts: { aiLevel: 1 } });
  };

  /** Auto-save a campaign battle at the start of each full turn. */
  const onAutosave = (gs: GameState) => {
    if (!cfg?.isCampaign || cfg.mission.tutorial) return;
    const { mission: _mission, ...state } = gs;
    void _mission;
    writeResume({ missionId: cfg.mission.id, idx: cfg.idx, playerCo: cfg.playerCo, enemyCo: cfg.enemyCo, opts: cfg.opts, day: gs.day, state });
    setResumeSave(loadResume());
  };

  const dropResume = () => { clearResume(); setResumeSave(null); };

  const loadSlot = (slot: import('./game/save').SaveSlot) => {
    persist(slot.progress);
    if (slot.battle) {
      const { v: _v, savedAt: _savedAt, ...battle } = slot.battle;
      void _v; void _savedAt;
      writeResume(battle);
      setResumeSave(loadResume());
    } else dropResume();
    setScreen('title');
  };

  /** Continue the auto-saved campaign battle exactly where it was left. */
  const continueResume = () => {
    const r = resumeSave;
    const m = r && MISSIONS.find((x) => x.id === r.missionId);
    if (!r || !m) { dropResume(); return; }
    startGame({ mission: m, idx: r.idx, playerCo: r.playerCo, enemyCo: r.enemyCo, isCampaign: true, opts: r.opts, resume: r.state as GameState });
  };

  const onComplete = (w: boolean, score: ScoreInfo, gs: GameState): number => {
    setWon(w);
    dropResume(); // the battle is over; its progress is saved below

    let s: SaveData = { ...save, merits: save.merits + score.merits };
    let storyCo: string | undefined;
    if (cfg?.isCampaign && w) {
      const auditJump = s.missionAuditUnlocked && cfg.idx > s.progress;
      const firstClear = !auditJump && cfg.idx >= s.progress;
      if (firstClear) s.merits += MERIT_BONUS;
      const rid = REWARDS[cfg.mission.id];
      if (!auditJump && rid && !s.ownedSkills.includes(rid)) {
        s.ownedSkills = [...s.ownedSkills, rid];
        // auto-equip on the officer who earned it if they have a free slot
        const co = cfg.playerCo;
        const cur = s.loadout[co] ?? [];
        if (cur.length < rankSlots(s.coRank[co] ?? 0)) s.loadout = { ...s.loadout, [co]: [...cur, rid] };
      }
      if (!auditJump) s.progress = Math.max(s.progress, cfg.idx + 1);
      const prev = s.best[cfg.mission.id];
      if (!prev || prev.score < score.total) s.best = { ...s.best, [cfg.mission.id]: { score: score.total, rank: score.rank } };
      // Story clears no longer hand out officers: they award CO Pieces (unlock them in Command HQ with Gold).
      if (firstClear) storyCo = cfg.mission.unlockCo;
      if (!auditJump && cfg.mission.tutorial) s.tutorialComplete = true;
    }
    s = awardPieces(s, { won: w, rank: score.rank, storyCo });
    let place = -1;
    if (score.total > 0) {
      const r = addHighScore(s, {
        name: 'CMDR', co: gs.cos[0], mission: (cfg?.isCampaign ? '' : '[Skirmish] ') + gs.mission.name,
        score: score.total, rank: score.rank, date: new Date().toLocaleDateString(),
      });
      s = r.save; place = r.place;
    }
    persist(s);
    return place;
  };

  const onCoopComplete = (mission: MissionDef, missionIndex: number, coId: string, w: boolean, score: ScoreInfo, gs: GameState): number => {
    let s: SaveData = { ...save, merits: save.merits + score.merits };
    let storyCo: string | undefined;
    if (w) {
      const firstClear = missionIndex >= s.progress;
      if (firstClear) s.merits += MERIT_BONUS;
      const reward = REWARDS[mission.id];
      if (reward && !s.ownedSkills.includes(reward)) {
        s.ownedSkills = [...s.ownedSkills, reward];
        const equipped = s.loadout[coId] ?? [];
        if (equipped.length < rankSlots(s.coRank[coId] ?? 0)) s.loadout = { ...s.loadout, [coId]: [...equipped, reward] };
      }
      s.progress = Math.max(s.progress, missionIndex + 1);
      const previous = s.best[mission.id];
      if (!previous || previous.score < score.total) s.best = { ...s.best, [mission.id]: { score: score.total, rank: score.rank } };
      if (firstClear) storyCo = mission.unlockCo;
    }
    s = awardPieces(s, { won: w, rank: score.rank, storyCo });
    const entry = addHighScore(s, {
      name: 'CO-OP', co: gs.cos[0], mission: `[CO-OP] ${mission.name}`,
      score: score.total, rank: score.rank, date: new Date().toLocaleDateString(),
    });
    persist(entry.save);
    return entry.place;
  };

  const onSettings = (st: Settings) => { persist({ ...save, settings: st }); setSfx(st.sfx); };

  const exitGame = () => {
    if (cfg?.isCampaign && won && cfg.mission.outro.length) setScreen('outro');
    else setScreen(cfg?.isCampaign ? 'campaign' : 'title');
  };

  const startSkirmish = (c: SkirmishCfg) => {
    const m = MISSIONS[c.mapIdx];
    startGame({
      mission: m, idx: c.mapIdx, playerCo: c.co, enemyCo: c.enemy, isCampaign: false,
      opts: {
        weather: c.weather === 'default' || c.weather === 'dynamic' ? undefined : c.weather,
        dynamic: c.weather === 'dynamic' ? true : c.weather === 'default' ? undefined : false,
        fog: c.fog, aiLevel: c.ai,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white font-game overflow-hidden">
      {!dismissRotate && (
        <div className="portrait-warning fixed inset-0 z-[9999] flex-col items-center justify-center gap-4 bg-slate-950/95 p-6 text-center">
          <div className="rotate-phone text-7xl">📱</div>
          <div className="text-2xl font-black tracking-widest text-amber-300">ROTATE YOUR DEVICE</div>
          <div className="max-w-xs text-sm text-slate-300">Iron Front is built for landscape. Turn your phone sideways for the full battlefield.</div>
          <button className="menu-btn bg-slate-700 text-sm" onClick={() => setDismissRotate(true)}>Continue in portrait</button>
        </div>
      )}
      {screen === 'title' && (
        <Title save={save} onQuick={quick} resume={resumeSave ? { mission: MISSIONS.find((m) => m.id === resumeSave.missionId)?.name ?? 'Campaign', day: resumeSave.day } : null} onContinue={continueResume}
          onAuditUnlock={() => persist({ ...save, missionAuditUnlocked: true })} onNav={(s) => {
          if (s === 'campaign-start') pickMission(0);
          else setScreen(s as ScreenId);
        }} />
      )}
      {screen === 'campaign' && <Campaign save={save} onBack={() => setScreen('title')} onPick={pickMission} onHQ={() => setScreen('workshop')}
        resume={resumeSave ? { mission: MISSIONS.find((m) => m.id === resumeSave.missionId)?.name ?? 'Campaign', day: resumeSave.day } : null} onContinue={continueResume} />}
      {screen === 'coselect' && MISSIONS[idx] && (
        <COSelect save={save} allowed={allowedFor(MISSIONS[idx])} enemyCo={MISSIONS[idx].enemyCo} title={MISSIONS[idx].name.toUpperCase()}
          onBack={() => setScreen('campaign')}
          onPick={(co) => { setCfg({ mission: MISSIONS[idx], idx, playerCo: co, enemyCo: MISSIONS[idx].enemyCo, isCampaign: true }); setScreen('briefing'); }} />
      )}
      {screen === 'briefing' && cfg && !cfg.mission.tutorial && (
        <DialogueScreen lines={cfg.mission.briefing} title={cfg.mission.name} onDone={() => startGame(cfg)} />
      )}
      {screen === 'outro' && cfg && (
        <DialogueScreen lines={cfg.mission.outro} title="Debriefing" onDone={() => {
          // Between missions: stop at Command HQ to upgrade COs/skills, unlock officers, then pick your CO.
          if (cfg.idx + 1 < MISSIONS.length && nextAfterOutro) { setIdx(cfg.idx + 1); setScreen('prep'); }
          else setScreen('campaign');
          nextAfterOutro = false;
        }} />
      )}
      {screen === 'prep' && MISSIONS[idx] && (
        <CommandHQ save={save} onSave={persist} onBack={() => setScreen('campaign')}
          next={{ label: `NEXT MISSION: ${MISSIONS[idx].name.toUpperCase()} ▶`, onGo: () => pickMission(idx) }} />
      )}
      {screen === 'game' && cfg && (
        <ErrorBoundary key={`eb-${gameKey}`} onRetry={() => { dropResume(); startGame({ ...cfg, resume: undefined }); }} onMenu={() => setScreen(cfg.isCampaign ? 'campaign' : 'title')}>
        <GameView
          key={gameKey}
          mission={cfg.mission}
          playerCo={cfg.playerCo}
          enemyCo={cfg.enemyCo}
          save={save}
          opts={cfg.opts}
          isCampaign={cfg.isCampaign}
          hasNext={cfg.isCampaign && cfg.idx + 1 < MISSIONS.length}
          onExit={exitGame}
          onRestart={() => { dropResume(); startGame({ ...cfg, resume: undefined }); }}
          resume={cfg.resume}
          onAutosave={onAutosave}
          onNext={() => { nextAfterOutro = true; setScreen('outro'); }}
          onComplete={onComplete}
          onSettings={onSettings}
        />
        </ErrorBoundary>
      )}
      {screen === 'workshop' && <CommandHQ save={save} onBack={() => setScreen('title')} onSave={persist} />}
      {screen === 'scores' && <HighScores save={save} onBack={() => setScreen('title')} />}
      {screen === 'skirmish' && <Skirmish save={save} onBack={() => setScreen('title')} onStart={startSkirmish} />}
      {screen === 'help' && <Help onBack={() => setScreen('title')} onTutorial={() => pickMission(0)} />}
      {screen === 'online' && <OnlineRoom save={save} onBack={() => setScreen('title')} onSettings={onSettings} onCoopComplete={onCoopComplete} />}
      {screen === 'saves' && <SaveManager save={save} battle={resumeSave} onBack={() => setScreen('title')} onLoad={loadSlot} />}
    </div>
  );
}

let nextAfterOutro = false;
