/* ============================================
   戦闘UI更新モジュール
   ============================================
   
   役割: 戦闘画面のUI更新を担当する
   
   責務:
   - パーティステータスの表示更新
   - 敵HPバーの更新
   - 戦闘ログの追加
   - コマンドカーソルと魔法カーソルの表示更新
   - 魔法リストの表示/非表示
   - タッチ操作ハンドラーの設定
   
   含まれる処理:
   - updateBattleStatus() - パーティステータス更新（HP/MPバー、レベル表示）
   - updateEnemyHPBar() - 敵HPバー更新
   - addBattleLog() - 戦闘ログ追加（スクロール対応）
   - updateCommandCursor() - コマンドカーソル更新
   - updateMagicCursor() - 魔法カーソル更新
   - showMagicList() - 魔法リスト表示（タッチ操作対応）
   - hideMagicList() - 魔法リスト非表示
   - setupCommandTouchHandlers() - コマンドリストのタッチ操作ハンドラー設定
   
   依存関係:
   - hero, gameState, party, MAGIC_SPELLS - gameState.js で定義
   
   検索性:
   - 戦闘UIを探す: このファイル
   - ステータス表示を変更: このファイル内の updateBattleStatus()
   - ログ表示を変更: このファイル内の addBattleLog()
   ============================================ */

/**
 * 戦闘画面のパーティステータスを更新
 */
function updateBattleStatus() {
    const area = document.getElementById('party-status-area');
    if (!area) {
        console.error('[updateBattleStatus] party-status-area要素が見つかりません');
        return;
    }
    
    area.innerHTML = '';  // ヘッダーを削除（2×2グリッドに変更）
    
    // 最大4人の枠を確保（パーティメンバー + 空き枠）
    const maxSlots = 4;
    for (let i = 0; i < maxSlots; i++) {
        if (i < party.length) {
            // パーティメンバーがいる場合
            const m = party[i];
            if (!m) {
                console.warn(`[updateBattleStatus] party[${i}]が未定義です`);
                continue;
            }
            
            const displayHp = (m.hp !== undefined && m.hp > 0) ? m.hp : 0;
            const maxHp = m.maxHp || 100;
            const displayMp = (m.mp !== undefined && m.mp > 0) ? m.mp : 0;
            const maxMp = m.maxMp || 0;
            const hpPercent = maxHp > 0 ? Math.max(0, Math.min(100, (displayHp / maxHp) * 100)) : 0;
            const mpPercent = maxMp > 0 ? Math.max(0, Math.min(100, (displayMp / maxMp) * 100)) : 0;
            
            area.innerHTML += `
                <div class="party-member-card">
                    <div class="party-member-name">${m.name || '---'}</div>
                    <div class="party-member-lv">LV: ${m.lv || 1}</div>
                    <div class="stat-row">
                        <span class="stat-label">HP:</span>
                        <span class="stat-value hp-value">${displayHp}/${maxHp}</span>
                    </div>
                    <div class="mini-bar">
                        <div class="mini-bar-fill hp-bar-fill" style="width: ${hpPercent}%"></div>
                    </div>
                    ${maxMp > 0 ? `
                    <div class="stat-row">
                        <span class="stat-label">MP:</span>
                        <span class="stat-value mp-value">${displayMp}/${maxMp}</span>
                    </div>
                    <div class="mini-bar">
                        <div class="mini-bar-fill mp-bar-fill" style="width: ${mpPercent}%"></div>
                    </div>
                    ` : ''}
                </div>`;
        } else {
            // 空き枠（薄く表示）
            area.innerHTML += `
                <div class="party-member-card" style="opacity: 0.3;">
                    <div class="party-member-name">---</div>
                    <div class="party-member-lv">LV: -</div>
                    <div class="stat-row">
                        <span class="stat-label">HP:</span>
                        <span class="stat-value">-/-</span>
                    </div>
                    <div class="mini-bar">
                        <div class="mini-bar-fill" style="width: 0%"></div>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">MP:</span>
                        <span class="stat-value">-/-</span>
                    </div>
                    <div class="mini-bar">
                        <div class="mini-bar-fill" style="width: 0%"></div>
                    </div>
                </div>`;
        }
    }
}

/**
 * 敵のHPバーを更新
 */
function updateEnemyHPBar() {
    const enemy = gameState.currentEnemy;
    if (!enemy || !enemy.maxHp) return;
    
    const hpBar = document.getElementById('enemy-hp-bar');
    const hpBarFill = document.getElementById('enemy-hp-bar-fill');
    const hpBarText = document.getElementById('enemy-hp-bar-text');
    
    const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
    hpBar.style.display = 'block';
    hpBarFill.style.width = `${hpPercent}%`;
    hpBarText.innerText = `HP: ${Math.max(0, enemy.hp)}/${enemy.maxHp}`;
}

/**
 * 戦闘ログにメッセージを追加（スクロール対応）
 * @param {string} message - ログメッセージ
 */
function addBattleLog(message) {
    const battleLog = document.getElementById('battle-log');
    battleLog.innerHTML += `<div>${message}</div>`;
    // 最新のメッセージにスクロール
    battleLog.scrollTop = battleLog.scrollHeight;
}

/**
 * iOS: コマンドリストのタッチ操作ハンドラーを設定
 */
function setupCommandTouchHandlers() {
    const commandList = document.getElementById('command-list');
    if (!commandList) return;
    
    // 既存のイベントリスナーを削除（重複防止）
    const commands = commandList.querySelectorAll('li');
    commands.forEach(cmd => {
        // 既存のイベントリスナーを削除するために、新しい要素に置き換え
        const newCmd = cmd.cloneNode(true);
        cmd.parentNode.replaceChild(newCmd, cmd);
    });
    
    // 新しいイベントリスナーを追加
    const newCommands = commandList.querySelectorAll('li');
    newCommands.forEach((cmd, index) => {
        // タッチ/クリックイベントでコマンドを直接選択
        const handleCommandSelect = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!gameState.canAttack || gameState.isSelectingMagic) return;
            
            // 選択インデックスを更新
            gameState.battleCommandIndex = index;
            updateCommandCursor();
            
            // タッチフィードバック：一時的にハイライト
            cmd.style.transform = 'scale(0.95)';
            setTimeout(() => {
                cmd.style.transform = '';
            }, 150);
            
            // 少し待ってから実行（視覚的フィードバックのため）
            setTimeout(() => {
                executeSelectedCommand();
            }, 150);
        };
        
        cmd.addEventListener('click', handleCommandSelect);
        cmd.addEventListener('touchend', handleCommandSelect, { passive: false });
    });
}

/**
 * コマンドカーソルを更新
 */
function updateCommandCursor() {
    const commandList = document.getElementById('command-list');
    const commands = commandList.querySelectorAll('li');
    commands.forEach((cmd, index) => {
        const commandText = cmd.getAttribute('data-command');
        let displayText = '';
        switch (commandText) {
            case 'attack':
                displayText = 'たたかう';
                break;
            case 'magic':
                displayText = 'まほう';
                break;
            case 'item':
                displayText = 'アイテム';
                break;
            case 'escape':
                displayText = 'にげる';
                break;
        }
        
        if (index === gameState.battleCommandIndex) {
            cmd.innerHTML = `<span class="command-cursor">▶</span> ${displayText}`;
            cmd.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            cmd.classList.add('selected');  /* クラスを追加してCSSを確実に適用 */
        } else {
            cmd.innerHTML = ` ${displayText}`;
            cmd.style.backgroundColor = 'transparent';
            cmd.classList.remove('selected');  /* クラスを削除 */
        }
    });
}

/**
 * 魔法リストを表示
 */
function showMagicList() {
    gameState.isSelectingMagic = true;
    gameState.battleMagicIndex = 0;
    
    const commandList = document.getElementById('command-list');
    const magicList = document.getElementById('magic-list');
    
    commandList.style.display = 'none';
    magicList.style.display = 'block';
    magicList.innerHTML = '';
    
    const availableMagic = getAvailableMagic();
    
    if (availableMagic.length === 0) {
        magicList.innerHTML = '<li style="opacity: 0.5;">使用可能な魔法がありません</li>';
        addBattleLog("使用可能な魔法がない！");
        setTimeout(() => {
            hideMagicList();
        }, 1000);
        return;
    }
    
    availableMagic.forEach((spell, index) => {
        const li = document.createElement('li');
        li.setAttribute('data-magic-id', spell.id);
        const mpText = hero.mp >= spell.mpCost ? `${spell.mpCost}MP` : `<span style="color: #f00;">MP不足</span>`;
        li.innerHTML = ` ${spell.name} (${mpText})`;
        
        // iOS: タッチ操作対応（コマンドリストと同じスタイルを適用）
        li.style.padding = '12px 10px';
        li.style.fontSize = '16px';
        li.style.minHeight = '48px';
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.cursor = 'pointer';
        li.style.transition = 'all 0.2s ease';
        li.style.borderRadius = '4px';
        li.style.margin = '2px 0';
        li.style.borderBottom = '1px solid rgba(255,255,255,0.15)';
        
        const handleMagicSelect = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            gameState.battleMagicIndex = index;
            updateMagicCursor();
            
            // タッチフィードバック：一時的にハイライト
            li.style.transform = 'scale(0.95)';
            setTimeout(() => {
                li.style.transform = '';
            }, 150);
            
            setTimeout(() => {
                executeSelectedMagic();
            }, 150);
        };
        
        li.addEventListener('click', handleMagicSelect);
        li.addEventListener('touchend', handleMagicSelect, { passive: false });
        
        magicList.appendChild(li);
    });
    
    updateMagicCursor();
}

/**
 * 魔法リストを非表示
 */
function hideMagicList() {
    gameState.isSelectingMagic = false;
    const commandList = document.getElementById('command-list');
    const magicList = document.getElementById('magic-list');
    
    commandList.style.display = 'block';
    magicList.style.display = 'none';
}

/**
 * 魔法カーソルを更新
 */
function updateMagicCursor() {
    const magicList = document.getElementById('magic-list');
    const magics = magicList.querySelectorAll('li');
    const availableMagic = getAvailableMagic();
    
    magics.forEach((magic, index) => {
        const spell = availableMagic[index];
        if (!spell) return;
        
        const mpText = hero.mp >= spell.mpCost ? `${spell.mpCost}MP` : `<span style="color: #f00;">MP不足</span>`;
        
        if (index === gameState.battleMagicIndex) {
            magic.innerHTML = `<span class="command-cursor">▶</span> ${spell.name} (${mpText})`;
            magic.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            magic.classList.add('selected');  /* クラスを追加してCSSを確実に適用 */
        } else {
            magic.innerHTML = ` ${spell.name} (${mpText})`;
            magic.style.backgroundColor = 'transparent';
            magic.classList.remove('selected');  /* クラスを削除 */
        }
    });
}
