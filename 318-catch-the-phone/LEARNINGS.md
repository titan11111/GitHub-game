# LEARNINGS.md — 318-catch-the-phone

## 2026-10-12 フォルダ整理・改名（318-day090 → 318-catch-the-phone）
- 318に置かれていたのは07:39の旧版（タイミングボタン版）だった。最新は `161-パワポサンプル/catch-the-phone` の08:46版（接触キャッチ版）。SHA-256で判定し、最新版を318直下へ置いた
  - 現行 `index.html`: `30337e69…cc41e`（`_playtest/CHECKS.md` 記載値と一致）
  - 旧版: `3a91febf…115b7` → `_playtest/timing-version-0739/` に保管
- 入れ子の `catch-the-phone/` をやめ、`index.html` をフォルダ直下へ。監査・ハーネス・Pagesはどれも `<フォルダ>/index.html` を前提にしている
- 検証の画面とJSON（9.2MB）は `_playtest/` へ。20MB鉄則の計算から外れ、公開実体は1.33MB
- README.md と STAGE-PLAN.md は内容を SPEC.md へ統合して削除
- 未公開のため旧URLなし・リダイレクト不要。`161-パワポサンプル` 側は変更していない
- 改名前の実測：audit ○14 ×13 ―6／harness FAIL 2件（描画6RAF/秒・タップtimeout）。どちらも未修正
  - タップtimeoutの原因：DOM先頭の `button` が非表示の `#leaveRoom`。ハーネスは最初の `button` を叩く
  - 「参照切れ three」「死にファイル three.module.js」は importmap の偽陽性（`docs/audit-calibration.md` 2026-09-27 に既出）
- 実ブラウザ（Apple M2・幅375px）でタイトル画面の表示を確認。プレイ中のフレームレートとiPhone実機は未確認

## 教訓
- コピーで作品を移すときは、移す前に本体のハッシュと更新時刻を比べる。同名フォルダが2か所にあると、古い方を正本にしやすい
