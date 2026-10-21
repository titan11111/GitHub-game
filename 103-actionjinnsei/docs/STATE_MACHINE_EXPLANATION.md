# ステートマシン（状態機械）とは？

## 📖 基本概念

**ステートマシン**は、システムが「どの状態にあるか」を明確に管理する設計パターンです。

### 身近な例：エレベーター

エレベーターは以下の状態を持ちます：
- **停止中**（ドアが閉まっている）
- **上昇中**
- **下降中**
- **ドア開閉中**

各状態では、できることが決まっています：
- **停止中** → 「上昇」または「下降」に遷移可能
- **上昇中** → 「停止」にしか遷移できない（急に下降にはならない）

---

## 🎮 ゲーム開発での例

### 現在のコード（改善前）

```javascript
// game-state.js
let gameState = {
  stage: 1,
  score: 0,
  started: false,  // ← これだけでは状態が不明確
  paused: false    // ← 複数の状態が混在
};

// main.js
function startGame() {
  gameState.started = true;  // ゲーム開始
  gameState.paused = false;
  // ...
}

function gameOver() {
  gameState.started = false;  // ゲーム終了
  // ...
}

function gameClear() {
  gameState.started = false;  // ゲーム終了（クリア）
  // ...
}
```

**問題点**:
- `started = false` だけでは「ゲームオーバー」なのか「エンディング」なのか分からない
- 状態の遷移ルールが不明確（例：`paused = true` のまま `started = false` にできる？）
- 予期しない状態の組み合わせが発生する可能性

---

### ステートマシンを使った改善後

```javascript
// ゲームの状態を明確に定義
const GameState = {
  BOOT: 'BOOT',           // 資産読み込み中
  TITLE: 'TITLE',         // タイトル画面
  PLAYING: 'PLAYING',     // ゲーム本編
  PAUSED: 'PAUSED',       // 一時停止
  RESULT: 'RESULT',       // スコア集計（エンディング）
  GAMEOVER: 'GAMEOVER'    // ゲームオーバー
};

// 状態遷移のルールを定義
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
    this.currentState = GameState.BOOT;
    this.previousState = null;
  }
  
  // 状態を変更（遷移ルールをチェック）
  changeState(newState) {
    // 遷移が可能かチェック
    if (!StateTransitions[this.currentState].includes(newState)) {
      console.error(`Invalid state transition: ${this.currentState} → ${newState}`);
      return false;
    }
    
    // 状態を変更
    this.previousState = this.currentState;
    this.currentState = newState;
    
    // 状態変更時の処理を実行
    this.onStateChanged(newState);
    return true;
  }
  
  // 状態変更時の処理
  onStateChanged(newState) {
    switch(newState) {
      case GameState.TITLE:
        showScreen('startScreen');
        break;
      case GameState.PLAYING:
        hideAllScreens();
        playStageBGM(gameState.stage);
        break;
      case GameState.PAUSED:
        // 一時停止処理
        break;
      case GameState.RESULT:
        showScreen('endingScreen');
        stopAllBGM();
        break;
      case GameState.GAMEOVER:
        showScreen('gameOverScreen');
        stopAllBGM();
        break;
    }
  }
  
  // 現在の状態を取得
  getState() {
    return this.currentState;
  }
  
  // 状態チェック
  isState(state) {
    return this.currentState === state;
  }
}
```

---

## 🔄 状態遷移図

```
    [BOOT]
      ↓
   [TITLE] ←──────────┐
      ↓               │
  [PLAYING] ←─────────┤
      ↓               │
   [PAUSED]           │
      ↓               │
  [RESULT] ───────────┘
      ↓
  [GAMEOVER] ─────────┘
```

**遷移ルール**:
- `TITLE` → `PLAYING` のみ可能
- `PLAYING` → `PAUSED`, `RESULT`, `GAMEOVER` に遷移可能
- `PAUSED` → `PLAYING` または `TITLE` に戻れる
- `RESULT` と `GAMEOVER` → `TITLE` に戻る

---

## ✅ ステートマシンのメリット

### 1. **状態が明確**
```javascript
// Before: 状態が不明確
if (!gameState.started) {
  // ゲームオーバー？エンディング？タイトル？
}

// After: 状態が明確
if (stateMachine.isState(GameState.GAMEOVER)) {
  // ゲームオーバー画面の処理
}
```

### 2. **予期しない遷移を防ぐ**
```javascript
// Before: 予期しない状態の組み合わせが可能
gameState.started = false;
gameState.paused = true;  // ← これは意味がない！

// After: 遷移ルールでチェック
stateMachine.changeState(GameState.PAUSED);  // ← エラー！PLAYINGからしか遷移できない
```

### 3. **デバッグが容易**
```javascript
// 現在の状態を常に把握できる
console.log('Current state:', stateMachine.getState());
console.log('Previous state:', stateMachine.previousState);
```

### 4. **コードの可読性向上**
```javascript
// Before: 複数の条件をチェック
if (gameState.started && !gameState.paused) {
  update();
}

// After: 状態だけで判断
if (stateMachine.isState(GameState.PLAYING)) {
  update();
}
```

---

## 🎯 実装例：現在のコードへの適用

### 現在のコード
```javascript
// main.js
function startGame() {
  hideAllScreens();
  gameState.stage = 1;
  gameState.score = 0;
  gameState.started = true;  // ← 状態管理
  gameState.paused = false;
  // ...
}

function gameOver() {
  gameState.started = false;  // ← 状態管理
  hideScreen('startScreen');
  hideScreen('endingScreen');
  showScreen('gameOverScreen');
  stopAllBGM();
}

function gameClear() {
  gameState.started = false;  // ← 状態管理
  hideScreen('startScreen');
  hideScreen('gameOverScreen');
  showScreen('endingScreen');
  stopAllBGM();
}
```

### ステートマシン適用後
```javascript
// main.js
function startGame() {
  stateMachine.changeState(GameState.PLAYING);  // ← 状態遷移
  gameState.stage = 1;
  gameState.score = 0;
  // 画面表示は stateMachine が自動で処理
}

function gameOver() {
  stateMachine.changeState(GameState.GAMEOVER);  // ← 状態遷移
  // 画面表示は stateMachine が自動で処理
}

function gameClear() {
  stateMachine.changeState(GameState.RESULT);  // ← 状態遷移
  // 画面表示は stateMachine が自動で処理
}

// ゲームループ
function gameLoop(currentTime) {
  // 状態に応じた処理
  if (stateMachine.isState(GameState.PLAYING)) {
    update();
    draw();
  } else if (stateMachine.isState(GameState.PAUSED)) {
    // 一時停止中の処理
  }
  
  requestAnimationFrame(gameLoop);
}
```

---

## 📊 比較表

| 項目 | 現在のコード | ステートマシン |
|------|------------|--------------|
| **状態の明確性** | ❌ 不明確（started/pausedの組み合わせ） | ✅ 明確（6つの状態） |
| **遷移ルール** | ❌ なし（自由に変更可能） | ✅ 定義済み（安全） |
| **デバッグ** | ❌ 困難（状態が分散） | ✅ 容易（状態を追跡可能） |
| **バグの発生** | ⚠️ 予期しない状態の組み合わせ | ✅ 遷移ルールで防止 |
| **コードの可読性** | ⚠️ 条件分岐が複雑 | ✅ 状態で判断（シンプル） |

---

## 🚀 まとめ

**ステートマシン**は、ゲームの「状態」を明確に管理し、予期しない挙動を防ぐ設計パターンです。

### 現在の問題
- `started = false` だけでは状態が不明確
- 状態の遷移ルールがない
- 予期しない状態の組み合わせが発生する可能性

### ステートマシンの解決
- 6つの状態を明確に定義（BOOT, TITLE, PLAYING, PAUSED, RESULT, GAMEOVER）
- 遷移ルールを定義（安全な状態遷移のみ許可）
- 状態に応じた処理を自動化

**次のステップ**: `js/state-machine.js` を実装して、現在のコードに適用します。
