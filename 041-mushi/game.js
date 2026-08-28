(() => {
  'use strict';

  const $ = (q) => document.querySelector(q);
  const $$ = (q) => [...document.querySelectorAll(q)];
  const canvas = $('#game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const spriteImage = new Image();
  spriteImage.src = 'assets/collector-sprites.png';
  const bgm = new Audio('assets/summer-field-bgm.mp3');
  bgm.loop = true;
  bgm.preload = 'auto';
  bgm.volume = .22;
  bgm.playsInline = true;

  const BUGS = [
    {id:'ladybug',name:'ナナホシテントウ',latin:'Coccinella septempunctata',icon:'🐞',rarity:1,size:[7,10],speed:.72,period:['day','evening'],weather:['sun','cloud'],desc:'七つの黒い星が目印。畑のアブラムシを食べる小さな益虫。'},
    {id:'butterfly',name:'モンシロチョウ',latin:'Pieris rapae',icon:'🦋',rarity:1,size:[45,60],speed:1.05,period:['day'],weather:['sun','cloud'],desc:'白い羽で花から花へ。晴れた草原でよく出会える。'},
    {id:'bee',name:'ニホンミツバチ',latin:'Apis cerana japonica',icon:'🐝',rarity:1,size:[10,14],speed:1.18,period:['day'],weather:['sun','cloud'],desc:'花粉を運び森を育てる働き者。急な方向転換が得意。'},
    {id:'ant',name:'クロオオアリ',latin:'Camponotus japonicus',icon:'🐜',rarity:1,size:[8,17],speed:.55,period:['day','evening'],weather:['sun','cloud','rain'],desc:'地面を忙しく歩く日本最大級のアリ。'},
    {id:'snail',name:'ニッポンマイマイ',latin:'Satsuma japonica',icon:'🐌',rarity:1,size:[28,42],speed:.28,period:['day','evening','night'],weather:['rain'],desc:'雨粒が大好き。濡れた葉の上をゆっくり進む。'},
    {id:'dragonfly',name:'シオカラトンボ',latin:'Orthetrum albistylum',icon:'𓆤',rarity:2,size:[48,61],speed:1.42,period:['day','evening'],weather:['sun','cloud'],desc:'水辺を巡回する空のハンター。直線飛行がとても速い。'},
    {id:'cicada',name:'ミンミンゼミ',latin:'Hyalessa maculaticollis',icon:'🎶',rarity:2,size:[33,36],speed:.82,period:['day'],weather:['sun'],desc:'木立に響く夏の声。飛び立つ直前はぴたりと鳴き止む。'},
    {id:'stag',name:'ノコギリクワガタ',latin:'Prosopocoilus inclinatus',icon:'🪲',rarity:2,size:[35,70],speed:.52,period:['evening','night'],weather:['sun','cloud'],desc:'湾曲した大あごが自慢。夕暮れの樹液に集まる。'},
    {id:'mantis',name:'オオカマキリ',latin:'Tenodera sinensis',icon:'🦗',rarity:2,size:[70,95],speed:.68,period:['day','evening'],weather:['sun','cloud'],desc:'草むらで獲物を待つ名狩人。こちらの動きも見ている。'},
    {id:'firefly',name:'ゲンジボタル',latin:'Luciola cruciata',icon:'✨',rarity:3,size:[12,18],speed:.9,period:['night'],weather:['sun','cloud'],desc:'清らかな小川に舞う光。静かな夜だけ姿を見せる。'},
    {id:'beetle',name:'ヤマトカブトムシ',latin:'Trypoxylus dichotomus',icon:'🪲',rarity:3,size:[42,82],speed:.62,period:['night'],weather:['sun','cloud'],desc:'夏の森の王者。夜のクヌギ林で力強く羽ばたく。'},
    {id:'swallowtail',name:'ミヤマカラスアゲハ',latin:'Papilio maackii',icon:'🦋',rarity:3,size:[90,120],speed:1.3,period:['day'],weather:['sun'],desc:'青緑にきらめく大型のアゲハ。木漏れ日に羽色が変わる。'},
    {id:'weevil',name:'オオゾウムシ',latin:'Sipalinus gigas',icon:'🪲',rarity:3,size:[25,38],speed:.48,period:['evening','night'],weather:['rain','cloud'],desc:'象の鼻のような長い口を持つ、でこぼこ鎧の昆虫。'},
    {id:'jewel',name:'ヤマトタマムシ',latin:'Chrysochroa fulgidissima',icon:'💎',rarity:4,size:[30,41],speed:1.45,period:['day'],weather:['sun'],desc:'虹色の構造色をまとう森の宝石。真夏の強い光を好む。'},
    {id:'moonmoth',name:'オオミズアオ',latin:'Actias aliena',icon:'🌙',rarity:4,size:[80,120],speed:.95,period:['night'],weather:['cloud','rain'],desc:'淡い月色の大きな蛾。夜の森を音もなく漂う。'},
    {id:'oni',name:'オニヤンマ',latin:'Anotogaster sieboldii',icon:'𓆤',rarity:4,size:[90,110],speed:1.78,period:['day','evening'],weather:['sun','cloud'],desc:'日本最大級のトンボ。決まった縄張りを高速で往復する。'},
    {id:'luehdorfia',name:'ギフチョウ',latin:'Luehdorfia japonica',icon:'🦋',rarity:5,size:[50,65],speed:1.5,period:['day'],weather:['sun'],desc:'春の女神と呼ばれる希少な蝶。里山からの特別な贈り物。'},
    {id:'rainbow',name:'ニジイロクワガタ',latin:'Phalacrognathus muelleri',icon:'🌈',rarity:5,size:[40,68],speed:.75,period:['night'],weather:['rain'],desc:'雨の夜にだけ迷い込む幻の虹色クワガタ。'},
    {id:'akasuji-kinkamemushi',name:'アカスジキンカメムシ',latin:'Poecilocoris lewisi',icon:'🛡️',rarity:3,size:[17,20],speed:.55,period:['day','evening'],weather:['sun','cloud'],desc:'緑の体に赤い筋が走る、宝石のように美しいカメムシ。'},
    {id:'oomurasaki',name:'オオムラサキ',latin:'Sasakia charonda',icon:'🦋',rarity:4,size:[75,110],speed:1.48,period:['day'],weather:['sun'],desc:'日本の国蝶。紫色に輝く雄は、雑木林を力強く飛び回る。'},
    {id:'benishijimi',name:'ベニシジミ',latin:'Lycaena phlaeas',icon:'🦋',rarity:1,size:[27,35],speed:.92,period:['day','evening'],weather:['sun','cloud'],desc:'橙色の小さな羽が愛らしい、草原で身近に見られる蝶。'},
    {id:'tsumaguro-hyoumon',name:'ツマグロヒョウモン',latin:'Argyreus hyperbius',icon:'🦋',rarity:2,size:[60,75],speed:1.18,period:['day'],weather:['sun','cloud'],desc:'豹柄の羽を持つ南方系の蝶。都市の花壇にもよく訪れる。'},
    {id:'asagimadara',name:'アサギマダラ',latin:'Parantica sita',icon:'🦋',rarity:4,size:[85,100],speed:1.12,period:['day'],weather:['sun','cloud'],desc:'海を越えて長距離を旅する、浅葱色の半透明な羽の蝶。'},
    {id:'kiageha',name:'キアゲハ',latin:'Papilio machaon',icon:'🦋',rarity:2,size:[70,90],speed:1.28,period:['day'],weather:['sun'],desc:'黄色と黒の模様が鮮やかなアゲハ。開けた草地を好む。'},
    {id:'ruritateha',name:'ルリタテハ',latin:'Kaniska canace',icon:'🦋',rarity:3,size:[55,65],speed:1.35,period:['day','evening'],weather:['sun','cloud'],desc:'黒褐色の羽を横切る瑠璃色の帯が、飛ぶと鋭くきらめく。'},
    {id:'yamamayu',name:'ヤママユ',latin:'Antheraea yamamai',icon:'🌕',rarity:3,size:[115,150],speed:.82,period:['night'],weather:['cloud','rain'],desc:'山の森に暮らす大型の蛾。黄褐色の羽に大きな眼状紋を持つ。'},
    {id:'usutabiga',name:'ウスタビガ',latin:'Rhodinia fugax',icon:'🍃',rarity:4,size:[75,110],speed:.78,period:['night'],weather:['cloud'],desc:'透き通った小窓のある黄緑色の羽を持つ、晩秋の大型蛾。'},
    {id:'kaikoga',name:'カイコガ',latin:'Bombyx mori',icon:'🤍',rarity:2,size:[35,45],speed:.38,period:['day','night'],weather:['cloud'],desc:'長い歴史の中で人と共に暮らし、絹をもたらしてきた蛾。'},
    {id:'niiniizemi',name:'ニイニイゼミ',latin:'Platypleura kaempferi',icon:'🎵',rarity:1,size:[20,26],speed:.76,period:['day'],weather:['sun','cloud'],desc:'夏の初めに現れる小さなセミ。木肌に溶け込む模様を持つ。'},
    {id:'aburazemi',name:'アブラゼミ',latin:'Graptopsaltria nigrofuscata',icon:'🎶',rarity:1,size:[35,40],speed:.88,period:['day','evening'],weather:['sun','cloud'],desc:'油を熱したような力強い声で鳴く、茶色い羽のセミ。'},
    {id:'tsukutsukuboushi',name:'ツクツクボウシ',latin:'Meimuna opalifera',icon:'🎼',rarity:2,size:[28,33],speed:.92,period:['day','evening'],weather:['sun','cloud'],desc:'夏の終わりを告げるような、抑揚のある声で鳴くセミ。'},
    {id:'higurashi',name:'ヒグラシ',latin:'Tanna japonensis',icon:'🔔',rarity:3,size:[28,38],speed:.87,period:['evening'],weather:['cloud','rain'],desc:'夕暮れの林で涼やかな声を響かせる、薄暗い環境を好むセミ。'},
    {id:'kumazemi',name:'クマゼミ',latin:'Cryptotympana facialis',icon:'📣',rarity:2,size:[40,48],speed:1.02,period:['day'],weather:['sun'],desc:'透明な羽と大きな黒い体を持ち、朝の街路樹で大合唱する。'},
    {id:'akiakane',name:'アキアカネ',latin:'Sympetrum frequens',icon:'𓆤',rarity:1,size:[33,40],speed:1.15,period:['day','evening'],weather:['sun','cloud'],desc:'秋の空を群れ飛ぶ赤とんぼ。夏は涼しい高地へ移動する。'},
    {id:'ginnyanma',name:'ギンヤンマ',latin:'Anax parthenope',icon:'𓆤',rarity:3,size:[65,80],speed:1.62,period:['day','evening'],weather:['sun','cloud'],desc:'緑色の胸と銀白色の腹部を持ち、池の上を高速で巡回する。'},
    {id:'hagurotonbo',name:'ハグロトンボ',latin:'Atrocalopteryx atrata',icon:'𓆤',rarity:2,size:[53,68],speed:.88,period:['day','evening'],weather:['cloud'],desc:'黒い羽をひらひら開閉しながら、木陰の小川を優雅に舞う。'},
    {id:'aomon-itotonbo',name:'アオモンイトトンボ',latin:'Ischnura senegalensis',icon:'➖',rarity:2,size:[30,35],speed:1.08,period:['day'],weather:['sun','cloud'],desc:'細い体に鮮やかな青色を灯し、水辺の草間をすばやく飛ぶ。'},
    {id:'ko-oniyanma',name:'コオニヤンマ',latin:'Sieboldius albardae',icon:'𓆤',rarity:3,size:[75,90],speed:1.55,period:['day','evening'],weather:['sun','cloud'],desc:'オニヤンマに似るがサナエトンボの仲間。河原でよく静止する。'},
    {id:'kokuwagata',name:'コクワガタ',latin:'Dorcus rectus',icon:'🪲',rarity:1,size:[22,54],speed:.5,period:['evening','night'],weather:['sun','cloud'],desc:'小柄で親しみやすいクワガタ。夜の樹液や灯りに集まる。'},
    {id:'miyama-kuwagata',name:'ミヤマクワガタ',latin:'Lucanus maculifemoratus',icon:'🪲',rarity:4,size:[35,78],speed:.58,period:['evening','night'],weather:['cloud','rain'],desc:'頭部の張り出しと大あごが勇ましい、涼しい山地のクワガタ。'},
    {id:'hirata-kuwagata',name:'ヒラタクワガタ',latin:'Dorcus titanus',icon:'🪲',rarity:3,size:[30,80],speed:.52,period:['evening','night'],weather:['sun','cloud'],desc:'平たく頑丈な体を持つ力持ち。暖かな地域の森に多い。'},
    {id:'kanabun',name:'カナブン',latin:'Pseudotorynorrhina japonica',icon:'🪲',rarity:1,size:[22,30],speed:1.08,period:['day'],weather:['sun','cloud'],desc:'銅色や緑色に輝く体で、昼間の樹液へ勢いよく飛来する。'},
    {id:'hanmyou',name:'ハンミョウ',latin:'Sophiodela japonica',icon:'💠',rarity:3,size:[18,22],speed:1.42,period:['day'],weather:['sun'],desc:'道案内をするように人の少し先へ飛ぶ、極彩色の地表性甲虫。'},
    {id:'gomadara-kamikiri',name:'ゴマダラカミキリ',latin:'Anoplophora malasiaca',icon:'🪲',rarity:2,size:[25,35],speed:.7,period:['day','evening'],weather:['sun','cloud'],desc:'黒い体に白い斑点、長い触角を持つ身近なカミキリムシ。'},
    {id:'nanafushi-modoki',name:'ナナフシモドキ',latin:'Ramulus mikado',icon:'🌿',rarity:2,size:[70,100],speed:.35,period:['day','night'],weather:['cloud'],desc:'枝そっくりの姿で葉陰に溶け込み、見つからないよう静かに歩く。'},
    {id:'shouryou-batta',name:'ショウリョウバッタ',latin:'Acrida cinerea',icon:'🦗',rarity:1,size:[40,80],speed:1.22,period:['day'],weather:['sun','cloud'],desc:'細長い頭が特徴。驚くと草むらから大きく跳び出す。'},
    {id:'tonosama-batta',name:'トノサマバッタ',latin:'Locusta migratoria',icon:'🦗',rarity:2,size:[35,65],speed:1.52,period:['day','evening'],weather:['sun'],desc:'広い草原を好み、強い後脚と羽で長い距離を移動できる。'},
    {id:'enma-kourogi',name:'エンマコオロギ',latin:'Teleogryllus emma',icon:'🎻',rarity:1,size:[26,35],speed:.74,period:['evening','night'],weather:['sun','cloud'],desc:'秋の夜に力強く澄んだ声を奏でる、日本最大級のコオロギ。'},
    {id:'suzumushi',name:'スズムシ',latin:'Meloimorpha japonica',icon:'🔔',rarity:2,size:[17,25],speed:.65,period:['night'],weather:['cloud'],desc:'鈴を振るような美しい音色で、日本の秋を知らせる。'},
    {id:'kirigirisu',name:'ニシキリギリス',latin:'Gampsocleis buergeri',icon:'🦗',rarity:2,size:[30,45],speed:.82,period:['day','evening'],weather:['sun','cloud'],desc:'草原で鋭く連続した声を響かせる、長い触角の昆虫。'},
    {id:'kutsuwamushi',name:'クツワムシ',latin:'Mecopoda niponensis',icon:'📯',rarity:3,size:[50,55],speed:.67,period:['night'],weather:['cloud','rain'],desc:'がちゃがちゃと大きな声で鳴く、幅広い緑の羽を持つ。'},
    {id:'kamadouma',name:'マダラカマドウマ',latin:'Diestrammena japonica',icon:'🦗',rarity:2,size:[20,30],speed:1.02,period:['night'],weather:['rain','cloud'],desc:'暗く湿った場所を好み、驚くと長い脚で突然大きく跳ねる。'},
    {id:'okera',name:'ケラ',latin:'Gryllotalpa orientalis',icon:'⛏️',rarity:3,size:[30,35],speed:.48,period:['evening','night'],weather:['rain','cloud'],desc:'モグラのような前脚で土を掘り、水中や空中も移動する多才な虫。'},
    {id:'amenbo',name:'オオアメンボ',latin:'Aquarius elongatus',icon:'〰️',rarity:2,size:[19,27],speed:1.1,period:['day','evening'],weather:['sun','cloud'],desc:'長い脚で水面の膜に乗り、影のように滑って獲物を探す。'},
    {id:'tagame',name:'タガメ',latin:'Kirkaldyia deyrolli',icon:'🛡️',rarity:5,size:[48,65],speed:.62,period:['evening','night'],weather:['rain','cloud'],desc:'日本最大級の水生昆虫。水草の陰から獲物を狙う希少なハンター。'},
    {id:'gengorou',name:'ゲンゴロウ',latin:'Cybister chinensis',icon:'💧',rarity:4,size:[35,42],speed:1.05,period:['day','night'],weather:['rain','cloud'],desc:'流線形の体と後脚で力強く泳ぐ、里山の池を代表する水生甲虫。'},
    {id:'mizukamakiri',name:'ミズカマキリ',latin:'Ranatra chinensis',icon:'🪡',rarity:3,size:[40,50],speed:.46,period:['day','evening'],weather:['rain','cloud'],desc:'細長い体と鎌状の前脚を持ち、水中で枝のように獲物を待つ。'},
    {id:'heikebotaru',name:'ヘイケボタル',latin:'Aquatica lateralis',icon:'✨',rarity:3,size:[7,10],speed:.82,period:['night'],weather:['sun','cloud'],desc:'水田や湿地で小さな光を点滅させる、身近な里のホタル。'}
  ];

  const MOTION_PROFILES = {
    groundCrawl:{label:'地面を歩く',desc:'地面の起伏に沿って歩き、ときどき立ち止まって向きを変える。'},
    leafCrawl:{label:'草木を伝う',desc:'草や幹から離れず、短い歩行と静止を繰り返す。'},
    flowerFlight:{label:'花から花へ飛ぶ',desc:'小刻みに高度を変えながら、花を探すように不規則に飛ぶ。'},
    patrolFlight:{label:'水辺を巡回する',desc:'一定の高さを高速で往復し、ときどき鋭く進路を変える。'},
    treePerch:{label:'木に止まる',desc:'樹幹で長く静止し、警戒すると短く直線的に飛んで別の木へ移る。'},
    nightFlutter:{label:'夜をゆっくり舞う',desc:'上下に揺れながら緩やかな弧を描き、光の周囲を漂う。'},
    hopper:{label:'草地を跳ねる',desc:'地面や草の上で静止し、後脚で弧を描くように大きく跳ぶ。'},
    groundDash:{label:'地表を走って飛ぶ',desc:'地面を素早く走り、近づくと短く飛んで少し先へ着地する。'},
    waterSurface:{label:'水面を滑る',desc:'池の水面から離れず、短い加速を繰り返して滑るように移動する。'},
    underwater:{label:'水中を泳ぐ',desc:'池の中を潜り、止まる動作と素早い遊泳を交互に行う。'}
  };
  const MOTION_GROUPS = {
    groundCrawl:['ant','snail','weevil'],
    leafCrawl:['ladybug','stag','mantis','beetle','rainbow','akasuji-kinkamemushi','kokuwagata','miyama-kuwagata','hirata-kuwagata','gomadara-kamikiri','nanafushi-modoki'],
    flowerFlight:['butterfly','bee','swallowtail','jewel','luehdorfia','oomurasaki','benishijimi','tsumaguro-hyoumon','asagimadara','kiageha','ruritateha','kanabun'],
    patrolFlight:['dragonfly','oni','akiakane','ginnyanma','hagurotonbo','aomon-itotonbo','ko-oniyanma'],
    treePerch:['cicada','niiniizemi','aburazemi','tsukutsukuboushi','higurashi','kumazemi'],
    nightFlutter:['firefly','moonmoth','yamamayu','usutabiga','kaikoga','heikebotaru'],
    hopper:['shouryou-batta','tonosama-batta','enma-kourogi','suzumushi','kirigirisu','kutsuwamushi','kamadouma','okera'],
    groundDash:['hanmyou'],
    waterSurface:['amenbo'],
    underwater:['tagame','gengorou','mizukamakiri']
  };
  function motionProfileFor(id){return Object.keys(MOTION_GROUPS).find(key=>MOTION_GROUPS[key].includes(id))||'flowerFlight';}

  const SAVE_KEY = 'mushi-biyori-zukan-v1';
  let save = loadSave();
  let W = 0, H = 0, dpr = 1, last = 0, running = false, fieldPaused = true;
  let timeLeft = 60, score = 0, combo = 0, stamina = 6, spawnClock = 0, swingClock = 0;
  let bugs = [], particles = [], ripples = [], discoveries = [], pointer = {x:0,y:0};
  let soundOn = save.sound !== false, audioCtx = null, toastTimer = 0, bookFilter = 'all';
  let weather = 'sun', period = 'day', seed = dailySeed(), rng = mulberry32(seed), characterCanvas = null;

  function loadSave(){
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {bugs:{},sound:true,plays:0}; }
    catch { return {bugs:{},sound:true,plays:0}; }
  }
  function persist(){ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
  function dailySeed(){ const d=new Date(); return Number(`${d.getFullYear()}${d.getMonth()+1}${d.getDate()}`); }
  function mulberry32(a){ return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}; }
  const rand = (a,b) => a + rng()*(b-a);

  function resize(){
    dpr=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight;
    canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr);
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(!pointer.x){pointer.x=W*.7;pointer.y=H*.55;}
  }

  function prepareCharacter(){
    try{
      const off=document.createElement('canvas'), ow=280, oh=374;
      off.width=ow; off.height=oh; const o=off.getContext('2d');
      o.drawImage(spriteImage,0,0,280,374,0,0,ow,oh);
      const px=o.getImageData(0,0,ow,oh), data=px.data;
      for(let i=0;i<data.length;i+=4){const m=Math.min(data[i],data[i+1],data[i+2]);if(m>236)data[i+3]=Math.max(0,(255-m)*13);}
      o.putImageData(px,0,0); characterCanvas=off;
    }catch{characterCanvas=null;}
  }
  spriteImage.addEventListener('load',prepareCharacter);

  function startGame(){
    $$('.overlay').forEach(x=>x.classList.remove('open')); running=true; fieldPaused=false;
    timeLeft=60;score=0;combo=0;stamina=6;spawnClock=0;bugs=[];particles=[];discoveries=[];
    rng=mulberry32(seed + (save.plays||0)*97); weather=['sun','cloud','rain'][Math.floor(rng()*3)]; period='day';
    save.plays=(save.plays||0)+1;persist(); updateHud(); updateFieldLabel();
    $('#hint').classList.remove('hide'); setTimeout(()=>$('#hint').classList.add('hide'),3500);
    for(let i=0;i<5;i++) spawnBug(true); sound('start'); playBgm(true);
  }

  function updateWorld(dt){
    if(!running||fieldPaused)return;
    timeLeft-=dt; stamina=Math.min(6,stamina+dt*.78); spawnClock-=dt; swingClock=Math.max(0,swingClock-dt);
    const nextPeriod=timeLeft>40?'day':timeLeft>20?'evening':'night';
    if(nextPeriod!==period){period=nextPeriod;updateFieldLabel();toast(period==='evening'?'夕暮れの虫が動きだした':'夜の虫が光りだした');sound('chime');if(period==='night'&&weather!=='rain'){spawnBug(true,'firefly');spawnBug(true,'heikebotaru');}}
    if(spawnClock<=0&&bugs.length<10){spawnBug(false);spawnClock=rand(.5,1.25);}
    bugs.forEach(b=>updateBug(b,dt));
    bugs=bugs.filter(b=>!b.dead);
    particles.forEach(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=20*dt;p.vx*=.985;}); particles=particles.filter(p=>p.life>0);
    ripples.forEach(r=>r.life-=dt);ripples=ripples.filter(r=>r.life>0);
    updateHud();
    if(timeLeft<=0) endGame();
  }

  function eligibleBugs(){
    let list=BUGS.filter(b=>b.period.includes(period)&&b.weather.includes(weather));
    if(!list.length)list=BUGS.filter(b=>b.period.includes(period));
    return list;
  }
  function spawnBug(initial,forcedId=null){
    const list=eligibleBugs(); let pick=forcedId?BUGS.find(b=>b.id===forcedId):list[Math.floor(rng()*list.length)];
    for(let guard=0;!forcedId&&guard<7&&rng()>1/(pick.rarity*pick.rarity);guard++)pick=list[Math.floor(rng()*list.length)];
    if(!forcedId&&period==='night'&&weather!=='rain'&&rng()<.28)pick=BUGS.find(b=>b.id===(rng()>.5?'firefly':'heikebotaru'));
    const profile=motionProfileFor(pick.id),margin=45,speed=pick.speed*rand(42,66);
    const groundTop=Math.max(190,H*.7),groundBottom=Math.max(groundTop+24,H-145);
    let minX=30,maxX=W-30,minY=140,maxY=H*.66,x,y,vx=0,vy=0,homeY=0;
    if(profile==='groundCrawl'||profile==='hopper'||profile==='groundDash'){
      minY=groundTop;maxY=groundBottom;homeY=rand(minY,maxY);x=initial?rand(minX,maxX):(rng()>.5?-margin:W+margin);y=homeY;vx=(x<0?1:-1)*speed*.55;
    }else if(profile==='leafCrawl'){
      minY=H*.54;maxY=Math.min(H*.72,H-170);x=rand(W*.08,W*.92);y=rand(minY,maxY);vx=rand(-1,1)*speed*.25;vy=rand(-1,1)*speed*.15;
    }else if(profile==='treePerch'){
      x=rng()>.5?W*.12:W*.88;y=rand(H*.38,H*.62);minX=W*.06;maxX=W*.94;minY=H*.34;maxY=H*.64;
    }else if(profile==='waterSurface'||profile==='underwater'){
      minX=W*.48;maxX=W*.88;minY=profile==='waterSurface'?H*.795:H*.79;maxY=profile==='waterSurface'?H*.815:H*.845;x=rand(minX,maxX);y=rand(minY,maxY);vx=rand(-1,1)*speed*.45;vy=rand(-1,1)*speed*.18;
    }else{
      minY=H*.2;maxY=H*.66;const fromLeft=rng()>.5;x=initial?rand(W*.12,W*.88):(fromLeft?-margin:W+margin);y=rand(minY,maxY);vx=(fromLeft?1:-1)*speed;vy=rand(-.25,.25)*speed;
    }
    if(pick.id==='firefly'||pick.id==='heikebotaru'){minX=W*.34;maxX=W*.92;minY=H*.54;maxY=H*.78;x=rand(minX,maxX);y=rand(minY,maxY);vx=rand(-.5,.5)*speed;vy=rand(-.2,.2)*speed;}
    bugs.push({data:pick,profile,x,y,vx,vy,minX,maxX,minY,maxY,homeY,age:0,life:rand(12,22),wobble:rand(0,6),turn:rand(2,5),phase:rand(0,6),moveClock:rand(.5,2.4),airborne:false,targetX:x,targetY:y});
  }

  function updateBug(b,dt){
    b.age+=dt;b.wobble+=dt*b.turn;b.moveClock-=dt;const speed=b.data.speed*58;
    if(b.profile==='groundCrawl'){
      if(b.moveClock<=0){if(rng()<.35)b.vx*=-1;b.moveClock=rand(1.2,3.2);}
      b.vx+=(Math.sign(b.vx||1)*speed*.34-b.vx)*dt*2;b.x+=b.vx*dt;b.y=b.homeY+Math.sin(b.wobble)*1.2;
    }else if(b.profile==='leafCrawl'){
      if(b.moveClock<=0){b.vx=rand(-.28,.28)*speed;b.vy=rand(-.18,.18)*speed;b.moveClock=rand(1,3.5);}b.x+=b.vx*dt;b.y+=b.vy*dt;
    }else if(b.profile==='hopper'){
      if(!b.airborne&&b.moveClock<=0){b.airborne=true;b.vx=(rng()>.5?1:-1)*speed*rand(.8,1.35);b.vy=-speed*rand(1.15,1.65);}
      if(b.airborne){b.vy+=speed*3.5*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y>=b.homeY){b.y=b.homeY;b.vx=b.vy=0;b.airborne=false;b.moveClock=rand(.7,2.4);}}
    }else if(b.profile==='groundDash'){
      if(b.moveClock<=0){b.airborne=!b.airborne;b.moveClock=b.airborne?rand(.35,.65):rand(.8,1.8);b.vx=b.airborne?(rng()>.5?1:-1)*speed*1.55:0;b.vy=b.airborne?-speed*.5:0;}
      if(b.airborne)b.vy+=speed*1.8*dt;b.x+=b.vx*dt;b.y=Math.min(b.homeY,b.y+b.vy*dt);if(b.y>=b.homeY)b.vy=0;
    }else if(b.profile==='flowerFlight'||b.profile==='nightFlutter'){
      const calm=b.profile==='nightFlutter'?.55:1;b.vx+=Math.sin(b.wobble)*dt*speed*.42*calm;b.vy+=Math.cos(b.wobble*1.37)*dt*speed*.55*calm;limitVelocity(b,speed*calm);b.x+=b.vx*dt;b.y+=b.vy*dt;
    }else if(b.profile==='patrolFlight'){
      if(b.moveClock<=0){b.vx=(rng()>.5?1:-1)*speed*1.25;b.vy=rand(-.22,.22)*speed;b.moveClock=rand(1.2,2.8);}b.x+=b.vx*dt;b.y+=b.vy*dt;
    }else if(b.profile==='treePerch'){
      if(!b.airborne&&b.moveClock<=0){b.airborne=true;b.targetX=b.x<W*.5?W*.88:W*.12;b.targetY=rand(b.minY,b.maxY);}
      if(b.airborne){const dx=b.targetX-b.x,dy=b.targetY-b.y,dist=Math.hypot(dx,dy)||1;b.vx=dx/dist*speed*1.25;b.vy=dy/dist*speed*1.25;b.x+=b.vx*dt;b.y+=b.vy*dt;if(dist<12){b.x=b.targetX;b.y=b.targetY;b.vx=b.vy=0;b.airborne=false;b.moveClock=rand(2.5,6);}}
    }else if(b.profile==='waterSurface'){
      if(b.moveClock<=0){b.vx=rand(-1,1)*speed*1.15;b.vy=rand(-.15,.15)*speed;b.moveClock=rand(.25,.7);}b.vx*=Math.pow(.965,dt*60);b.vy*=Math.pow(.94,dt*60);b.x+=b.vx*dt;b.y+=b.vy*dt;
    }else if(b.profile==='underwater'){
      if(b.moveClock<=0){b.vx=rand(-1,1)*speed*.75;b.vy=rand(-.28,.28)*speed;b.moveClock=rand(.7,2.2);}b.x+=b.vx*dt;b.y+=b.vy*dt;
    }
    containBug(b);if(b.age>b.life)b.dead=true;
  }
  function limitVelocity(b,max){const mag=Math.hypot(b.vx,b.vy)||1;if(mag>max){b.vx=b.vx/mag*max;b.vy=b.vy/mag*max;}}
  function containBug(b){if(b.x<b.minX){b.x=b.minX;b.vx=Math.abs(b.vx);}if(b.x>b.maxX){b.x=b.maxX;b.vx=-Math.abs(b.vx);}if(b.y<b.minY){b.y=b.minY;b.vy=Math.abs(b.vy);}if(b.y>b.maxY){b.y=b.maxY;b.vy=-Math.abs(b.vy);}}

  function swing(){
    if(!running||fieldPaused||swingClock>0)return;
    unlockAudio(); if(stamina<1){toast('網を少し休ませよう');sound('miss');return;}
    stamina-=1;swingClock=.34;ripples.push({x:pointer.x,y:pointer.y,life:.38});sound('swing');
    const reach=Math.min(82,Math.max(55,W*.06));
    const hits=bugs.filter(b=>Math.hypot(b.x-pointer.x,b.y-pointer.y)<reach+(b.data.rarity===1?12:0)).sort((a,b)=>Math.hypot(a.x-pointer.x,a.y-pointer.y)-Math.hypot(b.x-pointer.x,b.y-pointer.y));
    if(hits.length){catchBug(hits[0]);}else{combo=0;burst(pointer.x,pointer.y,'#ffffff',5);setTimeout(()=>sound('miss'),110);}
    navigator.vibrate?.(hits.length?[18,25,28]:12);updateHud();
  }

  function catchBug(b){
    b.dead=true;combo++;score++;const mult=1+Math.min(4,Math.floor((combo-1)/3));
    const size=Math.round(rand(b.data.size[0]*10,b.data.size[1]*10))/10;
    const old=save.bugs[b.data.id], isNew=!old;
    save.bugs[b.data.id]={count:(old?.count||0)+1,best:Math.max(old?.best||0,size),first:old?.first||new Date().toISOString()};persist();
    if(isNew)discoveries.push(b.data.id); burst(b.x,b.y,rarityColor(b.data.rarity),14+b.data.rarity*3);sound(b.data.rarity>=4?'rare':'catch');
    toast(`${b.data.icon} ${b.data.name}  ${mult>1?'×'+mult+'コンボ！':''}`); $('#newDot').classList.add('show');
    if(isNew||b.data.rarity>=4)showCatch(b.data,size,isNew); updateBookCount();
  }

  function showCatch(data,size,isNew){
    fieldPaused=true;$('#catchNew').textContent=isNew?'NEW DISCOVERY':'RARE ENCOUNTER';
    $('#catchBug').textContent=data.icon;$('#catchStars').textContent='★'.repeat(data.rarity)+'☆'.repeat(5-data.rarity);$('#catchName').textContent=data.name;$('#catchLatin').textContent=data.latin;$('#catchDesc').textContent=data.desc;$('#catchSize').textContent=size+' mm';$('#catchBest').textContent=save.bugs[data.id].best+' mm';$('#catchTotal').textContent=save.bugs[data.id].count+' 匹';$('#catchScreen').classList.add('open');
  }

  function endGame(){
    running=false;fieldPaused=true;$('#resultCaught').textContent=score;$('#resultMessage').textContent=score>=15?'網さばきは、もう立派な名人です。':score>=8?'虫の動きをよく見られました。次は夜の森も探してみましょう。':'焦らず、虫の少し先を狙うのがこつです。';
    $('#resultDiscoveries').innerHTML=discoveries.length?discoveries.map(id=>`<span>${BUGS.find(b=>b.id===id).icon}</span>`).join(''):'<small>新発見は次のお楽しみ</small>';$('#resultScreen').classList.add('open');stopBgm();sound('finish');
  }

  function updateHud(){
    $('#time').textContent=Math.max(0,Math.ceil(timeLeft));$('#score').textContent=score;$('#combo').textContent='×'+Math.max(1,1+Math.min(4,Math.floor((combo-1)/3)));
    $('#staminaPips').innerHTML=Array.from({length:6},(_,i)=>`<i class="${i<Math.floor(stamina)?'':'empty'}"></i>`).join('');
  }
  function updateFieldLabel(){
    const w={sun:['晴れ','☀'],cloud:['くもり','☁'],rain:['小雨','☂']}[weather],p={day:'ひる',evening:'夕暮れ',night:'よる'}[period];
    $('#weather').textContent=w[0]+'・'+p;$('#periodIcon').textContent=period==='night'?'☾':period==='evening'?'◐':w[1];$('#area').textContent=period==='night'?'月明かりの森':period==='evening'?'夕映えの小川':'ひだまり草原';
  }
  function updateBookCount(){const n=Object.keys(save.bugs).filter(id=>BUGS.some(b=>b.id===id)).length;$('#bookCount').textContent=n+'/'+BUGS.length;}

  function draw(){
    ctx.setTransform(dpr,0,0,dpr,0,0);drawBackground();drawScenery();
    bugs.forEach(drawBug);particles.forEach(drawParticle);drawCharacter();ripples.forEach(drawRipple);drawNet();
  }
  function drawBackground(){
    let sky;if(period==='day')sky=weather==='rain'?['#789aa0','#c0c9b4']:weather==='cloud'?['#9fc3c2','#e7e5c6']:['#79c5d2','#f4edb8'];else if(period==='evening')sky=['#dc8466','#f2c279'];else sky=['#112d38','#315462'];
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,sky[0]);g.addColorStop(.68,sky[1]);g.addColorStop(.69,period==='night'?'#274a37':'#6e9854');g.addColorStop(1,period==='night'?'#102d23':'#375f38');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    if(period!=='night'){ctx.fillStyle='#fff8cdb5';ctx.beginPath();ctx.arc(W*.82,H*.15,42,0,Math.PI*2);ctx.fill();}
    else{ctx.fillStyle='#fff5cc';ctx.beginPath();ctx.arc(W*.82,H*.14,29,0,Math.PI*2);ctx.fill();for(let i=0;i<35;i++){ctx.globalAlpha=.3+((i*17)%6)/10;ctx.fillRect((i*83)%W,70+(i*47)%(H*.48),2,2);}ctx.globalAlpha=1;}
  }
  function drawScenery(){
    ctx.fillStyle=period==='night'?'#263a2c':'#765b37';
    ctx.fillRect(W*.1,H*.36,Math.max(24,W*.025),H*.34);ctx.fillRect(W*.87,H*.33,Math.max(28,W*.03),H*.37);
    ctx.strokeStyle=period==='night'?'#263a2c':'#765b37';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(W*.115,H*.48);ctx.lineTo(W*.06,H*.42);ctx.moveTo(W*.885,H*.45);ctx.lineTo(W*.94,H*.39);ctx.stroke();
    ctx.fillStyle=period==='night'?'#173928':'#3f733e';for(const treeX of [W*.11,W*.89]){ctx.beginPath();ctx.arc(treeX,H*.34,Math.max(55,W*.07),0,Math.PI*2);ctx.arc(treeX-W*.045,H*.39,Math.max(38,W*.05),0,Math.PI*2);ctx.arc(treeX+W*.045,H*.39,Math.max(38,W*.05),0,Math.PI*2);ctx.fill();}
    ctx.fillStyle=period==='night'?'#173928':'#4c7744';
    for(let i=0;i<13;i++){const x=(i*W/11)-30,y=H*.68+Math.sin(i*1.7)*18;ctx.beginPath();ctx.arc(x,y,70+(i%3)*18,Math.PI,0);ctx.fill();}
    ctx.fillStyle=period==='night'?'#1c3e31':'#507d42';ctx.beginPath();ctx.ellipse(W*.68,H*.83,W*.24,H*.08,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=period==='night'?'#244a55':'#7cc6bf';ctx.beginPath();ctx.ellipse(W*.68,H*.81,W*.22,H*.055,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=period==='night'?'#315f3b':'#71984a';ctx.lineWidth=2;for(let i=0;i<70;i++){const x=(i*97)%W,y=H-(i*23%(H*.24));ctx.beginPath();ctx.moveTo(x,H);ctx.quadraticCurveTo(x+Math.sin(i)*12,y+20,x+Math.cos(i)*8,y);ctx.stroke();}
    if(weather==='rain'){ctx.strokeStyle='#d7f1ed66';ctx.lineWidth=1;for(let i=0;i<80;i++){const x=(i*73+performance.now()*.18)%W,y=(i*31+performance.now()*.32)%H;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+16);ctx.stroke();}}
  }
  function drawBug(b){
    const rare=b.data.rarity,grounded=['groundCrawl','leafCrawl','hopper','groundDash','waterSurface','underwater','treePerch'].includes(b.profile),bob=grounded?0:Math.sin(performance.now()/180+b.phase)*4,base=rare>=4?34:rare>=2?29:25;
    ctx.save();ctx.translate(b.x,b.y+bob);ctx.rotate(Math.atan2(b.vy,b.vx)+(b.vx<0?Math.PI:0));
    if(b.data.id==='firefly'||b.data.id==='heikebotaru'){const cycle=b.data.id==='firefly'?2:1.15,pulse=Math.pow(Math.max(0,Math.sin((b.age+b.phase)*Math.PI*2/cycle)),3),glow=18+pulse*34,g=ctx.createRadialGradient(0,0,1,0,0,glow);g.addColorStop(0,`rgba(225,255,104,${.9*pulse+.12})`);g.addColorStop(.28,`rgba(188,255,75,${.5*pulse})`);g.addColorStop(1,'rgba(180,255,80,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,glow,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f4ff83';ctx.globalAlpha=.22+pulse*.78;ctx.beginPath();ctx.ellipse(6,0,7,4,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.55;ctx.fillStyle='#d9ebd2';ctx.beginPath();ctx.ellipse(-1,-5,8,3,-.35,0,Math.PI*2);ctx.ellipse(-1,5,8,3,.35,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#18251c';ctx.beginPath();ctx.ellipse(-2,0,8,4,0,0,Math.PI*2);ctx.arc(-9,0,4,0,Math.PI*2);ctx.fill();ctx.restore();return;}
    if(rare>=4){ctx.globalAlpha=.25+.12*Math.sin(performance.now()/150);ctx.fillStyle=rarityColor(rare);ctx.beginPath();ctx.arc(0,0,base+15,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
    ctx.font=`${base}px "Apple Color Emoji","Noto Color Emoji",serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.data.icon,0,0);ctx.restore();
  }
  function drawCharacter(){
    const x=Math.max(16,Math.min(W-100,pointer.x-W*.22)), y=H-158, lean=Math.max(-.12,Math.min(.12,(pointer.x-x-100)/800));
    ctx.save();ctx.translate(x,y);ctx.rotate(lean);
    if(characterCanvas)ctx.drawImage(characterCanvas,0,0,280,374,0,0,105,140);else{ctx.font='88px serif';ctx.fillText('👴',0,100);}
    ctx.restore();
  }
  function drawNet(){
    const swing=swingClock>0, a=swing?swingClock/.34:0, cx=pointer.x,cy=pointer.y;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(swing?Math.sin((1-a)*Math.PI)*-.5:0);ctx.shadowColor='#0d281d55';ctx.shadowBlur=10;ctx.strokeStyle='#1474c5';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(0,0,48+swing*10,39+swing*7,-.15,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#ffffff77';ctx.lineWidth=1;for(let i=-30;i<=30;i+=10){ctx.beginPath();ctx.moveTo(-43,i);ctx.lineTo(43,i*.7);ctx.stroke();ctx.beginPath();ctx.moveTo(i,-35);ctx.lineTo(i*.7,35);ctx.stroke();}ctx.strokeStyle='#176ab2';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-40,28);ctx.lineTo(-108,103);ctx.stroke();ctx.strokeStyle='#172c29';ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(-96,90);ctx.lineTo(-121,118);ctx.stroke();ctx.restore();
  }
  function drawRipple(r){const p=1-r.life/.38;ctx.strokeStyle=`rgba(255,255,255,${1-p})`;ctx.lineWidth=4*(1-p);ctx.beginPath();ctx.arc(r.x,r.y,35+p*68,0,Math.PI*2);ctx.stroke();}
  function burst(x,y,color,n){for(let i=0;i<n;i++){const a=rand(0,Math.PI*2),s=rand(25,105);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.45,.9),max:.9,color,size:rand(2,7)});}}
  function drawParticle(p){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  const rarityColor=r=>['','#e8db74','#79bf79','#5f9bd3','#ae78d0','#f3a832'][r];

  function renderBook(){
    const found=Object.keys(save.bugs).filter(id=>BUGS.some(b=>b.id===id)).length;$('#progressText').textContent=`${found} / ${BUGS.length} 種類　達成度 ${Math.round(found/BUGS.length*100)}%`;
    const list=BUGS.filter(b=>bookFilter==='caught'?save.bugs[b.id]:bookFilter==='rare'?b.rarity>=4:true);
    $('#bookGrid').innerHTML=list.map((b,i)=>{const rec=save.bugs[b.id];return `<button class="bug-card ${rec?'':'unknown'}" data-bug="${b.id}"><em>No.${String(i+1).padStart(2,'0')}</em><span class="icon">${b.icon}</span><b>${rec?b.name:'？？？？'}</b><small>${'★'.repeat(b.rarity)}${'☆'.repeat(5-b.rarity)}</small></button>`}).join('');
    $$('.bug-card').forEach(el=>el.addEventListener('click',()=>openDetail(el.dataset.bug)));
  }
  function openBook(){fieldPaused=true;$('#bookScreen').classList.add('open');$('#newDot').classList.remove('show');renderBook();}
  function openDetail(id){const b=BUGS.find(x=>x.id===id),rec=save.bugs[id];if(!rec){toast('まだ出会っていない虫です');return;}const motion=MOTION_PROFILES[motionProfileFor(id)];$('#detailContent').innerHTML=`<div class="big-icon">${b.icon}</div><p class="stars">${'★'.repeat(b.rarity)}${'☆'.repeat(5-b.rarity)}</p><h2>${b.name}</h2><p class="latin">${b.latin}</p><p class="description">${b.desc}</p><p class="motion-note"><b>動き｜${motion.label}</b><span>${motion.desc}</span></p><div class="specs"><span><small>捕獲数</small><b>${rec.count} 匹</b></span><span><small>最大</small><b>${rec.best} mm</b></span><span><small>出会う時間</small><b>${b.period.map(x=>({day:'昼',evening:'夕',night:'夜'}[x])).join('・')}</b></span></div>`;$('#detailScreen').classList.add('open');}

  function toast(msg){clearTimeout(toastTimer);$('#toast').textContent=msg;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),1700);}
  function unlockAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();}
  function playBgm(restart=false){if(!soundOn||!running)return;if(restart)bgm.currentTime=0;bgm.play().catch(()=>{});}
  function stopBgm(){bgm.pause();bgm.currentTime=0;}
  function sound(type){if(!soundOn)return;unlockAudio();const now=audioCtx.currentTime, tones={start:[392,523,659],swing:[250,125],catch:[660,880],rare:[523,659,784,1046],chime:[440,660],miss:[130],finish:[392,494,587,784]}[type]||[440];tones.forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type==='swing'?'sawtooth':'sine';o.frequency.setValueAtTime(f,now+i*.075);if(type==='swing')o.frequency.exponentialRampToValueAtTime(Math.max(50,f*.45),now+.13);g.gain.setValueAtTime(.0001,now+i*.075);g.gain.exponentialRampToValueAtTime(type==='swing'?.035:.065,now+i*.075+.015);g.gain.exponentialRampToValueAtTime(.0001,now+i*.075+.18);o.connect(g).connect(audioCtx.destination);o.start(now+i*.075);o.stop(now+i*.075+.2);});}

  function closeOverlay(el){el.classList.remove('open');fieldPaused=$$('.overlay.open').length>0;if(!fieldPaused&&running)last=performance.now();}
  canvas.addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;});
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();pointer.x=e.clientX;pointer.y=e.clientY;swing();});
  document.addEventListener('keydown',e=>{const step=22;if(e.code==='ArrowLeft')pointer.x-=step;if(e.code==='ArrowRight')pointer.x+=step;if(e.code==='ArrowUp')pointer.y-=step;if(e.code==='ArrowDown')pointer.y+=step;if(e.code==='Space'||e.code==='Enter')swing();pointer.x=Math.max(40,Math.min(W-40,pointer.x));pointer.y=Math.max(110,Math.min(H-40,pointer.y));if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();});
  let lastTap=0;document.addEventListener('touchstart',e=>{const n=Date.now();if(n-lastTap<300)e.preventDefault();lastTap=n;},{passive:false});document.addEventListener('dblclick',e=>e.preventDefault());document.addEventListener('contextmenu',e=>e.preventDefault());
  $('#startBtn').addEventListener('click',startGame);$('#retryBtn').addEventListener('click',startGame);$('#bookBtn').addEventListener('click',openBook);$('#resultBookBtn').addEventListener('click',()=>{$('#resultScreen').classList.remove('open');openBook();});
  $('#helpBtn').addEventListener('click',()=>{fieldPaused=true;$('#helpScreen').classList.add('open');});
  $('#soundBtn').addEventListener('click',()=>{soundOn=!soundOn;save.sound=soundOn;persist();$('#soundBtn').textContent=soundOn?'♪':'×';if(soundOn){sound('chime');playBgm(false);}else bgm.pause();});
  $$('.close,[data-close]').forEach(b=>b.addEventListener('click',()=>closeOverlay(document.getElementById(b.dataset.close)||b.closest('.overlay'))));
  $('#filters').addEventListener('click',e=>{if(!e.target.dataset.filter)return;bookFilter=e.target.dataset.filter;$$('#filters button').forEach(b=>b.classList.toggle('active',b===e.target));renderBook();});
  $('#shareBtn').addEventListener('click',async()=>{const found=Object.keys(save.bugs).filter(id=>BUGS.some(b=>b.id===id)).length,text=`「むしあみ日和」で昆虫図鑑を${found}/${BUGS.length}種類集めました！`;try{if(navigator.share)await navigator.share({title:'むしあみ日和',text});else{await navigator.clipboard.writeText(text);toast('記録をコピーしました');}}catch{}});
  $('#resetBtn').addEventListener('click',()=>{if(confirm('図鑑の記録をすべて消しますか？')){save={bugs:{},sound:soundOn,plays:0};persist();updateBookCount();renderBook();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){fieldPaused=true;bgm.pause();}else{fieldPaused=$$('.overlay.open').length>0;playBgm(false);}});
  window.addEventListener('resize',resize);window.addEventListener('pointerdown',unlockAudio,{once:true});
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});

  function loop(now){const dt=Math.min(.034,(now-last||0)/1000);last=now;updateWorld(dt);draw();requestAnimationFrame(loop);}
  resize();updateBookCount();updateHud();updateFieldLabel();$('#soundBtn').textContent=soundOn?'♪':'×';requestAnimationFrame(loop);
})();
