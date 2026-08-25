"use strict";
(function (g) {
  var MS = 800;
  var hideTimer = 0;
  var BY_ID = {
    mail: "mail", doc: "doc", remote: "doc",
    idea: "idea", task: "task", plan: "task", meet: "meet"
  };
  var TEMPLATES = {
    mail: { html: "[👆] ← 📧 → カタ..カタ", className: "anim-typing" },
    doc:  { html: "🧔 ↓↑ カタカタカタ", className: "anim-typing-heavy" },
    idea: { html: "🧔 ｦｰﾝ\n  ? ? ?", className: "anim-thinking" },
    task: { html: "✓ ✓ ✓\n[▢▢▢]", className: "anim-checking" },
    meet: { html: "🧔 ← ？？？ → 🧔", className: "anim-talking" }
  };

  function duration() {
    try {
      if (g.matchMedia && g.matchMedia("(prefers-reduced-motion: reduce)").matches) return 120;
    } catch (e) {}
    return MS;
  }

  function animKey(c) {
    var key = "", n;
    if (c && c.id && BY_ID[c.id]) key = BY_ID[c.id];
    n = (c && c.name) || "";
    if (!key) {
      if (/メール|返信|通知|返す/.test(n)) key = "mail";
      else if (/資料|PC|再起動|着手|走る|挑む|前倒し|仕事に|形にする/.test(n)) key = "doc";
      else if (/アイデア|メモ|考える/.test(n)) key = "idea";
      else if (/雑務|リスト|整理|チェック|タスク/.test(n)) key = "task";
      else if (/打ち合わせ|説明|話|相談|聞く|共有|会議/.test(n)) key = "meet";
    }
    return TEMPLATES[key] ? key : "";
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function tweenHud(root, from, to, ms) {
    if (!root || !from || !to) return;
    var hpF = root.querySelector(".fill.hp");
    var mpF = root.querySelector(".fill.mp");
    var vals = root.querySelectorAll(".bar .val");
    var workB = root.querySelector(".kpi b");
    var satB = root.querySelector(".kpi.sat b");
    var t0 = Date.now();
    var dur = Math.max(80, ms || MS);
    function apply(p) {
      var e = p * p * (3 - 2 * p);
      if (hpF) {
        hpF.style.transition = "none";
        hpF.style.width = lerp(from.hp, to.hp, e) + "%";
      }
      if (mpF) {
        mpF.style.transition = "none";
        mpF.style.width = lerp(from.mp, to.mp, e) + "%";
      }
      if (vals[0]) vals[0].textContent = String(Math.round(lerp(from.hp, to.hp, e)));
      if (vals[1]) vals[1].textContent = String(Math.round(lerp(from.mp, to.mp, e)));
      if (workB) workB.textContent = String(Math.round(lerp(from.work, to.work, e)));
      if (satB) satB.textContent = String(Math.round(lerp(from.sat, to.sat, e)));
    }
    apply(0);
    (function tick() {
      var p = Math.min(1, (Date.now() - t0) / dur);
      apply(p);
      if (p < 1) g.requestAnimationFrame(tick);
    })();
  }

  function show(root, actionId) {
    var el = root && root.querySelector("#stickAnim");
    var t = TEMPLATES[actionId];
    if (hideTimer) {
      g.clearTimeout(hideTimer);
      hideTimer = 0;
    }
    if (!el) return;
    el.textContent = "";
    if (!t) {
      el.hidden = true;
      return;
    }
    var pre = g.document.createElement("pre");
    pre.className = "stick " + t.className;
    pre.textContent = t.html;
    el.appendChild(pre);
    el.hidden = false;
    hideTimer = g.setTimeout(function () {
      el.hidden = true;
      hideTimer = 0;
    }, duration());
  }

  function play(root, result) {
    if (!result) return;
    show(root, result.animId);
    if (result.from && result.to) tweenHud(root, result.from, result.to, duration());
  }

  g.STICK = {
    duration: duration,
    animKey: animKey,
    play: play
  };
})(window);
