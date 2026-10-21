/* ============================================
   仲間位置管理モジュール
   ============================================
   
   役割: パーティ内の仲間キャラクターの位置を管理する
   
   責務:
   - 仲間の位置情報の取得・更新
   - パーティ内での追従位置の計算
   - 仲間の追加処理
   
   含まれる処理:
   - getAllyPosition() - 仲間の位置取得（パーティインデックスから）
   - getPreviousMemberPosition() - 前のメンバー（主人公または前の仲間）の位置取得
   - getBehindPosition() - 指定位置の後ろの位置を計算
   - getDirectionFromMovement() - 移動量から方向文字列を取得
   - updateAllyPosition() - 仲間の位置更新（エリア移動時と通常移動時の共通処理）
   - addAlly() - 仲間をパーティに追加
   
   依存関係:
   - isValidMapPosition() - map/movement.js で定義（座標検証）
   - worldMaps, TILE - gameState.js で定義（マップデータ・タイル定数）
   - hero, gameState, party, allyData - gameState.js で定義（ゲーム状態）
   - drawMap() - map/mapRenderer.js で定義（マップ再描画）
   - updateStatus() - ui.js で定義（ステータス更新）
   - showAlert() - ui.js で定義（アラート表示）
   - playSfxAllyDog(), playSfxAllyMonkey(), playSfxAllyBird() - sfx.js で定義（効果音）
   
   検索性:
   - 仲間の位置を探す: このファイル
   - 追従ロジックを変更: このファイル内の getBehindPosition(), updateAllyPosition()
   - 仲間追加処理を変更: このファイル内の addAlly()
   ============================================ */

/**
 * 仲間の位置を取得（パーティの順番に基づく）
 * @param {number} partyIndex - パーティ内のインデックス（0=主人公、1=最初の仲間、2=2番目の仲間...）
 * @returns {Object|null} 位置情報 {x, y, area, direction} または null
 */
function getAllyPosition(partyIndex) {
    // partyIndex 0は主人公なので、仲間は1から始まる
    const allyIndex = partyIndex - 1;
    if (allyIndex >= 0 && allyIndex < gameState.allyPositions.length && gameState.allyPositions[allyIndex]) {
        return gameState.allyPositions[allyIndex];
    }
    return null;
}

/**
 * 前のメンバーの位置を取得（主人公または前の仲間）
 * @param {number} partyIndex - 現在のパーティインデックス
 * @returns {Object} 位置情報 {x, y, area, direction}
 */
function getPreviousMemberPosition(partyIndex) {
    if (partyIndex === 1) {
        // 最初の仲間（追従者1）は主人公の後ろ
        return { x: hero.x, y: hero.y, area: hero.currentArea, direction: gameState.heroDirection };
    } else {
        // 2番目以降の仲間は前の仲間の後ろ
        const prevAllyIndex = partyIndex - 1;
        const prevPos = getAllyPosition(prevAllyIndex);
        if (prevPos) {
            return prevPos;
        }
        // フォールバック：主人公の位置
        return { x: hero.x, y: hero.y, area: hero.currentArea, direction: gameState.heroDirection };
    }
}

/**
 * 指定された位置の後ろの位置を計算
 * @param {Object} pos - 位置情報 {x, y, direction}
 * @returns {Object} 後ろの位置 {x, y}
 */
function getBehindPosition(pos) {
    const directionMap = {
        'up': { x: 0, y: 1 },
        'down': { x: 0, y: -1 },
        'left': { x: 1, y: 0 },
        'right': { x: -1, y: 0 }
    };
    const offset = directionMap[pos.direction] || { x: 0, y: 1 };
    return { x: pos.x + offset.x, y: pos.y + offset.y };
}

/**
 * 移動方向から方向文字列を取得
 * @param {number} dx - X方向の移動量
 * @param {number} dy - Y方向の移動量
 * @returns {string} 方向（'up', 'down', 'left', 'right'）
 */
function getDirectionFromMovement(dx, dy) {
    if (dy < 0) return 'up';
    if (dy > 0) return 'down';
    if (dx > 0) return 'right';
    if (dx < 0) return 'left';
    return 'down'; // デフォルト
}

/**
 * 仲間の位置を更新（エリア移動時と通常移動時の共通処理）
 * @param {number} allyIndex - 仲間のインデックス（allyPositions配列のインデックス）
 * @param {number} partyIndex - パーティインデックス
 * @param {Object} prevPos - 前のメンバーの位置
 * @param {string} currentArea - 現在のエリア
 * @returns {Object} 更新された位置情報
 */
function updateAllyPosition(allyIndex, partyIndex, prevPos, currentArea) {
    const behindPos = getBehindPosition(prevPos);
    const isValid = isValidMapPosition(behindPos.x, behindPos.y) && 
                    worldMaps[currentArea].data[behindPos.y][behindPos.x] !== TILE.WALL;
    
    return {
        x: isValid ? behindPos.x : prevPos.x,
        y: isValid ? behindPos.y : prevPos.y,
        area: currentArea,
        direction: prevPos.direction
    };
}

/**
 * 仲間をパーティに追加
 * @param {number} type - 仲間タイプ（TILE.ALLY_DOG等）
 */
function addAlly(type) {
    const ally = allyData[type];
    if (!party.find(m => m.name === ally.name)) {
        party.push({ ...ally });
        // タイルの削除は confirmBattleResult() で既に処理されているため、ここでは削除しない
        // （試練戦闘の場合、保存された位置のタイルを削除する必要があるため）
        
        // 新しい仲間の位置を設定（パーティの順番に基づく）
        const newAllyIndex = party.length - 2; // 新しく追加された仲間のインデックス（party[0]は主人公）
        
        // 配列の長さを確保（新しい仲間のインデックスまで）
        while (gameState.allyPositions.length <= newAllyIndex) {
            gameState.allyPositions.push(null);
        }
        
        // 前のメンバーの位置を取得
        const partyIndex = party.length - 1; // 新しく追加された仲間のpartyインデックス
        const prevPos = getPreviousMemberPosition(partyIndex);
        const behindPos = getBehindPosition(prevPos);
        
        // 位置を設定
        gameState.allyPositions[newAllyIndex] = updateAllyPosition(newAllyIndex, partyIndex, prevPos, hero.currentArea);
        
        // 仲間加入効果音を再生
        if (type === TILE.ALLY_DOG && typeof playSfxAllyDog === 'function') {
            playSfxAllyDog();
        } else if (type === TILE.ALLY_MONKEY && typeof playSfxAllyMonkey === 'function') {
            playSfxAllyMonkey();
        } else if (type === TILE.ALLY_BIRD && typeof playSfxAllyBird === 'function') {
            playSfxAllyBird();
        }
        
        // マップを再描画して仲間を表示
        drawMap();
        updateStatus();
        showAlert(`${ally.name}:「${ally.msg}」\n\n${ally.name}が仲間に加わった！`);
    }
}
