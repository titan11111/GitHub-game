export const LOGICAL_W = 480;
export const LOGICAL_H = 270;

export let canvas, ctx;

export function initCanvas() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  resize();
  window.addEventListener('resize', resize);
  screen.orientation?.addEventListener('change', resize);
}

function resize() {
  const area = document.getElementById('game-area');
  const areaW = area.clientWidth;
  const areaH = area.clientHeight;
  const ratio = Math.min(2, window.devicePixelRatio || 1);

  const scaleX = areaW / LOGICAL_W;
  const scaleY = areaH / LOGICAL_H;
  const scale = Math.min(scaleX, scaleY);

  canvas.style.width  = Math.floor(LOGICAL_W * scale) + 'px';
  canvas.style.height = Math.floor(LOGICAL_H * scale) + 'px';
  canvas.width  = Math.floor(LOGICAL_W * scale * ratio);
  canvas.height = Math.floor(LOGICAL_H * scale * ratio);

  ctx.setTransform(scale * ratio, 0, 0, scale * ratio, 0, 0);
}
