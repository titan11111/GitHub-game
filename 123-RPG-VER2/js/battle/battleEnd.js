/* ============================================
   戦闘終了処理モジュール
   ============================================
   
   役割: 戦闘終了処理を担当する
   
   責務:
   - 戦闘勝利処理
   - 戦闘結果確定処理
   - 戦闘報酬処理
   - 仲間試練戦闘敗北処理
   - 勝利演出表示
   - 水の精霊報酬メニュー表示
   
   含まれる処理:
   - winBattle() - 戦闘勝利処理（勝利演出開始）
   - confirmBattleResult() - 戦闘結果確定処理（報酬処理、エンディング判定）
   - handleBattleRewards() - 戦闘報酬処理（経験値、ゴールド、特別報酬）
   - endAllyTrialDefeat() - 仲間試練戦闘敗北処理（ゲームオーバーにしない）
   - showVictoryAnimation() - FF風勝利演出表示
   - showWaterSpiritRewardMenu() - 水の精霊報酬メニュー表示
   
   依存関係:
   - hero, gameState, party, allyData, worldMaps, TILE - gameState.js, config.js で定義
   - addAlly() - map/allyManager.js で定義
   - checkLevelUp(), checkAllyLevelUps() - main.js で定義
   - showScreen(), showAlert(), drawMap(), updateStatus() - ui.js, map/mapRenderer.js で定義
   - stopAllBGM(), playBGM(), playAreaBGM() - audio.js で定義
   - playSfxVictory(), playSfxEnding(), playSfxPurchase(), playSfxLevelUp() - sfx.js で定義
   - addBattleLog() - battle/battleUI.js で定義
   
   検索性:
   - 戦闘終了処理を探す: このファイル
   - 報酬システムを変更: このファイル内の handleBattleRewards()
   - エンディング処理: このファイル内の confirmBattleResult()
   ============================================ */

/**
 * 水の精霊に勝利後の報酬選択（1:武器 2:レベル倍増 3:森へ行く）
 */
function showWaterSpiritRewardMenu() {
    const msg = "水の精霊が望みを叶えてくれた！\n\n1: 武器\n2: レベルが8上がる\n3: 森へ行く";
    const choice = prompt(msg + "\n\n番号を入力（1〜3）:");
    const map = worldMaps[hero.currentArea];
    const wx = hero.x;
    const wy = hero.y;
    
    if (choice === "1") {
        hero.atk += 25;
        if (typeof playSfxPurchase === 'function') playSfxPurchase();
        showAlert("精霊の剣を授かった！\n攻撃力が25上がった！");
    } else if (choice === "2") {
        const oldLv = hero.lv;
        hero.lv = hero.lv + 8;
        const levelsGained = hero.lv - oldLv;
        hero.atk += (typeof LEVEL_UP !== 'undefined' ? LEVEL_UP.ATK_BONUS : 10) * levelsGained;
        hero.maxHp += (typeof LEVEL_UP !== 'undefined' ? LEVEL_UP.HP_BONUS : 20) * levelsGained;
        hero.hp = hero.maxHp;
        if (hero.mgc != null) hero.mgc += (typeof LEVEL_UP !== 'undefined' && LEVEL_UP.MGC_BONUS ? LEVEL_UP.MGC_BONUS : 5) * levelsGained;
        if (hero.maxMp != null) {
            hero.maxMp += (typeof LEVEL_UP !== 'undefined' && LEVEL_UP.MP_BONUS ? LEVEL_UP.MP_BONUS : 5) * levelsGained;
            hero.mp = hero.maxMp;
        }
        if (typeof playSfxLevelUp === 'function') playSfxLevelUp();
        showAlert(`レベルが8上がった！ LV${oldLv} → LV${hero.lv}\n攻撃力とHPが大きく上がった！`);
    } else if (choice === "3") {
        if (map && map.data[wy] && map.data[wy][wx] === TILE.WATER_SPIRIT) {
            map.data[wy][wx] = TILE.EMPTY;
        }
        if (!worldMaps["water_spirit_dwelling"].exits.right) {
            worldMaps["water_spirit_dwelling"].exits.right = "monster_forest";
        }
        showAlert("水の精霊が森へ消えた。\n東に魔物の森が現れた。");
    } else {
        showAlert("望みを選ばなかった。水の精霊は静かに見送った。");
    }
    
    // 1または2を選んだときは精霊が残るので、次に戦うと強くなる
    if (choice === "1" || choice === "2") {
        gameState.waterSpiritDefeatCount = (gameState.waterSpiritDefeatCount || 0) + 1;
    }
    
    showScreen('main-screen');
    drawMap();
    updateStatus();
    playAreaBGM(hero.currentArea);
}

/**
 * 仲間との試練戦闘で負けた時（ゲームオーバーにせずマップに戻る）
 */
function endAllyTrialDefeat() {
    const enemy = gameState.currentEnemy;
    const ally = enemy && allyData ? Object.values(allyData).find(a => a.name === enemy.name) : null;
    const defeatMsg = ally ? ally.defeatMsg : "まだまだだな…";
    gameState.isBattle = false;
    gameState.isBattleEnding = false;
    gameState.isAllyTrialBattle = false;
    gameState.allyTrialTile = null;
    // 戦闘BGMを確実に停止してからエリアBGMに切り替え
    if (typeof stopAllBGM === 'function') stopAllBGM();
    showScreen('main-screen');
    drawMap();
    updateStatus();
    setTimeout(() => {
        playAreaBGM(hero.currentArea);
    }, 100);
    showAlert(`${enemy ? enemy.name : ''}:「${defeatMsg}」\n\n負けたが、ゲームオーバーにはならない。もう一度挑戦できる。`);
}

/**
 * 戦闘勝利処理
 */
function winBattle() {
    gameState.isBattleEnding = true;
    addBattleLog(`${gameState.currentEnemy.name}を倒した！`);
    
    // 戦闘勝利効果音を再生
    if (typeof playSfxVictory === 'function') {
        playSfxVictory();
    }
    
    // FF風勝利演出
    showVictoryAnimation();
}

/**
 * FF風勝利演出を表示
 */
function showVictoryAnimation() {
    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay';
    
    const victoryText = document.createElement('div');
    victoryText.className = 'victory-text';
    victoryText.innerText = '勝利！';
    overlay.appendChild(victoryText);
    
    const rewards = document.createElement('div');
    rewards.className = 'victory-rewards';
    const enemy = gameState.currentEnemy;
    let rewardText;
    if (gameState.isAllyTrialBattle && enemy) {
        rewardText = `${enemy.name}が仲間に加わった！`;
    } else {
        rewardText = `経験値: ${enemy.exp}`;
        if (enemy.gold > 0) {
            rewardText += `\nゴールド: ${enemy.gold}G`;
        }
    }
    rewards.innerText = rewardText;
    overlay.appendChild(rewards);
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.remove();
        addBattleLog('(Aボタンで進む)');
    }, 2500);
}

/**
 * 戦闘結果確定処理
 */
function confirmBattleResult() {
    gameState.isBattle = false;
    gameState.isBattleEnding = false;
    const enemy = gameState.currentEnemy;
    
    // 仲間との試練戦闘に勝利した場合：仲間に加える（経験値・ゴールドはなし）
    if (gameState.isAllyTrialBattle && gameState.allyTrialTile !== null) {
        const tile = gameState.allyTrialTile;
        const tilePosition = gameState.allyTrialTilePosition;
        gameState.isAllyTrialBattle = false;
        gameState.allyTrialTile = null;
        gameState.allyTrialTilePosition = null;
        // 戦闘BGMを確実に停止してからエリアBGMに切り替え
        if (typeof stopAllBGM === 'function') stopAllBGM();
        showScreen('main-screen');
        // 仲間のタイルを削除（保存された位置を使用）
        if (tilePosition && worldMaps[tilePosition.area]) {
            const map = worldMaps[tilePosition.area];
            if (map.data[tilePosition.y] && map.data[tilePosition.y][tilePosition.x] === tile) {
                map.data[tilePosition.y][tilePosition.x] = TILE.EMPTY;
            }
        }
        drawMap();
        updateStatus();
        setTimeout(() => {
            if (typeof playAreaBGM === 'function') {
                playAreaBGM(hero.currentArea);
            }
        }, 200);
        addAlly(tile);
        return;
    }
    
    // エンディング判定
    if (enemy.name === "魔王") {
        // エンディング効果音を再生
        if (typeof playSfxEnding === 'function') {
            playSfxEnding();
        }
        // 戦闘BGMを停止
        if (typeof stopAllBGM === 'function') stopAllBGM();
        document.getElementById('ending-msg').innerText = `こうして街の川は穏やかな流れを取り戻した。`;
        showScreen('ending-screen');
        setTimeout(() => {
            if (typeof playBGM === 'function') playBGM('bgm-ending');
        }, 200);
        return;
    }
    
    if (enemy.name === "オウサマニア") {
        // エンディング効果音を再生
        if (typeof playSfxEnding === 'function') {
            playSfxEnding();
        }
        // 戦闘BGMを停止
        if (typeof stopAllBGM === 'function') stopAllBGM();
        document.getElementById('ending-title').innerText = "TRUE ENDING";
        document.getElementById('ending-msg').innerText = `偽の王を追い出し、本物の王が街に戻った！`;
        showScreen('ending-screen');
        setTimeout(() => {
            if (typeof playBGM === 'function') playBGM('bgm-ending');
        }, 200);
        return;
    }
    
    // 水の精霊に勝利：ショップのように選択肢（1:武器 2:レベル倍増 3:森へ行く）
    if (enemy.name === "水の精霊") {
        if (typeof showWaterSpiritRewardMenu === 'function') {
            showWaterSpiritRewardMenu();
        } else {
            handleBattleRewards(enemy);
            // 戦闘BGMを確実に停止してからエリアBGMに切り替え
            if (typeof stopAllBGM === 'function') stopAllBGM();
            showScreen('main-screen');
            drawMap();
            updateStatus();
            setTimeout(() => {
                playAreaBGM(hero.currentArea);
            }, 100);
            checkLevelUp();
            if (typeof checkAllyLevelUps === 'function') checkAllyLevelUps();
        }
        return;
    }
    
    // 通常戦闘の報酬処理
    handleBattleRewards(enemy);
    
    // マップに戻る（戦闘BGMを確実に停止してからエリアBGMに切り替え）
    if (typeof stopAllBGM === 'function') stopAllBGM();
    showScreen('main-screen'); 
    drawMap(); 
    updateStatus();
    setTimeout(() => {
        playAreaBGM(hero.currentArea);
    }, 100);
    checkLevelUp();
    if (typeof checkAllyLevelUps === 'function') checkAllyLevelUps();
}

/**
 * 戦闘報酬処理
 * @param {Object} enemy - 倒した敵
 */
function handleBattleRewards(enemy) {
    // 桃仙人を倒した場合の特別報酬
    if (enemy.name === "桃仙人") {
        showAlert("桃仙人:「見事だ。お主に真の力を授けよう。」\n勇者の攻撃力が大幅にアップした！");
        hero.atk += 30;
        worldMaps["ruined_village"].data[3][6] = TILE.RUINS; // 桃仙人を床に戻す
    }
    
    // レア猫がみさまを倒した場合の特別報酬
    if (enemy.name === "レア猫がみさま") {
        // マボロシの杖を手に入れる
        if (!hero.items) {
            hero.items = [];
        }
        hero.items.push({ name: "マボロシの杖", type: "weapon", atk: 100 });
        showAlert("レア猫がみさまを倒した！\n「マボロシの杖」を手に入れた！\n攻撃力が100アップした！");
        hero.atk += 100;
    }
    
    // 水の精霊は報酬メニューで処理するためここでは経験値・ゴールド・タイル変更なし
    if (enemy.name === "水の精霊") {
        return;
    }
    
    // 経験値とゴールド獲得（主人公・仲間全員に経験値）
    party.forEach(m => {
        m.exp = (m.exp || 0) + enemy.exp;
    });
    hero.gold += (enemy.gold || 0); 
    
    // マップ上の敵タイルを削除
    const map = worldMaps[hero.currentArea];
    if (map.data[hero.y][hero.x] === TILE.ENEMY) {
        map.data[hero.y][hero.x] = TILE.RUINS;
    }
    // 魔物の森で森の魔女を倒したらそのマスを空に
    if (hero.currentArea === "monster_forest" && enemy.name === "森の魔女" && map.data[hero.y] && map.data[hero.y][hero.x] === TILE.FOREST_WITCH) {
        map.data[hero.y][hero.x] = TILE.EMPTY;
    }
}
