/* 2面・3面のミッション。script.js が installStages(api) で組み込む。 */
window.installStages=function(A){
  const FACT=A.FACT;
  function homeFar(from,min){
    const hs=A.houses(),far=hs.filter(h=>h.door.distanceTo(from)>min);
    return A.pick(far.length?far:hs);
  }
  function personAt(shirt,pants,hair,extra){
    const p=A.makePerson(Object.assign({shirt,pants,hair,scale:1.15},extra||{}));
    return p;
  }

  FACT.boulder=function(){
    const m=A.mkMission('boulder','🪨','#ffd27a');
    let s=A.sidewalkSpot();
    for(let i=0;i<8&&s.pos.z<20;i++)s=A.sidewalkSpot();
    if(s.pos.z<20){
      const rp=Math.random()<.5?40:80,side=Math.random()<.5?-1:1;
      s={pos:new THREE.Vector3(s.pos.x,0,rp+side*6.3),face:side>0?Math.PI:0};
    }
    const rock=new THREE.Group();
    rock.position.set(s.pos.x,2.35,s.pos.z);
    A.scene.add(rock);
    const body=new THREE.Mesh(new THREE.DodecahedronGeometry(2.35,0),A.mat('#8c6d4f'));
    body.castShadow=true;body.rotation.set(0.35,0.8,0.15);rock.add(body);
    const chip=new THREE.Mesh(new THREE.DodecahedronGeometry(1.05,0),A.mat('#a88862'));
    chip.position.set(1.7,-0.7,0.55);chip.rotation.set(0.2,1.1,0.4);rock.add(chip);
    const chip2=new THREE.Mesh(new THREE.DodecahedronGeometry(0.72,0),A.mat('#6e5340'));
    chip2.position.set(-1.45,-0.9,-0.4);rock.add(chip2);
    m.objs.push(rock);
    const who=personAt('#f4e1b5','#3d4c6b','#2a2118');
    who.position.set(s.pos.x+4.2,0.1,s.pos.z+1.4);
    who.rotation.y=Math.atan2(rock.position.x-who.position.x,rock.position.z-who.position.z);
    A.scene.add(who);m.objs.push(who);
    const cliffs=A.cliffs();
    let cliff=cliffs[0]||{minX:-10,maxX:10,minZ:-210,maxZ:-150,h:28};
    let best=1e9;
    cliffs.forEach(c=>{
      const d=Math.abs((c.minX+c.maxX)*0.5-s.pos.x);
      if(d<best){best=d;cliff=c;}
    });
    const drop=new THREE.Vector3((cliff.minX+cliff.maxX)*0.5,cliff.h,(cliff.minZ+cliff.maxZ)*0.5);
    A.say(m,who,'おおきな いしが おちてきた！',3.2);
    m.target.copy(rock.position);
    m.title=()=>m.stage===0?A.K('まちの きょせきを やまへ','街の巨石を山へ'):A.K('やまのうえで おろそう','山の上でおろそう');
    m.prompt='きょせきを もつ';
    m.dropHint=A.K('やま（ひかりの はしら）のうえで おろそう','山の光の柱の上でおろそう');
    m.near=()=>A.xzDist(A.R.pos,drop)<A.RR(26)&&A.groundAt(A.R.pos)>10;
    m.nearText=A.K('⬇ やまのうえで おろそう','⬇ 山の上で着地');
    m.canInteract=()=>m.stage===0&&A.xzDist(A.R.pos,rock.position)<A.RR(16)&&A.R.pos.y<A.RR(18);
    m.interact=()=>{
      m.stage=1;A.carry(m,rock,'top');m.target.copy(drop);
      A.say(m,who,'やまに もどして！',3.2);
      A.toast(A.K('きょせきを やまのうえへ','巨石を山の上へ運ぼう'));
    };
    m.update=dt=>{
      if(m.done)return;
      if(m.stage===0)rock.rotation.y+=dt*0.35;
      else if(m.stage===1&&A.R.grounded&&A.xzDist(A.R.pos,drop)<A.RR(26)&&A.groundAt(A.R.pos)>10){
        A.release();
        rock.position.set(drop.x,drop.y+2.35,drop.z);
        rock.rotation.y=0;
        A.bounce(rock);A.say(m,who,'まちが あんぜん！ ありがとう',3.4);
        m.stage=2;A.complete(m,150,rock.position);
      }
    };
    return m;
  };

  FACT.brokencar=function(){
    const m=A.mkMission('brokencar','🚗','#5aa0ff');
    const s=A.sidewalkSpot();
    const car=A.makeCar(A.pick(['#e94f4f','#3f7fd9','#f2b705','#39b37a']));
    car.position.copy(s.pos);car.rotation.y=s.face;A.scene.add(car);
    const who=personAt('#2c3e66','#2c3e66','#222',{tie:true,scale:1.2});
    who.position.set(2.2,0.1,0);car.add(who);
    m.objs.push(car);
    const home=homeFar(s.pos,50);
    A.say(m,who,'こわれちゃった…おうちにかえれない',3.4);
    m.target.copy(car.position);
    m.title=()=>m.stage===0?A.K('くるまごと おうちへ','車ごと家へ'):A.K('いえのまえで おろそう','家の前でおろそう');
    m.prompt='くるまを もつ';
    m.dropHint=A.K('ひかりの はしらの いえのまえ','光の柱の家の前');
    m.near=()=>A.xzDist(A.R.pos,home.door)<A.RR(16);
    m.nearText=A.K('⬇ ここで おろそう','⬇ ここで着地');
    m.canInteract=()=>m.stage===0&&A.xzDist(A.R.pos,car.position)<A.RR(12)&&A.R.pos.y<A.RR(12);
    m.interact=()=>{m.stage=1;A.carry(m,car,'top');m.target.copy(home.door);A.say(m,who,'たすかる〜！',3.2);A.toast(A.K('いえまで はこぼう！','家まではこぼう！'));};
    m.update=()=>{
      if(m.stage===1&&A.R.grounded&&A.xzDist(A.R.pos,home.door)<A.RR(16)){
        A.release();car.position.set(home.door.x,0.1,home.door.z);car.rotation.y=home.face;
        A.bounce(car);A.say(m,who,'おかえり！ ありがとう',3.4);m.stage=2;A.complete(m,180,car.position);
      }
    };
    return m;
  };

  FACT.dog=function(){
    const m=A.mkMission('dog','🐕','#e0a15a');
    const s=A.sidewalkSpot();
    const dog=new THREE.Group();dog.position.copy(s.pos);dog.position.y=0.2;A.scene.add(dog);
    A.bx(1.15,0.62,1.7,'#c48a3a',0,0.7,0,dog);
    A.sph(0.42,'#c48a3a',0,1.05,0.72,dog);
    A.bx(0.16,0.45,0.16,'#c48a3a',-0.35,0.28,0.55,dog);
    A.bx(0.16,0.45,0.16,'#c48a3a',0.35,0.28,0.55,dog);
    A.bx(0.16,0.45,0.16,'#c48a3a',-0.35,0.28,-0.55,dog);
    A.bx(0.16,0.45,0.16,'#c48a3a',0.35,0.28,-0.55,dog);
    const tail=A.bx(0.12,0.12,0.55,'#a8742e',0,0.85,-1.05,dog);
    m.objs.push(dog);
    const home=homeFar(s.pos,40);
    m.target.copy(dog.position);
    m.title=()=>m.stage===0?A.K('いぬが にげてる！ おいかけて','犬が逃げている'):A.K('かいぬしの いえへ','飼い主の家へ');
    m.prompt='いぬを だっこ';
    m.dropHint=A.K('いえのまえで おろして','家の前でおろして');
    m.near=()=>A.xzDist(A.R.pos,home.door)<A.RR(14);
    m.canInteract=()=>m.stage===0&&A.xzDist(A.R.pos,dog.position)<A.RR(8)&&A.R.pos.y<A.RR(10);
    m.interact=()=>{m.stage=1;A.carry(m,dog,'front');m.target.copy(home.door);A.toast(A.K('かいぬしの いえへ とどけよう','飼い主の家へ'));};
    m.update=dt=>{
      tail.rotation.y=Math.sin(m.t*8)*0.6;
      if(m.stage===0){
        const dx=dog.position.x-A.R.pos.x,dz=dog.position.z-A.R.pos.z,d=Math.hypot(dx,dz)||1;
        if(d<28){
          dog.position.x=A.clamp(dog.position.x+(dx/d)*8*dt,-170,170);
          dog.position.z=A.clamp(dog.position.z+(dz/d)*8*dt,-130,170);
          dog.rotation.y=Math.atan2(dx,dz);
        }
        m.target.copy(dog.position);
      }else if(m.stage===1&&A.R.grounded&&A.xzDist(A.R.pos,home.door)<A.RR(14)){
        A.release();dog.position.set(home.door.x,0.2,home.door.z);
        A.bounce(dog);m.stage=2;A.complete(m,140,dog.position);
      }
    };
    return m;
  };

  FACT.lostkid=function(){
    const m=A.mkMission('lostkid','🧒','#ff8fb8');
    const s=A.sidewalkSpot();
    const kid=personAt('#ffd23f','#3f7fd9','#3a2a1f',{cap:'#e94f4f',scale:0.95});
    kid.position.copy(s.pos);kid.position.y=0.1;A.scene.add(kid);
    m.objs.push(kid);
    const home=homeFar(s.pos,45);
    A.say(m,kid,'ママが いないよ…',3.2);
    m.target.copy(kid.position);
    m.beaconOff=false;
    m.title=()=>m.stage===0?A.K('まいごの こ。だっこして おやを さがそう','迷子。抱えて親をさがそう'):A.K('ひかりの いえが おやの いえ','光の家が親の家');
    m.prompt='こどもを だっこ';
    m.dropHint=A.K('おやの いえのまえで','親の家の前で');
    m.near=()=>m.stage===1&&A.xzDist(A.R.pos,home.door)<A.RR(14);
    m.canInteract=()=>m.stage===0&&A.xzDist(A.R.pos,kid.position)<A.RR(10)&&A.R.pos.y<A.RR(8);
    m.interact=()=>{m.stage=1;A.carry(m,kid,'front');m.target.copy(home.door);A.toast(A.K('ひかりの はしらが おやの いえ','光の柱が親の家'));};
    m.update=dt=>{
      if(m.stage===0)kid.rotation.y+=dt*1.6;
      else if(m.stage===1&&A.R.grounded&&A.xzDist(A.R.pos,home.door)<A.RR(14)){
        A.release();kid.position.set(home.door.x,0.1,home.door.z);kid.rotation.y=home.face;
        A.bounce(kid);A.say(m,kid,'ママ！ ロボさんありがとう',3.4);m.stage=2;A.complete(m,200,kid.position);
      }
    };
    return m;
  };

  FACT.bomb=function(){
    const m=A.mkMission('bomb','💣','#444');
    const s=A.sidewalkSpot();
    const bomb=new THREE.Group();bomb.position.set(s.pos.x,1.1,Math.max(s.pos.z,-40));A.scene.add(bomb);
    A.sph(1.15,'#2a2e32',0,0,0,bomb);
    A.bx(0.28,0.55,0.28,'#e74c3c',0,1.25,0,bomb);
    m.objs.push(bomb);
    const drop=new THREE.Vector3(A.clamp(bomb.position.x,-50,50),0,-178);
    m.target.copy(bomb.position);
    m.dive=0;
    m.title=()=>m.stage===0?A.K('ふはつだん。そっと もって','不発弾をそっと持って'):A.K('がけのうえから うみへ。きゅうにおちないで','崖の上から海へ。急降下しないで');
    m.prompt='そっと もつ';
    m.dropHint=A.K('がけのうえまで。⬇を おしっぱなしにしないで','崖の上まで。下降の押しっぱなしは失敗');
    m.near=()=>A.R.pos.z<-150;
    m.nearText=A.K('ここで ゆっくり おりて','ここでゆっくり着地');
    m.canInteract=()=>m.stage===0&&A.xzDist(A.R.pos,bomb.position)<A.RR(11);
    m.interact=()=>{m.stage=1;A.carry(m,bomb,'top');m.target.copy(drop);A.toast(A.K('がけのおくの うみへ。おとしちゃだめ','崖の向こうの海へ'));};
    m.update=dt=>{
      if(m.stage!==1||m.done)return;
      if(A.R.vy<-14&&A.R.pos.y>12&&A.R.pos.z>-150)m.dive+=dt;else m.dive=0;
      if(m.dive>0.35){A.release();A.fail(m,A.K('おとして しまった…','落としてしまった…'));return;}
      if(A.R.grounded&&A.R.pos.z<-158&&A.groundAt(A.R.pos)>8){
        A.release();bomb.position.set(A.R.pos.x,A.R.pos.y+1,A.R.pos.z);
        m.stage=2;A.complete(m,250,bomb.position);
      }
    };
    return m;
  };

  FACT.container=function(){
    const m=A.mkMission('container','📦','#3f8fd4');
    const s=A.sidewalkSpot();
    const g=new THREE.Group();g.position.copy(s.pos);A.scene.add(g);
    const a=A.bx(4.2,2.1,2.1,'#c0392b',0,5.4,0,g);a.rotation.z=0.22;
    const b=A.bx(4.2,2.1,2.1,'#2980b9',0,3.2,0,g);b.rotation.z=0.1;
    A.bx(4.2,2.1,2.1,'#f2b705',0,1.15,0,g);
    const w1=personAt('#f6f6f6','#335','#222',{scale:1});w1.position.set(3.2,0,1.6);g.add(w1);
    const w2=personAt('#ffd23f','#3f7fd9','#3a2a1f',{scale:1});w2.position.set(-3.2,0,1.6);g.add(w2);
    m.objs.push(g);m.hold=0;m.target.copy(s.pos);
    m.title=()=>m.stage===0?A.K('コンテナが たおれそう！ したから ささえて','コンテナが倒れそう'):A.K('うごかないで！ あと '+Math.ceil(m.hold)+'びょう','支えて あと '+Math.ceil(m.hold)+'秒');
    m.prompt='ささえる';
    m.canInteract=()=>m.stage===0&&A.xzDist(A.R.pos,s.pos)<A.RR(10)&&A.R.pos.y<8;
    m.interact=()=>{m.stage=1;m.hold=A.KIDS?3.2:4.6;A.sfx('clang');A.toast(A.K('そのばで ささえて！','その場で支え続けて'));};
    m.update=dt=>{
      if(m.stage!==1||m.done)return;
      const near=A.xzDist(A.R.pos,s.pos)<A.RR(12)&&A.R.grounded;
      if(!near){m.hold=A.KIDS?3.2:4.6;return;}
      m.hold-=dt;
      w1.position.x=Math.min(8,w1.position.x+dt*1.6);
      w2.position.x=Math.max(-8,w2.position.x-dt*1.6);
      if(m.hold<=0){m.stage=2;A.complete(m,180,s.pos);}
    };
    return m;
  };

  FACT.crane=function(){
    const m=A.mkMission('crane','🏗','#e07a2f');
    const g=new THREE.Group();g.position.set(40,0,-40);A.scene.add(g);
    A.bx(2.4,8,2.4,'#4a5560',0,4,0,g);
    const arm=new THREE.Group();arm.position.set(0,8.2,0);g.add(arm);
    A.bx(1.1,1.1,14,'#f2b705',0,0,6,arm);
    m.objs.push(g);m.target.copy(g.position);m.ang=0;
    m.title=()=>A.K('アームが とまった しゅんかんに つかんで','アームが止まった瞬間につかむ');
    m.prompt='アームを つかむ';
    m.canInteract=()=>m.stage===0&&A.xzDist(A.R.pos,g.position)<A.RR(16)&&Math.abs(Math.sin(m.ang))<0.2;
    m.interact=()=>{
      if(Math.abs(Math.sin(m.ang))>0.2){A.bump(0.9);A.sfx('fail');A.toast(A.K('はずれた！','タイミングがずれた'));return;}
      m.stage=1;arm.rotation.x=0;A.sfx('clang');A.complete(m,220,g.position);
    };
    m.update=dt=>{
      if(m.stage===0){m.ang+=dt*1.35;arm.rotation.x=Math.sin(m.ang)*0.95;}
    };
    return m;
  };

  FACT.kaiju=function(){
    const m=A.mkMission('kaiju','🦖','#3d8c4a');
    const g=new THREE.Group();g.position.set(A.rand(-24,24),0,-138);A.scene.add(g);
    A.bx(6.2,4.6,8,'#3d8c4a',0,3.6,0,g);
    A.sph(2.1,'#2f7a3c',0,6.6,2.6,g);
    A.bx(1.3,2.8,1.3,'#3d8c4a',-2.1,1.4,2.2,g);
    A.bx(1.3,2.8,1.3,'#3d8c4a',2.1,1.4,2.2,g);
    A.bx(1.1,2.4,1.1,'#2f7a3c',-1.5,1.2,-2.4,g);
    A.bx(1.1,2.4,1.1,'#2f7a3c',1.5,1.2,-2.4,g);
    m.objs.push(g);m.pushes=0;m.target.copy(g.position);
    m.helpLabel='おす';
    m.title=()=>A.K('かいじゅうを うみへ おしもどそう（やっつけるんじゃない）','海へ押し返す。倒さない');
    m.prompt='おす';
    m.canInteract=()=>m.stage===0&&A.xzDist(A.R.pos,g.position)<A.RR(18);
    m.interact=()=>{
      if(m.done)return;
      m.pushes++;g.position.z-=A.KIDS?11:8;A.bump(0.75);A.sfx('clang');
      if(g.position.z<-168){m.stage=1;g.rotation.x=0.55;A.complete(m,400,g.position);}
    };
    m.update=dt=>{
      if(m.done){g.position.y-=dt*1.6;return;}
      g.position.z+=dt*(A.KIDS?2.1:3.3);
      g.rotation.z=Math.sin(m.t*2)*0.06;
      m.target.copy(g.position);
      if(g.position.z>-30){g.position.z=-48;A.bump(1.1);A.toast(A.K('まちまで きちゃった！ おして！','街に近づいた。押して！'));}
    };
    return m;
  };
};
