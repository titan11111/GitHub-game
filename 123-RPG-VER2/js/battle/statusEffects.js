/* ============================================
   状態異常モジュール
   ============================================
   
   役割: 状態異常の適用と処理を担当する
   
   責務:
   - 状態異常の適用
   - ターン開始時の状態異常処理
   
   含まれる処理:
   - applyStatusEffect() - 状態異常適用（火だるま、行動不能など）
   - processStatusEffects() - 状態異常処理（ターン開始時、継続ダメージ、解除判定）
   
   依存関係:
   - gameState - gameState.js で定義
   - updateEnemyHPBar(), addBattleLog() - battle/battleUI.js で定義
   
   検索性:
   - 状態異常を探す: このファイル
   - 新しい状態異常を追加: このファイル内の applyStatusEffect() と processStatusEffects()
   - 状態異常の効果を変更: このファイル内の processStatusEffects()
   ============================================ */

/**
 * 状態異常を適用
 * @param {Object} target - 対象（敵または味方）
 * @param {string} effect - 状態異常の種類
 */
function applyStatusEffect(target, effect) {
    if (!gameState.enemyStatus) {
        gameState.enemyStatus = {};
    }
    
    switch (effect) {
        case 'burn':
            gameState.enemyStatus.burn = true;
            addBattleLog(`${target.name}は火だるま状態になった！`);
            break;
        case 'stun':
            gameState.enemyStatus.stun = 1;
            addBattleLog(`${target.name}は行動不能になった！`);
            break;
    }
}

/**
 * 状態異常の処理（ターン開始時）
 */
function processStatusEffects() {
    if (!gameState.enemyStatus) return;
    
    // 火だるま状態：毎ターン5ダメージ
    if (gameState.enemyStatus.burn) {
        const burnDamage = 5;
        gameState.currentEnemy.hp = Math.max(0, gameState.currentEnemy.hp - burnDamage);
        addBattleLog(`${gameState.currentEnemy.name}は火だるまで${burnDamage}のダメージ！`);
        updateEnemyHPBar();
        
        // 30%の確率で解除
        if (Math.random() < 0.3) {
            gameState.enemyStatus.burn = false;
            addBattleLog(`${gameState.currentEnemy.name}の火だるまが消えた！`);
        }
    }
    
    // 行動不能状態：ターン数を減らす
    if (gameState.enemyStatus.stun && gameState.enemyStatus.stun > 0) {
        gameState.enemyStatus.stun--;
        if (gameState.enemyStatus.stun <= 0) {
            gameState.enemyStatus.stun = null;
            addBattleLog(`${gameState.currentEnemy.name}は動けるようになった！`);
        }
    }
}
