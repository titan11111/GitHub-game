/* 295 TOWER STACK — 止めて積む、天まで届け */
window.G=window.G||{};
window.GAME=(function(){
var stack,cur,camY,camTarget,combo,perfectFx,debris,baseW,blockH,hue,shakeUp,warn;

function speedNow(){return Math.min(430,150+stack.length*9);}
function spawn(){
  var top=stack[stack.length-1];
  var fromLeft=Math.random()<0.5;
  cur={x:fromLeft?-top.w/2-10:G.W+top.w/2+10,w:top.w,dir:fromLeft?1:-1,y:top.y-blockH,h:blockH,hue:hue};
  hue=(hue+13)%360;
}
function col(h,l){return 'hsl('+h+',72%,'+l+'%)';}

return {
no:295,key:'tower-stack',title:'TOWER STACK',sub:'止めて積むだけ。ピタリで幅が戻る',
how:['タップでブロックを止めて積む','はみ出した分は切り落とされる','ピタリ止めるとPERFECTで幅が回復'],
bg:'#0b1226',ink:'#fff',accent:'#38f0d0',scoreLabel:'HEIGHT',unit:'段',

reset:function(){
  blockH=30;baseW=Math.min(220,G.W*0.62);hue=195;
  stack=[{x:G.W/2,w:baseW,y:G.H-120,hue:hue}];
  hue=(hue+13)%360;
  camY=0;camTarget=0;combo=0;perfectFx=0;debris=[];shakeUp=0;warn=0;
  G.score=0;spawn();
},

down:function(){
  var top=stack[stack.length-1];
  var dx=cur.x-top.x;
  var over=Math.abs(dx);
  if(over>=top.w){
    // 完全に外した
    debris.push({x:cur.x,y:cur.y,w:cur.w,h:blockH,vx:cur.dir*60,vy:-40,r:0,vr:cur.dir*3,hue:cur.hue});
    G.sfx('boom');G.shake(12);
    G.over('積み上げ '+(stack.length-1)+'段');
    return;
  }
  var neww=top.w-over;
  var newx=cur.x+(dx>0?-over/2:over/2);
  if(over<4.5){
    // PERFECT
    neww=Math.min(baseW,top.w+3.5);
    newx=top.x;
    combo++;perfectFx=1;
    G.score+=10+combo*5;
    G.sfx('coin',1+Math.min(0.8,combo*0.07));
    G.burst(top.x,cur.y,16,[col(cur.hue,70),'#fff'],{spd:200,life:0.5,size:4,g:300});
    if(combo>1)G.toast('PERFECT x'+combo,'#ffd75e',G.H*0.3,combo>=3);
    G.shake(4);
  }else{
    combo=0;
    var cutX=(dx>0)?(newx+neww/2):(newx-neww/2);
    debris.push({x:cutX+(dx>0?over/2:-over/2),y:cur.y,w:over,h:blockH,vx:(dx>0?1:-1)*110,vy:-90,r:0,vr:(dx>0?1:-1)*4,hue:cur.hue});
    G.sfx('land');
    G.burst(cutX,cur.y,7,[col(cur.hue,60)],{spd:130,life:0.4,size:3,g:600,square:true});
  }
  stack.push({x:newx,w:neww,y:cur.y,hue:cur.hue});
  G.score+=5;
  camTarget=Math.max(0,(stack.length-1)*blockH-blockH*2);
  if(neww<14){G.shake(10);G.sfx('bad');G.over('土台が細くなりすぎた（'+(stack.length-1)+'段）');return;}
  spawn();
},

update:function(dt){
  camY=G.lerp(camY,camTarget,Math.min(1,dt*7));
  perfectFx=Math.max(0,perfectFx-dt*2.5);
  if(cur){
    cur.x+=cur.dir*speedNow()*dt;
    var lim=G.W/2+cur.w/2+40;
    if(cur.x>lim){cur.x=lim;cur.dir=-1;}
    if(cur.x<G.W-lim){cur.x=G.W-lim;cur.dir=1;}
  }
  for(var i=debris.length-1;i>=0;i--){
    var d=debris[i];d.vy+=1400*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.r+=d.vr*dt;
    if(d.y-camY>G.H+200)debris.splice(i,1);
  }
  var top=stack[stack.length-1];
  warn=top.w<40?1:0;
},

draw:function(c){
  var gr=c.createLinearGradient(0,0,0,G.H);
  var h0=180+Math.min(120,stack.length*2);
  gr.addColorStop(0,'hsl('+h0+',48%,16%)');gr.addColorStop(1,'#050914');
  c.fillStyle=gr;c.fillRect(0,0,G.W,G.H);
  // 星
  c.fillStyle='rgba(255,255,255,0.5)';
  for(var s=0;s<40;s++){
    var sx=(s*97)%G.W, sy=((s*131)+camY*0.12)%G.H;
    c.globalAlpha=0.2+((s*37)%50)/120;
    c.fillRect(sx,G.H-sy,2,2);
  }
  c.globalAlpha=1;
  c.save();c.translate(0,camY);
  // 破片
  for(var d=0;d<debris.length;d++){
    var D=debris[d];
    c.save();c.translate(D.x,D.y);c.rotate(D.r);
    c.fillStyle=col(D.hue,58);c.fillRect(-D.w/2,-D.h/2,D.w,D.h);
    c.fillStyle='rgba(255,255,255,0.25)';c.fillRect(-D.w/2,-D.h/2,D.w,4);
    c.restore();
  }
  // 積み上がったブロック
  var from=Math.max(0,stack.length-Math.ceil(G.H/blockH)-2);
  for(var i=from;i<stack.length;i++){
    var b=stack[i];
    var light=46+((stack.length-i)<3?14:0);
    c.fillStyle=col(b.hue,light);
    G.rr(c,b.x-b.w/2,b.y,b.w,blockH,4);c.fill();
    c.fillStyle='rgba(255,255,255,0.28)';c.fillRect(b.x-b.w/2+2,b.y+2,b.w-4,4);
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(b.x-b.w/2,b.y+blockH-4,b.w,4);
  }
  // 動くブロック
  if(cur){
    c.fillStyle=col(cur.hue,62);
    G.rr(c,cur.x-cur.w/2,cur.y,cur.w,blockH,4);c.fill();
    c.fillStyle='rgba(255,255,255,0.34)';c.fillRect(cur.x-cur.w/2+2,cur.y+2,cur.w-4,4);
    // 落下ガイド
    var top=stack[stack.length-1];
    c.globalAlpha=0.22;c.strokeStyle='#fff';c.lineWidth=1;c.setLineDash([4,6]);
    c.beginPath();c.moveTo(cur.x,cur.y+blockH);c.lineTo(cur.x,top.y);c.stroke();c.setLineDash([]);c.globalAlpha=1;
    // ピタリ帯
    c.globalAlpha=0.25+0.15*Math.sin(G.t*6);
    c.fillStyle='#38f0d0';c.fillRect(top.x-4.5,cur.y,9,blockH);c.globalAlpha=1;
  }
  if(perfectFx>0){
    var top2=stack[stack.length-1];
    c.globalAlpha=perfectFx*0.8;c.strokeStyle='#ffd75e';c.lineWidth=3;
    G.rr(c,top2.x-top2.w/2-(1-perfectFx)*22,top2.y-(1-perfectFx)*22,top2.w+(1-perfectFx)*44,blockH+(1-perfectFx)*44,8);
    c.stroke();c.globalAlpha=1;
  }
  c.restore();
},

hud:function(c){
  G.text(c,'HEIGHT',16,22,11,'rgba(255,255,255,0.5)','left','700');
  G.text(c,(stack.length-1)+'段',16,48,26,'#fff','left','900');
  G.text(c,'SCORE '+G.score,G.W-16,22,14,'#fff','right','800');
  G.text(c,'BEST '+G.best,G.W-16,44,11,'rgba(255,255,255,0.45)','right','700');
  if(combo>1){
    c.globalAlpha=0.7+0.3*Math.sin(G.t*8);
    G.text(c,'PERFECT x'+combo,G.W/2,34,19,'#ffd75e','center','900');c.globalAlpha=1;
  }
  var top=stack[stack.length-1];
  var w=(G.W-32)*G.clamp(top.w/(Math.min(220,G.W*0.62)),0,1);
  c.fillStyle='rgba(255,255,255,0.14)';G.rr(c,16,G.H-24,G.W-32,6,3);c.fill();
  c.fillStyle=warn?'#ff5f7e':'#38f0d0';G.rr(c,16,G.H-24,Math.max(3,w),6,3);c.fill();
  G.text(c,'土台の幅',16,G.H-36,10,'rgba(255,255,255,0.45)','left','700');
}
};
})();
