// ゲーム初期化モジュール
// ゲーム全体の初期化処理を集約

// 初期化実行（DOM読み込み後に実行）
function initializeGame() {
  // 1. Canvas要素の取得とパフォーマンス初期化
  const canvasElement = document.getElementById('gameCanvas');
  if (!canvasElement) {
    console.error('Canvas element not found');
    return;
  }
  initPerformance(canvasElement);
  
  // 2. プレイヤーの初期化（game-state.js）
  if (typeof initPlayer === 'function') {
    initPlayer();
  }
  
  // 3. コントロール設定（input.js）
  setupControls();
  
  // 4. イベントリスナー設定（main.js）
  setupEventListeners();
  
  // 5. ゲーム初期化（main.js）
  init();
  
  // 5. スタート画面を表示（ステートマシンを使用）
  if (typeof stateMachine !== 'undefined') {
    stateMachine.changeState(GameState.TITLE);
  } else {
    // フォールバック（ステートマシンが読み込まれていない場合）
    showScreen('startScreen');
  }
}

// DOM読み込み完了後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  // 既に読み込み済みの場合は即座に実行
  initializeGame();
}
