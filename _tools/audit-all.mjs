#!/usr/bin/env node
/**
 * audit-all.mjs — 全ゲームフォルダに audit.mjs を一括実行して横断集計する
 *
 * 目的: 「017-action と同じ症状が他に何本あるか」を数字で出す。
 *       人間の目では不可能な全数調査を1回で終わらせるのが、このループの取り分。
 *
 * 使い方:
 *   node _tools/audit-all.mjs [--concurrency 4]
 *   出力: docs/audit-reports/_ALL-<timestamp>.md  および  _ALL-<timestamp>.jsonl
 */

import { existsSync, readdirSync, statSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { execFile } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);
const argv = process.argv.slice(2);
const concurrency = Number(argv[argv.indexOf('--concurrency') + 1]) || 4;

// 対象 = リポジトリ直下で index.html を持つフォルダ（_tools / docs / node_modules 等は自動的に除外される）
const SKIP = new Set(['node_modules', '_tools', 'docs', '.git', '.cursor', 'titans-ui']);
const targets = readdirSync(root, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !SKIP.has(e.name))
  .map((e) => e.name)
  .filter((n) => existsSync(join(root, n, 'index.html')))
  .sort();

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = join(root, 'docs', 'audit-reports');
mkdirSync(outDir, { recursive: true });
const jsonlFile = join(outDir, `_ALL-${stamp}.jsonl`);
const mdFile = join(outDir, `_ALL-${stamp}.md`);

console.error(`対象 ${targets.length} フォルダ / 並列 ${concurrency}`);

function runOne(folder) {
  return new Promise((res) => {
    execFile(process.execPath, [join(root, '_tools', 'audit.mjs'), folder, '--json', '--no-report'],
      { cwd: root, maxBuffer: 20 * 1024 * 1024, timeout: 120000 },
      (err, stdout) => {
        try {
          res(JSON.parse(stdout));
        } catch {
          res({ target: folder, error: (err && err.message) || 'parse failed', results: [] });
        }
      });
  });
}

const all = [];
let done = 0;
const queue = [...targets];
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (queue.length) {
    const folder = queue.shift();
    const r = await runOne(folder);
    all.push(r);
    appendFileSync(jsonlFile, `${JSON.stringify(r)}\n`);
    done += 1;
    if (done % 10 === 0) console.error(`  ...${done}/${targets.length}`);
  }
}));
all.sort((a, b) => a.target.localeCompare(b.target));

// ---------------------------------------------------------------------------
// 集計
// ---------------------------------------------------------------------------
const ok = all.filter((r) => !r.error);
const failedRun = all.filter((r) => r.error);

/** 指定チェック名が × だったフォルダ一覧 */
function ngFolders(name) {
  return ok.filter((r) => r.results.some((c) => c.name === name && c.mark === '×'));
}
function evidenceOf(r, name) {
  return (r.results.find((c) => c.name === name) || {}).evidence || '';
}

const CHECKS = [...new Set(ok.flatMap((r) => r.results.map((c) => c.name)))];
const summary = CHECKS.map((name) => {
  const hit = ngFolders(name);
  const human = ok.some((r) => r.results.some((c) => c.name === name && c.human));
  return { name, count: hit.length, human, folders: hit.map((r) => r.target) };
}).sort((a, b) => b.count - a.count);

const totalNg = ok.reduce((s, r) => s + r.ng, 0);
const clean = ok.filter((r) => r.ng === 0);
const worst = [...ok].sort((a, b) => b.ng - a.ng).slice(0, 20);

// 017-action と同じ「見えない致命傷」の本数
const invisible = ngFolders('参照切れがない（該当ファイルがフォルダ内に存在しない）');
const deadCode = ngFolders('読み込まれていないJS/CSSがない（死にファイル）');

const L = [];
L.push(`# 全ゲーム一括監査レポート`, '');
L.push(`- 実行: ${new Date().toISOString()}`);
L.push(`- 対象: **${targets.length}フォルダ**（index.html を持つ直下フォルダ）`);
L.push(`- 監査成功 ${ok.length} / 実行エラー ${failedRun.length}`);
L.push(`- × 合計 **${totalNg}件**、× ゼロのフォルダ **${clean.length}本**`);
L.push('', '---', '');

L.push('## 🔴 最重要: 「動いているように見えて壊れている」本数', '');
L.push(`| 症状 | 該当本数 | 意味 |`, `|---|---:|---|`);
L.push(`| **参照切れ**（呼んでるファイルが無い） | **${invisible.length}本** | 画像・音声が黙って消える。コンソールにエラーが出ないので目視では気づけない |`);
L.push(`| **死にファイル**（読み込まれないJS/CSS） | **${deadCode.length}本** | 実行されないコードが残存。改修時に「直したのに反映されない」の原因 |`);
L.push('');
if (invisible.length) {
  L.push('### 参照切れがあるフォルダ', '');
  for (const r of invisible) L.push(`- **${r.target}** — ${evidenceOf(r, '参照切れがない（該当ファイルがフォルダ内に存在しない）')}`);
  L.push('');
}
if (deadCode.length) {
  L.push('### 死にファイルがあるフォルダ', '');
  for (const r of deadCode) L.push(`- **${r.target}** — ${evidenceOf(r, '読み込まれていないJS/CSSがない（死にファイル）')}`);
  L.push('');
}

L.push('---', '', '## 症状別ランキング（× が多い順）', '');
L.push('| 項目 | 箱 | ×の本数 | 割合 |', '|---|:---:|---:|---:|');
for (const s of summary) {
  if (s.count === 0) continue;
  L.push(`| ${s.name} | ${s.human ? '👤' : '⚙️'} | ${s.count} | ${Math.round((s.count / ok.length) * 100)}% |`);
}
L.push('');

L.push('## フォルダ別 ×件数（多い順・上位20）', '');
L.push('| フォルダ | × | ⚙️機械 | 👤人間 | ○ |', '|---|---:|---:|---:|---:|');
for (const r of worst) {
  const m = r.results.filter((c) => c.mark === '×' && !c.human).length;
  const h = r.results.filter((c) => c.mark === '×' && c.human).length;
  L.push(`| ${r.target} | ${r.ng} | ${m} | ${h} | ${r.ok} |`);
}
L.push('');

if (clean.length) {
  L.push('## × ゼロのフォルダ', '', clean.map((r) => r.target).join(', '), '');
}
if (failedRun.length) {
  L.push('## 監査が実行できなかったフォルダ', '');
  for (const r of failedRun) L.push(`- ${r.target} — ${r.error}`);
  L.push('');
}

L.push('---', '', '## 全フォルダ一覧', '');
L.push('| フォルダ | 判定 | ○ | × | ― | 参照切れ | 死にファイル | SPEC.md |', '|---|:---:|---:|---:|---:|:---:|:---:|:---:|');
for (const r of ok) {
  const mk = (n) => {
    const c = r.results.find((x) => x.name === n);
    return c ? c.mark : '?';
  };
  L.push(`| ${r.target} | ${r.ng === 0 ? '✅' : '⚠️'} | ${r.ok} | ${r.ng} | ${r.na} | ${mk('参照切れがない（該当ファイルがフォルダ内に存在しない）')} | ${mk('読み込まれていないJS/CSSがない（死にファイル）')} | ${mk('SPEC.md が存在する（合格条件の定義元）')} |`);
}
L.push('');

writeFileSync(mdFile, L.join('\n'));
console.error(`\n=== 完了 ===`);
console.error(`対象 ${targets.length} / 成功 ${ok.length} / 失敗 ${failedRun.length}`);
console.error(`参照切れ ${invisible.length}本 / 死にファイル ${deadCode.length}本 / ×ゼロ ${clean.length}本`);
console.error(`REPORT ${relative(root, mdFile)}`);
