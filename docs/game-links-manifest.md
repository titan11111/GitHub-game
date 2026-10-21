# ゲーム公開リンク台帳（二重管理用）

## 管理方針

| 項目 | 場所 | 用途 |
|---|---|---|
| **プライマリ** | GitHub Pages | 本番公開 |
| **セカンダリ** | ローカルバックアップ（tar.gz） | 緊急復旧用 |
| **監視** | check-game-links.sh（週1実行） | リンク生存確認 |

---

## 公開ゲーム一覧

### 021-sanpo（散歩中の事件簿 - レトロ探偵ADV）

| 項目 | 値 |
|---|---|
| **GitHub Pages URL** | https://titan11111.github.io/021-sanpo/ |
| **ローカルパス** | ~/Desktop/GitHub-game/021-sanpo/ |
| **バックアップファイル** | backups/021-sanpo-20260807.tar.gz |
| **公開日** | 2026-08-07 |
| **最終確認** | 2026-08-07 ✅ |
| **ステータス** | ✅ 公開済 |

---

## バックアップ方法

### 作成
```bash
cd ~/Desktop/GitHub-game
tar -czf backups/021-sanpo-$(date +%Y%m%d).tar.gz 021-sanpo/
```

### 復旧
```bash
tar -xzf backups/021-sanpo-20260807.tar.gz
```

---

## リンク監視実行方法

### 手動実行
```bash
bash _tools/check-game-links.sh
```

### 定期実行（毎週月曜 9:00）
```bash
# ~/.claude/hooks/ に以下を追加
schedule: "0 9 * * 1"
command: "bash ~/Desktop/GitHub-game/_tools/check-game-links.sh"
```

---

## リンク生存確認ログ

- 2026-08-07: ✅ 全ゲーム生存確認

---

## 更新履歴

| 日付 | 変更内容 |
|---|---|
| 2026-08-07 | 021-sanpo を追加・バックアップ作成・監視スクリプト導入 |
