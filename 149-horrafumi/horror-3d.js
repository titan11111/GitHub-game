(function () {
  'use strict';

  const GameState = {
    START: 'start',
    PLAYING: 'playing',
    GAMEOVER: 'gameover',
    CLEAR: 'clear',
  };

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const COLS = Math.max(...HORROR_MAP.map((row) => row.length));
  const ROWS = HORROR_MAP.length;
  const WORLD_W = COLS * HORROR_CELL;
  const WORLD_D = ROWS * HORROR_CELL;
  const OFF_X = -WORLD_W / 2;
  const OFF_Z = -WORLD_D / 2;

  const container = document.getElementById('gameContainer');
  const canvas = document.getElementById('gameCanvas');
  const hud = document.getElementById('hud');
  const hudHint = document.getElementById('hudHint');
  const pointerHint = document.getElementById('pointerLockHint');
  const muteBtn = document.getElementById('muteBtn');
  const mobileControls = document.getElementById('mobileControls');

  /** @type {THREE.WebGLRenderer | null} */
  let renderer = null;
  /** @type {THREE.Scene | null} */
  let scene = null;
  /** @type {THREE.PerspectiveCamera | null} */
  let camera = null;
  /** @type {THREE.SpotLight | null} */
  let flashlight = null;
  /** @type {THREE.Group | null} */
  let monster = null;
  /** @type {THREE.HemisphereLight | null} */
  let hemiLight = null;
  /** @type {THREE.Color} */
  const colFogCur = new THREE.Color();
  /** @type {THREE.Color} */
  const colClearCur = new THREE.Color();
  const colHemiA = new THREE.Color();
  const colHemiB = new THREE.Color();
  const startPosVec = new THREE.Vector3();

  const colliders = [];
  let exitPos = new THREE.Vector3();
  let monsterPos = new THREE.Vector3();
  let playerFeet = new THREE.Vector3();
  let yaw = 0;
  let pitch = 0;

  let state = GameState.START;
  const input = {
    fwd: false,
    back: false,
    turnL: false,
    turnR: false,
    strafeL: false,
    strafeR: false,
  };

  let clock = null;
  let audioCtx = null;
  let droneOsc = null;
  let droneGain = null;
  let heartbeatInterval = 0;
  let muted = false;

  // --- モバイル視点ドラッグ ---
  let lookTouchId = -1;
  let lastLookX = 0;
  let lastLookY = 0;

  function loadMute() {
    try {
      muted = localStorage.getItem(HorrorKey.MUTE) === '1';
    } catch (_) {
      muted = false;
    }
    muteBtn.textContent = muted ? '🔇' : '🔊';
  }

  function saveMute() {
    try {
      localStorage.setItem(HorrorKey.MUTE, muted ? '1' : '0');
    } catch (_) {}
  }

  function gridToWorld(col, row) {
    return new THREE.Vector3(
      col * HORROR_CELL + HORROR_CELL / 2 + OFF_X,
      0,
      row * HORROR_CELL + HORROR_CELL / 2 + OFF_Z
    );
  }

  function findCell(ch) {
    for (let r = 0; r < ROWS; r++) {
      const line = HORROR_MAP[r];
      for (let c = 0; c < line.length; c++) {
        if (line[c] === ch) return { c, r };
      }
    }
    return null;
  }

  function floorColorFor(ch) {
    if (ch === 'S') return 0x18151c;
    if (ch === 'E') return 0x0c1411;
    if (ch === 'M') return 0x140f12;
    return 0x0f1118;
  }

  function wallColorAt(r, c, rowLen) {
    const color = new THREE.Color(0x1e1a22);
    const nudge = (((r * 31 + c * 17) % 7) - 3) * 0.014;
    color.offsetHSL(0.02 * nudge, 0, nudge);
    if (r <= 1 || r >= ROWS - 2) color.multiplyScalar(0.88);
    if (c <= 1 || c >= rowLen - 2) color.multiplyScalar(0.92);
    return color;
  }

  function horizDist(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.hypot(dx, dz);
  }

  function circleHitsWall(px, pz, radius) {
    const rr = radius * radius;
    for (let i = 0; i < colliders.length; i++) {
      const b = colliders[i];
      const cx = Math.max(b.minX, Math.min(px, b.maxX));
      const cz = Math.max(b.minZ, Math.min(pz, b.maxZ));
      const dx = px - cx;
      const dz = pz - cz;
      if (dx * dx + dz * dz < rr) return true;
    }
    return false;
  }

  function tryMoveXZ(pos, dx, dz) {
    if (dx !== 0 && !circleHitsWall(pos.x + dx, pos.z, HORROR_PLAYER_R)) pos.x += dx;
    if (dz !== 0 && !circleHitsWall(pos.x, pos.z + dz, HORROR_PLAYER_R)) pos.z += dz;
  }

  function monsterTryMove(mpos, dx, dz) {
    const r = 0.35;
    if (dx !== 0 && !circleHitsWall(mpos.x + dx, mpos.z, r)) mpos.x += dx;
    if (dz !== 0 && !circleHitsWall(mpos.x, mpos.z + dz, r)) mpos.z += dz;
  }

  function buildExitDoor(col, row, px, pz) {
    let dc = 0;
    let dr = 1;
    const neigh = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];
    for (let i = 0; i < neigh.length; i++) {
      const ddc = neigh[i][0];
      const ddr = neigh[i][1];
      const nc = col + ddc;
      const nr = row + ddr;
      if (nr < 0 || nr >= ROWS) continue;
      const line = HORROR_MAP[nr];
      if (nc < 0 || nc >= line.length) continue;
      if (line[nc] !== '#') {
        dc = ddc;
        dr = ddr;
        break;
      }
    }

    const grp = new THREE.Group();
    grp.position.set(px, 0.01, pz);
    grp.rotation.y = Math.atan2(-dc, -dr);

    const doorH = 2.35;
    const doorHalfW = 0.44;
    const frameT = 0.1;
    const matFrame = new THREE.MeshStandardMaterial({
      color: 0x181614,
      roughness: 0.88,
      metalness: 0.14,
    });
    const matDoor = new THREE.MeshStandardMaterial({
      color: 0x252018,
      roughness: 0.92,
      metalness: 0.05,
    });
    const matGreenGlow = new THREE.MeshBasicMaterial({
      color: 0x3dff99,
      transparent: true,
      opacity: 0.72,
    });

    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(doorHalfW * 2 + frameT * 2 + 0.06, frameT, frameT + 0.04),
      matFrame
    );
    lintel.position.set(0, doorH + frameT * 0.55, 0);
    grp.add(lintel);

    const jambGeo = new THREE.BoxGeometry(frameT, doorH + frameT, frameT + 0.04);
    const jambL = new THREE.Mesh(jambGeo, matFrame);
    jambL.position.set(-doorHalfW - frameT * 0.55, (doorH + frameT) * 0.48, 0);
    grp.add(jambL);
    const jambR = jambL.clone();
    jambR.position.x = doorHalfW + frameT * 0.55;
    grp.add(jambR);

    const leafGeo = new THREE.BoxGeometry(doorHalfW * 0.96, doorH * 0.95, 0.075);
    const leftLeaf = new THREE.Mesh(leafGeo, matDoor);
    leftLeaf.position.set(-doorHalfW * 0.52, doorH * 0.49, 0.045);
    leftLeaf.rotation.y = 0.24;
    grp.add(leftLeaf);

    const rightLeaf = new THREE.Mesh(leafGeo, matDoor);
    rightLeaf.position.set(doorHalfW * 0.52, doorH * 0.49, 0.045);
    rightLeaf.rotation.y = -0.22;
    grp.add(rightLeaf);

    const glowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(doorHalfW * 2.35, doorH * 1.08),
      matGreenGlow
    );
    glowPlane.position.set(0, doorH * 0.5, -0.42);
    glowPlane.rotation.y = Math.PI;
    grp.add(glowPlane);

    const exitBulb = new THREE.PointLight(0x44dd88, 1.15, 11, 2);
    exitBulb.position.set(0, doorH * 0.58, -0.62);
    grp.add(exitBulb);

    scene.add(grp);
  }

  function buildEldritchMonster() {
    monster = new THREE.Group();
    monster.position.copy(monsterPos);
    monster.userData.tentacles = [];
    monster.userData.coreMesh = null;
    monster.userData.auraLight = null;

    const matBody = new THREE.MeshStandardMaterial({
      color: 0x0c0612,
      roughness: 0.78,
      metalness: 0.25,
    });
    const matTentacle = new THREE.MeshStandardMaterial({
      color: 0x080410,
      emissive: 0x331166,
      emissiveIntensity: 0.55,
      roughness: 0.72,
      metalness: 0.18,
    });
    const matClaw = new THREE.MeshStandardMaterial({
      color: 0x050308,
      emissive: 0x1a0830,
      emissiveIntensity: 0.35,
      roughness: 0.55,
      metalness: 0.45,
    });
    const matEye = new THREE.MeshStandardMaterial({
      color: 0x220044,
      emissive: 0xaa44ff,
      emissiveIntensity: 1.2,
      roughness: 0.35,
      metalness: 0.1,
    });

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.38, 1),
      new THREE.MeshStandardMaterial({
        color: 0x100818,
        emissive: 0x5522aa,
        emissiveIntensity: 0.75,
        roughness: 0.5,
        metalness: 0.35,
      })
    );
    core.position.y = 1.12;
    monster.add(core);
    monster.userData.coreMesh = core;

    const nT = 9;
    for (let i = 0; i < nT; i++) {
      const a = (i / nT) * Math.PI * 2;
      const r0 = 0.28 + (i % 3) * 0.08;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(a) * 0.15, 0.25, Math.sin(a) * 0.15),
        new THREE.Vector3(Math.cos(a) * r0, 0.75 + (i % 2) * 0.15, Math.sin(a) * r0),
        new THREE.Vector3(Math.cos(a) * (r0 + 0.85), 0.95 + Math.sin(i) * 0.25, Math.sin(a) * (r0 + 0.85)),
      ]);
      const rad = 0.055 + (i % 4) * 0.018;
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, rad, 6, false), matTentacle.clone());
      tube.position.y = 0.02;
      monster.add(tube);
      monster.userData.tentacles.push({ mesh: tube, phase: i * 0.73, speed: 1.1 + (i % 3) * 0.25 });
    }

    const clawGeo = new THREE.ConeGeometry(0.11, 0.62, 6);
    const clawL = new THREE.Mesh(clawGeo, matClaw);
    clawL.position.set(-0.58, 1.18, 0.32);
    clawL.rotation.set(0.48, -0.18, 0.42);
    monster.add(clawL);
    const clawR = new THREE.Mesh(clawGeo, matClaw.clone());
    clawR.position.set(0.58, 1.18, 0.32);
    clawR.rotation.set(0.48, 0.18, -0.42);
    monster.add(clawR);

    const spikeGeo = new THREE.ConeGeometry(0.06, 0.22, 4);
    for (let i = 0; i < 7; i++) {
      const sp = new THREE.Mesh(spikeGeo, matBody);
      const ang = (i / 7) * Math.PI * 2;
      sp.position.set(Math.cos(ang) * 0.32, 2.05 + (i % 2) * 0.06, Math.sin(ang) * 0.32);
      sp.lookAt(Math.cos(ang) * 2, sp.position.y, Math.sin(ang) * 2);
      monster.add(sp);
    }

    for (let i = 0; i < 14; i++) {
      const s = 0.035 + (i % 5) * 0.018;
      const eye = new THREE.Mesh(new THREE.SphereGeometry(s, 6, 6), matEye.clone());
      const th = (i / 14) * Math.PI * 2;
      const ph = 0.5 + (i % 3) * 0.35;
      eye.position.set(
        Math.cos(th) * ph * 0.75,
        0.75 + (i % 4) * 0.28,
        Math.sin(th) * ph * 0.75
      );
      monster.add(eye);
    }

    const aura = new THREE.PointLight(0x9966ff, 0.38, 6.5, 2);
    aura.position.set(0, 1.15, 0);
    monster.add(aura);
    monster.userData.auraLight = aura;

    scene.add(monster);

    const texPath = `./${HORROR_MONSTER_TEX}`;
    new THREE.TextureLoader().load(
      texPath,
      (tex) => {
        if (!monster || monster.parent !== scene) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.generateMipmaps = true;
        const faceMat = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          alphaTest: 0.12,
          side: THREE.DoubleSide,
          depthWrite: true,
        });
        const gw = 1.95;
        const gh = 2.65;
        const g = new THREE.PlaneGeometry(gw, gh);
        const yLift = 1.22;
        for (let k = 0; k < 3; k++) {
          const quad = new THREE.Mesh(g, faceMat);
          quad.position.y = yLift;
          quad.rotation.y = (k * Math.PI) / 3;
          monster.add(quad);
        }
      },
      undefined,
      () => {}
    );
  }

  function buildLevel() {
    hemiLight = null;
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.09);

    camera = new THREE.PerspectiveCamera(68, 1, 0.12, 45);
    camera.rotation.order = 'YXZ';

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x030305, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    hemiLight = new THREE.HemisphereLight(0x0a0a14, 0x020203, 0.18);
    scene.add(hemiLight);

    const tileGeo = new THREE.PlaneGeometry(HORROR_CELL * 0.96, HORROR_CELL * 0.96);
    for (let r = 0; r < ROWS; r++) {
      const line = HORROR_MAP[r];
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch !== '#') {
          const p = gridToWorld(c, r);
          const fmat = new THREE.MeshStandardMaterial({
            color: floorColorFor(ch),
            roughness: 0.93,
            metalness: 0.06,
          });
          const floorTile = new THREE.Mesh(tileGeo, fmat);
          floorTile.rotation.x = -Math.PI / 2;
          floorTile.position.set(p.x, 0.003, p.z);
          scene.add(floorTile);
        }
      }
    }

    const ceilGeo = new THREE.PlaneGeometry(WORLD_W + 8, WORLD_D + 8);
    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x060708,
      roughness: 1,
      metalness: 0,
    });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = HORROR_WALL_H;
    scene.add(ceiling);

    const wallGeo = new THREE.BoxGeometry(HORROR_CELL, HORROR_WALL_H, HORROR_CELL);

    for (let r = 0; r < ROWS; r++) {
      const line = HORROR_MAP[r];
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '#') {
          const wcol = wallColorAt(r, c, line.length);
          const wmesh = new THREE.Mesh(
            wallGeo,
            new THREE.MeshStandardMaterial({
              color: wcol,
              roughness: 0.88,
              metalness: 0.1,
            })
          );
          const p = gridToWorld(c, r);
          wmesh.position.set(p.x, HORROR_WALL_H / 2, p.z);
          scene.add(wmesh);

          const half = HORROR_CELL / 2;
          colliders.push({
            minX: p.x - half,
            maxX: p.x + half,
            minZ: p.z - half,
            maxZ: p.z + half,
          });
        }
      }
    }

    const start = findCell('S');
    const ext = findCell('E');
    const mon = findCell('M');
    if (start) {
      const p = gridToWorld(start.c, start.r);
      playerFeet.set(p.x, HORROR_EYE_Y, p.z);
      startPosVec.set(p.x, 0, p.z);
    }
    if (ext) {
      const p = gridToWorld(ext.c, ext.r);
      exitPos.copy(p);
      buildExitDoor(ext.c, ext.r, p.x, p.z);
    }
    if (mon) {
      const p = gridToWorld(mon.c, mon.r);
      monsterPos.set(p.x, 0, p.z);
    }

    buildEldritchMonster();

    flashlight = new THREE.SpotLight(0xfff4e0, 26, 28, Math.PI / 7, 0.45, 1);
    flashlight.position.set(0.08, -0.06, 0);
    flashlight.target.position.set(0, -0.12, -1.4);
    flashlight.castShadow = false;
    camera.add(flashlight);
    camera.add(flashlight.target);
    scene.add(camera);

    clock = new THREE.Clock(false);
  }

  function resize() {
    if (!renderer || !camera) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function updateAtmosphere() {
    if (!scene || !scene.fog || !renderer || !hemiLight) return;

    const dE = horizDist(playerFeet, exitPos);
    const dM = horizDist(playerFeet, monster.position);
    const dS = horizDist(playerFeet, startPosVec);

    const nearE = Math.max(0, 1 - dE / 11);
    const nearM = Math.max(0, 1 - dM / 9);
    const nearS = Math.max(0, 1 - dS / 8);

    colFogCur.set(0x050508);
    colHemiA.set(0x0a0806);
    colFogCur.lerp(colHemiA, nearS * 0.42);

    colHemiA.set(0x050a08);
    colFogCur.lerp(colHemiA, nearE * 0.58);

    colHemiA.set(0x100608);
    colFogCur.lerp(colHemiA, nearM * 0.48);

    scene.fog.color.copy(colFogCur);

    let dens = 0.088;
    dens += nearM * 0.038;
    dens -= nearE * 0.03;
    dens += nearS * 0.014;
    scene.fog.density = Math.max(0.062, Math.min(0.128, dens));

    colClearCur.copy(colFogCur).multiplyScalar(0.52);
    renderer.setClearColor(colClearCur, 1);

    colHemiA.set(0x0a0a14);
    colHemiB.set(0x081208);
    hemiLight.color.lerpColors(colHemiA, colHemiB, nearE * 0.55);
    colHemiB.set(0x140608);
    hemiLight.color.lerp(colHemiB, nearM * 0.38);

    colHemiA.set(0x020203);
    colHemiB.set(0x020302);
    hemiLight.groundColor.lerpColors(colHemiA, colHemiB, nearE * 0.48);
    colHemiB.set(0x030202);
    hemiLight.groundColor.lerp(colHemiB, nearM * 0.36);

    if (flashlight) {
      const g = 0.88 + nearE * 0.1;
      flashlight.color.setRGB(1, 0.96 - nearE * 0.04, Math.min(1, g));
    }
  }

  function stopDrone() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = 0;
    }
    try {
      if (droneOsc) droneOsc.stop();
    } catch (_) {}
    droneOsc = null;
    droneGain = null;
  }

  function startAudio() {
    if (muted) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx) {
        audioCtx = new AC();
        const buffer = audioCtx.createBuffer(1, 1, 22050);
        const silent = audioCtx.createBufferSource();
        silent.buffer = buffer;
        silent.connect(audioCtx.destination);
        silent.start(0);
      }
    } catch (_) {
      return;
    }

    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    if (!droneOsc) {
      droneOsc = audioCtx.createOscillator();
      droneGain = audioCtx.createGain();
      droneOsc.type = 'sawtooth';
      droneOsc.frequency.setValueAtTime(48, audioCtx.currentTime);
      droneGain.gain.setValueAtTime(0, audioCtx.currentTime);
      droneGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 1.2);
      droneOsc.connect(droneGain);
      droneGain.connect(audioCtx.destination);
      droneOsc.start();
    }

    if (!heartbeatInterval) {
      heartbeatInterval = window.setInterval(() => {
        if (muted || state !== GameState.PLAYING || !audioCtx || !monster) return;
        const d = horizDist(playerFeet, monster.position);
        if (d > 14) return;
        playSting(70 + Math.max(0, 12 - d) * 8, 0.06, 'sine', 0.06 + (14 - d) * 0.012);
      }, 620);
    }
  }

  function playSting(freq, dur, type, vol) {
    if (!audioCtx || muted) return;
    try {
      const ac = audioCtx;
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      g.gain.setValueAtTime(vol, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + dur);
    } catch (_) {}
  }

  function playDeathSound() {
    playSting(45, 0.4, 'sawtooth', 0.2);
    playSting(120, 0.15, 'square', 0.12);
  }

  function playClearSound() {
    playString(330);
  }

  function playString(f) {
    if (!audioCtx || muted) return;
    try {
      const ac = audioCtx;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, ac.currentTime);
      g.gain.setValueAtTime(0.08, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + 0.5);
    } catch (_) {}
  }

  function setState(next) {
    state = next;
    document.getElementById('startScreen').classList.toggle('hidden', state !== GameState.START);
    document.getElementById('gameoverScreen').classList.toggle('hidden', state !== GameState.GAMEOVER);
    document.getElementById('clearScreen').classList.toggle('hidden', state !== GameState.CLEAR);
    hud.classList.toggle('hidden', state !== GameState.PLAYING);
    pointerHint.classList.toggle('hidden', state !== GameState.PLAYING || isMobile || document.pointerLockElement === canvas);

    if (state === GameState.PLAYING) {
      if (clock) clock.start();
    } else {
      if (clock) clock.stop();
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    }
  }

  function resetRound() {
    colliders.length = 0;
    if (renderer) renderer.dispose();
    renderer = null;
    scene = null;
    camera = null;
    flashlight = null;
    monster = null;
    clock = null;

    buildLevel();
    resize();

    yaw = 0;
    pitch = 0;
    const start = findCell('S');
    if (start) {
      const p = gridToWorld(start.c, start.r);
      playerFeet.set(p.x, HORROR_EYE_Y, p.z);
    }
    const mon = findCell('M');
    if (mon) {
      const p = gridToWorld(mon.c, mon.r);
      monsterPos.set(p.x, 0, p.z);
      if (monster) monster.position.copy(monsterPos);
    }
    if (camera) {
      camera.position.copy(playerFeet);
      camera.rotation.set(0, 0, 0);
    }
  }

  function beginPlay() {
    stopDrone();
    resetRound();
    setState(GameState.PLAYING);
    hudHint.textContent = '出口は外へ続くドア。隙間から緑の光。音が近いほど危ない。';
    startAudio();
    if (!isMobile) pointerHint.classList.remove('hidden');
    canvas.focus();
  }

  function onCaught() {
    playDeathSound();
    setState(GameState.GAMEOVER);
    stopDrone();
  }

  function onClear() {
    playClearSound();
    setState(GameState.CLEAR);
    stopDrone();
  }

  function updatePlaying(dt) {
    if (!camera || !monster) return;

    updateAtmosphere();

    camera.position.copy(playerFeet);

    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    let spd = HORROR_MOVE_SPEED;
    if (input.fwd && (input.strafeL || input.strafeR)) spd *= 0.92;

    let mx = 0;
    let mz = 0;
    if (input.fwd) {
      mx += forward.x * spd * dt;
      mz += forward.z * spd * dt;
    }
    if (input.back) {
      mx -= forward.x * spd * 0.85 * dt;
      mz -= forward.z * spd * 0.85 * dt;
    }
    if (input.strafeL) {
      mx -= right.x * spd * 0.95 * dt;
      mz -= right.z * spd * 0.95 * dt;
    }
    if (input.strafeR) {
      mx += right.x * spd * 0.95 * dt;
      mz += right.z * spd * 0.95 * dt;
    }

    if (input.turnL) yaw += 1.85 * dt;
    if (input.turnR) yaw -= 1.85 * dt;

    tryMoveXZ(playerFeet, mx, mz);
    playerFeet.y = HORROR_EYE_Y;

    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    const toP = new THREE.Vector3(playerFeet.x - monsterPos.x, 0, playerFeet.z - monsterPos.z);
    const dist = horizDist(playerFeet, monster.position);
    if (dist > 0.01) {
      toP.normalize();
      const msp = HORROR_MONSTER_SPEED * dt;
      monsterTryMove(monsterPos, toP.x * msp, toP.z * msp);
    }
    monster.position.set(monsterPos.x, 0, monsterPos.z);
    monster.lookAt(playerFeet.x, 1.15, playerFeet.z);

    const animT = performance.now() * 0.001;
    const ud = monster.userData;
    if (ud.tentacles) {
      for (let i = 0; i < ud.tentacles.length; i++) {
        const item = ud.tentacles[i];
        const tw = Math.sin(animT * item.speed + item.phase) * 0.14;
        item.mesh.rotation.z = tw;
        item.mesh.rotation.x = Math.sin(animT * 0.85 + item.phase * 0.5) * 0.1;
      }
    }
    if (ud.coreMesh && ud.coreMesh.material && ud.coreMesh.material.emissiveIntensity !== undefined) {
      ud.coreMesh.material.emissiveIntensity = 0.62 + Math.sin(animT * 2.8) * 0.18;
    }
    if (ud.auraLight) {
      ud.auraLight.intensity = 0.28 + Math.sin(animT * 2.4) * 0.14;
    }

    if (horizDist(playerFeet, monster.position) < HORROR_CATCH_R) {
      onCaught();
      return;
    }

    const dExit = Math.hypot(playerFeet.x - exitPos.x, playerFeet.z - exitPos.z);
    if (dExit < HORROR_EXIT_R) {
      onClear();
      return;
    }

    if (dExit < 12) hudHint.textContent = 'ドアが近い…あと一息。';
    else if (dist < 6) hudHint.textContent = '背後の気配。まっすぐ、角を減らす。';
    else hudHint.textContent = '暗闇だけが味方。光を振って確かめる。';
  }

  /** 毎フレーム */
  function tick() {
    requestAnimationFrame(tick);
    if (!renderer || !scene || !camera) return;
    if (state === GameState.PLAYING && clock) {
      const dt = Math.min(clock.getDelta(), 0.1);
      updatePlaying(dt);
    }
    renderer.render(scene, camera);
  }

  // --- 入力（キーボード） ---
  function keyDown(e) {
    const k = e.key;
    if (k === 'a' || k === 'A') input.strafeL = true;
    if (k === 'd' || k === 'D') input.strafeR = true;
    if (k === 'ArrowLeft') input.turnL = true;
    if (k === 'ArrowRight') input.turnR = true;
    if (k === 'w' || k === 'W' || k === 'ArrowUp') input.fwd = true;
    if (k === 's' || k === 'S' || k === 'ArrowDown') input.back = true;
  }

  function keyUp(e) {
    const k = e.key;
    if (k === 'a' || k === 'A') input.strafeL = false;
    if (k === 'd' || k === 'D') input.strafeR = false;
    if (k === 'ArrowLeft') input.turnL = false;
    if (k === 'ArrowRight') input.turnR = false;
    if (k === 'w' || k === 'W' || k === 'ArrowUp') input.fwd = false;
    if (k === 's' || k === 'S' || k === 'ArrowDown') input.back = false;
  }

  document.addEventListener('keydown', keyDown);
  document.addEventListener('keyup', keyUp);

  canvas.addEventListener('click', () => {
    if (state === GameState.PLAYING && !isMobile) canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === canvas;
    pointerHint.classList.toggle('hidden', locked || state !== GameState.PLAYING || isMobile);
  });

  document.addEventListener('mousemove', (e) => {
    if (state !== GameState.PLAYING || document.pointerLockElement !== canvas) return;
    yaw -= e.movementX * HORROR_MOUSE_SENS;
    pitch -= e.movementY * HORROR_MOUSE_SENS;
    const lim = Math.PI / 2 - 0.08;
    pitch = Math.max(-lim, Math.min(lim, pitch));
  });

  function bindHold(id, onKeys) {
    const el = document.getElementById(id);
    if (!el) return;
    const down = (e) => {
      e.preventDefault();
      onKeys(true);
      try {
        navigator.vibrate(12);
      } catch (_) {}
    };
    const up = (e) => {
      e.preventDefault();
      onKeys(false);
    };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
    el.addEventListener('mousedown', () => onKeys(true));
    el.addEventListener('mouseup', () => onKeys(false));
    el.addEventListener('mouseleave', () => onKeys(false));
  }

  bindHold('btnLeft', (v) => {
    input.turnL = v;
  });
  bindHold('btnRight', (v) => {
    input.turnR = v;
  });
  bindHold('btnUp', (v) => {
    input.fwd = v;
  });
  bindHold('btnDown', (v) => {
    input.back = v;
  });

  container.addEventListener(
    'touchstart',
    (e) => {
      if (state !== GameState.PLAYING) return;
      const t = e.targetTouches[0];
      if (!t) return;
      if (t.clientY < window.innerHeight * 0.38) {
        lookTouchId = t.identifier;
        lastLookX = t.clientX;
        lastLookY = t.clientY;
      }
    },
    { passive: false }
  );

  container.addEventListener(
    'touchmove',
    (e) => {
      if (state !== GameState.PLAYING || lookTouchId < 0) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === lookTouchId) {
          const dx = t.clientX - lastLookX;
          const dy = t.clientY - lastLookY;
          lastLookX = t.clientX;
          lastLookY = t.clientY;
          yaw -= dx * HORROR_TOUCH_SENS;
          pitch -= dy * HORROR_TOUCH_SENS;
          const lim = Math.PI / 2 - 0.08;
          pitch = Math.max(-lim, Math.min(lim, pitch));
          e.preventDefault();
          break;
        }
      }
    },
    { passive: false }
  );

  function endLook(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId) lookTouchId = -1;
    }
  }
  container.addEventListener('touchend', endLook);
  container.addEventListener('touchcancel', endLook);

  document.addEventListener(
    'touchmove',
    (e) => {
      if (state === GameState.PLAYING) e.preventDefault();
    },
    { passive: false }
  );

  let te = 0;
  document.addEventListener('touchend', (e) => {
    const n = Date.now();
    if (n - te <= 300) e.preventDefault();
    te = n;
  }, false);

  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
    saveMute();
    if (muted) stopDrone();
    else if (state === GameState.PLAYING) startAudio();
  });

  document.getElementById('startBtn').addEventListener('click', () => {
    loadMute();
    beginPlay();
  });
  document.getElementById('retryBtn').addEventListener('click', beginPlay);
  document.getElementById('clearRetryBtn').addEventListener('click', beginPlay);

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  });

  if (isMobile) mobileControls.classList.remove('hidden');
  loadMute();
  setState(GameState.START);
  buildLevel();
  resize();
  requestAnimationFrame(tick);
})();
