// ============================================================
//  builders.js — 3Dの部品工場
//  THREE を引数で受け取る（標準版 / バンドル版のどちらでも同じ部品が作れる）
// ============================================================

export function createBuilders(THREE) {
  const matCache = new Map()

  /** 使い回し前提のマテリアル。色数を抑えて描画負荷を下げる */
  function mat(color, opts = {}) {
    const key = color + '|' + JSON.stringify(opts)
    if (matCache.has(key)) return matCache.get(key)
    const m = new THREE.MeshLambertMaterial({ color, ...opts })
    matCache.set(key, m)
    return m
  }

  function box(w, h, d, color, x = 0, y = 0, z = 0, opts) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts))
    m.position.set(x, y, z)
    return m
  }

  function cyl(rt, rb, h, color, x = 0, y = 0, z = 0, seg = 12) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color))
    m.position.set(x, y, z)
    return m
  }

  function ball(r, color, x = 0, y = 0, z = 0, seg = 12) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat(color))
    m.position.set(x, y, z)
    return m
  }

  /** 床。size は [幅, 奥行] */
  function floor(w, d, color, y = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color))
    m.rotation.x = -Math.PI / 2
    m.position.y = y
    return m
  }

  /** 壁（当たり判定にも使うので size を持たせる） */
  function wall(w, h, d, color, x, y, z) {
    const m = box(w, h, d, color, x, y, z)
    m.userData.solid = { w, d }
    return m
  }

  /** 文字を貼った板（駅名標・看板・階数表示） */
  function sign(text, w = 2.4, h = 0.7, bg = '#0b2b4a', fg = '#ffffff') {
    const cv = document.createElement('canvas')
    cv.width = 512; cv.height = Math.round(512 * (h / w))
    const g = cv.getContext('2d')
    g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height)
    g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(6, 6, cv.width - 12, cv.height - 12)
    g.fillStyle = fg
    g.font = 'bold 120px "Hiragino Sans", "Noto Sans JP", sans-serif'
    g.textAlign = 'center'; g.textBaseline = 'middle'
    let size = 120
    while (g.measureText(text).width > cv.width - 60 && size > 28) {
      size -= 6
      g.font = `bold ${size}px "Hiragino Sans", "Noto Sans JP", sans-serif`
    }
    g.fillText(text, cv.width / 2, cv.height / 2 + 4)
    const tex = new THREE.CanvasTexture(cv)
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    )
    return m
  }

  /** ビル（街の背景。窓は1枚のテクスチャで表現して負荷を抑える） */
  function building(w, h, d, color, x, z, windowColor = '#ffd98a') {
    const g = new THREE.Group()
    const body = box(w, h, d, color, 0, h / 2, 0)
    body.userData.solid = { w, d }
    g.add(body)
    const cv = document.createElement('canvas')
    cv.width = 64; cv.height = 128
    const c = cv.getContext('2d')
    c.fillStyle = 'rgba(0,0,0,0)'; c.fillRect(0, 0, 64, 128)
    for (let yy = 8; yy < 128; yy += 20) {
      for (let xx = 8; xx < 64; xx += 18) {
        c.fillStyle = Math.random() < 0.55 ? windowColor : 'rgba(40,48,66,0.9)'
        c.fillRect(xx, yy, 10, 12)
      }
    }
    const tex = new THREE.CanvasTexture(cv)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 4)))
    const skin = new THREE.Mesh(
      new THREE.BoxGeometry(w * 1.002, h * 0.96, d * 1.002),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    )
    skin.position.y = h / 2
    g.add(skin)
    g.position.set(x, 0, z)
    return g
  }

  function tree(x, z, s = 1) {
    const g = new THREE.Group()
    g.add(cyl(0.12 * s, 0.16 * s, 1.5 * s, 0x6b4a2f, 0, 0.75 * s, 0))
    g.add(ball(0.72 * s, 0x2f7d44, 0, 1.85 * s, 0, 10))
    g.add(ball(0.5 * s, 0x3a9450, 0.35 * s, 2.3 * s, 0.1 * s, 8))
    g.position.set(x, 0, z)
    g.userData.solid = { w: 0.5 * s, d: 0.5 * s }
    return g
  }

  function lamp(x, z) {
    const g = new THREE.Group()
    g.add(cyl(0.07, 0.09, 4.2, 0x556070, 0, 2.1, 0))
    g.add(box(0.5, 0.18, 0.28, 0xdfe6ef, 0.22, 4.1, 0))
    const bulb = ball(0.13, 0xfff3c4, 0.34, 4.0, 0, 8)
    bulb.material = new THREE.MeshBasicMaterial({ color: 0xfff3c4 })
    g.add(bulb)
    g.position.set(x, 0, z)
    return g
  }

  /** 人（プレイヤー / NPC 共通。頭・胴・腕・脚を持ち歩行アニメできる） */
  function person(colors = {}) {
    const c = { suit: 0x2b3a55, skin: 0xf0c9a4, hair: 0x241c18, shoe: 0x1a1a1f, tie: 0xb03a3a, ...colors }
    const g = new THREE.Group()

    const body = box(0.52, 0.66, 0.3, c.suit, 0, 1.0, 0)
    g.add(body)
    g.add(box(0.1, 0.3, 0.02, c.tie, 0, 1.06, 0.16))

    const head = ball(0.21, c.skin, 0, 1.52, 0, 12)
    g.add(head)
    const hair = ball(0.225, c.hair, 0, 1.58, -0.02, 12)
    hair.scale.set(1, 0.7, 1)
    g.add(hair)

    const armL = box(0.14, 0.56, 0.16, c.suit, -0.33, 1.02, 0)
    const armR = box(0.14, 0.56, 0.16, c.suit, 0.33, 1.02, 0)
    armL.geometry.translate(0, -0.28, 0); armL.position.y = 1.3
    armR.geometry.translate(0, -0.28, 0); armR.position.y = 1.3
    g.add(armL, armR)

    const legL = box(0.18, 0.66, 0.2, 0x22283a, -0.13, 0.33, 0)
    const legR = box(0.18, 0.66, 0.2, 0x22283a, 0.13, 0.33, 0)
    legL.geometry.translate(0, -0.33, 0); legL.position.y = 0.66
    legR.geometry.translate(0, -0.33, 0); legR.position.y = 0.66
    g.add(legL, legR)

    g.add(box(0.2, 0.08, 0.28, c.shoe, -0.13, 0.04, 0.03))
    g.add(box(0.2, 0.08, 0.28, c.shoe, 0.13, 0.04, 0.03))

    g.userData.parts = { armL, armR, legL, legR, head, body }
    return g
  }

  /** 鞄（取得アイテム＆武器） */
  function bag() {
    const g = new THREE.Group()
    g.add(box(0.42, 0.3, 0.14, 0x4a3a2a, 0, 0.15, 0))
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.022, 6, 12, Math.PI),
      mat(0x2f2620)
    )
    handle.position.set(0, 0.3, 0)
    g.add(handle)
    return g
  }

  function bed() {
    const g = new THREE.Group()
    g.add(box(1.3, 0.4, 2.2, 0x6b4a33, 0, 0.2, 0))
    g.add(box(1.24, 0.22, 2.1, 0xe8e2d6, 0, 0.5, 0))
    g.add(box(1.24, 0.2, 1.1, 0x8fb7d9, 0, 0.62, 0.45))
    g.add(box(0.7, 0.16, 0.36, 0xffffff, 0, 0.66, -0.82))
    g.userData.solid = { w: 1.3, d: 2.2 }
    return g
  }

  function desk(w = 1.2, d = 0.6, color = 0x8a6a4a) {
    const g = new THREE.Group()
    g.add(box(w, 0.08, d, color, 0, 0.74, 0))
    const legs = [[-1, -1], [1, -1], [-1, 1], [1, 1]]
    legs.forEach(([sx, sz]) => g.add(box(0.07, 0.72, 0.07, 0x5f4830, sx * (w / 2 - 0.08), 0.36, sz * (d / 2 - 0.08))))
    g.userData.solid = { w, d }
    return g
  }

  /** 電車の車両（内装。プレイヤーが中に入る） */
  function trainCar(len = 22, w = 3.4, h = 2.6) {
    const g = new THREE.Group()
    g.add(floor(w, len, 0x6f7681, 0.02))
    g.add(box(w, 0.1, len, 0x3d4350, 0, h, 0))                  // 天井
    g.add(wall(0.12, h, len, 0xcdd6e2, -w / 2, h / 2, 0))        // 左壁
    g.add(wall(0.12, h, len, 0xcdd6e2, w / 2, h / 2, 0))         // 右壁
    g.add(wall(w, h, 0.12, 0xb9c3d1, 0, h / 2, -len / 2))        // 前
    g.add(wall(w, h, 0.12, 0xb9c3d1, 0, h / 2, len / 2))         // 後
    // 窓
    for (let z = -len / 2 + 2.2; z < len / 2 - 1.5; z += 3.0) {
      const winL = box(0.04, 0.9, 2.0, 0x9fd4ef, -w / 2 + 0.08, 1.5, z, { transparent: true, opacity: 0.55 })
      const winR = box(0.04, 0.9, 2.0, 0x9fd4ef, w / 2 - 0.08, 1.5, z, { transparent: true, opacity: 0.55 })
      g.add(winL, winR)
    }
    // ロングシート
    for (const side of [-1, 1]) {
      const seat = box(0.62, 0.18, len - 3.2, 0x2f5fa8, side * (w / 2 - 0.42), 0.56, 0)
      const back = box(0.12, 0.7, len - 3.2, 0x27508d, side * (w / 2 - 0.1), 0.95, 0)
      seat.userData.solid = { w: 0.62, d: len - 3.2 }
      g.add(seat, back)
    }
    // 吊り革
    for (let z = -len / 2 + 2; z < len / 2 - 2; z += 1.4) {
      for (const side of [-0.9, 0.9]) {
        g.add(cyl(0.012, 0.012, 0.5, 0x8a8f99, side, h - 0.36, z, 6))
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.02, 5, 10), mat(0xe0b64a))
        ring.position.set(side, h - 0.66, z)
        ring.rotation.y = Math.PI / 2
        g.add(ring)
      }
    }
    return g
  }

  return { THREE, mat, box, cyl, ball, floor, wall, sign, building, tree, lamp, person, bag, bed, desk, trainCar }
}
