/* ============================================
   初期化とコントローラー処理、シナリオイベント
   ============================================ */

/**
 * iOS Safari対応: 音声アンロック＋タイトル画面時はタイトルBGM再生
 * ユーザー操作のたびに呼んでよい（内部で重複再生を防ぐ）
 */
function ensureAudioUnlockAndMaybePlayTitleBGM() {
    if (typeof audioContextUnlocked !== 'undefined' && typeof unlockAudioContext === 'function' && !audioContextUnlocked) {
        unlockAudioContext();
    }
    const startScreen = document.getElementById('start-screen');
    if (!startScreen || !startScreen.classList.contains('active')) return;
    if (typeof playBGM !== 'function') return;
    const currentBGM = typeof getCurrentBGM === 'function' ? getCurrentBGM() : null;
    if (currentBGM && currentBGM.id === 'bgm-title' && !currentBGM.paused) return;
    setTimeout(() => { playBGM('bgm-title'); }, TIMING.AUDIO_UNLOCK_RETRY_MS || 100);
}

/**
 * 移動入力処理
 * @param {number} dx - X方向の移動量（-1, 0, 1）
 * @param {number} dy - Y方向の移動量（-1, 0, 1）
 */
function handleMove(dx, dy) {
    ensureAudioUnlockAndMaybePlayTitleBGM();

    // 戦闘中のコマンド選択
    if (gameState.isBattle && gameState.canAttack) {
        if (dy === -1) {
            // 上ボタン：コマンドを上に移動
            moveCommandCursor(-1);
        } else if (dy === 1) {
            // 下ボタン：コマンドを下に移動
            moveCommandCursor(1);
        }
        return;
    }
    
    // 移動できない状態のチェック
    if (gameState.isBattle) return;
    if (document.getElementById('custom-dialog-overlay').style.display === 'flex') return;
    if (document.getElementById('yes-no-modal-overlay').style.display === 'flex') return;
    if (document.getElementById('prologue-screen').classList.contains('active')) return;
    
    moveHero(dx, dy);
}

function handleA() {
    ensureAudioUnlockAndMaybePlayTitleBGM();

    const dialogOverlay = document.getElementById('custom-dialog-overlay');
    const yesNoModal = document.getElementById('yes-no-modal-overlay');
    const startScreen = document.getElementById('start-screen');
    const prologueScreen = document.getElementById('prologue-screen');
    const endingScreen = document.getElementById('ending-screen');
    const townActions = document.getElementById('town-actions');

    // はい/いいえモーダルが開いている場合は「はい」を選択
    if (yesNoModal && yesNoModal.style.display === 'flex') {
        const yesButton = document.getElementById('yes-button');
        if (yesButton) {
            yesButton.click();
        }
        return;
    }

    // ダイアログが開いている場合は閉じる（仲間の挑発台詞の直後なら試練戦闘開始）
    if (dialogOverlay.style.display === 'flex') {
        if (gameState.pendingAllyTrial !== null) {
            const tile = gameState.pendingAllyTrial;
            gameState.pendingAllyTrial = null;
            closeCustomDialog();
            if (typeof startAllyTrialBattle === 'function') startAllyTrialBattle(tile);
        } else {
            closeCustomDialog();
        }
        return;
    }

    // タイトル画面
    if (startScreen.classList.contains('active')) {
        // 復帰フラグがある場合はプロローグをスキップしてメインへ
        const waitingForReturn = safeLocalStorageGetItem('rpgWaitingForReturn');
        const savedState = safeLocalStorageGetItem('rpgSavedState');
        if (waitingForReturn === 'true' && savedState) {
            if (typeof stopAllBGM === 'function') stopAllBGM();
            showScreen('main-screen');
            setTimeout(() => {
                if (typeof returnFromOtherWorld === 'function') returnFromOtherWorld();
            }, 1000);
            return;
        }

        // 1回目A: オープニングBGMを再生してタイトルに留まる
        if (gameState.titleScreenStep === 0) {
            if (typeof playBGM === 'function') {
                const currentBGM = typeof getCurrentBGM === 'function' ? getCurrentBGM() : null;
                if (!currentBGM || currentBGM.id !== 'bgm-title' || currentBGM.paused) {
                    playBGM('bgm-title');
                }
            }
            gameState.titleScreenStep = 1;
            return;
        }

        // 2回目A: プロローグへ進む
        if (typeof stopAllBGM === 'function') stopAllBGM();
        showScreen('prologue-screen');
        setTimeout(() => {
            if (typeof playBGM === 'function') playBGM('bgm-prologue');
        }, 150);
        gameState.titleScreenStep = 0; // 次回起動用にリセット
        return;
    }

    // プロローグ画面
    if (prologueScreen.classList.contains('active')) {
        startPrologue();
        return;
    }

    // エンディング画面
    if (endingScreen.classList.contains('active')) {
        // BGMを停止してからリロード
        stopAllBGM();
        location.reload();
        return;
    }

    // 戦闘中
    if (gameState.isBattle) {
        if (gameState.isBattleEnding) {
            confirmBattleResult();
        } else if (gameState.canAttack) {
            executeSelectedCommand();
        }
        return;
    }

    // 宿屋アクション
    if (townActions.style.display === 'block') {
        rest();
        return;
    }

    // メイン画面：仲間のいるマスでAボタン→挑発台詞を表示（閉じたら試練戦闘開始・勝てば仲間）
    const mainScreen = document.getElementById('main-screen');
    if (mainScreen && mainScreen.classList.contains('active')) {
        const map = worldMaps[hero.currentArea];
        if (map && map.data && map.data[hero.y] !== undefined) {
            const tile = map.data[hero.y][hero.x];
            if ((tile === TILE.ALLY_DOG || tile === TILE.ALLY_BIRD || tile === TILE.ALLY_MONKEY)) {
                const ally = allyData[tile];
                if (ally && !party.find(m => m.name === ally.name)) {
                    gameState.pendingAllyTrial = tile;
                    showAlert(`${ally.name}:「${ally.trialMsg}」\n\nAボタンで戦いを始める`);
                    return;
                }
            }
        }
    }
}

function handleB() {
    // はい/いいえモーダルが開いている場合は「いいえ」を選択
    const yesNoModal = document.getElementById('yes-no-modal-overlay');
    if (yesNoModal && yesNoModal.style.display === 'flex') {
        const noButton = document.getElementById('no-button');
        if (noButton) {
            noButton.click();
        }
        return;
    }
    
    // カスタムダイアログが開いている場合は閉じる
    const dialogOverlay = document.getElementById('custom-dialog-overlay');
    if (dialogOverlay && dialogOverlay.style.display === 'flex') {
        closeCustomDialog();
        return;
    }
    
    // 魔法選択中はキャンセル
    if (gameState.isBattle && gameState.isSelectingMagic) {
        hideMagicList();
        gameState.isSelectingMagic = false;
        return;
    }
    
    // メイン画面または戦闘画面でステータスオーバーレイを表示/非表示
    const mainScreen = document.getElementById('main-screen');
    const battleScreen = document.getElementById('battle-screen');
    if ((mainScreen && mainScreen.classList.contains('active')) || 
        (battleScreen && battleScreen.classList.contains('active'))) {
        if (typeof toggleStatusOverlay === 'function') {
            toggleStatusOverlay();
        }
        return;
    }
}

/**
 * プロローグ進行処理
 */
function startPrologue() {
    const textElem = document.getElementById('prologue-text');
    const step = gameState.prologueStep;
    
    if (step === 0) {
        // 名前入力
        let name = prompt("お主の名前を教えてくれ（カタカナ4文字以内）", "ユウシャ");
        if (!name) name = "ユウシャ";
        hero.name = name.substring(0, 4);
        textElem.innerText = `王様：「そうじゃった、${hero.name}よ。頼みがある。」`;
        gameState.prologueStep++;
    } else if (step === 1) {
        textElem.innerText = "王様：「最近、街の川の流れが悪くなっておるのじゃ。」";
        gameState.prologueStep++;
    } else if (step === 2) {
        textElem.innerText = "王様：「何者かが川上で悪さをしているのかもしれん。」";
        gameState.prologueStep++;
    } else if (step === 3) {
        textElem.innerText = `王様：「${hero.name}よ、川上を調べてきてはくれまいか？」`;
        gameState.prologueStep++;
    } else {
        // プロローグ終了、ゲーム開始
        if (typeof stopAllBGM === 'function') stopAllBGM();
        showScreen('main-screen');
        drawMap();
        updateStatus();
        // 音声コンテキストがアンロックされていることを確認してからBGMを再生
        // プロローグBGMを確実に停止してから、少し待機してからエリアBGMを再生
        setTimeout(() => {
            // 初期エリアを設定（BGM再生制御用）
            gameState.previousArea = hero.currentArea;
            if (typeof playAreaBGM === 'function') {
                console.log(`[startPrologue] エリアBGM再生開始: currentArea=${hero.currentArea}`);
                playAreaBGM(hero.currentArea);
            }
        }, 300);
        showAlert("王様に頼まれ、冒険が始まった！");
        
        // メイン画面に遷移した後、復帰フラグをチェック（念のため）
        setTimeout(() => {
            checkReturnFromOtherWorld();
        }, 500);
    }
}

/**
 * ボスイベントのトリガー処理
 */
function triggerBossEvent() {
    const choice = confirm("水源に魔王がいます。戦いますか？");
    if (choice) {
        startBossBattle();
    } else {
        const joinChoice = confirm("私が元王様だ。水源の岩をどかすのを手伝ってくれんか？");
        if (joinChoice) {
            gameState.trueKingMet = true;
            showAlert("ありがとう。街の王は偽物じゃ。懲らしめてくれ。");
        } else {
            startBossBattle();
        }
    }
}

/**
 * 偽王様（オウサマニア）戦闘開始
 */
function startNiseousamaBattle() {
    showAlert("オウサマニア:「バレたか。邪魔者は消えよ！！！！」");
    gameState.isBattle = true;
    gameState.isBattleEnding = false;
    gameState.currentEnemy = { 
        name: "オウサマニア", 
        hp: 3200, 
        atk: 70, 
        exp: 0, 
        gold: 0, 
        img: 'images/niseousama.png'
    };
    initBattle();
}

/**
 * 桃仙人戦闘開始
 */
function startMomoBattle() {
    showAlert("桃仙人:「わしのお供を勝手に仲間にしたのはお前か？\n許さん！」");
    gameState.isBattle = true;
    gameState.isBattleEnding = false;
    gameState.currentEnemy = { 
        name: "桃仙人", 
        hp: 800, 
        atk: 45, 
        exp: 1000, 
        gold: 500, 
        img: 'images/momosennin.png'
    };
    initBattle();
}

// タッチイベントの防止設定
document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

// 外部ゲームから復帰したかチェック
function checkReturnFromOtherWorld() {
    // localStorageで復帰を検出
    const waitingForReturn = safeLocalStorageGetItem('rpgWaitingForReturn');
    const savedState = safeLocalStorageGetItem('rpgSavedState');
    
    // 復帰処理を実行する条件：フラグ'true'かつ保存状態あり
    if (waitingForReturn !== 'true' || !savedState) return;
    
    const mainScreen = document.getElementById('main-screen');
    const startScreen = document.getElementById('start-screen');
    
    // タイトル画面の場合：124クリア後の復帰なので、自動でメインへ移し金の猫位置でイベント開始
    if (startScreen && startScreen.classList.contains('active')) {
        if (typeof stopAllBGM === 'function') stopAllBGM();
        showScreen('main-screen');
        setTimeout(() => {
            if (typeof returnFromOtherWorld === 'function') returnFromOtherWorld();
        }, 1000);
        return;
    }
    
    // メイン画面表示中の場合
    if (mainScreen && mainScreen.classList.contains('active')) {
        setTimeout(() => {
            if (typeof returnFromOtherWorld === 'function') returnFromOtherWorld();
        }, 1000);
    }
}

/**
 * フルスクリーン制御（iOS Safari対応）
 */
function enterFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
            console.log('フルスクリーンエラー:', err);
        });
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

/**
 * フルスクリーン解除
 */
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

// ページ読み込み時の初期化
window.addEventListener('load', function() {
    // 外部ゲームから復帰したかチェック
    checkReturnFromOtherWorld();
    
    // iOS対応: 画像プリロード（バックグラウンドで実行）
    if (typeof preloadAllGameImages === 'function') {
        preloadAllGameImages().catch(error => {
            console.error('画像プリロードエラー:', error);
        });
    }
    
    // iOS Safari対応: ページ読み込み時に音声コンテキストをアンロック試行
    // ユーザー操作がないと実際にはアンロックされないが、準備はしておく
    if (typeof unlockAudioContext === 'function') {
        unlockAudioContext();
    }
    
    // タイトル画面が表示されている場合、game-containerにクラスを追加
    const startScreen = document.getElementById('start-screen');
    const gameContainer = document.getElementById('game-container');
    if (startScreen && startScreen.classList.contains('active')) {
        gameContainer.classList.add('start-screen-active');
        
        // タイトル画面が表示されている場合、タイトルBGMを再生試行
        // ユーザー操作後に確実に再生されるように、少し待機してから試行
        setTimeout(() => {
            if (typeof playBGM === 'function') {
                // ユーザー操作を待つため、ここでは再生しない
                // 最初のユーザー操作（Aボタンなど）で再生される
            }
        }, 500);
    }
    
    // iOS: 初回起動時にフルスクリーン化を試行（ユーザー操作が必要な場合がある）
    // 注意: iOS SafariではフルスクリーンAPIが制限されているため、PWAとしてインストール推奨
    
    console.log('ゲーム初期化完了');
});

/**
 * iOS対応: オリエンテーション変更時の処理
 * 画面回転時にマップを再描画し、画面サイズを再調整
 */
window.addEventListener('orientationchange', function() {
    console.log('画面の向きが変更されました');
    
    // iOSでは orientationchange の後に実際のサイズ変更が反映されるまで少し遅延があるため、
    // 少し待ってから再描画を行う
    setTimeout(() => {
        // メイン画面が表示されている場合はマップを再描画
        const mainScreen = document.getElementById('main-screen');
        if (mainScreen && mainScreen.classList.contains('active')) {
            if (typeof drawMap === 'function') {
                drawMap();
            }
            if (typeof updateStatus === 'function') {
                updateStatus();
            }
        }
        
        // 戦闘画面が表示されている場合はUIを更新
        const battleScreen = document.getElementById('battle-screen');
        if (battleScreen && battleScreen.classList.contains('active')) {
            if (typeof updateBattleStatus === 'function') {
                updateBattleStatus();
            }
        }
    }, 100);
});

/**
 * iOS対応: リサイズ時の処理（URLバー表示/非表示対応）
 * iOS SafariではURLバーの表示/非表示で window.innerHeight が変動する
 */
window.addEventListener('resize', function() {
    // リサイズ時に画面サイズを再調整
    // メイン画面が表示されている場合はマップを再描画
    const mainScreen = document.getElementById('main-screen');
    if (mainScreen && mainScreen.classList.contains('active')) {
        // リサイズは頻繁に発生するため、デバウンス処理
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
            if (typeof drawMap === 'function') {
                drawMap();
            }
        }, 150);
    }
});

/**
 * iOS対応: ページ表示/非表示時の処理
 * バックグラウンドに移行したときにゲームを一時停止し、BGMを停止
 */
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // ページが非表示（バックグラウンド）になったとき
        console.log('ゲームがバックグラウンドに移行しました');
        
        // BGMを停止
        if (typeof stopAllBGM === 'function') {
            stopAllBGM();
        }
        
        // ゲーム状態を一時停止フラグで管理（必要に応じて拡張可能）
        gameState.isPaused = true;
    } else {
        // ページが表示（フォアグラウンド）に戻ったとき
        console.log('ゲームがフォアグラウンドに戻りました');
        
        // 一時停止フラグを解除
        gameState.isPaused = false;
        
        // 現在の画面に応じてBGMを再開
        const startScreen = document.getElementById('start-screen');
        const prologueScreen = document.getElementById('prologue-screen');
        const mainScreen = document.getElementById('main-screen');
        const battleScreen = document.getElementById('battle-screen');
        
        if (startScreen && startScreen.classList.contains('active')) {
            // タイトル画面: タイトルBGMを再生
            if (typeof playBGM === 'function') {
                setTimeout(() => {
                    playBGM('bgm-title');
                }, 300);
            }
        } else if (prologueScreen && prologueScreen.classList.contains('active')) {
            // プロローグ画面: プロローグBGMを再生
            if (typeof playBGM === 'function') {
                setTimeout(() => {
                    playBGM('bgm-prologue');
                }, 300);
            }
        } else if (mainScreen && mainScreen.classList.contains('active')) {
            // メイン画面: エリアBGMを再生
            if (typeof playAreaBGM === 'function') {
                setTimeout(() => {
                    playAreaBGM(hero.currentArea);
                }, 300);
            }
        } else if (battleScreen && battleScreen.classList.contains('active')) {
            // 戦闘画面: 戦闘BGMを再生（敵に応じて）
            if (typeof playBGM === 'function' && gameState.currentEnemy) {
                setTimeout(() => {
                    // ボス戦かどうかでBGMを切り替え
                    const isBoss = gameState.currentEnemy.name === '魔王' || 
                                   gameState.currentEnemy.name === 'オウサマニア' ||
                                   gameState.currentEnemy.isRareCatGod;
                    if (isBoss) {
                        playBGM('bgm-boss');
                    } else {
                        playBGM('bgm-battle');
                    }
                }, 300);
            }
        }
    }
});

document.addEventListener('touchstart', ensureAudioUnlockAndMaybePlayTitleBGM, { once: true });
document.addEventListener('click', function() {
    if (typeof unlockAudioContext === 'function' && typeof audioContextUnlocked !== 'undefined' && !audioContextUnlocked) unlockAudioContext();
}, { once: true });

/* ============================================
   キーボード入力対応（PC用）
   ============================================ */

document.addEventListener('keydown', function(event) {
    ensureAudioUnlockAndMaybePlayTitleBGM();

    // キーコードに応じて移動処理
    let dx = 0;
    let dy = 0;
    
    switch(event.key) {
        // 矢印キー
        case 'ArrowUp':
            dy = -1;
            break;
        case 'ArrowDown':
            dy = 1;
            break;
        case 'ArrowLeft':
            dx = -1;
            break;
        case 'ArrowRight':
            dx = 1;
            break;
        // WASDキー
        case 'w':
        case 'W':
            dy = -1;
            break;
        case 's':
        case 'S':
            dy = 1;
            break;
        case 'a':
        case 'A':
            dx = -1;
            break;
        case 'd':
        case 'D':
            dx = 1;
            break;
        default:
            return; // 対応していないキーは何もしない
    }
    
    // 移動処理を実行
    if (dx !== 0 || dy !== 0) {
        event.preventDefault(); // デフォルトの動作を防ぐ（スクロールなど）
        handleMove(dx, dy);
    }
});
