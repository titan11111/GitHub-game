// ============================================================
//  game.js — 進行・描画・当たり判定・エンディング
//  時計はゲーム内の「分」で進み、9:00（DEADLINE_MIN）が出社期限。
// ============================================================

import { CONFIG, rankOf } from './config.js'
import { Dialog, fmtTime, toast, sfx, lsGet, lsSet, bgmStop, clamp } from './utils.js'
import { Input, initControls, togglePause, showControls } from './controls.js'

export class Game {
  constructor(THREE, B, scenes) {
    this.THREE = THREE
    this.B = B
    this.scenes = scenes

    // ---- 状態 ----
    this.time = CONFIG.START_MIN
    this.score = 0
    this.ending = null
    this.running = false
    this.inMinigame = false
    this.flags = { woke: false, dressed: false, hasBag: false, gate: false, boarded: false, floor5: false }
    this.quests = {}            // index.tsx の results.quests へ入る内容
    this.handlers = {}          // interactions.js が id → 関数 を登録する
    this.area = null
    this._alarmTimer = null

    this._initThree()
    this._initPlayer()
    initControls((paused) => { if (paused) Input.clear() })
    this._bindUI()
    this.goto('home', true)
  }

  // ---------------- 3D ----------------
  _initThree() {
    const THREE = this.THREE
    const canvas = document.getElementById('game-canvas')
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
    // iOS のメモリと発熱を考えて DPR は 2 で打ち止め
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.scene = new THREE.Scene()
    // 縦持ちは横方向の画角が極端に狭くなる（aspect 0.46 だと 58° → 実質29°）。
    // 部屋の中が見えないので広めに取る。
    this.camera = new THREE.PerspectiveCamera(72, 1, 0.1, 400)
    this.amb = new THREE.AmbientLight(0xffffff, 1.5)
    this.dir = new THREE.DirectionalLight(0xffffff, 1.9)
    this.scene.add(this.amb, this.dir)
    this._resize()
    window.addEventListener('resize', () => this._resize())
    window.addEventListener('orientationchange', () => setTimeout(() => this._resize(), 260))
  }

  _resize() {
    const w = window.innerWidth, h = window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  _initPlayer() {
    const THREE = this.THREE
    this.player = this.B.person({ suit: 0x2b4a7a, tie: 0xc24a3a })
    this.scene.add(this.player)
    this.vel = new THREE.Vector3()
    this.py = 0
    this.vy = 0
    this.onGround = true
    this.walkPhase = 0
    this.facing = Math.PI
    this.heldBag = null
  }

  _bindUI() {
    const again = document.getElementById('ending-again')
    if (again) again.onclick = () => location.reload()
  }

  // ---------------- エリア切り替え ----------------
  goto(key, silent) {
    const next = this.scenes[key]
    if (!next) return
    if (this.area) this.scene.remove(this.area.group)
    this.area = next
    this.scene.add(next.group)

    this.scene.background = new this.THREE.Color(next.sky)
    this.scene.fog = next.fog ? new this.THREE.Fog(next.fog[0], next.fog[1], next.fog[2]) : null
    this.amb.intensity = next.light.amb
    this.dir.intensity = next.light.dir
    this.dir.position.set(...next.light.dirPos)

    this.player.position.set(next.spawn.x, 0, next.spawn.z)
    this.vel.set(0, 0, 0)
    this.py = 0; this.vy = 0
    this._collectSolids()
    this._setHudScene(next.name)
    if (!silent) { toast(next.name, 1400) }
    this.updateObjective()
  }

  /** userData.solid を持つ Mesh/Group を集めて AABB の一覧にする */
  _collectSolids() {
    const list = []
    const v = new this.THREE.Vector3()
    this.area.group.updateMatrixWorld(true)
    this.area.group.traverse((o) => {
      const s = o.userData && o.userData.solid
      if (!s) return
      o.getWorldPosition(v)
      list.push({ x: v.x, z: v.z, hw: s.w / 2, hd: s.d / 2 })
    })
    this.solids = list
  }

  // ---------------- 開始 ----------------
  start() {
    this.running = true
    showControls(true)
    document.getElementById('hud').classList.add('on')
    this.last = performance.now()
    this._loop()
  }

  // ---------------- HUD ----------------
  _setHudScene(name) {
    const el = document.getElementById('hud-scene')
    if (el) el.textContent = name
  }

  updateObjective() {
    const f = this.flags
    let t = ''
    if (!f.woke) t = '目覚ましを止めろ'
    else if (!f.dressed) t = '着替える（クローゼット）'
    else if (!f.hasBag) t = '鞄を取る'
    else if (this.area && this.area.key === 'home') t = '家を出る'
    else if (this.area && this.area.key === 'street') t = '駅へ向かう'
    else if (this.area && this.area.key === 'station') t = f.gate ? '1番線から電車に乗る' : '改札を通る'
    else if (this.area && this.area.key === 'train') t = '会社前まで耐える'
    else if (this.area && this.area.key === 'office') t = '5階へ上がる'
    else if (this.area && this.area.key === 'office5') t = '課長に挨拶する'
    const el = document.getElementById('hud-objective')
    if (el) el.textContent = '▶ ' + t
  }

  _hud() {
    const t = document.getElementById('hud-time')
    if (t) t.textContent = fmtTime(this.time)
    const s = document.getElementById('hud-score')
    if (s) s.textContent = String(this.score)
    const p = document.getElementById('hud-progress')
    if (p) {
      const span = CONFIG.DEADLINE_MIN - CONFIG.START_MIN
      const r = clamp((this.time - CONFIG.START_MIN) / span, 0, 1)
      p.style.width = (r * 100).toFixed(1) + '%'
      p.classList.toggle('warn', r > 0.75)
      p.classList.toggle('danger', r >= 1)
    }
    const clock = document.getElementById('hud-clock')
    if (clock) clock.classList.toggle('over', this.time >= CONFIG.DEADLINE_MIN)
  }

  // ---------------- 得点・時間 ----------------
  addScore(n, label) {
    this.score = Math.max(0, this.score + n)
    if (label) toast(`${label}  ${n >= 0 ? '+' : ''}${n}`)
    this._hud()
  }

  addMinutes(n) {
    this.time += n
    this._hud()
    if (this.time >= CONFIG.LIMIT_MIN && !this.ending) this.endGame('late')
  }

  quest(key, value = true) { this.quests[key] = value }

  // ---------------- 調べる ----------------
  _nearestSpot() {
    if (!this.area) return null
    const px = this.player.position.x, pz = this.player.position.z
    let best = null, bestD = Infinity
    for (const s of this.area.spots) {
      if (s.hidden) continue
      const d = Math.hypot(px - s.x, pz - s.z)
      if (d < s.r && d < bestD) { best = s; bestD = d }
    }
    return best
  }

  _prompt(spot) {
    const el = document.getElementById('prompt')
    if (!el) return
    if (spot) {
      el.textContent = `E / Ⓔ  ${spot.label}`
      el.classList.add('show')
    } else {
      el.classList.remove('show')
    }
  }

  interact() {
    const s = this._nearestSpot()
    if (!s) return
    const fn = this.handlers[s.id]
    if (!fn) { toast('いまは何も起きない。'); return }
    fn(this, s)
  }

  // ---------------- ループ ----------------
  _loop() {
    if (!this.running) return
    requestAnimationFrame(() => this._loop())
    const now = performance.now()
    let dt = (now - this.last) / 1000
    this.last = now
    if (dt > 0.1) dt = 0.1                       // タブ復帰時の飛びを抑える

    const frozen = Input.paused || Dialog.active || this.inMinigame || !!this.ending

    if (!frozen) {
      this._stepPlayer(dt)
      this.time += dt / CONFIG.SEC_PER_MIN
      if (this.time >= CONFIG.LIMIT_MIN) this.endGame('late')
      const spot = this._nearestSpot()
      this._prompt(spot)
      if (Input.consumeInteract()) this.interact()
      if (Input.consumeJump() && this.onGround) {
        this.vy = CONFIG.JUMP; this.onGround = false; sfx.jump()
      }
    } else {
      this._prompt(null)
      if (Input.consumeInteract() && Dialog.active) Dialog.advance()
      Input.consumeJump()
    }
    // ミニゲーム中も時計だけは進む（寄り道のコスト）
    if (this.inMinigame && !this.ending) this.time += dt / CONFIG.SEC_PER_MIN

    this._camera(dt)
    this._hud()
    this.renderer.render(this.scene, this.camera)
  }

  _stepPlayer(dt) {
    const C = CONFIG
    const speed = Input.run ? C.RUN : C.WALK
    const want = { x: Input.move.x * speed, z: -Input.move.y * speed }
    // 加速・減速
    const k = (want.x || want.z) ? C.ACCEL : C.FRICTION
    this.vel.x += (want.x - this.vel.x) * Math.min(1, k * dt)
    this.vel.z += (want.z - this.vel.z) * Math.min(1, k * dt)

    const p = this.player.position
    const nx = p.x + this.vel.x * dt
    const nz = p.z + this.vel.z * dt
    p.x = nx; p.z = nz
    this._pushOut()

    // 範囲内に収める
    const b = this.area.bound
    p.x = clamp(p.x, b.minX, b.maxX)
    p.z = clamp(p.z, b.minZ, b.maxZ)

    // ジャンプ
    this.vy -= C.GRAVITY * dt
    this.py += this.vy * dt
    if (this.py <= 0) { this.py = 0; this.vy = 0; this.onGround = true }
    p.y = this.py

    // 向きと歩行アニメ
    const sp = Math.hypot(this.vel.x, this.vel.z)
    if (sp > 0.4) {
      this.facing = Math.atan2(this.vel.x, this.vel.z)
      this.walkPhase += dt * (Input.run ? 15 : 9)
    } else {
      this.walkPhase += dt * 1.2
    }
    this.player.rotation.y = this.facing
    const pr = this.player.userData.parts
    if (pr) {
      const a = Math.sin(this.walkPhase) * (sp > 0.4 ? 0.85 : 0.08)
      pr.legL.rotation.x = a
      pr.legR.rotation.x = -a
      pr.armL.rotation.x = -a * 0.8
      pr.armR.rotation.x = a * 0.8
      pr.head.position.y = 1.52 + Math.abs(Math.sin(this.walkPhase)) * (sp > 0.4 ? 0.025 : 0)
    }
  }

  /** 円（プレイヤー）と AABB（障害物）の押し出し */
  _pushOut() {
    const p = this.player.position
    const r = CONFIG.PLAYER_R
    for (const s of this.solids) {
      const dx = p.x - s.x, dz = p.z - s.z
      const ox = s.hw + r - Math.abs(dx)
      const oz = s.hd + r - Math.abs(dz)
      if (ox > 0 && oz > 0) {
        if (ox < oz) { p.x += Math.sign(dx || 1) * ox; this.vel.x = 0 }
        else { p.z += Math.sign(dz || 1) * oz; this.vel.z = 0 }
      }
    }
  }

  _camera(dt) {
    const p = this.player.position
    const C = CONFIG
    // 天井のある屋内はエリア側の指定を使う（既定値のままだと天井の上に出る）
    const cam = (this.area && this.area.cam) || { back: C.CAM_BACK, up: C.CAM_UP }
    const want = {
      x: p.x - Math.sin(this.facing) * cam.back * 0.35,
      y: p.y + cam.up,
      z: p.z + cam.back,
    }
    // 屋内はカメラを部屋の内側に留める。壁の外へ出ると面が裏返って視界が塞がる
    if (this.area.indoor) {
      const b = this.area.bound
      want.x = clamp(want.x, b.minX + 0.3, b.maxX - 0.3)
      want.z = clamp(want.z, b.minZ + 0.3, b.maxZ - 0.3)
    }
    const c = this.camera.position
    const t = 1 - Math.pow(1 - C.CAM_LERP, dt * 60)
    c.x += (want.x - c.x) * t
    c.y += (want.y - c.y) * t
    c.z += (want.z - c.z) * t
    this.camera.lookAt(p.x, p.y + 1.0, p.z - 1.2)
  }

  // ---------------- 鞄を持つ ----------------
  takeBag() {
    if (this.heldBag) return
    const bag = this.B.bag()
    bag.scale.set(0.85, 0.85, 0.85)
    bag.position.set(0.34, 0.72, 0.06)
    this.player.add(bag)
    this.heldBag = bag
  }

  // ---------------- 終了 ----------------
  endGame(kind) {
    if (this.ending) return
    this.ending = kind
    this.running = false
    if (this._alarmTimer) clearInterval(this._alarmTimer)
    const flash = document.getElementById('alarm-flash')
    if (flash) flash.classList.remove('active')
    showControls(false)
    bgmStop()
    Input.clear()

    const arriveMin = Math.round(this.time)
    let score = this.score

    if (kind === 'clear') {
      const early = Math.max(0, CONFIG.DEADLINE_MIN - arriveMin)
      score += CONFIG.SCORE.ARRIVE + early * CONFIG.SCORE.PER_MIN_EARLY
    } else if (kind === 'late') {
      const over = Math.max(0, arriveMin - CONFIG.DEADLINE_MIN)
      score = Math.max(0, score - over * CONFIG.SCORE.LATE_PENALTY)
    }
    this.score = Math.round(score)

    const TEXT = {
      clear: {
        title: '★ 出社成功 ★',
        desc: `${fmtTime(arriveMin)} 着席。課長は「おはよう」とだけ言った。月曜はそれで十分だ。`,
      },
      late: {
        title: '遅刻',
        desc: `${fmtTime(arriveMin)} 到着。フロアの空気が一段下がる音を、あなたは確かに聞いた。`,
      },
      sick: {
        title: '仮病',
        desc: '布団の中で天井を見ている。自由なのに、なぜか誰にも言えない自由だ。',
      },
      missstop: {
        title: '乗り過ごし',
        desc: '目を開けたら知らない駅名だった。海が見える。会社は、見えない。',
      },
      tetris: {
        title: 'テトリス',
        desc: `けした段はきれいに揃った。${fmtTime(arriveMin)}、会社は揃わなかった。`,
      },
    }
    const info = TEXT[kind] || TEXT.late
    const rank = kind === 'clear' ? rankOf(this.score) : (kind === 'late' ? 'C' : 'E')

    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v }
    set('ending-rank', 'RANK ' + rank)
    set('ending-title', info.title)
    set('ending-desc', info.desc)

    const best = Math.max(Number(lsGet(CONFIG.LS.BEST, 0)) || 0, this.score)
    lsSet(CONFIG.LS.BEST, best)
    lsSet(CONFIG.LS.RUNS, (Number(lsGet(CONFIG.LS.RUNS, 0)) || 0) + 1)
    this._saveResult(kind, this.score, arriveMin)

    const qs = Object.keys(this.quests)
    const stats = document.getElementById('ending-stats')
    if (stats) {
      stats.innerHTML = `
        <div class="stat-row"><span>スコア</span><b>${this.score}</b></div>
        <div class="stat-row"><span>到着時刻</span><b>${fmtTime(arriveMin)}</b></div>
        <div class="stat-row"><span>自己最高</span><b>${best}</b></div>
        <div class="stat-row"><span>やったこと</span><b>${qs.length ? qs.length + ' 件' : 'なし'}</b></div>
        ${qs.length ? `<div class="stat-quests">${qs.map((q) => `<span>${q}</span>`).join('')}</div>` : ''}`
    }
    const ed = document.getElementById('ending')
    if (ed) ed.classList.remove('hidden')
    kind === 'clear' ? sfx.clear() : sfx.fail()
  }

  /** index.tsx の POST /api/results と同じ形で localStorage に残す（Pages は静的なので D1 の代わり） */
  _saveResult(ending, score, arriveMin) {
    const rows = lsGet(CONFIG.LS.RESULTS, [])
    const list = Array.isArray(rows) ? rows : []
    list.push({
      ending,
      score,
      arrive_min: arriveMin,
      quests: this.quests,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    })
    list.sort((a, b) => b.score - a.score)
    lsSet(CONFIG.LS.RESULTS, list.slice(0, 20))
  }
}
