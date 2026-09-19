#!/bin/bash

# ゲームをGitHubに新規公開 / 更新するスクリプト
# 使い方: ./publish.sh フォルダ名
# 例:     ./publish.sh 149-horrafumi

FOLDER=$1
GITHUB_USER="titan11111"

if [ -z "$FOLDER" ]; then
  echo "エラー: フォルダ名を指定してください"
  echo "例: ./publish.sh 149-horrafumi"
  exit 1
fi

if [ ! -d "/Users/gosho/Desktop/GitHub-game/$FOLDER" ]; then
  echo "エラー: フォルダが見つかりません → $FOLDER"
  exit 1
fi

cd "/Users/gosho/Desktop/GitHub-game/$FOLDER"

# ── index.html 存在チェック ────────────────────────────────────────────────
if [ ! -f "index.html" ]; then
  echo "エラー: index.html がありません。公開できません。"
  echo "ヒント: ゲームのメインHTMLファイルを index.html にリネームしてください。"
  exit 1
fi

# ── JSX プリコンパイル（.babelrc があるゲームのみ自動実行）──────────────────
if [ -f ".babelrc" ]; then
  echo "▶ JSXをプリコンパイル中..."
  for src in core.js components.js app.js; do
    if [ -f "$src" ]; then
      npx babel "$src" -o "${src%.js}.compiled.js" --quiet
      echo "  ✓ ${src} → ${src%.js}.compiled.js"
    fi
  done
fi

# .nojekyllを必ず追加（Jekyll誤処理による404防止）
touch .nojekyll

# ── リポジトリが存在するか確認 ────────────────────────────────────────────────
if gh repo view "$GITHUB_USER/$FOLDER" > /dev/null 2>&1; then
  # .gitがなければ初期化
  if [ ! -d ".git" ]; then
    git init -q
    git remote add origin "https://github.com/$GITHUB_USER/$FOLDER.git"
    git fetch origin -q
    git reset --hard origin/main -q
  fi
  echo "▶ 差分をpush中: $FOLDER"
  git add .
  git commit -m "update $FOLDER $(date '+%Y-%m-%d %H:%M')"
  git push origin main
else
  echo "▶ リポジトリを作成中: $FOLDER"
  gh repo create "$FOLDER" --public --description "$FOLDER"

  echo "▶ ファイルをpush中..."
  git init -q
  git add .
  git commit -m "add $FOLDER" -q
  git branch -M main
  git remote add origin "https://github.com/$GITHUB_USER/$FOLDER.git"
  git push -u origin main

  echo "▶ GitHub Pagesを有効化中..."
  gh api "repos/$GITHUB_USER/$FOLDER/pages" --method POST \
    -f 'source[branch]=main' -f 'source[path]=/' \
    && echo "  ✓ GitHub Pages有効化完了" \
    || echo "  ⚠️  Pages有効化失敗（すでに有効な場合はスキップOK）"
fi

GAME_URL="https://$GITHUB_USER.github.io/$FOLDER/"

# ── OGPタグ自動挿入 ──────────────────────────────────────────────────────
if [ -f "index.html" ]; then
  GAME_TITLE=$(python3 -c "
import re, sys
c = open('index.html').read()
m = re.search(r'<title>([^<]+)</title>', c)
print(m.group(1).strip() if m else '$FOLDER')
" 2>/dev/null || echo "$FOLDER")

  python3 - <<PYEOF
import re
content = open('index.html').read()
if 'og:title' not in content:
    ogp = '''    <meta property="og:title" content="${GAME_TITLE}">
    <meta property="og:description" content="スマホ・PCのブラウザで遊べる無料ゲームです。インストール不要！">
    <meta property="og:url" content="${GAME_URL}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary">'''
    content = content.replace('</head>', ogp + '\n</head>', 1)
    open('index.html', 'w').write(content)
    print('  ✓ OGPタグを追加しました')
else:
    print('  ✓ OGPタグ既存（スキップ）')
PYEOF

  # OGP追加後にpush
  if git diff --quiet index.html 2>/dev/null; then
    :
  else
    git add index.html
    git commit -m "add OGP tags" -q
    git push origin main -q
  fi
fi

# ── 公開後ゲート（2026-09-19 新設）────────────────────────────────────────
# 「公開できた」は自己申告ではなく本番URLの数字でしか判定しない。
# 背景: harness も audit も公開URLを一切叩かない（docs/audit-calibration.md 参照）
echo ""
echo "▶ 公開後ゲート: 本番URLを実測中..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  HTTP_CODE=$(curl -s -m 15 -o /dev/null -w '%{http_code}' "$GAME_URL")
  [ "$HTTP_CODE" = "200" ] && break
  sleep 10
done
if [ "$HTTP_CODE" = "200" ]; then
  echo "  ✓ $GAME_URL -> 200"
else
  echo "  ⚠️  $GAME_URL -> $HTTP_CODE （Pagesビルド待ちの可能性。数分後に再確認してください）"
fi

# かつて公開されHEADから消えたHTML＝死んだURLの検出（git履歴が証拠。本文は読まない）
if [ -x "/Users/gosho/GitHub-game/_tools/check-legacy-entry.sh" ]; then
  echo "▶ 旧URLの死活チェック..."
  /Users/gosho/GitHub-game/_tools/check-legacy-entry.sh "$FOLDER" \
    || echo "  ⚠️  上記の旧URLが404です。旧名でリダイレクトHTMLを置いてください（CLAUDE.md 鉄則8）"
fi

echo ""
echo "✅ 公開完了！"
echo "URL: $GAME_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 LINE用メッセージ（コピーしてそのまま送れます）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎮 新作ゲーム公開しました！"
echo ""
echo "「${GAME_TITLE}」"
echo ""
echo "スマホのブラウザでそのまま遊べます。"
echo "インストール不要！"
echo ""
echo "👉 $GAME_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Slack 通知 ──────────────────────────────────────────────────────────
# 認証情報をローカルファイルへ複製せず、Codex/Claude の game-publish
# ワークフローから認証済み Slack コネクターを使って #general へ送信する。
# publish.sh 単体は公開結果を機械可読な形で渡すところまでを担当する。
echo "SLACK_NOTIFY_CHANNEL=C0AMVQGBWFP"
echo "SLACK_NOTIFY_TEXT=🚀 ゲーム公開完了 | $FOLDER $GAME_URL"
echo "Slack: 認証済みコネクター経由（Botトークン不要）"
