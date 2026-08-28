import { ctx, LOGICAL_W, LOGICAL_H } from '../engine/canvas.js';
import { keys } from '../engine/input.js';
import { sfxClick } from '../engine/audio.js';
import { setScene } from './sceneManager.js';

const TITLE = 'FINAL FANTASY';
const SUBTITLE = 'CLONE';
const PRESS_START = '－ PRESS START －';

let blinkTimer = 0;
let blinkVisible = true;
let stars = [];
let ready = false;
let fadeAlpha = 0;
let fadingOut = false;
let onTransition = null;

export function createTitleScene(transitionFn) {
  onTransition = transitionFn;
  stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * LOGICAL_W,
    y: Math.random() * LOGICAL_H,
    r: Math.random() * 1.5 + 0.3,
    spd: Math.random() * 0.3 + 0.05,
  }));
  ready = false;
  fadingOut = false;
  fadeAlpha = 1;

  return {
    init() {
      // fade-in
      ready = false;
      fadeAlpha = 1;
      fadingOut = false;
      blinkTimer = 0;
      blinkVisible = true;
    },
    update(dt) {
      blinkTimer += dt;
      if (blinkTimer > 500) { blinkTimer = 0; blinkVisible = !blinkVisible; }

      // fade-in
      if (!ready) {
        fadeAlpha = Math.max(0, fadeAlpha - dt / 800);
        if (fadeAlpha === 0) ready = true;
        return;
      }

      // fade-out transition
      if (fadingOut) {
        fadeAlpha = Math.min(1, fadeAlpha + dt / 400);
        if (fadeAlpha >= 1) onTransition?.();
        return;
      }

      // star scroll
      for (const s of stars) {
        s.y += s.spd;
        if (s.y > LOGICAL_H) { s.y = 0; s.x = Math.random() * LOGICAL_W; }
      }

      if (keys.aP || keys.bP || keys.startP) {
        sfxClick(true);
        fadingOut = true;
      }
    },
    draw() {
      // background
      ctx.fillStyle = '#000018';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      // stars
      ctx.fillStyle = '#ffffff';
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // title
      ctx.textAlign = 'center';
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 36px serif';
      ctx.fillText(TITLE, LOGICAL_W / 2, 90);

      ctx.fillStyle = '#8ad4f8';
      ctx.font = 'bold 22px serif';
      ctx.fillText(SUBTITLE, LOGICAL_W / 2, 120);

      // decorative line
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(LOGICAL_W / 2 - 100, 135);
      ctx.lineTo(LOGICAL_W / 2 + 100, 135);
      ctx.stroke();

      // crystal icon (simple)
      drawCrystal(LOGICAL_W / 2, 175);

      // press start
      if (blinkVisible || fadingOut) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.fillText(PRESS_START, LOGICAL_W / 2, 240);
      }

      // copyright
      ctx.fillStyle = '#555';
      ctx.font = '10px monospace';
      ctx.fillText('© 2026 TITAN GAMES', LOGICAL_W / 2, LOGICAL_H - 8);

      // fade overlay
      if (fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
        ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      }
    },
    destroy() {},
  };
}

function drawCrystal(cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  // glow
  const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
  grad.addColorStop(0, 'rgba(100,200,255,0.4)');
  grad.addColorStop(1, 'rgba(100,200,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.fill();
  // crystal shape
  ctx.fillStyle = '#8ad4f8';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(12, -4);
  ctx.lineTo(8, 18);
  ctx.lineTo(0, 22);
  ctx.lineTo(-8, 18);
  ctx.lineTo(-12, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(-2, -18);
  ctx.lineTo(5, -5);
  ctx.lineTo(-3, -5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
