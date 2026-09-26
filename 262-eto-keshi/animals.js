/* 十二支の絵札。原点中心・大きさ R。写実寄りの顔立ちで描く。
   bakeEtoSprites は描画後に実描画範囲を測って正規化するので、12体の見かけの大きさが揃う。 */
(function (global) {
  const TAU = Math.PI * 2;

  // ---------- 共通ヘルパ ----------
  function ell(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU);
  }
  function fell(ctx, x, y, rx, ry, fill, rot) {
    ell(ctx, x, y, rx, ry, rot);
    ctx.fillStyle = fill; ctx.fill();
  }
  function lin(ctx, x0, y0, x1, y1, c0, c1) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, c0); g.addColorStop(1, c1); return g;
  }
  function rad(ctx, x, y, r1, c0, c1) {
    const g = ctx.createRadialGradient(x, y, r1 * 0.05, x, y, r1);
    g.addColorStop(0, c0); g.addColorStop(1, c1); return g;
  }
  function edge(ctx, R, a) {
    ctx.strokeStyle = 'rgba(30,23,16,' + (a == null ? 0.55 : a) + ')';
    ctx.lineWidth = Math.max(1, R * 0.045);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  }
  function poly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }
  /* 目。iris=虹彩色、slit=縦瞳孔、w=横長率 */
  function eye(ctx, R, x, y, r, o) {
    o = o || {};
    const w = o.w || 1;
    fell(ctx, x, y, r * w, r, o.sclera || '#2a1e14');
    fell(ctx, x, y, r * 0.76 * w, r * 0.76, o.iris || '#8a5a22');
    if (o.slit) ell(ctx, x, y, r * 0.20, r * 0.66);
    else ell(ctx, x, y, r * 0.44 * w, r * 0.46);
    ctx.fillStyle = '#120d09'; ctx.fill();
    fell(ctx, x - r * 0.30 * w, y - r * 0.34, r * 0.26, r * 0.22, 'rgba(255,255,255,.92)');
    fell(ctx, x + r * 0.26 * w, y + r * 0.28, r * 0.13, r * 0.11, 'rgba(255,255,255,.42)');
    if (o.lid) {
      ctx.strokeStyle = o.lid; ctx.lineWidth = Math.max(1, R * 0.04);
      ctx.beginPath(); ctx.arc(x, y, r * 1.08 * w, Math.PI * 1.03, Math.PI * 1.97); ctx.stroke();
    }
  }
  function nose(ctx, x, y, w, h, col) {
    ctx.beginPath();
    ctx.moveTo(x - w, y - h * 0.55);
    ctx.quadraticCurveTo(x, y - h * 1.15, x + w, y - h * 0.55);
    ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.85, x, y + h);
    ctx.quadraticCurveTo(x - w * 0.5, y + h * 0.85, x - w, y - h * 0.55);
    ctx.fillStyle = col; ctx.fill();
  }
  function mouthW(ctx, R, x, y, w, col) {
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, R * 0.045);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - w * 0.15);
    ctx.quadraticCurveTo(x - w * 0.45, y + w * 0.55, x - w, y - w * 0.05);
    ctx.moveTo(x, y - w * 0.15);
    ctx.quadraticCurveTo(x + w * 0.45, y + w * 0.55, x + w, y - w * 0.05);
    ctx.stroke();
  }
  function whisk(ctx, R, x, y, dir, n, len) {
    ctx.strokeStyle = 'rgba(246,240,226,.78)';
    ctx.lineWidth = Math.max(1, R * 0.024);
    for (let i = 0; i < n; i++) {
      const a = -0.28 + i * (0.56 / Math.max(1, n - 1));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + dir * len * 0.55, y + a * R * 0.30, x + dir * len, y + a * R * 0.72);
      ctx.stroke();
    }
  }
  /* 毛並みの細い線 */
  function furlines(ctx, R, x, y, rx, ry, n, col, a) {
    ctx.save();
    ctx.globalAlpha = a == null ? 0.35 : a;
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, R * 0.018);
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU;
      const px = x + Math.cos(t) * rx, py = y + Math.sin(t) * ry;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(t) * R * 0.07, py + Math.sin(t) * R * 0.07);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 子 ねずみ ----------
  function ne(ctx, R) {
    const fur = '#9c8f84', dk = '#6c6058', pale = '#d9cfc0', pink = '#dc9fa6';
    [[-0.47, -0.32], [0.47, -0.32]].forEach(([ex, ey]) => {
      fell(ctx, R * ex, R * ey, R * 0.31, R * 0.31, fur);
      edge(ctx, R); ctx.stroke();
      fell(ctx, R * ex * 0.94, R * (ey + 0.02), R * 0.19, R * 0.19, pink);
      fell(ctx, R * ex * 0.90, R * (ey + 0.04), R * 0.12, R * 0.12, 'rgba(120,70,70,.25)');
    });
    ell(ctx, 0, R * 0.02, R * 0.46, R * 0.42);
    ctx.fillStyle = rad(ctx, -R * 0.16, -R * 0.20, R * 0.80, '#c0b4a6', fur); ctx.fill();
    edge(ctx, R); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-R * 0.31, R * 0.10);
    ctx.quadraticCurveTo(-R * 0.16, R * 0.50, 0, R * 0.54);
    ctx.quadraticCurveTo(R * 0.16, R * 0.50, R * 0.31, R * 0.10);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, R * 0.08, 0, R * 0.54, pale, '#e8e0d2'); ctx.fill();
    edge(ctx, R, 0.30); ctx.stroke();
    furlines(ctx, R, 0, R * 0.02, R * 0.44, R * 0.40, 26, dk, 0.22);
    eye(ctx, R, -R * 0.19, -R * 0.03, R * 0.095, { iris: '#2c1d14', sclera: '#1b120c' });
    eye(ctx, R, R * 0.19, -R * 0.03, R * 0.095, { iris: '#2c1d14', sclera: '#1b120c' });
    nose(ctx, 0, R * 0.46, R * 0.075, R * 0.055, pink);
    whisk(ctx, R, -R * 0.07, R * 0.44, -1, 3, R * 0.52);
    whisk(ctx, R, R * 0.07, R * 0.44, 1, 3, R * 0.52);
    ctx.strokeStyle = 'rgba(40,30,22,.5)'; ctx.lineWidth = Math.max(1, R * 0.03);
    ctx.beginPath(); ctx.moveTo(0, R * 0.50); ctx.lineTo(0, R * 0.56); ctx.stroke();
  }

  // ---------- 丑 うし ----------
  function ushi(ctx, R) {
    const fur = '#4b3e34', dk = '#2f251d', muz = '#c9b7a1';
    // 角（太く上へ反る）
    ctx.fillStyle = lin(ctx, -R * 0.7, -R * 0.7, 0, 0, '#f6eed6', '#bda87c');
    [[-1], [1]].forEach(([s0]) => {
      ctx.beginPath();
      ctx.moveTo(s0 * R * 0.22, -R * 0.34);
      ctx.quadraticCurveTo(s0 * R * 0.66, -R * 0.36, s0 * R * 0.70, -R * 0.78);
      ctx.quadraticCurveTo(s0 * R * 0.60, -R * 0.86, s0 * R * 0.54, -R * 0.74);
      ctx.quadraticCurveTo(s0 * R * 0.52, -R * 0.50, s0 * R * 0.18, -R * 0.46);
      ctx.closePath(); ctx.fill(); edge(ctx, R, 0.45); ctx.stroke();
    });
    // 耳
    fell(ctx, -R * 0.56, -R * 0.10, R * 0.22, R * 0.13, fur, -0.30);
    edge(ctx, R); ctx.stroke();
    fell(ctx, R * 0.56, -R * 0.10, R * 0.22, R * 0.13, fur, 0.30);
    ctx.stroke();
    // 頭
    ctx.beginPath();
    ctx.moveTo(-R * 0.44, -R * 0.20);
    ctx.quadraticCurveTo(-R * 0.48, R * 0.24, -R * 0.28, R * 0.42);
    ctx.quadraticCurveTo(0, R * 0.60, R * 0.28, R * 0.42);
    ctx.quadraticCurveTo(R * 0.48, R * 0.24, R * 0.44, -R * 0.20);
    ctx.quadraticCurveTo(R * 0.24, -R * 0.50, 0, -R * 0.50);
    ctx.quadraticCurveTo(-R * 0.24, -R * 0.50, -R * 0.44, -R * 0.20);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, -R * 0.18, -R * 0.24, R * 0.95, '#635244', fur); ctx.fill();
    edge(ctx, R); ctx.stroke();
    // 額の巻き毛
    ctx.strokeStyle = 'rgba(20,15,10,.45)'; ctx.lineWidth = Math.max(1, R * 0.03);
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * R * 0.13, -R * 0.30, R * 0.07, 0.4, 4.4);
      ctx.stroke();
    }
    // 口吻
    fell(ctx, 0, R * 0.36, R * 0.31, R * 0.23, lin(ctx, 0, R * 0.16, 0, R * 0.60, '#dccbb5', muz));
    edge(ctx, R, 0.35); ctx.stroke();
    fell(ctx, -R * 0.13, R * 0.31, R * 0.055, R * 0.075, '#4a3a2c', -0.3);
    fell(ctx, R * 0.13, R * 0.31, R * 0.055, R * 0.075, '#4a3a2c', 0.3);
    ctx.strokeStyle = 'rgba(60,45,34,.55)'; ctx.lineWidth = Math.max(1, R * 0.035);
    ctx.beginPath(); ctx.moveTo(-R * 0.14, R * 0.50); ctx.quadraticCurveTo(0, R * 0.56, R * 0.14, R * 0.50); ctx.stroke();
    // 鼻環（金）
    ctx.strokeStyle = '#d9ad43'; ctx.lineWidth = Math.max(1.4, R * 0.05);
    ctx.beginPath(); ctx.arc(0, R * 0.47, R * 0.12, 0.15, Math.PI - 0.15); ctx.stroke();
    // 目
    eye(ctx, R, -R * 0.25, -R * 0.08, R * 0.10, { iris: '#4a2e18', w: 1.15 });
    eye(ctx, R, R * 0.25, -R * 0.08, R * 0.10, { iris: '#4a2e18', w: 1.15 });
  }

  // ---------- 寅 とら ----------
  function tora(ctx, R) {
    const or1 = '#e89238', or2 = '#c46f1c', wh = '#f8f1e0', bk = '#231a12';
    [[-1, 0], [1, 0]].forEach(([s]) => {
      fell(ctx, s * R * 0.44, -R * 0.40, R * 0.24, R * 0.23, bk);
      fell(ctx, s * R * 0.44, -R * 0.37, R * 0.14, R * 0.14, '#f2d7b4');
    });
    // 頬のもふもふ
    ctx.fillStyle = or2;
    ctx.beginPath();
    ctx.moveTo(-R * 0.44, -R * 0.10);
    ctx.lineTo(-R * 0.66, R * 0.04); ctx.lineTo(-R * 0.48, R * 0.14);
    ctx.lineTo(-R * 0.66, R * 0.30); ctx.lineTo(-R * 0.40, R * 0.34);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(R * 0.44, -R * 0.10);
    ctx.lineTo(R * 0.66, R * 0.04); ctx.lineTo(R * 0.48, R * 0.14);
    ctx.lineTo(R * 0.66, R * 0.30); ctx.lineTo(R * 0.40, R * 0.34);
    ctx.closePath(); ctx.fill();
    // 頭
    ell(ctx, 0, R * 0.02, R * 0.50, R * 0.45);
    ctx.fillStyle = rad(ctx, -R * 0.18, -R * 0.22, R * 0.95, '#f6ad55', or1); ctx.fill();
    edge(ctx, R); ctx.stroke();
    // 白い頬と鼻まわり
    ctx.fillStyle = wh;
    ell(ctx, -R * 0.19, R * 0.26, R * 0.23, R * 0.19); ctx.fill();
    ell(ctx, R * 0.19, R * 0.26, R * 0.23, R * 0.19); ctx.fill();
    ell(ctx, 0, R * 0.12, R * 0.16, R * 0.16); ctx.fill();
    // 白い眉
    fell(ctx, -R * 0.22, -R * 0.14, R * 0.15, R * 0.09, wh, -0.25);
    fell(ctx, R * 0.22, -R * 0.14, R * 0.15, R * 0.09, wh, 0.25);
    // 縞
    ctx.strokeStyle = bk; ctx.lineWidth = Math.max(1.6, R * 0.075); ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -R * 0.42); ctx.lineTo(0, -R * 0.20);
    ctx.moveTo(-R * 0.15, -R * 0.40); ctx.lineTo(-R * 0.19, -R * 0.20);
    ctx.moveTo(R * 0.15, -R * 0.40); ctx.lineTo(R * 0.19, -R * 0.20);
    ctx.moveTo(-R * 0.46, -R * 0.12); ctx.lineTo(-R * 0.30, -R * 0.06);
    ctx.moveTo(R * 0.46, -R * 0.12); ctx.lineTo(R * 0.30, -R * 0.06);
    ctx.moveTo(-R * 0.50, R * 0.10); ctx.lineTo(-R * 0.34, R * 0.11);
    ctx.moveTo(R * 0.50, R * 0.10); ctx.lineTo(R * 0.34, R * 0.11);
    ctx.stroke();
    ctx.lineWidth = Math.max(1.2, R * 0.05);
    ctx.beginPath();
    ctx.moveTo(-R * 0.48, R * 0.28); ctx.lineTo(-R * 0.34, R * 0.25);
    ctx.moveTo(R * 0.48, R * 0.28); ctx.lineTo(R * 0.34, R * 0.25);
    ctx.stroke();
    // 目
    eye(ctx, R, -R * 0.21, R * 0.00, R * 0.105, { iris: '#f0c24a', sclera: '#b5822c' });
    eye(ctx, R, R * 0.21, R * 0.00, R * 0.105, { iris: '#f0c24a', sclera: '#b5822c' });
    nose(ctx, 0, R * 0.22, R * 0.10, R * 0.075, '#c2705f');
    mouthW(ctx, R, 0, R * 0.30, R * 0.13, 'rgba(35,26,18,.85)');
    whisk(ctx, R, -R * 0.14, R * 0.26, -1, 3, R * 0.48);
    whisk(ctx, R, R * 0.14, R * 0.26, 1, 3, R * 0.48);
  }

  // ---------- 卯 うさぎ ----------
  function u(ctx, R) {
    const fur = '#f2ead9', sh = '#d9cdb6', pink = '#dfa1ab';
    [[-0.20, -1], [0.20, 1]].forEach(([ex, s]) => {
      ctx.save();
      ctx.translate(R * ex, -R * 0.42);
      ctx.rotate(s * 0.14);
      fell(ctx, 0, 0, R * 0.14, R * 0.40, lin(ctx, 0, -R * 0.4, 0, R * 0.4, fur, sh));
      edge(ctx, R); ctx.stroke();
      fell(ctx, 0, R * 0.02, R * 0.075, R * 0.30, pink);
      ctx.restore();
    });
    ell(ctx, 0, R * 0.10, R * 0.45, R * 0.40);
    ctx.fillStyle = rad(ctx, -R * 0.16, -R * 0.10, R * 0.85, '#fffaf0', fur); ctx.fill();
    edge(ctx, R); ctx.stroke();
    fell(ctx, -R * 0.20, R * 0.26, R * 0.19, R * 0.15, '#fffaef');
    fell(ctx, R * 0.20, R * 0.26, R * 0.19, R * 0.15, '#fffaef');
    eye(ctx, R, -R * 0.20, R * 0.02, R * 0.10, { iris: '#b4404a', sclera: '#7d2a31' });
    eye(ctx, R, R * 0.20, R * 0.02, R * 0.10, { iris: '#b4404a', sclera: '#7d2a31' });
    nose(ctx, 0, R * 0.24, R * 0.075, R * 0.055, pink);
    ctx.strokeStyle = 'rgba(80,62,48,.6)'; ctx.lineWidth = Math.max(1, R * 0.035);
    ctx.beginPath(); ctx.moveTo(0, R * 0.29); ctx.lineTo(0, R * 0.36); ctx.stroke();
    mouthW(ctx, R, 0, R * 0.36, R * 0.11, 'rgba(80,62,48,.6)');
    whisk(ctx, R, -R * 0.12, R * 0.28, -1, 3, R * 0.46);
    whisk(ctx, R, R * 0.12, R * 0.28, 1, 3, R * 0.46);
  }

  // ---------- 辰 たつ ----------
  function tatsu(ctx, R) {
    const g1 = '#57997e', g2 = '#2a5a4c', gold = '#e0b544', cream = '#f4ecd6';
    // 炎のたてがみ（後ろ）
    ctx.fillStyle = '#1e4239';
    [[-0.62, -0.52], [-0.72, -0.16], [0.62, -0.52], [0.72, -0.16], [-0.30, -0.70], [0.30, -0.70]].forEach(([mx, my]) => {
      ctx.beginPath();
      ctx.moveTo(mx * R * 0.55, my * R * 0.55);
      ctx.quadraticCurveTo(mx * R * 1.35, my * R * 1.15, mx * R * 1.02, my * R * 1.45);
      ctx.quadraticCurveTo(mx * R * 0.95, my * R * 0.95, mx * R * 0.40, my * R * 0.70);
      ctx.closePath(); ctx.fill();
    });
    // 角（鹿角）
    ctx.strokeStyle = gold; ctx.lineWidth = Math.max(1.8, R * 0.075); ctx.lineCap = 'round';
    [[-1], [1]].forEach(([s0]) => {
      ctx.beginPath();
      ctx.moveTo(s0 * R * 0.24, -R * 0.36);
      ctx.quadraticCurveTo(s0 * R * 0.46, -R * 0.66, s0 * R * 0.34, -R * 0.92);
      ctx.moveTo(s0 * R * 0.40, -R * 0.62); ctx.lineTo(s0 * R * 0.66, -R * 0.74);
      ctx.moveTo(s0 * R * 0.30, -R * 0.44); ctx.lineTo(s0 * R * 0.56, -R * 0.44);
      ctx.stroke();
    });
    // 頭（額が広く、口吻が前へ出る）
    ctx.beginPath();
    ctx.moveTo(-R * 0.46, -R * 0.18);
    ctx.quadraticCurveTo(-R * 0.44, R * 0.16, -R * 0.26, R * 0.26);
    ctx.quadraticCurveTo(-R * 0.30, R * 0.62, 0, R * 0.66);
    ctx.quadraticCurveTo(R * 0.30, R * 0.62, R * 0.26, R * 0.26);
    ctx.quadraticCurveTo(R * 0.44, R * 0.16, R * 0.46, -R * 0.18);
    ctx.quadraticCurveTo(R * 0.24, -R * 0.44, 0, -R * 0.42);
    ctx.quadraticCurveTo(-R * 0.24, -R * 0.44, -R * 0.46, -R * 0.18);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, -R * 0.16, -R * 0.22, R * 0.98, g1, g2); ctx.fill();
    edge(ctx, R); ctx.stroke();
    // うろこ
    ctx.strokeStyle = 'rgba(232,255,242,.28)'; ctx.lineWidth = Math.max(1, R * 0.022);
    for (let r0 = 0; r0 < 3; r0++) for (let c0 = -2; c0 <= 2; c0++) {
      ctx.beginPath();
      ctx.arc(c0 * R * 0.15 + (r0 % 2) * R * 0.07, -R * 0.30 + r0 * R * 0.12, R * 0.07, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    // 口吻と開いた口
    ctx.fillStyle = lin(ctx, 0, R * 0.22, 0, R * 0.68, '#66ab8e', g2);
    ctx.beginPath();
    ctx.moveTo(-R * 0.24, R * 0.30);
    ctx.quadraticCurveTo(-R * 0.26, R * 0.62, 0, R * 0.64);
    ctx.quadraticCurveTo(R * 0.26, R * 0.62, R * 0.24, R * 0.30);
    ctx.quadraticCurveTo(0, R * 0.20, -R * 0.24, R * 0.30);
    ctx.closePath(); ctx.fill(); edge(ctx, R, 0.4); ctx.stroke();
    fell(ctx, -R * 0.09, R * 0.34, R * 0.04, R * 0.05, '#12312a');
    fell(ctx, R * 0.09, R * 0.34, R * 0.04, R * 0.05, '#12312a');
    ctx.fillStyle = '#5c2a26';
    ctx.beginPath();
    ctx.moveTo(-R * 0.18, R * 0.48);
    ctx.quadraticCurveTo(0, R * 0.70, R * 0.18, R * 0.48);
    ctx.quadraticCurveTo(0, R * 0.44, -R * 0.18, R * 0.48);
    ctx.closePath(); ctx.fill();
    // 牙
    ctx.fillStyle = cream;
    poly(ctx, [[-R * 0.17, R * 0.47], [-R * 0.10, R * 0.47], [-R * 0.13, R * 0.61]]); ctx.fill();
    poly(ctx, [[R * 0.17, R * 0.47], [R * 0.10, R * 0.47], [R * 0.13, R * 0.61]]); ctx.fill();
    // ひげ
    ctx.strokeStyle = gold; ctx.lineWidth = Math.max(1.2, R * 0.042);
    ctx.beginPath();
    ctx.moveTo(-R * 0.22, R * 0.36);
    ctx.bezierCurveTo(-R * 0.58, R * 0.34, -R * 0.66, R * 0.00, -R * 0.92, R * 0.06);
    ctx.moveTo(R * 0.22, R * 0.36);
    ctx.bezierCurveTo(R * 0.58, R * 0.34, R * 0.66, R * 0.00, R * 0.92, R * 0.06);
    ctx.stroke();
    // 白い眉
    ctx.fillStyle = cream;
    ctx.beginPath();
    ctx.moveTo(-R * 0.40, -R * 0.22); ctx.quadraticCurveTo(-R * 0.22, -R * 0.26, -R * 0.09, -R * 0.10);
    ctx.quadraticCurveTo(-R * 0.24, -R * 0.14, -R * 0.38, -R * 0.06);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(R * 0.40, -R * 0.22); ctx.quadraticCurveTo(R * 0.22, -R * 0.26, R * 0.09, -R * 0.10);
    ctx.quadraticCurveTo(R * 0.24, -R * 0.14, R * 0.38, -R * 0.06);
    ctx.closePath(); ctx.fill();
    // 目
    eye(ctx, R, -R * 0.22, R * 0.04, R * 0.11, { iris: '#f5cf46', sclera: '#a8761c', slit: true });
    eye(ctx, R, R * 0.22, R * 0.04, R * 0.11, { iris: '#f5cf46', sclera: '#a8761c', slit: true });
  }

  // ---------- 巳 へび ----------
  function mi(ctx, R) {
    const sk1 = '#8a9440', sk2 = '#5c6428', belly = '#ddd0a0';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // とぐろ（後ろ）
    const cy = R * 0.34;
    [[R * 0.62, R * 0.30, sk2], [R * 0.36, R * 0.26, sk1], [R * 0.13, R * 0.24, sk2]].forEach(([rr, w, col]) => {
      ctx.beginPath();
      ctx.arc(0, cy, rr, Math.PI * 0.05, Math.PI * 1.92);
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, cy, rr, Math.PI * 0.22, Math.PI * 0.80);
      ctx.strokeStyle = belly; ctx.lineWidth = w * 0.40; ctx.stroke();
    });
    ctx.fillStyle = 'rgba(30,38,14,.40)';
    for (let i = 0; i < 18; i++) {
      const a = i * 0.72, rr = R * (0.36 + (i % 2) * 0.26);
      ell(ctx, Math.cos(a) * rr, cy + Math.sin(a) * rr, R * 0.055, R * 0.035, 0, a);
      ctx.fill();
    }
    // 首から頭（前面）
    ctx.strokeStyle = sk1; ctx.lineWidth = R * 0.26;
    ctx.beginPath();
    ctx.moveTo(R * 0.40, R * 0.16);
    ctx.quadraticCurveTo(R * 0.30, -R * 0.26, -R * 0.02, -R * 0.36);
    ctx.stroke();
    // 頭
    ctx.save();
    ctx.translate(-R * 0.06, -R * 0.50);
    ctx.rotate(-0.12);
    ctx.beginPath();
    ctx.moveTo(-R * 0.34, R * 0.08);
    ctx.quadraticCurveTo(-R * 0.38, -R * 0.26, 0, -R * 0.32);
    ctx.quadraticCurveTo(R * 0.38, -R * 0.26, R * 0.34, R * 0.08);
    ctx.quadraticCurveTo(R * 0.18, R * 0.30, 0, R * 0.30);
    ctx.quadraticCurveTo(-R * 0.18, R * 0.30, -R * 0.34, R * 0.08);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, -R * 0.08, -R * 0.14, R * 0.62, '#a7b158', sk2); ctx.fill();
    edge(ctx, R); ctx.stroke();
    eye(ctx, R, -R * 0.17, -R * 0.06, R * 0.095, { iris: '#eec83e', sclera: '#8a6a14', slit: true });
    eye(ctx, R, R * 0.17, -R * 0.06, R * 0.095, { iris: '#eec83e', sclera: '#8a6a14', slit: true });
    fell(ctx, -R * 0.08, R * 0.16, R * 0.03, R * 0.022, '#26300f');
    fell(ctx, R * 0.08, R * 0.16, R * 0.03, R * 0.022, '#26300f');
    ctx.strokeStyle = 'rgba(38,48,15,.6)'; ctx.lineWidth = Math.max(1, R * 0.03);
    ctx.beginPath(); ctx.moveTo(-R * 0.22, R * 0.22); ctx.quadraticCurveTo(0, R * 0.30, R * 0.22, R * 0.22); ctx.stroke();
    ctx.strokeStyle = '#c23a33'; ctx.lineWidth = Math.max(1.2, R * 0.035);
    ctx.beginPath();
    ctx.moveTo(0, R * 0.26); ctx.lineTo(0, R * 0.44);
    ctx.moveTo(0, R * 0.44); ctx.lineTo(-R * 0.11, R * 0.56);
    ctx.moveTo(0, R * 0.44); ctx.lineTo(R * 0.11, R * 0.56);
    ctx.stroke();
    ctx.restore();
  }

  // ---------- 午 うま ----------
  function uma(ctx, R) {
    const fur = '#9b6034', mane = '#3a2718', blaze = '#f2e9d6';
    // たてがみ（耳の後ろ・頭頂から左右へ）
    ctx.fillStyle = mane;
    ctx.beginPath();
    ctx.moveTo(-R * 0.26, -R * 0.44);
    ctx.quadraticCurveTo(-R * 0.56, -R * 0.46, -R * 0.44, -R * 0.10);
    ctx.quadraticCurveTo(-R * 0.38, -R * 0.34, -R * 0.22, -R * 0.34);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(R * 0.26, -R * 0.44);
    ctx.quadraticCurveTo(R * 0.56, -R * 0.46, R * 0.44, -R * 0.10);
    ctx.quadraticCurveTo(R * 0.38, -R * 0.34, R * 0.22, -R * 0.34);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-R * 0.24, -R * 0.42);
    ctx.quadraticCurveTo(0, -R * 0.72, R * 0.24, -R * 0.42);
    ctx.quadraticCurveTo(0, -R * 0.54, -R * 0.24, -R * 0.42);
    ctx.closePath(); ctx.fill();
    // 耳（細く高い）
    ctx.fillStyle = fur;
    poly(ctx, [[-R * 0.32, -R * 0.36], [-R * 0.38, -R * 0.80], [-R * 0.16, -R * 0.44]]); ctx.fill();
    edge(ctx, R); ctx.stroke();
    poly(ctx, [[R * 0.32, -R * 0.36], [R * 0.38, -R * 0.80], [R * 0.16, -R * 0.44]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c99d7a';
    poly(ctx, [[-R * 0.29, -R * 0.42], [-R * 0.34, -R * 0.70], [-R * 0.21, -R * 0.46]]); ctx.fill();
    poly(ctx, [[R * 0.29, -R * 0.42], [R * 0.34, -R * 0.70], [R * 0.21, -R * 0.46]]); ctx.fill();
    // 長い顔
    ctx.beginPath();
    ctx.moveTo(-R * 0.34, -R * 0.32);
    ctx.quadraticCurveTo(-R * 0.36, R * 0.10, -R * 0.22, R * 0.42);
    ctx.quadraticCurveTo(-R * 0.20, R * 0.68, 0, R * 0.70);
    ctx.quadraticCurveTo(R * 0.20, R * 0.68, R * 0.22, R * 0.42);
    ctx.quadraticCurveTo(R * 0.36, R * 0.10, R * 0.34, -R * 0.32);
    ctx.quadraticCurveTo(R * 0.17, -R * 0.52, 0, -R * 0.52);
    ctx.quadraticCurveTo(-R * 0.17, -R * 0.52, -R * 0.34, -R * 0.32);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, -R * 0.14, -R * 0.24, R * 1.0, '#b5794a', fur); ctx.fill();
    edge(ctx, R); ctx.stroke();
    // 前髪
    ctx.fillStyle = mane;
    ctx.beginPath();
    ctx.moveTo(-R * 0.22, -R * 0.44);
    ctx.quadraticCurveTo(-R * 0.04, -R * 0.20, -R * 0.14, -R * 0.14);
    ctx.quadraticCurveTo(R * 0.06, -R * 0.22, R * 0.16, -R * 0.12);
    ctx.quadraticCurveTo(R * 0.14, -R * 0.36, R * 0.22, -R * 0.44);
    ctx.quadraticCurveTo(0, -R * 0.56, -R * 0.22, -R * 0.44);
    ctx.closePath(); ctx.fill();
    // 流星
    ctx.fillStyle = blaze;
    ctx.beginPath();
    ctx.moveTo(-R * 0.05, -R * 0.16);
    ctx.quadraticCurveTo(-R * 0.11, R * 0.14, -R * 0.14, R * 0.46);
    ctx.quadraticCurveTo(0, R * 0.58, R * 0.14, R * 0.46);
    ctx.quadraticCurveTo(R * 0.11, R * 0.14, R * 0.05, -R * 0.16);
    ctx.closePath(); ctx.fill();
    // 鼻
    fell(ctx, -R * 0.10, R * 0.46, R * 0.05, R * 0.07, '#5a3722', -0.25);
    fell(ctx, R * 0.10, R * 0.46, R * 0.05, R * 0.07, '#5a3722', 0.25);
    ctx.strokeStyle = 'rgba(60,40,26,.6)'; ctx.lineWidth = Math.max(1, R * 0.035);
    ctx.beginPath(); ctx.moveTo(-R * 0.12, R * 0.60); ctx.quadraticCurveTo(0, R * 0.65, R * 0.12, R * 0.60); ctx.stroke();
    // 目
    eye(ctx, R, -R * 0.26, -R * 0.06, R * 0.105, { iris: '#3a2416', sclera: '#1d130c', w: 1.1 });
    eye(ctx, R, R * 0.26, -R * 0.06, R * 0.105, { iris: '#3a2416', sclera: '#1d130c', w: 1.1 });
  }

  // ---------- 未 ひつじ ----------
  function hitsuji(ctx, R) {
    const wool = '#f2ecdd', wool2 = '#d8cfba', face = '#e2d3b6';
    // 羊毛
    ctx.fillStyle = wool;
    const puffs = [[-0.46, -0.18, 0.28], [0.46, -0.18, 0.28], [-0.30, -0.46, 0.26], [0.30, -0.46, 0.26],
      [0, -0.56, 0.27], [-0.54, 0.12, 0.24], [0.54, 0.12, 0.24], [0, -0.30, 0.34]];
    puffs.forEach(([px, py, pr]) => { ell(ctx, R * px, R * py, R * pr, R * pr); ctx.fill(); });
    ctx.strokeStyle = 'rgba(120,104,78,.35)'; ctx.lineWidth = Math.max(1, R * 0.03);
    puffs.forEach(([px, py, pr]) => { ell(ctx, R * px, R * py, R * pr, R * pr); ctx.stroke(); });
    ctx.fillStyle = wool2;
    puffs.forEach(([px, py, pr], i) => { if (i % 2) { ell(ctx, R * px, R * (py + 0.05), R * pr * 0.6, R * pr * 0.5); ctx.fill(); } });
    // 角（巻き角）
    ctx.strokeStyle = '#c9b184'; ctx.lineWidth = Math.max(1.6, R * 0.09); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(-R * 0.40, -R * 0.22, R * 0.20, -0.2, 3.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(R * 0.40, -R * 0.22, R * 0.20, -0.35 + Math.PI * 0.5, 3.4 + Math.PI * 0.5); ctx.stroke();
    // 耳
    fell(ctx, -R * 0.50, R * 0.14, R * 0.19, R * 0.10, face, -0.55);
    edge(ctx, R, 0.35); ctx.stroke();
    fell(ctx, R * 0.50, R * 0.14, R * 0.19, R * 0.10, face, 0.55);
    ctx.stroke();
    // 顔
    ell(ctx, 0, R * 0.18, R * 0.32, R * 0.34);
    ctx.fillStyle = rad(ctx, -R * 0.10, R * 0.02, R * 0.60, '#efe3ca', face); ctx.fill();
    edge(ctx, R, 0.40); ctx.stroke();
    eye(ctx, R, -R * 0.14, R * 0.10, R * 0.085, { iris: '#4c3a24', sclera: '#241a10', w: 1.15 });
    eye(ctx, R, R * 0.14, R * 0.10, R * 0.085, { iris: '#4c3a24', sclera: '#241a10', w: 1.15 });
    nose(ctx, 0, R * 0.34, R * 0.07, R * 0.05, '#a08468');
    mouthW(ctx, R, 0, R * 0.42, R * 0.10, 'rgba(90,72,52,.7)');
  }

  // ---------- 申 さる ----------
  function saru(ctx, R) {
    const fur = '#9b7a52', fur2 = '#6f5436', skin = '#d98a7e', skin2 = '#c2695e';
    // 耳
    [[-1], [1]].forEach(([s]) => {
      fell(ctx, s * R * 0.50, R * 0.02, R * 0.16, R * 0.19, skin);
      edge(ctx, R); ctx.stroke();
      fell(ctx, s * R * 0.50, R * 0.02, R * 0.08, R * 0.10, skin2);
    });
    // 毛のふち
    ell(ctx, 0, 0, R * 0.52, R * 0.48);
    ctx.fillStyle = rad(ctx, -R * 0.18, -R * 0.22, R * 0.95, '#b08d60', fur); ctx.fill();
    edge(ctx, R); ctx.stroke();
    furlines(ctx, R, 0, 0, R * 0.50, R * 0.46, 30, fur2, 0.45);
    // 顔（赤い）
    ctx.beginPath();
    ctx.moveTo(-R * 0.30, -R * 0.16);
    ctx.quadraticCurveTo(-R * 0.36, R * 0.22, -R * 0.16, R * 0.40);
    ctx.quadraticCurveTo(0, R * 0.50, R * 0.16, R * 0.40);
    ctx.quadraticCurveTo(R * 0.36, R * 0.22, R * 0.30, -R * 0.16);
    ctx.quadraticCurveTo(R * 0.16, -R * 0.32, 0, -R * 0.32);
    ctx.quadraticCurveTo(-R * 0.16, -R * 0.32, -R * 0.30, -R * 0.16);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, -R * 0.10, -R * 0.14, R * 0.65, '#e79f92', skin); ctx.fill();
    edge(ctx, R, 0.35); ctx.stroke();
    eye(ctx, R, -R * 0.15, -R * 0.06, R * 0.085, { iris: '#3a2414', sclera: '#1c1209' });
    eye(ctx, R, R * 0.15, -R * 0.06, R * 0.085, { iris: '#3a2414', sclera: '#1c1209' });
    ctx.fillStyle = 'rgba(120,60,50,.5)';
    fell(ctx, -R * 0.05, R * 0.16, R * 0.025, R * 0.02, 'rgba(120,60,50,.6)');
    fell(ctx, R * 0.05, R * 0.16, R * 0.025, R * 0.02, 'rgba(120,60,50,.6)');
    ctx.strokeStyle = 'rgba(120,60,50,.75)'; ctx.lineWidth = Math.max(1, R * 0.04);
    ctx.beginPath(); ctx.arc(0, R * 0.22, R * 0.13, 0.25, Math.PI - 0.25); ctx.stroke();
  }

  // ---------- 酉 とり ----------
  function tori(ctx, R) {
    const fe = '#f2e3c2', fe2 = '#d6bd8c', comb = '#c4392c', beak = '#e0a832';
    // 首の羽
    ctx.fillStyle = fe2;
    ctx.beginPath();
    ctx.moveTo(-R * 0.44, R * 0.16);
    ctx.quadraticCurveTo(-R * 0.66, R * 0.52, -R * 0.24, R * 0.70);
    ctx.quadraticCurveTo(0, R * 0.80, R * 0.24, R * 0.70);
    ctx.quadraticCurveTo(R * 0.66, R * 0.52, R * 0.44, R * 0.16);
    ctx.closePath(); ctx.fill(); edge(ctx, R); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,90,50,.5)'; ctx.lineWidth = Math.max(1, R * 0.025);
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * R * 0.10, R * 0.26);
      ctx.quadraticCurveTo(i * R * 0.16, R * 0.52, i * R * 0.13, R * 0.70);
      ctx.stroke();
    }
    // とさか
    ctx.fillStyle = comb;
    ctx.beginPath();
    ctx.moveTo(-R * 0.20, -R * 0.34);
    ctx.quadraticCurveTo(-R * 0.24, -R * 0.66, -R * 0.02, -R * 0.56);
    ctx.quadraticCurveTo(R * 0.04, -R * 0.82, R * 0.20, -R * 0.60);
    ctx.quadraticCurveTo(R * 0.34, -R * 0.78, R * 0.36, -R * 0.42);
    ctx.quadraticCurveTo(R * 0.20, -R * 0.30, -R * 0.20, -R * 0.34);
    ctx.closePath(); ctx.fill(); edge(ctx, R, 0.4); ctx.stroke();
    // 頭
    ell(ctx, 0, R * 0.00, R * 0.40, R * 0.38);
    ctx.fillStyle = rad(ctx, -R * 0.14, -R * 0.16, R * 0.75, '#fdf6e4', fe); ctx.fill();
    edge(ctx, R); ctx.stroke();
    // くちばし
    ctx.fillStyle = beak;
    poly(ctx, [[R * 0.24, R * 0.02], [R * 0.72, R * 0.14], [R * 0.24, R * 0.22]]); ctx.fill();
    edge(ctx, R, 0.4); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,60,20,.6)'; ctx.lineWidth = Math.max(1, R * 0.028);
    ctx.beginPath(); ctx.moveTo(R * 0.26, R * 0.13); ctx.lineTo(R * 0.68, R * 0.14); ctx.stroke();
    // 肉垂
    ctx.fillStyle = comb;
    ell(ctx, R * 0.26, R * 0.34, R * 0.11, R * 0.17); ctx.fill();
    ell(ctx, R * 0.10, R * 0.34, R * 0.10, R * 0.15); ctx.fill();
    // 目
    eye(ctx, R, R * 0.02, -R * 0.06, R * 0.105, { iris: '#e0a832', sclera: '#8a5c12' });
  }

  // ---------- 戌 いぬ ----------
  function inu(ctx, R) {
    const fur = '#d99a4e', fur2 = '#b87a33', cream = '#f7efdc';
    // 耳
    ctx.fillStyle = fur;
    poly(ctx, [[-R * 0.48, -R * 0.14], [-R * 0.50, -R * 0.66], [-R * 0.10, -R * 0.34]]); ctx.fill();
    edge(ctx, R); ctx.stroke();
    poly(ctx, [[R * 0.48, -R * 0.14], [R * 0.50, -R * 0.66], [R * 0.10, -R * 0.34]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8b892';
    poly(ctx, [[-R * 0.42, -R * 0.20], [-R * 0.44, -R * 0.56], [-R * 0.18, -R * 0.34]]); ctx.fill();
    poly(ctx, [[R * 0.42, -R * 0.20], [R * 0.44, -R * 0.56], [R * 0.18, -R * 0.34]]); ctx.fill();
    // 頭
    ell(ctx, 0, R * 0.02, R * 0.48, R * 0.43);
    ctx.fillStyle = rad(ctx, -R * 0.18, -R * 0.20, R * 0.95, '#efb469', fur); ctx.fill();
    edge(ctx, R); ctx.stroke();
    // 白い頬
    ctx.fillStyle = cream;
    ctx.beginPath();
    ctx.moveTo(-R * 0.44, R * 0.10);
    ctx.quadraticCurveTo(-R * 0.36, R * 0.44, 0, R * 0.46);
    ctx.quadraticCurveTo(R * 0.36, R * 0.44, R * 0.44, R * 0.10);
    ctx.quadraticCurveTo(R * 0.22, R * 0.22, 0, R * 0.20);
    ctx.quadraticCurveTo(-R * 0.22, R * 0.22, -R * 0.44, R * 0.10);
    ctx.closePath(); ctx.fill();
    ell(ctx, 0, R * 0.22, R * 0.22, R * 0.20); ctx.fill();
    // 白眉
    fell(ctx, -R * 0.23, -R * 0.20, R * 0.09, R * 0.06, cream);
    fell(ctx, R * 0.23, -R * 0.20, R * 0.09, R * 0.06, cream);
    // 目
    eye(ctx, R, -R * 0.21, -R * 0.03, R * 0.10, { iris: '#3a2414', sclera: '#180f08' });
    eye(ctx, R, R * 0.21, -R * 0.03, R * 0.10, { iris: '#3a2414', sclera: '#180f08' });
    nose(ctx, 0, R * 0.19, R * 0.10, R * 0.075, '#1f1811');
    // 口と舌
    ctx.strokeStyle = 'rgba(31,24,17,.85)'; ctx.lineWidth = Math.max(1, R * 0.045);
    ctx.beginPath();
    ctx.moveTo(0, R * 0.26); ctx.lineTo(0, R * 0.31);
    ctx.stroke();
    mouthW(ctx, R, 0, R * 0.31, R * 0.14, 'rgba(31,24,17,.85)');
    ctx.fillStyle = '#e08d92';
    ctx.beginPath();
    ctx.moveTo(-R * 0.09, R * 0.34);
    ctx.quadraticCurveTo(0, R * 0.56, R * 0.09, R * 0.34);
    ctx.closePath(); ctx.fill();
  }

  // ---------- 亥 いのしし ----------
  function i(ctx, R) {
    const fur = '#6d5a45', fur2 = '#4b3c2c', snout = '#a08a70', tusk = '#f2ead6';
    // 背のたてがみ
    ctx.fillStyle = fur2;
    for (let n = -4; n <= 4; n++) {
      poly(ctx, [[n * R * 0.11 - R * 0.05, -R * 0.34], [n * R * 0.11, -R * 0.74], [n * R * 0.11 + R * 0.05, -R * 0.34]]);
      ctx.fill();
    }
    // 耳
    ctx.fillStyle = fur;
    poly(ctx, [[-R * 0.44, -R * 0.18], [-R * 0.52, -R * 0.56], [-R * 0.14, -R * 0.34]]); ctx.fill();
    edge(ctx, R); ctx.stroke();
    poly(ctx, [[R * 0.44, -R * 0.18], [R * 0.52, -R * 0.56], [R * 0.14, -R * 0.34]]); ctx.fill(); ctx.stroke();
    // 頭
    ctx.beginPath();
    ctx.moveTo(-R * 0.50, -R * 0.10);
    ctx.quadraticCurveTo(-R * 0.46, R * 0.28, -R * 0.24, R * 0.42);
    ctx.quadraticCurveTo(0, R * 0.54, R * 0.24, R * 0.42);
    ctx.quadraticCurveTo(R * 0.46, R * 0.28, R * 0.50, -R * 0.10);
    ctx.quadraticCurveTo(R * 0.26, -R * 0.44, 0, -R * 0.44);
    ctx.quadraticCurveTo(-R * 0.26, -R * 0.44, -R * 0.50, -R * 0.10);
    ctx.closePath();
    ctx.fillStyle = rad(ctx, -R * 0.18, -R * 0.22, R * 0.95, '#8a7359', fur); ctx.fill();
    edge(ctx, R); ctx.stroke();
    furlines(ctx, R, 0, R * 0.02, R * 0.46, R * 0.40, 26, fur2, 0.4);
    // 牙
    ctx.fillStyle = tusk;
    ctx.beginPath();
    ctx.moveTo(-R * 0.26, R * 0.36);
    ctx.quadraticCurveTo(-R * 0.40, R * 0.24, -R * 0.36, R * 0.04);
    ctx.quadraticCurveTo(-R * 0.26, R * 0.22, -R * 0.18, R * 0.34);
    ctx.closePath(); ctx.fill(); edge(ctx, R, 0.4); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(R * 0.26, R * 0.36);
    ctx.quadraticCurveTo(R * 0.40, R * 0.24, R * 0.36, R * 0.04);
    ctx.quadraticCurveTo(R * 0.26, R * 0.22, R * 0.18, R * 0.34);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 鼻づら
    fell(ctx, 0, R * 0.36, R * 0.23, R * 0.18, lin(ctx, 0, R * 0.18, 0, R * 0.54, '#b59c80', snout));
    edge(ctx, R, 0.4); ctx.stroke();
    fell(ctx, -R * 0.09, R * 0.35, R * 0.045, R * 0.055, '#3a2e22');
    fell(ctx, R * 0.09, R * 0.35, R * 0.045, R * 0.055, '#3a2e22');
    // 目
    eye(ctx, R, -R * 0.24, -R * 0.06, R * 0.085, { iris: '#38281a', sclera: '#1a1209', w: 1.1 });
    eye(ctx, R, R * 0.24, -R * 0.06, R * 0.085, { iris: '#38281a', sclera: '#1a1209', w: 1.1 });
  }

  // ---------- 猫（十三番目） ----------
  function neko(ctx, R) {
    const fur = '#f4ecdc', or1 = '#e0954a', bk = '#3a332b';
    // 耳
    ctx.fillStyle = or1;
    poly(ctx, [[-R * 0.46, -R * 0.18], [-R * 0.52, -R * 0.62], [-R * 0.12, -R * 0.38]]); ctx.fill();
    edge(ctx, R); ctx.stroke();
    ctx.fillStyle = bk;
    poly(ctx, [[R * 0.46, -R * 0.18], [R * 0.52, -R * 0.62], [R * 0.12, -R * 0.38]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8a9ae';
    poly(ctx, [[-R * 0.40, -R * 0.24], [-R * 0.44, -R * 0.52], [-R * 0.20, -R * 0.38]]); ctx.fill();
    poly(ctx, [[R * 0.40, -R * 0.24], [R * 0.44, -R * 0.52], [R * 0.20, -R * 0.38]]); ctx.fill();
    // 頭
    ell(ctx, 0, R * 0.04, R * 0.48, R * 0.43);
    ctx.fillStyle = rad(ctx, -R * 0.16, -R * 0.18, R * 0.92, '#fffaef', fur); ctx.fill();
    edge(ctx, R); ctx.stroke();
    // 三毛の斑
    ctx.save();
    ell(ctx, 0, R * 0.04, R * 0.48, R * 0.43); ctx.clip();
    ctx.fillStyle = or1;
    ell(ctx, -R * 0.34, -R * 0.14, R * 0.24, R * 0.22); ctx.fill();
    ctx.fillStyle = bk;
    ell(ctx, R * 0.32, -R * 0.06, R * 0.22, R * 0.24); ctx.fill();
    ctx.fillStyle = or1;
    ell(ctx, R * 0.18, R * 0.40, R * 0.18, R * 0.14); ctx.fill();
    ctx.restore();
    eye(ctx, R, -R * 0.20, R * 0.00, R * 0.105, { iris: '#7fbb63', sclera: '#3f6b2f', slit: true });
    eye(ctx, R, R * 0.20, R * 0.00, R * 0.105, { iris: '#7fbb63', sclera: '#3f6b2f', slit: true });
    nose(ctx, 0, R * 0.22, R * 0.085, R * 0.065, '#dd919a');
    mouthW(ctx, R, 0, R * 0.30, R * 0.12, 'rgba(58,51,43,.85)');
    whisk(ctx, R, -R * 0.14, R * 0.26, -1, 3, R * 0.50);
    whisk(ctx, R, R * 0.14, R * 0.26, 1, 3, R * 0.50);
  }

  const FNS = [ne, ushi, tora, u, tatsu, mi, uma, hitsuji, saru, tori, inu, i];

  function drawEtoAnimal(ctx, k, R) {
    const fn = FNS[k];
    if (!fn) return;
    ctx.save();
    fn(ctx, R);
    ctx.restore();
  }
  function drawNeko(ctx, R) {
    ctx.save(); neko(ctx, R); ctx.restore();
  }

  /* 実際に描かれた範囲を測る（12体の見かけを揃えるため） */
  function alphaBounds(g, W) {
    let d;
    try { d = g.getImageData(0, 0, W, W).data } catch (e) { return null }
    let x0 = W, y0 = W, x1 = -1, y1 = -1;
    for (let y = 0; y < W; y++) {
      for (let x = 0; x < W; x++) {
        if (d[(y * W + x) * 4 + 3] > 12) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    return x1 < 0 ? null : { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  function bakeOne(drawer, size, fill) {
    const W = 320;
    const work = document.createElement('canvas');
    work.width = work.height = W;
    const g = work.getContext('2d');
    g.save(); g.translate(W / 2, W / 2); drawer(g, W * 0.30); g.restore();
    const bb = alphaBounds(g, W);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const cg = c.getContext('2d');
    if (!bb) { cg.drawImage(work, 0, 0, size, size); return c }
    const s = (size * (fill || 0.98)) / Math.max(bb.w, bb.h);
    cg.imageSmoothingQuality = 'high';
    cg.drawImage(work, bb.x0, bb.y0, bb.w, bb.h,
      (size - bb.w * s) / 2, (size - bb.h * s) / 2, bb.w * s, bb.h * s);
    return c;
  }

  function bakeEtoSprites(size) {
    const out = [];
    for (let k = 0; k < 12; k++) out.push(bakeOne((g, R) => drawEtoAnimal(g, k, R), size));
    return out;
  }
  function bakeNekoSprite(size) {
    return bakeOne(drawNeko, size);
  }

  global.drawEtoAnimal = drawEtoAnimal;
  global.drawNeko = drawNeko;
  global.bakeEtoSprites = bakeEtoSprites;
  global.bakeNekoSprite = bakeNekoSprite;
})(typeof window !== 'undefined' ? window : globalThis);
