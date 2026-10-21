# オープニング画面：102-RPG VER1 と 123-RPG VER2 の違い

## 1. HTML 構造

| 項目 | 102-RPG VER1 | 123-RPG VER2 |
|------|--------------|--------------|
| #game-container の子 | start / prologue / main / battle / ending / **custom-dialog-overlay** | 上記に加え **#yes-no-modal-overlay** |
| オープニング中に表示される要素 | #start-screen（dog, monkey, kiji, ff-window）のみ | 同一 |
| #control-panel の位置 | #game-container の外（body 直下） | 同一 |
| BGM / audio の位置 | #game-container の外 | 同一 |

**ヒント**: `#yes-no-modal-overlay` は `display: none` のためレイアウトには直接影響しないが、`#game-container` の flex 子が 1 つ増えている。念のため、モーダル類は `#game-container` の外（例: body 直下）に出すと、オープニング用の「画面 = .screen だけ」の構造に近づき、102 と揃えやすい。

---

## 2. CSS：ゲームコンテナ〜画面の土台

| 項目 | 102-RPG VER1 | 123-RPG VER2（現状） |
|------|--------------|----------------------|
| #game-container | flex, justify-content: center, align-items: center, overflow: hidden | 同一 |
| #game-container.start-screen-active | overflow: visible | 同一 |
| .screen | width: 100%, max-width: 620px, margin: 0 auto, padding: 10px 等 | 同一 |
| #game-container > .screen.active の専用ルール | **なし** | **なし**（以前の flex: 1 0 0% 等は削除済み） |

**ヒント**: 現状は「表示中画面の専用ルール」は 102 と揃えてある。オープニングで左ズレやキジの切れがまだ出る場合は、**102 側に .screen 以外の共通ルールが隠れていないか**（例: メディアクエリ内の #game-container など）を 102 の style.css 全体から確認するとよい。

---

## 3. CSS：オープニング専用（#start-screen）

| 項目 | 102-RPG VER1 | 123-RPG VER2（現状） |
|------|--------------|----------------------|
| #start-screen.active | overflow: visible / position: relative / min-height: 500px / display: flex, align-items: center 等 | 同一（overflow: visible に統一済み） |
| タイトル用キャラのセレクタ | **.title-character**（グローバル） | **#start-screen .title-character**（スコープ） |
| 犬・猿・キジのセレクタ | **.title-dog / .title-monkey / .title-kiji**（グローバル） | **#start-screen .title-dog 等**（スコープ） |
| #start-screen .ff-window | align-self なし, width: 100%, max-width: 100% | 同一（align-self なしに戻済み） |
| キジの width | 440px（メディアクエリで 300px / 380px） | 440px（300px / 380px）で同一 |

**ヒント**:  
- 102 はクラスだけで指定しているが、実際にそのクラスが付くのは「#start-screen 内の要素だけ」なので、見た目の違いはセレクタ由来では小さい。  
- 123 で **#start-screen にスコープしている**のは、戦闘・他画面への干渉（猿まわり等）を防ぐためで、そのまま維持してよい。  
- 改善の余地があるとすれば、「102 では存在しないが 123 で増えた #start-screen 用の指定」が残っていないか（例: 一度入れた overflow-y: auto の残りなど）を確認すること。

---

## 4. CSS：メディアクエリ（オープニング関連）

| 項目 | 102-RPG VER1 | 123-RPG VER2 |
|------|--------------|--------------|
| @media (max-width: 480px) | .title-dog / .title-monkey / .title-kiji | #start-screen .title-dog 等 |
| @media (481px–768px) | .title-dog / .title-monkey / .title-kiji | #start-screen .title-dog 等 |
| 中身の値（キジの幅など） | 102: 300px / 380px 等 | 123: 同一 |

**ヒント**: セレクタが「クラスのみ」か「#start-screen .クラス」かの差のみ。適用対象は同じなので、123 のスコープ付きのままで問題ない。

---

## 5. CSS：戦闘画面（オープニングへの波及の有無）

| 項目 | 102-RPG VER1 | 123-RPG VER2 |
|------|--------------|--------------|
| .enemy-area / .monster-sprite / .monster-sprite img | **グローバル**（#battle-screen の子にのみ存在） | **#battle-screen** 配下にスコープ |

**ヒント**: 123 では戦闘用スタイルを `#battle-screen` 内に限定している分、オープニングに別画面のスタイルが回り込むリスクは 102 より小さい。この「戦闘は #battle-screen 内だけ」の設計は 123 の改善であり、維持してよい。

---

## 6. JavaScript：オープニング表示まわり

| 項目 | 102-RPG VER1 | 123-RPG VER2 |
|------|--------------|--------------|
| showScreen('start-screen') 時の gameContainer 操作 | classList.add('start-screen-active') | 同一 |
| その他での start-screen 判定 | startScreen.classList.contains('active') 等 | 同一＋復帰フラグなど 123 固有処理 |

**ヒント**: オープニングの「出し分け」と `start-screen-active` の付け方は 102 と同等。123 固有の処理はオープニングの表示有無よりも、BGM・復帰・イベントのタイミングに影響していないかだけ確認すればよい。

---

## 7. 123 改善のためのチェックリスト（オープニング）

1. **overflow**  
   - `#start-screen.active` は 102 と同じく **overflow: visible のみ**にしておく（overflow-y: auto はオープニングでは使わない）。

2. **「表示中画面」の幅**  
   - 102 には `#game-container > .screen.active` の専用ルールがないので、123 も「.screen の width / max-width / margin だけ」で揃えている現状を維持する。  
   - フィールドや他画面で左ズレる場合だけ、**その画面用**に `#main-screen.active` など限定のルールを検討する。

3. **タイトル用キャラのスコープ**  
   - 123 の **#start-screen .title-*** のままにする。戦闘・他画面との干渉防止に有効。

4. **DOM の置き場所**  
   - モーダル（yes/no 等）を `#game-container` の外に出すと、102 に近い「ゲーム画面 = .screen のみ」の構成になり、レイアウトの見通しが良くなる。

5. **102 にしかないルールの有無**  
   - 102 の style.css のうち、`#game-container` / `.screen` / body 用など、**オープニング表示に関係しそうなもの**を 123 と 1 対 1 で比べ、102 にあって 123 にないものがないか確認する（特にメディアクエリ内）。

---

## 8. まとめ：102 と 123 の「オープニングで揃えている点」

- `#game-container` / `#game-container.start-screen-active` / `.screen` / `.active`  
- `#start-screen.active` の overflow, position, min-height, flex  
- `#start-screen .ff-window` の幅まわり（align-self なし, width: 100%, max-width: 100%）  
- キジ・犬・猿の数値（width や right/top の calc）

**123 で意図的に変えている点（そのまま活かすとよい）**

- タイトル用キャラを `#start-screen` にスコープして、他画面・戦闘との干渉を防ぐ  
- 戦闘用スタイルを `#battle-screen` 内にスコープする  

この差分整理とチェックリストを使うと、オープニングだけ 102 に寄せつつ、123 の追加要素や戦闘まわりは壊さずに調整できる。

---

## デバッグ実施メモ（調査に基づく修正）

1. **#yes-no-modal-overlay を #game-container 外に移動**  
   - 102 では #game-container の子は .screen 群と custom-dialog-overlay のみ。  
   - 123 では yes-no-modal が入っていたため、オープニング/フィールド表示時の flex 子が 1 つ多くなっていた。  
   - `index.html` で `#yes-no-modal-overlay` を `</div>`（#game-container 閉じ）の直後に出し、body 直下の兄弟として配置した。

2. **#start-screen.active の重複ブロックを統合**  
   - 123 の CSS に「overflow 用」「position/min-height 用」「display:flex 用」の 3 ブロックがあったのを、  
   - 1 つの `#start-screen.active` にまとめた（overflow: visible / position / min-height / display: flex 等をすべてここで指定）。  
   - カスケードの見通しが良くなり、意図しない上書きを防ぐ。

3. **メディアクエリの突き合わせ**  
   - 102 と 123 の `@media (orientation: landscape/portrait)` 内の `#game-container` 指定は同一であることを確認済み。
