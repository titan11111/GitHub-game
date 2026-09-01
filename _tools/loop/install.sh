#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"; . "$SCRIPT_DIR/lib.sh"
settings="$REPO_ROOT/.claude/settings.json"; mkdir -p "$REPO_ROOT/.claude"
backup="$settings.backup.$(date +%Y%m%d-%H%M%S)"
if [ -f "$settings" ]; then cp "$settings" "$backup" || exit 2
else printf '%s\n' '{"_backup_state":"settings.json did not exist"}' > "$backup" || exit 2; fi
python3 - "$settings" "$SCRIPT_DIR/handoff.sh" <<'PY'
import json,pathlib,sys
p=pathlib.Path(sys.argv[1]); command=sys.argv[2]
if p.exists():
 try:d=json.loads(p.read_text())
 except Exception:raise SystemExit(2)
else:d={}
stop=d.setdefault("hooks",{}).setdefault("Stop",[])
def ours(e):return any(isinstance(h,dict) and h.get("command")==command for h in (e.get("hooks",[]) if isinstance(e,dict) else []))
stop[:]=[e for e in stop if not ours(e)]
stop.append({"hooks":[{"type":"command","command":command}]})
t=p.with_suffix(p.suffix+".tmp");t.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n");t.replace(p)
PY
code=$?; [ "$code" -eq 0 ] || exit "$code"; printf '%s\n' "$backup"
