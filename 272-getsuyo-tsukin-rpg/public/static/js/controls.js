// ============================================================
//  controls.js — 操作パネル（キーボード ＋ 仮想パッド ＋ ポーズ ＋ ミュート）
//  ・入力は Pointer Events に統一し setPointerCapture を必ず張る（押しっぱなしバグ対策）
//  ・UI は JS から注入する。原本の HTML（template.html / index.tsx）を書き換えない
// ============================================================

import { Dialog, sfx, toggleMute, isMuted, resumeAudio } from './utils.js'

export const Input = {
  move: { x: 0, y: 0 },   // x:右+ / y:前+（-1〜1）
  run: false,
  paused: false,
  _jump: false,
  _interact: false,
  _keys: new Set(),

  consumeJump() { const v = this._jump; this._jump = false; return v },
  consumeInteract() { const v = this._interact; this._interact = false; return v },
  pressJump() { this._jump = true },
  pressInteract() { this._interact = true },
  clear() { this.move.x = 0; this.move.y = 0; this.run = false; this._jump = false; this._interact = false; this._keys.clear(); padReset() },
}

let padEl = null
let onPauseChange = null

// ---------------- キーボード ----------------
const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
}

function keyVector() {
  const k = Input._keys
  let x = 0, y = 0
  if (k.has('left')) x -= 1
  if (k.has('right')) x += 1
  if (k.has('up')) y += 1
  if (k.has('down')) y -= 1
  const len = Math.hypot(x, y)
  return len > 1 ? { x: x / len, y: y / len } : { x, y }
}

function setupKeyboard() {
  window.addEventListener('keydown', (e) => {
    // ダイアログ中は送りだけ受ける
    if (Dialog.active && (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter')) {
      e.preventDefault(); Dialog.advance(); return
    }
    if (KEYMAP[e.code]) { e.preventDefault(); Input._keys.add(KEYMAP[e.code]); applyKeys(); return }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { Input.run = true; return }
    if (e.code === 'Space') { e.preventDefault(); Input.pressJump(); return }
    if (e.code === 'KeyE') { e.preventDefault(); Input.pressInteract(); return }
    if (e.code === 'KeyP' || e.code === 'Escape') { e.preventDefault(); togglePause(); return }
    if (e.code === 'KeyM') { e.preventDefault(); doToggleMute(); return }
  })
  window.addEventListener('keyup', (e) => {
    if (KEYMAP[e.code]) { Input._keys.delete(KEYMAP[e.code]); applyKeys(); return }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') Input.run = false
  })
  // タブが裏に回ったらキーを落とす（押しっぱなし防止）
  window.addEventListener('blur', () => Input.clear())
}

function applyKeys() {
  if (padActive) return          // 仮想パッド操作中はそちらを優先
  const v = keyVector()
  Input.move.x = v.x
  Input.move.y = v.y
}

// ---------------- 仮想パッド ----------------
let padActive = false
let padPointerId = null

function padReset() {
  padActive = false
  padPointerId = null
  if (padEl) padEl.className = 'vpad'
}

const DIRS = ['u', 'd', 'l', 'r']

function padVectorFrom(el, e) {
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  let x = (e.clientX - cx) / (r.width / 2)
  let y = -(e.clientY - cy) / (r.height / 2)
  const len = Math.hypot(x, y)
  if (len < 0.22) return { x: 0, y: 0 }      // 中央デッドゾーン
  if (len > 1) { x /= len; y /= len }
  return { x, y }
}

function paintPad(v) {
  if (!padEl) return
  padEl.classList.toggle('press-u', v.y > 0.35)
  padEl.classList.toggle('press-d', v.y < -0.35)
  padEl.classList.toggle('press-l', v.x < -0.35)
  padEl.classList.toggle('press-r', v.x > 0.35)
}

function buildUI() {
  const wrap = document.createElement('div')
  wrap.id = 'controls'
  wrap.innerHTML = `
    <div id="sysbar">
      <button id="btn-pause" class="sysbtn" aria-label="ポーズ">⏸</button>
      <button id="btn-mute" class="sysbtn" aria-label="ミュート">🔊</button>
    </div>
    <div class="vpad" id="vpad" aria-label="十字キー" role="group">
      <span class="arr u"></span><span class="arr d"></span>
      <span class="arr l"></span><span class="arr r"></span>
      <span class="hub"></span>
    </div>
    <div class="vbtns">
      <button class="vbtn vbtn-run" id="btn-run" aria-label="走る">走</button>
      <button class="vbtn vbtn-jump" id="btn-jump" aria-label="ジャンプ">跳</button>
      <button class="vbtn vbtn-act" id="btn-act" aria-label="調べる・攻撃">E</button>
    </div>
    <div id="pause-veil" class="hidden">
      <div class="pause-box">
        <h2>一時停止</h2>
        <p>月曜の朝は待ってくれる。</p>
        <button id="btn-resume">▶ 再開する</button>
      </div>
    </div>`
  document.body.appendChild(wrap)
  padEl = wrap.querySelector('#vpad')

  // --- 十字キー（PointerEvents + setPointerCapture） ---
  padEl.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    padEl.setPointerCapture(e.pointerId)
    padPointerId = e.pointerId
    padActive = true
    const v = padVectorFrom(padEl, e)
    Input.move.x = v.x; Input.move.y = v.y
    paintPad(v)
  })
  padEl.addEventListener('pointermove', (e) => {
    if (!padActive || e.pointerId !== padPointerId) return
    e.preventDefault()
    const v = padVectorFrom(padEl, e)
    Input.move.x = v.x; Input.move.y = v.y
    paintPad(v)
  })
  const padUp = (e) => {
    if (e.pointerId !== padPointerId) return
    try { padEl.releasePointerCapture(e.pointerId) } catch (err) { /* 解放済み */ }
    padReset()
    Input.move.x = 0; Input.move.y = 0
    applyKeys()
  }
  padEl.addEventListener('pointerup', padUp)
  padEl.addEventListener('pointercancel', padUp)

  // --- ボタン（押しっぱなし=run / 単発=jump, act） ---
  holdButton(wrap.querySelector('#btn-run'), (down) => { Input.run = down })
  tapButton(wrap.querySelector('#btn-jump'), () => { Input.pressJump() })
  tapButton(wrap.querySelector('#btn-act'), () => {
    if (Dialog.active) { Dialog.advance(); return }
    Input.pressInteract()
  })

  // --- システム ---
  tapButton(wrap.querySelector('#btn-pause'), () => togglePause())
  tapButton(wrap.querySelector('#btn-mute'), () => doToggleMute())
  tapButton(wrap.querySelector('#btn-resume'), () => togglePause(false))

  refreshMuteIcon()
}

function holdButton(el, fn) {
  if (!el) return
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    el.setPointerCapture(e.pointerId)
    el.classList.add('pressed')
    resumeAudio()
    fn(true)
  })
  const up = (e) => {
    try { el.releasePointerCapture(e.pointerId) } catch (err) { /* 解放済み */ }
    el.classList.remove('pressed')
    fn(false)
  }
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
}

function tapButton(el, fn) {
  if (!el) return
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    el.setPointerCapture(e.pointerId)
    el.classList.add('pressed')
    resumeAudio()
    fn()
  })
  const up = (e) => {
    try { el.releasePointerCapture(e.pointerId) } catch (err) { /* 解放済み */ }
    el.classList.remove('pressed')
  }
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
}

// ---------------- ポーズ / ミュート ----------------
export function togglePause(force) {
  const next = typeof force === 'boolean' ? force : !Input.paused
  Input.paused = next
  const veil = document.getElementById('pause-veil')
  if (veil) veil.classList.toggle('hidden', !next)
  const btn = document.getElementById('btn-pause')
  if (btn) btn.textContent = next ? '▶' : '⏸'
  if (next) Input.clear()
  sfx.page()
  if (onPauseChange) onPauseChange(next)
  return next
}

function doToggleMute() {
  const m = toggleMute()
  refreshMuteIcon()
  if (!m) sfx.ok()
  return m
}

function refreshMuteIcon() {
  const btn = document.getElementById('btn-mute')
  if (btn) btn.textContent = isMuted() ? '🔇' : '🔊'
}

/** iOS のダブルタップ拡大・ピンチを止める保険（touch-action だけに頼らない） */
function setupTouchGuards() {
  let lastEnd = 0
  document.addEventListener('touchend', (e) => {
    const now = Date.now()
    if (now - lastEnd <= 320) e.preventDefault()   // 2回目のタップだけ潰す＝通常のclickは生きる
    lastEnd = now
  }, { passive: false })
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault()   // 2本指のピンチ拡大
  }, { passive: false })
  document.addEventListener('gesturestart', (e) => e.preventDefault())
}

/** ゲーム側から呼ぶ。pauseHook はポーズ切替時に通知される */
export function initControls(pauseHook) {
  onPauseChange = pauseHook || null
  setupKeyboard()
  setupTouchGuards()
  buildUI()
  // 裏に回ったら自動でポーズ（明示ポーズとは別に、取りこぼし防止）
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !Input.paused) togglePause(true)
  })
  return Input
}

export function showControls(show) {
  const el = document.getElementById('controls')
  if (el) el.classList.toggle('playing', !!show)
}
