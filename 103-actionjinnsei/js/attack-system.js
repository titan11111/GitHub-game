// 攻撃システム（データ駆動・Object Pool・ヒットストップ・レベルアップ演出）

const ATTACK_DEFS = [
  {
    type: 'light', name: '光', icon: '✨',
    hitStop: 2, shake: 2, trail: true, spawnFX: 'spark',
    seFreq: 520, seEnd: 280,
    config: CONFIG.PROJECTILE.light,
    ballistic: false, piercing: false
  },
  {
    type: 'fire', name: '炎', icon: '🔥',
    hitStop: 3, shake: 3, trail: true, spawnFX: 'ember',
    seFreq: 380, seEnd: 160,
    config: CONFIG.PROJECTILE.fire,
    ballistic: false, piercing: false
  },
  {
    type: 'exploding', name: '爆弾', icon: '💣',
    hitStop: 5, shake: 6, trail: false, spawnFX: 'smoke',
    seFreq: 220, seEnd: 90,
    config: CONFIG.PROJECTILE.exploding,
    ballistic: true, piercing: false
  },
  {
    type: 'axe', name: '斧', icon: '🪓',
    hitStop: 4, shake: 5, trail: true, spawnFX: 'slash',
    seFreq: 300, seEnd: 120,
    config: CONFIG.PROJECTILE.axe,
    ballistic: true, piercing: true, maxPierceKey: 'maxPierce'
  },
  {
    type: 'pierce', name: '氷', icon: '❄️',
    hitStop: 3, shake: 3, trail: true, spawnFX: 'ice',
    seFreq: 640, seEnd: 420,
    config: CONFIG.PROJECTILE.pierce,
    ballistic: false, piercing: true, maxPierceKey: 'maxPierce'
  },
  {
    type: 'beam', name: 'ビーム', icon: '⚡',
    hitStop: 2, shake: 4, trail: true, spawnFX: 'beam',
    seFreq: 800, seEnd: 500,
    config: CONFIG.PROJECTILE.beam,
    ballistic: false, piercing: true, maxPierceKey: 'maxPierce'
  }
];

let hitStopFrames = 0;
let lastAttackLevel = -1;
let attackUnlockBanner = { active: false, timer: 0, level: 0 };
let unlockFlash = { alpha: 0 };
let projectilePool = [];
const PROJECTILE_POOL_SIZE = 100;

function initAttackSystem() {
  hitStopFrames = 0;
  lastAttackLevel = -1;
  attackUnlockBanner = { active: false, timer: 0, level: 0 };
  unlockFlash = { alpha: 0 };
  projectilePool = [];
  for (let i = 0; i < PROJECTILE_POOL_SIZE; i++) {
    projectilePool.push(createEmptyProjectile());
  }
}

function createEmptyProjectile() {
  return {
    x: 0, y: 0, vx: 0, vy: 0,
    enemy: false, timer: 0,
    w: 20, h: 20, rotation: 0, gravity: 0,
    damage: 10, piercing: false, pierceCount: 0, maxPierce: 0,
    type: 'light', active: false, trail: []
  };
}

function acquireProjectile() {
  for (let i = 0; i < projectilePool.length; i++) {
    if (!projectilePool[i].active) {
      projectilePool[i].active = true;
      projectilePool[i].trail = [];
      projectilePool[i].timer = 0;
      projectilePool[i].pierceCount = 0;
      return projectilePool[i];
    }
  }
  const p = createEmptyProjectile();
  p.active = true;
  projectilePool.push(p);
  return p;
}

function deactivateProjectile(p) {
  p.active = false;
  p.trail = [];
}

function getActiveProjectiles() {
  return projectilePool.filter(p => p.active);
}

function getAttackTypeByScore() {
  const scoreLevel = Math.floor(gameState.score / CONFIG.GAME.scorePerLevel);
  return Math.min(scoreLevel, CONFIG.PLAYER.maxAttackLevel);
}

function getAttackDef(level) {
  return ATTACK_DEFS[level] || ATTACK_DEFS[0];
}

function triggerHitStop(frames) {
  hitStopFrames = Math.max(hitStopFrames, frames);
}

function isHitStopActive() {
  return hitStopFrames > 0;
}

function checkAttackLevelUp() {
  const level = getAttackTypeByScore();
  if (lastAttackLevel < 0) {
    lastAttackLevel = level;
    return;
  }
  if (level > lastAttackLevel) {
    showAttackUnlockBanner(level);
    lastAttackLevel = level;
  }
}

function showAttackUnlockBanner(level) {
  const def = getAttackDef(level);
  attackUnlockBanner = { active: true, timer: 90, level };
  unlockFlash.alpha = 0.55;
  if (typeof triggerScreenShake === 'function') triggerScreenShake(4, 15);
  if (typeof playAttackSE === 'function') playAttackSE(level);
  if (typeof playSE === 'function') playSE('unlock');
}

function updateAttackSystem() {
  if (hitStopFrames > 0) {
    hitStopFrames--;
    return false;
  }
  checkAttackLevelUp();

  if (attackUnlockBanner.active) {
    attackUnlockBanner.timer--;
    if (attackUnlockBanner.timer <= 0) attackUnlockBanner.active = false;
  }
  if (unlockFlash.alpha > 0) {
    unlockFlash.alpha = Math.max(0, unlockFlash.alpha - 0.04);
  }

  projectilePool.forEach(p => {
    if (!p.active) return;
    if (p.trail && p.trail.length > 0) {
      p.trail.forEach(t => t.life--);
      p.trail = p.trail.filter(t => t.life > 0);
    }
    const def = getAttackDefByType(p.type);
    if (def && def.trail && p.timer % 2 === 0) {
      p.trail.push({
        x: p.x + p.w / 2,
        y: p.y + p.h / 2,
        life: 12,
        maxLife: 12,
        color: getTrailColor(p.type)
      });
    }
  });
  return true;
}

function getAttackDefByType(type) {
  return ATTACK_DEFS.find(d => d.type === type) || ATTACK_DEFS[0];
}

function getTrailColor(type) {
  const colors = {
    light: 'rgba(255,255,200,0.7)',
    fire: 'rgba(255,100,30,0.6)',
    axe: 'rgba(200,200,220,0.5)',
    pierce: 'rgba(150,230,255,0.6)',
    beam: 'rgba(255,80,200,0.5)'
  };
  return colors[type] || 'rgba(255,215,0,0.5)';
}

function onProjectileHit(p, target) {
  const def = getAttackDefByType(p.type);
  if (def) {
    triggerHitStop(def.hitStop);
    if (typeof triggerScreenShake === 'function') triggerScreenShake(def.shake, def.shake * 3);
  }
  if (p.type === 'exploding' && typeof createExplosionDamage === 'function') {
    createExplosionDamage(p);
    if (typeof spawnParticles === 'function') {
      spawnParticles(p.x - camera.x, p.y, 14, '#FF6600', 7);
    }
    if (typeof spawnShockwave === 'function') spawnShockwave(p.x, p.y);
  }
  if (p.type === 'pierce' && typeof spawnParticles === 'function') {
    spawnParticles(p.x - camera.x, p.y + p.h / 2, 6, '#AAEEFF', 4);
  }
  if (target && target.hp <= 0 && typeof spawnScalePunch === 'function') {
    spawnScalePunch(target);
  }
}

function firePlayerAttack() {
  if (!player || !(typeof player.canAttack === 'function' ? player.canAttack() : player.attackCooldown <= 0)) {
    return false;
  }
  const attackType = getAttackTypeByScore();
  createPlayerProjectile(attackType);
  return true;
}

function createPlayerProjectile(attackType) {
  const def = getAttackDef(attackType);
  const cfg = def.config;
  const baseX = player.x + player.w;
  const baseY = player.y + player.h / 2;

  const p = acquireProjectile();
  Object.assign(p, {
    x: baseX,
    y: baseY,
    vx: 0,
    vy: 0,
    enemy: false,
    timer: 0,
    rotation: 0,
    gravity: 0,
    type: def.type,
    damage: cfg.damage,
    piercing: def.piercing,
    pierceCount: 0,
    maxPierce: def.piercing ? (cfg[def.maxPierceKey] || cfg.maxPierce || 1) : 0,
    w: cfg.width || 20,
    h: cfg.height || 20,
    active: true,
    trail: []
  });

  if (def.type === 'light') {
    p.vx = cfg.speed;
  } else if (def.type === 'fire') {
    p.vx = cfg.speed;
  } else if (def.type === 'exploding') {
    p.vx = cfg.speedX;
    p.vy = cfg.speedY;
    p.gravity = cfg.gravity;
  } else if (def.type === 'axe') {
    p.vx = cfg.speedX;
    p.vy = cfg.speedY;
    p.gravity = cfg.gravity;
  } else if (def.type === 'pierce') {
    p.vx = cfg.speed;
  } else if (def.type === 'beam') {
    p.vx = cfg.speed;
  }

  player.attacking = true;
  player.attackCooldown = cfg.cooldown;
  player.recoilX = (player.recoilX || 0) - 4;

  if (typeof spawnMuzzleFlash === 'function') {
    spawnMuzzleFlash(baseX - camera.x, baseY);
  }
  if (typeof playAttackSE === 'function') playAttackSE(attackType);
  else if (typeof playSE === 'function') playSE('attack');
}

function playAttackSE(level) {
  const def = getAttackDef(level);
  if (!SoundFX || !SoundFX.ctx || !SoundFX.enabled) return;
  SoundFX.resume();
  const t = SoundFX.ctx.currentTime;
  const osc = SoundFX.ctx.createOscillator();
  const gain = SoundFX.ctx.createGain();
  osc.connect(gain);
  gain.connect(SoundFX.ctx.destination);
  osc.type = level >= 4 ? 'sawtooth' : 'square';
  osc.frequency.setValueAtTime(def.seFreq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(60, def.seEnd), t + 0.1);
  gain.gain.setValueAtTime(0.12 + level * 0.02, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
  osc.start(t);
  osc.stop(t + 0.12);
}

// オメガビーム更新
function updateOmegaBeamInput() {
  if (keys.bBtn) {
    if (!omegaBeam.bBtnPressed && omegaBeam.charges > 0 && !omegaBeam.isActive && !omegaBeam.isCharging) {
      omegaBeam.isCharging = true;
      omegaBeam.chargeStartTime = Date.now();
      omegaBeam.bBtnPressed = true;
    }
    if (omegaBeam.isCharging) {
      const elapsed = Date.now() - omegaBeam.chargeStartTime;
      if (elapsed >= omegaBeam.chargeDuration) {
        releaseOmegaBeam();
      }
    }
  } else {
    if (omegaBeam.isCharging && omegaBeam.charges > 0) {
      releaseOmegaBeam();
    }
    omegaBeam.bBtnPressed = false;
  }

  if (omegaBeam.isActive) {
    omegaBeam.activeTimer++;
    if (omegaBeam.activeTimer % CONFIG.OMEGA_BEAM.damageInterval === 0) {
      enemies.forEach(e => { e.hp -= CONFIG.OMEGA_BEAM.enemyDamage; });
      if (boss) boss.hp -= CONFIG.OMEGA_BEAM.bossDamage;
    }
    if (omegaBeam.activeTimer > CONFIG.OMEGA_BEAM.activeDuration) {
      omegaBeam.isActive = false;
      omegaBeam.activeTimer = 0;
    }
  }
}

function releaseOmegaBeam() {
  if (!omegaBeam.isCharging || omegaBeam.charges <= 0) return;
  omegaBeam.isCharging = false;
  activateOmegaBeam();
  omegaBeam.charges--;
}

function activateOmegaBeam() {
  if (omegaBeam.charges <= 0 && !omegaBeam.isCharging) return;
  omegaBeam.isActive = true;
  omegaBeam.activeTimer = 0;
  triggerHitStop(8);
  if (typeof triggerScreenShake === 'function') triggerScreenShake(12, 35);
  unlockFlash.alpha = 0.7;
  if (typeof playSE === 'function') playSE('omega');
  enemies.forEach(e => { e.hp -= CONFIG.OMEGA_BEAM.enemyDamage; });
  if (boss) boss.hp -= CONFIG.OMEGA_BEAM.bossDamage;
}

function getOmegaBeamProgress() {
  if (!omegaBeam.isActive) return 0;
  return omegaBeam.activeTimer / CONFIG.OMEGA_BEAM.activeDuration;
}

function getOmegaChargePercent() {
  if (!omegaBeam.isCharging) return 0;
  const elapsed = Date.now() - omegaBeam.chargeStartTime;
  return Math.min(1, elapsed / omegaBeam.chargeDuration);
}

function drawAttackUnlockOverlay(ctx) {
  if (unlockFlash.alpha > 0) {
    ctx.fillStyle = 'rgba(255, 215, 0, ' + unlockFlash.alpha + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (!attackUnlockBanner.active) return;
  const def = getAttackDef(attackUnlockBanner.level);
  const pulse = 1 + Math.sin(attackUnlockBanner.timer * 0.15) * 0.05;
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height * 0.35);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(-200, -50, 400, 100);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 4;
  ctx.strokeRect(-200, -50, 400, 100);
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px Bangers, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('新しい技を覚えた！', 0, -10);
  ctx.font = 'bold 36px Bangers, monospace';
  ctx.fillStyle = '#FFF';
  ctx.fillText(def.icon + ' ' + def.name, 0, 30);
  ctx.restore();
}
