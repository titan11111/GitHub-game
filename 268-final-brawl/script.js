// FINAL BRAWL 3D（仮）
// ポーズ表・攻撃タイムライン・体力・射程・敵名は元データのまま。
import * as THREE from 'three';
const D = Math.PI/180, HY = 0.97, Z = [0,0,0];

// ---------- シーン ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b1228);
scene.fog = new THREE.Fog(0x1b1228, 14, 42);
const camera = new THREE.PerspectiveCamera(38, innerWidth/innerHeight, 0.1, 120);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('view').appendChild(renderer.domElement);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

scene.add(new THREE.HemisphereLight(0x9090ff, 0x402020, 0.7));
const sun = new THREE.DirectionalLight(0xffe6cc, 1.3);
sun.castShadow = true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-12,right:12,top:10,bottom:-10,near:1,far:40});
scene.add(sun, sun.target);

// 道路・歩道・ビル
const std = (c,r=.85)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
const road = new THREE.Mesh(new THREE.PlaneGeometry(500,10), std(0x2e2e34));
road.rotation.x=-Math.PI/2; road.position.set(200,0,0); road.receiveShadow=true; scene.add(road);
const walkway = new THREE.Mesh(new THREE.PlaneGeometry(500,5), std(0x55545e));
walkway.rotation.x=-Math.PI/2; walkway.position.set(200,0.01,-7); walkway.receiveShadow=true; scene.add(walkway);
const curb = new THREE.Mesh(new THREE.BoxGeometry(500,0.15,0.3), std(0x777777)); curb.position.set(200,0.075,-4.6); scene.add(curb);
for(let i=0;i<120;i++){const d=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.01,0.1),std(0xb0a060));d.position.set(-20+i*4,0.005,0.2);scene.add(d);}

const cv=document.createElement('canvas');cv.width=128;cv.height=256;const g2=cv.getContext('2d');
g2.fillStyle='#222';g2.fillRect(0,0,128,256);
for(let y=8;y<256;y+=24)for(let x=8;x<128;x+=20){g2.fillStyle=Math.random()<.35?'#ffd27a':'#15151c';g2.fillRect(x,y,12,14);}
const winTex=new THREE.CanvasTexture(cv);
let bx=-25;
while(bx<320){
  const w=3+Math.random()*5,h=6+Math.random()*12;
  const m=new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.02+Math.random()*.1,.2,.18+Math.random()*.12),map:winTex,emissiveMap:winTex,emissive:0xffffff,emissiveIntensity:.5});
  const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,5),m);b.position.set(bx+w/2,h/2,-12);b.receiveShadow=true;scene.add(b);
  bx+=w+0.3;
}
for(let x=-10;x<320;x+=12){
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,4.2),std(0x333333));pole.position.set(x,2.1,-5);pole.castShadow=true;scene.add(pole);
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,.25),new THREE.MeshBasicMaterial({color:0xfff0b0}));lamp.position.set(x,4.2,-4.8);scene.add(lamp);
}

// ---------- ポーズ定義（角度は度） ----------
// 規約: 脚/腕 x負=前へ振る, 膝 x正=曲げ, 肘 x負=曲げ, 足首 x正=つま先下げ, 体幹 x正=前傾
const J=['hips','spine','chest','neck','lSh','lEl','rSh','rEl','lHip','lKnee','lAnk','rHip','rKnee','rAnk'];
const P=(b,o)=>Object.assign({},b,o);
const GUARD={hy:-0.04,hz:0,hips:[0,-25,0],spine:[4,0,0],chest:[6,-10,0],neck:[-8,35,0],
  lSh:[-55,0,18],lEl:[-100,0,0],rSh:[-35,0,-22],rEl:[-128,0,0],
  lHip:[-18,0,5],lKnee:[20,0,0],lAnk:[-2,0,0],rHip:[12,0,-5],rKnee:[16,0,0],rAnk:[-28,0,0]};
const JAB_A=P(GUARD,{hy:-0.05,chest:[6,-5,0],lEl:[-112,0,0]});
const JAB_S=P(GUARD,{hy:-0.06,hz:0.06,hips:[0,-30,0],chest:[8,-22,0],neck:[-6,52,0],lSh:[-86,0,42],lEl:[-6,0,0],lKnee:[24,0,0],rAnk:[-22,0,0]});
const CROSS_S=P(GUARD,{hy:-0.05,hz:0.12,hips:[0,18,0],spine:[6,5,0],chest:[10,20,0],neck:[-8,-38,0],
  lSh:[-40,0,10],lEl:[-135,0,0],rSh:[-86,0,-38],rEl:[-6,0,0],
  lHip:[-24,0,5],lKnee:[22,0,0],lAnk:[2,0,0],rHip:[18,0,-5],rKnee:[20,0,0],rAnk:[-12,0,0]});
const UPPER_A=P(GUARD,{hy:-0.16,hz:0.02,hips:[8,-35,0],spine:[10,0,0],chest:[14,-22,0],neck:[-20,55,0],
  rSh:[-15,0,-20],rEl:[-95,0,0],lSh:[-60,0,20],lEl:[-110,0,0],
  lHip:[-40,0,5],lKnee:[50,0,0],lAnk:[-10,0,0],rHip:[5,0,-5],rKnee:[48,0,0],rAnk:[-50,0,0]});
const UPPER_S=P(GUARD,{hy:0,hz:0.1,hips:[-4,25,0],spine:[-6,5,0],chest:[-12,22,0],neck:[10,-40,0],
  rSh:[-165,0,-12],rEl:[-40,0,0],lSh:[-35,0,15],lEl:[-130,0,0],
  lHip:[-12,0,5],lKnee:[8,0,0],lAnk:[4,0,0],rHip:[10,0,-5],rKnee:[6,0,0],rAnk:[0,0,0]});
const KICK_A=P(GUARD,{hy:-0.02,hips:[0,-5,0],spine:[-4,0,0],chest:[-6,-5,0],neck:[4,10,0],
  rHip:[-85,0,-3],rKnee:[110,0,0],rAnk:[25,0,0],lHip:[-5,0,4],lKnee:[14,0,0],lAnk:[-9,0,0]});
const KICK_S=P(KICK_A,{hz:-0.06,spine:[-8,0,0],chest:[-16,-5,0],neck:[18,10,0],
  rHip:[-92,0,-3],rKnee:[4,0,0],rAnk:[-15,0,0],lKnee:[18,0,0],lAnk:[-13,0,0],lSh:[-40,0,30],lEl:[-90,0,0]});
const WIND=P(GUARD,{hy:-0.06,hips:[0,-40,0],chest:[4,-30,0],neck:[-6,60,0],rSh:[-20,0,-45],rEl:[-110,0,0],rHip:[16,0,-5],rKnee:[22,0,0],rAnk:[-38,0,0]});
const HIT=P(GUARD,{hz:-0.06,hips:[-5,-10,0],spine:[-10,0,0],chest:[-18,8,0],neck:[-28,20,0],
  lSh:[-25,0,35],lEl:[-50,0,0],rSh:[-10,0,-40],rEl:[-40,0,0],lHip:[-6,0,5],lKnee:[18,0,0],rHip:[22,0,-5],rKnee:[26,0,0],rAnk:[-45,0,0]});
const DOWN={hy:-0.84,hz:0,hips:[-88,0,0],spine:[-4,0,0],chest:[-3,0,0],neck:[10,30,0],
  lSh:[-15,0,75],lEl:[-20,0,0],rSh:[-5,0,-80],rEl:[-35,0,0],lHip:[-8,0,10],lKnee:[18,0,0],lAnk:[20,0,0],rHip:[-12,0,-12],rKnee:[30,0,0],rAnk:[15,0,0]};
const KNEEL={hy:-0.42,hz:0.05,hips:[15,-10,0],spine:[12,0,0],chest:[10,-5,0],neck:[-25,10,0],
  lSh:[-30,0,20],lEl:[-60,0,0],rSh:[10,0,-25],rEl:[-20,0,0],lHip:[-95,0,6],lKnee:[95,0,0],lAnk:[-15,0,0],rHip:[5,0,-6],rKnee:[115,0,0],rAnk:[30,0,0]};
const JUMP=P(GUARD,{hy:0.05,hips:[-10,-15,0],lHip:[-70,0,5],lKnee:[100,0,0],lAnk:[10,0,0],rHip:[-35,0,-5],rKnee:[110,0,0],rAnk:[20,0,0]});
const JKICK=P(GUARD,{hy:0.05,hips:[0,-5,0],spine:[-8,0,0],chest:[-20,-5,0],neck:[25,10,0],lHip:[-40,0,5],lKnee:[110,0,0],rHip:[-88,0,-3],rKnee:[0,0,0],rAnk:[-10,0,0],lSh:[-30,0,40],lEl:[-80,0,0]});
// 空中パンチ: 体を前へ倒し、後ろ手を突き出して落下しながら当てる
const JPUNCH=P(JUMP,{hy:0.03,hz:0.08,hips:[10,14,0],spine:[12,4,0],chest:[18,16,0],neck:[-16,-34,0],
  rSh:[-98,0,-32],rEl:[-8,0,0],lSh:[-28,0,26],lEl:[-118,0,0],
  lHip:[-26,0,5],lKnee:[92,0,0],lAnk:[8,0,0],rHip:[6,0,-5],rKnee:[104,0,0],rAnk:[22,0,0]});

// 攻撃タイムライン: 予備動作 → インパクト → 残心 → 戻り
const ATK={
  jab:  {keys:[[0,GUARD],[.05,JAB_A],[.11,JAB_S],[.16,JAB_S],[.30,GUARD]],dur:.30,hit:.11,dmg:5,reach:1.1,next:'cross',y:1.45},
  cross:{keys:[[0,JAB_S],[.08,CROSS_S],[.14,CROSS_S],[.34,GUARD]],dur:.34,hit:.09,dmg:7,reach:1.15,next:'upper',y:1.45},
  upper:{keys:[[0,CROSS_S],[.12,UPPER_A],[.2,UPPER_S],[.3,UPPER_S],[.5,GUARD]],dur:.5,hit:.2,dmg:12,reach:1.0,kd:true,y:1.6},
  kick: {keys:[[0,GUARD],[.12,KICK_A],[.2,KICK_S],[.3,KICK_S],[.42,KICK_A],[.55,GUARD]],dur:.55,hit:.2,dmg:10,reach:1.3,kd:true,y:1.0},
  hay:  {keys:[[0,GUARD],[.28,WIND],[.38,CROSS_S],[.46,CROSS_S],[.7,GUARD]],dur:.7,hit:.38,dmg:8,reach:1.15,y:1.45},
  jkick:{dmg:10,reach:1.3,kd:true,y:1.3},
  jpunch:{dmg:7,reach:1.15,y:1.5}
};

function lerpPose(a,b,u){
  const o={hy:(a.hy||0)+((b.hy||0)-(a.hy||0))*u, hz:(a.hz||0)+((b.hz||0)-(a.hz||0))*u};
  for(const k of J){const x=a[k]||Z,y=b[k]||Z;o[k]=[x[0]+(y[0]-x[0])*u,x[1]+(y[1]-x[1])*u,x[2]+(y[2]-x[2])*u];}
  return o;
}
function sample(keys,t){
  for(let i=0;i<keys.length-1;i++){const[t0,p0]=keys[i],[t1,p1]=keys[i+1];
    if(t<=t1){let u=(t-t0)/(t1-t0);u=u*u*(3-2*u);return lerpPose(p0,p1,u);}}
  return keys[keys.length-1][1];
}
// 歩行サイクル: 骨盤上下動(2倍周期)・骨盤と胸の逆回転・遊脚期の膝屈曲・蹴り出し
function walkPose(p){
  const s=Math.sin(p);
  const leg=ph=>{const sn=Math.sin(ph),cs=Math.cos(ph);
    const hx=-20*sn-6;
    const kn=8+52*Math.pow(Math.max(0,Math.cos(ph-0.35)),2);
    const an=-(hx+kn)*0.8+14*Math.max(0,-sn)*Math.max(0,cs);
    return [hx,kn,an];};
  const L=leg(p),R=leg(p+Math.PI);
  return P(GUARD,{hy:-0.05+0.02*Math.cos(2*p),hips:[0,-15-6*s,0],chest:[6,-8+8*s,0],neck:[-8,23-2*s,0],
    lSh:[-55+8*s,0,18],rSh:[-35-8*s,0,-22],
    lHip:[L[0],0,4],lKnee:[L[1],0,0],lAnk:[L[2],0,0],rHip:[R[0],0,-4],rKnee:[R[1],0,0],rAnk:[R[2],0,0]});
}

// ---------- エフェクト ----------
let hitstop=0,shake=0,score=0,lastEnemy=null;
let best=0,started=false,paused=false,autoHold=false,muted=false;
try{
  const n=parseInt(localStorage.getItem('tg.268.best')||'0',10);
  if(n>0) best=n;
  muted=localStorage.getItem('tg.268.mute')==='1';
}catch(e){}
const sparks=[];
function spark(x,y,z){
  sfx('hit');
  const m=new THREE.Mesh(new THREE.IcosahedronGeometry(0.12,0),new THREE.MeshBasicMaterial({color:0xfff2a0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  m.position.set(x,y,z);scene.add(m);sparks.push({m,t:0});
}
function updateSparks(dt){
  for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.t+=dt;const k=s.t/0.18;
    s.m.scale.setScalar(1+k*4);s.m.material.opacity=1-k;s.m.rotation.z+=dt*10;
    if(k>=1){scene.remove(s.m);sparks.splice(i,1);}}
}

// ---------- 障害物（ステージごとに置く。殴れば壊れ、低いものは跳び越せる） ----------
// h=高さ(跳び越し判定) hw/hd=半分の幅・奥行き hp=殴って壊れるまで tough=押し倒すのに必要な接触秒
const OB={
  drum: {h:.95,hw:.34,hd:.34,hp:18,tough:1.6},
  crate:{h:.72,hw:.36,hd:.36,hp:12,tough:1.3},
  vend: {h:1.8,hw:.46,hd:.30,hp:46,tough:4.2},
  fence:{h:.80,hw:.70,hd:.14,hp:10,tough:1.1},
  cone: {h:.50,hw:.20,hd:.20,hp:5, tough:.4},
  bags: {h:.60,hw:.42,hd:.34,hp:9, tough:1.0},
  hydra:{h:.70,hw:.18,hd:.18,hp:30,tough:5.5},
  tire: {h:.36,hw:.36,hd:.36,hp:8, tough:1.0}
};
// ステージごとに置くものを替える（同じ絵が続くと単調になる）
const STAGE_OB=[['drum','crate','bags'],['vend','crate','hydra'],['fence','cone','drum'],['tire','bags','fence','crate']];
const obstacles=[];
function buildOb(kind){
  const g=new THREE.Group();
  const add=(m,x,y,z)=>{m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;};
  if(kind==='drum'){
    add(new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.95,14),std(0x9a4a2a,.7)),0,.475,0);
    for(const y of [.28,.66])add(new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.06,14),std(0x5a2a18,.6)),0,y,0);
  }else if(kind==='crate'){
    add(new THREE.Mesh(new THREE.BoxGeometry(.72,.72,.72),std(0x8a6134,.85)),0,.36,0);
    add(new THREE.Mesh(new THREE.BoxGeometry(.76,.08,.76),std(0x5c3f20,.85)),0,.36,0);
  }else if(kind==='vend'){
    add(new THREE.Mesh(new THREE.BoxGeometry(.92,1.8,.6),std(0x203a8a,.6)),0,.9,0);
    add(new THREE.Mesh(new THREE.BoxGeometry(.66,1.06,.04),new THREE.MeshBasicMaterial({color:0xffe6a0})),0,1.1,.31);
  }else if(kind==='fence'){
    add(new THREE.Mesh(new THREE.BoxGeometry(1.4,.18,.12),std(0xd86a10,.8)),0,.74,0);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.4,.18,.12),std(0xe8e8e8,.8)),0,.46,0);
    for(const s of [-1,1])add(new THREE.Mesh(new THREE.BoxGeometry(.1,.82,.1),std(0x555555,.8)),s*.62,.41,0);
  }else if(kind==='cone'){
    add(new THREE.Mesh(new THREE.ConeGeometry(.2,.5,12),std(0xe05a10,.8)),0,.25,0);
    add(new THREE.Mesh(new THREE.BoxGeometry(.4,.04,.4),std(0x2a2a2a,.8)),0,.02,0);
  }else if(kind==='bags'){
    for(const q of [[-.2,.2,0],[.18,.24,.08],[0,.42,-.06]]){
      const m=add(new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),std(0x24242c,.9)),q[0],q[1],q[2]);
      m.scale.set(1,.85,.95);
    }
  }else if(kind==='hydra'){
    add(new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,.6,12),std(0xb02020,.7)),0,.3,0);
    add(new THREE.Mesh(new THREE.SphereGeometry(.14,12,8),std(0xb02020,.7)),0,.62,0);
    for(const s of [-1,1])add(new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.18,8).rotateZ(Math.PI/2),std(0x901818,.7)),s*.16,.4,0);
  }else{
    const t=add(new THREE.Mesh(new THREE.TorusGeometry(.26,.1,8,14),std(0x1c1c20,.9)),0,.12,0);
    t.rotation.x=Math.PI/2;
  }
  return g;
}
function addObstacle(kind,x,z){
  const d=OB[kind];if(!d)return;
  const g=buildOb(kind);g.position.set(x,0,z);g.rotation.y=Math.random()*Math.PI*2;scene.add(g);
  obstacles.push({g,kind,x,z,hp:d.hp,h:d.h,hw:d.hw,hd:d.hd,tough:d.tough,push:0,dead:false});
}
function spawnObstacles(){
  const set=STAGE_OB[(stage-1)%STAGE_OB.length];
  const n=5+Math.min(3,stage);
  for(let i=0;i<n;i++){
    // 画面に映るのは前後およそ1.8mまで。遠くに置くと一度も出会わないので、戦う場所の左右1.6〜4.8mに散らす
    const x=player.x+(Math.random()<.5?-1:1)*(1.6+Math.random()*3.2), z=-2.7+Math.random()*5.4;
    // 通り道を塞ぎ切らないよう、既にある物の1.3m以内には置かない
    if(obstacles.some(o=>!o.dead&&Math.abs(o.x-x)<1.3&&Math.abs(o.z-z)<1.3))continue;
    addObstacle(pick(set),x,z);
  }
}
function breakOb(o,byPlayer){
  if(o.dead)return;
  o.dead=true;scene.remove(o.g);
  for(let i=0;i<3;i++)spark(o.x+(Math.random()-.5)*.5,o.h*(.3+Math.random()*.6),o.z+(Math.random()-.5)*.4);
  shake=Math.max(shake,.16);
  if(byPlayer)score+=50;
}
// 押し戻し。接触が続いた分を貯めて押し倒せるようにする（詰まって止まる敵を作らない）
function blockByObstacles(f,dt){
  if(['down','dead','air','rise'].includes(f.state))return;
  const r=.26*f.rs;
  for(const o of obstacles){
    if(o.dead)continue;
    if(f.y>o.h*.72)continue;                       // 跳び越し中はすり抜ける
    const dx=f.x-o.x, dz=f.z-o.z;
    const ox=o.hw+r-Math.abs(dx), oz=o.hd+r-Math.abs(dz);
    if(ox<=0||oz<=0)continue;
    o.push+=dt*f.mass*(f.boss?2.2:1);
    if(o.push>=o.tough){breakOb(o,f.player);continue;}
    if(ox<oz)f.x+=dx>=0?ox:-ox;
    else{f.z=Math.max(-3.2,Math.min(3.2,f.z+(dz>=0?oz:-oz)));}
  }
}
function cullObstacles(dt){
  // その場で戦い続けると溜まり続けるので、古いものから26個に抑える
  while(obstacles.length>26){const o=obstacles.shift();if(!o.dead)scene.remove(o.g);}
  for(let i=obstacles.length-1;i>=0;i--){
    const o=obstacles[i];
    o.push=Math.max(0,o.push-dt*.6);               // 触れていない間は戻す（通りすがりで壊れないように）
    if(o.dead||o.x<camX-18){if(!o.dead)scene.remove(o.g);obstacles.splice(i,1);}
  }
}

// ---------- キャラクター（関節階層リグ） ----------
class Fighter{
  constructor(o){
    this.root=new THREE.Group();scene.add(this.root);this.root.scale.setScalar(o.scale||1);
    const skin=std(o.skin,.6),top=std(o.top),bot=std(o.bot),shoe=std(0x1a1a1a,.5),hair=std(o.hair,.9);
    const j=this.j={}, b=o.bulk||1;
    // 筋肉量: 指定倍率を「断面積の倍率」と読み、半径は√倍にする（半径を素直に倍にすると胴長が負になりカプセルが球へ崩れる）
    const mu=Math.sqrt(o.muscle||1), bw=b*mu;
    const G=(p,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
    const seg=(p,len,r,mat)=>{const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.01,len-2*r),4,10),mat);m.position.y=-len/2;m.castShadow=true;p.add(m);};
    const box=(p,w,h,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;p.add(m);};
    j.hips=G(this.root,0,HY,0); box(j.hips,.32,.18,.2,bot,0,0,0);
    j.spine=G(j.hips,0,.08,0); box(j.spine,.3*bw,.25,.19*mu,top,0,.14,0);
    j.chest=G(j.spine,0,.26,0); box(j.chest,.42*bw,.28,.24*bw,top,0,.12,0);
    j.neck=G(j.chest,0,.28,0); box(j.neck,.09,.08,.09,skin,0,.03,0);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),skin);head.scale.set(.9,1.1,1);head.position.y=.15;head.castShadow=true;j.neck.add(head);
    const hr=new THREE.Mesh(new THREE.SphereGeometry(.125,16,8,0,Math.PI*2,0,Math.PI/2),hair);hr.position.set(0,.19,-.015);j.neck.add(hr);
    for(const s of [1,-1]){const k=s>0?'l':'r';
      j[k+'Sh']=G(j.chest,s*.25*bw,.22,0); seg(j[k+'Sh'],.3,.06*bw,skin);
      j[k+'El']=G(j[k+'Sh'],0,-.3,0); seg(j[k+'El'],.26,.05*mu,skin); box(j[k+'El'],.08*mu,.09*mu,.09*mu,skin,0,-.29,0);
      j[k+'Hip']=G(j.hips,s*.1*b,-.04,0); seg(j[k+'Hip'],.44,.075*bw,bot);
      j[k+'Knee']=G(j[k+'Hip'],0,-.44,0); seg(j[k+'Knee'],.42,.06*mu,bot);
      j[k+'Ank']=G(j[k+'Knee'],0,-.42,0); box(j[k+'Ank'],.1*mu,.07,.24,shoe,0,-.035,.05);
    }
    // 筋肉の塊（大胸筋・僧帽筋・上腕・大腿）。倍率1では作らない
    if(mu>1.05){
      const bulge=(p,rx,ry,rz,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),mat);m.scale.set(rx,ry,rz);m.position.set(x,y,z);m.castShadow=true;p.add(m);};
      bulge(j.chest,.21*bw,.075*mu,.1*bw,top,0,.255,-.01);
      for(const s of [1,-1]){const k=s>0?'l':'r';
        // 大胸筋。丸い球を前へ大きく出すと胸に見えるので、全体を約80%に縮めつつ縦(.1→.066)と前後(.09→.056)を強く潰し、
        // 横幅はほぼ残して位置を .13→.168 へ上げる＝薄く広い板にする
        bulge(j.chest,.122*bw,.066*mu,.056*bw,top,s*.112*bw,.168,.088*bw);
        bulge(j[k+'Sh'],.085*mu,.075*mu,.085*mu,skin,0,-.02,0);
        bulge(j[k+'Sh'],.08*mu,.12*mu,.085*mu,skin,0,-.16,.02);
        bulge(j[k+'Hip'],.1*bw,.16*mu,.1*bw,bot,0,-.18,.01);
      }
    }
    Object.assign(this,{x:o.x,z:o.z,y:0,vx:0,vz:0,vy:0,facing:o.facing||1,hp:o.hp,maxHp:o.hp,state:'idle',t:0,phase:0,
      hy:0,hz:0,inv:0,player:!!o.player,speed:o.speed,name:o.name,clock:Math.random()*10,aiT:1+Math.random(),
      rs:o.scale||1,pow:o.pow||1,mass:o.mass||(o.boss?4:1),boss:!!o.boss,kdc:0,ja:null,jaHit:false});
    this.yaw=this.facing*Math.PI/2;
  }
  leap(it){Object.assign(this,{state:'jump',t:0,vy:5.4,vx:it.mx*this.speed*1.1,vz:it.mz*this.speed*.6,ja:null,jaHit:false});}
  startAtk(n){Object.assign(this,{state:'attack',atk:n,t:0,hitDone:false,queued:false,na:null,vx:0,vz:0});}
  // 行動できない間に押された1つを覚えておく（硬直・よろけで入力が消えないようにする）
  latch(it){
    if(this.use(it,'punch'))this.na='jab';
    else if(this.use(it,'kick'))this.na='kick';
    else if(this.use(it,'jump'))this.na='jump';
  }
  // 覚えた入力を出す。出したら true
  flush(it){
    const n=this.na;
    if(!n)return false;
    this.na=null;
    if(n==='jump')this.leap(it);else this.startAtk(n);
    return true;
  }
  // 入力の取り出し。プレイヤーは先行入力バッファ経由（take）、敵は素の真偽値
  use(it,n){ return it.take?it.take(n):!!it[n]; }
  // 目標速度へ寄せる（加減速）。斜めは長さを正規化して速くならないようにする
  drive(dt,it,gain){
    let mx=it.mx,mz=it.mz;
    if(mx&&mz){mx*=.7071;mz*=.7071;}
    const tvx=mx*this.speed*gain, tvz=mz*this.speed*.65*gain;
    const a=1-Math.exp(-((mx||mz)?24:17)*dt);
    this.vx+=(tvx-this.vx)*a; this.vz+=(tvz-this.vz)*a;
    if(!mx&&Math.abs(this.vx)<.03)this.vx=0;
    if(!mz&&Math.abs(this.vz)<.03)this.vz=0;
  }
  doHit(d,others){
    let any=false;
    const rs=this.rs;
    for(const o of others){
      if(['air','down','dead','rise'].includes(o.state)||o.inv>0)continue;
      const dx=(o.x-this.x)*this.facing;
      const reach=d.reach*rs+Math.max(0,(o.rs-1)*.3);
      if(dx>.15*rs&&dx<reach&&Math.abs(o.z-this.z)<.5*Math.max(rs,o.rs)&&Math.abs(o.y-this.y)<.9*Math.max(rs,o.rs)){
        o.takeHit(d,this.facing,this.pow);spark(o.x-this.facing*.25*rs,this.y+d.y*rs,o.z+.1);any=true;
        if(this.player)score+=(d.kd?300:100)*(o.boss?3:1);
      }
    }
    // 障害物にも当たる（壊すとスコア。ボスは一撃でなぎ倒す）
    for(const o of obstacles){
      if(o.dead)continue;
      const dx=(o.x-this.x)*this.facing;
      if(dx>.1*rs&&dx<d.reach*rs+.25&&Math.abs(o.z-this.z)<.55*rs&&this.y<o.h+.7){
        o.hp-=d.dmg*(this.pow||1);spark(o.x,Math.min(o.h,d.y*rs),o.z);any=true;
        if(o.hp<=0)breakOb(o,this.player);
      }
    }
    if(any){const k=rs>1.4?1.6:1;hitstop=(d.kd?.12:.07)*k;shake=(d.kd?.25:.1)*k;}
    return any;
  }
  takeHit(d,dir,pow){
    this.hp=Math.max(0,this.hp-d.dmg*(pow||1));this.facing=-dir;this.t=0;this.vz=0;
    // ボスはダウン耐性つき。ダウン属性3発、または体力1/4以下でようやく倒れる
    let kd=!!d.kd;
    if(kd&&this.boss){this.kdc++;kd=this.kdc>=3||this.hp<=this.maxHp*.25;if(kd)this.kdc=0;}
    if(kd||this.hp<=0){this.state='air';this.vy=5;this.vx=dir*(this.boss?1.7:3.2);}
    else{this.state='hit';this.vx=dir*(this.boss?.55:1.5);}
    if(!this.player)lastEnemy=this;
  }
  update(dt,it,others){
    this.t+=dt;this.clock+=dt;this.inv=Math.max(0,this.inv-dt);
    const st=this.state;
    if(st==='idle'||st==='walk'){
      if(it.face)this.facing=it.face;
      if(this.na&&this.flush(it));
      else if(this.use(it,'punch'))this.startAtk(this.player?'jab':'hay');
      else if(this.use(it,'kick'))this.startAtk('kick');
      else if(this.use(it,'jump'))this.leap(it);
      else{
        this.drive(dt,it,1);
        const spd=Math.hypot(this.vx,this.vz);
        if(it.mx!==0&&!it.face)this.facing=Math.sign(it.mx);
        this.state=spd>.18?'walk':'idle';
        if(this.state==='walk')this.phase+=dt*(4.2+6.2*Math.min(1,spd/this.speed))*((this.vx*this.facing<-.02)?-1:1);
      }
    }else if(st==='attack'){
      const d=ATK[this.atk];
      // パンチはコンボ予約、それ以外は先行入力として1つ保持する
      const tap=this.use(it,'punch'), hold=this.player&&it.holdPunch&&this.t>d.hit*.5;
      if(tap||hold){ if(d.next)this.queued=true; else if(this.player)this.na='jab'; }
      if(this.player){
        if(this.use(it,'kick'))this.na='kick';
        else if(this.use(it,'jump'))this.na='jump';
      }
      if(!this.hitDone&&this.t>=d.hit){this.hitDone=true;this.doHit(d,others);}
      // 残心が終わる手前を次の行動の受付にする（硬直明けを待たずに繋がる）
      const open=this.hitDone&&this.t>=d.dur-CANCEL;
      if(open&&this.queued)this.startAtk(d.next);
      else if(open&&this.na)this.flush(it);
      else if(open&&this.player){this.drive(dt,it,.5);if(this.t>=d.dur){this.state='idle';this.t=0;}}
      else if(this.t>=d.dur){this.state='idle';this.t=0;}
    }else if(st==='hit'){
      if(this.player)this.latch(it);
      this.vx*=Math.exp(-8*dt);
      if(this.t>.32){this.state='idle';this.t=0;this.vx=0;}
    }else if(st==='air'){
      this.vy-=18*dt;this.y+=this.vy*dt;
      if(this.y<=0&&this.vy<0){this.y=0;this.state='down';this.t=0;this.vx=0;shake=Math.max(shake,.12);}
    }else if(st==='down'){
      if(this.t>.9){this.state=this.hp<=0?'dead':'rise';this.t=0;}
    }else if(st==='rise'){
      if(this.t>.55){this.state='idle';this.t=0;this.inv=.8;}
    }else if(st==='jump'){
      this.vy-=18*dt;this.y+=this.vy*dt;
      if(this.player){const a=1-Math.exp(-5*dt);
        this.vx+=(it.mx*this.speed*1.05-this.vx)*a;this.vz+=(it.mz*this.speed*.55-this.vz)*a;}
      if(!this.ja){
        // 1ジャンプにつき空中技は1回だけ。Bで飛び蹴り、Aで空中パンチ
        if(this.use(it,'kick')){this.ja='jkick';this.vx+=this.facing*1.1;if(this.vy>0)this.vy*=.55;sfx('kick');}
        else if(this.use(it,'punch')){this.ja='jpunch';this.vx+=this.facing*.7;this.vy-=1.1;sfx('punch');}
      }
      if(this.ja&&!this.jaHit)this.jaHit=this.doHit(ATK[this.ja],others);
      if(this.y<=0&&this.vy<0){this.y=0;this.state='idle';this.t=0;this.vx*=.35;this.vz=0;this.ja=null;this.jaHit=false;
        if(this.rs>1.4)shake=Math.max(shake,.18);}
    }else if(st==='dead'&&!this.player){
      this.root.visible=Math.floor(this.t*14)%2===0;
      if(this.t>1.2)this.remove=true;
    }
    this.x+=this.vx*dt;this.z=Math.max(-3.2,Math.min(3.2,this.z+this.vz*dt));
    blockByObstacles(this,dt);

    let pose,rate;
    switch(this.state){
      case 'idle':{const b=Math.sin(this.clock*2.2);pose=P(GUARD,{chest:[6+2*b,-10,0],hy:-.04-.006*b});rate=10;break;}
      case 'walk':pose=walkPose(this.phase);rate=20;break;
      case 'attack':pose=sample(ATK[this.atk].keys,this.t);rate=38;break;
      case 'hit':pose=HIT;rate=30;break;
      case 'air':pose=DOWN;rate=7;break;
      case 'rise':pose=this.t<.28?KNEEL:GUARD;rate=9;break;
      case 'jump':pose=this.ja==='jkick'?JKICK:(this.ja==='jpunch'?JPUNCH:JUMP);rate=this.ja?32:12;break;
      default:pose=DOWN;rate=12;
    }
    const a=1-Math.exp(-rate*dt);
    for(const k of J){const tg=pose[k]||Z,r=this.j[k].rotation;
      r.x+=(tg[0]*D-r.x)*a;r.y+=(tg[1]*D-r.y)*a;r.z+=(tg[2]*D-r.z)*a;}
    this.hy+=((pose.hy||0)-this.hy)*a;this.hz+=((pose.hz||0)-this.hz)*a;
    this.j.hips.position.set(0,HY+this.hy,this.hz);
    const turn=this.state==='walk'?-(this.vz/this.speed)*.55*this.facing:0;
    this.yaw+=(this.facing*Math.PI/2+turn-this.yaw)*(1-Math.exp(-16*dt));
    this.root.position.set(this.x,this.y,this.z);this.root.rotation.y=this.yaw;
    if(this.player&&this.inv>0)this.root.visible=Math.floor(this.clock*20)%2===0;
    else if(this.state!=='dead')this.root.visible=true;
  }
}

// ---------- プレイヤー & 敵 ----------
const player=new Fighter({player:true,x:0,z:0,hp:100,speed:2.6,name:'RYDER',skin:0xe0b090,top:0xf2f2f2,bot:0x2a3f7a,hair:0xd8b040,bulk:1.05});
let enemies=[],wave=0;
// ステージ制: 1ステージ=4波。4波目が必ずボス（＝ステージの最後）。倒すと STAGE CLEAR で次のステージへ
const WPS=4;
let stage=1,wis=0,spawnGap=0;
const NAMES=['TONY','RICK','GUS','MAX','VINNIE','DUKE','SLY'];
const pick=a=>a[Math.floor(Math.random()*a.length)];
const BOSSNAMES=['GORO','IVAN','BRUISER','KRAKEN'];
function spawnBoss(){
  const lv=stage-1;
  enemies.push(new Fighter({x:player.x+9.5,z:0,facing:-1,hp:150+lv*45,speed:1.4,
    name:pick(BOSSNAMES),skin:0xc08058,top:0xc08058,bot:0x14141c,hair:0x0c0c0c,
    bulk:1.3,muscle:3,scale:2,pow:1.9,boss:true}));
}
function spawnWave(){
  wave++;wis++;
  spawnObstacles();
  // ステージの最後（4波目）はボス。2ステージ目以降は取り巻き1体つき
  if(wis>=WPS){
    spawnBoss();
    if(stage>1)enemies.push(new Fighter({x:player.x-7.5,z:1.6,facing:1,hp:28+wave*4,speed:1.6,
      name:pick(NAMES),skin:pick([0xe0b090,0xa87850,0x7a5030,0xf0c8a0]),top:pick([0xb03030,0x3a7a3a,0x7a3aa0,0xd08020,0x2a2a2a]),
      bot:pick([0x333333,0x4a3a2a,0x223355]),hair:pick([0x111111,0x5a3a1a,0xaa2222]),bulk:1.1,scale:1}));
    banner('STAGE '+stage+' BOSS!!','boss',1.7);
    return;
  }
  if(started)banner('STAGE '+stage+'-'+wis,'',1.1);
  const n=2+Math.min(wave,3);
  for(let i=0;i<n;i++){
    const side=i%3===2?-1:1;
    enemies.push(new Fighter({x:player.x+side*(7+Math.random()*3),z:-2.5+Math.random()*5,facing:-side,hp:28+wave*4,speed:1.5+Math.random()*.4,
      name:pick(NAMES),skin:pick([0xe0b090,0xa87850,0x7a5030,0xf0c8a0]),top:pick([0xb03030,0x3a7a3a,0x7a3aa0,0xd08020,0x2a2a2a]),
      bot:pick([0x333333,0x4a3a2a,0x223355]),hair:pick([0x111111,0x5a3a1a,0xaa2222]),bulk:1+Math.random()*.25,scale:.97+Math.random()*.1}));
  }
}
function ai(e,dt){
  const it={mx:0,mz:0,punch:false,kick:false,jump:false,face:0};
  const p=player,dx=p.x-e.x,dz=p.z-e.z;it.face=dx>=0?1:-1;
  if(p.state==='dead')return it;
  e.aiT-=dt;
  // 詰め寄る距離。大型でも「プレイヤーのジャブが届く位置」に収める（1.1+0.3=1.4 が上限）
  const down=['air','down','rise'].includes(p.state),want=down?2.2*e.rs:.9+(e.rs-1)*.35;
  const ex=(p.x-it.face*want)-e.x;
  if(Math.abs(ex)>.2*e.rs)it.mx=Math.sign(ex);
  if(Math.abs(dz)>.18)it.mz=Math.sign(dz);
  if(!down&&Math.abs(Math.abs(dx)-want)<.34*e.rs&&Math.abs(dz)<.34*e.rs&&e.aiT<=0){
    if(e.boss&&Math.random()<.4)it.kick=true;else it.punch=true;
    it.mx=it.mz=0;e.aiT=(e.boss?1.5:1.2)+Math.random()*1.5;
  }
  return it;
}
function separate(){
  const all=[player,...enemies];
  for(let i=0;i<all.length;i++)for(let k=i+1;k<all.length;k++){
    const a=all[i],b=all[k];
    if(['dead','down'].includes(a.state)||['dead','down'].includes(b.state))continue;
    const dx=b.x-a.x,dz=b.z-a.z;
    const gap=.275*(a.rs+b.rs),zg=.35*Math.max(a.rs,b.rs);
    if(Math.abs(dx)<gap&&Math.abs(dz)<zg){
      const push=(gap-Math.abs(dx))*.5*(dx>=0?1:-1),sum=a.mass+b.mass;
      a.x-=push*2*b.mass/sum;b.x+=push*2*a.mass/sum;
    }
  }
}

// ---------- 画面表示 ----------
let bannerT=0;
function banner(text,cls,sec){
  const el=document.getElementById('banner');
  if(!el)return;
  el.textContent=text;el.className='show '+(cls||'');bannerT=sec||1.2;
}

// ---------- 入力 ----------
// 先行入力バッファ: 攻撃・被弾・硬直中に押した1回を BUF 秒だけ保持して、動ける瞬間に発火させる
const keys={};
const BUF=.2, CANCEL=.13;
let now=0;
const buf={punch:-9,kick:-9,jump:-9};
function press(n){ buf[n]=now; }
function takeAct(n){ if(now-buf[n]<=BUF){ buf[n]=-9; return true; } return false; }
function clearBuf(){ buf.punch=buf.kick=buf.jump=-9; }
function releaseAll(){ for(const k in keys)keys[k]=false; clearBuf(); }
const KMAP={KeyJ:'punch',KeyX:'punch',KeyK:'kick',KeyZ:'kick',Space:'jump'};
addEventListener('keydown',e=>{
  if(e.code==='Space'||e.code.startsWith('Arrow')) e.preventDefault();
  if(e.code==='KeyP'||e.code==='Escape'){ if(started) togglePause(); e.preventDefault(); return; }
  if(!started) begin();
  if(!keys[e.code]){
    const a=KMAP[e.code];
    if(a){ press(a); sfx(a); }
  }
  keys[e.code]=true;
});
addEventListener('keyup',e=>keys[e.code]=false);
const playerIntent=()=>({
  mx:((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0),
  mz:((keys.KeyS||keys.ArrowDown)?1:0)-((keys.KeyW||keys.ArrowUp)?1:0),
  face:0, holdPunch:!!(keys.KeyJ||keys.KeyX), take:takeAct});

// ---------- ループ ----------
const clock=new THREE.Clock();let camX=0,camY=4.2,camZ=10.5,camAt=1.1;
const $=id=>document.getElementById(id);
function loop(){
  requestAnimationFrame(loop);
  const dt=Math.min(clock.getDelta(),.033);
  now+=dt;
  updateSparks(dt);
  if(bannerT>0){bannerT-=dt;if(bannerT<=0)document.getElementById('banner').className='';}
  if(!started){
    const idle={mx:0,mz:0,punch:false,kick:false,jump:false,face:0};
    player.update(dt,idle,[]);
    for(const e of enemies){
      const face=(player.x-e.x)>=0?1:-1;
      e.update(dt,{mx:0,mz:0,punch:false,kick:false,jump:false,face},[]);
    }
    clearBuf();
  }else if(paused||autoHold){
    clearBuf();
  }else if(hitstop>0){
    hitstop-=dt;
  }else{
    const it=playerIntent();
    player.update(dt,it,enemies);
    for(const e of enemies)e.update(dt,ai(e,dt),[player]);
    separate();
    cullObstacles(dt);
    enemies=enemies.filter(e=>{
      if(!e.remove)return true;
      scene.remove(e.root);if(lastEnemy===e)lastEnemy=null;score+=e.boss?2500:500;
      // ボスを倒したらステージクリア。次の波を出す前に間を置いて演出を見せる
      if(e.boss){banner('STAGE '+stage+' CLEAR','boss',1.8);stage++;wis=0;spawnGap=2.0;}
      return false;
    });
    if(enemies.length===0){ if(spawnGap>0)spawnGap-=dt; else spawnWave(); }
    if(player.state==='dead'&&player.t>1.5){player.hp=player.maxHp;player.state='rise';player.t=0;}
    player.x=Math.max(camX-6.5,player.x);
  }
  // ボス戦は画面を引いて全身が入るようにする
  const bossAlive=enemies.some(e=>e.boss&&e.state!=='dead');
  camX+=((player.x+1.2+player.vx*.28)-camX)*(1-Math.exp(-5.5*dt));
  const ez=1-Math.exp(-2.6*dt);
  camZ+=((bossAlive?13.6:10.5)-camZ)*ez;
  camY+=((bossAlive?5.1:4.2)-camY)*ez;
  camAt+=((bossAlive?1.7:1.1)-camAt)*ez;
  shake=Math.max(0,shake-dt);
  const sx=(Math.random()-.5)*shake*.6,sy=(Math.random()-.5)*shake*.6;
  camera.position.set(camX+sx,camY+sy,camZ);camera.lookAt(camX,camAt,-.5);
  sun.position.set(camX+5,10,8);sun.target.position.set(camX,0,0);
  $('php').style.width=(player.hp/player.maxHp*100)+'%';
  $('score').textContent='SCORE '+score;
  if(score>best){
    best=score;
    try{ localStorage.setItem('tg.268.best', String(best)); }catch(e){}
  }
  $('best').textContent='BEST '+best;
  $('stage').textContent=bossAlive?('STAGE '+stage+' BOSS'):('STAGE '+stage+'-'+Math.max(1,wis));
  const shown=enemies.find(e=>e.boss&&e.state!=='dead')||lastEnemy;
  if(shown){$('ebox').style.visibility='visible';$('ename').textContent=shown.name;$('ehp').style.width=(shown.hp/shown.maxHp*100)+'%';
    $('ebox').classList.toggle('is-boss',!!shown.boss);}
  else $('ebox').style.visibility='hidden';
  renderer.render(scene,camera);
}

let AC=null, bgmTimer=0;
function audioInit(){
  if(AC) return;
  try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }
  catch(e){ AC=null; }
}
function sfx(kind){
  if(!AC||muted) return;
  const t=AC.currentTime;
  const spec={punch:[210,.07],kick:[92,.11],jump:[320,.08],hit:[480,.06]}[kind]||[180,.07];
  const o=AC.createOscillator(), g=AC.createGain();
  o.type=kind==='hit'?'square':'triangle';
  o.frequency.setValueAtTime(spec[0], t);
  o.frequency.exponentialRampToValueAtTime(Math.max(40, spec[0]*0.45), t+spec[1]);
  g.gain.setValueAtTime(kind==='hit'?0.08:0.07, t);
  g.gain.exponentialRampToValueAtTime(0.001, t+spec[1]);
  o.connect(g); g.connect(AC.destination);
  o.start(t); o.stop(t+spec[1]+0.02);
}
function bgmStart(){
  if(!AC||bgmTimer) return;
  bgmTimer=setInterval(()=>{
    if(!AC||muted||!started||paused||autoHold) return;
    const t=AC.currentTime;
    const o=AC.createOscillator(), g=AC.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(78, t);
    o.frequency.exponentialRampToValueAtTime(42, t+0.16);
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.001, t+0.18);
    o.connect(g); g.connect(AC.destination);
    o.start(t); o.stop(t+0.2);
  }, 520);
}
function unlock(){
  audioInit();
  if(AC && AC.state==='suspended') AC.resume();
  bgmStart();
}
function begin(){
  if(!started){
    started=true;
    const panel=document.getElementById('start');
    const pauseBtn=document.getElementById('btn-pause');
    if(panel) panel.hidden=true;
    if(pauseBtn) pauseBtn.classList.remove('dim');
    banner('WAVE '+wave,'',1.1);
  }
  unlock();
}
function syncMute(){
  const b=document.getElementById('btn-mute'), g=document.getElementById('mute-glyph');
  if(!b) return;
  if(g) g.textContent=muted?'🔇':'🔊';
  b.setAttribute('aria-pressed', muted?'true':'false');
  b.setAttribute('aria-label', muted?'音を出す':'音を消す');
}
function toggleMute(){
  muted=!muted;
  try{ localStorage.setItem('tg.268.mute', muted?'1':'0'); }catch(e){}
  syncMute();
  if(!muted) unlock();
}
function togglePause(){
  if(!started) return;
  paused=!paused;
  const ov=document.getElementById('paused');
  const b=document.getElementById('btn-pause');
  if(ov) ov.hidden=!paused;
  if(b){
    const g=document.getElementById('pause-glyph');
    if(g) g.textContent=paused?'▶':'⏸';
    b.setAttribute('aria-pressed', paused?'true':'false');
    b.setAttribute('aria-label', paused?'再開':'一時停止');
  }
  if(paused) releaseAll();
}
function buzz(){ if(navigator.vibrate) navigator.vibrate(14); }
function bindEdge(id, code, act){
  const el=document.getElementById(id);
  if(!el) return;
  let pid=null;
  el.addEventListener('pointerdown', e=>{
    e.preventDefault();
    pid=e.pointerId;
    try{ el.setPointerCapture(e.pointerId); }catch(err){}
    el.classList.add('is-pressed');
    begin();
    press(act);
    keys[code]=true;
    sfx(act);
    buzz();
  });
  const release=e=>{
    if(e && pid!==null && e.pointerId!==pid) return;
    pid=null; keys[code]=false; el.classList.remove('is-pressed');
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('lostpointercapture', release);
}
function bindPad(el){
  // 8方向。真横・真上下のセクタを広く(56°)、斜めを狭く(34°)取り、境界では9°のヒステリシスで貼り付かせる
  const CEN=[0,45,90,135,180,225,270,315];
  const W=[56,34,56,34,56,34,56,34];
  const SET=[{KeyD:1},{KeyD:1,KeyS:1},{KeyS:1},{KeyA:1,KeyS:1},{KeyA:1},{KeyA:1,KeyW:1},{KeyW:1},{KeyD:1,KeyW:1}];
  const held={KeyA:false,KeyD:false,KeyW:false,KeyS:false};
  let pid=null, si=-1;
  const apply=next=>{
    for(const k of Object.keys(held)){
      if(held[k]&&!next[k]) keys[k]=false;
      if(next[k]) keys[k]=true;
      held[k]=!!next[k];
    }
    el.classList.toggle('press-l', !!next.KeyA);
    el.classList.toggle('press-r', !!next.KeyD);
    el.classList.toggle('press-u', !!next.KeyW);
    el.classList.toggle('press-d', !!next.KeyS);
  };
  const clear=()=>{ pid=null; si=-1; apply({}); };
  const gap=(a,b)=>Math.abs(((a-b)%360+540)%360-180);
  const dir=e=>{
    const r=el.getBoundingClientRect();
    const x=e.clientX-(r.left+r.width/2);
    const y=e.clientY-(r.top+r.height/2);
    // 中心付近は「直前の方向を保つ」。指が中央を横切っただけで入力が切れるのを防ぐ
    if(Math.hypot(x,y)<r.width*0.13){ if(si<0) apply({}); return; }
    const a=Math.atan2(y,x)*180/Math.PI;
    let bi=0,bd=1e9;
    for(let i=0;i<8;i++){ const d=gap(a,CEN[i])-W[i]/2; if(d<bd){ bd=d; bi=i; } }
    if(si>=0&&si!==bi&&gap(a,CEN[si])<=W[si]/2+9) bi=si;
    if(bi!==si){ si=bi; apply(SET[bi]); }
  };
  el.addEventListener('pointerdown', e=>{
    e.preventDefault();
    pid=e.pointerId;
    try{ el.setPointerCapture(e.pointerId); }catch(err){}
    begin();
    dir(e);
    buzz();
  });
  el.addEventListener('pointermove', e=>{ if(e.pointerId===pid) dir(e); });
  el.addEventListener('pointerup', e=>{ if(e.pointerId===pid) clear(); });
  el.addEventListener('pointercancel', e=>{ if(e.pointerId===pid) clear(); });
  el.addEventListener('lostpointercapture', e=>{ if(e.pointerId===pid) clear(); });
}
function bindControls(){
  bindPad(document.getElementById('dpad'));
  bindEdge('btn-punch','KeyJ','punch');
  bindEdge('btn-kick','KeyK','kick');
  bindEdge('btn-jump','Space','jump');
  const plate=document.querySelector('.pad-body');
  if(plate) plate.addEventListener('pointerdown', e=>e.preventDefault());
  const mute=document.getElementById('btn-mute');
  const pause=document.getElementById('btn-pause');
  const resume=document.getElementById('btn-resume');
  const start=document.getElementById('start-btn');
  const arm=el=>{
    if(!el) return;
    el.addEventListener('pointerdown', e=>{
      e.preventDefault();
      try{ el.setPointerCapture(e.pointerId); }catch(err){}
    });
  };
  arm(mute); arm(pause); arm(resume); arm(start);
  if(mute) mute.addEventListener('pointerdown', ()=>{ toggleMute(); buzz(); });
  if(pause) pause.addEventListener('pointerdown', ()=>{ togglePause(); buzz(); });
  if(resume) resume.addEventListener('pointerdown', ()=>{ togglePause(); buzz(); });
  if(start) start.addEventListener('pointerdown', ()=>{ begin(); buzz(); });
  syncMute();
  $('best').textContent='BEST '+best;
}
let lastTouchEnd=0;
addEventListener('touchend', e=>{
  const now=Date.now();
  if(now-lastTouchEnd<=300) e.preventDefault();
  lastTouchEnd=now;
}, {passive:false});
addEventListener('touchmove', e=>e.preventDefault(), {passive:false});
addEventListener('dblclick', e=>e.preventDefault());
addEventListener('contextmenu', e=>e.preventDefault());
addEventListener('selectstart', e=>e.preventDefault());
addEventListener('dragstart', e=>e.preventDefault());
addEventListener('blur', releaseAll);
addEventListener('visibilitychange', ()=>{
  autoHold=document.hidden;
  if(document.hidden) releaseAll();
  if(!AC) return;
  if(document.hidden){ if(AC.state==='running') AC.suspend(); }
  else if(started && !muted && AC.state==='suspended') AC.resume();
});

bindControls();
spawnWave();
loop();
