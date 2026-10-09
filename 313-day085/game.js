// 313 巨忍 影丸 — 1コミット目：操作盤の骨組みだけ（画面は入力の表示のみ）
import { createPanel } from './panel.js';

const W = 360, H = 400;
const canvas = document.getElementById('screen');
let paused = false;
const P = createPanel({ canvas, logicalW: W, logicalH: H, onAutoPause: () => { paused = true; } });

function frame() {
  P.poll();
  if (P.hit('start')) paused = !paused;
  if (P.hit('mute')) P.setMute(!P.muted);
  const c = P.ctx;
  c.setTransform(P.res, 0, 0, P.res, 0, 0);
  c.fillStyle = '#120a14'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#f4e6c8'; c.font = 'bold 16px sans-serif'; c.textAlign = 'center';
  c.fillText(paused ? 'ポーズ中（STARTで再開）' : '操作盤テスト', W / 2, 60);
  ['left', 'right', 'up', 'down', 'a', 'b', 'sel', 'start'].forEach((n, i) => {
    c.fillStyle = P.held(n) ? '#e83800' : '#333';
    c.fillRect(30 + (i % 4) * 78, 120 + Math.floor(i / 4) * 70, 64, 50);
    c.fillStyle = '#fff'; c.fillText(n, 62 + (i % 4) * 78, 150 + Math.floor(i / 4) * 70);
  });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
