// ============================================================
//  world.js — エリア定義（自宅 → 街 → 駅 → 電車 → 会社1F → 会社5F）
//  各エリアは { key, name, group, spawn, bound, spots } を返す。
//  spots は「調べられる場所」。振る舞いは interactions.js が id で紐づける。
// ============================================================

export function createScenes(THREE, B) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z)

  function area(key, name, opts) {
    return {
      key, name,
      group: new THREE.Group(),
      spawn: V(0, 0, 0),
      bound: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
      spots: [],
      sky: 0x9fd0f0,
      fog: null,
      light: { amb: 1.4, dir: 1.9, dirPos: [10, 18, 8] },
      cam: null,                 // null なら CONFIG の既定値。天井のある屋内は必ず指定する
      indoor: false,             // true ならカメラを bound の内側に閉じ込める（壁の外へ出さない）
      ...opts,
    }
  }

  function spot(id, label, x, z, r = 1.6, extra = {}) {
    return { id, label, x, z, r, once: false, ...extra }
  }

  // ==========================================================
  //  1. 自宅（6畳＋玄関）
  // ==========================================================
  const home = area('home', '自宅', {
    spawn: V(0, 0, 1.2),
    bound: { minX: -4.3, maxX: 4.3, minZ: -3.8, maxZ: 6.2 },
    sky: 0x2a2f45,
    light: { amb: 1.5, dir: 1.0, dirPos: [4, 10, 6] },
    cam: { back: 5.8, up: 2.95 },        // 天井 3.65 より下に置く
    indoor: true,
  })
  {
    const g = home.group
    g.add(B.floor(9.6, 11, 0xb08c5f, 0.01))
    g.add(B.box(9.6, 0.12, 11, 0x8a6b45, 0, -0.06, 1.2))
    g.add(B.box(9.6, 0.12, 11, 0xd6cfc0, 0, 3.65, 1.2))   // 天井
    // 壁
    g.add(B.wall(9.6, 3.6, 0.2, 0xe8e0d0, 0, 1.8, -4.0))
    g.add(B.wall(0.2, 3.6, 11, 0xe0d8c6, -4.6, 1.8, 1.2))
    g.add(B.wall(0.2, 3.6, 11, 0xe0d8c6, 4.6, 1.8, 1.2))
    g.add(B.wall(9.6, 3.6, 0.2, 0xd8d0be, 0, 1.8, 6.5))
    // 窓（外は暗い朝）
    const win = B.box(2.6, 1.4, 0.06, 0x27406a, -1.6, 1.7, -3.9)
    g.add(win)
    g.add(B.box(2.8, 0.1, 0.16, 0xffffff, -1.6, 1.0, -3.88))

    // 布団
    const bd = B.bed(); bd.position.set(-2.6, 0, 0.6); bd.rotation.y = Math.PI / 2
    bd.userData.solid = { w: 2.2, d: 1.3 }   // 回転後のAABB
    g.add(bd)
    // 枕元の棚と目覚まし
    const shelf = B.box(0.7, 0.5, 0.5, 0x7a5b3c, -2.6, 0.25, -1.6)
    shelf.userData.solid = { w: 0.7, d: 0.5 }
    g.add(shelf)
    const clock = B.box(0.3, 0.22, 0.16, 0xd94b3a, -2.6, 0.61, -1.6)
    clock.name = 'alarmClock'
    g.add(clock)
    g.add(B.box(0.06, 0.06, 0.04, 0xffffff, -2.66, 0.66, -1.69))
    g.add(B.box(0.06, 0.06, 0.04, 0xffffff, -2.54, 0.66, -1.69))

    // クローゼット
    const cl = B.box(1.8, 2.2, 0.6, 0x6f5236, 2.9, 1.1, -3.4)
    cl.userData.solid = { w: 1.8, d: 0.6 }
    g.add(cl)
    g.add(B.box(0.08, 0.5, 0.06, 0xd8c08a, 2.4, 1.2, -3.08))
    g.add(B.box(0.08, 0.5, 0.06, 0xd8c08a, 3.4, 1.2, -3.08))

    // 食卓
    const tb = B.desk(1.5, 0.9, 0x9a7550); tb.position.set(1.4, 0, 1.6)
    g.add(tb)
    g.add(B.box(0.26, 0.1, 0.26, 0xffffff, 1.1, 0.83, 1.6))
    g.add(B.box(0.2, 0.14, 0.2, 0x3a2a20, 1.7, 0.85, 1.6))

    // 鞄（床置き）
    const bg = B.bag(); bg.position.set(-0.2, 0, 4.2)
    bg.name = 'bagItem'
    g.add(bg)

    // 玄関（ドア）
    const door = B.box(1.1, 2.1, 0.12, 0x5a4632, 0, 1.05, 6.4)
    g.add(door)
    g.add(B.ball(0.07, 0xd8c08a, 0.42, 1.05, 6.3, 8))
    const mat0 = B.box(1.4, 0.04, 0.7, 0x4a5a6a, 0, 0.02, 5.9)
    g.add(mat0)

    home.spots.push(
      spot('alarm', '目覚ましを止める', -1.7, -1.6, 1.8),
      spot('closet', '着替える', 2.9, -3.0, 1.8),
      spot('breakfast', '朝食を食べる', 1.4, 1.6, 1.9),
      spot('bag', '鞄を取る', -0.2, 4.2, 1.6),
      spot('bed', '布団に戻る', -1.2, 0.6, 1.7),
      spot('exit', '家を出る', 0, 6.0, 1.8),
    )
    home.clockMesh = clock
    home.bagMesh = bg
  }

  // ==========================================================
  //  2. 街（家 → 駅までの一本道）
  // ==========================================================
  const street = area('street', '通勤路', {
    spawn: V(0, 0, 34),
    bound: { minX: -7.2, maxX: 7.2, minZ: -40, maxZ: 37 },
    sky: 0x8fc2e8,
    fog: [0x9fd0f0, 30, 110],
    light: { amb: 1.5, dir: 2.1, dirPos: [14, 22, 10] },
    cam: { back: 7.2, up: 4.4 },
  })
  {
    const g = street.group
    // 車道と歩道
    g.add(B.floor(17, 90, 0x4c5158, 0.01))
    g.add(B.box(5.2, 0.14, 90, 0x9aa1a8, -6.1, 0.07, -2))
    g.add(B.box(5.2, 0.14, 90, 0x9aa1a8, 6.1, 0.07, -2))
    for (let z = -44; z < 42; z += 4) g.add(B.box(0.24, 0.02, 2, 0xf0f0e8, 0, 0.16, z))

    // 両側のビル
    let seed = 7
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
    const palette = [0x8d949e, 0x7a8592, 0x9aa3ad, 0x6f7a87, 0xa8a196]
    for (let z = -38; z < 38; z += 8.5) {
      for (const side of [-1, 1]) {
        const h = 7 + rnd() * 16
        const w = 5 + rnd() * 2.6
        g.add(B.building(w, h, 7, palette[Math.floor(rnd() * palette.length)], side * (12 + rnd() * 1.4), z + rnd() * 2))
      }
    }
    for (let z = -34; z < 36; z += 11) {
      g.add(B.lamp(-7.6, z)); g.add(B.lamp(7.6, z + 5))
      g.add(B.tree(-8.6, z + 4, 0.9)); g.add(B.tree(8.6, z - 2, 1.05))
    }

    // 駅の入口（道の突き当たり）
    const stn = B.box(15, 8, 9, 0xd8d2c4, 0, 4, -44)
    stn.userData.solid = { w: 15, d: 9 }
    g.add(stn)
    const ent = B.box(4.4, 3.2, 0.4, 0x2b3a4a, 0, 1.6, -39.6)
    g.add(ent)
    const sg = B.sign('みどり台駅', 5.2, 1.2, '#123f6e', '#ffffff')
    sg.position.set(0, 5.4, -39.4)
    g.add(sg)

    street.spots.push(
      spot('station', '駅へ入る', 0, -38.6, 2.4),
      spot('home_back', '家に戻る', 0, 36.4, 2.0),
    )
  }

  // ==========================================================
  //  3. 駅（改札・売店・ホーム）
  // ==========================================================
  const station = area('station', 'みどり台駅', {
    spawn: V(0, 0, 12),
    bound: { minX: -9, maxX: 9, minZ: -14, maxZ: 13.5 },
    sky: 0xb9c6d2,
    light: { amb: 1.7, dir: 1.3, dirPos: [6, 16, 8] },
    cam: { back: 6.4, up: 3.35 },        // 天井 4.6
    indoor: true,
  })
  {
    const g = station.group
    g.add(B.floor(20, 30, 0xb9b3a6, 0.01))
    g.add(B.box(20, 0.1, 30, 0x8f8a80, 0, 4.6, -1))       // 天井
    g.add(B.wall(0.3, 4.6, 30, 0xd2cec2, -9.6, 2.3, -1))
    g.add(B.wall(0.3, 4.6, 30, 0xd2cec2, 9.6, 2.3, -1))
    g.add(B.wall(20, 4.6, 0.3, 0xd2cec2, 0, 2.3, 14))

    // 改札（3レーン）
    for (const x of [-2.6, 0, 2.6]) {
      const a = B.box(0.7, 1.0, 2.2, 0x3a4652, x - 0.8, 0.5, 4)
      const b = B.box(0.7, 1.0, 2.2, 0x3a4652, x + 0.8, 0.5, 4)
      a.userData.solid = { w: 0.7, d: 2.2 }
      b.userData.solid = { w: 0.7, d: 2.2 }
      g.add(a, b)
      g.add(B.box(0.5, 0.06, 0.5, 0xffa33a, x - 0.8, 1.04, 3.4))
    }
    const gsign = B.sign('改札', 2.0, 0.6, '#1d4d2a', '#ffffff')
    gsign.position.set(0, 2.6, 4.0)
    g.add(gsign)

    // 売店（テトリス筐体）
    const kiosk = B.box(3.2, 2.4, 1.6, 0xc2543a, -6.4, 1.2, 8)
    kiosk.userData.solid = { w: 3.2, d: 1.6 }
    g.add(kiosk)
    const ks = B.sign('キヨスク', 2.4, 0.6, '#7a1d12', '#ffe9c0')
    ks.position.set(-6.4, 2.0, 8.85)
    g.add(ks)
    const arcade = B.box(0.9, 1.7, 0.8, 0x2b2f3a, -4.2, 0.85, 8.4)
    arcade.userData.solid = { w: 0.9, d: 0.8 }
    g.add(arcade)
    const screen = B.box(0.7, 0.6, 0.06, 0x120f22, -4.2, 1.28, 8.0)
    screen.material = new B.THREE.MeshBasicMaterial({ color: 0x2b1f55 })
    g.add(screen)
    for (let i = 0; i < 5; i++) {
      const blk = B.box(0.1, 0.1, 0.04, [0x4ad0e0, 0xe0c84a, 0xd05a9a, 0x6ad06a, 0xd0764a][i], -4.44 + i * 0.12, 1.14 + (i % 2) * 0.12, 7.96)
      blk.material = new B.THREE.MeshBasicMaterial({ color: [0x4ad0e0, 0xe0c84a, 0xd05a9a, 0x6ad06a, 0xd0764a][i] })
      g.add(blk)
    }

    // ホーム（改札の奥）
    g.add(B.box(18, 0.9, 7, 0xa8a29a, 0, 0.45, -8))
    const yellow = B.box(18, 0.03, 0.5, 0xe8c23a, 0, 0.92, -5.0)
    g.add(yellow)
    for (let i = 0; i < 18; i += 1) g.add(B.box(0.24, 0.05, 0.24, 0xd8b230, -8.4 + i, 0.95, -5.0))
    const rail = B.box(18, 0.2, 4, 0x3a3630, 0, 0.1, -12.2)
    g.add(rail)
    g.add(B.box(18, 0.1, 0.16, 0x9a958a, 0, 0.26, -11.4))
    g.add(B.box(18, 0.1, 0.16, 0x9a958a, 0, 0.26, -13.0))
    const ps = B.sign('1番線  会社方面', 4.6, 0.8, '#123f6e', '#ffffff')
    ps.position.set(0, 3.0, -9.4)
    g.add(ps)

    station.spots.push(
      spot('gate', '改札を通る', 0, 4.6, 2.0),
      spot('tetris', 'テトリス筐体で遊ぶ', -4.2, 9.0, 1.9),
      spot('platform', '電車に乗る', 0, -5.6, 2.6),
      spot('street_back', '駅を出る', 0, 12.6, 2.0),
    )
  }

  // ==========================================================
  //  4. 電車（車内）
  // ==========================================================
  const train = area('train', '通勤電車', {
    spawn: V(0, 0, 6),
    bound: { minX: -1.2, maxX: 1.2, minZ: -9.4, maxZ: 9.4 },
    sky: 0x1f2430,
    light: { amb: 2.0, dir: 0.8, dirPos: [0, 8, 4] },
    cam: { back: 4.6, up: 1.85 },        // 天井 2.6。ここを外すと天井の上から見下ろす絵になる
    indoor: true,
  })
  {
    const g = train.group
    g.add(B.trainCar(21, 3.4, 2.6))
    const ts = B.sign('次は  会社前', 1.8, 0.4, '#101820', '#8fe08f')
    ts.position.set(0, 2.2, -10.3)
    g.add(ts)
    train.spots.push(
      spot('seat', '座る', 1.0, 0, 1.5),
      spot('strap', '吊り革につかまる', 0, -2.0, 1.6),
    )
  }

  // ==========================================================
  //  5. 会社 1F（ロビー）
  // ==========================================================
  const office = area('office', '会社 1F', {
    spawn: V(0, 0, 9),
    bound: { minX: -8, maxX: 8, minZ: -8, maxZ: 10.5 },
    sky: 0xc8d4de,
    light: { amb: 1.8, dir: 1.2, dirPos: [6, 14, 8] },
    cam: { back: 6.8, up: 3.7 },         // 天井 5.2
    indoor: true,
  })
  {
    const g = office.group
    g.add(B.floor(18, 22, 0xd8d4cc, 0.01))
    g.add(B.box(18, 0.12, 22, 0x9a958c, 0, 5.2, 0))
    g.add(B.wall(18, 5.2, 0.3, 0xe4e0d6, 0, 2.6, -9))
    g.add(B.wall(0.3, 5.2, 22, 0xe4e0d6, -8.6, 2.6, 0))
    g.add(B.wall(0.3, 5.2, 22, 0xe4e0d6, 8.6, 2.6, 0))
    const rec = B.box(4.2, 1.1, 1.0, 0x4a5a6a, -4.6, 0.55, -3)
    rec.userData.solid = { w: 4.2, d: 1.0 }
    g.add(rec)
    const rs = B.sign('受付', 1.6, 0.5, '#243a4a', '#ffffff')
    rs.position.set(-4.6, 1.5, -2.45)
    g.add(rs)

    // エレベーター
    const shaft = B.box(3.4, 3.0, 0.4, 0x8f98a2, 4.0, 1.5, -8.6)
    g.add(shaft)
    const dl = B.box(1.5, 2.4, 0.12, 0xb9c2cc, 3.2, 1.2, -8.3)
    const dr = B.box(1.5, 2.4, 0.12, 0xb9c2cc, 4.8, 1.2, -8.3)
    g.add(dl, dr)
    const es = B.sign('EV', 0.8, 0.5, '#1a2a3a', '#ffd86a')
    es.position.set(4.0, 3.0, -8.25)
    g.add(es)

    // 階段
    for (let i = 0; i < 8; i++) {
      const st = B.box(2.6, 0.22, 0.5, 0xb0a99e, -4.0, 0.11 + i * 0.22, -4.7 - i * 0.5)
      st.userData.solid = { w: 2.6, d: 0.5 }
      g.add(st)
    }
    const ss = B.sign('階段', 1.2, 0.45, '#2a2a2a', '#ffffff')
    ss.position.set(-4.0, 2.6, -8.3)
    g.add(ss)

    office.spots.push(
      spot('elevator', 'エレベーターに乗る', 4.0, -7.4, 2.0),
      spot('stairs', '階段で上がる', -4.0, -3.5, 2.2),
    )
  }

  // ==========================================================
  //  6. 会社 5F（自部署のフロア・課長がいる）
  // ==========================================================
  const office5 = area('office5', '会社 5F', {
    spawn: V(0, 0, 8),
    bound: { minX: -8, maxX: 8, minZ: -8.5, maxZ: 9.5 },
    sky: 0xd2dae2,
    light: { amb: 1.9, dir: 1.2, dirPos: [4, 14, 8] },
    cam: { back: 6.2, up: 3.15 },        // 天井 4.1
    indoor: true,
  })
  {
    const g = office5.group
    g.add(B.floor(18, 20, 0xcfd5cf, 0.01))
    g.add(B.box(18, 0.12, 20, 0xa0a49c, 0, 4.1, 0))
    g.add(B.wall(18, 4.1, 0.3, 0xe8e6de, 0, 2.05, -9))
    g.add(B.wall(0.3, 4.1, 20, 0xe8e6de, -8.6, 2.05, 0))
    g.add(B.wall(0.3, 4.1, 20, 0xe8e6de, 8.6, 2.05, 0))
    const fs = B.sign('5F  営業一課', 3.0, 0.6, '#1d3a2a', '#ffffff')
    fs.position.set(0, 2.6, -8.7)
    g.add(fs)

    // 島型デスク
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const d = B.desk(1.5, 0.8, 0x9a8f7a)
        d.position.set(-4.4 + col * 3.6, 0, 0.5 + row * 3.2)
        g.add(d)
        const pc = B.box(0.5, 0.36, 0.06, 0x2a2f38, -4.4 + col * 3.6, 0.96, 0.25 + row * 3.2)
        g.add(pc)
      }
    }

    // 課長の席（窓際・奥）
    const kd = B.desk(2.0, 0.9, 0x7a6a52); kd.position.set(0, 0, -6.4)
    g.add(kd)
    const kacho = B.person({ suit: 0x3a3a48, hair: 0x555055, tie: 0x2a6a4a })
    kacho.position.set(0, 0, -7.4)
    kacho.rotation.y = Math.PI
    g.add(kacho)
    const ks2 = B.sign('課長', 0.9, 0.36, '#3a2a1a', '#ffe9b0')
    ks2.position.set(0, 2.5, -6.2)
    g.add(ks2)

    // 同僚
    const a1 = B.person({ suit: 0x4a5570, tie: 0x8a4a4a })
    a1.position.set(-4.4, 0, 1.6); a1.rotation.y = Math.PI
    g.add(a1)
    const a2 = B.person({ suit: 0x5a4a60, hair: 0x3a2a24, tie: 0x4a6a8a })
    a2.position.set(3.2, 0, 4.4); a2.rotation.y = Math.PI * 0.8
    g.add(a2)

    office5.spots.push(
      spot('kacho', '課長に挨拶する', 0, -6.0, 2.2),
      spot('mydesk', '自分の席を見る', 3.2, 0.5, 1.8),
    )
    office5.kachoMesh = kacho
  }

  return { home, street, station, train, office, office5 }
}
