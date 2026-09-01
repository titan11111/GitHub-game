#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"; . "$SCRIPT_DIR/lib.sh"
hid="${HANDOFF_ID:-manual}"; sid="${SESSION_ID:-}"; target="${LOOP_VERIFY_TARGET:-}"
ts0="$(now_iso)"; e0="$(now_epoch)"; code=0; cmd=""
if [ -n "$target" ]; then
  cmd="node _tools/audit.mjs $target --no-report"
  (cd "$REPO_ROOT" && node _tools/audit.mjs "$target" --no-report); code=$?
  if [ "$code" -eq 0 ]; then
    cmd="$cmd && _tools/game-harness.sh $target"
    (cd "$REPO_ROOT" && _tools/game-harness.sh "$target"); code=$?
  fi
elif [ -f "$REPO_ROOT/package.json" ] && node -e 'let p=require(process.argv[1]);process.exit(p.scripts&&p.scripts.test?0:1)' "$REPO_ROOT/package.json"; then
  cmd="npm test"; (cd "$REPO_ROOT" && npm test); code=$?
else cmd="no configured mechanical verifier"; code=2
fi
ts1="$(now_iso)"; e1="$(now_epoch)"
log_event verify "$cmd" "$code" "$ts0" "$ts1" "$((e1-e0))" "$hid" "$sid"
exit "$code"
