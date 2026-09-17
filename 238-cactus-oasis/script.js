import * as THREE from 'three';
import {
  LS, WIN_BLOOM, LOSE_EATEN, MAX_WATER, START_WATER, MAX_CACTI, MAX_CAMELS,
  MAP, WELL_R, PLANT_COST, GROW_SEC, EAT_SEC, SCARE_CD, SCARE_R, SCARE_FEAR,
  PLAYER_SPEED, CAMEL_SPEED, WATER_REFILL, PLANT_GAP, CAMEL_SCALE, CACTUS_SCALE,
} from './config.js';
import {
  audioInit, unlockAudio, isMuted, toggleMuted, sfx, startBgm,
} from './audio.js';

const canvas = document.getElementById('cv');
const stage = document.getElementById('game-stage');
const overlay = document.getElementById('overlay');
const overlayBody = document.getElementById('overlayBody');
const btnStart = document.getElementById('btnStart');
const hudWater = document.getElementById('hudWater');
const hudBloom = document.getElementById('hudBloom');
const hudEaten = document.getElementById('hudEaten');
const btnMute = document.getElementById('btnMute');
const btnPause = document.getElementById('btnPause');
const pauseDlg = document.getElementById('pauseDlg');
const errEl = document.getElementById('err');
const dpad = document.getElementById('dpad');

const keys = { up: false, down: false, left: false, right: false, a: false, b: false };
const prev = { a: false, b: false };
let state = 'title';
let lastTap = 0;
let lastFrame = 0;
let scareCd = 0;
let spawnT = 4;
let wellT = 0;
let water = START_WATER;
let eaten = 0;
let bestBloom = 0;
let peakBloom = 0;
let player = { x: 0, z: 3.2 };
let cacti = [];
let camels = [];
let scareRing = null;
let scareAge = 0;

let renderer, scene, camera, playerMesh, dummy;
const camFocus = new THREE.Vector3(0, 0, 0);
const look = new THREE.Vector3();
const playerPos = new THREE.Vector3();
let dpadOn = false;

window.addEventListener('error', () => {
  if (errEl) errEl.hidden = false;
});

function readBest() {
  try {
    const n = parseInt(localStorage.getItem(LS.best) || '0', 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeBest(n) {
  try {
    localStorage.setItem(LS.best, String(n));
  } catch {
    /* ignore */
  }
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2);
}

function dist(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function sandTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#d2b48c';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const r = 170 + Math.random() * 50;
    const gv = 130 + Math.random() * 45;
    const b = 70 + Math.random() * 40;
    g.fillStyle = 'rgba(' + (r | 0) + ',' + (gv | 0) + ',' + (b | 0) + ',' + (0.12 + Math.random() * 0.28) + ')';
    g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePlayer() {
  const g = new THREE.Group();
  const cloth = new THREE.MeshLambertMaterial({ color: 0x6b4a2b });
  const skin = new THREE.MeshLambertMaterial({ color: 0xe0c09a });
  const hatM = new THREE.MeshLambertMaterial({ color: 0xc4a050 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.62, 4, 8), cloth);
  body.position.y = 0.72;
  body.castShadow = true;
  g.add(body);
  const armGeo = new THREE.CapsuleGeometry(0.07, 0.32, 3, 6);
  const armL = new THREE.Mesh(armGeo, cloth);
  armL.position.set(-0.34, 0.88, 0.04);
  armL.rotation.z = 0.55;
  armL.castShadow = true;
  g.add(armL);
  const armR = armL.clone();
  armR.position.set(0.34, 0.88, 0.04);
  armR.rotation.z = -0.55;
  g.add(armR);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), skin);
  head.position.y = 1.28;
  head.castShadow = true;
  g.add(head);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.28, 8), hatM);
  hat.position.y = 1.5;
  g.add(hat);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.04, 10), hatM);
  brim.position.y = 1.38;
  g.add(brim);
  return g;
}

function makeCactus() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0x2f7a45 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1, 8), mat);
  stem.position.y = 0.5;
  stem.castShadow = true;
  g.add(stem);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.42, 6), mat);
  arm.position.set(0.28, 0.68, 0);
  arm.rotation.z = -0.95;
  arm.castShadow = true;
  g.add(arm);
  const arm2 = arm.clone();
  arm2.position.set(-0.26, 0.52, 0);
  arm2.rotation.z = 0.95;
  g.add(arm2);
  const flower = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xe8789a }),
  );
  flower.position.y = 1.12;
  flower.visible = false;
  flower.castShadow = true;
  g.add(flower);
  g.userData.flower = flower;
  return g;
}

function applyCactusStage(mesh, stageLv) {
  const s = (0.45 + stageLv * 0.22) * CACTUS_SCALE;
  mesh.scale.set(s, (0.55 + stageLv * 0.28) * CACTUS_SCALE, s);
  mesh.userData.flower.visible = stageLv >= 3;
}

function makeCamel() {
  // 進行方向は +Z。updateCamels の rotation.y = atan2(vx, vz) と揃える
  const g = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({ color: 0xc4a574 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x8a6a42 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 10, 8), skin);
  body.scale.set(0.9, 0.82, 1.45);
  body.position.y = 0.78;
  body.castShadow = true;
  g.add(body);
  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), dark);
  hump.position.set(0, 1.22, -0.02);
  hump.castShadow = true;
  g.add(hump);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.68, 6), skin);
  neck.position.set(0, 1.05, 0.55);
  neck.rotation.x = 0.62;
  neck.castShadow = true;
  g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), skin);
  head.position.set(0, 1.34, 0.92);
  g.add(head);
  const legs = [];
  // [x, z] = [左右, 前後]。後左・前左・後右・前右の順（対角ペアで振る）
  const offs = [[-0.2, -0.32], [-0.2, 0.28], [0.2, -0.32], [0.2, 0.28]];
  for (const [x, z] of offs) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.72, 5), dark);
    leg.position.set(x, 0.36, z);
    g.add(leg);
    legs.push(leg);
  }
  g.userData.legs = legs;
  g.scale.setScalar(CAMEL_SCALE);
  return g;
}

function placeRocks() {
  const geo = new THREE.DodecahedronGeometry(0.38, 0);
  const mat = new THREE.MeshLambertMaterial({ color: 0xb08958 });
  const rocks = new THREE.InstancedMesh(geo, mat, 26);
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  dummy = new THREE.Object3D();
  let i = 0;
  let guard = 0;
  while (i < 26 && guard < 240) {
    guard += 1;
    const x = (Math.random() * 2 - 1) * 15;
    const z = (Math.random() * 2 - 1) * 15;
    if (Math.hypot(x, z) < 3.2) continue;
    dummy.position.set(x, 0.18, z);
    dummy.rotation.set(Math.random(), Math.random() * 6, Math.random());
    const s = 0.5 + Math.random() * 1.1;
    dummy.scale.set(s, 0.4 + Math.random() * 0.7, s);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
    i += 1;
  }
  rocks.instanceMatrix.needsUpdate = true;
  scene.add(rocks);
}

function buildWorld() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc9a66b);
  scene.fog = new THREE.Fog(0xc9a66b, 18, 42);

  camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
  camera.position.set(12, 16, 12);

  const hemi = new THREE.HemisphereLight(0xffe2b0, 0xc4a574, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d0, 1.15);
  sun.position.set(12, 20, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 48;
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 48),
    new THREE.MeshLambertMaterial({ map: sandTexture(), color: 0xe8d2a8 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const oasis = new THREE.Mesh(
    new THREE.CircleGeometry(2.4, 24),
    new THREE.MeshLambertMaterial({ color: 0x6a8f4e }),
  );
  oasis.rotation.x = -Math.PI / 2;
  oasis.position.y = 0.02;
  oasis.receiveShadow = true;
  scene.add(oasis);

  const well = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.82, 0.5, 12),
    new THREE.MeshLambertMaterial({ color: 0x7a5a3a }),
  );
  well.position.y = 0.25;
  well.castShadow = true;
  well.receiveShadow = true;
  scene.add(well);
  const waterM = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 16),
    new THREE.MeshLambertMaterial({ color: 0x3a7ea8 }),
  );
  waterM.rotation.x = -Math.PI / 2;
  waterM.position.y = 0.52;
  scene.add(waterM);

  for (let d = 0; d < 6; d++) {
    const dune = new THREE.Mesh(
      new THREE.SphereGeometry(3.2 + Math.random(), 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xc4a574 }),
    );
    const ang = (d / 6) * Math.PI * 2;
    dune.position.set(Math.cos(ang) * 16, -1.6, Math.sin(ang) * 16);
    dune.scale.set(1.6, 0.28, 1.2);
    dune.receiveShadow = true;
    scene.add(dune);
  }

  placeRocks();
  playerMesh = makePlayer();
  scene.add(playerMesh);

  scareRing = new THREE.Mesh(
    new THREE.RingGeometry(0.4, 0.55, 24),
    new THREE.MeshBasicMaterial({ color: 0xe8a050, transparent: true, opacity: 0, side: THREE.DoubleSide }),
  );
  scareRing.rotation.x = -Math.PI / 2;
  scareRing.position.y = 0.08;
  scene.add(scareRing);
}

function resize() {
  if (!renderer || !camera) return;
  const w = stage.clientWidth || window.innerWidth;
  const h = stage.clientHeight || Math.floor(window.innerHeight * 0.75);
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  camera.aspect = Math.max(0.5, w / Math.max(1, h));
  camera.updateProjectionMatrix();
}

function initRenderer() {
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent);
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !ios,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('outputColorSpace' in renderer && 'SRGBColorSpace' in THREE) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
}

function bloomCount() {
  let n = 0;
  for (const c of cacti) if (c.stage >= 3) n += 1;
  return n;
}

function updateHud() {
  hudWater.textContent = String(water);
  hudBloom.textContent = String(bloomCount());
  hudEaten.textContent = String(eaten);
  btnMute.textContent = isMuted() ? '🔇' : '♪';
}

function setOverlay(mode, title, body, btn) {
  const apply = () => {
    overlay.hidden = mode === 'none';
    if (mode !== 'none') {
      overlay.querySelector('h1').textContent = title;
      overlayBody.textContent = body;
      btnStart.textContent = btn;
    }
  };
  if (document.startViewTransition) document.startViewTransition(apply);
  else apply();
}

function syncMuteUi() {
  const label = isMuted() ? '音を出す' : '音を消す';
  btnMute.textContent = isMuted() ? '🔇' : '♪';
  const dlg = document.getElementById('btnMuteDlg');
  if (dlg) dlg.textContent = label;
}

function resetRun() {
  for (const c of cacti) scene.remove(c.mesh);
  for (const m of camels) scene.remove(m.mesh);
  cacti = [];
  camels = [];
  water = START_WATER;
  eaten = 0;
  peakBloom = 0;
  scareCd = 0;
  spawnT = 4;
  wellT = 0;
  player.x = 0;
  player.z = 3.2;
  scareAge = 0;
  scareRing.material.opacity = 0;
  bestBloom = readBest();
  updateHud();
}

function nearestCactus(x, z) {
  let best = null;
  let bd = 1e9;
  for (const c of cacti) {
    const d = dist(x, z, c.x, c.z);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return { cactus: best, d: bd };
}

function spawnCamel() {
  if (camels.length >= MAX_CAMELS) return;
  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let z = 0;
  if (side === 0) { x = -MAP; z = (Math.random() * 2 - 1) * MAP; }
  else if (side === 1) { x = MAP; z = (Math.random() * 2 - 1) * MAP; }
  else if (side === 2) { z = -MAP; x = (Math.random() * 2 - 1) * MAP; }
  else { z = MAP; x = (Math.random() * 2 - 1) * MAP; }
  const mesh = makeCamel();
  mesh.position.set(x, 0, z);
  scene.add(mesh);
  camels.push({
    id: uid(),
    x, z,
    vx: 0, vz: 0,
    fear: 0,
    eat: 0,
    mesh,
    t: Math.random() * 10,
  });
}

function tryPlant() {
  if (water < PLANT_COST || cacti.length >= MAX_CACTI) return;
  if (dist(player.x, player.z, 0, 0) < WELL_R + 0.4) return;
  const near = nearestCactus(player.x, player.z);
  if (near.cactus && near.d < PLANT_GAP) return;
  const x = clamp(player.x, -MAP + 1, MAP - 1);
  const z = clamp(player.z, -MAP + 1, MAP - 1);
  water -= PLANT_COST;
  const mesh = makeCactus();
  mesh.position.set(x, 0, z);
  applyCactusStage(mesh, 0);
  scene.add(mesh);
  cacti.push({ id: uid(), x, z, stage: 0, grow: 0, mesh });
  sfx('plant');
  updateHud();
}

function tryWater(dt) {
  const near = nearestCactus(player.x, player.z);
  if (!near.cactus || near.d > 1.25) return;
  if (near.cactus.stage >= 3) return;
  near.cactus.grow += dt * 1.85;
  if (Math.random() < dt * 3) sfx('water');
}

function tryScare() {
  if (scareCd > 0) return;
  scareCd = SCARE_CD;
  scareAge = 0.001;
  scareRing.position.set(player.x, 0.08, player.z);
  scareRing.scale.set(1, 1, 1);
  scareRing.material.opacity = 0.85;
  sfx('scare');
  if (navigator.vibrate) navigator.vibrate(18);
  for (const m of camels) {
    if (dist(m.x, m.z, player.x, player.z) <= SCARE_R) {
      m.fear = SCARE_FEAR;
      m.eat = 0;
    }
  }
}

function removeCactus(c) {
  scene.remove(c.mesh);
  cacti = cacti.filter((x) => x.id !== c.id);
}

function finish(win) {
  state = win ? 'win' : 'lose';
  sfx(win ? 'win' : 'lose');
  const bloom = bloomCount();
  if (peakBloom > bestBloom) {
    bestBloom = peakBloom;
    writeBest(bestBloom);
  }
  setOverlay(
    'end',
    win ? 'オアシスが根付いた' : '砂漠に戻った',
    win
      ? '開花 ' + bloom + '本。自己ベスト同時開花 ' + bestBloom + '。もう一度守るか。'
      : '食害が5本に達した。ベスト同時開花 ' + bestBloom + '。井戸からやり直せる。',
    'もう一度',
  );
}

function updatePlayer(dt) {
  let mx = 0;
  let mz = 0;
  if (keys.left) mx -= 1;
  if (keys.right) mx += 1;
  if (keys.up) mz -= 1;
  if (keys.down) mz += 1;
  if (mx || mz) {
    const len = Math.hypot(mx, mz) || 1;
    player.x = clamp(player.x + (mx / len) * PLAYER_SPEED * dt, -MAP, MAP);
    player.z = clamp(player.z + (mz / len) * PLAYER_SPEED * dt, -MAP, MAP);
    playerMesh.rotation.y = Math.atan2(mx, mz);
  }
  playerMesh.position.set(player.x, 0, player.z);
  if (dist(player.x, player.z, 0, 0) < WELL_R) {
    wellT += dt;
    if (wellT >= WATER_REFILL && water < MAX_WATER) {
      water += 1;
      wellT = 0;
      sfx('water');
      updateHud();
    }
  } else wellT = 0;
}

function updateCacti(dt) {
  for (const c of cacti) {
    if (c.stage >= 3) continue;
    c.grow += dt;
    if (c.grow >= GROW_SEC) {
      c.grow = 0;
      c.stage += 1;
      applyCactusStage(c.mesh, c.stage);
      if (c.stage >= 3) sfx('bloom');
    }
  }
  const b = bloomCount();
  if (b > peakBloom) peakBloom = b;
  if (b >= WIN_BLOOM) finish(true);
}

function updateCamels(dt) {
  for (let i = camels.length - 1; i >= 0; i--) {
    const m = camels[i];
    m.t += dt;
    let tx = player.x;
    let tz = player.z;
    const near = nearestCactus(m.x, m.z);
    if (near.cactus) {
      tx = near.cactus.x;
      tz = near.cactus.z;
    }
    let dx = tx - m.x;
    let dz = tz - m.z;
    if (m.fear > 0) {
      m.fear -= dt;
      dx = m.x - player.x;
      dz = m.z - player.z;
    }
    const len = Math.hypot(dx, dz) || 1;
    let spd = CAMEL_SPEED * (m.fear > 0 ? 1.55 : 1);
    const toP = dist(m.x, m.z, player.x, player.z);
    if (m.fear <= 0 && toP < 1.15) spd *= 0.32;
    m.vx = (dx / len) * spd;
    m.vz = (dz / len) * spd;
    m.x = clamp(m.x + m.vx * dt, -MAP - 1, MAP + 1);
    m.z = clamp(m.z + m.vz * dt, -MAP - 1, MAP + 1);
    m.mesh.position.set(m.x, 0, m.z);
    m.mesh.rotation.y = Math.atan2(m.vx, m.vz);
    const legs = m.mesh.userData.legs;
    if (legs) {
      const swing = Math.sin(m.t * 10) * 0.28;
      legs[0].rotation.x = swing;
      legs[3].rotation.x = swing;
      legs[1].rotation.x = -swing;
      legs[2].rotation.x = -swing;
    }
    if (m.fear <= 0 && near.cactus && near.d < 0.95) {
      m.eat += dt;
      m.x -= m.vx * dt * 0.85;
      m.z -= m.vz * dt * 0.85;
      if (m.eat >= EAT_SEC) {
        removeCactus(near.cactus);
        m.eat = 0;
        eaten += 1;
        sfx('eat');
        updateHud();
        if (eaten >= LOSE_EATEN) {
          finish(false);
          return;
        }
      }
    } else m.eat = 0;
    if (m.fear > 0 && (Math.abs(m.x) > MAP + 0.2 || Math.abs(m.z) > MAP + 0.2)) {
      scene.remove(m.mesh);
      camels.splice(i, 1);
    }
  }
}

function updateScare(dt) {
  if (scareCd > 0) scareCd -= dt;
  if (scareAge <= 0) return;
  scareAge += dt;
  const s = 1 + scareAge * 10;
  scareRing.scale.set(s, 1, s);
  scareRing.material.opacity = Math.max(0, 0.85 - scareAge * 1.6);
  if (scareAge > 0.6) {
    scareAge = 0;
    scareRing.material.opacity = 0;
  }
}

function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
  lastFrame = now;
  if (state !== 'playing') {
    if (renderer && scene && camera) renderer.render(scene, camera);
    return;
  }
  if (keys.a && !prev.a) tryPlant();
  if (keys.a) tryWater(dt);
  if (keys.b && !prev.b) tryScare();
  prev.a = keys.a;
  prev.b = keys.b;

  updatePlayer(dt);
  updateCacti(dt);
  if (state !== 'playing') {
    renderer.render(scene, camera);
    return;
  }
  spawnT -= dt;
  const interval = Math.max(5.2, 13.5 - peakBloom * 1.1);
  if (spawnT <= 0) {
    spawnCamel();
    spawnT = interval;
  }
  updateCamels(dt);
  updateScare(dt);
  playerPos.set(player.x, 0, player.z);
  camFocus.lerp(playerPos, 1 - Math.pow(0.012, dt));
  camera.position.set(camFocus.x + 11.5, 15.5, camFocus.z + 11.5);
  look.set(camFocus.x, 0.4, camFocus.z);
  camera.lookAt(look);
  renderer.render(scene, camera);
}

function startPlay() {
  resetRun();
  state = 'playing';
  setOverlay('none');
  if (pauseDlg.open) pauseDlg.close();
}

function pauseGame() {
  if (state !== 'playing') return;
  state = 'paused';
  if (typeof pauseDlg.showModal === 'function') pauseDlg.showModal();
}

function resumeGame() {
  if (state !== 'paused') return;
  state = 'playing';
  lastFrame = performance.now();
  if (pauseDlg.open) pauseDlg.close();
}

function toTitle() {
  state = 'title';
  if (pauseDlg.open) pauseDlg.close();
  setOverlay(
    'title',
    'サボテンオアシス',
    '砂漠の井戸で棘を育てる。ラクダは必ず食べに来る。植えて、水をやり、進路を塞いで、声で退けろ。自己ベスト同時開花 ' + readBest() + '。',
    'タップして始める',
  );
}

function bindTap(el, handler) {
  if (!el) return;
  const fire = (e) => {
    e.preventDefault();
    el.classList.add('is-pressed');
    if (navigator.vibrate) navigator.vibrate(15);
    sfx('tap');
    handler(e);
  };
  const release = () => el.classList.remove('is-pressed');
  el.addEventListener('pointerdown', fire);
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('pointerleave', release);
}

function bindHold(el, code) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-pressed');
    keys[code] = true;
    if (navigator.vibrate) navigator.vibrate(12);
    unlockAudio();
  });
  const off = () => {
    keys[code] = false;
    el.classList.remove('is-pressed');
  };
  el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off);
}

function dpadFromEvent(e) {
  const r = dpad.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  const dead = 0.16;
  keys.left = x < -dead;
  keys.right = x > dead;
  keys.up = y < -dead;
  keys.down = y > dead;
  dpad.classList.toggle('press-l', keys.left);
  dpad.classList.toggle('press-r', keys.right);
  dpad.classList.toggle('press-u', keys.up);
  dpad.classList.toggle('press-d', keys.down);
}

function clearDpad() {
  keys.up = keys.down = keys.left = keys.right = false;
  dpad.classList.remove('press-u', 'press-d', 'press-l', 'press-r');
}

function bindDpad() {
  dpad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    dpadOn = true;
    dpad.setPointerCapture(e.pointerId);
    dpadFromEvent(e);
    unlockAudio();
  });
  dpad.addEventListener('pointermove', (e) => {
    if (dpadOn) dpadFromEvent(e);
  });
  const off = () => {
    dpadOn = false;
    clearDpad();
  };
  dpad.addEventListener('pointerup', off);
  dpad.addEventListener('pointercancel', off);
}

function onKey(down, e) {
  const map = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    KeyZ: 'a', Space: 'a',
    KeyX: 'b',
  };
  const code = map[e.code];
  if (code) {
    e.preventDefault();
    keys[code] = down;
  }
  if (down && (e.code === 'KeyP' || e.code === 'Escape')) {
    e.preventDefault();
    if (state === 'playing') pauseGame();
    else if (state === 'paused') resumeGame();
  }
  if (down && e.code === 'KeyM') {
    toggleMuted();
    syncMuteUi();
  }
}

function wireUi() {
  bindTap(btnStart, async () => {
    audioInit();
    await unlockAudio();
    startBgm();
    if (state === 'title' || state === 'win' || state === 'lose') startPlay();
  });
  bindTap(btnMute, () => {
    toggleMuted();
    syncMuteUi();
  });
  bindTap(btnPause, () => {
    if (state === 'playing') pauseGame();
  });
  bindTap(document.getElementById('btnResume'), () => resumeGame());
  bindTap(document.getElementById('btnMuteDlg'), () => {
    toggleMuted();
    syncMuteUi();
  });
  bindTap(document.getElementById('btnQuit'), () => toTitle());
  pauseDlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    resumeGame();
  });
  bindHold(document.getElementById('btnA'), 'a');
  bindHold(document.getElementById('btnB'), 'b');
  bindDpad();
  window.addEventListener('keydown', (e) => onKey(true, e));
  window.addEventListener('keyup', (e) => onKey(false, e));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') pauseGame();
    else unlockAudio();
  });
  syncMuteUi();
}

function preventBrowserChrome() {
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap <= 300) e.preventDefault();
    lastTap = now;
  }, { passive: false });
  document.addEventListener('dblclick', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => {
    if (e.target.closest('[data-scrollable]')) return;
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('selectstart', (e) => e.preventDefault());
  document.addEventListener('dragstart', (e) => e.preventDefault());
}

function boot() {
  preventBrowserChrome();
  initRenderer();
  buildWorld();
  resize();
  const ro = new ResizeObserver(() => resize());
  ro.observe(stage);
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  if (window.visualViewport) visualViewport.addEventListener('resize', resize);
  wireUi();
  bestBloom = readBest();
  overlayBody.textContent =
    '砂漠の井戸で棘を育てる。ラクダは必ず食べに来る。植えて、水をやり、進路を塞いで、声で退けろ。自己ベスト同時開花 ' + bestBloom + '。';
  lastFrame = performance.now();
  requestAnimationFrame(tick);
}

boot();
