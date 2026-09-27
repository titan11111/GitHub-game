import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// ---------------- 記録API ----------------
app.get('/api/results', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT ending, score, arrive_min, created_at FROM results ORDER BY score DESC LIMIT 20`
    ).all()
    return c.json({ results: results ?? [] })
  } catch (e) {
    return c.json({ results: [], error: String(e) })
  }
})

app.get('/api/stats', async (c) => {
  try {
    const total = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM results`).first()
    const best = await c.env.DB.prepare(`SELECT MAX(score) AS s FROM results`).first()
    const byEnding = await c.env.DB.prepare(
      `SELECT ending, COUNT(*) AS n FROM results GROUP BY ending ORDER BY n DESC`
    ).all()
    return c.json({ total: total?.n ?? 0, best: best?.s ?? 0, byEnding: byEnding?.results ?? [] })
  } catch (e) {
    return c.json({ total: 0, best: 0, byEnding: [], error: String(e) })
  }
})

app.post('/api/results', async (c) => {
  try {
    const body = await c.req.json()
    const ending = String(body.ending ?? 'unknown').slice(0, 32)
    const score = Number(body.score) || 0
    const arriveMin = Number(body.arrive_min) || 0
    const quests = JSON.stringify(body.quests ?? {})
    await c.env.DB.prepare(
      `INSERT INTO results (ending, score, arrive_min, quests) VALUES (?, ?, ?, ?)`
    ).bind(ending, score, arriveMin, quests).run()
    return c.json({ ok: true })
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500)
  }
})

// ---------------- ゲーム本体 ----------------
app.get('/favicon.svg', (c) => {
  return c.body(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="52" font-size="54">🚃</text></svg>`,
    200,
    { 'Content-Type': 'image/svg+xml' }
  )
})

app.get('/', (c) => {
  return c.html(PAGE_HTML)
})

app.get('/rankings', (c) => {
  return c.html(RANKING_HTML)
})

export default app

const PAGE_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>月曜朝の通勤RPG</title>
<link rel="preconnect" href="https://cdn.jsdelivr.net" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="stylesheet" href="/static/style.css" />
</head>
<body>
<canvas id="game-canvas"></canvas>
<div id="alarm-flash"></div>

<!-- HUD -->
<div id="hud" class="hidden-if-js-disabled">
  <div id="hud-top">
    <div id="hud-left">
      <span id="hud-scene">自宅</span>
      <span id="hud-objective">▶ 目覚ましを止めろ</span>
    </div>
    <div id="hud-right">
      <div id="hud-clock">
        <span class="clock-icon">🕐</span>
        <span id="hud-time">06:30</span>
      </div>
      <div id="hud-score-box">SCORE <span id="hud-score">0</span></div>
    </div>
  </div>
  <div id="hud-timebar"><div id="hud-progress"></div></div>
</div>

<div id="prompt"></div>
<div id="toast"></div>

<!-- ダイアログ -->
<div id="dialog" class="hidden">
  <div class="dialog-box">
    <div id="dialog-speaker"></div>
    <div id="dialog-text"></div>
    <div id="dialog-hint"></div>
  </div>
</div>

<!-- ミニゲーム -->
<div id="minigame" class="hidden"></div>

<!-- 操作ヘルプ -->
<button id="help-btn">❔ 操作</button>
<div id="help-panel" class="hidden">
  <button id="help-close">✕</button>
  <h3>操作方法</h3>
  <ul>
    <li><b>W A S D / ↑←↓→</b> 移動</li>
    <li><b>Shift</b> 走る</li>
    <li><b>Space</b> ジャンプ</li>
    <li><b>E</b> 調べる / 攻撃（鞄を取得後）</li>
    <li><b>Space / E</b> ダイアログ送り</li>
  </ul>
  <p class="help-goal">9:00までに会社5階で課長に挨拶すればクリア！<br>寄り道・サボり・ミニゲームも自由。</p>
</div>

<!-- タイトル画面 -->
<div id="title-screen">
  <div class="title-inner">
    <div class="title-train">🚃</div>
    <h1>月曜朝の<br /><span>通勤RPG</span></h1>
    <p class="title-sub">6:30 起床 ── 9:00 出社<br/>朝の街を駆け抜けろ。道はひとつじゃない。</p>
    <button id="title-start">▶ 月曜日をはじめる</button>
    <p class="title-note">3D / HTML5 / Three.js</p>
  </div>
</div>

<!-- ローディング -->
<div id="loading">
  <div class="load-box">
    <div class="spinner"></div>
    <p id="loading-status">起動中…</p>
  </div>
</div>

<!-- エンディング -->
<div id="ending" class="hidden">
  <div class="ending-box">
    <div id="ending-rank">RANK S</div>
    <h2 id="ending-title">★ 出社成功 ★</h2>
    <p id="ending-desc"></p>
    <div id="ending-stats"></div>
    <div class="ending-actions">
      <button id="ending-again">もう一度月曜を迎える</button>
      <a href="/rankings" target="_blank">🏆 スコアランキング</a>
    </div>
  </div>
</div>

<script type="module" src="/static/js/app.js"></script>
</body>
</html>`

const RANKING_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>スコアランキング | 月曜朝の通勤RPG</title>
<link rel="stylesheet" href="/static/style.css" />
</head>
<body class="ranking-body">
<div class="ranking-wrap">
  <h1>🏆 スコアランキング</h1>
  <p class="rank-sub">月曜の朝、いちばん輝いた出社は誰だ。</p>
  <div id="stats" class="rank-stats"></div>
  <table id="rank-table">
    <thead><tr><th>#</th><th>エンディング</th><th>スコア</th><th>到達時刻</th><th>日時</th></tr></thead>
    <tbody><tr><td colspan="5">読み込み中…</td></tr></tbody>
  </table>
  <a class="rank-back" href="/">← ゲームに戻る</a>
</div>
<script>
const ENDING_LABEL = { clear:'★出社成功', late:'遅刻', sick:'仮病', missstop:'乗り過ごし', tetris:'テトリス' };
function fmt(m){ m=Math.floor(m); return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); }
fetch('/api/results').then(r=>r.json()).then(d=>{
  const tb=document.querySelector('#rank-table tbody');
  if(!d.results||!d.results.length){tb.innerHTML='<tr><td colspan="5">まだ記録がありません。ゲームをプレイしよう！</td></tr>';return;}
  tb.innerHTML=d.results.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+(ENDING_LABEL[r.ending]||r.ending)+'</td><td><b>'+r.score+'</b></td><td>'+fmt(r.arrive_min)+'</td><td>'+(r.created_at||'')+'</td></tr>').join('');
}).catch(()=>{document.querySelector('#rank-table tbody').innerHTML='<tr><td colspan="5">読み込みに失敗しました</td></tr>';});
fetch('/api/stats').then(r=>r.json()).then(d=>{
  document.getElementById('stats').innerHTML='プレイ数 <b>'+(d.total||0)+'</b> ／ 最高スコア <b>'+(d.best||0)+'</b>';
});
</script>
</body>
</html>`
