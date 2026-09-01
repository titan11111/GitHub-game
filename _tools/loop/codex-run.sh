#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"; . "$SCRIPT_DIR/lib.sh"
gate_open || exit 0; mkdir -p "$LOOP_DIR/processed"; queue_file=""
if [ "${1:-}" = "--task" ]; then
 task="${2:-}"; hid="${HANDOFF_ID:-manual-$(date -u +%Y%m%dT%H%M%SZ)-$$}"; sid="${SESSION_ID:-manual}"; depth="$(( ${LOOP_DEPTH:-0}+1 ))"
else
 queue_file="$(find "$QUEUE_DIR" -maxdepth 1 -type f -name '*.json' -print | sort | head -n 1)"; [ -n "$queue_file" ] || exit 0
 task="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["task"])' "$queue_file")" || exit 2
 hid="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["handoff_id"])' "$queue_file")" || exit 2
 sid="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1])).get("session_id",""))' "$queue_file")" || exit 2
 depth="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1])).get("depth",1))' "$queue_file")" || exit 2
fi
case "$depth" in (*[!0-9]*|'') depth=1;; esac
if [ "$depth" -gt "$MAX_DEPTH" ]; then printf '0\n' > "$DEPTH_FILE"; exit 3; fi
printf '%s\n' "$depth" > "$DEPTH_FILE"; bin="${LOOP_CODEX_BIN:-codex}"
ts0="$(now_iso)"; e0="$(now_epoch)"; "$bin" exec "$task"; c=$?; ts1="$(now_iso)"; e1="$(now_epoch)"
log_event codex "$bin exec" "$c" "$ts0" "$ts1" "$((e1-e0))" "$hid" "$sid"
if [ "$c" -ne 0 ]; then printf '0\n' > "$DEPTH_FILE"; exit "$c"; fi
HANDOFF_ID="$hid" SESSION_ID="$sid" "$SCRIPT_DIR/verify.sh"; verify_code=$?
HANDOFF_ID="$hid" SESSION_ID="$sid" "$SCRIPT_DIR/to-obsidian.sh" "$verify_code"; obsidian_code=$?
st0="$(now_iso)"; se0="$(now_epoch)"
if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
 curl -fsS -X POST -H 'Content-Type: application/json' --data "$(python3 -c 'import json,sys;print(json.dumps({"text":f"Loop {sys.argv[1]} verify exit={sys.argv[2]} obsidian exit={sys.argv[3]}"}))' "$hid" "$verify_code" "$obsidian_code")" "$SLACK_WEBHOOK_URL" >/dev/null; slack_code=$?
else slack_code=2
fi
st1="$(now_iso)"; se1="$(now_epoch)"; log_event slack "notify Slack webhook" "$slack_code" "$st0" "$st1" "$((se1-se0))" "$hid" "$sid"
printf '0\n' > "$DEPTH_FILE"; [ -z "$queue_file" ] || mv "$queue_file" "$LOOP_DIR/processed/$(basename "$queue_file")"
exit "$verify_code"
