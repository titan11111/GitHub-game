// ライティングシステム
// 暗いオーバーレイキャンバスにライトの穴を開けて合成

const LightingSystem = (() => {
  const _isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  let _canvas = null;
  let _ctx = null;

  // ステージ別: 暗さオーバーレイの不透明度
  // 0=なし, 1=完全な闇
  const STAGE_DARK_ALPHA = [0, 0.08, 0.52, 0.62, 0.72, 0.85, 0.80];

  // ステージ別: 暗さの色味 (夜の青、魔城の赤など)
  const STAGE_DARK_COLOR = [
    null,
    '0,5,30',     // 2: 夕方の青
    '0,5,20',     // 3: 夜の街
    '15,0,35',    // 4: 紫の夜
    '0,8,12',     // 5: 冷たい暗さ
    '0,0,12',     // 6: 深夜
    '28,0,0',     // 7: 魔王の城の赤い闇
  ];

  function _init() {
    _canvas = document.createElement('canvas');
    _canvas.width = 800;
    _canvas.height = 450;
    _ctx = _canvas.getContext('2d');
  }

  // 中心から外縁へのラジアルグラデーションでライトの穴を開ける
  function _punchLight(lx, ly, radius, innerAlpha) {
    const grad = _ctx.createRadialGradient(lx, ly, 0, lx, ly, radius);
    grad.addColorStop(0,   'rgba(255,255,255,' + innerAlpha + ')');
    grad.addColorStop(0.45,'rgba(255,255,255,' + (innerAlpha * 0.55) + ')');
    grad.addColorStop(0.8, 'rgba(255,255,255,' + (innerAlpha * 0.15) + ')');
    grad.addColorStop(1,   'rgba(255,255,255,0)');
    _ctx.fillStyle = grad;
    _ctx.beginPath();
    _ctx.arc(lx, ly, radius, 0, Math.PI * 2);
    _ctx.fill();
  }

  function render(stageNum) {
    const alpha = STAGE_DARK_ALPHA[stageNum - 1];
    if (!alpha || alpha < 0.05) return;

    if (!_canvas) _init();

    const t = Date.now() / 1000;
    const color = STAGE_DARK_COLOR[stageNum - 1] || '0,0,20';

    // ① 暗いベースで全体を塗る
    _ctx.clearRect(0, 0, 800, 450);
    _ctx.fillStyle = 'rgba(' + color + ',' + alpha + ')';
    _ctx.fillRect(0, 0, 800, 450);

    // ② destination-out でライトの穴を開ける
    _ctx.globalCompositeOperation = 'destination-out';

    // プレイヤーのライト（暖色・広い範囲）
    if (typeof player !== 'undefined' && player) {
      const px = player.x - camera.x + player.w / 2;
      const py = player.y + player.h / 2;
      const flicker = 1.0 + (Math.random() - 0.5) * 0.025;
      _punchLight(px, py, 145 * flicker, 1.0);
    }

    // 敵のライト（赤い危険の光・小さめ）
    if (typeof enemies !== 'undefined' && !_isMobile) {
      const maxLights = 4;
      let n = 0;
      for (const e of enemies) {
        if (n >= maxLights) break;
        if (e.x > camera.x - 60 && e.x < camera.x + 860) {
          const ex = e.x - camera.x + e.w / 2;
          const ey = e.y + e.h / 2;
          _punchLight(ex, ey, 52, 0.38);
          n++;
        }
      }
    }

    // ボスのライト（脈動する強い光）
    if (typeof boss !== 'undefined' && boss) {
      const bx = boss.x - camera.x + boss.w / 2;
      const by = boss.y + boss.h / 2;
      const pulse = 1.0 + Math.sin(t * 2.8) * 0.22;
      _punchLight(bx, by, 170 * pulse, 0.85);
    }

    // アイテム（メディカルキット）のライト
    if (typeof items !== 'undefined') {
      items.forEach(item => {
        if (!item.collected && item.x > camera.x - 60 && item.x < camera.x + 860) {
          const ix = item.x - camera.x;
          const iy = item.y;
          const pulse = 0.88 + Math.sin(t * 2.5) * 0.12;
          _punchLight(ix + 10, iy + 10, 44 * pulse, 0.70);
        }
      });
    }

    _ctx.globalCompositeOperation = 'source-over';

    // ③ メインキャンバスに暗さオーバーレイを合成
    ctx.save();
    ctx.drawImage(_canvas, 0, 0);
    ctx.restore();

    // ④ Glowレイヤー（lighter）: モバイルは省略
    if (_isMobile) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // プレイヤーの柔らかいオーラ
    if (typeof player !== 'undefined' && player) {
      const px = player.x - camera.x + player.w / 2;
      const py = player.y + player.h / 2;
      const auraColor = stageNum === 7 ? '255,180,80' : stageNum >= 5 ? '80,180,255' : '255,240,180';
      const aura = ctx.createRadialGradient(px, py, 0, px, py, 60);
      aura.addColorStop(0, 'rgba(' + auraColor + ',0.10)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(px, py, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    // ボスの強いglow
    if (typeof boss !== 'undefined' && boss) {
      const bx = boss.x - camera.x + boss.w / 2;
      const by = boss.y + boss.h / 2;
      const pulse = 0.75 + Math.sin(t * 2.8) * 0.25;
      const bossGlow = ctx.createRadialGradient(bx, by, 0, bx, by, 110 * pulse);
      bossGlow.addColorStop(0, 'rgba(255,60,0,0.18)');
      bossGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bossGlow;
      ctx.beginPath();
      ctx.arc(bx, by, 110 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  return { render };
})();
