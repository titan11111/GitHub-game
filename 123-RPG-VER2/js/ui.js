/* ============================================
   UI更新とダイアログ管理
   ============================================ */

/**
 * ステータス表示を更新
 */
function updateStatus() { 
    // 次のレベルまでの必要経験値を計算
    const nextLevelExp = getRequiredExp(hero.lv + 1);
    const currentExp = hero.exp;
    const expToNext = nextLevelExp - currentExp;
    const currentLevelExp = getRequiredExp(hero.lv);
    const expInLevel = currentExp - currentLevelExp;
    const expForLevel = nextLevelExp - currentLevelExp;
    const expPercent = expForLevel > 0 ? Math.floor((expInLevel / expForLevel) * 100) : 100;
    
    // nullチェックを追加
    const stHp = document.getElementById('st-hp');
    const stParty = document.getElementById('st-party');
    
    if (stHp) {
        stHp.innerText = `HP: ${hero.hp}/${hero.maxHp} | MP: ${hero.mp}/${hero.maxMp} | LV:${hero.lv} EXP:${currentExp}(${expPercent}%) | Gold: ${hero.gold}G | 鍵: ${hero.hasKey ? '持' : '無'}`;
    } else {
        console.warn('[updateStatus] st-hp要素が見つかりません');
    }
    
    if (stParty) {
        stParty.innerText = `一行: [${hero.name}] ` + party.slice(1).map(m => m.name).join(", ");
    } else {
        console.warn('[updateStatus] st-party要素が見つかりません');
    }
    
    // ステータスオーバーレイも更新（表示されている場合）
    updateStatusOverlay();
}

/**
 * ステータスオーバーレイを更新
 */
function updateStatusOverlay() {
    const overlayHp = document.getElementById('status-overlay-hp');
    const overlayParty = document.getElementById('status-overlay-party');
    const overlayStats = document.getElementById('status-overlay-stats');
    
    if (!overlayHp || !overlayParty || !overlayStats) return;
    
    // 次のレベルまでの必要経験値を計算
    const nextLevelExp = getRequiredExp(hero.lv + 1);
    const currentExp = hero.exp;
    const currentLevelExp = getRequiredExp(hero.lv);
    const expInLevel = currentExp - currentLevelExp;
    const expForLevel = nextLevelExp - currentLevelExp;
    const expPercent = expForLevel > 0 ? Math.floor((expInLevel / expForLevel) * 100) : 100;
    
    // HP/MP情報
    overlayHp.innerHTML = `
        <div style="margin-bottom: 8px;"><strong>HP:</strong> ${hero.hp}/${hero.maxHp}</div>
        <div style="margin-bottom: 8px;"><strong>MP:</strong> ${hero.mp}/${hero.maxMp}</div>
        <div><strong>レベル:</strong> ${hero.lv}</div>
    `;
    
    // パーティ情報
    let partyText = `<div style="margin-bottom: 8px;"><strong>パーティ:</strong></div>`;
    party.forEach((member, index) => {
        const hpPercent = Math.floor((member.hp / member.maxHp) * 100);
        partyText += `
            <div style="margin-bottom: 6px; padding-left: 10px;">
                ${index === 0 ? '【' : ''}${member.name}${index === 0 ? '】' : ''} - HP: ${member.hp}/${member.maxHp} (${hpPercent}%)
            </div>
        `;
    });
    overlayParty.innerHTML = partyText;
    
    // その他のステータス
    overlayStats.innerHTML = `
        <div style="margin-bottom: 8px;"><strong>経験値:</strong> ${currentExp} (${expPercent}%)</div>
        <div style="margin-bottom: 8px;"><strong>ゴールド:</strong> ${hero.gold}G</div>
        <div style="margin-bottom: 8px;"><strong>鍵:</strong> ${hero.hasKey ? '持っている' : '無し'}</div>
        <div style="margin-bottom: 8px;"><strong>攻撃力:</strong> ${hero.atk}</div>
        ${hero.mgc !== undefined ? `<div style="margin-bottom: 8px;"><strong>魔法力:</strong> ${hero.mgc}</div>` : ''}
    `;
}

/**
 * ステータスオーバーレイを表示/非表示
 */
function toggleStatusOverlay() {
    const overlay = document.getElementById('status-overlay');
    if (!overlay) return;
    
    if (overlay.style.display === 'flex') {
        // 閉じる
        overlay.style.display = 'none';
    } else {
        // 開く
        updateStatusOverlay();
        overlay.style.display = 'flex';
    }
}

/**
 * 画面を切り替え
 * @param {string} id - 表示する画面のID
 */
function showScreen(id) { 
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); 
    document.getElementById(id).classList.add('active');
    
    // タイトル画面の時だけgame-containerにクラスを追加（overflow制御用）
    const gameContainer = document.getElementById('game-container');
    if (id === 'start-screen') {
        gameContainer.classList.add('start-screen-active');
        gameContainer.classList.remove('main-screen-active');
    } else if (id === 'main-screen') {
        gameContainer.classList.add('main-screen-active');
        gameContainer.classList.remove('start-screen-active');
    } else {
        gameContainer.classList.remove('start-screen-active');
        gameContainer.classList.remove('main-screen-active');
    }
}

/**
 * アラートダイアログを表示
 * @param {string} text - 表示するテキスト
 */
function showAlert(text) { 
    document.getElementById('dialog-message').innerText = text; 
    document.getElementById('custom-dialog-overlay').style.display = 'flex'; 
}

/**
 * カスタムダイアログを閉じる
 */
function closeCustomDialog() { 
    document.getElementById('custom-dialog-overlay').style.display = 'none'; 
}

/**
 * 武器屋を表示・購入処理（南国の村では南国の剣を追加したリストを使用）
 */
function showShop() {
    const weaponItems = (hero.currentArea === "tropical_village" && typeof tropicalVillageShopItems !== 'undefined')
        ? tropicalVillageShopItems
        : shopItems;
    let msg = hero.currentArea === "tropical_village" ? "南国の武器屋 (番号入力):\n" : "武器屋 (番号入力):\n";
    weaponItems.forEach((item, index) => { msg += `${index}: ${item.name} (${item.price}G)\n`; });
    
    // MP回復アイテムが定義されている場合のみ表示
    if (typeof MP_ITEMS !== 'undefined' && MP_ITEMS.length > 0) {
        msg += "\n--- MP回復アイテム ---\n";
        MP_ITEMS.forEach((item, index) => { 
            msg += `${weaponItems.length + index}: ${item.name} (${item.price}G) - ${item.description}\n`; 
        });
    }
    
    const choice = prompt(msg);
    if (choice !== null) {
        const itemIndex = parseInt(choice);
        // 武器アイテム
        if (itemIndex < weaponItems.length && weaponItems[itemIndex]) {
            const item = weaponItems[itemIndex];
            if (hero.gold >= item.price) {
                // アイテム購入効果音を再生
                if (typeof playSfxPurchase === 'function') {
                    playSfxPurchase();
                }
                hero.gold -= item.price; 
                hero.atk += item.atk; 
                showAlert(`${item.name}を購入！`); 
                updateStatus(); 
            } else { showAlert("ゴールドが足りません！"); }
        }
        // MP回復アイテム（定義されている場合のみ）
        else if (typeof MP_ITEMS !== 'undefined' && 
                 itemIndex >= weaponItems.length && 
                 itemIndex < weaponItems.length + MP_ITEMS.length) {
            const item = MP_ITEMS[itemIndex - weaponItems.length];
            if (hero.gold >= item.price) {
                // アイテム購入効果音を再生
                if (typeof playSfxPurchase === 'function') {
                    playSfxPurchase();
                }
                hero.gold -= item.price;
                if (item.mpRestore >= 999) {
                    hero.mp = hero.maxMp;
                } else {
                    hero.mp = Math.min(hero.maxMp, hero.mp + item.mpRestore);
                }
                showAlert(`${item.name}を使用！${item.description}`);
                updateStatus();
            } else {
                showAlert("ゴールドが足りません！");
            }
        }
    }
}

/**
 * レベルアップ判定と処理
 */
function checkLevelUp() { 
    // 経験値テーブルを使用してレベルアップ判定
    let currentLevel = hero.lv;
    let nextLevelExp = getRequiredExp(currentLevel + 1);
    
    // 複数レベルアップに対応（経験値を大量に獲得した場合）
    while (hero.exp >= nextLevelExp && currentLevel < 50) {
        const oldLv = hero.lv;
        hero.lv++; 
        hero.atk += LEVEL_UP.ATK_BONUS; 
        hero.maxHp += LEVEL_UP.HP_BONUS;
        // 魔法力も成長（定義されている場合）
        if (LEVEL_UP.MGC_BONUS) {
            hero.mgc += LEVEL_UP.MGC_BONUS;
        }
        hero.hp = hero.maxHp;
        // MPもレベルアップ時に増やす（定義されている場合）
        const mpBonus = LEVEL_UP.MP_BONUS || 5; // デフォルト値
        hero.maxMp += mpBonus;
        hero.mp = hero.maxMp; // レベルアップ時にMPも全回復
        
        // FF風レベルアップ演出
        showLevelUpAnimation(oldLv, hero.lv);
        
        // 次のレベルアップ判定
        currentLevel = hero.lv;
        nextLevelExp = getRequiredExp(currentLevel + 1);
    }
}

/**
 * FF風レベルアップ演出を表示
 * @param {number} oldLv - レベルアップ前のレベル
 * @param {number} newLv - レベルアップ後のレベル
 */
function showLevelUpAnimation(oldLv, newLv) {
    // レベルアップ効果音を再生
    if (typeof playSfxLevelUp === 'function') {
        playSfxLevelUp();
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'levelup-overlay';
    
    const levelupText = document.createElement('div');
    levelupText.className = 'levelup-text';
    levelupText.innerText = `レベルアップ！`;
    overlay.appendChild(levelupText);
    
    const stats = document.createElement('div');
    stats.className = 'levelup-stats';
    const mgcBonus = LEVEL_UP.MGC_BONUS || 0;
    const mpBonus = LEVEL_UP.MP_BONUS || 5;
    stats.innerHTML = `LV ${oldLv} → LV ${newLv}<br>攻撃力 +${LEVEL_UP.ATK_BONUS}<br>最大HP +${LEVEL_UP.HP_BONUS}<br>魔法力 +${mgcBonus}<br>最大MP +${mpBonus}`;
    overlay.appendChild(stats);
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.remove();
        showAlert(`レベルアップ！ LV ${newLv}\n攻撃力とHPが上がった！`);
    }, 2500);
}

/**
 * 仲間のレベルアップ判定と処理（戦闘後など）
 * @param {Object} member - パーティメンバー（仲間）
 */
function checkAllyLevelUp(member) {
    if (!member || member === hero) return;
    member.lv = member.lv || 1;
    member.exp = member.exp || 0;
    let currentLevel = member.lv;
    let nextLevelExp = getRequiredExp(currentLevel + 1);
    while (member.exp >= nextLevelExp && currentLevel < 50) {
        const oldLv = member.lv;
        member.lv++;
        member.atk += (typeof ALLY_LEVEL_UP !== 'undefined' ? ALLY_LEVEL_UP.ATK_BONUS : 3);
        member.maxHp += (typeof ALLY_LEVEL_UP !== 'undefined' ? ALLY_LEVEL_UP.HP_BONUS : 8);
        member.hp = member.maxHp;
        showAllyLevelUpAnimation(member.name, oldLv, member.lv);
        currentLevel = member.lv;
        nextLevelExp = getRequiredExp(currentLevel + 1);
    }
}

/**
 * 仲間のレベルアップ演出を表示（例：犬がレベルアップした！）
 * @param {string} memberName - 仲間の名前
 * @param {number} oldLv - レベルアップ前のレベル
 * @param {number} newLv - レベルアップ後のレベル
 */
function showAllyLevelUpAnimation(memberName, oldLv, newLv) {
    if (typeof playSfxLevelUp === 'function') {
        playSfxLevelUp();
    }
    const overlay = document.createElement('div');
    overlay.className = 'levelup-overlay';
    const levelupText = document.createElement('div');
    levelupText.className = 'levelup-text';
    levelupText.innerText = `${memberName}がレベルアップした！`;
    overlay.appendChild(levelupText);
    const stats = document.createElement('div');
    stats.className = 'levelup-stats';
    const allyAtk = (typeof ALLY_LEVEL_UP !== 'undefined' ? ALLY_LEVEL_UP.ATK_BONUS : 3);
    const allyHp = (typeof ALLY_LEVEL_UP !== 'undefined' ? ALLY_LEVEL_UP.HP_BONUS : 8);
    stats.innerHTML = `LV ${oldLv} → LV ${newLv}<br>攻撃力 +${allyAtk}<br>最大HP +${allyHp}`;
    overlay.appendChild(stats);
    document.body.appendChild(overlay);
    setTimeout(() => {
        overlay.remove();
        showAlert(`${memberName}がレベルアップした！\n攻撃力とHPが上がった！`);
    }, 2500);
}

/**
 * 仲間全員のレベルアップ判定（戦闘後に呼ぶ）
 */
function checkAllyLevelUps() {
    for (let i = 1; i < party.length; i++) {
        checkAllyLevelUp(party[i]);
    }
}

/**
 * 宿屋で休む（HP/MP全回復）
 */
function rest() {
    // 宿屋で休む効果音を再生
    if (typeof playSfxRest === 'function') {
        playSfxRest();
    }
    hero.hp = hero.maxHp; 
    hero.mp = hero.maxMp; 
    updateStatus(); 
    showAlert("宿屋で休んで全快した！"); 
}
