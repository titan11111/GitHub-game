#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"; . "$SCRIPT_DIR/lib.sh"
gate_open || exit 0
p="$(mktemp "${TMPDIR:-/tmp}/loop-hook.XXXXXX")" || exit 0
m="$(mktemp "${TMPDIR:-/tmp}/loop-meta.XXXXXX")" || exit 0
trap 'rm -f "$p" "$m"' EXIT
cat > "$p"
python3 - "$p" "$m" <<'PY'
import json,pathlib,re,sys
try:d=json.loads(pathlib.Path(sys.argv[1]).read_text())
except Exception:raise SystemExit(2)
if d.get("stop_hook_active") is True:raise SystemExit(3)
tp=d.get("transcript_path",""); last=""
if not tp:raise SystemExit(4)
try:
 for line in open(tp,encoding="utf-8"):
  try:x=json.loads(line)
  except Exception:continue
  msg=x.get("message",x)
  if msg.get("role")!="assistant" and x.get("type")!="assistant":continue
  c=msg.get("content",x.get("content",""))
  if isinstance(c,list):c="\n".join(q.get("text","") for q in c if isinstance(q,dict) and q.get("type") in (None,"text"))
  if isinstance(c,str):last=c
except OSError:raise SystemExit(4)
hits=re.findall(r"(?m)^HANDOFF:\s*(\S.*)$",last)
if not hits:raise SystemExit(5)
pathlib.Path(sys.argv[2]).write_text(json.dumps({"task":hits[-1].strip(),"session_id":str(d.get("session_id",""))},ensure_ascii=False))
PY
[ $? -eq 0 ] || exit 0
depth=0; [ -f "$DEPTH_FILE" ] && depth="$(cat "$DEPTH_FILE" 2>/dev/null || printf 0)"
case "$depth" in (*[!0-9]*|'') depth=0;; esac
[ "$depth" -lt "$MAX_DEPTH" ] || exit 0
hid="$(date -u +%Y%m%dT%H%M%SZ)-$$"; q="$QUEUE_DIR/$hid.json"
ts0="$(now_iso)"; e0="$(now_epoch)"
python3 - "$m" "$q.tmp" "$hid" "$depth" <<'PY'
import json,pathlib,sys
r=json.loads(pathlib.Path(sys.argv[1]).read_text());r.update(handoff_id=sys.argv[3],depth=int(sys.argv[4])+1)
pathlib.Path(sys.argv[2]).write_text(json.dumps(r,ensure_ascii=False)+"\n")
PY
code=$?; [ "$code" -ne 0 ] || { mv "$q.tmp" "$q"; code=$?; }
ts1="$(now_iso)"; e1="$(now_epoch)"
sid="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1])).get("session_id",""))' "$m")"
log_event handoff "enqueue HANDOFF" "$code" "$ts0" "$ts1" "$((e1-e0))" "$hid" "$sid"
exit "$code"
