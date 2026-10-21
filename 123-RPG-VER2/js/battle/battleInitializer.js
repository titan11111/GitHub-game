/* ============================================
   戦闘初期化モジュール
   ============================================
   
   役割: 戦闘の開始と初期化処理を担当する
   
   責務:
   - 各種戦闘タイプの開始処理（通常戦闘、仲間試練、ボス戦など）
   - 戦闘状態の初期化
   - 戦闘画面の表示とBGM切り替え
   - 戦闘開始演出
   
   含まれる処理:
   - startBattle() - 通常戦闘開始（レア猫がみさまの出現判定含む）
   - startAllyTrialBattle() - 仲間試練戦闘開始
   - startWaterSpiritBattle() - 水の精霊戦闘開始（再戦のたびに強くなる）
   - startForestWitchBattle() - 森の魔女戦闘開始
   - startBossBattle() - ボス戦闘開始
   - initBattle() - 戦闘初期化（UI更新、BGM切り替え、状態リセット）
   - showBattleStartAnimation() - FF風戦闘開始演出
   
   依存関係:
   - hero, gameState, party, allyData, monsterTable, worldMaps, TILE - gameState.js, config.js で定義
   - updateBattleStatus(), updateEnemyHPBar(), addBattleLog(), updateCommandCursor(), hideMagicList(), setupCommandTouchHandlers() - battle/battleUI.js で定義
   - showScreen() - ui.js で定義
   - stopAllBGM(), playBGM() - audio.js で定義
   - playSfxEncounter(), playSfxBattleStart() - sfx.js で定義
   - IMAGE_EXTENSIONS - config.js で定義
   
   検索性:
   - 戦闘開始を探す: このファイル
   - 新しい戦闘タイプを追加: このファイルに新しい開始関数を追加
   - 戦闘初期化処理を変更: このファイル内の initBattle()
   ============================================ */

/**
 * 通常戦闘開始
 */
function startBattle() {
    gameState.isBattle = true;
    gameState.isBattleEnding = false;
    
    // 3%の確率で「レア猫がみさま」を出現
    if (Math.random() < 0.03) {
        gameState.currentEnemy = {
            name: "レア猫がみさま",
            hp: 2000,
            maxHp: 2000,
            atk: 80,
            exp: 5000,
            gold: 2000,
            img: "images/catgod.png",
            isRareCatGod: true // 特殊フラグ
        };
    } else {
        // 通常の敵を選択
        const areaMonsters = monsterTable[hero.currentArea] || monsterTable["green_field"];
        const randomIndex = Math.floor(Math.random() * areaMonsters.length);
        gameState.currentEnemy = { ...areaMonsters[randomIndex] };
    }
    
    // 敵エンカウント効果音を再生
    if (typeof playSfxEncounter === 'function') {
        playSfxEncounter();
    }
    
    initBattle();
}

/**
 * 仲間との試練戦闘開始（話しかけた後、勝てば仲間・負けてもゲームオーバーにならない）
 * @param {number} tile - 仲間タイル（TILE.ALLY_DOG 等）
 */
function startAllyTrialBattle(tile) {
    const ally = allyData[tile];
    if (!ally || party.find(m => m.name === ally.name)) return;
    gameState.isBattle = true;
    gameState.isBattleEnding = false;
    gameState.isAllyTrialBattle = true;
    gameState.allyTrialTile = tile;
    // 仲間のタイルの位置を保存（勝利後にタイルを削除するため）
    gameState.allyTrialTilePosition = { x: hero.x, y: hero.y, area: hero.currentArea };
    gameState.currentEnemy = {
        name: ally.name,
        hp: ally.maxHp,
        maxHp: ally.maxHp,
        atk: ally.atk,
        exp: 0,
        gold: 0,
        img: ally.battleImg || "images/dog.png"
    };
    if (typeof playSfxEncounter === 'function') {
        playSfxEncounter();
    }
    initBattle();
    addBattleLog(`${ally.name}:「${ally.trialMsg}」`);
    addBattleLog("戦いが始まった！");
}

/**
 * 水の精霊戦闘開始（水の精霊のすみか・話すと戦闘・再戦のたびに強くなる）
 */
function startWaterSpiritBattle() {
    const count = gameState.waterSpiritDefeatCount || 0;
    const hpBonus = 220 + 500 + count * 80;
    const atkBonus = 28 + count * 6;
    const expBonus = 450 + count * 100;
    const goldBonus = 220 + count * 50;
    gameState.isBattle = true;
    gameState.isBattleEnding = false;
    gameState.currentEnemy = {
        name: "水の精霊",
        hp: hpBonus,
        maxHp: hpBonus,
        atk: atkBonus,
        exp: expBonus,
        gold: goldBonus,
        img: "images/水龍.png"
    };
    if (typeof playSfxEncounter === 'function') {
        playSfxEncounter();
    }
    initBattle();
    if (count > 0) {
        addBattleLog(`水の精霊がさらに力を解放した！（${count + 1}度目の対決）`);
    }
    addBattleLog("水の精霊:「もし私に勝ったとしたら、出来る限りの望みを叶えてやろう。」");
    addBattleLog("戦いが始まった！");
}

/**
 * 森の魔女戦闘開始（魔物の森の強敵・話すと戦闘）
 */
function startForestWitchBattle() {
    gameState.isBattle = true;
    gameState.isBattleEnding = false;
    gameState.currentEnemy = {
        name: "森の魔女",
        hp: 380,
        maxHp: 380,
        atk: 42,
        exp: 680,
        gold: 350,
        img: "images/うらみ.png"
    };
    if (typeof playSfxEncounter === 'function') {
        playSfxEncounter();
    }
    initBattle();
    addBattleLog("森の魔女があらわれた！");
}

/**
 * ボス戦闘開始
 */
function startBossBattle() {
    gameState.isBattle = true;
    gameState.isBattleEnding = false;
    gameState.currentEnemy = { 
        name: "魔王", 
        hp: 1500, 
        atk: 60, 
        exp: 0, 
        gold: 0, 
        img: "images/魔王.png" 
    };
    initBattle();
}

/**
 * 戦闘初期化処理
 */
function initBattle() {
    gameState.canAttack = true;
    const enemy = gameState.currentEnemy;
    
    // 敵名表示
    document.getElementById('monster-name').innerText = enemy.name;
    
    // 敵の最大HPを保存（HPバー表示用）
    if (!enemy.maxHp) {
        enemy.maxHp = enemy.hp;
    }
    
    // 敵スプライト表示（画像か絵文字かを判定）
    // 大文字小文字を区別しない判定（.PNG, .png, .JPG, .jpg などに対応）
    const imgLower = (enemy.img || '').toLowerCase();
    const isImage = IMAGE_EXTENSIONS.some(ext => imgLower.endsWith(ext.toLowerCase()));
    const spriteElement = document.getElementById('monster-sprite');
    
    // デバッグログ（開発時のみ）
    if (!enemy.img) {
        console.warn(`[initBattle] enemy.imgが未定義です: ${enemy.name}`);
    } else {
        console.log(`[initBattle] 敵画像判定: name=${enemy.name}, img=${enemy.img}, isImage=${isImage}`);
    }
    
    if (isImage) {
        // iOS対応: 画像の読み込みを確実にするため、Imageオブジェクトで事前読み込み
        const img = new Image();
        // iOS対応: 日本語ファイル名をURLエンコード（iOS Safariで確実に読み込むため）
        let imgSrc = enemy.img;
        // パス部分とファイル名部分を分離してエンコード
        const pathParts = imgSrc.split('/');
        const fileName = pathParts.pop();
        const encodedFileName = encodeURIComponent(fileName);
        const encodedPath = pathParts.join('/') + '/' + encodedFileName;
        
        // 画像読み込み成功時
        img.onload = function() {
            console.log(`[initBattle] 画像読み込み成功: ${imgSrc}`);
            spriteElement.innerHTML = '';
            const displayImg = document.createElement('img');
            // iOS対応: エンコードされたパスを使用
            displayImg.src = encodedPath;
            displayImg.alt = enemy.name;
            displayImg.style.width = '100%';
            displayImg.style.height = '100%';
            displayImg.style.objectFit = 'contain';
            displayImg.style.objectPosition = 'center center';
            displayImg.style.display = 'block';
            // iOS対応: 画像の読み込み属性を追加
            displayImg.loading = 'eager';
            displayImg.decoding = 'async';
            // iOS対応: 画像が確実に表示されるように
            displayImg.onerror = function() {
                console.error(`[initBattle] 画像表示エラー（エンコード後）: ${encodedPath}`);
                // エンコード前のパスで再試行
                displayImg.src = imgSrc;
                displayImg.onerror = function() {
                    console.error(`[initBattle] 画像表示エラー（元のパス）: ${imgSrc}`);
                    spriteElement.innerHTML = `<div style="font-size: 48px; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; height: 100%;">${enemy.name}</div>`;
                };
            };
            spriteElement.appendChild(displayImg);
        };
        
        // 画像読み込みエラー時: エンコード前のパスで再試行
        img.onerror = function() {
            console.warn(`[initBattle] 画像読み込みエラー（エンコード後）: ${encodedPath}、元のパスで再試行: ${imgSrc}`);
            // エンコード前のパスで再試行
            img.src = imgSrc;
            img.onerror = function() {
                console.error(`[initBattle] 画像読み込みエラー（元のパス）: ${imgSrc}`);
                spriteElement.innerHTML = `<div style="font-size: 48px; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; height: 100%;">${enemy.name}</div>`;
            };
        };
        
        // 画像の読み込みを開始（iOS対応: エンコードされたパスから試行）
        img.src = encodedPath;
        
        // 読み込み中の表示（既存の画像をクリア）
        spriteElement.innerHTML = '<div style="font-size: 24px; color: #888; display: flex; align-items: center; justify-content: center; height: 100%;">読み込み中...</div>';
    } else {
        spriteElement.innerHTML = enemy.img;
    }

    // 戦闘ログをクリア
    document.getElementById('battle-log').innerHTML = '';
    
    // UI更新
    updateBattleStatus();
    updateEnemyHPBar();
    
    // コマンド選択をリセット
    gameState.battleCommandIndex = 0;
    gameState.isSelectingMagic = false;
    gameState.enemyStatus = {};
    gameState.heroBuffs = {
        ironGuard: false,
        diamondSkin: false,
        diamondSkinTurns: 0,
        selfStun: 0
    };
    updateCommandCursor();
    hideMagicList();
    
    // iOS: コマンドリストのタッチ操作対応
    setupCommandTouchHandlers();
    
    // 即座に戦闘画面を表示（フェードイン効果付き）
    showScreen('battle-screen');
    
    // フィールドBGMを確実に停止してから戦闘BGMを再生
    stopAllBGM();
    
    // ボス戦か通常戦闘かでBGMを切り替え（少し待機してから再生、音量1.2）
    const bossNames = ["オウサマニア", "桃仙人", "森の魔女"];
    const catGodName = "レア猫がみさま";
    const lastBossName = "魔王";
    const waterSpiritName = "水の精霊";
    setTimeout(() => {
        if (enemy.name === lastBossName) {
            // ラスボス（魔王）専用BGM
            playBGM('bgm-lastboss', 1.2);
        } else if (enemy.name === waterSpiritName) {
            // 水の精霊：魔王戦と同じBGM
            playBGM('bgm-lastboss', 1.2);
        } else if (enemy.name === catGodName) {
            // レア猫がみさま専用BGM
            playBGM('bgm-catgod', 1.2);
        } else if (bossNames.includes(enemy.name)) {
            // 通常ボスBGM
            playBGM('bgm-boss', 1.2);
        } else {
            // 通常戦闘BGM
            playBGM('bgm-battle', 1.2);
        }
    }, 50); // 50ms待機してから再生（確実に停止を待つ）
    
    // 戦闘開始演出を短縮して表示
    showBattleStartAnimation();
}

/**
 * FF風戦闘開始演出
 */
function showBattleStartAnimation() {
    // 即座にログを追加（画面遷移と同時）
    addBattleLog(`${gameState.currentEnemy.name}があらわれた！`);
    
    // 戦闘開始効果音を再生
    if (typeof playSfxBattleStart === 'function') {
        playSfxBattleStart();
    }
    
    // 短縮された戦闘開始アニメーション（1秒）
    const overlay = document.createElement('div');
    overlay.className = 'battle-start-overlay';
    const text = document.createElement('div');
    text.className = 'battle-start-text';
    text.innerText = '戦闘開始！';
    overlay.appendChild(text);
    document.body.appendChild(overlay);
    
    // アニメーション時間を短縮（2秒→1秒）
    setTimeout(() => {
        overlay.remove();
        addBattleLog("コマンドを選んでください (Aボタン)");
    }, 1000);
}
