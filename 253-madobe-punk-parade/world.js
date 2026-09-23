window.World = (function () {
  const CAM = { x: 0.2, y: 1.5, z: 2.5 };
  const WIN_Z = 0.32;
  const HOLE = { hx: 0.56, y0: 0.84, y1: 2.18 };

  const PHASES = [
    {
      name: "朝",
      sky: ["#7fb6e8", "#c7e2f4", "#f7e4c6", "#efd6ae"],
      hemiSky: 0xbfe0ff, hemiGround: 0x6d8a48, hemiI: 0.78,
      sunColor: 0xffe7c2, sunI: 0.85, sunPos: [7, 5.5, -13],
      fog: 0xdfeaf2, disc: 0xfff2d4, discPos: [6.5, 6.2, -18], discR: 1.2,
      lamp: false, stars: false, mult: 1
    },
    {
      name: "昼",
      sky: ["#6eb6f2", "#b9def8", "#f3e2c2", "#e7c99a"],
      hemiSky: 0xc5e4ff, hemiGround: 0x6d8a48, hemiI: 0.9,
      sunColor: 0xfff1d2, sunI: 1.05, sunPos: [-6, 10, -4],
      fog: 0xd7e6f4, disc: 0xfff6dc, discPos: [-7, 8.5, -18], discR: 1.4,
      lamp: false, stars: false, mult: 1
    },
    {
      name: "夕",
      sky: ["#4a6fae", "#c98a76", "#f0a463", "#f6c98b"],
      hemiSky: 0xf0a878, hemiGround: 0x554634, hemiI: 0.6,
      sunColor: 0xff9a4e, sunI: 0.86, sunPos: [-9, 2.4, -14],
      fog: 0xd8a077, disc: 0xff9b4d, discPos: [-8.5, 2.6, -18], discR: 1.9,
      lamp: true, stars: false, mult: 1.2
    },
    {
      name: "夜",
      sky: ["#0b1734", "#152747", "#27405f", "#3d5470"],
      hemiSky: 0x3f5f92, hemiGround: 0x1d2433, hemiI: 0.5,
      sunColor: 0x9fb6e8, sunI: 0.34, sunPos: [4, 8, -12],
      fog: 0x1d2c46, disc: 0xf2f4e4, discPos: [5.5, 7.4, -18], discR: 0.72,
      lamp: true, stars: true, mult: 1.5
    }
  ];

  const lamberts = {};
  const basics = {};
  let scene, camera, renderer, hemi, sun, sunDisc, sunDiscMat, skyMat;
  let clouds = [];
  let treeA, treeB;
  let lampGlows = [];
  let houseLights = [];
  let stars;
  let actors = {};
  let shadow, rig, earL, earR, tail;
  let phase = 1;
  const skyTextures = [];

  function lambert(hex) {
    if (!lamberts[hex]) lamberts[hex] = new THREE.MeshLambertMaterial({ color: hex });
    return lamberts[hex];
  }

  function basic(hex) {
    if (!basics[hex]) basics[hex] = new THREE.MeshBasicMaterial({ color: hex });
    return basics[hex];
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function spanX(z) {
    return HOLE.hx * (CAM.z - z) / (CAM.z - WIN_Z) * 0.88;
  }

  function skyTexture(stops) {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, stops[0]);
    grd.addColorStop(0.45, stops[1]);
    grd.addColorStop(0.78, stops[2]);
    grd.addColorStop(1, stops[3]);
    g.fillStyle = grd;
    g.fillRect(0, 0, 4, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  function addBox(w, h, d, color, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(color));
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  function buildSky() {
    PHASES.forEach(function (p) { skyTextures.push(skyTexture(p.sky)); });
    skyMat = new THREE.MeshBasicMaterial({ map: skyTextures[1], side: THREE.BackSide });
    skyMat.fog = false;
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(42, 20, 14), skyMat));

    sunDiscMat = new THREE.MeshBasicMaterial({ color: 0xfff6dc });
    sunDiscMat.fog = false;
    sunDisc = new THREE.Mesh(new THREE.CircleGeometry(1, 20), sunDiscMat);
    scene.add(sunDisc);

    const starGeo = new THREE.BufferGeometry();
    const pts = [];
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 14;
      pts.push(Math.cos(a) * r, 6 + Math.random() * 16, -Math.abs(Math.sin(a)) * r - 6);
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xf6f6ff, size: 0.16 });
    starMat.fog = false;
    stars = new THREE.Points(starGeo, starMat);
    stars.visible = false;
    scene.add(stars);
  }

  function buildGround() {
    addBox(30, 0.08, 30, 0x7eae58, 0, -0.04, -6);
    addBox(8, 0.06, 2.2, 0x4a5160, 0, 0.01, -5.35);
    addBox(8, 0.05, 1.15, 0xc8c0b2, 0, 0.02, -2.95);
    addBox(8, 0.05, 0.7, 0xd5cec2, 0, 0.02, -6.7);
    for (let i = -4; i <= 4; i++) {
      addBox(0.28, 0.02, 0.08, 0xf2f2f2, i * 0.7, 0.05, -5.35);
    }
    for (let i = 0; i < 14; i++) {
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 6, 5),
        lambert(i % 2 ? 0xf0c84a : 0xe07b96)
      );
      flower.position.set((i % 7) * 0.16 - 0.48, 0.06, -0.85 - Math.floor(i / 7) * 0.32);
      scene.add(flower);
    }
    for (let x = -2.2; x <= 2.2; x += 0.7) {
      addBox(0.06, 0.78, 0.06, 0xc8b08a, x, 0.42, -2.2);
    }
    addBox(4.6, 0.06, 0.06, 0xe6d3b0, 0, 0.78, -2.2);
    addBox(4.6, 0.05, 0.05, 0xe6d3b0, 0, 0.48, -2.2);
  }

  function addCloud(x, y, z, s) {
    const g = new THREE.Group();
    [0, 0.5, -0.45, 0.2].forEach(function (ox, i) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.38 + (i % 2) * 0.12, 10, 8), lambert(0xf7fbff));
      puff.position.set(ox, (i === 2 ? -0.08 : 0.08), 0);
      g.add(puff);
    });
    g.position.set(x, y, z);
    g.scale.setScalar(s);
    scene.add(g);
    clouds.push(g);
  }

  function addHouse(x, z, wall, roof) {
    const w = 1.85;
    const d = 1.55;
    const h = 1.85;
    addBox(w, h, d, wall, x, h / 2, z);
    addBox(w + 0.28, 0.22, d + 0.22, roof, x, h + 0.08, z);
    addBox(w * 0.55, 0.28, d + 0.08, roof, x, h + 0.28, z);
    const front = z + d / 2 + 0.03;
    [-0.42, 0.42].forEach(function (ox) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x9fd0ea });
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.04), mat);
      win.position.set(x + ox, 1.15, front);
      scene.add(win);
      houseLights.push(mat);
    });
    addBox(0.36, 0.72, 0.05, 0x6a4632, x, 0.4, front);
  }

  function addTree(x, z, h, r) {
    addBox(0.1, h, 0.1, 0x6b4a32, x, h / 2, z);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), lambert(0x3f8f45));
    leaf.position.set(x, h + r * 0.45, z);
    scene.add(leaf);
    return leaf;
  }

  function addLamp(x, z) {
    addBox(0.1, 2.3, 0.1, 0x5a4636, x, 1.15, z);
    addBox(0.44, 0.07, 0.07, 0x5a4636, x - 0.2, 2.28, z);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd98a });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), glowMat);
    glow.position.set(x - 0.4, 2.24, z);
    glow.visible = false;
    scene.add(glow);
    lampGlows.push(glow);
  }

  function buildTown() {
    addCloud(-1.1, 4.55, -13, 1);
    addCloud(1.5, 4.9, -16, 1.25);
    addCloud(0.3, 4.25, -11.5, 0.7);
    addHouse(-1.7, -9.6, 0xf4efe6, 0x8d4b3c);
    addHouse(0.35, -10.1, 0xf7f1dc, 0x4d6270);
    addHouse(2.15, -9.4, 0xe7eef2, 0x6d5344);
    treeA = addTree(0.55, -1.9, 0.42, 0.24);
    treeB = addTree(1.7, -7.4, 1.35, 0.55);
    addLamp(1.55, -6.4);
    addBox(3.3, 0.025, 0.025, 0x2c2c2c, 0.1, 2.22, -6.4);
    addBox(3.1, 0.02, 0.02, 0x2c2c2c, 0.15, 2.05, -6.4);
    const hillMat = lambert(0x8ea0b0);
    [-3.2, 2.4].forEach(function (x, i) {
      const hill = new THREE.Mesh(new THREE.ConeGeometry(3.2 + i, 2.4, 6), hillMat);
      hill.position.set(x, 1.1, -16);
      scene.add(hill);
    });
  }

  function buildRoom() {
    const wallC = 0x2a221c;
    const wood = 0x6d4528;
    const midY = (HOLE.y0 + HOLE.y1) / 2;
    const openH = HOLE.y1 - HOLE.y0;
    addBox(8, 3.2, 0.12, wallC, 0, HOLE.y1 + 1.55, WIN_Z);
    addBox(8, 1.7, 0.16, wood, 0, HOLE.y0 - 0.8, WIN_Z + 0.04);
    addBox(3.4, openH, 0.12, wallC, -HOLE.hx - 1.75, midY, WIN_Z);
    addBox(3.4, openH, 0.12, wallC, HOLE.hx + 1.75, midY, WIN_Z);
    addBox(HOLE.hx * 2 + 0.16, 0.08, 0.08, wood, 0, HOLE.y1, WIN_Z + 0.08);
    addBox(HOLE.hx * 2 + 0.16, 0.08, 0.1, wood, 0, HOLE.y0, WIN_Z + 0.1);
    addBox(0.08, openH, 0.08, wood, -HOLE.hx, midY, WIN_Z + 0.08);
    addBox(0.08, openH, 0.08, wood, HOLE.hx, midY, WIN_Z + 0.08);
    addBox(0.07, openH - 0.12, 0.04, 0x7a2e32, -HOLE.hx + 0.05, midY, WIN_Z + 0.1);
    addBox(0.07, openH - 0.12, 0.04, 0x7a2e32, HOLE.hx - 0.05, midY, WIN_Z + 0.1);

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(HOLE.hx * 2 - 0.06, openH - 0.06),
      new THREE.MeshBasicMaterial({ color: 0xb7dcff, transparent: true, opacity: 0.1, depthWrite: false })
    );
    glass.position.set(0, midY, WIN_Z - 0.02);
    scene.add(glass);
  }

  function buildHero() {
    rig = new THREE.Group();
    rig.position.set(-0.16, 1.0, 0.52);
    rig.scale.setScalar(0.62);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), lambert(0xf7f2ea));
    body.scale.set(1.15, 0.72, 0.9);
    body.position.set(0, -0.1, 0.02);
    rig.add(body);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), lambert(0xf7f2ea));
    skull.position.set(0, 0.06, -0.02);
    rig.add(skull);
    earL = new THREE.Group();
    earR = new THREE.Group();
    [[earL, -0.07, -0.35], [earR, 0.07, 0.35]].forEach(function (e) {
      const group = e[0];
      group.position.set(e[1], 0.14, -0.02);
      const outer = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.12, 6), lambert(0xf7f2ea));
      outer.position.y = 0.05;
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.07, 5), lambert(0xf0b7c0));
      inner.position.set(0, 0.05, -0.015);
      group.add(outer);
      group.add(inner);
      group.userData.lean = e[2];
      rig.add(group);
    });
    tail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.22, 6), lambert(0xf4efe6));
    tail.position.set(0.08, -0.02, 0.06);
    tail.rotation.z = 1.05;
    rig.add(tail);
    scene.add(rig);
  }

  function shoulderWing(parent, side, color, len, wid) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.1, 0.04, 0);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, wid), lambert(color));
    wing.position.x = side * len * 0.5;
    pivot.add(wing);
    parent.add(pivot);
    return pivot;
  }

  function makeCrow() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), lambert(0x1c1c1c));
    body.scale.set(0.85, 0.72, 1.25);
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), lambert(0x1c1c1c));
    head.position.set(0, 0.1, -0.28);
    g.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 5), lambert(0xe0a020));
    beak.rotation.x = -Math.PI / 2;
    beak.position.set(0, 0.08, -0.46);
    g.add(beak);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.32), lambert(0x111111));
    t.position.set(0, 0.04, 0.36);
    g.add(t);
    g.userData.wingL = shoulderWing(g, -1, 0x1c1c1c, 0.55, 0.26);
    g.userData.wingR = shoulderWing(g, 1, 0x1c1c1c, 0.55, 0.26);
    g.visible = false;
    return g;
  }

  function makeSparrow() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), lambert(0x8a5a32));
    body.scale.set(0.9, 0.8, 1.3);
    g.add(body);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), lambert(0xf0e2c8));
    belly.position.set(0, -0.04, -0.02);
    g.add(belly);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), lambert(0x6d4528));
    head.position.set(0, 0.05, -0.12);
    g.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.07, 4), lambert(0xd9a441));
    beak.rotation.x = -Math.PI / 2;
    beak.position.set(0, 0.04, -0.2);
    g.add(beak);
    g.userData.wingL = shoulderWing(g, -1, 0x6a432c, 0.18, 0.1);
    g.userData.wingR = shoulderWing(g, 1, 0x6a432c, 0.18, 0.1);
    g.visible = false;
    return g;
  }

  function makePlane() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.7, 8), lambert(0xf4f7fb));
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.42), lambert(0xf7f9fc));
    wing.position.set(0, 0.02, 0.05);
    g.add(wing);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.2), lambert(0xd14b4b));
    t.position.set(0, 0.08, 0.72);
    g.add(t);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.22), lambert(0xd14b4b));
    fin.position.set(0, 0.18, 0.7);
    g.add(fin);
    const blink = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshBasicMaterial({ color: 0xff5544 }));
    blink.position.set(0, -0.08, 0.2);
    g.add(blink);
    g.userData.blink = blink;
    g.scale.setScalar(1.35);
    g.userData.focusLift = 0.1;
    g.visible = false;
    return g;
  }

  function addLeg(parent, x, z, h, color) {
    const pivot = new THREE.Group();
    pivot.position.set(x, h, z);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, h, 0.07), lambert(color));
    leg.position.y = -h / 2;
    pivot.add(leg);
    parent.add(pivot);
    return pivot;
  }

  function makeWalker(color, scale, tailUp) {
    const g = new THREE.Group();
    g.scale.setScalar(scale);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), lambert(color));
    body.scale.set(0.78, 0.58, 1.2);
    body.position.set(0, 0.36, 0);
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), lambert(color));
    head.position.set(0, 0.46, -0.26);
    g.add(head);
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), lambert(color));
    snout.position.set(0, 0.42, -0.38);
    g.add(snout);
    const noseM = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), lambert(0x2a2a2a));
    noseM.position.set(0, 0.42, -0.44);
    g.add(noseM);
    g.userData.legs = [
      addLeg(g, -0.1, -0.12, 0.22, color),
      addLeg(g, 0.1, -0.12, 0.22, color),
      addLeg(g, -0.1, 0.14, 0.22, color),
      addLeg(g, 0.1, 0.14, 0.22, color)
    ];
    const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.28, 6), lambert(color));
    tailMesh.position.set(0, tailUp ? 0.5 : 0.34, 0.28);
    tailMesh.rotation.x = tailUp ? 0.4 : Math.PI / 2.4;
    g.add(tailMesh);
    g.userData.tail = tailMesh;
    g.visible = false;
    return g;
  }

  function makeOutsideCat() {
    const g = makeWalker(0xd4843c, 0.72, true);
    const ear1 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 5), lambert(0xd4843c));
    ear1.position.set(-0.06, 0.58, -0.26);
    const ear2 = ear1.clone();
    ear2.position.x = 0.06;
    g.add(ear1);
    g.add(ear2);
    return g;
  }

  function makeDog() {
    const g = makeWalker(0x8d5a32, 0.82, false);
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.04), lambert(0x6b4224));
    ear.position.set(-0.1, 0.42, -0.24);
    const ear2 = ear.clone();
    ear2.position.x = 0.1;
    g.add(ear);
    g.add(ear2);
    return g;
  }

  function makeCar() {
    const g = new THREE.Group();
    const paint = new THREE.MeshLambertMaterial({ color: 0xc0392b });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.36, 1.55), paint);
    body.position.set(0, 0.42, 0);
    g.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.32, 0.7), lambert(0xd7eaf6));
    cabin.position.set(0, 0.72, -0.05);
    g.add(cabin);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff1c4 });
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.04), lampMat);
    lamp.position.set(0, 0.4, -0.78);
    g.add(lamp);
    g.userData.paint = paint;
    g.userData.lamp = lampMat;
    g.userData.wheels = [];
    [[-0.34, -0.46], [0.34, -0.46], [-0.34, 0.48], [0.34, 0.48]].forEach(function (p) {
      const pivot = new THREE.Group();
      pivot.position.set(p[0], 0.16, p[1]);
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 10), lambert(0x222222));
      wheel.rotation.z = Math.PI / 2;
      pivot.add(wheel);
      g.add(pivot);
      g.userData.wheels.push(pivot);
    });
    g.visible = false;
    return g;
  }

  function makeBug() {
    const g = new THREE.Group();
    g.scale.setScalar(2.6);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), lambert(0xd23a32));
    shell.scale.set(1, 0.72, 1.15);
    g.add(shell);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 6), lambert(0x1a1a1a));
    head.position.set(0, 0, -0.1);
    g.add(head);
    [[-0.035, 0.03, 0.04], [0.03, 0.035, 0.02], [0, 0.04, 0.06]].forEach(function (p) {
      const spot = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 5), lambert(0x1a1a1a));
      spot.position.set(p[0], p[1], p[2]);
      g.add(spot);
    });
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.012), lambert(0x1a1a1a));
      leg.position.set(side * 0.07, -0.02, (i % 3 - 1) * 0.045);
      leg.rotation.z = side * 0.7;
      g.add(leg);
    }
    g.visible = false;
    return g;
  }

  function faceX(mesh, dir) {
    mesh.rotation.set(0, dir > 0 ? -Math.PI / 2 : Math.PI / 2, 0);
  }

  function flap(mesh, t, speed, amp) {
    const s = Math.sin(t * speed) * amp;
    mesh.userData.wingL.rotation.z = s;
    mesh.userData.wingR.rotation.z = -s;
  }

  function swingLegs(mesh, t, speed) {
    const s = Math.sin(t * speed) * 0.5;
    mesh.userData.legs.forEach(function (leg, i) {
      leg.rotation.x = (i < 2 ? s : -s) * (i % 2 === 0 ? 1 : -1);
    });
  }

  function dropShadow(x, z, s) {
    shadow.visible = true;
    shadow.position.set(x, 0.05, z);
    shadow.scale.set(s, s, s);
    shadow.material.opacity = phase === 3 ? 0.14 : 0.28;
  }

  function place(id, p, seed, t) {
    const mesh = actors[id];
    const dir = seed < 0.5 ? 1 : -1;
    mesh.visible = true;
    if (id === "crow") {
      const z = -7.1;
      const x = dir * spanX(z) * (1 - 2 * p);
      mesh.position.set(x, 3.25 + Math.sin(p * Math.PI) * 0.28, z);
      faceX(mesh, dir);
      flap(mesh, t, 14, 0.75);
      dropShadow(x, z, 0.85);
    } else if (id === "sparrow") {
      const z = -1.5;
      const x = 0.38 + dir * 0.12 * Math.sin(p * Math.PI);
      const hop = Math.abs(Math.sin(p * Math.PI * 3)) * 0.14;
      mesh.position.set(x, 0.78 + hop, z);
      faceX(mesh, dir);
      flap(mesh, t, 28, 0.9);
      dropShadow(x, z, 0.28);
    } else if (id === "plane") {
      const z = -8.1;
      const x = dir * spanX(z) * (1 - 2 * p);
      mesh.position.set(x, 2.85, z);
      mesh.rotation.set(-0.38, dir * 0.65, 0);
      mesh.userData.blink.visible = phase >= 2 ? Math.sin(t * 9) > 0 : false;
      dropShadow(x, z, 1.15);
    } else if (id === "cat") {
      const z = -2.2;
      const x = dir * spanX(z) * 0.75 * (1 - 2 * p);
      mesh.position.set(x, 0.81, z);
      faceX(mesh, dir);
      swingLegs(mesh, t, 10);
      mesh.userData.tail.rotation.x = 0.35 + Math.sin(t * 6) * 0.12;
      dropShadow(x, z, 0.4);
    } else if (id === "dog") {
      const z = -2.05;
      const x = dir * spanX(z) * 0.62 * (1 - 2 * p);
      mesh.position.set(x, 0.02, z);
      faceX(mesh, dir);
      swingLegs(mesh, t, 9);
      mesh.userData.tail.rotation.z = Math.sin(t * 10) * 0.45;
      dropShadow(x, z, 0.55);
    } else if (id === "car") {
      const z = -5.35;
      const x = dir * (spanX(z) + 0.4) * (1 - 2 * p);
      mesh.position.set(x, 0, z);
      faceX(mesh, dir);
      mesh.userData.wheels.forEach(function (w) { w.rotation.x = t * dir * 8; });
      dropShadow(x, z, 1);
    } else if (id === "bug") {
      const x = Math.sin(seed * 6.2 + t * 1.3) * 0.22;
      const y = 1.48 + Math.cos(seed * 4.1 + t * 0.9) * 0.22;
      mesh.position.set(x, y, WIN_Z + 0.06);
      mesh.rotation.set(0, 0, t * 0.6);
      shadow.visible = false;
    }
    return mesh.position.x;
  }

  function setCarColor(hex) {
    actors.car.userData.paint.color.setHex(hex);
  }

  function setPhase(index) {
    phase = ((index % PHASES.length) + PHASES.length) % PHASES.length;
    const p = PHASES[phase];
    skyMat.map = skyTextures[phase];
    skyMat.needsUpdate = true;
    scene.fog.color.setHex(p.fog);
    scene.background.setHex(p.fog);
    hemi.color.setHex(p.hemiSky);
    hemi.groundColor.setHex(p.hemiGround);
    hemi.intensity = p.hemiI;
    sun.color.setHex(p.sunColor);
    sun.intensity = p.sunI;
    sun.position.set(p.sunPos[0], p.sunPos[1], p.sunPos[2]);
    sunDiscMat.color.setHex(p.disc);
    sunDisc.position.set(p.discPos[0], p.discPos[1], p.discPos[2]);
    sunDisc.scale.setScalar(p.discR);
    stars.visible = p.stars;
    lampGlows.forEach(function (g) { g.visible = p.lamp; });
    houseLights.forEach(function (m, i) {
      m.color.setHex(p.lamp ? (i % 3 === 1 ? 0x503f2e : 0xffd98a) : 0x9fd0ea);
    });
    actors.car.userData.lamp.color.setHex(p.lamp ? 0xfff6d8 : 0xdad3bc);
    return p;
  }

  function phaseName(index) {
    return PHASES[((index % PHASES.length) + PHASES.length) % PHASES.length].name;
  }

  function phaseMultiplier(index) {
    return PHASES[((index % PHASES.length) + PHASES.length) % PHASES.length].mult;
  }

  function hideAll() {
    Object.keys(actors).forEach(function (id) { actors[id].visible = false; });
    shadow.visible = false;
  }

  function setVisible(id, on) {
    if (actors[id]) actors[id].visible = on;
    if (!on) shadow.visible = false;
  }

  function hero(dt, t, alert, focusId) {
    const perk = alert * 0.28;
    earL.rotation.z = earL.userData.lean - perk;
    earR.rotation.z = earR.userData.lean + perk;
    tail.rotation.z = 1.05 + Math.sin(t * 2.4) * 0.12;
    let point = new THREE.Vector3(0, 1.35, -4);
    let speed = 3.2;
    if (focusId && actors[focusId]) {
      point = actors[focusId].position.clone();
      point.y += actors[focusId].userData.focusLift || 0.2;
      speed = 14;
    }
    const dx = point.x - rig.position.x;
    const dy = point.y - (rig.position.y + 0.05);
    const dz = point.z - rig.position.z;
    const yaw = clamp(Math.atan2(dx, -dz), -1.05, 1.05);
    const pitch = clamp(Math.atan2(dy, Math.hypot(dx, dz)), -0.35, 0.65);
    const k = 1 - Math.exp(-speed * dt);
    rig.rotation.y += (yaw - rig.rotation.y) * k;
    rig.rotation.x += (-pitch - rig.rotation.x) * k;
  }

  function ambient(dt, t) {
    clouds.forEach(function (c, i) {
      c.position.x += dt * (0.12 + i * 0.03);
      if (c.position.x > 3.2) c.position.x = -3.2;
    });
    treeA.scale.setScalar(1 + Math.sin(t * 1.4) * 0.03);
    treeB.scale.setScalar(1 + Math.sin(t * 1.1 + 1) * 0.03);
  }

  function resize(w, h) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function render() {
    renderer.render(scene, camera);
  }

  function init(canvas) {
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
      if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    } catch (e) {
      return false;
    }
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xd7e6f4, 12, 34);
    scene.background = new THREE.Color(0xc5dff3);
    camera = new THREE.PerspectiveCamera(46, 1, 0.05, 80);
    camera.position.set(CAM.x, CAM.y, CAM.z);
    camera.lookAt(0, 1.42, -5);
    hemi = new THREE.HemisphereLight(0xc5e4ff, 0x6d8a48, 0.9);
    scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff1d2, 1.05);
    scene.add(sun);

    buildSky();
    buildGround();
    buildTown();
    buildRoom();
    buildHero();

    actors = {
      crow: makeCrow(),
      sparrow: makeSparrow(),
      plane: makePlane(),
      cat: makeOutsideCat(),
      dog: makeDog(),
      car: makeCar(),
      bug: makeBug()
    };
    Object.keys(actors).forEach(function (id) { scene.add(actors[id]); });

    shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.35, 16),
      new THREE.MeshBasicMaterial({ color: 0x1a2418, transparent: true, opacity: 0.28, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.visible = false;
    scene.add(shadow);

    setPhase(1);
    return true;
  }

  return {
    init: init,
    place: place,
    setCarColor: setCarColor,
    setPhase: setPhase,
    phaseName: phaseName,
    phaseMultiplier: phaseMultiplier,
    phaseCount: PHASES.length,
    hideAll: hideAll,
    setVisible: setVisible,
    hero: hero,
    ambient: ambient,
    resize: resize,
    render: render
  };
})();
