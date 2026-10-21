import { chromium } from '/Users/gosho/.npm-global/lib/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const b=await chromium.launch({headless:true});const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});let errors=[];p.on('pageerror',e=>errors.push(e.message));
const report={};const diag=()=>p.evaluate(()=>window.taikoDiagnostics());
await p.goto('http://127.0.0.1:8324/324-day096/');await p.getByRole('button',{name:'はじめての稽古',exact:true}).click();
async function hit(x,y,hold=35){await p.mouse.move(x,y);await p.mouse.down();await p.waitForTimeout(hold);await p.mouse.up()}
await p.waitForTimeout(150);const right=await p.locator('.pad[data-hand="1"]').boundingBox(),left=await p.locator('.pad[data-hand="0"]').boundingBox();
const x=right.x+right.width/2,y=right.y+right.height*.65;
for(let i=0;i<3;i++)await hit(x,y);await hit(x,y,320);await hit(x,y);await hit(x,right.y+8);await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x,y-65,{steps:3});await p.mouse.up();await p.waitForTimeout(150);assert.equal((await diag()).state,'tutorialDone');report.tutorial='all five steps via pointer';
await p.getByRole('button',{name:'自由に打ってみる',exact:true}).click();
const cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:left.x+60,y:left.y+left.height*.65,id:1},{x,y,id:2}]});assert.equal((await diag()).active,2);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal((await diag()).active,0);report.multitouch='two simultaneous strikes released';
await p.keyboard.down('f');await p.getByRole('button',{name:'ポーズ',exact:true}).click();assert.equal((await diag()).active,0);const t=(await diag()).time;await p.waitForTimeout(400);assert.ok(Math.abs((await diag()).time-t)<.04);assert.equal((await diag()).audioState,'suspended');await p.keyboard.up('f');report.pause='held inputs cleared, audio clock frozen';
await p.getByRole('button',{name:'つづける',exact:true}).click();await p.waitForTimeout(2100);assert.equal((await diag()).state,'playing');
await p.getByRole('button',{name:'設定',exact:true}).click();await p.locator('#offset').fill('25');await p.locator('#offset').dispatchEvent('input');await p.getByRole('button',{name:'戻る',exact:true}).click();await p.getByRole('button',{name:'タイトルへ',exact:true}).click();await p.reload();assert.equal((await diag()).settings.offset,25);report.settings='offset persisted across reload';
await p.getByRole('button',{name:'演奏のしたく',exact:true}).click();await p.locator('#offset').fill('0');await p.locator('#offset').dispatchEvent('input');await p.getByRole('button',{name:'戻る',exact:true}).click();
for(const name of ['稽古','宵の大太鼓']){
await p.getByRole('button',{name:'演目をえらぶ',exact:true}).click();await p.getByRole('button',{name:new RegExp('^'+name+'\\s')}).click();
await p.screenshot({path:'/private/tmp/324-song-'+(name==='稽古'?'practice':'concert')+'.png'});
// Drive normal keyboard events against the read-only audio-clock diagnostics, without changing time or score.
await p.evaluate(async()=>{const notes=window.taikoDiagnostics().notes;await new Promise(resolve=>{let i=0;const held=[];const timer=setInterval(()=>{const now=window.taikoDiagnostics().time;while(i<notes.length&&notes[i].t<=now){const n=notes[i++],code=n.type==='K'?(n.hand?'KeyK':'KeyD'):(n.hand?'KeyJ':'KeyF');document.body.dispatchEvent(new KeyboardEvent('keydown',{code,shiftKey:n.type==='O',bubbles:true}));held.push({code,at:now})}for(let j=held.length-1;j>=0;j--)if(now-held[j].at>=.035){document.body.dispatchEvent(new KeyboardEvent('keyup',{code:held[j].code,bubbles:true}));held.splice(j,1)}if(i===notes.length&&!held.length){clearInterval(timer);resolve()}},4)})});
await p.waitForFunction(()=>window.taikoDiagnostics().state==='result',{timeout:12000});const d=await diag();assert.equal(d.result.good+d.result.ok+d.result.miss,d.notes.length);assert.ok(d.result.score>0);assert.ok(d.result.rank>=1);report[name]={...d.result,fps:d.fps,drawCalls:d.drawCalls,triangles:d.triangles};process.stdout.write(name+': '+JSON.stringify(report[name])+'\n');await p.screenshot({path:'/private/tmp/324-result-'+(name==='稽古'?'practice':'concert')+'.png'});await p.getByRole('button',{name:'タイトルへ',exact:true}).click();
}
assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync('/private/tmp/324-test-report.json',JSON.stringify(report,null,2));process.stdout.write(JSON.stringify(report,null,2));await b.close();
