// 初期化
let guaranteedMedkitCounter = 0;
let stageEvents = {
  restPointPlaced: false,
  swarmSpawned: false
};
let bossIntro = {
  active: false,
  timer: 0,
  negotiationStarted: false
};

function getEnemySpawnSettings(stageNum) {
  const byStage = CONFIG.ENEMY_SPAWN.stageSettings && CONFIG.ENEMY_SPAWN.stageSettings[stageNum];
  return {
    interval: byStage ? byStage.interval : CONFIG.ENEMY_SPAWN.interval,
    maxCount: byStage ? byStage.maxCount : CONFIG.ENEMY_SPAWN.maxCount
  };
}

function getEnemyTypesForStage(stageNum) {
  switch (stageNum) {
    case 1: return ['normal', 'jumping', 'hovering'];
    case 2: return ['normal', 'jumping', 'zigzag'];
    case 3: return ['normal', 'flying', 'bouncing'];
    case 4: return ['normal', 'flying', 'tracking'];
    case 5: return ['normal', 'flying', 'fast'];
    case 6: return ['normal', 'tracking', 'bouncing', 'flying'];
    case 7: return ['normal', 'flying', 'tracking', 'bouncing'];
    default: return ['normal'];
  }
}

function spawnEnemyByPattern(stageNum, spawnX, groundY, forcedType) {
  const enemyTypes = getEnemyTypesForStage(stageNum);
  const selectedType = forcedType || enemyTypes[enemySpawnCounter % enemyTypes.length];
  let spawnY = groundY - player.h;
  let spawnMode = 'ground';

  if (selectedType === 'flying') {
    spawnMode = 'air';
    spawnY = groundY - player.h - 120 - Math.random() * 80;
  } else if (stageNum >= 5 && Math.random() < 0.22) {
    spawnMode = 'underground';
    spawnY = groundY + 35;
  }

  const enemy = new Enemy(spawnX, spawnY, 'normal', selectedType, stageNum);
  enemy.spawnMode = spawnMode;
  if (spawnMode === 'underground') {
    enemy.spawnTargetY = groundY - enemy.h;
    enemy.spawnRiseSpeed = 2.2;
  }
  enemies.push(enemy);
  enemySpawnCounter++;
}

function spawnGuaranteedMedkit(x, y) {
  items.push({
    x: x, y: y, w: 20, h: 20,
    type: 'medkit', floatTimer: 0, collected: false
  });
}

function ensureStageRestPoint() {
  if (stageEvents.restPointPlaced || bossActive) return;
  const stageLen = getStageLength(gameState.stage);
  if (stageProgress < stageLen * 0.48) return;
  stageEvents.restPointPlaced = true;
  items.push({
    x: stageLen * 0.5 + 80,
    y: CONFIG.PHYSICS.groundY - 40,
    w: 58,
    h: 36,
    type: 'restPoint',
    stageNum: gameState.stage,
    collected: false
  });
}

function init() {
  if (typeof closeNegotiationOverlay === 'function') closeNegotiationOverlay();
  updateUI();
  enemies = [];
  projectiles = [];
  if (typeof initAttackSystem === 'function') initAttackSystem();
  items = [];
  obstacles = [];
  boss = null;
  bossActive = false;
  stageProgress = 0;
  guaranteedMedkitCounter = 0;
  stageEvents = { restPointPlaced: false, swarmSpawned: false };
  bossIntro = { active: false, timer: 0, negotiationStarted: false };
  
  // プレイヤーの初期化
  if (player) {
    if (typeof player.reset === 'function') {
      // Playerクラスの場合
      player.reset();
    } else {
      // オブジェクトリテラルの場合（後方互換性）
      player.x = CONFIG.PLAYER.initialX;
      player.y = CONFIG.PLAYER.initialY;
      player.hp = player.maxHp;
      player.vx = 0;
      player.vy = 0;
      player.facing = 1;
    }
  } else {
    // プレイヤーが初期化されていない場合は初期化
    if (typeof initPlayer === 'function') {
      initPlayer();
    }
  }
  
  camera.x = 0;
  // 障害物生成
  generateObstacles(gameState.stage);
}

// ゲーム開始
function startGame() {
  // ステートマシンを使用して状態を変更
  // 画面表示は stateMachine が自動で処理
  if (typeof stateMachine !== 'undefined') {
    stateMachine.changeState(GameState.PLAYING);
  } else {
    // フォールバック（ステートマシンが読み込まれていない場合）
    hideAllScreens();
  }
  
  // ゲーム状態をリセット
  gameState.stage = 1;
  gameState.score = 0;
  guaranteedMedkitCounter = 0;
  stageEvents = { restPointPlaced: false, swarmSpawned: false };
  bossIntro = { active: false, timer: 0, negotiationStarted: false };
  
  // 後方互換性のため、gameState.started と paused を更新
  // （ステートマシンと同期）
  if (typeof stateMachine !== 'undefined') {
    syncGameStateWithStateMachine();
  } else {
    gameState.started = true;
    gameState.paused = false;
  }
  
  // 入力状態をリセット
  resetKeys();
  if (typeof closeNegotiationOverlay === 'function') closeNegotiationOverlay();

  // 統計・フィードバックリセット
  if (typeof resetGameStats === 'function') resetGameStats();
  if (typeof initSoundFX === 'function') initSoundFX();
  if (typeof initAttackSystem === 'function') initAttackSystem();
  
  // ゲーム初期化
  init();
  initUI(); // UI初期化（HPバーなど）
  updateUI();
  
  // オメガビームをリセット
  omegaBeam.charges = CONFIG.OMEGA_BEAM.initialCharges;
  omegaBeam.isCharging = false;
  omegaBeam.isActive = false;
  omegaBeam.activeTimer = 0;
  omegaBeam.bBtnPressed = false;
  
  // ステージ1のBGMを再生
  playStageBGM(1);

  // ステージバナー・チュートリアル
  if (typeof showStageBanner === 'function') {
    showStageBanner(1, stages[0].name, stages[0].boss);
  }
  if (typeof playSE === 'function') playSE('stage');
  if (typeof showTutorialIfNeeded === 'function') showTutorialIfNeeded();
  
  // ゲームループ開始（パフォーマンス最適化）
  setLastFrameTime(performance.now());
  requestAnimationFrame(gameLoop);
}

// UI更新（ui.jsで定義）

// 更新処理
function update() {
  // ステートマシンを使用して状態をチェック
  if (typeof stateMachine !== 'undefined') {
    if (!stateMachine.isState(GameState.PLAYING)) {
      return;
    }
  } else {
    // フォールバック（ステートマシンが読み込まれていない場合）
    if (!gameState.started || gameState.paused) return;
  }

  if (typeof isNegotiationActive === 'function' && isNegotiationActive()) {
    updateUI();
    return;
  }

  if (typeof updateAttackSystem === 'function') {
    const canUpdate = updateAttackSystem();
    if (!canUpdate) {
      if (typeof updateFeedback === 'function') updateFeedback();
      updateUI();
      return;
    }
  }

  // 1. プレイヤー移動（加減速）
  let targetVx = 0;
  if (keys.left) targetVx = -CONFIG.PHYSICS.maxSpeed;
  if (keys.right) targetVx = CONFIG.PHYSICS.maxSpeed;
  if (keys.analogX !== undefined && Math.abs(keys.analogX) > 0.1) {
    targetVx = keys.analogX * CONFIG.PHYSICS.maxSpeed;
  }
  if (targetVx > 0.15) player.facing = 1;
  if (targetVx < -0.15) player.facing = -1;
  const control = player.onGround ? 1 : CONFIG.PHYSICS.airControl;
  const accel = CONFIG.PHYSICS.acceleration * control;
  if (targetVx !== 0) {
    if (player.vx < targetVx) player.vx = Math.min(player.vx + accel, targetVx);
    else if (player.vx > targetVx) player.vx = Math.max(player.vx - accel, targetVx);
  } else if (player.onGround) {
    player.vx *= CONFIG.PHYSICS.friction;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
  }

  // Playerクラスのupdateメソッドを使用（位置更新）
  if (typeof player.update === 'function') {
    player.update();
  } else {
    // フォールバック（オブジェクトリテラルの場合）
    player.x += player.vx;
    player.y += player.vy;
  }

  // 重力
  if (!player.onGround) {
    player.vy += CONFIG.PHYSICS.gravity;
  }

  // 障害物更新
  obstacles.forEach(obs => obs.update());

  // 地面・台の判定
  const groundY = CONFIG.PHYSICS.groundY;
  player.onGround = false;
  
  for (let obs of obstacles) {
    if (obs.type === 'platform' || obs.type === 'movingPlatform' || obs.type === 'crumblingPlatform') {
      if (obs.active === false) continue;
      if (player.x + player.w > obs.x && player.x < obs.x + obs.w &&
          player.y + player.h >= obs.y && player.y + player.h < obs.y + 10 &&
          player.vy >= 0) {
        player.y = obs.y - player.h;
        player.vy = 0;
        player.onGround = true;
        if (obs.type === 'movingPlatform') player.x += obs.vx;
        if (obs.type === 'crumblingPlatform' && !obs.crumbling) {
          obs.crumbling = true;
          obs.crumbleTimer = CONFIG.OBSTACLE.crumbleDuration;
        }
      }
    } else if (obs.type === 'jumpPad') {
      if (player.x + player.w > obs.x && player.x < obs.x + obs.w &&
          player.y + player.h >= obs.y && player.y + player.h < obs.y + 10 &&
          player.vy >= 0) {
        player.y = obs.y - player.h;
        player.vy = -CONFIG.JUMP_PAD.power;
        player.onGround = false;
      }
    }
  }
  
  if (player.y + player.h >= groundY && !player.onGround) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // コヨーテタイム
  if (player.onGround) {
    player.coyoteTimer = CONFIG.PHYSICS.coyoteFrames;
  } else if (player.coyoteTimer > 0) {
    player.coyoteTimer--;
  }

  // ジャンプバッファ
  if (keys.jump) {
    player.jumpBuffer = CONFIG.PHYSICS.jumpBufferFrames;
  } else if (player.jumpBuffer > 0) {
    player.jumpBuffer--;
  }

  // 可変ジャンプ（早離しで低く）
  if (!keys.jump && player.vy < -3 && player.wasJumpHeld) {
    player.vy *= CONFIG.PHYSICS.variableJumpCut;
    player.wasJumpHeld = false;
  }

  const canJump = (player.onGround || player.coyoteTimer > 0) && player.jumpBuffer > 0;
  if (canJump) {
    player.vy = -player.jumpPower;
    player.onGround = false;
    player.coyoteTimer = 0;
    player.jumpBuffer = 0;
    player.wasJumpHeld = true;
    if (typeof playSE === 'function') playSE('jump');
    if (navigator.vibrate) navigator.vibrate(8);
  }
  if (keys.jump) player.wasJumpHeld = true;

  if (typeof updateOmegaBeamInput === 'function') updateOmegaBeamInput();

  if (typeof player.update !== 'function' && player.attackCooldown > 0) {
    player.attackCooldown--;
  }

  if (keys.aBtn && !player.aBtnWasPressed) {
    if (typeof firePlayerAttack === 'function') firePlayerAttack();
  }
  player.aBtnWasPressed = keys.aBtn;

  // 無敵時間消費（Playerクラスのupdateで処理されるため、ここでは不要）
  // ただし、オブジェクトリテラルの場合は残す
  if (typeof player.update !== 'function' && player.invincible > 0) {
    player.invincible--;
  }
  
  const targetCameraX = Math.max(0, player.x - CONFIG.CAMERA.offsetX);
  camera.x = camera.x + (targetCameraX - camera.x) * CONFIG.PHYSICS.cameraLerp;

  // ステージ進行と敵の出現
  if (!bossActive) {
    stageProgress = Math.max(stageProgress, player.x);
    ensureStageRestPoint();
    enemySpawnTimer++;
    const spawnSettings = getEnemySpawnSettings(gameState.stage);
    
    // 敵の生成
    if (enemySpawnTimer > spawnSettings.interval && enemies.length < spawnSettings.maxCount) {
      const spawnX = camera.x + CONFIG.ENEMY_SPAWN.spawnXOffset;
      spawnEnemyByPattern(gameState.stage, spawnX, groundY);
      enemySpawnTimer = 0;
    }

    // ボス出現判定
    const currentStageLength = getStageLength(gameState.stage);
    if (!stageEvents.swarmSpawned && stageProgress > currentStageLength - 200) {
      stageEvents.swarmSpawned = true;
      for (let i = 0; i < 3; i++) {
        const sx = camera.x + CONFIG.ENEMY_SPAWN.spawnXOffset + i * 48;
        spawnEnemyByPattern(gameState.stage, sx, groundY, i % 2 === 0 ? 'flying' : 'normal');
      }
    }

    if (stageProgress > currentStageLength && !boss) {
      bossActive = true;
      boss = new Enemy(camera.x + 600, groundY - 260, 'boss', 'normal', gameState.stage);
      boss.y = groundY - boss.h - 20;
      bossIntro.active = true;
      bossIntro.negotiationStarted = false;
      bossIntro.timer = CONFIG.NEGOTIATION.introFrames || 75;
      playBossBGM(gameState.stage === 7);
      if (typeof showBossWarning === 'function') showBossWarning();
    }
  }

  if (bossIntro.active && boss && !bossIntro.negotiationStarted) {
    bossIntro.timer--;
    if (bossIntro.timer <= 0) {
      const negotiationStarted = typeof startNegotiation === 'function' && startNegotiation(gameState.stage, {
        onSuccess: () => {
          if (typeof player.heal === 'function') {
            player.heal(CONFIG.NEGOTIATION.healOnSuccess);
          } else {
            player.hp = Math.min(player.maxHp, player.hp + CONFIG.NEGOTIATION.healOnSuccess);
          }
          boss = null;
          bossActive = false;
          bossIntro = { active: false, timer: 0, negotiationStarted: false };
          nextStage();
        },
        onFailure: () => {
          bossIntro.active = false;
          bossIntro.negotiationStarted = false;
          bossIntro.timer = 0;
          if (typeof showBossWarning === 'function') showBossWarning();
        }
      });
      bossIntro.negotiationStarted = negotiationStarted;
      if (!negotiationStarted) {
        bossIntro.active = false;
      }
    }
  }

  // 敵の更新
  enemies = enemies.filter(e => {
    const wasAlive = e.hp > 0;
    e.update();
    // 撃破フィードバック
    if (wasAlive && e.hp <= 0) {
      if (typeof registerKill === 'function') {
        registerKill(e.x + e.w / 2, e.y + e.h / 2);
      }
      guaranteedMedkitCounter++;
      if (guaranteedMedkitCounter >= 10) {
        spawnGuaranteedMedkit(e.x + e.w / 2, e.y + e.h / 2);
        guaranteedMedkitCounter = 0;
      }
    }
    // 救急箱ドロップ
    if (e.hp <= 0 && Math.random() < 0.05) {
      items.push({
        x: e.x + e.w / 2, y: e.y + e.h / 2, w: 20, h: 20,
        type: 'medkit', floatTimer: 0, collected: false
      });
    }
    return e.x > camera.x - 100 && e.hp > 0;
  });

  // ボスの更新
  if (boss) {
    const negotiationNow = typeof isNegotiationActive === 'function' && isNegotiationActive();
    if (!negotiationNow && !bossIntro.active) {
      boss.update();
    }
    if (boss.x < camera.x + 50) boss.x = camera.x + 50;
    if (boss.x > camera.x + canvas.width - 110) boss.x = camera.x + canvas.width - 110;
    const bossMinY = 40;
    const bossMaxY = groundY - boss.h - 10;
    if (boss.y < bossMinY) boss.y = bossMinY;
    if (boss.y > bossMaxY) boss.y = bossMaxY;
    
    if (boss.hp <= 0 && !bossIntro.active) {
      boss = null;
      bossActive = false;
      bossIntro = { active: false, timer: 0, negotiationStarted: false };
      nextStage();
    }
  }

  updatePlayerProjectiles();
  projectiles = projectiles.filter(p => updateEnemyProjectile(p));

  // プレイヤーと敵の衝突
  const canHitBoss = boss && !bossIntro.active;
  const targets = canHitBoss ? [...enemies, boss] : enemies;
  for (let e of targets) {
    if (checkCollision(player, e)) {
      if (typeof player.takeDamage === 'function') {
        // Playerクラスの場合
        player.takeDamage(10);
      } else {
        // オブジェクトリテラルの場合（後方互換性）
        if (player.invincible === 0) {
          player.hp -= 10;
          player.invincible = 60;
        }
      }
      if (typeof onPlayerDamaged === 'function') onPlayerDamaged();
      if (player.hp <= 0) gameOver();
    }
  }

  // アイテム更新
  items = items.filter(item => {
    if (item.collected) return false;
    item.floatTimer = (item.floatTimer || 0) + 1;
    item.y = item.y + Math.sin(item.floatTimer * 0.1) * 0.5;
    if (checkCollision(player, item)) {
      if (item.type === 'medkit') {
        if (typeof player.heal === 'function') {
          // Playerクラスの場合
          player.heal(30);
        } else {
          // オブジェクトリテラルの場合（後方互換性）
          player.hp = Math.min(player.hp + 30, player.maxHp);
        }
        item.collected = true;
        if (typeof playSE === 'function') playSE('pickup');
        if (typeof addFloatingText === 'function') {
          addFloatingText(item.x - camera.x, item.y - 30, '+30 HP', '#4CAF50', 20);
        }
        return false;
      }
      if (item.type === 'restPoint') {
        const restHeal = 25;
        if (typeof player.heal === 'function') {
          player.heal(restHeal);
        } else {
          player.hp = Math.min(player.maxHp, player.hp + restHeal);
        }
        item.collected = true;
        if (typeof playSE === 'function') playSE('pickup');
        if (typeof addFloatingText === 'function') {
          addFloatingText(item.x - camera.x, item.y - 26, '休憩 +25 HP', '#8BC34A', 18);
        }
        return false;
      }
    }
    return true;
  });

  // 障害物ダメージ
  for (let obs of obstacles) {
    if (obs.active === false) continue;
    let damage = 0;
    if (obs.type === 'spike') damage = 10;
    if (obs.type === 'lava') damage = 20;
    if (obs.type === 'electric') damage = 10;
    if (obs.type === 'laser' && obs.laserOn) damage = 10;
    if (obs.type === 'puddle') damage = 6;
    if (obs.type === 'crow' || obs.type === 'bicycle' || obs.type === 'clubBall') damage = 10;
    if (obs.type === 'book' || obs.type === 'paperBundle' || obs.type === 'copyPaper') damage = 8;
    if (obs.type === 'disciplineWall' || obs.type === 'randoseru' || obs.type === 'crowd') damage = 9;
    if (obs.type === 'namecard') damage = 10;
    if (obs.type === 'coffeeCup' || obs.type === 'magicFlame') damage = 12;
    if (obs.type === 'floatingRock') damage = 14;
    
    if (damage > 0 && checkCollision(player, obs)) {
      if (typeof player.takeDamage === 'function') {
        // Playerクラスの場合
        player.takeDamage(damage);
      } else {
        // オブジェクトリテラルの場合（後方互換性）
        if (player.invincible === 0) {
          player.hp -= damage;
          player.invincible = 60;
        }
      }
      if (typeof onPlayerDamaged === 'function') onPlayerDamaged();
      if (player.hp <= 0) gameOver();
    }
  }

  if (typeof updateFeedback === 'function') updateFeedback();
  updateUI();

  // ── パーティクル更新
  if (typeof ParticleSystem !== 'undefined') {
    ParticleSystem.spawnAmbient(gameState.stage);
    ParticleSystem.spawnWalkDust(gameState.stage);
    ParticleSystem.update();
  }
}
// 爆発ダメージ計算用ヘルパー
// CollisionEngineの範囲攻撃機能を使用
function createExplosionDamage(p) {
    const targets = boss ? [...enemies, boss] : enemies;
    const explosionRadius = 60;
    
    // CollisionEngineの範囲攻撃機能を使用
    if (typeof collisionEngine !== 'undefined') {
        const hitTargets = collisionEngine.checkAreaCollision(
            { x: p.x, y: p.y },
            explosionRadius,
            targets
        );
        
        hitTargets.forEach(e => {
            e.hp -= 20;
        });
    } else {
        // フォールバック（CollisionEngineが読み込まれていない場合）
        targets.forEach(e => {
            const dist = Math.sqrt(Math.pow(e.x - p.x, 2) + Math.pow(e.y - p.y, 2));
            if (dist < explosionRadius) {
                e.hp -= 20;
            }
        });
    }
}


// 当たり判定
// 注意: 既存のcheckCollision関数はcollision-engine.jsに移動しました
// 後方互換性のため、collision-engine.jsでグローバル関数として提供されています
// 新しいコードでは collisionEngine.checkCollision() を使用することを推奨します

// 次ステージ
function nextStage() {
  if (gameState.stage < 7) {
    gameState.stage++;
    gameState.score += 1000;
    const heal = Math.floor(50 + (player.maxHp - player.hp) * 0.3);
    player.hp = Math.min(player.maxHp, player.hp + heal);
    stageProgress = 0;
    enemies = [];
    projectiles = [];
    obstacles = [];
    items = [];
    enemySpawnTimer = 0;
    enemySpawnCounter = 0;
    stageEvents = { restPointPlaced: false, swarmSpawned: false };
    bossIntro = { active: false, timer: 0, negotiationStarted: false };
    // プレイヤー位置もリセット
    player.x = 100;
    player.y = CONFIG.PLAYER.initialY;
    player.vx = 0;
    player.vy = 0;
    camera.x = 0;
    // 新しいステージの障害物生成
    generateObstacles(gameState.stage);
    if (typeof BackgroundCache !== 'undefined') BackgroundCache.invalidate();
    playStageBGM(gameState.stage);
    if (typeof showStageBanner === 'function') {
      const s = stages[gameState.stage - 1];
      showStageBanner(gameState.stage, s.name, s.boss);
    }
    if (typeof playSE === 'function') playSE('stage');
  } else {
    // ゲームクリア（エンディング画面表示）
    stopAllBGM(); // エンディング時はBGMを停止
    gameClear();
  }
}

// エンディングパーティクル管理（ui.jsで定義）

// ゲームクリア（エンディング画面）
function gameClear() {
  // ステートマシンを使用して状態を変更
  // 画面表示とパーティクルアニメーションは stateMachine が自動で処理
  if (typeof stateMachine !== 'undefined') {
    stateMachine.changeState(GameState.RESULT);
  } else {
    // フォールバック（ステートマシンが読み込まれていない場合）
    gameState.started = false;
    hideScreen('startScreen');
    hideScreen('gameOverScreen');
    document.getElementById('endingScore').textContent = gameState.score;
    showScreen('endingScreen');
    setTimeout(() => {
      if (typeof startEndingParticles === 'function') {
        startEndingParticles();
      }
    }, 100);
  }
  
  // 後方互換性のため、gameState.started を更新
  if (typeof stateMachine !== 'undefined') {
    syncGameStateWithStateMachine();
  } else {
    gameState.started = false;
  }
}

// ゲームオーバー
function gameOver() {
  // ステートマシンを使用して状態を変更
  // 画面表示とBGM停止は stateMachine が自動で処理
  if (typeof stateMachine !== 'undefined') {
    stateMachine.changeState(GameState.GAMEOVER);
  } else {
    // フォールバック（ステートマシンが読み込まれていない場合）
    gameState.started = false;
    stopAllBGM();
    hideScreen('startScreen');
    hideScreen('endingScreen');
    document.getElementById('finalScore').textContent = gameState.score;
    showScreen('gameOverScreen');
  }
  
  // 後方互換性のため、gameState.started を更新
  if (typeof stateMachine !== 'undefined') {
    syncGameStateWithStateMachine();
  } else {
    gameState.started = false;
  }
}

// ゲームループ（パフォーマンス最適化版）
function gameLoop(currentTime) {
  // ステートマシンを使用して状態をチェック
  if (typeof stateMachine !== 'undefined') {
    if (!stateMachine.isState(GameState.PLAYING)) {
      // PLAYING状態でない場合は、ループを継続しない
      // （TITLE, RESULT, GAMEOVER状態ではループを停止）
      return;
    }
  } else {
    // フォールバック（ステートマシンが読み込まれていない場合）
    if (!gameState.started) return;
  }
  
  // フレームレート制御
  const deltaTime = currentTime - getLastFrameTime();
  const frameInterval = getFrameInterval();
  const maxFrameSkip = getMaxFrameSkip();
  
  if (deltaTime >= frameInterval) {
    // フレームスキップ処理
    let updateCount = Math.floor(deltaTime / frameInterval);
    updateCount = Math.min(updateCount, maxFrameSkip + 1);
    
    // 更新処理（スキップされたフレーム分も更新）
    for (let i = 0; i < updateCount; i++) {
      update();
    }
    
    // 描画処理（1回だけ）
    draw();
    
    if (typeof setRenderAlpha === 'function') {
      setRenderAlpha(deltaTime % frameInterval, frameInterval);
    }
    setLastFrameTime(currentTime - (deltaTime % frameInterval));
  }
  
  if (gameState.started) {
    requestAnimationFrame(gameLoop);
  }
}

function updatePlayerProjectiles() {
  if (typeof getActiveProjectiles !== 'function') return;
  const negotiationNow = typeof isNegotiationActive === 'function' && isNegotiationActive();
  const canHitBoss = !!boss && !bossIntro.active && !negotiationNow;
  const shots = getActiveProjectiles();
  for (let i = shots.length - 1; i >= 0; i--) {
    const p = shots[i];
    p.timer = (p.timer || 0) + 1;
    if (p.gravity) p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    if (p.rotation !== undefined) p.rotation += 0.3;

    if (p.x < camera.x - 50 || p.x > camera.x + 900 || p.y > 600) {
      deactivateProjectile(p);
      continue;
    }

    let hit = false;
    for (let e of enemies) {
      if (checkCollision(p, e)) {
        e.hp -= (p.damage || 5);
        gameState.score += 10;
        hit = true;
        if (typeof onProjectileHit === 'function') onProjectileHit(p, e);
        if (!p.piercing) break;
      }
    }
    if (canHitBoss && checkCollision(p, boss)) {
      if (!hit || p.piercing) {
        boss.hp -= (p.damage || 3);
        gameState.score += 5;
        hit = true;
        if (typeof onProjectileHit === 'function') onProjectileHit(p, boss);
      }
    }

    if (hit && !p.piercing) {
      deactivateProjectile(p);
    } else if (p.piercing && hit) {
      p.pierceCount = (p.pierceCount || 0) + 1;
      if (p.pierceCount >= p.maxPierce) deactivateProjectile(p);
    }
  }
}

function updateEnemyProjectile(p) {
  p.timer = (p.timer || 0) + 1;
  if (p.gravity) p.vy += p.gravity;
  p.x += p.vx;
  p.y += p.vy;
  if (p.x < camera.x - 50 || p.x > camera.x + 900 || p.y > 600) return false;
  if (checkCollision(p, player)) {
    if (typeof player.takeDamage === 'function') {
      player.takeDamage(10);
    } else if (player.invincible === 0) {
      player.hp -= 10;
      player.invincible = 60;
    }
    if (typeof onPlayerDamaged === 'function') onPlayerDamaged();
    if (player.hp <= 0) gameOver();
    return false;
  }
  return true;
}

// イベントリスナー設定
function setupEventListeners() {
  const startButton = document.getElementById('startButton');
  const restartButton = document.getElementById('restartButton');
  const returnToTitleButton = document.getElementById('returnToTitleButton');
  const endingRestartBtn = document.getElementById('endingRestartBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const pauseTitleBtn = document.getElementById('pauseTitleBtn');
  const muteBtn = document.getElementById('muteBtn');
  const tutorialClose = document.getElementById('tutorialClose');

  const tapStart = (fn) => (e) => {
    e.preventDefault();
    if (typeof initSoundFX === 'function') initSoundFX();
    if (typeof SoundFX !== 'undefined') SoundFX.resume();
    fn();
  };

  if (startButton) startButton.addEventListener('click', tapStart(startGame));
  if (restartButton) restartButton.addEventListener('click', tapStart(startGame));
  if (endingRestartBtn) endingRestartBtn.addEventListener('click', tapStart(startGame));
  if (returnToTitleButton) {
    returnToTitleButton.addEventListener('click', () => {
      if (typeof stateMachine !== 'undefined') {
        stateMachine.changeState(GameState.TITLE);
      } else {
        hideAllScreens();
        showScreen('startScreen');
      }
      init();
    });
  }
  if (pauseTitleBtn) {
    pauseTitleBtn.addEventListener('click', () => {
      if (typeof stateMachine !== 'undefined') {
        stateMachine.changeState(GameState.TITLE);
      }
      init();
    });
  }
  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
  if (resumeBtn) resumeBtn.addEventListener('click', togglePause);
  if (muteBtn) muteBtn.addEventListener('click', () => {
    if (typeof SoundFX !== 'undefined') SoundFX.toggle();
  });
  if (tutorialClose) tutorialClose.addEventListener('click', hideTutorial);
}

function togglePause() {
  if (typeof stateMachine === 'undefined') return;
  if (stateMachine.isState(GameState.PLAYING)) {
    stateMachine.changeState(GameState.PAUSED);
    updatePauseStats();
    showScreen('pauseScreen');
  } else if (stateMachine.isState(GameState.PAUSED)) {
    hideScreen('pauseScreen');
    stateMachine.changeState(GameState.PLAYING);
    syncGameStateWithStateMachine();
    setLastFrameTime(performance.now());
    requestAnimationFrame(gameLoop);
  }
}

function updatePauseStats() {
  const ps = document.getElementById('pause-score');
  const pk = document.getElementById('pause-kills');
  const pc = document.getElementById('pause-combo');
  if (ps) ps.textContent = gameState.score;
  if (pk && typeof gameStats !== 'undefined') pk.textContent = gameStats.kills;
  if (pc && typeof gameStats !== 'undefined') pc.textContent = gameStats.maxCombo;
}

// 初期化処理は init.js に移動しました
