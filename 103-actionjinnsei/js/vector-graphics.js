// Path2D ベクター描画ユーティリティ

const Path2DCache = {
  _cache: {},
  get(d) {
    if (!this._cache[d]) this._cache[d] = new Path2D(d);
    return this._cache[d];
  },
  clear() { this._cache = {}; }
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function seededRandom(seed) {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function makeLinearGradient(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(s => g.addColorStop(s.offset, s.color));
  return g;
}

function makeRadialGradient(ctx, cx, cy, r0, r1, stops) {
  const g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
  stops.forEach(s => g.addColorStop(s.offset, s.color));
  return g;
}

function drawVectorPart(ctx, part, ox, oy, animOffset, armOffset) {
  const path = Path2DCache.get(part.d);
  const ay = (part.oy || 0) + (part.animLeg ? animOffset : 0) + (part.animArm ? armOffset : 0);
  ctx.save();
  ctx.translate(ox + (part.ox || 0), oy + ay);

  if (part.shadow) {
    ctx.save();
    ctx.translate(part.shadowX || 1, part.shadowY || 2);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.fill(path);
    ctx.restore();
  }

  if (part.scale) ctx.scale(part.scale, part.scale);

  if (part.gradient) {
    const g = part.gradientType === 'radial'
      ? makeRadialGradient(ctx, 0, 0, 0, part.gradR || 20, part.gradient)
      : makeLinearGradient(ctx, part.gx0 || -10, part.gy0 || 0, part.gx1 || 10, part.gy1 || 0, part.gradient);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = part.fill || '#FFF';
  }

  if (part.glow) {
    ctx.shadowColor = part.glow;
    ctx.shadowBlur = part.glowBlur || 8;
  }
  ctx.fill(path);

  if (part.stroke) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = part.stroke;
    ctx.lineWidth = part.strokeWidth || 1;
    ctx.stroke(path);
  }

  if (part.highlight) {
    const hp = Path2DCache.get(part.highlight.d);
    ctx.shadowBlur = 0;
    ctx.fillStyle = part.highlight.fill || 'rgba(255,255,255,0.25)';
    ctx.fill(hp);
  }
  ctx.restore();
}

function drawVectorBlueprint(ctx, blueprint, x, y, scale, facing, animFrame) {
  const animOffset = animFrame ? 2 : 0;
  const armOffset = animFrame ? -2 : 2;
  if (blueprint.shadow) {
    ctx.save();
    ctx.translate(x + 2, y + 3);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(15 * scale, 38 * scale, 12 * scale, 4 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);
  blueprint.parts.forEach(part => drawVectorPart(ctx, part, 0, 0, animOffset, armOffset));
  ctx.restore();
}

function getRenderPosition(actor) {
  if (typeof getRenderAlpha !== 'function') return { x: actor.x, y: actor.y };
  const alpha = getRenderAlpha();
  return {
    x: lerp(actor.prevX !== undefined ? actor.prevX : actor.x, actor.x, alpha),
    y: lerp(actor.prevY !== undefined ? actor.prevY : actor.y, actor.y, alpha)
  };
}

// ステージ1 プレイヤー（小学生）ベクターブループリント
const PLAYER_BLUEPRINTS = {
  1: {
    shadow: true,
    parts: [
      { d: 'M8 38 L8 42 L12 42 L12 38 Z M18 38 L18 42 L22 42 L22 38 Z', fill: '#1a1a2e', animLeg: true },
      { d: 'M9 35 L21 35 L21 38 L9 38 Z', fill: '#0D47A1', animLeg: true },
      { d: 'M8 23 L22 23 L22 35 L8 35 Z', fill: '#4A90E2', gradient: [{ offset: 0, color: '#70A9F0' }, { offset: 1, color: '#336EC2' }], gx0: 8, gy0: 23, gx1: 22, gy1: 35 },
      { d: 'M4 24 L8 24 L8 34 L4 34 Z M22 24 L26 24 L26 34 L22 34 Z', fill: '#4A90E2', animArm: true },
      { d: 'M3 25 L8 25 L8 34 L3 34 Z', fill: '#8B4513' },
      { d: 'M6 16 L24 16 L24 23 L6 23 Z', fill: '#8B4513', gradient: [{ offset: 0, color: '#A35D32' }, { offset: 1, color: '#6F3E22' }] },
      { d: 'M9 6 Q15 1 21 6 L21 19 Q15 24 9 19 Z', fill: '#FFE4B5', gradient: [{ offset: 0, color: '#FFF2DF' }, { offset: 1, color: '#E9C79F' }], gradientType: 'radial', gradR: 13 },
      { d: 'M8 5 L22 5 L22 9 L8 9 Z', fill: '#FFC400' },
      { d: 'M9 8 L21 8 L21 10 L9 10 Z', fill: '#E65100' },
      { d: 'M11 12 L13 13 L11 13 Z M19 12 L17 13 L19 13 Z', fill: '#222' },
      { d: 'M12 16 Q15 18 18 16', stroke: '#D65A7A', strokeWidth: 1.4, fill: 'transparent' }
    ]
  },
  2: {
    parts: [
      { d: 'M10 36 L20 36 L20 38 L10 38 Z', fill: '#000080', animLeg: true },
      { d: 'M-2 30 L30 30 L30 33 L-2 33 Z', fill: '#333' },
      { d: 'M14 20 L17 20 L17 32 L14 32 Z', fill: '#333' },
      { d: 'M6 22 L24 22 L24 36 L6 36 Z', fill: '#1a1a1a', gradient: [{ offset: 0, color: '#333' }, { offset: 1, color: '#111' }] },
      { d: 'M10 6 Q15 2 20 6 L20 18 Q15 22 10 18 Z', fill: '#FFE4B5' },
      { d: 'M11 10 L13 12 L11 12 Z M19 10 L17 12 L19 12 Z', fill: '#222' }
    ]
  },
  3: {
    parts: [
      { d: 'M10 36 L20 36 L20 38 L10 38 Z', fill: '#111', animLeg: true },
      { d: 'M6 20 L24 20 L24 38 L6 38 Z', fill: '#2F2F2F', gradient: [{ offset: 0, color: '#444' }, { offset: 1, color: '#222' }] },
      { d: 'M8 20 L22 20 L22 24 L8 24 Z', fill: '#FFF' },
      { d: 'M10 4 Q15 0 20 4 L20 18 Q15 22 10 18 Z', fill: '#FFE4B5' },
      { d: 'M8 4 L22 4 L22 12 L8 12 Z', fill: '#4A4A4A' },
      { d: 'M11 10 L13 12 L11 12 Z M19 10 L17 12 L19 12 Z', fill: '#222' }
    ]
  },
  4: {
    parts: [
      { d: 'M10 36 L20 36 L20 38 L10 38 Z', fill: '#111', animLeg: true },
      { d: 'M6 22 L24 22 L24 38 L6 38 Z', fill: '#4169E1' },
      { d: 'M10 4 Q15 0 20 4 L20 18 Q15 22 10 18 Z', fill: '#FFE4B5' },
      { d: 'M8 4 L22 4 L22 14 L8 14 Z', fill: '#4A4A4A' },
      { d: 'M11 10 L13 12 L11 12 Z M19 10 L17 12 L19 12 Z', fill: '#222' }
    ]
  },
  5: {
    parts: [
      { d: 'M10 36 L20 36 L20 38 L10 38 Z', fill: '#1C1C1C', animLeg: true },
      { d: 'M6 22 L24 22 L24 38 L6 38 Z', fill: '#1C1C1C', gradient: [{ offset: 0, color: '#333' }, { offset: 1, color: '#111' }] },
      { d: 'M13 22 L17 22 L17 32 L13 32 Z', fill: '#FFF' },
      { d: 'M13 24 L17 30 L13 30 Z', fill: '#8B0000' },
      { d: 'M10 4 Q15 0 20 4 L20 18 Q15 22 10 18 Z', fill: '#FFE4B5' },
      { d: 'M11 10 L13 12 L11 12 Z M19 10 L17 12 L19 12 Z', fill: '#222' }
    ]
  },
  6: {
    parts: [
      { d: 'M10 36 L20 36 L20 38 L10 38 Z', fill: '#2F2F2F', animLeg: true },
      { d: 'M6 22 L24 22 L24 38 L6 38 Z', fill: '#2F2F2F' },
      { d: 'M13 22 L17 22 L17 32 L13 32 Z', fill: '#E0E0E0' },
      { d: 'M10 4 Q15 0 20 4 L20 18 Q15 22 10 18 Z', fill: '#FFE4B5' },
      { d: 'M10 11 L20 11 L20 12 L10 12 Z', fill: '#000' },
      { d: 'M12 14 L18 14 L18 15 L12 15 Z', fill: '#8B0000' }
    ]
  },
  7: {
    parts: [
      { d: 'M-4 26 L4 26 L4 40 L-4 40 Z', fill: '#C0C0C0', glow: '#AAA', glowBlur: 3 },
      { d: 'M6 20 L24 20 L24 38 L6 38 Z', fill: '#C0C0C0', gradient: [{ offset: 0, color: '#E8E8E8' }, { offset: 1, color: '#909090' }] },
      { d: 'M8 20 L22 20 L22 24 L8 24 Z', fill: '#4169E1' },
      { d: 'M10 2 L20 2 L20 8 L10 8 Z', fill: '#C0C0C0' },
      { d: 'M10 4 Q15 0 20 4 L20 18 Q15 22 10 18 Z', fill: '#FFE4B5' },
      { d: 'M8 8 L22 8 L22 16 L8 16 Z', fill: '#FFD700', glow: '#FFD700', glowBlur: 6 },
      { d: 'M25 14 L27 14 L27 34 L25 34 Z', fill: '#C0C0C0' },
      { d: 'M11 10 L13 12 L11 12 Z M19 10 L17 12 L19 12 Z', fill: '#222' }
    ]
  }
};

// 敵ベクター（簡略版・ステージ1 normal）
const ENEMY_BLUEPRINTS = {
  '1_normal': {
    shadow: true,
    parts: [
      { d: 'M5 8 L25 8 L25 30 L5 30 Z', fill: '#FFB6C1' },
      { d: 'M8 2 L22 2 L22 12 L8 12 Z', fill: '#FFE4B5' },
      { d: 'M8 3 L22 3 L22 6 L8 6 Z', fill: '#000080' },
      { d: 'M10 5 L12 7 L10 7 Z M18 5 L16 7 L18 7 Z', fill: '#222' }
    ]
  },
  '1_jumping': {
    shadow: true,
    parts: [
      { d: 'M8 14 L22 14 L22 24 L8 24 Z', fill: '#8B4513' },
      { d: 'M6 8 L24 8 L24 16 L6 16 Z', fill: '#8B4513' },
      { d: 'M4 6 L10 6 L8 14 Z M20 6 L26 6 L22 14 Z', fill: '#654321' },
      { d: 'M10 12 L18 12 L18 16 L10 16 Z', fill: '#222' },
      { d: 'M11 10 L13 11 L11 11 Z M17 10 L15 11 L17 11 Z', fill: '#FFF' }
    ]
  },
  '1_hovering': {
    shadow: true,
    parts: [
      { d: 'M8 12 L22 12 L22 24 L8 24 Z', fill: '#1E1E24', gradient: [{ offset: 0, color: '#333344' }, { offset: 1, color: '#14141A' }], gx0: 8, gy0: 12, gx1: 22, gy1: 24 },
      { d: 'M10 9 L20 9 L20 13 L10 13 Z', fill: '#2F2F3A' },
      { d: 'M5 14 L8 14 L8 20 L5 20 Z M22 14 L25 14 L25 20 L22 20 Z', fill: '#505060' },
      { d: 'M3 10 L9 10 L9 12 L3 12 Z M21 10 L27 10 L27 12 L21 12 Z', fill: '#8892A0' },
      { d: 'M13 15 L17 15 L17 19 L13 19 Z', fill: '#00E5FF', glow: '#00E5FF', glowBlur: 7 },
      { d: 'M11 21 L19 21 L19 22 L11 22 Z', fill: '#B0BEC5' }
    ]
  }
};

const BOSS_BLUEPRINTS = {
  1: {
    parts: [
      { d: 'M0 12 L60 12 L60 58 L0 58 Z', fill: '#4169E1', gradient: [{ offset: 0, color: '#5B8DEF' }, { offset: 1, color: '#2E5CB8' }] },
      { d: 'M10 10 L50 10 L50 16 L10 16 Z', fill: '#1E90FF' },
      { d: 'M15 0 L45 0 L45 22 L15 22 Z', fill: '#FFE4B5' },
      { d: 'M15 -2 L45 -2 L45 3 L15 3 Z', fill: '#000080' },
      { d: 'M20 6 L24 10 L20 10 Z M36 6 L40 10 L36 10 Z', fill: '#222' }
    ]
  },
  2: {
    parts: [
      { d: 'M0 12 L60 12 L60 58 L0 58 Z', fill: '#1a1a1a' },
      { d: 'M15 -2 L45 -2 L45 6 L15 6 Z', fill: '#FF4500' },
      { d: 'M15 0 L45 0 L45 22 L15 22 Z', fill: '#FFE4B5' },
      { d: 'M12 24 L48 24 L48 32 L12 32 Z', fill: '#FFF' }
    ]
  },
  3: {
    parts: [
      { d: 'M0 12 L60 12 L60 58 L0 58 Z', fill: '#8B0000' },
      { d: 'M15 -4 L45 -4 L45 8 L15 8 Z', fill: '#FFD700' },
      { d: 'M15 0 L45 0 L45 22 L15 22 Z', fill: '#FFE4B5' },
      { d: 'M22 18 L38 18 L38 22 L22 22 Z', fill: '#000' }
    ]
  },
  4: {
    parts: [
      { d: 'M0 12 L60 12 L60 58 L0 58 Z', fill: '#2F2F2F' },
      { d: 'M12 -2 L48 -2 L48 10 L12 10 Z', fill: '#FFF' },
      { d: 'M15 0 L45 0 L45 22 L15 22 Z', fill: '#FFE4B5' },
      { d: 'M18 6 L42 6 L42 8 L18 8 Z', fill: '#C0C0C0' }
    ]
  },
  5: {
    parts: [
      { d: 'M0 12 L60 12 L60 58 L0 58 Z', fill: '#333' },
      { d: 'M10 16 L50 16 L50 24 L10 24 Z', fill: '#FFD700' },
      { d: 'M15 0 L45 0 L45 22 L15 22 Z', fill: '#FFE4B5' }
    ]
  },
  6: {
    parts: [
      { d: 'M0 12 L60 12 L60 58 L0 58 Z', fill: '#000066', gradient: [{ offset: 0, color: '#000099' }, { offset: 1, color: '#000044' }] },
      { d: 'M0 12 L60 12 L60 14 L0 14 Z', fill: '#FFD700' },
      { d: 'M12 -2 L48 -2 L48 10 L12 10 Z', fill: '#FFF' },
      { d: 'M10 20 L50 20 L50 28 L10 28 Z', fill: '#8B0000' }
    ]
  },
  7: {
    parts: [
      { d: 'M0 12 L60 12 L60 58 L0 58 Z', fill: '#8B0000' },
      { d: 'M10 -6 L25 -6 L20 8 Z M35 -6 L50 -6 L40 8 Z', fill: '#4B0082' },
      { d: 'M15 0 L45 0 L45 22 L15 22 Z', fill: '#FF6B6B' },
      { d: 'M10 26 L50 26 L50 36 L10 36 Z', fill: '#FFD700', glow: '#FFD700', glowBlur: 8 }
    ]
  }
};

function drawCloudVector(ctx, x, y, scale) {
  const path = Path2DCache.get('M0 0 Q15 -10 30 0 Q45 10 60 0 Q75 -8 90 0 Q75 15 60 10 Q45 20 30 10 Q15 20 0 10 Z');
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.shadowColor = 'rgba(255,255,255,0.4)';
  ctx.shadowBlur = 12;
  ctx.fill(path);
  ctx.restore();
}
