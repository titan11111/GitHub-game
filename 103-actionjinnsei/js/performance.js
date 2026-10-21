// パフォーマンス管理モジュール
// フレームレート制御とパフォーマンス最適化設定

// パフォーマンス設定
let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
let targetFPS = isMobile ? CONFIG.PERFORMANCE.mobileFPS : CONFIG.PERFORMANCE.desktopFPS;
let frameInterval = 1000 / targetFPS;
let lastFrameTime = 0;
let frameSkip = 0;
let maxFrameSkip = CONFIG.PERFORMANCE.maxFrameSkip;

// Canvasとコンテキスト（グローバルアクセス用）
// 既存コードとの互換性のため、グローバル変数として設定
let canvas = null;
let ctx = null;

// パフォーマンス初期化
function initPerformance(canvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');
  
  // グローバルスコープに設定（既存コードとの互換性）
  window.canvas = canvas;
  window.ctx = ctx;
  
  // iOS実機でのパフォーマンス調整
  if (isMobile) {
    ctx.imageSmoothingEnabled = true;
    // フレームスキップを許可
    maxFrameSkip = CONFIG.PERFORMANCE.mobileMaxFrameSkip;
  }
  
  lastFrameTime = performance.now();
}

// パフォーマンス設定の取得
function getPerformanceConfig() {
  return {
    isMobile,
    targetFPS,
    frameInterval,
    lastFrameTime,
    maxFrameSkip,
    canvas,
    ctx
  };
}

// フレーム時間の更新
function updateFrameTime(currentTime) {
  lastFrameTime = currentTime;
}

// パフォーマンス変数の取得（他モジュールから使用）
function getLastFrameTime() {
  return lastFrameTime;
}

function getFrameInterval() {
  return frameInterval;
}

function getMaxFrameSkip() {
  return maxFrameSkip;
}

function setLastFrameTime(time) {
  lastFrameTime = time;
}
