import {createServer} from 'node:http';
import {createReadStream, existsSync, statSync} from 'node:fs';
import {join,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
const ROOT=new URL('../../',import.meta.url).pathname.replace(/\/$/,'');
// WebKit（iOS Safari近似）が入っているものを優先する
const cands=[join(process.env.HOME,'.npm-global/lib/node_modules/playwright/index.mjs'),
 join(ROOT,'node_modules/playwright/index.mjs'),
 join(ROOT,'playwright-test/node_modules/playwright/index.mjs')];
const found=cands.find(c=>existsSync(c));
if(!found)throw new Error('Playwrightが見つかりません');
const pw=await import(pathToFileURL(found).href);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.md':'text/plain'};
const srv=createServer((req,res)=>{
  const u=decodeURIComponent(req.url.split('?')[0]);
  let f=join(ROOT,u);
  if(existsSync(f)&&statSync(f).isDirectory())f=join(f,'index.html');
  if(!existsSync(f)){res.writeHead(404);res.end('nf');return;}
  res.writeHead(200,{'Content-Type':mime[extname(f)]||'application/octet-stream'});
  createReadStream(f).pipe(res);
});
await new Promise(r=>srv.listen(0,r));
const port=srv.address().port;

const games=process.argv.slice(2);
const browser=await pw.webkit.launch();
let fails=0;
for(const g of games){
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,hasTouch:true,isMobile:true});
  const page=await ctx.newPage();
  const errs=[];
  page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
  page.on('pageerror',e=>errs.push('pageerror: '+e.message));
  page.on('requestfailed',r=>errs.push('reqfail: '+r.url()));
  await page.goto(`http://127.0.0.1:${port}/${g}/`,{waitUntil:'load'});
  await page.waitForTimeout(900);
  const t0=await page.evaluate(()=>({state:window.G&&window.G.state,W:window.G&&window.G.W,H:window.G&&window.G.H}));
  // start
  await page.mouse.click(195,500);
  await page.waitForTimeout(300);
  const t1=await page.evaluate(()=>window.G.state);
  // rAF count
  await page.evaluate(()=>{window.__f=0;const l=()=>{window.__f++;requestAnimationFrame(l);};requestAnimationFrame(l);});
  // play: random taps + drags
  const startT=Date.now();
  let overs=0,restarts=0;
  while(Date.now()-startT<16000){
    const st=await page.evaluate(()=>window.G.state);
    if(st==='over'){overs++;await page.waitForTimeout(750);await page.mouse.click(195,500);await page.waitForTimeout(200);
      const s2=await page.evaluate(()=>window.G.state);if(s2==='play')restarts++;continue;}
    const x=60+Math.random()*270,y=200+Math.random()*500;
    if(Math.random()<0.5){
      await page.mouse.move(x,y);await page.mouse.down();
      await page.mouse.move(60+Math.random()*270,y,{steps:4});
      await page.waitForTimeout(40+Math.random()*160);
      await page.mouse.up();
    }else{
      await page.mouse.click(x,y,{delay:30+Math.random()*120});
    }
    await page.waitForTimeout(60+Math.random()*140);
  }
  const res=await page.evaluate(()=>({state:window.G.state,score:window.G.score,best:window.G.best,frames:window.__f}));
  const fps=Math.round(res.frames/16);
  const ok=errs.length===0&&t0.state==='title'&&t1==='play'&&fps>=40;
  if(!ok)fails++;
  console.log(`${ok?'PASS':'FAIL'} ${g}  title→play:${t0.state}→${t1}  fps:${fps}  score:${res.score} best:${res.best} gameovers:${overs} restarts:${restarts} errors:${errs.length}`);
  if(errs.length)console.log('   '+errs.slice(0,6).join('\n   '));
  await ctx.close();
}
await browser.close();srv.close();
console.log(fails?`\n${fails}件 FAIL`:'\nALL PASS');
process.exit(fails?1:0);
