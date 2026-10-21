// 背景描画（3層パララックス + オフスクリーンキャッシュ）

const BackgroundCache = {
  stage: 0,
  layers: [],
  width: 2400,
  height: 450,

  invalidate() {
    this.stage = 0;
    this.layers = [];
  },

  ensure(stageNum, stageColors) {
    if (this.stage === stageNum && this.layers.length === 3) return;
    this.stage = stageNum;
    this.layers = [];
    const factors = [0.15, 0.35, 0.6];
    for (let i = 0; i < 3; i++) {
      const c = document.createElement('canvas');
      c.width = this.width;
      c.height = this.height;
      const cctx = c.getContext('2d');
      this.paintLayer(cctx, stageNum, i, stageColors, factors[i]);
      this.layers.push(c);
    }
  },

  paintLayer(cctx, stageNum, layerIndex, colors, factor) {
    const skyGrad = cctx.createLinearGradient(0, 0, 0, 350);
    const stops = this.getSkyStops(stageNum, colors.bg);
    skyGrad.addColorStop(0, stops.top);
    skyGrad.addColorStop(0.65, stops.mid);
    skyGrad.addColorStop(1, stops.bottom);
    cctx.fillStyle = skyGrad;
    cctx.fillRect(0, 0, this.width, 350);

    if (layerIndex === 0) {
      this.drawFarLayer(cctx, stageNum);
    } else if (layerIndex === 1) {
      this.drawMidLayer(cctx, stageNum);
    } else {
      this.drawNearLayer(cctx, stageNum, colors);
    }
  },

  getSkyStops(stageNum, fallback) {
    if (stageNum === 1) {
      return { top: '#BEEBFF', mid: '#90D9FF', bottom: '#6FC0F0' };
    }
    if (stageNum === 2) {
      return { top: '#FFD59E', mid: '#F9A35A', bottom: '#D56F49' };
    }
    if (stageNum === 3) {
      return { top: '#223A70', mid: '#1A274E', bottom: '#131B33' };
    }
    return { top: lightenColor(fallback, 20), mid: fallback, bottom: fallback };
  },

  drawFarLayer(ctx, stageNum) {
    for (let i = 0; i < 6; i++) {
      const cloudY = stageNum === 2 ? 55 + (i % 3) * 20 : 40 + (i % 3) * 25;
      drawCloudVector(ctx, i * 400 + 50, cloudY, 0.8 + (i % 2) * 0.3);
    }
    if (stageNum >= 3) {
      for (let i = 0; i < 8; i++) {
        const bx = i * 280;
        const bh = 80 + seededRandom(i + stageNum) * 100;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(bx, 350 - bh, 70, bh);
        for (let w = 0; w < 6; w++) {
          if (seededRandom(i * 10 + w) > 0.35) {
            ctx.fillStyle = seededRandom(i + w) > 0.5 ? '#FFD700' : '#2a2a3e';
            ctx.fillRect(bx + 8 + (w % 3) * 20, 350 - bh + 15 + Math.floor(w / 3) * 18, 12, 8);
          }
        }
      }
    }
    if (stageNum === 7) {
      ctx.fillStyle = '#3D1A5C';
      ctx.fillRect(100, 120, 200, 100);
      ctx.beginPath();
      ctx.moveTo(130, 120);
      ctx.lineTo(150, 80);
      ctx.lineTo(170, 120);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(230, 120);
      ctx.lineTo(250, 80);
      ctx.lineTo(270, 120);
      ctx.fill();
    }
  },

  drawMidLayer(ctx, stageNum) {
    const builders = {
      1: () => this.drawSchool(ctx, 200, '#D3D3D3', '#4169E1'),
      2: () => { this.drawSchool(ctx, 180, '#C0C0C0', '#4682B4'); this.drawFence(ctx); },
      3: () => this.drawCityMid(ctx),
      4: () => this.drawUniversity(ctx),
      5: () => this.drawOfficeMid(ctx),
      6: () => this.drawNightCity(ctx),
      7: () => this.drawCastleMid(ctx)
    };
    const fn = builders[stageNum] || builders[1];
    fn();
  },

  drawNearLayer(ctx, stageNum, colors) {
    if (stageNum === 1) {
      this.drawPole(ctx, 600);
      this.drawBench(ctx, 300, '#8BC34A');
    }
    if (stageNum === 2) {
      this.drawRoadSign(ctx, 420, '#FF8C00');
    }
    if (stageNum === 3) {
      this.drawLamp(ctx, 500);
      this.drawRoadSign(ctx, 300, '#87CEFA');
    }
    if (stageNum === 4) {
      this.drawNeon(ctx, 560, '#FF00FF');
    }
    if (stageNum === 5) {
      this.drawSignal(ctx, 700);
      this.drawOfficeWindow(ctx, 360);
    }
    if (stageNum === 6) {
      this.drawConvenience(ctx, 400);
      this.drawPlatformLine(ctx);
    }
    if (stageNum === 7) {
      this.drawFirePillar(ctx, 350);
      this.drawBrokenPillar(ctx, 620);
    }
    ctx.fillStyle = darkenColor(colors.ground, 15);
    for (let i = 0; i < this.width; i += 40) {
      ctx.fillRect(i, 340, 20, 4);
    }
  },

  drawSchool(ctx, x, body, windowColor) {
    ctx.fillStyle = body;
    ctx.fillRect(x, 100, 160, 120);
    ctx.fillStyle = darkenColor(body, 30);
    ctx.fillRect(x, 100, 160, 8);
    ctx.fillStyle = windowColor;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        ctx.fillRect(x + 20 + i * 42, 120 + j * 35, 28, 22);
      }
    }
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 68, 175, 24, 35);
  },

  drawFence(ctx) {
    ctx.fillStyle = '#8B7355';
    for (let x = 0; x < this.width; x += 60) {
      ctx.fillRect(x, 250, 5, 70);
      ctx.fillRect(x - 28, 270, 60, 4);
      ctx.fillRect(x - 28, 295, 60, 4);
    }
  },

  drawCityMid(ctx) {
    for (let i = 0; i < 5; i++) {
      const bx = i * 350;
      ctx.fillStyle = '#1C1C1C';
      ctx.fillRect(bx, 60, 90, 200);
      for (let r = 0; r < 10; r++) {
        ctx.fillStyle = seededRandom(i + r) > 0.4 ? '#333' : '#FFD700';
        ctx.fillRect(bx + 12 + (r % 3) * 24, 80 + Math.floor(r / 3) * 16, 14, 10);
      }
    }
  },

  drawUniversity(ctx) {
    ctx.fillStyle = '#9370DB';
    ctx.fillRect(150, 80, 220, 140);
    ctx.beginPath();
    ctx.arc(260, 80, 45, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#4B0082';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(170 + i * 45, 100, 28, 28);
    }
  },

  drawOfficeMid(ctx) {
    for (let i = 0; i < 4; i++) {
      const ox = i * 400;
      ctx.fillStyle = '#2F2F2F';
      ctx.fillRect(ox, 40, 110, 280);
      for (let r = 0; r < 14; r++) {
        for (let c = 0; c < 3; c++) {
          const lit = seededRandom(ox + r * 3 + c) > 0.45;
          ctx.fillStyle = lit ? '#FFD700' : '#1a1a1a';
          ctx.fillRect(ox + 14 + c * 30, 58 + r * 17, 18, 11);
        }
      }
    }
  },

  drawNightCity(ctx) {
    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(80, 30, 140, 310);
    for (let r = 0; r < 18; r++) {
      for (let c = 0; c < 4; c++) {
        if (seededRandom(r * 4 + c + 60) > 0.4) {
          ctx.fillStyle = '#FFD700';
          ctx.fillRect(95 + c * 28, 48 + r * 15, 18, 10);
        }
      }
    }
    ctx.fillStyle = '#FF1493';
    ctx.shadowColor = '#FF1493';
    ctx.shadowBlur = 20;
    ctx.fillRect(400, 140, 50, 70);
    ctx.shadowBlur = 0;
  },

  drawCastleMid(ctx) {
    ctx.fillStyle = '#4B0082';
    ctx.fillRect(120, 90, 200, 130);
    ctx.fillStyle = '#FF4500';
    ctx.shadowColor = '#FF4500';
    ctx.shadowBlur = 12;
    ctx.fillRect(150, 120, 18, 25);
    ctx.fillRect(270, 120, 18, 25);
    ctx.shadowBlur = 0;
  },

  drawPole(ctx, x) {
    ctx.fillStyle = '#654321';
    ctx.fillRect(x, 140, 10, 210);
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 170, this.width, 2);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - 6, 168, 22, 14);
  },

  drawLamp(ctx, x) {
    ctx.fillStyle = '#555';
    ctx.fillRect(x, 150, 8, 200);
    const grad = ctx.createRadialGradient(x + 4, 165, 0, x + 4, 200, 60);
    grad.addColorStop(0, 'rgba(255,255,150,0.6)');
    grad.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - 30, 160, 70, 120);
  },

  drawSignal(ctx, x) {
    ctx.fillStyle = '#333';
    ctx.fillRect(x, 170, 24, 80);
    [['#FF0000', 0], ['#FFD700', 14], ['#00FF00', 28]].forEach(([color, off]) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + 12, 185 + off, 7, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  drawConvenience(ctx, x) {
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x, 190, 140, 90);
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 25;
    ctx.fillRect(x + 10, 195, 120, 22);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(x + 15, 230, 110, 40);
  },

  drawFirePillar(ctx, x) {
    const grad = ctx.createLinearGradient(x, 220, x, 300);
    grad.addColorStop(0, '#FFD700');
    grad.addColorStop(0.5, '#FF4500');
    grad.addColorStop(1, '#FF0000');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#FF4500';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(x, 300);
    ctx.lineTo(x - 12, 240);
    ctx.lineTo(x + 12, 240);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  },

  drawBench(ctx, x, color) {
    ctx.fillStyle = '#6D4C41';
    ctx.fillRect(x, 290, 80, 8);
    ctx.fillRect(x + 8, 276, 64, 10);
    ctx.fillStyle = color;
    ctx.fillRect(x - 10, 298, 100, 8);
  },

  drawRoadSign(ctx, x, color) {
    ctx.fillStyle = '#444';
    ctx.fillRect(x, 220, 6, 120);
    ctx.fillStyle = color;
    ctx.fillRect(x - 26, 200, 58, 32);
  },

  drawNeon(ctx, x, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillRect(x, 170, 18, 90);
    ctx.shadowBlur = 0;
  },

  drawOfficeWindow(ctx, x) {
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(x, 190, 100, 100);
    ctx.fillStyle = '#FFD54F';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        ctx.fillRect(x + 10 + i * 28, 202 + j * 26, 16, 12);
      }
    }
  },

  drawPlatformLine(ctx) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 334, this.width, 3);
  },

  drawBrokenPillar(ctx, x) {
    ctx.fillStyle = '#4E342E';
    ctx.fillRect(x, 210, 26, 130);
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(x + 6, 190, 14, 22);
  }
};

function lightenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
  const b = Math.min(255, (num & 0xFF) + amount);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function darkenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
  const b = Math.max(0, (num & 0xFF) - amount);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function drawStageBackground(stageNum) {
  const stage = stages[stageNum - 1];
  BackgroundCache.ensure(stageNum, stage);
  const factors = [0.15, 0.35, 0.6];
  BackgroundCache.layers.forEach((layer, i) => {
    const offset = (camera.x * factors[i]) % BackgroundCache.width;
    ctx.drawImage(layer, -offset, 0);
    ctx.drawImage(layer, BackgroundCache.width - offset, 0);
  });
}

function drawCloud(x, y) {
  drawCloudVector(ctx, x % 800, y, 1);
}
