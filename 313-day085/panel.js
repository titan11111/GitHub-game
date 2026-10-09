// 313 操作盤層：入力（押しっぱなし／押した瞬間）・ミュート・保存・音声解錠・画面フィット
import { initFcIosController, installFcIosTouchGuard } from './fc-ios-controller.js';

const KEY = (k) => `tg.313.${k}`;
export const store = {
  get(k, d) { try { const v = localStorage.getItem(KEY(k)); return v === null ? d : v; } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem(KEY(k), String(v)); } catch (_) {} },
};

// 論理ボタン → KeyboardEvent.code
const MAP = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  a: ['KeyZ', 'Space', 'KeyJ'], b: ['KeyX', 'KeyK'],
  sel: ['KeyC', 'KeyL'], start: ['Enter', 'KeyP', 'Escape'], mute: ['KeyM'],
};

export function createPanel({ canvas, logicalW, logicalH, onAutoPause }) {
  installFcIosTouchGuard();
  const { K } = initFcIosController({
    buttons: { 'fc-btn-select': ['KeyC'], 'fc-btn-start': ['Enter'] },
  });
  // ゲーム側のキーでページがスクロールしないように
  document.addEventListener('keydown', (e) => {
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  }, { passive: false });

  const prev = {};
  const now = {};
  const held = (n) => MAP[n].some((c) => K[c]);
  function poll() {
    for (const n in MAP) { prev[n] = now[n]; now[n] = held(n); }
  }
  const panel = {
    poll,
    held: (n) => !!now[n],
    hit: (n) => !!now[n] && !prev[n],
    muted: store.get('mute', '0') === '1',
    setMute(m) {
      panel.muted = m;
      store.set('mute', m ? '1' : '0');
      muteBtn.textContent = m ? '🔇' : '🔊';
      muteBtn.setAttribute('aria-pressed', m ? 'true' : 'false');
      muteBtn.setAttribute('aria-label', m ? '音を出す' : '音を消す');
      if (audio.master) audio.master.gain.setTargetAtTime(m ? 0 : 0.8, audio.ac.currentTime, 0.02);
    },
  };

  // ── ミュートボタン ──
  const muteBtn = document.getElementById('mute-btn');
  muteBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    unlock();
    panel.setMute(!panel.muted);
  });

  // ── 音声（iOS解錠の定型） ──
  const audio = { ac: null, master: null };
  function audioInit() {
    if (audio.ac) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audio.ac = new AC();
      audio.master = audio.ac.createGain();
      audio.master.gain.value = panel.muted ? 0 : 0.8;
      audio.master.connect(audio.ac.destination);
    } catch (_) { audio.ac = null; }
  }
  function unlock() {
    audioInit();
    if (audio.ac && audio.ac.state === 'suspended') audio.ac.resume();
  }
  ['pointerdown', 'keydown', 'touchend'].forEach((ev) =>
    document.addEventListener(ev, unlock, { capture: true, passive: true }));
  panel.audio = audio;
  panel.setMute(panel.muted);

  // ── 画面が隠れたら自動ポーズ ──
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && onAutoPause) onAutoPause();
  });

  // ── Canvasを上段にフィット（縦横同倍率・DPR最大2） ──
  const ctx = canvas.getContext('2d');
  const wrap = document.getElementById('screen-wrap');
  function fit() {
    const r = wrap.getBoundingClientRect();
    const s = Math.min(r.width / logicalW, r.height / logicalH);
    canvas.style.width = `${Math.floor(logicalW * s)}px`;
    canvas.style.height = `${Math.floor(logicalH * s)}px`;
    const rs = Math.min(window.devicePixelRatio || 1, 2) * Math.max(1, s);
    const q = Math.min(rs, 3);
    canvas.width = Math.round(logicalW * q);
    canvas.height = Math.round(logicalH * q);
    panel.res = q;
  }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 120));
  panel.ctx = ctx;
  return panel;
}
