#!/usr/bin/env node
/**
 * audit.mjs — 静的コード監査（読み取り専用）
 *
 * 設計原則（忖度対策の中核）:
 *   1. このスクリプトは対象フォルダを 1バイトも書き換えない。監査と修正を分離する。
 *   2. すべての判定に「根拠1行」を付ける。根拠を出せない項目は ○ にしない（× か ― にする）。
 *   3. 「動作した」とは言わない。あくまで「コード監査上は問題なし／問題あり」しか言わない。
 *
 * 使い方:
 *   node _tools/audit.mjs <ゲームフォルダ>
 *   node _tools/audit.mjs 017-action --json
 *
 * 終了コード: 0 = × なし / 1 = × あり / 2 = 実行エラー
 */

import { existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { join, relative, resolve, sep, extname, basename, dirname, posix } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const root = resolve(new URL('..', import.meta.url).pathname);
const argv = process.argv.slice(2);
const wantJson = argv.includes('--json');
const input = argv.find((a) => !a.startsWith('--'));
const target = input ? resolve(root, input) : null;

if (!target || !target.startsWith(`${root}${sep}`) || !existsSync(target) || !statSync(target).isDirectory()) {
  console.error('使い方: node _tools/audit.mjs <ゲームフォルダ> [--json]');
  process.exit(2);
}

const rel = relative(root, target);

/**
 * 人間判断が必要な項目（2026-08-02 タイタン決定）
 * ここに載っている項目は、ループドライバが自動修正してはいけない。
 * 「仕様・見た目・意図」が絡む＝AIが推測で埋めると事故る領域。
 * この一覧は静的に定義する。AIに仕分けさせない（仕分けをAIに任せた瞬間に丸投げに戻る）。
 */
const HUMAN_DECISION = new Set([
  '未使用アセットがない',
  '参照切れがない（HTML/CSS/JSの全参照）',
  '画像・音声・SVGのパス切れがない',
  '外部CDN依存',
  'SPEC.md が存在する（合格条件の定義元）',
]);

// ---------------------------------------------------------------------------
// 判定モデル: mark は '○' | '×' | '―'。evidence（根拠1行）が空なら ○ を認めない。
// ---------------------------------------------------------------------------
const results = [];
let currentCategory = '';

function category(name) {
  currentCategory = name;
}

function check(name, mark, evidence) {
  const ev = (evidence ?? '').toString().trim().replace(/\s+/g, ' ');
  let finalMark = mark;
  if (!ev) {
    // 根拠なしの ○ は構造的に禁止する
    finalMark = mark === '○' ? '×' : mark;
  }
  results.push({
    category: currentCategory,
    name,
    mark: finalMark,
    human: HUMAN_DECISION.has(name),
    evidence: ev || '根拠を提示できないため ○ を付けない',
  });
}

/** boolean から ○/× を作るヘルパー。根拠は必ず渡すこと。 */
function judge(name, ok, evidence) {
  check(name, ok ? '○' : '×', evidence);
}

/** 対象外（該当なし）。理由を必ず書く。 */
function skip(name, reason) {
  check(name, '―', reason);
}

// ---------------------------------------------------------------------------
// ファイル収集
// ---------------------------------------------------------------------------
const IGNORE_DIRS = new Set(['.git', 'node_modules', '.game-loop-backup', '.DS_Store']);
const TEXT_EXT = new Set(['.html', '.htm', '.js', '.mjs', '.css', '.json', '.svg', '.md', '.txt']);
const ASSET_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico',
  '.mp3', '.m4a', '.wav', '.ogg', '.aac',
  '.json', '.ttf', '.woff', '.woff2', '.otf',
]);

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile()) acc.push(full);
  }
  return acc;
}

const allFiles = walk(target);
const relFiles = allFiles.map((f) => relative(target, f).split(sep).join('/'));
const fileSize = new Map(allFiles.map((f) => [relative(target, f).split(sep).join('/'), statSync(f).size]));

function readText(relPath) {
  try {
    return readFileSync(join(target, relPath), 'utf8');
  } catch {
    return '';
  }
}

const textFiles = relFiles.filter((f) => TEXT_EXT.has(extname(f).toLowerCase()));
const textContent = new Map(textFiles.map((f) => [f, readText(f)]));
const htmlFiles = relFiles.filter((f) => ['.html', '.htm'].includes(extname(f).toLowerCase()));
const jsFiles = relFiles.filter((f) => ['.js', '.mjs'].includes(extname(f).toLowerCase()));
const cssFiles = relFiles.filter((f) => extname(f).toLowerCase() === '.css');

const indexHtml = htmlFiles.includes('index.html') ? 'index.html' : htmlFiles[0] || null;
const indexSrc = indexHtml ? textContent.get(indexHtml) || '' : '';

/** HTML の <script>...</script> 内インラインJSを抜き出す */
function inlineScripts(html) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;
    if (/type\s*=\s*["'](?!text\/javascript|module|application\/javascript)/i.test(attrs)) continue;
    out.push(m[2]);
  }
  return out;
}

/** HTML/CSS/JS を全部つないだ検索用テキスト（iOS適合などの横断チェック用） */
const allSource = [...htmlFiles, ...jsFiles, ...cssFiles].map((f) => textContent.get(f) || '').join('\n');
const allInline = htmlFiles.map((f) => inlineScripts(textContent.get(f) || '').join('\n')).join('\n');
const allJsSource = [...jsFiles.map((f) => textContent.get(f) || ''), allInline].join('\n');
const allCssSource = [
  ...cssFiles.map((f) => textContent.get(f) || ''),
  ...htmlFiles.map((f) => (textContent.get(f) || '').match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []).flat(),
].join('\n');

// ---------------------------------------------------------------------------
// 参照解決（依存関係チェックの土台）
// ---------------------------------------------------------------------------
const REF_PATTERNS = [
  /<script[^>]+src\s*=\s*["']([^"']+)["']/gi,
  /<link[^>]+href\s*=\s*["']([^"']+)["']/gi,
  /<img[^>]+src\s*=\s*["']([^"']+)["']/gi,
  /<(?:audio|video|source)[^>]+src\s*=\s*["']([^"']+)["']/gi,
  /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
];
const STRING_ASSET = /["'`]([^"'`\n]*?\.(?:png|jpe?g|gif|webp|svg|ico|mp3|m4a|wav|ogg|aac|json|ttf|woff2?|otf))["'`]/gi;

/** 参照文字列 → フォルダ内相対パスに正規化。外部URL/データURIは null */
function normalizeRef(ref, fromFile) {
  if (!ref) return null;
  const clean = ref.split('#')[0].split('?')[0].trim();
  if (!clean) return null;
  if (/^(https?:)?\/\//i.test(clean) || /^data:/i.test(clean) || /^blob:/i.test(clean) || /^mailto:/i.test(clean)) return null;
  const base = dirname(fromFile).split(sep).join('/');
  const joined = clean.startsWith('/')
    ? clean.slice(1)
    : posix.normalize(posix.join(base === '.' ? '' : base, clean));
  if (joined.startsWith('..')) return null;
  return joined;
}

const references = []; // { from, raw, path, external }
for (const f of textFiles) {
  const src = textContent.get(f) || '';
  const found = new Set();
  for (const re of REF_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) found.add(m[1]);
  }
  STRING_ASSET.lastIndex = 0;
  let m;
  while ((m = STRING_ASSET.exec(src))) found.add(m[1]);
  for (const raw of found) {
    const path = normalizeRef(raw, f);
    references.push({ from: f, raw, path, external: path === null });
  }
}

const referencedPaths = new Set(references.filter((r) => r.path).map((r) => r.path));
const brokenRefs = references.filter((r) => r.path && !fileSize.has(r.path));

// ---------------------------------------------------------------------------
// 1. 実装確認
// ---------------------------------------------------------------------------
category('1. 実装確認');

judge(
  '必要なファイルが存在する（index.html）',
  Boolean(indexHtml),
  indexHtml ? `${indexHtml} を検出（${fileSize.get(indexHtml)}バイト）` : `HTMLファイルが0件（走査${relFiles.length}ファイル）`,
);

{
  const hasCss = cssFiles.length > 0 || /<style[^>]*>/i.test(indexSrc);
  const hasJs = jsFiles.length > 0 || inlineScripts(indexSrc).some((s) => s.trim().length > 0);
  judge(
    'スタイルとスクリプトが実装されている',
    hasCss && hasJs,
    `CSS: ${cssFiles.length}ファイル${/<style[^>]*>/i.test(indexSrc) ? '＋インライン<style>あり' : ''} / JS: ${jsFiles.length}ファイル${inlineScripts(indexSrc).length ? `＋インライン<script>${inlineScripts(indexSrc).length}件` : ''}`,
  );
}

{
  // 参照されていないアセット（＝未使用の可能性）
  const assets = relFiles.filter((f) => ASSET_EXT.has(extname(f).toLowerCase()) && f !== indexHtml);
  const unused = assets.filter((f) => !referencedPaths.has(f) && !allSource.includes(basename(f)));
  const unusedBytes = unused.reduce((s, f) => s + (fileSize.get(f) || 0), 0);
  // 【削除の前提条件】参照切れが1件でもあるうちは、未参照ファイルは「ゴミ」ではなく
  // 「行方不明の参照先の候補」。先に消すと直す材料を失う（017-action の hero.png 事故）。
  const blocked = brokenRefs.length > 0;
  judge(
    '未使用アセットがない',
    unused.length === 0,
    unused.length === 0
      ? `アセット${assets.length}件すべてコード内から参照を検出`
      : `未参照${unused.length}件 / 計${(unusedBytes / 1024 / 1024).toFixed(2)}MB: ${unused.slice(0, 6).join(', ')}${unused.length > 6 ? ' ほか' : ''}${blocked ? ` ／【削除禁止】参照切れ${brokenRefs.length}件が未解決のため、これらは参照先候補の可能性がある` : ' ／参照切れ0件なので削除可'}`,
  );
  globalThis.__unused = unused;
}

{
  // HTMLから一度も読み込まれていない JS / CSS（死にファイル）
  const codeFiles = [...jsFiles, ...cssFiles];
  const dead = codeFiles.filter((f) => !referencedPaths.has(f));
  const deadBytes = dead.reduce((s, f) => s + (fileSize.get(f) || 0), 0);
  if (codeFiles.length === 0) skip('読み込まれていないJS/CSSがない', 'JS/CSSファイルが0件（全てインライン）のため対象外');
  else judge(
    '読み込まれていないJS/CSSがない（死にファイル）',
    dead.length === 0,
    dead.length === 0
      ? `JS/CSS ${codeFiles.length}件すべて <script src> / <link href> から参照を検出`
      : `HTMLから未参照 ${dead.length}件 / ${(deadBytes / 1024).toFixed(1)}KB: ${dead.join(', ')}（実行されないコードが残っている）`,
  );
}

{
  // 同名関数の重複定義（JS全体）
  const defs = new Map();
  const re = /(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let m;
  while ((m = re.exec(allJsSource))) defs.set(m[1], (defs.get(m[1]) || 0) + 1);
  const dupes = [...defs.entries()].filter(([, n]) => n > 1);
  judge(
    '重複コードがない（同名function重複定義）',
    dupes.length === 0,
    dupes.length === 0
      ? `トップレベルfunction宣言 ${defs.size}件、同名重複0件`
      : `重複${dupes.length}件: ${dupes.slice(0, 5).map(([k, n]) => `${k}×${n}`).join(', ')}`,
  );
}

// ---------------------------------------------------------------------------
// 2. 構文確認
// ---------------------------------------------------------------------------
category('2. 構文確認');

{
  // HTML: 主要タグの開閉数と id 重複
  const problems = [];
  for (const f of htmlFiles) {
    const src = textContent.get(f) || '';
    for (const tag of ['html', 'head', 'body', 'div', 'script', 'style', 'canvas']) {
      const open = (src.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
      const close = (src.match(new RegExp(`</${tag}\\s*>`, 'gi')) || []).length;
      if (open !== close) problems.push(`${f}: <${tag}> 開${open}/閉${close}`);
    }
    const ids = [...src.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((x) => x[1]);
    const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
    if (dup.length) problems.push(`${f}: id重複 ${[...new Set(dup)].join(',')}`);
  }
  judge(
    'HTMLエラーなし（タグ開閉・id重複）',
    problems.length === 0,
    problems.length === 0
      ? `HTML ${htmlFiles.length}ファイル: 主要7タグの開閉一致・id重複0件`
      : problems.slice(0, 5).join(' / '),
  );
}

{
  // CSS: 波括弧バランスと未終了コメント
  const problems = [];
  const checkCss = (label, src) => {
    const stripped = src.replace(/\/\*[\s\S]*?\*\//g, '');
    const open = (stripped.match(/\{/g) || []).length;
    const close = (stripped.match(/\}/g) || []).length;
    if (open !== close) problems.push(`${label}: {${open} }${close}`);
    const cOpen = (src.match(/\/\*/g) || []).length;
    const cClose = (src.match(/\*\//g) || []).length;
    if (cOpen !== cClose) problems.push(`${label}: コメント未終了 /*${cOpen} */${cClose}`);
  };
  for (const f of cssFiles) checkCss(f, textContent.get(f) || '');
  for (const f of htmlFiles) {
    const blocks = (textContent.get(f) || '').match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    blocks.forEach((b, i) => checkCss(`${f} inline<style>#${i + 1}`, b));
  }
  const total = cssFiles.length + (allCssSource ? 1 : 0);
  if (total === 0) skip('CSS構文エラーなし', 'CSSが1件も存在しないため対象外');
  else judge(
    'CSS構文エラーなし（括弧・コメント）',
    problems.length === 0,
    problems.length === 0
      ? `CSS ${cssFiles.length}ファイル＋インライン: {} 対応一致・コメント閉じ漏れ0件`
      : problems.slice(0, 5).join(' / '),
  );
}

{
  // JS: node --check でパース
  const tmp = join(tmpdir(), `audit-${Date.now()}`);
  mkdirSync(tmp, { recursive: true });
  const failures = [];
  let checked = 0;
  const parse = (label, code) => {
    checked += 1;
    const isModule = /^\s*(import|export)\s/m.test(code);
    const file = join(tmp, `${checked}${isModule ? '.mjs' : '.js'}`);
    writeFileSync(file, code);
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (e) {
      const msg = (e.stderr?.toString() || e.message).split('\n').filter((l) => /SyntaxError|Error/.test(l))[0] || 'parse error';
      failures.push(`${label}: ${msg.trim()}`);
    }
  };
  for (const f of jsFiles) parse(f, textContent.get(f) || '');
  for (const f of htmlFiles) inlineScripts(textContent.get(f) || '').forEach((s, i) => parse(`${f} inline<script>#${i + 1}`, s));
  if (checked === 0) skip('JavaScript構文エラーなし', 'JSが1件も存在しないため対象外');
  else judge(
    'JavaScript構文エラーなし（node --check）',
    failures.length === 0,
    failures.length === 0
      ? `${checked}スクリプトを node --check でパース、全件成功`
      : `${failures.length}/${checked}件失敗: ${failures.slice(0, 3).join(' / ')}`,
  );
}

// ---------------------------------------------------------------------------
// 3. 依存関係確認
// ---------------------------------------------------------------------------
category('3. 依存関係確認');

{
  // 読み込み順: script が </body> 直前 or defer/module か
  if (!indexHtml) skip('読み込み順が正しい', 'HTMLが存在しないため対象外');
  else {
    const tags = [...indexSrc.matchAll(/<script\b([^>]*)>/gi)];
    const externals = tags.filter((t) => /\bsrc\s*=/.test(t[1]));
    const bodyClose = indexSrc.toLowerCase().lastIndexOf('</body>');
    const bad = externals.filter((t) => {
      const deferred = /\bdefer\b/i.test(t[1]) || /type\s*=\s*["']module["']/i.test(t[1]);
      const atEnd = bodyClose >= 0 && t.index > indexSrc.toLowerCase().indexOf('<body');
      return !deferred && !atEnd;
    });
    if (externals.length === 0) skip('読み込み順が正しい', `${indexHtml} に外部scriptタグが0件（インライン実装）`);
    else judge(
      '読み込み順が正しい（defer/module or body内）',
      bad.length === 0,
      bad.length === 0
        ? `外部script ${externals.length}件すべて defer/module または <body>内に配置`
        : `head内で同期読み込み ${bad.length}件: ${bad.map((t) => (t[1].match(/src\s*=\s*["']([^"']+)["']/i) || [])[1]).join(', ')}`,
    );
  }
}

judge(
  '参照切れがない（HTML/CSS/JSの全参照）',
  brokenRefs.length === 0,
  brokenRefs.length === 0
    ? `ローカル参照 ${referencedPaths.size}件すべて実ファイルに解決（外部URL ${references.filter((r) => r.external).length}件は対象外）`
    : `切れ${brokenRefs.length}件: ${brokenRefs.slice(0, 6).map((r) => `${r.raw}(←${r.from})`).join(', ')}${brokenRefs.length > 6 ? ' ほか' : ''}`,
);

{
  const assetRefs = references.filter((r) => r.path && ASSET_EXT.has(extname(r.path).toLowerCase()));
  const brokenAssets = assetRefs.filter((r) => !fileSize.has(r.path));
  if (assetRefs.length === 0) skip('画像・音声・SVGのパス切れがない', 'アセット参照が0件のため対象外');
  else judge(
    '画像・音声・SVGのパス切れがない',
    brokenAssets.length === 0,
    brokenAssets.length === 0
      ? `アセット参照 ${assetRefs.length}件すべて実在（画像${assetRefs.filter((r) => /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(r.path)).length}／音声${assetRefs.filter((r) => /\.(mp3|m4a|wav|ogg|aac)$/i.test(r.path)).length}）`
      : `切れ${brokenAssets.length}件: ${brokenAssets.slice(0, 6).map((r) => r.raw).join(', ')}`,
  );
}

{
  const cdn = references.filter((r) => r.external && /^(https?:)?\/\//i.test(r.raw));
  if (cdn.length === 0) skip('外部CDN依存', '外部URL参照0件＝GitHub Pagesでの外部依存なし');
  else check('外部CDN依存', '×', `外部URL ${cdn.length}件を検出（オフライン/障害時に破綻）: ${[...new Set(cdn.map((r) => r.raw))].slice(0, 4).join(', ')}`);
}

// ---------------------------------------------------------------------------
// 4. 既存機能への影響確認（回帰確認）— gitがなければ ―
// ---------------------------------------------------------------------------
category('4. 既存機能への影響確認（回帰）');

{
  const hasGit = existsSync(join(target, '.git'));
  const inRepoGit = existsSync(join(root, '.git'));
  if (!hasGit && !inRepoGit) {
    skip('修正した箇所以外が壊れていない', 'gitリポジトリが無く差分を取れないため判定不能（＝消失リスクあり）');
    skip('コンソールエラーが増えていない', '基準となる過去実行結果が無いため判定不能');
    skip('新たな警告が発生していない', '基準となる過去実行結果が無いため判定不能');
  } else {
    const gitDir = hasGit ? target : root;
    // 【重要】監査器は対象リポジトリの .git に一切書き込まない。
    // git status はファイルのmtimeが変わっているとindexを書き戻すため .git/index.lock を作る。
    // このワークスペースのマウントは unlink が効かず、そのlockが残って次のcommitを止めてしまう。
    // → indexを一時ディレクトリにコピーし GIT_INDEX_FILE で差し替える。lockは/tmp側に出て消える。
    // （2026-08-02 誤判定ログ#2）
    let dirty = '';
    const tmpIndex = join(tmpdir(), `audit-index-${process.pid}-${Date.now()}`);
    try {
      const env = { ...process.env };
      const realIndex = join(gitDir, '.git', 'index');
      if (existsSync(realIndex) && statSync(join(gitDir, '.git')).isDirectory()) {
        copyFileSync(realIndex, tmpIndex);
        env.GIT_INDEX_FILE = tmpIndex;
      }
      dirty = execFileSync('git', [
        '--no-optional-locks', '-c', 'gc.auto=0', '-c', 'maintenance.auto=false',
        '-C', gitDir, 'status', '--porcelain', '--', hasGit ? '.' : rel,
      ], { encoding: 'utf8', env }).trim();
    } catch (e) {
      dirty = `__ERROR__${e.message}`;
    } finally {
      rmSync(tmpIndex, { force: true });
      rmSync(`${tmpIndex}.lock`, { force: true });
    }
    if (dirty.startsWith('__ERROR__')) {
      skip('修正した箇所以外が壊れていない', `git status が実行できず判定不能: ${dirty.slice(9, 90)}`);
    } else {
      const lines = dirty ? dirty.split('\n') : [];
      judge(
        '未コミットの変更がない（差分の追跡可能性）',
        lines.length === 0,
        lines.length === 0
          ? `git status --porcelain の出力0行＝作業ツリーはHEADと一致`
          : `未コミット${lines.length}件: ${lines.slice(0, 5).map((l) => l.trim()).join(', ')}`,
      );
    }
    // 動的エラーの増減は harness の実行結果が必要
    const reportDir = join(root, 'docs', 'harness-reports');
    const reports = existsSync(reportDir)
      ? readdirSync(reportDir).filter((f) => f.startsWith(rel.replaceAll('/', '_')))
      : [];
    if (reports.length === 0) {
      skip('コンソールエラーが増えていない', `docs/harness-reports に ${rel} の過去レポートが0件＝比較基準なし（harness実行が必要）`);
    } else {
      skip('コンソールエラーが増えていない', `過去レポート${reports.length}件あり。静的監査では動的エラーを測れないため harness の結果で判定すること`);
    }
    skip('新たな警告が発生していない', '静的監査ではランタイム警告を観測できない（harness側の責務）');
  }
}

// ---------------------------------------------------------------------------
// 5. iOS適合確認 — game-standard-requirements.mdc の具体値で判定
// ---------------------------------------------------------------------------
category('5. iOS適合確認');

{
  const vp = indexSrc.match(/<meta[^>]+name\s*=\s*["']viewport["'][^>]*>/i);
  const content = vp ? (vp[0].match(/content\s*=\s*["']([^"']+)["']/i) || [])[1] || '' : '';
  const ok = Boolean(vp) && /width\s*=\s*device-width/i.test(content)
    && (/maximum-scale\s*=\s*1/.test(content) || /user-scalable\s*=\s*(no|0)/i.test(content));
  judge(
    'viewport設定（device-width＋拡大禁止）',
    ok,
    vp ? `content="${content}"` : `${indexHtml || 'HTML'} に viewport meta が存在しない`,
  );
}

{
  const has = /touch-action\s*:/i.test(allCssSource) || /touchAction\s*=/.test(allJsSource);
  const isNone = /touch-action\s*:\s*(none|manipulation)/i.test(allCssSource);
  judge(
    'touch-action',
    has && isNone,
    has
      ? `CSSに touch-action 宣言 ${(allCssSource.match(/touch-action\s*:/gi) || []).length}件、うち none/manipulation ${(allCssSource.match(/touch-action\s*:\s*(none|manipulation)/gi) || []).length}件`
      : 'touch-action の宣言をCSS/JSのどこにも検出できない',
  );
}

{
  const us = (allCssSource.match(/(-webkit-)?user-select\s*:/gi) || []).length;
  const webkit = /-webkit-user-select\s*:/i.test(allCssSource);
  judge(
    'user-select / -webkit-user-select',
    us > 0 && webkit,
    us > 0
      ? `user-select 宣言 ${us}件（-webkit-プレフィクス: ${webkit ? 'あり' : 'なし'}）`
      : 'user-select の宣言をCSSに検出できない（長押しで範囲選択が出る）',
  );
}

{
  const tapHl = /-webkit-tap-highlight-color\s*:\s*transparent/i.test(allCssSource);
  const callout = /-webkit-touch-callout\s*:\s*none/i.test(allCssSource);
  judge(
    'タップハイライト・長押しメニュー抑止',
    tapHl && callout,
    `-webkit-tap-highlight-color:transparent = ${tapHl ? 'あり' : 'なし'} / -webkit-touch-callout:none = ${callout ? 'あり' : 'なし'}`,
  );
}

{
  const dbl = /touchend/.test(allJsSource) && /(lastTouchEnd|preventDefault)/.test(allJsSource);
  const tmove = /addEventListener\(\s*['"]touchmove['"]/.test(allJsSource);
  judge(
    'ダブルタップズーム防止（touchend/touchmove）',
    dbl || tmove,
    `touchendハンドラ: ${/addEventListener\(\s*['"]touchend['"]/.test(allJsSource) ? 'あり' : 'なし'} / touchmove preventDefault: ${tmove ? 'あり' : 'なし'}`,
  );
}

{
  const safe = /env\(\s*safe-area-inset/i.test(allCssSource);
  judge('safe-area対応', safe, safe ? `env(safe-area-inset-*) を ${(allCssSource.match(/env\(\s*safe-area-inset/gi) || []).length}箇所で使用` : 'env(safe-area-inset-*) をCSSに検出できない（ノッチ/ホームバーに被る）');
}

{
  const fixed = /html\s*,?\s*body[^{]*\{[^}]*overflow\s*:\s*hidden/i.test(allCssSource) || /body[^{]*\{[^}]*position\s*:\s*fixed/i.test(allCssSource);
  judge('スクロール・バウンス防止', fixed, fixed ? 'html/body に overflow:hidden または position:fixed を検出' : 'html/body の overflow:hidden / position:fixed を検出できない（ラバーバンドが出る）');
}

{
  const hasCtx = /(AudioContext|webkitAudioContext)/.test(allJsSource);
  const hasAudioTag = /<audio\b/i.test(allSource) || /new\s+Audio\(/.test(allJsSource);
  if (!hasCtx && !hasAudioTag) {
    check('BGM開始処理（ユーザージェスチャー内でunlock）', '×', '音声実装そのものが存在しない（AudioContext・<audio>・new Audio いずれも0件）');
  } else {
    // ユーザー操作イベント内で初期化/resume しているか
    const gesture = /(click|touchstart|touchend|pointerdown)/.test(allJsSource);
    const unlock = /\.resume\s*\(/.test(allJsSource) || /createBuffer\s*\(\s*1\s*,\s*1\s*,/.test(allJsSource);
    judge(
      'BGM開始処理（ユーザージェスチャー内でunlock）',
      hasCtx && gesture && unlock,
      `AudioContext: ${hasCtx ? 'あり' : 'なし'} / ジェスチャーイベント: ${gesture ? 'あり' : 'なし'} / resume()orサイレントバッファ: ${unlock ? 'あり' : 'なし'}`,
    );
  }
}

{
  const loop = /\.loop\s*=\s*true/.test(allJsSource) || /<audio[^>]+\bloop\b/i.test(allSource);
  judge('BGMループ設定', loop, loop ? '.loop = true または <audio loop> を検出' : 'ループ指定を検出できない（1回鳴って終わる）');
}

{
  // オンスクリーンコントローラーの存在
  const idRe = /(id|class)\s*=\s*["'][^"']*(dpad|d-pad|pad|joystick|stick|controller|controls|btn|button)[^"']*["']/gi;
  const hits = [...allSource.matchAll(idRe)].length;
  const touchInput = /addEventListener\(\s*['"](touchstart|pointerdown)['"]/.test(allJsSource);
  judge(
    'コントローラー配置（オンスクリーン操作）',
    hits > 0 || touchInput,
    hits > 0
      ? `操作系のid/class を ${hits}件検出（touchstart/pointerdownハンドラ: ${touchInput ? 'あり' : 'なし'}）`
      : touchInput ? '画面タップ入力ハンドラを検出（専用UIなし＝タップ操作型）' : 'コントローラーUIもタッチ入力ハンドラも検出できない（iPhoneで操作不能の疑い）',
  );
}

{
  // z-index / position の競合: 同一 z-index を持つ fixed/absolute 要素が多すぎないか
  const zs = [...allCssSource.matchAll(/z-index\s*:\s*(-?\d+)/gi)].map((m) => Number(m[1]));
  const counts = zs.reduce((acc, z) => acc.set(z, (acc.get(z) || 0) + 1), new Map());
  const collide = [...counts.entries()].filter(([, n]) => n >= 3);
  if (zs.length === 0) skip('position・z-indexが競合していない', 'z-index の宣言が0件のため重なり競合は発生しない');
  else judge(
    'position・z-indexが競合していない',
    collide.length === 0,
    collide.length === 0
      ? `z-index 宣言 ${zs.length}件、同値3回以上の重複なし（最大値 ${Math.max(...zs)}）`
      : `同一z-indexの多重使用: ${collide.map(([z, n]) => `z=${z}が${n}件`).join(', ')}（重なり順が不定になる）`,
  );
}

// ---------------------------------------------------------------------------
// 6. 品質確認
// ---------------------------------------------------------------------------
category('6. 品質確認');

{
  // 2026-08-02 タイタン決定: 3MB を合否条件から外した。
  // 理由「3MBを超えてダメだと、ほとんどのゲームが成立しない」。軽量化は推奨、上限は設けない。
  // 計測は続ける（重い犯人を毎回見せる）が、× は付けない。
  const total = [...fileSize.values()].reduce((a, b) => a + b, 0);
  const top = [...fileSize.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([f, s]) => `${f} ${(s / 1024 / 1024).toFixed(2)}MB`).join(', ');
  check(
    'アセット総量（参考値・合否対象外）',
    '―',
    `合計 ${(total / 1024 / 1024).toFixed(2)}MB（${relFiles.length}ファイル）／重い順: ${top}`,
  );
}

{
  const logs = (allJsSource.match(/console\.(log|debug|info)\s*\(/g) || []).length;
  judge(
    '不要なデバッグ出力が残っていない',
    logs === 0,
    logs === 0 ? 'console.log/debug/info の呼び出し0件' : `console.log/debug/info ${logs}件が残存`,
  );
}

{
  // 命名規則: トップレベル関数名の camelCase 比率
  const names = [...allJsSource.matchAll(/(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]);
  if (names.length === 0) skip('命名規則が統一されている', 'トップレベルfunction宣言が0件のため判定対象なし');
  else {
    const camel = names.filter((n) => /^[a-z][A-Za-z0-9]*$/.test(n));
    const snake = names.filter((n) => /_/.test(n));
    const ok = names.length > 0 && camel.length / names.length >= 0.8;
    judge(
      '命名規則が統一されている（camelCase）',
      ok,
      `function ${names.length}件中 camelCase ${camel.length}件（${Math.round((camel.length / names.length) * 100)}%）／snake_case ${snake.length}件${snake.length ? `: ${snake.slice(0, 4).join(', ')}` : ''}`,
    );
  }
}

{
  // ファイル構成ルール: 直下に index/style/script、サブフォルダは images/ audio/ のみ
  const dirs = [...new Set(relFiles.filter((f) => f.includes('/')).map((f) => f.split('/')[0]))];
  const allowed = dirs.filter((d) => ['images', 'audio'].includes(d));
  judge(
    'ファイル構成が標準要件通り（サブフォルダは images/ audio/ のみ）',
    dirs.length === allowed.length,
    dirs.length === 0
      ? '直下のみのフラット構成（サブフォルダ0件）'
      : `サブフォルダ ${dirs.length}件: ${dirs.join(', ')}${dirs.length !== allowed.length ? '（images/ audio/ 以外を含む）' : ''}`,
  );
}

{
  const specPath = 'SPEC.md';
  const hasSpec = fileSize.has(specPath) || existsSync(join(target, 'SPEC.md'));
  judge(
    'SPEC.md が存在する（合格条件の定義元）',
    hasSpec,
    hasSpec ? `SPEC.md を検出（${fileSize.get(specPath) || statSync(join(target, 'SPEC.md')).size}バイト）` : 'SPEC.md が無い＝この監査は「壊れてないか」しか見られず、仕様通りかは検証不能',
  );
}

// ---------------------------------------------------------------------------
// 7. 最終チェック
// ---------------------------------------------------------------------------
category('7. 最終チェック');

const beforeFinal = results.length;
{
  const noEvidence = results.filter((r) => r.evidence === '根拠を提示できないため ○ を付けない');
  judge(
    '全項目に根拠1行が付いている',
    noEvidence.length === 0,
    noEvidence.length === 0
      ? `${beforeFinal}項目すべてに根拠テキストを出力`
      : `根拠なし ${noEvidence.length}項目: ${noEvidence.map((r) => r.name).join(', ')}`,
  );
}

skip('Obsidianへ記録済み', 'ObsidianのMCP接続が未認証のため、本ツールはローカルmdのみ出力する');

// ---------------------------------------------------------------------------
// 人間判断依頼の組み立て
//   「状況 → 候補 → 質問 → YESなら何をするか」の4点セットにする。
//   タイタンが読んで即答できる形にすることが目的。推測での穴埋めはしない。
// ---------------------------------------------------------------------------
const questions = [];

if (brokenRefs.length) {
  // 参照切れ1件ごとに、同じ拡張子の未参照ファイルを「候補」として提示する
  const unusedAssets = globalThis.__unused || [];
  const byRef = new Map();
  for (const r of brokenRefs) {
    if (!byRef.has(r.path)) byRef.set(r.path, []);
    byRef.get(r.path).push(r.from);
  }
  const detail = [...byRef.entries()].map(([path, froms]) => {
    const ext = extname(path).toLowerCase();
    // 参照元の行を1行だけ引く（何に使う素材かを見せるため）
    let usage = '';
    for (const f of froms) {
      const src = (textContent.get(f) || '').split('\n');
      const i = src.findIndex((l) => l.includes(basename(path)));
      if (i >= 0) { usage = `${f}:${i + 1}  ${src[i].trim().slice(0, 90)}`; break; }
    }
    const cands = unusedAssets.filter((u) => extname(u).toLowerCase() === ext);
    return { path, usage, cands };
  });
  questions.push({
    title: `参照切れ ${byRef.size}件 — コードが呼んでいるファイルが存在しない`,
    situation: detail.map((d) => `\`${d.path}\` を ${d.usage || '(参照元不明)'} で使用`),
    candidates: [...new Set(detail.flatMap((d) => d.cands))],
    question: `どの実ファイルを充てる？（フォルダに残っている未参照ファイルが候補）`,
    ifAnswered: 'リネームまたは参照先の書き換え → 再監査。ここが片付くと未使用アセットの削除も解禁される',
    note: '自動修正禁止：どの画像がどの役割かはコードから判定できない',
  });
}

{
  const unusedAssets = globalThis.__unused || [];
  if (unusedAssets.length) {
    const bytes = unusedAssets.reduce((s, f) => s + (fileSize.get(f) || 0), 0);
    questions.push({
      title: `未参照ファイル ${unusedAssets.length}件（${(bytes / 1024 / 1024).toFixed(2)}MB）— 消していい？`,
      situation: unusedAssets.map((f) => `\`${f}\`  ${((fileSize.get(f) || 0) / 1024 / 1024).toFixed(2)}MB`),
      candidates: [],
      question: brokenRefs.length
        ? `**先に上の参照切れを解決すること。** 上で使う分を除いた残りを削除していい？`
        : `全部削除していい？`,
      ifAnswered: '削除 → 再監査',
      note: brokenRefs.length ? `参照切れ${brokenRefs.length}件が未解決のため、いま消すと直す材料を失う` : '参照切れ0件なので安全に削除できる',
    });
  }
}

{
  const cdn = [...new Set(references.filter((r) => r.external && /^(https?:)?\/\//i.test(r.raw)).map((r) => r.raw))];
  if (cdn.length) {
    questions.push({
      title: `外部CDN依存 ${cdn.length}件 — どうする？`,
      situation: cdn.map((u) => `\`${u}\``),
      candidates: [],
      question: 'ローカルに同梱する／そのまま外部参照でいく／使うのをやめる、どれ？',
      ifAnswered: '同梱ならフォントファイルを取得して参照を書き換え → 再監査',
      note: '見た目に直結するので自動判断しない',
    });
  }
}

if (!existsSync(join(target, 'SPEC.md'))) {
  questions.push({
    title: 'SPEC.md がない — 「仕様通りか」を永久に検証できない状態',
    situation: [`${rel} に SPEC.md が存在しない`],
    candidates: [],
    question: 'いま書く／後回しにする／このゲームは対象外にする、どれ？',
    ifAnswered: '書くなら .cursor/rules/global.mdc/game-spec-writing-rule.mdc の形式で作成',
    note: 'SPEC.mdが無い間、この監査は「壊れてないか」しか見られない',
  });
}

// ---------------------------------------------------------------------------
// 出力
// ---------------------------------------------------------------------------
const ng = results.filter((r) => r.mark === '×');
const ok = results.filter((r) => r.mark === '○');
const na = results.filter((r) => r.mark === '―');
const ngMachine = ng.filter((r) => !r.human);
const ngHuman = ng.filter((r) => r.human);
const verdict = ng.length === 0 ? 'コード監査上は問題なし' : 'コード監査上の問題あり';

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportDir = join(root, 'docs', 'audit-reports');
mkdirSync(reportDir, { recursive: true });
const reportFile = join(reportDir, `${rel.replaceAll('/', '_')}-${stamp}.md`);

const esc = (s) => String(s).replaceAll('|', '\\|');
const lines = [
  `# コード監査レポート: ${rel}`,
  '',
  `- 判定: **${verdict}**（○ ${ok.length} / × ${ng.length} / ― ${na.length}）`,
  `- × の内訳: **機械箱 ${ngMachine.length}件**（ループが直す） / **人間箱 ${ngHuman.length}件**（タイタンが決める）`,
  `- 実行: ${new Date().toISOString()}`,
  `- ツール: \`_tools/audit.mjs\`（静的監査・対象フォルダは無変更）`,
  '',
  '> この監査は静的解析のみに基づく。実機でのプレイ挙動は検証していない。',
  '> 動的検証は `_tools/game-harness.mjs`、実機確認は人間の責務。',
  '',
];

if (questions.length) {
  lines.push(`# 👤 タイタンに聞きたいこと（${questions.length}件）`, '');
  questions.forEach((q, i) => {
    lines.push(`## ${i + 1}. ${q.title}`, '');
    lines.push('**いま起きてること**', '');
    q.situation.forEach((s) => lines.push(`- ${s}`));
    lines.push('');
    if (q.candidates.length) {
      lines.push('**フォルダに残ってる候補**', '');
      q.candidates.forEach((c) => lines.push(`- \`${c}\`  ${((fileSize.get(c) || 0) / 1024 / 1024).toFixed(2)}MB`));
      lines.push('');
    }
    lines.push(`**質問** — ${q.question}`, '');
    lines.push(`**答えたらこうする** — ${q.ifAnswered}`, '');
    lines.push(`*${q.note}*`, '');
  });
  lines.push('---', '');
}
lines.push('# 監査明細', '');
for (const cat of [...new Set(results.map((r) => r.category))]) {
  lines.push(`## ${cat}`, '', '| 項目 | 判定 | 箱 | 根拠 |', '|---|:---:|:---:|---|');
  for (const r of results.filter((x) => x.category === cat)) {
    lines.push(`| ${esc(r.name)} | ${r.mark} | ${r.human ? '👤' : '⚙️'} | ${esc(r.evidence)} |`);
  }
  lines.push('');
}
if (ngMachine.length) {
  lines.push('## ⚙️ 機械箱 — ループが直す（上から順に1周1件）', '');
  ngMachine.forEach((r, i) => lines.push(`${i + 1}. **${r.name}**（${r.category}） — ${r.evidence}`));
  lines.push('');
}
writeFileSync(reportFile, lines.join('\n'));

if (wantJson) {
  console.log(JSON.stringify({ target: rel, verdict, ok: ok.length, ng: ng.length, na: na.length, results, report: relative(root, reportFile) }, null, 2));
} else {
  let cat = '';
  for (const r of results) {
    if (r.category !== cat) {
      cat = r.category;
      console.log(`\n[${cat}]`);
    }
    console.log(`  ${r.mark} ${r.human ? '👤' : '  '} ${r.name}\n       └ ${r.evidence}`);
  }
  console.log(`\nVERDICT ${verdict}  (○${ok.length} ×${ng.length} ―${na.length})`);
  console.log(`  ⚙️ 機械箱 ${ngMachine.length}件 / 👤 人間箱 ${ngHuman.length}件（質問${questions.length}件）`);
  console.log(`REPORT ${relative(root, reportFile)}`);
}

process.exitCode = ng.length === 0 ? 0 : 1;
