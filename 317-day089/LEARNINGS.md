# LEARNINGS.md — 317-day089

## 2026-10-11 新規作成（セリフ箱RPG）
- 構成：タイトル→DROP（落下6個をタップ回収）→SLASH（なぞり順）→STORY（6拍・4幕）→ED3分岐。単体index.html＋SPEC.mdのみ追加
- 3DはCanvas透視投影の擬似回廊に決定。Three.js同梱・CDNは20MB鉄則と監査回避のため不採用
- BGMは既存 `Hard_Target_Lock.mp3` をaudio要素1つで再生。JPEGはタイトル背景に参照し未参照アセットを残さない
- 合計19.82MB（上限20.00MB）。index.htmlは約24KBに抑制
- ハーネスFAIL→PASSの修正：`<canvas>` がDOM先頭だとタップ対象にcanvasが選ばれ中央が塞がれてtimeout。HUDボタンを先頭にしcanvasにz-index:0を付与して解決
- 落下中ブロックはPlaywrightのtapが安定待機で失敗する（実指では問題なし）。自動検証はpointerdown dispatchで代替
- 通し検証：回収6→斬順6/6→6拍表示→ED→もう一度で再開。pageerrorなし
