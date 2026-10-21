// 障害物ベクター描画

function drawObstacleVector(obs) {
  const px = obs.x - camera.x;
  const py = obs.y;
  const alpha = obs.active === false ? 0.35 : 1;
  ctx.save();
  ctx.globalAlpha = alpha;

  // 背景との分離を強めるため、障害物の背面に薄いシルエットを置く
  if (obs.type !== 'pendulum' && obs.type !== 'hammer') {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(px - 2, py - 2, obs.w + 4, obs.h + 4);
  }

  switch (obs.type) {
    case 'spike':
      drawSpikeVector(px, py, obs.w, obs.h);
      break;
    case 'platform':
    case 'crumblingPlatform':
      drawPlatformVector(px, py, obs.w, obs.h, obs.type === 'crumblingPlatform', obs.crumbling, obs.crumbleTimer);
      break;
    case 'movingPlatform':
      drawMovingPlatformVector(px, py, obs.w, obs.h, obs.timer);
      break;
    case 'fallingRock':
      drawRockVector(px, py, obs.w, obs.h);
      break;
    case 'pendulum':
      drawPendulumVector(obs, px, py);
      break;
    case 'hammer':
      drawHammerVector(obs);
      break;
    case 'jumpPad':
      drawJumpPadVector(px, py, obs.w, obs.h, obs.timer);
      break;
    case 'lava':
      drawLavaVector(px, py, obs.w, obs.h, obs.timer);
      break;
    case 'laser':
      drawLaserVector(px, py, obs.w, obs.h, obs.laserOn);
      break;
    case 'electric':
      drawElectricVector(px, py, obs.w, obs.h, obs.timer);
      break;
    case 'randoseru':
      drawSchoolBagVector(px, py, obs.w, obs.h);
      break;
    case 'puddle':
      drawPuddleVector(px, py, obs.w, obs.h);
      break;
    case 'crow':
      drawCrowVector(px, py, obs.w, obs.h);
      break;
    case 'bicycle':
      drawBicycleVector(px, py, obs.w, obs.h);
      break;
    case 'clubBall':
      drawBallVector(px, py, obs.w, obs.h);
      break;
    case 'book':
    case 'copyPaper':
    case 'paperBundle':
      drawPaperVector(px, py, obs.w, obs.h, obs.type);
      break;
    case 'disciplineWall':
      drawWallVector(px, py, obs.w, obs.h);
      break;
    case 'can':
      drawCanVector(px, py, obs.w, obs.h);
      break;
    case 'namecard':
      drawCardVector(px, py, obs.w, obs.h);
      break;
    case 'coffeeCup':
      drawCupVector(px, py, obs.w, obs.h);
      break;
    case 'crowd':
      drawCrowdVector(px, py, obs.w, obs.h);
      break;
    case 'magicFlame':
      drawMagicFlameVector(px, py, obs.w, obs.h, obs.timer);
      break;
    case 'floatingRock':
      drawRockVector(px, py, obs.w, obs.h);
      break;
    default:
      drawPlatformVector(px, py, obs.w, obs.h, false, false, 0);
  }

  if (obs.type !== 'pendulum') {
    ctx.strokeStyle = 'rgba(240,240,255,0.38)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 0.5, py - 0.5, obs.w + 1, obs.h + 1);
  }
  ctx.restore();
}

function drawSpikeVector(px, py, w, h) {
  const grad = makeLinearGradient(ctx, px, py, px, py - 10, [
    { offset: 0, color: '#8B4513' },
    { offset: 1, color: '#654321' }
  ]);
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, w, h);
  for (let i = 0; i < w; i += 8) {
    const spike = Path2DCache.get('M' + i + ' 0 L' + (i + 4) + ' -10 L' + (i + 8) + ' 0 Z');
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = i % 16 === 0 ? '#FF4444' : '#CC0000';
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 4;
    ctx.fill(spike);
    ctx.restore();
  }
}

function drawPlatformVector(px, py, w, h, crumbling, crumblingActive, crumbleTimer) {
  const grad = makeLinearGradient(ctx, px, py, px, py + h, [
    { offset: 0, color: '#A08060' },
    { offset: 1, color: '#6B5344' }
  ]);
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, w, h);
  ctx.fillStyle = '#4A3728';
  ctx.fillRect(px, py, w, 3);
  if (crumbling && crumblingActive) {
    const crack = Math.floor((CONFIG.OBSTACLE.crumbleDuration - crumbleTimer) / 20);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.5;
    for (let c = 0; c < crack; c++) {
      ctx.beginPath();
      ctx.moveTo(px + 10 + c * 15, py);
      ctx.lineTo(px + 20 + c * 12, py + h);
      ctx.stroke();
    }
  }
}

function drawMovingPlatformVector(px, py, w, h, timer) {
  const grad = makeLinearGradient(ctx, px, py, px + w, py, [
    { offset: 0, color: '#5B8DEF' },
    { offset: 0.5, color: '#4169E1' },
    { offset: 1, color: '#2E5CB8' }
  ]);
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, w, h);
  ctx.fillStyle = '#FFD700';
  const pulse = timer % 20 < 10;
  if (pulse) ctx.fillRect(px + 4, py + 3, w - 8, 2);
}

function drawRockVector(px, py, w, h) {
  ctx.save();
  ctx.translate(px, py);
  const path = Path2DCache.get('M2 ' + h + ' L' + (w * 0.3) + ' 2 L' + (w * 0.7) + ' 4 L' + (w - 2) + ' ' + h + ' Z');
  ctx.fillStyle = '#696969';
  ctx.shadowColor = '#333';
  ctx.shadowBlur = 6;
  ctx.fill(path);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#4A4A4A';
  ctx.fillRect(w * 0.3, h * 0.3, w * 0.3, h * 0.3);
  ctx.restore();
}

function drawPendulumVector(obs, px, py) {
  const ox = obs.originalX - camera.x;
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ox, obs.originalY);
  ctx.lineTo(px, py);
  ctx.stroke();
  const grad = makeRadialGradient(ctx, px + obs.radius, py + obs.radius, 0, obs.radius, [
    { offset: 0, color: '#FF6347' },
    { offset: 1, color: '#CC0000' }
  ]);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(px, py, obs.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawHammerVector(obs) {
  const ox = obs.originalX - camera.x;
  ctx.fillStyle = '#4A4A4A';
  ctx.fillRect(ox, obs.originalY, 5, obs.hammerY - obs.originalY);
  const grad = makeLinearGradient(ctx, ox - 3, obs.hammerY, ox + obs.w + 6, obs.hammerY + obs.h, [
    { offset: 0, color: '#888' },
    { offset: 1, color: '#444' }
  ]);
  ctx.fillStyle = grad;
  ctx.fillRect(ox - 3, obs.hammerY, obs.w + 6, obs.h);
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(ox, obs.hammerY + 2, obs.w, 3);
}

function drawJumpPadVector(px, py, w, h, timer) {
  const grad = makeLinearGradient(ctx, px, py, px, py + h, [
    { offset: 0, color: '#FFE566' },
    { offset: 1, color: '#FF8C00' }
  ]);
  ctx.fillStyle = grad;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = timer % 10 < 5 ? 12 : 4;
  ctx.fillRect(px, py, w, h);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('↑', px + w / 2 - 4, py + h - 4);
}

function drawLavaVector(px, py, w, h, timer) {
  const grad = makeLinearGradient(ctx, px, py, px, py + h, [
    { offset: 0, color: '#FF6600' },
    { offset: 0.5, color: '#FF0000' },
    { offset: 1, color: '#AA0000' }
  ]);
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, w, h);
  for (let i = 0; i < w; i += 12) {
    const bob = Math.sin(timer * 0.1 + i) * 2;
    ctx.fillStyle = '#FFAA00';
    ctx.beginPath();
    ctx.arc(px + i + 6, py + 4 + bob, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLaserVector(px, py, w, h, on) {
  ctx.fillStyle = '#555';
  ctx.fillRect(px - 2, py, w + 4, h);
  if (on) {
    const grad = makeLinearGradient(ctx, px, py, px + w, py, [
      { offset: 0, color: 'rgba(255,0,0,0.3)' },
      { offset: 0.5, color: '#FF0000' },
      { offset: 1, color: 'rgba(255,0,0,0.3)' }
    ]);
    ctx.fillStyle = grad;
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 15;
    ctx.fillRect(px, py, w, h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(px, py, w, 2);
    ctx.fillRect(px, py + h - 2, w, 2);
  }
}

function drawElectricVector(px, py, w, h, timer) {
  const grad = makeLinearGradient(ctx, px, py, px + w, py + h, [
    { offset: 0, color: '#1E3A8A' },
    { offset: 1, color: '#3B82F6' }
  ]);
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, w, h);
  if (timer % 10 < 5) {
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 8;
    for (let i = 0; i < h; i += 8) {
      const sx = px + seededRandom(timer + i) * w;
      ctx.beginPath();
      ctx.moveTo(sx, py + i);
      ctx.lineTo(sx + seededRandom(timer + i + 1) * 10 - 5, py + i + 4);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }
}

function drawSchoolBagVector(px, py, w, h) {
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(px, py, w, h);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(px + 4, py + 6, w - 8, 5);
}

function drawPuddleVector(px, py, w, h) {
  const grad = makeLinearGradient(ctx, px, py, px, py + h, [
    { offset: 0, color: 'rgba(120,180,255,0.7)' },
    { offset: 1, color: 'rgba(60,120,200,0.8)' }
  ]);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(px + w / 2, py + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrowVector(px, py, w, h) {
  ctx.fillStyle = '#111';
  ctx.fillRect(px + 6, py + 8, w - 12, h - 12);
  ctx.fillRect(px, py + 12, 8, 6);
  ctx.fillRect(px + w - 8, py + 12, 8, 6);
}

function drawBicycleVector(px, py, w, h) {
  ctx.strokeStyle = '#2F2F2F';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(px + 14, py + h - 8, 10, 0, Math.PI * 2);
  ctx.arc(px + w - 14, py + h - 8, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px + 14, py + h - 8);
  ctx.lineTo(px + w / 2, py + 4);
  ctx.lineTo(px + w - 14, py + h - 8);
  ctx.stroke();
}

function drawBallVector(px, py, w, h) {
  ctx.fillStyle = '#FFA500';
  ctx.beginPath();
  ctx.arc(px + w / 2, py + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPaperVector(px, py, w, h, type) {
  ctx.fillStyle = type === 'copyPaper' ? '#EEEEEE' : '#FFF';
  ctx.fillRect(px, py, w, h);
  ctx.strokeStyle = '#CCC';
  ctx.strokeRect(px, py, w, h);
}

function drawWallVector(px, py, w, h) {
  ctx.fillStyle = '#4A4A4A';
  ctx.fillRect(px, py, w, h);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(px + 3, py + 6, w - 6, 3);
}

function drawCanVector(px, py, w, h) {
  ctx.fillStyle = '#B0BEC5';
  ctx.fillRect(px, py, w, h);
  ctx.fillStyle = '#78909C';
  ctx.fillRect(px, py, w, 3);
}

function drawCardVector(px, py, w, h) {
  ctx.fillStyle = '#FFF';
  ctx.fillRect(px, py, w, h);
  ctx.fillStyle = '#1E88E5';
  ctx.fillRect(px + 3, py + 3, w - 6, 5);
}

function drawCupVector(px, py, w, h) {
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(px + 3, py, w - 6, h);
  ctx.strokeStyle = '#DDD';
  ctx.lineWidth = 2;
  ctx.strokeRect(px + w - 3, py + 6, 6, 10);
}

function drawCrowdVector(px, py, w, h) {
  ctx.fillStyle = '#1E1E1E';
  ctx.fillRect(px, py, w, h);
  ctx.fillStyle = '#555';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(px + 6 + i * 16, py + 6, 10, h - 10);
  }
}

function drawMagicFlameVector(px, py, w, h, timer) {
  const flicker = Math.sin(timer * 0.2) * 4;
  const grad = makeLinearGradient(ctx, px, py, px, py + h, [
    { offset: 0, color: '#FFD700' },
    { offset: 0.5, color: '#FF4500' },
    { offset: 1, color: '#8B0000' }
  ]);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(px + w / 2, py - flicker);
  ctx.lineTo(px + w, py + h);
  ctx.lineTo(px, py + h);
  ctx.closePath();
  ctx.fill();
}
