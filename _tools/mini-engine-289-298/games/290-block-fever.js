/* 290 BLOCK FEVER — 指で守るブロック崩し */
window.G=window.G||{};
window.GAME=(function(){
var pad,balls,bricks,drops,stage,life,stuck,wideT,slowT,comboHits,shakeHit,bw,bh,top0,msgT;
var COLS=7;
var PAL=[['#ff5f7e','#ff8a3d','#ffd75e','#4ade80','#38bdf8','#a78bfa'],
         ['#38f0d0','#4ade80','#ffd75e','#ff8a3d','#ff5f7e','#f472b6'],
         ['#a78bfa','#38bdf8','#38f0d0','#ffd75e','#fb7185','#f0abfc']];

function layout(){
  bw=(G.W-28)/COLS;bh=22;top0=104;
}
function build(){
  layout();
  bricks=[];
  var rows=Math.min(8,4+Math.floor(stage/2)+ (stage>1?1:0));
  var pal=PAL[(stage-1)%PAL.length];
  for(var r=0;r<rows;r++){
    for(var i=0;i<COLS;i++){
      if(stage>2&&((r+i+stage)%11)===0)continue;
      var hp=1;
      if(stage>=2&&r<Math.min(2,Math.floor(stage/2)))hp=2;
      if(stage>=4&&r===0&&(i%3)===0)hp=3;
      bricks.push({x:14+i*bw+bw/2,y:top0+r*(bh+7)+bh/2,w:bw-5,h:bh,hp:hp,c:pal[r%pal.length],f:0});
    }
  }
}
function newBall(x,y,ang,sp){
  balls.push({x:x,y:y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r:7,tr:[]});
}
function padW(){return wideT>0?126:86;}
function speedNow(){return (330+stage*16)*(slowT>0?0.72:1);}

return {
no:290,key:'block-fever',title:'BLOCK FEVER',sub:'指1本で守る、加速するブロック崩し',
how:['画面を横になぞってパドル移動','タップでボール発射','落ちてくる★を取ると強化'],
bg:'#0a0a1c',ink:'#fff',accent:'#ffd75e',scoreLabel:'SCORE',

resize:function(){layout();},

reset:function(){
  layout();
  pad={x:G.W/2,y:0};stage=1;life=3;balls=[];drops=[];stuck=true;wideT=0;slowT=0;comboHits=0;msgT=0;
  G.score=0;build();
},

move:function(x){pad.x=G.clamp(x,padW()/2,G.W-padW()/2);},
down:function(x,y){
  pad.x=G.clamp(x,padW()/2,G.W-padW()/2);
  if(stuck){stuck=false;newBall(pad.x,G.H-116,-Math.PI/2+G.rnd(-0.3,0.3),speedNow());G.sfx('jump');}
},

update:function(dt){
  var py=G.H-96,pw=padW();
  pad.y=py;
  if(wideT>0)wideT-=dt;
  if(slowT>0)slowT-=dt;
  if(msgT>0)msgT-=dt;
  if(stuck)return;
  for(var b=balls.length-1;b>=0;b--){
    var B=balls[b];
    var sp=Math.sqrt(B.vx*B.vx+B.vy*B.vy),want=speedNow();
    if(sp>0){B.vx=B.vx/sp*want;B.vy=B.vy/sp*want;}
    var steps=Math.max(1,Math.ceil(want*dt/6));
    for(var s=0;s<steps;s++){
      var d=dt/steps;
      B.x+=B.vx*d;B.y+=B.vy*d;
      if(B.x<B.r){B.x=B.r;B.vx=Math.abs(B.vx);G.sfx('tick');}
      if(B.x>G.W-B.r){B.x=G.W-B.r;B.vx=-Math.abs(B.vx);G.sfx('tick');}
      if(B.y<70+B.r){B.y=70+B.r;B.vy=Math.abs(B.vy);G.sfx('tick');}
      // パドル
      if(B.vy>0&&B.y+B.r>py-9&&B.y-B.r<py+12&&B.x>pad.x-pw/2-6&&B.x<pad.x+pw/2+6){
        var rel=G.clamp((B.x-pad.x)/(pw/2),-1,1);
        var ang=-Math.PI/2+rel*1.05;
        B.vx=Math.cos(ang)*want;B.vy=Math.sin(ang)*want;
        B.y=py-9-B.r;
        comboHits=0;
        G.sfx('blip');
        G.burst(B.x,py-8,5,['#ffd75e','#fff'],{dir:-1.57,spread:1.2,spd:130,life:0.3,size:3,g:400});
      }
      // ブロック
      for(var i=bricks.length-1;i>=0;i--){
        var K=bricks[i];
        if(Math.abs(B.x-K.x)<K.w/2+B.r&&Math.abs(B.y-K.y)<K.h/2+B.r){
          var ox=(K.w/2+B.r)-Math.abs(B.x-K.x),oy=(K.h/2+B.r)-Math.abs(B.y-K.y);
          if(ox<oy){B.vx=-B.vx;B.x+=(B.x<K.x?-ox:ox);}else{B.vy=-B.vy;B.y+=(B.y<K.y?-oy:oy);}
          K.hp--;K.f=1;comboHits++;
          G.sfx('hit',1+Math.min(0.8,comboHits*0.07));
          if(K.hp<=0){
            var gain=10*stage+comboHits*2;
            G.score+=gain;
            G.burst(K.x,K.y,12,[K.c,'#fff'],{spd:200,life:0.5,size:4,g:420,square:true});
            if(Math.random()<0.13)drops.push({x:K.x,y:K.y,t:['wide','multi','slow','life'][G.rint(0,3)],p:0});
            bricks.splice(i,1);
            if(comboHits>=6&&comboHits%3===0)G.toast('FEVER x'+comboHits,'#ffd75e',G.H*0.35,true);
          }else{
            G.burst(K.x,K.y,5,['#fff'],{spd:120,life:0.3,size:3,g:400});
          }
          break;
        }
      }
    }
    B.tr.push({x:B.x,y:B.y,l:0.16});
    for(var t=B.tr.length-1;t>=0;t--){B.tr[t].l-=dt;if(B.tr[t].l<=0)B.tr.splice(t,1);}
    if(B.y>G.H+20){
      balls.splice(b,1);
      if(balls.length===0){
        life--;G.shake(10);G.sfx('bad');
        if(life<=0){G.over('ステージ'+stage+'まで到達');return;}
        stuck=true;wideT=0;slowT=0;
        G.toast('残り '+life,'#ff5f7e',G.H*0.5);
      }
    }
  }
  // ドロップ
  for(var d2=drops.length-1;d2>=0;d2--){
    var D=drops[d2];D.y+=170*dt;D.p+=dt*6;
    if(D.y>G.H+20){drops.splice(d2,1);continue;}
    if(Math.abs(D.x-pad.x)<pw/2+12&&Math.abs(D.y-py)<20){
      drops.splice(d2,1);G.sfx('power');G.score+=25;
      if(D.t==='wide'){wideT=12;G.toast('WIDE パドル拡大','#38bdf8',G.H*0.55);}
      if(D.t==='slow'){slowT=9;G.toast('SLOW 減速','#a78bfa',G.H*0.55);}
      if(D.t==='life'){life++;G.toast('1UP','#4ade80',G.H*0.55);}
      if(D.t==='multi'){
        var base=balls[0];
        if(base){for(var m=0;m<2;m++)newBall(base.x,base.y,-Math.PI/2+G.rnd(-1.1,1.1),speedNow());}
        G.toast('MULTI BALL','#ffd75e',G.H*0.55);
      }
      G.burst(pad.x,py,14,['#fff','#ffd75e'],{spd:190,life:0.5,size:4,g:300});
    }
  }
  // ステージクリア
  if(bricks.length===0){
    stage++;G.score+=120;stuck=true;balls=[];drops=[];wideT=0;slowT=0;
    G.sfx('win');G.toast('STAGE '+stage,'#38f0d0',G.H*0.42,true);msgT=1.6;
    build();
  }
},

draw:function(c){
  var py=G.H-96,pw=padW();
  // 背景
  var gr=c.createLinearGradient(0,0,0,G.H);
  gr.addColorStop(0,'#141033');gr.addColorStop(1,'#07071a');
  c.fillStyle=gr;c.fillRect(0,0,G.W,G.H);
  c.globalAlpha=0.15;c.strokeStyle='#6a7bff';c.lineWidth=1;
  for(var g=0;g<10;g++){c.beginPath();c.moveTo(0,70+g*((G.H-70)/10));c.lineTo(G.W,70+g*((G.H-70)/10));c.stroke();}
  c.globalAlpha=1;
  // 上枠
  c.fillStyle='rgba(255,255,255,0.12)';c.fillRect(0,68,G.W,2);
  // ブロック
  for(var i=0;i<bricks.length;i++){
    var K=bricks[i];K.f=Math.max(0,K.f-0.06);
    c.fillStyle=K.c;G.rr(c,K.x-K.w/2,K.y-K.h/2,K.w,K.h,5);c.fill();
    c.fillStyle='rgba(255,255,255,0.32)';c.fillRect(K.x-K.w/2+3,K.y-K.h/2+3,K.w-6,4);
    if(K.hp>1){
      c.fillStyle='rgba(0,0,0,0.35)';G.rr(c,K.x-K.w/2,K.y-K.h/2,K.w,K.h,5);c.fill();
      G.text(c,String(K.hp),K.x,K.y,12,'#fff','center','900');
    }
    if(K.f>0){c.globalAlpha=K.f;c.fillStyle='#fff';G.rr(c,K.x-K.w/2,K.y-K.h/2,K.w,K.h,5);c.fill();c.globalAlpha=1;}
  }
  // ドロップ
  for(var d=0;d<drops.length;d++){
    var D=drops[d];
    var col=D.t==='wide'?'#38bdf8':D.t==='multi'?'#ffd75e':D.t==='slow'?'#a78bfa':'#4ade80';
    c.save();c.translate(D.x,D.y);c.rotate(Math.sin(D.p)*0.4);
    c.fillStyle=col;G.rr(c,-11,-11,22,22,6);c.fill();
    G.text(c,D.t==='wide'?'W':D.t==='multi'?'M':D.t==='slow'?'S':'♥',0,1,13,'#101024','center','900');
    c.restore();
  }
  // ボール
  for(var b=0;b<balls.length;b++){
    var B=balls[b];
    for(var t=0;t<B.tr.length;t++){c.globalAlpha=B.tr[t].l*3;c.fillStyle='#ffd75e';c.beginPath();c.arc(B.tr[t].x,B.tr[t].y,B.r*0.7,0,6.2832);c.fill();}
    c.globalAlpha=1;
    c.fillStyle='#fff';c.beginPath();c.arc(B.x,B.y,B.r,0,6.2832);c.fill();
    c.fillStyle='#ffd75e';c.beginPath();c.arc(B.x-2,B.y-2,B.r*0.5,0,6.2832);c.fill();
  }
  // パドル
  c.fillStyle=wideT>0?'#38bdf8':'#fff';
  G.rr(c,pad.x-pw/2,py-9,pw,15,8);c.fill();
  c.fillStyle='rgba(0,0,0,0.25)';G.rr(c,pad.x-pw/2+6,py-2,pw-12,5,3);c.fill();
  c.globalAlpha=0.22;c.fillStyle=wideT>0?'#38bdf8':'#fff';
  G.rr(c,pad.x-pw/2-5,py-14,pw+10,25,12);c.fill();c.globalAlpha=1;
  // 待機ボール
  if(stuck){
    c.fillStyle='#fff';c.beginPath();c.arc(pad.x,py-20,7,0,6.2832);c.fill();
    if(Math.sin(G.t*4)>0)G.text(c,'タップで発射',G.W/2,py-52,15,'rgba(255,255,255,0.85)','center','800');
  }
},

hud:function(c){
  G.text(c,'SCORE',16,20,10,'rgba(255,255,255,0.5)','left','700');
  G.text(c,String(G.score),16,42,24,'#fff','left','900');
  G.text(c,'STAGE '+stage,G.W/2,26,15,'#38f0d0','center','900');
  G.text(c,'BEST '+G.best,G.W/2,46,11,'rgba(255,255,255,0.45)','center','700');
  for(var i=0;i<Math.min(life,6);i++){
    c.fillStyle='#ff5f7e';c.beginPath();c.arc(G.W-20-i*18,30,6,0,6.2832);c.fill();
  }
  if(wideT>0){c.fillStyle='#38bdf8';G.rr(c,G.W-70,48,60*G.clamp(wideT/12,0,1),4,2);c.fill();}
  if(slowT>0){c.fillStyle='#a78bfa';G.rr(c,G.W-70,56,60*G.clamp(slowT/9,0,1),4,2);c.fill();}
}
};
})();
