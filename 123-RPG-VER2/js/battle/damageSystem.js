/* ============================================
   ダメージ計算モジュール
   ============================================
   
   役割: ダメージ計算と表示を担当する
   
   責務:
   - ダメージ計算（クリティカル判定含む）
   - 攻撃処理（ダメージ適用、エフェクト表示）
   - ダメージ数値の表示
   - クリティカルテキストの表示
   - 画面フラッシュエフェクト
   
   含まれる処理:
   - calculateDamage() - ダメージ計算（クリティカル判定、倍率適用）
   - performAttack() - 攻撃処理（ダメージ適用、エフェクト表示、ログ出力）
   - showDamageNumber() - ダメージ数値表示（敵へのダメージ）
   - showDamageNumberOnParty() - ダメージ数値表示（味方へのダメージ）
   - showCriticalText() - クリティカルテキスト表示
   - showBattleFlash() - 画面フラッシュエフェクト
   
   依存関係:
   - hero, gameState, party, BATTLE - gameState.js, config.js で定義
   - updateBattleStatus(), updateEnemyHPBar(), addBattleLog() - battle/battleUI.js で定義
   - playSfxAttack() - sfx.js で定義
   
   検索性:
   - ダメージ計算を探す: このファイル
   - バランス調整: このファイル内の calculateDamage()
   - ダメージ表示を変更: このファイル内の showDamageNumber()
   ============================================ */

/**
 * 攻撃処理
 * @param {Object} attacker - 攻撃者（heroまたはpartyメンバー）
 */
function performAttack(attacker) {
    // attackerが未定義の場合はエラーをログに出力して終了
    if (!attacker) {
        console.error('[performAttack] attackerが未定義です');
        return;
    }
    
    const enemy = gameState.currentEnemy;
    
    // 攻撃効果音を再生（仲間キャラクターの場合は鳴き声、主人公は通常の攻撃音）
    if (attacker.name === "犬" && typeof playSfxAllyDog === 'function') {
        playSfxAllyDog();
    } else if (attacker.name === "猿" && typeof playSfxAllyMonkey === 'function') {
        playSfxAllyMonkey();
    } else if (attacker.name === "きじ" && typeof playSfxAllyBird === 'function') {
        playSfxAllyBird();
    } else if (typeof playSfxAttack === 'function') {
        playSfxAttack();
    }
    
    // ダメージ計算
    const damageResult = calculateDamage(attacker);
    const { damage, isCritical } = damageResult;
    
    // ダメージ適用
    enemy.hp = Math.max(0, enemy.hp - damage);
    
    // エフェクト表示
    showBattleFlash();
    showDamageNumber(damage, isCritical);
    
    // ログ出力
    if (isCritical) {
        showCriticalText();
        addBattleLog(`${attacker.name}の起死回生の一打！${enemy.name}に${damage}のダメージ！`);
    } else {
        addBattleLog(`${attacker.name}の攻撃！${enemy.name}に${damage}のダメージ！`);
    }
    
    // UI更新
    updateBattleStatus();
    updateEnemyHPBar();
}

/**
 * ダメージ計算
 * @param {Object} attacker - 攻撃者
 * @returns {Object} { damage: number, isCritical: boolean }
 */
function calculateDamage(attacker) {
    // クリティカル判定
    const isCritical = Math.random() < BATTLE.CRITICAL_RATE;
    
    // 基本ダメージ計算（攻撃力 + ランダム変動）
    let damage = attacker.atk + Math.floor(Math.random() * BATTLE.DAMAGE_VARIANCE);
    
    // クリティカルの場合、ダメージを倍率分増やす
    if (isCritical) {
        damage = Math.floor(damage * BATTLE.CRITICAL_MULTIPLIER);
    }
    
    return { damage, isCritical };
}

/**
 * ダメージ数値を表示
 * @param {number} damage - ダメージ値
 * @param {boolean} isCritical - クリティカルかどうか
 */
function showDamageNumber(damage, isCritical) {
    const enemyArea = document.querySelector('.enemy-area');
    const damageElement = document.createElement('div');
    damageElement.className = 'damage-number';
    damageElement.innerText = `-${damage}`;
    
    if (isCritical) {
        damageElement.style.color = '#ffff00';
        damageElement.style.fontSize = '56px';
        damageElement.style.textShadow = '2px 2px 0 #000, 0 0 15px #ffff00';
    }
    
    // 敵の中心位置に配置
    const rect = enemyArea.getBoundingClientRect();
    damageElement.style.left = `${rect.left + rect.width / 2 - 50}px`;
    damageElement.style.top = `${rect.top + rect.height / 2 - 40}px`;
    
    document.body.appendChild(damageElement);
    
    // アニメーション終了後に削除
    setTimeout(() => {
        damageElement.remove();
    }, 1000);
}

/**
 * クリティカルテキストを表示
 */
function showCriticalText() {
    const enemyArea = document.querySelector('.enemy-area');
    const criticalElement = document.createElement('div');
    criticalElement.className = 'critical-text';
    criticalElement.innerText = '起死回生の一打！';
    
    const rect = enemyArea.getBoundingClientRect();
    criticalElement.style.left = `${rect.left + rect.width / 2 - 100}px`;
    criticalElement.style.top = `${rect.top + 20}px`;
    
    document.body.appendChild(criticalElement);
    
    setTimeout(() => {
        criticalElement.remove();
    }, 1500);
}

/**
 * 画面フラッシュエフェクト（攻撃時の視覚効果）
 */
function showBattleFlash() {
    const flash = document.createElement('div');
    flash.className = 'battle-flash';
    document.body.appendChild(flash);
    
    setTimeout(() => {
        flash.remove();
    }, 200);
}

/**
 * 味方へのダメージ数値を表示
 * @param {number} damage - ダメージ値
 * @param {Object} target - 被ダメージ対象
 */
function showDamageNumberOnParty(damage, target) {
    const statusArea = document.getElementById('party-status-area');
    const damageElement = document.createElement('div');
    damageElement.className = 'damage-number';
    damageElement.innerText = `-${damage}`;
    damageElement.style.color = '#ff4444';
    
    // 対象のカードを探す
    const cards = statusArea.querySelectorAll('.party-member-card');
    let targetCard = null;
    cards.forEach((card, index) => {
        if (index < party.length && party[index] === target) {
            targetCard = card;
        }
    });
    
    if (targetCard) {
        const rect = targetCard.getBoundingClientRect();
        damageElement.style.left = `${rect.left + rect.width / 2 - 30}px`;
        damageElement.style.top = `${rect.top + 20}px`;
    } else {
        // フォールバック：ステータスエリアの中心
        const rect = statusArea.getBoundingClientRect();
        damageElement.style.left = `${rect.left + rect.width / 2 - 30}px`;
        damageElement.style.top = `${rect.top + 20}px`;
    }
    
    document.body.appendChild(damageElement);
    
    // アニメーション終了後に削除
    setTimeout(() => {
        damageElement.remove();
    }, 1000);
}
