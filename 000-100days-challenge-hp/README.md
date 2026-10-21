# 000 - 100日チャレンジ ホームページ

100日でゲーム100個を作るチャレンジの公式ホームページ。

## 特徴

✅ X（Twitter）投稿から自動でゲーム情報を抽出  
✅ 毎日自動更新（スケジュール実行）  
✅ リアルタイム進捗表示  
✅ SNS シェア対応（OGP 画像自動生成）  

## ファイル構成

```
000-100days-challenge-hp/
├── index.html          # メインホームページ
├── data.json           # ゲームデータ（自動更新）
├── generator.js        # 自動生成スクリプト（Node.js）
├── README.md           # このファイル
└── SPEC.md            # 仕様書
```

## 使い方

### 1. 手動で HP を生成

```bash
node generator.js
```

→ `index.html` が更新される

### 2. 自動生成の設定（毎日 00:00）

スケジュール Claude で毎日自動実行：

```
毎日 00:00 に node generator.js を実行
→ index.html + data.json が最新に
→ GitHub Pages に自動公開
```

## 技術仕様

| 項目 | 詳細 |
|------|------|
| **データ源** | X API v2 |
| **更新頻度** | 毎日 00:00（自動） |
| **生成形式** | HTML + JSON |
| **ホスト** | GitHub Pages |
| **URL** | `https://username.github.io/GitHub-game/000-100days-challenge-hp/` |

## X API 設定

環境変数を設定してください：

```bash
export X_API_BEARER_TOKEN="your_bearer_token"
export X_API_USER_ID="your_user_id"
```

## デモ

サンプルデータで動作確認：

```bash
node generator.js
# → index.html 生成完了
# ブラウザで開く: open index.html
```

## 今後の拡張

- [ ] X API 本実装（現在：サンプルデータ）
- [ ] OGP 画像の動的生成
- [ ] SNS シェアボタンの実装
- [ ] ゲーム動画プレビュー機能
- [ ] タグ別フィルタリング
- [ ] ダーク モード対応

## 開発ノート

- 実装日: 2026-08-11
- エンジニア: Auto Generated
- 状態: 初期版完成（テスト待機中）

---

**プロトタイプ HP** として GitHub Pages で公開可能。本格運用化は X API 認証と自動スケジュール設定が必須。
