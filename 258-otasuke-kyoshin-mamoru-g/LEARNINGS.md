# 258 おたすけ巨神マモルG — LEARNINGS

## 2026-09-24

### 1. Playwright の WebKit は AAC をデコードできない（harness の偽陽性）

`game-harness.sh` が `リクエスト失敗: 2件`（`bgm.m4a` / `end.m4a`）で FAIL する。

**切り分けた結果**:

| 検査 | 結果 |
|---|---|
| WebKit（Playwright）での `<audio>.error.code` | **4 = MEDIA_ERR_SRC_NOT_SUPPORTED**（404ではない） |
| WebKit での `play()` | `NotSupportedError: The operation is not supported.` |
| **Chromium（Playwright）** | `readyState:4` / エラーなし / **再生位置が 3.19秒まで進行＝実際に鳴っている** |
| `canPlayType` | aac/he-aac/ogg/opus すべて `probably` を返す＝**当てにならない** |

→ ファイルもサーバも正常。**テスト用WebKitビルドにプロプライエタリコーデックが入っていないだけ**。
HE-AAC を LC-AAC に替えても同じ（両方 AAC）。Ogg/Opus なら WebKit は通るが **iOS Safari が対応しない**ので、
両方を満たす単一フォーマットは存在しない。

**未解決**: iPhone実機で鳴るかは未確認。**実機確認が必要**（この環境では原理的に検証できない）。

### 2. Playwright の evaluate は主世界の変数を見られない（テスト設計の落とし穴）

`page.evaluate` から `missions` / `points` / `showEnding` が `undefined`。
`typeof helped` だけ `'object'` を返すのは、**変数ではなく `id="helped"` のDOM要素**を拾っていたため。
`document.createElement('script')` を注入しても同じで、top-level の `let/const/function` へは届かなかった。

**結論**: 内部状態に触るテストは書かない。**HUDに表示されている情報だけを読む**（`#helped` `#pts` `#clabel` `#arrow` `#prompt`）。
結果として「子どもが画面から得られる情報だけで遊べるか」を測るテストになり、目的にも合っていた。

### 3. `dispatchEvent` は clientX/clientY を運ばない → 仮想スティックが「壊れている」と誤診した

Playwright の `page.dispatchEvent('#joyZone','pointermove',{clientX,clientY})` では座標が乗らず、
`dx=e.clientX-jx0` が常に 0 になり、**ロボが1ミリも動かなかった**。
`page.mouse` も `hasTouch` コンテキストでは `#joyZone` に届かない。

**正しい方法**: ページ内で本物の `PointerEvent` を組み立てて投げる。

```js
page.evaluate(([s,t,X,Y])=>{document.querySelector(s).dispatchEvent(
  new PointerEvent(t,{pointerId:11,isPrimary:true,pointerType:'touch',bubbles:true,cancelable:true,clientX:X,clientY:Y}));},[sel,type,x,y]);
```

これで 107m→92m と実際に移動した。**「動かない」と報告する前に、入力が届いているかを先に疑う。**

### 4. `setPointerCapture` の例外がハンドラを途中で殺す

`jz.addEventListener('pointerdown', e=>{ jid=e.pointerId; jz.setPointerCapture(jid); jx0=e.clientX; ... })`

`setPointerCapture` が投げると **`jx0` の代入まで到達しない**。`jid` だけ設定済みなので、
以後のスティック操作が全部おかしくなる（例外は1回、被害は継続）。
→ **capture系は必ず try/catch で囲み、状態の代入をその後ろに置かない**。合成ポインタでも実機の端でも起きる。

### 5. 描画コストはタイトル画面が犯人だった

harness の `描画ループ` が 21〜32 RAF/秒。原因はゲーム本体ではなく、
**不透明な `#title` が全面を覆っているのに、裏で街を毎フレーム描き続けていた**こと。

- タイトル中は `renderer.render()` を呼ばない（最初の3フレームだけ描いて絵を作る）
- `(pointer:coarse)` のときだけ影を縮小（mapSize 1024→768・視錐 ±80→±58・antialias off）

→ harness 61 RAF/秒。**実プレイ中のFPSも別途実測: 静止 60.6 / 歩行中 60.9**（WebKit 390×844 DPR3）。
harness の数字はタイトル画面のものなので、**ゲーム中のFPSとは別に測って併記する**。

### 8. 3面は「街を増やさず、見せ方とミッションで分ける」（2026-09-24）

5面・324区画はiPhoneの描画が持たない、とSPEC自身が未検証リスクに書いていた。タイタン指示は「3面でいい。3面クリアでエンディング。音楽も」。

- 区画数は36のまま。面の差は空の色・フォグ・地面色・窓の発光・ロボ倍率（1.8 / 3.33 / 5.49）・ミッション4種ずつの入れ替え
- 追加ライトはバイザーの `PointLight` 1個だけ（影なし）
- 音楽は既存の `bgm.m4a` / `end.m4a`。面ごとに `playbackRate` だけ変える。効果音は合成のまま、大きい面ほどドスンを低く大きく、シューは上昇の強さに連動
- 検証（デスクトップChrome、ローカル）: 1面開始でBGMの `currentTime` が進む。2面は夜・倍率3.33・サーチライト強度7。3面は夕焼け `0xFF8A4C`・倍率5.44・海と煙突・💣と🏗が湧く。ポーズでBGMが止まり、再開で戻る。エンディングで `end.m4a` が鳴りBGMは止まる。
- harness（2026-09-24 21:37）: 描画 61 RAF/秒、コンソールエラー 0、通信量 4.09MB。FAIL は `end.m4a` の1件だけで、§1 の WebKit AAC 偽陽性。**iPhone実機は未実施**


### 6. 低学年テストの実測値

| テスト | 結果 |
|---|---|
| ① 説明を読まず ✋だけ14回連打（11秒） | **0人**。「ちかくに こまっている ひとは いないよ」が出るだけ |
| ② コンパスに従って素直に遊ぶ | **10人 / 378秒**（1人あたり平均38秒）。エンディング到達 |
| ③ 上下同時押し→pointercancel→乱ドラッグ＋連打 | 押しっぱなし残り**なし**・JSエラー**0**・FPS 30.9 |

→ ①が課題。**その場で押しても何も起きないゲームなので、「歩く」を最初に教える導線が要る**。

### 7. その他

- トラックの持ち方は固定アンカー（`aTop`）ではなく **両手メッシュの世界座標の中点**から毎フレーム算出する方式へ。
  どんな姿勢でも「両手で持っている」絵になり、荷物の長辺を両手を結ぶ線に合わせられる
- BGMは `afconvert -f m4af -d aach -b 80000` で 4.35MB → 1.81MB（HE-AAC）
- エントリを `index.html` へ改名。**git履歴に旧名 `mamoru-g.html` が存在しないのでリダイレクト不要**（鉄則8）

## 2026-09-25

### 2面の付き添い照明を、街の巨石を山へ運ぶに変えた

`darkwalk`（足元を照らし続けて家まで歩く）はタイタン判断で難しい。2面のプールから外し、`boulder` に差し替えた。

- 巨石は街の南側（z≥20 の歩道）に湧く。北のがけ（既存の山）のうち、石のXにいちばん近い頂上が行き先
- 操作は既存の両手持ち。山の上（`groundAt>10`）に着地すると 150pt。道の上ではおろせない
- 夜の見た目と、車・犬・迷子の3種はそのまま
- 検証: esbuild パース成功。ブラウザで石を街（例 x=-86.3, z=100.3、吹き出し「おおきな いしが おちてきた！」）に出し、山の上（z=-181.3, 地面高さ 35.4）で着地すると助けた人数 0→1、得点 0→150。道の上（地面高さ 0）では完了しないことも別テスト20回で確認。iPhone実機は未実施
