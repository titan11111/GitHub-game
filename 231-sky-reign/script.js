(()=>{
"use strict";
const cv=document.getElementById('c'), ctx=cv.getContext('2d');
let W=0,H=0,DPR=1,F=320,safeTop=0,safeBottom=0;

let lastLayoutW=0, lastLayoutH=0, lastDpr=0;
function resize(){
  DPR=Math.min(2,window.devicePixelRatio||1);
  const wrap=document.getElementById('screen-wrap');
  const rect=wrap?wrap.getBoundingClientRect():{width:window.innerWidth,height:window.innerHeight};
  const nextW=Math.max(1,Math.round(rect.width)), nextH=Math.max(1,Math.round(rect.height));
  if(nextW===lastLayoutW && nextH===lastLayoutH && DPR===lastDpr) return;
  lastLayoutW=nextW; lastLayoutH=nextH; lastDpr=DPR;
  W=nextW; H=nextH;
  cv.width=W*DPR; cv.height=H*DPR;
  cv.style.width=W+'px'; cv.style.height=H+'px';
  cv.dataset.logicalWidth=String(W); cv.dataset.logicalHeight=String(H);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const probe=document.getElementById('safe-area-probe');
  if(probe){ const css=getComputedStyle(probe); safeTop=parseFloat(css.getPropertyValue('--safe-top'))||0; safeBottom=parseFloat(css.getPropertyValue('--safe-bottom'))||0; }
  F=Math.max(240,H*0.62);
}
addEventListener('resize',resize);
if(window.ResizeObserver){
  const wrap=document.getElementById('screen-wrap');
  if(wrap) new ResizeObserver(resize).observe(wrap);
}
resize();

// ---- 定数 ----
const MAX_ALT=520, MIN_DIST=16, CELL=190;
const CAPTURE_RADIUS=36, CAPTURE_ALTITUDE=30;
const SUNX=0.42, SUNY=0.62;
const GAME_TIME=90;

// ---- 状態 ----
let running=false, t0=0, timeLeft=GAME_TIME;
const hawk={x:0,y:0,alt:MAX_ALT,vx:0,vy:0,vAlt:0,dir:-Math.PI/2,stam:100,stun:0,tuck:0,flapAmt:0,phase:0};
let birds=[], clouds=[], puffs=[], pops=[];
let score=0, combo=0, comboT=0, maxCombo=0, catches=0, best=0, level=0;
let flash=0, shake=0, cloudFlash=0;
let idleT=0, idleMode='title';
let diving=false, canvasHold=false, deckHold=false, paused=false, aimX=0, aimY=0, keys={}, targetBird=null, targetScreenDist=Infinity;
let audioCtx=null, master=null, windSource=null, windFilter=null, windGain=null, diveSoundOn=false;
let bgmKind=null, bgmNode=null, muted=false;
const bgmBuf={title:null, play:null};
const bgmDecodeTried={title:false, play:false};
const elBgmTitle=document.getElementById('bgmTitle');
const elBgmPlay=document.getElementById('bgmPlay');
const BGM_FILE={title:'audio/open-sky.m4a', play:'audio/soaring-horizons.m4a'};
let lastTap=0;
try{ muted=localStorage.getItem('soten-dive-muted')==='1'; }catch(e){}

document.addEventListener('touchend',e=>{
  const now=Date.now();
  if(now-lastTap<=300) e.preventDefault();
  lastTap=now;
},{passive:false});
document.addEventListener('touchmove',e=>{e.preventDefault();},{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault());
document.addEventListener('contextmenu',e=>e.preventDefault());

function htmlTrack(kind){ return kind==='play'?elBgmPlay:elBgmTitle; }
function htmlPauseAll(){
  [elBgmTitle,elBgmPlay].forEach(a=>{ if(!a) return; try{ a.pause(); }catch(e){} });
}
function bgmVol(){
  if(muted) return 0;
  if(!running) return 0.34;
  return 0.48+Math.min(1,Math.abs(Math.min(0,hawk.vAlt))/460)*0.16;
}
function stopBuf(){
  if(!bgmNode) return;
  try{ bgmNode.src.stop(); }catch(e){}
  try{ bgmNode.src.disconnect(); bgmNode.g.disconnect(); }catch(e){}
  bgmNode=null;
}
function playBuf(kind){
  const buf=bgmBuf[kind]||bgmBuf.title;
  if(!audioCtx||audioCtx.state!=='running'||!buf) return false;
  stopBuf();
  const src=audioCtx.createBufferSource();
  src.buffer=buf; src.loop=true;
  const g=audioCtx.createGain();
  g.gain.value=Math.max(0.0001,bgmVol());
  src.connect(g); g.connect(master); src.start(0);
  bgmNode={src,g};
  htmlPauseAll();
  return true;
}
function decodeKind(kind){
  if(!audioCtx||bgmDecodeTried[kind]||!BGM_FILE[kind]) return;
  bgmDecodeTried[kind]=true;
  fetch(BGM_FILE[kind]).then(r=>{
    if(!r.ok) throw new Error('bgm');
    return r.arrayBuffer();
  }).then(ab=>audioCtx.decodeAudioData(ab.slice(0)))
    .then(buf=>{
      bgmBuf[kind]=buf;
      const a=htmlTrack(bgmKind);
      const htmlOk=a&&!a.paused;
      if(bgmKind===kind&&!bgmNode&&!htmlOk) playBuf(kind);
    }).catch(()=>{});
}
function ensureBgmDecode(){
  const kind=bgmKind||'title';
  const a=htmlTrack(kind);
  setTimeout(()=>{
    if(a&&!a.paused&&!a.error) return;
    decodeKind(kind);
  }, 400);
}
function htmlPlay(kind){
  const a=htmlTrack(kind);
  const other=htmlTrack(kind==='play'?'title':'play');
  if(other) try{ other.pause(); }catch(e){}
  if(!a) return;
  a.loop=true;
  a.muted=muted;
  try{ a.volume=muted?0:bgmVol(); }catch(e){}
  const p=a.play();
  if(p&&p.catch) p.catch(()=>{ decodeKind(kind); });
}
function applyMute(){
  const btn=document.getElementById('mute');
  if(btn) btn.textContent=muted?'🔇':'🔊';
  if(master&&audioCtx) master.gain.setTargetAtTime(muted?0:1, audioCtx.currentTime, 0.05);
  [elBgmTitle,elBgmPlay].forEach(a=>{ if(a) a.muted=muted; });
  updateBgm();
}
function ensureAudio(){
  if(!audioCtx){
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    master=audioCtx.createGain();
    master.gain.value=muted?0:1;
    master.connect(audioCtx.destination);
    const silent=audioCtx.createBuffer(1,1,22050);
    const src=audioCtx.createBufferSource();
    src.buffer=silent; src.connect(audioCtx.destination); src.start(0);
  }
  if(audioCtx.state==='suspended') audioCtx.resume();
  startBgm();
}
function toggleMute(e){
  if(e) e.stopPropagation();
  muted=!muted;
  try{ localStorage.setItem('soten-dive-muted', muted?'1':'0'); }catch(err){}
  try{ ensureAudio(); }catch(err){}
  applyMute();
}
function startBgm(){ switchBgm(running?'play':'title'); }
function switchBgm(kind){
  ensureBgmDecode();
  const a=htmlTrack(kind);
  if(kind===bgmKind && (bgmNode || (a&&!a.paused))){ updateBgm(); return; }
  if(bgmKind!==kind) stopBuf();
  bgmKind=kind;
  document.body.setAttribute('data-bgm', kind||'');
  if(playBuf(kind)) return;
  htmlPlay(kind);
  updateBgm();
}
function updateBgm(){
  const vol=bgmVol();
  if(bgmNode&&audioCtx){
    bgmNode.g.gain.setTargetAtTime(Math.max(0.0001,vol), audioCtx.currentTime, 0.08);
    return;
  }
  const a=htmlTrack(bgmKind);
  if(!a) return;
  a.muted=muted;
  try{ if(Math.abs(a.volume-vol)>0.03) a.volume=vol; }catch(e){}
}
function resumeBgm(){
  try{ if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume(); }catch(e){}
  if(!bgmKind) return;
  if(bgmNode){ updateBgm(); return; }
  const a=htmlTrack(bgmKind);
  if(a&&a.paused){
    if(playBuf(bgmKind)) return;
    htmlPlay(bgmKind);
  }
  updateBgm();
}
function tone(freq,dur,delay,type,vol){
  if(!audioCtx||!master) return;
  const t=audioCtx.currentTime+(delay||0);
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type=type||'sine'; o.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(vol||0.14,t+0.018);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.04);
}
function sfxNoise(dur,f0,f1,vol){
  if(!audioCtx||!master) return;
  const t=audioCtx.currentTime, n=Math.floor(audioCtx.sampleRate*dur);
  const b=audioCtx.createBuffer(1,n,audioCtx.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/n*4);
  const s=audioCtx.createBufferSource(); s.buffer=b;
  const f=audioCtx.createBiquadFilter(); f.type='lowpass';
  f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(f1,t+dur);
  const g=audioCtx.createGain();
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+dur+0.02);
}
function sfxWhoosh(){ sfxNoise(0.28,420,2100,0.12); tone(220,0.22,0,'sine',0.06); }
function sfxCatch(crow){ tone(crow?620:880,0.11,0,'triangle',0.16); tone(crow?980:1320,0.18,0.06,'sine',0.13); }
function sfxCrash(){ sfxNoise(0.4,900,90,0.42); tone(140,0.28,0,'sine',0.12); }

addEventListener('pointerdown',()=>{try{ensureAudio();}catch(e){}},{once:true});
addEventListener('keydown',()=>{try{ensureAudio();}catch(e){}},{once:true});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible'){
    if(running) setPaused(true);
    return;
  }
  resumeBgm();
});
addEventListener('pageshow', resumeBgm);
function startDiveSound(){
  if(!audioCtx||!master||diveSoundOn) return;
  const length=audioCtx.sampleRate*2, buffer=audioCtx.createBuffer(1,length,audioCtx.sampleRate);
  const data=buffer.getChannelData(0);
  let last=0;
  for(let i=0;i<length;i++){ const white=Math.random()*2-1; last=last*.92+white*.08; data[i]=last; }
  windSource=audioCtx.createBufferSource(); windSource.buffer=buffer; windSource.loop=true;
  windFilter=audioCtx.createBiquadFilter(); windFilter.type='bandpass'; windFilter.Q.value=.7;
  windGain=audioCtx.createGain(); windGain.gain.value=.0001;
  windSource.connect(windFilter).connect(windGain).connect(master); windSource.start();
  diveSoundOn=true;
}
function stopDiveSound(){
  if(!diveSoundOn) return;
  const now=audioCtx.currentTime; windGain.gain.cancelScheduledValues(now); windGain.gain.exponentialRampToValueAtTime(.0001,now+.12);
  const source=windSource; setTimeout(()=>{try{source.stop();}catch(e){}},150);
  windSource=null; windFilter=null; windGain=null; diveSoundOn=false;
}
function updateDiveSound(){
  if(!diveSoundOn||!windGain) return;
  const speed=Math.min(1,Math.abs(Math.min(0,hawk.vAlt))/460), now=audioCtx.currentTime;
  windGain.gain.setTargetAtTime(.006+speed*.085,now,.045);
  windFilter.frequency.setTargetAtTime(360+speed*1550,now,.06);
}
applyMute();

// ---- 永続ベストスコア（あれば） ----
function loadBest(){
  try{ const v=localStorage.getItem('soten-dive-best'); if(v) best=+v||0; }catch(e){}
  showBest();
}
function showBest(){
  const txt=best.toLocaleString();
  const a=document.getElementById('bestScore'); if(a) a.textContent=txt;
  const b=document.getElementById('titleBest'); if(b) b.textContent=txt;
}
function saveBest(){
  try{ localStorage.setItem('soten-dive-best',String(best)); }catch(e){}
}
loadBest();

// ---- 乱数ハッシュ（地上のタイル用）----
function hsh(i,j,s){
  let n=(i|0)*374761393+(j|0)*668265263+(s|0)*1442695041;
  n=(n^(n>>13))*1274126177;
  return (((n^(n>>16))>>>0)/4294967296);
}
const rnd=(a,b)=>a+Math.random()*(b-a);

const smooth=t=>t*t*(3-2*t);
function valueNoise(x,y,seed){
  const ix=Math.floor(x), iy=Math.floor(y), fx=smooth(x-ix), fy=smooth(y-iy);
  const a=hsh(ix,iy,seed), b=hsh(ix+1,iy,seed), c=hsh(ix,iy+1,seed), d=hsh(ix+1,iy+1,seed);
  return (a+(b-a)*fx)+((c+(d-c)*fx)-(a+(b-a)*fx))*fy;
}
function terrainNoise(wx,wy){
  return valueNoise(wx/620,wy/620,31)*.55+valueNoise(wx/230,wy/230,61)*.3+valueNoise(wx/78,wy/78,91)*.15;
}

function drawTree(x,y,s,seed){
  ctx.save();
  ctx.globalAlpha=.72;
  ctx.fillStyle='rgba(28,47,33,.22)';
  ctx.beginPath(); ctx.ellipse(x+s*.08,y+s*.28,s*.46,s*.18,0,0,6.283); ctx.fill();
  ctx.globalAlpha=1;
  ctx.fillStyle='#72583a'; ctx.fillRect(x-s*.07,y+s*.04,s*.14,s*.42);
  const crown=ctx.createRadialGradient(x-s*.12,y-s*.16,s*.04,x,y,s*.62);
  crown.addColorStop(0,'#789b5c'); crown.addColorStop(.58,'#3f6b45'); crown.addColorStop(1,'#214938');
  ctx.fillStyle=crown;
  ctx.beginPath();
  ctx.moveTo(x-s*.58,y+s*.16); ctx.quadraticCurveTo(x-s*.5,y-s*.2,x-s*.18,y-s*.42);
  ctx.quadraticCurveTo(x-s*.1,y-s*.7,x+s*.12,y-s*.54);
  ctx.quadraticCurveTo(x+s*.4,y-s*.62,x+s*.52,y-s*.22);
  ctx.quadraticCurveTo(x+s*.68,y+s*.05,x+s*.34,y+s*.2);
  ctx.quadraticCurveTo(x,y+s*.36,x-s*.58,y+s*.16);   ctx.fill();
  ctx.fillStyle='rgba(24,61,44,.36)';
  for(let k=0;k<3;k++){
    const gx=x-s*(.34-k*.02), gy=y+s*(.1-k*.04);
    ctx.beginPath(); ctx.arc(gx,gy,s*(.13+hsh(seed,k,801)*.06),0,6.283); ctx.fill();
  }
  ctx.fillStyle='rgba(167,192,118,.24)';
  ctx.beginPath(); ctx.arc(x-s*.2,y-s*.27,s*.11,0,6.283); ctx.fill();
  ctx.restore();
}

function drawLake(x,y,w,h,rot){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
  ctx.fillStyle='rgba(38,66,61,.2)';
  ctx.beginPath(); ctx.ellipse(w*.05,h*.13,w*1.02,h*.83,0,0,6.283); ctx.fill();
  const water=ctx.createLinearGradient(0,-h,0,h);
  water.addColorStop(0,'#2d7890'); water.addColorStop(.45,'#4d9bab'); water.addColorStop(1,'#245b76');
  ctx.fillStyle=water;
  ctx.beginPath();
  ctx.moveTo(-w*.92,-h*.08); ctx.lineTo(-w*.7,-h*.72); ctx.lineTo(-w*.24,-h*.58);
  ctx.lineTo(w*.02,-h*.88); ctx.lineTo(w*.48,-h*.64); ctx.lineTo(w*.9,-h*.3);
  ctx.lineTo(w*.7,h*.08); ctx.lineTo(w*.94,h*.34); ctx.lineTo(w*.38,h*.56);
  ctx.lineTo(w*.02,h*.42);   ctx.lineTo(-w*.3,h*.78); ctx.lineTo(-w*.72,h*.48); ctx.lineTo(-w*.92,-h*.08); ctx.fill();
  ctx.fillStyle='rgba(113,148,91,.5)';
  ctx.beginPath(); ctx.moveTo(-w*.1,-h*.03); ctx.lineTo(w*.42,-h*.35); ctx.lineTo(w*.3,h*.05); ctx.lineTo(w*.02,h*.2); ctx.fill();
  ctx.strokeStyle='rgba(190,232,224,.48)'; ctx.lineWidth=Math.max(1,h*.035);
  for(let k=0;k<3;k++){
    ctx.beginPath(); ctx.moveTo(-w*.42+k*w*.12,-h*.1+k*h*.18); ctx.quadraticCurveTo(0,-h*.2+k*h*.16,w*.42-k*w*.08,-h*.04+k*h*.18); ctx.stroke();
  }
  ctx.restore();
}
function drawHouse(x,y,s,ang){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang||0);
  ctx.fillStyle='rgba(40,32,22,.2)';
  ctx.beginPath(); ctx.ellipse(s*.04,s*.2,s*.4,s*.14,0,0,6.283); ctx.fill();
  ctx.fillStyle='#d5ccb4'; ctx.fillRect(-s*.2,-s*.06,s*.4,s*.2);
  ctx.fillStyle='#6a3826';
  ctx.beginPath(); ctx.moveTo(-s*.26,-s*.06); ctx.lineTo(0,-s*.26); ctx.lineTo(s*.26,-s*.06); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawPaddy(x,y,w,h,ang,wet){
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang||0);
  ctx.beginPath();
  ctx.moveTo(-w,-h*.78); ctx.lineTo(w*.94,-h*.66); ctx.lineTo(w*.88,h*.82); ctx.lineTo(-w*.9,h*.7); ctx.closePath();
  ctx.fillStyle=wet?'rgba(64,118,96,.7)':'rgba(176,170,88,.58)'; ctx.fill();
  if(wet){
    ctx.strokeStyle='rgba(186,228,214,.3)'; ctx.lineWidth=Math.max(1,h*.045);
    ctx.beginPath(); ctx.moveTo(-w*.62,-h*.18); ctx.lineTo(w*.55,h*.12); ctx.stroke();
  }else{
    ctx.strokeStyle='rgba(92,108,46,.22)'; ctx.lineWidth=1;
    for(let k=-2;k<=2;k++){ ctx.beginPath(); ctx.moveTo(-w*.72,k*h*.2); ctx.lineTo(w*.72,k*h*.16); ctx.stroke(); }
  }
  ctx.strokeStyle='rgba(92,76,44,.42)'; ctx.lineWidth=Math.max(1,h*.06);
  ctx.beginPath();
  ctx.moveTo(-w,-h*.78); ctx.lineTo(w*.94,-h*.66); ctx.lineTo(w*.88,h*.82); ctx.lineTo(-w*.9,h*.7); ctx.closePath(); ctx.stroke();
  ctx.restore();
}

// ---- 鳥 ----
function spawnBird(first){
  const crow=Math.random()<0.42;
  const a=rnd(0,Math.PI*2), d=first?rnd(120,620):rnd(420,760);
  const personality=crow
    ? (Math.random()<.34?'bold':Math.random()<.55?'cautious':'erratic')
    : (Math.random()<.48?'drowsy':Math.random()<.65?'social':'skittish');
  const cruise=crow?rnd(76,112):rnd(54,82);
  birds.push({
    crow, x:hawk.x+Math.cos(a)*d, y:hawk.y+Math.sin(a)*d,
    alt:crow?rnd(55,115):rnd(35,95),
    dir:rnd(0,Math.PI*2), sp:cruise+level*2,
    wob:rnd(.6,1.5), t:rnd(0,9), flap:rnd(0,9),
    panic:0, awareness:0, reaction:crow?rnd(.12,.55):rnd(.3,1.2),
    personality, turnRate:personality==='erratic'?rnd(7,12):personality==='drowsy'?rnd(1.8,3.4):rnd(3.8,6.5),
    rest:rnd(0,1.5), juke:0, jsign:Math.random()<.5?1:-1, alive:true
  });
}

function reset(){
  hawk.x=0; hawk.y=0; hawk.alt=MAX_ALT; hawk.vx=0; hawk.vy=0; hawk.vAlt=0;
  hawk.stam=100; hawk.stun=0; hawk.dir=-Math.PI/2; hawk.tuck=0; hawk.flapAmt=0; hawk.phase=0;
  birds=[]; puffs=[]; pops=[]; clouds=[];
  score=0; combo=0; comboT=0; maxCombo=0; catches=0; level=0;
  timeLeft=GAME_TIME; flash=0; shake=0; cloudFlash=0; diving=false; canvasHold=false; deckHold=false;
  aimX=W/2; aimY=H/2;
  for(let i=0;i<9;i++) spawnBird(true);
  for(let i=0;i<16;i++){
    const a=rnd(0,Math.PI*2), d=rnd(60,900);
    clouds.push({x:hawk.x+Math.cos(a)*d,y:hawk.y+Math.sin(a)*d,
      alt:rnd(215,330), r:rnd(55,130), dir:rnd(0,6.28), sp:rnd(6,16), seed:rnd(0,99)});
  }
}

// ---- 待機中（タイトル／エンディング）の俯瞰カメラ ----
// 田園の上をゆっくり旋回し続ける。プレイ中は update() が担当するので走らせない。
function setIdleMode(mode){
  idleMode=mode;
  hawk.stun=0; hawk.tuck=0; hawk.vAlt=0; hawk.vx=0; hawk.vy=0;
}
function idleHawkY(){ return idleMode==='over' ? H*0.80 : H*0.70; }
function idleUpdate(dt){
  idleT+=dt;
  const dusk=idleMode==='over';
  const turn=idleT*(dusk?0.034:0.05);           // 旋回はエンディングの方が緩やか
  const sp=dusk?26:42;                          // 田園が流れる速さ
  hawk.x+=Math.cos(turn)*sp*dt;
  hawk.y+=Math.sin(turn)*sp*dt;
  hawk.dir=turn;
  const base=dusk?245:300, sway=dusk?20:34;   // 田んぼの畦まで見える高さで流す
  hawk.alt=base+Math.sin(idleT*0.17)*sway;
  hawk.stam=100;
  hawk.phase+=dt*(dusk?1.5:2.0);
  hawk.flapAmt=0.14+Math.max(0,Math.sin(idleT*0.8))*0.13;
  for(const c of clouds){
    c.x+=Math.cos(c.dir)*c.sp*dt*0.5; c.y+=Math.sin(c.dir)*c.sp*dt*0.5;
    if(Math.hypot(c.x-hawk.x,c.y-hawk.y)>1200){
      const a=rnd(0,Math.PI*2), d=rnd(300,900);
      c.x=hawk.x+Math.cos(a)*d; c.y=hawk.y+Math.sin(a)*d;
    }
  }
  for(const b of birds){
    b.t+=dt; b.flap+=dt*(b.crow?7:9);
    b.dir+=Math.sin(b.t*0.6+b.wob)*dt*0.5;
    b.x+=Math.cos(b.dir)*b.sp*dt*0.55; b.y+=Math.sin(b.dir)*b.sp*dt*0.55;
    if(Math.hypot(b.x-hawk.x,b.y-hawk.y)>1100){
      const a=rnd(0,Math.PI*2), d=rnd(260,700);
      b.x=hawk.x+Math.cos(a)*d; b.y=hawk.y+Math.sin(a)*d;
    }
  }
}

// ---- 入力 ----
function toLocal(e){
  const r=cv.getBoundingClientRect();
  return {x:(e.clientX!==undefined?e.clientX:e.touches[0].clientX)-r.left,
          y:(e.clientY!==undefined?e.clientY:e.touches[0].clientY)-r.top};
}
function syncDive(){ diving=canvasHold||deckHold||!!keys.Space; }
cv.addEventListener('pointerdown',e=>{
  e.preventDefault();
  const p=toLocal(e); aimX=p.x; aimY=p.y;
  canvasHold=true; syncDive();
  try{ cv.setPointerCapture(e.pointerId); }catch(err){}
});
cv.addEventListener('pointermove',e=>{const p=toLocal(e);aimX=p.x;aimY=p.y;});
cv.addEventListener('pointerup',()=>{ canvasHold=false; syncDive(); if(!deckHold){ aimX=W/2; aimY=H/2; } });
cv.addEventListener('pointercancel',()=>{ canvasHold=false; syncDive(); if(!deckHold){ aimX=W/2; aimY=H/2; } });
addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(e.code==='Space'){ syncDive(); e.preventDefault(); }
  if((e.code==='Escape'||e.code==='KeyP')&&running){ setPaused(!paused); e.preventDefault(); }
});
addEventListener('keyup',e=>{ keys[e.code]=false; if(e.code==='Space') syncDive(); });

// ---- 更新 ----
function update(dt){
  diving=canvasHold||deckHold||!!keys.Space;
  timeLeft-=dt;
  if(timeLeft<=0){ timeLeft=0; endGame(); return; }

  const kx=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0);
  const ky=(keys.ArrowDown||keys.KeyS?1:0)-(keys.ArrowUp||keys.KeyW?1:0);
  if(kx||ky){ aimX=W/2+kx*W*0.32; aimY=H/2+ky*H*0.32; }

  const gs=F/Math.max(hawk.alt,10);
  const stunned=hawk.stun>0;
  if(stunned){ hawk.stun-=dt; }

  if(stunned){
    hawk.vAlt=Math.min(hawk.vAlt+520*dt,150);
  }else if(diving){
    hawk.vAlt=Math.max(hawk.vAlt-820*dt,-390);
  }else{
    if(hawk.stam>0){ hawk.vAlt=Math.min(hawk.vAlt+380*dt,175); hawk.stam-=24*dt; }
    else { hawk.vAlt=Math.min(hawk.vAlt+120*dt,-10); }
  }
  let wantTuck=0, wantFlap=0;
  if(stunned) wantTuck=.35;
  else if(diving||hawk.vAlt<-90) wantTuck=1;
  else if(hawk.vAlt>28) wantFlap=1;
  else wantTuck=.08;
  const poseK=Math.min(1,dt/0.15);
  hawk.tuck+=(wantTuck-hawk.tuck)*poseK;
  hawk.flapAmt+=(wantFlap-hawk.flapAmt)*poseK;
  hawk.phase+=dt*(6.2+hawk.flapAmt*6);
  if(diving&&!diveSoundOn) startDiveSound();
  if(!diving&&diveSoundOn) stopDiveSound();
  updateDiveSound();
  updateBgm();
  if(!diving&&!stunned&&hawk.alt>MAX_ALT-4) hawk.stam+=8*dt;
  if(diving||stunned) hawk.stam+=16*dt;
  hawk.stam=Math.max(0,Math.min(100,hawk.stam));

  hawk.alt+=hawk.vAlt*dt;
  if(hawk.alt>MAX_ALT){hawk.alt=MAX_ALT;hawk.vAlt=0;}
  if(hawk.alt<=6&&!stunned){
    hawk.alt=6; hawk.vAlt=0; hawk.stun=1.15; shake=18; combo=0;
    score=Math.max(0,score-40);
    sfxCrash();
    for(let i=0;i<22;i++) puffs.push({x:hawk.x+rnd(-14,14),y:hawk.y+rnd(-14,14),
      a:rnd(0,6.28),sp:rnd(30,150),life:rnd(.4,.9),t:0,col:'#c9b58c',sz:rnd(3,9)});
    pops.push({txt:'地面に激突',col:'#ff8b6a',t:0,life:1.1});
  }

  if(!stunned){
    const dxs=(aimX-W/2)/gs, dys=(aimY-H/2)/gs;
    const maxSp=diving?305:190;
    let tx=dxs*4.2, ty=dys*4.2;
    const m=Math.hypot(tx,ty);
    if(m>maxSp){tx=tx/m*maxSp;ty=ty/m*maxSp;}
    hawk.vx+=(tx-hawk.vx)*Math.min(1,dt*7);
    hawk.vy+=(ty-hawk.vy)*Math.min(1,dt*7);
  }else{
    hawk.vx*=0.9; hawk.vy*=0.9;
  }
  hawk.x+=hawk.vx*dt; hawk.y+=hawk.vy*dt;
  if(Math.hypot(hawk.vx,hawk.vy)>6) hawk.dir=Math.atan2(hawk.vy,hawk.vx);

  // 鳥
  targetBird=null; targetScreenDist=Infinity;
  for(const b of birds){
    b.t+=dt; b.flap+=dt*(b.panic>0?18:9);
    const dx=b.x-hawk.x, dy=b.y-hawk.y, dh=hawk.alt-b.alt;
    const hd=Math.hypot(dx,dy);
    const sense=b.crow?300:210;
    const seen=(dh<sense&&dh>-60&&hd<sense*0.95);
    // 鳥ごとに反応速度が違う。鳩は一瞬ぼんやりし、カラスは先に気づく。
    b.awareness=seen?Math.min(1,b.awareness+dt/Math.max(.08,b.reaction)):Math.max(0,b.awareness-dt*.8);
    const reacting=b.awareness>.92;
    b.panic=reacting?Math.min(1,b.panic+dt*(b.personality==='drowsy'?2.4:5)):Math.max(0,b.panic-dt*1.2);

    if(reacting){
      b.juke-=dt;
      if(b.juke<=0){ b.juke=b.personality==='erratic'?rnd(.18,.34):(b.crow?0.42:0.62); b.jsign=Math.random()<.5?1:-1; }
      const away=Math.atan2(dy,dx)+b.jsign*(b.crow?1.15:0.85);
      let d=away-b.dir; d=Math.atan2(Math.sin(d),Math.cos(d));
      b.dir+=d*Math.min(1,dt*b.turnRate);
      b.alt+=(b.crow?34:20)*dt*(dh<90?1:0.3);
    }else{
      b.dir+=Math.sin(b.t*b.wob)*dt*1.1;
      const home=Math.atan2(hawk.y-b.y,hawk.x-b.x);
      if(hd>560){ let d=home-b.dir; d=Math.atan2(Math.sin(d),Math.cos(d)); b.dir+=d*dt*1.4; }
      b.alt+=Math.sin(b.t*0.7)*12*dt;
    }
    b.alt=Math.max(28,Math.min(150,b.alt));
    // 油断中は速度を落とし、逃走時も従来より控えめにする。
    const dawdle=(b.personality==='drowsy'&&!reacting)?0.62:(b.personality==='social'?0.86:1);
    const burst=b.personality==='bold'?0.95:(b.personality==='erratic'?1.3:1);
    const sp=b.sp*dawdle*(1+b.panic*(b.crow?0.72:0.55))*burst;
    b.x+=Math.cos(b.dir)*sp*dt; b.y+=Math.sin(b.dir)*sp*dt;

    // 捕獲判定
    if(!stunned&&Math.abs(dh)<CAPTURE_ALTITUDE&&hd<CAPTURE_RADIUS&&hawk.vAlt<-55){
      b.alive=false;
      catches++; combo++; comboT=5; maxCombo=Math.max(maxCombo,combo);
      level=Math.min(14,Math.floor(catches/2));
      const dive=Math.min(1,Math.abs(hawk.vAlt)/460);
      const base=(b.crow?190:110)+Math.round(dive*90);
      const gain=Math.round(base*(1+(combo-1)*0.35));
      score+=gain; hawk.stam=Math.min(100,hawk.stam+34);
      flash=0.5; shake=9;
      sfxCatch(b.crow);
      pops.push({txt:'+'+gain+(combo>1?'  '+combo+'連':''),col:b.crow?'#8fd9ff':'#ffe08a',t:0,life:1.0});
      for(let i=0;i<24;i++) puffs.push({x:b.x+rnd(-8,8),y:b.y+rnd(-8,8),
        a:rnd(0,6.28),sp:rnd(20,130),life:rnd(.5,1.2),t:0,
        col:b.crow?'#2b3038':'#e6e2d8',sz:rnd(2,6)});
    }
    // 照準付近の鳥を候補として記憶し、画面上のリングで知らせる。
    const targetScale=F/Math.max(hawk.alt-b.alt,MIN_DIST);
    const targetX=W/2+(b.x-hawk.x)*targetScale, targetY=H/2+(b.y-hawk.y)*targetScale;
    const screenDist=Math.hypot(targetX-aimX,targetY-aimY);
    if(b.alive&&hawk.alt-b.alt>2&&screenDist<targetScreenDist&&screenDist<145){
      targetBird=b; targetScreenDist=screenDist;
    }
    if(Math.hypot(b.x-hawk.x,b.y-hawk.y)>1250) b.alive=false;
  }
  birds=birds.filter(b=>b.alive);
  while(birds.length<9+Math.floor(level/3)) spawnBird(false);

  // コンボ時間
  if(combo>0){ comboT-=dt; if(comboT<=0) combo=0; }

  // 雲
  for(const c of clouds){
    c.x+=Math.cos(c.dir)*c.sp*dt; c.y+=Math.sin(c.dir)*c.sp*dt;
    if(Math.hypot(c.x-hawk.x,c.y-hawk.y)>1400){
      const a=rnd(0,6.28); c.x=hawk.x+Math.cos(a)*1150; c.y=hawk.y+Math.sin(a)*1150;
      c.alt=rnd(215,330); c.r=rnd(55,130);
    }
  }
  // 雲を突き抜けた瞬間
  for(const c of clouds){
    const near=Math.abs(hawk.alt-c.alt)<14 && Math.hypot(hawk.x-c.x,hawk.y-c.y)<c.r*0.9;
    if(near) cloudFlash=Math.min(1,cloudFlash+dt*6);
  }
  cloudFlash=Math.max(0,cloudFlash-dt*2.2);

  // エフェクト
  for(const p of puffs){ p.t+=dt; p.x+=Math.cos(p.a)*p.sp*dt; p.y+=Math.sin(p.a)*p.sp*dt; p.sp*=0.94; }
  puffs=puffs.filter(p=>p.t<p.life);
  for(const p of pops) p.t+=dt;
  pops=pops.filter(p=>p.t<p.life);
  flash=Math.max(0,flash-dt*2.2);
  shake=Math.max(0,shake-dt*44);
}

// ---- 描画 ----
function drawGround(gs){
  const altitudeMix=Math.min(1,Math.max(0,(hawk.alt-110)/410));
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#78b9df');
  sky.addColorStop(.5,'#b8d8e5');
  sky.addColorStop(1,'#f3d7ae');
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=0.98-altitudeMix*0.55;
  ctx.fillStyle='#5b7d45'; ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=1;
  if(altitudeMix>0){
    const sun=ctx.createRadialGradient(W*0.72,H*0.18,4,W*0.72,H*0.18,H*.72);
    sun.addColorStop(0,'rgba(255,246,202,'+(0.34+altitudeMix*.22)+')');
    sun.addColorStop(1,'rgba(255,246,202,0)');
    ctx.fillStyle=sun; ctx.fillRect(0,0,W,H);
  }
  const halfW=(W/2)/gs+CELL, halfH=(H/2)/gs+CELL;
  const i0=Math.floor((hawk.x-halfW)/CELL), i1=Math.ceil((hawk.x+halfW)/CELL);
  const j0=Math.floor((hawk.y-halfH)/CELL), j1=Math.ceil((hawk.y+halfH)/CELL);
  const px=(wx)=>W/2+(wx-hawk.x)*gs, py=(wy)=>H/2+(wy-hawk.y)*gs;
  const cs=CELL*gs;
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){
    const r=hsh(i,j,1), r2=hsh(i,j,7), r3=hsh(i,j,13);
    const x=px(i*CELL), y=py(j*CELL);
    const biome=valueNoise(i*.33,j*.33,11);
    const ang=(hsh((i/2)|0,(j/2)|0,19)-.5)*.48;
    if(cs>6){
      ctx.globalAlpha=.16+.3*(1-altitudeMix);
      ctx.fillStyle=['#4f7340','#5d8348','#6d8a4a','#7c8b52','#8a8a56','#436b3f'][(r*6)|0];
      ctx.beginPath(); ctx.ellipse(x+cs*.5,y+cs*.5,cs*(.6+r3*.12),cs*(.52+r*.1),ang,0,6.283); ctx.fill();
      ctx.globalAlpha=1;
    }
    if(cs<12) continue;
    if(biome<.30){
      if(cs>20){
        ctx.fillStyle='rgba(34,58,38,'+(.2+.22*(1-altitudeMix))+')';
        ctx.beginPath(); ctx.ellipse(x+cs*.48,y+cs*.5,cs*.48,cs*.4,ang*.35,0,6.283); ctx.fill();
      }
      const n=4+((r3*6)|0);
      for(let k=0;k<n;k++){
        const a=hsh(i,j,20+k), b=hsh(i,j,40+k);
        drawTree(x+a*cs,y+b*cs,cs*(.12+hsh(i,j,60+k)*.12),k+((r3*10)|0));
      }
    }else if(biome<.40){
      drawLake(x+cs*(.3+r3*.4),y+cs*(.3+r*.4),cs*.26,cs*.17,r3*3);
    }else if(biome>.84&&r2<.55){
      if(cs>26){
        ctx.strokeStyle='rgba(138,116,74,'+(.38*(1-altitudeMix*.35))+')';
        ctx.lineWidth=Math.max(1.2,cs*.045);
        ctx.beginPath(); ctx.moveTo(x+cs*.04,y+cs*.22); ctx.quadraticCurveTo(x+cs*.48,y+cs*.52,x+cs*.96,y+cs*.72); ctx.stroke();
        const hn=2+((r*3)|0);
        for(let k=0;k<hn;k++){
          drawHouse(x+cs*(.2+k*.22+r3*.06), y+cs*(.26+hsh(i,j,70+k)*.3), cs*(.1+hsh(i,j,80+k)*.05), ang+(hsh(i,j,90+k)-.5)*.28);
        }
      }
    }else if(cs>22){
      const rows=2+(r2>.62?1:0);
      for(let col=0;col<2;col++) for(let row=0;row<rows;row++){
        drawPaddy(x+cs*(.28+col*.42), y+cs*(.24+row*.34), cs*.36, cs*.26, ang, ((i+j+col+row)&1)===0);
      }
      if(cs>38&&r3>.42){
        ctx.strokeStyle='rgba(48,72,42,.32)'; ctx.lineWidth=Math.max(1,cs*.028);
        ctx.beginPath(); ctx.moveTo(x+cs*.06,y+cs*.08); ctx.lineTo(x+cs*.94,y+cs*.13); ctx.stroke();
        for(let k=0;k<3;k++) drawTree(x+cs*(.18+k*.26), y+cs*.09, cs*.075, k);
      }
    }
  }
  const texStep=Math.max(12,Math.min(30,20/Math.max(gs,.4)));
  const terrainPalette=['#385f40','#4c7447','#63834e','#7f8d5a','#9b9568'];
  for(let sx=0;sx<W;sx+=texStep) for(let sy=0;sy<H;sy+=texStep){
    const wx=hawk.x+(sx-W/2)/Math.max(gs,.01), wy=hawk.y+(sy-H/2)/Math.max(gs,.01);
    const n=terrainNoise(wx,wy);
    ctx.fillStyle=terrainPalette[Math.min(4,Math.floor(n*5))];
    ctx.globalAlpha=.16+.14*(1-altitudeMix);
    ctx.fillRect(sx,sy,texStep+1,texStep+1);
  }
  ctx.globalAlpha=1;
  ctx.lineCap='round';
  for(let i=i0-1;i<=i1+1;i++) for(let j=j0-1;j<=j1+1;j++){
    const river=hsh(i,j,501);
    if(river>.12) continue;
    const x=px(i*CELL), y=py(j*CELL), bend=(hsh(i,j,503)-.5)*cs*.45;
    ctx.strokeStyle='rgba(42,103,125,'+(0.2+altitudeMix*.18)+')';
    ctx.lineWidth=Math.max(1,Math.min(5,cs*.035));
    ctx.beginPath(); ctx.moveTo(x-cs*.15,y+cs*.1);
    ctx.bezierCurveTo(x+cs*.2,y-bend,x+cs*.56,y+bend,x+cs*1.05,y+cs*.62); ctx.stroke();
    ctx.strokeStyle='rgba(191,224,215,.18)'; ctx.lineWidth=Math.max(1,ctx.lineWidth*.35);
    ctx.beginPath(); ctx.moveTo(x-cs*.1,y+cs*.08);
    ctx.bezierCurveTo(x+cs*.22,y-bend+2,x+cs*.56,y+bend+2,x+cs*1.02,y+cs*.6); ctx.stroke();
  }
  const haze=Math.min(0.5,(hawk.alt-140)/900);
  if(haze>0){ ctx.fillStyle='rgba(150,180,210,'+haze+')'; ctx.fillRect(0,0,W,H); }
}

function drawSkyMotion(){
  const a=Math.min(1,Math.max(0,(hawk.alt-120)/400));
  if(a<=0) return;
  ctx.save();
  ctx.translate(W/2,H/2);
  ctx.rotate(performance.now()*0.000018);
  ctx.strokeStyle='rgba(255,255,255,'+(0.08+a*.16)+')';
  ctx.lineWidth=1.5;
  for(let i=0;i<3;i++){
    ctx.beginPath();
    ctx.ellipse(0,0,Math.max(W,H)*(0.24+i*.12),Math.max(W,H)*(0.07+i*.035),i*.42,0,Math.PI*2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,'+(a*.2)+')';
  ctx.lineWidth=2;
  for(let i=0;i<7;i++){
    const y=H*(.14+i*.1)+Math.sin(performance.now()*.0004+i)*8;
    ctx.beginPath(); ctx.moveTo(W*(.08+i*.07),y); ctx.quadraticCurveTo(W*.5,y-18,W*(.92-i*.05),y-3); ctx.stroke();
  }
}

function drawBirdShape(x,y,s,dir,flap,crow){
  ctx.save(); ctx.translate(x,y); ctx.rotate(dir); ctx.scale(s,s);
  const f=Math.sin(flap);
  const wing=0.55+f*0.42;
  ctx.fillStyle=crow?'#191c22':'#7d8794';
  ctx.beginPath();
  ctx.moveTo(0.5,0);
  ctx.quadraticCurveTo(-0.1,-0.35,-0.75,-wing);
  ctx.quadraticCurveTo(-0.25,-0.18,-0.55,0);
  ctx.quadraticCurveTo(-0.25,0.18,-0.75,wing);
  ctx.quadraticCurveTo(-0.1,0.35,0.5,0);
  ctx.fill();
  ctx.fillStyle=crow?'#2a2f38':'#a9b3bf';
  ctx.beginPath(); ctx.ellipse(0.05,0,0.42,0.17,0,0,6.283); ctx.fill();
  if(!crow){ ctx.fillStyle='#e8eaee';   ctx.beginPath(); ctx.ellipse(0.3,0,0.16,0.11,0,0,6.283); ctx.fill(); }
  if(crow){
    ctx.fillStyle='#11151b';
    ctx.beginPath(); ctx.moveTo(-.24,-.1); ctx.lineTo(-.68,-.24); ctx.lineTo(-.48,0); ctx.lineTo(-.68,.24); ctx.lineTo(-.24,.1); ctx.fill();
  }else{
    ctx.fillStyle='#d5dbe0';
    ctx.beginPath(); ctx.moveTo(-.22,-.08); ctx.lineTo(-.48,0); ctx.lineTo(-.22,.08); ctx.fill();
  }
  ctx.restore();
}

function drawHawkShape(x,y,s,dir,tuck,flapAmt,phase){
  ctx.save(); ctx.translate(x,y); ctx.rotate(dir);
  ctx.scale(s*(1+tuck*.14), s*(1-tuck*.22));
  const beat=Math.sin(phase), wing=1.02-tuck*.64+beat*.52*flapAmt, tipX=-.48-tuck*.28+beat*.1*flapAmt;
  ctx.fillStyle='#5b3821';
  ctx.beginPath();
  ctx.moveTo(0.62,0);
  ctx.quadraticCurveTo(-0.05,-0.45,tipX,-wing);
  ctx.quadraticCurveTo(tipX-.08,-wing*.92,-0.62,-0.12);
  ctx.lineTo(-0.62,0.12);
  ctx.quadraticCurveTo(tipX-.08,wing*.92,tipX,wing);
  ctx.quadraticCurveTo(-0.05,0.45,0.62,0);
  ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.22)';
  ctx.beginPath();
  ctx.moveTo(-0.2,-wing*0.72); ctx.lineTo(tipX,-wing); ctx.lineTo(-0.56,-wing*0.5); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-0.2,wing*0.72); ctx.lineTo(tipX,wing); ctx.lineTo(-0.56,wing*0.5); ctx.fill();
  ctx.fillStyle='#8a5c30';
  ctx.beginPath(); ctx.ellipse(0.02,0,0.5,0.2*(1-tuck*.28),0,0,6.283); ctx.fill();
  ctx.fillStyle='#7a4f28';
  ctx.beginPath(); ctx.moveTo(-0.45,-0.18); ctx.lineTo(-0.95,0); ctx.lineTo(-0.45,0.18); ctx.fill();
  ctx.fillStyle='#d9c39a';
  ctx.beginPath(); ctx.ellipse(0.45,0,0.19,0.15,0,0,6.283); ctx.fill();
  ctx.fillStyle='#e8b13c';
  ctx.beginPath(); ctx.moveTo(0.6,-0.06); ctx.lineTo(0.76,0); ctx.lineTo(0.6,0.06); ctx.fill();
  ctx.restore();
}

function drawClouds(){
  const sorted=clouds.slice().sort((a,b)=>a.alt-b.alt);
  for(const c of sorted){
    const d=hawk.alt-c.alt;
    if(d<4) continue;
    const sc=F/Math.max(d,10);
    const x=W/2+(c.x-hawk.x)*sc, y=H/2+(c.y-hawk.y)*sc, r=c.r*sc;
    if(x<-r*2||x>W+r*2||y<-r*2||y>H+r*2) continue;
    const alpha=Math.min(0.82,0.22+sc*0.14);
    ctx.save();
    ctx.fillStyle='rgba(70,105,120,'+(alpha*.2)+')';
    ctx.beginPath(); ctx.ellipse(x+r*.1,y+r*.2,r*1.05,r*.34,0,0,6.283); ctx.fill();
    const cloud=ctx.createLinearGradient(x,y-r,x,y+r);
    cloud.addColorStop(0,'rgba(255,255,255,'+alpha+')');
    cloud.addColorStop(.62,'rgba(238,247,246,'+(alpha*.86)+')');
    cloud.addColorStop(1,'rgba(173,202,207,'+(alpha*.72)+')');
    ctx.fillStyle=cloud;
    ctx.beginPath();
    const points=[];
    for(let k=0;k<12;k++){
      const a=Math.PI*2*k/12, wob=.72+hsh(Math.floor(c.seed),k,17)*.34;
      points.push([x+Math.cos(a)*r*.82*wob,y+Math.sin(a)*r*.42*wob-r*.08]);
    }
    ctx.moveTo(points[0][0],points[0][1]);
    for(let k=1;k<points.length;k++){
      const p=points[k], q=points[(k+1)%points.length];
      ctx.quadraticCurveTo(p[0],p[1],(p[0]+q[0])*.5,(p[1]+q[1])*.5);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,'+(alpha*.28)+')';
    ctx.beginPath(); ctx.ellipse(x-r*.18,y-r*.26,r*.38,r*.16,-.15,0,6.283); ctx.fill();
    ctx.fillStyle='rgba(111,151,163,'+(alpha*.2)+')';
    ctx.beginPath(); ctx.ellipse(x+r*.18,y+r*.22,r*.62,r*.16,.06,0,6.283); ctx.fill();
    ctx.strokeStyle='rgba(240,250,249,'+(alpha*.18)+')'; ctx.lineWidth=Math.max(1,r*.018);
    ctx.beginPath(); ctx.moveTo(x-r*.78,y+r*.04); ctx.quadraticCurveTo(x-r*.35,y-r*.12,x-r*.02,y+r*.02); ctx.quadraticCurveTo(x+r*.38,y+r*.14,x+r*.78,y-r*.02); ctx.stroke();
    ctx.restore();
  }
}

function render(){
  const gs=F/Math.max(hawk.alt,10);
  ctx.save();
  if(shake>0) ctx.translate(rnd(-shake,shake)*0.5,rnd(-shake,shake)*0.5);

  drawGround(gs);

  // 鳥の影（地面）
  for(const b of birds){
    const sx=W/2+(b.x+SUNX*b.alt-hawk.x)*gs, sy=H/2+(b.y+SUNY*b.alt-hawk.y)*gs;
    const r=Math.max(1.2,7*gs);
    if(sx<-40||sx>W+40||sy<-40||sy>H+40) continue;
    ctx.fillStyle='rgba(0,0,0,'+(0.3-Math.min(0.2,b.alt/700))+')';
    ctx.beginPath(); ctx.ellipse(sx,sy,r*1.4,r*0.8,b.dir,0,6.283); ctx.fill();
  }

  const hawkY=running?H/2:idleHawkY();
  {
    const sx=W/2+SUNX*F, sy=hawkY+SUNY*F, r=Math.max(1.5,9*gs);
    ctx.fillStyle='rgba(0,0,0,.32)';
    ctx.beginPath(); ctx.ellipse(sx,sy,r*(1.5-hawk.tuck*.35),r*(.7+hawk.flapAmt*.18),hawk.dir,0,6.283); ctx.fill();
  }

  drawClouds();

  for(const p of puffs){
    const sc=F/Math.max(hawk.alt-40,MIN_DIST);
    const x=W/2+(p.x-hawk.x)*sc, y=H/2+(p.y-hawk.y)*sc;
    ctx.globalAlpha=Math.max(0,1-p.t/p.life);
    ctx.fillStyle=p.col;
    ctx.beginPath(); ctx.arc(x,y,Math.max(1,p.sz*sc*0.35),0,6.283); ctx.fill();
    ctx.globalAlpha=1;
  }

  // 鳥（低い＝遠いものから）
  const bs=birds.slice().sort((a,b)=>a.alt-b.alt);
  for(const b of bs){
    const d=hawk.alt-b.alt;
    if(d<2) continue;
    const sc=F/Math.max(d,MIN_DIST);
    const x=W/2+(b.x-hawk.x)*sc, y=H/2+(b.y-hawk.y)*sc;
    const size=(b.crow?12:9)*sc;
    if(x<-size*2||x>W+size*2||y<-size*2||y>H+size*2) continue;
    if(b.panic>0.3&&size>14){
      ctx.strokeStyle='rgba(255,120,90,'+(b.panic*0.5)+')'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(x,y,size*1.3,0,6.283); ctx.stroke();
    }
    if(b===targetBird){
      ctx.strokeStyle=targetScreenDist<42?'rgba(255,224,138,.95)':'rgba(255,255,255,.55)';
      ctx.lineWidth=2; ctx.setLineDash([5,4]);
      ctx.beginPath(); ctx.arc(x,y,Math.max(18,size*1.65),0,6.283); ctx.stroke(); ctx.setLineDash([]);
    }
    drawBirdShape(x,y,size,b.dir,b.flap,b.crow);
  }

  const spd=Math.min(1,Math.abs(Math.min(0,hawk.vAlt))/460);
  if(spd>0.05){
    ctx.strokeStyle='rgba(255,255,255,'+(spd*0.5)+')';
    ctx.lineWidth=2;
    for(let k=0;k<26;k++){
      const a=hsh(k,3,5)*6.283+performance.now()*0.0002;
      const r0=Math.max(W,H)*(0.34+hsh(k,9,2)*0.5);
      const len=40+spd*160*(0.4+hsh(k,4,8));
      ctx.beginPath();
      ctx.moveTo(W/2+Math.cos(a)*r0, H/2+Math.sin(a)*r0);
      ctx.lineTo(W/2+Math.cos(a)*(r0+len), H/2+Math.sin(a)*(r0+len));
      ctx.stroke();
    }
    const g=ctx.createRadialGradient(W/2,H/2,H*0.18,W/2,H/2,H*0.66);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(4,10,18,'+(spd*0.55)+')');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }

  drawHawkShape(W/2,hawkY, running?42+hawk.tuck*11:38, hawk.dir, hawk.tuck, hawk.flapAmt, hawk.phase);
  if(running){
    const ready=targetBird&&targetScreenDist<42&&spd>.08;
    ctx.strokeStyle=ready?'rgba(255,224,138,.95)':'rgba(242,234,216,.58)';
    ctx.lineWidth=2; ctx.beginPath(); ctx.arc(aimX,aimY,ready?24:18,0,6.283); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(aimX-30,aimY); ctx.lineTo(aimX-11,aimY); ctx.moveTo(aimX+11,aimY); ctx.lineTo(aimX+30,aimY);
    ctx.moveTo(aimX,aimY-30); ctx.lineTo(aimX,aimY-11); ctx.moveTo(aimX,aimY+11); ctx.lineTo(aimX,aimY+30); ctx.stroke();
  }

  ctx.restore();

  if(!running&&idleMode==='title'){
    const morn=ctx.createLinearGradient(0,0,0,H);
    morn.addColorStop(0,'rgba(126,186,224,.13)');
    morn.addColorStop(.55,'rgba(255,228,156,.07)');
    morn.addColorStop(1,'rgba(255,192,98,.17)');
    ctx.fillStyle=morn; ctx.fillRect(0,0,W,H);
  }
  if(!running&&idleMode==='over'){
    const dusk=ctx.createLinearGradient(0,0,0,H);
    dusk.addColorStop(0,'rgba(92,64,120,.20)');
    dusk.addColorStop(.45,'rgba(255,158,74,.13)');
    dusk.addColorStop(1,'rgba(255,122,40,.30)');
    ctx.fillStyle=dusk; ctx.fillRect(0,0,W,H);
  }
  if(cloudFlash>0){ ctx.fillStyle='rgba(255,255,255,'+(cloudFlash*0.75)+')'; ctx.fillRect(0,0,W,H); }
  if(flash>0){ ctx.fillStyle='rgba(255,240,200,'+(flash*0.35)+')'; ctx.fillRect(0,0,W,H); }

  if(running) drawHUD();
}

function drawHUD(){
  const top=safeTop, bottom=8;
  ctx.fillStyle='rgba(8,14,22,.55)'; ctx.fillRect(0,0,W,58+top);
  ctx.textBaseline='middle';
  ctx.fillStyle='#f2ead8'; ctx.font='800 26px system-ui,sans-serif'; ctx.textAlign='left';
  ctx.fillText(score.toLocaleString(),14,26+top);
  ctx.font='600 11px system-ui,sans-serif'; ctx.fillStyle='#93a3b6';
  ctx.fillText('スコア',14,45+top);

  ctx.textAlign='center';
  const danger=timeLeft<15;
  ctx.fillStyle=danger?'#ff8b6a':'#f2ead8'; ctx.font='800 26px system-ui,sans-serif';
  ctx.fillText(Math.ceil(timeLeft)+'',W/2,26+top);
  ctx.font='600 11px system-ui,sans-serif'; ctx.fillStyle='#93a3b6';
  ctx.fillText('のこり秒',W/2,45+top);

  ctx.textAlign='right';
  ctx.fillStyle=combo>1?'#f0c96a':'#f2ead8'; ctx.font='800 26px system-ui,sans-serif';
  ctx.fillText(combo>1?combo+'連':catches+'',W-14,26+top);
  ctx.font='600 11px system-ui,sans-serif'; ctx.fillStyle='#93a3b6';
  ctx.fillText(combo>1?'コンボ':'捕獲',W-14,45+top);

  const bx=W-26, by=76+top, bh=Math.max(120,H-190-top-bottom);
  ctx.fillStyle='rgba(8,14,22,.5)'; ctx.fillRect(bx,by,10,bh);
  const p=hawk.alt/MAX_ALT;
  ctx.fillStyle='rgba(240,201,106,.85)';
  ctx.fillRect(bx,by+bh*(1-p),10,bh*p);
  // 鳥のいる高度帯
  ctx.fillStyle='rgba(255,120,90,.5)';
  ctx.fillRect(bx-4,by+bh*(1-150/MAX_ALT),18,bh*(122/MAX_ALT));
  ctx.fillStyle='#c3cedd'; ctx.font='700 11px system-ui,sans-serif'; ctx.textAlign='right';
  ctx.fillText(Math.round(hawk.alt)+'m',bx-8,by+bh*(1-p));

  // スタミナ（下）
  const sw=W-40;
  ctx.fillStyle='rgba(8,14,22,.5)'; ctx.fillRect(20,H-34-bottom,sw,8);
  ctx.fillStyle=hawk.stam<25?'#ff8b6a':'#7fd6a0';
  ctx.fillRect(20,H-34-bottom,sw*(hawk.stam/100),8);
  ctx.fillStyle='#93a3b6'; ctx.font='600 11px system-ui,sans-serif'; ctx.textAlign='left';
  ctx.fillText('体力（上昇に必要）',20,H-46-bottom);

  // ポップアップ
  ctx.textAlign='center';
  pops.forEach((p,i)=>{
    const k=p.t/p.life;
    ctx.globalAlpha=Math.max(0,1-k);
    ctx.fillStyle=p.col;
    ctx.font='900 '+(24+ (1-k)*8)+'px system-ui,sans-serif';
    ctx.fillText(p.txt, W/2, H*0.36 - k*40 - i*30);
    ctx.globalAlpha=1;
  });

  if(hawk.stun>0){
    ctx.fillStyle='rgba(255,139,106,.9)'; ctx.font='800 15px system-ui,sans-serif';
    ctx.fillText('立て直し中…',W/2,H*0.62);
  }
}

// ---- ループ ----
let last=0;
function loop(ts){
  const dt=Math.min(0.05,(ts-last)/1000||0); last=ts;
  if(running&&!paused){ update(dt); }
  else { updateBgm(); if(!running) idleUpdate(dt); }
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(t=>{last=t;requestAnimationFrame(loop);});

// ---- 画面遷移 ----
const titleEl=document.getElementById('title'), overEl=document.getElementById('over');
function bindTap(el, handler){
  if(!el) return;
  const fire=e=>{
    e.preventDefault();
    try{ el.setPointerCapture(e.pointerId); }catch(err){}
    el.classList.add('is-pressed');
    if(navigator.vibrate) navigator.vibrate(15);
    handler(e);
  };
  const release=()=>el.classList.remove('is-pressed');
  el.addEventListener('pointerdown', fire);
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('pointerleave', release);
}
function bindHold(el, on, off){
  if(!el) return;
  const start=e=>{
    e.preventDefault();
    e.stopPropagation();
    try{ el.setPointerCapture(e.pointerId); }catch(err){}
    el.classList.add('is-held');
    if(navigator.vibrate) navigator.vibrate(12);
    on(e);
  };
  const end=()=>{ el.classList.remove('is-held'); off(); };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}
function setPaused(on){
  if(!running) return;
  paused=!!on;
  const el=document.getElementById('paused');
  if(el) el.classList.toggle('hide', !paused);
  const btn=document.getElementById('pauseBtn');
  if(btn){ btn.textContent=paused?'▶':'⏸'; btn.setAttribute('aria-label', paused?'再開':'一時停止'); }
  if(paused){ stopDiveSound(); htmlPauseAll(); stopBuf(); }
  else resumeBgm();
}
function startGame(){
  reset(); running=true; paused=false; idleT=0;
  document.getElementById('paused').classList.add('hide');
  const pb=document.getElementById('pauseBtn');
  if(pb){ pb.textContent='⏸'; pb.setAttribute('aria-label','一時停止'); }
  ensureAudio();
  switchBgm('play');
  sfxWhoosh();
  titleEl.classList.add('hide'); overEl.classList.add('hide');
}
function endGame(){
  running=false; paused=false;
  document.getElementById('paused').classList.add('hide');
  stopDiveSound();
  switchBgm('title');
  if(score>best){ best=score; saveBest(); }
  document.getElementById('finalScore').textContent=score.toLocaleString();
  document.getElementById('finalCatch').textContent=catches;
  document.getElementById('finalCombo').textContent=maxCombo;
  document.getElementById('bestScore').textContent=best;
  showBest();
  const rank = catches>=20
    ? {t:'蒼穹の覇者', k:'日暮れ・凱旋', v:'田はまた静まり、鷹だけが空を残す。<br>今日この空は、たしかにあなたのものだった。'}
    : catches>=10
    ? {t:'上々の狩り', k:'日暮れ・帰路', v:'畦道の風が背を押していく。<br>稲穂が、いま来た道を波で返す。'}
    : {t:'一日の終わり', k:'日暮れ・帰巣', v:'遠い山の端が赤い。<br>明日もこの田園の上で、また翼を広げる。'};
  const ot=document.getElementById('overTitle');
  ot.textContent=rank.t;
  ot.classList.toggle('rank-high', catches>=20);
  const ok=document.getElementById('overKicker'); if(ok) ok.textContent=rank.k;
  const ov=document.getElementById('overVerse'); if(ov) ov.innerHTML=rank.v;
  setIdleMode('over'); idleT=0;
  overEl.classList.remove('hide');
}
bindTap(document.getElementById('startBtn'), startGame);
bindTap(document.getElementById('againBtn'), startGame);
bindTap(document.getElementById('mute'), toggleMute);
bindTap(document.getElementById('pauseBtn'), e=>{ e.stopPropagation(); if(running) setPaused(!paused); });
bindTap(document.getElementById('resumeBtn'), e=>{ e.stopPropagation(); setPaused(false); });
bindHold(document.getElementById('btnDive'), ()=>{ deckHold=true; syncDive(); try{ensureAudio();}catch(e){} }, ()=>{ deckHold=false; syncDive(); });

reset(); // 背景を動かしておく
})();
