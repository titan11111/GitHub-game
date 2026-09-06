/* 297 SUSHI CATCH — 注文どおりに受け止めろ */
window.G=window.G||{};
window.GAME=(function(){
var plate,items,order,life,timeLeft,combo,spawnT,level,orderDone,flash,plateFx,steam;
var TYPES=[
 {n:'まぐろ',c:'#e0455e',t:'#fff'},
 {n:'サーモン',c:'#ff9a4d',t:'#5a2a00'},
 {n:'たまご',c:'#ffd75e',t:'#6a4a00'},
 {n:'いか',c:'#eef2f7',t:'#3a4a60'},
 {n:'えび',c:'#ff8d8d',t:'#6a0f0f'},
 {n:'いくら',c:'#ff6a2b',t:'#fff'}
];
function plateY(){return G.H-104;}
function newOrder(){
  var kinds=Math.min(3,1+Math.floor(level/2));
  var pool=[0,1,2,3,4,5];
  order=[];
  for(var i=0;i<kinds;i++){
    var k=pool.splice(G.rint(0,pool.length-1),1)[0];
    order.push({k:k,need:G.rint(2,2+Math.min(3,level)),got:0});
  }
  orderDone=false;
}
function needs(k){
  for(var i=0;i<order.length;i++)if(order[i].k===k&&order[i].got<order[i].need)return order[i];
  return null;
}
function inOrder(k){
  for(var i=0;i<order.length;i++)if(order[i].k===k)return true;
  return false;
}

return {
no:297,key:'sushi-catch',title:'SUSHI CATCH',sub:'注文どおりのネタだけを皿で受けろ',
how:['画面をなぞって皿を左右に動かす','上の注文にあるネタだけ受ける','注文外・わさび爆弾を受けるとミス'],
bg:'#12202b',ink:'#fff',accent:'#ffd75e',scoreLabel:'SCORE',

reset:function(){
  plate={x:G.W/2,w:104,tilt:0};
  items=[];life=3;timeLeft=60;combo=0;spawnT=0.6;level=1;flash=0;plateFx=0;
  steam=[];G.score=0;newOrder();
},

move:function(x){plate.x=G.clamp(x,plate.w/2,G.W-plate.w/2);},
down:function(x){this.move(x);},

update:function(dt){
  timeLeft-=dt;
  if(timeLeft<=0){timeLeft=0;G.over('注文'+(level-1)+'件を完了',true);return;}
  flash=Math.max(0,flash-dt*3);
  plateFx=Math.max(0,plateFx-dt*3);
  spawnT-=dt;
  if(spawnT<=0){
    spawnT=Math.max(0.24,0.72-level*0.035);
    var bomb=Math.random()<Math.min(0.2,0.06+level*0.012);
    var k;
    if(!bomb){
      // 注文品が出やすいように寄せる
      if(Math.random()<0.55){var o=order[G.rint(0,order.length-1)];k=o.k;}
      else k=G.rint(0,TYPES.length-1);
    }
    items.push({x:G.rnd(28,G.W-28),y:-30,vy:G.rnd(150,190)+level*9,k:bomb?-1:k,r:G.rnd(-0.3,0.3),vr:G.rnd(-1.6,1.6)});
  }
  var py=plateY();
  for(var i=items.length-1;i>=0;i--){
    var it=items[i];
    it.vy+=180*dt;it.y+=it.vy*dt;it.r+=it.vr*dt;
    if(it.y>py-16&&it.y<py+26&&Math.abs(it.x-plate.x)<plate.w/2+16){
      items.splice(i,1);plateFx=1;
      if(it.k===-1){
        life--;combo=0;G.sfx('boom');G.shake(12);flash=1;
        G.burst(it.x,py-10,22,['#4ade80','#fff'],{spd:240,life:0.6,size:5,g:600});
        G.toast('わさび！','#4ade80',G.H*0.5);
        if(life<=0){G.over('わさびでノックアウト');return;}
        continue;
      }
      var o2=needs(it.k);
      if(o2){
        o2.got++;combo++;
        var gain=100+combo*10;
        G.score+=gain;
        G.sfx('coin',1+Math.min(0.7,combo*0.05));
        G.burst(it.x,py-10,12,[TYPES[it.k].c,'#fff'],{spd:180,life:0.45,size:4,g:400});
        var all=true;
        for(var z=0;z<order.length;z++)if(order[z].got<order[z].need)all=false;
        if(all){
          G.score+=500;level++;timeLeft=Math.min(75,timeLeft+6);
          G.sfx('win');G.shake(6);
          G.toast('注文どおり！ +500 / 残り時間+6秒','#ffd75e',G.H*0.36,true);
          newOrder();
        }
      }else if(inOrder(it.k)){
        // 注文にはあるが必要数を満たしている＝余り。減点なし
        G.score+=10;G.sfx('tick');
      }else{
        life--;combo=0;G.sfx('bad');G.shake(8);flash=1;
        G.toast('注文外！','#ff5f7e',G.H*0.5);
        G.burst(it.x,py-10,10,['#ff5f7e'],{spd:170,life:0.45,size:4,g:500});
        if(life<=0){G.over('注文を間違えすぎた');return;}
      }
      continue;
    }
    if(it.y>G.H+40){
      items.splice(i,1);
      if(it.k>=0&&needs(it.k)){combo=0;}
    }
  }
},

draw:function(c){
  var py=plateY();
  var gr=c.createLinearGradient(0,0,0,G.H);
  gr.addColorStop(0,'#1b3040');gr.addColorStop(1,'#0c161e');
  c.fillStyle=gr;c.fillRect(0,0,G.W,G.H);
  // のれん
  c.fillStyle='#1d4a5c';c.fillRect(0,64,G.W,10);
  for(var n=0;n<6;n++){
    c.fillStyle=(n%2)?'#25607a':'#1d4a5c';
    c.fillRect(n*(G.W/6),74,G.W/6-3,26);
  }
  // 木目カウンター
  c.fillStyle='#3a2a1c';c.fillRect(0,G.H-72,G.W,72);
  c.fillStyle='rgba(255,255,255,0.05)';
  for(var w=0;w<7;w++)c.fillRect(0,G.H-70+w*10,G.W,3);
  // ネタ
  for(var i=0;i<items.length;i++){
    var it=items[i];
    c.save();c.translate(it.x,it.y);c.rotate(it.r);
    if(it.k===-1){
      c.fillStyle='#4ade80';c.beginPath();c.arc(0,0,17,0,6.2832);c.fill();
      c.fillStyle='#166534';G.text(c,'ワサビ',0,1,10,'#0b3a20','center','900');
      c.strokeStyle='#ff5f7e';c.lineWidth=2.5;
      c.beginPath();c.arc(0,0,22+Math.sin(G.t*10)*2,0,6.2832);c.stroke();
    }else{
      var T=TYPES[it.k];
      c.fillStyle='#fdf6ec';G.rr(c,-24,-4,48,20,7);c.fill();
      c.fillStyle='rgba(0,0,0,0.08)';G.rr(c,-24,10,48,6,3);c.fill();
      c.fillStyle=T.c;G.rr(c,-26,-16,52,16,6);c.fill();
      c.fillStyle='rgba(255,255,255,0.35)';c.fillRect(-22,-14,44,3);
      G.text(c,T.n,0,-8,11,T.t,'center','900');
      if(needs(it.k)){
        c.strokeStyle='#ffd75e';c.lineWidth=2;c.globalAlpha=0.55+0.3*Math.sin(G.t*7);
        G.rr(c,-30,-21,60,42,9);c.stroke();c.globalAlpha=1;
      }
    }
    c.restore();
  }
  // 皿
  c.save();c.translate(plate.x,py);
  var sc=1+plateFx*0.12;c.scale(sc,sc);
  c.fillStyle='rgba(0,0,0,0.3)';c.beginPath();c.ellipse(0,16,plate.w/2,9,0,0,6.2832);c.fill();
  c.fillStyle='#eef3f8';c.beginPath();c.ellipse(0,4,plate.w/2,15,0,0,6.2832);c.fill();
  c.fillStyle='#c9d6e2';c.beginPath();c.ellipse(0,0,plate.w/2,13,0,0,6.2832);c.fill();
  c.fillStyle='#f7fbff';c.beginPath();c.ellipse(0,-2,plate.w/2-8,9,0,0,6.2832);c.fill();
  c.restore();
  if(flash>0){c.globalAlpha=flash*0.3;c.fillStyle='#ff5f7e';c.fillRect(0,0,G.W,G.H);c.globalAlpha=1;}
},

hud:function(c){
  // 注文パネル
  c.fillStyle='rgba(8,16,24,0.72)';G.rr(c,10,8,G.W-20,52,12);c.fill();
  G.text(c,'注文 '+level,20,22,11,'#ffd75e','left','800');
  var x=20;
  for(var i=0;i<order.length;i++){
    var o=order[i],T=TYPES[o.k],done=o.got>=o.need;
    c.globalAlpha=done?0.4:1;
    c.fillStyle=T.c;G.rr(c,x,32,20,16,5);c.fill();
    G.text(c,T.n,x+30,40,13,done?'#7f8ea0':'#fff','left','800');
    G.text(c,o.got+'/'+o.need,x+30+T.n.length*13+6,40,13,done?'#4ade80':'#ffd75e','left','900');
    c.globalAlpha=1;
    x+=30+T.n.length*13+34;
  }
  // スコア・ライフ・時間
  G.text(c,'SCORE '+G.score,14,76,16,'#fff','left','900');
  for(var l=0;l<life;l++){c.fillStyle='#ff5f7e';c.beginPath();c.arc(G.W-20-l*20,76,7,0,6.2832);c.fill();}
  if(combo>1)G.text(c,'COMBO x'+combo,14,98,14,'#ffd75e','left','800');
  var w=G.W-28,r=G.clamp(timeLeft/60,0,1);
  c.fillStyle='rgba(255,255,255,0.15)';G.rr(c,14,G.H-16,w,7,4);c.fill();
  c.fillStyle=r<0.2?'#ff5f7e':'#38f0d0';G.rr(c,14,G.H-16,Math.max(3,w*r),7,4);c.fill();
  G.text(c,Math.ceil(timeLeft)+'秒',G.W-14,G.H-28,13,'#fff','right','800');
}
};
})();
