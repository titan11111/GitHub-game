/* ============================================
   異世界転移モジュール
   ============================================
   
   役割: 金色の猫イベントと異世界への転移・復帰処理を担当する
   
   責務:
   - 金色の猫イベントの処理
   - 異世界への転移処理（ゲーム状態の保存、外部ゲームへの遷移）
   - 外部ゲームからの復帰処理（ゲーム状態の復元）
   - はい/いいえモーダルの表示
   
   含まれる処理:
   - handleGoldenCatEvent() - 金色の猫イベントの処理（クリア済みチェック、モーダル表示）
   - transferToOtherWorld() - 異世界への転移処理（状態保存、外部ゲームへの遷移）
   - playMysteriousSound() - 不思議な音の再生（Web Audio API使用）
   - returnFromOtherWorld() - 外部ゲームからの復帰処理（状態復元、クリアフラグチェック）
   - showYesNoModal() - はい/いいえモーダルの表示（キーボード操作対応）
   
   依存関係:
   - hero, gameState, party, allyData - gameState.js で定義（ゲーム状態）
   - showAlert() - ui.js で定義（アラート表示）
   - drawMap() - map/mapRenderer.js で定義（マップ再描画）
   - updateStatus() - ui.js で定義（ステータス更新）
   - playAreaBGM() - audio.js で定義（BGM再生）
   - showScreen() - ui.js で定義（画面切り替え）
   
   検索性:
   - 異世界転移を探す: このファイル
   - 金色の猫イベントを探す: このファイル内の handleGoldenCatEvent()
   - 外部ゲームへの遷移: このファイル内の transferToOtherWorld()
   - 復帰処理: このファイル内の returnFromOtherWorld()
   ============================================ */

/**
 * 金色の🐈イベントを処理
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @param {Object} map - マップ情報
 */
function handleGoldenCatEvent(x, y, map) {
    // クリア済みかどうかをチェック
    const goldenCatCleared = safeLocalStorageGetItem('rpgGoldenCatCleared');
    const isCleared = goldenCatCleared === 'true';
    
    // 既に処理済みで、かつクリア済みでない場合はスキップ
    // クリア済みの場合は、再実行を許可する
    if (gameState.goldenCatProcessed && !isCleared) {
        return;
    }
    
    // クリア済みの場合は特別なメッセージを表示
    const message = isCleared 
        ? "猫ガミさまは偉大だニャー\nもう一度試練に挑戦するニャ？" 
        : "猫ガミさまは偉大だニャー";
    
    // モーダルを表示
    showYesNoModal(message, (yes) => {
        if (yes) {
            // はい → 124には行かず、そのまま冒険を続ける
            showAlert("そうだニャ❤️");
        } else {
            // いいえ → 即時に 124-inveder neko へ飛ぶ
            transferToOtherWorld();
        }
    });
}

/**
 * はい/いいえモーダルを表示
 * @param {string} message - 表示するメッセージ
 * @param {Function} callback - 選択時のコールバック（true=はい, false=いいえ）
 */
function showYesNoModal(message, callback) {
    const overlay = document.getElementById('yes-no-modal-overlay');
    const messageElem = document.getElementById('yes-no-message');
    const yesButton = document.getElementById('yes-button');
    const noButton = document.getElementById('no-button');
    
    messageElem.innerText = message;
    overlay.style.display = 'flex';
    
    // 既存のイベントリスナーを削除
    const newYesButton = yesButton.cloneNode(true);
    const newNoButton = noButton.cloneNode(true);
    yesButton.parentNode.replaceChild(newYesButton, yesButton);
    noButton.parentNode.replaceChild(newNoButton, noButton);
    
    // 新しいイベントリスナーを追加
    newYesButton.addEventListener('click', () => {
        overlay.style.display = 'none';
        if (callback) callback(true);
    });
    
    newNoButton.addEventListener('click', () => {
        overlay.style.display = 'none';
        if (callback) callback(false);
    });
    
    // キーボード操作対応（Enter=はい, Escape=いいえ）
    const handleKeyPress = (e) => {
        if (overlay.style.display === 'none') return;
        if (e.key === 'Enter') {
            overlay.style.display = 'none';
            document.removeEventListener('keydown', handleKeyPress);
            if (callback) callback(true);
        } else if (e.key === 'Escape') {
            overlay.style.display = 'none';
            document.removeEventListener('keydown', handleKeyPress);
            if (callback) callback(false);
        }
    };
    document.addEventListener('keydown', handleKeyPress);
}

/**
 * 異世界に転移する処理
 */
function transferToOtherWorld() {
    // ゲーム状態を保存
    const savedState = {
        heroX: hero.x,
        heroY: hero.y,
        heroArea: hero.currentArea,
        heroDirection: gameState.heroDirection,
        party: party.map(m => ({ name: m.name, hp: m.hp, maxHp: m.maxHp, atk: m.atk, lv: m.lv, exp: m.exp })),
        heroStats: {
            hp: hero.hp,
            maxHp: hero.maxHp,
            mp: hero.mp,
            maxMp: hero.maxMp,
            atk: hero.atk,
            mgc: hero.mgc,
            lv: hero.lv,
            exp: hero.exp,
            gold: hero.gold,
            hasKey: hero.hasKey
        }
    };
    safeLocalStorageSetItem('rpgSavedState', JSON.stringify(savedState));
    safeLocalStorageSetItem('rpgWaitingForReturn', 'true');
    gameState.goldenCatProcessed = true;
    
    // メッセージ表示
    showAlert(`${hero.name}は異世界に飛ばされた`);
    
    // 移動無効化フラグをリセット
    gameState.heroMovementDisabled = false;
    
    // 不思議な音を10秒流す
    playMysteriousSound(10000).then(() => {
        // 音声再生後にページ遷移（戻り先URLをパラメータとして渡す）
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `https://titan11111.github.io/124-inveder-neko/?return=${returnUrl}`;
    });
}

/**
 * 不思議な音を再生
 * @param {number} duration - 再生時間（ミリ秒）
 * @returns {Promise} 再生完了を待つPromise
 */
function playMysteriousSound(duration) {
    return new Promise((resolve) => {
        // Web Audio APIを使用して不思議な音を生成
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 不思議な音色を設定（複数の周波数を組み合わせ）
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + duration / 1000);
        
        // 音量をフェードイン・フェードアウト（130%の音量 = 1.3倍）
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3 * 1.3, audioContext.currentTime + 0.5);
        gainNode.gain.linearRampToValueAtTime(0.3 * 1.3, audioContext.currentTime + (duration / 1000) - 0.5);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration / 1000);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration / 1000);
        
        setTimeout(() => {
            audioContext.close();
            resolve();
        }, duration);
    });
}

/**
 * 外部ゲームから復帰する処理
 */
function returnFromOtherWorld() {
    // 保存された状態を復元
    const savedStateStr = safeLocalStorageGetItem('rpgSavedState');
    const waitingForReturn = safeLocalStorageGetItem('rpgWaitingForReturn');
    const goldenCatCleared = safeLocalStorageGetItem('rpgGoldenCatCleared');
    
    // 復帰処理を実行する前に、ゲームが実際に開始されているか確認
    const mainScreen = document.getElementById('main-screen');
    if (!mainScreen || !mainScreen.classList.contains('active')) {
        // メイン画面が表示されていない場合は、メイン画面に遷移してから再試行
        if (mainScreen) {
            showScreen('main-screen');
            // 少し待ってから再試行
            setTimeout(() => {
                returnFromOtherWorld();
            }, 500);
        } else {
            // メイン画面が存在しない場合は、フラグをクリアして終了
            safeLocalStorageRemoveItem('rpgSavedState');
            safeLocalStorageRemoveItem('rpgWaitingForReturn');
            safeLocalStorageRemoveItem('rpgGoldenCatCleared');
        }
        return;
    }
    
    if (savedStateStr && waitingForReturn === 'true') {
        try {
            const savedState = JSON.parse(savedStateStr);
            hero.x = savedState.heroX;
            hero.y = savedState.heroY;
            hero.currentArea = savedState.heroArea;
            gameState.heroDirection = savedState.heroDirection || 'down';
            
            // ステータスを復元
            if (savedState.heroStats) {
                hero.hp = savedState.heroStats.hp;
                hero.maxHp = savedState.heroStats.maxHp;
                hero.mp = savedState.heroStats.mp;
                hero.maxMp = savedState.heroStats.maxMp;
                hero.atk = savedState.heroStats.atk;
                hero.mgc = savedState.heroStats.mgc;
                hero.lv = savedState.heroStats.lv;
                hero.exp = savedState.heroStats.exp;
                hero.gold = savedState.heroStats.gold;
                hero.hasKey = savedState.heroStats.hasKey;
            }
            
            // パーティを復元
            if (savedState.party && savedState.party.length > 1) {
                party = [hero];
                for (let i = 1; i < savedState.party.length; i++) {
                    const allyData = savedState.party[i];
                    // 仲間データから該当する仲間を探す
                    const allyType = Object.keys(allyData).find(key => 
                        allyData[key] && allyData[key].name === allyData.name
                    );
                    if (allyData.name === "犬") {
                        party.push({ ...allyData });
                    } else if (allyData.name === "きじ") {
                        party.push({ ...allyData });
                    } else if (allyData.name === "猿") {
                        party.push({ ...allyData });
                    }
                }
            }
            
            // クリアフラグをチェック
            if (goldenCatCleared === 'true') {
                // クリア済みの場合、復帰メッセージを表示
                showAlert("おかえりニャー🎵\n猫ガミさまの偉大さがわかったね！\nまた挑戦したいときは、金の猫に触れてニャ！");
                
                // クリア済みでも再実行できるように、goldenCatProcessedをfalseにリセット
                // ただし、クリアフラグは保持して、次回の復帰時にクリア済みであることを示す
                gameState.goldenCatProcessed = false;
            } else {
                // クリアされていない場合（敗北など）
                showAlert("おかえりニャー🎵\nまだ猫ガミさまの試練は続くニャ...");
                // 敗北の場合は、再挑戦できるようにgoldenCatProcessedをfalseにリセット
                gameState.goldenCatProcessed = false;
            }
            
            // フラグをクリア（ただし、クリア済みフラグは保持して、次回の復帰時にクリア済みであることを示す）
            safeLocalStorageRemoveItem('rpgSavedState');
            safeLocalStorageRemoveItem('rpgWaitingForReturn');
            // rpgGoldenCatClearedは保持（次回の復帰時にクリア済みであることを示すため）
            
            // マップを再描画
            drawMap();
            updateStatus();
            playAreaBGM(hero.currentArea);
        } catch (e) {
            console.error('状態の復元に失敗しました:', e);
            safeLocalStorageRemoveItem('rpgSavedState');
            safeLocalStorageRemoveItem('rpgWaitingForReturn');
            safeLocalStorageRemoveItem('rpgGoldenCatCleared');
        }
    }
}
