import { ctx, LOGICAL_W, LOGICAL_H } from '../engine/canvas.js';
import { keys } from '../engine/input.js';
import { sfxClick, sfxLevelUp, sfxGameOver } from '../engine/audio.js';
import { party, addExpAp } from '../character/party.js';
import { buildEnemyGroup } from '../data/enemies.js';
import { SPELLS, JOB_SPELLS } from '../data/spells.js';
import { setScene } from './sceneManager.js';
import { createTitleScene } from './titleScene.js';

// ── Layout ──────────────────────────────────────────────────────────────
const PANEL_Y     = 190;
const GROUND_Y    = 160;   // ground line in battle area
const ENEMY_SLOTS = [      // (cx, cy) per slot – staggered, no overlap
  { x: 72,  y: 112 },
  { x: 158, y: 100 },
  { x: 108, y: 145 },
];
const PARTY_X  = 368;
const PARTY_SY = [44, 84, 124, 162];
const ATB_RATE = 0.005;
const EXEC_MS  = 650;

// ── Factory ──────────────────────────────────────────────────────────────
export function createBattleScene(onVictory, tileType = 0) {
  const fighters = party.members.map(m => ({ ...m, atbGauge: 0, defending: false }));
  const enemies  = buildEnemyGroup(tileType);

  let state           = 'INTRO';
  let introTimer      = 700;
  let activeFighter   = -1;
  let cmdCursor       = 0;
  let magicCursor     = 0;
  let targetCursor    = 0;
  let allyTargetCursor= 0;
  let execTimer       = 0;
  let battleLog       = '戦闘開始！';
  let pending         = null;
  let pendingSpell    = null;
  let victorySummary  = null;
  let victoryTimer    = 3000;
  let defeatTimer     = 2500;
  const dmgNums       = [];
  const particles     = [];
  let bgFlash         = 0;
  const enemyFlash    = {};   // uid → remainingMs white-flash
  let shakeX = 0, shakeY = 0, shakeDur = 0;

  const liveEnemies  = () => enemies.filter(e => e.currentHp > 0);
  const liveFighters = () => fighters.filter(f => f.hp > 0);

  function calcDmg(src, tgt, type) {
    const base = type === 'physical'
      ? Math.max(1, src.atk * 2 - tgt.def)
      : Math.max(1, src.mag * 2 - tgt.mdf);
    return Math.max(1, Math.floor(base * (0.85 + Math.random() * 0.30)));
  }

  function calcMagicDmg(src, tgt, spell) {
    const base = Math.max(1, src.mag * 1.8 + spell.power - tgt.mdf);
    const variance = Math.floor(base * (0.85 + Math.random() * 0.30));
    const weak = tgt.weak?.includes(spell.element);
    return { dmg: Math.max(1, weak ? variance * 2 : variance), weak };
  }

  function spawnDmg(x, y, val, color) {
    dmgNums.push({ x, y: y - 10, val, color, life: 1000 });
  }

  function spawnParticles(cx, cy, element) {
    const cfg = {
      fire:    { colors: ['#ff6000','#ff9900','#ffcc00','#ff3300'], count: 18 },
      ice:     { colors: ['#88ddff','#ccf0ff','#ffffff','#5599cc'], count: 18 },
      thunder: { colors: ['#ffff00','#ffee44','#ffffff','#ffaa00'], count: 14 },
      heal:    { colors: ['#44ff88','#aaffcc','#ffffff','#00cc66'], count: 16 },
      victory: { colors: ['#ffd700','#ffee44','#ffffff','#ff9900','#ff44aa'], count: 22 },
    };
    const c = cfg[element] ?? cfg.heal;
    for (let i = 0; i < c.count; i++) {
      const angle = (Math.PI * 2 * i) / c.count + Math.random() * 0.4;
      const speed = element === 'victory'
        ? 0.04 + Math.random() * 0.10
        : 0.06 + Math.random() * 0.08;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (element === 'heal' || element === 'victory' ? 0.10 : 0),
        color: c.colors[i % c.colors.length],
        size: element === 'victory' ? 2.5 + Math.random() * 2.5 : 2 + Math.random() * 2,
        life: element === 'victory' ? 900 + Math.random() * 400 : 500 + Math.random() * 300,
        maxLife: element === 'victory' ? 1300 : 800,
        type: element,
      });
    }
  }

  function getSpellList(fighter) {
    return (JOB_SPELLS[fighter.job] ?? []).map(id => ({ id, ...SPELLS[id] }));
  }

  function applyPending() {
    if (!pending) return;
    const { type, tgt, targets, dmg, heal, element } = pending;

    if (type === 'party') {
      const ei = enemies.indexOf(tgt);
      const sl = ENEMY_SLOTS[Math.min(ei, 2)];
      tgt.currentHp = Math.max(0, tgt.currentHp - dmg);
      enemyFlash[tgt.uid] = 200;
      spawnDmg(sl.x, sl.y - 32, dmg, '#ffee44');

    } else if (type === 'magic_enemy') {
      for (const e of targets) {
        const ei = enemies.indexOf(e);
        const sl = ENEMY_SLOTS[Math.min(ei, 2)];
        e.currentHp = Math.max(0, e.currentHp - dmg);
        enemyFlash[e.uid] = 220;
        spawnDmg(sl.x, sl.y - 32, dmg, '#ee88ff');
        spawnParticles(sl.x, sl.y - 8, element);
      }

    } else if (type === 'magic_ally') {
      for (const f of targets) {
        const pi = fighters.indexOf(f);
        const cx = PARTY_X - 18, cy = PARTY_SY[pi];
        if (heal > 0) {
          f.hp = Math.min(f.maxHp, f.hp + heal);
          const restored = Math.min(heal, f.maxHp - f.hp + heal);
          spawnDmg(cx + Math.random() * 16 - 8, cy - 22, restored, '#44ff88');
          spawnParticles(cx, cy, 'heal');
        }
        if (pending.effect === 'raise' && f.hp <= 0) {
          f.hp = Math.floor(f.maxHp * 0.25);
          spawnDmg(cx, cy - 22, f.hp, '#ffffff');
          spawnParticles(cx, cy, 'heal');
        }
      }

    } else {
      // enemy attacks party
      const pi = fighters.indexOf(tgt);
      const actual = tgt.defending ? Math.ceil(dmg / 2) : dmg;
      tgt.hp = Math.max(0, tgt.hp - actual);
      tgt.defending = false;
      spawnDmg(PARTY_X - 28 + Math.random() * 18, PARTY_SY[pi] - 24, actual, '#ff5050');
      shakeDur = 200; shakeX = 3; shakeY = 2;
    }

    battleLog = pending.msg;
    pending = null;
  }

  function queueEnemyAction(e) {
    const targets = liveFighters();
    if (!targets.length) return;
    const tgt = targets[Math.floor(Math.random() * targets.length)];
    const dmg = calcDmg(e, tgt, 'physical');
    pending   = { type: 'enemy', src: e, tgt, dmg, msg: `${e.name}のこうげき！ ${tgt.name}に${dmg}ダメージ！` };
    e.atbGauge = 0;
    state = 'EXECUTING'; execTimer = EXEC_MS; bgFlash = 150;
  }

  function doFight() {
    const les = liveEnemies();
    if (!les.length) return;
    const tgt = les[targetCursor % les.length];
    const f   = fighters[activeFighter];
    const dmg = calcDmg(f, tgt, 'physical');
    pending   = { type: 'party', src: f, tgt, dmg, msg: `${f.name}のこうげき！ ${tgt.name}に${dmg}ダメージ！` };
    f.atbGauge = 0; activeFighter = -1;
    state = 'EXECUTING'; execTimer = EXEC_MS; bgFlash = 150;
    sfxClick();
  }

  function doMagicOnEnemy() {
    const spell = pendingSpell;
    const f     = fighters[activeFighter];
    const les   = liveEnemies();
    if (!les.length) { pendingSpell = null; endBattle(); return; }
    const targets = spell.scope === 'all' ? [...les] : [les[targetCursor % les.length]];
    const { dmg, weak } = calcMagicDmg(f, targets[0], spell);
    f.mp = Math.max(0, f.mp - spell.mp);
    const weakStr = weak ? '（弱点）' : '';
    pending = {
      type: 'magic_enemy', targets, dmg, element: spell.element,
      msg: `${f.name}は${spell.name}を唱えた！${weakStr} ${targets.map(t=>t.name).join('・')}に${dmg}ダメージ！`,
    };
    f.atbGauge = 0; activeFighter = -1; pendingSpell = null;
    state = 'EXECUTING'; execTimer = EXEC_MS + 200; bgFlash = 180;
    sfxClick();
  }

  function doMagicOnAlly() {
    const spell = pendingSpell;
    const f     = fighters[activeFighter];
    const lfs   = liveFighters();
    const targets = spell.scope === 'all' ? [...fighters] : [fighters[allyTargetCursor % fighters.length]];
    const heal  = spell.power > 0 ? Math.floor(spell.power + f.mag * 0.8) : 0;
    f.mp = Math.max(0, f.mp - spell.mp);
    pending = {
      type: 'magic_ally', targets, heal, effect: spell.effect,
      msg: `${f.name}は${spell.name}を唱えた！ ${targets.map(t=>t.name).join('・')}を回復！`,
    };
    f.atbGauge = 0; activeFighter = -1; pendingSpell = null;
    state = 'EXECUTING'; execTimer = EXEC_MS + 200;
    sfxClick();
  }

  function doCommand(idx) {
    const f = fighters[activeFighter];
    if (idx === 0) {
      pendingSpell = null; targetCursor = 0; state = 'CMD_TARGET';
    } else if (idx === 1) {
      const spells = getSpellList(f);
      if (!spells.length) { battleLog = `${f.name}は魔法を知らない！`; sfxClick(); return; }
      magicCursor = 0; state = 'CMD_MAGIC';
    } else if (idx === 2) {
      const p = party.items.find(i => i.id === 'potion' && i.count > 0);
      if (p) {
        p.count--; f.hp = Math.min(f.maxHp, f.hp + 50);
        spawnDmg(PARTY_X - 20, PARTY_SY[activeFighter] - 22, 50, '#80ff80');
        battleLog = `${f.name}がポーションを使った！ HP+50`;
      } else { battleLog = 'アイテムがない！'; }
      f.atbGauge = 0; activeFighter = -1; state = 'RUNNING';
    } else if (idx === 3) {
      f.defending = true;
      battleLog = `${f.name}はぼうぎょした！`;
      f.atbGauge = 0; activeFighter = -1; state = 'RUNNING';
    }
    sfxClick();
  }

  function endBattle() {
    if (liveEnemies().length === 0) {
      const totExp = enemies.reduce((s, e) => s + e.exp, 0);
      const totAp  = enemies.reduce((s, e) => s + e.ap,  0);
      const totGld = enemies.reduce((s, e) => s + e.gold, 0);
      party.gold += totGld;
      const lv = addExpAp(totExp, totAp);
      victorySummary = { exp: totExp, ap: totAp, gold: totGld, levelUp: lv };
      fighters.forEach((f, i) => { party.members[i].hp = Math.max(0, f.hp); });
      state = 'VICTORY'; victoryTimer = 3000; sfxLevelUp();
      // 勝利パーティクルを全生存メンバーから発射
      fighters.forEach((f, i) => {
        if (f.hp > 0) spawnParticles(PARTY_X, PARTY_SY[i] - 10, 'victory');
      });
    } else {
      fighters.forEach((f, i) => { party.members[i].hp = 0; });
      state = 'DEFEAT'; defeatTimer = 2500; sfxGameOver();
    }
  }

  function expose() {
    window.__ffclone.battle = {
      fighters, enemies,
      state:       () => state,
      fillAtb:     (i) => { if (fighters[i]) fighters[i].atbGauge = 100; },
      setEnemyHp:  (i, hp) => { if (enemies[i]) enemies[i].currentHp = hp; },
      killEnemies: () => enemies.forEach(e => { e.currentHp = 0; }),
      killParty:   () => fighters.forEach(f => { f.hp = 0; }),
    };
  }

  return {
    init() { expose(); battleLog = '戦闘開始！'; },

    update(dt) {
      for (let i = dmgNums.length - 1; i >= 0; i--) {
        dmgNums[i].life -= dt; dmgNums[i].y -= dt * 0.03;
        if (dmgNums[i].life <= 0) dmgNums.splice(i, 1);
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }
      if (bgFlash > 0) bgFlash -= dt;
      for (const uid of Object.keys(enemyFlash)) {
        enemyFlash[uid] -= dt;
        if (enemyFlash[uid] <= 0) delete enemyFlash[uid];
      }
      if (shakeDur > 0) {
        shakeDur -= dt;
        const t = shakeDur / 200;
        shakeX = (Math.random() * 2 - 1) * 4 * t;
        shakeY = (Math.random() * 2 - 1) * 2 * t;
      } else { shakeX = 0; shakeY = 0; }

      if (state === 'INTRO') {
        introTimer -= dt;
        if (introTimer <= 0) state = 'RUNNING';

      } else if (state === 'RUNNING') {
        for (const f of fighters) {
          if (f.hp > 0 && f.atbGauge < 100)
            f.atbGauge = Math.min(100, f.atbGauge + f.spd * ATB_RATE * dt);
        }
        for (const e of enemies) {
          if (e.currentHp > 0 && e.atbGauge < 100)
            e.atbGauge = Math.min(100, e.atbGauge + e.spd * ATB_RATE * dt);
        }
        // Enemy first
        for (const e of enemies) {
          if (e.currentHp > 0 && e.atbGauge >= 100) { queueEnemyAction(e); return; }
        }
        // Party ready
        for (let i = 0; i < fighters.length; i++) {
          if (fighters[i].hp > 0 && fighters[i].atbGauge >= 100) {
            activeFighter = i; cmdCursor = 0; state = 'CMD_MENU'; return;
          }
        }

      } else if (state === 'CMD_MENU') {
        if (keys.upP)   { cmdCursor = (cmdCursor + 3) % 4; sfxClick(); }
        if (keys.downP) { cmdCursor = (cmdCursor + 1) % 4; sfxClick(); }
        if (keys.aP)    doCommand(cmdCursor);
        if (keys.bP)    { fighters[activeFighter].atbGauge = 0; activeFighter = -1; state = 'RUNNING'; sfxClick(); }

      } else if (state === 'CMD_MAGIC') {
        const f = fighters[activeFighter];
        const spells = getSpellList(f);
        if (keys.upP)   { magicCursor = (magicCursor + spells.length - 1) % spells.length; sfxClick(); }
        if (keys.downP) { magicCursor = (magicCursor + 1) % spells.length; sfxClick(); }
        if (keys.aP) {
          const sp = spells[magicCursor];
          if (f.mp < sp.mp) { battleLog = 'MPが足りない！'; sfxClick(); }
          else {
            pendingSpell = sp;
            if (sp.scope === 'all' && sp.target === 'enemy') { doMagicOnEnemy(); }
            else if (sp.scope === 'all' && sp.target === 'ally') { doMagicOnAlly(); }
            else if (sp.target === 'enemy') { targetCursor = 0; state = 'CMD_TARGET'; sfxClick(); }
            else { allyTargetCursor = 0; state = 'CMD_ALLY_TARGET'; sfxClick(); }
          }
        }
        if (keys.bP) { state = 'CMD_MENU'; sfxClick(); }

      } else if (state === 'CMD_TARGET') {
        const les = liveEnemies();
        if (!les.length) { endBattle(); return; }
        if (keys.upP)   { targetCursor = (targetCursor + les.length - 1) % les.length; sfxClick(); }
        if (keys.downP) { targetCursor = (targetCursor + 1) % les.length; sfxClick(); }
        if (keys.aP)    { pendingSpell ? doMagicOnEnemy() : doFight(); }
        if (keys.bP)    { state = pendingSpell ? 'CMD_MAGIC' : 'CMD_MENU'; pendingSpell = null; sfxClick(); }

      } else if (state === 'CMD_ALLY_TARGET') {
        if (keys.upP)   { allyTargetCursor = (allyTargetCursor + fighters.length - 1) % fighters.length; sfxClick(); }
        if (keys.downP) { allyTargetCursor = (allyTargetCursor + 1) % fighters.length; sfxClick(); }
        if (keys.aP)    doMagicOnAlly();
        if (keys.bP)    { state = 'CMD_MAGIC'; pendingSpell = null; sfxClick(); }

      } else if (state === 'EXECUTING') {
        execTimer -= dt;
        if (execTimer <= EXEC_MS / 2 && pending) {
          applyPending();
          // 全滅 or 全滅した瞬間に即 endBattle
          if (liveEnemies().length === 0 || liveFighters().length === 0) {
            endBattle(); return;
          }
        }
        if (execTimer <= 0) endBattle() || (state = 'RUNNING');

      } else if (state === 'VICTORY') {
        victoryTimer -= dt;
        if (victoryTimer <= 0 || keys.aP) onVictory?.();

      } else if (state === 'DEFEAT') {
        defeatTimer -= dt;
        if (defeatTimer <= 0 || keys.aP) {
          setScene(createTitleScene(() => {
            import('./fieldScene.js').then(m => setScene(m.createFieldScene()));
          }));
        }
      }
    },

    draw() {
      ctx.save();
      ctx.translate(Math.round(shakeX), Math.round(shakeY));
      _drawBg(bgFlash);
      _drawEnemies(enemies, targetCursor, state, liveEnemies(), enemyFlash);
      _drawParty(fighters, activeFighter, state, allyTargetCursor);
      _drawParticles(particles);
      _drawDmgNums(dmgNums);
      ctx.restore();
      _drawPanel(state, fighters, activeFighter, cmdCursor, magicCursor, targetCursor, allyTargetCursor, battleLog, liveEnemies(), victorySummary);
    },

    destroy() { window.__ffclone.battle = null; },
  };
}

// ── Background ─────────────────────────────────────────────────────────────

function _drawBg(flashVal) {
  const f = Math.max(0, flashVal) / 180;

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0,   `rgb(${fi(4,f,70)},${fi(2,f,8)},${fi(20,f,50)})`);
  sky.addColorStop(0.6, `rgb(${fi(14,f,50)},${fi(6,f,12)},${fi(44,f,36)})`);
  sky.addColorStop(1,   `rgb(${fi(22,f,40)},${fi(10,f,10)},${fi(58,f,22)})`);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, LOGICAL_W, GROUND_Y);

  // Static stars (left battle zone only)
  ctx.fillStyle = `rgba(255,255,255,${0.55 - f * 0.3})`;
  [[18,10],[52,6],[84,16],[122,4],[148,13],[185,8],[36,28],[106,25],[160,20],[74,36],[200,14],[30,42]].forEach(([sx,sy]) => {
    ctx.beginPath(); ctx.arc(sx, sy, 0.9, 0, Math.PI*2); ctx.fill();
  });

  // Ground plane with perspective
  const gnd = ctx.createLinearGradient(0, GROUND_Y, 0, PANEL_Y - 5);
  gnd.addColorStop(0, `rgb(${fi(28,f,40)},${fi(12,f,10)},${fi(60,f,20)})`);
  gnd.addColorStop(1, `rgb(${fi(10,f,20)},${fi(4,f,6)}, ${fi(28,f,8)})`);
  ctx.fillStyle = gnd; ctx.fillRect(0, GROUND_Y, LOGICAL_W, PANEL_Y - GROUND_Y);

  // Glowing ground line
  const gLine = ctx.createLinearGradient(0, 0, LOGICAL_W, 0);
  gLine.addColorStop(0,   'rgba(80,40,180,0)');
  gLine.addColorStop(0.3, `rgba(${fi(120,f,80)},${fi(60,f,40)},${fi(200,f,40)},0.85)`);
  gLine.addColorStop(0.7, `rgba(${fi(120,f,80)},${fi(60,f,40)},${fi(200,f,40)},0.85)`);
  gLine.addColorStop(1,   'rgba(80,40,180,0)');
  ctx.strokeStyle = gLine; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(LOGICAL_W, GROUND_Y); ctx.stroke();

  // Panel-to-battle transition strip
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, PANEL_Y - 16, LOGICAL_W, 16);
}
function fi(base, f, boost) { return Math.floor(base + f * boost); }

// ── Enemies ───────────────────────────────────────────────────────────────

function _drawEnemies(enemies, targetCursor, state, liveEnemies, enemyFlash) {
  // Clip: sprites must not overflow into the panel
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, LOGICAL_W, PANEL_Y - 4); ctx.clip();

  enemies.forEach((e, i) => {
    if (i >= 3 || e.currentHp <= 0) return;
    const { x: cx, y: cy } = ENEMY_SLOTS[i];
    const flash = (enemyFlash[e.uid] ?? 0) > 0;

    // Draw sprite (normal)
    _drawEnemySprite(e.id, cx, cy);

    // White flash overlay: draw again with 'lighter' blend at low alpha
    if (flash) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(0.8, (enemyFlash[e.uid] ?? 0) / 200);
      ctx.filter = 'brightness(4) saturate(0)';
      _drawEnemySprite(e.id, cx, cy);
      ctx.filter = 'none';
      ctx.restore();
    }

    // HP bar
    const bw = 52, bh = 5;
    const bx = cx - bw / 2, by = cy - 46;
    const r = e.currentHp / e.hp;
    ctx.fillStyle = '#111'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    const hpGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
    hpGrad.addColorStop(0,   r > 0.5 ? '#18e818' : r > 0.25 ? '#e8b800' : '#e82020');
    hpGrad.addColorStop(1,   r > 0.5 ? '#50ff50' : r > 0.25 ? '#ffd040' : '#ff5050');
    ctx.fillStyle = hpGrad; ctx.fillRect(bx, by, Math.round(bw * r), bh);
    ctx.strokeStyle = '#666'; ctx.lineWidth = 0.5; ctx.strokeRect(bx, by, bw, bh);

    // Name
    _outlineText(e.name, cx, by - 3, '#ddd', '#000', '8px monospace', 'center');

    // Target cursor
    if (state === 'CMD_TARGET' && liveEnemies.indexOf(e) === targetCursor) {
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 120);
      ctx.fillStyle = `rgba(255,255,50,${pulse})`;
      ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
      ctx.fillText('▼', cx, cy - 54);
    }
  });

  ctx.restore();
}

// ── Party ─────────────────────────────────────────────────────────────────

function _drawParty(fighters, activeFighter, state, allyTargetCursor) {
  const isVictory = state === 'VICTORY';
  fighters.forEach((f, i) => {
    if (i >= 4) return;
    ctx.globalAlpha = f.hp <= 0 ? 0.15 : 1;
    const active = activeFighter === i && (state === 'CMD_MENU' || state === 'CMD_TARGET' || state === 'CMD_MAGIC' || state === 'CMD_ALLY_TARGET');
    const bounce = (isVictory && f.hp > 0) ? Math.sin(Date.now() / 160 + i * 0.9) * 6 : 0;
    _drawPartySprite(f.job, PARTY_X, PARTY_SY[i] + bounce, active, isVictory && f.hp > 0);
    ctx.globalAlpha = 1;
    if (state === 'CMD_ALLY_TARGET' && i === allyTargetCursor) {
      ctx.fillStyle = '#44ffaa'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
      ctx.fillText('◀', PARTY_X + 28, PARTY_SY[i] + 4);
    }
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function _outlineText(text, x, y, fill, stroke, font, align = 'left') {
  ctx.font = font; ctx.textAlign = align;
  ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
}

// ── Damage numbers ─────────────────────────────────────────────────────────

function _drawDmgNums(dmgNums) {
  for (const d of dmgNums) {
    const alpha = Math.min(1, d.life / 280);
    ctx.globalAlpha = alpha;
    const sz = d.color === '#ffee44' ? 17 : 15;
    _outlineText(String(d.val), d.x, d.y, d.color, 'rgba(0,0,0,0.8)', `bold ${sz}px monospace`, 'center');
  }
  ctx.globalAlpha = 1;
}

// ── Particles ──────────────────────────────────────────────────────────────

function _drawParticles(particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    if (p.type === 'thunder') {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 2);
    } else {
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// ── HUD panel ─────────────────────────────────────────────────────────────

const DIV_X = 208;

function _panelBox(x, y, w, h, titleColor) {
  // Dark gradient background
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, '#0a0720'); bg.addColorStop(1, '#050412');
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  // Gold border
  ctx.strokeStyle = '#705820'; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  // Inner highlight line
  ctx.strokeStyle = '#c89838'; ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
}

function _bar(x, y, w, h, ratio, c0, c1, trackCol = '#0a0a16') {
  ctx.fillStyle = trackCol; ctx.fillRect(x, y, w, h);
  if (ratio > 0) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, c1); g.addColorStop(1, c0);
    ctx.fillStyle = g; ctx.fillRect(x, y, Math.round(w * ratio), h);
  }
  ctx.strokeStyle = '#2a2a44'; ctx.lineWidth = 0.5; ctx.strokeRect(x, y, w, h);
}

function _drawPanel(state, fighters, activeFighter, cmdCursor, magicCursor, targetCursor, allyTargetCursor, battleLog, liveEnemies, victorySummary) {
  // ── Panel background ──
  const panelBg = ctx.createLinearGradient(0, PANEL_Y, 0, LOGICAL_H);
  panelBg.addColorStop(0, '#0c0820'); panelBg.addColorStop(1, '#060410');
  ctx.fillStyle = panelBg; ctx.fillRect(0, PANEL_Y, LOGICAL_W, LOGICAL_H - PANEL_Y);

  // Gold top border
  const topBorder = ctx.createLinearGradient(0, 0, LOGICAL_W, 0);
  topBorder.addColorStop(0,   'rgba(80,50,10,0)');
  topBorder.addColorStop(0.2, '#c89838');
  topBorder.addColorStop(0.5, '#f0c848');
  topBorder.addColorStop(0.8, '#c89838');
  topBorder.addColorStop(1,   'rgba(80,50,10,0)');
  ctx.strokeStyle = topBorder; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, PANEL_Y); ctx.lineTo(LOGICAL_W, PANEL_Y); ctx.stroke();

  // Gold vertical divider
  ctx.strokeStyle = '#705820'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(DIV_X, PANEL_Y + 2); ctx.lineTo(DIV_X, LOGICAL_H - 2); ctx.stroke();
  ctx.strokeStyle = '#c89838'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(DIV_X + 1.5, PANEL_Y + 4); ctx.lineTo(DIV_X + 1.5, LOGICAL_H - 4); ctx.stroke();

  // ── Right: Party status ──
  const RX = DIV_X + 5;
  fighters.forEach((f, i) => {
    const ry  = PANEL_Y + 3 + i * 19;
    const act = activeFighter === i && ['CMD_MENU','CMD_TARGET','CMD_MAGIC','CMD_ALLY_TARGET'].includes(state);
    const dead = f.hp <= 0;

    // Active highlight
    if (act) {
      ctx.fillStyle = 'rgba(60,40,140,0.5)';
      ctx.fillRect(DIV_X + 1, ry, LOGICAL_W - DIV_X - 1, 18);
      ctx.strokeStyle = '#6050c0'; ctx.lineWidth = 0.5;
      ctx.strokeRect(DIV_X + 2, ry, LOGICAL_W - DIV_X - 3, 17);
    }

    // Name
    const nameCol = dead ? '#444' : act ? '#ffe060' : '#d0c8e8';
    _outlineText(f.name, RX + 2, ry + 12, nameCol, '#000', '9px monospace', 'left');

    // HP bar
    const hr = Math.max(0, f.hp / f.maxHp);
    const bx = RX + 44, bw = 62, bhy = ry + 5;
    _bar(bx, bhy, bw, 5, hr,
      hr > 0.5 ? '#1a9a1a' : hr > 0.25 ? '#b88800' : '#a81818',
      hr > 0.5 ? '#5aff5a' : hr > 0.25 ? '#ffdd44' : '#ff5050');
    // HP glow when low
    if (hr <= 0.25 && hr > 0 && Math.floor(Date.now() / 400) % 2) {
      ctx.strokeStyle = 'rgba(255,80,80,0.6)'; ctx.lineWidth = 1;
      ctx.strokeRect(bx - 1, bhy - 1, bw + 2, 7);
    }

    // MP bar
    const mr = Math.max(0, f.mp / (f.maxMp || 1));
    _bar(bx, bhy + 6, bw, 3, mr, '#1840b0', '#5090ff');

    // HP / MP numbers
    ctx.fillStyle = dead ? '#444' : '#a0a0c0'; ctx.font = '7px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`${f.hp}`, bx + bw - 1, bhy + 4);
    ctx.fillStyle = '#4070b8'; ctx.fillText(`${f.mp}`, bx + bw - 1, bhy + 12);

    // ATB bar
    const ab = f.atbGauge / 100;
    const ax = bx + bw + 5, aw = 34;
    _bar(ax, bhy, aw, 10, ab,
      ab >= 1 ? '#b88800' : '#28289a',
      ab >= 1 ? '#ffd700' : '#7070ee');
    if (ab >= 1) {
      ctx.strokeStyle = 'rgba(255,215,0,0.7)'; ctx.lineWidth = 1;
      ctx.strokeRect(ax - 1, bhy - 1, aw + 2, 12);
    }
    ctx.fillStyle = '#6060a0'; ctx.font = '6px monospace'; ctx.textAlign = 'center';
    ctx.fillText('ATB', ax + aw / 2, bhy + 8);
  });

  // ── Left: contextual area ──
  const LW = DIV_X - 4;
  const BOX_X = 4, BOX_Y = PANEL_Y + 2, BOX_W = LW - 4, BOX_H = LOGICAL_H - PANEL_Y - 4;
  // Items layout helpers (title=14px h, separator=3px, items at 13px pitch)
  const ITEM_Y0 = PANEL_Y + 30;  // baseline of first item  (box top=192, title≈205, sep≈209, item0≈222→adjusted)
  const ITEM_P  = 13;             // pitch between items

  // Clip the left panel so no text ever overflows the gold border
  ctx.save();
  ctx.beginPath(); ctx.rect(BOX_X + 3, BOX_Y + 3, BOX_W - 6, BOX_H - 6); ctx.clip();

  if (state === 'CMD_MENU') {
    _panelBox(BOX_X, BOX_Y, BOX_W, BOX_H);
    _outlineText('コマンド', 14, PANEL_Y + 14, '#d4af37', '#000', 'bold 9px monospace');
    ctx.strokeStyle = '#503800'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(10, PANEL_Y + 17); ctx.lineTo(LW - 6, PANEL_Y + 17); ctx.stroke();
    const cmds = ['たたかう', 'まほう', 'アイテム', 'ぼうぎょ'];
    cmds.forEach((c, i) => {
      const sel = cmdCursor === i;
      if (sel) {
        ctx.fillStyle = 'rgba(180,150,0,0.22)';
        ctx.fillRect(10, ITEM_Y0 - 10 + i * ITEM_P, LW - 16, 12);
      }
      _outlineText((sel ? '▶ ' : '  ') + c, 14, ITEM_Y0 + i * ITEM_P,
        sel ? '#ffe040' : '#c0b8d8', '#000', '9px monospace');
    });

  } else if (state === 'CMD_MAGIC') {
    const f = fighters[activeFighter];
    const spells = (JOB_SPELLS[f?.job] ?? []).map(id => ({ id, ...SPELLS[id] }));
    _panelBox(BOX_X, BOX_Y, BOX_W, BOX_H);
    _outlineText('まほう', 14, PANEL_Y + 14, '#cc88ff', '#000', 'bold 9px monospace');
    ctx.strokeStyle = '#503860'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(10, PANEL_Y + 17); ctx.lineTo(LW - 6, PANEL_Y + 17); ctx.stroke();
    const visMax = 4, off = Math.max(0, magicCursor - visMax + 1);
    spells.slice(off, off + visMax).forEach((sp, vi) => {
      const gi = vi + off;
      const canCast = f.mp >= sp.mp;
      const sel = gi === magicCursor;
      if (sel) { ctx.fillStyle = 'rgba(120,60,180,0.25)'; ctx.fillRect(10, ITEM_Y0 - 10 + vi * ITEM_P, LW - 16, 12); }
      _outlineText((sel ? '▶ ' : '  ') + sp.name, 14, ITEM_Y0 + vi * ITEM_P,
        !canCast ? '#555' : sel ? '#ffe040' : '#c0b8d8', '#000', '9px monospace');
      ctx.font = '7px monospace'; ctx.textAlign = 'right';
      ctx.fillStyle = !canCast ? '#444' : '#6688aa';
      ctx.fillText(`MP${sp.mp}`, LW - 6, ITEM_Y0 + vi * ITEM_P);
    });
    _outlineText('Bキー: 戻る', 14, LOGICAL_H - 6, '#606080', '#000', '7px monospace');

  } else if (state === 'CMD_TARGET') {
    _panelBox(BOX_X, BOX_Y, BOX_W, BOX_H);
    _outlineText('目標を選べ', 14, PANEL_Y + 14, '#88ccff', '#000', 'bold 9px monospace');
    ctx.strokeStyle = '#203050'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(10, PANEL_Y + 17); ctx.lineTo(LW - 6, PANEL_Y + 17); ctx.stroke();
    liveEnemies.forEach((e, i) => {
      const sel = i === targetCursor;
      if (sel) { ctx.fillStyle = 'rgba(40,80,160,0.25)'; ctx.fillRect(10, ITEM_Y0 - 10 + i * ITEM_P, LW - 16, 12); }
      _outlineText((sel ? '▶ ' : '  ') + e.name, 14, ITEM_Y0 + i * ITEM_P,
        sel ? '#ffe040' : '#c0b8d8', '#000', '9px monospace');
    });
    _outlineText('Bキー: 戻る', 14, LOGICAL_H - 6, '#606080', '#000', '7px monospace');

  } else if (state === 'CMD_ALLY_TARGET') {
    _panelBox(BOX_X, BOX_Y, BOX_W, BOX_H);
    _outlineText('対象を選べ', 14, PANEL_Y + 14, '#44ffaa', '#000', 'bold 9px monospace');
    ctx.strokeStyle = '#103830'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(10, PANEL_Y + 17); ctx.lineTo(LW - 6, PANEL_Y + 17); ctx.stroke();
    fighters.forEach((f, i) => {
      const sel = i === allyTargetCursor;
      if (sel) { ctx.fillStyle = 'rgba(20,100,70,0.25)'; ctx.fillRect(10, ITEM_Y0 - 10 + i * ITEM_P, LW - 16, 12); }
      _outlineText((sel ? '▶ ' : '  ') + f.name, 14, ITEM_Y0 + i * ITEM_P,
        f.hp <= 0 ? '#444' : sel ? '#ffe040' : '#c0b8d8', '#000', '9px monospace');
    });
    _outlineText('Bキー: 戻る', 14, LOGICAL_H - 6, '#606080', '#000', '7px monospace');

  } else if (state === 'VICTORY') {
    _panelBox(4, PANEL_Y + 2, LW - 4, LOGICAL_H - PANEL_Y - 4);
    const pulse = 0.85 + 0.15 * Math.sin(Date.now() / 200);
    ctx.globalAlpha = pulse;
    _outlineText('★ 勝利！ ★', LW / 2, PANEL_Y + 20, '#ffd700', '#7a4000', 'bold 12px monospace', 'center');
    ctx.globalAlpha = 1;
    if (victorySummary) {
      _outlineText(`EXP +${victorySummary.exp}`, 14, PANEL_Y + 36, '#88ff88', '#003300', '9px monospace');
      _outlineText(`AP  +${victorySummary.ap}`,  14, PANEL_Y + 48, '#88ccff', '#003366', '9px monospace');
      _outlineText(`Gold+${victorySummary.gold}`, 14, PANEL_Y + 60, '#ffdd44', '#554400', '9px monospace');
      if (victorySummary.levelUp) {
        const lp = 0.6 + 0.4 * Math.sin(Date.now() / 150);
        ctx.globalAlpha = lp;
        _outlineText('レベルアップ！', LW / 2, PANEL_Y + 74, '#ffe040', '#7a4000', 'bold 9px monospace', 'center');
        ctx.globalAlpha = 1;
      }
    }
    if (Math.floor(Date.now() / 600) % 2) {
      _outlineText('Aキー: つづける', LW / 2, LOGICAL_H - 4, '#808080', '#000', '7px monospace', 'center');
    }

  } else if (state === 'DEFEAT') {
    ctx.fillStyle = 'rgba(60,0,0,0.6)'; ctx.fillRect(4, PANEL_Y + 2, LW - 4, LOGICAL_H - PANEL_Y - 4);
    ctx.strokeStyle = '#801010'; ctx.lineWidth = 1; ctx.strokeRect(4, PANEL_Y + 2, LW - 4, LOGICAL_H - PANEL_Y - 4);
    const dp = 0.7 + 0.3 * Math.sin(Date.now() / 250);
    ctx.globalAlpha = dp;
    _outlineText('全滅…', LW / 2, PANEL_Y + 30, '#ff4444', '#400000', 'bold 14px monospace', 'center');
    ctx.globalAlpha = 1;
    if (Math.floor(Date.now() / 600) % 2) {
      _outlineText('Aキー: タイトルへ', LW / 2, LOGICAL_H - 4, '#808080', '#000', '7px monospace', 'center');
    }

  } else {
    // Battle log window
    _panelBox(BOX_X, BOX_Y, BOX_W, BOX_H);
    ctx.fillStyle = '#a090c0'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
    const words = battleLog.split('');
    let line = '', ly = PANEL_Y + 16;
    for (const ch of words) {
      if ((line + ch).length > 24) { ctx.fillText(line, 10, ly); line = ch; ly += 13; }
      else line += ch;
    }
    if (line) ctx.fillText(line, 10, ly);
  }

  ctx.restore(); // end left-panel clip
}

// ── Enemy sprites ──────────────────────────────────────────────────────────

function _drawEnemySprite(id, cx, cy) {
  ctx.save(); ctx.translate(cx, cy);
  switch (id) {
    case 'slime': {
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.beginPath(); ctx.ellipse(0, 20, 18, 5, 0, 0, Math.PI*2); ctx.fill();
      // body base
      ctx.fillStyle = '#1e7a1e';
      ctx.beginPath(); ctx.ellipse(0, 4, 22, 18, 0, 0, Math.PI*2); ctx.fill();
      // body highlight
      ctx.fillStyle = '#3aba3a';
      ctx.beginPath(); ctx.ellipse(-2, 0, 17, 13, -0.15, 0, Math.PI*2); ctx.fill();
      // gloss
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.ellipse(-7, -8, 8, 5, -0.5, 0, Math.PI*2); ctx.fill();
      // left eye white
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-7, -3, 4, 0, Math.PI*2); ctx.fill();
      // right eye white
      ctx.beginPath(); ctx.arc(7, -3, 4, 0, Math.PI*2); ctx.fill();
      // left pupil
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(-7, -2, 2.5, 0, Math.PI*2); ctx.fill();
      // right pupil
      ctx.beginPath(); ctx.arc(7, -2, 2.5, 0, Math.PI*2); ctx.fill();
      // eye highlights
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-8, -3, 1, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, -3, 1, 0, Math.PI*2); ctx.fill();
      // smile
      ctx.strokeStyle = '#1a5a1a';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 2, 5, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
      break;
    }
    case 'goblin': {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.ellipse(0, 24, 14, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#3a6a20';
      ctx.fillRect(-10, -4, 20, 18);
      ctx.fillStyle = '#3a6a20';
      ctx.fillRect(-14, -2, 5, 12); ctx.fillRect(9, -2, 5, 12);
      ctx.fillStyle = '#7a5030';
      ctx.fillRect(14, -8, 5, 20); ctx.fillRect(13, -13, 8, 7);
      ctx.fillStyle = '#4a4030';
      ctx.fillRect(-9, 13, 6, 11); ctx.fillRect(3, 13, 6, 11);
      ctx.fillStyle = '#5a8a30';
      ctx.beginPath(); ctx.ellipse(0, -13, 11, 10, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-11,-14); ctx.lineTo(-17,-23); ctx.lineTo(-8,-16); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(11,-14);  ctx.lineTo(17,-23);  ctx.lineTo(8,-16);  ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff4400';
      ctx.beginPath(); ctx.ellipse(-4,-13, 3,3, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(4,-13,  3,3, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(-4,-13, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(4,-13,  1.5, 0, Math.PI*2); ctx.fill();
      break;
    }
    case 'orc': {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.ellipse(0, 30, 18, 6, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#3a3028';
      ctx.fillRect(-11,14,8,16); ctx.fillRect(4,14,8,16);
      ctx.fillStyle = '#6a5040'; ctx.fillRect(-14,-6,28,22);
      ctx.fillStyle = '#8a7050'; ctx.fillRect(-12,-5,11,20);
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(-18,-6,6,9); ctx.fillRect(12,-6,6,9);
      ctx.fillStyle = '#6a5040';
      ctx.fillRect(-19,0,6,15); ctx.fillRect(13,0,6,15);
      ctx.fillStyle = '#aaa'; ctx.fillRect(18,-20,6,26);
      ctx.beginPath(); ctx.moveTo(18,-20); ctx.lineTo(30,-13); ctx.lineTo(24,-2); ctx.lineTo(18,-2); ctx.closePath();
      ctx.fillStyle = '#ccc'; ctx.fill();
      ctx.fillStyle = '#7a6050';
      ctx.beginPath(); ctx.ellipse(0,-15, 13,12, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#4a3a28'; ctx.fillRect(-13,-22,26,9);
      ctx.beginPath(); ctx.ellipse(0,-22, 12,6, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#ff2200';
      ctx.beginPath(); ctx.ellipse(-4,-15, 3,3, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(4,-15,  3,3, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffa0';
      ctx.fillRect(-5,-7,3,7); ctx.fillRect(2,-7,3,7);
      break;
    }
    case 'sandworm': {
      const sc = ['#a06030','#c07840','#b06828'];
      for (let s = 3; s >= 0; s--) {
        ctx.fillStyle = sc[s%3];
        ctx.beginPath(); ctx.ellipse(s*9-14, s*7-15+22, 18-s*2, 11-s, 0, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = '#b07040';
      ctx.beginPath(); ctx.ellipse(14, 5, 20, 16, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#200000';
      ctx.beginPath(); ctx.ellipse(22, 5, 12, 10, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffa0';
      for (let t = 0; t < 5; t++) {
        const tx = 14 + 9*Math.cos(t/5*Math.PI*2);
        const ty =  5 + 9*Math.sin(t/5*Math.PI*2);
        ctx.fillRect(tx-1, ty-3, 2, 6);
      }
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath(); ctx.ellipse(8,-4, 5,5, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(18,-6, 5,5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(9,-4, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(19,-6, 2.5, 0, Math.PI*2); ctx.fill();
      break;
    }
    case 'icewolf': {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.ellipse(0,24, 16,5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#b0c8d8';
      ctx.beginPath(); ctx.ellipse(-2,4, 14,10, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#90a8c0';
      ctx.fillRect(-14,10,6,13); ctx.fillRect(-5,12,6,11);
      ctx.fillRect(3,12,6,11);   ctx.fillRect(9,10,6,13);
      ctx.fillStyle = '#d0e0f0';
      ctx.beginPath();
      ctx.moveTo(-14,2); ctx.quadraticCurveTo(-30,-6,-22,-15);
      ctx.quadraticCurveTo(-19,-19,-15,-12);
      ctx.quadraticCurveTo(-20,-7,-18,1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#a0c0d0';
      ctx.beginPath(); ctx.ellipse(14,-4, 12,10, -0.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#90b0c0';
      ctx.beginPath(); ctx.ellipse(22,0, 7,5, 0.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#a0c0d0';
      ctx.beginPath(); ctx.moveTo(8,-12); ctx.lineTo(4,-23); ctx.lineTo(14,-14); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(18,-12); ctx.lineTo(16,-21); ctx.lineTo(22,-13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4488ff';
      ctx.beginPath(); ctx.ellipse(12,-7, 3,3, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(19,-6, 3,3, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(13,-7, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(20,-6, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(180,220,255,0.6)'; ctx.lineWidth = 1;
      for (let c = 0; c < 4; c++) {
        const ix = -8+c*5, iy = -3+c*3;
        ctx.beginPath(); ctx.moveTo(ix,iy-5); ctx.lineTo(ix,iy+5);
        ctx.moveTo(ix-4,iy); ctx.lineTo(ix+4,iy); ctx.stroke();
      }
      break;
    }
  }
  ctx.restore();
}

// ── Party sprites (side view, facing LEFT) ─────────────────────────────────

function _drawPartySprite(job, cx, cy, isActive, isVictory = false) {
  ctx.save(); ctx.translate(cx, cy);
  if (isActive) { ctx.shadowColor = '#ffff44'; ctx.shadowBlur = 10; }

  const C = {
    warrior: ['#3a60b0','#6090e0','#3a3a4a'],
    white:   ['#d8c8f0','#ffffff','#b090c0'],
    black:   ['#26184a','#4a3070','#180e2c'],
    thief:   ['#1e4830','#305a40','#141c10'],
  }[job] || ['#3a60b0','#6090e0','#3a3a4a'];

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 22, 10, 4, 0, 0, Math.PI*2); ctx.fill();

  // Legs (victory: spread slightly)
  ctx.fillStyle = C[0];
  if (isVictory) {
    ctx.fillRect(-7, 10, 5, 11); ctx.fillRect(3, 10, 5, 11);
  } else {
    ctx.fillRect(-6, 10, 5, 12); ctx.fillRect(2, 10, 5, 12);
  }

  // Body
  ctx.fillStyle = C[0]; ctx.fillRect(-8,-6,16,18);
  ctx.fillStyle = C[1]; ctx.fillRect(-7,-5,7,15);

  // Arms & weapon
  ctx.fillStyle = C[0];
  if (isVictory) {
    // Both arms raised high
    ctx.fillRect(-14,-18,6,14); ctx.fillRect(8,-18,6,14);
    if (job === 'warrior') {
      ctx.fillStyle = '#b8b8c8'; ctx.fillRect(-14,-32,4,16);
      ctx.fillStyle = '#8a6830'; ctx.fillRect(-13,-18,3,14);
    } else if (job === 'thief') {
      ctx.fillStyle = '#d0d0d0'; ctx.fillRect(-13,-30,3,14);
      ctx.fillStyle = '#5a3020'; ctx.fillRect(-12,-18,2,10);
    } else {
      ctx.fillStyle = '#7a4818'; ctx.fillRect(-12,-38,3,22);
      ctx.fillStyle = job === 'white' ? '#e8d0ff' : '#9040ff';
      ctx.beginPath(); ctx.arc(-10,-40, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.arc(-11,-42, 2, 0, Math.PI*2); ctx.fill();
    }
    // Victory star above raised hand
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('★', -11, isVictory && (job === 'warrior' || job === 'thief') ? -34 : -44);
  } else {
    if (job === 'warrior') {
      ctx.fillRect(-14,-4,6,14); ctx.fillRect(7,-4,6,10);
      ctx.fillStyle = '#b8b8c8'; ctx.fillRect(-26,-1,13,4);
      ctx.fillStyle = '#8a6830'; ctx.fillRect(-16,-6,4,13);
    } else if (job === 'thief') {
      ctx.fillRect(-13,-4,6,13); ctx.fillRect(7,-4,6,10);
      ctx.fillStyle = '#d0d0d0'; ctx.fillRect(-22,1,8,3);
      ctx.fillStyle = '#5a3020'; ctx.fillRect(-16,-4,3,10);
    } else {
      ctx.fillRect(-12,-4,5,14); ctx.fillRect(7,-4,5,10);
      ctx.fillStyle = '#7a4818'; ctx.fillRect(-15,-24,3,28);
      ctx.fillStyle = job === 'white' ? '#e8d0ff' : '#9040ff';
      ctx.beginPath(); ctx.arc(-13,-26, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.arc(-14,-28, 2, 0, Math.PI*2); ctx.fill();
    }
  }

  // Head
  ctx.fillStyle = '#e8c890';
  ctx.beginPath(); ctx.ellipse(0,-13, 8,9, 0, 0, Math.PI*2); ctx.fill();

  // Headgear
  ctx.fillStyle = C[2];
  if (job === 'warrior') {
    ctx.fillRect(-8,-21,16,9); ctx.fillRect(-6,-24,12,5);
  } else if (job === 'white') {
    ctx.fillStyle = '#f0e0ff';
    ctx.beginPath(); ctx.arc(0,-17, 9, Math.PI, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#c8a0d8'; ctx.fillRect(-9,-18,18,4);
  } else if (job === 'black') {
    ctx.fillRect(-10,-20,20,7);
    ctx.beginPath(); ctx.moveTo(-10,-20); ctx.lineTo(0,-36); ctx.lineTo(10,-20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7040b0'; ctx.fillRect(-10,-23,20,3);
  } else if (job === 'thief') {
    ctx.beginPath(); ctx.arc(0,-17, 9, Math.PI, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#243020'; ctx.fillRect(-9,-18,18,5);
  }

  // Eye
  ctx.fillStyle = '#3a2000';
  ctx.beginPath(); ctx.arc(-4,-13, 2, 0, Math.PI*2); ctx.fill();

  // Victory smile
  if (isVictory) {
    ctx.strokeStyle = '#a06020'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(-3,-10, 3, 0.1*Math.PI, 0.9*Math.PI); ctx.stroke();
  }

  ctx.shadowBlur = 0; ctx.restore();
}
