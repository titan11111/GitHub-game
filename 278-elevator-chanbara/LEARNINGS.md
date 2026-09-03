# 278-elevator-chanbara ｜ learnings

## 2026-09-03 ｜ 採番・リポジトリ配置

### やったこと
- Desktop の単体HTML（`elevator-chanbara.html`）をリポジトリへ採番配置
- 採番は既存最大 277 の次＝**278**。1200番台のような例外採番はしない（鉄則2）
- `.nojekyll` / `SPEC.md` を同時に作成し、harness を通してから初回コミット

### 検証Evidence
```
_tools/game-harness.sh 278-elevator-chanbara → RESULT PASS（8項目）
  index.html存在 / モバイル幅390px / Canvas 800×600 / 描画61 RAF/秒
  タップ送信成功 / コンソールエラー0 / リクエスト失敗0 / 0.02MB
docs/harness-reports/278-elevator-chanbara-2026-09-03T10-54-36-893Z.md
```

### 学び
1. **単一HTML・外部依存ゼロは harness を一発で通る**。23KBで20MB鉄則の0.1%。
   アセットを持たない設計は、そのまま公開ゲートの通過コストの低さになる
2. **`pointerdown/up/cancel/leave` の4点セット**で仮想パッドを組むと、
   `click` 由来のタップ遅延も、指が滑ったときのボタン押しっぱなしも同時に消える
3. **高さを「維持コストのある資源」にすると読み合いが生まれる**。
   籠が0.17px/fで自然降下する仕様のせいで、上を取り続けるには入力を払い続けねばならず、
   「攻めるか、高さを守るか」の択が常時発生している

### 未検証（言い切らない）
- iPhone実機でのタップ反応・昇降の操作感は**未計測**（harnessのWebKit自動テストのみ）
- safe-area 非対応。ノッチ端末で下部ボタンがホームバーに被る可能性は**未確認**
