/* 月夜綺譚 ─ 進行制御
   本文は常に三行。DICTIONARY / STORY は別ファイル。 */
(() => {
  'use strict';

  const STORE = {
    words: 'kobun194.words',
    endings: 'kobun194.endings',
    mute: 'kobun194.mute'
  };

  const KANSUJI = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  const state = {
    sceneId: 'start',
    history: [],
    learned: new Set(),
    seenEndings: new Set(),
    typing: false,
    typeTimer: null,
    showModern: false
  };

  /* ── 保存 ───────────────────────────── */
  function load() {
    try {
      const w = JSON.parse(localStorage.getItem(STORE.words) || '[]');
      const e = JSON.parse(localStorage.getItem(STORE.endings) || '[]');
      if (Array.isArray(w)) w.forEach(k => DICTIONARY[k] && state.learned.add(k));
      if (Array.isArray(e)) e.forEach(k => STORY[k] && state.seenEndings.add(k));
    } catch (err) {
      /* 保存データが壊れていても初期状態で続行する */
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE.words, JSON.stringify([...state.learned]));
      localStorage.setItem(STORE.endings, JSON.stringify([...state.seenEndings]));
    } catch (err) {
      /* 容量超過などは無視して進行を止めない */
    }
  }

  function toKansuji(n) {
    if (n <= 10) return KANSUJI[n];
    if (n < 20) return '十' + KANSUJI[n - 10];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return KANSUJI[t] + '十' + (o ? KANSUJI[o] : '');
  }

  /* ── 音（Web Audio のみ・音源ファイルなし） ── */
  const sound = {
    ctx: null,
    master: null,
    bgmTimer: null,
    windNode: null,
    muted: false,

    unlock() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);

      const buf = this.ctx.createBuffer(1, 1, 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.ctx.destination);
      src.start(0);

      this.startWind();
      this.startBgm();
    },

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },

    noiseBuffer(seconds) {
      const len = Math.floor(this.ctx.sampleRate * seconds);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.2;
      }
      return buf;
    },

    startWind() {
      if (!this.ctx || this.windNode) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer(4);
      src.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.055;

      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.035;
      lfo.connect(lfoGain).connect(gain.gain);

      src.connect(filter).connect(gain).connect(this.master);
      src.start();
      lfo.start();
      this.windNode = src;
    },

    tone(freq, dur, type, peak, delay) {
      if (!this.ctx) return;
      const t0 = this.ctx.currentTime + (delay || 0);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    },

    /* 都節音階による間欠BGM */
    startBgm() {
      if (!this.ctx || this.bgmTimer) return;
      const scale = [293.66, 311.13, 392.00, 440.00, 466.16, 587.33];
      const play = () => {
        if (this.muted || document.hidden) return;
        const f = scale[Math.floor(Math.random() * scale.length)];
        this.tone(f, 3.4, 'triangle', 0.045);
        this.tone(f * 2, 2.4, 'sine', 0.014, 0.06);
      };
      play();
      this.bgmTimer = setInterval(play, 3400);
    },

    se(name) {
      if (!this.ctx || this.muted) return;
      this.resume();
      if (name === 'click') {
        this.tone(2100, 0.05, 'square', 0.03);
        this.tone(1400, 0.08, 'triangle', 0.02, 0.01);
      } else if (name === 'page') {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer(0.22);
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2600;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.05, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.22);
        src.connect(bp).connect(g).connect(this.master);
        src.start();
      } else if (name === 'chime') {
        this.tone(1046.5, 1.8, 'sine', 0.07);
        this.tone(1568.0, 1.4, 'sine', 0.04, 0.09);
      } else if (name === 'creepy') {
        this.tone(110, 2.6, 'sawtooth', 0.028);
        this.tone(116.5, 2.6, 'sine', 0.03, 0.02);
      } else if (name === 'wind') {
        this.tone(196, 2.2, 'sine', 0.035);
      }
    },

    setMuted(m) {
      this.muted = m;
      if (this.master) {
        this.master.gain.value = m ? 0 : 0.9;
      }
    }
  };

  /* ── 要素 ───────────────────────────── */
  const el = {
    start: document.getElementById('startScreen'),
    startBtn: document.getElementById('startBtn'),
    app: document.getElementById('app'),
    chapter: document.getElementById('chapterLabel'),
    glyph: document.getElementById('sceneGlyph'),
    step: document.getElementById('stepLabel'),
    lines: [...document.querySelectorAll('.honbun__line')],
    mlines: [...document.querySelectorAll('.hanshi__line')],
    modernBox: document.getElementById('modernBox'),
    modernBtn: document.getElementById('modernBtn'),
    tags: document.getElementById('wordTags'),
    choices: document.getElementById('choices'),
    honbun: document.getElementById('honbun'),
    toast: document.getElementById('toast'),
    audioBtn: document.getElementById('audioBtn'),
    audioLabel: document.getElementById('audioLabel'),
    dictBtn: document.getElementById('dictBtn'),
    dictBadge: document.getElementById('dictBadge'),
    dictModal: document.getElementById('dictModal'),
    dictList: document.getElementById('dictList'),
    dictCount: document.getElementById('dictCount'),
    dictBar: document.getElementById('dictBar'),
    dictClose: document.getElementById('dictClose'),
    endBtn: document.getElementById('endingBtn'),
    endModal: document.getElementById('endModal'),
    endList: document.getElementById('endList'),
    endCount: document.getElementById('endCount'),
    endBar: document.getElementById('endBar'),
    endClose: document.getElementById('endClose'),
    wordModal: document.getElementById('wordModal'),
    wordBody: document.getElementById('wordBody'),
    wordClose: document.getElementById('wordClose')
  };

  function tap() {
    if (navigator.vibrate) navigator.vibrate(12);
    sound.se('click');
  }

  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('is-on');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.toast.classList.remove('is-on'), 2600);
  }

  /* ── 本文の分かち書き（古語の位置を特定） ── */
  function tokenize(line, wordKeys) {
    const forms = [];
    wordKeys.forEach(key => {
      const entry = DICTIONARY[key];
      if (!entry) return;
      (entry.forms || [key]).forEach(f => forms.push({ key, surface: f }));
    });
    forms.sort((a, b) => b.surface.length - a.surface.length);

    const tokens = [];
    let plain = '';
    let i = 0;
    while (i < line.length) {
      const hit = forms.find(f => line.startsWith(f.surface, i));
      if (hit) {
        if (plain) { tokens.push({ text: plain, key: null }); plain = ''; }
        tokens.push({ text: hit.surface, key: hit.key });
        i += hit.surface.length;
      } else {
        plain += line[i];
        i += 1;
      }
    }
    if (plain) tokens.push({ text: plain, key: null });
    return tokens;
  }

  /* ── 三行が必ず一行ずつに収まる字送りを決める ──
     全場面で最も長い行を基準に一つの寸法を選び、場面ごとに大きさが揺れないようにする。 */
  const LONGEST_LINE = Object.values(STORY)
    .flatMap(sc => sc.lines)
    .reduce((a, b) => ([...b].length > [...a].length ? b : a), '');

  let probe = null;

  function fitHonbun() {
    if (!probe) {
      probe = document.createElement('span');
      probe.className = 'probe';
      probe.textContent = LONGEST_LINE;
      document.body.appendChild(probe);
    }
    const avail = el.honbun.clientWidth - 2;
    if (avail <= 0) return;

    let best = 11;
    for (let size = 19; size >= 11; size -= 0.5) {
      probe.style.fontSize = size + 'px';
      /* 一字下げ分を見込んで測る */
      if (probe.offsetWidth + size * 0.5 <= avail) { best = size; break; }
    }
    el.honbun.style.setProperty('--honbun-size', best + 'px');
  }

  /* ── 三行の筆写アニメーション ─────────── */
  function writeLines(scene) {
    clearTimeout(state.typeTimer);
    state.typing = true;

    const plan = [];
    el.lines.forEach((lineEl, idx) => {
      lineEl.textContent = '';
      const raw = scene.lines[idx] || '';
      const tokens = tokenize(raw, scene.words || []);
      const spans = tokens.map(tk => {
        const span = document.createElement('span');
        if (tk.key) {
          span.className = 'kogo';
          span.dataset.key = tk.key;
        }
        lineEl.appendChild(span);
        return { span, text: tk.text, pos: 0 };
      });
      plan.push(spans);
    });

    let li = 0;
    let ti = 0;

    function step() {
      while (li < plan.length) {
        const spans = plan[li];
        if (ti >= spans.length) { li += 1; ti = 0; continue; }
        const cur = spans[ti];
        if (cur.pos >= cur.text.length) { ti += 1; continue; }
        cur.span.textContent += cur.text[cur.pos];
        cur.pos += 1;
        state.typeTimer = setTimeout(step, 34);
        return;
      }
      state.typing = false;
    }

    step();
  }

  function finishWriting(scene) {
    clearTimeout(state.typeTimer);
    state.typing = false;
    el.lines.forEach((lineEl, idx) => {
      lineEl.textContent = '';
      tokenize(scene.lines[idx] || '', scene.words || []).forEach(tk => {
        const span = document.createElement('span');
        span.textContent = tk.text;
        if (tk.key) {
          span.className = 'kogo';
          span.dataset.key = tk.key;
        }
        lineEl.appendChild(span);
      });
    });
  }

  /* ── 場面描画 ───────────────────────── */
  function render(sceneId) {
    const scene = STORY[sceneId];
    if (!scene) return;
    state.sceneId = sceneId;

    el.chapter.textContent = scene.chapter;
    el.glyph.textContent = scene.glyph;
    el.step.textContent = '場面 ' + toKansuji(state.history.length + 1);

    sound.se(scene.sound || 'wind');
    writeLines(scene);

    scene.modern.forEach((text, i) => { el.mlines[i].textContent = text; });
    el.modernBox.classList.toggle('is-hidden', !state.showModern);

    let fresh = 0;
    (scene.words || []).forEach(k => {
      if (DICTIONARY[k] && !state.learned.has(k)) { state.learned.add(k); fresh += 1; }
    });
    if (scene.ending && !state.seenEndings.has(sceneId)) {
      state.seenEndings.add(sceneId);
      toast('結末を一つ書き留めました');
    } else if (fresh > 0) {
      el.dictBadge.classList.remove('is-hidden');
      toast('古語 ' + toKansuji(fresh) + ' 語を習得しました');
    }
    save();

    renderTags(scene);
    renderChoices(scene);
  }

  function renderTags(scene) {
    el.tags.textContent = '';
    const keys = (scene.words || []).filter(k => DICTIONARY[k]);
    if (!keys.length) return;

    const label = document.createElement('span');
    label.className = 'tags__label';
    label.textContent = 'この段の古語';
    el.tags.appendChild(label);

    [...new Set(keys)].forEach(key => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tag';
      btn.textContent = DICTIONARY[key].word;
      btn.addEventListener('click', () => { tap(); showWord(key); });
      el.tags.appendChild(btn);
    });
  }

  function renderChoices(scene) {
    el.choices.textContent = '';
    let list;

    if (scene.ending) {
      list = [];
      if (state.history.length) list.push({ text: '岐れ道へ立ち戻らむ', back: true });
      list.push({ text: 'はじめより読み返さむ', restart: true });
    } else {
      list = scene.choices || [];
    }

    list.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tanzaku' + (scene.ending ? ' tanzaku--ending' : '');

      const num = document.createElement('span');
      num.className = 'tanzaku__num';
      num.textContent = KANSUJI[i + 1];

      const text = document.createElement('span');
      text.className = 'tanzaku__text';
      text.textContent = choice.text;

      btn.append(num, text);
      btn.addEventListener('click', () => {
        tap();
        sound.se('page');
        /* 選択肢の語尾はすべて意志の「む」。初回の選択で語として授ける。 */
        if (!scene.ending && !state.learned.has('む')) {
          state.learned.add('む');
          el.dictBadge.classList.remove('is-hidden');
          toast('「〜む」＝〜しよう（意志）を習得しました');
          save();
        }
        if (choice.back) {
          const prev = state.history.pop();
          render(prev);
        } else if (choice.restart) {
          state.history = [];
          render('start');
        } else {
          state.history.push(state.sceneId);
          render(choice.nextId);
        }
      });

      el.choices.appendChild(btn);
    });
  }

  /* ── 語義の付箋 ─────────────────────── */
  function showWord(key) {
    const item = DICTIONARY[key];
    if (!item) return;
    el.wordBody.textContent = '';

    const head = document.createElement('div');
    const word = document.createElement('span');
    word.className = 'fusen__word';
    word.textContent = item.word;
    const kanji = document.createElement('span');
    kanji.className = 'fusen__kanji';
    kanji.textContent = '【' + item.kanji + '】';
    head.append(word, kanji);

    const type = document.createElement('div');
    type.className = 'fusen__type';
    type.textContent = item.type;

    const rows = [
      ['現代語訳', item.meaning, 'fusen__meaning'],
      ['解説', item.explain, 'fusen__explain'],
      ...(item.examTip ? [['入試の着眼点', item.examTip, 'fusen__explain']] : [])
    ].map(([label, body, cls]) => {
      const row = document.createElement('div');
      row.className = 'fusen__row';
      const l = document.createElement('p');
      l.className = 'fusen__label';
      l.textContent = label;
      const b = document.createElement('p');
      b.className = cls;
      b.textContent = body;
      row.append(l, b);
      return row;
    });

    el.wordBody.append(head, type, ...rows);

    if (item.hint) {
      const hint = document.createElement('div');
      hint.className = 'fusen__hint';
      hint.textContent = '用例　' + item.hint;
      el.wordBody.appendChild(hint);
    }

    el.wordModal.classList.remove('is-hidden');
  }

  /* ── 単語帳 ─────────────────────────── */
  function renderDict() {
    const keys = Object.keys(DICTIONARY);
    el.dictList.textContent = '';
    el.dictCount.textContent = toKansuji(state.learned.size) + ' / ' + toKansuji(keys.length) + ' 語';
    el.dictBar.style.width = (state.learned.size / keys.length * 100) + '%';

    keys.forEach(key => {
      const item = DICTIONARY[key];
      const known = state.learned.has(key);
      const card = document.createElement('div');
      card.className = 'entry' + (known ? '' : ' entry--locked');

      const head = document.createElement('div');
      head.className = 'entry__head';
      const word = document.createElement('span');
      word.className = 'entry__word';
      word.textContent = known ? item.word : '？？？';
      head.appendChild(word);

      if (known) {
        const kanji = document.createElement('span');
        kanji.className = 'entry__kanji';
        kanji.textContent = item.kanji;
        const type = document.createElement('span');
        type.className = 'entry__type';
        type.textContent = item.type;
        head.append(kanji, type);
      }

      const meaning = document.createElement('p');
      meaning.className = 'entry__meaning';
      meaning.textContent = known ? item.meaning : '物語で出会えば開きます';

      card.append(head, meaning);

      if (known) {
        const explain = document.createElement('p');
        explain.className = 'entry__explain';
        explain.textContent = item.explain;
        card.appendChild(explain);
      }

      el.dictList.appendChild(card);
    });
  }

  /* ── 結末巻 ─────────────────────────── */
  function renderEndings() {
    const ids = Object.keys(STORY).filter(id => STORY[id].ending);
    el.endList.textContent = '';
    el.endCount.textContent = toKansuji(state.seenEndings.size) + ' / ' + toKansuji(ids.length) + ' 話';
    el.endBar.style.width = (state.seenEndings.size / ids.length * 100) + '%';

    ids.forEach(id => {
      const scene = STORY[id];
      const seen = state.seenEndings.has(id);
      const card = document.createElement('div');
      card.className = 'entry' + (seen ? '' : ' entry--locked');

      const head = document.createElement('div');
      head.className = 'entry__head';
      const title = document.createElement('span');
      title.className = 'entry__word';
      title.textContent = seen ? scene.chapter.replace('終ノ段　', '') : '未見の結末';
      head.appendChild(title);

      const body = document.createElement('p');
      body.className = 'entry__explain';
      body.textContent = seen ? scene.lines[2] : '別の道を選べば、たどり着けるやもしれず';

      card.append(head, body);
      el.endList.appendChild(card);
    });
  }

  /* ── 操作 ───────────────────────────── */
  function applyMute(muted) {
    sound.setMuted(muted);
    el.audioBtn.setAttribute('aria-pressed', String(!muted));
    el.audioLabel.textContent = muted ? '消' : '鳴';
    try { localStorage.setItem(STORE.mute, muted ? '1' : '0'); } catch (err) { /* 保存できずとも継続 */ }
  }

  function begin() {
    sound.unlock();
    sound.resume();
    el.start.classList.add('is-hidden');
    el.app.classList.remove('is-hidden');
    fitHonbun();
    render('start');
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitHonbun);
    }
  }

  function bind() {
    el.startBtn.addEventListener('click', () => { tap(); begin(); });

    el.audioBtn.addEventListener('click', () => {
      const next = !sound.muted;
      applyMute(next);
      if (!next) { sound.resume(); sound.se('chime'); }
      if (navigator.vibrate) navigator.vibrate(12);
    });

    el.dictBtn.addEventListener('click', () => {
      tap();
      el.dictBadge.classList.add('is-hidden');
      renderDict();
      el.dictModal.classList.remove('is-hidden');
    });

    el.endBtn.addEventListener('click', () => {
      tap();
      renderEndings();
      el.endModal.classList.remove('is-hidden');
    });

    el.modernBtn.addEventListener('click', () => {
      tap();
      state.showModern = !state.showModern;
      el.modernBtn.setAttribute('aria-pressed', String(state.showModern));
      el.modernBox.classList.toggle('is-hidden', !state.showModern);
    });

    el.dictClose.addEventListener('click', () => { tap(); el.dictModal.classList.add('is-hidden'); });
    el.endClose.addEventListener('click', () => { tap(); el.endModal.classList.add('is-hidden'); });
    el.wordClose.addEventListener('click', () => { tap(); el.wordModal.classList.add('is-hidden'); });

    [el.dictModal, el.endModal, el.wordModal].forEach(veil => {
      veil.addEventListener('click', e => {
        if (e.target === veil) veil.classList.add('is-hidden');
      });
    });

    /* 本文タップ：筆写を最後まで送る／古語を開く */
    el.honbun.addEventListener('click', e => {
      const kogo = e.target.closest('.kogo');
      if (kogo && !state.typing) {
        tap();
        showWord(kogo.dataset.key);
        return;
      }
      if (state.typing) {
        finishWriting(STORY[state.sceneId]);
        sound.se('page');
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) sound.resume();
    });
    window.addEventListener('pageshow', () => sound.resume());

    let fitTimer = null;
    const refit = () => {
      clearTimeout(fitTimer);
      fitTimer = setTimeout(fitHonbun, 120);
    };
    window.addEventListener('resize', refit);
    window.addEventListener('orientationchange', refit);
  }

  /* ── iOS：ズーム・スクロール・選択の抑止 ── */
  function guardTouch() {
    document.addEventListener('touchmove', e => {
      if (!e.target.closest || !e.target.closest('.scroll-area, .stage')) e.preventDefault();
    }, { passive: false });

    document.addEventListener('selectstart', e => e.preventDefault());
    document.addEventListener('dragstart', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());

    /* 二度押しでのズームは抑えるが、操作部では click を潰さない
       （touchend の preventDefault は後続の click を取り消すため） */
    let lastEnd = 0;
    document.addEventListener('touchend', e => {
      const now = Date.now();
      const onControl = e.target.closest && e.target.closest('button, .kogo, .scroll-area');
      if (now - lastEnd <= 300 && !onControl) e.preventDefault();
      lastEnd = now;
    }, false);
  }

  /* ── 背景の花びら ───────────────────── */
  function startPetals() {
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    let petals = [];
    let dpr = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function make() {
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 3.4 + 1.4,
        sway: Math.random() * Math.PI * 2,
        vy: Math.random() * 0.42 + 0.14,
        vx: Math.random() * 0.26 - 0.13,
        a: Math.random() * 0.4 + 0.12,
        spin: Math.random() * 0.02 - 0.01,
        rot: Math.random() * Math.PI
      };
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    const count = window.innerWidth < 420 ? 26 : 40;
    for (let i = 0; i < count; i++) petals.push(make());

    function frame() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      petals.forEach(p => {
        p.sway += 0.014;
        p.rot += p.spin;
        p.x += p.vx + Math.sin(p.sway) * 0.4;
        p.y += p.vy;
        if (p.y > window.innerHeight + 12) {
          p.y = -12;
          p.x = Math.random() * window.innerWidth;
        }
        if (p.x < -12) p.x = window.innerWidth + 12;
        if (p.x > window.innerWidth + 12) p.x = -12;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = 'rgba(240, 228, 205, ' + p.a + ')';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.56, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      requestAnimationFrame(frame);
    }
    frame();
  }

  /* ── 起動 ───────────────────────────── */
  load();
  guardTouch();
  bind();
  startPetals();

  let storedMute = false;
  try { storedMute = localStorage.getItem(STORE.mute) === '1'; } catch (err) { /* 既定は音あり */ }
  applyMute(storedMute);
})();
