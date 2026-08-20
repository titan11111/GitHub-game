#!/usr/bin/env node

import { createServer } from 'node:http';
import { stat, writeFile } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);
const input = process.argv[2];
const target = input ? resolve(root, input) : null;
const limitBytes = 20 * 1024 * 1024;

if (!target || !target.startsWith(`${root}${sep}`) || !existsSync(target)) {
  console.error('使い方: node _tools/game-harness.mjs <ゲームフォルダ>');
  process.exit(2);
}

const indexFile = join(target, 'index.html');
if (!existsSync(indexFile)) {
  console.error(`FAIL: index.html がありません: ${relative(root, target)}`);
  process.exit(2);
}

async function loadPlaywright() {
  let globalModule = '';
  try {
    globalModule = join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'playwright/index.mjs');
  } catch {
    // Global npm packages are optional.
  }
  const candidates = [
    join(root, 'node_modules/playwright/index.mjs'),
    join(root, '170-FFClone/node_modules/playwright/index.mjs'),
    globalModule,
  ];
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return import(pathToFileURL(candidate).href);
  }
  throw new Error('Playwrightが見つかりません。`npm install -D playwright` を実行してください。');
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
};

const requests = new Map();
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const wanted = pathname === '/' ? '/index.html' : pathname;
    const file = resolve(target, `.${wanted}`);
    if (!file.startsWith(`${target}${sep}`)) throw new Error('invalid path');
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    requests.set(relative(target, file), info.size);
    res.writeHead(200, { 'Content-Type': mime[extname(file).toLowerCase()] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const { port } = server.address();
const url = `http://127.0.0.1:${port}/`;
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
let browser;

try {
  const { chromium } = await loadPlaywright();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));

  await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
  const initial = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return {
      title: document.title,
      canvas: Boolean(canvas),
      canvasWidth: canvas?.width || 0,
      canvasHeight: canvas?.height || 0,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      bodyText: document.body?.innerText?.slice(0, 500) || '',
    };
  });

  const frameSample = await page.evaluate(async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { frames: 0, changed: false };
    const signature = () => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        const w = Math.max(1, Math.min(canvas.width, 64));
        const h = Math.max(1, Math.min(canvas.height, 64));
        const data = ctx.getImageData(0, 0, w, h).data;
        let hash = 0;
        for (let i = 0; i < data.length; i += 97) hash = ((hash * 31) + data[i]) >>> 0;
        return String(hash);
      } catch {
        return 'unreadable';
      }
    };
    const before = signature();
    let frames = 0;
    const start = performance.now();
    await new Promise((done) => {
      const tick = () => {
        frames += 1;
        if (performance.now() - start >= 1000) done();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return { frames, changed: before !== signature() };
  });

  const clickable = page.locator('button, [role="button"], canvas').first();
  let tap = '対象なし';
  if (await clickable.count()) {
    try {
      await clickable.tap({ timeout: 3_000 });
      tap = 'イベント送信成功';
    } catch (error) {
      tap = `失敗: ${error.message.split('\n')[0]}`;
    }
  }
  await page.waitForTimeout(300);

  const downloadedBytes = [...requests.values()].reduce((sum, bytes) => sum + bytes, 0);
  const checks = [
    ['index.html', true, '存在'],
    ['モバイル幅', initial.scrollWidth <= initial.viewportWidth + 2,
      `${initial.scrollWidth}px / viewport ${initial.viewportWidth}px`],
    ['Canvas', initial.canvas, initial.canvas ? `${initial.canvasWidth}×${initial.canvasHeight}` : 'なし'],
    ['描画ループ', !initial.canvas || frameSample.frames >= 30, `${frameSample.frames} RAF/秒`],
    ['タップ', !tap.startsWith('失敗'), tap],
    ['コンソールエラー', consoleErrors.length === 0 && pageErrors.length === 0,
      `${consoleErrors.length + pageErrors.length}件`],
    ['リクエスト失敗', failedRequests.length === 0, `${failedRequests.length}件`],
    // 2026-08-20: 20MB鉄則に緩和（タイタン決定）。iPhone実用上限に基づく。プレイ時ダウンロード量が上限超なら FAIL。
    ['通信量20MB以下', downloadedBytes <= limitBytes,
      `${(downloadedBytes / 1024 / 1024).toFixed(2)}MB（上限20.00MB）`],
  ];
  const passed = checks.every(([, ok]) => ok);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = join(root, 'docs', 'harness-reports');
  const reportFile = join(reportDir, `${relative(root, target).replaceAll('/', '_')}-${stamp}.md`);
  const { mkdir } = await import('node:fs/promises');
  await mkdir(reportDir, { recursive: true });
  const details = [...consoleErrors, ...pageErrors, ...failedRequests];
  const markdown = [
    `# Game Harness Report: ${relative(root, target)}`,
    '',
    `- Result: **${passed ? 'PASS' : 'FAIL'}**`,
    `- Time: ${new Date().toISOString()}`,
    `- URL: ${url}`,
    `- Title: ${initial.title || '(none)'}`,
    '',
    '| Check | Result | Evidence |',
    '|---|---:|---|',
    ...checks.map(([name, ok, evidence]) => `| ${name} | ${ok ? 'PASS' : 'FAIL'} | ${String(evidence).replaceAll('|', '\\|')} |`),
    '',
    '## Errors',
    '',
    ...(details.length ? details.map((item) => `- ${item}`) : ['- None']),
    '',
  ].join('\n');
  await writeFile(reportFile, markdown);

  for (const [name, ok, evidence] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: ${evidence}`);
  }
  console.log(`RESULT ${passed ? 'PASS' : 'FAIL'}`);
  console.log(`REPORT ${relative(root, reportFile)}`);
  process.exitCode = passed ? 0 : 1;
} catch (error) {
  console.error(`HARNESS ERROR: ${error.message}`);
  process.exitCode = 2;
} finally {
  if (browser) await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
