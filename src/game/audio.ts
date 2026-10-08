let ctx: AudioContext | null = null;
let enabled = true;
let noiseBuf: AudioBuffer | null = null;

export function setSfx(on: boolean) { enabled = on; }

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function noise(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.08, slide = 0, delay = 0) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

function burst(dur: number, vol: number, freq: number, delay = 0) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(freq, t);
  f.frequency.exponentialRampToValueAtTime(60, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t); src.stop(t + dur + 0.05);
}

const rawSfx = {
  select: () => tone(660, 0.07, 'square', 0.05, 220),
  cursor: () => tone(440, 0.03, 'square', 0.025),
  cancel: () => tone(330, 0.08, 'square', 0.05, -150),
  move: () => tone(180, 0.05, 'triangle', 0.05),
  menu: () => tone(880, 0.05, 'square', 0.04),
  shot: () => { burst(0.18, 0.25, 2400); tone(140, 0.12, 'sawtooth', 0.06, -80); },
  gun: () => { for (let i = 0; i < 4; i++) burst(0.05, 0.12, 4000, i * 0.07); },
  boom: () => { burst(0.6, 0.45, 900); tone(70, 0.5, 'sine', 0.2, -40); },
  hit: () => burst(0.12, 0.2, 1800),
  capture: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.05, 0, i * 0.08)),
  build: () => [392, 523].forEach((f, i) => tone(f, 0.1, 'square', 0.05, 0, i * 0.07)),
  power: () => { tone(200, 0.8, 'sawtooth', 0.08, 900); burst(0.8, 0.15, 3000, 0.1); },
  charge: () => [440, 554, 659, 880, 1109].forEach((f, i) => tone(f, 0.16, 'sine', 0.065, 0, i * 0.075)),
  victory: () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.18, 'square', 0.06, 0, i * 0.13)),
  defeat: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'triangle', 0.08, 0, i * 0.22)),
  turn: () => [330, 440].forEach((f, i) => tone(f, 0.1, 'triangle', 0.06, 0, i * 0.09)),
  heal: () => [600, 800].forEach((f, i) => tone(f, 0.1, 'sine', 0.06, 0, i * 0.06)),
};

// Every sound is wrapped so an audio failure (common on mobile) can never crash the game loop.
export const sfx = Object.fromEntries(
  Object.entries(rawSfx).map(([k, f]) => [k, () => { try { f(); } catch { /* ignore audio errors */ } }]),
) as typeof rawSfx;
