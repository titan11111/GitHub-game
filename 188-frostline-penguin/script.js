"use strict";
/*
  設計判断: フック「FROSTLINE」はグレイズで冷気を充填し、ICEシールドで敵弾を経験値化する。
  主要調整値: HP100 / 無敵1.5秒 / 自機当たり半径5px / グレイズ28px / 自動連射0.12秒。
  固定上限: 自弾120・敵弾180・敵40・アイテム40・粒子250。deltaTime上限は1/30秒、DPR上限2。
  進行: 約25秒で中ボス、約52秒で3フェーズボス。低HP時は弾数と速度を自動緩和する。
*/
const $ = (id) => document.getElementById(id);
const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: false });
const ui = {
  hud: $("hud"), score: $("score"), multiplier: $("multiplier"), power: $("power"),
  hp: $("hpFill"), frost: $("frostFill"), bombs: $("bombs"), bomb: $("bombButton"),
  bossHud: $("bossHud"), bossFill: $("bossFill"), bossPhase: $("bossPhase"),
  mute: $("muteButton"), title: $("titleScreen"), how: $("howScreen"), result: $("resultScreen"),
  warning: $("warning"), message: $("message"), best: $("bestScore"), top: $("topScores"),
  final: $("finalScore"), rank: $("rankText"), achievement: $("achievementText"),
  resultKicker: $("resultKicker"), resultTitle: $("resultTitle"), fatal: $("fatalError")
};
let W = 390, H = 844, dpr = 1, state = "title", lastTime = 0;
let stageTime = 0, eventIndex = 0, bgScroll = 0, hitStop = 0, stageNumber = 1;
let shake = 0, shakePower = 0, slowMotion = 0, warningTimer = 0;
let bossPending = false, currentBoss = null, messageTimer = 0;
let noDamage = true, finalizing = false;
const keys = Object.create(null);
const pointers = new Map();
const stars = Array.from({ length: 64 }, (_, i) => ({
  x: (i * 97.3) % 997 / 997,
  y: (i * 193.7) % 991 / 991,
  z: .3 + (i % 7) / 8
}));
const player = { x: 195, y: 690, vx: 0, vy: 0, tx: 195, ty: 690,
  hp: 100, invuln: 0, shield: 0, shot: 0, missile: 0, bombs: 3,
  frost: 0, xp: 0, level: 1, score: 0, combo: 0, comboTimer: 0, multiplier: 1, flash: 0 };
function makePool(count, factory) {
  return Array.from({ length: count }, factory);
}
function take(pool) {
  for (let i = 0; i < pool.length; i += 1) {
    if (!pool[i].active) {
      pool[i].active = true;
      return pool[i];
    }
  }
  return null;
}
function clearPool(pool) { for (let i = 0; i < pool.length; i += 1) pool[i].active = false; }
const shots = makePool(120, () => ({ active: false, x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, r: 4, damage: 1, type: 0, life: 0 }));
const enemyBullets = makePool(180, () => ({ active: false, x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, r: 5, life: 0, grazed: false, color: 0 }));
const enemies = makePool(40, () => ({ active: false, type: "", role: "", x: 0, y: 0, baseX: 0, vx: 0, vy: 0, r: 18,
  hp: 1, maxHp: 1, age: 0, fire: 0, phase: 1, flash: 0, warned: 0, value: 100 }));
const particles = makePool(250, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: "#fff" }));
const items = makePool(40, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, r: 7, life: 0, value: 1 }));
class SoundManager {
  constructor() {
    this.context = null; this.bgmGain = null; this.seGain = null;
    this.muted = this.loadMute();
    this.timer = 0; this.step = 0;
  }

  loadMute() { try { return localStorage.getItem("frostlineMute") === "1"; } catch { return false; } }

  init() {
    if (!this.context) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      this.context = new AudioCtor();
      this.bgmGain = this.context.createGain();
      this.seGain = this.context.createGain();
      this.bgmGain.connect(this.context.destination);
      this.seGain.connect(this.context.destination);
      this.applyVolume();
      const buffer = this.context.createBuffer(1, 1, 22050);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      source.start();
    }
    this.resume();
    this.startBgm();
  }

  applyVolume() {
    if (!this.context) return;
    this.bgmGain.gain.setValueAtTime(this.muted ? 0 : .12, this.context.currentTime);
    this.seGain.gain.setValueAtTime(this.muted ? 0 : .22, this.context.currentTime);
  }

  resume() { if (this.context && this.context.state === "suspended") this.context.resume().catch(() => {}); }

  toggle() {
    this.muted = !this.muted;
    this.applyVolume();
    ui.mute.textContent = this.muted ? "🔇" : "🔊";
    ui.mute.setAttribute("aria-label", this.muted ? "音声を再開" : "音声をミュート");
    try { localStorage.setItem("frostlineMute", this.muted ? "1" : "0"); } catch {}
  }

  tone(freq, duration, type, volume, slide = 0) {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    osc.connect(gain);
    gain.connect(this.seGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  se(name) {
    const sounds = {
      shot: [680, .045, "square", .08, 220],
      hit: [260, .04, "triangle", .05, -70],
      kill: [180, .13, "sawtooth", .1, 420],
      hurt: [120, .3, "sawtooth", .18, -70],
      bomb: [90, .65, "sine", .24, 700],
      warning: [440, .18, "square", .12, -120],
      decide: [520, .12, "triangle", .12, 360],
      graze: [980, .05, "sine", .06, 180],
      level: [440, .35, "triangle", .15, 660],
      phase: [220, .42, "square", .13, 660]
    };
    const s = sounds[name];
    if (s) this.tone(s[0], s[1], s[2], s[3], s[4]);
  }

  startBgm() {
    if (this.timer) return;
    this.timer = window.setInterval(() => {
      if (!this.context || this.muted || (state !== "playing" && state !== "bossDeath")) return;
      const scale = currentBoss ? [110, 131, 147, 165, 196, 220, 196, 165] : [147, 165, 196, 220, 247, 220, 196, 165];
      const freq = scale[this.step % scale.length] * (currentBoss && currentBoss.phase === 3 ? 1.5 : 1);
      const now = this.context.currentTime;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = this.step % 4 === 0 ? "square" : "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(this.step % 4 === 0 ? .11 : .055, now);
      gain.gain.exponentialRampToValueAtTime(.001, now + .16);
      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(now);
      osc.stop(now + .17);
      this.step += 1;
    }, 180);
  }
}

const sound = new SoundManager();
ui.mute.textContent = sound.muted ? "🔇" : "🔊";

function resize() {
  W = Math.max(1, window.innerWidth);
  H = Math.max(1, window.innerHeight);
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  player.x = Math.min(W - 24, Math.max(24, player.x)); player.y = Math.min(H - 55, Math.max(90, player.y));
}

function showScreen(screen) {
  ui.title.classList.remove("active"); ui.how.classList.remove("active"); ui.result.classList.remove("active");
  if (screen) screen.classList.add("active");
}

function pulseMessage(text, duration = 1.5) {
  ui.message.textContent = text; ui.message.classList.add("show"); messageTimer = duration;
}

function vibrate(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

function resetGame() {
  [shots, enemyBullets, enemies, particles, items].forEach(clearPool);
  Object.assign(player, {
    x: W / 2, y: H * .78, vx: 0, vy: 0, tx: W / 2, ty: H * .78,
    hp: 100, invuln: 1.2, shield: 0, shot: 0, missile: 0, bombs: 3,
    frost: 0, xp: 0, level: 1, score: 0, combo: 0, comboTimer: 0,
    multiplier: 1, flash: 0
  });
  state = "playing";
  stageTime = 0;
  stageNumber = 1;
  eventIndex = 0;
  currentBoss = null;
  bossPending = false;
  warningTimer = 0;
  noDamage = true;
  finalizing = false;
  slowMotion = 0;
  ui.hud.classList.remove("hidden");
  ui.bomb.classList.remove("hidden");
  ui.bossHud.classList.add("hidden");
  ui.warning.classList.add("hidden");
  showScreen(null);
  pulseMessage("WAVE 1\nFROSTLINEを作れ！", 2.3);
  sound.se("decide");
  updateHud();
}

function spawnEnemy(type, x, y = -30) {
  const e = take(enemies);
  if (!e) return null;
  const data = {
    scout: [3, 15, 115, "突撃役", 120],
    zig: [5, 17, 88, "牽制役", 180],
    sniper: [7, 19, 58, "狙撃役", 250],
    tank: [18, 25, 42, "耐久役", 500],
    mid: [130, 42, 30, "中ボス", 5000],
    boss: [650, 66, 18, "ボス", 20000]
  }[type];
  if (stageNumber === 2 && (type === "mid" || type === "boss")) data[0] = type === "boss" ? 850 : 170;
  Object.assign(e, {
    type, role: data[3], x, y, baseX: x, vx: 0, vy: data[2], r: data[1],
    hp: data[0], maxHp: data[0], age: 0, fire: 1.1, phase: 1,
    flash: 0, warned: 0, value: data[4]
  });
  if (type === "boss") {
    currentBoss = e;
    ui.bossHud.classList.remove("hidden");
    shakeScreen(8, .5);
  }
  return e;
}

function spawnShot(x, y, vx, vy, damage = 1, type = 0) {
  const b = take(shots);
  if (!b) return;
  Object.assign(b, { x, y, px: x, py: y, vx, vy, r: type === 2 ? 7 : 4, damage, type, life: 2.5 });
}

function spawnEnemyBullet(x, y, angle, speed, color = 0) {
  const b = take(enemyBullets);
  if (!b) return;
  Object.assign(b, {
    x, y, px: x, py: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    r: color === 2 ? 7 : 5, life: 7, grazed: false, color
  });
}

function aimedAngle(x, y) {
  return Math.atan2(player.y - y, player.x - x);
}

function burst(x, y, color, count, force = 120) {
  for (let i = 0; i < count; i += 1) {
    const p = take(particles);
    if (!p) break;
    const a = (Math.PI * 2 * i / count) + (i % 3) * .17;
    const speed = force * (.35 + (i % 7) / 9);
    Object.assign(p, {
      x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      life: .35 + (i % 5) * .07, max: .7, size: 2 + (i % 4), color
    });
  }
}

function dropItem(x, y, value = 1) {
  const item = take(items);
  if (item) Object.assign(item, { x, y, vx: (Math.random() - .5) * 45, vy: 55, r: 7, life: 7, value });
}

function shakeScreen(power, duration) {
  shakePower = Math.min(10, Math.max(shakePower, power)); shake = Math.min(.6, Math.max(shake, duration));
}

function difficulty() {
  const skill = Math.min(.14, player.score / 180000);
  const relief = player.hp <= 30 ? -.16 : player.hp <= 55 ? -.07 : 0;
  return Math.max(.82, Math.min(1.18, 1 + skill + relief));
}

const timelines = window.FROSTLINE_STAGES.timelines;
function runTimeline() {
  const timeline = timelines[stageNumber - 1];
  while (eventIndex < timeline.length && stageTime >= timeline[eventIndex][0]) {
    const event = timeline[eventIndex][1];
    eventIndex += 1;
    if (event === "formation") {
      for (let i = 0; i < 5; i += 1) spawnEnemy("scout", W * (.16 + i * .17), -20 - i * 34);
    } else if (event === "zig") {
      for (let i = 0; i < 4; i += 1) spawnEnemy("zig", W * (.2 + i * .2), -25 - i * 48);
    } else if (event === "snipers") {
      spawnEnemy("sniper", W * .22);
      spawnEnemy("tank", W * .5, -80);
      spawnEnemy("sniper", W * .78, -140);
    } else if (event === "dodge") {
      pulseMessage(stageNumber === 2 ? "CROSSWIND STREAM\n風を読んでGRAZE" : "DANGER STREAM\nかすめてFROST UP", 2);
      for (let i = 0; i < 4; i += 1) spawnEnemy("zig", W * (.18 + i * .21), -30 - i * 65);
    } else if (event === "mid") {
      pulseMessage(stageNumber === 2 ? "MID BOSS\nMAGMA NARWHAL" : "MID BOSS\nHEAT WALRUS", 1.8);
      spawnEnemy("mid", W / 2, -55);
    } else if (event === "rest") {
      pulseMessage(stageNumber === 2 ? "AURORA EYE\n最終補給" : "COOL ZONE\nアイテム回収", 2);
      for (let i = 0; i < 7; i += 1) dropItem(W * (.16 + (i % 5) * .17), 80 + (i % 3) * 34, 1);
    } else if (event === "rush") {
      for (let i = 0; i < 7; i += 1) spawnEnemy(i % 3 === 0 ? "tank" : "scout", W * (.12 + (i % 5) * .19), -25 - i * 42);
    } else if (event === "boss") {
      warningTimer = 3;
      bossPending = true;
      ui.warning.classList.remove("hidden");
      sound.se("warning");
      shakeScreen(4, .5);
    }
  }
}
function firePlayer() {
  if (player.shot > 0) return;
  player.shot = player.level >= 2 ? .105 : .12;
  spawnShot(player.x - 7, player.y - 18, 0, -620, 1.1);
  spawnShot(player.x + 7, player.y - 18, 0, -620, 1.1);
  if (player.level >= 2) {
    spawnShot(player.x - 10, player.y - 10, -145, -570, .75);
    spawnShot(player.x + 10, player.y - 10, 145, -570, .75);
  }
  if (player.level >= 3 && player.missile <= 0) {
    player.missile = .58;
    spawnShot(player.x, player.y - 12, 0, -300, 3, 2);
  }
  sound.se("shot");
}

function nearestEnemy(x, y) {
  let best = null;
  let distance = Infinity;
  for (let i = 0; i < enemies.length; i += 1) {
    const e = enemies[i];
    if (!e.active) continue;
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d < distance) { distance = d; best = e; }
  }
  return best;
}

function updatePlayer(dt) {
  const left = keys.ArrowLeft || keys.KeyA;
  const right = keys.ArrowRight || keys.KeyD;
  const up = keys.ArrowUp || keys.KeyW;
  const down = keys.ArrowDown || keys.KeyS;
  const ax = (right ? 1 : 0) - (left ? 1 : 0);
  const ay = (down ? 1 : 0) - (up ? 1 : 0);
  if (pointers.size) {
    player.vx += (player.tx - player.x) * 38 * dt;
    player.vy += (player.ty - player.y) * 38 * dt;
  } else {
    player.vx += ax * 1700 * dt;
    player.vy += ay * 1700 * dt;
  }
  const drag = Math.pow(.0008, dt);
  player.vx *= drag;
  player.vy *= drag;
  const speed = Math.hypot(player.vx, player.vy);
  if (speed > 390) { player.vx *= 390 / speed; player.vy *= 390 / speed; }
  if (stageNumber === 2 && stageTime > 15 && stageTime < 37) player.vx += Math.sin(stageTime * .9) * 150 * dt;
  player.x = Math.max(19, Math.min(W - 19, player.x + player.vx * dt));
  player.y = Math.max(78, Math.min(H - 30, player.y + player.vy * dt));
  player.shot -= dt;
  player.missile -= dt;
  player.invuln = Math.max(0, player.invuln - dt);
  player.shield = Math.max(0, player.shield - dt);
  player.flash = Math.max(0, player.flash - dt);
  player.comboTimer -= dt;
  if (player.comboTimer <= 0 && player.combo > 0) {
    player.combo = 0;
    player.multiplier = Math.max(1, player.multiplier - dt * 1.5);
  }
  firePlayer();
}

function enemyFire(e) {
  const d = difficulty();
  const angle = aimedAngle(e.x, e.y);
  if (stageNumber === 2) { window.fireStage2Pattern(e, d, angle, spawnEnemyBullet); sound.se("warning"); return; }
  if (e.type === "scout") {
    spawnEnemyBullet(e.x, e.y, angle, 155 * d);
  } else if (e.type === "zig") {
    for (let i = -1; i <= 1; i += 1) spawnEnemyBullet(e.x, e.y, Math.PI / 2 + i * .32, 125 * d, 1);
  } else if (e.type === "sniper") {
    spawnEnemyBullet(e.x, e.y, angle, 235 * d, 2);
  } else if (e.type === "tank") {
    for (let i = 0; i < (d > 1.08 ? 8 : d < .9 ? 4 : 6); i += 1) spawnEnemyBullet(e.x, e.y, Math.PI * 2 * i / (d > 1.08 ? 8 : d < .9 ? 4 : 6) + e.age, 105 * d, 1);
  } else if (e.type === "mid") {
    for (let i = -2; i <= 2; i += 1) spawnEnemyBullet(e.x, e.y + 16, angle + i * .2, 145 * d, i === 0 ? 2 : 0);
  } else if (e.type === "boss") {
    if (e.phase === 1) {
      for (let i = 0; i < (d > 1.08 ? 12 : d < .9 ? 8 : 10); i += 1) spawnEnemyBullet(e.x, e.y + 30, Math.PI * 2 * i / (d > 1.08 ? 12 : d < .9 ? 8 : 10) + e.age * .3, 115 * d, 1);
    } else if (e.phase === 2) {
      for (let i = -3; i <= 3; i += 1) spawnEnemyBullet(e.x, e.y + 30, angle + i * .16, 155 * d, Math.abs(i) < 2 ? 2 : 0);
    } else {
      for (let i = 0; i < 14; i += 1) {
        const spiral = Math.PI * 2 * i / 14 + e.age * .65;
        spawnEnemyBullet(e.x, e.y + 28, spiral, 125 * d + (i % 2) * 38, i % 3 ? 0 : 2);
      }
    }
  }
  sound.se("warning");
}
function updateEnemy(e, dt) {
  e.age += dt;
  e.flash = Math.max(0, e.flash - dt);
  if (e.type === "scout") {
    e.y += e.vy * dt;
    e.x = e.baseX + Math.sin(e.age * 3.2) * 18;
  } else if (e.type === "zig") {
    e.y += e.vy * dt;
    e.x = e.baseX + Math.sin(e.age * 2.8) * Math.min(70, W * .17);
  } else if (e.type === "sniper" || e.type === "tank") {
    if (e.y < 120) e.y += e.vy * dt;
    e.x = e.baseX + Math.sin(e.age * 1.2) * 28;
  } else if (e.type === "mid") {
    if (e.y < 125) e.y += 55 * dt;
    e.x = W / 2 + Math.sin(e.age * 1.15) * W * .27;
  } else if (e.type === "boss") {
    if (e.y < 118) e.y += 48 * dt;
    else {
      const pace = e.phase === 3 ? 1.4 : e.phase === 2 ? 1.05 : .7;
      e.x = W / 2 + Math.sin(e.age * pace) * W * .29;
      e.y = 115 + Math.sin(e.age * .75) * 18;
    }
    const phase = e.hp > e.maxHp * .66 ? 1 : e.hp > e.maxHp * .33 ? 2 : 3;
    if (phase !== e.phase) {
      e.phase = phase;
      e.fire = 1.2;
      clearPool(enemyBullets);
      pulseMessage(`PHASE ${phase}\nWEAK CORE SHIFT`, 1.7);
      sound.se("phase");
      shakeScreen(6, .4);
    }
  }
  e.fire -= dt;
  const ready = e.y > 65 && e.age > 1.25;
  const interval = (e.type === "boss" ? (e.phase === 3 ? 1.05 : e.phase === 2 ? 1.3 : 1.55)
    : e.type === "mid" ? 1.65 : e.type === "sniper" ? 2.2 : e.type === "tank" ? 2 : 2.45) * (stageNumber === 2 ? .9 : 1);
  if (ready && e.fire <= .42 && !e.warned) {
    e.warned = .42;
    sound.se("warning");
  }
  if (e.warned > 0) e.warned -= dt;
  if (ready && e.fire <= 0) {
    enemyFire(e);
    e.fire = interval / difficulty();
    e.warned = 0;
  }
  if (e.y > H + 80) e.active = false;
}

function segmentDistanceSq(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len)) : 0;
  const x = x1 + dx * t, y = y1 + dy * t;
  return (px - x) ** 2 + (py - y) ** 2;
}

function damageEnemy(e, damage, hitX, hitY) {
  let dealt = damage;
  if (e.type === "boss") {
    const weakY = e.y + 24;
    const weak = (hitX - e.x) ** 2 + (hitY - weakY) ** 2 < 21 ** 2;
    dealt *= weak ? 1.7 : .35;
    if (weak) burst(hitX, hitY, "#ffd15c", 4, 65);
  }
  e.hp -= dealt;
  e.flash = .07;
  hitStop = Math.max(hitStop, .018);
  burst(hitX, hitY, "#9ffaff", 3, 55);
  sound.se("hit");
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
  const isLarge = e.type === "mid" || e.type === "boss";
  e.active = false;
  player.combo += 1;
  player.comboTimer = 2.2;
  player.multiplier = Math.min(8, 1 + player.combo * .12 + player.frost * .025);
  player.score += Math.round(e.value * player.multiplier);
  burst(e.x, e.y, isLarge ? "#ffbf57" : "#73efff", isLarge ? 32 : 12, isLarge ? 220 : 130);
  sound.se("kill");
  if (isLarge) shakeScreen(e.type === "boss" ? 10 : 7, e.type === "boss" ? .6 : .35);
  const drops = e.type === "boss" ? 0 : (e.type === "mid" ? 8 : e.type === "tank" ? 3 : 1) + (player.hp <= 40 ? 1 : 0);
  for (let i = 0; i < drops; i += 1) dropItem(e.x + (i - drops / 2) * 10, e.y, e.type === "mid" ? 2 : 1);
  if (e.type === "boss") beginVictory(e.x, e.y);
}

function collectItem(item) {
  item.active = false;
  player.xp += item.value;
  player.score += Math.round(80 * player.multiplier);
  const nextLevel = player.level === 1 && player.xp >= 8 ? 2 : player.level === 2 && player.xp >= 22 ? 3 : player.level;
  if (nextLevel !== player.level) {
    player.level = nextLevel;
    player.hp = Math.min(100, player.hp + 20);
    pulseMessage(`POWER ${player.level}\n${player.level === 2 ? "SPREAD SHOT" : "HOMING MISSILE"}`, 1.6);
    sound.se("level");
  }
}

function grazeBullet(b) {
  if (b.grazed) return;
  b.grazed = true;
  player.frost += 8;
  player.multiplier = Math.min(8, player.multiplier + .25);
  player.score += Math.round(60 * player.multiplier);
  burst(b.x, b.y, "#8ef5ff", 3, 45);
  sound.se("graze");
  if (player.frost >= 100) {
    player.frost -= 100;
    player.bombs = Math.min(5, player.bombs + 1);
    pulseMessage("ICE READY +1", 1);
    sound.se("level");
  }
}

function hurtPlayer() {
  if (player.invuln > 0 || player.shield > 0 || state !== "playing") return;
  player.hp = Math.max(0, player.hp - 25);
  player.invuln = 1.5;
  player.combo = 0;
  player.multiplier = Math.max(1, player.multiplier - 1);
  noDamage = false;
  clearPool(enemyBullets);
  burst(player.x, player.y, "#ff496c", 22, 180);
  shakeScreen(8, .35);
  sound.se("hurt");
  vibrate(35);
  if (player.hp <= 0) finishGame(false);
}

function useBomb() {
  if (state !== "playing" || player.bombs <= 0 || player.shield > 0) return;
  player.bombs -= 1;
  player.shield = 1.45;
  player.invuln = 1.7;
  let frozen = 0;
  for (let i = 0; i < enemyBullets.length; i += 1) {
    const b = enemyBullets[i];
    if (!b.active) continue;
    b.active = false;
    frozen += 1;
    if (frozen <= 18) {
      burst(b.x, b.y, "#bffcff", 3, 55);
      if (i % 3 === 0) dropItem(b.x, b.y, 1);
    }
  }
  player.score += frozen * Math.round(45 * player.multiplier);
  pulseMessage(`FROSTLINE!\n${frozen} BULLETS FROZEN`, 1.2);
  shakeScreen(5, .3);
  sound.se("bomb");
  vibrate(22);
}

function updateObjects(dt) {
  for (let i = 0; i < shots.length; i += 1) {
    const b = shots[i];
    if (!b.active) continue;
    b.px = b.x; b.py = b.y;
    if (b.type === 2) {
      const target = nearestEnemy(b.x, b.y);
      if (target) {
        const desired = Math.atan2(target.y - b.y, target.x - b.x);
        const speed = Math.max(320, Math.hypot(b.vx, b.vy));
        b.vx += (Math.cos(desired) * speed - b.vx) * Math.min(1, dt * 5);
        b.vy += (Math.sin(desired) * speed - b.vy) * Math.min(1, dt * 5);
      }
    }
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0 || b.y < -30 || b.x < -30 || b.x > W + 30) b.active = false;
    if (!b.active) continue;
    for (let j = 0; j < enemies.length; j += 1) {
      const e = enemies[j];
      if (!e.active) continue;
      const rr = e.r + b.r + 2;
      if (segmentDistanceSq(e.x, e.y, b.px, b.py, b.x, b.y) <= rr * rr) {
        b.active = false;
        damageEnemy(e, b.damage, b.x, b.y);
        break;
      }
    }
  }
  for (let i = 0; i < enemyBullets.length; i += 1) {
    const b = enemyBullets[i];
    if (!b.active) continue;
    b.px = b.x; b.py = b.y;
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0 || b.y < -35 || b.y > H + 35 || b.x < -35 || b.x > W + 35) b.active = false;
    if (!b.active) continue;
    const hitR = b.r + 5;
    if (segmentDistanceSq(player.x, player.y, b.px, b.py, b.x, b.y) <= hitR * hitR) {
      b.active = false;
      hurtPlayer();
    } else {
      const grazeR = b.r + 28;
      if (segmentDistanceSq(player.x, player.y, b.px, b.py, b.x, b.y) <= grazeR * grazeR) grazeBullet(b);
    }
  }
  for (let i = 0; i < enemies.length; i += 1) {
    const e = enemies[i];
    if (!e.active) continue;
    updateEnemy(e, dt);
    const rr = e.r + 7;
    if ((e.x - player.x) ** 2 + (e.y - player.y) ** 2 < rr * rr) hurtPlayer();
  }
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!item.active) continue;
    const dx = player.x - item.x;
    const dy = player.y - item.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 125) {
      item.vx += dx * dt * 18;
      item.vy += dy * dt * 18;
    }
    item.x += item.vx * dt; item.y += item.vy * dt; item.life -= dt;
    item.vx *= Math.pow(.1, dt);
    if (dist < 18) collectItem(item);
    else if (item.life <= 0 || item.y > H + 20) item.active = false;
  }
  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    if (!p.active) continue;
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 45 * dt; p.life -= dt;
    if (p.life <= 0) p.active = false;
  }
}

function updateHud() {
  ui.score.textContent = String(Math.max(0, Math.floor(player.score))).padStart(7, "0");
  ui.multiplier.textContent = player.multiplier.toFixed(1);
  ui.power.textContent = String(player.level);
  ui.bombs.textContent = String(player.bombs);
  ui.hp.style.transform = `scaleX(${player.hp / 100})`;
  ui.frost.style.transform = `scaleX(${player.frost / 100})`;
  if (currentBoss && currentBoss.active) {
    ui.bossFill.style.transform = `scaleX(${Math.max(0, currentBoss.hp / currentBoss.maxHp)})`;
    ui.bossPhase.textContent = `PHASE ${currentBoss.phase} / WEAK CORE`;
  }
}

function update(dt) {
  if (messageTimer > 0) {
    messageTimer -= dt;
    if (messageTimer <= 0) ui.message.classList.remove("show");
  }
  if (state === "playing") {
    stageTime += dt;
    bgScroll += dt * 58;
    runTimeline();
    if (warningTimer > 0) {
      warningTimer -= dt;
      if (warningTimer <= 0) {
        ui.warning.classList.add("hidden");
        if (bossPending) {
          bossPending = false;
          spawnEnemy("boss", W / 2, -80);
          pulseMessage(stageNumber === 2 ? "THE MAGMA ORCA\nAURORA CORE EXPOSED" : "THE BOILER ALBATROSS\nCORE IS WEAK", 2);
        }
      }
    }
    updatePlayer(dt);
    updateObjects(dt);
    updateHud();
  } else if (state === "bossDeath") {
    bgScroll += dt * 22;
    slowMotion -= dt;
    if (Math.random() < dt * 18 && currentBoss) {
      const x = currentBoss.x + (Math.random() - .5) * 110;
      const y = currentBoss.y + (Math.random() - .5) * 80;
      burst(x, y, Math.random() > .5 ? "#ffb64a" : "#9ffaff", 12, 160);
      sound.se("kill");
    }
    updateObjects(dt * .25);
    if (slowMotion <= 0 && !finalizing) {
      finalizing = true;
      if (stageNumber === 1) window.startFrostlineStage2(); else finishGame(true);
    }
  }
  shake = Math.max(0, shake - dt);
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, stageNumber === 2 ? "#240b30" : currentBoss ? "#190d2d" : "#061728");
  gradient.addColorStop(.55, stageNumber === 2 ? "#5a153b" : "#0a3551");
  gradient.addColorStop(1, stageNumber === 2 ? "#d54a34" : "#0e6070");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < stars.length; i += 1) {
    const s = stars[i];
    const y = (s.y * H + bgScroll * s.z) % H;
    ctx.globalAlpha = .25 + s.z * .55;
    ctx.fillStyle = "#d9fbff";
    ctx.fillRect(s.x * W, y, 1 + s.z * 2, 5 + s.z * 9);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#8defff18";
  ctx.lineWidth = 1;
  for (let y = (bgScroll * .55) % 70; y < H; y += 70) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y - 22);
    ctx.stroke();
  }
  ctx.fillStyle = "#bafaff10";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(W * .28, H * .72);
  ctx.lineTo(W * .46, H);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, H);
  ctx.lineTo(W * .72, H * .68);
  ctx.lineTo(W * .55, H);
  ctx.fill();
  if (stageNumber === 2) window.drawStage2Sky(ctx, W, H, bgScroll);
}

function drawPenguin() {
  if (player.invuln > 0 && Math.floor(player.invuln * 14) % 2 === 0) return;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.vx * .001);
  if (player.shield > 0) {
    ctx.strokeStyle = "#aefaff";
    ctx.lineWidth = 3;
    ctx.globalAlpha = .55 + Math.sin(performance.now() * .025) * .2;
    ctx.beginPath();
    ctx.arc(0, 0, 32 + Math.sin(performance.now() * .02) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "#09131e";
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f1fdff";
  ctx.beginPath();
  ctx.ellipse(0, 5, 11, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8ef5ff";
  ctx.beginPath();
  ctx.moveTo(-16, 1); ctx.lineTo(-29, 14); ctx.lineTo(-12, 10);
  ctx.moveTo(16, 1); ctx.lineTo(29, 14); ctx.lineTo(12, 10);
  ctx.fill();
  ctx.fillStyle = "#ffd15c";
  ctx.beginPath();
  ctx.moveTo(0, -5); ctx.lineTo(-5, 0); ctx.lineTo(5, 0); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(-8, -11, 4, 4); ctx.fillRect(4, -11, 4, 4);
  ctx.fillStyle = "#ff496c";
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.warned > 0) {
    ctx.strokeStyle = "#ff496c";
    ctx.lineWidth = 3;
    ctx.globalAlpha = .35 + Math.sin(performance.now() * .04) * .25;
    ctx.beginPath(); ctx.arc(0, 0, e.r + 9 + e.warned * 14, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const large = e.type === "boss" || e.type === "mid";
  ctx.fillStyle = e.flash > 0 ? "#fff" : stageNumber === 2 ? (large ? "#32124f" : "#661f42") : large ? "#5b173a" : e.type === "tank" ? "#32465c" : "#173146";
  ctx.strokeStyle = stageNumber === 2 ? (large ? "#c96cff" : "#ff7b47") : large ? "#ff6380" : "#ffb34f";
  ctx.lineWidth = large ? 4 : 2;
  ctx.beginPath();
  if (large) {
    ctx.ellipse(0, 0, e.r, e.r * .68, 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(0, e.r); ctx.lineTo(-e.r, -e.r * .55); ctx.lineTo(0, -e.r * .25); ctx.lineTo(e.r, -e.r * .55); ctx.closePath();
  }
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ffb24a";
  ctx.fillRect(-e.r * .45, -4, e.r * .9, 8);
  if (large) {
    ctx.fillStyle = "#ffd15c";
    ctx.shadowColor = "#ff4f67";
    ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(0, 24, e.type === "boss" ? 17 : 10, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawObjects() {
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!item.active) continue;
    ctx.fillStyle = "#9ffaff";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(item.x, item.y - 8); ctx.lineTo(item.x + 7, item.y); ctx.lineTo(item.x, item.y + 8); ctx.lineTo(item.x - 7, item.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  for (let i = 0; i < shots.length; i += 1) {
    const b = shots[i];
    if (!b.active) continue;
    ctx.strokeStyle = b.type === 2 ? "#ffd15c" : "#9ffaff";
    ctx.lineWidth = b.type === 2 ? 5 : 3;
    ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.moveTo(b.px, b.py + 8); ctx.lineTo(b.x, b.y - 8); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  for (let i = 0; i < enemies.length; i += 1) if (enemies[i].active) drawEnemy(enemies[i]);
  for (let i = 0; i < enemyBullets.length; i += 1) {
    const b = enemyBullets[i];
    if (!b.active) continue;
    const color = b.color === 2 ? "#fff04f" : b.color === 1 ? "#ff72df" : "#ff496c";
    ctx.fillStyle = color;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.shadowColor = color; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  drawPenguin();
  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    if (!p.active) continue;
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function draw() {
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - .5) * shakePower, (Math.random() - .5) * shakePower);
  drawBackground();
  if (state === "playing" || state === "bossDeath") drawObjects();
  ctx.restore();
}

function beginVictory(x, y) {
  state = "bossDeath";
  slowMotion = 2.1;
  currentBoss = { x, y, phase: 3, active: false };
  clearPool(enemyBullets);
  pulseMessage(stageNumber === 1 ? "CORE FROZEN\nSTAGE CLEAR" : "AURORA CORE FROZEN\nMISSION COMPLETE", 2);
  vibrate(45);
}

function loadScores() {
  try {
    const parsed = JSON.parse(localStorage.getItem("frostlineTop5") || "[]");
    return Array.isArray(parsed) ? parsed.filter(Number.isFinite).slice(0, 5) : [];
  } catch { return []; }
}

function renderScores() {
  const scores = loadScores();
  ui.best.textContent = `BEST ${String(scores[0] || 0).padStart(7, "0")}`; ui.top.textContent = "";
  scores.forEach((score) => {
    const li = document.createElement("li");
    li.textContent = String(score).padStart(7, "0");
    ui.top.appendChild(li);
  });
}

function saveScore(score) {
  const scores = loadScores();
  scores.push(score);
  scores.sort((a, b) => b - a);
  scores.length = Math.min(5, scores.length);
  try { localStorage.setItem("frostlineTop5", JSON.stringify(scores)); } catch {}
}

function finishGame(won) {
  if (state === "result") return;
  state = "result";
  const score = Math.floor(player.score + (won && noDamage ? 50000 : 0));
  saveScore(score);
  ui.hud.classList.add("hidden");
  ui.bomb.classList.add("hidden");
  ui.bossHud.classList.add("hidden");
  ui.warning.classList.add("hidden");
  ui.final.textContent = String(score).padStart(7, "0");
  ui.resultKicker.textContent = won ? "MISSION COMPLETE" : "MISSION FAILED";
  ui.resultTitle.textContent = won ? "二つの空を奪還！" : "翼はまだ凍らない";
  const rank = won ? (score >= 150000 ? "S" : score >= 90000 ? "A" : "B") : score >= 50000 ? "C" : "D";
  ui.rank.textContent = `RANK ${rank}`;
  ui.achievement.textContent = won && noDamage ? "🏆 NO DAMAGE / AURORA ACE" : player.multiplier >= 5 ? "🏆 FROSTLINE RIDER" : "グレイズで倍率を上げよう";
  renderScores();
  showScreen(ui.result);
}

function returnTitle() {
  state = "title";
  currentBoss = null;
  ui.hud.classList.add("hidden");
  ui.bomb.classList.add("hidden");
  ui.bossHud.classList.add("hidden");
  showScreen(ui.title);
  renderScores();
  sound.se("decide");
}

function loop(time) {
  const rawDt = lastTime ? (time - lastTime) / 1000 : 0;
  lastTime = time;
  const dt = Math.min(1 / 30, Math.max(0, rawDt));
  if (hitStop > 0) hitStop -= dt;
  else update(dt);
  draw();
  window.requestAnimationFrame(loop);
}

function setPointerTarget(event) {
  const rect = canvas.getBoundingClientRect();
  player.tx = Math.max(19, Math.min(W - 19, event.clientX - rect.left));
  player.ty = Math.max(78, Math.min(H - 30, event.clientY - rect.top));
}

canvas.addEventListener("pointerdown", (event) => {
  if (state !== "playing") return;
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, true);
  setPointerTarget(event);
});
canvas.addEventListener("pointermove", (event) => {
  if (pointers.has(event.pointerId)) setPointerTarget(event);
});
function releasePointer(event) { pointers.delete(event.pointerId); }
canvas.addEventListener("pointerup", releasePointer);
canvas.addEventListener("pointercancel", releasePointer);

ui.bomb.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  ui.bomb.setPointerCapture(event.pointerId);
  ui.bomb.classList.add("pressed");
  useBomb();
});
["pointerup", "pointercancel"].forEach((name) => ui.bomb.addEventListener(name, () => ui.bomb.classList.remove("pressed")));

document.addEventListener("keydown", (event) => {
  const controlled = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD", "Space", "KeyZ", "KeyX"];
  if (controlled.includes(event.code)) event.preventDefault();
  keys[event.code] = true;
  if (event.code === "KeyX" && !event.repeat) useBomb();
  if (event.code === "Space" || event.code === "KeyZ" || event.code === "Enter") {
    if (state === "title") { sound.init(); showScreen(ui.how); } else if (state === "how") resetGame(); else if (state === "result") returnTitle();
  }
});
document.addEventListener("keyup", (event) => { keys[event.code] = false; });

$("startButton").addEventListener("pointerdown", () => {
  sound.init();
  sound.se("decide");
  vibrate(12);
  showScreen(ui.how);
});
$("playButton").addEventListener("pointerdown", () => {
  sound.init();
  vibrate(12);
  resetGame();
});
$("retryButton").addEventListener("pointerdown", returnTitle);
ui.mute.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  sound.init();
  sound.toggle();
  vibrate(8);
});

let lastTouchEnd = 0;
document.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });
document.addEventListener("touchend", (event) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) event.preventDefault();
  lastTouchEnd = now;
}, { passive: false });
["dblclick", "contextmenu", "selectstart", "dragstart"].forEach((name) => {
  document.addEventListener(name, (event) => event.preventDefault());
});

function resumeAudio() {
  sound.resume(); lastTime = performance.now();
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) resumeAudio();
});
window.addEventListener("pageshow", resumeAudio);
window.addEventListener("focus", resumeAudio);
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => window.setTimeout(resize, 120));
window.addEventListener("error", () => ui.fatal.classList.remove("hidden"));
window.addEventListener("unhandledrejection", () => ui.fatal.classList.remove("hidden"));

resize();
renderScores();
window.requestAnimationFrame(loop);
