//==================================================================
//  敵AI (戦略フェーズ)
//==================================================================
function enemyTurn(){
  if(phase!=='map'){ return; }
  const myUnits=units.filter(u=>u.owner==='red');
  let idx=0;
  function step(){
    if(phase!=='map'){ return; }
    if(idx>=myUnits.length){ endEnemyTurn(); return; }
    const u=myUnits[idx++];
    if(!units.find(x=>x.id===u.id)){ step(); return; }
    aiThinking=true;
    aiUnitLabel=`${UNITS[u.type].nm} 行動中`;
    updateHUD();
    aiMoveUnit(u, ()=>setTimeout(step, 180));
  }
  // also: produce if rich
  aiProduce();
  step();
}
function aiProduce(){
  // build toward a balanced army if money allows
  const choices=['gundam','gelgoog','zaku','gm','zz'];
  let guard=0;
  while(money.red>=550 && guard++<3){
    const pick = money.red>=1200 && Math.random()<0.4 ? 'zz' :
                 Math.random()<0.5?'gundam':'gelgoog';
    if(money.red>=UNITS[pick].cost){ money.red-=UNITS[pick].cost; queue.red.push({type:pick,left:UNITS[pick].bt}); }
    else break;
  }
  while(money.red>=250 && Math.random()<0.6 && guard++<6){
    const pick=Math.random()<0.5?'zaku':'gm';
    money.red-=UNITS[pick].cost; queue.red.push({type:pick,left:UNITS[pick].bt});
  }
}
function aiMoveUnit(u, done){
  withU(u);
  // target: nearest enemy unit OR enemy/neutral base, prioritize player's capital path
  const reach=computeReach(u);
  // 1) if enemy adjacent in range, attack
  const targets=enemiesInRange(u);
  if(targets.length){
    // pick weakest
    targets.sort((a,b)=>a.hp-b.hp);
    initiateBattle(u, targets[0]); // battle takes over; done called after finish via flow
    // after battle finishes, enemyTurn step continues because finishBattle returns to map;
    // we need to continue the AI sequence -> use a watcher
    waitBattleThen(done);
    return;
  }
  // 2) move toward goal
  const goal=aiGoal(u);
  let best=null, bestScore=1e9;
  for(const t of reach){
    if(unitAt(t.r,t.c)) continue;
    const d=Math.abs(t.r-goal.r)+Math.abs(t.c-goal.c);
    if(d<bestScore){bestScore=d;best=t;}
  }
  // also consider staying to capture current base
  if(best){
    u.r=best.r; u.c=best.c; u.moved=true;
    aiTryCapture(u);
    // after moving, maybe an enemy now in range
    const t2=enemiesInRange(u);
    if(t2.length){ t2.sort((a,b)=>a.hp-b.hp); initiateBattle(u,t2[0]); waitBattleThen(done); return; }
  } else { aiTryCapture(u); }
  done();
}
function aiTryCapture(u){
  const t=grid[u.r][u.c];
  if(t.base && t.owner!==u.owner){
    t.owner=u.owner;
    if(t.base==='capital'){ setTimeout(()=>endGame('red'),150); }
  }
}
function aiGoal(u){
  // nearest player unit or the player capital
  let goal=capitalOf('blue')||{r:u.r,c:u.c};
  let bd=1e9;
  for(const e of units){ if(e.owner==='blue'){ const d=Math.abs(e.r-u.r)+Math.abs(e.c-u.c); if(d<bd){bd=d;goal={r:e.r,c:e.c};} } }
  // also target nearby neutral base if very close
  let nb=null,nbd=4;
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const t=grid[r][c]; if(t.base&&t.owner!=='red'){ const d=Math.abs(r-u.r)+Math.abs(c-u.c); if(d<nbd){nbd=d;nb={r,c};} }
  }
  if(nb&&nbd<bd) return nb;
  return goal;
}
let battleWatcher=null;
function waitBattleThen(cb){
  battleWatcher=cb;
}
// hook: after finishBattle, if a watcher exists & it's red's turn, resume
const _finish=finishBattle;
finishBattle=function(){
  _finish();
  if(battleWatcher){ const cb=battleWatcher; battleWatcher=null; if(phase==='map') setTimeout(cb,200); }
};

function endEnemyTurn(){
  if(phase!=='map') return;
  turnNo++; side='blue';
  startTurn('blue');
  setMsg(`青軍反攻ターン。戦域: ${currentMapName()}`);
  draw();
}

//==================================================================
//  終了判定
//==================================================================
function endGame(winner){
  if(phase==='gameover') return;
  phase='gameover';
  gameResult=winner;
  gameOverAt = performance.now();
  playGameOverJingle(winner==='blue');
  draw();
}
let gameResult=null;
let audioCtx=null;
function ensureAudioCtx(){
  if(audioCtx) return audioCtx;
  audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  return audioCtx;
}
function playBattleSfx(type){
  try{
    const ctxAudio = ensureAudioCtx();
    const now = ctxAudio.currentTime;
    const tones = {
      shot:[880,0.03,'square'],
      melee:[220,0.06,'sawtooth'],
      special:[520,0.08,'triangle'],
      burst:[330,0.11,'sawtooth']
    };
    const [hz,dur,wave] = tones[type] || tones.shot;
    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();
    osc.type=wave;
    osc.frequency.value=hz;
    gain.gain.value=0.0001;
    gain.gain.exponentialRampToValueAtTime(0.06, now+0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now+dur);
    osc.connect(gain).connect(ctxAudio.destination);
    osc.start(now);
    osc.stop(now+dur);
  }catch(e){}
}
function playGameOverJingle(win){
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    const seq = win?[440,660,880]:[330,280,220];
    const now = audioCtx.currentTime;
    seq.forEach((hz,i)=>{
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type='square';
      osc.frequency.value=hz;
      gain.gain.value=0.0001;
      gain.gain.exponentialRampToValueAtTime(0.05, now+i*0.11+0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now+i*0.11+0.1);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now+i*0.11);
      osc.stop(now+i*0.11+0.1);
    });
  }catch(e){}
}

//==================================================================
//  描画
//==================================================================
function layout(){
  const availW=W-mapMargin.x*2;
  const availH=H-mapMargin.top- mapMargin.top;
  TILE=Math.floor(Math.min(availW/COLS, availH/ROWS));
  // center horizontally
  mapMargin.x=Math.floor((W-TILE*COLS)/2);
}

function draw(){
  ctx.clearRect(0,0,W,H);
  if(phase==='title'){ drawTitle(); return; }
  if(phase==='gameover'){ drawMap(); drawGameOver(); return; }
  if(phase==='battle'){ drawBattle(); return; }
  drawMap();
  if(phase==='produce') drawProduce();
}

function drawMap(){
  // background
  ctx.fillStyle='#070b18'; ctx.fillRect(0,0,W,H);
  // tiles
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const t=grid[r][c];
    const x=mapMargin.x+c*TILE, y=mapMargin.top+r*TILE;
    const pal=TERR[t.terr];
    ctx.fillStyle=((r+c)%2===0)?pal.col:pal.col2;
    ctx.fillRect(x,y,TILE,TILE);
    // dotted texture
    drawTerrainDots(x,y,t.terr,r,c);
    // grid line
    ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=1;
    ctx.strokeRect(x+.5,y+.5,TILE,TILE);
    // base
    if(t.base) drawBase(x,y,t);
  }
  // reachable highlight
  if(selected){
    const goodSet = new Set(UNITS[selected.type].good);
    ctx.globalAlpha=0.2;
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      if(!goodSet.has(grid[r][c].terr)) continue;
      const x=mapMargin.x+c*TILE, y=mapMargin.top+r*TILE;
      ctx.strokeStyle='#5ce06b';
      ctx.lineWidth=2;
      ctx.strokeRect(x+4,y+4,TILE-8,TILE-8);
    }
    ctx.globalAlpha=1;
  }
  for(let i=mapFx.length-1;i>=0;i--){
    const fx = mapFx[i];
    fx.t -= 1/60;
    const x=mapMargin.x+fx.c*TILE, y=mapMargin.top+fx.r*TILE;
    ctx.globalAlpha=Math.max(0,fx.t*2);
    ctx.fillStyle=fx.col;
    ctx.fillRect(x+3,y+3,TILE-6,TILE-6);
    ctx.globalAlpha=1;
    if(fx.t<=0) mapFx.splice(i,1);
  }
  ctx.globalAlpha=0.35;
  for(const p of reachable){
    const x=mapMargin.x+p.c*TILE, y=mapMargin.top+p.r*TILE;
    ctx.fillStyle='#4aa3ff'; ctx.fillRect(x+2,y+2,TILE-4,TILE-4);
  }
  ctx.globalAlpha=1;
  // attack targets
  for(const e of attackTargets){
    const x=mapMargin.x+e.c*TILE, y=mapMargin.top+e.r*TILE;
    ctx.strokeStyle='#ff5a5a'; ctx.lineWidth=3;
    ctx.strokeRect(x+2,y+2,TILE-4,TILE-4);
    ctx.fillStyle='#ff5a5a'; ctx.font='10px "Courier New"'; ctx.textAlign='center';
    ctx.fillText('⚔', x+TILE-8, y+12);
  }
  // selected outline
  if(selected){
    const x=mapMargin.x+selected.c*TILE, y=mapMargin.top+selected.r*TILE;
    ctx.strokeStyle='#ffd24a'; ctx.lineWidth=3;
    ctx.strokeRect(x+2,y+2,TILE-4,TILE-4);
  }
  // units
  for(const u of units){
    const cx=mapMargin.x+u.c*TILE+TILE/2, cy=mapMargin.top+u.r*TILE+TILE/2;
    const scale=TILE/48;
    drawMS(cx, cy, u.type, u.owner, scale, u.moved&&u.owner==='blue');
    // hp bar
    const hpr=u.hp/UNITS[u.type].hp;
    const bw=TILE-10;
    ctx.fillStyle='#000'; ctx.fillRect(cx-bw/2, cy+TILE/2-9, bw, 4);
    ctx.fillStyle= hpr>0.5?'#5ce06b':hpr>0.25?'#ffd24a':'#ff5a5a';
    ctx.fillRect(cx-bw/2, cy+TILE/2-9, bw*hpr, 4);
  }
  ctx.textAlign='left';
}

function drawTerrainDots(x,y,terr,r,c){
  ctx.save();
  if(terr==='space'){
    ctx.fillStyle='rgba(255,255,255,.5)';
    const s=((r*7+c*13)%5);
    if(s<2) ctx.fillRect(x+TILE*0.3, y+TILE*0.35, 2,2);
    if(s===3) ctx.fillRect(x+TILE*0.7, y+TILE*0.6, 2,2);
  } else if(terr==='water'){
    ctx.strokeStyle='rgba(120,180,255,.3)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(x+4,y+TILE*0.6); ctx.lineTo(x+TILE-4,y+TILE*0.6); ctx.stroke();
  } else if(terr==='ground'){
    ctx.fillStyle='rgba(120,200,120,.18)';
    ctx.fillRect(x+TILE*0.2,y+TILE*0.7,3,3); ctx.fillRect(x+TILE*0.6,y+TILE*0.3,3,3);
  } else { // atmos
    ctx.fillStyle='rgba(180,140,255,.16)';
    ctx.fillRect(x+TILE*0.5,y+TILE*0.5,3,3);
  }
  ctx.restore();
}

function drawBase(x,y,t){
  const b=BASE[t.base]; const cx=x+TILE/2, cy=y+TILE/2;
  const oc = t.owner==='blue'?'#4aa3ff':t.owner==='red'?'#ff5a5a':'#9aa6c0';
  // base platform
  ctx.fillStyle=oc; ctx.globalAlpha=0.22; ctx.fillRect(x+3,y+3,TILE-6,TILE-6); ctx.globalAlpha=1;
  // icon
  ctx.fillStyle=b.col;
  if(t.base==='capital'){
    // castle/star
    ctx.beginPath();
    for(let i=0;i<5;i++){const a=-Math.PI/2+i*2*Math.PI/5; const r1=TILE*0.26,r2=TILE*0.12;
      ctx.lineTo(cx+Math.cos(a)*r1, cy+Math.sin(a)*r1);
      const a2=a+Math.PI/5; ctx.lineTo(cx+Math.cos(a2)*r2, cy+Math.sin(a2)*r2);}
    ctx.closePath(); ctx.fill();
  } else if(t.base==='gacha'){
    ctx.beginPath(); ctx.arc(cx,cy-2,TILE*0.18,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=oc; ctx.fillRect(cx-TILE*0.18,cy-2,TILE*0.36,3);
  } else if(t.base==='supply'){
    ctx.fillRect(cx-TILE*0.16,cy-TILE*0.16,TILE*0.32,TILE*0.32);
    ctx.fillStyle='#0b1020'; ctx.fillRect(cx-2,cy-TILE*0.12,4,TILE*0.24); ctx.fillRect(cx-TILE*0.12,cy-2,TILE*0.24,4);
  } else { // city
    ctx.fillRect(cx-TILE*0.18,cy-TILE*0.05,TILE*0.1,TILE*0.22);
    ctx.fillRect(cx-TILE*0.05,cy-TILE*0.16,TILE*0.1,TILE*0.33);
    ctx.fillRect(cx+TILE*0.08,cy-TILE*0.02,TILE*0.1,TILE*0.19);
  }
  // owner border
  ctx.strokeStyle=oc; ctx.lineWidth=2; ctx.strokeRect(x+3,y+3,TILE-6,TILE-6);
}

// ドット調MS描画 (タイプ別に色とシルエット)
function drawMS(cx, cy, type, owner, scale, dim){
  const u=UNITS[type];
  const body = owner==='blue'? '#3a6fd0' : '#c0392b';
  const trim = u.col;
  const s=scale*1.0;
  ctx.save();
  ctx.translate(cx,cy);
  if(dim) ctx.globalAlpha=0.5;
  const px=(x,y,w,h,col)=>{ctx.fillStyle=col; ctx.fillRect(x*s,y*s,w*s,h*s);};
  // shadow
  ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0,15*s,12*s,4*s,0,0,Math.PI*2); ctx.fill();
  const cls=u.cls;
  // legs
  px(-7,6,4,9,body); px(3,6,4,9,body);
  // body
  px(-8,-4,16,12,body);
  // chest trim
  px(-6,-2,12,4,trim);
  // head
  px(-4,-13,8,8,owner==='blue'?'#dfe9ff':'#ffd9d4');
  // eye / visor
  px(-3,-11,6,2,'#ffe45a');
  // class-specific
  if(cls==='heavy'){
    px(-12,-6,4,14,body); px(8,-6,4,14,body); // big shoulders
    px(-12,-8,5,4,trim); px(7,-8,5,4,trim);
    px(10,-3,5,3,'#888'); // cannon
  } else if(cls==='mid'){
    px(-11,-5,4,10,body); px(7,-5,4,10,body);
    px(9,-1,7,2,'#cfd6e6'); // rifle
    if(type==='gundam'){ px(-4,-16,2,4,'#ff5a5a'); px(2,-16,2,4,'#ffd24a'); } // V-fin
  } else if(cls==='amph'){
    px(-11,-3,4,7,trim); px(7,-3,4,7,trim); // claws
    px(-2,-14,4,3,'#5ad0c0');
  } else { // light
    px(-10,-4,3,8,body); px(7,-4,3,8,body);
    px(8,-2,6,2,'#cfd6e6');
  }
  ctx.restore();
}

//------------------------------------------------------------------
function drawTitle(){
  ctx.fillStyle='#070b18'; ctx.fillRect(0,0,W,H);
  // starfield
  for(let i=0;i<60;i++){ const x=(i*137)%W, y=(i*89)%H; ctx.fillStyle='rgba(255,255,255,'+(0.2+(i%3)*0.2)+')'; ctx.fillRect(x,y,2,2); }
  ctx.textAlign='center';
  // demo MS row
  const demo=['zaku','gundam','zgok','gelgoog','zz','psyco'];
  demo.forEach((t,i)=>{ drawMS(140+i*120, 150, t, i%2?'red':'blue', 1.6, false); });
  ctx.fillStyle='#ffd24a'; ctx.font='40px "Courier New"';
  ctx.fillText('カプセル機甲戦線', W/2, 280);
  ctx.fillStyle='#9adfff'; ctx.font='18px "Courier New"';
  ctx.fillText('- CAPSULE TACTICS -', W/2, 312);
  ctx.fillStyle='#8aa0c8'; ctx.font='14px "Courier New"';
  ctx.fillText('ターン制戦略 × リアルタイムアクション', W/2, 350);
  ctx.fillText('敵の中枢コアを占領せよ。あるいは敵を全滅させよ。', W/2, 374);
  ctx.fillStyle='#4aa3ff'; ctx.font='12px "Courier New"';
  ctx.fillText('青軍: 独立コロニー防衛隊 / 限られた戦力で宙域を守る', W/2, 402);
  ctx.fillStyle='#ff8a8a';
  ctx.fillText('赤軍: 軌道制圧軍 / 中枢コア破壊で全域支配を狙う', W/2, 422);
  // blink start
  if(Math.floor(performance.now()/500)%2===0){
    ctx.fillStyle='#ffffff'; ctx.font='20px "Courier New"';
    ctx.fillText('▶ クリックして出撃 ◀', W/2, 440);
  }
  ctx.fillStyle='#54648a'; ctx.font='11px "Courier New"';
  ctx.fillText('青軍 (あなた) vs 赤軍 (CPU)', W/2, 480);
  ctx.textAlign='left';
  if(phase==='title') requestAnimationFrame(()=>{ if(phase==='title') drawTitle(); });
}

function drawGameOver(){
  const elapsed = Math.max(0, performance.now()-gameOverAt);
  const pulse = 0.15 + Math.max(0, Math.sin(elapsed/150))*0.12;
  ctx.fillStyle='rgba(4,8,18,.86)'; ctx.fillRect(0,0,W,H);
  if(elapsed<1600){
    ctx.fillStyle = gameResult==='blue' ? `rgba(255,210,74,${pulse.toFixed(3)})` : `rgba(255,90,90,${pulse.toFixed(3)})`;
    ctx.fillRect(0,0,W,H);
  }
  ctx.textAlign='center';
  const win=gameResult==='blue';
  ctx.fillStyle=win?'#ffd24a':'#ff5a5a'; ctx.font='44px "Courier New"';
  ctx.fillText(win?'★ 勝 利 ★':'敗 北…', W/2, H/2-30);
  ctx.fillStyle='#e8eefc'; ctx.font='18px "Courier New"';
  ctx.fillText(win?'敵中枢コアを制圧した！':'中枢コアを失った…', W/2, H/2+10);
  ctx.fillStyle='#8aa0c8'; ctx.font='14px "Courier New"';
  ctx.fillText('クリックでタイトルへ', W/2, H/2+50);
  ctx.fillStyle=win?'#ffe9a8':'#ffc8c8'; ctx.font='12px "Courier New"';
  ctx.fillText(win?'青軍作戦完遂。宙域の制空権を確保。':'戦線崩壊。再編して再出撃せよ。', W/2, H/2+76);
  ctx.textAlign='left';
}

//------------------------------------------------------------------
//  バトル描画
//------------------------------------------------------------------
function drawBattle(){
  const b=battle; if(!b) return;
  ctx.save();
  if(b.shake>0){
    const sx=(Math.random()*2-1)*b.shake;
    const sy=(Math.random()*2-1)*b.shake;
    ctx.translate(sx,sy);
  }
  // arena background by terrain
  const pal=TERR[b.terr];
  ctx.fillStyle=pal.col2; ctx.fillRect(0,0,W,H);
  // terrain decor
  if(b.terr==='space'){ for(let i=0;i<80;i++){const x=(i*101)%W,y=(i*57)%H; ctx.fillStyle='rgba(255,255,255,.4)'; ctx.fillRect(x,y,2,2);} }
  if(b.terr==='water'){ ctx.fillStyle='rgba(40,90,160,.25)'; for(let y=80;y<H;y+=26){ctx.fillRect(0,y,W,10);} }
  if(b.terr==='ground'){ ctx.fillStyle='#1c2e1c'; ctx.fillRect(0,H-30,W,30); }
  if(b.terr==='atmos'){ ctx.fillStyle='rgba(180,140,255,.10)'; ctx.fillRect(0,0,W,H); }
  // top HUD
  ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(0,0,W,56);
  drawBattleBar(b.player, 20, 12, false);
  drawBattleBar(b.enemy, W-20, 12, true);
  ctx.fillStyle='#ffd24a'; ctx.font='22px "Courier New"'; ctx.textAlign='center';
  ctx.fillText(Math.max(0,Math.ceil(b.time)), W/2, 30);
  ctx.fillStyle='#8aa0c8'; ctx.font='10px "Courier New"';
  ctx.fillText(TERR[b.terr].nm+'戦', W/2, 46);
  ctx.fillStyle='#b8c8f0'; ctx.font='9px "Courier New"';
  ctx.fillText(terrainEffectText(b.terr), W/2, 58);
  ctx.textAlign='left';
  // bullets
  for(const bl of b.bullets){
    ctx.fillStyle=bl.special?'#ff9ad0':(bl.owner==='blue'?'#9adfff':'#ffb24a');
    ctx.beginPath(); ctx.arc(bl.x,bl.y,bl.r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(bl.x,bl.y,bl.r*0.5,0,Math.PI*2); ctx.fill();
  }
  // fighters
  drawFighter(b.player); drawFighter(b.enemy);
  // fx
  for(const f of b.fx){ ctx.globalAlpha=Math.max(0,f.life*2); ctx.strokeStyle=f.col; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1; }
  // countdown
  if(b.countdown>0){
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffd24a'; ctx.font='60px "Courier New"'; ctx.textAlign='center';
    const n=Math.ceil(b.countdown-0.2);
    ctx.fillText(n>0?n:'START!', W/2, H/2);
    ctx.font='16px "Courier New"'; ctx.fillStyle='#9adfff';
    ctx.fillText('Z射撃  X格闘  C特殊  Vバースト  ←↑↓→移動', W/2, H/2+50);
    ctx.textAlign='left';
  }
  if(b.player.burst>=100 && b.player.burstActive<=0){
    ctx.fillStyle='rgba(255,210,74,.18)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffd24a';
    ctx.font='14px "Courier New"';
    ctx.textAlign='center';
    ctx.fillText('BURST READY: Vで発動', W/2, H-18);
    ctx.textAlign='left';
  }
  // result
  if(b.over&&b.result){
    ctx.fillStyle='rgba(4,8,18,.7)'; ctx.fillRect(0,0,W,H);
    ctx.textAlign='center';
    const win=b.result.winSide==='blue';
    ctx.fillStyle=win?'#ffd24a':'#ff5a5a'; ctx.font='40px "Courier New"';
    ctx.fillText(win?'撃 破 ！':'撃 墜 …', W/2, H/2-10);
    ctx.fillStyle='#e8eefc'; ctx.font='16px "Courier New"';
    ctx.fillText(`${b.result.winnerName} が ${b.result.loserName} を破壊`, W/2, H/2+24);
    ctx.fillStyle='#9adfff'; ctx.font='12px "Courier New"';
    ctx.fillText(`残HP ${b.result.winnerHp} / 残り${Math.ceil(b.result.timeLeft)}秒 / ${TERR[b.result.terrain].nm}`, W/2, H/2+48);
    const finisherName=b.result.finisher==='melee'?'格闘' : b.result.finisher==='special'?'特殊' : '射撃';
    ctx.fillText(`決め手: ${finisherName} / バースト使用: ${b.result.winnerBurstUsed?'あり':'なし'}`, W/2, H/2+68);
    ctx.textAlign='left';
  }
  if(b.player.hp/b.player.maxhp<0.3){
    ctx.strokeStyle='rgba(255,90,90,.45)';
    ctx.lineWidth=8;
    ctx.strokeRect(4,4,W-8,H-8);
  }
  ctx.restore();
}
function drawBattleBar(f, x, y, right){
  const w=300, h=14;
  const bx=right?x-w:x;
  ctx.fillStyle='#000'; ctx.fillRect(bx,y+16,w,h);
  const hpr=Math.max(0,f.hp)/f.maxhp;
  ctx.fillStyle=f.faction==='blue'?'#4aa3ff':'#ff5a5a';
  if(right) ctx.fillRect(bx+w*(1-hpr),y+16,w*hpr,h); else ctx.fillRect(bx,y+16,w*hpr,h);
  ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.strokeRect(bx,y+16,w,h);
  ctx.fillStyle='#e8eefc'; ctx.font='13px "Courier New"';
  ctx.textAlign=right?'right':'left';
  ctx.fillText(`${UNITS[f.type].nm}  HP ${Math.max(0,Math.round(f.hp))}`, right?x:x, y+12);
  const skillX = right? bx : bx;
  const laneY = y+34;
  const laneW = w;
  const drawLane=(label, ratio, col, lane)=>{
    const y0=laneY+lane*8;
    ctx.fillStyle='rgba(0,0,0,.55)';
    ctx.fillRect(skillX,y0,laneW,6);
    ctx.fillStyle=col;
    const rw=Math.max(0,Math.min(1,ratio))*laneW;
    if(right) ctx.fillRect(skillX+laneW-rw,y0,rw,6);
    else ctx.fillRect(skillX,y0,rw,6);
    ctx.fillStyle='#d3dcf4';
    ctx.font='8px "Courier New"';
    ctx.textAlign=right?'right':'left';
    ctx.fillText(label, right?skillX+laneW:skillX, y0+5);
  };
  drawLane('Z', 1-(f.fcool/Math.max(1,f.fcd)), '#9adfff', 0);
  drawLane('X', 1-(f.melCool/Math.max(1,f.melMax||520)), '#ff9a9a', 1);
  drawLane(`C x${f.sc}`, f.sc>0?1-(f.specCool/Math.max(1,f.specMax||900)):0, '#ff9ad0', 2);
  drawLane('V BURST', (f.burst||0)/100, f.burstActive>0?'#ffd24a':'#c0b05a', 3);
  if(f.burstActive>0){
    ctx.fillStyle='#ffd24a';
    ctx.font='9px "Courier New"';
    ctx.fillText(`BURST ${f.burstActive.toFixed(1)}s`, right?x:x, y+72);
  }
  ctx.textAlign='left';
}
function drawFighter(f){
  ctx.save();
  ctx.translate(f.x,f.y);
  if(f.hitFlash>0 && Math.floor(performance.now()/60)%2===0) ctx.globalAlpha=0.4;
  // facing: flip horizontally if dir<0
  const sc=1.7*(f.dir<0?-1:1);
  ctx.scale(sc,1.7);
  drawMSlocal(f.type, f.faction);
  ctx.restore();
}
// local MS draw centered at 0,0 (no translate) for battle scaling
function drawMSlocal(type, owner){
  const u=UNITS[type];
  const body=owner==='blue'?'#3a6fd0':'#c0392b';
  const trim=u.col;
  const px=(x,y,w,h,col)=>{ctx.fillStyle=col; ctx.fillRect(x,y,w,h);};
  px(-7,6,4,9,body); px(3,6,4,9,body);
  px(-8,-4,16,12,body);
  px(-6,-2,12,4,trim);
  px(-4,-13,8,8,owner==='blue'?'#dfe9ff':'#ffd9d4');
  px(-3,-11,6,2,'#ffe45a');
  const cls=u.cls;
  if(cls==='heavy'){ px(-12,-6,4,14,body); px(8,-6,4,14,body); px(10,-3,6,3,'#aaa'); }
  else if(cls==='mid'){ px(-11,-5,4,10,body); px(7,-5,4,10,body); px(9,-1,8,2,'#cfd6e6');
    if(type==='gundam'){px(-4,-16,2,4,'#ff5a5a');px(2,-16,2,4,'#ffd24a');} }
  else if(cls==='amph'){ px(-11,-3,4,7,trim); px(7,-3,4,7,trim); }
  else { px(-10,-4,3,8,body); px(7,-4,3,8,body); px(8,-2,7,2,'#cfd6e6'); }
}

//==================================================================
//  HUD
//==================================================================
function updateHUD(){
  const selectedLabel = selected
    ? `${UNITS[selected.type].nm} HP${selected.hp}/${UNITS[selected.type].hp} 射${UNITS[selected.type].rng} 適:${UNITS[selected.type].good.map(g=>TERR[g].nm).join('/')}`
    : '選択なし';
  document.getElementById('hud-blue').textContent='青軍 ¥'+money.blue+(queue.blue.length?` (生産${queue.blue.length})`:'');
  document.getElementById('hud-red').textContent='赤軍 ¥'+money.red+(queue.red.length?` (生産${queue.red.length})`:'');
  document.getElementById('hud-selected').textContent=selectedLabel;
  const aiTxt = aiThinking ? ` / AI:${aiUnitLabel||'思考中'}` : '';
  document.getElementById('hud-turn').textContent=`TURN ${turnNo} / ${side==='blue'?'青軍':'赤軍'} / ${currentMapName()}${aiTxt}`;
  const canMapInput = (side==='blue'&&phase==='map');
  document.getElementById('btn-produce').disabled=!canMapInput;
  document.getElementById('btn-end').disabled=!canMapInput;
  const endBtn = document.getElementById('btn-end');
  const confirm = endConfirmUntil > Date.now() && canMapInput;
  endBtn.textContent = confirm ? '確認: ターン終了 ▶' : 'ターン終了 ▶';
  endBtn.classList.toggle('confirm', confirm);
}
function setMsg(m){ msgEl.textContent=m; }

//==================================================================
window.addEventListener('resize', ()=>{ layout(); if(phase!=='battle') draw(); });
layout();
phase='title';
drawTitle();
updateHUD();
