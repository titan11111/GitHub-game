// 弾・オメガビーム・エフェクト描画（Path2D + グラデーション）

let omegaBeamCanvas = null;
let omegaBeamCtx = null;

function initOmegaBeamCanvas() {
  if (omegaBeamCanvas) return;
  omegaBeamCanvas = document.createElement('canvas');
  omegaBeamCanvas.width = 800;
  omegaBeamCanvas.height = 450;
  omegaBeamCtx = omegaBeamCanvas.getContext('2d');
}

function drawPlayerProjectileEffect(px, py, p) {
  p.timer = (p.timer || 0) + 1;

  if (p.trail && p.trail.length > 0) {
    p.trail.forEach(t => {
      const a = t.life / t.maxLife;
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x - camera.x, t.y, 3 + a * 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  const cx = px + p.w / 2;
  const cy = py + p.h / 2;
  ctx.save();
  ctx.translate(cx, cy);

  if (p.type === 'light') {
    const grad = makeRadialGradient(ctx, 0, 0, 0, 10, [
      { offset: 0, color: '#FFFFFF' },
      { offset: 0.4, color: '#FFFFAA' },
      { offset: 1, color: 'rgba(255,255,100,0)' }
    ]);
    ctx.fillStyle = grad;
    ctx.shadowColor = '#FFFF00';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === 'fire') {
    const flicker = Math.sin(p.timer * 0.5) * 3;
    const firePath = Path2DCache.get('M0 8 Q-6 ' + (4 + flicker) + ' 0 -8 Q6 ' + (4 + flicker) + ' 0 8');
    const grad = makeRadialGradient(ctx, 0, 0, 0, 12, [
      { offset: 0, color: '#FFFF00' },
      { offset: 0.5, color: '#FF6600' },
      { offset: 1, color: 'rgba(255,50,0,0)' }
    ]);
    ctx.fillStyle = grad;
    ctx.shadowColor = '#FF4500';
    ctx.shadowBlur = 12;
    ctx.fill(firePath);
  } else if (p.type === 'exploding') {
    ctx.fillStyle = '#333';
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(-1, -10, 2, 5);
    const spark = Math.sin(p.timer * 0.8) > 0;
    if (spark) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(1, -11, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (p.type === 'axe') {
    p.rotation = (p.rotation || 0) + 0.4;
    ctx.rotate(p.rotation);
    const axePath = Path2DCache.get('M-2 -12 L2 -12 L2 10 L-2 10 Z M-10 -6 A10 10 0 0 1 10 -6 L2 -6 L-2 -6 Z');
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-2, -10, 4, 20);
    const blade = makeLinearGradient(ctx, -12, -8, 12, -8, [
      { offset: 0, color: '#E8E8E8' },
      { offset: 0.5, color: '#C0C0C0' },
      { offset: 1, color: '#888' }
    ]);
    ctx.fillStyle = blade;
    ctx.shadowColor = '#AAA';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(0, -6, 12, Math.PI, 0);
    ctx.fill();
  } else if (p.type === 'pierce') {
    const icePath = Path2DCache.get('M0 -10 L8 0 L0 10 L-8 0 Z M0 -6 L4 0 L0 6 L-4 0 Z');
    ctx.fillStyle = makeLinearGradient(ctx, -8, -10, 8, 10, [
      { offset: 0, color: '#E0FFFF' },
      { offset: 0.5, color: '#00CED1' },
      { offset: 1, color: '#008B8B' }
    ]);
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 10;
    ctx.fill(icePath);
  } else if (p.type === 'beam') {
    const hue = (p.timer * 4) % 360;
    const c1 = 'hsl(' + hue + ',100%,60%)';
    const c2 = 'hsl(' + ((hue + 120) % 360) + ',100%,50%)';
    const grad = makeLinearGradient(ctx, -20, -8, 20, 8, [
      { offset: 0, color: c1 },
      { offset: 0.5, color: '#FFF' },
      { offset: 1, color: c2 }
    ]);
    ctx.fillStyle = grad;
    ctx.shadowColor = c1;
    ctx.shadowBlur = 18;
    ctx.fillRect(-22, -10, 44, 20);
  }

  ctx.restore();
}

function drawProjectileSVG(x, y, enemy, projectile) {
  const px = x - camera.x;
  const py = y;

  if (enemy) {
    if (projectile && projectile.laser) {
      const grad = makeLinearGradient(ctx, px, py, px + (projectile.w || 20), py, [
        { offset: 0, color: '#FF0000' },
        { offset: 0.5, color: '#FFD700' },
        { offset: 1, color: '#FF6B6B' }
      ]);
      ctx.fillStyle = grad;
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 8;
      ctx.fillRect(px, py, projectile.w || 20, projectile.h || 30);
    } else if (projectile && projectile.homing) {
      const grad = makeRadialGradient(ctx, px + 6, py + 6, 0, 8, [
        { offset: 0, color: '#FFF' },
        { offset: 0.5, color: '#00BFFF' },
        { offset: 1, color: 'rgba(0,150,255,0)' }
      ]);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px + 6, py + 6, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const grad = makeRadialGradient(ctx, px + 4, py + 4, 0, 6, [
        { offset: 0, color: '#FFD700' },
        { offset: 0.5, color: '#FF0000' },
        { offset: 1, color: 'rgba(255,0,0,0)' }
      ]);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px + 4, py + 4, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (projectile) {
    drawPlayerProjectileEffect(px, py - (projectile.h || 6) / 2, projectile);
  } else {
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(px + 6, py + 3, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOmegaBeamEffects(ctx) {
  if (omegaBeam.isCharging && omegaBeam.charges > 0 && player) {
    const pct = getOmegaChargePercent();
    const px = player.x - camera.x + player.w / 2;
    const py = player.y + player.h / 2;
    ctx.strokeStyle = 'rgba(255, ' + Math.floor(255 * (1 - pct)) + ', 0, 0.9)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(px, py, 30 + pct * 50, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 22px Bangers, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('チャージ ' + Math.floor(pct * 100) + '%', px, py - 55);
  }

  if (!omegaBeam.isActive) return;

  initOmegaBeamCanvas();
  const progress = getOmegaBeamProgress();
  const alpha = 1 - progress * 0.5;
  const eased = easeOutCubic(Math.min(1, progress * 2));
  const beamWidth = canvas.width * (0.3 + eased * 0.7);
  const beamHeight = canvas.height * (0.15 + eased * 0.2);

  omegaBeamCtx.clearRect(0, 0, 800, 450);
  const bx = (800 - beamWidth) / 2;
  const by = 225 - beamHeight / 2;
  const beamGrad = omegaBeamCtx.createLinearGradient(bx, by, bx + beamWidth, by + beamHeight);
  beamGrad.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
  beamGrad.addColorStop(0.3, 'rgba(255,215,0,' + (alpha * 0.9) + ')');
  beamGrad.addColorStop(0.6, 'rgba(255,100,0,' + (alpha * 0.7) + ')');
  beamGrad.addColorStop(1, 'rgba(255,0,0,' + (alpha * 0.3) + ')');
  omegaBeamCtx.fillStyle = beamGrad;
  omegaBeamCtx.fillRect(bx, by, beamWidth, beamHeight);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const screenGrad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.8
  );
  screenGrad.addColorStop(0, 'rgba(255,215,0,' + (alpha * 0.5) + ')');
  screenGrad.addColorStop(0.5, 'rgba(255,100,0,' + (alpha * 0.25) + ')');
  screenGrad.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = screenGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(omegaBeamCanvas, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';

  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2 + progress * 4;
    const dist = 80 + progress * 180;
    const sx = canvas.width / 2 + Math.cos(angle) * dist;
    const sy = canvas.height / 2 + Math.sin(angle) * dist;
    ctx.fillStyle = 'rgba(255,215,0,' + (alpha * 0.8) + ')';
    ctx.beginPath();
    ctx.arc(sx, sy, 3 + seededRandom(i + progress * 100) * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
  ctx.font = 'bold 48px Bangers, monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 3;
  ctx.strokeText('オメガビーム!!!', canvas.width / 2, canvas.height / 2);
  ctx.fillText('オメガビーム!!!', canvas.width / 2, canvas.height / 2);
  ctx.restore();
}

function drawItem(item) {
  const px = item.x - camera.x;
  const py = item.y;

  if (item.type === 'medkit') {
    ctx.save();
    ctx.translate(px, py);
    const path = Path2DCache.get('M2 2 L18 2 L18 13 L2 13 Z');
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 8;
    ctx.fill(path);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(7, 2, 6, 11);
    ctx.fillRect(3, 5, 14, 5);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke(path);
    const glow = Math.sin(item.floatTimer * 0.1) * 0.3 + 0.7;
    ctx.fillStyle = 'rgba(255,0,0,' + (glow * 0.25) + ')';
    ctx.fillRect(-2, -2, 24, 19);
    ctx.restore();
  }

  if (item.type === 'restPoint') {
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(-20, 12, 58, 8);
    ctx.fillRect(-16, 20, 5, 12);
    ctx.fillRect(30, 20, 5, 12);
    ctx.fillStyle = '#7CB342';
    ctx.fillRect(-22, 8, 62, 6);
    ctx.fillStyle = '#F5F5F5';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('REST', -7, 6);
    ctx.restore();
  }
}
