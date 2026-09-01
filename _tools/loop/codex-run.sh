#!/usr/bin/env bash
# ②Codex(exec) → ③機械検証 → ④記録。すべて exit code のみで判定する。
set -uo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
HID="${1:?handoff id}"; SID="${2:-}"
TASK_FILE="$QUEUE_DIR/$HID.task"
[ -f "$TASK_FILE" ] || exit 1
TASK="$(cat "$TASK_FILE")"
cd "$REPO_ROOT" || exit 1

T0=$(now_iso); E0=$(now_epoch)
codex exec --skip-git-repo-check "$TASK" >"$LOG_DIR/$HID.codex.log" 2>&1
CODEX_CODE=$?
T1=$(now_iso); E1=$(now_epoch)
log_event "codex" "codex exec" "$CODEX_CODE" "$T0" "$T1" "$((E1-E0))" "$HID" "$SID"

T2=$(now_iso); E2=$(now_epoch)
"$LOOP_DIR/verify.sh" >"$LOG_DIR/$HID.verify.log" 2>&1
VERIFY_CODE=$?
T3=$(now_iso); E3=$(now_epoch)
log_event "verify" "verify.sh" "$VERIFY_CODE" "$T2" "$T3" "$((E3-E2))" "$HID" "$SID"

"$LOOP_DIR/to-obsidian.sh" "$HID" "$CODEX_CODE" "$VERIFY_CODE" "$T0" "$T3"
OBS_CODE=$?
log_event "obsidian" "to-obsidian.sh" "$OBS_CODE" "$(now_iso)" "$(now_iso)" 0 "$HID" "$SID"

if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
  S="PASS"; [ "$VERIFY_CODE" != "0" ] && S="FAIL"
  BODY="$(python3 -c 'import json,sys;print(json.dumps({"text":sys.argv[1]},ensure_ascii=False))' "[loop $HID] codex=$CODEX_CODE verify=$VERIFY_CODE → $S")"
  curl -sS -X POST -H 'Content-type: application/json' --data "$BODY" "$SLACK_WEBHOOK_URL" >/dev/null 2>&1
  SLACK_CODE=$?
  log_event "slack" "webhook" "$SLACK_CODE" "$(now_iso)" "$(now_iso)" 0 "$HID" "$SID"
fi

if [ "$CODEX_CODE" != "0" ] || [ "$VERIFY_CODE" != "0" ]; then
  echo 0 > "$DEPTH_FILE"
fi
[ "$CODEX_CODE" = "0" ] || exit "$CODEX_CODE"
exit "$VERIFY_CODE"
