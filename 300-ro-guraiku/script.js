(() => {
'use strict';

const $ = (id) => document.getElementById(id);
const cv = $('c');
const cx = cv.getContext('2d');
const wrap = $('screen-wrap');

const WORLD_W = 560;
const WORLD_H = 420;
const SPAWN_X = WORLD_W / 2;
const SPAWN_Y = WORLD_H / 2;
const PLAYER_R = 14;

const K = { u: 0, d: 0, l: 0, r: 0 };
let W = 0, H = 0, DPR = 1;
let mute = false, paused = false, AC = null;
let mode = 'title';
let stage = 1;
let score = 0;
let bestDepth = 0;
let bannerT = 0;
let shake = 0;
let anim = 0;

let player = null;
let enemies = [];
let particles = [];

try {
  mute = localStorage.getItem('tg.300.mute') === '1';
  bestDepth = +localStorage.getItem('tg.300.bestDepth') || 0;
} catch (e) {}

const UPGRADES = [
  {
    id: 'hp',
    name: '剛身',
    desc: '最大HP+28 回復',
    max: 8,
    apply(p) {
      p.max += 28;
      p.hp = Math.min(p.max, p.hp + 28);
    }
  },
  {
    id: 'dmg',
    name: '刃研',
    desc: '斬撃ダメ+22%',
    max: 10,
    apply(p) { p.dmgMul *= 1.22; }
  },
  {
    id: 'slashcd',
    name: '早振',
    desc: '斬クール-16%',
    max: 8,
    apply(p) { p.slashCdMul *= 0.84; }
  },
  {
    id: 'move',
    name: '足腰',
    desc: '移動+14%',
    max: 8,
    apply(p) { p.moveMul *= 1.14; }
  },
  {
    id: 'dashcd',
    name: '影歩',
    desc: '回避CD-22%',
    max: 8,
    apply(p) { p.dashCdMul *= 0.78; }
  },
  {
    id: 'reach',
    name: '広刃',
    desc: '斬リーチ+12',
    max: 6,
    apply(p) { p.reachBonus += 12; }
  },
  {
    id: 'lifesteal',
    name: '吸命',
    desc: '撃破時HP+4',
    max: 8,
    apply(p) { p.lifeOnKill += 4; }
  },
  {
    id: 'armor',
    name: '鉄皮',
    desc: '被ダメ-12%',
    max: 6,
    apply(p) { p.armor = Math.min(0.55, p.armor + 0.12); }
  },
  {
    id: 'dashinv',
    name: '見切',
    desc: '回避無敵+0.1秒',
    max: 5,
    apply(p) { p.invBonus += 0.1; }
  }
];

function resize() {
  const r = wrap.getBoundingClientRect();
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = r.width;
  H = r.height;
  cv.width = W * DPR;
  cv.height = H * DPR;
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);
resize();

function unlock() {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const b = AC.createBuffer(1, 1, 22050);
    const s = AC.createBufferSource();
    s.buffer = b;
    s.connect(AC.destination);
    s.start(0);
  } catch (e) { AC = null; }
}

function tone(f, d, type, v) {
  if (!AC || mute) return;
  try {
    const t = AC.currentTime;
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.type = type || 'square';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v || 0.07, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(AC.destination);
    o.start(t);
    o.stop(t + d + 0.02);
  } catch (e) {}
}

const sfx = {
  slash: () => { tone(320, 0.06, 'sawtooth', 0.08); tone(180, 0.08, 'triangle', 0.05); },
  hit: () => tone(120, 0.07, 'square', 0.09),
  dash: () => tone(520, 0.05, 'triangle', 0.06),
  kill: () => tone(660, 0.08, 'square', 0.07),
  hurt: () => tone(90, 0.15, 'sawtooth', 0.08),
  clear: () => { tone(784, 0.1, 'square', 0.07); tone(988, 0.12, 'triangle', 0.06); },
  pick: () => tone(440, 0.1, 'triangle', 0.07),
  die: () => tone(70, 0.3, 'triangle', 0.08)
};

function setMute(v) {
  mute = v;
  try { localStorage.setItem('tg.300.mute', mute ? '1' : '0'); } catch (e) {}
  $('btnMute').textContent = mute ? '🔇' : '♪';
  if ($('btnMuteDlg')) $('btnMuteDlg').textContent = mute ? '音: オフ' : '音: オン';
}

function bindTap(el, fn) {
  if (!el) return;
  const down = (e) => {
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
    el.classList.add('is-pressed');
    if (navigator.vibrate) navigator.vibrate(12);
    unlock();
    fn(e);
  };
  const up = () => el.classList.remove('is-pressed');
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}

function bindHoldDpad(el) {
  const set = (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    K.l = x < -0.15 ? 1 : 0;
    K.r = x > 0.15 ? 1 : 0;
    K.u = y < -0.15 ? 1 : 0;
    K.d = y > 0.15 ? 1 : 0;
    el.classList.toggle('press-l', K.l);
    el.classList.toggle('press-r', K.r);
    el.classList.toggle('press-u', K.u);
    el.classList.toggle('press-d', K.d);
  };
  const clear = () => {
    K.l = K.r = K.u = K.d = 0;
    el.classList.remove('press-l', 'press-r', 'press-u', 'press-d');
  };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
    set(e);
  });
  el.addEventListener('pointermove', (e) => {
    if (el.hasPointerCapture(e.pointerId)) set(e);
  });
  el.addEventListener('pointerup', clear);
  el.addEventListener('pointercancel', clear);
}

let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const n = Date.now();
  if (n - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = n;
}, { passive: false });
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => e.preventDefault());

function banner(s, t) {
  $('banner').textContent = s;
  bannerT = t || 2;
}

function updHud() {
  if (!player) return;
  $('hudStage').textContent = `第${stage}層`;
  $('hudHp').textContent = `♥ ${Math.ceil(player.hp)}/${player.max}`;
  $('hudScore').textContent = `${score} pt`;
}

function burst(x, y, col, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 120;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4, col, s: 2 + Math.random() * 3 });
  }
}

function collideCircle(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy < r * r;
}

function blocked(x, y, r) {
  return x < r || y < r || x > WORLD_W - r || y > WORLD_H - r;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.random() * (i + 1) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function upgradePool() {
  return UPGRADES.filter((u) => {
    const lv = player.up[u.id] || 0;
    return !u.max || lv < u.max;
  });
}

function spawnEnemy(kind, x, y) {
  const boss = kind === 'boss';
  const hp = boss ? 80 + stage * 35 : 18 + stage * 14;
  enemies.push({
    x, y,
    hp,
    max: hp,
    r: boss ? 26 : 13 + Math.min(stage, 6),
    spd: boss ? 52 + stage * 3 : 58 + stage * 6,
    dmg: boss ? 12 + stage * 2.8 : 7 + stage * 2.1,
    kind: boss ? 'boss' : kind,
    kb: 0,
    hit: 0
  });
}

function spawnWave() {
  enemies = [];
  const n = 5 + stage * 2 + (Math.random() * 4 | 0);
  for (let i = 0; i < n; i++) {
    const edge = Math.random() * 4 | 0;
    let x = SPAWN_X;
    let y = SPAWN_Y;
    if (edge === 0) { x = 36; y = 40 + Math.random() * (WORLD_H - 80); }
    else if (edge === 1) { x = WORLD_W - 36; y = 40 + Math.random() * (WORLD_H - 80); }
    else if (edge === 2) { x = 40 + Math.random() * (WORLD_W - 80); y = 36; }
    else { x = 40 + Math.random() * (WORLD_W - 80); y = WORLD_H - 36; }
    const kind = Math.random() < 0.28 + stage * 0.008 ? 'fast' : 'grunt';
    spawnEnemy(kind, x, y);
  }
  if (stage % 10 === 0) spawnEnemy('boss', WORLD_W / 2, 48);
  banner(`第${stage}層`, 1.2);
}

function newPlayer() {
  return {
    x: SPAWN_X,
    y: SPAWN_Y,
    vx: 0,
    vy: 0,
    hp: 100,
    max: 100,
    r: PLAYER_R,
    ang: -Math.PI / 2,
    swing: 0,
    slashCd: 0,
    dashCd: 0,
    dash: 0,
    inv: 0,
    dmgMul: 1,
    slashCdMul: 1,
    moveMul: 1,
    dashCdMul: 1,
    reachBonus: 0,
    lifeOnKill: 0,
    armor: 0,
    invBonus: 0,
    up: {}
  };
}

function beginWave() {
  spawnWave();
  updHud();
}

function showUpgradePick() {
  mode = 'pick';
  sfx.pick();
  sfx.clear();
  const sub = $('upgradeSub');
  if (sub) sub.textContent = `第${stage}層クリア — 強化して第${stage + 1}層へ`;
  const pool = upgradePool();
  let choices = shuffle(pool.length >= 3 ? pool : UPGRADES).slice(0, 3);
  if (choices.length < 3) {
    choices = shuffle(UPGRADES).slice(0, 3);
  }
  const box = $('upgradeChoices');
  if (!box) return;
  box.replaceChildren();
  choices.forEach((u) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'upgrade-btn game-btn';
    const lv = player.up[u.id] || 0;
    const cap = u.max ? ` Lv${lv + 1}/${u.max}` : '';
    btn.textContent = `${u.name}${cap} — ${u.desc}`;
    bindTap(btn, () => selectUpgrade(u));
    box.appendChild(btn);
  });
  $('upgrade').classList.remove('hidden');
}

function selectUpgrade(u) {
  if (mode !== 'pick' || !player) return;
  u.apply(player);
  player.up[u.id] = (player.up[u.id] || 0) + 1;
  $('upgrade').classList.add('hidden');
  stage++;
  if (stage > bestDepth) {
    bestDepth = stage;
    try { localStorage.setItem('tg.300.bestDepth', String(bestDepth)); } catch (e) {}
  }
  player.hp = Math.min(player.max, player.hp + 8);
  mode = 'play';
  beginWave();
}

function checkWaveClear() {
  if (mode !== 'play' || enemies.length > 0) return;
  showUpgradePick();
}

function startGame() {
  $('title').classList.add('hidden');
  $('end').classList.add('hidden');
  $('upgrade').classList.add('hidden');
  stage = 1;
  score = 0;
  player = newPlayer();
  mode = 'play';
  beginWave();
}

function endGame() {
  mode = 'end';
  sfx.die();
  const reached = stage;
  if (reached > bestDepth) {
    bestDepth = reached;
    try { localStorage.setItem('tg.300.bestDepth', String(bestDepth)); } catch (e) {}
  }
  $('endTitle').textContent = '撃破された';
  $('endMsg').textContent = `到達 ${reached}層　${score} pt　ベスト ${bestDepth}層`;
  $('end').classList.remove('hidden');
}

function toTitle() {
  paused = false;
  try { $('pauseDlg').close(); } catch (e) {}
  mode = 'title';
  player = null;
  enemies = [];
  $('upgrade').classList.add('hidden');
  $('title').classList.remove('hidden');
  $('end').classList.add('hidden');
  $('banner').textContent = '';
  const bestEl = $('titleBest');
  if (bestEl) bestEl.textContent = bestDepth > 0 ? `ベスト到達 ${bestDepth}層` : '';
}

function setPaused(on) {
  if (mode !== 'play') return;
  paused = on;
  if (on) try { $('pauseDlg').showModal(); } catch (e) {}
  else try { $('pauseDlg').close(); } catch (e) {}
}

function slashDamage() {
  return (14 + stage * 3) * player.dmgMul;
}

function onEnemyKilled(e) {
  score += e.kind === 'boss' ? 50 + stage * 8 : 8 + stage * 2;
  if (player.lifeOnKill > 0) {
    player.hp = Math.min(player.max, player.hp + player.lifeOnKill);
  }
  sfx.kill();
  burst(e.x, e.y, '#88ff88', 14);
}

function trySlash() {
  if (!player || mode !== 'play' || player.slashCd > 0 || player.swing > 0) return;
  player.swing = 0.2;
  player.slashCd = 0.28 * player.slashCdMul;
  sfx.slash();
  const reach = 48 + player.reachBonus;
  const hx = player.x + Math.cos(player.ang) * 28;
  const hy = player.y + Math.sin(player.ang) * 28;
  const dmg = slashDamage();
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const dx = e.x - hx;
    const dy = e.y - hy;
    const dist = Math.hypot(dx, dy);
    if (dist > reach + e.r) continue;
    const angTo = Math.atan2(dy, dx);
    let diff = angTo - player.ang;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > 1.25) continue;
    e.hp -= dmg;
    e.kb = 0.15;
    e.hit = 0.12;
    sfx.hit();
    burst(e.x, e.y, '#ffc860', 6);
    const push = 80;
    e.x += Math.cos(angTo) * push * 0.016;
    e.y += Math.sin(angTo) * push * 0.016;
    if (e.hp <= 0) onEnemyKilled(e);
  }
  enemies = enemies.filter((e) => e.hp > 0);
  checkWaveClear();
  updHud();
}

function tryDash() {
  if (!player || mode !== 'play' || player.dashCd > 0 || player.dash > 0) return;
  player.dash = 0.18;
  player.dashCd = 0.75 * player.dashCdMul;
  player.inv = 0.35 + player.invBonus;
  const sp = 320 * player.moveMul;
  player.vx = Math.cos(player.ang) * sp;
  player.vy = Math.sin(player.ang) * sp;
  sfx.dash();
  burst(player.x, player.y, '#58a8e8', 8);
}

function hurt(dmg) {
  if (player.inv > 0) return;
  const taken = dmg * (1 - player.armor);
  player.hp -= taken;
  player.inv = 0.45;
  shake = 0.15;
  sfx.hurt();
  burst(player.x, player.y, '#ff5868', 10);
  if (player.hp <= 0) endGame();
  updHud();
}

function update(dt) {
  if (mode !== 'play' || paused || !player) return;
  anim += dt;
  if (bannerT > 0) bannerT -= dt;

  let ix = (K.r - K.l);
  let iy = (K.d - K.u);
  if (ix || iy) {
    const len = Math.hypot(ix, iy) || 1;
    ix /= len;
    iy /= len;
    player.ang = Math.atan2(iy, ix);
  }

  const moveSpd = (player.dash > 0 ? 0 : 158) * player.moveMul;
  if (player.dash <= 0) {
    player.vx = ix * moveSpd;
    player.vy = iy * moveSpd;
  } else {
    player.vx *= 0.92;
    player.vy *= 0.92;
  }

  let nx = player.x + player.vx * dt;
  let ny = player.y + player.vy * dt;
  if (!blocked(nx, player.y, player.r)) player.x = nx;
  if (!blocked(player.x, ny, player.r)) player.y = ny;

  player.swing = Math.max(0, player.swing - dt);
  player.slashCd = Math.max(0, player.slashCd - dt);
  player.dash = Math.max(0, player.dash - dt);
  player.dashCd = Math.max(0, player.dashCd - dt);
  player.inv = Math.max(0, player.inv - dt);

  for (const e of enemies) {
    if (e.hp <= 0) continue;
    e.hit = Math.max(0, e.hit - dt);
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    let spd = e.spd * (e.kind === 'fast' ? 1.3 : 1);
    if (e.kb > 0) {
      e.kb -= dt;
      spd *= 0.35;
    }
    const mx = (dx / dist) * spd * dt;
    const my = (dy / dist) * spd * dt;
    let ex = e.x + mx;
    let ey = e.y + my;
    if (!blocked(ex, e.y, e.r)) e.x = ex;
    if (!blocked(e.x, ey, e.r)) e.y = ey;
    if (collideCircle(player.x, player.y, player.r, e.x, e.y, e.r)) {
      hurt(e.dmg * dt * 2.8);
    }
  }

  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 120 * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);
  if (shake > 0) shake = Math.max(0, shake - dt * 2);
}

function cam() {
  const s = Math.min(W / WORLD_W, H / WORLD_H) * 1.08;
  const offX = W / 2 - player.x * s;
  const offY = H / 2 - player.y * s;
  return { s, offX, offY };
}

function draw() {
  cx.fillStyle = '#080612';
  cx.fillRect(0, 0, W, H);
  if (mode === 'title' || mode === 'end') return;
  if (!player) return;

  const { s, offX, offY } = cam();
  cx.save();
  if (shake > 0) cx.translate((Math.random() - 0.5) * shake * 20, (Math.random() - 0.5) * shake * 14);

  cx.fillStyle = '#141028';
  cx.fillRect(offX, offY, WORLD_W * s, WORLD_H * s);
  cx.strokeStyle = '#4a4080';
  cx.lineWidth = 3;
  cx.strokeRect(offX + 2, offY + 2, WORLD_W * s - 4, WORLD_H * s - 4);

  for (let gy = 0; gy < WORLD_H; gy += 28) {
    for (let gx = 0; gx < WORLD_W; gx += 28) {
      cx.fillStyle = 'rgba(255,255,255,0.02)';
      cx.fillRect(offX + gx * s, offY + gy * s, 26 * s, 26 * s);
    }
  }

  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const col = e.kind === 'boss' ? '#c83848' : e.kind === 'fast' ? '#8868c8' : '#68a848';
    cx.fillStyle = e.hit > 0 ? '#fff' : col;
    cx.beginPath();
    cx.arc(offX + e.x * s, offY + e.y * s, e.r * s, 0, Math.PI * 2);
    cx.fill();
    if (e.max > 40) {
      const bw = e.r * 2 * s;
      cx.fillStyle = '#200808';
      cx.fillRect(offX + (e.x - e.r) * s, offY + (e.y - e.r - 8) * s, bw, 4);
      cx.fillStyle = '#ff5050';
      cx.fillRect(offX + (e.x - e.r) * s, offY + (e.y - e.r - 8) * s, bw * (e.hp / e.max), 4);
    }
  }

  const px = offX + player.x * s;
  const py = offY + player.y * s;
  if (player.inv > 0 && Math.floor(anim * 20) % 2) cx.globalAlpha = 0.45;
  cx.fillStyle = '#58a8e8';
  cx.beginPath();
  cx.arc(px, py, player.r * s, 0, Math.PI * 2);
  cx.fill();
  cx.strokeStyle = '#c8e8ff';
  cx.lineWidth = 2;
  cx.stroke();
  cx.globalAlpha = 1;

  cx.strokeStyle = '#f0c060';
  cx.lineWidth = 3;
  if (player.swing > 0) {
    cx.beginPath();
    cx.arc(px, py, (38 + player.reachBonus * 0.35) * s, player.ang - 0.9, player.ang + 0.9);
    cx.stroke();
  }

  cx.fillStyle = '#eef2ff';
  cx.beginPath();
  cx.moveTo(px + Math.cos(player.ang) * 16 * s, py + Math.sin(player.ang) * 16 * s);
  cx.lineTo(px + Math.cos(player.ang + 2.4) * 8 * s, py + Math.sin(player.ang + 2.4) * 8 * s);
  cx.lineTo(px + Math.cos(player.ang - 2.4) * 8 * s, py + Math.sin(player.ang - 2.4) * 8 * s);
  cx.fill();

  for (const p of particles) {
    cx.fillStyle = p.col;
    cx.fillRect(offX + p.x * s, offY + p.y * s, p.s, p.s);
  }
  cx.restore();

  if (mode === 'play') {
    $('btnSlash').disabled = player.slashCd > 0.05;
    $('btnDash').disabled = player.dashCd > 0.05;
  }
}

function loop(ts) {
  const dt = Math.min(0.033, (loop._t ? (ts - loop._t) / 1000 : 0.016));
  loop._t = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

bindHoldDpad($('dpad'));
bindTap($('btnSlash'), () => trySlash());
bindTap($('btnDash'), () => tryDash());
bindTap($('btnMute'), () => setMute(!mute));
bindTap($('btnPause'), () => setPaused(!paused));
bindTap($('btnResume'), () => setPaused(false));
bindTap($('btnMuteDlg'), () => setMute(!mute));
bindTap($('btnQuit'), () => { setPaused(false); toTitle(); });

function tapTitle(e) {
  e.preventDefault();
  e.stopPropagation();
  unlock();
  if (mode === 'title') startGame();
}
function tapEnd(e) {
  e.preventDefault();
  e.stopPropagation();
  unlock();
  if (mode === 'end') toTitle();
}

bindTap($('btnStart'), tapTitle);
bindTap($('btnRetry'), tapEnd);
const titleEl = $('title');
const endEl = $('end');
if (titleEl) titleEl.addEventListener('pointerdown', tapTitle);
if (endEl) endEl.addEventListener('pointerdown', tapEnd);

cv.addEventListener('pointerdown', (e) => {
  if (mode === 'title') tapTitle(e);
  else if (mode === 'end') tapEnd(e);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'p') { setPaused(!paused); e.preventDefault(); return; }
  if (e.key === 'm') setMute(!mute);
  if (mode !== 'play' || paused) return;
  if (e.key === 'ArrowLeft' || e.key === 'a') K.l = 1;
  if (e.key === 'ArrowRight' || e.key === 'd') K.r = 1;
  if (e.key === 'ArrowUp' || e.key === 'w') K.u = 1;
  if (e.key === 'ArrowDown' || e.key === 's') K.d = 1;
  if (e.key === 'z' || e.key === ' ') trySlash();
  if (e.key === 'x' || e.key === 'Shift') tryDash();
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') K.l = 0;
  if (e.key === 'ArrowRight' || e.key === 'd') K.r = 0;
  if (e.key === 'ArrowUp' || e.key === 'w') K.u = 0;
  if (e.key === 'ArrowDown' || e.key === 's') K.d = 0;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && mode === 'play') setPaused(true);
});

setMute(mute);
toTitle();
requestAnimationFrame(loop);
})();
