// パーティクルシステム
// オブジェクトプール方式でアンビエント粒子・歩行塵・ヒットエフェクトを管理

const ParticleSystem = (() => {
  const _isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const MAX = _isMobile ? 70 : 200;

  // プール初期化
  const _pool = [];
  for (let i = 0; i < MAX; i++) {
    _pool.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 1, color: '#FFF' });
  }

  // ステージ別アンビエント粒子の色リスト
  const AMBIENT = [
    ['rgba(255,255,180,0.55)', 'rgba(180,255,160,0.40)'],          // 1: 草原の光
    ['rgba(255,230,170,0.45)', 'rgba(210,210,255,0.35)'],          // 2: 夕暮れの塵
    ['rgba(255,200,80,0.45)',  'rgba(100,160,255,0.35)'],          // 3: 街灯・ネオン
    ['rgba(200,80,255,0.40)', 'rgba(255,100,210,0.35)'],           // 4: 魔法の粒子
    ['rgba(140,190,255,0.32)','rgba(255,255,255,0.20)'],           // 5: 冷たい光
    ['rgba(255,40,80,0.38)',  'rgba(0,200,255,0.30)'],             // 6: ネオン赤・青
    ['rgba(255,110,0,0.50)',  'rgba(255,210,0,0.38)'],             // 7: 炎・火の粉
  ];

  // 歩行時の土埃カラー
  const WALK_DUST = [
    'rgba(180,220,140,0.50)',  // 1: 草
    'rgba(170,140,100,0.50)',  // 2: 土
    'rgba(100,100,100,0.45)',  // 3: アスファルト
    'rgba(100,85,120,0.45)',   // 4: 石畳
    'rgba(140,150,140,0.40)',  // 5: 廊下
    'rgba(90,90,90,0.40)',     // 6: 夜の道
    'rgba(60,70,55,0.50)',     // 7: 城の石床
  ];

  let _ambientTick = 0;

  function _spawn(x, y, vx, vy, life, size, color) {
    for (let i = 0; i < MAX; i++) {
      if (!_pool[i].active) {
        const p = _pool[i];
        p.active = true;
        p.x = x; p.y = y;
        p.vx = vx; p.vy = vy;
        p.life = life | 0;
        p.maxLife = life | 0;
        p.size = size;
        p.color = color;
        return;
      }
    }
  }

  // 毎フレーム呼び出し: アンビエント粒子を少量ずつ生成
  function spawnAmbient(stageNum) {
    _ambientTick++;
    const rate = _isMobile ? 7 : 3;
    if (_ambientTick % rate !== 0) return;
    if (typeof camera === 'undefined') return;

    const cols = AMBIENT[stageNum - 1] || AMBIENT[0];
    const c = cols[(_ambientTick >> 2) % cols.length];

    // 画面内ランダム位置、ゆっくりドリフト
    const sx = camera.x + Math.random() * 830 - 15;
    const sy = 15 + Math.random() * 310;
    const spd = stageNum >= 7 ? 0.55 : 0.22;
    const upBias = stageNum >= 7 ? -0.35 : -0.12; // 炎は上昇バイアス

    _spawn(
      sx, sy,
      (Math.random() - 0.5) * spd,
      upBias - Math.random() * spd * 0.4,
      90 + Math.random() * 110,
      0.7 + Math.random() * 1.7,
      c
    );
  }

  // 歩行時に足元から土埃を生成
  function spawnWalkDust(stageNum) {
    if (!player || !player.onGround) return;
    if (Math.abs(player.vx) < 0.9) return;
    if (Math.random() > 0.38) return;

    const c = WALK_DUST[stageNum - 1] || WALK_DUST[0];
    const bx = player.x + player.w / 2 + (Math.random() - 0.5) * 16;
    const by = player.y + player.h - 1;

    _spawn(
      bx, by,
      (Math.random() - 0.5) * 1.3 - player.vx * 0.12,
      -Math.random() * 1.3 - 0.3,
      14 + Math.random() * 14,
      1.6 + Math.random() * 2.0,
      c
    );
  }

  // 敵撃破・ヒット時のスパーク
  function spawnHitSparks(wx, wy, count) {
    const n = _isMobile ? Math.ceil(count * 0.6) : count;
    const colors = ['#FFD700', '#FF8C00', '#FF4500', '#FFF'];
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.8 + Math.random() * 3.5;
      _spawn(
        wx, wy,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd - 1.2,
        12 + Math.random() * 14,
        1.4 + Math.random() * 2.2,
        colors[(Math.random() * colors.length) | 0]
      );
    }
  }

  // ステージ進行で呼ばれる大爆発
  function spawnBurst(wx, wy, count, color) {
    const n = _isMobile ? Math.ceil(count * 0.5) : count;
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 5;
      _spawn(
        wx, wy,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd - 2,
        18 + Math.random() * 20,
        2 + Math.random() * 3,
        color || '#FFD700'
      );
    }
  }

  function update() {
    for (let i = 0; i < MAX; i++) {
      const p = _pool[i];
      if (!p.active) continue;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.007; // 微重力
      p.life--;
      if (p.life <= 0) p.active = false;
    }
  }

  function render() {
    if (typeof ctx === 'undefined' || typeof camera === 'undefined') return;
    ctx.save();
    for (let i = 0; i < MAX; i++) {
      const p = _pool[i];
      if (!p.active) continue;
      const sx = p.x - camera.x;
      if (sx < -8 || sx > 808) continue;
      ctx.globalAlpha = (p.life / p.maxLife) * 0.88;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  return { spawnAmbient, spawnWalkDust, spawnHitSparks, spawnBurst, update, render };
})();
