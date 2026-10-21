const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const W = cv.width;
const H = cv.height;

// 入力
const keys = {};
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => {
  keys[e.code] = false;
});

// iOS Safari向けの誤操作防止
let lastTap = 0;
document.addEventListener('touchstart', e => {
  const now = Date.now();
  if (now - lastTap < 300) e.preventDefault();
  lastTap = now;
}, { passive: false });
document.addEventListener('touchmove', e => {
  e.preventDefault();
}, { passive: false });
document.addEventListener('dblclick', e => {
  e.preventDefault();
});
document.addEventListener('contextmenu', e => {
  e.preventDefault();
});

// プレイヤー
const player = {
  x: 80, y: H / 2, w: 28, h: 14,
  speed: 4, cd: 0, power: 1, alive: true, invincible: 0
};

let bullets = [];
let enemies = [];
let eBullets = [];
let powerups = [];
let particles = [];
let stars = [];

let score = 0;
let lives = 3;
let frame = 0;
let gameOver = false;

for (let i = 0; i < 80; i++) {
  stars.push({
    x: Math.random() * W,
    y: Math.random() * H,
    s: Math.random() * 2 + 0.5
  });
}

function spawnEnemy() {
  const type = Math.random() < 0.25 ? 'wave' : 'straight';
  const enemy = {
    x: W + 20,
    y: Math.random() * (H - 60) + 30,
    w: 26,
    h: 20,
    type,
    hp: type === 'wave' ? 2 : 1,
    baseY: 0,
    t: Math.random() * Math.PI * 2,
    cd: 60 + Math.random() * 60,
    speed: 2 + Math.random() * 1.5
  };
  enemy.baseY = enemy.y;
  enemies.push(enemy);
}

function spawnPowerup(x, y) {
  powerups.push({ x, y, w: 16, h: 16, t: 0 });
}

function addParticles(x, y, color, n = 12) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = Math.random() * 4 + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 30,
      color
    });
  }
}

function rectHit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  frame++;

  for (const s of stars) {
    s.x -= s.s;
    if (s.x < 0) {
      s.x = W;
      s.y = Math.random() * H;
    }
  }

  if (gameOver) return;

  if (player.alive) {
    if (keys.ArrowUp || keys.KeyW) player.y -= player.speed;
    if (keys.ArrowDown || keys.KeyS) player.y += player.speed;
    if (keys.ArrowLeft || keys.KeyA) player.x -= player.speed;
    if (keys.ArrowRight || keys.KeyD) player.x += player.speed;
    player.x = Math.max(0, Math.min(W - player.w, player.x));
    player.y = Math.max(0, Math.min(H - player.h, player.y));

    if ((keys.Space || keys.KeyZ) && player.cd <= 0) {
      const interval = Math.max(6, 14 - player.power * 2);
      player.cd = interval;
      bullets.push({ x: player.x + player.w, y: player.y + player.h / 2 - 2, w: 12, h: 4, vx: 9 });
      if (player.power >= 3) {
        bullets.push({ x: player.x + player.w, y: player.y, w: 12, h: 4, vx: 8.5, vy: -1.2 });
        bullets.push({ x: player.x + player.w, y: player.y + player.h, w: 12, h: 4, vx: 8.5, vy: 1.2 });
      }
    }
    if (player.cd > 0) player.cd--;
    if (player.invincible > 0) player.invincible--;
  }

  bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy || 0;
  });
  bullets = bullets.filter(b => b.x < W + 20);

  if (frame % Math.max(30, 70 - Math.floor(frame / 600)) === 0) spawnEnemy();

  enemies.forEach(e => {
    e.x -= e.speed;
    if (e.type === 'wave') {
      e.t += 0.08;
      e.y = e.baseY + Math.sin(e.t) * 40;
    }
    e.cd--;
    if (e.cd <= 0 && e.x < W - 40 && player.alive) {
      e.cd = 90 + Math.random() * 60;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      eBullets.push({ x: e.x, y: e.y + e.h / 2, w: 8, h: 8, vx: dx / d * 3.5, vy: dy / d * 3.5 });
    }
  });
  enemies = enemies.filter(e => e.x > -40);

  eBullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
  });
  eBullets = eBullets.filter(b => b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);

  powerups.forEach(p => {
    p.x -= 1.5;
    p.t += 0.1;
  });
  powerups = powerups.filter(p => p.x > -20);

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });
  particles = particles.filter(p => p.life > 0);

  bullets.forEach(b => {
    enemies.forEach(e => {
      if (!rectHit(b, e)) return;
      b.dead = true;
      e.hp--;
      addParticles(b.x, b.y, '#ff0', 5);
      if (e.hp <= 0) {
        e.dead = true;
        score += 100;
        addParticles(e.x + e.w / 2, e.y + e.h / 2, '#f80', 16);
        if (Math.random() < 0.18) spawnPowerup(e.x, e.y);
      }
    });
  });
  bullets = bullets.filter(b => !b.dead);
  enemies = enemies.filter(e => !e.dead);

  if (player.alive && player.invincible <= 0) {
    const hitByBullet = eBullets.some(b => rectHit(b, player));
    const hitByEnemy = enemies.some(e => rectHit(e, player));
    if (hitByBullet || hitByEnemy) damagePlayer();
  }

  powerups.forEach(p => {
    if (!player.alive || !rectHit(p, player)) return;
    p.x = -100;
    player.power = Math.min(4, player.power + 1);
    score += 50;
    addParticles(player.x, player.y, '#0ff', 10);
  });
  powerups = powerups.filter(p => p.x > -50);
}

function damagePlayer() {
  lives--;
  addParticles(player.x + player.w / 2, player.y + player.h / 2, '#f00', 24);
  player.power = Math.max(1, player.power - 1);
  player.invincible = 120;
  if (lives < 0) {
    player.alive = false;
    gameOver = true;
  } else {
    player.x = 80;
    player.y = H / 2;
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.globalAlpha = s.s / 2.5;
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#ff5';
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

  eBullets.forEach(b => {
    ctx.fillStyle = '#f44';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  enemies.forEach(e => {
    ctx.fillStyle = e.type === 'wave' ? '#f0a' : '#0f8';
    ctx.beginPath();
    ctx.moveTo(e.x, e.y + e.h / 2);
    ctx.lineTo(e.x + e.w, e.y);
    ctx.lineTo(e.x + e.w, e.y + e.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(e.x + 4, e.y + e.h / 2 - 2, 4, 4);
  });

  powerups.forEach(p => {
    ctx.fillStyle = `hsl(${(p.t * 60) % 360},100%,60%)`;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#000';
    ctx.font = '12px monospace';
    ctx.fillText('P', p.x + 4, p.y + 12);
  });

  particles.forEach(p => {
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  });
  ctx.globalAlpha = 1;

  if (player.alive && (player.invincible === 0 || frame % 8 < 4)) {
    ctx.fillStyle = '#0cf';
    ctx.beginPath();
    ctx.moveTo(player.x + player.w, player.y + player.h / 2);
    ctx.lineTo(player.x, player.y);
    ctx.lineTo(player.x + 8, player.y + player.h / 2);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fa0';
    ctx.fillRect(player.x - 6 - (frame % 6), player.y + player.h / 2 - 2, 6, 4);
  }

  ctx.fillStyle = '#0ff';
  ctx.font = '16px monospace';
  ctx.fillText('SCORE: ' + score, 10, 22);
  ctx.fillText('LIVES: ' + Math.max(0, lives), 10, 42);
  ctx.fillText('POWER: ' + player.power, 10, 62);

  if (!gameOver) return;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f44';
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
  ctx.fillStyle = '#0ff';
  ctx.font = '18px monospace';
  ctx.fillText('SCORE: ' + score, W / 2, H / 2 + 25);
  ctx.fillText('Rキーでリスタート', W / 2, H / 2 + 55);
  ctx.textAlign = 'left';
}

addEventListener('keydown', e => {
  if (e.code === 'KeyR' && gameOver) location.reload();
});

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
