// Human-style route through the department store: pick the open lane before each island, ignore NPCs (like a person nudging past).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const { chromium } = await import('file:///Users/gosho/.npm-global/lib/node_modules/playwright/index.mjs');
const mime={'.html':'text/html','.js':'text/javascript','.wav':'audio/wav'};
const srv=createServer(async(q,r)=>{try{const u=q.url.split('?')[0];const p=join(process.cwd(),'play',u==='/'?'index.html':u);r.setHeader('content-type',mime[extname(p)]||'application/octet-stream');r.end(await readFile(p))}catch{r.statusCode=404;r.end()}});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const b=await chromium.launch({headless:true});
const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1})).newPage();
await p.addInitScript(()=>{for(const C of [WebGLRenderingContext,WebGL2RenderingContext])for(const f of['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced'])if(C.prototype[f])C.prototype[f]=function(){};});
await p.goto(`http://127.0.0.1:${srv.address().port}/?test=1`,{waitUntil:'networkidle'});
const held=new Set();
const set=async w=>{for(const k of [...held])if(!w.has(k)){await p.keyboard.up(k);held.delete(k)}for(const k of w)if(!held.has(k)){await p.keyboard.down(k);held.add(k)}};
for(const seed of [1,2,3,4]){
  await p.evaluate(s=>{let a=s*9301+49297;window.__game.rng(()=>{a=(a*9301+49297)%233280;return a/233280});window.__game.start(4)},seed);
  // islands at z=-8,-16.5,... ; side alternates +1,-1 ; open lane is on the opposite side
  const way=[];let i=0;for(let z=-8;z>-64;z-=8.5){const lane=(i++%2===0)?-1.6:1.6;way.push([lane,z+3.2],[lane,z-3.2]);}way.push([0,-72]);
  let wi=0;const t0=Date.now();let final=null,hits=0,last=null;
  while(Date.now()-t0<70000){
    const g=await p.evaluate(()=>window.__game.get());
    if(g.state!=='play'){final=g;break;}
    const [px,,pz]=g.position;
    while(wi<way.length-1&&Math.hypot(way[wi][0]-px,way[wi][1]-pz)<.9)wi++;
    const [wx,wz]=way[wi];const ev=g.event&&!g.event.resolved;
    const dx=(ev?g.event.position[0]:wx)-px,dz=(ev?g.event.position[2]:wz)-pz;
    const w=new Set();if(dx>.35)w.add('ArrowRight');else if(dx<-.35)w.add('ArrowLeft');if(dz<-.35)w.add('ArrowUp');else if(dz>.35)w.add('ArrowDown');w.add('ShiftLeft');
    await set(w);await p.waitForTimeout(40);
  }
  await set(new Set());
  const g=final||await p.evaluate(()=>window.__game.get());
  console.log(JSON.stringify({seed,state:g.state,time:+g.stats.time.toFixed(1),limit:30,overdue:g.overdue,catches:g.stats.catches,broken:g.stats.broken,hits:g.stats.hits,reachedWaypoint:wi+'/'+way.length}));
}
await b.close();srv.close();
