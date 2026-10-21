/* 影の大地：忘れられた城塞
   モバイル優先のテキストRPG。GM（フェルン）が進行。
   - データ整合: イベントIDを記録して再発防止
   - メイン: 欠片4つ → 儀式 → 影の王
   - サイド/ランダム: ログへ追加、重複回避
   - 自由入力: キーワードで柔軟に処理
*/

(() => {
    // ==== 基本UI参照 ====
    const logEl = document.getElementById('log');
    const choicesEl = document.getElementById('choices');
    const cmdForm = document.getElementById('commandBar');
    const cmdInput = document.getElementById('cmd');
    const btnSend = document.getElementById('send');
    const hpEl = document.getElementById('hp');
    const locEl = document.getElementById('loc');
    const shardsEl = document.getElementById('shards');
    const menu = document.getElementById('menu');
    const btnMenu = document.getElementById('btnMenu');
    const btnCloseMenu = document.getElementById('btnCloseMenu');
    const inventoryList = document.getElementById('inventoryList');
    const progressEl = document.getElementById('progress');
    const btnSave = document.getElementById('btnSave');
    const btnLoad = document.getElementById('btnLoad');
    const btnHelp = document.getElementById('btnHelp');
    const btnTextUp = document.getElementById('btnTextUp');
    const btnTextDown = document.getElementById('btnTextDown');
  
    // ==== ユーティリティ ====
    const vibrate = (ms=18)=> { if (navigator.vibrate) navigator.vibrate(ms); };
    const rnd = (n)=> Math.floor(Math.random()*n);
    const clamp = (v,min,max)=> Math.max(min, Math.min(max, v));
  
    // ==== セーブデータ ====
    const SAVE_KEY = 'shadowlands.save.v1';
  
    // ==== ゲーム状態 ====
    let S = null; // state
  
    const defaultState = () => ({
      meta: { version:1, time: Date.now() },
      player: {
        name: "エリオット・ストーンウォーカー",
        hp: 100, maxHp: 100,
        str: 15, agi: 12, int: 10, cha: 8
      },
      location: "忘れられた城塞・前庭",
      shards: [], // ["灰の森",...]
      inventory: ["薬草 ×2", "旅人の剣", "革の鎧", "冒険者のバッグ"],
      allies: [], // 例: ["影従者"]
      flags: {
        ritualLearned: false,
        finalUnlocked: false
      },
      eventsDone: {}, // { id:true }
      logCount: 0
    });
  
    // ==== 表示 ====
    function addEntry(html, cls='gm'){
      const wrap = document.createElement('article');
      wrap.className = `entry ${cls}`;
      wrap.innerHTML = html;
      logEl.appendChild(wrap);
      S.logCount++;
      wrap.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    function sayGM(text){
      addEntry(`<small>GM（フェルン）</small><p>${escapeHtml(text)}</p>`, 'gm');
      vibrate();
    }
    function saySys(text){
      addEntry(`<small>システム</small><p class="mono">${escapeHtml(text)}</p>`, 'sys');
    }
    function sayPlayer(text){
      addEntry(`<small>あなた</small><p>${escapeHtml(text)}</p>`, 'player');
    }
    function clearChoices(){
      choicesEl.replaceChildren();
    }
    function choice(label, onClick){
      const b = document.createElement('button');
      b.className = 'choice';
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', () => { vibrate(); onClick(); });
      choicesEl.appendChild(b);
    }
    function setStatus(){
      hpEl.textContent = `HP: ${S.player.hp}/${S.player.maxHp}`;
      locEl.textContent = `場所: ${S.location}`;
      shardsEl.textContent = `欠片: ${S.shards.length}/4`;
    }
    function refreshMenu(){
      inventoryList.replaceChildren();
      S.inventory.forEach(it=>{
        const li = document.createElement('li');
        li.textContent = it;
        inventoryList.appendChild(li);
      });
      const lines = [];
      lines.push(`・欠片：${S.shards.join('、 ') || 'なし'}`);
      lines.push(`・儀式：${S.flags.ritualLearned ? '手順を把握' : '未解明'}`);
      lines.push(`・仲間：${S.allies.join('、 ') || 'なし'}`);
      progressEl.textContent = lines.join('\n');
    }
  
    // ==== セーブ・ロード ====
    function save(){
      localStorage.setItem(SAVE_KEY, JSON.stringify(S));
      saySys('セーブしました。');
    }
    function load(){
      const raw = localStorage.getItem(SAVE_KEY);
      if(!raw){ saySys('セーブデータがありません。'); return }
      try{
        S = JSON.parse(raw);
        saySys('ロードしました。');
        setStatus();
        refreshMenu();
        // 再開案内
        sayGM('……続きから再開します。状況を確認してください。');
        offerNext();
      }catch(e){
        saySys('ロードに失敗しました。');
      }
    }
  
    // ==== 文字サイズ ====
    function setFont(delta){
      const root = document.documentElement;
      const style = getComputedStyle(root);
      const cur = parseFloat(style.getPropertyValue('--size')) || 17;
      const next = clamp(cur + delta, 14, 22);
      root.style.setProperty('--size', next + 'px');
    }
  
    // ==== HTMLエスケープ ====
    function escapeHtml(s){
      return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
  
    // ==== ステータス操作 ====
    function heal(amount){
      S.player.hp = clamp(S.player.hp + amount, 0, S.player.maxHp);
      setStatus();
    }
    function damage(amount, reason=''){
      S.player.hp = clamp(S.player.hp - amount, 0, S.player.maxHp);
      setStatus();
      if (S.player.hp <= 0){
        gameOver(reason || '力尽きた');
      }
    }
    function gameOver(reason){
      clearChoices();
      sayGM(`終わりです。${reason}。`);
      choice('はじめから', ()=> startNew());
      choice('ロード', ()=> load());
    }
  
    // ==== 判定 ====
    function skillCheck(statKey, difficulty, opts={}){
      // d20 + 能力 + 修正。仲間や欠片で小さな補正。
      const d = 1 + rnd(20);
      let ability = S.player[statKey] || 0;
      let mod = 0;
      if (S.allies.includes('影従者') && (statKey==='int' || statKey==='cha')) mod += 2;
      if (S.shards.includes('沈みゆく街') && statKey==='int') mod += 1; // 知の残響
      if (S.shards.includes('砕けた峰') && statKey==='str') mod += 1; // 武の記憶
      const total = d + ability + mod;
      const success = total >= difficulty;
      if (opts.explain){
        saySys(`判定: d20(${d}) + 能力(${ability}) + 修正(${mod}) = ${total} / 目標${difficulty} → ${success ? '成功' : '失敗'}`);
      }
      return success;
    }
  
    // ==== イベント重複防止 ====
    function done(id){ S.eventsDone[id]=true; }
    function seen(id){ return !!S.eventsDone[id]; }
  
    // ==== 導入 ====
    function intro(){
      sayGM('……君は忘れられた城塞の前にいる。霧、冷気、微かな呻き。門は半開き。どうする？');
      clearChoices();
      choice('1) 城塞の中に入る', ()=> enterCastle());
      choice('2) 周囲を探索する', ()=> exploreAround());
      choice('3) しばらく考える', ()=> waitAwhile());
    }
  
    // ==== シーン ====
    function enterCastle(){
      S.location = '城塞・外門廊';
      setStatus();
      sayGM('石床が軋む。古い旗。奥に暗い回廊。');
      clearChoices();
      choice('回廊を進む', ()=> corridor());
      choice('引き返す', ()=> { S.location='忘れられた城塞・前庭'; setStatus(); intro(); });
    }
  
    function corridor(){
      S.location = '城塞・回廊';
      setStatus();
      if (!seen('castle.map') ){
        sayGM('机に地図の断片。手に取るか？');
        clearChoices();
        choice('地図の断片を拾う', ()=> {
          S.inventory.push('地図の断片A');
          done('castle.map');
          sayGM('……はい。入手。目的地が四つ示されている。灰の森／砕けた峰／沈みゆく街／炎の深淵。');
          travelHub();
        });
        choice('無視する', ()=> travelHub());
      }else{
        travelHub();
      }
    }
  
    function exploreAround(){
      S.location = '城塞周辺';
      setStatus();
      if (!seen('around.cache')){
        sayGM('茂みから小さな包み。薬草。');
        S.inventory.push('薬草 ×1');
        done('around.cache');
      } else {
        sayGM('痕跡は薄い。風だけ。');
      }
      clearChoices();
      choice('城塞に戻る', ()=> intro());
      choice('目印を探す', ()=> {
        sayGM('古い道標。「灰の森→」'); travelHub();
      });
    }
  
    function waitAwhile(){
      sayGM('……わかりました。少し待ちます。');
      randomEvent('frontyard');
      clearChoices();
      choice('考えをまとめる', ()=> offerNext());
      choice('周囲を見渡す', ()=> exploreAround());
    }
  
    function travelHub(){
      sayGM('向かう先を選んでください。');
      clearChoices();
      choice('灰の森', ()=> region_forest());
      choice('砕けた峰', ()=> region_peak());
      choice('沈みゆく街', ()=> region_city());
      choice('炎の深淵', ()=> region_abyss());
      choice('城塞に留まる', ()=> intro());
    }
  
    // ==== ランダムイベント ====
    function randomEvent(scope){
      const pool = [
        { id:`${scope}.wisp`, text:'青白い灯りが漂う。触れると温かい。HP+5', once:true, run:()=> heal(5) },
        { id:`${scope}.trap`, text:'足元の罠。反応が遅い。HP-8', once:false, run:()=> damage(8,'罠') },
        { id:`${scope}.note`, text:'誰かの手記。「欠片は意志を映す」。', once:true, run:()=>{} },
        { id:`${scope}.merchant`, text:'行商人。「薬草と交換、骨片3つで」……骨片はない。', once:true, run:()=>{} },
      ];
      // 未実行を優先
      const unused = pool.filter(e=>!seen(e.id));
      const pick = (unused.length? unused : pool)[rnd(unused.length? unused.length:pool.length)];
      done(pick.id);
      sayGM(pick.text);
      pick.run();
    }
  
    // ==== 地域：灰の森 ====
    function region_forest(){
      S.location = '灰の森・縁';
      setStatus();
      sayGM('灰を被った木々。音が吸われる。');
      if (!S.shards.includes('灰の森')){
        forestChain();
      } else {
        clearChoices();
        choice('さらに森を進む', ()=> { randomEvent('forest'); offerNext(); });
        choice('別の地へ', travelHub);
      }
    }
    function forestChain(){
      clearChoices();
      choice('囁き声の方へ', ()=> {
        const ok = skillCheck('wis', 99); // ない能力→常に失敗…は不親切
      });
      choice('足跡を追う（敏捷）', ()=> {
        const ok = skillCheck('agi', 22, {explain:true});
        if (ok){
          sayGM('素早く枝を避ける。気配の根へ達する。');
          forestBoss();
        } else {
          sayGM('枝に阻まれる。頬に細い傷。HP-5');
          damage(5,'枝で負傷');
          randomEvent('forest');
          offerNext();
        }
      });
      choice('音を立てずに周回（知力）', ()=> {
        const ok = skillCheck('int', 18, {explain:true});
        if (ok){
          sayGM('静かな経路を見つけた。中心部へ。');
          forestBoss();
        } else {
          sayGM('迷った。戻る途中で印をつけた。');
          randomEvent('forest');
          offerNext();
        }
      });
      choice('戻る', travelHub);
    }
    function forestBoss(){
      sayGM('灰狼。目は空色。戦うか、落ち着かせるか。');
      clearChoices();
      choice('戦う（力）', ()=> {
        const ok = skillCheck('str', 20, {explain:true});
        if (ok){ sayGM('斬撃。狼は霧へ解け、欠片を残す。'); gainShard('灰の森'); }
        else { sayGM('反撃を受ける。HP-12'); damage(12,'灰狼'); offerNext(); }
      });
      choice('落ち着かせる（魅力）', ()=> {
        const ok = skillCheck('cha', 19, {explain:true});
        if (ok){ sayGM('低く呼吸を合わせる。狼は頭を垂れ、欠片を置いた。'); gainShard('灰の森'); }
        else { sayGM('通じない。牙が光る。HP-8'); damage(8,'灰狼'); offerNext(); }
      });
      choice('退く', region_forest);
    }
  
    // ==== 地域：砕けた峰 ====
    function region_peak(){
      S.location = '砕けた峰・登路';
      setStatus();
      sayGM('崩れた梯子、切れた鎖。風が強い。');
      clearChoices();
      if (!S.shards.includes('砕けた峰')){
        choice('岩場をよじ登る（力）', ()=> {
          const ok = skillCheck('str', 21, {explain:true});
          if (ok){ sayGM('山頂の祭壇に辿り着く。岩の心臓が脈打つ。'); peakBoss(); }
          else { sayGM('手が滑る。HP-10'); damage(10,'転落'); offerNext(); }
        });
        choice('安全な道を探す（知力）', ()=> {
          const ok = skillCheck('int', 18, {explain:true});
          if (ok){ sayGM('迂回路。時間はかかったが安全だ。'); peakBoss(); }
          else { sayGM('袋小路。雷鳴だけが答える。'); randomEvent('peak'); offerNext(); }
        });
      } else {
        choice('峰を見渡す', ()=> { randomEvent('peak'); offerNext(); });
      }
      choice('別の地へ', travelHub);
    }
    function peakBoss(){
      sayGM('石像の守り手が動き出す。');
      clearChoices();
      choice('正面から砕く（力）', ()=> {
        const ok = skillCheck('str', 22, {explain:true});
        if (ok){ sayGM('破砕音。中から欠片がこぼれる。'); gainShard('砕けた峰'); }
        else { sayGM('刃が弾かれる。HP-12'); damage(12,'石像'); offerNext(); }
      });
      choice('関節を狙う（敏捷）', ()=> {
        const ok = skillCheck('agi', 20, {explain:true});
        if (ok){ sayGM('弱点を突く。綻びから欠片。'); gainShard('砕けた峰'); }
        else { sayGM('掠り傷。HP-7'); damage(7,'石像'); offerNext(); }
      });
      choice('退く', region_peak);
    }
  
    // ==== 地域：沈みゆく街 ====
    function region_city(){
      S.location = '沈みゆく街・外縁';
      setStatus();
      sayGM('水路に霧。鐘の音が遠い。');
      clearChoices();
      if (!S.shards.includes('沈みゆく街')){
        choice('図書塔を探す（知力）', ()=> {
          const ok = skillCheck('int', 20, {explain:true});
          if (ok){ sayGM('沈んだ書庫から儀式の記述。鍵は四つの欠片。'); S.flags.ritualLearned = true; cityBoss(); }
          else { sayGM('書は朽ちていた。'); randomEvent('city'); offerNext(); }
        });
        choice('住人を探す（魅力）', ()=> {
          const ok = skillCheck('cha', 19, {explain:true});
          if (ok){ sayGM('影人が協力。水門を開けてくれた。'); cityBoss(); }
          else { sayGM('姿は見えるのに近寄らない。'); randomEvent('city'); offerNext(); }
        });
      } else {
        choice('記録を読み返す', ()=> { sayGM('「封印は中心に還る」'); offerNext(); });
      }
      choice('別の地へ', travelHub);
    }
    function cityBoss(){
      sayGM('水底で黒鱗が蠢く。');
      clearChoices();
      choice('光で惑わす（知力）', ()=> {
        const ok = skillCheck('int', 21, {explain:true});
        if (ok){ sayGM('光が鱗を裂き、欠片が浮かぶ。'); gainShard('沈みゆく街'); }
        else { sayGM('光量不足。尾で弾かれる。HP-9'); damage(9,'黒鱗'); offerNext(); }
      });
      choice('友好的に歌う（魅力）', ()=> {
        const ok = skillCheck('cha', 21, {explain:true});
        if (ok){ sayGM('歌に反応し、欠片を吐き出した。'); gainShard('沈みゆく街'); }
        else { sayGM('静まり返る水面。寒気。HP-6'); damage(6,'冷え'); offerNext(); }
      });
      choice('退く', region_city);
    }
  
    // ==== 地域：炎の深淵 ====
    function region_abyss(){
      S.location = '炎の深淵・前縁';
      setStatus();
      sayGM('熱風。赤い裂け目。灰が舞う。');
      clearChoices();
      if (!S.shards.includes('炎の深淵')){
        choice('耐える（体力）', ()=> {
          const ok = skillCheck('str', 20, {explain:true}); // 体力→力で代用
          if (ok){ sayGM('灼熱に耐え、中心へ到達。'); abyssBoss(); }
          else { sayGM('喉が焼ける。HP-10'); damage(10,'熱'); offerNext(); }
        });
        choice('熱の筋を読む（知力）', ()=> {
          const ok = skillCheck('int', 19, {explain:true});
          if (ok){ sayGM('涼しい流れを見つけた。'); abyssBoss(); }
          else { sayGM('立ちくらみ。'); randomEvent('abyss'); offerNext(); }
        });
      } else {
        choice('残り火を観察', ()=> { randomEvent('abyss'); offerNext(); });
      }
      choice('別の地へ', travelHub);
    }
    function abyssBoss(){
      sayGM('炎の巨影が立ち上がる。');
      clearChoices();
      choice('切り結ぶ（力）', ()=> {
        const ok = skillCheck('str', 22, {explain:true});
        if (ok){ sayGM('炎は割れ、黒核から欠片。'); gainShard('炎の深淵'); }
        else { sayGM('焼ける熱。HP-12'); damage(12,'炎影'); offerNext(); }
      });
      choice('熱の舞を躱す（敏捷）', ()=> {
        const ok = skillCheck('agi', 21, {explain:true});
        if (ok){ sayGM('舞うように回避、核を穿つ。'); gainShard('炎の深淵'); }
        else { sayGM('足を取られる。HP-8'); damage(8,'炎影'); offerNext(); }
      });
      choice('退く', region_abyss);
    }
  
    // ==== 欠片取得 ====
    function gainShard(name){
      if (!S.shards.includes(name)){
        S.shards.push(name);
        saySys(`「影の欠片（${name}）」を入手。`);
        setStatus();
        if (S.shards.length === 4){
          S.flags.finalUnlocked = true;
          sayGM('四つ揃った。儀式は城塞の中心で。');
          finalApproach();
          return;
        }
      }
      offerNext();
    }
  
    // ==== 終盤 ====
    function finalApproach(){
      S.location = '城塞・中心聖堂';
      setStatus();
      sayGM('黒い風。封印陣は欠けている。どうする？');
      clearChoices();
      choice('儀式を行う（封印）', ()=> {
        if (!S.flags.ritualLearned){
          sayGM('手順が不十分。やり直すべきです。');
          offerNext();
          return;
        }
        const ok = skillCheck('int', 22, {explain:true});
        if (ok){
          ending('seal');
        } else {
          sayGM('詠唱が乱れた。影の王が目を開く。');
          finalBattle();
        }
      });
      choice('影の王を討つ（決戦）', ()=> finalBattle());
      choice('準備を整える', ()=> {
        randomEvent('sanctum');
        offerNext();
      });
    }
  
    function finalBattle(){
      S.location = '城塞・深核';
      setStatus();
      sayGM('影の王が現れる。巨大な空洞の声。');
      clearChoices();
      choice('力で押し切る（力）', ()=> {
        const ok = skillCheck('str', 24, {explain:true});
        if (ok){ ending('slay'); }
        else { sayGM('押し負ける。HP-20'); damage(20,'影の王'); if (S.player.hp>0) offerNext(); }
      });
      choice('隙を作る（敏捷）', ()=> {
        const ok = skillCheck('agi', 23, {explain:true});
        if (ok){ ending('slay'); }
        else { sayGM('掴まれかける。HP-14'); damage(14,'影の王'); if (S.player.hp>0) offerNext(); }
      });
      choice('言葉で縛る（魅力+知）', ()=> {
        const ok = (skillCheck('cha', 21) && skillCheck('int', 21, {explain:true}));
        if (ok){ ending('seal'); }
        else { sayGM('嘲笑が返る。HP-10'); damage(10,'影の王'); if (S.player.hp>0) offerNext(); }
      });
      choice('退く', finalApproach);
    }
  
    function ending(kind){
      clearChoices();
      if (kind==='seal'){
        sayGM('……封印は完了。世界は少しの間だけ静かになる。');
        saySys('エンディングA：封印による小さな平穏');
      } else if (kind==='slay'){
        sayGM('剣が核を砕く。黒風が消える。代償は大きい。');
        saySys('エンディングB：討伐。ただし犠牲は残る');
      } else {
        sayGM('封印は敗れ、闇が満ちる。');
        saySys('エンディングC：復活。世界は影へ');
      }
      choice('はじめから', ()=> startNew());
      choice('ロード', ()=> load());
    }
  
    // ==== 次の行き先ガイド ====
    function offerNext(){
      clearChoices();
      if (S.flags.finalUnlocked){
        choice('城塞の中心へ（最終章）', finalApproach);
      }
      choice('旅路に戻る', travelHub);
      choice('インベントリを開く', ()=> { openMenu(); });
    }
  
    // ==== コマンド入力 ====
    cmdForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const raw = cmdInput.value.trim();
      if (!raw) return;
      sayPlayer(raw);
      handleCommand(raw);
      cmdInput.value = '';
    });
  
    function handleCommand(raw){
      const s = raw.replace(/\s+/g,'');
      const useHerb = /(薬草|回復).*(使|飲|食)|使.*薬草/.test(s);
      const inv = /(持ち物|インベントリ|所持)/.test(s);
      const map = /(地図|マップ|進行)/.test(s);
      const saveReq = /(セーブ|保存)/.test(s);
      const loadReq = /(ロード|読込)/.test(s);
      const helpReq = /(ヘルプ|使い方|説明)/.test(s);
      const goForest = /(森|灰の森)/.test(s);
      const goPeak = /(峰|山|砕けた峰)/.test(s);
      const goCity = /(街|沈みゆく街|都市)/.test(s);
      const goAbyss = /(深淵|火口|炎の深淵)/.test(s);
      const enter = /(入る|進む)/.test(s);
      const explore = /(探す|探索|調べる)/.test(s);
      const wait = /(待つ|休む)/.test(s);
      const ritual = /(儀式|封印)/.test(s);
      const boss = /(王|決戦|最終)/.test(s);
      const use = /使う(.+)/.exec(raw);
  
      if (useHerb){
        const idx = S.inventory.findIndex(x=>/^薬草/.test(x));
        if (idx>-1){
          S.inventory.splice(idx,1);
          heal(15);
          sayGM('薬草を使いました。HP+15');
          refreshMenu();
        } else {
          sayGM('薬草はありません。');
        }
        return offerNext();
      }
      if (inv){ openMenu(); return }
      if (map){ openMenu(); return }
      if (saveReq){ save(); return }
      if (loadReq){ load(); return }
      if (helpReq){ showHelp(); return }
      if (ritual && S.flags.finalUnlocked){ return finalApproach(); }
      if (boss && S.flags.finalUnlocked){ return finalBattle(); }
      if (goForest) return region_forest();
      if (goPeak) return region_peak();
      if (goCity) return region_city();
      if (goAbyss) return region_abyss();
      if (enter) return enterCastle();
      if (explore) return exploreAround();
      if (wait){ sayGM('少し待ちます。'); randomEvent('generic'); return offerNext(); }
  
      // アイテム名で使う（例：「松明を使う」）
      if (use && use[1]){
        const name = use[1].trim();
        const idx = S.inventory.findIndex(x=> x.includes(name));
        if (idx>-1){
          sayGM(`「${S.inventory[idx]}」を使います。効果は限定的です。`);
          randomEvent('use');
        } else {
          sayGM('それは持っていません。');
        }
        return offerNext();
      }
  
      // 不明コマンド
      sayGM('……理解しましたが、具体的に指示してください。');
      offerNext();
    }
  
    function showHelp(){
      sayGM('短く。基本操作です。');
      addEntry(`<ul>
        <li><kbd>ボタン</kbd>で選択。</li>
        <li>自由入力例：<span class="mono">薬草を使う / 森へ / 儀式 / セーブ / インベントリ</span></li>
        <li>欠片を4つ集めたら最終章。</li>
        <li>判定は d20 + 能力。必要なら詳細を表示します。</li>
      </ul>`);
    }
  
    // ==== メニュー ====
    function openMenu(){ refreshMenu(); menu.showModal(); }
    btnMenu.addEventListener('click', openMenu);
    btnCloseMenu.addEventListener('click', ()=> menu.close());
    btnSave.addEventListener('click', save);
    btnLoad.addEventListener('click', load);
    btnHelp.addEventListener('click', showHelp);
  
    // ==== テキストサイズ ====
    btnTextUp.addEventListener('click', ()=> setFont(+1));
    btnTextDown.addEventListener('click', ()=> setFont(-1));
  
    // ==== スタート ====
    function startNew(){
      S = defaultState();
      logEl.replaceChildren();
      sayGM('……始めます。落ち着いて判断してください。');
      setStatus();
      intro();
    }
  
    // 起動時：セーブがあれば選択肢を出す
    (function boot(){
      S = defaultState();
      setStatus();
      const hasSave = !!localStorage.getItem(SAVE_KEY);
      sayGM('君は忘れられた城塞の前に立っている。霧、冷気。門はかすかに開いている。どうする？');
      clearChoices();
      choice('1) 城塞の中に入る', ()=> enterCastle());
      choice('2) 周囲を探索する', ()=> exploreAround());
      choice('3) しばらく考える', ()=> waitAwhile());
      if (hasSave){
        choice('ロードして再開', ()=> load());
      }
      showHelp();
    })();
  
  })();
  