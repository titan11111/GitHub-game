# 182-eirianshooting — SPEC

> 更新: 2026-07-09  
> 完了スコープ: **B（ゲーム感）+ A（音・iOS土台）**  
> 次フェーズ: C（惑星個性）/ D（仕上げ・スモーク証跡）

## ゲーム概要
太陽系を巡る縦スクロールSTG。惑星ごとにウェーブ→ボス撃破で次惑星へ。

## 対象端末
- 必須: iPhone Safari（縦持ち）
- 対応: デスクトップ（←→ / A D、Mでミュート）
- 配信: GitHub Pages（相対パス・ビルド不要）

## 画面 / 状態遷移
`start` → `playing`（wave → boss → clear）→ `gameover` → リトライで `playing`

## 操作
- 左右移動（仮想ボタン / ←→ / A D）
- オート連射（プレイ中常時）
- ミュート: 右上ボタン / Mキー（localStorage保存）

## コアループ
1. ウェーブ敵を規定数撃破（`5 + stage`）
2. ボス出現（straight / aimed / spread）
3. ボス撃破 → 次惑星
4. 撃破時に約28%でPドロップ → 武器Lv+1（最大10）

## 勝敗条件
- 勝ち進行: ボス撃破で次ステージ（スコア閾値クリアなし）
- 負け: HP 0

## UI
- HUD: ステージ/惑星名/スコア/HP/武器Lv/ウェーブ進捗
- ボスHPバー（ボス戦のみ）
- ミュートボタン（常時）

## 音声（必須・ファイル無し）
- TAP TO START で WebAudio unlock
- BGM: 3声簡易ループ（メロ+ベース+キック）
- SE: 発射/撃破/被弾/PU/ボス出現/クリア
- タブ非表示でBGM停止、復帰で再開試行

## 保存
- `eirian-mute`（ミュート状態のみ）

## ファイル構成
- `index.html` / `style.css` / `script.js` / `SPEC.md`
- アセットフォルダなし（WebAudio合成）

## 実装制約
- モバイル3MB鉄則（現状コードのみで余裕）
- iOS: viewport-fit=cover / ダブルタップ防止 / safe-area / pointer capture

## テスト項目
- [ ] TAP TO START 後にBGM/SEが鳴る
- [ ] ミュートが再訪後も維持
- [ ] ダブルタップでズームしない
- [ ] ウェーブ→ボス→クリア遷移
- [ ] P取得で武器Lv上昇、被弾では上がらない

## 未確定事項
- 8惑星ごとの固有ボス絵・背景差（C）
- /game-play-tester 証跡（D）
