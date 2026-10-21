# ステートマシン実装完了報告

## 実装日
2025-01-XX

## 実装概要

ステートマシン（状態機械）を実装し、ゲームの状態管理を明確化しました。

---

## 実装内容

### 1. 新規作成ファイル

#### `js/state-machine.js`
- **GameState**: 6つの状態を定義（BOOT, TITLE, PLAYING, PAUSED, RESULT, GAMEOVER）
- **StateTransitions**: 状態遷移のルールを定義
- **GameStateMachine**: ステートマシンクラス
  - `changeState()`: 状態を変更（遷移ルールをチェック）
  - `isState()`: 現在の状態をチェック
  - `onStateChanged()`: 状態変更時の処理を自動実行
- **stateMachine**: グローバルなステートマシンインスタンス

### 2. 修正したファイル

#### `js/game-state.js`
- `syncGameStateWithStateMachine()`: 後方互換性のための同期関数を追加
- `gameState.started` と `gameState.paused` は後方互換性のために残置

#### `js/main.js`
- `startGame()`: ステートマシンを使用して `GameState.PLAYING` に遷移
- `gameOver()`: ステートマシンを使用して `GameState.GAMEOVER` に遷移
- `gameClear()`: ステートマシンを使用して `GameState.RESULT` に遷移
- `update()`: ステートマシンを使用して状態をチェック
- `gameLoop()`: ステートマシンを使用して状態をチェック
- `setupEventListeners()`: タイトル画面への戻りをステートマシンで処理

#### `js/init.js`
- `initializeGame()`: 初期化時にステートマシンを使用して `GameState.TITLE` に遷移

#### `index.html`
- `js/state-machine.js` の読み込みを追加（`game-state.js` の後、`main.js` の前）

---

## 状態遷移図

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

### 遷移ルール

| 現在の状態 | 遷移可能な状態 |
|-----------|--------------|
| BOOT | TITLE |
| TITLE | PLAYING |
| PLAYING | PAUSED, RESULT, GAMEOVER |
| PAUSED | PLAYING, TITLE |
| RESULT | TITLE |
| GAMEOVER | TITLE |

---

## 使用方法

### 状態を変更する

```javascript
// ゲーム開始
stateMachine.changeState(GameState.PLAYING);

// ゲームオーバー
stateMachine.changeState(GameState.GAMEOVER);

// エンディング
stateMachine.changeState(GameState.RESULT);

// タイトルに戻る
stateMachine.changeState(GameState.TITLE);
```

### 状態をチェックする

```javascript
// 現在の状態をチェック
if (stateMachine.isState(GameState.PLAYING)) {
  // ゲーム本編の処理
}

// 現在の状態を取得
const currentState = stateMachine.getState();

// 前の状態を取得
const previousState = stateMachine.getPreviousState();
```

### 状態変更時のコールバックを登録

```javascript
stateMachine.onStateChange((newState, previousState) => {
  console.log(`State changed: ${previousState} → ${newState}`);
});
```

---

## 後方互換性

既存のコードとの互換性を保つため、以下の対応を行いました：

1. **`gameState.started` と `gameState.paused` を残置**
   - 既存のコードが動作し続けるように、これらのプロパティを維持
   - `syncGameStateWithStateMachine()` でステートマシンと同期

2. **フォールバック処理**
   - ステートマシンが読み込まれていない場合のフォールバック処理を追加
   - 既存の動作を維持

3. **段階的移行**
   - 既存のコードは動作し続ける
   - 新しいコードはステートマシンを使用することを推奨

---

## 自動処理される内容

ステートマシンが状態を変更すると、以下の処理が自動で実行されます：

### TITLE状態
- すべての画面を非表示
- タイトル画面を表示
- BGMを停止

### PLAYING状態
- すべての画面を非表示
- ゲーム画面を表示

### PAUSED状態
- 一時停止処理（将来の拡張用）

### RESULT状態
- すべての画面を非表示
- エンディング画面を表示
- BGMを停止
- エンディングスコアを設定
- パーティクルアニメーションを開始

### GAMEOVER状態
- すべての画面を非表示
- ゲームオーバー画面を表示
- BGMを停止
- ゲームオーバースコアを設定

---

## メリット

### 1. 状態が明確
- 6つの状態を明確に定義
- 状態の遷移ルールを定義

### 2. 予期しない遷移を防ぐ
- 遷移ルールでチェック
- 無効な遷移はエラーを出力

### 3. デバッグが容易
- 現在の状態を常に把握可能
- 状態変更のログを出力

### 4. コードの可読性向上
- 条件分岐がシンプルに
- 状態に応じた処理が明確

### 5. 保守性の向上
- 状態管理が一元化
- 画面表示ロジックが自動化

---

## 今後の拡張

### 1. 一時停止機能の実装
現在、`PAUSED` 状態は定義されていますが、実装は未完了です。
- 一時停止ボタンの追加
- 一時停止中の処理

### 2. 資産読み込み（BOOT状態）
現在、`BOOT` 状態は定義されていますが、実装は未完了です。
- 画像・音声ファイルの読み込み
- 読み込み進捗の表示

### 3. 状態変更のアニメーション
- 画面遷移のアニメーション
- フェードイン・フェードアウト

---

## テスト項目

以下の項目をテストしてください：

- [ ] タイトル画面が正しく表示される
- [ ] 「スタート」ボタンでゲームが開始される
- [ ] ゲームオーバー時にゲームオーバー画面が表示される
- [ ] エンディング時にエンディング画面が表示される
- [ ] 「もう一度」ボタンでタイトルに戻れる
- [ ] エンディングからタイトルに戻れる
- [ ] ゲームループが正しく動作する（PLAYING状態のみ）
- [ ] 無効な状態遷移がエラーになる

---

## 注意事項

1. **状態遷移の順序**
   - 必ず遷移ルールに従って状態を変更してください
   - 無効な遷移はエラーになります

2. **後方互換性**
   - 既存の `gameState.started` と `gameState.paused` は動作しますが、
   - 今後は `stateMachine.isState()` を使用することを推奨します

3. **デバッグログ**
   - 本番環境では、コンソールログを削除することを推奨します

---

## まとめ

ステートマシンの実装により、ゲームの状態管理が明確化され、予期しない挙動を防ぐことができました。既存のコードとの互換性を保ちながら、段階的に移行できる設計になっています。
