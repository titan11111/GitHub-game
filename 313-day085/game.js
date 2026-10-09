// 313 巨忍 影丸 — ベルトスクロールアクション本体
import { createPanel, store } from './panel.js';

const W = 360, H = 400;
const ZMIN = 288, ZMAX = 386;        // 足元の奥行き帯（画面Y）
const HORIZON = 262;                 // 道の奥の縁（民家などの接地線）
const canvas = document.getElementById('screen');
const P = createPanel({ canvas, logicalW: W, logicalH: H, onAutoPause: () => { if (mode === 'play') openPause(); } });
const c = P.ctx;

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const ds = (z) => 0.84 + ((z - ZMIN) / (ZMAX - ZMIN)) * 0.16;   // 奥行きの縮尺
const ease = (t) => 1 - (1 - t) * (1 - t);

// ───────────────────────── 音 ─────────────────────────
const SND = (() => {
  let noiseBuf = null;
  const A = () => P.audio.ac;
  function out() { return P.audio.master; }
  function tone(f, dur, type = 'square', vol = 0.15, f2 = 0, delay = 0) {
    const ac = A(); if (!ac) return;
    const t0 = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(out()); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol = 0.3, ff = 1200, type = 'lowpass', ff2 = 0, delay = 0, q = 1) {
    const ac = A(); if (!ac) return;
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = ac.currentTime + delay;
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(ff, t0);
    if (ff2) f.frequency.exponentialRampToValueAtTime(ff2, t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(out()); s.start(t0); s.stop(t0 + dur + 0.02);
  }
  const fx = {
    slash() { noise(0.2, 0.35, 3200, 'bandpass', 700, 0, 2); tone(260, 0.12, 'sawtooth', 0.06, 120); },
    heavy() { noise(0.3, 0.45, 2400, 'bandpass', 300, 0, 1.5); tone(90, 0.4, 'sine', 0.55, 35); },
    hit() { noise(0.09, 0.4, 1400); tone(150, 0.06, 'square', 0.12, 80); },
    shuriken() { tone(1100, 0.16, 'triangle', 0.09, 1900); noise(0.18, 0.12, 5000, 'highpass'); },
    stomp() { tone(75, 0.3, 'sine', 0.55, 32); noise(0.12, 0.25, 500); },
    hurt() { tone(320, 0.22, 'square', 0.16, 110); },
    pickup() { [660, 880, 1320].forEach((f, i) => tone(f, 0.12, 'square', 0.1, 0, i * 0.07)); },
    fire() { noise(1.3, 0.5, 500, 'lowpass', 2600); tone(110, 0.9, 'sawtooth', 0.12, 55); },
    thunder() { noise(0.5, 0.7, 6000, 'highpass', 900); noise(1.6, 0.6, 260, 'lowpass', 60, 0.15); },
    cloud() { [1320, 1760, 2640, 3520].forEach((f, i) => tone(f, 0.3, 'triangle', 0.08, 0, i * 0.06)); },
    crumble() { noise(0.45, 0.4, 500, 'lowpass', 90); },
    boom() { noise(1.0, 0.6, 1600, 'lowpass', 80); tone(60, 0.8, 'sine', 0.5, 25); },
    roar() { tone(150, 0.9, 'sawtooth', 0.14, 60); noise(0.9, 0.25, 900, 'bandpass', 300); },
    wind() { noise(1.4, 0.3, 700, 'bandpass', 2400, 0, 0.8); },
    orb() { tone(520, 0.25, 'sine', 0.08, 900); },
    jutsu() { [392, 587, 784].forEach((f, i) => tone(f, 0.22, 'square', 0.1, 0, i * 0.05)); },
    select() { tone(880, 0.05, 'square', 0.08); },
  };

  // BGM：都節（D Eb G A Bb）＋三角ベース＋太鼓（3声）
  const N = { D3: 146.8, A2: 110, Bb2: 116.5, G2: 98, D2: 73.4, Eb4: 311.1, D4: 293.7, G4: 392, A4: 440, Bb4: 466.2,
    D5: 587.3, Eb5: 622.3, G5: 784, A5: 880, C5: 523.3 };
  const _ = 0;
  const SONGS = {
    stage: { bpm: 138,
      mel: ['D5', _, 'A4', 'Bb4', 'A4', _, 'G4', _, 'Eb4', 'G4', 'A4', _, 'D4', _, _, _,
        'D5', _, 'Eb5', 'D5', 'A4', _, 'Bb4', 'A4', 'G4', _, 'A4', 'G4', 'D4', _, 'Eb4', _,
        'G4', _, 'A4', _, 'Bb4', 'A4', 'G4', _, 'A4', _, 'D5', _, 'Eb5', _, 'D5', _,
        'Bb4', 'A4', 'G4', _, 'Eb4', _, 'G4', 'A4', 'D4', _, _, _, _, _, _, _],
      bass: ['D2', 'D2', 'A2', 'A2', 'Bb2', 'Bb2', 'A2', 'A2', 'G2', 'G2', 'A2', 'A2', 'Bb2', 'A2', 'D2', 'D2'],
      drum: 'T..tT.t.T..tTttt' },
    boss: { bpm: 162,
      mel: ['D5', 'Eb5', 'D5', _, 'A4', 'Bb4', 'A4', _, 'G4', 'A4', 'Bb4', 'A4', 'G4', _, 'Eb4', _,
        'D5', 'Eb5', 'G5', _, 'Eb5', 'D5', 'Bb4', _, 'A4', 'Bb4', 'A4', 'G4', 'Eb4', _, 'D4', _],
      bass: ['D2', 'D3', 'D2', 'D3', 'Eb4', 'D3', 'A2', 'D3'],
      drum: 'TtTtT.TtTtTtTttt' },
  };
  let song = null, step = 0, nextT = 0, timer = null;
  function play(name) {
    const ac = A(); if (!ac) return;
    song = SONGS[name]; step = 0; nextT = ac.currentTime + 0.1;
    if (!timer) timer = setInterval(sched, 25);
  }
  function stop() { song = null; }
  function sched() {
    const ac = A(); if (!ac || !song) return;
    if (mode !== 'play') { nextT = ac.currentTime + 0.1; return; }
    const st = 60 / song.bpm / 2;   // 8分
    while (nextT < ac.currentTime + 0.15) {
      const d = nextT - ac.currentTime;
      const m = song.mel[step % song.mel.length];
      if (m) { tone(N[m], st * 1.6, 'square', 0.045, 0, d); tone(N[m] * 1.004, st * 1.6, 'triangle', 0.03, 0, d); }
      if (step % 2 === 0) { const b = song.bass[(step / 2 | 0) % song.bass.length]; tone(N[b], st * 1.8, 'triangle', 0.16, 0, d); }
      const dr = song.drum[step % song.drum.length];
      if (dr === 'T') { tone(120, 0.32, 'sine', 0.42, 45, d); noise(0.06, 0.12, 300, 'lowpass', 0, d); }
      else if (dr === 't') noise(0.05, 0.1, 3500, 'bandpass', 0, d, 3);
      nextT += st; step++;
    }
  }
  return { fx, play, stop };
})();
const sfx = (n) => { try { SND.fx[n](); } catch (_) {} };

// ───────────────────────── 状態 ─────────────────────────
let mode = 'title';          // title / play / pause / over / clear
let pauseFromPlay = false;
let T = 0;                    // 経過時間
let cam = 0, camLock = Infinity, camMin = 0;
let shake = 0, hitstop = 0, flash = 0, flashCol = '#fff', darken = 0;
let score = 0, best = Number(store.get('best', '0')) || 0, combo = 0, comboT = 0;
let waveIdx = 0, waveActive = false, spawnQ = [], spawnT = 0, goT = 0, checkpoint = 0;
let banner = null, help = false, menuSel = 0, overT = 0, clearT = 0;
let enemies = [], shots = [], eshots = [], parts = [], pops = [], items = [], props = [], fxs = [];
let boss = null;
let zoom = 1, zoomT = 1, VW = W;   // ボス戦はカメラを引く
let pl;

const STAGE_END = 3440;
const WAVES = [
  { at: 120, area: '一　村の入口', sub: '落ち足軽が群れている', spawn: [['ashi', 7]] },
  { at: 560, spawn: [['ashi', 6], ['golem', 1], ['ashi', 4]] },
  { at: 1120, area: '二　棚田', sub: '熟練の仙人が降りてきた', spawn: [['sennin', 1], ['ashi', 6], ['sennin', 1]] },
  { at: 1640, spawn: [['golem', 1], ['ashi', 5], ['golem', 1], ['sennin', 1]] },
  { at: 2200, area: '三　山門', sub: '総掛かり', spawn: [['ashi', 8], ['golem', 1], ['sennin', 2], ['ashi', 6]] },
  { at: 2720, spawn: [['golem', 2], ['sennin', 2], ['ashi', 8]] },
  { at: STAGE_END - Math.ceil(W / 0.78), area: '四　天狗の庭', sub: '', boss: true },
];
const JUTSU = {
  fire: { name: '火遁・大炎陣', ch: '火', col: '#ff6a20' },
  thunder: { name: '雷遁・百雷', ch: '雷', col: '#ffe04a' },
  cloud: { name: '筋斗雲の術', ch: '雲', col: '#ffd890' },
};
const HAIKU = ['古池や蛙飛びこむ水の音', '閑さや岩にしみ入る蝉の声', '夏草や兵どもが夢の跡', '五月雨をあつめて早し最上川'];

function newPlayer(x) {
  return { x, z: 340, face: 1, hp: 100, inv: 0, atk: null, chain: 0, chainT: 0, shCd: 0, throwT: 0,
    walk: 0, moving: false, cloud: 0, stock: [], kb: 0, trail: [], dead: false };
}

// ───────────────────────── 背景・小道具 ─────────────────────────
function buildProps() {
  props = [];
  let x = 40;
  while (x < STAGE_END + 200) {
    const area = x < 1100 ? 0 : x < 2150 ? 1 : x < STAGE_END - 380 ? 2 : 3;
    const r = Math.random();
    if (area === 3) {
      props.push({ k: 'cedar', x, hp: 99 }); x += rnd(90, 140); continue;
    }
    if (area === 2 && r < 0.18) { props.push({ k: 'gate', x, hp: 6 }); x += 200; continue; }
    if (r < 0.42) { props.push({ k: 'hut', x, hp: 3, v: Math.random() < 0.5 }); x += rnd(110, 160); }
    else if (r < 0.6) { props.push({ k: 'kaki', x, hp: 2 }); x += rnd(50, 80); }
    else if (r < 0.75) { props.push({ k: 'toro', x, hp: 1 }); x += rnd(40, 70); }
    else if (r < 0.88) { props.push({ k: 'jizo', x, hp: 1 }); x += rnd(40, 60); }
    else { props.push({ k: 'fence', x, hp: 1 }); x += rnd(60, 90); }
  }
}
function ridge(x, k, a, b) {
  return Math.sin(x * k) * a + Math.sin(x * k * 2.3 + 1.7) * a * 0.45 + Math.sin(x * k * 5.1 + 0.3) * a * 0.18 + b;
}
function skyColors() {
  const p = clamp(cam / (STAGE_END - W), 0, 1);
  if (mode === 'title') return ['#1d1030', '#7a2f47', '#f2894a'];
  if (p < 0.75) return ['#1f1236', lerpCol('#7c3049', '#5a1d3c', p / 0.75), lerpCol('#f39a4e', '#d8583a', p / 0.75)];
  return ['#120615', '#4a0f22', '#b02a2a'];
}
function lerpCol(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = lerp(pa >> 16, pb >> 16, t) | 0, g = lerp((pa >> 8) & 255, (pb >> 8) & 255, t) | 0, bl = lerp(pa & 255, pb & 255, t) | 0;
  return `rgb(${r},${g},${bl})`;
}
function drawBG() {
  const [c0, c1, c2] = skyColors();
  const g = c.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, c0); g.addColorStop(0.6, c1); g.addColorStop(1, c2);
  c.fillStyle = g; c.fillRect(0, -160, VW, HORIZON + 164);
  // 夕日
  const sunX = 250 - cam * 0.03;
  c.fillStyle = 'rgba(255,220,150,.25)'; c.beginPath(); c.arc(sunX, 170, 58, 0, 7); c.fill();
  c.fillStyle = '#ffd38a'; c.beginPath(); c.arc(sunX, 170, 38, 0, 7); c.fill();
  // 雲の筋
  c.fillStyle = 'rgba(255,200,180,.18)';
  for (let i = 0; i < 5; i++) {
    const x = ((i * 137 - cam * 0.06) % 520 + 520) % 520 - 80;
    c.fillRect(x | 0, 60 + i * 22, 120 + (i % 3) * 40, 4);
  }
  // 遠山・中山・近山（3層パララックス）
  const layers = [
    { k: 0.12, f: 0.011, a: 34, b: 150, col: '#5b3a6b', mist: 'rgba(240,150,140,.25)' },
    { k: 0.28, f: 0.017, a: 26, b: 186, col: '#3a2447', mist: 'rgba(200,110,120,.22)' },
    { k: 0.5, f: 0.024, a: 18, b: 222, col: '#26182d', mist: null },
  ];
  for (const L of layers) {
    c.fillStyle = L.col; c.beginPath(); c.moveTo(0, HORIZON + 4);
    for (let x = 0; x <= W; x += 6) c.lineTo(x, ridge(x + cam * L.k, L.f, L.a, L.b));
    c.lineTo(VW, HORIZON + 4); c.fill();
    if (L.mist) { c.fillStyle = L.mist; c.fillRect(0, L.b + 10, VW, 18); }
  }
  // 杉の穂先（近山）
  c.fillStyle = '#1b1020';
  for (let i = 0; i < 16; i++) {
    const wx = i * 31 - ((cam * 0.5) % 31);
    const y = ridge(wx + cam * 0.5, 0.024, 18, 222);
    c.beginPath(); c.moveTo(wx, y - 16); c.lineTo(wx - 6, y + 2); c.lineTo(wx + 6, y + 2); c.fill();
  }
  // 棚田（区間二で見える）
  const tx = 1000 - cam * 0.7;
  if (tx < VW && tx > -1300) {
    for (let i = 0; i < 5; i++) {
      c.fillStyle = i % 2 ? '#6c6a2e' : '#8a7a34';
      c.fillRect(tx + i * 30, 232 + i * 6, 1100 - i * 60, 6);
      c.fillStyle = 'rgba(255,200,120,.35)'; c.fillRect(tx + i * 30, 232 + i * 6, 1100 - i * 60, 1);
    }
  }
  // 道
  const gg = c.createLinearGradient(0, HORIZON, 0, H);
  gg.addColorStop(0, '#4b3326'); gg.addColorStop(1, '#2a1a14');
  c.fillStyle = gg; c.fillRect(0, HORIZON, VW, H - HORIZON);
  c.fillStyle = '#3c4a22'; c.fillRect(0, HORIZON - 2, VW, 8);
  c.fillStyle = '#5c6a2c';
  for (let i = 0; i < 40; i++) {
    const x = ((i * 23 - cam) % (VW + 40) + VW + 40) % (VW + 40) - 20;
    c.fillRect(x | 0, HORIZON - 5 - (i % 3) * 2, 3, 6);
  }
  // 轍と石（地面のタイル）
  for (let r = 0; r < 4; r++) {
    const y = HORIZON + 22 + r * 30, sp = 70 - r * 8;
    c.fillStyle = `rgba(0,0,0,${0.12 + r * 0.04})`;
    for (let i = -1; i < VW / sp + 2; i++) {
      const x = i * sp - ((cam * (0.9 + r * 0.05)) % sp);
      c.fillRect(x | 0, y | 0, 18 + r * 4, 3);
    }
    c.fillStyle = 'rgba(255,200,150,.08)';
    for (let i = -1; i < VW / (sp * 1.7) + 2; i++) {
      const x = i * sp * 1.7 + 30 - ((cam * (0.9 + r * 0.05)) % (sp * 1.7));
      c.fillRect(x | 0, (y + 12) | 0, 6 + r, 2);
    }
  }
}

function drawProp(p) {
  const x = (p.x - cam) | 0, y = HORIZON + 2;
  if (x < -200 || x > VW + 200) return;
  c.save(); c.translate(x, y);
  c.lineWidth = 2; c.strokeStyle = '#0b0608';
  if (p.hp <= 0) {   // 瓦礫
    c.fillStyle = '#3b2a1e';
    c.beginPath(); c.moveTo(-34, 0); c.lineTo(-20, -10); c.lineTo(-4, -6); c.lineTo(10, -14); c.lineTo(30, 0); c.fill(); c.stroke();
    c.restore(); return;
  }
  switch (p.k) {
    case 'hut': {   // 茅葺き（主人公の膝丈）
      const w = p.v ? 70 : 56;
      c.fillStyle = '#6b4a2e'; c.fillRect(-w / 2, -30, w, 30); c.strokeRect(-w / 2, -30, w, 30);
      c.fillStyle = '#2a1a10'; c.fillRect(-8, -20, 16, 20);
      c.fillStyle = '#ffcf6a'; c.fillRect(w / 2 - 16, -22, 9, 7);
      c.fillStyle = '#8c7240';
      c.beginPath(); c.moveTo(-w / 2 - 10, -26); c.lineTo(-w / 4, -64); c.lineTo(w / 4, -64); c.lineTo(w / 2 + 10, -26); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#b39656'; c.fillRect(-w / 4, -64, w / 2, 4);
      c.strokeStyle = 'rgba(0,0,0,.25)';
      for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-w / 2 + i * w / 4, -28); c.lineTo(-w / 4 + i * w / 8, -60); c.stroke(); }
      if (Math.sin(T * 2 + p.x) > 0) { c.fillStyle = 'rgba(200,190,200,.18)'; c.beginPath(); c.arc(w / 4, -76 - (T * 10 % 20), 6, 0, 7); c.fill(); }
      break;
    }
    case 'kaki': {
      c.fillStyle = '#3a2416'; c.fillRect(-3, -44, 6, 44);
      c.fillStyle = '#2f3a1c'; c.beginPath(); c.arc(0, -52, 22, 0, 7); c.fill(); c.stroke();
      c.fillStyle = '#ff7a1a';
      for (let i = 0; i < 7; i++) c.fillRect((Math.cos(i * 2.1) * 14) | 0, (-52 + Math.sin(i * 2.7) * 12) | 0, 4, 4);
      break;
    }
    case 'toro':
      c.fillStyle = '#7d7a72';
      c.fillRect(-4, -20, 8, 20); c.fillRect(-9, -30, 18, 10); c.strokeRect(-9, -30, 18, 10);
      c.fillStyle = '#ffd36a'; c.fillRect(-4, -28, 8, 6);
      c.fillStyle = '#7d7a72'; c.beginPath(); c.moveTo(-12, -30); c.lineTo(0, -38); c.lineTo(12, -30); c.fill(); c.stroke();
      break;
    case 'jizo':
      c.fillStyle = '#8b8a84'; c.fillRect(-6, -16, 12, 16); c.beginPath(); c.arc(0, -19, 6, 0, 7); c.fill();
      c.fillStyle = '#c8202a'; c.fillRect(-7, -14, 14, 5);
      break;
    case 'fence':
      c.fillStyle = '#5a4128';
      for (let i = -3; i <= 3; i++) c.fillRect(i * 10 - 1, -16, 3, 16);
      c.fillRect(-34, -12, 68, 3); c.fillRect(-34, -6, 68, 3);
      break;
    case 'gate':   // 山門（腰丈）
      c.fillStyle = '#7a1e1a'; c.fillRect(-46, -90, 10, 90); c.fillRect(36, -90, 10, 90);
      c.strokeRect(-46, -90, 10, 90); c.strokeRect(36, -90, 10, 90);
      c.fillStyle = '#3a2a24';
      c.beginPath(); c.moveTo(-70, -88); c.lineTo(-56, -112); c.lineTo(56, -112); c.lineTo(70, -88); c.fill(); c.stroke();
      c.fillStyle = '#7a1e1a'; c.fillRect(-52, -88, 104, 10);
      break;
    case 'cedar':  // 天狗の庭の大杉（ここだけ主人公より高い）
      c.fillStyle = '#2a1a12'; c.fillRect(-7, -260, 14, 260);
      c.fillStyle = '#16211a';
      for (let i = 0; i < 6; i++) {
        const y = -250 + i * 34, w = 22 + i * 9;
        c.beginPath(); c.moveTo(0, y - 30); c.lineTo(-w, y + 12); c.lineTo(w, y + 12); c.fill();
      }
      break;
  }
  c.restore();
}

// ───────────────────────── 描画部品 ─────────────────────────
const OUT = '#07060c';
function seg(x, y, a, len, w0, w1, fill, rim) {
  c.save(); c.translate(x, y); c.rotate(-a);
  c.beginPath();
  c.arc(0, 0, w0 / 2, Math.PI, 0); c.lineTo(w1 / 2, len);
  c.arc(0, len, w1 / 2, 0, Math.PI); c.closePath();
  c.fillStyle = fill; c.fill(); c.stroke();
  if (rim) { c.strokeStyle = rim; c.lineWidth = 2; c.beginPath(); c.moveTo(w0 / 2 - 3, 2); c.lineTo(w1 / 2 - 3, len - 2); c.stroke(); }
  c.restore();
  return [x + Math.sin(a) * len, y + Math.cos(a) * len];
}
function ik(sx, sy, tx, ty, l1, l2, bend) {
  const dx = tx - sx, dy = ty - sy;
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
  const a0 = Math.atan2(dx, dy);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d || 1), -1, 1));
  const ua = a0 + bend * A;
  const ex = sx + Math.sin(ua) * l1, ey = sy + Math.cos(ua) * l1;
  return [ua, Math.atan2(tx - ex, ty - ey)];
}
function shadow(x, y, w) {
  c.fillStyle = 'rgba(0,0,0,.35)';
  c.beginPath(); c.ellipse(x, y, w, w * 0.22, 0, 0, 7); c.fill();
}

// 巨大忍者・影丸
const SUIT = '#1c2238', SUIT_RIM = '#5a6fa8', STEEL = '#7d8798', SCARF = '#d0202c';
function bladeAngle() {
  const a = pl.atk;
  const REST = 2.25;
  if (!a) return REST;
  const f = a.t / a.dur;
  const [s, e] = a.stage === 1 ? [3.7, 0.55] : a.stage === 2 ? [0.35, 3.35] : [4.0, 0.3];
  const w0 = 0.28, w1 = a.stage === 3 ? 0.48 : 0.42;
  if (f < w0) return lerp(REST, s, ease(f / w0));
  if (f < w1) return lerp(s, e, ease((f - w0) / (w1 - w0)));
  if (f < 0.8) return e;
  return lerp(e, REST, (f - 0.8) / 0.2);
}
function drawNinja(sx, sy, s, face, lift) {
  const moving = pl.moving && !pl.atk;
  const ph = pl.walk;
  const a = pl.atk;
  let bob = moving ? Math.abs(Math.sin(ph)) * -5 : Math.sin(T * 2.2) * 1.5;
  let crouch = 0;
  if (a && a.stage === 3) { const f = a.t / a.dur; crouch = f < 0.28 ? f / 0.28 * -18 : f < 0.7 ? 16 : lerp(16, 0, (f - 0.7) / 0.3); }
  if (pl.dead) crouch = 30;
  let tF, sF, tB, sB;
  if (moving) {
    tF = Math.sin(ph) * 0.55; sF = tF - Math.max(0, Math.sin(ph + 1.3)) * 0.8;
    tB = -Math.sin(ph) * 0.55; sB = tB - Math.max(0, -Math.sin(ph + 1.3)) * 0.8;
  } else {
    const wide = 0.32 + crouch * 0.012;
    tF = wide; sF = wide * 0.15 - crouch * 0.01; tB = -wide; sB = -wide * 0.4;
  }
  if (lift) { tF = 0.5; sF = -0.4; tB = -0.2; sB = -0.9; }
  const legH = (t, sh) => 66 * Math.cos(t) + 64 * Math.cos(sh);
  const hipY = -Math.max(legH(tF, sF), legH(tB, sB)) + bob + Math.max(0, crouch) * 0.6;
  const lean = a ? (a.stage === 3 ? 0.25 : 0.12) : moving ? 0.08 : 0.02;

  c.save(); c.translate(sx, sy - lift); c.scale(s * face, s);
  c.lineJoin = 'round'; c.lineWidth = 3; c.strokeStyle = OUT;

  const shX = Math.sin(lean) * 92, shY = hipY - Math.cos(lean) * 92;
  const neckX = shX + 4, neckY = shY - 6;
  // 襟巻き（後ろへたなびく）
  const spd = pl.moving ? 1.6 : 0.6;
  for (let k = 0; k < 2; k++) {
    c.beginPath(); c.moveTo(neckX - 6, neckY + 4 + k * 6);
    for (let i = 1; i <= 9; i++) {
      c.lineTo(neckX - 6 - i * 15 * spd * (0.8 + k * 0.15), neckY + 6 + k * 8 + i * (3 - spd) + Math.sin(T * 9 + i * 0.8 + k) * i * 1.3);
    }
    c.lineWidth = 12 - k * 3; c.strokeStyle = OUT; c.stroke();
    c.lineWidth = 7 - k * 2; c.strokeStyle = k ? '#9a1018' : SCARF; c.stroke();
  }
  c.lineWidth = 3; c.strokeStyle = OUT;

  // 奥の脚
  let [kx, ky] = seg(-12, hipY, tB, 66, 30, 24, '#151a2c');
  let [fx2, fy2] = seg(kx, ky, sB, 64, 24, 18, '#151a2c');
  c.fillStyle = '#2b2b30'; c.fillRect(fx2 - 10, fy2 - 6, 30, 10); c.strokeRect(fx2 - 10, fy2 - 6, 30, 10);

  // 刀の角度と手の位置
  const B = bladeAngle();
  const H = B * 0.62 + 0.25;
  const hx = shX + Math.sin(H) * 80, hy = shY + 8 + Math.cos(H) * 80;
  // 奥の腕（両手持ち or 投擲）
  let tx = hx - Math.sin(B) * 18, ty = hy - Math.cos(B) * 18;
  if (pl.throwT > 0) {
    const f = 1 - pl.throwT / 0.26;
    tx = lerp(shX - 50, shX + 115, ease(f)); ty = lerp(shY - 60, shY - 10, f);
  }
  const [ua2, fa2] = ik(shX - 12, shY + 8, tx, ty, 52, 50, -1);
  let [ex2, ey2] = seg(shX - 12, shY + 8, ua2, 52, 24, 20, '#151a2c');
  seg(ex2, ey2, fa2, 50, 20, 18, '#151a2c');

  // 脚（手前）
  [kx, ky] = seg(12, hipY, tF, 66, 32, 26, SUIT, SUIT_RIM);
  c.fillStyle = STEEL; c.save(); c.translate(kx, ky); c.rotate(-sF); c.fillRect(-12, 4, 24, 30); c.strokeRect(-12, 4, 24, 30); c.restore();
  [fx2, fy2] = seg(kx, ky, sF, 64, 26, 20, SUIT, SUIT_RIM);
  c.fillStyle = '#3a3a42'; c.fillRect(fx2 - 10, fy2 - 6, 32, 11); c.strokeRect(fx2 - 10, fy2 - 6, 32, 11);

  // 胴
  seg(shX, shY, -lean, 92, 80, 54, SUIT, SUIT_RIM);
  c.save(); c.translate(shX, shY); c.rotate(lean);
  // 鎖帷子の網目
  c.strokeStyle = 'rgba(120,140,190,.25)'; c.lineWidth = 1;
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-26 + i * 9, 10); c.lineTo(-30 + i * 9, 60); c.stroke(); }
  c.strokeStyle = OUT; c.lineWidth = 3;
  // 襟の合わせ
  c.fillStyle = '#2d3554'; c.beginPath(); c.moveTo(-22, 0); c.lineTo(4, 54); c.lineTo(14, 54); c.lineTo(-8, 0); c.fill();
  // 帯
  c.fillStyle = '#7a1420'; c.fillRect(-28, 70, 56, 13); c.strokeRect(-28, 70, 56, 13);
  c.fillStyle = '#d8b04a'; c.fillRect(-4, 72, 8, 9);
  // 草摺
  c.fillStyle = '#39415a';
  for (let i = -1; i <= 1; i++) { c.fillRect(i * 19 - 9, 84, 18, 22); c.strokeRect(i * 19 - 9, 84, 18, 22); }
  c.restore();
  // 肩当て
  c.fillStyle = STEEL; c.beginPath(); c.ellipse(shX + 14, shY + 10, 22, 14, -0.3, 0, 7); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(shX + 4, shY + 2, 16, 3);

  // 頭
  const hdX = shX + 8 + Math.sin(lean) * 10, hdY = shY - 30;
  c.fillStyle = SUIT; c.beginPath(); c.arc(hdX, hdY, 26, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#0d1020'; c.beginPath(); c.moveTo(hdX - 20, hdY + 10); c.lineTo(hdX - 42, hdY + 30); c.lineTo(hdX - 14, hdY + 22); c.fill();
  // 目元
  c.fillStyle = '#d9b48c'; c.fillRect(hdX - 4, hdY - 4, 28, 11); c.strokeRect(hdX - 4, hdY - 4, 28, 11);
  const glow = 0.6 + Math.sin(T * 6) * 0.2;
  c.fillStyle = `rgba(255,245,170,${glow})`; c.fillRect(hdX + 8, hdY - 1, 12, 4);
  c.fillStyle = '#000'; c.fillRect(hdX + 15, hdY - 1, 4, 4);
  // 鉢金
  c.fillStyle = STEEL; c.fillRect(hdX - 12, hdY - 20, 34, 10); c.strokeRect(hdX - 12, hdY - 20, 34, 10);
  c.fillStyle = '#e0e6f0'; c.fillRect(hdX - 8, hdY - 18, 26, 2);
  c.fillStyle = '#1a1a1a'; c.font = 'bold 8px serif'; c.fillText('忍', hdX + 1, hdY - 11);

  // 手前の腕
  const [ua, fa] = ik(shX + 12, shY + 10, hx, hy, 52, 50, -1);
  let [ex, ey] = seg(shX + 12, shY + 10, ua, 52, 28, 24, SUIT, SUIT_RIM);
  c.fillStyle = STEEL; c.save(); c.translate(ex, ey); c.rotate(-fa); c.fillRect(-11, 6, 22, 32); c.strokeRect(-11, 6, 22, 32); c.restore();
  seg(ex, ey, fa, 50, 24, 20, SUIT, SUIT_RIM);

  // 斬撃の残光
  if (pl.trail.length > 1) {
    for (let i = 1; i < pl.trail.length; i++) {
      const p0 = pl.trail[i - 1], p1 = pl.trail[i];
      const al = (i / pl.trail.length) * 0.75;
      c.fillStyle = `rgba(200,240,255,${al})`;
      c.beginPath();
      c.moveTo(p0.x + Math.sin(p0.b) * 70, p0.y + Math.cos(p0.b) * 70);
      c.lineTo(p0.x + Math.sin(p0.b) * 250, p0.y + Math.cos(p0.b) * 250);
      c.lineTo(p1.x + Math.sin(p1.b) * 250, p1.y + Math.cos(p1.b) * 250);
      c.lineTo(p1.x + Math.sin(p1.b) * 70, p1.y + Math.cos(p1.b) * 70);
      c.fill();
    }
  }
  drawMasamune(hx, hy, B);
  c.restore();
  return { hx, hy, B };
}
function drawMasamune(hx, hy, B) {
  c.save(); c.translate(hx, hy); c.rotate(-B);
  // 柄
  c.fillStyle = '#1a0e10'; c.fillRect(-6, -44, 12, 50); c.strokeRect(-6, -44, 12, 50);
  c.fillStyle = '#d8c8a0';
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-6, -40 + i * 8); c.lineTo(6, -36 + i * 8); c.lineTo(-6, -32 + i * 8); c.stroke(); }
  // 鍔
  c.fillStyle = '#c9a23a'; c.beginPath(); c.ellipse(0, 8, 16, 6, 0, 0, 7); c.fill(); c.stroke();
  // 刀身（反り付き・240px）
  c.beginPath();
  c.moveTo(-6, 12); c.quadraticCurveTo(-14, 130, -3, 244); c.lineTo(5, 236);
  c.quadraticCurveTo(-2, 130, 6, 12); c.closePath();
  const g = c.createLinearGradient(-8, 0, 8, 0);
  g.addColorStop(0, '#9aa7b8'); g.addColorStop(0.5, '#f4f8ff'); g.addColorStop(1, '#7c889a');
  c.fillStyle = g; c.fill(); c.stroke();
  // 刃文
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-3, 20);
  for (let y = 20; y < 230; y += 10) c.lineTo(-4 + Math.sin(y * 0.3) * 2 - (y / 244) * 6, y);
  c.stroke();
  // 光の走り
  const gy = ((T * 260) % 400);
  if (gy < 240) { c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(-4 - (gy / 244) * 6, gy, 4, 10); }
  c.restore();
}

// 敵の絵
function drawAshigaru(e, sx, sy, s) {
  c.save(); c.translate(sx, sy); c.scale(s * e.face, s);
  if (e.dead && e.squash) { c.scale(1.6, 0.18); }
  if (e.dead && !e.squash) c.rotate(e.rot);
  c.lineWidth = 1.5; c.strokeStyle = OUT;
  const st = Math.sin(e.t * 14) * 3;
  // 旗指物（ぼろ）
  c.fillStyle = '#4a3a2a'; c.fillRect(-9, -52, 2, 30);
  c.fillStyle = '#c8bca0'; c.beginPath(); c.moveTo(-8, -52); c.lineTo(-22, -50); c.lineTo(-20, -40); c.lineTo(-24, -34); c.lineTo(-8, -36); c.fill(); c.stroke();
  // 脚
  c.fillStyle = '#3a2c22'; c.fillRect(-4 + st * 0.6, -12, 4, 12); c.fillRect(1 - st * 0.6, -12, 4, 12);
  // 胴
  c.fillStyle = '#7a5a36'; c.fillRect(-7, -28, 14, 17); c.strokeRect(-7, -28, 14, 17);
  c.fillStyle = '#4a3c30'; c.fillRect(-7, -22, 14, 3);
  // 頭と陣笠
  c.fillStyle = '#d6a77a'; c.fillRect(-4, -34, 8, 7);
  c.fillStyle = '#2e2620'; c.beginPath(); c.moveTo(-11, -33); c.lineTo(0, -41); c.lineTo(11, -33); c.closePath(); c.fill(); c.stroke();
  // 槍
  const thrust = e.state === 'atk' ? Math.min(1, e.st / 0.25) * 14 : 0;
  c.fillStyle = '#5a4026'; c.fillRect(-4 + thrust, -22, 30, 2);
  c.fillStyle = '#dfe6ee'; c.beginPath(); c.moveTo(26 + thrust, -24); c.lineTo(34 + thrust, -21); c.lineTo(26 + thrust, -18); c.fill();
  c.restore();
}
function drawGolem(e, sx, sy, s) {
  const k = e.small ? 0.42 : 1;
  c.save(); c.translate(sx, sy); c.scale(s * k * e.face, s * k);
  c.lineWidth = 3 / k; c.strokeStyle = OUT;
  const wob = Math.sin(e.t * 3) * 3;
  const raise = e.state === 'wind' ? Math.min(1, e.st / 0.7) : e.state === 'slam' ? 1 - Math.min(1, e.st / 0.12) : 0;
  const mud = e.hurt > 0 ? '#c09070' : '#6a4a30', mud2 = '#4a3220';
  // 脚
  c.fillStyle = mud2; c.fillRect(-36, -50, 28, 50); c.fillRect(8, -50, 28, 50);
  c.strokeRect(-36, -50, 28, 50); c.strokeRect(8, -50, 28, 50);
  // 奥の腕
  c.fillStyle = mud2;
  c.save(); c.translate(-30, -150); c.rotate(-0.2 - raise * 2.4); c.fillRect(-14, 0, 28, 100); c.strokeRect(-14, 0, 28, 100); c.restore();
  // 胴（泥の塊）
  c.fillStyle = mud;
  c.beginPath(); c.moveTo(-50, -50); c.quadraticCurveTo(-70, -120, -40, -170 + wob); c.quadraticCurveTo(0, -190, 40, -170 + wob);
  c.quadraticCurveTo(70, -120, 50, -50); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(0,0,0,.25)';
  c.beginPath(); c.moveTo(-20, -140); c.lineTo(-8, -110); c.lineTo(-22, -80); c.lineTo(-12, -60); c.lineWidth = 2; c.stroke();
  // 顔・護符
  c.fillStyle = '#ff9a2a'; c.fillRect(-18, -150, 12, 8); c.fillRect(8, -150, 12, 8);
  c.fillStyle = '#1a0a04'; c.fillRect(-12, -128, 26, 6);
  c.fillStyle = '#f2e6c0'; c.fillRect(-8, -184, 16, 26); c.strokeRect(-8, -184, 16, 26);
  c.fillStyle = '#b01818'; c.font = 'bold 9px serif'; c.fillText('封', -5, -170); c.fillRect(-4, -166, 8, 2);
  // 手前の腕
  c.fillStyle = mud; c.lineWidth = 3 / k;
  c.save(); c.translate(36, -150); c.rotate(-0.4 - raise * 2.6);
  c.fillRect(-16, 0, 32, 110); c.strokeRect(-16, 0, 32, 110);
  c.beginPath(); c.arc(0, 116, 24, 0, 7); c.fill(); c.stroke(); c.restore();
  c.restore();
}
function drawSennin(e, sx, sy, s) {
  c.save(); c.translate(sx, sy); c.scale(s * e.face, s);
  c.lineWidth = 2; c.strokeStyle = OUT;
  const casting = e.state === 'cast';
  // 気のオーラ
  c.fillStyle = `rgba(170,120,255,${0.15 + Math.sin(e.t * 5) * 0.08 + (casting ? 0.2 : 0)})`;
  c.beginPath(); c.arc(0, -40, 46, 0, 7); c.fill();
  // 雲
  c.fillStyle = '#e8e4f0';
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * 12, 2 + Math.abs(i) * 2, 13 - Math.abs(i) * 2, 0, 7); c.fill(); }
  // 衣
  c.fillStyle = e.hurt > 0 ? '#fff' : '#8fb79a';
  c.beginPath(); c.moveTo(-16, -6); c.lineTo(-12, -46); c.lineTo(12, -46); c.lineTo(18, -6); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#5a7a62'; c.fillRect(-13, -30, 28, 4);
  // 頭・白髭
  c.fillStyle = '#e8c6a0'; c.beginPath(); c.arc(0, -56, 10, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#f4f4f4';
  c.beginPath(); c.moveTo(-6, -52); c.lineTo(0, -22 + Math.sin(e.t * 4) * 2); c.lineTo(8, -52); c.fill();
  c.fillRect(-12, -62, 5, 8); c.fillRect(7, -62, 5, 8);
  c.fillStyle = '#000'; c.fillRect(2, -59, 3, 2);
  // 杖と瓢箪
  c.fillStyle = '#6a4a26'; c.fillRect(16, -70, 3, 66);
  c.fillStyle = '#d89a3a'; c.beginPath(); c.arc(22, -60, 5, 0, 7); c.arc(22, -50, 7, 0, 7); c.fill();
  if (casting) { c.fillStyle = '#e0c8ff'; c.beginPath(); c.arc(-14, -40, 6 + Math.sin(T * 30) * 2, 0, 7); c.fill(); }
  c.restore();
}
function drawTengu(e, sx, sy, s) {
  c.save(); c.translate(sx, sy - e.alt); c.scale(s * e.face, s);
  c.lineWidth = 3; c.strokeStyle = OUT;
  const flap = Math.sin(e.t * (e.alt > 10 ? 14 : 4)) * 0.25;
  const red = e.hurt > 0 ? '#ffb0a0' : e.rage ? '#ff3a2a' : '#d8302a';
  // 翼
  for (const side of [-1, 1]) {
    c.save(); c.translate(-10, -250); c.rotate(side * (0.25 + flap) - 0.1);
    c.fillStyle = side < 0 ? '#14111a' : '#201a28';
    c.beginPath(); c.moveTo(0, 0);
    for (let i = 0; i <= 6; i++) c.lineTo(side * -(60 + i * 22), -60 + i * 30 + (i % 2) * 18);
    c.lineTo(0, 110); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
  // 一本歯下駄
  c.fillStyle = '#5a3a20'; c.fillRect(-44, -20, 38, 9); c.fillRect(6, -20, 38, 9); c.fillRect(-28, -12, 8, 12); c.fillRect(22, -12, 8, 12);
  c.strokeRect(-44, -20, 38, 9); c.strokeRect(6, -20, 38, 9);
  // 袴（裾が広がる）
  c.fillStyle = '#2e3a68';
  c.beginPath(); c.moveTo(-50, -150); c.lineTo(-60, -22); c.lineTo(-4, -22); c.lineTo(0, -120); c.lineTo(4, -22); c.lineTo(62, -22); c.lineTo(52, -150); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = 'rgba(160,180,255,.35)'; c.lineWidth = 2;
  for (const x of [-40, -24, 22, 38]) { c.beginPath(); c.moveTo(x * 0.9, -140); c.lineTo(x * 1.15, -26); c.stroke(); }
  c.strokeStyle = OUT; c.lineWidth = 3;
  // 奥の大袖
  c.fillStyle = '#cfc8b8';
  c.beginPath(); c.moveTo(-40, -250); c.lineTo(-86, -150); c.lineTo(-50, -140); c.lineTo(-24, -220); c.closePath(); c.fill(); c.stroke();
  // 鈴懸（格子柄の上衣）
  c.fillStyle = '#efe9da';
  c.beginPath(); c.moveTo(-54, -140); c.lineTo(-48, -252); c.lineTo(48, -252); c.lineTo(58, -140); c.closePath(); c.fill(); c.stroke();
  c.save(); c.clip();
  c.strokeStyle = 'rgba(120,90,60,.22)'; c.lineWidth = 2;
  for (let i = -60; i < 60; i += 14) { c.beginPath(); c.moveTo(i, -255); c.lineTo(i, -138); c.stroke(); }
  for (let j = -250; j < -140; j += 14) { c.beginPath(); c.moveTo(-60, j); c.lineTo(60, j); c.stroke(); }
  c.restore(); c.strokeStyle = OUT; c.lineWidth = 3;
  // 帯
  c.fillStyle = '#7a1e1a'; c.fillRect(-54, -156, 110, 16); c.strokeRect(-54, -156, 110, 16);
  // 梵天（房）
  c.fillStyle = '#ff8a1a';
  for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-26 + i * 26, -210, 9, 0, 7); c.fill(); c.stroke(); }
  // 奥の腕（扇を持つ）
  const fanA = e.state === 'gust' ? Math.sin(e.st * 18) * 0.7 + 1.6 : e.state === 'gustw' ? 3.0 : 0.9;
  // 頭
  c.fillStyle = red; c.beginPath(); c.arc(4, -282, 34, 0, 7); c.fill(); c.stroke();
  // 鼻
  c.beginPath(); c.moveTo(30, -294); c.quadraticCurveTo(110, -300, 118, -286); c.quadraticCurveTo(80, -276, 30, -276); c.closePath(); c.fill(); c.stroke();
  // 白髪の鬣
  c.fillStyle = '#f4f2ee';
  c.beginPath(); c.moveTo(-30, -310);
  for (let i = 0; i < 8; i++) c.lineTo(-40 - i * 6 + Math.sin(T * 6 + i) * 3, -300 + i * 14);
  c.lineTo(-10, -240); c.lineTo(-24, -300); c.fill(); c.stroke();
  // 眉・目
  c.fillStyle = '#fff'; c.fillRect(14, -298, 18, 8);
  c.fillStyle = e.rage ? '#ffea00' : '#111'; c.fillRect(24, -296, 6, 5);
  c.fillStyle = '#f4f2ee'; c.fillRect(8, -306, 28, 5);
  // 口
  c.fillStyle = '#3a0a0a'; c.fillRect(18, -268, 22, 8); c.fillStyle = '#fff'; for (let i = 0; i < 4; i++) c.fillRect(19 + i * 5, -268, 3, 3);
  // 頭襟（ときん）
  c.fillStyle = '#111'; c.fillRect(-6, -326, 22, 14); c.strokeRect(-6, -326, 22, 14);
  // 手前の腕と芭蕉扇
  c.save(); c.translate(40, -230); c.rotate(-fanA);
  c.fillStyle = '#f0ece2'; c.fillRect(-12, 0, 24, 80); c.strokeRect(-12, 0, 24, 80);
  c.fillStyle = red; c.beginPath(); c.arc(0, 86, 12, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#5a3a20'; c.fillRect(-3, 90, 6, 40);
  c.fillStyle = '#3f8a3a';
  c.beginPath(); c.moveTo(0, 126); c.quadraticCurveTo(-80, 180, 0, 260); c.quadraticCurveTo(80, 180, 0, 126); c.fill(); c.stroke();
  c.strokeStyle = '#a6d86a'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 130); c.lineTo(0, 255);
  for (let i = 0; i < 6; i++) { c.moveTo(0, 145 + i * 18); c.lineTo(-30 + i * 3, 160 + i * 18); c.moveTo(0, 145 + i * 18); c.lineTo(30 - i * 3, 160 + i * 18); }
  c.stroke(); c.restore();
  if (e.state === 'dizzy') {
    c.fillStyle = '#ffe04a';
    for (let i = 0; i < 3; i++) { const a = T * 5 + i * 2.1; c.fillRect(Math.cos(a) * 40, -340 + Math.sin(a) * 10, 8, 8); }
  }
  c.restore();
}

// ───────────────────────── 生成 ─────────────────────────
function spawn(type, side) {
  const x = side > 0 ? cam + VW + rnd(20, 80) : cam - rnd(20, 80);
  const z = rnd(ZMIN + 4, ZMAX - 4);
  const e = { type, x, z, alt: 0, vx: 0, vz: 0, face: -side, t: rnd(0, 3), st: 0, state: 'walk', hurt: 0, dead: false,
    dt: 0, cd: rnd(0.6, 1.6), burn: 0, kbx: 0, rot: 0, vy: 0, ox: rnd(-30, 30) };
  if (type === 'ashi') Object.assign(e, { hp: 1, w: 10, h: 40, spd: rnd(56, 76) });
  if (type === 'golem') Object.assign(e, { hp: 22, w: 46, h: 190, spd: 26 });
  if (type === 'sgolem') Object.assign(e, { hp: 4, w: 20, h: 80, spd: 52, small: true });
  if (type === 'sennin') Object.assign(e, { hp: 12, w: 22, h: 70, alt: 110, spd: 40 });
  e.maxhp = e.hp;
  enemies.push(e);
  return e;
}
function spawnBoss() {
  boss = { type: 'tengu', x: cam + VW - 70, z: 330, alt: 420, face: -1, hp: 460, maxhp: 460, w: 74, h: 390, t: 0, st: 0,
    state: 'enter', hurt: 0, dead: false, cd: 1.5, burn: 0, rage: false, next: 0, poem: '', pi: 0, tx: 0, tz: 0, spd: 60, vx: 0, kbx: 0 };
  enemies.push(boss);
  showBanner('芭蕉天狗', '見参', 2.2);
  sfx('roar');
  SND.play('boss');
}

// ───────────────────────── 演出 ─────────────────────────
function burst(x, z, alt, n, col, spd = 120, kind = 'spark', size = 3) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), v = rnd(spd * 0.3, spd);
    parts.push({ x, z, y: alt, vx: Math.cos(a) * v, vy: Math.sin(a) * v + spd * 0.4, life: rnd(0.4, 0.9), max: 0.9, col, size: rnd(size * 0.6, size * 1.4), kind });
  }
}
function pop(x, z, alt, text, col = '#fff', size = 14) { pops.push({ x, z, y: alt, text, col, size, life: 0.9 }); }
function showBanner(t1, t2, dur = 1.6, col = '#fff') { banner = { t1, t2, life: dur, max: dur, col }; }
function addScore(n) { score += n; }

// ───────────────────────── プレイヤー操作 ─────────────────────────
function nearestEnemy(range) {
  let best = null, bd = range;
  for (const e of enemies) {
    if (e.dead) continue;
    const d = Math.abs(e.x - pl.x) + Math.abs(e.z - pl.z) * 0.5;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
// 向きの自動補正：方向キーを押していない時は最寄りへ。押していても前方が空で背後に敵がいれば振り向く
function autoFace(range) {
  const n = nearestEnemy(range);
  if (!n) return;
  const toward = n.x >= pl.x ? 1 : -1;
  if (!P.held('left') && !P.held('right')) { pl.face = toward; return; }
  const front = enemies.some((e) => !e.dead && (e.x - pl.x) * pl.face > -20 && Math.abs(e.x - pl.x) < range);
  if (!front) pl.face = toward;
}
function startAttack() {
  const stage = pl.chainT > 0 ? (pl.chain % 3) + 1 : 1;
  autoFace(300);
  pl.atk = { stage, t: 0, dur: stage === 3 ? 0.56 : 0.34, hit: false };
  pl.chain = stage; pl.trail = [];
}
function resolveSlash(stage) {
  const reach = stage === 3 ? 300 : 270, ztol = stage === 3 ? 62 : 50;
  const x0 = pl.x - pl.face * 30, x1 = pl.x + pl.face * reach;
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
  const dmg = stage === 3 ? 16 : 8;
  let any = false;
  for (const e of enemies) {
    if (e.dead || e.alt > 260 || e.state === 'enter') continue;
    if (e.x + e.w < lo || e.x - e.w > hi) continue;
    if (Math.abs(e.z - pl.z) > ztol + (e.type === 'tengu' ? 30 : 0)) continue;
    damage(e, dmg, pl.face * (stage === 3 ? 200 : 120), stage === 3);
    any = true;
  }
  for (const s of eshots) {
    if (s.dead || !s.cut) continue;
    if (s.x < lo || s.x > hi || Math.abs(s.z - pl.z) > ztol + 20) continue;
    s.dead = true; burst(s.x, s.z, s.y, 8, '#e8f4ff', 140); pop(s.x, s.z, s.y + 10, '斬', '#bfe8ff', 18); addScore(50); any = true;
  }
  for (const p of props) {
    if (p.hp <= 0 || p.k === 'cedar') continue;
    if (p.x < lo || p.x > hi || pl.z > ZMIN + 60) continue;
    p.hp = 0; burst(p.x, HORIZON, 20, 16, '#8a6a40', 160, 'debris', 4); sfx('crumble'); addScore(300);
    pop(p.x, HORIZON, 60, '+300', '#ffd890', 12); any = true;
  }
  if (any) {
    hitstop = stage === 3 ? 0.11 : 0.055; shake = Math.max(shake, stage === 3 ? 12 : 5);
    sfx('hit');
  }
  if (stage === 3) {
    sfx('heavy'); shake = Math.max(shake, 10);
    fxs.push({ k: 'crack', x: pl.x + pl.face * 120, z: pl.z, dir: pl.face, t: 0, dur: 0.6, hit: new Set() });
    burst(pl.x + pl.face * 200, pl.z, 0, 18, '#7a5a3a', 200, 'debris', 4);
  }
}
function damage(e, dmg, kbx, heavy) {
  if (e.dead) return;
  if (e.type === 'tengu') { if (e.state === 'dizzy') dmg = Math.round(dmg * 1.5); kbx = 0; }
  e.hp -= dmg; e.hurt = 0.12; e.kbx = kbx;
  combo++; comboT = 2.2;
  pop(e.x, e.z, e.alt + e.h * 0.7, String(dmg), heavy ? '#ffd040' : '#fff', heavy ? 18 : 13);
  burst(e.x, e.z, e.alt + e.h * 0.5, heavy ? 12 : 6, e.type === 'golem' || e.type === 'sgolem' ? '#7a5a3a' : '#fff4c0', 150);
  if (e.type === 'tengu') { if (e.hp <= 0) killBoss(); return; }
  if (e.hp <= 0) kill(e, kbx);
}
function kill(e, kbx, squash) {
  e.dead = true; e.dt = 0; e.squash = !!squash;
  e.vx = (kbx || 0) * 1.6 + rnd(-30, 30); e.vy = squash ? 0 : rnd(160, 260);
  const pts = { ashi: 100, golem: 800, sgolem: 200, sennin: 1000 }[e.type] || 100;
  addScore(squash ? pts + 50 : pts);
  if (e.type === 'golem' && !e.small) {
    sfx('crumble'); burst(e.x, e.z, 80, 30, '#6a4a30', 220, 'debris', 6);
    for (const d of [-1, 1]) { const s = spawn('sgolem', 1); s.x = e.x + d * 40; s.z = clamp(e.z + d * 14, ZMIN, ZMAX); s.face = e.face; }
  }
  if (e.type === 'sennin') burst(e.x, e.z, e.alt + 30, 20, '#d8c0ff', 160);
  const chance = { ashi: 0.05, golem: 0.3, sgolem: 0.05, sennin: 0.7 }[e.type] || 0;
  if (Math.random() < chance) items.push({ x: e.x, z: clamp(e.z, ZMIN + 6, ZMAX - 6), y: e.alt + 60, vy: 120, k: pick(['fire', 'thunder', 'cloud']), t: 0 });
}
function killBoss() {
  const b = boss; b.dead = true; b.state = 'die'; b.st = 0;
  addScore(20000); sfx('boom'); flash = 0.6; flashCol = '#fff'; shake = 20; hitstop = 0.4;
  eshots.length = 0;
  for (const e of enemies) if (e !== b && !e.dead) kill(e, 0);
  SND.stop();
}
function hurtPlayer(dmg, fromX) {
  if (pl.inv > 0 || pl.cloud > 0 || pl.dead || mode !== 'play') return;
  pl.hp -= dmg; pl.inv = 1.0; pl.kb = (pl.x >= fromX ? 1 : -1) * 90;
  shake = Math.max(shake, 8); flash = 0.15; flashCol = '#ff2020';
  sfx('hurt'); combo = 0;
  pop(pl.x, pl.z, 200, `-${dmg}`, '#ff6060', 18);
  if (pl.hp <= 0) { pl.hp = 0; pl.dead = true; overT = 0; mode = 'over'; SND.stop(); }
}
function useJutsu() {
  if (!pl.stock.length || pl.dead) return;
  const k = pl.stock.shift();
  const J = JUTSU[k];
  showBanner(J.name, '', 1.3, J.col);
  sfx('jutsu'); hitstop = 0.15;
  if (k === 'fire') {
    sfx('fire'); shake = 14; flash = 0.3; flashCol = '#ff8020';
    fxs.push({ k: 'fire', x: pl.x + pl.face * 60, dir: pl.face, t: 0, dur: 1.5, hit: new Set() });
  } else if (k === 'thunder') {
    darken = 1.4;
    fxs.push({ k: 'thunder', t: 0, dur: 1.4, fired: false, bolts: [] });
  } else if (k === 'cloud') {
    sfx('cloud'); pl.cloud = 8; burst(pl.x, pl.z, 10, 24, '#ffe8a0', 160);
  }
}

// ───────────────────────── 更新 ─────────────────────────
function updatePlayer(dt) {
  const spd = pl.cloud > 0 ? 2 : 1;
  let mx = (P.held('right') ? 1 : 0) - (P.held('left') ? 1 : 0);
  let mz = (P.held('down') ? 1 : 0) - (P.held('up') ? 1 : 0);
  const slow = pl.atk ? 0.3 : 1;
  pl.moving = mx !== 0 || mz !== 0;
  if (mx && !pl.atk) pl.face = mx;
  pl.x += (mx * 100 * spd * slow + pl.kb) * dt;
  pl.z = clamp(pl.z + mz * 72 * spd * slow * dt, ZMIN, ZMAX);
  pl.kb *= Math.pow(0.02, dt);
  if (pl.moving) pl.walk += dt * 7.5 * spd;
  const left = Math.max(camMin, cam) + 60, right = Math.min(cam + VW, camLock + VW) - (camLock < Infinity ? 90 : 60);
  pl.x = clamp(pl.x, left, Math.max(left, right));
  if (pl.inv > 0) pl.inv -= dt;
  if (pl.cloud > 0) {
    pl.cloud -= dt;
    if (Math.random() < 0.5) parts.push({ x: pl.x - pl.face * rnd(30, 70), z: pl.z, y: 20, vx: -pl.face * 40, vy: rnd(-10, 10), life: 0.6, max: 0.6, col: '#ffe6a0', size: rnd(6, 12), kind: 'puff' });
    for (const e of enemies) {
      if (e.dead || e.type === 'tengu' && e.alt > 50) continue;
      if (Math.abs(e.x - pl.x) < 70 + e.w && Math.abs(e.z - pl.z) < 40) {
        e.cloudCd = (e.cloudCd || 0) - dt;
        if (e.cloudCd <= 0) { e.cloudCd = 0.22; damage(e, 3, pl.face * 80); sfx('hit'); }
      }
    }
  }
  // 踏み潰し（歩くだけで足軽が潰れる）
  if (pl.moving && !pl.dead) {
    for (const e of enemies) {
      if (e.dead || e.type !== 'ashi') continue;
      if (Math.abs(e.x - pl.x) < 34 && Math.abs(e.z - pl.z) < 16) {
        kill(e, 0, true); sfx('stomp'); shake = Math.max(shake, 6); combo++; comboT = 2.2;
        burst(e.x, e.z, 2, 10, '#6a5040', 120, 'debris', 3); pop(e.x, e.z, 50, 'ぐしゃ', '#ffcf6a', 13);
      }
    }
  }
  // 正宗
  if (pl.chainT > 0) pl.chainT -= dt;
  if (pl.atk) {
    const a = pl.atk; a.t += dt;
    const f = a.t / a.dur;
    if (f > 0.26 && f < (a.stage === 3 ? 0.52 : 0.46)) {
      if (!a.sw) { a.sw = true; sfx(a.stage === 3 ? 'heavy' : 'slash'); }
      a.track = true;
    } else a.track = false;
    if (!a.hit && f >= (a.stage === 3 ? 0.44 : 0.36)) { a.hit = true; resolveSlash(a.stage); }
    if (a.t >= a.dur) { pl.atk = null; pl.chainT = a.stage === 3 ? 0 : 0.3; if (a.stage === 3) pl.chain = 0; }
  } else if (P.held('a') && !pl.dead) startAttack();
  // 手裏剣
  if (pl.shCd > 0) pl.shCd -= dt;
  if (pl.throwT > 0) pl.throwT -= dt;
  if (P.held('b') && pl.shCd <= 0 && !pl.dead) {
    if (!pl.atk) autoFace(380);
    pl.shCd = 0.38; pl.throwT = 0.26; sfx('shuriken');
    shots.push({ x: pl.x + pl.face * 70, z: pl.z, y: 175, vx: pl.face * 340, rot: 0, life: 1.3, hit: new Set() });
  }
  if (P.hit('sel')) useJutsu();
}

function updateEnemy(e, dt) {
  e.t += dt; e.st += dt;
  if (e.hurt > 0) e.hurt -= dt;
  if (e.dead && e.type !== 'tengu') {
    e.dt += dt;
    if (!e.squash) { e.x += e.vx * dt; e.alt += e.vy * dt; e.vy -= 600 * dt; e.rot += dt * 10 * Math.sign(e.vx || 1); if (e.alt < 0) { e.alt = 0; e.vy = -e.vy * 0.3; } }
    return;
  }
  if (e.burn > 0) {
    e.burn -= dt; e.burnT = (e.burnT || 0) - dt;
    if (Math.random() < 0.4) parts.push({ x: e.x + rnd(-e.w, e.w), z: e.z, y: e.alt + rnd(0, e.h), vx: 0, vy: 60, life: 0.4, max: 0.4, col: '#ff7020', size: 4, kind: 'fire' });
    if (e.burnT <= 0) { e.burnT = 0.5; damage(e, 2, 0); if (e.dead) return; }
  }
  if (e.kbx) { e.x += e.kbx * dt * 3; e.kbx *= Math.pow(0.001, dt); if (Math.abs(e.kbx) < 2) e.kbx = 0; }
  const dx = pl.x - e.x, dz = pl.z - e.z;
  if (e.type !== 'tengu') e.face = dx >= 0 ? 1 : -1;
  if (e.type === 'ashi') {
    if (e.state === 'walk') {
      const tx = pl.x + e.ox + (dx > 0 ? -40 : 40);
      const mx = Math.sign(tx - e.x), mz = Math.sign(dz);
      e.x += mx * e.spd * dt * (Math.abs(tx - e.x) > 6 ? 1 : 0);
      e.z = clamp(e.z + mz * e.spd * 0.6 * dt * (Math.abs(dz) > 4 ? 1 : 0), ZMIN, ZMAX);
      e.cd -= dt;
      if (Math.abs(dx) < 80 && Math.abs(dz) < 20 && e.cd <= 0) { e.state = 'atk'; e.st = 0; }
    } else if (e.st > 0.5) {
      if (Math.abs(pl.x - e.x) < 90 && Math.abs(pl.z - e.z) < 24) hurtPlayer(4, e.x);
      e.state = 'walk'; e.cd = rnd(0.9, 1.6);
    }
  } else if (e.type === 'golem' || e.type === 'sgolem') {
    const reach = e.small ? 70 : 160;
    if (e.state === 'walk') {
      e.x += Math.sign(dx) * e.spd * dt * (Math.abs(dx) > reach * 0.8 ? 1 : 0);
      e.z = clamp(e.z + Math.sign(dz) * e.spd * 0.7 * dt * (Math.abs(dz) > 6 ? 1 : 0), ZMIN, ZMAX);
      e.cd -= dt;
      if (Math.abs(dx) < reach && Math.abs(dz) < 28 && e.cd <= 0) { e.state = 'wind'; e.st = 0; }
    } else if (e.state === 'wind' && e.st > (e.small ? 0.4 : 0.75)) {
      e.state = 'slam'; e.st = 0;
      if (Math.abs(pl.x - e.x) < reach + 20 && Math.abs(pl.z - e.z) < 36) hurtPlayer(e.small ? 5 : 10, e.x);
      if (!e.small) { shake = Math.max(shake, 7); sfx('stomp'); burst(e.x + e.face * 130, e.z, 0, 10, '#6a4a30', 120, 'debris', 4); }
    } else if (e.state === 'slam' && e.st > 0.5) { e.state = 'walk'; e.cd = rnd(1.4, 2.4); }
  } else if (e.type === 'sennin') {
    e.alt = 110 + Math.sin(e.t * 2) * 10;
    if (e.state === 'walk') {
      const want = pl.x + (e.x > pl.x ? 170 : -170);
      e.x += Math.sign(want - e.x) * e.spd * dt * (Math.abs(want - e.x) > 10 ? 1 : 0);
      e.z = clamp(e.z + Math.sign(dz) * 30 * dt, ZMIN, ZMAX);
      e.cd -= dt;
      if (e.cd <= 0) { e.state = Math.random() < 0.3 ? 'warp' : 'cast'; e.st = 0; }
    } else if (e.state === 'cast' && e.st > 0.7) {
      for (const v of [80, 125]) eshots.push({ k: 'orb', x: e.x + e.face * 16, z: e.z, y: e.alt + 40, vx: e.face * v, life: 5, dmg: 8, cut: true });
      sfx('orb'); e.state = 'walk'; e.cd = rnd(1.8, 2.8);
    } else if (e.state === 'warp' && e.st > 0.3) {
      burst(e.x, e.z, e.alt + 30, 12, '#e8e0ff', 100);
      e.x = clamp(pl.x + pick([-1, 1]) * rnd(150, 200), cam + 30, cam + VW - 30); e.z = rnd(ZMIN, ZMAX);
      burst(e.x, e.z, e.alt + 30, 12, '#e8e0ff', 100);
      e.state = 'cast'; e.st = 0;
    }
  } else if (e.type === 'tengu') updateTengu(e, dt);
  if (!e.inside && e.x > cam + 24 && e.x < cam + VW - 24) e.inside = true;
  const m = e.type === 'tengu' ? 70 : 20;
  e.x = e.inside ? clamp(e.x, cam + m, cam + VW - m) : clamp(e.x, cam - 120, cam + VW + 120);
}

function updateTengu(b, dt) {
  const dx = pl.x - b.x;
  const rate = b.rage ? 0.65 : 1;
  if (!b.rage && b.hp < b.maxhp / 2) { b.rage = true; showBanner('天狗、怒る', '', 1.4, '#ff5040'); sfx('roar'); shake = 12; }
  switch (b.state) {
    case 'enter':
      b.alt = Math.max(0, b.alt - 300 * dt);
      if (b.alt <= 0) { b.state = 'idle'; b.st = 0; shake = 16; sfx('stomp'); burst(b.x, b.z, 0, 24, '#8a6a40', 200, 'debris', 5); }
      break;
    case 'idle': {
      b.face = dx >= 0 ? 1 : -1;
      const side = pl.x - cam > VW / 2 ? -1 : 1;
      const want = clamp(pl.x + side * 210, cam + 70, cam + VW - 70);
      b.x += clamp(want - b.x, -1, 1) * b.spd * dt * (Math.abs(want - b.x) > 12 ? 1 : 0);
      b.z += clamp(pl.z - b.z, -1, 1) * 40 * dt;
      b.z = clamp(b.z, ZMIN, ZMAX);
      b.cd -= dt;
      if (b.cd <= 0) {
        const seq = ['gustw', 'haiku', 'dive', 'haiku', 'summon', 'dive'];
        b.state = seq[b.next++ % seq.length]; b.st = 0;
        if (b.state === 'haiku') { b.poem = pick(HAIKU); b.pi = 0; showBanner(`「${b.poem}」`, '', 1.2, '#e8f0ff'); }
        if (b.state === 'dive') { sfx('wind'); }
      }
      break;
    }
    case 'gustw':
      if (b.st > 0.6 * rate) { b.state = 'gust'; b.st = 0; sfx('wind'); }
      break;
    case 'gust':
      pl.kb = b.face * 70;
      if (Math.random() < dt * 20) parts.push({ x: cam + (b.face > 0 ? 0 : VW), z: rnd(ZMIN, ZMAX), y: rnd(0, 250), vx: b.face * rnd(300, 500), vy: 0, life: 1, max: 1, col: 'rgba(255,255,255,.5)', size: rnd(14, 30), kind: 'wind' });
      b.leafT = (b.leafT || 0) - dt;
      if (b.leafT <= 0) {
        b.leafT = 0.28 * rate;
        const lanes = [ZMIN + 12, (ZMIN + ZMAX) / 2, ZMAX - 12];
        const skip = (b.st * 3 | 0) % 3;
        lanes.forEach((z, i) => { if (i !== skip) eshots.push({ k: 'leaf', x: b.x + b.face * 80, z, y: rnd(40, 200), vx: b.face * 230, life: 3, dmg: 6, cut: true, rot: 0 }); });
      }
      if (b.st > 1.8) { b.state = 'idle'; b.st = 0; b.cd = 1.2 * rate; }
      break;
    case 'haiku':
      b.ht = (b.ht || 0) - dt;
      if (b.ht <= 0 && b.pi < b.poem.length) {
        b.ht = 0.16 * rate;
        eshots.push({ k: 'char', ch: b.poem[b.pi++], x: b.x + b.face * 100, z: clamp(pl.z + rnd(-14, 14), ZMIN, ZMAX), y: 200, vx: b.face * 150, life: 4, dmg: 7, cut: true, ph: b.pi });
      }
      if (b.pi >= b.poem.length && b.st > 3) { b.state = 'idle'; b.st = 0; b.cd = 1.3 * rate; }
      break;
    case 'dive':
      if (b.st < 0.8) b.alt += 700 * dt;
      else if (b.st < 0.8 + 1.4 * rate) { b.alt = 600; b.x = lerp(b.x, pl.x, 1 - Math.pow(0.02, dt)); b.z = lerp(b.z, pl.z, 1 - Math.pow(0.02, dt)); }
      else {
        b.alt -= 1800 * dt;
        if (b.alt <= 0) {
          b.alt = 0; b.state = 'dizzy'; b.st = 0; shake = 22; sfx('boom');
          fxs.push({ k: 'ring', x: b.x, z: b.z, t: 0, dur: 0.6 });
          burst(b.x, b.z, 0, 30, '#8a6a40', 260, 'debris', 5);
          if (Math.abs(pl.x - b.x) < 120 && Math.abs(pl.z - b.z) < 44) hurtPlayer(14, b.x);
        }
      }
      break;
    case 'dizzy':
      if (b.st > 1.6 * rate) { b.state = 'idle'; b.st = 0; b.cd = 0.8; }
      break;
    case 'summon':
      if (b.st > 0.5 && !b.summoned) { b.summoned = true; for (let i = 0; i < 5; i++) spawnQ.push(['ashi', i % 2 ? 1 : -1]); pop(b.x, b.z, 340, '者ども、かかれ！', '#ffd0a0', 14); }
      if (b.st > 1.4) { b.summoned = false; b.state = 'idle'; b.st = 0; b.cd = 1.4 * rate; }
      break;
    case 'die':
      b.st += 0; b.alt = 0;
      if (Math.random() < 0.3) { burst(b.x + rnd(-60, 60), b.z, rnd(40, 300), 10, pick(['#ff8020', '#fff', '#ffd040']), 200); sfx('hit'); }
      break;
  }
}

function updateShots(dt) {
  for (const s of shots) {
    s.x += s.vx * dt; s.rot += dt * 22; s.life -= dt;
    for (const e of enemies) {
      if (e.dead || s.hit.has(e) || e.state === 'enter' || e.alt > 300) continue;
      if (Math.abs(e.x - s.x) < e.w + 26 && Math.abs(e.z - s.z) < 34) {
        s.hit.add(e); damage(e, 4, Math.sign(s.vx) * 60); sfx('hit'); hitstop = Math.max(hitstop, 0.03);
      }
    }
    for (const q of eshots) if (q.cut && !q.dead && Math.abs(q.x - s.x) < 30 && Math.abs(q.z - s.z) < 30) { q.dead = true; burst(q.x, q.z, q.y, 6, '#fff', 100); addScore(50); }
  }
  shots = shots.filter((s) => s.life > 0);
  for (const q of eshots) {
    q.life -= dt;
    if (q.k === 'orb') {
      q.vx += Math.sign(pl.x - q.x) * 60 * dt; q.vx = clamp(q.vx, -110, 110);
      q.z += Math.sign(pl.z - q.z) * 22 * dt; q.y += (150 - q.y) * dt;
    }
    if (q.k === 'char') q.y = 120 + Math.sin(q.life * 4 + q.ph) * 70;
    if (q.k === 'leaf') q.rot += dt * 12;
    q.x += q.vx * dt;
    if (!q.dead && Math.abs(q.x - pl.x) < 36 && Math.abs(q.z - pl.z) < 22) { hurtPlayer(q.dmg, q.x); q.dead = true; burst(q.x, q.z, q.y, 8, '#ff8080', 120); }
    if (q.x < cam - 80 || q.x > cam + VW + 80) q.dead = true;
  }
  eshots = eshots.filter((q) => !q.dead && q.life > 0);
}

function updateFx(dt) {
  for (const f of fxs) {
    f.t += dt;
    if (f.k === 'fire') {
      const front = f.x + f.dir * f.t * 320;
      for (let i = 0; i < 6; i++) parts.push({ x: front + rnd(-30, 10) * f.dir, z: rnd(ZMIN, ZMAX), y: rnd(0, 40), vx: f.dir * rnd(20, 80), vy: rnd(120, 280), life: rnd(0.4, 0.8), max: 0.8, col: pick(['#ffd040', '#ff7020', '#ff3010']), size: rnd(8, 18), kind: 'fire' });
      for (const e of enemies) {
        if (e.dead || f.hit.has(e) || e.alt > 300) continue;
        if ((e.x - front) * f.dir < 20 && (e.x - f.x) * f.dir > -20) { f.hit.add(e); damage(e, 14, f.dir * 140, true); e.burn = 2.5; }
      }
      for (const q of eshots) if ((q.x - front) * f.dir < 20 && (q.x - f.x) * f.dir > -20) q.dead = true;
      for (const p of props) if (p.hp > 0 && p.k !== 'cedar' && (p.x - front) * f.dir < 20 && (p.x - f.x) * f.dir > 0) { p.hp = 0; addScore(300); }
    } else if (f.k === 'thunder') {
      if (!f.fired && f.t > 0.3) {
        f.fired = true; sfx('thunder'); flash = 0.5; flashCol = '#fffbe0'; shake = 16;
        for (const e of enemies) {
          if (e.dead || e.x < cam - 20 || e.x > cam + VW + 20) continue;
          f.bolts.push({ x: e.x, z: e.z, top: e.alt + e.h });
          damage(e, 16, 0, true);
        }
        eshots.forEach((q) => { q.dead = true; });
        if (!f.bolts.length) for (let i = 0; i < 4; i++) f.bolts.push({ x: cam + rnd(30, VW - 30), z: rnd(ZMIN, ZMAX), top: 0 });
      }
    } else if (f.k === 'crack') {
      const fx = f.x + f.dir * f.t * 420;
      if (Math.random() < 0.8) burst(fx, f.z, 0, 2, '#7a5a3a', 150, 'debris', 4);
      for (const e of enemies) {
        if (e.dead || f.hit.has(e) || e.alt > 80) continue;
        if (Math.abs(e.x - fx) < 30 + e.w && Math.abs(e.z - f.z) < 50) { f.hit.add(e); damage(e, 6, f.dir * 100); }
      }
    }
  }
  fxs = fxs.filter((f) => f.t < f.dur);
}

function updateWaves(dt) {
  const w = WAVES[waveIdx];
  if (!waveActive && w && cam >= w.at - 0.5) {
    waveActive = true; camLock = w.at; cam = w.at;
    if (w.area) { showBanner(w.area, w.sub, 2.2); checkpoint = waveIdx; }
    if (w.boss) spawnBoss();
    else {
      spawnQ = [];
      let side = 1;
      for (const [k, n] of w.spawn) for (let i = 0; i < n; i++) { spawnQ.push([k, side]); side = k === 'ashi' && i % 3 === 2 ? -side : side; }
    }
    spawnT = 0.3;
  }
  if (spawnQ.length) {
    spawnT -= dt;
    if (spawnT <= 0) { const [k, s] = spawnQ.shift(); spawn(k, s); spawnT = k === 'ashi' ? 0.35 : 1.0; }
  }
  if (waveActive && !spawnQ.length && !enemies.some((e) => !e.dead) && !(w && w.boss)) {
    waveActive = false; waveIdx++; camLock = Infinity; goT = 3;
  }
}

function update(dt) {
  T += dt;
  if (banner) { banner.life -= dt; if (banner.life <= 0) banner = null; }
  if (flash > 0) flash -= dt;
  if (darken > 0) darken -= dt;
  shake *= Math.pow(0.004, dt);
  if (mode === 'title') {
    cam += dt * 20;
    if (P.hit('a') || P.hit('start') || tapped) startGame();
    tapped = false;
    return;
  }
  if (mode === 'pause') return updatePause();
  if (mode === 'clear') {
    clearT += dt;
    updateParticles(dt);
    if (clearT > 2 && (P.hit('a') || P.hit('start') || tapped)) toTitle();
    tapped = false; return;
  }
  if (mode === 'over') {
    overT += dt;
    updateParticles(dt);
    if (overT > 1.2) {
      if (P.hit('a') || tapped) continueGame();
      else if (P.hit('start')) toTitle();
    }
    tapped = false; return;
  }
  tapped = false;
  if (P.hit('start')) { openPause(); return; }
  if (hitstop > 0) { hitstop -= dt; return; }

  updatePlayer(dt);
  // 攻撃の軌跡（ローカル座標で記録）
  if (pl.atk && pl.atk.track) { const B = bladeAngle(), H = B * 0.62 + 0.25; const lean = pl.atk.stage === 3 ? 0.25 : 0.12; const hipY = -126; const shX = Math.sin(lean) * 92, shY = hipY - Math.cos(lean) * 92; pl.trail.push({ x: shX + Math.sin(H) * 80, y: shY + 8 + Math.cos(H) * 80, b: B }); if (pl.trail.length > 7) pl.trail.shift(); }
  else if (pl.trail.length) pl.trail.shift();

  // カメラ
  const target = pl.x - 150;
  cam = clamp(Math.max(cam, Math.min(target, camLock)), camMin, STAGE_END - VW);
  if (cam > camMin + 0) camMin = Math.max(camMin, cam - 40);

  updateWaves(dt);
  zoomT = boss ? 0.78 : 1;
  zoom += (zoomT - zoom) * Math.min(1, dt * 1.5); VW = W / zoom;
  for (const e of enemies) updateEnemy(e, dt);
  enemies = enemies.filter((e) => !(e.dead && (e.squash ? e.dt > 1.2 : e.dt > 1.6)) || e === boss);
  updateShots(dt);
  updateFx(dt);
  // 巻物
  for (const it of items) {
    it.t += dt;
    if (it.y > 0) { it.y = Math.max(0, it.y - it.vy * dt); }
    if (Math.abs(it.x - pl.x) < 56 && Math.abs(it.z - pl.z) < 40) {
      it.got = true; sfx('pickup');
      if (pl.stock.length < 3) { pl.stock.push(it.k); pop(it.x, it.z, 120, `${JUTSU[it.k].name} 入手`, JUTSU[it.k].col, 14); }
      else { addScore(500); pop(it.x, it.z, 120, '+500', '#ffd890', 13); }
    }
    if (it.t > 14) it.got = true;
  }
  items = items.filter((it) => !it.got);
  if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }
  if (goT > 0) goT -= dt;
  updateParticles(dt);
  if (boss && boss.state === 'die') {
    if (boss.st > 2.6) { boss.gone = true; burst(boss.x, boss.z, 160, 60, '#ffd040', 320); burst(boss.x, boss.z, 100, 30, '#3f8a3a', 240, 'debris', 6); sfx('boom'); flash = 0.4; mode = 'clear'; clearT = 0; if (score > best) { best = score; store.set('best', best); } showBanner('芭蕉天狗', '討ち取ったり', 3, '#ffd040'); }
  }
}
function updateParticles(dt) {
  for (const p of parts) {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.kind === 'debris' || p.kind === 'spark') { p.vy -= 500 * dt; if (p.y < 0) { p.y = 0; p.vy *= -0.3; p.vx *= 0.6; } }
    if (p.kind === 'fire') p.size *= Math.pow(0.4, dt);
  }
  parts = parts.filter((p) => p.life > 0);
  if (parts.length > 500) parts.splice(0, parts.length - 500);
  for (const q of pops) { q.life -= dt; q.y += 40 * dt; }
  pops = pops.filter((q) => q.life > 0);
}

// ───────────────────────── 画面遷移 ─────────────────────────
let tapped = false;
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (mode === 'pause') {
    const r = canvas.getBoundingClientRect();
    const y = ((e.clientY - r.top) / r.height) * H;
    const i = Math.floor((y - 150) / 40);
    if (help) { help = false; return; }
    if (i >= 0 && i < 4) { menuSel = i; menuDo(); }
    return;
  }
  tapped = true;
}, { passive: false });

function startGame() {
  score = 0; resetStage(0);
  // 検証用：URL末尾 #boss でボス戦から
  if (location.hash === '#boss') { checkpoint = WAVES.length - 1; resetStage(checkpoint); }
  mode = 'play';
  SND.play('stage');
}
function resetStage(fromWave) {
  enemies = []; shots = []; eshots = []; parts = []; pops = []; items = []; fxs = []; boss = null; spawnQ = [];
  zoom = zoomT = 1; VW = W;
  waveIdx = fromWave; waveActive = false; camLock = Infinity; goT = 0; combo = 0;
  const startCam = fromWave === 0 ? 0 : Math.max(0, WAVES[fromWave].at - 140);
  cam = startCam; camMin = startCam;
  const keep = pl ? pl.stock : [];
  pl = newPlayer(cam + 110);
  if (fromWave) pl.stock = keep;
  if (fromWave === 0) buildProps();
}
function continueGame() {
  score = Math.floor(score / 2);
  resetStage(checkpoint);
  mode = 'play';
  SND.play(WAVES[checkpoint].boss ? 'boss' : 'stage');
}
function toTitle() {
  if (score > best) { best = score; store.set('best', best); }
  mode = 'title'; help = false; SND.stop(); cam = 0; zoom = zoomT = 1; VW = W; buildProps(); pl = newPlayer(150); banner = null;
}
function openPause() {
  if (mode !== 'play') return;
  mode = 'pause'; pauseFromPlay = true; menuSel = 0; help = false;
}
const MENU = () => ['つづける', `音：${P.muted ? 'OFF' : 'ON'}`, '操作説明', 'タイトルへ'];
function menuDo() {
  sfx('select');
  if (menuSel === 0) { mode = 'play'; pauseFromPlay = false; }
  else if (menuSel === 1) P.setMute(!P.muted);
  else if (menuSel === 2) help = true;
  else if (menuSel === 3) { pauseFromPlay = false; toTitle(); }
}
function updatePause() {
  if (help) { if (P.hit('a') || P.hit('b') || P.hit('start') || P.hit('sel')) help = false; return; }
  if (P.hit('start') || P.hit('b')) { mode = 'play'; pauseFromPlay = false; return; }
  if (P.hit('up')) { menuSel = (menuSel + 3) % 4; sfx('select'); }
  if (P.hit('down')) { menuSel = (menuSel + 1) % 4; sfx('select'); }
  if (P.hit('a')) menuDo();
}

// ───────────────────────── 描画 ─────────────────────────
function txt(s, x, y, size, col, align = 'center', font = 'sans-serif', weight = '800') {
  c.font = `${weight} ${size}px ${font}`; c.textAlign = align; c.textBaseline = 'middle';
  c.lineWidth = Math.max(3, size / 5); c.strokeStyle = '#0a0408'; c.lineJoin = 'round';
  c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y);
}
const MINCHO = '"Hiragino Mincho ProN","Yu Mincho",serif';

function drawWorld() {
  for (const p of props) drawProp(p);
  // 奥行き順に並べて描く
  const list = [];
  for (const e of enemies) list.push({ z: e.z, d: () => drawEnemy(e) });
  for (const it of items) list.push({ z: it.z, d: () => drawItem(it) });
  for (const s of shots) list.push({ z: s.z, d: () => drawShuriken(s) });
  for (const q of eshots) list.push({ z: q.z + 1, d: () => drawEShot(q) });
  if (pl && mode !== 'title') list.push({ z: pl.z + 0.5, d: drawPlayer });
  for (const f of fxs) if (f.k === 'ring') list.push({ z: f.z - 30, d: () => drawRing(f) });
  list.sort((a, b) => a.z - b.z);
  for (const o of list) o.d();
  for (const f of fxs) if (f.k !== 'ring') drawFx(f);
  for (const p of parts) {
    const x = p.x - cam, y = p.z - p.y;
    c.globalAlpha = clamp(p.life / p.max, 0, 1);
    c.fillStyle = p.col;
    if (p.kind === 'fire' || p.kind === 'puff') { c.beginPath(); c.arc(x, y, p.size, 0, 7); c.fill(); }
    else if (p.kind === 'wind') c.fillRect(x, y - 150, p.size * 3, 2);
    else c.fillRect(x | 0, y | 0, p.size | 0 || 1, p.size | 0 || 1);
  }
  c.globalAlpha = 1;
  for (const q of pops) { c.globalAlpha = clamp(q.life * 2, 0, 1); txt(q.text, q.x - cam, q.z - q.y, q.size, q.col); }
  c.globalAlpha = 1;
}
function drawPlayer() {
  const s = ds(pl.z) * 0.98;
  const sx = pl.x - cam, sy = pl.z;
  const lift = pl.cloud > 0 ? 34 + Math.sin(T * 4) * 4 : 0;
  shadow(sx, sy, 62 * s);
  if (pl.cloud > 0) {
    const al = pl.cloud < 2 && Math.sin(T * 20) > 0 ? 0.4 : 1;
    c.globalAlpha = al;
    c.fillStyle = '#ffd36a';
    for (let i = -3; i <= 3; i++) { c.beginPath(); c.arc(sx + i * 18, sy - lift + 18 + Math.abs(i) * 2 + Math.sin(T * 6 + i) * 2, 22 - Math.abs(i) * 3, 0, 7); c.fill(); }
    c.fillStyle = '#fff2c0';
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(sx + i * 18, sy - lift + 10, 10, 0, 7); c.fill(); }
    c.globalAlpha = 1;
  }
  if (pl.inv > 0 && Math.floor(T * 20) % 2) c.globalAlpha = 0.45;
  drawNinja(sx, sy, s, pl.face, lift);
  c.globalAlpha = 1;
}
function drawEnemy(e) {
  const s = ds(e.z), sx = e.x - cam, sy = e.z;
  if (sx < -200 || sx > VW + 200 || e.gone) return;
  if (e.dead && e.type !== 'tengu') c.globalAlpha = clamp(1.4 - e.dt, 0, 1);
  if (e.type !== 'tengu' || e.alt < 400) shadow(sx, sy, (e.w + 8) * s * (e.type === 'tengu' ? 1.3 * clamp(1 - e.alt / 700, 0.3, 1) : 1));
  if (e.type === 'tengu' && e.state === 'dive' && e.alt > 100) {
    c.fillStyle = 'rgba(255,40,40,.35)'; c.beginPath(); c.ellipse(sx, sy, 110, 26, 0, 0, 7); c.fill();
  }
  if (e.type === 'ashi') drawAshigaru(e, sx, sy - e.alt, s * 1.0);
  else if (e.type === 'golem' || e.type === 'sgolem') drawGolem(e, sx, sy - e.alt, s);
  else if (e.type === 'sennin') drawSennin(e, sx, sy - e.alt, s);
  else if (e.type === 'tengu' && !e.gone) {
    if (e.state === 'die') c.globalAlpha = clamp(1 - e.st / 2.6, 0, 1);
    if (e.state !== 'die' || Math.sin(T * 30) > -0.5) drawTengu(e, sx, sy, s * 1.15);
    c.globalAlpha = 1;
  }
  if (e.burn > 0) { c.fillStyle = 'rgba(255,120,30,.35)'; c.fillRect(sx - e.w, sy - e.alt - e.h * s, e.w * 2, e.h * s); }
  c.globalAlpha = 1;
  // 体力ゲージ（大型のみ）
  if (!e.dead && (e.type === 'golem' || e.type === 'sennin') && e.hp < e.maxhp) {
    const y = sy - e.alt - e.h * s - 10;
    c.fillStyle = '#000'; c.fillRect(sx - 22, y, 44, 5);
    c.fillStyle = '#ff5a3a'; c.fillRect(sx - 21, y + 1, 42 * e.hp / e.maxhp, 3);
  }
}
function drawItem(it) {
  const x = it.x - cam, y = it.z - it.y - 18 + Math.sin(it.t * 4) * 3;
  const J = JUTSU[it.k];
  if (it.t > 10 && Math.sin(it.t * 20) < 0) return;
  c.fillStyle = `rgba(255,240,180,${0.3 + Math.sin(it.t * 6) * 0.15})`; c.beginPath(); c.arc(x, y, 22, 0, 7); c.fill();
  c.fillStyle = '#efe0b8'; c.fillRect(x - 14, y - 9, 28, 18);
  c.fillStyle = '#7a1420'; c.fillRect(x - 17, y - 10, 5, 20); c.fillRect(x + 12, y - 10, 5, 20);
  c.strokeStyle = OUT; c.lineWidth = 1.5; c.strokeRect(x - 14, y - 9, 28, 18);
  txt(J.ch, x, y + 1, 14, J.col);
}
function drawShuriken(s) {
  const x = s.x - cam, y = s.z - s.y;
  c.save(); c.translate(x, y); c.rotate(s.rot);
  c.fillStyle = '#2a2e38'; c.strokeStyle = '#e0e8f4'; c.lineWidth = 2;
  c.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    c.lineTo(Math.cos(a) * 34, Math.sin(a) * 34);
    c.lineTo(Math.cos(a + 0.785) * 9, Math.sin(a + 0.785) * 9);
  }
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#c0c8d4'; c.beginPath(); c.arc(0, 0, 5, 0, 7); c.fill();
  c.restore();
  c.fillStyle = 'rgba(200,220,255,.25)'; c.fillRect(x - Math.sign(s.vx) * 50, y - 2, 40, 4);
}
function drawEShot(q) {
  const x = q.x - cam, y = q.z - q.y;
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, q.z, 12, 3, 0, 0, 7); c.fill();
  if (q.k === 'orb') {
    c.fillStyle = 'rgba(180,120,255,.4)'; c.beginPath(); c.arc(x, y, 16, 0, 7); c.fill();
    c.fillStyle = '#e8d8ff'; c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill();
  } else if (q.k === 'leaf') {
    c.save(); c.translate(x, y); c.rotate(q.rot);
    c.fillStyle = '#5aa040'; c.strokeStyle = OUT; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(0, 0, 14, 6, 0, 0, 7); c.fill(); c.stroke(); c.restore();
  } else if (q.k === 'char') {
    c.fillStyle = 'rgba(120,180,255,.25)'; c.beginPath(); c.arc(x, y, 20, 0, 7); c.fill();
    txt(q.ch, x, y, 26, '#f0f4ff', 'center', MINCHO, '900');
  }
}
function drawRing(f) {
  const r = 40 + f.t / f.dur * 200;
  c.strokeStyle = `rgba(255,220,160,${1 - f.t / f.dur})`; c.lineWidth = 6;
  c.beginPath(); c.ellipse(f.x - cam, f.z, r, r * 0.25, 0, 0, 7); c.stroke();
}
function drawFx(f) {
  if (f.k === 'fire') {
    const front = f.x + f.dir * f.t * 320 - cam;
    const life = 1 - f.t / f.dur;
    // 炎の舌を重ねる（奥→手前、外炎→内炎）
    const layers = [['rgba(200,30,0,.55)', 1], ['rgba(255,110,20,.7)', 0.78], ['rgba(255,210,80,.85)', 0.5]];
    for (const [col, k] of layers) {
      c.fillStyle = col;
      for (let i = 0; i < 7; i++) {
        const bx = front - f.dir * i * 22;
        const hgt = (230 - i * 18) * k * (0.8 + 0.2 * Math.sin(T * 25 + i * 2)) * Math.min(1, life * 3);
        const wob = Math.sin(T * 18 + i * 1.3) * 12;
        c.beginPath();
        c.moveTo(bx - 26, ZMAX + 4);
        c.quadraticCurveTo(bx - 30, ZMAX - hgt * 0.5, bx + wob, ZMAX - hgt - 60);
        c.quadraticCurveTo(bx + 30, ZMAX - hgt * 0.5, bx + 26, ZMAX + 4);
        c.fill();
      }
    }
    c.fillStyle = `rgba(255,140,40,${0.25 * life})`; c.fillRect(0, -200, VW, H + 200);
  } else if (f.k === 'thunder' && f.fired) {
    const al = 1 - (f.t - 0.3) / 1.1;
    c.strokeStyle = `rgba(255,250,200,${al})`; c.lineWidth = 6;
    for (const b of f.bolts) {
      const x = b.x - cam;
      c.beginPath(); c.moveTo(x + rnd(-20, 20), 0);
      for (let y = 30; y < b.z - b.top * 0.3; y += 30) c.lineTo(x + rnd(-18, 18), y);
      c.lineTo(x, b.z); c.stroke();
      c.strokeStyle = `rgba(255,255,255,${al})`; c.lineWidth = 2; c.stroke();
      c.strokeStyle = `rgba(255,250,200,${al})`; c.lineWidth = 6;
    }
  } else if (f.k === 'crack') {
    const x0 = f.x - cam, x1 = f.x + f.dir * f.t * 420 - cam;
    c.strokeStyle = '#1a0c06'; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, f.z);
    const n = Math.abs(x1 - x0) / 14;
    for (let i = 1; i <= n; i++) c.lineTo(x0 + f.dir * i * 14, f.z + (i % 2 ? -5 : 5));
    c.stroke();
    c.fillStyle = '#5a4030';
    for (let i = 0; i < 3; i++) c.fillRect(x1 - 8 + i * 6, f.z - 18 - i * 6, 8, 18 + i * 6);
  }
}

function drawHUD() {
  // 体力
  txt('影丸', 10, 16, 13, '#f4e6c8', 'left', MINCHO, '900');
  c.fillStyle = '#000'; c.fillRect(44, 9, 132, 14);
  const hp = clamp(pl.hp / 100, 0, 1);
  c.fillStyle = hp > 0.3 ? '#f2c040' : '#ff3a2a'; c.fillRect(46, 11, 128 * hp, 10);
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(46, 11, 128 * hp, 3);
  // 忍術ストック
  txt('忍術', 10, 40, 11, '#ffcf6a', 'left');
  for (let i = 0; i < 3; i++) {
    const x = 40 + i * 30, y = 30;
    c.fillStyle = i === 0 && pl.stock[0] ? 'rgba(255,220,120,.35)' : 'rgba(0,0,0,.5)'; c.fillRect(x, y, 26, 22);
    c.strokeStyle = i === 0 ? '#ffcf6a' : '#776'; c.lineWidth = 2; c.strokeRect(x, y, 26, 22);
    if (pl.stock[i]) txt(JUTSU[pl.stock[i]].ch, x + 13, y + 12, 15, JUTSU[pl.stock[i]].col);
  }
  if (pl.stock[0]) txt('SELECTで発動', 134, 41, 9, '#ffcf6a', 'left');
  if (pl.cloud > 0) txt(`筋斗雲 ${Math.ceil(pl.cloud)}`, 134, 41, 10, '#ffe6a0', 'left');
  // スコア（右上はミュートボタンを避ける）
  txt(`SCORE ${String(score).padStart(6, '0')}`, 296, 14, 11, '#fff', 'right', 'monospace');
  txt(`BEST ${String(Math.max(best, score)).padStart(6, '0')}`, 296, 30, 9, '#c8b890', 'right', 'monospace');
  if (combo >= 3) txt(`${combo} 連`, 340, 90, 20 + Math.min(combo, 30) * 0.4, '#ffd040', 'right', MINCHO, '900');
  if (goT > 0 && Math.sin(T * 10) > 0) txt('GO ▶', 330, 200, 26, '#ffd040', 'right');
  if (boss && !boss.dead && boss.state !== 'enter') {
    txt('芭蕉天狗', 12, H - 22, 12, '#ffb0a0', 'left', MINCHO, '900');
    c.fillStyle = '#000'; c.fillRect(76, H - 29, 272, 14);
    c.fillStyle = boss.rage ? '#ff3a2a' : '#d8a030'; c.fillRect(78, H - 27, 268 * clamp(boss.hp / boss.maxhp, 0, 1), 10);
  }
}
function drawBanner() {
  if (!banner) return;
  const f = banner.life / banner.max, al = clamp(Math.min(f * 4, (1 - f) * 8), 0, 1);
  c.globalAlpha = al;
  c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 118, W, banner.t2 ? 76 : 52);
  const long = banner.t1.length > 10;
  txt(banner.t1, W / 2, 144, long ? 17 : 30, banner.col, 'center', MINCHO, '900');
  if (banner.t2) txt(banner.t2, W / 2, 178, 14, '#f4e6c8', 'center', MINCHO, '700');
  c.globalAlpha = 1;
}
function drawTitle() {
  drawBG();
  for (const p of props) drawProp(p);
  // 巨大忍者の勇姿
  pl.moving = false; pl.atk = null;
  drawNinja(110, 384, 1.12, 1, 0);
  c.fillStyle = 'rgba(10,4,8,.45)'; c.fillRect(0, 0, W, H);
  txt('巨忍', 232, 74, 58, '#f4e6c8', 'center', MINCHO, '900');
  txt('影丸', 262, 132, 58, '#d0202c', 'center', MINCHO, '900');
  txt('KYODAI NINJA KAGEMARU', 240, 170, 11, '#ffcf6a', 'center', 'monospace');
  if (Math.floor(T * 2.5) % 2 === 0) txt('A か 画面タップで出陣', 240, 206, 14, '#fff');
  c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(170, 228, 180, 112);
  c.strokeStyle = '#ffcf6a'; c.lineWidth = 1; c.strokeRect(170, 228, 180, 112);
  const rows = [['十字', '移動（↑↓で奥行き）'], ['A', '正宗で斬る・長押し連撃'], ['B', '大手裏剣・長押し連射'], ['SELECT', '巻物の忍術を発動'], ['START', 'ポーズ']];
  rows.forEach(([k, v], i) => { txt(k, 178, 244 + i * 21, 10, '#ffcf6a', 'left'); txt(v, 226, 244 + i * 21, 10, '#fff', 'left'); });
  txt(`BEST ${String(best).padStart(6, '0')}`, 260, 360, 11, '#c8b890', 'center', 'monospace');
}
function drawPause() {
  c.fillStyle = 'rgba(5,2,8,.72)'; c.fillRect(0, 0, W, H);
  if (help) {
    txt('操作説明', W / 2, 70, 22, '#ffcf6a', 'center', MINCHO, '900');
    const rows = ['十字 ◀▶：移動　▲▼：奥行き', 'A：正宗。長押しで三段斬り', '　三段目は地割れが走る', 'B：大手裏剣。長押しで連射・貫通', 'SELECT：巻物の忍術（左の枠から）', '歩くだけで足軽は踏み潰せる', '敵の飛び道具・句の文字は斬れる', 'START：ポーズ　右上🔊：音'];
    rows.forEach((r, i) => txt(r, 30, 120 + i * 28, 13, '#fff', 'left'));
    txt('どれかのボタンで戻る', W / 2, 360, 12, '#c8b890');
    return;
  }
  txt('ポーズ', W / 2, 100, 30, '#f4e6c8', 'center', MINCHO, '900');
  MENU().forEach((m, i) => {
    const y = 170 + i * 40;
    if (i === menuSel) { c.fillStyle = 'rgba(232,56,0,.55)'; c.fillRect(70, y - 17, 220, 34); txt('▶', 86, y, 16, '#ffcf6a'); }
    txt(m, W / 2, y, 18, '#fff');
  });
  txt('▲▼で選ぶ　Aで決定　STARTで戻る', W / 2, 350, 11, '#c8b890');
}

function render() {
  c.setTransform(P.res, 0, 0, P.res, 0, 0);
  if (mode === 'title') { drawTitle(); return; }
  const sx = shake > 0.3 ? rnd(-shake, shake) : 0, sy = shake > 0.3 ? rnd(-shake, shake) * 0.6 : 0;
  c.save(); c.translate(sx, sy);
  c.translate(0, H); c.scale(zoom, zoom); c.translate(0, -H);
  drawBG();
  if (darken > 0) { c.fillStyle = `rgba(10,10,40,${clamp(darken, 0, 0.7)})`; c.fillRect(-20, -200, VW + 40, H + 220); }
  drawWorld();
  c.restore();
  if (flash > 0) { c.globalAlpha = clamp(flash * 2, 0, 0.8); c.fillStyle = flashCol; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  drawHUD();
  drawBanner();
  if (mode === 'pause') drawPause();
  if (mode === 'over') {
    c.fillStyle = `rgba(40,0,0,${clamp(overT, 0, 0.7)})`; c.fillRect(0, 0, W, H);
    txt('無念…', W / 2, 150, 40, '#ff6050', 'center', MINCHO, '900');
    if (overT > 1.2) { txt('A・タップ：コンティニュー', W / 2, 220, 15, '#fff'); txt('START：タイトルへ', W / 2, 250, 13, '#c8b890'); txt('（区間の頭から・スコア半分）', W / 2, 276, 11, '#c8b890'); }
  }
  if (mode === 'clear' && clearT > 1.5) {
    c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(30, 210, W - 60, 120);
    txt(`SCORE ${String(score).padStart(6, '0')}`, W / 2, 240, 18, '#fff', 'center', 'monospace');
    txt(score >= best ? '★ 最高記録 ★' : `BEST ${String(best).padStart(6, '0')}`, W / 2, 270, 13, '#ffd040');
    txt('A・タップでタイトルへ', W / 2, 305, 12, '#c8b890');
  }
}

// ───────────────────────── ループ ─────────────────────────
buildProps();
pl = newPlayer(150);
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  P.poll();
  if (P.hit('mute')) P.setMute(!P.muted);
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// 自動テスト用の覗き窓（ゲーム進行には使わない）
window.__kage = { get mode() { return mode; }, get pl() { return pl; }, get enemies() { return enemies; }, get boss() { return boss; },
  get waveIdx() { return waveIdx; }, get score() { return score; }, get cam() { return cam; } };
