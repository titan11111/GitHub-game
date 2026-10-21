// ゲーム状態管理モジュール
// グローバルなゲーム状態を一元管理

// ゲーム状態
// 注意: started と paused は後方互換性のために残していますが、
// 今後は stateMachine を使用することを推奨します
let gameState = {
  stage: 1,
  score: 0,
  started: false,  // 後方互換性のため（stateMachine.isState(GameState.PLAYING) を使用推奨）
  paused: false    // 後方互換性のため（stateMachine.isState(GameState.PAUSED) を使用推奨）
};

// ステートマシンとの同期用ヘルパー関数
// gameState.started と gameState.paused をステートマシンの状態と同期
function syncGameStateWithStateMachine() {
  if (typeof stateMachine !== 'undefined' && typeof GameState !== 'undefined') {
    gameState.started = stateMachine.isState(GameState.PLAYING);
    gameState.paused = stateMachine.isState(GameState.PAUSED);
  }
}

// ステージ定義（config.jsから取得）
const stages = STAGES;

// プレイヤー（Playerクラスのインスタンス）
// 注意: Playerクラスが読み込まれる前にアクセスするとエラーになるため、
// 初期化は init.js で行う
let player = null;

// プレイヤーを初期化する関数
function initPlayer() {
  if (typeof Player !== 'undefined') {
    player = new Player(CONFIG.PLAYER.initialX, CONFIG.PLAYER.initialY);
  } else {
    // フォールバック（Playerクラスが読み込まれていない場合）
    // 後方互換性のため、オブジェクトリテラルとして作成
    player = {
      x: CONFIG.PLAYER.initialX,
      y: CONFIG.PLAYER.initialY,
      w: CONFIG.PLAYER.width,
      h: CONFIG.PLAYER.height,
      vx: 0,
      vy: 0,
      hp: CONFIG.PLAYER.initialHp,
      maxHp: CONFIG.PLAYER.maxHp,
      speed: CONFIG.PLAYER.speed,
      jumpPower: CONFIG.PLAYER.jumpPower,
      onGround: false,
      attacking: false,
      attackCooldown: 0,
      invincible: 0,
      coyoteTimer: 0,
      jumpBuffer: 0,
      wasJumpHeld: false,
      recoilX: 0,
      aBtnWasPressed: false,
      prevX: CONFIG.PLAYER.initialX,
      prevY: CONFIG.PLAYER.initialY,
      facing: 1
    };
  }
}

// オメガビーム管理
let omegaBeam = {
  charges: CONFIG.OMEGA_BEAM.initialCharges,
  isCharging: false,
  chargeStartTime: 0,
  chargeDuration: CONFIG.OMEGA_BEAM.chargeDuration,
  isActive: false,
  activeTimer: 0,
  bBtnPressed: false // Bボタンの押しっぱなし防止フラグ
};

// 敵配列
let enemies = [];
let boss = null;
let bossActive = false;

// 弾配列
let projectiles = [];

// アイテム配列（救急箱など）
let items = [];

// 障害物配列
let obstacles = [];

// カメラ
let camera = { x: 0 };

// ステージ進行
let stageProgress = 0;
// ステージごとの長さ（config.jsの関数を使用）
const stageLength = CONFIG.STAGE.defaultLength; // デフォルト（後方互換性のため）

// 敵生成タイマー
let enemySpawnTimer = 0;
let enemySpawnCounter = 0; // 出現順序のカウンター
