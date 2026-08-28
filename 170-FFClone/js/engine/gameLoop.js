import { updateInput } from './input.js';

const TARGET_FPS = 60;
const FRAME_MS = 1000 / TARGET_FPS;

let lastTime = 0;
let _update = null;
let _draw = null;
let rafId = null;

export function startLoop(updateFn, drawFn) {
  _update = updateFn;
  _draw = drawFn;
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
}

export function stopLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

function loop(now) {
  rafId = requestAnimationFrame(loop);
  const delta = now - lastTime;
  if (delta < FRAME_MS) return;
  lastTime = now - (delta % FRAME_MS);

  updateInput();
  _update(Math.min(delta, 100));
  _draw();
}
