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
