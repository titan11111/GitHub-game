/* ============================================
   ターン処理モジュール
   ============================================
   
   役割: 戦闘のターン処理を担当する
   
   責務:
   - 主人公のターン処理
   - パーティメンバーのターン処理
   - 敵のターン処理
   - アイテム使用処理
   - 逃走処理
   
   含まれる処理:
   - heroTurn() - 主人公のターン処理（攻撃/魔法/アイテム/逃走）
   - partyTurn() - パーティメンバーのターン処理（順次攻撃）
   - enemyTurn() - 敵のターン処理（ランダム攻撃、特殊攻撃）
   - useItem() - アイテム使用処理
   - tryEscape() - 逃走処理（50%成功率）
   
   依存関係:
   - hero, gameState, party, BATTLE - gameState.js, config.js で定義
   - performAttack() - battle/damageSystem.js で定義
   - processStatusEffects() - battle/statusEffects.js で定義
   - showBattleFlash(), showDamageNumberOnParty() - battle/damageSystem.js で定義
   - updateBattleStatus(), updateEnemyHPBar(), addBattleLog() - battle/battleUI.js で定義
   - winBattle(), endAllyTrialDefeat() - battle/battleEnd.js で定義
   - showScreen(), drawMap(), updateStatus() - ui.js, map/mapRenderer.js で定義
   - stopAllBGM(), playAreaBGM() - audio.js で定義
   - playSfxEscape(), playSfxGameOver() - sfx.js で定義
   
   検索性:
   - ターン処理を探す: このファイル
   - ターン制ルールを変更: このファイル内の各ターン処理関数
   - アイテム機能を拡張: このファイル内の useItem()
   ============================================ */

/**
 * ヒーローのターン処理
 * @param {string} action - アクションタイプ（'attack', 'magic', 'item', 'escape'）
 */
function heroTurn(action) {
    if (!gameState.canAttack) return;
    
    // 自己スタン状態のチェック
    if (gameState.heroBuffs.selfStun && gameState.heroBuffs.selfStun > 0) {
        addBattleLog(`${hero.name}は動けない！`);
        gameState.heroBuffs.selfStun = 0;
        setTimeout(() => {
            if (gameState.currentEnemy.hp > 0) {
                setTimeout(enemyTurn, BATTLE.TURN_DELAY);
            } else {
                winBattle();
            }
        }, BATTLE.TURN_DELAY);
        return;
    }
    
    gameState.canAttack = false;
    
    switch (action) {
        case 'attack':
            performAttack(hero);
            // 敵が倒れたかどうかで分岐
            if (gameState.currentEnemy.hp > 0) {
                setTimeout(partyTurn, BATTLE.TURN_DELAY);
            } else {
                setTimeout(winBattle, BATTLE.TURN_DELAY);
            }
            break;
            
        case 'magic':
            // 魔法選択画面を表示（executeSelectedCommandで処理）
            break;
            
        case 'item':
            // アイテムの実装
            useItem();
            break;
            
        case 'escape':
            // にげるの実装
            tryEscape();
            break;
    }
}

/**
 * アイテム使用処理
 */
function useItem() {
    // アイテムがない場合
    if (!hero.items || hero.items.length === 0) {
        addBattleLog(`${hero.name}はアイテムを持っていない！`);
        setTimeout(() => {
            gameState.canAttack = true;
            addBattleLog("コマンドを選んでください (Aボタン)");
        }, BATTLE.TURN_DELAY);
        return;
    }
    
    // 簡易実装：最初のアイテムを使用（今後拡張可能）
    addBattleLog(`${hero.name}はアイテムを使った！`);
    addBattleLog("（アイテム機能は今後拡張予定）");
    
    // とりあえずターンを終了
    setTimeout(() => {
        if (gameState.currentEnemy.hp > 0) {
            setTimeout(enemyTurn, BATTLE.TURN_DELAY);
        } else {
            winBattle();
        }
    }, BATTLE.TURN_DELAY);
}

/**
 * 逃走処理
 */
function tryEscape() {
    // 逃走成功率は50%
    const escapeSuccess = Math.random() < 0.5;
    
    if (escapeSuccess) {
        // 逃走成功効果音を再生
        if (typeof playSfxEscape === 'function') {
            playSfxEscape();
        }
        addBattleLog(`${hero.name}は逃げ出した！`);
        setTimeout(() => {
            gameState.isBattle = false;
            gameState.isBattleEnding = false;
            // 戦闘BGMを確実に停止してからエリアBGMに切り替え
            if (typeof stopAllBGM === 'function') stopAllBGM();
            showScreen('main-screen');
            drawMap();
            updateStatus();
            setTimeout(() => {
                playAreaBGM(hero.currentArea);
            }, 100);
        }, 1000);
    } else {
        addBattleLog("逃げ切れなかった！");
        setTimeout(() => {
            if (gameState.currentEnemy.hp > 0) {
                setTimeout(enemyTurn, BATTLE.TURN_DELAY);
            } else {
                winBattle();
            }
        }, BATTLE.TURN_DELAY);
    }
}

/**
 * パーティメンバーのターン処理
 */
function partyTurn() {
    let index = 1;
    
    function nextAlly() {
        // 敵が既に倒れている場合は勝利処理
        if (gameState.currentEnemy.hp <= 0) { 
            winBattle(); 
            return; 
        }
        
        // パーティメンバーが残っている場合
        if (index < party.length) {
            const member = party[index];
            // memberが存在し、HPが0より大きい場合のみ攻撃
            if (member && member.hp > 0) { 
                performAttack(member); 
                index++; 
                setTimeout(nextAlly, BATTLE.TURN_DELAY); 
            } else {
                // memberが未定義またはHPが0のメンバーはスキップ
                if (!member) {
                    console.warn(`[partyTurn] party[${index}]が未定義です`);
                }
                index++; 
                nextAlly(); 
            }
        } else {
            // 全メンバーの攻撃終了、敵のターンへ
            if (gameState.currentEnemy.hp > 0) {
                setTimeout(enemyTurn, BATTLE.TURN_DELAY);
            } else {
                winBattle();
            }
        }
    }
    
    nextAlly();
}

/**
 * 敵のターン処理
 */
function enemyTurn() {
    const enemy = gameState.currentEnemy;
    const aliveMembers = party.filter(m => m.hp > 0);
    
    // 生存メンバーがいない場合は終了
    if (aliveMembers.length === 0) return;
    
    // 状態異常の処理
    processStatusEffects();
    
    // 行動不能状態のチェック
    if (gameState.enemyStatus && gameState.enemyStatus.stun > 0) {
        addBattleLog(`${enemy.name}は動けない！`);
        setTimeout(() => {
            gameState.canAttack = true;
            addBattleLog("コマンドを選んでください (Aボタン)");
        }, BATTLE.TURN_DELAY);
        return;
    }
    
    // レア猫がみさまの特殊攻撃：5%の確率でネコネコギャラクシー砲
    if (enemy.isRareCatGod && Math.random() < 0.05) {
        addBattleLog(`${enemy.name}のネコネコギャラクシー砲！`);
        addBattleLog("宇宙の力が降り注ぐ...");
        
        // 全パーティメンバーに1000ダメージ
        aliveMembers.forEach(member => {
            const oldHp = member.hp;
            member.hp = Math.max(0, member.hp - 1000);
            const actualDamage = oldHp - member.hp;
            
            // エフェクト表示
            showBattleFlash();
            showDamageNumberOnParty(actualDamage, member);
            
            addBattleLog(`${member.name}に${actualDamage}のダメージ！`);
        });
        
        updateBattleStatus();
        
        // ゲームオーバー判定（仲間試練戦闘では負けてもゲームオーバーにしない）
        if (hero.hp <= 0) {
            if (gameState.isAllyTrialBattle) {
                addBattleLog("力尽きた...");
                setTimeout(() => endAllyTrialDefeat(), 800);
                return;
            }
            if (typeof playSfxGameOver === 'function') {
                playSfxGameOver();
            }
            addBattleLog("勇者が力尽きた...");
            showAlert("勇者が力尽きた...");
            setTimeout(() => location.reload(), 2000);
        } else {
            setTimeout(() => {
                gameState.canAttack = true;
                addBattleLog("コマンドを選んでください (Aボタン)");
            }, BATTLE.TURN_DELAY);
        }
        return;
    }
    
    // ランダムにターゲットを選択
    const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
    
    // ダメージ計算
    let dmg = Math.max(1, enemy.atk - BATTLE.DEFENSE_REDUCTION);
    
    // アイアンガードの効果
    if (gameState.heroBuffs.ironGuard && target === hero) {
        const blocked = Math.min(dmg, gameState.heroBuffs.ironGuardValue);
        dmg -= blocked;
        addBattleLog(`バリアが${blocked}のダメージを防いだ！`);
        gameState.heroBuffs.ironGuard = false; // 1回限り
    }
    
    // ダイヤモンドスキンの効果（物理ダメージを100%反射）
    if (gameState.heroBuffs.diamondSkin && target === hero) {
        addBattleLog(`${hero.name}のダイヤモンドスキンがダメージを反射した！`);
        // 敵にダメージを反射
        const reflectDamage = dmg;
        enemy.hp = Math.max(0, enemy.hp - reflectDamage);
        addBattleLog(`${enemy.name}に${reflectDamage}のダメージが反射した！`);
        dmg = 0; // 自分はダメージを受けない
        
        // ターン数を減らす
        gameState.heroBuffs.diamondSkinTurns--;
        if (gameState.heroBuffs.diamondSkinTurns <= 0) {
            gameState.heroBuffs.diamondSkin = false;
            addBattleLog(`${hero.name}のダイヤモンドスキンが切れた！`);
        }
        
        updateEnemyHPBar();
    }
    
    // ダメージ適用
    if (dmg > 0) {
        target.hp = Math.max(0, target.hp - dmg);
        
        // エフェクト表示
        showBattleFlash();
        showDamageNumberOnParty(dmg, target);
        
        // ログ出力
        addBattleLog(`${enemy.name}の攻撃！${target.name}は${dmg}のダメージ！`);
    }
    
    updateBattleStatus();

    // ゲームオーバー判定（仲間試練戦闘では負けてもゲームオーバーにしない）
    if (hero.hp <= 0) { 
        if (gameState.isAllyTrialBattle) {
            addBattleLog("力尽きた...");
            setTimeout(() => endAllyTrialDefeat(), 800);
            return;
        }
        if (typeof playSfxGameOver === 'function') {
            playSfxGameOver();
        }
        addBattleLog("勇者が力尽きた...");
        showAlert("勇者が力尽きた..."); 
        setTimeout(() => location.reload(), 2000); 
    } else { 
        // 次のターンへ
        setTimeout(() => { 
            gameState.canAttack = true; 
            addBattleLog("コマンドを選んでください (Aボタン)");
        }, BATTLE.TURN_DELAY); 
    }
}
