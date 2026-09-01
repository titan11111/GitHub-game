#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"; . "$SCRIPT_DIR/lib.sh"
hid="${HANDOFF_ID:-manual}"; sid="${SESSION_ID:-}"; verify_code="${1:-2}"
vault="${OBSIDIAN_VAULT:-/Users/gosho/Documents/Obsidian Vault}"
ts0="$(now_iso)"; e0="$(now_epoch)"; cmd="append verification result to Obsidian Daily"
if [ ! -d "$vault" ]; then code=2
else
  daily="$vault/Daily/$(date +%Y-%m-%d).md"; mkdir -p "$(dirname "$daily")"
  { printf '\n### Loop verification %s\n' "$hid"; printf -- '- session_id: `%s`\n' "$sid"; printf -- '- verify_exit_code: `%s`\n' "$verify_code"; printf -- '- recorded_at: `%s`\n' "$(now_iso)"; } >> "$daily"; code=$?
fi
ts1="$(now_iso)"; e1="$(now_epoch)"
log_event obsidian "$cmd" "$code" "$ts0" "$ts1" "$((e1-e0))" "$hid" "$sid"
exit "$code"
