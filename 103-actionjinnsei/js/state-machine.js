// ステートマシン（状態機械）モジュール
// ゲームの状態を明確に管理し、予期しない挙動を防ぐ

// ゲーム状態の定義
const GameState = {
  BOOT: 'BOOT',           // 資産読み込み中（将来の拡張用）
  TITLE: 'TITLE',         // タイトル画面
  PLAYING: 'PLAYING',     // ゲーム本編
  PAUSED: 'PAUSED',       // 一時停止
  RESULT: 'RESULT',       // スコア集計（エンディング）
  GAMEOVER: 'GAMEOVER'    // ゲームオーバー
};

// 状態遷移のルールを定義
// 各状態から遷移可能な状態のリスト
const StateTransitions = {
  [GameState.BOOT]: [GameState.TITLE],
  [GameState.TITLE]: [GameState.PLAYING],
  [GameState.PLAYING]: [GameState.PAUSED, GameState.RESULT, GameState.GAMEOVER],
  [GameState.PAUSED]: [GameState.PLAYING, GameState.TITLE],
  [GameState.RESULT]: [GameState.TITLE],
  [GameState.GAMEOVER]: [GameState.TITLE]
};

// ステートマシンクラス
class GameStateMachine {
  constructor() {
    this.currentState = GameState.TITLE; // 初期状態はタイトル画面
    this.previousState = null;
    this.stateChangeCallbacks = []; // 状態変更時のコールバック
  }
  
  // 状態を変更（遷移ルールをチェック）
  changeState(newState) {
    // 遷移が可能かチェック
    if (!this.canTransitionTo(newState)) {
      console.error(
        `Invalid state transition: ${this.currentState} → ${newState}\n` +
        `Allowed transitions from ${this.currentState}: ${StateTransitions[this.currentState].join(', ')}`
      );
      return false;
    }
    
    // 状態を変更
    this.previousState = this.currentState;
    this.currentState = newState;
    
    // 状態変更時の処理を実行
    this.onStateChanged(newState, this.previousState);
    
    // コールバックを実行
    this.stateChangeCallbacks.forEach(callback => {
      callback(newState, this.previousState);
    });
    
    return true;
  }
  
  // 遷移が可能かチェック
  canTransitionTo(newState) {
    if (!StateTransitions[this.currentState]) {
      return false;
    }
    return StateTransitions[this.currentState].includes(newState);
  }
  
  // 状態変更時の処理
  onStateChanged(newState, previousState) {
    // 状態に応じた処理を実行
    switch(newState) {
      case GameState.TITLE:
        if (typeof hideAllScreens === 'function') hideAllScreens();
        if (typeof showScreen === 'function') showScreen('startScreen');
        if (typeof setGameplayUIVisible === 'function') setGameplayUIVisible(false);
        if (typeof stopAllBGM === 'function') stopAllBGM();
        break;
        
      case GameState.PLAYING:
        if (typeof hideAllScreens === 'function') hideAllScreens();
        if (typeof setGameplayUIVisible === 'function') setGameplayUIVisible(true);
        gameState.paused = false;
        gameState.started = true;
        break;
        
      case GameState.PAUSED:
        gameState.paused = true;
        gameState.started = false;
        break;
        
      case GameState.RESULT:
        if (typeof setGameplayUIVisible === 'function') setGameplayUIVisible(false);
        if (typeof hideAllScreens === 'function') {
          hideAllScreens();
        }
        if (typeof showScreen === 'function') {
          showScreen('endingScreen');
        }
        // BGMを停止
        if (typeof stopAllBGM === 'function') {
          stopAllBGM();
        }
        // エンディングスコアを設定
        if (typeof gameState !== 'undefined' && gameState.score !== undefined) {
          const endingScoreElement = document.getElementById('endingScore');
          if (endingScoreElement) {
            endingScoreElement.textContent = gameState.score;
          }
        }
        // パーティクルアニメーションを開始
        if (typeof startEndingParticles === 'function') {
          setTimeout(() => {
            startEndingParticles();
          }, 100);
        }
        break;
        
      case GameState.GAMEOVER:
        if (typeof setGameplayUIVisible === 'function') setGameplayUIVisible(false);
        if (typeof hideAllScreens === 'function') {
          hideAllScreens();
        }
        if (typeof showScreen === 'function') {
          showScreen('gameOverScreen');
        }
        // BGMを停止
        if (typeof stopAllBGM === 'function') {
          stopAllBGM();
        }
        // ゲームオーバースコアを設定
        if (typeof gameState !== 'undefined' && gameState.score !== undefined) {
          const finalScoreElement = document.getElementById('finalScore');
          if (finalScoreElement) {
            finalScoreElement.textContent = gameState.score;
          }
        }
        break;
    }
  }
  
  // 現在の状態を取得
  getState() {
    return this.currentState;
  }
  
  // 前の状態を取得
  getPreviousState() {
    return this.previousState;
  }
  
  // 状態チェック
  isState(state) {
    return this.currentState === state;
  }
  
  // 状態変更時のコールバックを登録
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.stateChangeCallbacks.push(callback);
    }
  }
  
  // コールバックを削除
  removeStateChangeCallback(callback) {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }
  
  // 状態をリセット（タイトル画面に戻す）
  reset() {
    this.previousState = this.currentState;
    this.currentState = GameState.TITLE;
    this.onStateChanged(GameState.TITLE, this.previousState);
  }
}

// グローバルなステートマシンインスタンスを作成
let stateMachine = new GameStateMachine();
