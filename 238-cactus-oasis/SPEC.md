# 238-cactus-oasis ｜ サボテンオアシス

## 0. ドキュメント情報

- 仕様書名: サボテンオアシス
- 対象ゲーム: `238-cactus-oasis`
- 作成日: 2026-09-15
- 更新日: 2026-09-15
- ステータス: 実装済み（harness PASS。iPhone 実機は未検証）
- 参照ファイル: `index.html` `style.css` `config.js` `audio.js` `script.js` `three.module.min.js`

## 批評（実装前）

- 対立は明快。「育てる」と「食害を止める」が同時に走るので、植える場所と威嚇のタイミングが判断になる。
- 3Dは iPhone 熱と 20MB が事故点。ローポリ、影は 1024、Three.js は CDN せず同梱する。
- 「妨害」を攻撃ゲーにすると趣旨が死ぬ。威嚇・体で塞ぐ・植える位置が本体。武器は持たせない。
- 操作は植える／水と威嚇の2ボタンに固定する。後付けでボタンを増やさない。

## 1. ゲーム概要

- ジャンル: 3D 育成ディフェンス
- 一言説明: 砂漠の井戸のまわりにサボテンを育て、ラクダの食害を体と声で止める。
- 想定プレイ時間: 3〜6分／1周
- 想定プレイヤー: iPhone 片手（電車）
- クリア体験の要点: 開花したサボテンが6本同時に残っている

## 2. 対象環境

### 必須
- 配信先: GitHub Pages
- 最優先端末: iPhone Safari
- 対応画面幅: 320px〜430px（縦持ち優先、横持ちはパッドを重ねる）
- 実装方式: 静的 HTML / CSS / JS。ビルド不要
- 3D: Three.js r170 を `three.module.min.js` として同梱（外部 CDN なし）

### 任意
- PC: WASD＋Z/X、ポインタでもパッド操作可

## 3. ファイル構成

```text
238-cactus-oasis/
  index.html
  style.css
  config.js
  audio.js
  script.js
  three.module.min.js
  SPEC.md
  LEARNINGS.md
```

画像・音声ファイルは置かない（CanvasTexture と WebAudio 合成）。

## 4. コアループ

1. タイトルでタップ → Audio unlock → プレイ開始
2. 井戸で水を汲む（最大8）
3. 空地に植える（水1消費）
4. そばで水をやり成長を早める（芽→若木→成木→開花）
5. ラクダが端から出現し、一番近いサボテンへ向かう
6. 体で進路を塞ぐと遅くなる。威嚇で一時撤退
7. 開花6本同時で勝利。食害5本で敗北

難易度: 開花数が増えるほど出現間隔が短く、同時ラクダ上限が上がる（最大4）。

## 5. 画面 / 状態遷移

- `title` → `playing` → `paused` → `playing`
- `playing` → `win` / `lose` → `title`（再戦）
- バックグラウンド（`visibilitychange` hidden）中は `playing` なら明示ポーズへ落とす。復帰だけでは再開しない

## 6. 操作 / 設定UI（必須・実装1手目）

| 入力 | 動作 |
|---|---|
| 十字キー / WASD / ←↑↓→ | 園丁を移動 |
| A / Z / Space | 空地なら植える。そばのサボテンには水やり（押しっぱなしで加速） |
| B / X | 威嚇（クールダウンあり。近距離のラクダが逃げる） |
| 一時停止ボタン / P / Esc | 明示ポーズ。`<dialog>` で再開・音・タイトル |
| ミュートボタン / M | BGM+SE 一括ミュート |

- 入力は Pointer Events 単一。`setPointerCapture` 必須
- 仮想パッドは DOM オーバーレイ。`aria-label="十字キー"`
- ボタン最小 56px、`:active` は 80ms 以内、`navigator.vibrate(15)`
- ミュートとポーズはプレイ中いつでも押せる（親指帯＋右上）

### localStorage

| キー | 内容 |
|---|---|
| `tg.238.muted` | `"1"` でミュート |
| `tg.238.best` | 同時開花の自己ベスト（整数） |

## 7. 勝敗条件

- 勝利: ステージ3（開花）のサボテンがフィールドに6本以上
- 敗北: 食害カウントが5に到達
- ベスト: その周の最大同時開花数を `tg.238.best` と比較して保存

## 8. UI

- 左上 HUD: 水、開花、食害（`textContent` のみ）
- 右上: ミュート、ポーズ
- 下 25%: 十字＋A/B
- タイトル / 勝敗はオーバーレイ1枚。同時に複数モーダルを出さない

## 9. 音声

- WebAudio 合成のみ（ファイルなし）
- 初回タップで unlock → `AudioContext.resume` → BGM 開始
- ミュートはマスターゲイン0。状態は `tg.238.muted`

## 10. 今回試す最新プログラム（5つ以上・必須）

1. **import maps + ES modules** で Three.js r170 をローカル解決する
2. **WebGL2**（Three.js `WebGLRenderer`）＋ **PCFSoftShadowMap** ＋ **InstancedMesh**（岩）
3. **Pointer Events + `setPointerCapture`**
4. **Web Audio API** で BGM/SE を手続生成
5. **ResizeObserver + visualViewport** で canvas / DPR 追従
6. **CSS `@layer` / ネスト / `oklch()`**
7. **`HTMLDialogElement`** で明示ポーズ
8. **View Transitions API**（未対応なら即フォールバック）
9. **`crypto.randomUUID`** でエンティティ ID

## 11. 実装制約

- 公開実体 20MB 以下
- 外部 CDN 禁止（監査の人間箱）
- `innerHTML` に外部入力を渡さない
- `eval` / `Function` 禁止
- 本番に `console.log` を残さない
- iOS: viewport / safe-area / ダブルタップ防止 / Audio unlock / 75/25 シェル

## 12. テスト項目

- タイトルタップで音が鳴る（iOS 想定）
- 植える・水やり・威嚇が pointerdown で即反応する
- 指がボタン枠外に出ても capture で入力が切れない
- ラクダがサボテンを食べ、威嚇で逃げる
- 開花6で勝利、食害5で敗北
- ミュートとベストがリロード後も残る
- 明示ポーズで時間が進まない
- フォルダサイズ 20MB 以下

## 13. 未確定事項

- iPhone 実機の熱・FPS は未計測（シミュレータ / harness で代替）
- WebGPURenderer は iOS の安定性が不足するため今作では使わない
