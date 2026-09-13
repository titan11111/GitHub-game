# 231-sky-reign ｜ SKY REIGN 学び

## 2026-09-13 タイトルとエンディングを「同じ世界の朝と夕」で作る

幕を暗いベタ塗りで覆うと、せっかくの田園が消える。**幕は光であって蓋ではない**。中央の帯を抜いて畦と屋根を見せ、上下だけを締めると、同じCanvasのまま雄大に見える。

- **待機カメラを足した**（`idleUpdate`）。プレイ中しか動かない設計だったので、タイトルは静止画だった。高度300前後まで下ろすと田んぼ・木立・川が読めるようになる（高度470では靄と空色が混ざって灰色になる）
- **HUDは `running` のときだけ描く**。タイトル・リザルトにスコア帯が残っていると、どれだけ幕を作り込んでも「ゲーム画面に文字を載せただけ」に見える
- **夕景はCanvas側のグラデーションで作る**（紫→橙）。CSSの黒スクリムを濃くする方向で夕方を表現すると、ただ暗いだけで茶色く濁る
- 鷹は待機時だけ画面下70%（リザルトは80%）へ下ろし、文字組みと重ねない
- `-webkit-background-clip:text` は `@supports` で囲む。囲まないと非対応環境でタイトルが透明になって消える

### 証跡

- harness: `docs/harness-reports/231-sky-reign-2026-09-13T09-19-58-634Z.md` → **PASS**（14項目すべて。コンソールエラー0・操作盤25.0%・2.70MB）
- WebKit(Playwright) 390×844 で タイトル→プレイ→エンディング を実走キャプチャ（`GAME_TIME` を3秒へ差し替え）。`pageerror` 0件、リザルトカードは stage 内（top34/bottom401 ＜ 633）に収まる
- 公開実体 約5.3MB（20MB鉄則内）
- **iPhone実機の見え方は未検証**

## 2026-09-13 鷹の羽ばたき／滑空／急降下

見下ろしベクターのまま、翼幅と翼端の前後で3ポーズを混ぜる。上昇だけ羽ばたき、天井付近は `vAlt` が毎フレーム0に戻るので滑空のまま。少し落ちただけで急降下に見えないよう、畳みはボタンまたは `vAlt<-90`。

- harness: `docs/harness-reports/231-sky-reign-2026-09-13T04-00-26-103Z.md` → **PASS**
- Chromium 390×844: 天井は翼を広げた滑空、急降下は細長い流線型、離して持ち上がると翼が開閉

## 2026-09-13 田園風景の一段強化

タイル矩形を楕円パッチに変え、バイオームで森・池・集落・田んぼを寄せた。空から畦と屋根が読める密度まで。鷹モーションは未着手。`script.js` はコメント整理で 997 行。

- harness: `docs/harness-reports/231-sky-reign-2026-09-13T03-47-32-197Z.md` → **PASS**

## 2026-09-13 操作盤75/25とミュート位置

ミュートを右上に置くと、Canvas HUD の「捕獲／コンボ」に重なる。ステータスは上、操作は下、がこの作品の正しい分担。

- ハーネス契約どおり `#game-shell` / `#game-stage` 75% / `#control-deck` 25%。IDs を揃えないと iOS 75/25 チェックは `supported:false` で黙ってスキップされる
- ミュートとポーズは操作盤。急降下は HOLD ボタン（`setPointerCapture`）。画面タップの急降下も残す
- canvas を DOM 先頭に置くと harness が開始ボタンではなく canvas を叩き、幕に遮られてタイムアウトする。z-index で背面、DOM 順はボタンが先
- 1000行超を避けるため `style.css` と `script.js` に分割

### 証跡

- harness: `docs/harness-reports/231-sky-reign-2026-09-13T03-31-58-201Z.md` → **PASS**（操作盤 25.0%・境界分離・ボタン48px以上・タップ成功）
- Chromium 390×844: ミュートは操作盤内、HUD帯と非重複。ポーズ ▶／再開 ⏸ を確認
- **iPhone実機の操作感は未検証**

## 2026-09-13 BGM経路の作り直し

昨日は JS で `new Audio()` して `volume` を毎フレーム書いていた。iPhone では `HTMLMediaElement.volume` が効かない。ミュートも音量連動も、実機では通らない。

- `<audio>` を HTML に置き、開始タップの `pointerdown` で `play()`（ジェスチャと再生を同じスタックに乗せる）
- ミュートは `element.muted` と WebAudio のマスターゲイン。キーは既存の `soten-dive-muted` のまま（セーブを消さない）
- `fetch` → `decodeAudioData` は、HTML 再生が失敗した曲だけ遅延で走らせる。両方を先読みすると同一 m4a が二重リクエストになり、harness が `requestfailed` で落とす
- コーデックは AAC-LC 96kbps のまま。Opus ではない
- 検証中に `index.html` が消失していた。Pages の入口なのでリダイレクトを書き戻した

### 証跡

- 構文: `esbuild` + `node --check` → OK。`soten-dive.html` 997行
- harness: `docs/harness-reports/231-sky-reign-2026-09-13T03-21-21-894Z.md` → **PASS**（通信量 2.68MB、リクエスト失敗0、コンソールエラー0）
- Chromium（iPhone 390×844・hasTouch）: 開始タップ後 `data-bgm=play`、`#bgmPlay.paused=false`、`currentTime=2.41`、readyState=4、MediaErrorなし。両 m4a HTTP 200。ミュートで 🔇＋`muted=true`＋`soten-dive-muted=1`、解除で 🔊。pageerror 0
- 公開実体: 5.24MB（20MB鉄則内）
- **iPhone実機の再生は未検証**

## 2026-09-12 BGM実装

### フォルダに置いてあった2曲を、圧縮して本番に繋いだ

`Open Sky.mp3` と `Soaring Horizons.mp3`（Suno、各約5MB・184kbps）がゲームフォルダ直下にあった。
「音楽を実装」はこの2曲を鳴らすことが本体で、合成ループで済ませると置いた素材が死ぬ。

- HE-AAC は手元 ffmpeg の `aac_at` が非対応だったので AAC-LC 96kbps / 44.1kHz に変換
- 置き場は `audio/open-sky.m4a`（2.6MB）と `audio/soaring-horizons.m4a`（2.6MB）
- 元MP3は公開実体から削除（二重持ちすると約15MBになり、圧縮の意味が消える）
- タイトル／リザルトは Open Sky、プレイ中は Soaring Horizons。iOS のため `playsInline` と開始タップ内の `play()`
- 風切り・捕獲・激突は従来どおり WebAudio。ミュートは BGM volume と SE マスターを同時に落とす

### 証跡

- 構文: `esbuild` で script 抽出分をパース → OK。`soten-dive.html` 943行（1000行未超）
- harness: `docs/harness-reports/231-sky-reign-2026-09-12T04-19-06-611Z.md` → **PASS**（通信量 5.23MB、リクエスト失敗0、コンソールエラー0）
- WebKit: 開始タップ後にプレイ曲が選択され `paused=false`、ミュートで volume=0。両 m4a は HTTP 200。headless WebKit では `MediaError.code=4` で currentTime が進まない（AACデコーダ非搭載の既知制限）。**実機で音が出ること自体は未検証**
- ファイル実体: ffmpeg で両 m4a を1秒 WAV にデコードできることは確認済み

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

- harness: `docs/harness-reports/231-day055-2026-09-11T12-56-13-586Z.md` → **PASS（8項目全通過）**（旧フォルダ名 `231-day055` 時点の証跡）
  （修正前は同日 T12-55-26 のレポートでタップ FAIL）
- 目視: タイトル／プレイ中の2画面を Chromium 390×844 DPR2 で撮影、pageerror 0件
- サイズ: 0.03MB（20MB鉄則の0.15%）
