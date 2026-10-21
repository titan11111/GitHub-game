/**
 * capture-screenshots.js
 * 000-gamesight2/images/ に画像がないゲームを自動検出してスクリーンショットを取得する
 *
 * 使い方:
 *   node capture-screenshots.js              # 不足画像を自動検出して撮影
 *   node capture-screenshots.js 136-retro-action 137-punch  # 指定リポジトリのみ撮り直す
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://titan11111.github.io';
const SCRIPT_JS = path.join(__dirname, '000-gamesight2', 'script.js');
const OUTPUT_DIR = path.join(__dirname, '000-gamesight2', 'images');

// ─── games リストを script.js から抽出 ────────────────────────────────────────
function loadGames() {
  const src = fs.readFileSync(SCRIPT_JS, 'utf8');

  // const games = [...]; の配列部分を抽出
  const match = src.match(/const games\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error('script.js から games が見つかりません');
  return JSON.parse(match[1]);
}

// additionalCheckGames も抽出
function loadAdditional(src) {
  const match = src.match(/const additionalCheckGames\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return [];
  return JSON.parse(match[1]);
}

// playPathOverrides を抽出
function loadOverrides(src) {
  const match = src.match(/const playPathOverrides\s*=\s*(\{[\s\S]*?\});/);
  if (!match) return {};
  return JSON.parse(match[1]);
}

function getAllGames() {
  const src = fs.readFileSync(SCRIPT_JS, 'utf8');
  const games = loadGames();
  const additional = loadAdditional(src);
  const seen = new Set(games.map(g => g.repo));
  additional.forEach(g => { if (!seen.has(g.repo)) games.push(g); });
  return { games, overrides: loadOverrides(src) };
}

// ─── 不足画像を検出 ────────────────────────────────────────────────────────────
function findMissing(games) {
  return games.filter(g => {
    if (g.status === 'wip') return false;  // 準備中はスキップ
    const imgPath = path.join(OUTPUT_DIR, `${g.repo}.png`);
    return !fs.existsSync(imgPath);
  });
}

// ─── キャプチャ ────────────────────────────────────────────────────────────────
function getUrl(repo, overrides) {
  const playPath = overrides[repo] || repo;
  return `${BASE_URL}/${playPath}/`;
}

async function capture(page, repo, overrides) {
  const url = getUrl(repo, overrides);
  const outPath = path.join(OUTPUT_DIR, `${repo}.png`);

  console.log(`  → ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
  } catch {
    console.log('    (タイムアウト — そのまま撮影)');
  }

  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({
    path: outPath,
    clip: { x: 0, y: 0, width: 800, height: 480 },
  });

  console.log(`    保存: ${path.basename(outPath)}`);
}

// ─── メイン ────────────────────────────────────────────────────────────────────
async function main() {
  const { games, overrides } = getAllGames();

  // コマンドライン引数があれば対象を絞る、なければ不足分を自動検出
  const args = process.argv.slice(2);
  const targets = args.length > 0
    ? games.filter(g => args.includes(g.repo))
    : findMissing(games);

  if (targets.length === 0) {
    console.log('不足している画像はありません。');
    return;
  }

  console.log(`撮影対象: ${targets.length} 件\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 800, height: 480 },
  });

  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ja,en' });

  let ok = 0, fail = 0;

  for (const target of targets) {
    console.log(`[${target.repo}] ${target.title}`);
    try {
      await capture(page, target.repo, overrides);
      ok++;
    } catch (err) {
      console.error(`    エラー: ${err.message}`);
      fail++;
    }
  }

  await browser.close();
  console.log(`\n完了: 成功 ${ok} / 失敗 ${fail}`);

  if (fail > 0) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
