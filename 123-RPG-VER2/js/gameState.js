/* ============================================
   ゲーム状態管理
   ============================================
   
   役割: ゲームの状態を一元管理する
   
   含まれる内容:
   - gameStateオブジェクト（戦闘、シナリオ、エリア管理など）
   - heroオブジェクト（主人公のステータス）
   - party配列（パーティメンバー）
   
   依存関係:
   - gameData.js で定義されたデータ（worldMaps, monsterTable など）を参照
   ============================================ */

// ゲーム状態を一元管理するオブジェクト
const gameState = {
    // 戦闘関連
    currentEnemy: null,
    canAttack: true,
    isBattle: false,
    isBattleEnding: false,
    battleCommandIndex: 0, // 戦闘コマンド選択のインデックス
    battleMagicIndex: 0, // 魔法選択のインデックス
    isSelectingMagic: false, // 魔法選択中かどうか
    
    // 状態異常・バフ関連
    enemyStatus: {}, // 敵の状態異常 {burn: true, stun: 1}
    heroBuffs: {
        ironGuard: false, // アイアンガードの効果
        diamondSkin: false, // ダイヤモンドスキンの効果
        diamondSkinTurns: 0 // ダイヤモンドスキンの残りターン
    },
    
    // シナリオ関連
    trueKingMet: false,
    prologueStep: 0,
    /** タイトル画面: 0=1回目AでオープニングBGM再生, 1=2回目Aでプロローグへ */
    titleScreenStep: 0,
    
    // 主人公の移動方向（'up', 'down', 'left', 'right'）
    heroDirection: 'down',
    
    // エリア管理（BGM再生制御用）
    previousArea: null, // 前のエリア（エリア変更検出用）
    
    // 仲間の位置を配列で管理（party配列のインデックスに対応）
    // allyPositions[0] = party[1]（最初の仲間）の位置
    // allyPositions[1] = party[2]（2番目の仲間）の位置
    // 各要素は {x, y, area, direction} の形式
    allyPositions: [],
    heroPositionHistory: [], // 主人公の移動履歴（最大1つ保持）
    goldenCatProcessed: false, // 金色の🐈イベントを処理済みかどうか
    heroMovementDisabled: false, // 主人公の移動が無効化されているかどうか
    /** 仲間の「話す」後に試練戦闘を開始する用（TILE.ALLY_DOG等 or null） */
    pendingAllyTrial: null,
    /** 仲間との試練戦闘中か（負けてもゲームオーバーにしない） */
    isAllyTrialBattle: false,
    /** 試練戦闘の相手タイル（勝ったら addAlly に渡す） */
    allyTrialTile: null,
    /** 試練戦闘の相手タイルの位置（勝ったらタイルを削除するため） */
    allyTrialTilePosition: null,
    /** 水の精霊を倒した回数（再戦のたびに精霊が強くなる） */
    waterSpiritDefeatCount: 0
};

// ヒーローのステータス
const hero = { 
    name: "勇者", 
    x: 4, 
    y: 7, 
    hp: 100, 
    maxHp: 100, 
    mp: 30,  // 初期MPを増加（魔法を使いやすく）
    maxMp: 30, 
    atk: 15, 
    mgc: 20,  // 初期魔法力を調整 
    lv: 1, 
    exp: 0, 
    gold: 0, 
    currentArea: "town_inside",
    hasKey: false 
};

// パーティメンバー
let party = [hero];

/* ============================================
   LocalStorage ヘルパー関数（iOS対応）
   ============================================
   iOSのプライベートブラウジングモードなどで
   LocalStorageが使えない場合のエラーハンドリング
   ============================================ */

/**
 * LocalStorageに安全に値を保存
 * @param {string} key - キー
 * @param {string} value - 値
 * @returns {boolean} 成功したかどうか
 */
function safeLocalStorageSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.warn(`LocalStorage保存エラー (${key}):`, e);
        // プライベートブラウジングモードなどで使用不可
        return false;
    }
}

/**
 * LocalStorageから安全に値を取得
 * @param {string} key - キー
 * @returns {string|null} 値、またはnull（エラー時もnull）
 */
function safeLocalStorageGetItem(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn(`LocalStorage取得エラー (${key}):`, e);
        return null;
    }
}

/**
 * LocalStorageから安全に値を削除
 * @param {string} key - キー
 * @returns {boolean} 成功したかどうか
 */
function safeLocalStorageRemoveItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.warn(`LocalStorage削除エラー (${key}):`, e);
        return false;
    }
}

/* ============================================
   タッチ/マウスイベント統一処理（iOS対応）
   ============================================
   iOSではタッチイベントとマウスイベントを
   統一して処理する必要がある
   ============================================ */

/**
 * イベントから座標を取得（タッチ/マウス対応）
 * @param {Event} e - イベントオブジェクト（MouseEvent, TouchEvent, PointerEvent）
 * @returns {{x: number, y: number}|null} 座標、またはnull
 */
function getEventCoordinates(e) {
    // PointerEvent（onpointerdownなど）
    if (e.clientX !== undefined && e.clientY !== undefined) {
        return { x: e.clientX, y: e.clientY };
    }
    
    // TouchEvent
    if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        return { x: touch.clientX, y: touch.clientY };
    }
    
    // changedTouches（touchendなど）
    if (e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        return { x: touch.clientX, y: touch.clientY };
    }
    
    // MouseEvent
    if (e.pageX !== undefined && e.pageY !== undefined) {
        return { x: e.pageX, y: e.pageY };
    }
    
    return null;
}

/**
 * タッチイベントかどうかを判定
 * @param {Event} e - イベントオブジェクト
 * @returns {boolean} タッチイベントの場合true
 */
function isTouchEvent(e) {
    return e.type.startsWith('touch') || 
           (e.touches && e.touches.length > 0) ||
           (e.changedTouches && e.changedTouches.length > 0);
}

/* ============================================
   画像プリロード機能（iOS対応）
   ============================================
   iOSでは画像読み込みが遅い場合があるため、
   ゲーム開始前にすべてのリソースをプリロードする
   ============================================ */

/**
 * 単一の画像をプリロード
 * @param {string} src - 画像のパス
 * @returns {Promise<HTMLImageElement>} 読み込み完了した画像要素
 */
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            console.log(`[画像プリロード] 成功: ${src}`);
            resolve(img);
        };
        img.onerror = (error) => {
            console.warn(`[画像プリロード] 失敗: ${src}`, error);
            // エラーでもrejectせず、警告のみ（ゲームは続行可能）
            resolve(null);
        };
        // iOS対応: 日本語ファイル名をURLエンコード
        const pathParts = src.split('/');
        const fileName = pathParts.pop();
        const encodedFileName = encodeURIComponent(fileName);
        const encodedPath = pathParts.join('/') + '/' + encodedFileName;
        img.src = encodedPath;
    });
}

/**
 * すべてのゲーム画像をプリロード
 * @returns {Promise<void>} すべての画像の読み込みが完了したら解決
 */
async function preloadAllGameImages() {
    console.log('[画像プリロード] 開始');
    const imagePaths = new Set(); // 重複を避けるためSetを使用
    
    // 1. オープニング画像
    imagePaths.add('images/openingmokup.png');
    
    // 2. 仲間のバトル画像
    if (typeof allyData !== 'undefined') {
        Object.values(allyData).forEach(ally => {
            if (ally.battleImg) {
                imagePaths.add(ally.battleImg);
            }
        });
    }
    
    // 3. モンスター画像（monsterTableから）
    if (typeof monsterTable !== 'undefined') {
        Object.values(monsterTable).forEach(monsters => {
            monsters.forEach(monster => {
                if (monster.img) {
                    imagePaths.add(monster.img);
                }
            });
        });
    }
    
    // 4. 特殊敵の画像
    imagePaths.add('images/catgod.png');
    imagePaths.add('images/niseousama.png');
    imagePaths.add('images/momosennin.png');
    imagePaths.add('images/水龍.png');
    imagePaths.add('images/うらみ.png');
    imagePaths.add('images/魔王.png');
    
    // 5. 猫NPC画像（special.jsで使用）
    imagePaths.add('images/neko1.png');
    imagePaths.add('images/neko2.png');
    imagePaths.add('images/neko3.png');
    imagePaths.add('images/neko4.png');
    
    // すべての画像を並列でプリロード
    const preloadPromises = Array.from(imagePaths).map(path => preloadImage(path));
    
    try {
        await Promise.all(preloadPromises);
        console.log(`[画像プリロード] 完了: ${imagePaths.size}枚の画像を読み込みました`);
    } catch (error) {
        console.error('[画像プリロード] エラー:', error);
        // エラーが発生してもゲームは続行可能
    }
}
