#!/bin/bash
# ワンコマンドプレビュー: ローカルサーバ起動＋ブラウザ自動オープン
# 使い方: ~/Desktop/GitHub-game/_tools/preview.sh 109-110-カラスの逆襲 [ポート番号]
set -eu
DIR="${1:?使い方: preview.sh <フォルダ名> [ポート]}"
PORT="${2:-8901}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$ROOT/$DIR"
[ -d "$TARGET" ] || { echo "❌ フォルダが見つかりません: $TARGET"; exit 1; }
[ -f "$TARGET/index.html" ] || echo "⚠️  index.html がありません（配信は続行します）"
( sleep 0.8; open "http://localhost:$PORT" ) &
echo "▶ $DIR を http://localhost:$PORT で配信中（停止: Ctrl+C）"
cd "$TARGET" && exec python3 -m http.server "$PORT"
