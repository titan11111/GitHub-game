# 画面が左右中央に来ない問題 — 3回分の挙動調査と修正方針

## 調査1: body 〜 #game-container 〜 .screen の親子・flex と幅の流れ

| 要素 | 役割・指定 |
|------|------------|
| body | `display: flex; flex-direction: column; width: 100%;`。子は #game-container と #control-panel。横方向は column なので子は横幅いっぱい。 |
| #game-container | `flex: 1; width: 100%; display: flex; justify-content: center; align-items: center;`。flex 子は .screen 群。横方向で子を中央寄せしようとしている。 |
| .screen | `width: 100%; max-width: 620px; margin: 0 auto;`。display: none のときはレイアウトに参加しない。 |

**結論**: 親子と flex の流れは「中央寄せしたい」設計になっている。

---

## 調査2: .screen.active が「中央に来ない」理由（幅・margin・flex 子の扱い）

- **flex 子のデフォルト**: `flex: 0 1 auto`, `min-width: auto`。
- **.screen** の `width: 100%; max-width: 620px` は、flex 子になっている「表示中の .screen」にも効くが、**#start-screen.active** は `display: flex` で上書きしている。display だけ変えており width/max-width は .screen のまま。
- **問題になりうる点**:  
  - flex 子の `min-width: auto` により、**実幅がコンテンツ幅まで縮む**ことがある。  
  - タイトルは .ff-window のみで `max-width: 90%` のため、親 #start-screen が「コンテンツ幅で縮んだ箱」になり、その箱だけが中央にあり、左右に余白が広がる見え方になる場合がある。  
  - あるいは、**「表示中の .screen」専用の幅・margin が、詳細度の高いルールで上書きされておらず**、他ルールやブラウザの解釈で 100% / max-width / margin が期待どおり効いていない可能性がある。

**結論**: 「表示中の画面」に対して、**詳細度を上げて** `width: 100%; max-width: 620px; margin-left: auto; margin-right: auto;` を明示すると安定する。

---

## 調査3: 他ルールの干渉・詳細度・メディアクエリの影響

### 3-1. .screen / .active / #start-screen.active の適用関係

| セレクタ | 詳細度 | 指定している主なプロパティ |
|----------|--------|----------------------------|
| .screen | 0,1,0 | width, max-width, margin, padding, display: none 等 |
| .active | 0,1,0 | display: block !important, margin: 0 auto |
| #start-screen.active | 1,1,0 | display: flex, justify-content, align-items（overflow 等は VER2 ではタイトル用を整理済み） |

- **#game-container > .screen.active** に該当するルールは**現在ない**。  
- 表示中は「.screen の width/max-width/margin」と「.active の margin」に依存している。  
- #start-screen.active は display と整列だけを指定しており、**幅・左右 margin はクラス側に依存**している。

### 3-2. 他ルールの有無

- **#battle-screen** に `width: 100%; height: 100%` があるが、戦闘画面用でタイトル時は非表示のため影響しない。
- **.ff-window** はグローバルだが、#start-screen .ff-window で `max-width: 90%` のみ。幅を広げる指定はない。
- **#map-grid** の `max-width` / `margin: auto` はマップ用で、タイトルには関係しない。

### 3-3. メディアクエリ

- `@media (orientation: landscape)` および `@media (orientation: portrait)` 内の **#game-container** は `padding-left: 0; padding-right: 0` のみ。  
- **.screen / #start-screen / 幅・中央寄せ** を変えるルールはメディアクエリに**ない**。

**結論**: 他ルールやメディアクエリが直接「中央に来ない」原因になっている可能性は低い。  
不足しているのは「**表示中の .screen**」に対する**明確な幅と左右 margin の指定**（かつ詳細度を上げたルール）である。

---

## 問題点の洗い出し（一覧）

1. **表示中画面専用ルールがない**  
   `#game-container > .screen.active` のようなセレクタで、幅・max-width・左右 margin を明示するルールが存在しない。そのため、flex 子のデフォルト挙動（min-width: auto 等）に依存しており、環境によって中央がずれうる。

2. **幅・中央寄せがクラスだけに依存している**  
   .screen と .active の「width: 100%; max-width: 620px; margin: 0 auto」に頼っているが、#start-screen.active などで display や整列だけが上書きされ、**「この幅で、左右 auto で中央」**が一番強いルールとして効いていない可能性がある。

3. **flex 子としての幅の保証がない**  
   flex 子は `min-width: auto` のときコンテンツまで縮みうる。表示中画面に「少なくとも width: 100%（max-width: 620px）を取る」と詳細度高く指定しないと、期待どおりの幅で中央にならない場合がある。

---

## 修正方針と実施内容

- **方針**: 「表示中の画面」にだけ、詳細度の高いルールで **width / max-width / 左右 margin** を明示する。  
- **実施**: `#game-container > .screen.active` に次のルールを追加する。

  ```css
  #game-container > .screen.active {
      width: 100%;
      max-width: 620px;
      margin-left: auto;
      margin-right: auto;
  }
  ```

- これにより、タイトル・フィールド・戦闘・エンディングの**いずれの画面が active でも**、同じ「幅の上限 620px・左右中央」が保証される。  
- 既存の .screen / .active の指定は残しつつ、「表示中だけ」これを上書きする形にする。

---

最終更新: 調査1〜3 を実施し、上記のとおり問題点を整理したうえで修正を実施する。
