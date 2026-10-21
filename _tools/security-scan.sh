#!/bin/bash
# セキュリティスキャン — GitHub-game
# 使い方: bash security-scan.sh
# または: bash security-scan.sh 138-Bookshot  （特定ゲームのみ）

TARGET=${1:-.}
REPORT_DATE=$(date "+%Y-%m-%d")
REPORT_FILE="docs/security-report-${REPORT_DATE}.md"

echo "# セキュリティスキャンレポート — ${REPORT_DATE}" > "$REPORT_FILE"
echo "対象: ${TARGET}" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

CRITICAL=0
WARNING=0
OK=0

echo "🔍 スキャン開始: ${TARGET}"
echo ""

# JS/HTMLファイルを対象に検索
FILES=$(find "$TARGET" -type f \( -name "*.js" -o -name "*.html" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/_template/*" \
  ! -path "*/_shared/*" \
  ! -name "security-scan.sh" \
  2>/dev/null)

for FILE in $FILES; do
  ISSUES=""

  # 1. innerHTML にユーザー入力を渡しているパターン
  if grep -q "innerHTML\s*=" "$FILE" 2>/dev/null; then
    COUNT=$(grep -c "innerHTML\s*=" "$FILE")
    ISSUES="${ISSUES}\n  ⚠️  innerHTML使用: ${COUNT}箇所"
    WARNING=$((WARNING + 1))
  fi

  # 2. eval() 使用
  if grep -Eq "(^|[^a-zA-Z])eval\s*\(" "$FILE" 2>/dev/null; then
    ISSUES="${ISSUES}\n  🔴 eval()使用"
    CRITICAL=$((CRITICAL + 1))
  fi

  # 3. APIキー・トークンの直書き（パターン検出）
  if grep -Eq "(api_key|apikey|API_KEY|token|TOKEN|secret|SECRET)\s*=\s*['\"][a-zA-Z0-9_\-]{10,}" "$FILE" 2>/dev/null; then
    ISSUES="${ISSUES}\n  🔴 APIキー/トークン直書き疑い"
    CRITICAL=$((CRITICAL + 1))
  fi

  # 4. console.log 残留
  if grep -q "console\.log" "$FILE" 2>/dev/null; then
    COUNT=$(grep -c "console\.log" "$FILE")
    ISSUES="${ISSUES}\n  ⚠️  console.log残留: ${COUNT}件"
    WARNING=$((WARNING + 1))
  fi

  # 5. http:// 混在（httpsでないURL）
  if grep -Eq "src=['\"]http://" "$FILE" 2>/dev/null; then
    ISSUES="${ISSUES}\n  ⚠️  http://混在(src属性)"
    WARNING=$((WARNING + 1))
  fi

  # 結果出力
  if [ -n "$ISSUES" ]; then
    echo "📄 ${FILE}"
    echo -e "$ISSUES"
    echo ""
    echo "### ${FILE}" >> "$REPORT_FILE"
    echo -e "$ISSUES" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
  else
    OK=$((OK + 1))
  fi
done

# サマリー
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 スキャン完了"
echo "  🔴 Critical: ${CRITICAL}件"
echo "  ⚠️  Warning:  ${WARNING}件"
echo "  ✅ OK:        ${OK}ファイル"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "レポート: ${REPORT_FILE}"

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "## サマリー" >> "$REPORT_FILE"
echo "- 🔴 Critical: ${CRITICAL}件" >> "$REPORT_FILE"
echo "- ⚠️  Warning: ${WARNING}件" >> "$REPORT_FILE"
echo "- ✅ OK: ${OK}ファイル" >> "$REPORT_FILE"
