import { ctx, LOGICAL_W, LOGICAL_H } from '../engine/canvas.js';
import { TILE_SIZE, MAP_W, MAP_H, isWalkable, getTile, TILE } from './tilemap.js';

const MOVE_MS = 180;     // 1マス移動にかかる時間(ms)
const TILE_PX = TILE_SIZE;

export function createPlayer(startX, startY) {
  const p = {
    // タイル座標
    tileX: startX,
    tileY: startY,
    // 描画用ピクセル座標（スムーズ移動）
    drawX: startX * TILE_PX,
    drawY: startY * TILE_PX,
    // 移動先
    targetX: startX * TILE_PX,
    targetY: startY * TILE_PX,
    moving: false,
    moveTimer: 0,
    dir: 'down',   // up / down / left / right
    animFrame: 0,  // 0 or 1 (歩行アニメーション)
    animTimer: 0,
    steps: 0,
    onStepComplete: null,  // (tileType) => void
  };

  return {
    get tileX()  { return p.tileX; },
    get tileY()  { return p.tileY; },
    get drawX()  { return p.drawX; },
    get drawY()  { return p.drawY; },
    get steps()  { return p.steps; },

    update(dt, keys) {
      // スムーズ移動中
      if (p.moving) {
        p.moveTimer += dt;
        const t = Math.min(1, p.moveTimer / MOVE_MS);
        const startX = p.tileX * TILE_PX - (p.dir === 'right' ? TILE_PX : p.dir === 'left' ? -TILE_PX : 0);
        const startY = p.tileY * TILE_PX - (p.dir === 'down' ? TILE_PX : p.dir === 'up' ? -TILE_PX : 0);
        p.drawX = startX + (p.targetX - startX) * t;
        p.drawY = startY + (p.targetY - startY) * t;

        if (t >= 1) {
          p.drawX = p.targetX;
          p.drawY = p.targetY;
          p.moving = false;
          p.steps++;
          p.onStepComplete?.(getTile(p.tileX, p.tileY));
        }
        return;
      }

      // 入力受け付け
      let dx = 0, dy = 0;
      if (keys.up)    { dy = -1; p.dir = 'up'; }
      else if (keys.down)  { dy =  1; p.dir = 'down'; }
      else if (keys.left)  { dx = -1; p.dir = 'left'; }
      else if (keys.right) { dx =  1; p.dir = 'right'; }

      if (dx !== 0 || dy !== 0) {
        const nx = p.tileX + dx, ny = p.tileY + dy;
        if (isWalkable(nx, ny)) {
          p.tileX = nx;
          p.tileY = ny;
          p.targetX = nx * TILE_PX;
          p.targetY = ny * TILE_PX;
          p.moving = true;
          p.moveTimer = 0;
          p.animFrame ^= 1;
        }
      }

      // 歩行アニメ（移動してなくてもゆっくり揺れる）
      p.animTimer += dt;
      if (p.animTimer > 400) { p.animTimer = 0; }
    },

    setStepCallback(fn) { p.onStepComplete = fn; },

    draw(camX, camY) {
      const sx = p.drawX - camX;
      const sy = p.drawY - camY;
      _drawSprite(sx, sy, p.dir, p.animFrame, p.moving);
    },
  };
}

function _drawSprite(sx, sy, dir, frame, moving) {
  const cx = sx + TILE_PX / 2;
  const cy = sy + TILE_PX / 2;

  // 影
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, sy + TILE_PX - 3, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // 足（アニメーション）
  const legOffset = moving ? (frame === 0 ? 3 : -3) : 0;
  ctx.fillStyle = '#3a5a8a';
  ctx.fillRect(cx - 6, cy + 4, 5, 8 + (legOffset > 0 ? legOffset : 0));
  ctx.fillRect(cx + 1, cy + 4, 5, 8 + (legOffset < 0 ? -legOffset : 0));

  // 体（マント）
  ctx.fillStyle = '#4a7aaa';
  ctx.fillRect(cx - 8, cy - 6, 16, 14);

  // 頭
  ctx.fillStyle = '#e8c890';
  ctx.beginPath();
  ctx.arc(cx, cy - 9, 7, 0, Math.PI * 2);
  ctx.fill();

  // 帽子
  ctx.fillStyle = '#c03030';
  ctx.fillRect(cx - 7, cy - 14, 14, 5);
  ctx.fillRect(cx - 4, cy - 18, 8, 5);

  // 方向インジケーター（目の位置で表現）
  ctx.fillStyle = '#3a2000';
  if (dir === 'down') {
    ctx.fillRect(cx - 3, cy - 10, 2, 2);
    ctx.fillRect(cx + 1, cy - 10, 2, 2);
  } else if (dir === 'up') {
    // 後頭部なので目なし
  } else if (dir === 'left') {
    ctx.fillRect(cx - 5, cy - 10, 2, 2);
  } else if (dir === 'right') {
    ctx.fillRect(cx + 3, cy - 10, 2, 2);
  }
}

export function calcCamera(player) {
  // drawX/drawY（スプライトの現在描画位置）を使うことで
  // カメラとスプライトが常に同期し、ガクつきをなくす
  const camX = player.drawX - LOGICAL_W / 2 + TILE_SIZE / 2;
  const camY = player.drawY - LOGICAL_H / 2 + TILE_SIZE / 2;
  return {
    x: Math.max(0, Math.min(MAP_W * TILE_SIZE - LOGICAL_W, camX)),
    y: Math.max(0, Math.min(MAP_H * TILE_SIZE - LOGICAL_H, camY)),
  };
}
