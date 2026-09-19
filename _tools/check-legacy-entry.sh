#!/bin/bash
# 旧エントリURLの404検出（2026-09-19 新設）
#
# 背景: エントリHTMLを `foo.html` → `index.html` に改名すると、
#       本体（フォルダURL）は 200 のままなので気づけないが、
#       改名前に配った `…/foo.html` のリンクだけが静かに 404 になる。
#       harness も audit も「公開されているか」を見ないため、この穴は検出されない。
#
# 使い方:
#   _tools/check-legacy-entry.sh            # 全フォルダを検査
#   _tools/check-legacy-entry.sh 245-raiken-hikari
#
# 判定: 旧エントリ名が (1) ローカルに存在せず (2) 本番URLで 404 → NG
#       exit 1 で落ちる。直し方は同フォルダに1行リダイレクトHTMLを置くこと。

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
USER_NAME="titan11111"
cd "$ROOT"

targets=("$@")
if [ ${#targets[@]} -eq 0 ]; then
  targets=()
  for d in */; do targets+=("${d%/}"); done
fi

ng=0; checked=0
for d in "${targets[@]}"; do
  [ -f "$d/index.html" ]   || continue
  [ -f "$d/LEARNINGS.md" ] || continue

  # LEARNINGS 本文のバッククォート内から .html を拾う（_ . - 数字を許容）
  olds=$(grep -oE '`[A-Za-z0-9_.-]+\.html`' "$d/LEARNINGS.md" 2>/dev/null \
         | tr -d '`' | grep -v '^index\.html$' | sort -u)
  [ -n "$olds" ] || continue

  for o in $olds; do
    # ローカルに実体がある＝現役ファイル or リダイレクト設置済み。対象外
    [ -f "$d/$o" ] && continue
    # 除外リスト（公開名になったことが無いと裏取り済みのもの）
    grep -qE "^$d/$o([[:space:]]|#|$)" "$ROOT/_tools/legacy-entry-ignore.txt" 2>/dev/null && continue
    checked=$((checked+1))
    code=$(curl -s -m 15 -o /dev/null -w '%{http_code}' "https://$USER_NAME.github.io/$d/$o")
    if [ "$code" = "404" ]; then
      echo "NG  $d/$o  -> 404"
      ng=$((ng+1))
    else
      echo "ok  $d/$o  -> $code"
    fi
  done
done

echo "---"
echo "検査した旧エントリ候補: ${checked}件 / 404: ${ng}件"
if [ "$ng" -gt 0 ]; then
  echo ""
  echo "直し方: 該当フォルダに旧ファイル名で以下を置き、publish.sh で公開する"
  echo '  <meta http-equiv="refresh" content="0; url=./index.html">'
  echo '  <script>location.replace("./index.html" + location.search + location.hash);</script>'
  exit 1
fi
exit 0
