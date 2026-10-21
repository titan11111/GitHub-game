/* ============================================
   タイルイベント処理モジュール
   ============================================
   
   役割: マップ上のタイルに触れた際のイベント処理を担当する
   
   責務:
   - タイルイベントのルーティング
   - 各種タイルイベントの処理（宝箱、NPC、ショップ、戦闘開始など）
   - エンカウント可能なタイルの判定
   
   含まれる処理:
   - handleTileEvent() - タイルイベントのルーティング（switch文で各タイルタイプを処理）
   - isEncounterableTile() - エンカウント可能なタイルか判定
   
   依存関係:
   - handleGoldenCatEvent() - map/worldTransition.js で定義（金色の猫イベント）
   - showShop() - ui.js で定義（ショップ表示）
   - triggerBossEvent() - main.js で定義（ボスイベント）
   - startBattle(), startNiseousamaBattle(), startMomoBattle(), startWaterSpiritBattle(), startForestWitchBattle() - battle/battleInitializer.js で定義（戦闘開始）
   - showAlert() - ui.js で定義（アラート表示）
   - playSfxTreasure() - sfx.js で定義（宝箱効果音）
   - hero, gameState, party, allyData, worldMaps, TILE, TREASURE - gameState.js, config.js で定義
   
   検索性:
   - タイルイベントを探す: このファイル
   - 新しいタイルイベントを追加: このファイル内の handleTileEvent() に case を追加
   - エンカウント判定を変更: このファイル内の isEncounterableTile()
   ============================================ */

/**
 * タイルイベントを処理
 * @param {number} tile - タイルタイプ
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @param {Object} map - マップ情報
 */
function handleTileEvent(tile, x, y, map) {
    switch (tile) {
        case TILE.VILLAGE_ENTRANCE:
            hero.currentArea = "ruined_village";
            hero.x = 4;
            hero.y = 7;
            showAlert("かつての村に入った...");
            break;
        case TILE.CASTLE:
            if (gameState.trueKingMet) {
                startNiseousamaBattle();
            } else {
                showAlert("今は忙しい。川を調べてきてくれ。");
                hero.y++; 
            }
            break;
        case TILE.ALLY_DOG:
        case TILE.ALLY_BIRD:
        case TILE.ALLY_MONKEY: {
            const ally = allyData[tile];
            if (party.find(m => m.name === ally.name)) {
                break; // 既に仲間の場合は何もしない
            }
            // 試練戦闘用のフラグを設定
            gameState.pendingAllyTrial = tile;
            showAlert(`${ally.name}:「${ally.trialMsg}」\n\nAボタンで戦いを始める`);
            break;
        }
        case TILE.ENEMY:
            startBattle();
            break;
        case TILE.TREASURE_GOLD:
            // 宝箱効果音を再生
            if (typeof playSfxTreasure === 'function') {
                playSfxTreasure();
            }
            hero.gold += TREASURE.GOLD_AMOUNT;
            showAlert("宝箱を開けた！\n100ゴールド手に入れた！");
            map.data[y][x] = TILE.TREASURE_OPENED;
            break;
        case TILE.TREASURE_KEY:
            // 宝箱効果音を再生
            if (typeof playSfxTreasure === 'function') {
                playSfxTreasure();
            }
            hero.hasKey = true;
            showAlert("宝箱から『古い鍵』を見つけた！");
            map.data[y][x] = TILE.TREASURE_OPENED;
            break;
        case TILE.NPC:
            const npc = map.npcs?.find(n => n.x === x && n.y === y);
            if (npc) {
                // messages配列があればランダムに選ぶ、なければmsgを使用
                if (npc.messages && npc.messages.length > 0) {
                    const randomMsg = npc.messages[Math.floor(Math.random() * npc.messages.length)];
                    showAlert(randomMsg);
                } else {
                    showAlert(npc.msg);
                }
            }
            break;
        case TILE.SHOP:
            showShop(); 
            break;
        case TILE.BOSS:
            triggerBossEvent();
            break;
        case TILE.GHOST:
            showAlert("「ここはかつての村…すべてはあいつに奪われた…」");
            break;
        case TILE.MOMO:
            startMomoBattle();
            break;
        case TILE.GOLDEN_CAT:
            handleGoldenCatEvent(x, y, map);
            break;
        case TILE.WATER_SPIRIT:
            if (typeof startWaterSpiritBattle === 'function') startWaterSpiritBattle();
            break;
        case TILE.FOREST_WITCH:
            if (typeof startForestWitchBattle === 'function') startForestWitchBattle();
            break;
    }
}

/**
 * エンカウント可能なタイルか判定
 * @param {number} tile - タイルタイプ
 * @returns {boolean} エンカウント可能な場合true
 */
function isEncounterableTile(tile) {
    return tile === TILE.PLAIN || 
           tile === TILE.FOREST || 
           tile === TILE.WASTELAND || 
           tile === TILE.DESERT || 
           tile === TILE.RUINS;
}
