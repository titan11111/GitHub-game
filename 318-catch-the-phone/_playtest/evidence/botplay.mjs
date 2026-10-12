// Usage: node botplay.mjs <dir> <mode: avoid|rescue> <fromStage> <toStage> [seed]
// Real keyboard events via CDP. Only drawing is stubbed so game logic runs at full speed.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const { chromium } = await import('file:///Users/gosho/.npm-global/lib/node_modules/playwright/index.mjs');
const [dir, mode = 'avoid', from = '0', to = '9', seed = '1'] = process.argv.slice(2);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.wav': 'audio/wav' };
const srv = createServer(async (q, r) => {
  try {
    const u = q.url.split('?')[0];
    const p = join(process.cwd(), dir, u === '/' ? 'index.html' : u);
    r.setHeader('content-type', mime[extname(p)] || 'application/octet-stream');
    r.end(await readFile(p));
  } catch { r.statusCode = 404; r.end(); }
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.addInitScript(() => {
  for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) for (const f of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced', 'drawRangeElements']) if (C.prototype[f]) C.prototype[f] = function () {};
});
await page.goto(`http://127.0.0.1:${srv.address().port}/?test=1`, { waitUntil: 'networkidle' });
await page.evaluate(s => { let a = s * 9301 + 49297; window.__game.rng(() => { a = (a * 9301 + 49297) % 233280; return a / 233280; }); }, Number(seed));

const held = new Set();
async function setKeys(want) {
  for (const k of [...held]) if (!want.has(k)) { await page.keyboard.up(k); held.delete(k); }
  for (const k of want) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
}
const rectDist = (px, pz, c) => {
  const dx = Math.max(Math.abs(px - c.x) - c.w / 2, 0), dz = Math.max(Math.abs(pz - c.z) - c.d / 2, 0);
  return Math.hypot(dx, dz);
};
function plan(g, rescue) {
  const [px, , pz] = g.position, W = g.world;
  // Rescue: fly to the phone, or run into the nearest phone-holder ahead.
  let aim = null;
  if (g.event && !g.event.resolved) aim = { x: g.event.position[0], z: g.event.position[2], hard: true };
  else if (rescue) {
    let best = null;
    for (const n of g.npcs) if (n.phone && n.state === 'phone' && n.z < pz + .5 && n.z > pz - 16) { const d = Math.hypot(n.x - px, n.z - pz); if (!best || d < best.d) best = { d, x: n.x, z: n.z }; }
    if (best) aim = { x: best.x, z: best.z - .2 };
  }
  const goal = aim || { x: Math.max(-W.w / 2 + 1.2, Math.min(W.w / 2 - 1.2, px)), z: -W.len - 3 };
  let bestA = 0, bestC = Infinity;
  for (let a = -90; a <= 90; a += 10) {
    const th = a * Math.PI / 180, dx = Math.sin(th), dz = -Math.cos(th);
    // Heading relative to goal direction.
    const gd = Math.atan2(goal.x - px, -(goal.z - pz)); // angle of goal from -z axis
    let cost = Math.abs(((th - gd + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0;
    cost += Math.abs(th - gd) * 1.2;
    for (let k = 1; k <= 8; k++) {
      const sx = px + dx * k * .55, sz = pz + dz * k * .55;
      if (Math.abs(sx) > W.w / 2 - .55) cost += 60 / k;
      for (const c of g.solids) { const d = rectDist(sx, sz, c); if (d < .78 && !(aim && aim.hard)) cost += (d < .5 ? 40 : 8) / k; else if (d < .5) cost += 20 / k; }
      for (const c of g.pillars) { const d = Math.hypot(sx - c.x, sz - c.z) - c.r; if (d < .8) cost += 30 / k; }
      for (const n of g.npcs) { if (aim && !aim.hard && Math.hypot(n.x - aim.x, n.z - aim.z) < .3) continue; const d = Math.hypot(sx - n.x, sz - n.z); if (d < 1.1) cost += (rescue && n.phone && n.state === 'phone' ? 2 : 14) / k; }
      for (const c of g.sweepers) { const d = rectDist(sx, sz, c.box); if (d < .9) cost += 25 / k; }
    }
    if (cost < bestC) { bestC = cost; bestA = a; }
  }
  return { ang: bestA * Math.PI / 180, aim: !!aim };
}
const want = a => {
  const ix = Math.sin(a), iz = -Math.cos(a), s = new Set();
  if (ix > .38) s.add('ArrowRight'); else if (ix < -.38) s.add('ArrowLeft');
  if (iz < -.38) s.add('ArrowUp'); else if (iz > .38) s.add('ArrowDown');
  return s;
};

const results = [];
for (let i = Number(from); i <= Number(to); i++) {
  await page.evaluate(k => window.__game.start(k), i);
  const info = await page.evaluate(() => { const g = window.__game.get(); return { name: document.querySelector('#hud strong')?.textContent, world: g.world, calls: g.render.calls }; });
  const t0 = Date.now();
  const stuckAt = []; let lastZ = 4, lastCheck = Date.now(), stuck = 0, bumps = 0, events = 0, lastEv = false, drowned = 0, minGap = 99;
  let final = null;
  while (Date.now() - t0 < 150000) {
    const g = await page.evaluate(() => window.__game.get());
    const ev = !!(g.event && !g.event.resolved);
    if (ev && !lastEv) events++;
    lastEv = ev;
    if (g.state !== 'play') { final = g; break; }
    const { ang } = plan(g, mode === 'rescue');
    const keys = want(ang);
    if (g.stamina > .12) keys.add('ShiftLeft');
    // Stuck breaker: if no forward progress for 4s, shove sideways.
    if (Date.now() - lastCheck > 4000) {
      const prog = lastZ - g.position[2];
      if (prog < .6 && !ev) { stuck++; stuckAt.push([+g.position[0].toFixed(1), +g.position[2].toFixed(1)]); keys.delete('ArrowUp'); keys.add(Math.random() < .5 ? 'ArrowLeft' : 'ArrowRight'); }
      lastZ = g.position[2]; lastCheck = Date.now();
    }
    await setKeys(keys);
    await page.waitForTimeout(40);
  }
  await setKeys(new Set());
  if (!final) final = await page.evaluate(() => window.__game.get());
  const st = final.stats || {};
  results.push({
    stage: i + 1, name: info.name, state: final.state, time: +(st.time || 0).toFixed(1), limit: info.world.limit, overdue: final.overdue,
    catches: st.catches, perfect: st.perfect, broken: st.broken, caught: st.caught, hits: st.hits, events, stuck, calls: info.calls,
    wall: +((Date.now() - t0) / 1000).toFixed(1), stuckAt: stuckAt.slice(0, 6), timedOut: !final || final.state === 'play',
  });
  console.log(JSON.stringify(results.at(-1)));
  if (final.state === 'failed') { /* keep going to next stage anyway */ }
}
console.log('ERRORS', JSON.stringify([...new Set(errors)].slice(0, 8)));
await browser.close(); srv.close();
