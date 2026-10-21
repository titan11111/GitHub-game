// 描画オーケストレーション

function _drawGround(stage, stageNum) {
  // ベース地面
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, 350, canvas.width, 100);

  // 上端エッジ（光が当たる感）
  const edgeColor = stage.ground === '#90EE90' ? '#B8FFB0' : '#888';
  ctx.fillStyle = edgeColor;
  ctx.fillRect(0, 350, canvas.width, 2);

  // ステージ別テクスチャ
  const camOff = camera.x % 80;
  if (stageNum === 1) {
    // 草むら: 緑の帯
    ctx.fillStyle = '#7CCD7C';
    for (let i = 0; i < canvas.width + 80; i += 40) {
      ctx.fillRect(i - camOff, 350, 20, 6);
      ctx.fillRect(i + 20 - camOff, 356, 20, 4);
    }
  } else if (stageNum === 2) {
    // 夕暮れの通学路: アスファルト + 白線
    ctx.fillStyle = '#505050';
    for (let i = 0; i < canvas.width + 80; i += 80) {
      ctx.fillRect(i - camOff, 351, 40, 3);
      ctx.fillRect(i + 40 - camOff, 353, 40, 2);
    }
    ctx.fillStyle = '#DADADA';
    for (let i = 0; i < canvas.width + 80; i += 120) {
      ctx.fillRect(i - camOff, 366, 50, 3);
    }
  } else if (stageNum === 3) {
    // 夜の石畳
    ctx.fillStyle = '#4B5563';
    for (let i = 0; i < canvas.width + 80; i += 44) {
      const blockY = (Math.floor(i / 44) % 2 === 0) ? 350 : 356;
      ctx.fillRect(i - camOff, blockY, 40, 12);
    }
    ctx.fillStyle = '#2F3542';
    ctx.fillRect(0, 364, canvas.width, 2);
  } else {
    // ダンジョン・オフィス: 石板タイル
    ctx.fillStyle = '#3a3a4a';
    for (let i = 0; i < canvas.width + 80; i += 40) {
      ctx.fillRect(i - camOff, 350, 38, 3);
    }
    ctx.fillStyle = '#252535';
    ctx.fillRect(0, 360, canvas.width, 1);
    ctx.fillRect(0, 375, canvas.width, 1);
  }

  // 地面奥行きグラデーション
  const grad = ctx.createLinearGradient(0, 350, 0, 450);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 350, canvas.width, 100);
}

function draw() {
  const stage = stages[gameState.stage - 1];
  const shake = typeof getCameraOffset === 'function' ? getCameraOffset() : { x: 0, y: 0 };
  const drawMargin = 50;

  ctx.save();
  ctx.translate(shake.x, shake.y);

  ctx.fillStyle = stage.bg;
  ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

  drawStageBackground(gameState.stage);

  // 改良版地面描画
  _drawGround(stage, gameState.stage);

  obstacles.forEach(obs => {
    if (obs.x + obs.w > camera.x - 50 && obs.x < camera.x + 850) {
      obs.draw();
    }
  });

  drawPlayerSVG(player.x, player.y, player.invincible, gameState.stage);

  const getEnemyFacing = (enemy) => {
    if (enemy.type === 'boss') {
      return player && player.x < enemy.x ? -1 : 1;
    }
    if (enemy.vx > 0.15) return 1;
    if (enemy.vx < -0.15) return -1;
    return player && player.x < enemy.x ? -1 : 1;
  };

  enemies.forEach(e => {
    if (e.x + e.w > camera.x - drawMargin && e.x < camera.x + canvas.width + drawMargin) {
      drawEnemySVG(e.x, e.y, e.type, gameState.stage, e.enemyType, getEnemyFacing(e));
    }
  });
  if (boss && boss.x + boss.w > camera.x - drawMargin && boss.x < camera.x + canvas.width + drawMargin) {
    drawEnemySVG(boss.x, boss.y, 'boss', gameState.stage, 'normal', getEnemyFacing(boss));
  }

  const activeShots = typeof getActiveProjectiles === 'function'
    ? getActiveProjectiles()
    : projectiles;
  activeShots.forEach(p => {
    if (p.x > camera.x - drawMargin && p.x < camera.x + canvas.width + drawMargin) {
      drawProjectileSVG(p.x, p.y - (p.h || 6) / 2, p.enemy, p);
    }
  });
  if (typeof projectiles !== 'undefined') {
    projectiles.forEach(p => {
      if (p.enemy && p.x > camera.x - drawMargin && p.x < camera.x + canvas.width + drawMargin) {
        drawProjectileSVG(p.x, p.y - (p.h || 6) / 2, true, p);
      }
    });
  }

  items.forEach(item => {
    if (!item.collected && item.x > camera.x - drawMargin && item.x < camera.x + canvas.width + drawMargin) {
      drawItem(item);
    }
  });

  // ── パーティクル描画 (キャラ上、ライティング下)
  if (typeof ParticleSystem !== 'undefined') ParticleSystem.render();

  // ── ライティングオーバーレイ
  if (typeof LightingSystem !== 'undefined') LightingSystem.render(gameState.stage);

  if (stageProgress < 100) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 198, canvas.width, 54);
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 12;
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STAGE ' + gameState.stage + ': ' + stage.name, canvas.width / 2, 235);
    ctx.shadowBlur = 0;
  }

  const currentStageLength = getStageLength(gameState.stage);
  if (bossActive && boss && stageProgress < currentStageLength + 100) {
    ctx.fillStyle = 'rgba(180,0,0,0.22)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FF3333';
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS BATTLE', canvas.width / 2, 100);
    ctx.fillText(stage.boss, canvas.width / 2, 150);
    ctx.shadowBlur = 0;
  }

  drawOmegaBeamEffects(ctx);
  if (typeof drawAttackUnlockOverlay === 'function') drawAttackUnlockOverlay(ctx);

  if (typeof drawFeedback === 'function') drawFeedback(ctx);
  if (typeof drawShockwaves === 'function') drawShockwaves(ctx);

  ctx.restore();

  // ── ポストエフェクト (スクリーンスペース、シェイクの外)
  if (typeof PostFX !== 'undefined') PostFX.render(gameState.stage);
}
