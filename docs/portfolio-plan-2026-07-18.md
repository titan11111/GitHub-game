# GitHub-game ポートフォリオ整理 実装計画（2026-07-18）

> **作成**: タイタンズ・エンジニアリング部（Claude Code 長時間タスク）
> **性格**: これは**計画書**である。既存ゲームのコード・既存READMEは1行も変更していない。本計画の実施（README配布・titans-core組み込み・インデックスページ制作）はすべて**タイタンの承認後**に着手する。
> **本日作成した新規ファイルは2つだけ**: 本書と `docs/templates/README-template.md`（READMEテンプレート見本）。

---

## 0. 前提と数の整理

- 対象: `~/Desktop/GitHub-game/` 配下の番号付きフォルダ **101本**（実測）
  - 内訳: `000`・`001` ＋ `101〜193`（`109-110`が1フォルダに統合されているため92フォルダ）＋ `1200番台` 7フォルダ
  - 依頼文の「約109本」との差は、`109-110`統合と1〜100番が別アーカイブ（`2025年制作生成AIゲーム作品集`、約1.1GB。鉄則により**触らず保管**）であることによる
- 性格別内訳: **ゲーム85本** ／ ツール・モック・ポートフォリオ13本 ／ 素材・テスト3本
- 必読指定の `docs/tech-knowledge-base.md` は**現在存在しない**（docs/には `retro-style-guide.md` と `security-report-2026-07-12.md` のみ）。技術ナレッジはClaude Code memoryの `knowledge_*_game_dev.md` 8本に集約済みのため、本計画はそちらとレトロ様式ガイド・CLAUDE.mdを根拠にした
- 準拠した鉄則（`GitHub-game/CLAUDE.md`）: モバイル3MB／フォルダ番号不変更／push禁止／**横展開・共通化を頼まれずに始めない**（→本書は「頼まれた計画作成」のみ。実装ゼロ）

### サマリー数値（2026-07-18 実測）

| 項目 | 数値 |
|---|---|
| 総フォルダ数（アーカイブ除く） | **101** |
| README あり／なし | **7 ／ 94** |
| SPEC.md あり | 14 |
| 3MB判定 OK（フォルダ実測3MB以下） | 70 |
| 3MB 要精査（3〜6MB） | 6 |
| 3MB 超過疑い（6MB超） | 25 |
| 単一HTML構成（HTML1・JS外部0） | **49** |
| HTML+JS分離 | 39 |
| 複数HTML | 13 |
| git管理 あり／なし | 76 ／ 25 |

---

## 1. 棚卸し表（全101フォルダ）

**測定方法と注意**:
- サイズ = フォルダ内全ファイル実測（`.git`・`node_modules` 除外）。**プレイ時に実際にダウンロードされる量とは異なる**（未参照アセット・SPEC・開発資料込み）ため、3MB鉄則の正式な違反判定は `~/.company/engineering/docs/game-fix-priority-2026-07.md` を正とする。ここでの判定は「OK＝フォルダごと3MB以下なので確実にセーフ」「要精査＝3〜6MB」「超過疑い＝6MB超」のスクリーニング
- 構成 = 単一HTML（HTML1個・外部JSゼロ＝依存ゼロ1ファイル）／HTML+JS分離／複数HTML
- ジャンルは タイトル・フォルダ名・開発知見メモ（knowledge_*_game_dev.md）からの推定。承認時にタイタンの目で補正してほしい

| フォルダ | タイトル | ジャンル | README | SPEC | サイズ(MB) | 3MB判定 | 構成 | git |
|---|---|---|---|---|---:|---|---|---|
| 000-gamesight2 | ゲームランチャー ／ titan11111 | ツール（ランチャー） | — | — | 24.86 | 超過疑い | HTML+JS分離 | ❌ |
| 001-neko_catch_game-main | 猫キャッチゲーム | カジュアルアクション | — | — | 10.13 | 超過疑い | HTML+JS分離 | ✅ |
| 101-nikkisakusei | ぼちぼち日記ストッカー | ツール（日記） | — | — | 20.33 | 超過疑い | HTML+JS分離 | ✅ |
| 102-RPG-type1 | 魔の山 | RPG | — | — | 77.64 | 超過疑い | HTML+JS分離 | ✅ |
| 103-actionjinnsei | かえりみちヒーローズ | アクション | ✅ | — | 14.19 | 超過疑い | HTML+JS分離 | ✅ |
| 104-parashoot | パラシュート・ボーヤ | カジュアルアクション | — | — | 12.21 | 超過疑い | HTML+JS分離 | ✅ |
| 105-typpinggame | タイピング・バスターズ EX ゴールド | タイピング・教育 | — | — | 8.00 | 超過疑い | 単一HTML | ✅ |
| 106-copingcafe | コーピングカフェ | ヘルスケア | — | — | 19.39 | 超過疑い | HTML+JS分離 | ✅ |
| 107-cosmowalking | コスモさんぽ DX | カジュアル | — | — | 0.07 | OK | HTML+JS分離 | ✅ |
| 108-bearfait | PIXEL QUEST | アクション | — | — | 60.11 | 超過疑い | 複数HTML | ✅ |
| 109-110-カラスの逆襲 | CROW'S DESTINY: THE RITUAL OF TWILIGHT | アクション | — | ✅ | 28.04 | 超過疑い | HTML+JS分離 | ✅ |
| 111-actioncat | こねこのさんぽ道 - Pixel Adventure | アクション | — | — | 19.20 | 超過疑い | 複数HTML | ✅ |
| 112-sinnarpg | Gem Quest - Retro Action RPG | アクションRPG | — | — | 0.17 | OK | HTML+JS分離 | ✅ |
| 113-business | 営業ランキングツール | ツール（営業） | — | — | 0.24 | OK | 複数HTML | ✅ |
| 114-schoolquest | スクールクエスト ～放課後の伝説～ | RPG | — | — | 0.05 | OK | HTML+JS分離 | ✅ |
| 115-battle | BLANIUSU — Gradius Style Shooter UI | シューティング | — | — | 50.14 | 超過疑い | HTML+JS分離 | ✅ |
| 116-cooking | 爆発！自動シャッフル料理店 | カジュアル | — | — | 0.02 | OK | 単一HTML | ✅ |
| 117-bound | 反射パズル：iOS対応版 | パズル | — | — | 0.03 | OK | 単一HTML | ✅ |
| 118-sleep-well-my-lord | 🏯 殿、ご安眠を。 | シミュレーション | — | ✅ | 0.31 | OK | HTML+JS分離 | ✅ |
| 119-osero | 3D Othello - Sound & Strategy | ボード | — | — | 0.06 | OK | 単一HTML | ✅ |
| 120-fumifumi | 勇者の終焉 - The Last Hero (JS Edition) | アクション | — | — | 0.00 | OK | 単一HTML | ✅ |
| 195-HTML素材 | Neon Street Brawl | 素材集 | — | — | 5.69 | 要精査 | 複数HTML | ❌ |
| 196-fc-test | TITANS QUEST — game-fc スキルテスト | テスト（FC様式） | — | — | 0.01 | OK | 単一HTML | ❌ |
| 197-druaga | DRUAGA NO TOU | アクションRPG | — | — | 0.03 | OK | 単一HTML | ❌ |
| 198-dragon-quest1 | ANCIENT BLADE | RPG | — | — | 0.04 | OK | 単一HTML | ✅ |
| 199-pinball | FC PINBALL | アーケード | — | — | 0.02 | OK | 単一HTML | ❌ |
| 200-crystal-quest | DUNGEON KNIGHT | アクションRPG | — | — | 0.03 | OK | 単一HTML | ❌ |
| 201-mario-fc | FC MARIO | アクション | — | — | 0.02 | OK | 単一HTML | ❌ |
| 121-coping100  | コーピング 100 | ヘルスケア | — | — | 19.37 | 超過疑い | HTML+JS分離 | ✅ |
| 122-RPGfumito  | スクールクエスト ～放課後の伝説～ | RPG | — | — | 0.04 | OK | HTML+JS分離 | ✅ |
| 123-RPG-VER2 | LEGEND OF INUSARUKIGI | RPG | — | — | 23.17 | 超過疑い | HTML+JS分離 | ✅ |
| 124-wakuwakutrips | 出張プログラム視認化ツール 🎮 | ツール（可視化） | — | — | 12.95 | 超過疑い | 複数HTML | ✅ |
| 125-koiking | 鯉の滝登り：龍への道 — スプライト版 | カジュアルアクション | — | — | 2.98 | OK | 単一HTML | ✅ |
| 126-Chemical Sandbox | ケミカル・サンドボックス：リアクター | シミュレーション | — | — | 0.04 | OK | 単一HTML | ✅ |
| 127-dashutu | FAMICOM DETECTIVE | アドベンチャー | — | — | 37.87 | 超過疑い | HTML+JS分離 | ✅ |
| 128-horra2 | 絶望のキャンプ場：蒼穹の監視者 | ホラーADV | — | — | 2.86 | OK | 単一HTML | ✅ |
| 129-racing | NIGHT RACER '85 | レース | — | — | 2.47 | OK | HTML+JS分離 | ✅ |
| 130-sinkansen | 桜沢新幹線駅 ストップチャレンジ — 電車でGO!超越版 | アーケード | — | — | 0.06 | OK | 単一HTML | ✅ |
| 131-oldman-run | じいちゃんの怒り | ランアクション | — | — | 0.09 | OK | 単一HTML | ✅ |
| 132-rocket | LIFT OFF — 重力に勝て。 | アクション | — | — | 0.06 | OK | 単一HTML | ✅ |
| 133-tetris-bridge | テトリスブリッジ - 谷を渡れ! | パズル | — | — | 0.08 | OK | HTML+JS分離 | ✅ |
| 134-god-simulator | 1日の王様 | シミュレーション | — | — | 0.06 | OK | 単一HTML | ✅ |
| 135-世界一周ゲーム | World Treasure Hunter | アドベンチャー・教育 | — | — | 0.02 | OK | 単一HTML | ✅ |
| 136-retro-action | Retro Platformer Adventure | アクション | — | — | 0.04 | OK | HTML+JS分離 | ✅ |
| 137-punch | 擬似3D ボクシングバトル - 高知能AI版 | 格闘 | — | — | 0.02 | OK | 単一HTML | ✅ |
| 138-Bookshot | BookShot ✦ 書籍解析システム | ツール（書籍） | ✅ | — | 0.10 | OK | HTML+JS分離 | ✅ |
| 139-bubble-ocean | 海底泡ぽこ | カジュアル | — | — | 0.03 | OK | 単一HTML | ✅ |
| 140-asteroid-heroes | ASTEROID HEROES | シューティング | — | — | 7.31 | 超過疑い | 単一HTML | ✅ |
| 141-morning-challenge | MORNING CHALLENGE | 習慣・教育 | ✅ | — | 0.07 | OK | HTML+JS分離 | ❌ |
| 142-cyber-blade | CYBER BLADE - Tactical Action | アクション | — | — | 0.03 | OK | 単一HTML | ✅ |
| 143-spriteplayer | Sprite Player Demo | ツール（デモ） | — | — | 28.13 | 超過疑い | 単一HTML | ✅ |
| 144-candolhero | 燭城物語 — 横スクロール | アクション | — | ✅ | 6.62 | 超過疑い | HTML+JS分離 | ✅ |
| 145-coffee-master | ☕ コーヒーマスター・カフェ | シミュレーション | ✅ | — | 0.02 | OK | 単一HTML | ✅ |
| 146-racing2 | Road Rush | レース | — | ✅ | 0.07 | OK | HTML+JS分離 | ✅ |
| 147-RPG | 147-RPG | RPG | — | — | 46.03 | 超過疑い | HTML+JS分離 | ✅ |
| 148-depamigo | デパートの迷子 ― ある日曜日のおはなし [v2] | ノベル・ADV | — | — | 43.22 | 超過疑い | HTML+JS分離 | ✅ |
| 149-horrafumi | 149 Horrafumi — 3Dホラー | ホラー3D | ✅ | — | 3.02 | 要精査 | HTML+JS分離 | ❌ |
| 150-ACTION-MEGAMIX  | Action Megamix — Unified Edition | アクション | — | — | 0.05 | OK | 単一HTML | ❌ |
| 151-racing3 | SUNSET DRIFT — 疑似3Dレーサー | レース | — | — | 8.21 | 超過疑い | 単一HTML | ✅ |
| 152-3d-delivery-rush-comparison | 蒼穹への配達 — Chronicle Run | レース（3D） | — | — | 0.03 | OK | 単一HTML | ❌ |
| 153-cosmo-farm | ★ COSMO FARM — 星屑農園 | シミュレーション | — | — | 0.02 | OK | 単一HTML | ✅ |
| 154-shooting比較 | JSシューティングゲーム | シューティング（AI比較） | — | — | 0.05 | OK | 複数HTML | ❌ |
| 155-RPG比較 | AI Generated RPG | RPG（AI比較） | — | — | 0.17 | OK | 複数HTML | ❌ |
| 156-game | 153-game | 不明・テスト | ✅ | — | 0.01 | OK | HTML+JS分離 | ❌ |
| 157-sharepoint | 法人営業ナレッジポータル｜SharePoint実機再現モック | ツール（モック） | — | — | 27.15 | 超過疑い | 複数HTML | ✅ |
| 158-return | 158-return ／ game_dev_flow_note | ツール（ノート） | — | — | 2.00 | OK | 単一HTML | ❌ |
| 159-English−game | イングリッシュ・クエスト - English Quest | 教育（英語） | — | — | 0.07 | OK | HTML+JS分離 | ❌ |
| 160-island-defense | シマモリ - 島育成タワーディフェンス | タワーディフェンス | — | — | 0.10 | OK | 複数HTML | ✅ |
| 161-pptbilder | AI PPT プロンプトジェネレーター v3 | ツール（PPT） | — | — | 0.29 | OK | 複数HTML | ✅ |
| 162-shooting4 | Gradius Style STG | シューティング | — | — | 0.01 | OK | HTML+JS分離 | ❌ |
| 163-quest | カプセル機甲戦線 -CAPSULE TACTICS- | ストラテジー | — | — | 0.06 | OK | HTML+JS分離 | ❌ |
| 164-haihai | かみさまベビー ～おうちまでハイハイ～ | カジュアルアクション | — | — | 3.50 | 要精査 | 単一HTML | ✅ |
| 165-３Dtowncreat | WEATHER GOVERNOR | シミュレーション | — | — | 0.17 | OK | HTML+JS分離 | ✅ |
| 166-sekigahara | 関ヶ原の戦い 1600 — 3Dシミュレーション | シミュレーション（歴史） | — | — | 0.10 | OK | 複数HTML | ✅ |
| 167-bomb | BOMB RUNNER | アクション | — | — | 3.81 | 要精査 | 複数HTML | ✅ |
| 168-spartanX | スパルタンX | アクション | — | — | 0.02 | OK | 単一HTML | ❌ |
| 169-simulation | TITAN WARS | ストラテジー | — | — | 0.02 | OK | 単一HTML | ✅ |
| 170-FFClone | FFClone | RPG | — | — | 0.17 | OK | HTML+JS分離 | ✅ |
| 171-TWIN | TWIN POP | パズル | — | — | 3.36 | 要精査 | 単一HTML | ✅ |
| 172-hokuto-action | 北斗の拳 ～世紀末覇者伝説～ | アクション | — | — | 0.02 | OK | 単一HTML | ✅ |
| 173-shiro-internal-portal | 営業育成ポータル ／ OneTeam 社内情報共有 | ツール（モック） | — | — | 0.02 | OK | 複数HTML | ❌ |
| 174-ninja-action | 174 NINJA ACTION | アクション | — | — | 0.03 | OK | 単一HTML | ✅ |
| 175-dragonball-fc | DRAGON QUEST Z - FC EDITION | アクション | — | — | 0.04 | OK | 単一HTML | ✅ |
| 176-kaerimichi2 | かえりみちヒーローズ2 | アクション | — | — | 14.01 | 超過疑い | HTML+JS分離 | ✅ |
| 177-copilot-quest | COPILOT QUEST | 教育（Copilot） | — | — | 0.03 | OK | 単一HTML | ✅ |
| 178-excite-bike | TURBO RIDER | レース | — | — | 0.02 | OK | 単一HTML | ✅ |
| 179-shooting | BLANIUSU - グラディウス風シューター | シューティング | — | — | 0.40 | OK | 単一HTML | ✅ |
| 180-action-z | アクションゲームZ | アクション | — | — | 3.06 | 要精査 | HTML+JS分離 | ✅ |
| 181-crow-run | ネオン・カラス・ラン | ランアクション | — | ✅ | 0.19 | OK | 単一HTML | ✅ |
| 182-eirianshooting | 太陽系シューティング | シューティング | — | ✅ | 0.04 | OK | HTML+JS分離 | ❌ |
| 183-morning-quest | 🌞 Morning Quest | 習慣・教育 | — | ✅ | 1.32 | OK | 単一HTML | ✅ |
| 184-pinball | FC PINBALL | アーケード | — | ✅ | 0.03 | OK | 単一HTML | ✅ |
| 185-oil-painting-portfolio | T. — Oil Paintings | ポートフォリオ（絵画） | ✅ | — | 26.18 | 超過疑い | 単一HTML | ✅ |
| 186-seikimatsu-fist | 世紀末拳法伝説 - SEIKIMATSU FIST | アクション | — | ✅ | 0.03 | OK | 単一HTML | ✅ |
| 187-shooting-prompt-maker | シューティングゲーム設計プロンプトメーカー | ツール（設計） | — | — | 0.04 | OK | HTML+JS分離 | ✅ |
| 188 | FROSTLINE PENGUIN | アクション | — | ✅ | 0.06 | OK | HTML+JS分離 | ❌ |
| 189-space-invaders | STARLINE INVADERS | シューティング | — | ✅ | 2.42 | OK | HTML+JS分離 | ❌ |
| 190-dawn-quest-iii | DAWN QUEST III | RPG | — | ✅ | 0.03 | OK | 単一HTML | ✅ |
| 191-rpg-spec-builder | RPG仕様書ビルダー ／ タイタンズ | ツール（設計） | — | — | 0.02 | OK | 単一HTML | ❌ |
| 192-pipe-runner-fc | PIPE RUNNER FC | ランアクション | — | ✅ | 0.03 | OK | 単一HTML | ❌ |
| 193-titan-land | TITAN LAND | アクション | — | ✅ | 0.05 | OK | 単一HTML | ✅ |


---

## 2. README整備計画

### 2-1. 現状と方針

- README保有は **7本のみ**: `103-actionjinnsei` / `138-Bookshot` / `141-morning-challenge` / `145-coffee-master` / `149-horrafumi` / `156-game` / `185-oil-painting-portfolio`
- **この7本の既存READMEは書き換えない・追記もしない**（尊重）。配布対象は残り94フォルダのうち、素材・テスト3本（1200/1201/156系）と統合検討中フォルダを除いた実質約90本
- README追加はゲーム本体（index.html等）に一切触れない作業なので、「84本が依存ゼロ単一ファイルで動く」設計を壊すリスクはゼロ

### 2-2. テンプレート（実物を作成済み）

**`docs/templates/README-template.md`** ← 本日作成した見本。構成:

1. タイトル＋スクリーンショット＋**「▶ 今すぐ遊ぶ」URL**（最上部。外部の人は3秒で遊べるかどうかで離脱が決まる）
2. 3行紹介（誰が・何をして・何が気持ちいいか）
3. タグ（§3の体系に準拠）
4. 操作方法（スマホ／キーボードの2列表。iPhone主戦場なのでスマホ列が先）
5. 技術メモ（構成・容量・3MB鉄則・iOS対応・ライブラリ）
6. 制作メモ（制作時期・開発知見リンク・このゲームで学んだこと）

### 2-3. 配布の進め方（3波・承認後）

| 波 | 対象 | 本数目安 | 情報源 | 見込み工数 |
|---|---|---|---|---|
| 第1波 | SPEC.md保有14本＋ジャンル知見の代表作（144/147/151/148/137/154等） | 約20本 | SPEC.md＋knowledge_*からドラフト自動生成→タイタン確認 | 1本5分×20 |
| 第2波 | 単一HTMLの小品（コード即読可能でドラフト精度が高い） | 約40本 | index.htmlの解析＋棚卸し表 | 2〜3セッション |
| 第3波 | ツール系・大型フォルダ（102/108/115/127等、中身確認が必要） | 約30本 | 個別確認 | 都度 |

- ドラフト生成は機械的改修に該当（判断不要）→ CLAUDE.md鉄則4の簡易ゲート（実装＋learnings記録）で回せる。ただし**各READMEの「3行紹介」だけはタイタンの言葉で確定**させる（ポートフォリオの顔になる部分のため）
- 完了の定義: README配置→`git add README.md`のみのローカルコミット（push しない）

---

## 3. タグ・分類体系の設計

3軸で付与する。1ゲーム = ジャンル1個＋様式1個＋用途0〜2個。

### 軸1: ジャンルタグ（12種・実測分布ベース）

| タグ | 対象 | 本数（実測） |
|---|---|---|
| `#action` | アクション・ランアクション・格闘・アクションRPG | 31 |
| `#rpg` | RPG（比較企画含む） | 9 |
| `#shooting` | シューティング（比較企画含む） | 7 |
| `#simulation` | シミュレーション・ストラテジー・タワーディフェンス・歴史 | 10 |
| `#racing` | レース（3D含む） | 5 |
| `#puzzle` | パズル・ボード・アーケード（ピンボール等） | 7 |
| `#casual` | カジュアル・カジュアルアクション | 7 |
| `#adventure` | ADV・ノベル・ホラー・脱出 | 5 |
| `#edu` | 教育・タイピング・クイズ・習慣化 | 5 |
| `#wellness` | ヘルスケア（コーピング等） | 2 |
| `#tool` | ツール・モック・設計支援 | 13 |
| `#etc` | 素材・テスト・未分類 | 3 |

### 軸2: 様式タグ（レトロ様式ガイド準拠）

`#style-fc`（ファミコン文法）／`#style-md`（メガドライブ文法）／`#style-pce`／`#style-modern`（現代UI）／`#style-3d`（Three.js等）
※様式タグはretro-style-guide.mdの10条を**満たすものだけ**にFC/MD/PCEを付ける（偽レトロに様式タグを付けない）。判定はチェックリスト流用。

### 軸3: 用途タグ（見せ方に直結）

- `#featured` — 外部に最初に見せる代表作（各ジャンル1〜2本、計10本前後を選定）
- `#training` — 法人研修・営業支援へ転用済み／転用予定（105/113/157/173/177等）
- `#rnd` — 技術検証・AI比較企画（152/154/155、1201等）
- `#wip` — 3MB超過・未整備で外部公開前に手当てが要るもの

### 運用方法

- 正本は各READMEのタグ行（§2テンプレートに組込済み）
- 機械可読用に `docs/games-index.json` を棚卸し表から生成（§5のインデックスページのデータソースと共用）。**JSONの生成はREADME第1波と同時に実施**（承認後）

---

## 4. titans-core.js 共通コード抽出計画（計画のみ・コード変更ゼロ）

### 4-1. 現状認識

`titans-core/titans-core.js` **v1がすでに存在**する（2026-07-07作成・6.5KB・依存ゼロ・7関数）。したがって本計画は「新規抽出」ではなく、**v1の妥当性を101フォルダの実測grepで裏付け、v2追加候補と導入手順を決める**ことに絞る。

### 4-2. 実測: どのパターンを何本が独自実装しているか（2026-07-18 grep、101フォルダ）

| 順位 | パターン | 独自実装フォルダ数 | titans-core v1の対応関数 |
|---|---|---|---|
| 1 | ゲームループ（requestAnimationFrame） | **74本** | `createFixedStepLoop()` 実装済み |
| 2 | WebAudio unlock（webkitAudioContext） | **69本** | `initAudioUnlock()` / `getAudioCtx()` 実装済み |
| 3 | タッチ操作・仮想パッド（touchstart） | **62本** | `initVirtualPad()` 実装済み |
| 4 | セーブ（localStorage） | **45本** | `save()` / `load()` 実装済み |
| 5 | safe-area対応（safe-area-inset） | **33本** | **未実装（v2候補）** |
| 6 | ダブルタップ・ジェスチャ防止（dblclick 29本／gesturestart 8本） | 29本 | `initTouchGuard()` 実装済み ※**逆に72本が未対策の疑い＝品質リスク** |
| 7 | Canvas DPR対応（devicePixelRatio） | 27本 | `initCanvasDPR()` 実装済み |

→ 2026-07-06構造監査（70本がaudio unlock独自実装）と整合。v1の関数選定は実測と一致しており妥当。

### 4-3. どのゲームが共有しているか（代表例）

- **4パターン以上を独自実装している「フルセット組」**（＝共通化効果が最大）: 118-sleep-well-my-lord / 125-koiking / 130-sinkansen / 132-rocket / 147-RPG / 151-racing3 / 160-island-defense / 166-sekigahara / 171-TWIN / 180-action-z / 184-pinball / 186-seikimatsu-fist / 189-space-invaders / 193-titan-land ほか約30本
- **gesturestart対策まで完備の8本**（お手本実装。抽出元として参照）: 103 / 109-110 / 118 / 133 / 176 / 180 / 181 / 182
- v1の出典どおり: ループは144-candolhero、セーブ設計は147-RPG、構成は170-FFCloneが参照元

### 4-4. v2 追加候補（優先順）

1. `applySafeArea()` — 33本が独自実装。CSS env()注入をJS一発で
2. `fitIntegerScale(wrap, W, H)` — レトロ様式ガイド§4の整数倍フィット。FC/MD様式の新作で毎回必要（crow-run不合格の再発防止）
3. `createSeq3(mel, bass, drum)` — 3声シーケンサ最小実装（様式ガイド鉄則7「音は最低3声」のコード化）
4. `px(v)` — 整数スナップ描画ヘルパ（様式ガイド鉄則2）

### 4-5. 導入方針（最重要: 壊さないこと）

- **既存ゲーム101本のコードは書き換えない。** 単一HTML49本の「依存ゼロで動く」価値はポートフォリオの核であり、titans-core導入はこれを毀損しうる
- titans-coreは**新作と、タイタンが個別指定した大改修時のみopt-in**。読み込みは「同フォルダにコピー」方式を既定（各ゲームの独立性維持。jsDelivr方式は公開後にタイタンと確定＝v1 READMEの方針を踏襲）
- フェーズ計画:
  - **Phase 0**: 本計画をタイタンが承認（どの関数を入れるか・v2候補の取捨）
  - **Phase 1**: 新作雛形に組込み、`196-fc-test` 相当のテスト作品1本で `/game-play-tester` 9項目＋実機確認
  - **Phase 2**: タイタン指定の改修対象**1本ずつ**に適用。適用前後で game-play-tester のレポートを比較し、learnings記録＋ローカルコミット（push しない）。1本でも劣化したら中断
- ロールバック: gitコミット単位で復元（git無し25フォルダは適用前にgit初期化が前提＝既存の改修優先リスト#gitと同時処理）

---

## 5. ポートフォリオとしての見せ方（2案）

### 案A: 「タイタンズ・ゲームミュージアム」— 000-gamesight2 の次世代版インデックス

- **入口URLを1本にする**: GitHub Pages のトップに、全ゲームをタグでフィルタできる一覧ページ。既存 `000-gamesight2`（ランチャー）の思想「ボタンを押せばすぐゲーム」を引き継ぎ、§3のタグ体系でジャンル棚・様式棚・代表作ピックアップを追加
- 構成案（1ページ・依存ゼロ・自分のゲームと同じ流儀で作る）:
  1. ヒーロー: 「3年で100本。全部ブラウザで、いますぐ遊べます。」＋PLAYボタン（ランダム or 代表作）
  2. `#featured` 棚: 各ジャンル代表10本をスクショ付きカードで
  3. 全作品グリッド: タグフィルタ（ジャンル×様式×用途）＋検索
  4. ストーリー1画面: 「仕事×AIゲーム循環」（学び→ゲーム化→研修・営業支援に転用）を図1枚で。採用担当・法人顧客が一番反応する部分
- データソース: `docs/games-index.json`（棚卸し表から生成）。**既存の000-gamesight2は書き換えず**、新フォルダ（例: `194-titans-museum`）として新作扱いで4段ゲート（批評→設計書→実装→learnings）を通す
- 効果: SNS投稿・名刺・プロフィールに貼るURLが1本になる。「積み上がる型」（棚卸し表を更新すればページも更新される）

### 案B: GitHubプロフィールREADME — 「数字で語る」1枚

- `github.com/titan11111/titan11111` リポジトリの README.md（GitHubプロフィール直下に表示される仕組み）
- 構成案:
  1. ヘッドライン: 「保険営業マネジャー × 生成AIゲーム開発 100本」— 3条件（保険知識×AI開発×研修設計）の交差点を1行で
  2. 数字ブロック: 101フォルダ／ジャンル12種／単一HTML49本／iPhone実機主戦場／3MB鉄則
  3. 代表作3本のGIF（各ジャンルから。GIFは各3MB以下・jsDelivr配信の既存知見に準拠）＋「遊ぶ」リンク
  4. ジャンル×本数の表（§3の実測分布をそのまま）
  5. 開発の型: 4段ゲート・レトロ様式10条・自動プレイテストの3点を「個人でもここまで仕組み化している」証拠として見せる
- 効果: 採用担当・技術者が最初に見る場所に「量（100本）×質（仕組み化）」が同時に出る。案Aのミュージアムへの導線を兼ねる

**推奨**: 案A・案Bは排他ではなく **B→A の順で両方**（Bは半日で出せて即効性があり、AはREADME第1波・タグ付け完了後が作りどき）。完成時は外部化ブリッジ（X投稿文・1枚もの）を別途1本提案する。

---

## 6. 実施ロードマップ（すべてタイタン承認後）

| 順 | 作業 | 依存 | ゲート |
|---|---|---|---|
| 1 | 本計画の承認・ジャンル推定の補正 | — | タイタン |
| 2 | README第1波（代表20本）＋games-index.json | §2-3 | 簡易ゲート＋3行紹介はタイタン確定 |
| 3 | GitHubプロフィールREADME（案B） | 2 | タイタンレビュー |
| 4 | README第2波・第3波 | 2 | 簡易ゲート |
| 5 | titans-core Phase 1（新作雛形＋テスト1本） | §4-5承認 | game-play-tester＋実機 |
| 6 | ミュージアム（案A・194番として新作4段ゲート） | 2,3 | 批評→設計書→実装→learnings |
| 7 | titans-core Phase 2（指定改修のみ・1本ずつ） | 5 | 前後比較＋learnings |

**本日変更していないもの（確認済み）**: 既存ゲームコード全部・既存README7本・SPEC.md・docs既存文書・git履歴（コミットなし・pushなし）。

---

## 7. 承認記録（2026-07-19）

- **タイタン承認**: 本計画を承認。進め方は**案B（プロフィールREADME）→ 案A（ミュージアム194番）**の順で確定
- **追加要件（タイタン指示）**: **新作ゲームを追加したら常に更新される仕組みにすること**（積み上がる型）
  - 実装方針: `docs/games-index.json` を手書きせず、フォルダをスキャンして再生成するスクリプト（例: `docs/generate-games-index.sh`）を README第1波と同時に作る
  - 案A（ミュージアム）は games-index.json を実行時に読む構成にし、JSONを再生成すればページも自動で最新化
  - 案B（プロフィールREADME）の数字ブロックも同スクリプトから出力し、手動転記をなくす
  - 配線: `/game-publish`（公開フロー）の最終ステップに「index再生成」を組み込む
- **投入日**: W30の平日夜（2026-07-21以降）。着手順はロードマップ§6どおり（①ジャンル推定補正 → ②README第1波＋index生成スクリプト → ③案B → …）
- 決定ログ: `~/.company/ceo/decisions/2026-07-19-github-portfolio-plan-approved.md`
