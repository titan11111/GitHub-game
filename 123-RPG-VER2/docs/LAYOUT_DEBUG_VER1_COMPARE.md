# レイアウト不具合の特定（102-RPG VER1 との比較）

## 現象
- タイトル・フィールドが左にズレる
- キジ（pheasant）が左下で切れて見える・画像が干渉しているように見える

## VER1（正常）と VER2（不具合）の差分

### 1. overflow の違い ★要因の可能性大
| 項目 | 102-RPG VER1 | 123-RPG VER2 |
|------|--------------|--------------|
| `#start-screen.active` | `overflow: visible` のみ | `overflow-x: visible; overflow-y: auto` |
**影響**: VER2 の `overflow-y: auto` により縦スクロールバーが発生し、実質のコンテンツ幅が狭くなる。キジは `right: calc(...)` で配置されているため、幅が縮むと「右」が左に寄り、結果として左下で切れたように見える。

### 2. コンテナ幅の指定
| 項目 | 102-RPG VER1 | 123-RPG VER2 |
|------|--------------|--------------|
| `#game-container > .screen.active` | **存在しない** | `flex: 1 0 0%; width: 100%; max-width: 620px` を付与 |
**影響**: VER1 は .screen の `width: 100%; max-width: 620px; margin: 0 auto` だけで幅を取っている。VER2 の追加ルールが flex 子の解釈を変え、予期しない幅・位置になっている可能性。

### 3. ff-window の幅
| 項目 | 102-RPG VER1 | 123-RPG VER2 |
|------|--------------|--------------|
| `#start-screen .ff-window` | `align-self` なし | `align-self: stretch` を付与 |
**影響**: VER1 は親の `align-items: center` のままなので ff-window がコンテンツ幅になる。VER2 で stretch にすると親幅いっぱいになり、レイアウト計算が変わる。

### 4. タイトルキャラのスコープ・上限
| 項目 | 102-RPG VER1 | 123-RPG VER2 |
|------|--------------|--------------|
| タイトルキャラ | `.title-character`（グローバル） | `#start-screen .title-character`（スコープ） |
| キジ幅 | `width: 440px` | `width: min(440px, 45vw)` |
| title-character | max-width なし | `max-width: 45vw` |
**影響**: スコープはバグ防止のため VER2 のままとする。キジ・title-character の上限は VER1 に合わせると、VER1 と同じ見え方に近づく。

### 5. 戦闘画面のスタイル（VER2 でスコープ済み）
| 項目 | 102-RPG VER1 | 123-RPG VER2 |
|------|--------------|--------------|
| `.enemy-area`, `.monster-sprite`, `.monster-sprite img` | **グローバル** | `#battle-screen` 内に限定 |
**影響**: VER2 のスコープは正しい。戦闘用スタイルがタイトルに波及しないようにするため、この違いは維持する。

## 修正方針
1. **overflow** を VER1 と同じく `overflow: visible` のみにする（`overflow-y: auto` を廃止）。
2. **#game-container > .screen.active** を削除し、VER1 と同様に .screen の width / margin だけで幅と中央揃えを頼る。
3. **#start-screen .ff-window** から `align-self: stretch` を外し、VER1 と同じにする。
4. タイトルキャラは **#start-screen 内にスコープしたまま**、キジは VER1 と同じ `width: 440px`、`.title-character` の `max-width: 45vw` は削除する（VER1 に合わせる）。

以上を VER2 に適用し、タイトル・フィールドの左ズレとキジの干渉を解消する。
