# 231-day055 ｜ SKY REIGN 学び

## 2026-09-11 出荷整備

### 1. `window.storage` はブラウザに存在しない

最高記録の保存が `window.storage.get/set` で書かれており、`try{}catch(e){}` に包まれていたため
**エラーも出ないまま毎回ベスト0にリセットされていた**。GitHub Pages 上では `window.storage` は undefined。

- 修正: `localStorage.getItem/setItem('soten-dive-best')` へ置換（async も不要になったので同期関数化）
- 教訓: **try/catch で握り潰した永続化は「動いているように見えて動いていない」の温床**。
  保存系は catch を置く前に、まず対象APIが実在するかを確認する。
  harness はコンソールエラー0件で PASS するので、この種の欠陥は機械チェックをすり抜ける。

### 2. 全画面オーバーレイが harness のタップ判定を落とす

`_tools/game-harness.mjs` は `button, [role="button"], canvas` の **DOM順で最初の1件** をタップする。
`<canvas>` が body 先頭にあり、その上にタイトル幕 `.veil{position:absolute;inset:0}` が乗っていたため、
canvas がポインタイベントを受け取れず `locator.tap: Timeout 3000ms exceeded` で FAIL。

- 修正: `#c` に `z-index:0`、`.veil` に `z-index:2` を明示したうえで `<canvas>` を body 末尾へ移動。
  重なりは z-index が保証するので見た目は不変（タイトル・プレイ画面をスクショで確認済み）
- 教訓: **タイトル幕で canvas を覆う構成では、最初のタップ対象が実際の開始ボタンになる並びにする**。
  DOM順への暗黙依存をやめ、重なりは z-index で明示する。

### 3. 証跡

- harness: `docs/harness-reports/231-day055-2026-09-11T12-56-13-586Z.md` → **PASS（8項目全通過）**
  （修正前は同日 T12-55-26 のレポートでタップ FAIL）
- 目視: タイトル／プレイ中の2画面を Chromium 390×844 DPR2 で撮影、pageerror 0件
- サイズ: 0.03MB（20MB鉄則の0.15%）
