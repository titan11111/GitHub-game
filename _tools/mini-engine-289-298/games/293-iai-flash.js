/* 293 IAI FLASH 一閃 — 合図の瞬間に斬る */
window.G=window.G||{};
window.GAME=(function(){
var ph,tm,kills,rt,lastRT,bestRT,enemy,cut,cutT,feintT,winner,shockT,petals,sumRT,resultT,flashC;
var NAMES=['野伏せ','浪人','用心棒','影の者','双剣士','鬼面','無名','剣鬼','刃衆','燕返し'];

function enemyRT(){return Math.max(0.17,0.62-kills*0.034);}
function nextEnemy(){
  enemy={name:NAMES[Math.min(NAMES.length-1,kills)],rt:enemyRT(),x:G.W*0.74};
  ph='intro';tm=0;cut=0;cutT=0;feintT=0;winner=0;flashC=null;
}

return {
no:293,key:'iai-flash',title:'IAI FLASH 一閃',sub:'合図の一瞬に抜く、反射神経の真剣勝負',
how:['「斬」の白い合図が出た瞬間にタップ','合図の前に押すとフライングで敗北','赤い偽の合図では押さないこと'],
bg:'#140b12',ink:'#fff',accent:'#ffd75e',scoreLabel:'撃破',unit:'人',

reset:function(){
  kills=0;lastRT=0;bestRT=0;sumRT=0;shockT=0;resultT=0;G.score=0;
  petals=[];
  for(var i=0;i<26;i++)petals.push({x:Math.random()*G.W,y:Math.random()*G.H,s:G.rnd(3,6),vy:G.rnd(18,40),vx:G.rnd(-22,-6),p:Math.random()*6.28});
  nextEnemy();
},

down:function(){
  if(ph==='intro')return;
  if(ph==='wait'){
    ph='lose';winner=-1;cut=1;cutT=0;shockT=1;
    G.sfx('bad');G.shake(10);
    G.over('フライング。抜くのが早すぎた（'+kills+'人撃破）');
    return;
  }
  if(ph==='feint'){
    ph='lose';winner=-1;cut=1;cutT=0;shockT=1;
    G.sfx('bad');G.shake(10);
    G.over('偽の合図に釣られた（'+kills+'人撃破）');
    return;
  }
  if(ph==='signal'){
    lastRT=tm;
    if(tm<enemy.rt){
      winner=1;ph='result';resultT=0;cut=1;cutT=0;
      kills++;sumRT+=lastRT;G.score=kills;
      if(bestRT===0||lastRT<bestRT)bestRT=lastRT;
      G.sfx('swing');G.shake(8);
      G.burst(enemy.x,G.H*0.52,26,['#ffd75e','#fff','#ff9ec4'],{spd:300,life:0.6,size:4,g:260});
      G.toast(Math.round(lastRT*1000)+'ms','#ffd75e',G.H*0.3,true);
    }else{
      winner=-1;ph='lose';cut=1;cutT=0;shockT=1;
      G.sfx('hit');G.shake(12);
      G.over('遅い。'+Math.round(lastRT*1000)+'ms（相手 '+Math.round(enemy.rt*1000)+'ms）');
    }
  }
},

update:function(dt){
  tm+=dt;
  cutT+=dt;
  if(shockT>0)shockT-=dt;
  for(var i=0;i<petals.length;i++){
    var p=petals[i];p.y+=p.vy*dt;p.x+=p.vx*dt;p.p+=dt*2;
    if(p.y>G.H+10){p.y=-10;p.x=Math.random()*G.W;}
    if(p.x<-10)p.x=G.W+10;
  }
  if(ph==='intro'&&tm>0.95){ph='wait';tm=0;this._wait=G.rnd(1.1,3.0);}
  else if(ph==='wait'){
    if(kills>=2&&Math.random()<dt*0.35&&tm>0.5&&this._wait-tm>0.5){
      ph='feint';tm=0;flashC='#ff4f7e';G.sfx('tick');
    }else if(tm>=this._wait){
      ph='signal';tm=0;flashC='#ffffff';G.sfx('blip',1.4);
    }
  }
  else if(ph==='feint'&&tm>0.3){ph='wait';tm=0;this._wait=G.rnd(0.7,2.0);flashC=null;}
  else if(ph==='signal'){
    if(tm>=enemy.rt){
      winner=-1;ph='lose';cut=1;cutT=0;shockT=1;
      G.sfx('hit');G.shake(12);
      G.over('相手が先に抜いた（'+Math.round(enemy.rt*1000)+'ms）');
    }
  }
  else if(ph==='result'&&tm>1.05){nextEnemy();}
},

draw:function(c){
  var horizon=G.H*0.66;
  // 夕焼け
  var gr=c.createLinearGradient(0,0,0,horizon);
  gr.addColorStop(0,'#2b0f2a');gr.addColorStop(0.55,'#7a2337');gr.addColorStop(1,'#e0692f');
  c.fillStyle=gr;c.fillRect(0,0,G.W,horizon);
  // 太陽
  c.fillStyle='#ffd08a';c.beginPath();c.arc(G.W*0.5,horizon-40,52,0,6.2832);c.fill();
  // 遠山
  c.fillStyle='rgba(50,18,40,0.85)';
  c.beginPath();c.moveTo(0,horizon);c.lineTo(G.W*0.22,horizon-70);c.lineTo(G.W*0.42,horizon);c.closePath();c.fill();
  c.beginPath();c.moveTo(G.W*0.55,horizon);c.lineTo(G.W*0.8,horizon-92);c.lineTo(G.W,horizon-10);c.lineTo(G.W,horizon);c.closePath();c.fill();
  // 地面
  var g2=c.createLinearGradient(0,horizon,0,G.H);
  g2.addColorStop(0,'#2a1220');g2.addColorStop(1,'#140a12');
  c.fillStyle=g2;c.fillRect(0,horizon,G.W,G.H-horizon);
  // 花びら
  for(var i=0;i<petals.length;i++){
    var p=petals[i];
    c.globalAlpha=0.55;c.fillStyle='#ffb7d0';
    c.save();c.translate(p.x,p.y);c.rotate(p.p);
    c.beginPath();c.ellipse(0,0,p.s,p.s*0.55,0,0,6.2832);c.fill();c.restore();
  }
  c.globalAlpha=1;
  // 侍シルエット
  var py=horizon+26,ey=horizon+26;
  drawSamurai(c,G.W*0.24,py,1,'#1a0e18',winner===1||ph!=='lose');
  drawSamurai(c,enemy.x,ey,-1,'#0d0710',winner!==1);
  // 合図
  if(flashC){
    var a=(ph==='signal')?Math.max(0.25,1-tm*1.6):0.85;
    c.globalAlpha=a*0.32;c.fillStyle=flashC;c.fillRect(0,0,G.W,G.H);c.globalAlpha=1;
    var s=ph==='signal'?'斬':'待';
    G.text(c,s,G.W/2,G.H*0.33,ph==='signal'?96:76,flashC,'center','900');
    if(ph==='signal'){
      c.globalAlpha=0.5;G.text(c,'いま！',G.W/2,G.H*0.33+70,22,'#fff','center','900');c.globalAlpha=1;
    }
  }else if(ph==='wait'){
    c.globalAlpha=0.35+0.25*Math.sin(G.t*2.5);
    G.text(c,'…',G.W/2,G.H*0.33,64,'#fff','center','900');c.globalAlpha=1;
    G.text(c,'まだ抜くな',G.W/2,G.H*0.33+52,14,'rgba(255,255,255,0.45)','center','700');
  }
  // 斬撃線
  if(cut>0&&cutT<0.5){
    var k=1-cutT/0.5;
    c.globalAlpha=k;c.strokeStyle='#fff';c.lineWidth=6*k+1;
    c.beginPath();
    var cy=G.H*0.5;
    if(winner===1){c.moveTo(G.W*0.2,cy+70);c.lineTo(G.W*0.95,cy-70);}
    else{c.moveTo(G.W*0.05,cy-70);c.lineTo(G.W*0.8,cy+70);}
    c.stroke();c.globalAlpha=1;
  }
  if(shockT>0){c.globalAlpha=shockT*0.35;c.fillStyle='#ff4f7e';c.fillRect(0,0,G.W,G.H);c.globalAlpha=1;}
},

hud:function(c){
  G.text(c,'撃破',16,22,11,'rgba(255,255,255,0.55)','left','700');
  G.text(c,kills+'人',16,46,26,'#fff','left','900');
  G.text(c,'BEST '+G.best+'人',G.W-16,24,12,'rgba(255,255,255,0.5)','right','700');
  if(lastRT>0)G.text(c,'前回 '+Math.round(lastRT*1000)+'ms',G.W-16,46,14,'#ffd75e','right','800');
  // 相手の腕前バー
  var w=(G.W-32);
  var lvl=1-G.clamp((enemy.rt-0.17)/(0.62-0.17),0,1);
  G.text(c,'相手：'+enemy.name+'（'+Math.round(enemy.rt*1000)+'ms）',16,G.H-34,13,'rgba(255,255,255,0.7)','left','700');
  c.fillStyle='rgba(255,255,255,0.15)';G.rr(c,16,G.H-22,w,6,3);c.fill();
  c.fillStyle='#ff4f7e';G.rr(c,16,G.H-22,Math.max(4,w*lvl),6,3);c.fill();
}
};

function drawSamurai(c,x,y,dir,col,alive){
  c.save();c.translate(x,y);c.scale(dir,1);
  if(!alive)c.globalAlpha=0.35;
  c.fillStyle=col;
  // 脚
  c.beginPath();c.moveTo(-16,0);c.lineTo(-4,-46);c.lineTo(10,-46);c.lineTo(20,0);c.closePath();c.fill();
  // 胴
  G.rr(c,-13,-92,28,50,6);c.fill();
  // 頭
  c.beginPath();c.arc(0,-104,13,0,6.2832);c.fill();
  // 髷
  c.fillRect(-3,-124,7,12);
  // 刀
  c.strokeStyle=col;c.lineWidth=4;
  c.beginPath();c.moveTo(-14,-60);c.lineTo(26,-74);c.stroke();
  c.strokeStyle='rgba(255,255,255,0.5)';c.lineWidth=1.5;
  c.beginPath();c.moveTo(-10,-61);c.lineTo(22,-73);c.stroke();
  c.globalAlpha=1;
  c.restore();
}
})();
