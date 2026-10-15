# GitHub-game — ブラウザゲーム制作リポジトリ群

> 毎セッション読む「現在有効な決定と索引」だけを置く。手順の詳細は `docs/rules/`、経緯と当時の数値は `docs/rules/repo-history.md` へ。
> 鉄則を変えたら、同じキーワードを grep して他の節・`docs/rules/`・`.cursor/rules/` の記述も同時に直す。

## これは何か

- 生成AIで作ったHTMLブラウザゲーム群。1フォルダ＝1ゲーム（`NNN-名前`、欠番あり）。非ゲームのディレクトリ（`titans-ui` `titans-core` `_tools` `docs` 等）も同居する
- 本数は書き写さず実測する: `ls -d [0-9]*-*/ | wc -l`
- 公開先は GitHub Pages、主戦場は iPhone。位置づけは仕事のR&D（学び→ゲーム化→法人研修・営業支援へ転用）

## 鉄則

1. **携帯で動くことが基準**。サイズの上限は**20MB鉄則**（旧8MB縛りは廃止）: ゲームフォルダの公開実体（`.git` / `node_modules` / `_playtest` 除外）は合計 20.00MB 以下。超過は監査・harness・公開ゲートで FAIL。無駄ファイル削除と無圧縮MP3の HE-AAC(m4a) 化を優先する
2. **フォルダ番号は変更しない**。`2025年制作生成AIゲーム作品集`（1〜100番アーカイブ）は触らない
3. **push はタイタンの指示があったときだけ**（「公開して」「できた」等の公開指示を含む）。コミットは作業の区切りごとにしてよい。**公開するときは push と Slack 通知を必ずセットで行う**
4. **新作は4段ゲート**: 批評 → 設計書（SPEC.md） → 実装 → learnings記録。**実装の1手目は必ずコントロールパネル**（操作/設定UI）。判断不要の機械的改修（圧縮・git初期化など）は実装＋learnings記録のみでよい。品質劣化が再発したら全面ゲートに戻す
5. **完了報告は証跡つきで言い切る**（旧ファイル削除の確認＋preview / harness の出力）。証跡の無い項目は「未検証」と明言する
6. **改修は頼まれた範囲だけ**。他ゲームへの横展開・共通化・抽象化を頼まれずに始めない
7. **「公開されていたか」は git履歴と本番URLへの実測でしか判定しない**（LEARNINGS.md の本文は証拠にしない）。エントリHTMLを `index.html` へ改名したら旧名はリダイレクトで残し、`_tools/check-legacy-entry.sh` で確認する

## コマンド・ツール

| やること | 方法 |
|---|---|
| ローカルプレビュー | `_tools/preview.sh <フォルダ名>` |
| 自動スモークテスト（エラー・描画・20MB・タップ反応＋証跡レポート） | `_tools/game-harness.sh <フォルダ名>` |
| 静的監査（31項目） | `node _tools/audit.mjs <フォルダ名>`／全数は `_tools/audit-all.mjs` |
| 旧エントリURLの404検出 | `_tools/check-legacy-entry.sh`（404が1件でもあれば exit 1） |
| セキュリティスキャン | `_tools/security-scan.sh` |
| スクリーンショット一括 | `_tools/capture-screenshots.js` |
| iPhone実機サイズ確認 | `/game-local-test` スキル |
| 公開＋Slack通知（「公開して」「できた」） | `/game-publish` スキル（SPEC→iOS→harness→`publish.sh`→Slack）。確認質問しない。**`publish.sh` は Slack を送らない**ので、出力された `SLACK_NOTIFY_TEXT` を AI が Slack コネクターの `slack_send_message` で `C0AMVQGBWFP` へ送る。「送信済」は permalink が返ったときだけ |

## トリガー

- **「ゲーム改修の続き」** → `~/.company/engineering/docs/game-fix-priority-2026-07.md` の優先リストを上から。無ければ対象をユーザーに確認。完了ごとに ✅＋完了日 → learnings記録 → コミット
- **「<フォルダ名>、ループ回して」**（"ループ" の語があれば同じ） → 監査ループ。確認質問せず `docs/rules/audit-loop.md` の手順で回す。止まるのは 👤人間箱に当たったときだけ。`audit.mjs` / `game-harness.mjs` は書き換えない

## コントロールパネル（操作/設定UI）

新作と、その作品を改修するときに守る。既存作品への一括横展開はタイタン指示があるときのみ。

1. ミュートトグルを必ず置く
2. `localStorage` キーは `tg.<フォルダ番号>.<key>`（既存キーの勝手な改名は禁止。セーブが消える）
3. 入力は Pointer Events に統一し `setPointerCapture` を入れる
4. iOS用CSSヘッダーは共通ファイルを参照する（コピペ禁止）
5. プレイヤーが自分で止められる明示ポーズを実装する

部品の置き場は `titans-ui/src/components/Controls/`。理由・実装の定石（仮想パッド・音声unlock）・着手順序: `docs/rules/control-panel.md`

## 実装の禁止事項

- `resizeCanvas()` などのリサイズ処理を毎フレーム呼ばない
- 背景のランダム値を毎フレーム計算しない（事前に配列へ保存）
- DOMノードを毎フレーム `createElement` で増やさない（プール方式）
- `alert()` でゲームオーバーを出さない（画面内に描画）
- デバッグ用 `console.log` を公開前に残さない

## ナレッジの場所（コードを書く前に見る）

| 内容 | 場所 |
|---|---|
| 各ゲームの仕様 | 各フォルダの `SPEC.md`（無い作品は改修時に作る） |
| iOS対応の鉄則 | `/ios-game-base` スキル |
| レトロ風の新作・改修 | `docs/retro-style-guide.md`（必読） |
| ファミコン風デザインシステム | `/game-fc` スキル（実体は `titans-ui/`） |
| ジャンル別開発知見 | Claude Code memory の `knowledge_*_game_dev.md` |
| 監査器の誤判定台帳・autofix昇格 | `docs/audit-calibration.md`（誤判定を見つけたら追記） |
| 決定の経緯・過去の棚卸し数値 | `docs/rules/repo-history.md` |
