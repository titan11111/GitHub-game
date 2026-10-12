// Loads every stage with the real code (drawing stubbed), checks it builds, counts draws/solids, lists errors.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const { chromium } = await import('file:///Users/gosho/.npm-global/lib/node_modules/playwright/index.mjs');
const dir = process.argv[2] || 'new';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.wav': 'audio/wav' };
const srv = createServer(async (q, r) => { try { const u = q.url.split('?')[0]; const p = join(process.cwd(), dir, u === '/' ? 'index.html' : u); r.setHeader('content-type', mime[extname(p)] || 'application/octet-stream'); r.end(await readFile(p)); } catch { r.statusCode = 404; r.end(); } });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
const errors = [];
p.on('pageerror', e => errors.push(e.message));
p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await p.addInitScript(() => { for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) for (const f of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) if (C.prototype[f]) C.prototype[f] = function () {}; });
await p.goto(`http://127.0.0.1:${srv.address().port}/?test=1`, { waitUntil: 'networkidle' });
for (let i = 0; i < 10; i++) {
  const r = await p.evaluate(async i => {
    window.__game.start(i);
    await new Promise(r => setTimeout(r, 400));
    const g = window.__game.get();
    return { i: i + 1, name: document.querySelector('#hud strong')?.textContent, state: g.state, kind: g.world.kind, w: g.world.w, len: g.world.len, npcs: g.npcs.length, withPhone: g.npcs.filter(n => n.phone).length, solids: g.solids.length, pillars: g.pillars.length, sweepers: g.sweepers.length, calls: g.render.calls, tris: g.render.triangles, ponds: g.world.ponds };
  }, i);
  console.log(JSON.stringify(r));
}
console.log('ERRORS', JSON.stringify([...new Set(errors)].slice(0, 10)));
await b.close(); srv.close();
