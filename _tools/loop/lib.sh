#!/usr/bin/env bash
set -uo pipefail
LOOP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$LOOP_DIR/../.." && pwd)"
QUEUE_DIR="$LOOP_DIR/queue"; LOG_DIR="$LOOP_DIR/logs"
JSONL="$LOG_DIR/loop.jsonl"; GATE_FILE="$LOOP_DIR/.loop-enabled"
DEPTH_FILE="$LOOP_DIR/.depth"; MAX_DEPTH="${LOOP_MAX_DEPTH:-3}"
mkdir -p "$QUEUE_DIR" "$LOG_DIR"
now_iso() { date -u +%Y-%m-%dT%H:%M:%SZ; }
now_epoch() { date +%s; }
log_event() {
  local stage="$1" cmd="$2" code="$3" ts0="$4" ts1="$5" dur="$6" hid="$7" sid="$8"
  local ok=false; [ "$code" = 0 ] && ok=true
  python3 - "$JSONL" "$stage" "$cmd" "$code" "$ts0" "$ts1" "$dur" "$hid" "$sid" "$ok" <<'PY'
import json,sys
p,stage,cmd,code,ts0,ts1,dur,hid,sid,ok=sys.argv[1:11]
r={"ts_start":ts0,"ts_end":ts1,"dur_s":int(dur),"stage":stage,"cmd":cmd,"exit_code":int(code),"ok":ok=="true","handoff_id":hid,"session_id":sid}
with open(p,"a",encoding="utf-8") as f:f.write(json.dumps(r,ensure_ascii=False,separators=(",",":"))+"\n")
PY
}
gate_open() { [ -f "$GATE_FILE" ]; }
