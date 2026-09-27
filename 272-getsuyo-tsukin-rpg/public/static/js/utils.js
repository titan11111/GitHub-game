// ============================================================
//  utils.js — 共通部品（時刻表記・トースト・ダイアログ・音・保存）
// ============================================================

import { CONFIG } from './config.js'

// ---------------- 時刻 ----------------
/** 分 → "HH:MM"（index.tsx / ランキング側と同じ表記） */
export function fmtTime(min) {
  const m = Math.max(0, Math.floor(min))
  return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')
}

export function clamp(v, a, b) { return v < a ? a : v > b ? b : v }

// ---------------- 保存 ----------------
export function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : JSON.parse(v)
  } catch (e) { return fallback }
}
export function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch (e) { /* 容量超過でもゲームは止めない */ }
}

// ---------------- 音（WebAudio・iOS対応） ----------------
let AC = null
let masterGain = null
let muted = lsGet(CONFIG.LS.MUTE, false) === true
let bgmTimer = null
let bgmStep = 0

function audioInit() {
  if (AC) return
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    AC = new Ctx()
    masterGain = AC.createGain()
    masterGain.gain.value = muted ? 0 : 0.28
    masterGain.connect(AC.destination)
  } catch (e) { AC = null }   // 音が出なくてもゲームは止めない
}

/** iOS の最初のタップで必ず通す */
export function resumeAudio() {
  audioInit()
  if (AC && AC.state === 'suspended') AC.resume()
  bgmStart()
}

export function isMuted() { return muted }

export function setMuted(v) {
  muted = !!v
  lsSet(CONFIG.LS.MUTE, muted)
  if (masterGain && AC) masterGain.gain.setTargetAtTime(muted ? 0 : 0.28, AC.currentTime, 0.02)
  return muted
}

export function toggleMute() { return setMuted(!muted) }

/** 単音 */
export function tone(freq, dur = 0.12, type = 'square', gain = 0.5, delay = 0) {
  audioInit()
  if (!AC || !masterGain) return
  const t0 = AC.currentTime + delay
  const osc = AC.createOscillator()
  const g = AC.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g); g.connect(masterGain)
  osc.start(t0); osc.stop(t0 + dur + 0.02)
}

export const sfx = {
  ok()      { tone(880, 0.08, 'square', 0.4); tone(1320, 0.10, 'square', 0.35, 0.07) },
  ng()      { tone(190, 0.18, 'sawtooth', 0.4) },
  step()    { tone(140, 0.04, 'triangle', 0.18) },
  jump()    { tone(520, 0.09, 'square', 0.3); tone(760, 0.07, 'square', 0.22, 0.06) },
  get()     { tone(660, 0.07, 'square', 0.4); tone(990, 0.07, 'square', 0.4, 0.06); tone(1320, 0.12, 'square', 0.35, 0.12) },
  hit()     { tone(240, 0.10, 'sawtooth', 0.45) },
  page()    { tone(1200, 0.03, 'square', 0.2) },
  clear()   { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.20, 'square', 0.4, i * 0.13)) },
  fail()    { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.26, 'triangle', 0.4, i * 0.16)) },
  train()   { tone(90, 0.7, 'sawtooth', 0.22); tone(120, 0.7, 'sawtooth', 0.16, 0.1) },
}

/** 目覚まし（standalone-entry.js から 1.5秒ごとに呼ばれる） */
export function alarmSound() {
  tone(1180, 0.1, 'square', 0.5)
  tone(1180, 0.1, 'square', 0.5, 0.16)
  tone(1180, 0.1, 'square', 0.5, 0.32)
}

// ---------------- BGM（朝の通勤・軽い8小節ループ） ----------------
const BGM = [
  [262, 0], [330, 1], [392, 2], [330, 3],
  [294, 4], [370, 5], [440, 6], [370, 7],
  [262, 8], [330, 9], [392, 10], [523, 11],
  [494, 12], [392, 13], [330, 14], [294, 15],
]
export function bgmStart() {
  audioInit()
  if (!AC || bgmTimer) return
  bgmTimer = setInterval(() => {
    if (muted) return
    const beat = bgmStep % 16
    const note = BGM.find((n) => n[1] === beat)
    if (note) tone(note[0], 0.16, 'triangle', 0.16)
    if (beat % 4 === 0) tone(70, 0.1, 'square', 0.2)
    bgmStep++
  }, 250)
}
export function bgmStop() { if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null } }

// ---------------- トースト ----------------
let toastTimer = null
export function toast(msg, ms = 1900) {
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent = msg
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), ms)
}

// ---------------- ダイアログ ----------------
export const Dialog = {
  lines: [],
  idx: 0,
  active: false,
  onDone: null,
  _el: null,

  init() {
    this._el = document.getElementById('dialog')
    if (!this._el) return
    // 画面のどこでも送れる（iPhone は画面下部が親指圏）
    this._el.addEventListener('pointerdown', (e) => { e.preventDefault(); this.advance() })
  },

  /** lines: [{speaker, text}] / onDone: 全部送り終えたあとのコールバック */
  show(lines, onDone) {
    if (!this._el) this.init()
    this.lines = Array.isArray(lines) ? lines.slice() : [{ speaker: '', text: String(lines) }]
    this.idx = 0
    this.onDone = onDone || null
    this.active = true
    this._el.classList.remove('hidden')
    this._render()
  },

  _render() {
    const l = this.lines[this.idx]
    if (!l) return
    const sp = document.getElementById('dialog-speaker')
    const tx = document.getElementById('dialog-text')
    const hi = document.getElementById('dialog-hint')
    if (sp) { sp.textContent = l.speaker || ''; sp.style.display = l.speaker ? 'block' : 'none' }
    if (tx) tx.textContent = l.text || ''
    if (hi) hi.textContent = this.idx >= this.lines.length - 1 ? '▼ 閉じる（タップ / Space）' : '▼ 次へ（タップ / Space）'
  },

  advance() {
    if (!this.active) return
    sfx.page()
    this.idx++
    if (this.idx >= this.lines.length) return this.close()
    this._render()
  },

  close() {
    this.active = false
    if (this._el) this._el.classList.add('hidden')
    const cb = this.onDone
    this.onDone = null
    if (cb) cb()
  },
}
