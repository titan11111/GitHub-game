#!/usr/bin/env bash
# 機械検証のみ。存在するものを順に走らせ、1つでも失敗したら非0で返す。
set -uo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
cd "$REPO_ROOT" || exit 1
RC=0
if [ -n "${LOOP_TARGET:-}" ] && [ -f "_tools/audit.mjs" ]; then
  node _tools/audit.mjs "$LOOP_TARGET" || RC=$?
fi
if [ -n "${LOOP_TARGET:-}" ] && [ -x "_tools/game-harness.sh" ]; then
  ./_tools/game-harness.sh "$LOOP_TARGET" || RC=$?
fi
if [ -f "package.json" ] && grep -q '"test"' package.json 2>/dev/null; then
  npm test --silent || RC=$?
fi
exit "$RC"
