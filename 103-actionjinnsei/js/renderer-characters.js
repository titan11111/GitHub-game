// キャラクター描画（Path2D ベクター）

const enemyScalePunches = [];

function spawnScalePunch(target) {
  enemyScalePunches.push({
    x: target.x, y: target.y, w: target.w, h: target.h,
    timer: 12, maxTimer: 12
  });
}

function updateScalePunches() {
  for (let i = enemyScalePunches.length - 1; i >= 0; i--) {
    enemyScalePunches[i].timer--;
    if (enemyScalePunches[i].timer <= 0) enemyScalePunches.splice(i, 1);
  }
}

function getCharacterDrawScale() {
  return CONFIG.CHARACTER.scale;
}

function getCharacterGroundOffset() {
  return CONFIG.CHARACTER.visualGroundOffset || 0;
}

function getEnemyGroundOffset(type, enemyType) {
  if (type === 'boss') return CONFIG.CHARACTER.bossGroundOffset || 0;
  if (enemyType === 'flying' || enemyType === 'hovering') {
    return CONFIG.CHARACTER.enemyAirOffset || 0;
  }
  return CONFIG.CHARACTER.enemyGroundOffset || 0;
}

function getEnemyDrawOffset() {
  const scale = CONFIG.CHARACTER.scale;
  return CONFIG.CHARACTER.drawAnchor * (scale - 1);
}

function getEnemyScale(enemy) {
  for (const p of enemyScalePunches) {
    if (Math.abs(p.x - enemy.x) < 5 && Math.abs(p.y - enemy.y) < 5) {
      const t = p.timer / p.maxTimer;
      return 1 + Math.sin((1 - t) * Math.PI) * 0.3;
    }
  }
  return 1;
}

function drawPlayerSVG(x, y, invincible, stageNum) {
  if (invincible % 10 >= 5) return;

  const pos = player ? getRenderPosition(player) : { x, y };
  const px = pos.x - camera.x;
  const py = pos.y + getCharacterGroundOffset();
  const recoil = (player && player.recoilX) ? player.recoilX : 0;
  const facing = player && player.facing ? player.facing : 1;
  const blueprint = PLAYER_BLUEPRINTS[stageNum];

  if (blueprint) {
    drawVectorBlueprint(ctx, blueprint, px + recoil, py, getCharacterDrawScale(), facing, getWalkAnimFrame());
    if (player && player.recoilX) player.recoilX *= 0.7;
    return;
  }

  drawVectorBlueprint(ctx, PLAYER_BLUEPRINTS[1], px + recoil, py, getCharacterDrawScale(), facing, getWalkAnimFrame());
}

function getWalkAnimFrame() {
  if (!player || Math.abs(player.vx) < 0.5) return 0;
  return Math.floor(Date.now() / 120) % 2;
}

function drawEnemySVG(x, y, type, stageNum, enemyType, facing) {
  const scale = getCharacterDrawScale();
  const sizeOffset = getEnemyDrawOffset();
  const pos = { x, y };
  const px = pos.x - camera.x - sizeOffset;
  const py = pos.y - sizeOffset + getEnemyGroundOffset(type, enemyType);
  const drawScale = scale * getEnemyScale({ x, y });
  const resolvedFacing = facing || -1;

  if (type === 'boss') {
    const bp = BOSS_BLUEPRINTS[stageNum];
    if (bp) {
      drawVectorBlueprint(ctx, bp, px, py, drawScale, resolvedFacing);
    } else {
      drawGenericBoss(ctx, px, py, drawScale, stageNum, resolvedFacing);
    }
    return;
  }

  const key = stageNum + '_' + enemyType;
  const bp = ENEMY_BLUEPRINTS[key];
  if (bp) {
    drawVectorBlueprint(ctx, bp, px, py, drawScale, resolvedFacing);
    if (enemyType === 'hovering') {
      drawHoverDroneFX(px, py, drawScale);
    }
  } else {
    drawGenericEnemy(ctx, px, py, drawScale, stageNum, enemyType, resolvedFacing);
  }
}

function drawHoverDroneFX(px, py, scale) {
  const rotorPhase = Date.now() * 0.035;
  const rotorW = 8 * scale;
  const rotorH = 2 * scale;
  const leftX = px + 6 * scale;
  const rightX = px + 24 * scale;
  const y = py + 8 * scale;
  const sway = Math.sin(rotorPhase) * 1.6;

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#D7DEE8';
  ctx.fillRect(leftX - rotorW / 2, y + sway, rotorW, rotorH);
  ctx.fillRect(rightX - rotorW / 2, y - sway, rotorW, rotorH);
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#AAB7C5';
  ctx.fillRect(leftX - rotorW, y + sway - 1, rotorW * 2, 1);
  ctx.fillRect(rightX - rotorW, y - sway - 1, rotorW * 2, 1);
  ctx.restore();
}

function drawGenericEnemy(ctx, px, py, scale, stageNum, enemyType, facing) {
  const colors = ['#FF6B6B', '#4B0082', '#8B4513', '#2F2F2F', '#4169E1', '#00AA00', '#8B0000'];
  const fill = colors[(stageNum - 1) % colors.length];
  ctx.save();
  ctx.translate(px + 15 * scale, py + 15 * scale);
  ctx.scale(scale * (facing || -1), scale);
  const body = Path2DCache.get('M-12 0 Q0 -18 12 0 L10 20 Q0 24 -10 20 Z');
  ctx.fillStyle = fill;
  ctx.shadowColor = fill;
  ctx.shadowBlur = 6;
  ctx.fill(body);
  ctx.fillStyle = '#FFE4B5';
  ctx.beginPath();
  ctx.arc(0, -4, 8, 0, Math.PI * 2);
  ctx.fill();
  if (enemyType === 'flying') {
    ctx.fillStyle = 'rgba(100,100,200,0.6)';
    ctx.fillRect(-18, 2, 10, 14);
    ctx.fillRect(8, 2, 10, 14);
  }
  ctx.restore();
}

function drawGenericBoss(ctx, px, py, scale, stageNum, facing) {
  const hues = [220, 0, 30, 270, 200, 240, 0];
  const hue = hues[stageNum - 1] || 220;
  ctx.save();
  ctx.translate(px + 30 * scale, py + 30 * scale);
  ctx.scale(scale * (facing || -1), scale);
  const body = Path2DCache.get('M-28 -10 L28 -10 L32 30 L-32 30 Z');
  ctx.fillStyle = 'hsl(' + hue + ',50%,35%)';
  ctx.shadowColor = 'hsl(' + hue + ',70%,50%)';
  ctx.shadowBlur = 10;
  ctx.fill(body);
  ctx.fillStyle = '#FFE4B5';
  ctx.beginPath();
  ctx.arc(0, -18, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.fillRect(-10, -20, 6, 6);
  ctx.fillRect(4, -20, 6, 6);
  ctx.restore();
}

// 旧描画関数との互換（他モジュールからの参照用スタブ）
function drawEnemyByType() {}
function drawPlayerStage1() {}
function drawPlayerStage2() {}
function drawPlayerStage3() {}
function drawPlayerStage4() {}
function drawPlayerStage5() {}
function drawPlayerStage6() {}
function drawPlayerStage7() {}
function drawBossStage1() {}
function drawBossStage2() {}
function drawBossStage3() {}
function drawBossStage4() {}
function drawBossStage5() {}
function drawBossStage6() {}
function drawBossStage7() {}
