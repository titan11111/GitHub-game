let audioCtx = null;
let bgmAudio = null;
let bgmUnlocked = false;

export function initAudio() {
  document.addEventListener('pointerdown', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });
}

function unlock() {
  if (bgmUnlocked) return;
  bgmUnlocked = true;
  getCtx();
}

export function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

const BGM_SCENES = {
  field:  null,
  town:   null,
  battle: null,
  boss:   null,
};

export function playBgm(scene) {
  stopBgm();
  const src = BGM_SCENES[scene];
  if (!src) return;
  bgmAudio = new Audio(src);
  bgmAudio.loop = true;
  bgmAudio.volume = 0.6;
  bgmAudio.play().catch(() => {});
}

export function stopBgm() {
  if (bgmAudio) { bgmAudio.pause(); bgmAudio = null; }
}

document.addEventListener('visibilitychange', () => {
  if (!bgmAudio) return;
  if (document.hidden) bgmAudio.pause();
  else bgmAudio.play().catch(() => {});
});

export function sfxClick(strong = false) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain); gain.connect(ac.destination);
  osc.frequency.setValueAtTime(strong ? 1320 : 1046, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(strong ? 1046 : 816, ac.currentTime + 0.065);
  gain.gain.setValueAtTime(0.3, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.065);
  osc.start(); osc.stop(ac.currentTime + 0.065);
}

export function sfxLevelUp() {
  const ac = getCtx();
  const notes = [261, 329, 392, 523, 659, 1046];
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    const t = ac.currentTime + i * 0.1;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.start(t); osc.stop(t + 0.12);
  });
}

export function sfxGameOver() {
  const ac = getCtx();
  const notes = [523, 392, 330, 262];
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    const t = ac.currentTime + i * 0.18;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t); osc.stop(t + 0.2);
  });
}
