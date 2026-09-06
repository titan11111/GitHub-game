/* 294 BUBBLE POP — 狙って撃つ、3つでハジける */
window.G=window.G||{};
window.GAME=(function(){
var rows,parityBase,r0,step,topY,shootY,cur,next,ball,aim,aiming,shots,dropIn,popFx,colorsN,dangerY,clearBonus;
var COL=['#ff5f7e','#38bdf8','#ffd75e','#4ade80','#a78bfa','#fb923c'];

function metrics(){
  r0=G.W/16;step=r0*1.74;topY=96;shootY=G.H-96;dangerY=shootY-r0*2.4;
}
function rowLen(i){return ((i+parityBase)%2===0)?8:7;}
function cellX(i,c){return ((i+parityBase)%2===0)?r0*(1+2*c):r0*(2+2*c);}
function cellY(i){return topY+i*step+r0;}
function neigh(i,c){
  var odd=((i+parityBase)%2)===1;
  return odd?[[i,c-1],[i,c+1],[i-1,c],[i-1,c+1],[i+1,c],[i+1,c+1]]
            :[[i,c-1],[i,c+1],[i-1,c-1],[i-1,c],[i+1,c-1],[i+1,c]];
}
function get(i,c){if(i<0||i>=rows.length)return undefined;if(c<0||c>=rows[i].length)return undefined;return rows[i][c];}
function newRow(i){
  var a=[],n=rowLen(i);
  for(var c=0;c<n;c++)a.push(G.rint(0,colorsN-1));
  return a;
}
function pickColor(){
  var seen={},list=[];
  for(var i=0;i<rows.length;i++)for(var c=0;c<rows[i].length;c++){var v=rows[i][c];if(v!=null&&!seen[v]){seen[v]=1;list.push(v);}}
  if(!list.length)return G.rint(0,colorsN-1);
  return list[G.rint(0,list.length-1)];
}
function addRowTop(){
  parityBase=(parityBase+1)%2;
  rows.unshift([]);
  rows[0]=newRow(0);
  G.sfx('deep');G.shake(4);
}
function lowest(){
  var m=0;
  for(var i=0;i<rows.length;i++)for(var c=0;c<rows[i].length;c++)if(rows[i][c]!=null)m=Math.max(m,cellY(i));
  return m;
}
function snap(bx,by){
  var bi=Math.round((by-r0-topY)/step);
  var best=null,bd=1e9;
  for(var i=Math.max(0,bi-2);i<=bi+2;i++){
    while(rows.length<=i)rows.push(new Array(rowLen(rows.length)).fill(null));
    for(var c=0;c<rows[i].length;c++){
      if(rows[i][c]!=null)continue;
      var d=G.dist(bx,by,cellX(i,c),cellY(i));
      if(d<bd){
        // 接地条件：i===0 か 隣に玉がある
        var ok=(i===0);
        if(!ok){var nb=neigh(i,c);for(var k=0;k<nb.length;k++){if(get(nb[k][0],nb[k][1])!=null){ok=true;break;}}}
        if(ok){bd=d;best=[i,c];}
      }
    }
  }
  return best;
}
function group(i,c,col,seen){
  var st=[[i,c]],out=[];
  seen[i+','+c]=1;
  while(st.length){
    var p=st.pop();out.push(p);
    var nb=neigh(p[0],p[1]);
    for(var k=0;k<nb.length;k++){
      var y=nb[k][0],x=nb[k][1],key=y+','+x;
      if(seen[key])continue;
      if(get(y,x)===col){seen[key]=1;st.push([y,x]);}
    }
  }
  return out;
}
function dropFloating(){
  var mark={},st=[];
  for(var c=0;c<(rows[0]?rows[0].length:0);c++)if(rows[0][c]!=null){mark['0,'+c]=1;st.push([0,c]);}
  while(st.length){
    var p=st.pop(),nb=neigh(p[0],p[1]);
    for(var k=0;k<nb.length;k++){
      var y=nb[k][0],x=nb[k][1],key=y+','+x;
      if(mark[key])continue;
      if(get(y,x)!=null){mark[key]=1;st.push([y,x]);}
    }
  }
  var n=0;
  for(var i=0;i<rows.length;i++)for(var j=0;j<rows[i].length;j++){
    if(rows[i][j]!=null&&!mark[i+','+j]){
      G.burst(cellX(i,j),cellY(i),8,[COL[rows[i][j]],'#fff'],{spd:110,life:0.7,size:4,g:900});
      rows[i][j]=null;n++;
    }
  }
  return n;
}

return {
no:294,key:'bubble-pop',title:'BUBBLE POP',sub:'なぞって狙う、3つ揃えて弾けさせる',
how:['画面をなぞって狙いを定める','指を離すと発射','同じ色が3つ以上つながると消える'],
bg:'#0a0f22',ink:'#fff',accent:'#38bdf8',scoreLabel:'SCORE',

resize:function(){metrics();},

reset:function(){
  metrics();
  parityBase=0;colorsN=4;rows=[];
  for(var i=0;i<5;i++)rows.push(newRow(i));
  cur=pickColor();next=pickColor();ball=null;aim=-Math.PI/2;aiming=false;shots=0;dropIn=6;popFx=[];clearBonus=0;
  G.score=0;
},

down:function(x,y){aiming=true;this.move(x,y);},
move:function(x,y){
  if(!aiming)return;
  var dx=x-G.W/2,dy=y-shootY;
  if(dy>-24)dy=-24;
  aim=Math.atan2(dy,dx);
  aim=G.clamp(aim,-Math.PI+0.32,-0.32);
},
up:function(){
  if(!aiming||ball)return;
  aiming=false;
  ball={x:G.W/2,y:shootY,vx:Math.cos(aim)*760,vy:Math.sin(aim)*760,c:cur};
  cur=next;next=pickColor();
  G.sfx('jump',1.2);
},

update:function(dt){
  metrics();
  for(var f=popFx.length-1;f>=0;f--){popFx[f].l-=dt;if(popFx[f].l<=0)popFx.splice(f,1);}
  if(!ball)return;
  var steps=Math.ceil(760*dt/(r0*0.5));
  for(var s=0;s<steps;s++){
    var d=dt/steps;
    ball.x+=ball.vx*d;ball.y+=ball.vy*d;
    if(ball.x<r0){ball.x=r0;ball.vx=Math.abs(ball.vx);G.sfx('tick');}
    if(ball.x>G.W-r0){ball.x=G.W-r0;ball.vx=-Math.abs(ball.vx);G.sfx('tick');}
    var hitTop=(ball.y<topY+r0);
    var hitBall=false;
    for(var i=0;i<rows.length&&!hitBall;i++)for(var c=0;c<rows[i].length;c++){
      if(rows[i][c]==null)continue;
      if(G.dist(ball.x,ball.y,cellX(i,c),cellY(i))<r0*1.86){hitBall=true;break;}
    }
    if(hitTop||hitBall){
      var pos=snap(ball.x,ball.y);
      var col=ball.c;ball=null;
      if(!pos){G.over('行き場をなくした');return;}
      while(rows.length<=pos[0])rows.push(new Array(rowLen(rows.length)).fill(null));
      rows[pos[0]][pos[1]]=col;
      G.sfx('blip');
      var gp=group(pos[0],pos[1],col,{});
      if(gp.length>=3){
        var gain=gp.length*10+(gp.length-3)*15;
        for(var k=0;k<gp.length;k++){
          var gx=cellX(gp[k][0],gp[k][1]),gy=cellY(gp[k][0]);
          G.burst(gx,gy,9,[COL[col],'#fff'],{spd:190,life:0.45,size:4,g:260});
          popFx.push({x:gx,y:gy,l:0.3,c:COL[col]});
          rows[gp[k][0]][gp[k][1]]=null;
        }
        var dropped=dropFloating();
        gain+=dropped*30;
        G.score+=gain;
        G.sfx('coin',1+Math.min(0.6,gp.length*0.06));
        G.shake(Math.min(9,3+gp.length));
        if(dropped>0)G.toast('落下ボーナス +'+(dropped*30),'#ffd75e',G.H*0.4);
        else if(gp.length>=5)G.toast('NICE! +'+gain,'#38bdf8',G.H*0.4);
        // 全消し
        var any=false;
        for(var a=0;a<rows.length;a++)for(var b=0;b<rows[a].length;b++)if(rows[a][b]!=null)any=true;
        if(!any){
          clearBonus++;G.score+=500;G.toast('ALL CLEAR +500','#ffd75e',G.H*0.35,true);G.sfx('win');
          rows=[];parityBase=0;colorsN=Math.min(COL.length,4+clearBonus);
          for(var n=0;n<5;n++)rows.push(newRow(n));
          dropIn=6;
        }
      }else{
        G.score+=2;
      }
      shots++;dropIn--;
      if(dropIn<=0){dropIn=Math.max(4,6-Math.floor(shots/24));addRowTop();colorsN=Math.min(COL.length,4+Math.floor(shots/26));}
      if(lowest()+r0>dangerY){G.over('バブルが下まで届いた');return;}
      cur=cur;next=next;
      break;
    }
    if(ball&&ball.y<-40){ball=null;break;}
  }
},

draw:function(c){
  var gr=c.createLinearGradient(0,0,0,G.H);
  gr.addColorStop(0,'#151b3d');gr.addColorStop(1,'#070a18');
  c.fillStyle=gr;c.fillRect(0,0,G.W,G.H);
  // 天井
  c.fillStyle='#222b55';c.fillRect(0,0,G.W,topY);
  c.fillStyle='rgba(255,255,255,0.12)';c.fillRect(0,topY-3,G.W,3);
  // 危険ライン
  c.strokeStyle='rgba(255,95,126,0.55)';c.lineWidth=2;c.setLineDash([7,7]);
  c.beginPath();c.moveTo(0,dangerY);c.lineTo(G.W,dangerY);c.stroke();c.setLineDash([]);
  // 照準ガイド
  if(aiming&&!ball){
    var x=G.W/2,y=shootY,vx=Math.cos(aim),vy=Math.sin(aim),bounces=0;
    c.strokeStyle='rgba(255,255,255,0.5)';c.lineWidth=2;c.setLineDash([5,9]);
    c.beginPath();c.moveTo(x,y);
    for(var st=0;st<260;st++){
      x+=vx*7;y+=vy*7;
      if(x<r0){x=r0;vx=Math.abs(vx);bounces++;}
      if(x>G.W-r0){x=G.W-r0;vx=-Math.abs(vx);bounces++;}
      c.lineTo(x,y);
      if(y<topY+r0||bounces>2)break;
      var stop=false;
      for(var i=0;i<rows.length&&!stop;i++)for(var cc=0;cc<rows[i].length;cc++){
        if(rows[i][cc]==null)continue;
        if(G.dist(x,y,cellX(i,cc),cellY(i))<r0*1.86){stop=true;break;}
      }
      if(stop)break;
    }
    c.stroke();c.setLineDash([]);
    c.fillStyle='rgba(255,255,255,0.6)';c.beginPath();c.arc(x,y,r0*0.5,0,6.2832);c.fill();
  }
  // バブル
  for(var i2=0;i2<rows.length;i2++)for(var c2=0;c2<rows[i2].length;c2++){
    var v=rows[i2][c2];if(v==null)continue;
    bubble(c,cellX(i2,c2),cellY(i2),r0,COL[v]);
  }
  // 弾け跡
  for(var f=0;f<popFx.length;f++){
    var F=popFx[f];c.globalAlpha=F.l*3;c.strokeStyle=F.c;c.lineWidth=3;
    c.beginPath();c.arc(F.x,F.y,r0*(1+(0.3-F.l)*4),0,6.2832);c.stroke();c.globalAlpha=1;
  }
  // 発射中
  if(ball)bubble(c,ball.x,ball.y,r0,COL[ball.c]);
  // 発射台
  c.fillStyle='#1c2450';G.rr(c,G.W/2-40,shootY-6,80,44,10);c.fill();
  c.save();c.translate(G.W/2,shootY);c.rotate(aim+Math.PI/2);
  c.fillStyle='#4a5aa8';G.rr(c,-9,-40,18,42,7);c.fill();
  c.restore();
  if(!ball)bubble(c,G.W/2,shootY,r0,COL[cur]);
  // 次
  bubble(c,G.W-30,shootY+8,r0*0.66,COL[next]);
  G.text(c,'NEXT',G.W-30,shootY-16,10,'rgba(255,255,255,0.5)','center','700');
},

hud:function(c){
  G.text(c,'SCORE',14,18,10,'rgba(255,255,255,0.55)','left','700');
  G.text(c,String(G.score),14,40,22,'#fff','left','900');
  G.text(c,'BEST '+G.best,G.W-14,20,11,'rgba(255,255,255,0.5)','right','700');
  G.text(c,'次の追加まで '+dropIn,G.W-14,42,12,'#ffd75e','right','800');
}
};

function bubble(c,x,y,r,col){
  c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,6.2832);c.fill();
  c.fillStyle='rgba(255,255,255,0.42)';c.beginPath();c.arc(x-r*0.3,y-r*0.32,r*0.32,0,6.2832);c.fill();
  c.strokeStyle='rgba(0,0,0,0.22)';c.lineWidth=1.5;c.beginPath();c.arc(x,y,r-0.8,0,6.2832);c.stroke();
}
})();
