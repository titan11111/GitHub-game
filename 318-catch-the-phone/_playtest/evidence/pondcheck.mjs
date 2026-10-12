// Park pond rule: throw the phone from several spots near the pond and see where it lands / whether it breaks.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const { chromium } = await import('file:///Users/gosho/.npm-global/lib/node_modules/playwright/index.mjs');
const dir = process.argv[2] || 'play';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.wav': 'audio/wav' };
const srv = createServer(async (q, r) => { try { const u = q.url.split('?')[0]; const p = join(process.cwd(), dir, u === '/' ? 'index.html' : u); r.setHeader('content-type', mime[extname(p)] || 'application/octet-stream'); r.end(await readFile(p)); } catch { r.statusCode = 404; r.end(); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.addInitScript(() => { for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) for (const f of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) if (C.prototype[f]) C.prototype[f] = function () {}; });
await p.goto(`http://127.0.0.1:${srv.address().port}/?test=1`, { waitUntil: 'networkidle' });
const spots = [[-1.0, -41], [0.5, -36], [1.5, -46], [-1.0, -34], [3, -41], [5, -41], [-1.5, -20], [2, -70]];
for (const [x, z] of spots) {
  const r = await p.evaluate(async ([x, z]) => {
    const G = window.__game;
    G.start(7);
    await new Promise(r => setTimeout(r, 200));
    const before = G.get().stats.broken;
    G.position(x, z);
    G.hit();
    let landed = null, ticks = 0;
    while (ticks++ < 400) {
      await new Promise(r => setTimeout(r, 30));
      const g = G.get();
      if (g.event && !g.event.resolved) landed = g.event.position;
      if (!g.event || g.event.resolved) break;
    }
    await new Promise(r => setTimeout(r, 1500));
    const g = G.get();
    return { from: [x, z], lastAirPos: landed && landed.map(v => +v.toFixed(2)), brokenDelta: g.stats.broken - before, catches: g.stats.catches };
  }, [x, z]);
  console.log(JSON.stringify(r));
}
console.log('ERRORS', JSON.stringify(errors.slice(0, 5)));
await b.close(); srv.close();
