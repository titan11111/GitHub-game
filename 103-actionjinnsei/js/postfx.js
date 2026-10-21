// ポストエフェクトシステム
// ビネット + カラーグレード + フィルムグレイン + ダメージフラッシュ

const PostFX = (() => {
  const _isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const NOISE_SZ = 128;

  let _vigCanvas = null;
  let _vigCtx = null;
  let _noiseCanvas = null;
  let _noiseCtx = null;
  let _lastStage = 0;
  let _noiseTick = 0;
  let _damageFlash = 0;

  // ステージ別: ビネット強度
  const VIG_STR = [0.42, 0.48, 0.62, 0.68, 0.72, 0.84, 0.80];

  // ステージ別: カラーグレード (tint)
  // multiply blendで全体に薄い色味を乗せる
  const COLOR_GRADE = [
    null,
    { r:8,  g:10, b:40, a:0.06 },   // 2: わずかな夕方の青
    { r:0,  g:6,  b:28, a:0.13 },   // 3: 夜の街の青
    { r:18, g:0,  b:42, a:0.15 },   // 4: 大学の紫夜
    { r:0,  g:9,  b:16, a:0.17 },   // 5: 社会人の冷たい夜
    { r:0,  g:4,  b:22, a:0.22 },   // 6: サラリーマンの深夜
    { r:32, g:0,  b:0,  a:0.20 },   // 7: 魔王城の血の赤
  ];

  function _buildVignette(strength) {
    _vigCanvas = document.createElement('canvas');
    _vigCanvas.width = 800;
    _vigCanvas.height = 450;
    _vigCtx = _vigCanvas.getContext('2d');
    const grad = _vigCtx.createRadialGradient(400, 225, 75, 400, 225, 490);
    grad.addColorStop(0,    'rgba(0,0,0,0)');
    grad.addColorStop(0.62, 'rgba(0,0,0,' + (strength * 0.22) + ')');
    grad.addColorStop(0.88, 'rgba(0,0,0,' + (strength * 0.60) + ')');
    grad.addColorStop(1,    'rgba(0,0,0,' + strength + ')');
    _vigCtx.fillStyle = grad;
    _vigCtx.fillRect(0, 0, 800, 450);
  }

  function _buildNoise() {
    _noiseCanvas = document.createElement('canvas');
    _noiseCanvas.width = NOISE_SZ;
    _noiseCanvas.height = NOISE_SZ;
    _noiseCtx = _noiseCanvas.getContext('2d');
    _refreshNoise();
  }

  function _refreshNoise() {
    const imgData = _noiseCtx.createImageData(NOISE_SZ, NOISE_SZ);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = (Math.random() * 20) | 0; // 透明度は低め
    }
    _noiseCtx.putImageData(imgData, 0, 0);
  }

  // ダメージ時に呼び出す
  function triggerDamageFlash() {
    _damageFlash = 14;
  }

  function render(stageNum) {
    // ビネットをステージ変更時に再生成
    if (!_vigCanvas || _lastStage !== stageNum) {
      _lastStage = stageNum;
      _buildVignette(VIG_STR[stageNum - 1] || 0.50);
    }
    if (!_isMobile && !_noiseCanvas) {
      _buildNoise();
    }

    // ① カラーグレード (multiply)
    const grade = COLOR_GRADE[stageNum - 1];
    if (grade) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(' + grade.r + ',' + grade.g + ',' + grade.b + ',' + grade.a + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }

    // ② フィルムグレイン (デスクトップのみ、2フレームに1回更新)
    if (!_isMobile && _noiseCanvas) {
      _noiseTick++;
      if (_noiseTick % 2 === 0) _refreshNoise();
      const ox = (Math.random() * NOISE_SZ) | 0;
      const oy = (Math.random() * NOISE_SZ) | 0;
      ctx.save();
      ctx.globalAlpha = 0.032;
      ctx.globalCompositeOperation = 'screen';
      for (let x = -ox; x < canvas.width; x += NOISE_SZ) {
        for (let y = -oy; y < canvas.height; y += NOISE_SZ) {
          ctx.drawImage(_noiseCanvas, x, y);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }

    // ③ ビネット (常時)
    ctx.drawImage(_vigCanvas, 0, 0);

    // ④ ダメージフラッシュ (赤の瞬きパルス)
    if (_damageFlash > 0) {
      const progress = _damageFlash / 14;
      // 前半で急激に出て、後半でゆっくり消える
      const eased = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      ctx.save();
      ctx.fillStyle = 'rgba(220,0,0,' + (eased * 0.42) + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      _damageFlash--;
    }
  }

  return { render, triggerDamageFlash };
})();
