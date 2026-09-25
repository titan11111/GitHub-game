# 260-kanjima-shokanroku 学び

## 2026-09-25 ｜ `260-day084` を起動可能な形にする改修

作業前の状態：フォルダ名が仮（`260-day084`）、中身は `kanjima.html` と `.gitkeep` のみ。
git管理外・index.html 無し＝**GitHub Pagesで開けない**。harness は FAIL（描画21 RAF/秒・タップ失敗）。

### 1. `hidden` 属性は `display` を持つクラスに負ける（今回の最大のバグ）

`.sheet{position:fixed;inset:0;display:flex}` を当てた `<section hidden>` が **全部表示されていた**。
UA標準の `[hidden]{display:none}` は作者スタイルの `.sheet{display:flex}` に敗ける。
結果、序章・祭壇・手持ち・リザルトの4パネルが起動直後から重なっていた＝実質プレイ不能。

```css
[hidden]{display:none!important}   /* ← これ1行で解決 */
```

**教訓**: `hidden` 属性で出し入れする要素に `display` を含むクラスを当てるときは、
`[hidden]{display:none!important}` をリセットに必ず入れる。`hidden` が効いているかは
`elementFromPoint()` で「一番上に何があるか」を見ると一発で分かる（`isVisible()` は見落とす）。

### 2. harness の「タップ」は DOM順で最初の `button/[role=button]/canvas` を叩く

起動直後にモーダル（序章）が出る設計だと、DOM先頭の canvas がモーダルに覆われて必ず FAIL。
**起動時に出すモーダルを `<body>` の先頭に置く**と、そのOKボタンが最初の対象になり PASS する。
`.sheet` は `z-index:20` なので DOM順を変えても重なり順は変わらない。

### 3. 描画コストは 258 と同じ「見えていないのに描いている」だった

- 全画面シート表示中は `renderer.render()` を呼ばない（最初の3フレームだけ描いて絵を固定）→ harness 21 → 62 RAF/秒
- `MeshStandardMaterial` → `MeshLambertMaterial`（17箇所）→ フィールド実測 22 → 34 RAF/秒
- 墨の木70本（Group×4メッシュ＝280ドロー）を **InstancedMesh 4つ**に集約 → 34 → 45 RAF/秒
- `(pointer:coarse)` で `pixelRatio` 1.5・antialias off

最終（headless Chromium・ソフトウェア描画での実測）：

| 場面 | RAF/秒 |
|---|---|
| harness（序章モーダル表示中） | 61 |
| フィールド歩行中（3回） | 52 / 59 / 52 |
| バトル中（3回） | 21 / 24 / 36 |

**バトルだけ明確に重い**（フィールドのオブジェクトがシーンに残ったまま＋DOMタグを毎フレーム更新）。ここは未改善。
harness の数字はモーダル表示中のものなので、**フィールドのFPSは別に測って併記する**（258の学びの再確認）。

### 4. ダブルタップズーム防止は「ボタンを除外」しないとゲームを壊す

定番の `touchend` 300ms判定をそのまま入れたら、**同じ字を2回続けてタップする合体操作が死んだ**
（`preventDefault()` が合成clickを消すため）。`e.target.closest('button,[role=button],a,input,...')` を
除外条件に入れて解決。**タップ連打が仕様のゲームでは、この定番スニペットをそのまま貼ってはいけない。**

### 5. 検証の並び

| 道具 | 見えたもの |
|---|---|
| `game-harness.sh` | 起動・描画・タップ・20MB（機械判定） |
| `audit.mjs` | ×9 → ×6（iOSヘッダー・SPEC欠落・CDN依存） |
| Playwright手動シナリオ | **上2つが素通りしたバグ**（4パネル重なり）と、実プレイのFPS |

3つ目が無ければ「HARNESS PASS＝遊べる」と誤報告していた。**PASSはプレイの証拠ではない。**

### やったこと（差分）

- フォルダ名 `260-day084` → `260-kanjima-shokanroku`（タイトル 漢字魔召喚録）
- `kanjima.html` → `index.html`（git履歴・公開URLなし＝旧名リダイレクト不要）
- three.js を cdnjs から **ローカル同梱**（`three.min.js` r128）
- `[hidden]{display:none!important}` 追加
- 序章モーダルを `<body>` 先頭へ移動
- シート表示中の描画停止 / Lambert化 / 木のInstancedMesh化 / coarse時のpixelRatio
- viewport に `maximum-scale=1,user-scalable=no`、`-webkit-tap-highlight-color` / `-webkit-touch-callout`
- ダブルタップズーム防止（ボタン除外版）
- 保存キー `kanjima-save-v1` → `tg.260.save`（旧キーからの読み替え付き・鉄則の接頭辞ルール）
- SPEC.md 新規作成

### 残り（未対応と明言する）

- **音が一切ない**（BGM・効果音・ミュート）。コントロールパネル方針の第1項に未適合
- **明示ポーズが無い**
- Google Fonts 3件が外部依存のまま（同梱は見た目に直結＝人間箱）
- **バトル中のFPSがフィールドの半分以下**（21〜36）。フィールドのメッシュを戦闘中に外していない
- **iPhone実機未検証**
