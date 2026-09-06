/* 291 NINJA ROPE — 押して離す、ロープスイング */
window.G=window.G||{};
window.GAME=(function(){
var P,anchors,coins,saws,camX,rope,far,dist,best,combo,comboT,lastAnchor,holding,groundY;
var GRAV=1500,RANGE=320;

function genAhead(){
  var lastX=anchors.length?anchors[anchors.length-1].x:0;
  while(lastX<camX+G.W*2.2){
    var dif=Math.min(1,dist/900);
    lastX+=G.rnd(140,190+dif*70);
    anchors.push({x:lastX,y:G.rnd(60,110+dif*70),p:Math.random()*6.28});
    if(Math.random()<0.65)coins.push({x:lastX+G.rnd(-40,40),y:G.rnd(230,G.H*0.62),got:false,p:Math.random()*6.28});
    if(dist>140&&Math.random()<0.28+dif*0.2)saws.push({x:lastX+G.rnd(40,120),y:G.rnd(200,G.H*0.58),r:20,a:Math.random()*6.28});
  }
}
function pick(){
  var bestA=null,bd=1e9;
  for(var i=0;i<anchors.length;i++){
    var a=anchors[i];
    if(a.x<P.x-30)continue;
    if(a.y>P.y-40)continue;
    var d=G.dist(P.x,P.y,a.x,a.y);
    if(d<RANGE&&d<bd){bd=d;bestA=a;}
  }
  return bestA;
}

return {
no:291,key:'ninja-rope',title:'NINJA ROPE',sub:'押して掴む、離して飛ぶ。忍のスイング',
how:['画面を押している間ロープで掴む','離すと勢いのまま飛ぶ','低い位置で離すと遠くへ飛べる'],
bg:'#0b1020',ink:'#fff',accent:'#ffd75e',scoreLabel:'DISTANCE',unit:'m',

reset:function(){
  groundY=G.H+80;
  P={x:120,y:G.H*0.42,vx:300,vy:-40,r:13,tr:[]};
  anchors=[{x:120,y:90,p:0}];coins=[];saws=[];camX=0;rope=null;dist=0;combo=0;comboT=0;holding=false;
  G.score=0;genAhead();
},

down:function(){
  holding=true;
  var a=pick();
  if(a){
    rope={a:a,len:G.clamp(G.dist(P.x,P.y,a.x,a.y),70,RANGE)};
    G.sfx('swing');
    G.burst(a.x,a.y,6,['#ffd75e'],{spd:120,life:0.3,size:3,g:200});
  }else{
    G.sfx('tick');
  }
},
up:function(){
  holding=false;
  if(rope){
    rope=null;
    combo++;comboT=2.2;
    G.sfx('jump',1.1);
    G.burst(P.x,P.y,10,['#38f0d0','#fff'],{spd:180,life:0.4,size:3,g:200});
  }
},

update:function(dt){
  // 掴み直し（押しっぱなしで次のアンカーへ）
  if(holding&&!rope){var a=pick();if(a){rope={a:a,len:G.clamp(G.dist(P.x,P.y,a.x,a.y),70,RANGE)};G.sfx('swing');}}
  P.vy+=GRAV*dt;
  P.x+=P.vx*dt;P.y+=P.vy*dt;
  if(rope){
    var dx=P.x-rope.a.x,dy=P.y-rope.a.y,d=Math.sqrt(dx*dx+dy*dy)||1;
    if(d>rope.len){
      var nx=dx/d,ny=dy/d;
      P.x=rope.a.x+nx*rope.len;P.y=rope.a.y+ny*rope.len;
      var rad=P.vx*nx+P.vy*ny;
      P.vx-=nx*rad;P.vy-=ny*rad;
      // 進行方向へ少しだけ加速（気持ちよさ優先）
      P.vx+=28*dt*60*0.02;
    }
    rope.len=Math.max(70,rope.len-14*dt);
  }
  P.vx=G.clamp(P.vx,120,760);
  P.tr.push({x:P.x,y:P.y,l:0.3});
  for(var t=P.tr.length-1;t>=0;t--){P.tr[t].l-=dt;if(P.tr[t].l<=0)P.tr.splice(t,1);}
  camX=Math.max(camX,P.x-G.W*0.34);
  dist=Math.max(dist,P.x/26);
  G.score=Math.floor(dist);
  comboT-=dt;if(comboT<=0)combo=0;
  genAhead();
  // 掃除
  while(anchors.length&&anchors[0].x<camX-120)anchors.shift();
  for(var i=coins.length-1;i>=0;i--){
    var C=coins[i];C.p+=dt*4;
    if(C.x<camX-60){coins.splice(i,1);continue;}
    if(!C.got&&G.dist(P.x,P.y,C.x,C.y)<26){
      C.got=true;coins.splice(i,1);
      dist+=4;G.sfx('coin',1+Math.random()*0.2);
      G.burst(C.x,C.y,10,['#ffd75e','#fff'],{spd:170,life:0.45,size:3,g:220});
    }
  }
  for(var j=saws.length-1;j>=0;j--){
    var S=saws[j];S.a+=dt*6;
    if(S.x<camX-80){saws.splice(j,1);continue;}
    if(G.dist(P.x,P.y,S.x,S.y)<S.r+P.r-2){
      G.burst(P.x,P.y,26,['#ff4f7e','#fff','#ffd75e'],{spd:280,life:0.7,size:5,g:500});
      G.sfx('boom');G.over('鉄輪に触れた');return;
    }
  }
  if(P.y>G.H+60){
    G.burst(P.x,G.H,20,['#4b6bff','#fff'],{dir:-1.57,spread:1.2,spd:260,life:0.6,size:4,g:400});
    G.sfx('boom');G.over('谷に落ちた');return;
  }
  if(P.y<-200){P.y=-200;P.vy=0;}
},

draw:function(c){
  c.save();
  var gr=c.createLinearGradient(0,0,0,G.H);
  gr.addColorStop(0,'#101a3d');gr.addColorStop(0.55,'#0b1226');gr.addColorStop(1,'#05070f');
  c.fillStyle=gr;c.fillRect(0,0,G.W,G.H);
  // 月
  c.fillStyle='rgba(255,246,214,0.9)';c.beginPath();c.arc(G.W-64,88,34,0,6.2832);c.fill();
  c.fillStyle='rgba(16,26,61,0.9)';c.beginPath();c.arc(G.W-78,78,30,0,6.2832);c.fill();
  // 遠景の山
  c.fillStyle='rgba(30,45,95,0.85)';
  for(var m=0;m<8;m++){
    var mx=((m*160-camX*0.16)%(G.W+320))-160;
    c.beginPath();c.moveTo(mx,G.H);c.lineTo(mx+90,G.H-190-((m*53)%70));c.lineTo(mx+190,G.H);c.closePath();c.fill();
  }
  c.fillStyle='rgba(20,32,70,0.9)';
  for(var m2=0;m2<8;m2++){
    var mx2=((m2*130-camX*0.34)%(G.W+260))-130;
    c.beginPath();c.moveTo(mx2,G.H);c.lineTo(mx2+70,G.H-120-((m2*37)%60));c.lineTo(mx2+150,G.H);c.closePath();c.fill();
  }
  c.translate(-camX,0);
  // アンカー
  for(var i=0;i<anchors.length;i++){
    var a=anchors[i];a.p+=0.02;
    if(a.x<camX-60||a.x>camX+G.W+60)continue;
    c.strokeStyle='rgba(255,255,255,0.16)';c.lineWidth=2;
    c.beginPath();c.moveTo(a.x,0);c.lineTo(a.x,a.y);c.stroke();
    var on=(rope&&rope.a===a);
    c.fillStyle=on?'#ffd75e':'#7f8ec7';
    c.beginPath();c.arc(a.x,a.y,on?11:8,0,6.2832);c.fill();
    c.fillStyle='rgba(255,255,255,0.7)';c.beginPath();c.arc(a.x,a.y,3,0,6.2832);c.fill();
    if(!on){
      var d=G.dist(P.x,P.y,a.x,a.y);
      if(d<RANGE&&a.x>P.x-30&&a.y<P.y-40){
        c.globalAlpha=0.25+0.2*Math.sin(G.t*6);c.strokeStyle='#ffd75e';c.lineWidth=1.5;
        c.beginPath();c.arc(a.x,a.y,16,0,6.2832);c.stroke();c.globalAlpha=1;
      }
    }
  }
  // コイン
  for(var k=0;k<coins.length;k++){
    var C=coins[k];if(C.got)continue;
    var sw=Math.abs(Math.cos(C.p));
    c.fillStyle='#ffd75e';c.beginPath();c.ellipse(C.x,C.y,7*sw+2,9,0,0,6.2832);c.fill();
    c.fillStyle='rgba(255,255,255,0.6)';c.beginPath();c.ellipse(C.x-1,C.y-2,3*sw+0.5,3.5,0,0,6.2832);c.fill();
  }
  // 鉄輪
  for(var s=0;s<saws.length;s++){
    var S=saws[s];
    c.save();c.translate(S.x,S.y);c.rotate(S.a);
    c.fillStyle='#ff4f7e';
    for(var b=0;b<8;b++){c.rotate(6.2832/8);c.fillRect(-4,-S.r-6,8,12);}
    c.fillStyle='#ffb0c4';c.beginPath();c.arc(0,0,S.r-4,0,6.2832);c.fill();
    c.fillStyle='#8a1030';c.beginPath();c.arc(0,0,5,0,6.2832);c.fill();
    c.restore();
  }
  // ロープ
  if(rope){
    c.strokeStyle='#ffd75e';c.lineWidth=2.5;
    c.beginPath();c.moveTo(rope.a.x,rope.a.y);c.lineTo(P.x,P.y);c.stroke();
  }
  // トレイル
  for(var t=0;t<P.tr.length;t++){
    c.globalAlpha=P.tr[t].l*2;c.fillStyle='#38f0d0';
    c.beginPath();c.arc(P.tr[t].x,P.tr[t].y,P.r*0.7,0,6.2832);c.fill();
  }
  c.globalAlpha=1;
  // 忍者
  c.save();c.translate(P.x,P.y);
  c.rotate(Math.atan2(P.vy,P.vx)*0.35);
  c.fillStyle='#1b2450';c.beginPath();c.arc(0,0,P.r,0,6.2832);c.fill();
  c.fillStyle='#2f3d84';G.rr(c,-P.r,-4,P.r*2,8,3);c.fill();
  c.fillStyle='#fff';c.fillRect(-6,-4,5,4);c.fillRect(2,-4,5,4);
  c.fillStyle='#ff4f7e';
  c.beginPath();c.moveTo(P.r-3,-2);c.lineTo(P.r+11,-9);c.lineTo(P.r+9,2);c.closePath();c.fill();
  c.restore();
  c.restore();
},

hud:function(c){
  G.text(c,'DISTANCE',16,22,11,'rgba(255,255,255,0.5)','left','700');
  G.text(c,Math.floor(dist)+'m',16,46,28,'#fff','left','900');
  G.text(c,'BEST '+G.best+'m',G.W-16,24,12,'rgba(255,255,255,0.45)','right','700');
  if(combo>1){c.globalAlpha=G.clamp(comboT/2.2,0,1)*0.5+0.5;G.text(c,'SWING x'+combo,G.W-16,50,18,'#ffd75e','right','900');c.globalAlpha=1;}
  if(!rope&&Math.sin(G.t*5)>0&&G.runT<6)G.text(c,'押して掴む / 離して飛ぶ',G.W/2,G.H-40,15,'rgba(255,255,255,0.75)','center','800');
}
};
})();
