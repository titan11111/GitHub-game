/* 292 GRAVITY FLIP — タップで天地をひっくり返す */
window.G=window.G||{};
window.GAME=(function(){
var P,items,spd,dist,gdir,flipFx,orbs,streak,streakT,scan,warnT,topY,botY;
var GRAV=2600;

function bounds(){topY=76;botY=G.H-76;}
function gen(){
  var lastX=0;
  for(var i=0;i<items.length;i++)if(items[i].x>lastX)lastX=items[i].x;
  var dif=Math.min(1,dist/700);
  while(lastX<G.W*2.4){
    lastX+=G.rnd(150,230)-dif*46;
    var r=Math.random();
    if(r<0.42){ // 床か天井のスパイク帯
      var top=Math.random()<0.5;
      var w=G.rnd(46,86)+dif*40;
      items.push({x:lastX,w:w,h:34,top:top,t:'spike'});
      if(Math.random()<0.5)orbs.push({x:lastX+w/2,y:top?botY-40:topY+40,p:0,got:false});
    }else if(r<0.68){ // 中央ブロック（上下どちらかを通す）
      var passTop=Math.random()<0.5;
      items.push({x:lastX,w:G.rnd(28,44),h:(botY-topY)*G.rnd(0.42,0.56),top:!passTop,t:'wall'});
      orbs.push({x:lastX+16,y:passTop?topY+46:botY-46,p:0,got:false});
    }else{ // 交互スパイク（リズム地帯）
      var t0=Math.random()<0.5;
      for(var k=0;k<3;k++){
        items.push({x:lastX+k*96,w:52,h:32,top:(k%2===0)?t0:!t0,t:'spike'});
        orbs.push({x:lastX+k*96+26,y:((k%2===0)?t0:!t0)?botY-38:topY+38,p:0,got:false});
      }
      lastX+=200;
    }
  }
}

return {
no:292,key:'gravity-flip',title:'GRAVITY FLIP',sub:'タップひとつで天地を反転して駆ける',
how:['タップで重力を上下反転','床と天井を行き来して針を避ける','青い光を拾うと加点＋連続ボーナス'],
bg:'#060b16',ink:'#fff',accent:'#38bdf8',scoreLabel:'DISTANCE',unit:'m',

resize:function(){bounds();},

reset:function(){
  bounds();
  P={x:92,y:botY-16,vy:0,w:26,h:26,rot:0,tr:[]};
  items=[];orbs=[];spd=330;dist=0;gdir=1;flipFx=0;streak=0;streakT=0;scan=0;warnT=0;
  G.score=0;gen();
},

down:function(){
  gdir*=-1;flipFx=1;P.vy=gdir*160;
  G.sfx('power',gdir>0?0.85:1.25);
  G.burst(P.x,P.y,10,['#38bdf8','#fff'],{dir:gdir>0?-1.57:1.57,spread:1.4,spd:190,life:0.35,size:3,g:0});
  G.shake(3);
},

update:function(dt){
  bounds();
  spd=Math.min(700,330+G.runT*10);
  dist+=spd*dt/26;G.score=Math.floor(dist);
  scan+=spd*dt;
  P.vy+=GRAV*gdir*dt;
  P.y+=P.vy*dt;
  if(gdir>0&&P.y>botY-P.h/2){P.y=botY-P.h/2;if(P.vy>200)G.sfx('land');P.vy=0;}
  if(gdir<0&&P.y<topY+P.h/2){P.y=topY+P.h/2;if(P.vy<-200)G.sfx('land');P.vy=0;}
  P.rot=G.lerp(P.rot,gdir>0?0:Math.PI,0.25);
  flipFx=Math.max(0,flipFx-dt*3);
  P.tr.push({x:P.x,y:P.y,l:0.22});
  for(var t=P.tr.length-1;t>=0;t--){P.tr[t].l-=dt;if(P.tr[t].l<=0)P.tr.splice(t,1);}
  streakT-=dt;if(streakT<=0)streak=0;
  var near=false;
  for(var i=items.length-1;i>=0;i--){
    var o=items[i];o.x-=spd*dt;
    if(o.x+o.w<-40){items.splice(i,1);continue;}
    var oy=o.top?topY:botY-o.h;
    if(o.t==='wall')oy=o.top?topY:botY-o.h;
    if(o.x<P.x+60&&o.x+o.w>P.x-20)near=true;
    if(P.x+P.w/2-4>o.x&&P.x-P.w/2+4<o.x+o.w&&P.y+P.h/2-4>oy&&P.y-P.h/2+4<oy+o.h){
      G.burst(P.x,P.y,28,['#ff4f7e','#ffd75e','#fff'],{spd:300,life:0.7,size:5,g:0});
      G.sfx('boom');G.over(o.t==='wall'?'壁に激突':'針に触れた');return;
    }
  }
  for(var j=orbs.length-1;j>=0;j--){
    var Q=orbs[j];Q.x-=spd*dt;Q.p+=dt*5;
    if(Q.x<-30){orbs.splice(j,1);continue;}
    if(!Q.got&&Math.abs(Q.x-P.x)<24&&Math.abs(Q.y-P.y)<26){
      Q.got=true;orbs.splice(j,1);
      streak++;streakT=2.4;dist+=3+streak*0.4;
      G.sfx('coin',1+Math.min(0.7,streak*0.05));
      G.burst(Q.x,Q.y,12,['#38bdf8','#fff'],{spd:180,life:0.45,size:3,g:0});
      if(streak>0&&streak%8===0){G.toast('CHAIN x'+streak,'#38bdf8',G.H*0.3,true);G.shake(5);}
    }
  }
  warnT=near?1:Math.max(0,warnT-dt*4);
  gen();
},

draw:function(c){
  bounds();
  var gr=c.createLinearGradient(0,topY,0,botY);
  gr.addColorStop(0,'#0d1b3d');gr.addColorStop(0.5,'#0a1026');gr.addColorStop(1,'#0d1b3d');
  c.fillStyle=gr;c.fillRect(0,topY,G.W,botY-topY);
  // 走査線
  c.globalAlpha=0.2;c.strokeStyle='#2f6fd0';c.lineWidth=1;
  for(var i=0;i<16;i++){
    var x=((i*70-scan*0.5)%(G.W+140))-70;
    c.beginPath();c.moveTo(x,topY);c.lineTo(x-30,botY);c.stroke();
  }
  c.globalAlpha=1;
  // 中央ライン
  c.globalAlpha=0.18;c.strokeStyle='#7dd3fc';c.setLineDash([8,10]);
  c.beginPath();c.moveTo(0,(topY+botY)/2);c.lineTo(G.W,(topY+botY)/2);c.stroke();
  c.setLineDash([]);c.globalAlpha=1;
  // 床天井
  c.fillStyle='#132445';c.fillRect(0,0,G.W,topY);c.fillRect(0,botY,G.W,G.H-botY);
  c.fillStyle=gdir<0?'#38bdf8':'#22406e';c.fillRect(0,topY-4,G.W,4);
  c.fillStyle=gdir>0?'#38bdf8':'#22406e';c.fillRect(0,botY,G.W,4);
  // 障害物
  for(var k=0;k<items.length;k++){
    var o=items[k],oy=o.top?topY:botY-o.h;
    if(o.t==='spike'){
      c.fillStyle='#ff4f7e';
      var n=Math.max(2,Math.round(o.w/17));
      for(var s=0;s<n;s++){
        var sx=o.x+s*(o.w/n);
        c.beginPath();
        if(o.top){c.moveTo(sx,topY);c.lineTo(sx+(o.w/n)/2,topY+o.h);c.lineTo(sx+o.w/n,topY);}
        else{c.moveTo(sx,botY);c.lineTo(sx+(o.w/n)/2,botY-o.h);c.lineTo(sx+o.w/n,botY);}
        c.closePath();c.fill();
      }
      c.globalAlpha=0.3;c.fillStyle='#ff4f7e';c.fillRect(o.x,o.top?topY:botY-3,o.w,3);c.globalAlpha=1;
    }else{
      c.fillStyle='#ff8a3d';G.rr(c,o.x,oy,o.w,o.h,5);c.fill();
      c.fillStyle='rgba(255,255,255,0.3)';c.fillRect(o.x+3,oy+3,o.w-6,4);
      c.fillStyle='rgba(0,0,0,0.25)';
      for(var z=0;z<o.h;z+=14)c.fillRect(o.x,oy+z,o.w,3);
    }
  }
  // オーブ
  for(var q=0;q<orbs.length;q++){
    var Q=orbs[q];if(Q.got)continue;
    var pu=1+Math.sin(Q.p)*0.15;
    c.globalAlpha=0.35;c.fillStyle='#38bdf8';c.beginPath();c.arc(Q.x,Q.y,13*pu,0,6.2832);c.fill();
    c.globalAlpha=1;c.fillStyle='#7dd3fc';c.beginPath();c.arc(Q.x,Q.y,7*pu,0,6.2832);c.fill();
    c.fillStyle='#fff';c.beginPath();c.arc(Q.x-2,Q.y-2,2.5,0,6.2832);c.fill();
  }
  // トレイル
  for(var t=0;t<P.tr.length;t++){
    c.globalAlpha=P.tr[t].l*2.4;c.fillStyle='#38bdf8';
    G.rr(c,P.tr[t].x-P.w/2,P.tr[t].y-P.h/2,P.w,P.h,7);c.fill();
  }
  c.globalAlpha=1;
  // プレイヤー
  c.save();c.translate(P.x,P.y);c.rotate(P.rot);
  c.fillStyle='#fff';G.rr(c,-P.w/2,-P.h/2,P.w,P.h,8);c.fill();
  c.fillStyle='#0b1730';c.fillRect(-7,-4,5,6);c.fillRect(2,-4,5,6);
  c.fillStyle='#38bdf8';c.fillRect(-P.w/2+4,P.h/2-6,P.w-8,4);
  c.restore();
  // 反転エフェクト
  if(flipFx>0){
    c.globalAlpha=flipFx*0.4;c.strokeStyle='#38bdf8';c.lineWidth=3;
    c.beginPath();c.arc(P.x,P.y,20+(1-flipFx)*46,0,6.2832);c.stroke();c.globalAlpha=1;
  }
  // 重力方向インジケータ
  c.globalAlpha=0.5;c.fillStyle='#38bdf8';
  var ay=gdir>0?botY-20:topY+20;
  c.beginPath();
  if(gdir>0){c.moveTo(G.W-26,ay-8);c.lineTo(G.W-18,ay+4);c.lineTo(G.W-34,ay+4);}
  else{c.moveTo(G.W-26,ay+8);c.lineTo(G.W-18,ay-4);c.lineTo(G.W-34,ay-4);}
  c.closePath();c.fill();c.globalAlpha=1;
},

hud:function(c){
  G.text(c,'DISTANCE',16,22,11,'rgba(255,255,255,0.5)','left','700');
  G.text(c,Math.floor(dist)+'m',16,48,26,'#fff','left','900');
  G.text(c,'BEST '+G.best+'m',G.W-16,24,12,'rgba(255,255,255,0.45)','right','700');
  if(streak>0){c.globalAlpha=0.55+G.clamp(streakT/2.4,0,1)*0.45;G.text(c,'CHAIN x'+streak,G.W-16,48,18,'#38bdf8','right','900');c.globalAlpha=1;}
  if(G.runT<5&&Math.sin(G.t*5)>0)G.text(c,'タップで重力反転',G.W/2,G.H/2,17,'rgba(255,255,255,0.6)','center','800');
}
};
})();
