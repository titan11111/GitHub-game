#!/usr/bin/env node
/**
 * controller-audit.mjs — コントロールパネル／入力系の採点（読み取り専用）
 *
 * audit.mjs（静的31項目）は入力系を見ていない。そのせいで 288本中 279本が
 * 「共通部品を参照していない」まま素通りしていた（2026-10-22 全数実測）。
 * このツールはその穴だけを埋める。
 *
 * 設計原則（audit.mjs と同じ）:
 *   1. 対象フォルダを 1バイトも書き換えない。
 *   2. すべての判定に根拠を出す。根拠を出せない項目は満点にしない。
 *   3. 「遊べる」とは言わない。コード上の有無しか言わない。
 *
 * 使い方:
 *   node _tools/controller-audit.mjs <ゲームフォルダ>
 *   node _tools/controller-audit.mjs <ゲームフォルダ> --json
 *   node _tools/controller-audit.mjs --all            # 全フォルダのランキング
 *   node _tools/controller-audit.mjs --all --csv > out.csv
 *
 * 終了コード: 0 = 満点(17) / 1 = 未達あり / 2 = 実行エラー
 *   ※ 新作は「17点になるまで直す」。既存作は未達項目の一覧を読むために使う。
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const argv = process.argv.slice(2);
const wantJson = argv.includes('--json');
const wantCsv = argv.includes('--csv');
const wantAll = argv.includes('--all');
const input = argv.find((a) => !a.startsWith('--'));

const SKIP_DIRS = new Set(['.git', 'node_modules', '_playtest', '_archive', 'docs']);
const MAX_FILE = 3_000_000;

/** フォルダ内の html/js/css を1本の文字列に連結して返す */
function readSource(dir) {
  let text = '';
  let files = 0;
  const walk = (d) => {
    let entries;
    try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p); continue; }
      if (!/\.(html|js|css)$/i.test(e.name) || /\.min\.js$/i.test(e.name)) continue;
      try {
        if (statSync(p).size > MAX_FILE) continue;
        text += readFileSync(p, 'utf8');
        files++;
      } catch { /* 読めないものは数えない */ }
    }
  };
  walk(dir);
  return { text, files };
}

/**
 * 採点項目（満点17）。出典は docs/rules/control-panel.md の6項目 + iOS鉄則。
 * 配点2 = 「これが無いと作り直しになる」もの。
 */
const CHECKS = [
  { key: 'Pointer統一', max: 2, why: 'docs/rules/control-panel.md #3',
    fn: (t) => (/\bpointerdown\b/i.test(t) ? (/\btouchstart\b/i.test(t) ? 1 : 2) : 0),
    hint: 'touchstart/mousedown の二重バインドをやめ Pointer Events に統一する（併用は1点）' },
  { key: 'setPointerCapture', max: 2, why: '押しっぱなしバグの根因',
    fn: (t) => (/setPointerCapture/.test(t) ? 2 : 0),
    hint: 'pointerdown 内で el.setPointerCapture(e.pointerId) を呼ぶ' },
  { key: '共通部品', max: 2, why: 'コピペ禁止。正本は titans-ui/src/components/Controls/',
    fn: (t) => (/fc-ios-controller|titans-ui/.test(t) ? 2 : 0),
    hint: 'fc-ios-controller.{css,js} を正本からコピーして参照する（手書きしない）' },
  { key: '入力解除', max: 1, why: '指が外れたまま入力が残る事故',
    fn: (t) => (/\bpointercancel\b|releasePointerCapture/i.test(t) ? 1 : 0),
    hint: 'pointercancel / lostpointercapture でキーを false に戻す' },
  { key: 'touch-action', max: 1, why: 'body:manipulation / canvas:none の2段構え',
    fn: (t) => (/touch-action\s*:/i.test(t) ? 1 : 0), hint: 'CSS に touch-action を書く' },
  { key: '拡大防止', max: 1, why: 'ダブルタップ拡大の抑止',
    fn: (t) => (/maximum-scale|user-scalable\s*=\s*no|touch-action\s*:\s*manipulation/i.test(t) ? 1 : 0),
    hint: 'viewport meta に maximum-scale=1,user-scalable=no' },
  { key: 'safe-area', max: 1, why: 'ホームインジケータにボタンが潜る',
    fn: (t) => (/safe-area-inset/i.test(t) ? 1 : 0), hint: 'env(safe-area-inset-bottom) を使う' },
  { key: 'dvh', max: 1, why: 'iOS のアドレスバーで 100vh がずれる',
    fn: (t) => (/\d+dvh/i.test(t) ? 1 : 0), hint: '100vh ではなく 100dvh を使う' },
  { key: '下25%帯', max: 1, why: 'docs/rules/control-panel.md #6（327で確定）',
    fn: (t) => (/25dvh|--ph\s*:|flex:\s*0\s*0\s*75%|height:\s*75%/i.test(t) ? 1 : 0),
    hint: '--ph:25dvh で下25%を操作帯に、ゲーム画面を上75%に収める' },
  { key: '仮想パッド', max: 1, why: '4方向が要る作品は十字パッド',
    fn: (t) => (/dpad|d-pad|十字/i.test(t) ? 1 : 0), hint: 'DOMオーバーレイ型の十字パッドを置く（canvas内に描かない）' },
  { key: '明示ポーズ', max: 1, why: 'control-panel.md #5（264本中13本しか無かった）',
    fn: (t) => (/(id|class)=["'][^"']*paus|pauseBtn|togglePause|ポーズ|一時停止/i.test(t) ? 1 : 0),
    hint: 'プレイヤーが自分で止められるポーズを置く（visibilitychange だけでは不可）' },
  { key: 'ミュート', max: 1, why: 'control-panel.md #1（約47本が鳴るが消せない）',
    fn: (t) => (/muted|isMute|toggleMute|mute\s*=/.test(t) ? 1 : 0), hint: 'ミュートトグルと状態保存を置く' },
  { key: '音声unlock', max: 1, why: 'iOS は resume() を通さないと鳴らない',
    fn: (t) => ((/AudioContext|webkitAudioContext/.test(t) && /\.resume\(\)/.test(t)) ? 1 : 0),
    hint: '初回タップで AC.resume() を呼ぶ' },
  { key: 'tgキー', max: 1, why: 'control-panel.md #2（GitHub Pages は同一オリジン）',
    fn: (t, g) => {
      if (!/localStorage/.test(t)) return 1;          // そもそも保存しないなら減点しない
      const num = (g.match(/^(\d+)-/) || [])[1];
      return num && new RegExp(`tg\\.${num}\\.`).test(t) ? 1 : 0;
    },
    hint: 'localStorage のキーを tg.<フォルダ番号>.<key> にする（既存キーの改名はセーブが消えるので読み替えを入れる）' },
];
const MAX_SCORE = CHECKS.reduce((a, c) => a + c.max, 0);

function scoreGame(name) {
  const dir = join(root, name);
  const { text, files } = readSource(dir);
  if (!files) return null;
  const detail = {};
  for (const c of CHECKS) detail[c.key] = c.fn(text, name);
  const score = Object.values(detail).reduce((a, b) => a + b, 0);
  return { game: name, score, max: MAX_SCORE, files, detail };
}

function gameDirs() {
  return readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d+-/.test(e.name))
    .map((e) => e.name).sort();
}

// ---- 全数モード ----
if (wantAll) {
  const rows = gameDirs().map(scoreGame).filter(Boolean)
    .sort((a, b) => b.score - a.score || a.game.localeCompare(b.game));
  if (wantCsv) {
    const keys = CHECKS.map((c) => c.key);
    console.log(['順位', 'ゲーム', 'スコア', `満点${MAX_SCORE}`, ...keys].join(','));
    rows.forEach((r, i) => console.log([i + 1, r.game, r.score, MAX_SCORE, ...keys.map((k) => r.detail[k])].join(',')));
  } else if (wantJson) {
    console.log(JSON.stringify({ max: MAX_SCORE, rows }, null, 1));
  } else {
    console.log(`コントローラ採点 — ${rows.length}本 / 満点${MAX_SCORE} / 平均${(rows.reduce((a, r) => a + r.score, 0) / rows.length).toFixed(1)}\n`);
    rows.slice(0, 20).forEach((r, i) => console.log(`${String(i + 1).padStart(3)}. ${r.game.padEnd(36)} ${String(r.score).padStart(2)}/${MAX_SCORE}`));
    console.log('\n── 未達率（高い順＝横展開の候補）');
    CHECKS.map((c) => {
      const ng = rows.filter((r) => r.detail[c.key] < c.max).length;
      return { key: c.key, ng, pct: Math.round((ng / rows.length) * 100) };
    }).sort((a, b) => b.ng - a.ng)
      .forEach((x) => console.log(`   ${x.key.padEnd(20)} ${String(x.ng).padStart(3)}本 ${String(x.pct).padStart(3)}%`));
  }
  process.exit(0);
}

// ---- 単体モード ----
if (!input) {
  console.error('使い方: node _tools/controller-audit.mjs <ゲームフォルダ> [--json] | --all [--csv]');
  process.exit(2);
}
const target = resolve(root, input);
if (!target.startsWith(`${root}${sep}`) || !existsSync(target) || !statSync(target).isDirectory()) {
  console.error(`対象フォルダが見つからない: ${input}`);
  process.exit(2);
}
const r = scoreGame(relative(root, target));
if (!r) { console.error('html/js/css が1つも読めなかった'); process.exit(2); }

if (wantJson) {
  console.log(JSON.stringify(r, null, 1));
} else {
  console.log(`\nコントローラ採点: ${r.game}  →  ${r.score}/${r.max}  (${r.files}ファイル)\n`);
  for (const c of CHECKS) {
    const v = r.detail[c.key];
    const mark = v === c.max ? '○' : v > 0 ? '△' : '×';
    console.log(`  ${mark} ${c.key.padEnd(20)} ${v}/${c.max}   ${c.why}`);
  }
  const ng = CHECKS.filter((c) => r.detail[c.key] < c.max);
  if (ng.length) {
    console.log('\n── 直し方');
    ng.forEach((c) => console.log(`  ・${c.key}: ${c.hint}`));
  } else {
    console.log('\n満点。コード監査上の未達なし（遊べるかどうかは harness と実機で確認する）。');
  }
}
process.exit(r.score === r.max ? 0 : 1);
