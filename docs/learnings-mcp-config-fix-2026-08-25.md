# learnings: Claude Desktop の MCP サーバーが落ちる件（obsidian / notion）

- 日付: 2026-08-25
- 対象: Claude Desktop（yasukonomacbook-air）の `claude_desktop_config.json`
- ステータス: 原因特定済み / 修正版を作成済み（適用はタイタンの手元作業）
- 実際の設定内容（2026-08-25 確認）: `mcpServers` は slack / notion / obsidian の3つ。うち notion・obsidian が E404。obsidian の `OBSIDIAN_VAULT_PATH` は `/Users/gosho/Documents/Obsidian Vault`
- 詳細版（HTML）: https://claude.ai/code/artifact/2aff531e-bd5d-40ac-8255-6662176dbc49

---

## 症状

Claude Desktop 起動時にオレンジの警告トーストが出る。

- `MCP obsidian: Server disconnected.`
- `MCP notion: Couldn't start this server for Cowork and Code sessions (they run their own copy of it), so they can't use its tools: Connection closed`

## 原因（確定）

`claude_desktop_config.json` に書かれているパッケージ名が **npm に存在しない**。
`npx` がダウンロードを試みて 404 → プロセス即終了 → transport closed、の繰り返し。

証跡（`~/Library/Logs/Claude/mcp-server-obsidian.log` / `mcp-server-notion.log`、2026-08-25T10:21:12Z）:

```
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@modelcontextprotocol%2fserver-obsidian
npm error 404  '@modelcontextprotocol/server-obsidian@*' is not in this registry.

npm error 404  '@modelcontextprotocol/server-notion@*' is not in this registry.
```

公式の `@modelcontextprotocol/server-*` シリーズに **obsidian と notion は存在しない**。
おそらく過去に設定を書いた際、実在しないパッケージ名がそのまま入った（いわゆるハルシネーション由来の設定）。

## 影響範囲

| サーバー | 状態 | 根拠 |
|---|---|---|
| obsidian | ✗ E404 で起動不可 | mcp-server-obsidian.log |
| notion | ✗ E404 で起動不可 | mcp-server-notion.log |
| slack | ○ 正常（tools/list 応答済み） | mcp-server-slack.log |
| Control Chrome | ○ running | mcp-info.json |

**ターミナルの Claude Code には波及しない。**
`claude` コマンドは `claude_desktop_config.json` を読まず、`~/.claude.json` とプロジェクト直下の `.mcp.json` を参照する。
GitHub-game 直下に `.mcp.json` は存在しないことを確認済み（2026-08-25）。

## 対処

### 開発者設定の開き方

1. メニューバー「Claude」→「設定…」（⌘,）
2. 左サイドバー「開発者」
3. 「ローカルMCPサーバー」見出し直下の **「設定を編集」** ボタン → Finder で `~/Library/Application Support/Claude/claude_desktop_config.json` が選択された状態で開く
   - 一覧で異常のあるサーバーには ⚠️ が付く（2026-08-25 時点では notion / obsidian）
4. テキストエディタで編集
5. **⌘Q で完全終了**してから再起動（× で閉じるだけでは設定が再読込されない）

### notion

Cowork 側の Notion コネクタが既に稼働しているため **ブロックごと削除でよい**（機能が重複）。
ローカルで動かす場合の実在パッケージは `@notionhq/notion-mcp-server`（Notion 公式 / v2.5.1）。

```json
"notion": {
  "command": "npx",
  "args": ["-y", "@notionhq/notion-mcp-server"],
  "env": { "NOTION_TOKEN": "ntn_..." }
}
```

### obsidian

Vault は実体が Markdown フォルダなので、**Filesystem MCP を Vault に向けるのが最も堅い**（追加インストール・APIキー不要）。

```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y", "@modelcontextprotocol/server-filesystem",
    "/Users/gosho/Documents/Obsidian Vault"
  ]
}
```

代替: npm の `mcp-obsidian`（v1.0.0、Vault パスを引数に取る）。ただし MCP SDK 0.5.0 と古く更新も止まっているため非推奨。

## 教訓

1. **MCP が「Server disconnected」で落ちたら、まず `~/Library/Logs/Claude/mcp-server-<名前>.log` の末尾を見る。** 原因がそのまま平文で書いてある。推測で設定をいじる前にログ。
2. **設定ファイルに書くパッケージ名は npm registry で実在確認する。** `https://registry.npmjs.org/<パッケージ名>` を開いて 404 が返るなら、その名前は存在しない。
3. **デスクトップ版とターミナル版の Claude は設定ファイルが別。** 混同して片方を直しても、もう片方は変わらない。
   - デスクトップ: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - ターミナル(Claude Code): `~/.claude.json` + プロジェクトの `.mcp.json`

## 適用コマンド（バックアップ付き・JSON構文を壊さない）

```bash
python3 - <<'EOF'
import json, shutil, os
p = os.path.expanduser("~/Library/Application Support/Claude/claude_desktop_config.json")
shutil.copy(p, p + ".bak-2026-08-25")
d = json.load(open(p))
for k in ("notion", "obsidian"):
    d["mcpServers"].pop(k, None)
json.dump(d, open(p, "w"), indent=2, ensure_ascii=False)
print("残ったMCPサーバー:", list(d["mcpServers"]))
EOF
```

実行後 `⌘Q` で Claude を完全終了 → 再起動。

## セキュリティ補足

`claude_desktop_config.json` には `SLACK_BOT_TOKEN`（xoxb-）と `NOTION_API_KEY`（ntn_）が平文で入っている。
設定ファイルを人やチャットに共有した場合は、トークンを再発行しておくのが安全。

## 未確認事項

- ターミナルの `claude` コマンドの不調（別件）。`claude --version` と `claude mcp list` の出力が必要。
