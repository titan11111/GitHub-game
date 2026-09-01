#!/usr/bin/env bash
# ④ Obsidian Vault へ検証値つきで追記。VAULT が無ければ非0で返す。
set -uo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
HID="${1:?}"; CC="${2:?}"; VC="${3:?}"; T0="${4:?}"; T1="${5:?}"
VAULT="${OBSIDIAN_VAULT:-$HOME/Vault}"
[ -d "$VAULT" ] || exit 2
DAILY="$VAULT/raw/$(date +%Y%m%d)_loop.md"
mkdir -p "$(dirname "$DAILY")" || exit 3
S="PASS"; [ "$VC" != "0" ] && S="FAIL"
{
  echo ""
  echo "## loop $HID — $S"
  echo "- 開始: $T0 / 終了: $T1"
  echo "- codex exit_code: \`$CC\`"
  echo "- verify exit_code: \`$VC\`"
  echo "- task: $(head -c 300 "$QUEUE_DIR/$HID.task" 2>/dev/null)"
  echo "- log: \`_tools/loop/logs/$HID.verify.log\`"
} >> "$DAILY" || exit 4
exit 0
