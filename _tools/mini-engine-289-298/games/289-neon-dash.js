/* 289 NEON DASH 99 — ワンタップ・ネオンラン */
window.G=window.G||{};
window.GAME=(function(){
var P,obs,rings,spd,dist,combo,comboT,boost,hold,holdT,gy,scrollA,scrollB,stars,nextGap,flash;
var GRAV=2300,JUMP=760;

function ground(){return G.H-118;}

function spawn(){
  var r=Math.random();
  var x=G.W+40;
  if(r<0.42){ // 低い障害物：ジャンプで越える
    var h=G.rint(30,64);
    obs.push({x:x,y:ground()-h/2,w:G.rint(22,34),h:h,t:'low'});
  }else if(r<0.62){ // 二連ブロック
    var h2=G.rint(28,44);
    obs.push({x:x,y:ground()-h2/2,w:26,h:h2,t:'low'});
    obs.push({x:x+52,y:ground()-h2/2,w:26,h:h2,t:'low'});
  }else if(r<0.8){ // 上のバー：ジャンプ禁止ゾーン
    obs.push({x:x,y:ground()-118,w:G.rint(70,120),h:22,t:'bar'});
  }else{ // 空中リングだけ
    nextGap=Math.max(nextGap,0);
  }
  // リングを高確率で添える
  if(Math.random()<0.72){
    var ry=ground()-G.rint(58,132);
    rings.push({x:x+G.rint(60,130),y:ry,r:22,got:false,p:Math.random()*6.28});
  }
  nextGap=G.rnd(0.62,1.05)*(420/spd)*420/420;
}

return {
no:289,key:'neon-dash',title:'NEON DASH 99',sub:'ネオン街をワンタップで駆け抜けろ',
how:['タップでジャンプ（長押しで高く）','空中でもう一度タップ＝二段ジャンプ','光のリングをくぐるとコンボ＋加速'],
bg:'#070a18',ink:'#eaf2ff',accent:'#38f0d0',scoreLabel:'DISTANCE',unit:'m',

reset:function(){
  P={x:96,y:ground()-20,vy:0,w:24,h:34,on:true,jumps:2,rot:0,trail:[]};
  obs=[];rings=[];spd=340;dist=0;combo=0;comboT=0;boost=0;hold=false;holdT=0;
  scrollA=0;scrollB=0;nextGap=0.8;flash=0;
  stars=[];
  for(var i=0;i<46;i++)stars.push({x:Math.random()*G.W,y:Math.random()*G.H*0.62,s:Math.random()*2+0.6,z:Math.random()*0.7+0.3});
  G.score=0;
},

down:function(){
  if(P.jumps>0){
    P.jumps--;P.vy=-JUMP*(P.jumps===1?1:0.86);P.on=false;hold=true;holdT=0;
    G.sfx('jump',P.jumps===1?1:1.25);
    G.burst(P.x,P.y+16,8,['#38f0d0','#ffffff'],{dir:1.57,spread:1.6,spd:150,life:0.35,size:3,g:300});
  }
},
up:function(){hold=false;},

update:function(dt){
  var gy0=ground();
  // 速度
  spd=Math.min(760,340+G.runT*11)+boost;
  boost=Math.max(0,boost-90*dt);
  dist+=spd*dt/26;
  G.score=Math.floor(dist)+combo*0;
  // 重力（長押しで浮力）
  holdT+=dt;
  var g=(hold&&P.vy<0&&holdT<0.26)?GRAV*0.42:GRAV;
  P.vy+=g*dt;P.y+=P.vy*dt;
  if(P.y>gy0-P.h/2){
    if(!P.on){G.sfx('land');G.burst(P.x,gy0,7,['#7a5cff','#38f0d0'],{dir:-1.57,spread:1.8,spd:110,life:0.3,size:3,g:500});}
    P.y=gy0-P.h/2;P.vy=0;P.on=true;P.jumps=2;
  }
  P.rot=G.lerp(P.rot,P.on?0:G.clamp(P.vy/900,-0.5,0.6),0.2);
  P.trail.push({x:P.x,y:P.y,l:0.28});
  for(var t=P.trail.length-1;t>=0;t--){P.trail[t].l-=dt;if(P.trail[t].l<=0)P.trail.splice(t,1);}
  // 背景
  scrollA+=spd*dt*0.25;scrollB+=spd*dt;
  for(var s=0;s<stars.length;s++){stars[s].x-=spd*dt*0.16*stars[s].z;if(stars[s].x<-4){stars[s].x=G.W+4;stars[s].y=Math.random()*G.H*0.62;}}
  // 生成
  nextGap-=dt;
  if(nextGap<=0)spawn();
  // 障害物
  for(var i=obs.length-1;i>=0;i--){
    var o=obs[i];o.x-=spd*dt;
    if(o.x<-90){obs.splice(i,1);continue;}
    if(G.hit({x:P.x,y:P.y,w:P.w-6,h:P.h-6},o)){
      G.burst(P.x,P.y,26,['#ff4f7e','#ffd75e','#ffffff'],{spd:280,life:0.7,size:5,g:600});
      G.sfx('boom');
      G.over(o.t==='bar'?'高すぎた！バーは跳ばずにくぐる':'ジャンプが一歩遅かった');
      return;
    }
  }
  // リング
  for(var j=rings.length-1;j>=0;j--){
    var r=rings[j];r.x-=spd*dt;r.p+=dt*3;
    if(r.x<-40){rings.splice(j,1);continue;}
    if(!r.got&&Math.abs(r.x-P.x)<r.r&&Math.abs(r.y-P.y)<r.r+8){
      r.got=true;combo++;comboT=1.6;boost=Math.min(150,boost+46);flash=0.25;
      G.score=Math.floor(dist);
      dist+=6+combo*0.6;
      G.sfx('coin',1+Math.min(0.6,combo*0.06));
      G.burst(r.x,r.y,16,['#38f0d0','#ffffff','#7a5cff'],{spd:220,life:0.5,size:4,g:120});
      if(combo>1&&combo%5===0){G.toast('COMBO x'+combo+'!','#ffd75e',G.H*0.3,true);G.shake(6);}
    }
  }
  comboT-=dt;if(comboT<=0)combo=0;
  flash=Math.max(0,flash-dt*3);
},

draw:function(c){
  var gy0=ground();
  // 空グラデ
  var gr=c.createLinearGradient(0,0,0,gy0);
  gr.addColorStop(0,'#0a0f2a');gr.addColorStop(0.6,'#160b33');gr.addColorStop(1,'#2a0f3d');
  c.fillStyle=gr;c.fillRect(0,0,G.W,gy0);
  // 星
  for(var i=0;i<stars.length;i++){var s=stars[i];c.globalAlpha=0.3+s.z*0.6;c.fillStyle='#9ad8ff';c.fillRect(s.x,s.y,s.s,s.s);}
  c.globalAlpha=1;
  // 遠景ビル
  c.fillStyle='rgba(90,60,190,0.35)';
  for(var b=0;b<12;b++){
    var bx=((b*84-scrollA*0.5)%(G.W+120))-60;
    var bh=60+((b*37)%90);
    c.fillRect(bx,gy0-bh-46,54,bh+46);
  }
  c.fillStyle='rgba(150,70,220,0.28)';
  for(var b2=0;b2<10;b2++){
    var bx2=((b2*102-scrollA)%(G.W+140))-70;
    var bh2=90+((b2*53)%120);
    c.fillRect(bx2,gy0-bh2,66,bh2);
    c.fillStyle='rgba(255,220,120,0.5)';
    for(var w=0;w<4;w++)for(var h=0;h<Math.floor(bh2/26);h++){if(((b2*7+w*3+h*5)%4)===0)c.fillRect(bx2+8+w*14,gy0-bh2+10+h*24,6,9);}
    c.fillStyle='rgba(150,70,220,0.28)';
  }
  // 地面
  c.fillStyle='#0a0716';c.fillRect(0,gy0,G.W,G.H-gy0);
  c.strokeStyle='#38f0d0';c.lineWidth=3;c.globalAlpha=0.9;
  c.beginPath();c.moveTo(0,gy0);c.lineTo(G.W,gy0);c.stroke();
  c.globalAlpha=0.28;c.lineWidth=1;
  for(var g2=0;g2<14;g2++){
    var gx=((g2*54-scrollB)%(G.W+60))-30;
    c.beginPath();c.moveTo(gx,gy0);c.lineTo(gx-42,G.H);c.stroke();
  }
  for(var g3=1;g3<5;g3++){var yy=gy0+g3*g3*7;c.beginPath();c.moveTo(0,yy);c.lineTo(G.W,yy);c.stroke();}
  c.globalAlpha=1;
  // リング
  for(var r=0;r<rings.length;r++){
    var R=rings[r];if(R.got)continue;
    var pl=1+Math.sin(R.p)*0.08;
    c.strokeStyle='#38f0d0';c.lineWidth=5;c.globalAlpha=0.9;
    c.beginPath();c.arc(R.x,R.y,R.r*pl,0,6.2832);c.stroke();
    c.strokeStyle='rgba(255,255,255,0.85)';c.lineWidth=2;
    c.beginPath();c.arc(R.x,R.y,R.r*pl-5,0,6.2832);c.stroke();
    c.globalAlpha=1;
  }
  // 障害物
  for(var o=0;o<obs.length;o++){
    var O=obs[o];
    var col=O.t==='bar'?'#ff4f7e':'#ff8a3d';
    c.fillStyle=col;G.rr(c,O.x-O.w/2,O.y-O.h/2,O.w,O.h,4);c.fill();
    c.fillStyle='rgba(255,255,255,0.85)';
    if(O.t==='bar')c.fillRect(O.x-O.w/2,O.y-O.h/2,O.w,4);
    else c.fillRect(O.x-O.w/2,O.y-O.h/2,O.w,5);
    c.globalAlpha=0.25;c.fillStyle=col;
    G.rr(c,O.x-O.w/2-4,O.y-O.h/2-4,O.w+8,O.h+8,7);c.fill();c.globalAlpha=1;
  }
  // トレイル
  for(var t=0;t<P.trail.length;t++){
    var T=P.trail[t];c.globalAlpha=T.l*1.6*0.5;c.fillStyle='#38f0d0';
    G.rr(c,T.x-P.w/2,T.y-P.h/2,P.w,P.h,6);c.fill();
  }
  c.globalAlpha=1;
  // プレイヤー
  c.save();c.translate(P.x,P.y);c.rotate(P.rot);
  c.fillStyle='#ffffff';G.rr(c,-P.w/2,-P.h/2,P.w,P.h,7);c.fill();
  c.fillStyle='#38f0d0';G.rr(c,-P.w/2+3,-P.h/2+3,P.w-6,10,4);c.fill();
  c.fillStyle='#101430';c.fillRect(-4,-2,10,4);
  c.fillStyle='#ff4f7e';c.fillRect(-P.w/2+4,P.h/2-8,P.w-8,5);
  c.restore();
  // ジャンプ残数
  for(var k=0;k<P.jumps;k++){
    c.fillStyle='#38f0d0';c.globalAlpha=0.9;
    c.beginPath();c.arc(P.x-8+k*16,P.y-P.h/2-14,3.5,0,6.2832);c.fill();
  }
  c.globalAlpha=1;
  if(flash>0){c.globalAlpha=flash*0.5;c.fillStyle='#38f0d0';c.fillRect(0,0,G.W,G.H);c.globalAlpha=1;}
},

hud:function(c){
  G.text(c,'DISTANCE',16,22,11,'rgba(255,255,255,0.5)','left','700');
  G.text(c,Math.floor(dist)+'m',16,46,28,'#fff','left','900');
  G.text(c,'BEST '+G.best+'m',G.W-16,24,12,'rgba(255,255,255,0.45)','right','700');
  if(combo>0){
    var a=G.clamp(comboT/1.6,0,1);
    c.globalAlpha=0.5+a*0.5;
    G.text(c,'COMBO x'+combo,G.W-16,50,20,'#ffd75e','right','900');
    c.globalAlpha=1;
  }
  // スピードバー
  var w=(G.W-32)*G.clamp((spd-340)/420,0,1);
  c.fillStyle='rgba(255,255,255,0.14)';G.rr(c,16,G.H-22,G.W-32,6,3);c.fill();
  c.fillStyle='#38f0d0';G.rr(c,16,G.H-22,Math.max(4,w),6,3);c.fill();
}
};
})();
