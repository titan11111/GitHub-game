// ============================================================
//  interactions.js — 「調べる」と寄り道の中身
//  decorateStreet: 通勤路に寄り道（コンビニ・猫・鳩）を足す
//  bindInteractions: spot の id に振る舞いを結びつける
// ============================================================

import { CONFIG } from './config.js'
import { Dialog, toast, sfx } from './utils.js'
import { playTetris, playSickCall, playCoffee, playPigeons, playSleep, choiceDialog } from './minigames.js'

// ============================================================
//  通勤路の寄り道を足す
// ============================================================
export function decorateStreet(THREE, B, street) {
  const g = street.group

  // ---- コンビニ（道の途中・右手） ----
  const conv = B.box(7.2, 3.4, 5.2, 0xf2f2ee, 10.4, 1.7, 10)
  conv.userData.solid = { w: 7.2, d: 5.2 }
  g.add(conv)
  g.add(B.box(7.4, 0.7, 5.4, 0x2f8f5a, 10.4, 3.7, 10))
  const cs = B.sign('24h  ローソク', 3.6, 0.9, '#0f7a46', '#ffffff')
  cs.position.set(6.7, 2.4, 10)
  cs.rotation.y = -Math.PI / 2
  g.add(cs)
  const cwin = B.box(0.08, 1.8, 4.2, 0xbfe4f2, 6.78, 1.5, 10, { transparent: true, opacity: 0.6 })
  g.add(cwin)

  // ---- 猫（道端・左手の塀の上） ----
  const cat = new THREE.Group()
  cat.add(B.box(0.62, 0.3, 0.26, 0x4a4238, 0, 0.3, 0))
  cat.add(B.ball(0.19, 0x4a4238, -0.36, 0.42, 0, 10))
  cat.add(B.box(0.07, 0.11, 0.04, 0x4a4238, -0.42, 0.56, 0.08))
  cat.add(B.box(0.07, 0.11, 0.04, 0x4a4238, -0.42, 0.56, -0.08))
  const tail = B.cyl(0.035, 0.05, 0.5, 0x4a4238, 0.36, 0.48, 0, 6)
  tail.rotation.z = -0.9
  cat.add(tail)
  cat.add(B.ball(0.035, 0xffe86a, -0.5, 0.45, 0.07, 6))
  cat.add(B.ball(0.035, 0xffe86a, -0.5, 0.45, -0.07, 6))
  cat.position.set(-7.0, 0.62, 2)
  cat.rotation.y = Math.PI / 2
  g.add(cat)
  const fence = B.box(1.6, 0.62, 0.5, 0xa89f90, -7.0, 0.31, 2)
  fence.userData.solid = { w: 1.6, d: 0.5 }
  g.add(fence)
  street.catMesh = cat

  // ---- 鳩の群れ（歩道をふさぐ） ----
  const flock = new THREE.Group()
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Group()
    p.add(B.box(0.22, 0.16, 0.14, 0x8f96a2, 0, 0.1, 0))
    p.add(B.ball(0.07, 0x9aa2ae, -0.13, 0.2, 0, 8))
    p.add(B.box(0.05, 0.03, 0.03, 0xe0a04a, -0.19, 0.19, 0))
    p.position.set((Math.random() - 0.5) * 2.4, 0, (Math.random() - 0.5) * 2.4)
    p.rotation.y = Math.random() * Math.PI * 2
    flock.add(p)
  }
  flock.position.set(5.6, 0.14, -18)
  g.add(flock)
  street.flockMesh = flock

  street.spots.push(
    { id: 'conv', label: 'コンビニに入る', x: 7.0, z: 10, r: 2.2 },
    { id: 'cat', label: '猫をなでる', x: -6.2, z: 2, r: 2.0 },
    { id: 'pigeons', label: '鳩を追い払う', x: 5.6, z: -18, r: 2.4 },
  )
}

// ============================================================
//  spot の振る舞い
// ============================================================
export function bindInteractions(game) {
  const S = CONFIG.SCORE
  const C = CONFIG.COST
  const H = game.handlers

  const once = (spot) => { spot.hidden = true }

  // ---------------- 自宅 ----------------
  H.alarm = (g, spot) => {
    if (g.flags.woke) { toast('もう止まっている。'); return }
    g.flags.woke = true
    g.addMinutes(C.ALARM)
    g.addScore(S.ALARM, '目覚ましを止めた')
    g.quest('目覚ましを止めた')
    sfx.ok()
    const flash = document.getElementById('alarm-flash')
    if (flash) flash.classList.remove('active')
    if (g.scenes.home.clockMesh) g.scenes.home.clockMesh.material = g.B.mat(0x6a6a70)
    g.updateObjective()
    Dialog.show([
      { speaker: '心の声', text: '（……6時32分。まだ間に合う。まだ、間に合うはずだ）' },
      { speaker: '心の声', text: '（着替えて、鞄を持って、家を出る。手順は分かっている）' },
    ])
  }

  H.closet = (g, spot) => {
    if (!g.flags.woke) { toast('まず目覚ましを止めよう。'); return }
    if (g.flags.dressed) { toast('もう着替えた。'); return }
    g.flags.dressed = true
    g.addMinutes(C.DRESS)
    g.addScore(S.DRESS, '着替えた')
    g.quest('着替えた')
    sfx.get()
    g.updateObjective()
    Dialog.show([{ speaker: '心の声', text: '（ワイシャツ、ネクタイ、靴下。月曜の制服を着る）' }])
  }

  H.breakfast = async (g, spot) => {
    if (spot.hidden) { toast('もう食べた。'); return }
    const pick = await choiceDialog('食卓', '食パンとコーヒーがある。朝食にする？', ['食べる（12分）', 'コーヒーだけ（8分）', 'やめる'])
    if (pick === 2) return
    if (pick === 0) {
      g.addMinutes(C.BREAKFAST)
      g.addScore(S.BREAKFAST, '朝食を食べた')
      g.quest('朝食を食べた')
      once(spot)
      sfx.get()
      Dialog.show([{ speaker: '心の声', text: '（食べた。今日はたぶん、これで最後までもつ）' }])
      return
    }
    g.inMinigame = true
    const ok = await playCoffee(g)
    g.inMinigame = false
    g.addMinutes(C.COFFEE)
    once(spot)
    if (ok) { g.addScore(S.COFFEE, 'コーヒー成功'); g.quest('コーヒーを淹れた') }
    else { g.addScore(-40, 'こぼした'); g.addMinutes(5); toast('床を拭いた。5分損した。') }
  }

  H.bag = (g, spot) => {
    if (g.flags.hasBag) { toast('もう持っている。'); return }
    g.flags.hasBag = true
    g.takeBag()
    g.addMinutes(C.BAG)
    g.addScore(S.BAG, '鞄を取った')
    g.quest('鞄を取った')
    once(spot)
    sfx.get()
    const bm = g.scenes.home.bagMesh
    if (bm && bm.parent) bm.parent.remove(bm)
    g.updateObjective()
    toast('鞄は武器にもなる。（Ⓔ で振れる）', 2400)
  }

  H.bed = async (g, spot) => {
    const pick = await choiceDialog('布団', 'まだ温かい。もう一度、ここに入る？', ['入る（会社に電話する）', 'やめる'])
    if (pick !== 0) return
    g.inMinigame = true
    const ok = await playSickCall(g)
    g.inMinigame = false
    g.quest('仮病の電話をかけた')
    if (ok) {
      g.addScore(300, '完璧な仮病')
      g.quest('言い訳が完璧だった')
    } else {
      g.addScore(60, '怪しい仮病')
    }
    Dialog.show([
      { speaker: '課長', text: ok ? '『分かった。ゆっくり休め』' : '『……そうか。まあ、無理はするな』' },
      { speaker: '心の声', text: ok ? '（通った。布団に戻る）' : '（バレている気がする。それでも布団に戻る）' },
    ], () => g.endGame('sick'))
  }

  H.exit = (g) => {
    if (!g.flags.dressed) { toast('パジャマでは行けない。'); sfx.ng(); return }
    if (!g.flags.hasBag) { toast('鞄を忘れている。'); sfx.ng(); return }
    g.goto('street')
    Dialog.show([{ speaker: '心の声', text: '（外は思ったより明るい。駅まで、走るか歩くか）' }])
  }

  // ---------------- 通勤路 ----------------
  H.home_back = (g) => g.goto('home')

  H.conv = async (g, spot) => {
    if (spot.hidden) { toast('もう買った。'); return }
    const pick = await choiceDialog('コンビニ', 'おにぎりと栄養ドリンクが並んでいる。', ['おにぎりを買う（7分）', '通り過ぎる'])
    if (pick !== 0) return
    g.addMinutes(C.ONIGIRI)
    g.addScore(S.ONIGIRI, 'おにぎりを買った')
    g.quest('おにぎりを買った')
    once(spot)
    sfx.get()
    toast('昼まで持ちこたえる保険を手に入れた。')
  }

  H.cat = (g, spot) => {
    if (spot.hidden) { toast('猫はもう行った。'); return }
    g.addMinutes(C.CAT)
    g.addScore(S.CAT, '猫をなでた')
    g.quest('猫をなでた')
    once(spot)
    sfx.ok()
    const cat = g.scenes.street.catMesh
    if (cat) cat.rotation.y += 0.7
    Dialog.show([
      { speaker: '猫', text: '『……』' },
      { speaker: '心の声', text: '（5分使った。だが月曜の朝に猫をなでられる人生は、そう悪くない）' },
    ])
  }

  H.pigeons = async (g, spot) => {
    if (spot.hidden) { toast('歩道はもう空いている。'); return }
    if (!g.flags.hasBag) { toast('素手では近寄れない。'); sfx.ng(); return }
    g.inMinigame = true
    const ok = await playPigeons(g)
    g.inMinigame = false
    g.addMinutes(C.PIGEON)
    if (ok) {
      g.addScore(S.PIGEON, '鳩を追い払った')
      g.quest('鳩を追い払った')
      once(spot)
      const fl = g.scenes.street.flockMesh
      if (fl && fl.parent) fl.parent.remove(fl)
      toast('歩道が空いた。')
    } else {
      g.addScore(-30, '鳩に負けた')
      g.addMinutes(4)
      toast('鳩は動かない。迂回して4分損した。')
    }
  }

  H.station = (g) => {
    g.goto('station')
    Dialog.show([{ speaker: '心の声', text: '（改札の音。ここから先は、時間が他人のものになる）' }])
  }

  // ---------------- 駅 ----------------
  H.street_back = (g) => g.goto('street')

  H.gate = (g) => {
    if (g.flags.gate) { toast('もう通った。'); return }
    g.flags.gate = true
    g.addMinutes(C.GATE)
    g.quest('改札を通った')
    sfx.ok()
    g.updateObjective()
    toast('ピッ。')
  }

  H.tetris = async (g, spot) => {
    const pick = await choiceDialog('筐体', '『TETRIS』── 電源が入っている。1個落ちるごとに1分。', ['遊ぶ', 'やめておく'])
    if (pick !== 0) return
    g.inMinigame = true
    const r = await playTetris(g)
    g.inMinigame = false
    g.quest(`テトリスで${r.lines}段けした`)
    if (g.time >= CONFIG.DEADLINE_MIN) {
      Dialog.show([
        { speaker: '心の声', text: `（${r.pieces}個落として、${r.lines}段そろえた）` },
        { speaker: '心の声', text: '（……9時を過ぎている。今日はもう、行かない）' },
      ], () => g.endGame('tetris'))
      return
    }
    toast(`${r.lines}段けした。${r.pieces}分使った。`, 2400)
  }

  H.platform = async (g) => {
    if (!g.flags.gate) { toast('改札を通っていない。'); sfx.ng(); return }
    sfx.train()
    g.addMinutes(C.BOARD)
    g.flags.boarded = true
    g.addScore(S.TRAIN, '電車に乗った')
    g.quest('電車に乗った')
    g.goto('train')
    Dialog.show([
      { speaker: '車内放送', text: '『次は、会社前。会社前です』' },
      { speaker: '心の声', text: '（座るか、吊り革か。座ると──たぶん寝る）' },
    ])
  }

  // ---------------- 電車 ----------------
  const arrive = (g) => {
    g.goto('office')
    Dialog.show([
      { speaker: '車内放送', text: '『会社前、会社前。お出口は右側です』' },
      { speaker: '心の声', text: '（着いた。あとは5階まで上がるだけだ）' },
    ])
  }

  H.seat = async (g, spot) => {
    if (spot.hidden) return
    once(spot)
    const strap = g.scenes.train.spots.find((s) => s.id === 'strap')
    if (strap) strap.hidden = true
    g.addMinutes(C.RIDE)
    g.inMinigame = true
    const awake = await playSleep(g, 11)
    g.inMinigame = false
    if (!awake) {
      g.quest('乗り過ごした')
      Dialog.show([
        { speaker: '車内放送', text: '『終点、海浜公園。終点です』' },
        { speaker: '心の声', text: '（……海が見える。ここはどこだ）' },
      ], () => g.endGame('missstop'))
      return
    }
    g.addScore(100, '寝なかった')
    g.quest('座って耐えた')
    arrive(g)
  }

  H.strap = (g, spot) => {
    if (spot.hidden) return
    once(spot)
    const seat = g.scenes.train.spots.find((s) => s.id === 'seat')
    if (seat) seat.hidden = true
    g.addMinutes(C.RIDE)
    g.addScore(S.STAND, '立って耐えた')
    g.quest('立って耐えた')
    sfx.ok()
    arrive(g)
  }

  // ---------------- 会社 ----------------
  H.elevator = (g) => {
    g.addMinutes(C.ELEVATOR)
    g.quest('エレベーターで上がった')
    sfx.ok()
    g.flags.floor5 = true
    g.goto('office5')
    Dialog.show([{ speaker: '心の声', text: '（誰とも目を合わせない4秒間。これも仕事だ）' }])
  }

  H.stairs = (g) => {
    g.addMinutes(C.STAIRS)
    g.addScore(90, '階段で上がった')
    g.quest('階段で5階まで上がった')
    sfx.ok()
    g.flags.floor5 = true
    g.goto('office5')
    Dialog.show([{ speaker: '心の声', text: '（5階。息が上がっている。健康のためだと自分に言う）' }])
  }

  H.mydesk = (g, spot) => {
    toast('自分の席。まだ座る資格がない。')
  }

  H.kacho = (g) => {
    g.addMinutes(C.GREET)
    const late = g.time >= CONFIG.DEADLINE_MIN
    g.quest(late ? '遅れて挨拶した' : '9時までに挨拶した')
    Dialog.show([
      { speaker: '課長', text: late ? '『……おはよう。まあ、座れ』' : '『おはよう』' },
      { speaker: '心の声', text: late ? '（それだけだった。それがいちばん効く）' : '（それだけだった。それで十分だった）' },
    ], () => g.endGame(late ? 'late' : 'clear'))
  }
}
