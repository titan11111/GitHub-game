(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const W = 320;
  const H = 400;
  const keys = Object.create(null);
  const colors = {
    ink: '#05070b',
    dim: '#26374c',
    cyan: '#55e6ff',
    lime: '#b8f34a',
    orange: '#ff9d3d',
    white: '#eef8ff',
    red: '#ff4b54'
  };

  const FONT = {
    'A':['01110','10001','10001','11111','10001','10001','10001'],
    'B':['11110','10001','10001','11110','10001','10001','11110'],
    'C':['01111','10000','10000','10000','10000','10000','01111'],
    'D':['11110','10001','10001','10001','10001','10001','11110'],
    'E':['11111','10000','10000','11110','10000','10000','11111'],
    'F':['11111','10000','10000','11110','10000','10000','10000'],
    'G':['01111','10000','10000','10111','10001','10001','01111'],
    'H':['10001','10001','10001','11111','10001','10001','10001'],
    'I':['11111','00100','00100','00100','00100','00100','11111'],
    'J':['00111','00010','00010','00010','10010','10010','01100'],
    'K':['10001','10010','10100','11000','10100','10010','10001'],
    'L':['10000','10000','10000','10000','10000','10000','11111'],
    'M':['10001','11011','10101','10101','10001','10001','10001'],
    'N':['10001','11001','10101','10011','10001','10001','10001'],
    'O':['01110','10001','10001','10001','10001','10001','01110'],
    'P':['11110','10001','10001','11110','10000','10000','10000'],
    'Q':['01110','10001','10001','10001','10101','10010','01101'],
    'R':['11110','10001','10001','11110','10100','10010','10001'],
    'S':['01111','10000','10000','01110','00001','00001','11110'],
    'T':['11111','00100','00100','00100','00100','00100','00100'],
    'U':['10001','10001','10001','10001','10001','10001','01110'],
    'V':['10001','10001','10001','10001','10001','01010','00100'],
    'W':['10001','10001','10001','10101','10101','11011','10001'],
    'X':['10001','10001','01010','00100','01010','10001','10001'],
    'Y':['10001','10001','01010','00100','00100','00100','00100'],
    'Z':['11111','00001','00010','00100','01000','10000','11111'],
    '0':['01110','10001','10011','10101','11001','10001','01110'],
    '1':['00100','01100','00100','00100','00100','00100','01110'],
    '2':['01110','10001','00001','00010','00100','01000','11111'],
    '3':['11110','00001','00001','01110','00001','00001','11110'],
    '4':['00010','00110','01010','10010','11111','00010','00010'],
    '5':['11111','10000','10000','11110','00001','00001','11110'],
    '6':['01110','10000','10000','11110','10001','10001','01110'],
    '7':['11111','00001','00010','00100','01000','01000','01000'],
    '8':['01110','10001','10001','01110','10001','10001','01110'],
    '9':['01110','10001','10001','01111','00001','00001','01110'],
    '-':['00000','00000','00000','11111','00000','00000','00000'],
    '!':['00100','00100','00100','00100','00100','00000','00100'],
    '.':['00000','00000','00000','00000','00000','00000','00100'],
    ' ':['00000','00000','00000','00000','00000','00000','00000']
  };

  const SPRITES = {
    player: [
      '00000100000',
      '00001110000',
      '00011111000',
      '01111111110',
      '11111111111',
      '11111111111'
    ],
    invader0: [
      ['00100100','00011000','00111100','01111110','11011011','11111111','10100101','00100100'],
      ['00100100','10011001','10111101','11111111','01011010','01111110','01000010','10000001']
    ],
    invader1: [
      ['00011000','00111100','01111110','11011011','11111111','00100100','01011010','10100101'],
      ['00011000','00111100','01111110','11011011','11111111','01011010','10000001','01000010']
    ],
    invader2: [
      ['00111100','01111110','11111111','10111101','11111111','00100100','01000010','10000001'],
      ['00111100','01111110','11111111','10111101','11111111','01011010','10100101','01000010']
    ],
    ufo: [
      '000111111000',
      '011111111110',
      '111011110111',
      '111111111111',
      '001100001100'
    ]
  };

  let audioCtx = null;
  let noiseBuffer = null;
  let state = 'title';
  let score = 0;
  let highScore = Number(localStorage.getItem('starline-high') || 0);
  let lives = 3;
  let level = 1;
  let nextLife = 1000;
  let player;
  let enemies = [];
  let playerBullet = null;
  let enemyBullets = [];
  let barriers = [];
  let particles = [];
  let ufo = null;
  let enemyDir = 1;
  let enemyStepTimer = 0;
  let enemyShotTimer = 0;
  let ufoTimer = 0;
  let stateTimer = 0;
  let frame = 0;
  let musicTimer = 0;
  let musicStep = 0;

  function getAudio() {
    if (!audioCtx) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioClass) return null;
      audioCtx = new AudioClass();
      const length = Math.floor(audioCtx.sampleRate * 0.08);
      noiseBuffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, duration, type = 'square', volume = 0.035, slide = 0) {
    const ac = getAudio();
    if (!ac) return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  function noise(duration = 0.05, volume = 0.025) {
    const ac = getAudio();
    if (!ac || !noiseBuffer) return;
    const now = ac.currentTime;
    const source = ac.createBufferSource();
    const gain = ac.createGain();
    source.buffer = noiseBuffer;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(gain).connect(ac.destination);
    source.start(now);
    source.stop(now + duration);
  }

  function sound(name) {
    if (name === 'shoot') tone(680, 0.07, 'square', 0.025, -390);
    if (name === 'enemy') tone(130, 0.06, 'square', 0.025, 30);
    if (name === 'hit') { tone(100, 0.22, 'sawtooth', 0.045, -60); noise(0.12, 0.04); }
    if (name === 'ufo') tone(900, 0.16, 'square', 0.035, -400);
    if (name === 'start') { tone(220, 0.08); setTimeout(() => tone(440, 0.12), 90); }
  }

  function playMusic(dt) {
    if (state !== 'playing' || !audioCtx) return;
    musicTimer -= dt;
    if (musicTimer > 0) return;
    musicTimer = 0.18;
    const melody = [330, 0, 392, 0, 440, 392, 330, 262];
    const bass = [82, 82, 98, 98, 110, 98, 82, 65];
    const index = musicStep % melody.length;
    if (melody[index]) tone(melody[index], 0.09, 'square', 0.009);
    tone(bass[index], 0.12, 'triangle', 0.016);
    if (index % 2 === 0) noise(0.025, 0.008);
    musicStep += 1;
  }

  function textWidth(text, scale) {
    return text.length * 6 * scale - scale;
  }

  function drawText(text, x, y, scale = 1, color = colors.white, align = 'left') {
    const value = String(text).toUpperCase();
    let startX = x;
    if (align === 'center') startX -= Math.floor(textWidth(value, scale) / 2);
    if (align === 'right') startX -= textWidth(value, scale);
    ctx.fillStyle = color;
    for (let c = 0; c < value.length; c += 1) {
      const glyph = FONT[value[c]] || FONT[' '];
      for (let row = 0; row < 7; row += 1) {
        for (let col = 0; col < 5; col += 1) {
          if (glyph[row][col] === '1') {
            ctx.fillRect((startX + c * 6 * scale + col * scale) | 0, (y + row * scale) | 0, scale, scale);
          }
        }
      }
    }
  }

  function drawSprite(sprite, x, y, color, scale = 1) {
    ctx.fillStyle = color;
    for (let row = 0; row < sprite.length; row += 1) {
      for (let col = 0; col < sprite[row].length; col += 1) {
        if (sprite[row][col] === '1') {
          ctx.fillRect((x + col * scale) | 0, (y + row * scale) | 0, scale, scale);
        }
      }
    }
  }

  function addScore(points) {
    score += points;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('starline-high', String(highScore));
    }
    if (score >= nextLife && lives < 5) {
      lives += 1;
      nextLife += 1000;
      tone(880, 0.18, 'square', 0.04);
    }
  }

  function makeBarriers() {
    barriers = [];
    const pattern = [
      '001111111100',
      '011111111110',
      '111111111111',
      '111111111111',
      '111100001111',
      '111000000111'
    ];
    [38, 108, 178, 248].forEach((baseX) => {
      for (let row = 0; row < pattern.length; row += 1) {
        for (let col = 0; col < pattern[row].length; col += 1) {
          if (pattern[row][col] === '1') barriers.push({ x: baseX + col * 2, y: 320 + row * 2 });
        }
      }
    });
  }

  function createWave() {
    enemies = [];
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        enemies.push({ x: 41 + col * 27, y: 70 + row * 24, row, col, alive: true });
      }
    }
    playerBullet = null;
    enemyBullets = [];
    particles = [];
    ufo = null;
    enemyDir = 1;
    enemyStepTimer = 0.5;
    enemyShotTimer = 1;
    ufoTimer = 6 + Math.random() * 7;
    makeBarriers();
  }

  function beginGame() {
    score = 0;
    lives = 3;
    level = 1;
    nextLife = 1000;
    player = { x: 154, y: 365, w: 11, h: 6, invincible: 0 };
    createWave();
    state = 'playing';
    stateTimer = 0;
    musicStep = 0;
    musicTimer = 0;
    sound('start');
  }

  function nextLevel() {
    level += 1;
    player.x = 154;
    player.invincible = 1.2;
    createWave();
    state = 'playing';
  }

  function explode(x, y, color, count = 12) {
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x, y,
        vx: ((i % 5) - 2) * (18 + Math.random() * 18),
        vy: ((Math.floor(i / 5) - 1) * 22) - Math.random() * 25,
        life: 0.25 + Math.random() * 0.35,
        color
      });
    }
  }

  function shootPlayer() {
    if (state !== 'playing' || playerBullet || player.invincible > 1) return;
    playerBullet = { x: player.x + 5, y: player.y - 5 };
    sound('shoot');
  }

  function rectHit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function damageBarrier(bullet) {
    let hit = false;
    for (let i = barriers.length - 1; i >= 0; i -= 1) {
      const cell = barriers[i];
      if (bullet.x >= cell.x - 1 && bullet.x <= cell.x + 3 && bullet.y >= cell.y - 2 && bullet.y <= cell.y + 4) {
        const cx = cell.x;
        const cy = cell.y;
        barriers = barriers.filter((part) => Math.abs(part.x - cx) > 3 || Math.abs(part.y - cy) > 3);
        hit = true;
        break;
      }
    }
    return hit;
  }

  function hitPlayer() {
    if (player.invincible > 0) return;
    lives -= 1;
    sound('hit');
    explode(player.x + 5, player.y + 2, colors.cyan, 20);
    enemyBullets = [];
    playerBullet = null;
    if (lives <= 0) {
      state = 'over';
      stateTimer = 0;
    } else {
      player.x = 154;
      player.invincible = 1.5;
    }
  }

  function updateEnemies(dt) {
    const alive = enemies.filter((enemy) => enemy.alive);
    if (!alive.length) {
      state = 'level';
      stateTimer = 0;
      tone(523, 0.1);
      setTimeout(() => tone(659, 0.1), 110);
      setTimeout(() => tone(784, 0.18), 220);
      return;
    }
    enemyStepTimer -= dt;
    if (enemyStepTimer <= 0) {
      const ratio = alive.length / enemies.length;
      enemyStepTimer = Math.max(0.055, (0.5 - level * 0.025) * ratio + 0.035);
      const left = Math.min(...alive.map((enemy) => enemy.x));
      const right = Math.max(...alive.map((enemy) => enemy.x + 8));
      const drop = (enemyDir > 0 && right >= 305) || (enemyDir < 0 && left <= 7);
      if (drop) {
        enemyDir *= -1;
        alive.forEach((enemy) => { enemy.y += 9; });
      } else {
        alive.forEach((enemy) => { enemy.x += enemyDir * 4; });
      }
      sound('enemy');
      if (alive.some((enemy) => enemy.y + 8 >= 356)) {
        lives = 0;
        state = 'over';
        stateTimer = 0;
        sound('hit');
      }
    }

    enemyShotTimer -= dt;
    const maxShots = Math.min(4, 1 + Math.floor(level / 2));
    if (enemyShotTimer <= 0 && enemyBullets.length < maxShots) {
      enemyShotTimer = Math.max(0.35, 1.15 - level * 0.07) * (0.65 + Math.random() * 0.7);
      const bottomByCol = [];
      alive.forEach((enemy) => {
        if (!bottomByCol[enemy.col] || enemy.y > bottomByCol[enemy.col].y) bottomByCol[enemy.col] = enemy;
      });
      const shooters = bottomByCol.filter(Boolean);
      const shooter = shooters[Math.floor(Math.random() * shooters.length)];
      enemyBullets.push({ x: shooter.x + 4, y: shooter.y + 9, vy: 85 + level * 7 });
    }
  }

  function updateBullets(dt) {
    if (playerBullet) {
      playerBullet.y -= 230 * dt;
      if (playerBullet.y < 38) {
        playerBullet = null;
      } else if (damageBarrier(playerBullet)) {
        playerBullet = null;
      } else if (ufo && rectHit({ x: playerBullet.x, y: playerBullet.y, w: 2, h: 5 }, { x: ufo.x, y: 43, w: 12, h: 5 })) {
        addScore([100, 150, 200, 300][Math.floor(Math.random() * 4)]);
        explode(ufo.x + 6, 45, colors.orange, 16);
        ufo = null;
        playerBullet = null;
        sound('ufo');
      } else {
        for (const enemy of enemies) {
          if (enemy.alive && rectHit({ x: playerBullet.x, y: playerBullet.y, w: 2, h: 5 }, { x: enemy.x, y: enemy.y, w: 8, h: 8 })) {
            enemy.alive = false;
            addScore(enemy.row === 0 ? 30 : enemy.row < 3 ? 20 : 10);
            explode(enemy.x + 4, enemy.y + 4, enemy.row === 0 ? colors.orange : colors.lime, 10);
            playerBullet = null;
            tone(180 + enemy.row * 35, 0.09, 'square', 0.035, -80);
            break;
          }
        }
      }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
      const bullet = enemyBullets[i];
      bullet.y += bullet.vy * dt;
      if (damageBarrier(bullet)) {
        enemyBullets.splice(i, 1);
      } else if (player.invincible <= 0 && rectHit({ x: bullet.x, y: bullet.y, w: 2, h: 6 }, player)) {
        enemyBullets.splice(i, 1);
        hitPlayer();
      } else if (bullet.y > H) {
        enemyBullets.splice(i, 1);
      }
    }
  }

  function updateUfo(dt) {
    if (ufo) {
      ufo.x += ufo.vx * dt;
      if (ufo.x < -14 || ufo.x > W + 14) {
        ufo = null;
        ufoTimer = 7 + Math.random() * 8;
      }
    } else {
      ufoTimer -= dt;
      if (ufoTimer <= 0) {
        const fromLeft = Math.random() < 0.5;
        ufo = { x: fromLeft ? -13 : W + 1, vx: fromLeft ? 42 : -42 };
      }
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 55 * dt;
      particle.life -= dt;
      if (particle.life <= 0) particles.splice(i, 1);
    }
  }

  function update(dt) {
    frame += 1;
    stateTimer += dt;
    updateParticles(dt);
    if (state === 'level') {
      if (stateTimer > 1.8) nextLevel();
      return;
    }
    if (state !== 'playing') return;

    let move = 0;
    if (keys.ArrowLeft || keys.KeyA) move -= 1;
    if (keys.ArrowRight || keys.KeyD) move += 1;
    player.x = Math.max(7, Math.min(W - player.w - 7, player.x + move * 105 * dt));
    player.invincible = Math.max(0, player.invincible - dt);
    if (keys.Space || keys.KeyZ) shootPlayer();
    updateEnemies(dt);
    if (state !== 'playing') return;
    updateBullets(dt);
    updateUfo(dt);
    playMusic(dt);
  }

  function drawStars() {
    ctx.fillStyle = '#101d2a';
    for (let i = 0; i < 34; i += 1) {
      const x = (i * 83 + 17) % W;
      const y = (i * 47 + 31) % H;
      const blink = (frame + i * 7) % 90 < 5;
      ctx.fillRect(x, y, blink ? 2 : 1, 1);
    }
  }

  function drawHud() {
    ctx.fillStyle = colors.ink;
    ctx.fillRect(0, 0, W, 35);
    drawText('SCORE', 8, 5, 1, colors.cyan);
    drawText(String(score).padStart(6, '0'), 8, 17, 1, colors.white);
    drawText('HI', 160, 5, 1, colors.orange, 'center');
    drawText(String(highScore).padStart(6, '0'), 160, 17, 1, colors.white, 'center');
    drawText('L', 248, 5, 1, colors.lime);
    drawText(String(level).padStart(2, '0'), 268, 5, 1, colors.white);
    for (let i = 0; i < lives; i += 1) drawSprite(SPRITES.player, 246 + i * 14, 20, colors.cyan);
    ctx.fillStyle = colors.dim;
    ctx.fillRect(6, 33, W - 12, 1);
  }

  function drawGame() {
    drawHud();
    if (ufo) drawSprite(SPRITES.ufo, ufo.x | 0, 43, colors.orange);
    const anim = Math.floor(frame / 16) % 2;
    enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      const color = enemy.row === 0 ? colors.orange : enemy.row < 3 ? colors.cyan : colors.lime;
      drawSprite(SPRITES[`invader${Math.min(2, Math.floor(enemy.row / 2))}`][anim], enemy.x | 0, enemy.y | 0, color);
    });
    ctx.fillStyle = colors.lime;
    barriers.forEach((cell) => ctx.fillRect(cell.x, cell.y, 2, 2));
    if (player.invincible <= 0 || Math.floor(frame / 5) % 2 === 0) {
      drawSprite(SPRITES.player, player.x | 0, player.y, colors.cyan);
      ctx.fillStyle = colors.white;
      ctx.fillRect((player.x + 5) | 0, player.y, 1, 2);
    }
    if (playerBullet) {
      ctx.fillStyle = colors.white;
      ctx.fillRect(playerBullet.x | 0, playerBullet.y | 0, 2, 5);
    }
    ctx.fillStyle = colors.orange;
    enemyBullets.forEach((bullet, index) => {
      ctx.fillRect(bullet.x | 0, bullet.y | 0, 2, 2);
      ctx.fillRect((bullet.x + (index + frame) % 2) | 0, (bullet.y + 2) | 0, 2, 4);
    });
    ctx.fillStyle = colors.red;
    ctx.fillRect(6, 379, W - 12, 1);
  }

  function drawTitle() {
    drawText('STARLINE', W / 2, 57, 3, colors.cyan, 'center');
    drawText('INVADERS', W / 2, 88, 3, colors.lime, 'center');
    const bounce = Math.floor(frame / 18) % 2;
    drawSprite(SPRITES.invader0[bounce], 148, 142, colors.orange, 3);
    ctx.fillStyle = colors.dim;
    ctx.fillRect(54, 184, 212, 2);
    drawText('SAVE THE LAST BASE', W / 2, 202, 1, colors.white, 'center');
    drawText('MOVE', 73, 246, 1, colors.cyan, 'center');
    drawText('FIRE', 247, 246, 1, colors.orange, 'center');
    drawText('A D', 73, 262, 1, colors.white, 'center');
    drawText('SPACE', 247, 262, 1, colors.white, 'center');
    if (Math.floor(frame / 30) % 2 === 0) drawText('PRESS FIRE', W / 2, 313, 2, colors.lime, 'center');
    drawText('HI ' + String(highScore).padStart(6, '0'), W / 2, 354, 1, colors.orange, 'center');
  }

  function drawOverlay() {
    if (state === 'level') {
      ctx.fillStyle = colors.ink;
      ctx.fillRect(48, 160, 224, 68);
      ctx.fillStyle = colors.cyan;
      ctx.fillRect(48, 160, 224, 2);
      ctx.fillRect(48, 226, 224, 2);
      drawText('WAVE CLEAR', W / 2, 176, 2, colors.lime, 'center');
      drawText('NEXT LEVEL ' + (level + 1), W / 2, 207, 1, colors.white, 'center');
    }
    if (state === 'over') {
      ctx.fillStyle = colors.ink;
      ctx.fillRect(38, 145, 244, 112);
      ctx.fillStyle = colors.red;
      ctx.fillRect(38, 145, 244, 2);
      ctx.fillRect(38, 255, 244, 2);
      drawText('GAME OVER', W / 2, 163, 3, colors.red, 'center');
      drawText('SCORE ' + String(score).padStart(6, '0'), W / 2, 203, 1, colors.white, 'center');
      if (stateTimer > 0.8 && Math.floor(frame / 30) % 2 === 0) {
        drawText('PRESS FIRE', W / 2, 232, 1, colors.lime, 'center');
      }
    }
  }

  function draw() {
    ctx.fillStyle = colors.ink;
    ctx.fillRect(0, 0, W, H);
    drawStars();
    if (state === 'title') {
      drawTitle();
    } else {
      drawGame();
      drawOverlay();
    }
    ctx.fillStyle = 'rgba(85,230,255,0.035)';
    for (let y = 1; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    particles.forEach((particle) => {
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x | 0, particle.y | 0, particle.life > 0.2 ? 2 : 1, 2);
    });
  }

  function action() {
    getAudio();
    if (state === 'title' || (state === 'over' && stateTimer > 0.8)) beginGame();
    else shootPlayer();
  }

  function bindButton(id, code, isAction = false) {
    const button = document.getElementById(id);
    const release = () => {
      keys[code] = false;
      button.classList.remove('pressed');
    };
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      keys[code] = true;
      button.classList.add('pressed');
      getAudio();
      if (isAction) action();
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  }

  document.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyA', 'KeyD', 'KeyZ', 'Enter'].includes(event.code)) {
      event.preventDefault();
      if (!keys[event.code] && ['Space', 'KeyZ', 'Enter'].includes(event.code)) action();
      keys[event.code] = true;
    }
  });
  document.addEventListener('keyup', (event) => { keys[event.code] = false; });
  let lastTap = 0;
  document.addEventListener('touchstart', (event) => {
    const now = Date.now();
    if (now - lastTap < 300) event.preventDefault();
    lastTap = now;
  }, { passive: false });
  document.addEventListener('dblclick', (event) => event.preventDefault());
  document.addEventListener('contextmenu', (event) => event.preventDefault());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) Object.keys(keys).forEach((key) => { keys[key] = false; });
  });

  bindButton('left', 'ArrowLeft');
  bindButton('right', 'ArrowRight');
  bindButton('fire', 'Space', true);

  function fitCanvas() {
    const shell = document.getElementById('screen-shell');
    const scale = Math.max(1, Math.floor(Math.min(shell.clientWidth / W, shell.clientHeight / H)));
    const fractional = Math.min(shell.clientWidth / W, shell.clientHeight / H);
    const applied = fractional >= 1 ? scale : fractional;
    canvas.style.width = `${Math.floor(W * applied)}px`;
    canvas.style.height = `${Math.floor(H * applied)}px`;
  }

  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  let previous = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - previous) / 1000);
    previous = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
