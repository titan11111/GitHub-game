/* ============================================
   戦闘コマンド処理モジュール
   ============================================
   
   役割: 戦闘コマンドの選択と実行を担当する
   
   責務:
   - コマンドカーソルの移動
   - 魔法カーソルの移動
   - 選択コマンドの実行
   - 選択魔法の実行
   - 使用可能魔法の取得
   
   含まれる処理:
   - moveCommandCursor() - コマンドカーソル移動（魔法選択中は魔法カーソルに切り替え）
   - moveMagicCursor() - 魔法カーソル移動
   - executeSelectedCommand() - 選択コマンド実行（たたかう/まほう/アイテム/にげる）
   - executeSelectedMagic() - 選択魔法実行（MP消費、魔法実行）
   - getAvailableMagic() - 使用可能魔法取得（レベル・MPチェック）
   
   依存関係:
   - hero, gameState, MAGIC_SPELLS - gameState.js で定義
   - updateCommandCursor(), updateMagicCursor(), showMagicList(), hideMagicList(), addBattleLog() - battle/battleUI.js で定義
   - heroTurn() - battle/battleTurns.js で定義
   - castMagic() - battle/magicSystem.js で定義
   
   検索性:
   - コマンド処理を探す: このファイル
   - コマンド追加: このファイル内の executeSelectedCommand()
   - 魔法選択処理: このファイル内の executeSelectedMagic()
   ============================================ */

/**
 * コマンド選択を移動
 * @param {number} direction - 移動方向（-1: 上, 1: 下）
 */
function moveCommandCursor(direction) {
    if (gameState.isSelectingMagic) {
        moveMagicCursor(direction);
        return;
    }
    
    const commandList = document.getElementById('command-list');
    const commands = commandList.querySelectorAll('li');
    const maxIndex = commands.length - 1;
    
    gameState.battleCommandIndex += direction;
    
    if (gameState.battleCommandIndex < 0) {
        gameState.battleCommandIndex = maxIndex;
    } else if (gameState.battleCommandIndex > maxIndex) {
        gameState.battleCommandIndex = 0;
    }
    
    updateCommandCursor();
}

/**
 * 魔法カーソルを移動
 * @param {number} direction - 移動方向（-1: 上, 1: 下）
 */
function moveMagicCursor(direction) {
    const availableMagic = getAvailableMagic();
    const maxIndex = availableMagic.length - 1;
    
    gameState.battleMagicIndex += direction;
    
    if (gameState.battleMagicIndex < 0) {
        gameState.battleMagicIndex = maxIndex;
    } else if (gameState.battleMagicIndex > maxIndex) {
        gameState.battleMagicIndex = 0;
    }
    
    updateMagicCursor();
}

/**
 * 使用可能な魔法リストを取得
 */
function getAvailableMagic() {
    return MAGIC_SPELLS.filter(spell => {
        // レベルチェック
        if (hero.lv < spell.level) return false;
        // MPチェック
        if (hero.mp < spell.mpCost) return false;
        return true;
    });
}

/**
 * 選択中のコマンドを実行
 */
function executeSelectedCommand() {
    if (gameState.isSelectingMagic) {
        executeSelectedMagic();
        return;
    }
    
    const commandList = document.getElementById('command-list');
    const commands = commandList.querySelectorAll('li');
    const selectedCommand = commands[gameState.battleCommandIndex];
    const commandType = selectedCommand.getAttribute('data-command');
    
    switch (commandType) {
        case 'attack':
            heroTurn('attack');
            break;
        case 'magic':
            showMagicList();
            break;
        case 'item':
            heroTurn('item');
            break;
        case 'escape':
            heroTurn('escape');
            break;
    }
}

/**
 * 選択中の魔法を実行
 */
function executeSelectedMagic() {
    const availableMagic = getAvailableMagic();
    if (availableMagic.length === 0) {
        hideMagicList();
        return;
    }
    
    const selectedSpell = availableMagic[gameState.battleMagicIndex];
    
    // MPチェック
    if (hero.mp < selectedSpell.mpCost) {
        addBattleLog("MPが足りない！");
        return;
    }
    
    // MP消費
    hero.mp = Math.max(0, hero.mp - selectedSpell.mpCost);
    
    // 魔法を実行
    castMagic(selectedSpell);
    
    // 魔法リストを非表示
    hideMagicList();
}
