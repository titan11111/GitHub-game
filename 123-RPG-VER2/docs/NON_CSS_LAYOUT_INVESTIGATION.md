# 非CSS領域の中央揃えずれ調査報告

スーパーリロード（キャッシュクリア）しても治らない場合、犯人は「CSSの外」にいるとの前提で、3つの非CSS要因を調査しました。

---

## 第1次調査：JavaScriptによるスタイル上書き

**結果：シロ（該当なし）**

### 検索したキーワード

- `.style.left =`
- `.style.marginLeft =`
- `gameContainer.style.width =`（および `#game-container` への width/left/margin の直接指定）

### 発見したコード

| ファイル | 行 | 内容 | レイアウトへの影響 |
|----------|-----|------|-------------------|
| `js/battle.js` | 1018, 1039, 1201 | `damageElement.style.left` / `criticalElement.style.left` | **なし**。ダメージ数値用の一時要素の位置指定。game-container や画面中央揃えには無関係。 |
| `js/ui.js` | 31 | `gameContainer` 取得 | **classList のみ**（`start-screen-active` の add/remove）。style の書き換えなし。 |
| `js/map.js` | 831 | `gameContainer` 取得 | **classList のみ**（`field-*` の add）。style の書き換えなし。 |
| `js/main.js` | 321 | `gameContainer` 取得 | **classList のみ**。style の書き換えなし。 |

**結論**：`#game-container` の `margin: 0 auto` や中央揃えを上書きするような **JS の style 操作は存在しません**。コメントアウトすべき該当コードはなし。

---

## 第2次調査：HTMLメタタグ（viewport）の viewport-fit=cover

**結果：グレー（環境により影響しうる）**

### 内容

`index.html` の viewport に `viewport-fit=cover` が指定されていました。ノッチ端末でセーフエリアを使うための設定ですが、**ブラウザによっては「画面左端 = 0px」の解釈がずれ、CSS の `env(safe-area-inset-*)` だけでは補いきれない**ことがあります。

### 対処（実施済み）

**変更前：**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

**変更後：**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

`viewport-fit=cover` を削除し、標準的な viewport に統一。ノッチ端末では safe-area の効き方が変わる可能性があるため、実機で表示を確認してください。

---

## 第3次調査：HTML構造・ゴースト要素・デバッグ残存

**結果：要修正あり（対処済み）**

### 1. デバッグ用 border の残存

`style.css` 末尾に以下が残っており、**レイアウトや見た目のずれの原因**になり得ました。

- `body { border: 2px solid white; }`
- `#game-container { border: 4px solid red; }`
- `.screen.active { border: 2px solid yellow; }`
- `#map-grid { border: 2px solid cyan; }`

**対処**：上記ブロックを削除しました。

### 2. #game-container の padding と safe-area

- ベースで `padding-left: 0` / `padding-right: 0` が指定されており、**safe-area が考慮されていませんでした**。
- メディアクエリ（landscape / portrait）内で `padding-left: 0 !important` / `padding-right: 0 !important` により、**safe-area が強制で打ち消されていました**。

**対処**：以下に変更しました。

- ベース：`padding-top/left/right` を `env(safe-area-inset-top/left/right, 0)` に変更。
- メディアクエリ：`0 !important` をやめ、`env(safe-area-inset-left, 0)` / `env(safe-area-inset-right, 0)` に統一。

### 3. HTML構造・#control-panel

- `</div>` の閉じ忘れ等はなし。構造は問題ありません。
- `#control-panel` は `#game-container` の外にあり、CSS で `max-width: 620px`・`margin-left/right: auto` が指定されています。意図どおりの配置です。

---

## 修正ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `index.html` | viewport から `viewport-fit=cover` を削除 |
| `css/style.css` | デバッグ用 border 削除、#game-container の padding を safe-area 対応に統一、メディアクエリ内の `0 !important` を env() に変更 |

---

## まとめ

- **JS**：中央揃えを壊す style 上書きはなし。
- **viewport**：`viewport-fit=cover` を外して標準 viewport に変更（実施済み）。
- **HTML/CSS**：デバッグ border 削除と、`#game-container` の padding safe-area 対応を実施済み。

これらにより、**CSS 外の要因**は可能な範囲で整理されています。まだずれが残る場合は、実機・ブラウザ別の検証や、別の CSS ルールの詳細な確認をおすすめします。
