/* ============================================
   移動処理モジュール
   ============================================
   
   役割: 主人公と仲間の移動処理を担当する
   
   責務:
   - 主人公の移動処理
   - エリア移動の判定と処理
   - 座標検証
   - 扉タイルの処理
   - 移動後の処理（NPC更新、マップ再描画、BGM切り替え）
   
   含まれる処理:
   - moveHero() - 主人公の移動処理（仲間の追従処理も含む）
   - handleAreaTransition() - エリア移動の判定と処理
   - isValidMapPosition() - マップ内の有効な座標か判定
   - handleDoorTile() - 扉タイルの処理
   - afterMove() - 移動後の処理（NPC更新、マップ再描画、BGM切り替え）
   
   依存関係:
   - getDirectionFromMovement(), getPreviousMemberPosition(), updateAllyPosition() - map/allyManager.js で定義
   - handleTileEvent(), isEncounterableTile() - map/tileEvents.js で定義
   - updateNPCs() - map/npcManager.js で定義
   - drawMap() - map/mapRenderer.js で定義
   - updateStatus() - ui.js で定義
   - showAlert() - ui.js で定義
   - startBattle() - battle/battleInitializer.js で定義
   - playSfxTownIn(), playSfxTownOut(), playSfxDoorOpen() - sfx.js で定義
   - stopAllBGM(), playAreaBGM() - audio.js で定義
   - hero, gameState, party, worldMaps, TILE, MAP_SIZE, BATTLE - gameState.js, config.js で定義
   
   検索性:
   - 移動処理を探す: このファイル
   - 移動ロジックを変更: このファイル内の moveHero()
   - エリア移動を変更: このファイル内の handleAreaTransition()
   - 扉の処理を変更: このファイル内の handleDoorTile()
   ============================================ */

/**
 * ヒーローの移動処理
 * @param {number} dx - X方向の移動量
 * @param {number} dy - Y方向の移動量
 */
function moveHero(dx, dy) {
    // 移動が無効化されている場合は何もしない
    if (gameState.heroMovementDisabled) {
        return;
    }
    
    const newX = hero.x + dx;
    const newY = hero.y + dy;
    const map = worldMaps[hero.currentArea];

    // エリア移動の判定と処理
    if (handleAreaTransition(newX, newY, map, dx, dy)) {
        // エリア移動時の方向更新
        gameState.heroDirection = getDirectionFromMovement(dx, dy);
        
        // 全仲間の位置を更新（エリア移動時）
        for (let i = 1; i < party.length; i++) {
            const allyIndex = i - 1;
            const prevPos = getPreviousMemberPosition(i);
            gameState.allyPositions[allyIndex] = updateAllyPosition(allyIndex, i, prevPos, hero.currentArea);
        }
        
        return; // エリア移動が発生した場合は終了
    }

    // マップ内の移動処理
    if (isValidMapPosition(newX, newY)) {
        const tile = map.data[newY][newX];
        
        // 壁チェック（PALM=ヤシの木は上を通れる）
        if (tile === TILE.WALL || tile === TILE.SEA) return; 

        // 扉の処理
        if (!handleDoorTile(tile, newX, newY, map)) {
            return; // 扉が開けられなかった場合は終了
        }

        // 主人公の前の位置を保存
        const prevHeroPos = { x: hero.x, y: hero.y, area: hero.currentArea, direction: gameState.heroDirection };
        
        // 全追従者の「更新前の位置」を事前に保存（更新中に上書きされないように）
        const prevAllyPositions = [];
        for (let i = 1; i < party.length; i++) {
            const allyIndex = i - 1;
            if (gameState.allyPositions[allyIndex]) {
                prevAllyPositions[allyIndex] = {
                    x: gameState.allyPositions[allyIndex].x,
                    y: gameState.allyPositions[allyIndex].y,
                    area: gameState.allyPositions[allyIndex].area,
                    direction: gameState.allyPositions[allyIndex].direction
                };
            }
        }
        
        // 全仲間の位置を更新（パーティの順番に基づく）
        // 重要：前から順番に更新する必要がある（追従者1→追従者2→追従者3）
        for (let i = 1; i < party.length; i++) {
            const allyIndex = i - 1; // allyPositions配列のインデックス
            
            // 前のメンバーの位置を取得
            let prevPos;
            if (i === 1) {
                // 追従者1は主人公の前の位置を取得
                prevPos = prevHeroPos;
            } else {
                // 追従者2以降は、前の追従者の「更新前の位置」を取得
                const prevAllyIndex = i - 2; // 前の追従者のallyPositionsインデックス
                if (prevAllyPositions[prevAllyIndex]) {
                    prevPos = prevAllyPositions[prevAllyIndex];
                } else {
                    // フォールバック：getPreviousMemberPositionを使用
                    prevPos = getPreviousMemberPosition(i);
                }
            }
            
            // 位置を更新
            if (!gameState.allyPositions[allyIndex] || gameState.allyPositions[allyIndex].area !== hero.currentArea) {
                // 初めてのエリアまたはエリア移動時：前のメンバーの後ろに配置
                gameState.allyPositions[allyIndex] = updateAllyPosition(allyIndex, i, prevPos, hero.currentArea);
            } else {
                // 通常の移動時：前のメンバーの位置に移動
                gameState.allyPositions[allyIndex].x = prevPos.x;
                gameState.allyPositions[allyIndex].y = prevPos.y;
                gameState.allyPositions[allyIndex].direction = prevPos.direction;
            }
        }
        
        // 位置を更新
        hero.x = newX; 
        hero.y = newY;
        
        // 移動方向を更新
        gameState.heroDirection = getDirectionFromMovement(dx, dy);

        // NPC接触チェック（タイルイベントより先に処理）
        if (map.npcs) {
            const npcAtPosition = map.npcs.find(n => n.x === newX && n.y === newY);
            if (npcAtPosition) {
                // NPCとの接触イベントを処理
                handleTileEvent(TILE.NPC, newX, newY, map);
                // NPC接触時は移動を完了させる（NPCの位置に移動する）
                hero.x = newX;
                hero.y = newY;
                gameState.heroDirection = getDirectionFromMovement(dx, dy);
                
                drawMap();
                afterMove();
                return; // NPC接触時は他の処理をスキップ
            }
        }
        
        // タイルイベント処理
        handleTileEvent(tile, newX, newY, map);
        
        // ランダムエンカウント判定
        if (isEncounterableTile(tile) && Math.random() < BATTLE.ENCOUNTER_RATE) {
            startBattle();
        }
    }
    
    afterMove();
}

/**
 * エリア移動の判定と処理
 * @param {number} newX - 新しいX座標
 * @param {number} newY - 新しいY座標
 * @param {Object} map - 現在のマップ情報
 * @param {number} dx - X方向の移動量
 * @param {number} dy - Y方向の移動量
 * @returns {boolean} エリア移動が発生した場合true
 */
function handleAreaTransition(newX, newY, map, dx, dy) {
    const prevArea = hero.currentArea;
    let newArea = null;
    
    // 左端から出る
    if (newX < 0 && map.exits.left) { 
        newArea = map.exits.left;
        hero.currentArea = newArea; 
        hero.x = MAP_SIZE.MAX_X;
        if (prevArea === 'tropical_south' && newArea === 'lonely_desert') {
            hero.y = 3;  // 浜→砂漠は(9,3)に着地
        }
        if (prevArea === 'tropical_village' && newArea === 'tropical_south') {
            hero.y = 4;  // 村→浜は橋(9,4)に着地
        }
        afterMove();
    }
    // 右端から出る
    else if (newX > MAP_SIZE.MAX_X && map.exits.right) { 
        newArea = map.exits.right;
        hero.currentArea = newArea; 
        hero.x = 0;
        if (newArea === 'tropical_south') hero.y = 3;   // 砂漠→南国の浜は(0,3)
        if (newArea === 'tropical_village') hero.y = 4; // 浜→南国の村は橋(0,4)
        if (newArea === 'water_spirit_dwelling') hero.y = 4; // 南国の村→水の精霊のすみか(0,4)
        if (newArea === 'monster_forest') hero.y = 4; // 水の精霊のすみか→魔物の森(0,4)
        afterMove();
    }
    // 下端から出る
    else if (newY > MAP_SIZE.MAX_Y && map.exits.bottom) {
        newArea = map.exits.bottom;
        hero.currentArea = newArea;
        hero.x = (hero.currentArea === "lonely_desert") ? 4 : newX;
        hero.y = 0; 
        afterMove();
    }
    // 上端から出る
    else if (newY < 0 && map.exits.top) {
        newArea = map.exits.top;
        hero.currentArea = newArea;
        hero.x = newX; 
        hero.y = MAP_SIZE.MAX_Y;
        afterMove();
    }
    
    // 街出入り効果音を再生
    if (newArea) {
        if (prevArea === "town_inside" && newArea !== "town_inside") {
            // 街から出る
            if (typeof playSfxTownOut === 'function') {
                playSfxTownOut();
            }
        } else if (prevArea !== "town_inside" && newArea === "town_inside") {
            // 街に入る
            if (typeof playSfxTownIn === 'function') {
                playSfxTownIn();
            }
        }
        return true;
    }
    
    return false;
}

/**
 * マップ内の有効な座標か判定
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @returns {boolean} 有効な座標の場合true
 */
function isValidMapPosition(x, y) {
    return x >= 0 && x <= MAP_SIZE.MAX_X && y >= 0 && y <= MAP_SIZE.MAX_Y;
}

/**
 * 扉タイルの処理
 * @param {number} tile - タイルタイプ
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @param {Object} map - マップ情報
 * @returns {boolean} 移動可能な場合true
 */
function handleDoorTile(tile, x, y, map) {
    if (tile === TILE.DOOR) {
        if (hero.hasKey) {
            // 扉を開ける効果音を再生
            if (typeof playSfxDoorOpen === 'function') {
                playSfxDoorOpen();
            }
            showAlert("鍵を使って扉を開けた！");
            map.data[y][x] = TILE.EMPTY; 
            return true;
        } else {
            showAlert("鍵がかかっていて進めない。");
            return false;
        }
    }
    return true;
}

/**
 * 移動後の処理
 */
function afterMove() {
    updateNPCs();
    drawMap(); 
    updateStatus();
    
    // エリアが変更された場合のみBGMを切り替え
    const currentArea = hero.currentArea;
    const previousArea = gameState.previousArea;
    
    if (currentArea !== previousArea) {
        // エリアが変更された場合のみBGMを切り替え
        gameState.previousArea = currentArea; // 前のエリアを保存
        if (typeof stopAllBGM === 'function') stopAllBGM();
        setTimeout(() => {
            if (typeof playAreaBGM === 'function') {
                console.log(`[afterMove] エリア変更検出: ${previousArea} → ${currentArea}, BGM再生開始`);
                playAreaBGM(currentArea);
            } else {
                console.error('[afterMove] playAreaBGM関数が見つかりません');
            }
        }, 200);
    }
    // エリアが変更されていない場合はBGMを再再生しない
}
