/* ============================================
   魔法システムモジュール
   ============================================
   
   役割: 魔法の実行とエフェクト処理を担当する
   
   責務:
   - 魔法の実行処理
   - 攻撃魔法の処理
   - 回復魔法の処理
   - シールド魔法の処理
   - 攻撃＋状態異常魔法の処理
   - 魔法エフェクトの表示
   
   含まれる処理:
   - castMagic() - 魔法実行（エフェクト表示、効果音再生）
   - handleAttackMagic() - 攻撃魔法処理（ダメージ計算、状態異常適用）
   - handleHealMagic() - 回復魔法処理（単体/全体回復）
   - handleShieldMagic() - シールド魔法処理（アイアンガード、ダイヤモンドスキン）
   - handleAttackStatusMagic() - 攻撃＋状態異常魔法処理
   - showMagicEffect() - 魔法エフェクト表示
   - getEffectDuration() - エフェクト表示時間取得
   
   依存関係:
   - hero, gameState, MAGIC - gameState.js, config.js で定義
   - showBattleFlash(), showDamageNumber() - battle/damageSystem.js で定義
   - applyStatusEffect() - battle/statusEffects.js で定義
   - updateBattleStatus(), updateEnemyHPBar(), addBattleLog() - battle/battleUI.js で定義
   - partyTurn(), winBattle() - battle/battleTurns.js, battle/battleEnd.js で定義
   - playSfxMagic() - sfx.js で定義
   
   検索性:
   - 魔法処理を探す: このファイル
   - 新しい魔法を追加: このファイル内の各ハンドラー関数
   - 魔法エフェクトを変更: このファイル内の showMagicEffect()
   ============================================ */

/**
 * 魔法を実行
 * @param {Object} spell - 魔法データ
 */
function castMagic(spell) {
    gameState.canAttack = false;
    addBattleLog(`${hero.name}は${spell.name}を唱えた！`);
    
    // 魔法効果音を再生
    if (typeof playSfxMagic === 'function') {
        playSfxMagic();
    }
    
    // エフェクト表示（回復魔法以外）
    if (spell.type !== 'heal') {
        showMagicEffect(spell.id);
    }
    
    // エフェクト表示後に魔法効果を実行
    const effectDelay = getEffectDuration(spell.id);
    setTimeout(() => {
        switch (spell.type) {
            case 'attack':
                handleAttackMagic(spell);
                break;
            case 'heal':
                handleHealMagic(spell);
                break;
            case 'shield':
                handleShieldMagic(spell);
                break;
            case 'attack_status':
                handleAttackStatusMagic(spell);
                break;
        }
        
        // UI更新
        updateBattleStatus();
        updateEnemyHPBar();
    }, effectDelay);
}

/**
 * エフェクトの表示時間を取得
 * @param {string} spellId - 魔法ID
 * @returns {number} 表示時間（ミリ秒）
 */
function getEffectDuration(spellId) {
    const durations = {
        'flame_shot': 1000,
        'iron_guard': 800,
        'sonic_blade': 600,
        'gravity_storm': 1500,
        'giga_burst': 1200,
        'diamond_skin': 2000,
        'judgment_ray': 1000,
        'zero_disaster': 2000
    };
    return durations[spellId] || 500;
}

/**
 * 魔法エフェクトを表示
 * @param {string} spellId - 魔法ID
 */
function showMagicEffect(spellId) {
    // ゼロ・ディザスターは画面全体エフェクト
    if (spellId === 'zero_disaster') {
        const effect = document.createElement('div');
        effect.className = 'magic-effect-zero';
        document.body.appendChild(effect);
        
        const duration = getEffectDuration(spellId);
        setTimeout(() => {
            effect.remove();
        }, duration);
        return;
    }
    
    const enemyArea = document.querySelector('.enemy-area');
    if (!enemyArea) return;
    
    // エフェクトコンテナを作成
    const container = document.createElement('div');
    container.className = 'magic-effect-container';
    enemyArea.appendChild(container);
    
    // 魔法IDからCSSクラス名に変換
    const effectClassMap = {
        'flame_shot': 'flame',
        'iron_guard': 'iron-guard',
        'sonic_blade': 'sonic',
        'gravity_storm': 'gravity',
        'giga_burst': 'giga',
        'diamond_skin': 'diamond',
        'judgment_ray': 'judgment',
        'zero_disaster': 'zero'
    };
    
    const effectClass = effectClassMap[spellId] || spellId.replace('_', '-');
    
    // エフェクト要素を作成
    const effect = document.createElement('div');
    effect.className = `magic-effect-${effectClass}`;
    container.appendChild(effect);
    
    // エフェクト終了後に削除
    const duration = getEffectDuration(spellId);
    setTimeout(() => {
        container.remove();
    }, duration);
}

/**
 * 攻撃魔法を処理
 * @param {Object} spell - 魔法データ
 */
function handleAttackMagic(spell) {
    const enemy = gameState.currentEnemy;
    let damage = 0;
    
    // パーセンテージダメージの場合（ジャッジメント光線）
    if (spell.damagePercent) {
        damage = Math.floor(enemy.hp * spell.damagePercent);
    } else {
        // 魔法力ベースのダメージ計算
        const baseDamage = spell.damage || 0;
        const multiplier = spell.damageMultiplier || 1.0;
        
        // 魔法力 × 倍率 + 基本ダメージ
        const magicDamage = Math.floor(hero.mgc * multiplier);
        const baseValue = Math.floor(baseDamage * 0.5); // 基本ダメージの50%を加算
        
        // ランダム要素（80%-120%）
        const minMultiplier = (typeof MAGIC !== 'undefined' && MAGIC.MIN_DAMAGE_MULTIPLIER) ? MAGIC.MIN_DAMAGE_MULTIPLIER : 0.8;
        const maxMultiplier = (typeof MAGIC !== 'undefined' && MAGIC.MAX_DAMAGE_MULTIPLIER) ? MAGIC.MAX_DAMAGE_MULTIPLIER : 1.2;
        const randomFactor = minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
        
        damage = Math.floor((magicDamage + baseValue) * randomFactor);
    }
    
    // ソニックブレードの空中敵ボーナス（鳥系の敵に1.5倍・画像差し替え時も敵名で判定）
    if (spell.id === 'sonic_blade' && enemy.name === 'ハゲタカ') {
        damage = Math.floor(damage * spell.flyingBonus);
        addBattleLog("空中の敵に効果抜群！");
    }
    
    // ゼロ・ディザスターの全敵ダメージ（現在は1体のみだが、将来の拡張に備えて）
    if (spell.target === 'enemy_all') {
        // 全敵へのダメージ（現在は1体のみ）
        // damageは既に計算済み
    }
    
    // ダメージ適用
    enemy.hp = Math.max(0, enemy.hp - damage);
    
    // エフェクト表示
    showBattleFlash();
    showDamageNumber(damage, false);
    
    if (spell.target === 'enemy_all') {
        addBattleLog(`敵全体に${damage}のダメージ！`);
    } else {
        addBattleLog(`${enemy.name}に${damage}のダメージ！`);
    }
    
    // ゼロ・ディザスターの特殊演出
    if (spell.id === 'zero_disaster') {
        addBattleLog("背景が闇に包まれた...");
    }
    
    // 状態異常の適用
    if (spell.effect && spell.effectChance) {
        if (Math.random() < spell.effectChance) {
            applyStatusEffect(enemy, spell.effect);
        }
    }
    
    // ギガバーストの自己スタン効果
    if (spell.selfStun) {
        gameState.heroBuffs.selfStun = spell.selfStun;
        addBattleLog(`${hero.name}は1ターン動けなくなった！`);
    }
    
    // ターン終了処理
    if (enemy.hp > 0) {
        // 自己スタンがある場合は敵のターンをスキップ
        if (spell.selfStun) {
            setTimeout(() => {
                gameState.canAttack = false; // 次のターンも動けない
                addBattleLog(`${hero.name}は動けない...`);
                setTimeout(() => {
                    gameState.canAttack = true;
                    gameState.heroBuffs.selfStun = 0;
                    addBattleLog("コマンドを選んでください (Aボタン)");
                }, BATTLE.TURN_DELAY);
            }, BATTLE.TURN_DELAY);
        } else {
            setTimeout(partyTurn, BATTLE.TURN_DELAY);
        }
    } else {
        setTimeout(winBattle, BATTLE.TURN_DELAY);
    }
}

/**
 * 回復魔法を処理
 * @param {Object} spell - 魔法データ
 */
function handleHealMagic(spell) {
    if (spell.target === 'ally_single') {
        // 単体回復
        const target = hero; // 簡易実装：自分を回復
        const oldHp = target.hp;
        target.hp = Math.min(target.maxHp, target.hp + spell.heal);
        const actualHeal = target.hp - oldHp;
        addBattleLog(`${target.name}のHPが${actualHeal}回復した！`);
    } else if (spell.target === 'ally_all') {
        // 全体回復
        party.forEach(member => {
            if (member.hp > 0) {
                const oldHp = member.hp;
                member.hp = Math.min(member.maxHp, member.hp + spell.heal);
                const actualHeal = member.hp - oldHp;
                if (actualHeal > 0) {
                    addBattleLog(`${member.name}のHPが${actualHeal}回復した！`);
                }
            }
        });
    }
    
    updateBattleStatus();
    
    // ターン終了処理
    if (gameState.currentEnemy.hp > 0) {
        setTimeout(partyTurn, BATTLE.TURN_DELAY);
    } else {
        setTimeout(winBattle, BATTLE.TURN_DELAY);
    }
}

/**
 * シールド魔法を処理
 * @param {Object} spell - 魔法データ
 */
function handleShieldMagic(spell) {
    if (spell.id === 'iron_guard') {
        gameState.heroBuffs.ironGuard = true;
        gameState.heroBuffs.ironGuardValue = spell.shield;
        addBattleLog(`${hero.name}に防御のバリアが張られた！`);
    } else if (spell.id === 'diamond_skin') {
        gameState.heroBuffs.diamondSkin = true;
        gameState.heroBuffs.diamondSkinTurns = spell.duration;
        addBattleLog(`${hero.name}の体がダイヤモンドのように輝いた！`);
    }
    
    // ターン終了処理
    if (gameState.currentEnemy.hp > 0) {
        setTimeout(partyTurn, BATTLE.TURN_DELAY);
    } else {
        setTimeout(winBattle, BATTLE.TURN_DELAY);
    }
}

/**
 * 攻撃＋状態異常魔法を処理
 * @param {Object} spell - 魔法データ
 */
function handleAttackStatusMagic(spell) {
    const enemy = gameState.currentEnemy;
    
    // ダメージ適用（全敵に適用する場合は拡張可能）
    enemy.hp = Math.max(0, enemy.hp - spell.damage);
    
    // エフェクト表示
    showBattleFlash();
    showDamageNumber(spell.damage, false);
    addBattleLog(`${enemy.name}に${spell.damage}のダメージ！`);
    
    // 状態異常の適用
    if (spell.status) {
        applyStatusEffect(enemy, spell.status);
    }
    
    // ターン終了処理
    if (enemy.hp > 0) {
        setTimeout(partyTurn, BATTLE.TURN_DELAY);
    } else {
        setTimeout(winBattle, BATTLE.TURN_DELAY);
    }
}
