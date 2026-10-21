#!/bin/bash
# ゲーム公開リンク生存確認スクリプト

REPORT="/Users/gosho/Desktop/GitHub-game/docs/link-health-$(date +%Y-%m-%d).log"

echo "🔗 ゲームリンク生存確認レポート" > "$REPORT"
echo "作成日時: $(date)" >> "$REPORT"
echo "" >> "$REPORT"

ALIVE=0
DEAD=0

# テスト対象ゲーム（フォルダ:URL）
echo "021-sanpo:https://titan11111.github.io/021-sanpo/" | while IFS=: read FOLDER URL; do
  echo -n "🔍 $FOLDER ... "

  HTTP_CODE=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK"
    echo "✅ $FOLDER: $URL (HTTP $HTTP_CODE)" >> "$REPORT"
  else
    echo "❌ 切断"
    echo "❌ $FOLDER: $URL (HTTP $HTTP_CODE)" >> "$REPORT"
  fi
done

cat "$REPORT"
