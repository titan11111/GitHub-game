#!/usr/bin/env bash
# .claude/settings.json に Stop フックを追記する。既存設定は必ずバックアップし、既存フックは消さない。
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
SETTINGS="$REPO_ROOT/.claude/settings.json"
mkdir -p "$(dirname "$SETTINGS")"
if [ -f "$SETTINGS" ]; then
  cp "$SETTINGS" "$SETTINGS.bak.$(date +%Y%m%d-%H%M%S)"
else
  echo '{}' > "$SETTINGS.bak.$(date +%Y%m%d-%H%M%S)"
  echo '{}' > "$SETTINGS"
fi
python3 - "$SETTINGS" "$LOOP_DIR/handoff.sh" <<'PY'
import json,sys
p,hook=sys.argv[1],sys.argv[2]
d=json.load(open(p,encoding="utf-8"))
hooks=d.setdefault("hooks",{}); stop=hooks.setdefault("Stop",[])
cmds=[h.get("command") for g in stop for h in g.get("hooks",[])]
if hook not in cmds:
    stop.append({"hooks":[{"type":"command","command":hook,"timeout":10}]})
json.dump(d,open(p,"w",encoding="utf-8"),ensure_ascii=False,indent=2)
print("hook registered:",hook)
PY
echo "→ 有効化するには: touch $GATE_FILE"
echo "→ 止めるには:     rm $GATE_FILE"
