# LEARNINGS — 228-mokkin-neko

## 2026-09-08 | 出荷パイプライン一周（SPEC→iOS→harness→公開）

### やったこと
- `SPEC.md` を新規作成。`judge()` のフレーズ判定表・`PAT` の増減値・攻撃条件・`TIERS` をコードから起こして固定した
- Xcodeシミュレータ（iPhone 16 / iOS 18.4 / Safari）で起動を確認
- `_tools/game-harness.sh` を実行し 8項目 PASS

### 証跡
- iOS Safari 実描画: タイトル・8鍵・開始ボタンが正しく表示（スクリーンショット確認済み）。safe-area の余白も適用されている
- harness: `docs/harness-reports/228-mokkin-neko-2026-09-08T14-17-34-265Z.md`
  - Canvas 780×1688 / 描画ループ 61 RAF/秒 / タップ送信成功 / コンソールエラー0 / リクエスト失敗0 / 0.02MB

### 未検証（正直に残す）
- **iOSでのタップ操作を機械的に駆動できていない**。`xcrun simctl` にタップ送出が無く、System Events 経由の座標クリックは Simulator のウィンドウ取得に失敗した。iOSで確認したのは「描画・レイアウト・safe-area」まで
- 音の聴感（実機スピーカーでの猫の声・木琴の音色）
- Playwright WebKit は実行ファイル未導入のため使えず、harness は Chromium で実行している

### 学び
- iOSシミュレータは「描画とレイアウトの検証」には十分だが、**タップ検証の代わりにはならない**。タップの機械検証は harness（Chromium）が担当し、この2つは代替ではなく直列で使う
- `index.html` と `mokkin-neko.html` がバイト単位で同一のまま残っている。公開実体は `index.html` 側。重複解消は未着手
