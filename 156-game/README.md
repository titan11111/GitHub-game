# ゲーム雛形

このフォルダを**複製**して新しいゲームを作成するための雛形です。

## 使い方

```bash
# リポジトリルートで実行
cp -r 101-ゲーム雛形/ 102-新しいゲーム名/
```

その後、`102-新しいゲーム名/` 内の以下を編集してください。

- **index.html** … `<title>`・ゲーム名・説明文
- **style.css** … 色・レイアウト・ボタン見た目
- **script.js** … 定数・プレイヤー挙動・敵・当たり判定・スコアロジック

## フォルダ構成

```
101-ゲーム雛形/
├── index.html
├── style.css
├── script.js
├── README.md
├── images/   ← 画像（スプライト・背景など）
└── audio/    ← BGM・効果音（.mp3 等）
```

## 含まれているもの

- Canvas の初期化・リサイズ（`resize` 時のみ）
- ゲームループ（`requestAnimationFrame` + デルタタイム）
- 状態管理（START / PLAYING / PAUSED / GAMEOVER / CLEAR）
- キーボード＋モバイルボタン入力
- Web Audio API の簡易効果音
- スタート・ゲームオーバー・クリア画面
- モバイル向けタッチ防止（ダブルタップズーム等）
- Safe Area 対応（ノッチ・ホームバー）

## 遊び方（雛形のまま）

- スタート → 左右キーまたは画面ボタンで四角が動きます（デモ用）
- 実際のゲームは `script.js` の `update()` と `draw()` を拡張して作ります

## 技術メモ

- 小規模ゲーム用の 3 ファイル構成（index.html / style.css / script.js）
- 1000 行を超えたらゲームフォルダ直下に `config.js`・`main.js`・`entities.js` などに分割することを推奨（file-split-rule.mdc 参照）

## 状態

- [x] 雛形として完成
- [ ] 複製後にゲーム開発
