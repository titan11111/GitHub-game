#!/usr/bin/env bash
# Claude Code の Stop フックから呼ばれる。①Claude Code → ②Codex の自動受け渡し。
set -uo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

gate_open || exit 0
PAYLOAD="$(cat)"
SID="$(printf '%s' "$PAYLOAD" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("session_id",""))' 2>/dev/null || echo "")"
TRANSCRIPT="$(printf '%s' "$PAYLOAD" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("transcript_path",""))' 2>/dev/null || echo "")"
ACTIVE="$(printf '%s' "$PAYLOAD" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("stop_hook_active",False))' 2>/dev/null || echo "False")"

[ "$ACTIVE" = "True" ] && exit 0
DEPTH=$(cat "$DEPTH_FILE" 2>/dev/null || echo 0)
if [ "$DEPTH" -ge "$MAX_DEPTH" ]; then
  log_event "handoff" "depth-guard" 1 "$(now_iso)" "$(now_iso)" 0 "-" "$SID"
  exit 0
fi

TASK="$(python3 - "$TRANSCRIPT" <<'PY'
import sys,json,io
p=sys.argv[1]; last=""
try:
    for line in io.open(p,encoding="utf-8"):
        try: o=json.loads(line)
        except Exception: continue
        if o.get("type")=="assistant":
            c=o.get("message",{}).get("content",[])
            t="".join(b.get("text","") for b in c if isinstance(b,dict) and b.get("type")=="text")
            if t.strip(): last=t
except Exception: pass
m=[line for line in last.splitlines() if line.strip().startswith("HANDOFF:")]
print(m[-1].split("HANDOFF:",1)[1].strip() if m else "")
PY
)"
[ -z "$TASK" ] && exit 0

HID="$(date +%Y%m%d-%H%M%S)-$$"
echo "$TASK" > "$QUEUE_DIR/$HID.task"
echo $((DEPTH+1)) > "$DEPTH_FILE"
log_event "handoff" "enqueue" 0 "$(now_iso)" "$(now_iso)" 0 "$HID" "$SID"
nohup "$LOOP_DIR/codex-run.sh" "$HID" "$SID" >>"$LOG_DIR/codex-run.out" 2>&1 &
exit 0
