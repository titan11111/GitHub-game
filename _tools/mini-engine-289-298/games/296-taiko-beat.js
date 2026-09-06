/* 296 TAIKO BEAT — 左右2レーンのリズム */
window.G=window.G||{};
window.GAME=(function(){
var notes,now,nextBeat,beatIdx,combo,maxCombo,gauge,judge,judgeT,hitFx,lanePulse,perfectN,goodN,missN,bpm,spb,TT,judgeY,levelT;
function laneX(l){return l===0?G.W*0.30:G.W*0.70;}

function genBeat(i){
  var bar=Math.floor(i/4),beat=i%4;
  var lv=Math.min(1,levelT/95);
  var p=(beat===0)?0.95:(beat===2?0.8:0.45+lv*0.4);
  var out=[];
  if(Math.random()<p)out.push({sub:0});
  if(Math.random()<0.16+lv*0.42)out.push({sub:0.5});
  if(lv>0.55&&Math.random()<0.14)out.push({sub:0.25});
  var lane=(bar%2===0)?0:1;
  for(var k=0;k<out.length;k++){
    var l=(Math.random()<0.5)?lane:(1-lane);
    if(out[k].sub!==0)l=1-l;
    notes.push({t:(i+out[k].sub)*spb+spb*5,l:l,done:false,miss:false});
  }
}

return {
no:296,key:'taiko-beat',title:'TAIKO BEAT',sub:'左右をタップ。伸びるコンボが気持ちいい',
how:['ノーツが判定線に重なった瞬間にタップ','赤は画面左半分、青は画面右半分','ゲージが0になると終了'],
bg:'#160b1a',ink:'#fff',accent:'#ff8a3d',scoreLabel:'SCORE',

resize:function(){judgeY=G.H-168;},

reset:function(){
  judgeY=G.H-168;
  bpm=138;spb=60/bpm;TT=1.15;
  notes=[];now=0;beatIdx=0;nextBeat=0;combo=0;maxCombo=0;gauge=100;judge='';judgeT=0;
  hitFx=[];lanePulse=[0,0];perfectN=0;goodN=0;missN=0;levelT=0;
  G.score=0;
  for(var i=0;i<8;i++){genBeat(beatIdx++);}
},

down:function(x,y){
  var l=(x<G.W/2)?0:1;
  lanePulse[l]=1;
  var bestI=-1,bd=1e9;
  for(var i=0;i<notes.length;i++){
    var n=notes[i];
    if(n.done||n.l!==l)continue;
    var d=Math.abs(n.t-now);
    if(d<bd){bd=d;bestI=i;}
  }
  if(bestI<0||bd>0.19){G.sfx('tick');return;}
  var n2=notes[bestI];n2.done=true;
  hitFx.push({x:laneX(l),y:judgeY,l:0.32,c:l===0?'#ff5f7e':'#38bdf8',good:true});
  if(bd<0.058){
    judge='PERFECT';judgeT=0.5;combo++;perfectN++;
    G.score+=100+combo*3;gauge=Math.min(100,gauge+2);
    G.sfx(l===0?'deep':'blip',1.0);
    G.burst(laneX(l),judgeY,14,[l===0?'#ff5f7e':'#38bdf8','#fff','#ffd75e'],{spd:220,life:0.45,size:4,g:200});
  }else if(bd<0.13){
    judge='GOOD';judgeT=0.45;combo++;goodN++;
    G.score+=50+combo;gauge=Math.min(100,gauge+1);
    G.sfx(l===0?'deep':'blip',0.9);
    G.burst(laneX(l),judgeY,8,['#ffd75e'],{spd:150,life:0.35,size:3,g:200});
  }else{
    judge='BAD';judgeT=0.45;combo=0;gauge-=8;
    G.sfx('bad');
  }
  if(combo>maxCombo)maxCombo=combo;
  if(combo>0&&combo%25===0)G.toast(combo+' COMBO!','#ffd75e',G.H*0.3,true);
},

update:function(dt){
  now+=dt;levelT+=dt;
  // 譜面の先読み生成
  while(beatIdx*spb+spb*5 < now+TT+2.0){genBeat(beatIdx++);}
  // メトロノーム
  if(now>=nextBeat){
    nextBeat+=spb;
    if(Math.round(now/spb)%2===0)G.sfx('tick',0.8);
  }
  judgeT-=dt;
  lanePulse[0]=Math.max(0,lanePulse[0]-dt*4);
  lanePulse[1]=Math.max(0,lanePulse[1]-dt*4);
  for(var f=hitFx.length-1;f>=0;f--){hitFx[f].l-=dt;if(hitFx[f].l<=0)hitFx.splice(f,1);}
  for(var i=notes.length-1;i>=0;i--){
    var n=notes[i];
    if(!n.done&&now-n.t>0.19){
      n.done=true;n.miss=true;missN++;combo=0;gauge-=13;
      judge='MISS';judgeT=0.45;G.sfx('hit',0.7);G.shake(4);
    }
    if(n.t<now-1.2)notes.splice(i,1);
  }
  if(gauge<=0){G.over('最大コンボ '+maxCombo+'／PERFECT '+perfectN);return;}
},

draw:function(c){
  judgeY=G.H-168;
  var gr=c.createLinearGradient(0,0,0,G.H);
  gr.addColorStop(0,'#2a1030');gr.addColorStop(1,'#100713');
  c.fillStyle=gr;c.fillRect(0,0,G.W,G.H);
  // ビートの脈動
  var ph=(now%spb)/spb;
  c.globalAlpha=0.10*(1-ph);
  c.fillStyle='#ff8a3d';c.fillRect(0,0,G.W,G.H);c.globalAlpha=1;
  // レーン
  for(var l=0;l<2;l++){
    var x=laneX(l),w=G.W*0.4;
    c.fillStyle=l===0?'rgba(255,95,126,0.09)':'rgba(56,189,248,0.09)';
    c.fillRect(x-w/2,0,w,judgeY+60);
    c.globalAlpha=0.15+lanePulse[l]*0.5;
    c.fillStyle=l===0?'#ff5f7e':'#38bdf8';
    c.fillRect(x-w/2,judgeY-2,w,4);
    c.globalAlpha=1;
  }
  // 判定線
  c.strokeStyle='rgba(255,255,255,0.75)';c.lineWidth=3;
  c.beginPath();c.moveTo(10,judgeY);c.lineTo(G.W-10,judgeY);c.stroke();
  for(var l2=0;l2<2;l2++){
    var x2=laneX(l2);
    c.strokeStyle='rgba(255,255,255,'+(0.35+lanePulse[l2]*0.6)+')';c.lineWidth=3;
    c.beginPath();c.arc(x2,judgeY,26+lanePulse[l2]*8,0,6.2832);c.stroke();
  }
  // ノーツ
  for(var i=0;i<notes.length;i++){
    var n=notes[i];if(n.done)continue;
    var dtn=n.t-now;
    if(dtn>TT+0.2)continue;
    var y=judgeY-(dtn/TT)*(judgeY+40);
    if(y<-40)continue;
    var x3=laneX(n.l);
    var col=n.l===0?'#ff5f7e':'#38bdf8';
    c.globalAlpha=0.25;c.fillStyle=col;c.beginPath();c.arc(x3,y,26,0,6.2832);c.fill();c.globalAlpha=1;
    c.fillStyle=col;c.beginPath();c.arc(x3,y,20,0,6.2832);c.fill();
    c.fillStyle='rgba(255,255,255,0.85)';c.beginPath();c.arc(x3,y,9,0,6.2832);c.fill();
    c.fillStyle=col;G.text(c,n.l===0?'ド':'カ',x3,y+1,11,'#fff','center','900');
  }
  // ヒット演出
  for(var f=0;f<hitFx.length;f++){
    var F=hitFx[f],k=1-F.l/0.32;
    c.globalAlpha=F.l*3;c.strokeStyle=F.c;c.lineWidth=4;
    c.beginPath();c.arc(F.x,F.y,26+k*40,0,6.2832);c.stroke();c.globalAlpha=1;
  }
  // 太鼓
  c.fillStyle='#3a1b16';G.rr(c,G.W/2-92,G.H-104,184,74,14);c.fill();
  c.fillStyle='#f3e2c4';G.rr(c,G.W/2-80,G.H-96,160,58,10);c.fill();
  c.fillStyle='rgba(0,0,0,0.12)';G.rr(c,G.W/2-70,G.H-88,140,42,8);c.fill();
  G.text(c,'左＝ド',G.W*0.30,G.H-66,14,'#ff5f7e','center','900');
  G.text(c,'右＝カ',G.W*0.70,G.H-66,14,'#2f7fb8','center','900');
  // 判定文字
  if(judgeT>0){
    var a=G.clamp(judgeT/0.5,0,1);
    c.globalAlpha=a;
    var jc=judge==='PERFECT'?'#ffd75e':judge==='GOOD'?'#4ade80':judge==='BAD'?'#ff8a3d':'#ff5f7e';
    G.text(c,judge,G.W/2,judgeY-64,30,jc,'center','900');
    c.globalAlpha=1;
  }
  // コンボ
  if(combo>1){
    var s=1+Math.min(0.25,combo*0.004);
    c.save();c.translate(G.W/2,judgeY-130);c.scale(s,s);
    G.text(c,String(combo),0,0,44,'#fff','center','900');
    G.text(c,'COMBO',0,30,13,'rgba(255,255,255,0.6)','center','800');
    c.restore();
  }
},

hud:function(c){
  G.text(c,'SCORE',14,18,10,'rgba(255,255,255,0.5)','left','700');
  G.text(c,String(G.score),14,40,22,'#fff','left','900');
  G.text(c,'BEST '+G.best,G.W-14,20,11,'rgba(255,255,255,0.45)','right','700');
  G.text(c,'MAX '+maxCombo,G.W-14,40,13,'#ffd75e','right','800');
  // ゲージ
  var w=G.W-28;
  c.fillStyle='rgba(255,255,255,0.14)';G.rr(c,14,52,w,9,5);c.fill();
  var g=G.clamp(gauge/100,0,1);
  c.fillStyle=g>0.5?'#4ade80':(g>0.25?'#ffd75e':'#ff5f7e');
  G.rr(c,14,52,Math.max(4,w*g),9,5);c.fill();
}
};
})();
