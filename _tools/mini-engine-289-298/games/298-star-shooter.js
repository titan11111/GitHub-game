/* 298 STAR SHOOTER — 指でよけて撃つ、オート連射シューター */
window.G=window.G||{};
window.GAME=(function(){
var P,pb,eb,ens,items,boss,life,inv,lvl,shotT,spawnT,waveT,stars,bossCount,killT,dragging,tx,ty;

function shoot(){
  var n=Math.min(4,lvl);
  var sp=760;
  if(n===1)pb.push({x:P.x,y:P.y-14,vx:0,vy:-sp,p:1});
  else if(n===2){pb.push({x:P.x-8,y:P.y-12,vx:0,vy:-sp,p:1});pb.push({x:P.x+8,y:P.y-12,vx:0,vy:-sp,p:1});}
  else{
    pb.push({x:P.x,y:P.y-16,vx:0,vy:-sp,p:1.4});
    pb.push({x:P.x-11,y:P.y-8,vx:-130,vy:-sp*0.94,p:1});
    pb.push({x:P.x+11,y:P.y-8,vx:130,vy:-sp*0.94,p:1});
    if(n>=4){pb.push({x:P.x-16,y:P.y,vx:-290,vy:-sp*0.8,p:1});pb.push({x:P.x+16,y:P.y,vx:290,vy:-sp*0.8,p:1});}
  }
  G.sfx('tick',1.6);
}
function spawnEnemy(){
  var r=Math.random(),dif=Math.min(1,waveT/60);
  if(r<0.5)ens.push({x:G.rnd(30,G.W-30),y:-24,vx:0,vy:100+dif*80,hp:2,t:0,type:0,fire:G.rnd(0.8,2.2)});
  else if(r<0.82)ens.push({x:G.rnd(40,G.W-40),y:-24,vx:120,vy:70+dif*50,hp:3,t:0,type:1,fire:G.rnd(1.0,2.4)});
  else ens.push({x:G.rnd(50,G.W-50),y:-24,vx:0,vy:52,hp:6,t:0,type:2,fire:0.9});
}
function spawnBoss(){
  bossCount++;
  boss={x:G.W/2,y:-70,hp:60+bossCount*40,max:60+bossCount*40,t:0,ph:0,dir:1,enter:true};
  G.toast('WARNING! ボス '+bossCount,'#ff5f7e',G.H*0.34,true);
  G.sfx('bad');
}
function hurt(){
  if(inv>0)return;
  life--;inv=1.8;lvl=Math.max(1,lvl-1);
  G.sfx('boom');G.shake(14);
  G.burst(P.x,P.y,26,['#ff8a3d','#fff','#ffd75e'],{spd:280,life:0.7,size:5,g:0});
  if(life<=0)G.over('撃墜されるまで '+Math.floor(waveT)+'秒');
}

return {
no:298,key:'star-shooter',title:'STAR SHOOTER',sub:'指でよけるだけ。弾は勝手に出る',
how:['画面をなぞって自機を移動（弾は自動発射）','Pを取るとショット強化','30秒ごとにボスが来る'],
bg:'#04060f',ink:'#fff',accent:'#38bdf8',scoreLabel:'SCORE',

reset:function(){
  P={x:G.W/2,y:G.H-150,r:11};tx=P.x;ty=P.y;
  pb=[];eb=[];ens=[];items=[];boss=null;life=3;inv=1.2;lvl=1;shotT=0;spawnT=0.7;waveT=0;bossCount=0;killT=0;dragging=false;
  stars=[];
  for(var i=0;i<70;i++)stars.push({x:Math.random()*G.W,y:Math.random()*G.H,z:Math.random()*0.8+0.2,s:Math.random()*1.8+0.6});
  G.score=0;
},

down:function(x,y){dragging=true;tx=x;ty=y-46;},
move:function(x,y){if(dragging){tx=x;ty=y-46;}},
up:function(){dragging=false;},

update:function(dt){
  waveT+=dt;
  if(inv>0)inv-=dt;
  // 自機
  tx=G.clamp(tx,14,G.W-14);ty=G.clamp(ty,70,G.H-30);
  P.x=G.lerp(P.x,tx,Math.min(1,dt*16));
  P.y=G.lerp(P.y,ty,Math.min(1,dt*16));
  // 発射
  shotT-=dt;
  if(shotT<=0){shotT=Math.max(0.075,0.14-lvl*0.012);shoot();}
  // 星
  for(var s=0;s<stars.length;s++){var S=stars[s];S.y+=(60+S.z*220)*dt;if(S.y>G.H){S.y=-4;S.x=Math.random()*G.W;}}
  // 敵出現
  if(!boss){
    spawnT-=dt;
    if(spawnT<=0){spawnT=Math.max(0.32,0.95-waveT*0.012);spawnEnemy();}
    if(waveT>28*(bossCount+1)){spawnBoss();}
  }
  // 自弾
  for(var i=pb.length-1;i>=0;i--){
    var b=pb[i];b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.y<-20||b.x<-20||b.x>G.W+20){pb.splice(i,1);continue;}
    var hitSomething=false;
    for(var j=ens.length-1;j>=0;j--){
      var e=ens[j];
      if(Math.abs(b.x-e.x)<16&&Math.abs(b.y-e.y)<16){
        e.hp-=b.p;hitSomething=true;
        G.burst(b.x,b.y,3,['#ffd75e'],{spd:90,life:0.2,size:2,g:0});
        if(e.hp<=0){
          G.score+=(e.type===2?150:60);
          G.sfx('boom');G.shake(3);
          G.burst(e.x,e.y,16,['#ff8a3d','#ffd75e','#fff'],{spd:220,life:0.5,size:4,g:0});
          if(Math.random()<0.14)items.push({x:e.x,y:e.y,vy:110,p:0});
          ens.splice(j,1);
        }else{G.sfx('tick',2.2);}
        break;
      }
    }
    if(!hitSomething&&boss&&!boss.enter&&Math.abs(b.x-boss.x)<52&&Math.abs(b.y-boss.y)<34){
      boss.hp-=b.p;hitSomething=true;
      G.burst(b.x,b.y,3,['#ffd75e'],{spd:90,life:0.2,size:2,g:0});
      if(boss.hp<=0){
        G.score+=1200*bossCount;
        G.sfx('win');G.shake(16);
        for(var k=0;k<5;k++)G.burst(boss.x+G.rnd(-50,50),boss.y+G.rnd(-24,24),18,['#ff5f7e','#ffd75e','#fff'],{spd:260,life:0.8,size:5,g:0});
        G.toast('ボス撃破！ +'+(1200*bossCount),'#ffd75e',G.H*0.34,true);
        items.push({x:boss.x,y:boss.y,vy:90,p:0});
        items.push({x:boss.x-40,y:boss.y,vy:90,p:0});
        boss=null;eb.length=0;
      }
    }
    if(hitSomething)pb.splice(i,1);
  }
  // 敵
  for(var m=ens.length-1;m>=0;m--){
    var E=ens[m];E.t+=dt;
    if(E.type===1){E.x+=E.vx*dt;if(E.x<26||E.x>G.W-26)E.vx*=-1;}
    if(E.type===2&&E.y>110)E.vy=0;
    E.y+=E.vy*dt;
    E.fire-=dt;
    if(E.fire<=0&&E.y>0){
      E.fire=(E.type===2?1.1:1.8)+Math.random()*0.8;
      var ang=Math.atan2(P.y-E.y,P.x-E.x);
      if(E.type===2){for(var q=-1;q<=1;q++)eb.push({x:E.x,y:E.y,vx:Math.cos(ang+q*0.28)*220,vy:Math.sin(ang+q*0.28)*220,r:5});}
      else eb.push({x:E.x,y:E.y,vx:Math.cos(ang)*230,vy:Math.sin(ang)*230,r:5});
      G.sfx('blip',0.6);
    }
    if(E.y>G.H+30){ens.splice(m,1);continue;}
    if(inv<=0&&G.dist(P.x,P.y,E.x,E.y)<P.r+13){hurt();ens.splice(m,1);}
  }
  // ボス
  if(boss){
    boss.t+=dt;
    if(boss.enter){boss.y+=90*dt;if(boss.y>110){boss.y=110;boss.enter=false;}}
    else{
      boss.x+=boss.dir*(70+bossCount*12)*dt;
      if(boss.x<64){boss.x=64;boss.dir=1;}
      if(boss.x>G.W-64){boss.x=G.W-64;boss.dir=-1;}
      boss.ph-=dt;
      if(boss.ph<=0){
        boss.ph=Math.max(0.5,1.15-bossCount*0.12);
        var mode=(boss.t*0.7|0)%3;
        if(mode===0){
          var a0=Math.atan2(P.y-boss.y,P.x-boss.x);
          for(var w=-2;w<=2;w++)eb.push({x:boss.x,y:boss.y+20,vx:Math.cos(a0+w*0.22)*250,vy:Math.sin(a0+w*0.22)*250,r:6});
        }else if(mode===1){
          for(var w2=0;w2<12;w2++){var a=w2/12*6.2832+boss.t;eb.push({x:boss.x,y:boss.y,vx:Math.cos(a)*180,vy:Math.sin(a)*180,r:6});}
        }else{
          for(var w3=0;w3<4;w3++)eb.push({x:G.rnd(20,G.W-20),y:boss.y+10,vx:0,vy:280,r:6});
        }
        G.sfx('blip',0.5);
      }
    }
    if(inv<=0&&Math.abs(P.x-boss.x)<50&&Math.abs(P.y-boss.y)<32)hurt();
  }
  // 敵弾
  for(var n=eb.length-1;n>=0;n--){
    var B=eb[n];B.x+=B.vx*dt;B.y+=B.vy*dt;
    if(B.y>G.H+20||B.y<-20||B.x<-20||B.x>G.W+20){eb.splice(n,1);continue;}
    if(inv<=0&&G.dist(P.x,P.y,B.x,B.y)<P.r+B.r-2){eb.splice(n,1);hurt();}
  }
  // アイテム
  for(var p=items.length-1;p>=0;p--){
    var I=items[p];I.y+=I.vy*dt;I.p+=dt*6;
    if(I.y>G.H+20){items.splice(p,1);continue;}
    if(G.dist(P.x,P.y,I.x,I.y)<24){
      items.splice(p,1);
      if(lvl<4){lvl++;G.toast('POWER UP Lv.'+lvl,'#38bdf8',G.H*0.55);}
      else{G.score+=300;G.toast('+300','#ffd75e',G.H*0.55);}
      G.sfx('power');
      G.burst(P.x,P.y,12,['#38bdf8','#fff'],{spd:170,life:0.4,size:4,g:0});
    }
  }
  G.score+=Math.floor(dt*12);
},

draw:function(c){
  c.fillStyle='#04060f';c.fillRect(0,0,G.W,G.H);
  for(var s=0;s<stars.length;s++){
    var S=stars[s];c.globalAlpha=0.25+S.z*0.7;c.fillStyle='#cfe6ff';
    c.fillRect(S.x,S.y,S.s,S.s*2.4);
  }
  c.globalAlpha=1;
  // アイテム
  for(var p=0;p<items.length;p++){
    var I=items[p];
    c.save();c.translate(I.x,I.y);c.rotate(Math.sin(I.p)*0.3);
    c.fillStyle='#38bdf8';G.rr(c,-13,-13,26,26,7);c.fill();
    G.text(c,'P',0,1,15,'#04233a','center','900');
    c.restore();
  }
  // 敵
  for(var m=0;m<ens.length;m++){
    var E=ens[m];
    c.save();c.translate(E.x,E.y);
    if(E.type===0){
      c.fillStyle='#ff8a3d';c.beginPath();c.moveTo(0,14);c.lineTo(-13,-11);c.lineTo(13,-11);c.closePath();c.fill();
      c.fillStyle='#ffd0a0';c.fillRect(-4,-6,8,6);
    }else if(E.type===1){
      c.fillStyle='#c084fc';G.rr(c,-14,-10,28,20,6);c.fill();
      c.fillStyle='#f3e8ff';c.beginPath();c.arc(0,2,5,0,6.2832);c.fill();
    }else{
      c.fillStyle='#94a3b8';G.rr(c,-18,-13,36,26,5);c.fill();
      c.fillStyle='#475569';c.fillRect(-13,-8,26,6);
      c.fillStyle='#ff5f7e';c.beginPath();c.arc(0,6,5,0,6.2832);c.fill();
    }
    c.restore();
  }
  // ボス
  if(boss){
    c.save();c.translate(boss.x,boss.y);
    c.fillStyle='#7f1d3a';G.rr(c,-56,-30,112,58,12);c.fill();
    c.fillStyle='#ff5f7e';G.rr(c,-44,-22,88,26,8);c.fill();
    c.fillStyle='#ffd75e';
    c.beginPath();c.arc(-24,10,7,0,6.2832);c.fill();
    c.beginPath();c.arc(24,10,7,0,6.2832);c.fill();
    c.fillStyle='#fff';c.beginPath();c.arc(0,6,10,0,6.2832);c.fill();
    c.fillStyle='#ff5f7e';c.beginPath();c.arc(0,6,5,0,6.2832);c.fill();
    c.restore();
    // HPバー
    var w=G.W-40,r=G.clamp(boss.hp/boss.max,0,1);
    c.fillStyle='rgba(255,255,255,0.15)';G.rr(c,20,58,w,8,4);c.fill();
    c.fillStyle='#ff5f7e';G.rr(c,20,58,Math.max(3,w*r),8,4);c.fill();
    G.text(c,'BOSS '+bossCount,20,48,11,'#ff9ec4','left','800');
  }
  // 自弾
  for(var i=0;i<pb.length;i++){
    var b=pb[i];
    c.fillStyle='#7dd3fc';G.rr(c,b.x-2.5,b.y-9,5,15,2.5);c.fill();
    c.fillStyle='#fff';G.rr(c,b.x-1.2,b.y-7,2.4,8,1.2);c.fill();
  }
  // 敵弾
  for(var n=0;n<eb.length;n++){
    var B=eb[n];
    c.fillStyle='rgba(255,95,126,0.35)';c.beginPath();c.arc(B.x,B.y,B.r+3.5,0,6.2832);c.fill();
    c.fillStyle='#ff5f7e';c.beginPath();c.arc(B.x,B.y,B.r,0,6.2832);c.fill();
    c.fillStyle='#fff';c.beginPath();c.arc(B.x,B.y-1,B.r*0.42,0,6.2832);c.fill();
  }
  // 自機
  var blink=(inv>0&&Math.floor(G.t*18)%2===0);
  if(!blink){
    c.save();c.translate(P.x,P.y);
    c.fillStyle='#38bdf8';
    c.beginPath();c.moveTo(0,-17);c.lineTo(-13,12);c.lineTo(0,6);c.lineTo(13,12);c.closePath();c.fill();
    c.fillStyle='#fff';c.beginPath();c.moveTo(0,-13);c.lineTo(-5,4);c.lineTo(5,4);c.closePath();c.fill();
    c.fillStyle='#ffd75e';
    var fl=6+Math.random()*7;
    c.beginPath();c.moveTo(-4,10);c.lineTo(0,10+fl);c.lineTo(4,10);c.closePath();c.fill();
    c.restore();
    if(inv>0){c.globalAlpha=0.35;c.strokeStyle='#38bdf8';c.lineWidth=2;c.beginPath();c.arc(P.x,P.y,22,0,6.2832);c.stroke();c.globalAlpha=1;}
  }
  // 指ガイド
  if(dragging){
    c.globalAlpha=0.2;c.strokeStyle='#fff';c.lineWidth=1.5;
    c.beginPath();c.arc(P.x,P.y+46,20,0,6.2832);c.stroke();c.globalAlpha=1;
  }
},

hud:function(c){
  G.text(c,'SCORE',14,18,10,'rgba(255,255,255,0.5)','left','700');
  G.text(c,String(G.score),14,38,21,'#fff','left','900');
  G.text(c,'BEST '+G.best,G.W-14,18,11,'rgba(255,255,255,0.45)','right','700');
  for(var l=0;l<life;l++){
    c.fillStyle='#38bdf8';
    c.beginPath();c.moveTo(G.W-18-l*20,32);c.lineTo(G.W-25-l*20,44);c.lineTo(G.W-11-l*20,44);c.closePath();c.fill();
  }
  G.text(c,'SHOT Lv.'+lvl,14,56,12,'#7dd3fc','left','800');
  if(G.runT<4&&Math.sin(G.t*5)>0)G.text(c,'画面をなぞって移動',G.W/2,G.H-40,15,'rgba(255,255,255,0.7)','center','800');
}
};
})();
