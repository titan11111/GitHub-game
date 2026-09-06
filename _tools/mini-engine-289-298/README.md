# mini-engine（289〜298 の共通エンジンと生成元）

289〜298 の10本は、共通のミニエンジンをインライン同梱した単一 `index.html` として配布する。
このフォルダはその**生成元**。

## 重要な前提

- **配布されるのは各ゲームフォルダの `index.html`。それが正本として動く。**
- 各 `index.html` はエンジンを埋め込み済みで単体完結している（このフォルダが無くても動く）
- ここは「10本まとめて直したいとき」のための元ネタ置き場。個別ゲームだけ直すなら
  そのゲームの `index.html` を直接編集してよい（その場合ここは古くなる。手を入れた旨をLEARNINGSに残すこと）

## 中身

| ファイル | 役割 |
|---|---|
| `core.js` | 共通エンジン。DPR対応Canvas・入力（touch/mouse/key）・WebAudio効果音・合成BGM（4小節ループ）・粒子・画面揺れ・タイトル/リザルト・localStorage |
| `games/*.js` | 各ゲーム本体（`window.GAME` を定義するだけ） |
| `manifest.json` | 番号・フォルダ名・タイトル・BGM設定・SPEC本文の元データ |
| `build.mjs` | `index.html` / `README.md` / `SPEC.md` を10本ぶん生成 |
| `playtest.mjs` | Playwright WebKitで16秒間ランダム操作するプレイテスト |

## 使い方

```sh
node _tools/mini-engine-289-298/build.mjs                     # 10本を再生成
node _tools/mini-engine-289-298/playtest.mjs 289-neon-dash    # 自動プレイテスト
_tools/game-harness.sh 289-neon-dash                          # 公式harness
```

## GAME の実装契約

```js
window.GAME = {
  no, key, title, sub, how:[3行], bg, ink, accent, scoreLabel, unit,
  reset(),            // 1プレイ分の初期化
  update(dt),         // 進行（G.over(msg, win) で終了）
  draw(c),            // 世界の描画（HUDとオーバーレイはエンジン側）
  down(x,y), move(x,y), up(x,y),   // 任意
  hud(c), resize()                 // 任意
};
```

エンジン側が提供するもの: `G.W/H` `G.t` `G.runT` `G.score` `G.best` `G.rnd` `G.rint`
`G.clamp` `G.lerp` `G.dist` `G.rr` `G.hit` `G.text` `G.sfx` `G.burst` `G.shake` `G.toast` `G.over`
