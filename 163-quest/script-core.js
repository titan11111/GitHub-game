"use strict";
//==================================================================
//  カプセル機甲戦線 -CAPSULE TACTICS-
//  戦略マップ(ターン制) × アクション戦闘(リアルタイム) 融合
//==================================================================
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;
const msgEl = document.getElementById('msg');

//------------------------------------------------------------------
// ユニット定義 : HP/移動/射程/攻撃/コスト/生産ターン/地形適性
//------------------------------------------------------------------
const UNITS = {
  zaku:   {nm:'グラント',    cls:'light', hp:60,  mv:3, rng:1, atk:18, cost:200,  bt:1, good:['ground','space'], col:'#7fd36b'},
  gm:     {nm:'ジンライ',    cls:'light', hp:70,  mv:3, rng:1, atk:20, cost:250,  bt:1, good:['ground','space'], col:'#9adfff'},
  zgok:   {nm:'アクアクロウ', cls:'amph',  hp:95,  mv:3, rng:1, atk:28, cost:450,  bt:2, good:['water'],          col:'#5ad0c0'},
  gundam: {nm:'ヴァンガード', cls:'mid',   hp:115, mv:3, rng:1, atk:34, cost:600,  bt:2, good:['ground','atmos'], col:'#ffffff'},
  gelgoog:{nm:'ベルガルド',   cls:'mid',   hp:105, mv:4, rng:1, atk:32, cost:550,  bt:2, good:['space'],          col:'#c5b8ff'},
  zz:     {nm:'デュアルレクス', cls:'heavy', hp:170, mv:2, rng:2, atk:52, cost:1200, bt:3, good:['ground','space'], col:'#ffd24a'},
  psyco:  {nm:'ネメシス',     cls:'heavy', hp:210, mv:2, rng:2, atk:62, cost:1600, bt:3, good:['atmos','space'],  col:'#ff9ad0'},
};
const BUILD_MENU = ['zaku','gm','zgok','gundam','gelgoog','zz','psyco'];

//------------------------------------------------------------------
// 地形 : ground / space / water / atmos
//------------------------------------------------------------------
const TERR = {
  ground:{nm:'地上', col:'#2c4a2c', col2:'#234023'},
  space: {nm:'宇宙', col:'#0c1230', col2:'#0a0f28'},
  water: {nm:'水中', col:'#163a66', col2:'#12305a'},
  atmos: {nm:'大気圏',col:'#3a2c52', col2:'#322446'},
};
// 拠点 : city=収入 gacha=生産 supply=補給 capital=中枢コア
const BASE = {
  city:   {nm:'都市',    inc:100, col:'#caa84a'},
  gacha:  {nm:'ガチャベース', inc:60, col:'#4ab0ff'},
  supply: {nm:'補給基地', inc:40, col:'#5ce06b'},
  capital:{nm:'中枢コア',inc:200,col:'#ff7ad0'},
};

//------------------------------------------------------------------
// マップ生成 (列COLS x 行ROWS)
//------------------------------------------------------------------
const COLS = 12, ROWS = 9;
let TILE = 0; // computed at layout
const mapMargin = {x:16, top:16};
const MAPS = [
  {
    nm:'ミッドリング宙域',
    tmap:[
      "ssssssssssss",
      "ssaaaaaaaass",
      "saaggggggaas",
      "saggggggggas",
      "sggwwggwwggs",
      "saggggggggas",
      "saaggggggaas",
      "ssaaaaaaaass",
      "ssssssssssss",
    ],
    bases:[
      [7,1,'capital','blue'],[7,2,'gacha','blue'],[6,1,'city','blue'],[6,3,'supply','blue'],
      [5,1,'city','blue'],[8,3,'gacha','blue'],
      [1,10,'capital','red'],[1,9,'gacha','red'],[2,10,'city','red'],[2,8,'supply','red'],
      [3,10,'city','red'],[0,8,'gacha','red'],
      [4,5,'city','neutral'],[4,6,'city','neutral'],[3,3,'supply','neutral'],
      [5,9,'gacha','neutral'],[2,4,'city','neutral'],[6,8,'city','neutral'],
    ],
  },
  {
    nm:'ブルーアビス戦域',
    tmap:[
      "sssssswwssss",
      "ssaaawwwaass",
      "saagwwwwgaas",
      "saggwwwwggas",
      "sggwwggwwggs",
      "saggwwwwggas",
      "saagwwwwgaas",
      "ssaaawwwaass",
      "sssssswwssss",
    ],
    bases:[
      [7,1,'capital','blue'],[7,2,'gacha','blue'],[6,1,'city','blue'],[6,3,'supply','blue'],
      [5,2,'city','blue'],[8,3,'gacha','blue'],
      [1,10,'capital','red'],[1,9,'gacha','red'],[2,10,'city','red'],[2,8,'supply','red'],
      [3,9,'city','red'],[0,8,'gacha','red'],
      [4,5,'city','neutral'],[4,6,'city','neutral'],[3,4,'supply','neutral'],
      [5,8,'gacha','neutral'],[2,5,'city','neutral'],[6,7,'city','neutral'],
    ],
  },
  {
    nm:'ヴォイドベルト',
    tmap:[
      "ssssssssssss",
      "ssssaaaaasss",
      "sssaagggasss",
      "ssaagggggaas",
      "saaagggggaas",
      "ssaagggggaas",
      "sssaagggasss",
      "ssssaaaaasss",
      "ssssssssssss",
    ],
    bases:[
      [7,1,'capital','blue'],[8,2,'gacha','blue'],[6,1,'city','blue'],[6,3,'supply','blue'],
      [5,2,'city','blue'],[7,3,'gacha','blue'],
      [1,10,'capital','red'],[0,9,'gacha','red'],[2,10,'city','red'],[2,8,'supply','red'],
      [3,9,'city','red'],[1,8,'gacha','red'],
      [4,5,'city','neutral'],[4,6,'city','neutral'],[3,5,'supply','neutral'],
      [5,6,'gacha','neutral'],[2,6,'city','neutral'],[6,6,'city','neutral'],
    ],
  }
];
let mapIdx = 0;

let grid = []; // grid[r][c] = {terr, base, owner}
function buildGrid(){
  const conf = MAPS[mapIdx];
  grid = [];
  for(let r=0;r<ROWS;r++){
    const row=[];
    for(let c=0;c<COLS;c++){
      const ch = conf.tmap[r][c];
      const terr = ch==='s'?'space':ch==='w'?'water':ch==='a'?'atmos':'ground';
      row.push({terr, base:null, owner:'neutral'});
    }
    grid.push(row);
  }
  for(const [r,c,t,o] of conf.bases){ grid[r][c].base=t; grid[r][c].owner=o; }
}

//------------------------------------------------------------------
// ゲーム状態
//------------------------------------------------------------------
let units = [];   // {id,type,owner,r,c,hp,moved,acted}
let uid = 1;
let money = {blue:600, red:600};
let queue = {blue:[], red:[]}; // production queue: {type, left}
let turnNo = 1;
let side = 'blue';
let phase = 'title'; // title | map | battle | gameover
let selected = null;       // selected unit
let reachable = [];        // reachable tiles {r,c}
let attackTargets = [];    // enemy units in range
let pendingProduce = false;
let endConfirmUntil = 0;
let endConfirmTimer = null;
let aiThinking = false;
let aiUnitLabel = '';
let gameOverAt = 0;
const mapFx = [];
const tutorial = {active:false, step:0};
const TUTORIAL_DONE_KEY = 'capsule_tactics_tutorial_done_v1';

function currentMapName(){ return MAPS[mapIdx].nm; }
function chooseMap(){ mapIdx = Math.floor(Math.random()*MAPS.length); }
function btn(id){ return document.getElementById(id); }
function pulseButton(id){
  const el = btn(id);
  el.classList.remove('pulse');
  void el.offsetWidth;
  el.classList.add('pulse');
}
function clearEndConfirm(){
  endConfirmUntil = 0;
  if(endConfirmTimer){ clearTimeout(endConfirmTimer); endConfirmTimer=null; }
  updateHUD();
}
function triggerMapFx(r,c,col){ mapFx.push({r,c,col,t:0.35}); }
function tutorialState(){
  if(!tutorial.active) return '';
  const steps = [
    'TUTORIAL 1/3: 自軍ユニットを1体選択してください。',
    'TUTORIAL 2/3: 青いマスを選んで移動してください。',
    'TUTORIAL 3/3: 赤枠の敵を選んで戦闘を開始してください。'
  ];
  return steps[tutorial.step] || '';
}
function updateTutorial(trigger){
  if(!tutorial.active) return;
  if(tutorial.step===0 && trigger==='select') tutorial.step=1;
  else if(tutorial.step===1 && trigger==='move') tutorial.step=2;
  else if(tutorial.step===2 && trigger==='battle'){
    tutorial.active=false;
    try{ localStorage.setItem(TUTORIAL_DONE_KEY, '1'); }catch(e){}
    setMsg('チュートリアル完了。中枢コア制圧を目指せ。');
    return;
  }
  setMsg(tutorialState());
}

function addUnit(type,owner,r,c,hp){
  units.push({id:uid++, type, owner, r, c, hp: hp!=null?hp:UNITS[type].hp, moved:false, acted:false});
}
function unitAt(r,c){ return units.find(u=>u.r===r&&u.c===c); }
function capitalOf(owner){
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)
    if(grid[r][c].base==='capital'&&grid[r][c].owner===owner) return {r,c};
  return null;
}

function newGame(){
  chooseMap();
  buildGrid();
  units=[]; uid=1; turnNo=1; side='blue'; selected=null;
  money={blue:600, red:600}; queue={blue:[],red:[]};
  clearEndConfirm();
  aiThinking = false;
  aiUnitLabel = '';
  mapFx.length = 0;
  // starting forces
  addUnit('gundam','blue',6,2); addUnit('zaku','blue',7,3); addUnit('gm','blue',6,2-0+0);
  addUnit('gm','blue',5,2); addUnit('zaku','blue',8,2);
  addUnit('gelgoog','red',2,9); addUnit('zaku','red',1,8); addUnit('gm','red',2,9-0);
  addUnit('zaku','red',3,9); addUnit('gm','red',0,9);
  // fix overlaps from quick init
  spreadOverlaps();
  phase='map';
  try{
    tutorial.active = !localStorage.getItem(TUTORIAL_DONE_KEY);
  }catch(e){
    tutorial.active = true;
  }
  tutorial.step = 0;
  setMsg(tutorial.active?tutorialState():`作戦開始。戦域: ${currentMapName()}`);
  startTurn('blue');
  layout(); draw();
}
function spreadOverlaps(){
  const seen={};
  for(const u of units){
    let key=u.r+','+u.c, tries=0;
    while(seen[key]&&tries<40){
      // find nearest empty same-owner-ish tile
      const nb=[[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]];
      const d=nb[tries%nb.length];
      const nr=Math.min(ROWS-1,Math.max(0,u.r+d[0]));
      const nc=Math.min(COLS-1,Math.max(0,u.c+d[1]));
      if(grid[nr][nc].terr!=='space'||true){ u.r=nr;u.c=nc; key=nr+','+nc; }
      tries++;
    }
    seen[key]=true;
  }
}

//------------------------------------------------------------------
// 収入・生産・ターン処理
//------------------------------------------------------------------
function income(owner){
  let sum=0;
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const t=grid[r][c];
    if(t.base&&t.owner===owner) sum+=BASE[t.base].inc;
  }
  money[owner]+=sum;
  return sum;
}
function processQueue(owner){
  // produce at gacha bases owned
  const done=[];
  queue[owner]=queue[owner].filter(item=>{
    item.left--;
    if(item.left<=0){ done.push(item.type); return false; }
    return true;
  });
  // spawn finished units at an owned gacha base with empty adjacent tile
  for(const type of done){
    const spot=findSpawn(owner);
    if(spot){ addUnit(type,owner,spot.r,spot.c); }
    else { // refund if nowhere to place
      money[owner]+=Math.floor(UNITS[type].cost*0.5);
    }
  }
}
function findSpawn(owner){
  const gachas=[];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)
    if((grid[r][c].base==='gacha'||grid[r][c].base==='capital')&&grid[r][c].owner===owner) gachas.push({r,c});
  for(const g of gachas){
    if(!unitAt(g.r,g.c)) return g;
    for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]){
      const nr=g.r+dr,nc=g.c+dc;
      if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&!unitAt(nr,nc)) return {r:nr,c:nc};
    }
  }
  return null;
}
function startTurn(owner){
  for(const u of units) if(u.owner===owner){ u.moved=false; u.acted=false; }
  const inc=income(owner);
  processQueue(owner);
  if(owner==='blue'){
    aiThinking=false; aiUnitLabel='';
    clearEndConfirm();
    if(!tutorial.active) setMsg(`青軍交戦開始。戦域: ${currentMapName()} / 収入 +¥${inc}`);
  }
  updateHUD();
}

function doEndTurn(){
  if(phase!=='map'||side!=='blue') return;
  clearEndConfirm();
  pulseButton('btn-end');
  selected=null; reachable=[]; attackTargets=[];
  side='red';
  aiThinking=true; aiUnitLabel='思考中';
  updateHUD(); draw();
  setMsg('赤軍 思考中…');
  startTurn('red');
  setTimeout(enemyTurn, 350);
}
function requestEndTurn(){
  if(phase!=='map'||side!=='blue') return;
  const now = Date.now();
  if(endConfirmUntil > now){
    doEndTurn();
    return;
  }
  endConfirmUntil = now + 2200;
  setMsg('もう一度押すとターン終了。2.2秒で解除されます。');
  updateHUD();
  if(endConfirmTimer) clearTimeout(endConfirmTimer);
  endConfirmTimer = setTimeout(()=>{
    endConfirmUntil = 0;
    updateHUD();
  }, 2200);
}

//------------------------------------------------------------------
// 移動範囲計算 (BFS, 地形コスト一律1, ユニットすり抜け不可)
//------------------------------------------------------------------
function computeReach(u){
  const res=[]; const seen={}; const start=u.r+','+u.c;
  let frontier=[{r:u.r,c:u.c,d:0}]; seen[start]=0;
  while(frontier.length){
    const next=[];
    for(const cell of frontier){
      for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]){
        const nr=cell.r+dr,nc=cell.c+dc;
        if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
        const nd=cell.d+1;
        if(nd>u.mvEff()) continue;
        const k=nr+','+nc;
        if(seen[k]!=null&&seen[k]<=nd) continue;
        const occ=unitAt(nr,nc);
        if(occ&&occ.owner!==u.owner) continue; // blocked by enemy
        if(occ&&occ.id!==u.id) { seen[k]=nd; continue; } // can't stop on ally but pass
        seen[k]=nd; res.push({r:nr,c:nc}); next.push({r:nr,c:nc,d:nd});
      }
    }
    frontier=next;
  }
  return res.filter(t=>{ const o=unitAt(t.r,t.c); return !o || o.id===u.id; });
}
// movement helper bound to unit prototype-ish
function mvEff(u){
  let m=UNITS[u.type].mv;
  // terrain affinity small bonus on good terrain (current tile)
  return m;
}
// attach convenience
function withU(u){ u.mvEff=()=>mvEff(u); return u; }

function enemiesInRange(u){
  const rng=UNITS[u.type].rng;
  const list=[];
  for(const e of units){
    if(e.owner===u.owner) continue;
    const dist=Math.abs(e.r-u.r)+Math.abs(e.c-u.c);
    if(dist<=rng) list.push(e);
  }
  return list;
}

//------------------------------------------------------------------
// 戦闘ダメージ (地形適性で補正) - アクション結果に使用
//------------------------------------------------------------------
function terrainMult(u){
  const t=grid[u.r][u.c].terr;
  return UNITS[u.type].good.includes(t)?1.25:1.0;
}

//------------------------------------------------------------------
// プレイヤー操作 : クリック処理
//------------------------------------------------------------------
function tileAtPx(px,py){
  const x=px-mapMargin.x, y=py-mapMargin.top;
  if(x<0||y<0) return null;
  const c=Math.floor(x/TILE), r=Math.floor(y/TILE);
  if(r<0||r>=ROWS||c<0||c>=COLS) return null;
  return {r,c};
}

cv.addEventListener('click', (ev)=>{
  const rect=cv.getBoundingClientRect();
  const px=(ev.clientX-rect.left)*(W/rect.width);
  const py=(ev.clientY-rect.top)*(H/rect.height);
  if(phase==='title'){ newGame(); return; }
  if(phase==='gameover'){ phase='title'; draw(); return; }
  if(phase!=='map'||side!=='blue') return;
  const t=tileAtPx(px,py);
  if(!t) return;
  handleMapClick(t.r,t.c);
});

function handleMapClick(r,c){
  clearEndConfirm();
  const clicked=unitAt(r,c);
  // selecting own unmoved unit
  if(clicked&&clicked.owner==='blue'){
    if(selected&&selected.id===clicked.id){ clearSel(); draw(); return; }
    selectUnit(clicked); draw(); return;
  }
  if(!selected){ clearSel(); draw(); return; }
  // attack adjacent enemy
  const tgt=attackTargets.find(e=>e.r===r&&e.c===c);
  if(tgt){ initiateBattle(selected, tgt); return; }
  // move
  if(!selected.moved){
    const dest=reachable.find(p=>p.r===r&&p.c===c);
    if(dest && !unitAt(r,c)){
      selected.r=r; selected.c=c; selected.moved=true;
      triggerMapFx(r,c,'#9adfff');
      updateTutorial('move');
      tryCapture(selected);
      // recompute attack targets from new position
      reachable=[];
      attackTargets=enemiesInRange(selected);
      if(attackTargets.length===0){ selected.acted=true; clearSel(); }
      else setMsg('隣接した敵を選んで戦闘、または別ユニットを選択。');
      updateHUD(); draw(); return;
    }
  }
  clearSel(); draw();
}

function selectUnit(u){
  selected=withU(u);
  triggerMapFx(u.r,u.c,'#ffd24a');
  updateTutorial('select');
  attackTargets = u.moved?enemiesInRange(u):enemiesInRange(u);
  reachable = u.moved?[]:computeReach(u);
  if(u.moved&&attackTargets.length===0){ setMsg('このユニットは行動済み。'); }
  else setMsg(`${UNITS[u.type].nm} を選択。移動先か隣接敵をクリック。`);
}
function clearSel(){ selected=null; reachable=[]; attackTargets=[]; }

function tryCapture(u){
  const t=grid[u.r][u.c];
  if(t.base && t.owner!==u.owner){
    const prevOwner=t.owner;
    t.owner=u.owner;
    if(t.base==='capital'){
      // win!
      setTimeout(()=>endGame(u.owner), 200);
    } else {
      setMsg(`${BASE[t.base].nm} を占領！`);
    }
    updateHUD();
  }
}

//------------------------------------------------------------------
// 生産メニュー
//------------------------------------------------------------------
document.getElementById('btn-produce').onclick=()=>{
  if(phase!=='map'||side!=='blue') return;
  clearEndConfirm();
  pulseButton('btn-produce');
  openProduce();
};
document.getElementById('btn-end').onclick=requestEndTurn;

let produceUI=null;
function openProduce(){
  // simple overlay rendered on canvas; capture next click via state
  pendingProduce=true; phase='produce'; draw();
}
function drawProduce(){
  ctx.fillStyle='rgba(4,8,18,.88)'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#ffd24a'; ctx.font='20px "Courier New"'; ctx.textAlign='center';
  ctx.fillText('★ ガチャベース生産 ★', W/2, 50);
  ctx.font='13px "Courier New"'; ctx.fillStyle='#8aa0c8';
  ctx.fillText(`所持金 ¥${money.blue}  /  生産はガチャベース所有数だけ並列可`, W/2, 76);
  const startY=110, rowH=52; produceUI=[];
  BUILD_MENU.forEach((type,i)=>{
    const u=UNITS[type];
    const y=startY+i*rowH;
    const can=money.blue>=u.cost;
    ctx.fillStyle=can?'#1c294d':'#15192c';
    ctx.fillRect(W/2-300,y,600,rowH-8);
    ctx.strokeStyle=can?'#34507f':'#222';
    ctx.lineWidth=2; ctx.strokeRect(W/2-300,y,600,rowH-8);
    // sprite
    drawMS(W/2-272, y+(rowH-8)/2, type, 'blue', 0.9, false);
    ctx.textAlign='left'; ctx.fillStyle=can?'#e8eefc':'#555';
    ctx.font='15px "Courier New"';
    ctx.fillText(`${u.nm}`, W/2-238, y+20);
    ctx.font='11px "Courier New"'; ctx.fillStyle=can?'#8aa0c8':'#444';
    ctx.fillText(`HP${u.hp} 移${u.mv} 射${u.rng} 攻${u.atk} 適:${u.good.map(g=>TERR[g].nm).join('/')}`, W/2-238, y+38);
    ctx.textAlign='right'; ctx.fillStyle=can?'#ffd24a':'#553';
    ctx.font='15px "Courier New"';
    ctx.fillText(`¥${u.cost} / ${u.bt}T`, W/2+288, y+27);
    produceUI.push({type,x:W/2-300,y,w:600,h:rowH-8,can});
  });
  // close
  const cy=startY+BUILD_MENU.length*rowH+6;
  ctx.fillStyle='#3a1c1c'; ctx.fillRect(W/2-80,cy,160,34);
  ctx.strokeStyle='#7a3b3b'; ctx.strokeRect(W/2-80,cy,160,34);
  ctx.fillStyle='#ff9a9a'; ctx.textAlign='center'; ctx.font='14px "Courier New"';
  ctx.fillText('閉じる', W/2, cy+22);
  produceUI.push({close:true,x:W/2-80,y:cy,w:160,h:34});
  ctx.textAlign='left';
}
cv.addEventListener('click',(ev)=>{
  if(phase!=='produce') return;
  const rect=cv.getBoundingClientRect();
  const px=(ev.clientX-rect.left)*(W/rect.width);
  const py=(ev.clientY-rect.top)*(H/rect.height);
  for(const it of produceUI){
    if(px>=it.x&&px<=it.x+it.w&&py>=it.y&&py<=it.y+it.h){
      if(it.close){ phase='map'; draw(); return; }
      if(it.can){
        const u=UNITS[it.type];
        money.blue-=u.cost;
        queue.blue.push({type:it.type,left:u.bt});
        setMsg(`${u.nm} を生産開始 (${u.bt}ターン後)`);
        phase='map'; updateHUD(); draw();
      }
      return;
    }
  }
});

//==================================================================
//  アクション戦闘フェーズ
//==================================================================
let battle=null;
const keys={};
const INPUT_BUFFER_TTL = 0.18;
const PLAYER_MELEE_COOLDOWN = 520;
const PLAYER_SPECIAL_COOLDOWN = 900;
const ENEMY_MELEE_COOLDOWN = 620;
const ENEMY_SPECIAL_COOLDOWN = 1400;
const BURST_MAX = 100;
const BURST_ACTIVE_SEC = 4.5;

function setBufferedAction(key){
  if(!battle||phase!=='battle'||battle.over) return;
  const map={z:'fire',Z:'fire',x:'melee',X:'melee',c:'special',C:'special',v:'burst',V:'burst'};
  const action=map[key];
  if(action) battle.inputBuffer[action]=INPUT_BUFFER_TTL;
}
window.addEventListener('keydown',e=>{
  keys[e.key]=true;
  setBufferedAction(e.key);
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','z','Z','x','X','c','C','v','V'].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup',e=>{ keys[e.key]=false; });

function classStats(type){
  const c=UNITS[type].cls;
  // speed, fireCd(ms), bullet dmg, melee dmg, specialDmg, specialCharges
  const map={
    light:{spd:2.75, fcd:250, bd:7, md:15, sd:0,  sc:0, big:9},
    amph: {spd:2.5,  fcd:300, bd:8, md:17, sd:0,  sc:0, big:10},
    mid:  {spd:2.35, fcd:335, bd:9, md:24, sd:30, sc:3, big:11},
    heavy:{spd:1.75, fcd:520, bd:12,md:33, sd:46, sc:2, big:14},
  };
  return map[c];
}
function matchupMult(attackerCls, defenderCls){
  if(attackerCls==='amph'||defenderCls==='amph') return 1.0;
  if(attackerCls===defenderCls) return 1.0;
  const wins = {
    light:'heavy',
    heavy:'mid',
    mid:'light'
  };
  return wins[attackerCls]===defenderCls ? 1.18 : 0.88;
}
function matchupLabel(attackerCls, defenderCls){
  const m = matchupMult(attackerCls, defenderCls);
  if(m>1.01) return 'クラス相性:有利';
  if(m<0.99) return 'クラス相性:不利';
  return 'クラス相性:互角';
}
function terrainEffectText(terr){
  const map={
    space:'宇宙: 慣性強・弾速微増',
    water:'水中: 制動重め・装甲有利',
    ground:'地上: 近接安定',
    atmos:'大気圏: 機動補正'
  };
  return map[terr]||'標準';
}
function tryActivateBurst(f){
  if(f.burst>=BURST_MAX && f.burstActive<=0){
    f.burstActive=BURST_ACTIVE_SEC;
    f.burst=0;
    f.burstUsed=true;
    battle.hitStop=Math.max(battle.hitStop, 0.03);
    battle.shake=Math.max(battle.shake, 3);
    if(typeof playBattleSfx==='function') playBattleSfx('burst');
    return true;
  }
  return false;
}

function initiateBattle(attacker, defender){
  updateTutorial('battle');
  const atkGood = terrainMult(attacker)>1;
  const defGood = terrainMult(defender)>1;
  const field = TERR[grid[defender.r][defender.c].terr].nm;
  const playerU = attacker.owner==='blue'?attacker:defender;
  const enemyU  = attacker.owner==='blue'?defender:attacker;
  const adv = atkGood===defGood ? '地形補正は互角' : atkGood ? '地形補正:あなた有利' : '地形補正:敵有利';
  const clsInfo = matchupLabel(UNITS[playerU.type].cls, UNITS[enemyU.type].cls);
  setMsg(`交戦開始: ${UNITS[attacker.type].nm} vs ${UNITS[defender.type].nm} / ${field} / ${adv} / ${clsInfo}`);
  // player always controls the BLUE unit involved
  const terr=grid[defender.r][defender.c].terr;
  for(const k of Object.keys(keys)) keys[k]=false;
  battle={
    attacker, defender,
    terr,
    player: makeFighter(playerU, 'blue', 140, H/2),
    enemy:  makeFighter(enemyU,  'red',  W-140, H/2),
    bullets:[],
    fx:[],
    time:60.0,
    last:performance.now(),
    over:false,
    result:null,
    countdown:2.2,
    hitStop:0,
    shake:0,
    lastHitKind:'shot',
    inputBuffer:{fire:0, melee:0, special:0, burst:0}
  };
  phase='battle';
  selected=null; reachable=[]; attackTargets=[];
  requestAnimationFrame(battleLoop);
}

function makeFighter(srcUnit, faction, x, y){
  const st=classStats(srcUnit.type);
  const terrMult=terrainBattleMult(srcUnit);
  return {
    src:srcUnit, faction, type:srcUnit.type,
    x,y, vx:0, vy:0,
    dir: faction==='blue'?1:-1, dy:0,
    cls:UNITS[srcUnit.type].cls,
    hp:srcUnit.hp, maxhp:UNITS[srcUnit.type].hp,
    spd:st.spd*terrMult.spd, fcd:st.fcd, fcool:0,
    bd:st.bd, md:st.md, sd:st.sd, sc:st.sc, big:st.big,
    melCool:0, specCool:0, hitFlash:0, invuln:0,
    melMax:faction==='blue'?PLAYER_MELEE_COOLDOWN:ENEMY_MELEE_COOLDOWN,
    specMax:faction==='blue'?PLAYER_SPECIAL_COOLDOWN:ENEMY_SPECIAL_COOLDOWN,
    burst:0, burstUsed:false, burstActive:0,
    terrMult,
    aiTimer:0, aiState:'approach',
    radius:18,
  };
}
function terrainBattleMult(u){
  const terr = battle?battle.terr:battleTerrGuess(u);
  const good=UNITS[u.type].good.includes(terr);
  const base = good ? {spd:1.12, atk:1.08, def:0.92} : {spd:1.0, atk:1.0, def:1.0};
  const terrBonus = {
    space:{accel:0.48, fric:0.55, bullet:1.08, spd:1.0},
    water:{accel:0.72, fric:1.2, bullet:0.86, spd:0.95},
    ground:{accel:1.0, fric:1.0, bullet:1.0, spd:1.0},
    atmos:{accel:0.92, fric:0.95, bullet:1.03, spd:1.05},
  }[terr] || {accel:1.0, fric:1.0, bullet:1.0, spd:1.0};
  return {
    spd:base.spd*terrBonus.spd,
    atk:base.atk,
    def:base.def,
    accel:terrBonus.accel,
    fric:terrBonus.fric,
    bullet:terrBonus.bullet,
  };
}
function battleTerrGuess(u){ return grid[u.r][u.c]?grid[u.r][u.c].terr:'ground'; }

function battleLoop(now){
  if(phase!=='battle'||!battle) return;
  const dt=Math.min(50, now-battle.last)/1000;
  battle.last=now;
  if(battle.shake>0) battle.shake=Math.max(0,battle.shake-dt*18);
  if(!battle.over){
    if(battle.countdown>0){
      battle.countdown-=dt;
    } else {
      updateBattle(dt);
    }
  }
  drawBattle();
  if(battle.over){
    if(battle.result.endAt==null) battle.result.endAt=now;
    if(now-battle.result.endAt>1600){ finishBattle(); return; }
  }
  requestAnimationFrame(battleLoop);
}

function updateBattle(dt){
  const b=battle, p=b.player, e=b.enemy;
  if(b.hitStop>0){
    b.hitStop=Math.max(0, b.hitStop-dt);
    return;
  }
  b.time-=dt;
  for(const k of Object.keys(b.inputBuffer)) b.inputBuffer[k]=Math.max(0,b.inputBuffer[k]-dt);
  if(p.invuln>0) p.invuln-=dt;
  if(e.invuln>0) e.invuln-=dt;
  if(p.burstActive>0) p.burstActive=Math.max(0,p.burstActive-dt);
  if(e.burstActive>0) e.burstActive=Math.max(0,e.burstActive-dt);
  // --- player input ---
  const burstSpd = p.burstActive>0 ? 1.18 : 1;
  const baseAccel = b.terr==='space'?12:60;
  const baseFric = b.terr==='space'?0.6:9;
  const accel = baseAccel*p.terrMult.accel; // space = inertia (low control)
  const fric  = baseFric*p.terrMult.fric;
  let ix=0, iy=0;
  if(keys['ArrowLeft'])ix-=1; if(keys['ArrowRight'])ix+=1;
  if(keys['ArrowUp'])iy-=1; if(keys['ArrowDown'])iy+=1;
  if(ix||iy){ const l=Math.hypot(ix,iy); p.dir=ix!==0?Math.sign(ix):p.dir; p.dy=iy;
    p.vx+=ix/l*accel*dt*p.spd*burstSpd; p.vy+=iy/l*accel*dt*p.spd*burstSpd; }
  // friction
  p.vx-=p.vx*Math.min(1,fric*dt); p.vy-=p.vy*Math.min(1,fric*dt);
  const maxv=p.spd*1.6*burstSpd;
  const sv=Math.hypot(p.vx,p.vy); if(sv>maxv){ p.vx*=maxv/sv; p.vy*=maxv/sv; }
  p.x+=p.vx; p.y+=p.vy;
  clampArena(p);
  // weapons
  p.fcool=Math.max(0,p.fcool-dt*1000);
  p.melCool=Math.max(0,p.melCool-dt*1000);
  p.specCool=Math.max(0,p.specCool-dt*1000);
  if((keys['v']||keys['V']||b.inputBuffer.burst>0) && p.burst>=BURST_MAX && p.burstActive<=0){
    if(tryActivateBurst(p)) b.inputBuffer.burst=0;
  }
  const fireWanted=(keys['z']||keys['Z']||b.inputBuffer.fire>0);
  if(fireWanted && p.fcool<=0){
    fire(p, p.dir, p.dy, p.burstActive>0);
    p.fcool=p.fcd*(p.burstActive>0?0.82:1);
    b.inputBuffer.fire=0;
  }
  const meleeWanted=(keys['x']||keys['X']||b.inputBuffer.melee>0);
  if(meleeWanted && p.melCool<=0){
    melee(p,e,p.burstActive>0);
    p.melCool=PLAYER_MELEE_COOLDOWN*(p.burstActive>0?0.85:1);
    b.inputBuffer.melee=0;
  }
  const specialWanted=(keys['c']||keys['C']||b.inputBuffer.special>0);
  if(specialWanted && p.specCool<=0 && p.sc>0 && p.sd>0){
    special(p,e,p.burstActive>0);
    p.sc--;
    p.specCool=PLAYER_SPECIAL_COOLDOWN*(p.burstActive>0?0.9:1);
    b.inputBuffer.special=0;
  }

  // --- enemy AI ---
  aiControl(e, p, dt);

  // --- bullets ---
  for(const bl of b.bullets){
    bl.x+=bl.vx*dt; bl.y+=bl.vy*dt; bl.life-=dt;
    const tgt=bl.owner==='blue'?e:p;
    if(bl.life>0 && Math.hypot(bl.x-tgt.x,bl.y-tgt.y)<tgt.radius+bl.r){
      damage(tgt, bl.dmg, bl.owner==='blue'?p:e, bl.special?'special':'shot');
      bl.life=0;
      spawnFx(bl.x,bl.y, bl.special?'#ff9ad0':'#ffd24a');
    }
  }
  b.bullets=b.bullets.filter(bl=>bl.life>0 && bl.x>-20&&bl.x<W+20&&bl.y>-20&&bl.y<H+20);
  // fx
  for(const f of b.fx){ f.life-=dt; f.r+=dt*60; }
  b.fx=b.fx.filter(f=>f.life>0);
  if(p.hitFlash>0)p.hitFlash-=dt; if(e.hitFlash>0)e.hitFlash-=dt;

  // win check
  if(e.hp<=0){ endBattle(p,'blue'); }
  else if(p.hp<=0){ endBattle(e,'red'); }
  else if(b.time<=0){
    const pr=p.hp/p.maxhp, er=e.hp/e.maxhp;
    if(pr>=er) endBattle(p,'blue'); else endBattle(e,'red');
  }
}

function clampArena(f){
  const m=24;
  if(f.x<m){f.x=m;f.vx=Math.abs(f.vx)*0.3;}
  if(f.x>W-m){f.x=W-m;f.vx=-Math.abs(f.vx)*0.3;}
  if(f.y<70){f.y=70;f.vy=Math.abs(f.vy)*0.3;}
  if(f.y>H-40){f.y=H-40;f.vy=-Math.abs(f.vy)*0.3;}
}
function fire(f, dx, dy, bursted){
  const sp=480*f.terrMult.bullet*(bursted?1.08:1);
  let vx=dx, vy=dy||0;
  if(vx===0&&vy===0) vx=f.dir;
  const l=Math.hypot(vx,vy)||1;
  const dmg=Math.round(f.bd*(bursted?1.1:1));
  battle.bullets.push({x:f.x+f.dir*20, y:f.y, vx:vx/l*sp, vy:vy/l*sp, r:5, dmg, owner:f.faction, life:1.4, special:false});
  if(typeof playBattleSfx==='function') playBattleSfx('shot');
  spawnFx(f.x+f.dir*18,f.y,'#9adfff',0.12);
}
function melee(f, foe, bursted){
  if(Math.hypot(f.x-foe.x,f.y-foe.y) < f.radius+foe.radius+14){
    damage(foe, Math.round(f.md*(bursted?1.14:1)), f, 'melee');
    spawnFx((f.x+foe.x)/2,(f.y+foe.y)/2,'#ff5a5a',0.25);
    // knockback
    const ang=Math.atan2(foe.y-f.y,foe.x-f.x);
    foe.vx+=Math.cos(ang)*6; foe.vy+=Math.sin(ang)*6;
    if(typeof playBattleSfx==='function') playBattleSfx('melee');
  } else {
    spawnFx(f.x+f.dir*26,f.y,'#ffffff',0.12);
  }
}
function special(f, foe, bursted){
  // spread of 5 special bullets
  const base=Math.atan2(foe.y-f.y, foe.x-f.x);
  const sp=420*f.terrMult.bullet*(bursted?1.1:1);
  for(let i=-2;i<=2;i++){
    const a=base+i*0.18;
    battle.bullets.push({x:f.x,y:f.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:6,dmg:Math.round((f.sd*(bursted?1.16:1))/2),owner:f.faction,life:1.6,special:true});
  }
  if(typeof playBattleSfx==='function') playBattleSfx('special');
  spawnFx(f.x,f.y,'#ff9ad0',0.3);
}
function damage(target, dmg, attacker, kind){
  if(target.invuln>0) return 0;
  const atkTerr = attacker?attacker.terrMult.atk:1;
  const defTerr = target.terrMult.def||1;
  const clsMult = attacker ? matchupMult(attacker.cls, target.cls) : 1;
  const burstAtk = attacker&&attacker.burstActive>0 ? 1.1 : 1;
  const burstDef = target.burstActive>0 ? 0.86 : 1;
  const finalDmg=Math.max(1, Math.round(dmg*atkTerr*clsMult*burstAtk*defTerr*burstDef));
  target.hp-=finalDmg;
  target.hitFlash=0.18;
  target.invuln=0.34;
  target.burst=Math.min(BURST_MAX, target.burst+finalDmg*1.6);
  battle.lastHitKind=kind||'shot';
  if(kind==='special'){ battle.hitStop=Math.max(battle.hitStop, 0.09); battle.shake=Math.max(battle.shake, 6); }
  else if(kind==='melee'){ battle.hitStop=Math.max(battle.hitStop, 0.07); battle.shake=Math.max(battle.shake, 4); }
  else { battle.hitStop=Math.max(battle.hitStop, 0.04); battle.shake=Math.max(battle.shake, 2); }
  return finalDmg;
}
function spawnFx(x,y,col,life){ battle.fx.push({x,y,col,r:4,life:life||0.35}); }

function aiControl(e, p, dt){
  e.fcool-=dt*1000; e.melCool-=dt*1000; e.specCool-=dt*1000;
  e.aiTimer-=dt;
  const dist=Math.hypot(p.x-e.x,p.y-e.y);
  const ang=Math.atan2(p.y-e.y,p.x-e.x);
  e.dir = (p.x<e.x)?-1:1;
  // movement: keep medium range, strafe
  let mvx=0,mvy=0;
  if(dist>220){ mvx=Math.cos(ang); mvy=Math.sin(ang); }
  else if(dist<120){ mvx=-Math.cos(ang); mvy=-Math.sin(ang); }
  else { mvy=Math.sin(ang+Math.PI/2)*(Math.sin(performance.now()/500)); mvx=Math.cos(ang)*0.2; }
  const accel=((battle.terr==='space')?14:50)*e.terrMult.accel*(e.burstActive>0?1.14:1);
  e.vx+=mvx*accel*dt*e.spd; e.vy+=mvy*accel*dt*e.spd;
  const fric=((battle.terr==='space')?0.6:9)*e.terrMult.fric;
  e.vx-=e.vx*Math.min(1,fric*dt); e.vy-=e.vy*Math.min(1,fric*dt);
  const maxv=e.spd*1.5; const sv=Math.hypot(e.vx,e.vy);
  if(sv>maxv){e.vx*=maxv/sv;e.vy*=maxv/sv;}
  e.x+=e.vx; e.y+=e.vy; clampArena(e);
  e.dy = Math.sign(p.y-e.y);
  if(e.burst>=BURST_MAX && e.burstActive<=0 && (e.hp/e.maxhp)<0.45 && Math.random()<0.4){ tryActivateBurst(e); }
  // shoot if roughly aligned
  if(e.fcool<=0 && dist<420){
    if(Math.random()<0.9){ fire(e, e.dir, (p.y-e.y)/Math.max(40,dist), e.burstActive>0); e.fcool=e.fcd*(0.9+Math.random()*0.5); }
  }
  // melee when close
  if(e.melCool<=0 && dist< e.radius+p.radius+16){ melee(e,p,e.burstActive>0); e.melCool=ENEMY_MELEE_COOLDOWN; }
  // special occasionally
  if(e.specCool<=0 && e.sc>0 && e.sd>0 && dist<300 && Math.random()<0.5){ special(e,p,e.burstActive>0); e.sc--; e.specCool=ENEMY_SPECIAL_COOLDOWN; }
}

function endBattle(winnerFighter, winSide){
  if(battle.over) return;
  battle.over=true;
  const b=battle;
  const loserUnit = winSide==='blue'? b.enemy.src : b.player.src;
  const winnerUnit= winSide==='blue'? b.player.src : b.enemy.src;
  // carry remaining hp back (min 8)
  winnerUnit.hp=Math.max(8, Math.round(winnerFighter.hp));
  b.result={winSide, winnerUnit, loserUnit, endAt:null,
            winnerName:UNITS[winnerUnit.type].nm, loserName:UNITS[loserUnit.type].nm,
            timeLeft:Math.max(0,b.time), terrain:b.terr,
            winnerHp:Math.max(0,Math.round(winnerFighter.hp)),
            winnerBurstUsed:winnerFighter.burstUsed,
            finisher:b.lastHitKind||'shot'};
}

function finishBattle(){
  const b=battle, res=b.result;
  // remove loser
  units=units.filter(u=>u.id!==res.loserUnit.id);
  // winner moves into the tile if it was the attacker and defender died
  const atk=b.attacker, def=b.defender;
  if(res.winSide!=null){
    if(res.winnerUnit.id===atk.id && res.loserUnit.id===def.id){
      // attacker advances onto defender tile if empty now
      if(!unitAt(def.r,def.c)){ atk.r=def.r; atk.c=def.c; tryCapture(atk); }
    }
  }
  atk.moved=true; atk.acted=true;
  // capital captured check via tryCapture already handles end
  for(const k of Object.keys(keys)) keys[k]=false;
  battle=null; phase='map';
  selected=null; reachable=[]; attackTargets=[];
  updateHUD();
  // if a capital was taken endGame already scheduled
  if(phase==='map') { checkAnnihilation(); draw();
    setMsg(res.winSide==='blue'?`${res.winnerName} 勝利！ ${res.loserName}撃破`:`${res.loserName}撃墜… ${res.winnerName}に敗北`);
  }
}

function checkAnnihilation(){
  const blue=units.some(u=>u.owner==='blue');
  const red=units.some(u=>u.owner==='red');
  const blueCap=capitalOf('blue'), redCap=capitalOf('red');
  if(!red || !redCap){ endGame('blue'); }
  else if(!blue || !blueCap){ endGame('red'); }
}
