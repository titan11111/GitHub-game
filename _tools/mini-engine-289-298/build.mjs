import fs from 'node:fs';
import path from 'node:path';
const HERE=path.dirname(new URL(import.meta.url).pathname);
const ROOT=path.resolve(HERE,'..','..');
const core=fs.readFileSync(path.join(HERE,'core.js'),'utf8');
const man=JSON.parse(fs.readFileSync(path.join(HERE,'manifest.json'),'utf8'));

const css=`*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;background:#05070f;overflow:hidden;overscroll-behavior:none}
body{height:100dvh;display:flex;align-items:center;justify-content:center;
-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;
touch-action:manipulation;-webkit-tap-highlight-color:transparent;
padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
#wrap{position:relative;width:100%;height:100%;max-width:480px;overflow:hidden}
canvas{display:block;width:100%;height:100%;touch-action:none;background:BGCOL}`;

for(const g of man){
  const js=fs.readFileSync(path.join(HERE,'games',g.js),'utf8');
  const dir=path.join(ROOT,g.folder);
  fs.mkdirSync(dir,{recursive:true});
  const html=`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="${g.bg}">
<meta name="description" content="${g.desc}">
<title>${g.no}｜${g.title}</title>
<style>
${css.replace('BGCOL',g.bg)}
</style>
</head>
<body>
<div id="wrap"><canvas id="cv"></canvas></div>
<script>
/* BGM設定（音声ファイルなし・WebAudioで合成した4小節ループ） */
window.BGMCFG=${JSON.stringify(g.bgm)};
</script>
<script>
${js}
</script>
<script>
${core}
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(dir,'index.html'),html);

  const readme=`# ${g.no}｜${g.title}

| 項目 | 内容 |
|---|---|
| 番号 | ${g.no} |
| フォルダ | \`${g.folder}\` |
| ジャンル | ${g.genre} |
| 概要 | ${g.desc} |
| 操作 | ${g.ctrl} |
| プレイ時間 | ${g.len} |

## 起動

\`\`\`sh
_tools/preview.sh ${g.folder}
\`\`\`

または \`python3 -m http.server 8000\` → \`http://localhost:8000/${g.folder}/\`

## 構成

- \`index.html\` 単体で完結（外部CDN・外部アセットなし／音はWebAudio合成）
- iOS対応: ダブルタップズーム禁止・WebAudio unlock・safe-area・Canvas DPR対応
`;
  fs.writeFileSync(path.join(dir,'README.md'),readme);

  const spec=`# SPEC — ${g.no}｜${g.title}

- 作成日: 2026-09-06
- フォルダ: \`${g.folder}\`
- ジャンル: ${g.genre}
- 想定プレイ時間: ${g.len}

## 1. コアループ（何が面白いか）

${g.core}

## 2. 操作

${g.ctrlSpec.map(s=>'- '+s).join('\n')}

片手・親指1本で完結。二本指操作・スワイプジェスチャ・長い説明文を必要としない。

## 3. ルール

${g.rules.map(s=>'- '+s).join('\n')}

## 4. 難易度カーブ

${g.curve}

## 5. 手応え設計（ゲームデザイナー観点）

${g.feel.map(s=>'- '+s).join('\n')}

## 6. 画面構成

- タイトル: 番号 / タイトル / 一行コンセプト / 操作3行 / 「タップでスタート」
- プレイ: 左上に${g.scoreLabel||'SCORE'}、右上にBEST、それ以外はゲーム画面
- リザルト: スコア / ベスト / ハイスコア更新演出 / 「タップでリトライ」

## 7. 技術

- 単一 \`index.html\`（共通ミニエンジンをインライン同梱）
- Canvas 2D / requestAnimationFrame / dt上限0.05秒でタブ復帰時の暴走を防止
- 音: WebAudioのオシレータ＋ノイズ合成（音声ファイル0本）
- 保存: localStorage にベストスコアのみ
- iOS: \`touch-action:none\` / \`gesturestart\`と\`dblclick\`のpreventDefault / safe-area padding / devicePixelRatio上限2.5

## 8. 未実装・今後

${g.todo.map(s=>'- '+s).join('\n')}
`;
  fs.writeFileSync(path.join(dir,'SPEC.md'),spec);
  const bytes=fs.statSync(path.join(dir,'index.html')).size;
  console.log(`OK ${g.folder}  ${(bytes/1024).toFixed(1)}KB`);
}
