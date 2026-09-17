import { LS } from './config.js';

let AC = null;
let master = null;
let muted = false;
try {
  muted = localStorage.getItem(LS.muted) === '1';
} catch {
  muted = false;
}
let bgmNodes = [];
let bgmTimer = 0;

function readMuted() {
  try {
    return localStorage.getItem(LS.muted) === '1';
  } catch {
    return false;
  }
}

function writeMuted() {
  try {
    localStorage.setItem(LS.muted, muted ? '1' : '0');
  } catch {
    /* ignore quota / private mode */
  }
}

function applyMute() {
  if (master) master.gain.value = muted ? 0 : 0.9;
}

export function isMuted() {
  return muted;
}

export function setMuted(next) {
  muted = !!next;
  writeMuted();
  applyMute();
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

export function audioInit() {
  if (AC) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    AC = new Ctx();
    master = AC.createGain();
    master.connect(AC.destination);
    muted = readMuted();
    applyMute();
    const buf = AC.createBuffer(1, 1, 22050);
    const src = AC.createBufferSource();
    src.buffer = buf;
    src.connect(master);
    src.start(0);
  } catch {
    AC = null;
    master = null;
  }
}

export async function unlockAudio() {
  audioInit();
  if (AC && AC.state === 'suspended') {
    try {
      await AC.resume();
    } catch {
      /* iOS may reject; next gesture retries */
    }
  }
}

function tone(freq, dur, type, gain, atk, slide) {
  if (!AC || !master) return;
  const t = AC.currentTime;
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, gain, freq) {
  if (!AC || !master) return;
  const n = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, n, AC.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src = AC.createBufferSource();
  src.buffer = buf;
  const f = AC.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = AC.createGain();
  const t = AC.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t);
}

export function sfx(name) {
  if (!AC || muted) return;
  if (name === 'tap') tone(520, 0.05, 'square', 0.07, 0.005, 280);
  else if (name === 'plant') {
    noise(0.08, 0.12, 900);
    tone(180, 0.12, 'triangle', 0.1, 0.01, 90);
  } else if (name === 'water') {
    tone(640, 0.09, 'sine', 0.07, 0.01, 420);
    tone(880, 0.12, 'sine', 0.04, 0.02, 500);
  } else if (name === 'scare') {
    noise(0.22, 0.22, 1400);
    tone(220, 0.18, 'sawtooth', 0.08, 0.005, 90);
  } else if (name === 'eat') {
    noise(0.16, 0.16, 500);
    tone(90, 0.2, 'square', 0.08, 0.01, 50);
  } else if (name === 'bloom') {
    tone(392, 0.16, 'sine', 0.1, 0.01, 392);
    tone(523, 0.22, 'sine', 0.08, 0.04, 523);
    tone(659, 0.28, 'sine', 0.06, 0.08, 784);
  } else if (name === 'win') {
    tone(523, 0.2, 'triangle', 0.1, 0.01, 523);
    tone(659, 0.24, 'triangle', 0.09, 0.06, 659);
    tone(784, 0.4, 'triangle', 0.08, 0.12, 1046);
  } else if (name === 'lose') {
    tone(196, 0.35, 'sawtooth', 0.08, 0.02, 90);
    noise(0.3, 0.1, 300);
  }
}

export function startBgm() {
  if (!AC || !master || bgmNodes.length) return;
  const windBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
  const w = windBuf.getChannelData(0);
  for (let i = 0; i < w.length; i++) w[i] = (Math.random() * 2 - 1) * 0.22;
  const wind = AC.createBufferSource();
  wind.buffer = windBuf;
  wind.loop = true;
  const wf = AC.createBiquadFilter();
  wf.type = 'lowpass';
  wf.frequency.value = 380;
  const wg = AC.createGain();
  wg.gain.value = 0.045;
  wind.connect(wf);
  wf.connect(wg);
  wg.connect(master);
  wind.start();
  bgmNodes.push(wind);

  const notes = [196, 233, 262, 311, 349];
  let step = 0;
  const tick = () => {
    if (!AC || !bgmNodes.length) return;
    const n = notes[step % notes.length];
    tone(n, 0.55, 'sine', 0.035, 0.04, n * 0.92);
    if (step % 4 === 0) tone(n * 0.5, 0.7, 'triangle', 0.03, 0.05, n * 0.45);
    step += 1;
    bgmTimer = window.setTimeout(tick, 720);
  };
  tick();
}

export function stopBgm() {
  window.clearTimeout(bgmTimer);
  bgmTimer = 0;
  for (const n of bgmNodes) {
    try {
      n.stop();
    } catch {
      /* already stopped */
    }
  }
  bgmNodes = [];
}
