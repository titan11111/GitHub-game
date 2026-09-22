(function () {
  const SPECIES = [
    { id: "crow", label: "カラス" },
    { id: "cat", label: "猫" },
    { id: "bug", label: "虫" },
    { id: "sparrow", label: "雀" },
    { id: "plane", label: "飛行機" },
    { id: "car", label: "車" },
    { id: "dog", label: "犬" }
  ];
  const CONFUSE = {
    crow: ["sparrow", "plane"],
    sparrow: ["crow", "bug"],
    plane: ["crow", "car"],
    cat: ["dog", "sparrow"],
    dog: ["cat", "car"],
    car: ["plane", "dog"],
    bug: ["sparrow", "cat"]
  };
  const CAR_COLORS = [0xc0392b, 0x2f6fad, 0xf4f4f4, 0xe0b23a];
  const SIGHTINGS_PER_PHASE = 5;
  const KEY_BEST = "tg.253.best";
  const KEY_MUTE = "tg.253.mute";

  const scoreLine = document.getElementById("score-line");
  const metaLine = document.getElementById("meta-line");
  const timerFill = document.getElementById("timer-fill");
  const callout = document.getElementById("callout");
  const overlay = document.getElementById("overlay");
  const ovTitle = document.getElementById("ov-title");
  const ovBody = document.getElementById("ov-body");
  const ovList = document.getElementById("ov-list");
  const ovBest = document.getElementById("ov-best");
  const btnAction = document.getElementById("btn-action");
  const canvas = document.getElementById("view");
  const wrap = document.getElementById("screen-wrap");

  let mode = "title";
  let score = 0;
  let combo = 0;
  let lives = 3;
  let day = 1;
  let phase = 1;
  let seen = 0;
  let best = readNum(KEY_BEST);
  let muted = readFlag(KEY_MUTE);
  let lastId = "";
  let active = null;
  let stats = {};
  let gap = 0;
  let worldTime = 0;
  let last = performance.now();
  let earAlert = 0;
  let calloutLeft = 0;
  let ac = null;
  let bed = null;

  function readNum(key) {
    try {
      const n = Number(localStorage.getItem(key));
      return Number.isFinite(n) && n > 0 ? n : 0;
    } catch (e) {
      return 0;
    }
  }

  function readFlag(key) {
    try {
      return localStorage.getItem(key) === "1";
    } catch (e) {
      return false;
    }
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* 保存できない端末でもプレイは続ける */
    }
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function labelOf(id) {
    for (let i = 0; i < SPECIES.length; i++) {
      if (SPECIES[i].id === id) return SPECIES[i].label;
    }
    return "";
  }

  function unlock() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!ac) ac = new Ctx();
      if (ac.state === "suspended") ac.resume();
      if (!muted) startBed();
    } catch (e) {
      ac = null;
    }
  }

  function startBed() {
    if (!ac || muted || bed) return;
    const g = ac.createGain();
    g.gain.value = 0.012;
    g.connect(ac.destination);
    const o1 = ac.createOscillator();
    const o2 = ac.createOscillator();
    o1.type = "sine";
    o2.type = "sine";
    o1.frequency.value = 196;
    o2.frequency.value = 247;
    o1.connect(g);
    o2.connect(g);
    o1.start();
    o2.start();
    bed = { o1: o1, o2: o2, g: g };
  }

  function stopBed() {
    if (!bed) return;
    try {
      bed.o1.stop();
      bed.o2.stop();
    } catch (e) {
      /* 既に止まっている */
    }
    bed = null;
  }

  function tone(freq, dur, type, gain, pan) {
    if (!ac || muted) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    const t0 = ac.currentTime;
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    if (pan !== undefined && ac.createStereoPanner) {
      const p = ac.createStereoPanner();
      p.pan.value = clamp(pan, -1, 1);
      g.connect(p);
      p.connect(ac.destination);
    } else {
      g.connect(ac.destination);
    }
    o.start(t0);
    o.stop(t0 + dur);
  }

  function meow() {
    if (!ac || muted) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    const t0 = ac.currentTime;
    o.type = "sine";
    o.frequency.setValueAtTime(520, t0);
    o.frequency.exponentialRampToValueAtTime(820, t0 + 0.08);
    o.frequency.exponentialRampToValueAtTime(380, t0 + 0.22);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t0);
    o.stop(t0 + 0.25);
  }

  function chime() {
    tone(660, 0.18, "triangle", 0.035);
    window.setTimeout(function () { tone(880, 0.22, "triangle", 0.03); }, 120);
  }

  function bindTap(el, handler) {
    const down = function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* キャプチャ非対応 */ }
      el.classList.add("is-pressed");
      unlock();
      if (navigator.vibrate) navigator.vibrate(15);
      tone(1200, 0.03, "square", 0.02);
      handler();
    };
    const up = function () { el.classList.remove("is-pressed"); };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  function lifeText() {
    return "♥".repeat(Math.max(0, lives)) + "♡".repeat(Math.max(0, 3 - lives));
  }

  function renderHud() {
    scoreLine.textContent = String(score);
    const parts = [lifeText(), day + "日目 " + World.phaseName(phase)];
    if (combo >= 2) parts.push(combo + "連続");
    metaLine.textContent = parts.join("  ");
  }

  function breakdown() {
    const rows = SPECIES.filter(function (s) { return stats[s.id] > 0; })
      .sort(function (a, b) { return stats[b.id] - stats[a.id]; })
      .map(function (s) { return s.label + stats[s.id]; });
    return rows.length ? rows.join("・") : "";
  }

  function totalSeen() {
    return SPECIES.reduce(function (sum, s) { return sum + (stats[s.id] || 0); }, 0);
  }

  function showOverlay(kind) {
    overlay.classList.add("show");
    if (kind === "title") {
      ovTitle.textContent = "窓辺の猫";
      ovBody.textContent = "外に出たものを、消える前に押す。";
      ovList.textContent = "時間が進むほど暗くなり、点は高くなる。";
      btnAction.textContent = "はじめる";
    } else if (kind === "pause") {
      ovTitle.textContent = "ひと休み";
      ovBody.textContent = "外は止めてある。";
      ovList.textContent = day + "日目の" + World.phaseName(phase) + "・" + totalSeen() + "匹";
      btnAction.textContent = "つづける";
    } else {
      ovTitle.textContent = "ここまで";
      ovBody.textContent = totalSeen() + "匹を見分けた（" + day + "日目の" + World.phaseName(phase) + "）";
      ovList.textContent = breakdown() || "一匹も見分けられなかった";
      btnAction.textContent = "もう一度";
    }
    ovBest.textContent = best > 0 ? "ベスト " + best : "ベストはまだない";
  }

  function hideOverlay() {
    overlay.classList.remove("show");
  }

  function setMute(next) {
    muted = next;
    writeStore(KEY_MUTE, muted ? "1" : "0");
    const btn = document.getElementById("btn-mute");
    btn.textContent = muted ? "消" : "音";
    btn.setAttribute("aria-label", muted ? "音を戻す" : "ミュート");
    if (muted) stopBed();
    else startBed();
  }

  const deck = document.getElementById("control-deck");
  const rowA = document.createElement("div");
  const rowB = document.createElement("div");
  rowA.className = "deck-row";
  rowB.className = "deck-row";
  SPECIES.forEach(function (spec, index) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "game-btn";
    btn.id = "btn-" + spec.id;
    btn.textContent = spec.label;
    btn.setAttribute("aria-label", spec.label);
    bindTap(btn, function () { answer(spec.id); });
    (index < 4 ? rowA : rowB).appendChild(btn);
  });
  deck.appendChild(rowA);
  deck.appendChild(rowB);

  bindTap(btnAction, onAction);
  bindTap(document.getElementById("btn-mute"), function () { setMute(!muted); });
  bindTap(document.getElementById("btn-pause"), onPause);

  let lastTouchEnd = 0;
  document.addEventListener("touchend", function (e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  document.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener("dblclick", function (e) { e.preventDefault(); });
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("gesturestart", function (e) { e.preventDefault(); });
  document.addEventListener("selectstart", function (e) { e.preventDefault(); });
  document.addEventListener("dragstart", function (e) { e.preventDefault(); });
  window.addEventListener("pageshow", function () {
    if (ac && ac.state === "suspended" && !muted) ac.resume();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && mode === "play") pauseGame();
  });
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space") {
      e.preventDefault();
      if (mode === "play") pauseGame();
      else if (mode === "pause") resumeGame();
      else startGame();
      return;
    }
    if (e.code === "Enter") {
      e.preventDefault();
      onAction();
      return;
    }
    if (e.code === "KeyM") {
      setMute(!muted);
      return;
    }
    const map = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7"];
    const index = map.indexOf(e.code);
    if (index >= 0) answer(SPECIES[index].id);
  });

  function onAction() {
    unlock();
    if (mode === "pause") resumeGame();
    else startGame();
  }

  function onPause() {
    if (mode === "play") pauseGame();
    else if (mode === "pause") resumeGame();
  }

  function startGame() {
    score = 0;
    combo = 0;
    lives = 3;
    day = 1;
    phase = 0;
    seen = 0;
    lastId = "";
    stats = {};
    World.setPhase(phase);
    clearActive();
    gap = 0.7;
    callout.textContent = "";
    calloutLeft = 0;
    mode = "play";
    last = performance.now();
    hideOverlay();
    renderHud();
    unlock();
  }

  function pauseGame() {
    if (mode !== "play") return;
    if (active) World.setVisible(active.id, false);
    mode = "pause";
    showOverlay("pause");
  }

  function resumeGame() {
    if (mode !== "pause") return;
    if (active) World.setVisible(active.id, true);
    mode = "play";
    last = performance.now();
    hideOverlay();
  }

  function endGame() {
    if (score > best) {
      best = score;
      writeStore(KEY_BEST, String(best));
      mode = "over";
      clearActive();
      showOverlay("over");
      ovBest.textContent = "ベストを更新した";
      return;
    }
    mode = "over";
    clearActive();
    showOverlay("over");
  }

  function mark(id, ok) {
    const el = document.getElementById("btn-" + id);
    if (!el) return;
    el.classList.add(ok ? "ok" : "ng");
    window.setTimeout(function () { el.classList.remove("ok", "ng"); }, 280);
  }

  function clearActive() {
    World.hideAll();
    active = null;
    timerFill.style.width = "0%";
    timerFill.classList.remove("low");
  }

  function durationFor() {
    const base = 2.5 - Math.min(combo, 12) * 0.12 - (day - 1) * 0.15;
    const dark = phase === 3 ? 0.15 : 0;
    return Math.max(0.85, base) + dark;
  }

  function pickId() {
    const partners = (CONFUSE[lastId] || []).filter(function (id) { return id !== lastId; });
    if (partners.length && Math.random() < 0.45) {
      return partners[Math.floor(Math.random() * partners.length)];
    }
    const pool = SPECIES.filter(function (s) { return s.id !== lastId; });
    return pool[Math.floor(Math.random() * pool.length)].id;
  }

  function advancePhase() {
    phase += 1;
    if (phase >= World.phaseCount) {
      phase = 0;
      day += 1;
    }
    World.setPhase(phase);
    callout.textContent = World.phaseName(phase) + "になった";
    calloutLeft = 1;
    chime();
  }

  function spawn() {
    const id = pickId();
    lastId = id;
    active = { id: id, age: 0, duration: durationFor(), seed: Math.random() };
    earAlert = 1;
    if (id === "car") {
      World.setCarColor(CAR_COLORS[Math.floor(active.seed * CAR_COLORS.length) % CAR_COLORS.length]);
    }
    const x = World.place(id, 0, active.seed, worldTime);
    tone(880, 0.05, "sine", 0.03, clamp(x / 1.1, -1, 1));
    if (calloutLeft <= 0) callout.textContent = "";
  }

  function answer(id) {
    if (mode !== "play" || !active) return;
    resolve(id === active.id, id);
  }

  function resolve(ok, pressed) {
    if (!active) return;
    const id = active.id;
    const remain = clamp(1 - active.age / active.duration, 0, 1);
    if (ok) {
      combo += 1;
      stats[id] = (stats[id] || 0) + 1;
      const mult = World.phaseMultiplier(phase);
      const gain = Math.round((100 + 520 * remain + combo * 15) * mult);
      score += gain;
      callout.textContent = (remain > 0.75 ? "早い +" : "+") + gain;
      mark(id, true);
      meow();
    } else {
      lives -= 1;
      combo = 0;
      callout.textContent = labelOf(id) + "だった";
      if (pressed) mark(pressed, false);
      tone(160, 0.14, "sawtooth", 0.04);
    }
    calloutLeft = 0.85;
    clearActive();
    renderHud();
    if (lives <= 0) {
      endGame();
      return;
    }
    seen += 1;
    gap = ok ? Math.max(0.26, 0.48 - combo * 0.012) : 0.72;
    if (seen % SIGHTINGS_PER_PHASE === 0) {
      advancePhase();
      renderHud();
      gap = Math.max(gap, 1);
    }
  }

  function stepPlay(dt) {
    if (active) {
      active.age += dt;
      const p = Math.min(1, active.age / active.duration);
      World.place(active.id, p, active.seed, worldTime);
      const left = 1 - p;
      timerFill.style.width = (left * 100).toFixed(1) + "%";
      timerFill.classList.toggle("low", left < 0.28);
      if (active.age >= active.duration) resolve(false, null);
    } else {
      gap -= dt;
      timerFill.style.width = "0%";
      if (gap <= 0) spawn();
    }
    if (calloutLeft > 0) {
      calloutLeft -= dt;
      if (calloutLeft <= 0) callout.textContent = "";
    }
  }

  function resize() {
    const w = wrap.clientWidth || window.innerWidth;
    const h = wrap.clientHeight || window.innerHeight;
    if (!w || !h) return;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    World.resize(w, h);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (mode !== "pause") {
      worldTime += dt;
      World.ambient(dt, worldTime);
      World.hero(dt, worldTime, earAlert, mode === "play" && active ? active.id : null);
      earAlert = Math.max(0, earAlert - dt * 1.3);
      if (mode === "play") stepPlay(dt);
    }
    World.render();
  }

  if (!World.init(canvas)) {
    ovBody.textContent = "この端末では窓の外を表示できません。";
    ovList.textContent = "";
    btnAction.disabled = true;
    return;
  }

  window.addEventListener("resize", resize);
  resize();
  setMute(muted);
  renderHud();
  showOverlay("title");
  requestAnimationFrame(frame);
})();
