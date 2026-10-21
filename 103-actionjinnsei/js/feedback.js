// ゲームフィードバック（画面シェイク・パーティクル・コンボ・フローティングテキスト）

const ATTACK_NAMES = ['光', '炎', '爆弾', '斧', '氷', 'ビーム'];
const ATTACK_ICONS = ['✨', '🔥', '💣', '🪓', '❄️', '⚡'];

const gameStats = {
  kills: 0,
  maxCombo: 0,
  damageTaken: 0
};

const comboState = {
  count: 0,
  timer: 0,
  maxTimer: 120
};

let screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
let floatingTexts = [];
let particles = [];
let shockwaves = [];
let muzzleFlashes = [];
let renderAlpha = 1;
let lastRenderTime = 0;

function resetGameStats() {
  gameStats.kills = 0;
  gameStats.maxCombo = 0;
  gameStats.damageTaken = 0;
  comboState.count = 0;
  comboState.timer = 0;
  floatingTexts = [];
  particles = [];
  shockwaves = [];
  muzzleFlashes = [];
  screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
}

function getRenderAlpha() {
  return renderAlpha;
}

function setRenderAlpha(alpha, frameInterval) {
  renderAlpha = Math.min(1, Math.max(0, alpha / frameInterval));
}

function spawnMuzzleFlash(x, y) {
  muzzleFlashes.push({ x, y, life: 8, maxLife: 8 });
  spawnParticles(x, y, 4, '#FFFFAA', 3);
}

function spawnShockwave(worldX, worldY) {
  shockwaves.push({
    x: worldX - camera.x, y: worldY,
    radius: 5, maxRadius: 60, life: 20, maxLife: 20
  });
}

function drawShockwaves(ctx) {
  shockwaves.forEach(sw => {
    const a = sw.life / sw.maxLife;
    ctx.strokeStyle = 'rgba(255,150,50,' + (a * 0.8) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function triggerScreenShake(intensity, duration) {
  screenShake.intensity = Math.max(screenShake.intensity, intensity);
  screenShake.duration = Math.max(screenShake.duration, duration);
}

function getCameraOffset() {
  return { x: screenShake.x, y: screenShake.y };
}

function updateFeedback() {
  if (screenShake.duration > 0) {
    screenShake.duration--;
    screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
    screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
    if (screenShake.duration <= 0) {
      screenShake.x = 0;
      screenShake.y = 0;
      screenShake.intensity = 0;
    }
  }

  if (comboState.timer > 0) {
    comboState.timer--;
    if (comboState.timer <= 0) {
      comboState.count = 0;
      updateComboDisplay();
    }
  }

  floatingTexts = floatingTexts.filter(t => {
    t.life--;
    t.y += t.vy;
    t.vy *= 0.95;
    t.alpha = t.life / t.maxLife;
    return t.life > 0;
  });

  particles = particles.filter(p => {
    p.life--;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity || 0;
    p.alpha = p.life / p.maxLife;
    return p.life > 0;
  });

  shockwaves = shockwaves.filter(sw => {
    sw.life--;
    sw.radius += (sw.maxRadius - sw.radius) * 0.15;
    return sw.life > 0;
  });

  muzzleFlashes = muzzleFlashes.filter(m => {
    m.life--;
    return m.life > 0;
  });

  if (typeof updateScalePunches === 'function') updateScalePunches();
}

function addFloatingText(x, y, text, color, size) {
  floatingTexts.push({
    x, y, text,
    color: color || '#FFD700',
    size: size || 18,
    vy: -2,
    life: 45,
    maxLife: 45,
    alpha: 1
  });
}

function spawnParticles(x, y, count, color, spread) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * (spread || 4) + 1;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      gravity: 0.15,
      size: Math.random() * 4 + 2,
      color: color || '#FFD700',
      life: 25 + Math.random() * 15,
      maxLife: 40,
      alpha: 1
    });
  }
}

function registerKill(worldX, worldY) {
  gameStats.kills++;
  comboState.count++;
  comboState.timer = comboState.maxTimer;
  if (comboState.count > gameStats.maxCombo) {
    gameStats.maxCombo = comboState.count;
  }
  const bonus = Math.min(comboState.count, 10) * 2;
  if (bonus > 0) gameState.score += bonus;

  const multiplier = getComboMultiplier();
  spawnParticles(worldX - camera.x, worldY, 8, '#FF6347', 5);
  addFloatingText(worldX - camera.x, worldY - 20, '+' + (10 + bonus), '#FFD700', 16);

  if (comboState.count >= 3) {
    addFloatingText(worldX - camera.x, worldY - 45, comboState.count + ' COMBO!', '#FF4500', 22);
    if (typeof playSE === 'function') playSE('combo');
  } else if (typeof playSE === 'function') {
    playSE('hit');
  }

  updateComboDisplay();
}

function getComboMultiplier() {
  if (comboState.count >= 10) return 3;
  if (comboState.count >= 5) return 2;
  if (comboState.count >= 3) return 1.5;
  return 1;
}

function updateComboDisplay() {
  const el = document.getElementById('combo-display');
  const countEl = document.getElementById('combo-count');
  const multEl = document.getElementById('combo-multiplier');
  if (!el || !countEl) return;

  if (comboState.count >= 2) {
    el.classList.remove('hidden');
    countEl.textContent = comboState.count;
    if (multEl) multEl.textContent = 'x' + getComboMultiplier();
  } else {
    el.classList.add('hidden');
  }
}

function drawFeedback(ctx) {
  muzzleFlashes.forEach(m => {
    const a = m.life / m.maxLife;
    const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 20);
    grad.addColorStop(0, 'rgba(255,255,200,' + a + ')');
    grad.addColorStop(1, 'rgba(255,200,50,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 20, 0, Math.PI * 2);
    ctx.fill();
  });

  particles.forEach(p => {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;

  floatingTexts.forEach(t => {
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = t.color;
    ctx.font = 'bold ' + t.size + 'px Bangers, monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillText(t.text, t.x, t.y);
  });
  ctx.globalAlpha = 1;
}

function showStageBanner(stageNum, stageName, bossName) {
  const banner = document.getElementById('stage-banner');
  const numEl = document.getElementById('banner-stage-num');
  const nameEl = document.getElementById('banner-stage-name');
  const bossEl = document.getElementById('banner-boss-name');
  if (!banner) return;

  if (numEl) numEl.textContent = 'STAGE ' + stageNum;
  if (nameEl) nameEl.textContent = stageName;
  if (bossEl) bossEl.textContent = bossName ? 'BOSS: ' + bossName : '';

  banner.classList.remove('hidden');
  banner.classList.add('show');
  setTimeout(() => {
    banner.classList.remove('show');
    setTimeout(() => banner.classList.add('hidden'), 500);
  }, 2500);
}

function showBossWarning() {
  triggerScreenShake(6, 20);
  if (typeof playSE === 'function') playSE('boss');
}

function getAttackDisplay(level) {
  return {
    name: ATTACK_NAMES[level] || ATTACK_NAMES[0],
    icon: ATTACK_ICONS[level] || ATTACK_ICONS[0]
  };
}
