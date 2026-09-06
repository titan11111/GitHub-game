/* ===== TITANS MINI ENGINE v1 (self-contained / no CDN) ===== */
(function(){
'use strict';
var cv=document.getElementById('cv'), ctx=cv.getContext('2d');
var G=window.G=(window.G||{}), game=window.GAME;
var dpr=1,last=0,parts=[],toasts=[],shakeA=0,shakeT=0;
var KEY='titans_best_'+(game.key||game.title);

G.W=390;G.H=700;G.t=0;G.runT=0;G.state='title';G.score=0;G.best=0;G.overT=0;G.newBest=false;G.overMsg=null;G.overWin=false;

/* ---------- math ---------- */
G.rnd=function(a,b){return a+Math.random()*(b-a);};
G.rint=function(a,b){return (a+Math.random()*(b-a+1))|0;};
G.clamp=function(v,a,b){return v<a?a:(v>b?b:v);};
G.lerp=function(a,b,t){return a+(b-a)*t;};
G.dist=function(x,y,X,Y){var dx=X-x,dy=Y-y;return Math.sqrt(dx*dx+dy*dy);};
G.rr=function(c,x,y,w,h,r){r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();};
G.hit=function(a,b){return Math.abs(a.x-b.x)*2<a.w+b.w&&Math.abs(a.y-b.y)*2<a.h+b.h;};

/* ---------- audio ---------- */
var AC=null,mg=null;
function audioInit(){if(AC)return;try{var A=window.AudioContext||window.webkitAudioContext;if(!A)return;AC=new A();mg=AC.createGain();mg.gain.value=0.22;mg.connect(AC.destination);}catch(e){AC=null;}}
function unlock(){audioInit();if(AC&&AC.state==='suspended'){AC.resume();}bgmStart();}
var SFX={jump:['square',430,880,0.13,0.5],coin:['square',900,1700,0.09,0.4],hit:['sawtooth',260,60,0.24,0.55],
click:['square',700,700,0.05,0.35],tick:['square',1300,1300,0.03,0.2],win:['triangle',560,1120,0.35,0.5],
power:['sawtooth',180,900,0.28,0.42],land:['triangle',190,90,0.1,0.35],bad:['square',190,90,0.32,0.5],
blip:['triangle',660,990,0.07,0.35],deep:['sine',110,55,0.25,0.5]};
G.sfx=function(k,det){
 if(!AC)return;
 if(k==='boom'){noise(0.36,900,60,0.55);return;}
 if(k==='swing'){noise(0.14,2800,600,0.3);return;}
 if(k==='puff'){noise(0.2,1400,200,0.25);return;}
 var s=SFX[k];if(!s)return;var d=det||1;
 var t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
 o.type=s[0];o.frequency.setValueAtTime(s[1]*d,t);
 o.frequency.exponentialRampToValueAtTime(Math.max(30,s[2]*d),t+s[3]);
 g.gain.setValueAtTime(s[4],t);g.gain.exponentialRampToValueAtTime(0.0001,t+s[3]);
 o.connect(g);g.connect(mg);o.start(t);o.stop(t+s[3]+0.03);
};
function noise(d,f0,f1,v){
 var t=AC.currentTime,n=Math.floor(AC.sampleRate*d),b=AC.createBuffer(1,n,AC.sampleRate),ch=b.getChannelData(0);
 for(var i=0;i<n;i++)ch[i]=Math.random()*2-1;
 var s=AC.createBufferSource();s.buffer=b;
 var f=AC.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+d);
 var g=AC.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
 s.connect(f);f.connect(g);g.connect(mg);s.start(t);s.stop(t+d+0.02);
}

/* ---------- BGM（音声ファイル0本／WebAudioで4小節ループを合成） ---------- */
var bgmSrc=null,bgmGain=null,bgmBuf=null;
function noteInto(L,R,start,dur,freq,type,vol,pan){
  var sr=AC.sampleRate,n=Math.min(Math.floor(dur*sr),L.length-start);
  if(n<=0||start<0)return;
  var ph=0,inc=freq/sr;
  for(var i=0;i<n;i++){
    var t=i/n;
    var env=Math.exp(-t*(type==='bass'?3.2:(type==='kick'?9:5.5)));
    var s;
    ph+=inc;var p=ph%1;
    if(type==='bass')s=(p<0.5?1:-1)*0.55+Math.sin(p*6.2832)*0.45;
    else if(type==='arp')s=(Math.abs(p*4-2)-1);
    else if(type==='kick'){var f=freq*Math.pow(0.16,t);ph+=(f-freq)/sr;s=Math.sin(ph*6.2832);}
    else if(type==='hat')s=(Math.random()*2-1)*(t<0.35?1:0);
    else s=Math.sin(p*6.2832);
    var v=s*env*vol;
    var pl=(1-(pan||0))*0.5+0.5,pr=1-pl+0.5;
    L[start+i]+=v*Math.min(1,pl);R[start+i]+=v*Math.min(1,pr);
  }
}
function buildBGM(){
  var cfg=window.BGMCFG||{};
  var bpm=cfg.bpm||120,bars=4,sr=AC.sampleRate,spb=60/bpm;
  var len=Math.ceil(bars*4*spb*sr);
  var buf=AC.createBuffer(2,len,sr);
  var L=buf.getChannelData(0),R=buf.getChannelData(1);
  var root=cfg.root||55,prog=cfg.prog||[0,8,3,10],chord=cfg.major?[0,4,7,12]:[0,3,7,12];
  var sixteenth=spb/4;
  for(var bar=0;bar<bars;bar++){
    var off=prog[bar%prog.length];
    var f0=root*Math.pow(2,off/12);
    for(var st=0;st<16;st++){
      var t=(bar*16+st)*sixteenth;
      var s0=Math.floor(t*sr);
      if(cfg.bass!==false&&st%2===0)noteInto(L,R,s0,sixteenth*1.9,f0,'bass',0.16,0);
      if(cfg.arp!==false){
        var deg=chord[(st+bar)%chord.length];
        noteInto(L,R,s0,sixteenth*1.6,f0*4*Math.pow(2,deg/12),'arp',0.052,((st%4)-1.5)/3);
      }
      if(cfg.drum!==false){
        if(st===0||st===8)noteInto(L,R,s0,spb*0.5,110,'kick',0.30,0);
        if(st===4||st===12)noteInto(L,R,s0,0.09,0,'hat',0.10,0.2);
        if(st%2===1)noteInto(L,R,s0,0.035,0,'hat',0.035,-0.2);
      }
    }
  }
  return buf;
}
function bgmStart(){
  if(!AC||bgmSrc)return;
  try{
    bgmGain=AC.createGain();bgmGain.gain.value=0.0;bgmGain.connect(mg);
    bgmSrc=AC.createBufferSource();
    if(!bgmBuf)bgmBuf=buildBGM();
    bgmSrc.buffer=bgmBuf;
    bgmSrc.loop=true;
    bgmSrc.loopStart=0;
    bgmSrc.loopEnd=bgmSrc.buffer.duration;
    bgmSrc.connect(bgmGain);
    bgmSrc.start(0);
  }catch(e){bgmSrc=null;}
}
G.bgmLevel=function(v){
  if(!bgmGain||!AC)return;
  try{bgmGain.gain.linearRampToValueAtTime(v,AC.currentTime+0.35);}catch(e){}
};

/* ---------- fx ---------- */
G.burst=function(x,y,n,col,o){
 o=o||{};
 for(var i=0;i<n;i++){
  var a=(o.dir==null)?Math.random()*6.2832:o.dir+(Math.random()-0.5)*(o.spread||1.4);
  var sp=(o.spd||170)*(0.35+Math.random());
  var c=(typeof col==='string')?col:col[(Math.random()*col.length)|0];
  var l=(o.life||0.6)*(0.6+Math.random()*0.8);
  parts.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,l:l,m:l,c:c,s:(o.size||4)*(0.6+Math.random()*0.8),g:(o.g==null?520:o.g),q:!!o.square});
 }
};
G.shake=function(a){if(a>shakeA)shakeA=a;shakeT=0.32;};
G.toast=function(txt,col,y,big){toasts.push({t:txt,c:col||'#fff',y:(y==null?G.H*0.4:y),l:0.9,m:0.9,b:!!big});};
G.over=function(msg,win){
 if(G.state!=='play')return;
 G.state='over';G.overT=0;G.overMsg=msg||null;G.overWin=!!win;G.newBest=false;
 var s=Math.floor(G.score);
 if(s>G.best){G.best=s;G.newBest=true;try{localStorage.setItem(KEY,String(s));}catch(e){}}
 G.sfx(win?'win':'bad');G.shake(win?6:12);G.bgmLevel(0.28);
};

/* ---------- boot ---------- */
try{G.best=parseInt(localStorage.getItem(KEY)||'0',10)||0;}catch(e){G.best=0;}
function resize(){
 var r=cv.getBoundingClientRect();
 dpr=Math.min(window.devicePixelRatio||1,2.5);
 cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.height*dpr));
 G.W=r.width;G.H=r.height;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 if(game.resize)game.resize();
}
window.addEventListener('resize',resize);
window.addEventListener('orientationchange',function(){setTimeout(resize,120);});

function bgmRestart(){
 if(!AC)return;
 if(bgmSrc){try{bgmSrc.stop();}catch(e){}bgmSrc=null;}
 bgmStart();
}
function start(){
 bgmRestart();G.bgmLevel(0.85);
 G.state='play';G.score=0;G.runT=0;parts.length=0;toasts.length=0;
 game.reset();G.sfx('click');
}
G.restart=start;

/* ---------- input ---------- */
function loc(cx,cy){var r=cv.getBoundingClientRect();return[cx-r.left,cy-r.top];}
function down(x,y){
 unlock();
 if(G.state==='title'){start();return;}
 if(G.state==='over'){if(G.overT>0.55)start();return;}
 if(game.down)game.down(x,y);
}
function move(x,y){if(G.state==='play'&&game.move)game.move(x,y);}
function up(x,y){if(G.state==='play'&&game.up)game.up(x,y);}
var touched=false;
cv.addEventListener('touchstart',function(e){e.preventDefault();touched=true;for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i],p=loc(t.clientX,t.clientY);down(p[0],p[1]);}},{passive:false});
cv.addEventListener('touchmove',function(e){e.preventDefault();var t=e.changedTouches[0],p=loc(t.clientX,t.clientY);move(p[0],p[1]);},{passive:false});
cv.addEventListener('touchend',function(e){e.preventDefault();var t=e.changedTouches[0],p=loc(t.clientX,t.clientY);up(p[0],p[1]);},{passive:false});
cv.addEventListener('touchcancel',function(e){e.preventDefault();up(0,0);},{passive:false});
cv.addEventListener('mousedown',function(e){if(touched)return;var p=loc(e.clientX,e.clientY);down(p[0],p[1]);});
window.addEventListener('mousemove',function(e){if(touched)return;var p=loc(e.clientX,e.clientY);move(p[0],p[1]);});
window.addEventListener('mouseup',function(e){if(touched)return;var p=loc(e.clientX,e.clientY);up(p[0],p[1]);});
window.addEventListener('keydown',function(e){
 if(e.code==='Space'||e.code==='Enter'||e.code==='ArrowUp'){e.preventDefault();down(G.W/2,G.H/2);}
 if(game.key2&&G.state==='play')game.key2(e.code,true);
});
window.addEventListener('keyup',function(e){
 if(e.code==='Space'||e.code==='Enter'||e.code==='ArrowUp'){e.preventDefault();up(G.W/2,G.H/2);}
 if(game.key2&&G.state==='play')game.key2(e.code,false);
});
document.addEventListener('gesturestart',function(e){e.preventDefault();});
document.addEventListener('dblclick',function(e){e.preventDefault();});

/* ---------- render helpers ---------- */
function fitText(c,txt,max,size,weight){
 var s=size;
 do{c.font=(weight||'800')+' '+s+'px '+FONT;s-=1;}while(c.measureText(txt).width>max&&s>10);
 return s;
}
var FONT='"Hiragino Kaku Gothic ProN","Hiragino Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
G.FONT=FONT;
G.text=function(c,txt,x,y,size,col,align,weight){
 c.font=(weight||'700')+' '+size+'px '+FONT;c.fillStyle=col;c.textAlign=align||'left';c.textBaseline='middle';
 c.fillText(txt,x,y);
};

function drawOverlayBase(){
 var c=ctx;
 c.fillStyle='rgba(4,6,16,0.72)';c.fillRect(0,0,G.W,G.H);
}
function drawTitle(){
 var c=ctx,cx=G.W/2;
 drawOverlayBase();
 var pulse=0.5+0.5*Math.sin(G.t*3);
 // badge
 c.save();
 var ty=G.H*0.30;
 G.text(c,'No.'+game.no,cx,ty-64,15,game.accent,'center','800');
 var s=fitText(c,game.title,G.W-56,42);
 G.text(c,game.title,cx,ty,s,game.ink||'#fff','center','900');
 G.text(c,game.sub,cx,ty+38,15,'rgba(255,255,255,0.72)','center','600');
 // how-to card
 var by=G.H*0.47,bh=26*game.how.length+30;
 c.fillStyle='rgba(255,255,255,0.07)';G.rr(c,26,by,G.W-52,bh,14);c.fill();
 c.strokeStyle='rgba(255,255,255,0.16)';c.lineWidth=1;c.stroke();
 for(var i=0;i<game.how.length;i++){
  G.text(c,'▶',44,by+26+i*26,13,game.accent,'left','800');
  G.text(c,game.how[i],64,by+26+i*26,14,'rgba(255,255,255,0.9)','left','600');
 }
 // start
 var byy=by+bh+56;
 c.globalAlpha=0.55+0.45*pulse;
 c.fillStyle=game.accent;G.rr(c,cx-110,byy-26,220,52,26);c.fill();
 G.text(c,'タップでスタート',cx,byy,17,'#06111a','center','900');
 c.globalAlpha=1;
 if(G.best>0)G.text(c,'ベスト '+G.best+(game.unit||''),cx,byy+50,14,'rgba(255,255,255,0.65)','center','700');
 c.restore();
}
function drawOver(){
 var c=ctx,cx=G.W/2;
 drawOverlayBase();
 var y=G.H*0.34;
 var head=G.overWin?'CLEAR!':'GAME OVER';
 G.text(c,head,cx,y,38,G.overWin?'#ffd75e':'#ff5f7e','center','900');
 if(G.overMsg)G.text(c,G.overMsg,cx,y+34,15,'rgba(255,255,255,0.8)','center','600');
 G.text(c,(game.scoreLabel||'SCORE'),cx,y+82,14,'rgba(255,255,255,0.6)','center','700');
 G.text(c,Math.floor(G.score)+(game.unit||''),cx,y+120,46,'#fff','center','900');
 if(G.newBest){
  var p=0.5+0.5*Math.sin(G.t*8);
  c.globalAlpha=0.6+0.4*p;
  G.text(c,'★ ハイスコア更新 ★',cx,y+160,17,'#ffd75e','center','900');
  c.globalAlpha=1;
 }else{
  G.text(c,'ベスト '+G.best+(game.unit||''),cx,y+160,15,'rgba(255,255,255,0.6)','center','700');
 }
 if(G.overT>0.55){
  var pulse=0.5+0.5*Math.sin(G.t*3);
  c.globalAlpha=0.55+0.45*pulse;
  c.fillStyle=game.accent;G.rr(c,cx-104,y+200,208,50,25);c.fill();
  G.text(c,'タップでリトライ',cx,y+225,16,'#06111a','center','900');
  c.globalAlpha=1;
 }
}
function drawHUD(){
 var c=ctx;
 if(game.hud){game.hud(c);return;}
 G.text(c,(game.scoreLabel||'SCORE'),16,22,11,'rgba(255,255,255,0.5)','left','700');
 G.text(c,String(Math.floor(G.score))+(game.unit||''),16,44,26,'#fff','left','900');
 G.text(c,'BEST '+G.best,G.W-16,24,12,'rgba(255,255,255,0.45)','right','700');
}

/* ---------- loop ---------- */
function frame(ts){
 requestAnimationFrame(frame);
 if(!last)last=ts;
 var dt=(ts-last)/1000;last=ts;
 if(dt>0.05)dt=0.05;
 if(dt<0)dt=0;
 G.t+=dt;
 if(G.state==='play'){G.runT+=dt;game.update(dt);}
 else if(G.state==='over')G.overT+=dt;
 // particles
 for(var i=parts.length-1;i>=0;i--){
  var p=parts[i];p.l-=dt;
  if(p.l<=0){parts.splice(i,1);continue;}
  p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
 }
 for(var j=toasts.length-1;j>=0;j--){var q=toasts[j];q.l-=dt;q.y-=38*dt;if(q.l<=0)toasts.splice(j,1);}
 if(shakeT>0){shakeT-=dt;if(shakeT<=0)shakeA=0;}
 render();
}
function render(){
 var c=ctx;
 c.setTransform(dpr,0,0,dpr,0,0);
 c.fillStyle=game.bg||'#080c1a';c.fillRect(0,0,G.W,G.H);
 c.save();
 if(shakeA>0&&shakeT>0){
  var k=shakeA*(shakeT/0.32);
  c.translate((Math.random()-0.5)*k,(Math.random()-0.5)*k);
 }
 game.draw(c);
 // particles
 for(var i=0;i<parts.length;i++){
  var p=parts[i],a=Math.min(1,p.l/p.m);
  c.globalAlpha=a;c.fillStyle=p.c;
  if(p.q)c.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s);
  else{c.beginPath();c.arc(p.x,p.y,p.s*a,0,6.2832);c.fill();}
 }
 c.globalAlpha=1;
 for(var j=0;j<toasts.length;j++){
  var q=toasts[j];c.globalAlpha=Math.min(1,q.l/q.m);
  G.text(c,q.t,G.W/2,q.y,q.b?30:20,q.c,'center','900');
 }
 c.globalAlpha=1;
 c.restore();
 if(G.state==='play')drawHUD();
 else if(G.state==='title')drawTitle();
 else drawOver();
}
resize();
if(game.init)game.init();
game.reset();
requestAnimationFrame(frame);
})();
