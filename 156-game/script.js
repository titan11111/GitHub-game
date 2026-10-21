// ===========================
// ゲーム雛形 - script.js
// このフォルダを複製し、以下を編集してゲームを作成してください
// ===========================

// --- 設定（定数のみ。ゲームに合わせて変更） ---
const GameState = {
  START: 'start',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover',
  CLEAR: 'clear',
};

const KEYS = {
  LEFT: ['ArrowLeft', 'a', 'A'],
  RIGHT: ['ArrowRight', 'd', 'D'],
  UP: ['ArrowUp', 'w', 'W', ' '],
  DOWN: ['ArrowDown', 's', 'S'],
  ACTION: ['z', 'Z', 'j', 'J', 'Enter'],
  PAUSE: ['Escape', 'p', 'P'],
};

const COLORS = {
  bg: '#0f0f1a',
  ground: '#4a4a6a',
  accent: '#f0c040',
  danger: '#ff6b6b',
  text: '#ffffff',
};

const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

// --- Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const container = document.getElementById('gameContainer');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// --- モバイル・タッチ防止 ---
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
if (isMobile) {
  document.getElementById('mobileControls').classList.remove('hidden');
}

document.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, false);

// --- 入力 ---
const input = { left: false, right: false, up: false, down: false, action: false };
const keysDown = new Set();

document.addEventListener('keydown', (e) => {
  keysDown.add(e.key);
  if (KEYS.LEFT.includes(e.key)) input.left = true;
  if (KEYS.RIGHT.includes(e.key)) input.right = true;
  if (KEYS.UP.includes(e.key)) { input.up = true; e.preventDefault(); }
  if (KEYS.DOWN.includes(e.key)) input.down = true;
  if (KEYS.ACTION.includes(e.key)) input.action = true;
  if (KEYS.PAUSE.includes(e.key)) togglePause();
});

document.addEventListener('keyup', (e) => {
  keysDown.delete(e.key);
  if (KEYS.LEFT.includes(e.key)) input.left = false;
  if (KEYS.RIGHT.includes(e.key)) input.right = false;
  if (KEYS.UP.includes(e.key)) input.up = false;
  if (KEYS.DOWN.includes(e.key)) input.down = false;
  if (KEYS.ACTION.includes(e.key)) input.action = false;
});

function bindMobileBtn(id, key) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('touchstart', (e) => { input[key] = true; e.preventDefault(); }, { passive: false });
  btn.addEventListener('touchend', (e) => { input[key] = false; e.preventDefault(); }, { passive: false });
}
bindMobileBtn('btnLeft', 'left');
bindMobileBtn('btnRight', 'right');
bindMobileBtn('btnUp', 'up');
bindMobileBtn('btnAction', 'action');

// --- Web Audio（ユーザー操作後に初期化） ---
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playSound(frequency, duration = 0.1, type = 'square') {
  try {
    const ac = getAudioContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ac.currentTime);
    gain.gain.setValueAtTime(0.25, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch (_) {}
}

// --- ゲーム状態 ---
let state = GameState.START;
let player = null;
let score = 0;
let frameCount = 0;

function setState(newState) {
  state = newState;
  document.getElementById('startScreen').classList.toggle('hidden', state !== GameState.START);
  document.getElementById('gameoverScreen').classList.toggle('hidden', state !== GameState.GAMEOVER);
  document.getElementById('clearScreen').classList.toggle('hidden', state !== GameState.CLEAR);
}

function togglePause() {
  if (state === GameState.PLAYING) state = GameState.PAUSED;
  else if (state === GameState.PAUSED) state = GameState.PLAYING;
}

// --- プレイヤー（雛形：四角が左右移動するだけ） ---
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 32;
    this.h = 32;
    this.speed = 4;
  }

  update(inp) {
    if (inp.left) this.x -= this.speed;
    if (inp.right) this.x += this.speed;
    this.x = Math.max(0, Math.min(canvas.width - this.w, this.x));
  }

  draw(c) {
    c.fillStyle = COLORS.accent;
    c.fillRect(this.x, this.y, this.w, this.h);
  }
}

// --- 初期化 ---
function initGame() {
  const w = canvas.width;
  const h = canvas.height;
  player = new Player(w / 2 - 16, h - 80);
  score = 0;
  frameCount = 0;
  setState(GameState.PLAYING);
  getAudioContext();
}

// --- 更新 ---
function update() {
  if (state !== GameState.PLAYING) return;
  frameCount++;
  if (player) player.update(input);
  // ここに敵・アイテム・当たり判定などを追加
}

// --- 描画 ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state === GameState.PLAYING || state === GameState.PAUSED) {
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    if (player) player.draw(ctx);

    ctx.fillStyle = COLORS.text;
    ctx.font = `bold ${Math.round(canvas.width * 0.05)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(`スコア: ${score}`, 12, 32);

    if (state === GameState.PAUSED) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = COLORS.text;
      ctx.font = `bold ${Math.round(canvas.width * 0.1)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('PAUSE', canvas.width / 2, canvas.height / 2);
      ctx.textAlign = 'left';
    }
  }
}

// --- ゲームループ ---
let lastTime = 0;
function gameLoop(timestamp) {
  const delta = timestamp - lastTime;
  if (delta >= FRAME_TIME) {
    lastTime = timestamp - (delta % FRAME_TIME);
    update();
    draw();
  }
  requestAnimationFrame(gameLoop);
}

// --- ボタン ---
document.getElementById('startBtn').addEventListener('click', initGame);
document.getElementById('retryBtn').addEventListener('click', initGame);
document.getElementById('clearRetryBtn').addEventListener('click', initGame);

// --- 起動 ---
setState(GameState.START);
requestAnimationFrame(gameLoop);
