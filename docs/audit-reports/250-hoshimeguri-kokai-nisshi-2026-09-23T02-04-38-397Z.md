# コード監査レポート: 250-hoshimeguri-kokai-nisshi

- 判定: **コード監査上の問題あり**（○ 26 / × 3 / ― 4）
- × の内訳: **機械箱 3件**（ループが直す） / **人間箱 0件**（タイタンが決める）
- 実行: 2026-09-23T02:04:38.398Z
- ツール: `_tools/audit.mjs`（静的監査・対象フォルダは無変更）

> この監査は静的解析のみに基づく。実機でのプレイ挙動は検証していない。
> 動的検証は `_tools/game-harness.mjs`、実機確認は人間の責務。

# 監査明細

## 1. 実装確認

| 項目 | 判定 | 箱 | 根拠 |
|---|:---:|:---:|---|
| 必要なファイルが存在する（index.html） | ○ | ⚙️ | index.html を検出（187768バイト） |
| スタイルとスクリプトが実装されている | ○ | ⚙️ | CSS: 1ファイル＋インライン<style>あり / JS: 2ファイル＋インライン<script>1件 |
| 未使用アセットがない | ○ | 👤 | アセット4件すべてコード内から参照を検出 |
| 読み込まれていないJS/CSSがない（死にファイル） | ○ | ⚙️ | JS/CSS 3件すべて <script src> / <link href> から参照を検出 |
| 重複コードがない（同名function重複定義） | ○ | ⚙️ | トップレベルfunction宣言 132件、同名重複0件 |

## 2. 構文確認

| 項目 | 判定 | 箱 | 根拠 |
|---|:---:|:---:|---|
| HTMLエラーなし（タグ開閉・id重複） | ○ | ⚙️ | HTML 1ファイル: 主要7タグの開閉一致・id重複0件 |
| CSS構文エラーなし（括弧・コメント） | ○ | ⚙️ | CSS 1ファイル＋インライン: {} 対応一致・コメント閉じ漏れ0件 |
| JavaScript構文エラーなし（node --check） | ○ | ⚙️ | 3スクリプトを node --check でパース、全件成功 |

## 3. 依存関係確認

| 項目 | 判定 | 箱 | 根拠 |
|---|:---:|:---:|---|
| 読み込み順が正しい（defer/module or body内） | ○ | ⚙️ | 外部script 2件すべて defer/module または <body>内に配置 |
| 参照切れがない（該当ファイルがフォルダ内に存在しない） | ○ | 👤 | ローカル参照 7件すべて実ファイルに解決（外部URL 0件は対象外） |
| 画像・音声・SVGのパス切れがない | ○ | 👤 | アセット参照 4件すべて実在（画像0／音声4） |
| 外部CDN依存 | ― | 👤 | 外部URL参照0件＝GitHub Pagesでの外部依存なし |

## 4. 既存機能への影響確認（回帰）

| 項目 | 判定 | 箱 | 根拠 |
|---|:---:|:---:|---|
| 未コミットの変更がない（差分の追跡可能性） | × | ⚙️ | 未コミット5件: M index.html, ?? Beneath_the_Silver_Pull.m4a, ?? Beyond_the_Gravity_Well.m4a, ?? Beyond_the_Last_Horizon.m4a, ?? Drifting_Past_The_Great_Divide.m4a |
| コンソールエラーが増えていない | ― | ⚙️ | 過去レポート32件あり。静的監査では動的エラーを測れないため harness の結果で判定すること |
| 新たな警告が発生していない | ― | ⚙️ | 静的監査ではランタイム警告を観測できない（harness側の責務） |

## 5. iOS適合確認

| 項目 | 判定 | 箱 | 根拠 |
|---|:---:|:---:|---|
| viewport設定（device-width＋拡大禁止） | ○ | ⚙️ | content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover" |
| touch-action | ○ | ⚙️ | CSSに touch-action 宣言 9件、うち none/manipulation 8件 |
| user-select / -webkit-user-select | ○ | ⚙️ | user-select 宣言 4件（-webkit-プレフィクス: あり） |
| タップハイライト・長押しメニュー抑止 | ○ | ⚙️ | -webkit-tap-highlight-color:transparent = あり / -webkit-touch-callout:none = あり |
| ダブルタップズーム防止（touchend/touchmove） | ○ | ⚙️ | touchendハンドラ: あり / touchmove preventDefault: あり |
| safe-area対応 | ○ | ⚙️ | env(safe-area-inset-*) を 8箇所で使用 |
| スクロール・バウンス防止 | ○ | ⚙️ | html/body に overflow:hidden または position:fixed を検出 |
| BGM開始処理（ユーザージェスチャー内でunlock） | ○ | ⚙️ | AudioContext: あり / ジェスチャーイベント: あり / resume()orサイレントバッファ: あり |
| BGMループ設定 | ○ | ⚙️ | .loop = true または <audio loop> を検出 |
| コントローラー配置（オンスクリーン操作） | ○ | ⚙️ | 操作系のid/class を 44件検出（touchstart/pointerdownハンドラ: あり） |
| position・z-indexが競合していない | × | ⚙️ | 同一z-indexの多重使用: z=1が3件（重なり順が不定になる） |

## 6. 品質確認

| 項目 | 判定 | 箱 | 根拠 |
|---|:---:|:---:|---|
| モバイル20MB鉄則 | ○ | ⚙️ | 合計 6.31MB（上限20.00MB・12ファイル）／重い順: Beyond_the_Last_Horizon.m4a 1.41MB, Beyond_the_Gravity_Well.m4a 1.38MB, Beneath_the_Silver_Pull.m4a 1.37MB |
| 不要なデバッグ出力が残っていない | × | ⚙️ | console.log/debug/info 5件が残存 |
| 命名規則が統一されている（camelCase） | ○ | ⚙️ | function 132件中 camelCase 132件（100%）／snake_case 0件 |
| ファイル構成が標準要件通り（サブフォルダは images/ audio/ のみ） | ○ | ⚙️ | 直下のみのフラット構成（サブフォルダ0件） |
| SPEC.md が存在する（合格条件の定義元） | ○ | 👤 | SPEC.md を検出（13460バイト） |

## 7. 最終チェック

| 項目 | 判定 | 箱 | 根拠 |
|---|:---:|:---:|---|
| 全項目に根拠1行が付いている | ○ | ⚙️ | 31項目すべてに根拠テキストを出力 |
| Obsidianへ記録済み | ― | ⚙️ | ObsidianのMCP接続が未認証のため、本ツールはローカルmdのみ出力する |

## ⚙️ 機械箱 — ループが直す（上から順に1周1件）

1. **未コミットの変更がない（差分の追跡可能性）**（4. 既存機能への影響確認（回帰）） — 未コミット5件: M index.html, ?? Beneath_the_Silver_Pull.m4a, ?? Beyond_the_Gravity_Well.m4a, ?? Beyond_the_Last_Horizon.m4a, ?? Drifting_Past_The_Great_Divide.m4a
2. **position・z-indexが競合していない**（5. iOS適合確認） — 同一z-indexの多重使用: z=1が3件（重なり順が不定になる）
3. **不要なデバッグ出力が残っていない**（6. 品質確認） — console.log/debug/info 5件が残存
