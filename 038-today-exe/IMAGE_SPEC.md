# TODAY.exe — 画像制作指示書（DAY 038）

現状のゲームは **画像ゼロで完全動作** する。ここに書くのは「あとから足すと良くなる」素材の仕様書。
配置先：`038-today-exe/images/`（プロジェクト鉄則。`assets/img/` ではない）

---

## 0. 全体トンマナ

| 項目 | 指定 |
|---|---|
| コンセプト | Windows 95 × サイバーパンク × レトロPC |
| 解像度感 | ドット絵（1px = 実寸2〜3px想定）。アンチエイリアス無し |
| ベースカラー | 背景 `#0a0a12` / パネル `#10121f` / Win95グレー `#c0c0c0` |
| アクセント | シアン `#00f0ff` / マゼンタ `#ff2bd6` / ライム `#7fff4d` / アンバー `#ffb300` |
| 危険色 | レッド `#ff3b5c` |
| 禁止 | 写実的な人物、実在ロゴ、グラデ多用のイマドキUI、丸角の多いフラットデザイン |
| 形式 | PNG-8（透過あり）。1ファイル 60KB 以内を目標 |

---

## 1. 優先度A：これだけあれば十分（3点）

### A-1. `ogp.png` — SNS共有・サムネイル
- サイズ：**1200 × 630px**
- 内容：黒背景に大きく `TODAY.exe`（白文字＋シアンとマゼンタの2重ズレ影＝クロマ収差）。
  右上にWin95風の小窓で `DAY 038`。下部に日本語コピー
  「**1日を攻略する。でも頑張りすぎてもいけない。**」
- 背景にうっすら28pxグリッド線（`#141428`）と走査線。
- 生成プロンプト：
```
Retro 90s PC desktop poster, dark navy background with faint cyan grid,
big pixel-font title "TODAY.exe" in white with cyan and magenta chromatic aberration glow,
a small Windows-95 style window in the corner, CRT scanlines overlay, cyberpunk synthwave palette,
flat, no photorealism, no people, 1200x630
```

### A-2. `favicon.png` — タブアイコン
- サイズ：**64 × 64px**（32/16も書き出す）
- 内容：Win95風の小さいウィンドウ枠の中に、シアンのデジタル時計「7:00」。
- 背景は黒。枠は上/左が白、下/右がダークグレーの立体ベベル。

### A-3. `bg_grid.png` — 画面背景タイル（任意）
- サイズ：**28 × 28px / シームレスタイル**
- 内容：`#0a0a12` 地に `#141428` の1px十字線。
- ※現状CSSの `linear-gradient` で代用済み。差し替えるなら `.screen` の `background-image` を置換。

---

## 2. 優先度B：あると画面が締まる（アイコン12点）

行動ボタンの左に置く **16 × 16px のドットアイコン**。全部同じ線幅・同じ配色で統一すること。

| ファイル名 | 行動 | 絵柄 | 主色 |
|---|---|---|---|
| `ic_mail.png` | メール処理 | 封筒＋未読バッジ | マゼンタ |
| `ic_doc.png` | 資料作成 | 折れ角のある書類＋グラフ棒 | マゼンタ |
| `ic_idea.png` | アイデアを考える | 電球＋放射線 | アンバー |
| `ic_task.png` | 雑務を片付ける | チェックリスト | マゼンタ |
| `ic_meet.png` | 打ち合わせ | 吹き出し2つ | マゼンタ |
| `ic_study.png` | 勉強する | 開いた本 | シアン |
| `ic_rest.png` | 休憩する | 湯気の出るマグ | ライム |
| `ic_walk.png` | 散歩する | 靴跡2つ | ライム |
| `ic_nap.png` | 昼寝する | 枕と「Z」 | ライム |
| `ic_stretch.png` | ストレッチ | 伸びをする棒人間 | ライム |
| `ic_coffee.png` | コーヒーを淹れる | ドリッパー | ライム |
| `ic_sns.png` | SNSを眺める | スマホ＋ハート | ライム |

**共通プロンプト**
```
16x16 pixel art icon, 1px outline, limited palette (black outline, one accent color, white highlight),
flat retro Windows-95 toolbar style, transparent background, no anti-aliasing, centered
```

---

## 3. 優先度C：演出用（イベント差し込み絵）

イベント発生時、メッセージ枠の右に出す **48 × 48px** のドット絵。12種のイベントに対応。

| ファイル名 | イベント |
|---|---|
| `ev_urgent.png` | 急な仕事（点滅する通知ウィンドウ） |
| `ev_pc.png` | PCが固まった（砂時計とエラー窓） |
| `ev_idea.png` | 良いアイデア（光る電球） |
| `ev_coffee.png` | コーヒーブレイク（湯気のマグ） |
| `ev_consult.png` | 同僚から相談（吹き出しと影の人物） |
| `ev_zone.png` | 集中モード（渦を巻くシアンの光） |
| `ev_sleepy.png` | 猛烈な睡魔（垂れる瞼とZ） |
| `ev_outside.png` | 外に出たくなった（明るい窓） |
| `ev_early.png` | 仕事が早く終わった（空のリスト） |
| `ev_motiv.png` | 謎のやる気（炎） |
| `ev_notif.png` | 通知の嵐（重なる通知窓） |
| `ev_sky.png` | 空が綺麗（夕焼けのグラデ窓） |

**共通プロンプト**
```
48x48 pixel art sprite, retro PC game icon, dark navy background, cyan and magenta accent lighting,
CRT feel, 1px black outline, no anti-aliasing, transparent PNG
```

---

## 4. 優先度C：ランク別リザルト絵（5点）

サイズ **96 × 96px**。リザルト画面のランク文字の横に置く。

| ファイル名 | ランク | 絵柄 |
|---|---|---|
| `rank_s.png` | S 最高の一日 | 光る太陽と、閉じたノートPC。金色 |
| `rank_a.png` | A いい一日 | 満たされたマグと夕焼け。ライム |
| `rank_b.png` | B まあ悪くない | 半分だけ消えたタスクリスト。シアン |
| `rank_c.png` | C ちょっと無理した | 傾いた椅子と散らかった机。アンバー |
| `rank_d.png` | D 今日は休もう | 電源の落ちたモニタと毛布。レッド |

---

## 5. 実装時のHTML差し込み位置

| 素材 | 差し込む場所 |
|---|---|
| `favicon.png` | `<head>` に `<link rel="icon" href="images/favicon.png">` |
| `ogp.png` | `<head>` に `<meta property="og:image" content="images/ogp.png">` |
| 行動アイコン | `renderPlay()` の `.choice` 内、`<span class="num">` の直後に `<img class="cic" src="...">` |
| イベント絵 | `.msgbox` の `.evtitle` を flex にして右端に `<img class="evimg">` |
| ランク絵 | `renderResult()` の `.rank` ブロック内、`.rk` の左に配置 |

**必須ルール**
- すべての `<img>` に `alt` を入れる（アイコンは装飾なら `alt=""`）。
- 画像が読めなくてもゲームが成立するよう、CSSで `img{max-width:100%}` と欠損時の余白確保をしておく。
- 画像は色情報を足すだけで、**数値表示・テキストは絶対に画像に置き換えない**（色だけに依存しない、というUI方針を維持するため）。
