"use strict";
(function (global) {
  var MUTE_KEY = "TODAY_EXE_DAY038_MUTE";
  var BGM_VOL = 0.42;
  var SE_VOL = 0.62;
  var FADE_SEC = 0.8;

  var BGM_SRC = {
    title: "audio/bgm_title.m4a",
    day: "audio/bgm_day.m4a",
    night: "audio/bgm_night.m4a",
    overwork: "audio/bgm_overwork.m4a",
    result: "audio/bgm_result.m4a"
  };
  var SE_SRC = {
    click: "audio/se_click.wav",
    select: "audio/se_select.wav",
    time: "audio/se_time.wav",
    work: "audio/se_work.wav",
    rest: "audio/se_rest.wav",
    recovery: "audio/se_recovery.wav",
    overwork: "audio/se_overwork.wav",
    event: "audio/se_event.wav",
    result: "audio/se_result.wav",
    rank_s: "audio/se_rank_s.wav"
  };

  var se = {};
  var buffers = {};
  var loading = {};
  var muted = false;
  var unlocked = false;
  var currentId = null;
  var pendingId = "title";
  var currentSrc = null;
  var currentGain = null;
  var prevSrc = null;
  var prevGain = null;
  var ctx = null;
  var muteBtn = null;
  var master = null;

  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
  } catch (e) {
    muted = false;
  }

  function setVol(el, v) {
    if (!el) return;
    var n = Number(v);
    if (!isFinite(n)) n = 0;
    el.volume = n < 0 ? 0 : (n > 1 ? 1 : n);
  }

  function makeAudio(src, loop) {
    var a = new Audio(src);
    a.preload = "auto";
    a.loop = !!loop;
    setVol(a, loop ? 0 : SE_VOL);
    try { a.load(); } catch (err) {}
    return a;
  }

  Object.keys(SE_SRC).forEach(function (id) {
    se[id] = makeAudio(SE_SRC[id], false);
  });

  function getCtx() {
    if (!ctx) {
      var C = global.AudioContext || global.webkitAudioContext;
      if (C) ctx = new C();
      if (ctx && !master) {
        master = ctx.createGain();
        master.gain.value = 1;
        master.connect(ctx.destination);
      }
    }
    return ctx;
  }

  function prime(el) {
    var v = el.volume;
    setVol(el, 0);
    var p = el.play();
    if (p && p.then) {
      p.then(function () {
        if (el._wanted) return;
        el.pause();
        try { el.currentTime = 0; } catch (err) {}
        setVol(el, v);
      }).catch(function () {
        if (!el._wanted) setVol(el, v);
      });
    } else if (!el._wanted) {
      el.pause();
      setVol(el, v);
    }
  }

  function loadBgm(id) {
    if (buffers[id]) {
      return Promise.resolve(buffers[id]);
    }
    if (loading[id]) return loading[id];
    var c = getCtx();
    if (!c) {
      return Promise.resolve(null);
    }
    loading[id] = fetch(BGM_SRC[id]).then(function (res) {
      if (!res.ok) throw new Error("bgm");
      return res.arrayBuffer();
    }).then(function (ab) {
      return c.decodeAudioData(ab.slice(0));
    }).then(function (buf) {
      buffers[id] = buf;
      return buf;
    }).catch(function () {
      loading[id] = null;
      return null;
    });
    return loading[id];
  }

  function stopNode(src, gain, when) {
    if (!src) return;
    try {
      if (gain && ctx) {
        var t = when || ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(0, t);
      }
      src.stop(when || 0);
    } catch (err) {}
  }

  function startBgm(id, buf, fadeIn) {
    var c = getCtx();
    if (!c || !buf || !master) return;
    var src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    var g = c.createGain();
    var now = c.currentTime;
    if (fadeIn) {
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(BGM_VOL, now + FADE_SEC);
    } else {
      g.gain.setValueAtTime(BGM_VOL, now);
    }
    src.connect(g);
    g.connect(master);
    try { src.start(0); } catch (err) { return; }

    if (currentSrc) {
      prevSrc = currentSrc;
      prevGain = currentGain;
      try {
        prevGain.gain.cancelScheduledValues(now);
        prevGain.gain.setValueAtTime(prevGain.gain.value, now);
        prevGain.gain.linearRampToValueAtTime(0, now + FADE_SEC);
        prevSrc.stop(now + FADE_SEC + 0.05);
      } catch (err) {}
    }
    currentSrc = src;
    currentGain = g;
    currentId = id;
  }

  function playBgm(id, force) {
    pendingId = id;
    if (!unlocked || muted) {
      currentId = id;
      return;
    }
    if (!force && id === currentId && currentSrc) return;
    loadBgm(id).then(function (buf) {
      if (!buf) return;
      if (pendingId !== id || muted || !unlocked) return;
      if (!force && id === currentId && currentSrc) return;
      startBgm(id, buf, !!(currentSrc && currentSrc !== null));
    });
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    var c = getCtx();
    if (c && c.state === "suspended") c.resume().catch(function () {});
    if (c) {
      try {
        var buf = c.createBuffer(1, 1, 22050);
        var src = c.createBufferSource();
        src.buffer = buf;
        src.connect(c.destination);
        src.start(0);
      } catch (err) {}
    }
    Object.keys(se).forEach(function (id) { prime(se[id]); });
    if (!muted && pendingId) playBgm(pendingId, true);
  }

  function setMuteBtn() {
    if (!muteBtn) muteBtn = document.getElementById("btnMute");
    if (!muteBtn) return;
    muteBtn.textContent = muted ? "×" : "♪";
    muteBtn.setAttribute("aria-label", muted ? "音声オフ" : "音声オン");
    muteBtn.title = muted ? "音声オフ（タップでオン）" : "音声オン（タップでオフ）";
  }

  function persistMute() {
    try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (e) {}
  }

  function haltBgm() {
    stopNode(currentSrc, currentGain, ctx ? ctx.currentTime : 0);
    stopNode(prevSrc, prevGain, ctx ? ctx.currentTime : 0);
    currentSrc = null;
    currentGain = null;
    prevSrc = null;
    prevGain = null;
  }

  function updatePlayBgm(mode, state) {
    if (mode === "title") return playBgm("title");
    if (mode === "result") return playBgm("result");
    if (!state) return playBgm("day");
    if (state.hp <= 25) return playBgm("overwork");
    if (state.hour >= 20) return playBgm("night");
    return playBgm("day");
  }

  function playSE(name) {
    if (muted || !unlocked) return;
    var a = se[name];
    if (!a) return;
    a._wanted = true;
    try { a.currentTime = 0; } catch (err) {}
    setVol(a, SE_VOL);
    a.play().catch(function () {});
    a.onended = function () { a._wanted = false; };
  }

  function toggleMute() {
    var wasLocked = !unlocked;
    unlock();
    if (wasLocked && !muted) {
      setMuteBtn();
      return;
    }
    muted = !muted;
    persistMute();
    setMuteBtn();
    if (muted) {
      haltBgm();
      if (master && ctx) {
        master.gain.setValueAtTime(0, ctx.currentTime);
      }
    } else {
      if (master && ctx) {
        master.gain.setValueAtTime(1, ctx.currentTime);
      }
      if (pendingId || currentId) {
        currentId = null;
        playBgm(pendingId || currentId || "title", true);
      }
    }
  }

  function resumeIfNeeded() {
    if (!unlocked || muted) return;
    var c = getCtx();
    if (c && c.state === "suspended") c.resume().catch(function () {});
    if (!currentSrc && (pendingId || currentId)) {
      playBgm(pendingId || currentId, true);
    }
  }

  document.addEventListener("pointerdown", unlock, { once: true });
  document.addEventListener("keydown", unlock, { once: true });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") resumeIfNeeded();
  });
  global.addEventListener("pageshow", resumeIfNeeded);
  global.addEventListener("focus", resumeIfNeeded);

  global.AUD = {
    unlock: unlock,
    toggleMute: toggleMute,
    playBgm: playBgm,
    updatePlayBgm: updatePlayBgm,
    playSE: playSE,
    isMuted: function () { return muted; },
    syncButton: setMuteBtn
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setMuteBtn);
  } else {
    setMuteBtn();
  }
})(window);
