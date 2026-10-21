"use strict";

window.FROSTLINE_STAGES = {
  timelines: [
    [
      [1, "formation"], [5, "zig"], [9, "formation"], [13, "snipers"],
      [18, "dodge"], [25, "mid"], [39, "rest"], [45, "rush"], [52, "boss"]
    ],
    [
      [1, "zig"], [4, "formation"], [8, "snipers"], [13, "rush"],
      [18, "dodge"], [24, "mid"], [37, "rest"], [43, "rush"], [49, "boss"]
    ]
  ]
};

window.startFrostlineStage2 = function startFrostlineStage2() {
  stageNumber = 2;
  stageTime = 0;
  eventIndex = 0;
  bossPending = false;
  warningTimer = 0;
  finalizing = false;
  currentBoss = null;
  state = "playing";
  [shots, enemyBullets, enemies, particles, items].forEach(clearPool);
  player.hp = Math.min(100, player.hp + 35);
  player.bombs = Math.min(5, player.bombs + 1);
  player.invuln = 2.2;
  player.x = W / 2;
  player.y = H * .78;
  player.tx = player.x;
  player.ty = player.y;
  ui.bossHud.classList.add("hidden");
  ui.warning.classList.add("hidden");
  pulseMessage("STAGE 2\nAURORA VOLCANO", 2.6);
  sound.se("phase");
  shakeScreen(6, .5);
};

window.fireStage2Pattern = function fireStage2Pattern(enemy, scale, targetAngle, spawn) {
  const x = enemy.x;
  const y = enemy.y + (enemy.type === "boss" ? 30 : 0);
  if (enemy.type === "scout") {
    spawn(x, y, targetAngle - .18, 172 * scale, 2);
    spawn(x, y, targetAngle + .18, 172 * scale, 2);
  } else if (enemy.type === "zig") {
    for (let i = -2; i <= 2; i += 1) {
      spawn(x, y, Math.PI / 2 + i * .24 + Math.sin(enemy.age * 2) * .12, 132 * scale, i % 2 ? 1 : 0);
    }
  } else if (enemy.type === "sniper") {
    spawn(x, y, targetAngle, 265 * scale, 2);
    spawn(x, y, targetAngle - .1, 185 * scale, 1);
    spawn(x, y, targetAngle + .1, 185 * scale, 1);
  } else if (enemy.type === "tank") {
    const turn = Math.floor(enemy.age * 1.5);
    for (let i = 0; i < 12; i += 1) {
      if ((i + turn) % 4 !== 0) spawn(x, y, Math.PI * 2 * i / 12 - enemy.age * .45, 112 * scale, i % 2);
    }
  } else if (enemy.type === "mid") {
    for (let side = -1; side <= 1; side += 2) {
      for (let i = -2; i <= 2; i += 1) {
        spawn(x + side * 25, y + 14, targetAngle + side * .38 + i * .13, (138 + Math.abs(i) * 16) * scale, side > 0 ? 2 : 1);
      }
    }
  } else if (enemy.type === "boss" && enemy.phase === 1) {
    for (let i = 0; i < 8; i += 1) {
      const helix = Math.PI * 2 * i / 8 - enemy.age * .55;
      spawn(x, y, helix, 102 * scale, 1);
      spawn(x, y, helix + Math.PI / 8, 164 * scale, 2);
    }
  } else if (enemy.type === "boss" && enemy.phase === 2) {
    const gate = Math.floor(enemy.age * 1.4) % 5 - 2;
    for (let i = -4; i <= 4; i += 1) {
      if (i !== gate && i !== gate + 1) spawn(x + i * 16, y, Math.PI / 2 + Math.sin(enemy.age) * .08, 178 * scale, i % 2 ? 1 : 2);
    }
    spawn(x - 38, y, targetAngle - .12, 210 * scale, 2);
    spawn(x + 38, y, targetAngle + .12, 210 * scale, 2);
  } else if (enemy.type === "boss") {
    for (let i = 0; i < 18; i += 1) {
      const bloom = Math.PI * 2 * i / 18 + enemy.age * .72;
      const fromSafeLane = Math.abs(Math.atan2(Math.sin(bloom - targetAngle), Math.cos(bloom - targetAngle)));
      if (fromSafeLane > .36) spawn(x, y, bloom, (142 + i % 3 * 22) * scale, i % 3 === 0 ? 2 : 0);
    }
  }
};

window.drawStage2Sky = function drawStage2Sky(render, width, height, scroll) {
  render.save();
  render.globalAlpha = .24;
  render.lineWidth = 22;
  for (let band = 0; band < 3; band += 1) {
    render.strokeStyle = band === 0 ? "#62ffd2" : band === 1 ? "#c460ff" : "#ff7048";
    render.beginPath();
    for (let x = -30; x <= width + 30; x += 24) {
      const y = height * (.18 + band * .11) + Math.sin(x * .018 + scroll * .012 + band) * 32;
      if (x === -30) render.moveTo(x, y);
      else render.lineTo(x, y);
    }
    render.stroke();
  }
  render.globalAlpha = .7;
  render.fillStyle = "#ff8b49";
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 83 + scroll * (1 + i % 3)) % (width + 20) - 10;
    const y = (i * 137 + scroll * 1.8) % height;
    render.fillRect(x, y, 2 + i % 3, 5 + i % 5);
  }
  render.restore();
};
