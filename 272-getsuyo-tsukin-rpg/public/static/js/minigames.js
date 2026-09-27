// ============================================================
//  minigames.js — 寄り道とサボりの中身
//  すべて #minigame（DOM）で動かし、Promise で結果を返す。
//  ミニゲーム中も時計は進む＝寄り道にはコストがある。
// ============================================================

import { sfx, toast, tone } from './utils.js'
import { CONFIG } from './config.js'

const host = () => document.getElementById('minigame')

function open(html, cls = '') {
  const el = host()
  el.className = cls
  el.innerHTML = html
  el.classList.remove('hidden')
  return el
}
function close() {
  const el = host()
  el.classList.add('hidden')
  el.innerHTML = ''
  el.className = 'hidden'
}

/** タップ専用の結線（iOS は pointerdown で即反応させる） */
function tap(el, fn) {
  if (!el) return
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    try { el.setPointerCapture(e.pointerId) } catch (err) { /* 失敗しても続行 */ }
    el.classList.add('pressed')
    fn(e)
  })
  const up = () => el.classList.remove('pressed')
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
}

// ============================================================
//  選択ダイアログ
//  choiceDialog('心の声', '二度寝するか？', ['する', 'しない']) → Promise<number>
// ============================================================
export function choiceDialog(speaker, text, options) {
  return new Promise((resolve) => {
    const btns = options.map((o, i) => `<button class="mg-choice" data-i="${i}">${o}</button>`).join('')
    const el = open(`
      <div class="mg-box mg-choicebox">
        ${speaker ? `<div class="mg-speaker">${speaker}</div>` : ''}
        <p class="mg-text">${text}</p>
        <div class="mg-choices">${btns}</div>
      </div>`, 'mg-overlay')
    el.querySelectorAll('.mg-choice').forEach((b) => {
      tap(b, () => { sfx.ok(); close(); resolve(Number(b.dataset.i)) })
    })
  })
}

// ============================================================
//  コーヒー（ゲージをちょうどいい所で止める）
// ============================================================
export function playCoffee(game) {
  return new Promise((resolve) => {
    const el = open(`
      <div class="mg-box">
        <h3>☕ コーヒーを注ぐ</h3>
        <p class="mg-text">緑の帯で止めろ。溢れたら床を拭くことになる。</p>
        <div class="mg-gauge"><div class="mg-zone"></div><div class="mg-fill" id="cof-fill"></div></div>
        <button class="mg-big" id="cof-stop">止める</button>
      </div>`, 'mg-overlay')
    const fill = el.querySelector('#cof-fill')
    let v = 0, dir = 1, done = false
    const iv = setInterval(() => {
      v += dir * 1.7
      if (v >= 100) { v = 100; dir = -1 }
      if (v <= 0) { v = 0; dir = 1 }
      fill.style.width = v + '%'
      if (v > 60 && v < 85) tone(1400, 0.015, 'square', 0.08)
    }, 16)
    const finish = (ok) => {
      if (done) return
      done = true
      clearInterval(iv)
      ok ? sfx.get() : sfx.ng()
      close()
      resolve(ok)
    }
    tap(el.querySelector('#cof-stop'), () => finish(v > 60 && v < 85))
    setTimeout(() => finish(false), 9000)
  })
}

// ============================================================
//  鳩（鞄で追い払う。3回タイミングを合わせる）
// ============================================================
export function playPigeons(game) {
  return new Promise((resolve) => {
    const el = open(`
      <div class="mg-box">
        <h3>🕊 鳩の群れ</h3>
        <p class="mg-text">歩道をふさいでいる。鞄を振って3回追い払え。</p>
        <div class="mg-track"><div class="mg-target"></div><div class="mg-marker" id="pg-mk"></div></div>
        <div class="mg-count">追い払った: <b id="pg-n">0</b> / 3</div>
        <button class="mg-big" id="pg-hit">鞄を振る</button>
      </div>`, 'mg-overlay')
    const mk = el.querySelector('#pg-mk')
    const nEl = el.querySelector('#pg-n')
    let p = 0, dir = 1, n = 0, tries = 0, done = false
    const iv = setInterval(() => {
      p += dir * 2.3
      if (p >= 100) { p = 100; dir = -1 }
      if (p <= 0) { p = 0; dir = 1 }
      mk.style.left = p + '%'
    }, 16)
    const finish = (ok) => {
      if (done) return
      done = true
      clearInterval(iv)
      ok ? sfx.get() : sfx.ng()
      close()
      resolve(ok)
    }
    tap(el.querySelector('#pg-hit'), () => {
      tries++
      if (p > 38 && p < 62) { n++; nEl.textContent = n; sfx.hit(); if (n >= 3) finish(true) }
      else { sfx.ng(); toast('空振り。鳩は動じない。') }
      if (tries >= 8 && n < 3) finish(false)
    })
    setTimeout(() => finish(n >= 3), 14000)
  })
}

// ============================================================
//  仮病の電話（言い訳を組み立てる。矛盾すると見抜かれる）
// ============================================================
export function playSickCall(game) {
  const SCRIPT = [
    {
      q: '課長「もしもし、どうした？」',
      a: [{ t: '熱があって……38度2分です', ok: true }, { t: '腹が痛くて……たぶん盲腸です', ok: false, why: '盲腸は「たぶん」で言うと嘘に聞こえる' }],
    },
    {
      q: '課長「病院は行ったのか？」',
      a: [{ t: 'これから行きます。午前中に', ok: true }, { t: 'もう行きました。薬もらいました', ok: false, why: '6:40 に開いている病院の話になると詰む' }],
    },
    {
      q: '課長「今日の資料、どうする？」',
      a: [{ t: '共有フォルダに置いてあります。場所を送ります', ok: true }, { t: '……明日やります', ok: false, why: '仕事が止まると、仮病が仮病でなくなる' }],
    },
  ]
  return new Promise((resolve) => {
    let i = 0, ok = true
    const step = () => {
      if (i >= SCRIPT.length) { close(); resolve(ok); return }
      const s = SCRIPT[i]
      const el = open(`
        <div class="mg-box mg-phone">
          <h3>📞 会社に電話する</h3>
          <p class="mg-text">${s.q}</p>
          <div class="mg-choices">
            ${s.a.map((a, k) => `<button class="mg-choice" data-k="${k}">${a.t}</button>`).join('')}
          </div>
        </div>`, 'mg-overlay')
      el.querySelectorAll('.mg-choice').forEach((b) => {
        tap(b, () => {
          const pick = s.a[Number(b.dataset.k)]
          if (pick.ok) { sfx.ok() } else { ok = false; sfx.ng(); toast(pick.why, 2600) }
          i++
          setTimeout(step, pick.ok ? 260 : 900)
        })
      })
    }
    step()
  })
}

// ============================================================
//  テトリス（キヨスク横の筐体。時間を溶かす罠）
//  1個落ちるごとにゲーム内1分が消える。
// ============================================================
const PIECES = [
  { c: '#4ad0e0', r: [[[0, 0], [1, 0], [2, 0], [3, 0]], [[1, -1], [1, 0], [1, 1], [1, 2]]] },           // I
  { c: '#e0c84a', r: [[[0, 0], [1, 0], [0, 1], [1, 1]]] },                                              // O
  { c: '#d05a9a', r: [[[1, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [2, 1], [1, 2]], [[0, 1], [1, 1], [2, 1], [1, 2]], [[1, 0], [0, 1], [1, 1], [1, 2]]] }, // T
  { c: '#6ad06a', r: [[[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [0, 1], [1, 1], [1, 2]]] },            // S
  { c: '#d0764a', r: [[[0, 0], [1, 0], [1, 1], [2, 1]], [[1, 0], [0, 1], [1, 1], [0, 2]]] },            // Z
  { c: '#5a7ae0', r: [[[0, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [0, 2], [1, 2]], [[0, 1], [1, 1], [2, 1], [2, 2]], [[1, 0], [2, 0], [1, 1], [1, 2]]] }, // J
  { c: '#e06a6a', r: [[[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [1, 2], [2, 2]], [[0, 1], [1, 1], [2, 1], [0, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]]] }, // L
]
const TW = 8, TH = 15

export function playTetris(game) {
  return new Promise((resolve) => {
    const cells = []
    let grid = Array.from({ length: TH }, () => Array(TW).fill(null))
    let cur = null, rot = 0, cx = 3, cy = 0
    let lines = 0, pieces = 0, over = false
    let dropTimer = null

    const el = open(`
      <div class="mg-box mg-tetris">
        <h3>🕹 筐体『TETRIS』</h3>
        <div class="mg-tet-head">けした段: <b id="tt-l">0</b> ／ 落ちた数: <b id="tt-p">0</b><span class="mg-warn">⏰ 1個ごとに1分</span></div>
        <div class="mg-tet-grid" id="tt-g"></div>
        <div class="mg-tet-pad">
          <button class="mg-tbtn" id="tt-left">◀</button>
          <button class="mg-tbtn" id="tt-rot">回</button>
          <button class="mg-tbtn" id="tt-right">▶</button>
          <button class="mg-tbtn" id="tt-down">▼</button>
        </div>
        <button class="mg-quit" id="tt-quit">やめて駅に戻る</button>
      </div>`, 'mg-overlay')

    const gEl = el.querySelector('#tt-g')
    gEl.style.setProperty('--tw', TW)
    for (let y = 0; y < TH; y++) {
      cells[y] = []
      for (let x = 0; x < TW; x++) {
        const c = document.createElement('i')
        gEl.appendChild(c)
        cells[y][x] = c
      }
    }

    const shape = () => PIECES[cur].r[rot % PIECES[cur].r.length]
    const fits = (nx, ny, nrot) => {
      const s = PIECES[cur].r[nrot % PIECES[cur].r.length]
      return s.every(([dx, dy]) => {
        const x = nx + dx, y = ny + dy
        return x >= 0 && x < TW && y < TH && (y < 0 || !grid[y][x])
      })
    }
    const spawn = () => {
      cur = Math.floor(Math.random() * PIECES.length)
      rot = 0; cx = Math.floor(TW / 2) - 1; cy = -1
      if (!fits(cx, cy, rot)) { finish(true) }
    }
    const lock = () => {
      shape().forEach(([dx, dy]) => {
        const y = cy + dy, x = cx + dx
        if (y >= 0) grid[y][x] = PIECES[cur].c
      })
      let cleared = 0
      for (let y = TH - 1; y >= 0; y--) {
        if (grid[y].every((v) => v)) {
          grid.splice(y, 1)
          grid.unshift(Array(TW).fill(null))
          cleared++; y++
        }
      }
      if (cleared) {
        lines += cleared
        el.querySelector('#tt-l').textContent = lines
        sfx.get()
        game.addScore(CONFIG.SCORE.TETRIS_LINE * cleared, `${cleared}段けした`)
      }
      pieces++
      el.querySelector('#tt-p').textContent = pieces
      game.addMinutes(1)                       // ここが罠：1個ごとに1分溶ける
      if (game.time >= CONFIG.LIMIT_MIN) return finish(false)
      spawn()
    }
    const draw = () => {
      for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
        cells[y][x].style.background = grid[y][x] || 'rgba(255,255,255,0.06)'
      }
      if (cur !== null) shape().forEach(([dx, dy]) => {
        const y = cy + dy, x = cx + dx
        if (y >= 0 && y < TH && x >= 0 && x < TW) cells[y][x].style.background = PIECES[cur].c
      })
    }
    const step = () => {
      if (over) return
      if (fits(cx, cy + 1, rot)) cy++
      else lock()
      draw()
    }
    const finish = (gameover) => {
      if (over) return
      over = true
      clearInterval(dropTimer)
      close()
      resolve({ lines, pieces, gameover: !!gameover })
    }

    tap(el.querySelector('#tt-left'), () => { if (fits(cx - 1, cy, rot)) { cx--; draw(); tone(600, 0.02, 'square', 0.15) } })
    tap(el.querySelector('#tt-right'), () => { if (fits(cx + 1, cy, rot)) { cx++; draw(); tone(600, 0.02, 'square', 0.15) } })
    tap(el.querySelector('#tt-rot'), () => { if (fits(cx, cy, rot + 1)) { rot++; draw(); tone(880, 0.03, 'square', 0.18) } })
    tap(el.querySelector('#tt-down'), () => { step(); tone(300, 0.02, 'square', 0.15) })
    tap(el.querySelector('#tt-quit'), () => finish(false))

    spawn(); draw()
    dropTimer = setInterval(step, 620)
  })
}

// ============================================================
//  眠気（座ってしまった人向け。連打で起きていろ）
//  失敗すると乗り過ごす。
// ============================================================
export function playSleep(game, seconds = 11) {
  return new Promise((resolve) => {
    const el = open(`
      <div class="mg-box mg-sleep">
        <h3>😪 まぶたが重い</h3>
        <p class="mg-text">座ってしまった。会社前まで <b id="sl-t">${seconds}</b> 秒、起きていろ。</p>
        <div class="mg-gauge mg-gauge-sleep"><div class="mg-fill mg-fill-sleep" id="sl-f"></div></div>
        <div class="mg-sleep-note">満タンになると、知らない駅で目が覚める</div>
        <button class="mg-big mg-big-wake" id="sl-b">起きる！</button>
      </div>`, 'mg-overlay')
    const f = el.querySelector('#sl-f')
    const tEl = el.querySelector('#sl-t')
    let v = 18, left = seconds, done = false
    const rise = setInterval(() => {
      v += 1.55
      if (v >= 100) { v = 100; finish(false) }
      f.style.width = v + '%'
      f.classList.toggle('hot', v > 66)
    }, 60)
    const count = setInterval(() => {
      left--
      tEl.textContent = String(Math.max(0, left))
      if (left <= 0) finish(true)
    }, 1000)
    const finish = (ok) => {
      if (done) return
      done = true
      clearInterval(rise); clearInterval(count)
      ok ? sfx.ok() : sfx.fail()
      close()
      resolve(ok)
    }
    tap(el.querySelector('#sl-b'), () => {
      v = Math.max(0, v - 11)
      f.style.width = v + '%'
      tone(760, 0.03, 'square', 0.22)
    })
  })
}
