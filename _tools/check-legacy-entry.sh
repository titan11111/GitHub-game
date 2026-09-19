#!/bin/bash
# 「かつて公開されていたHTMLが、今は消えている」を検出する（v2: git履歴を証拠にする）
#
# 背景と、v1が間違っていた理由（2026-09-19）:
#   v1 は LEARNINGS.md の本文から旧エントリ名を拾っていた。しかし本文は「作業メモ」であり、
#   そのファイルが実際に公開されたかどうかを何も保証しない。結果、
#   「一度も公開されていないファイル名」を8件中7件も『404の被害』と誤認した。
#   本文は証拠ではない。git履歴が証拠。
#
# v2の判定:
#   各ゲームの独自リポジトリで、
#     (1) git履歴のどこかに存在した .html で
#     (2) HEAD には存在しない もの
#   を「かつて公開され、今は消えたURL」と見なし、本番URLへcurlを撃って404を確認する。
#
# 使い方:
#   _tools/check-legacy-entry.sh            # 全フォルダ
#   _tools/check-legacy-entry.sh 231-sky-reign

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
USER_NAME="titan11111"
cd "$ROOT"

targets=("$@")
if [ ${#targets[@]} -eq 0 ]; then
  targets=(); for d in */; do targets+=("${d%/}"); done
fi

ng=0; checked=0
for d in "${targets[@]}"; do
  [ -d "$d/.git" ]       || continue
  [ -f "$d/index.html" ] || continue

  # 履歴に一度でも登場した .html
  past=$(git -C "$d" log --all --pretty=format: --name-only --diff-filter=A -- '*.html' 2>/dev/null | sort -u | grep -v '^$')
  [ -n "$past" ] || continue

  for f in $past; do
    # HEAD にあるなら現役。対象外
    git -C "$d" cat-file -e "HEAD:$f" 2>/dev/null && continue
    checked=$((checked+1))
    code=$(curl -s -m 15 -o /dev/null -w '%{http_code}' "https://$USER_NAME.github.io/$d/$f")
    added="$(git -C "$d" log --diff-filter=A --date=short --pretty=tformat:'%h %ad' -1 -- "$f")"
    if [ "$code" = "404" ]; then
      echo "NG  $d/$f -> 404   （公開されていた証拠: ${added}）"
      ng=$((ng+1))
    else
      echo "ok  $d/$f -> $code"
    fi
  done
done

echo "---"
echo "かつて公開され今はHEADに無いHTML: ${checked}件 / うち404: ${ng}件"
if [ "$ng" -gt 0 ]; then
  echo ""
  echo "直し方: 旧ファイル名で1行リダイレクトHTMLを置き直す"
  echo '  <meta http-equiv="refresh" content="0; url=./index.html">'
  echo '  <script>location.replace("./index.html" + location.search + location.hash);</script>'
  exit 1
fi
exit 0
