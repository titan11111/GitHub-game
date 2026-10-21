// UI更新・画面制御システム

// 前回のHPとスコアを記録（アニメーション用）
let lastHp = 100;
let lastScore = 0;

// UI初期化
function initUI() {
  lastHp = player ? player.maxHp : 100;
  lastScore = gameState ? gameState.score : 0;
  if (typeof updateUI === 'function') {
    updateUI();
  }
}

// UI更新（ステージ、HP、スコア）
function updateUI() {
  const stageEl = document.getElementById('stage');
  const stageNameEl = document.getElementById('stageName');
  if (stageEl) stageEl.textContent = gameState.stage;
  if (stageNameEl) stageNameEl.textContent = stages[gameState.stage - 1].name;

  updateHPBar();
  updateScore();
  updateStageProgress();
  updateAttackLevel();
  updateOmegaDisplay();
}

function updateStageProgress() {
  const bar = document.getElementById('stage-progress-bar');
  const label = document.getElementById('progress-label');
  if (!bar) return;
  const length = getStageLength(gameState.stage);
  const pct = Math.min(100, Math.floor((stageProgress / length) * 100));
  bar.style.width = pct + '%';
  if (label) label.textContent = pct + '%';
  if (pct >= 85) bar.classList.add('near-boss');
  else bar.classList.remove('near-boss');
}

function updateAttackLevel() {
  const level = typeof getAttackTypeByScore === 'function' ? getAttackTypeByScore() : 0;
  const display = typeof getAttackDisplay === 'function' ? getAttackDisplay(level) : { name: '光', icon: '✨' };
  const iconEl = document.getElementById('attack-icon');
  const nameEl = document.getElementById('attack-name');
  const badge = document.getElementById('attack-level');
  if (iconEl) iconEl.textContent = display.icon;
  if (nameEl) nameEl.textContent = display.name;
  if (badge) badge.dataset.level = level;
}

function updateOmegaDisplay() {
  const el = document.getElementById('omega-charges');
  const wrap = document.getElementById('omega-display');
  const btnB = document.getElementById('btn-b-touch');
  if (el) el.textContent = omegaBeam.charges;
  if (wrap) {
    wrap.classList.toggle('ready', omegaBeam.charges > 0);
    wrap.classList.toggle('empty', omegaBeam.charges <= 0);
  }
  if (btnB) btnB.classList.toggle('ready', omegaBeam.charges > 0);
}

function onPlayerDamaged() {
  showDamageFlash();
  if (typeof triggerScreenShake === 'function') triggerScreenShake(5, 12);
  if (typeof playSE === 'function') playSE('damage');
  if (typeof gameStats !== 'undefined') gameStats.damageTaken++;
  if (navigator.vibrate) navigator.vibrate(25);
  // PostFXのキャンバスダメージフラッシュ
  if (typeof PostFX !== 'undefined') PostFX.triggerDamageFlash();
}

function showTutorialIfNeeded() {
  if (localStorage.getItem('actionjinnsei_tutorial_done')) return;
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

function hideTutorial() {
  localStorage.setItem('actionjinnsei_tutorial_done', 'true');
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function updateGameOverStats() {
  const kills = document.getElementById('go-kills');
  const combo = document.getElementById('go-combo');
  if (kills && typeof gameStats !== 'undefined') kills.textContent = gameStats.kills;
  if (combo && typeof gameStats !== 'undefined') combo.textContent = gameStats.maxCombo;
}

// HPバーの更新
function updateHPBar() {
  const hpElement = document.getElementById('hp');
  const hpBarElement = document.getElementById('hp-bar');
  
  if (!hpElement || !hpBarElement) return;
  
  const hpPercent = (player.hp / player.maxHp) * 100;
  const hpPercentClamped = Math.max(0, Math.min(100, hpPercent));
  
  // HP数値の更新
  hpElement.textContent = Math.max(0, Math.floor(player.hp));
  
  // HPバーの幅を更新
  hpBarElement.style.width = hpPercentClamped + '%';
  
  // 背景色の位置を調整（グラデーションの色を変える）
  if (hpPercentClamped > 75) {
    hpBarElement.style.backgroundPosition = '0% 0%';
    hpBarElement.classList.remove('danger');
  } else if (hpPercentClamped > 50) {
    hpBarElement.style.backgroundPosition = '25% 0%';
    hpBarElement.classList.remove('danger');
  } else if (hpPercentClamped > 25) {
    hpBarElement.style.backgroundPosition = '50% 0%';
    hpBarElement.classList.remove('danger');
  } else {
    hpBarElement.style.backgroundPosition = '75% 0%';
    hpBarElement.classList.add('danger');
  }
  
  // HP減少時のアニメーション
  if (player.hp < lastHp) {
    hpBarElement.style.transition = 'width 0.3s ease, background-position 0.3s ease';
    // 一瞬縮むアニメーション
    setTimeout(() => {
      hpBarElement.style.transform = 'scaleX(0.95)';
      setTimeout(() => {
        hpBarElement.style.transform = 'scaleX(1)';
      }, 100);
    }, 0);
  }
  
  lastHp = player.hp;
}

// スコアの更新（アニメーション付き）
function updateScore() {
  const scoreElement = document.getElementById('score');
  if (!scoreElement) return;
  
  const scoreDiff = gameState.score - lastScore;
  
  if (scoreDiff > 0) {
    // スコア増加時のアニメーション
    animateScoreIncrease(scoreDiff);
    
    // 数値のカウントアップアニメーション
    animateNumber(scoreElement, lastScore, gameState.score, 300);
  } else {
    scoreElement.textContent = gameState.score;
  }
  
  lastScore = gameState.score;
}

// 数値のカウントアップアニメーション
function animateNumber(element, from, to, duration) {
  const startTime = Date.now();
  const diff = to - from;
  
  function update() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.floor(from + diff * progress);
    element.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = to;
    }
  }
  
  update();
}

// スコア増加ポップアップ
function animateScoreIncrease(amount) {
  const container = document.getElementById('score-popup-container');
  if (!container) return;
  
  const popup = document.createElement('div');
  popup.className = 'score-popup' + (amount >= 100 ? ' big' : '');
  popup.textContent = '+' + amount;
  
  // ランダムな位置に表示（中央付近）
  const offsetX = (Math.random() - 0.5) * 100;
  const offsetY = (Math.random() - 0.5) * 50;
  popup.style.left = offsetX + 'px';
  popup.style.top = offsetY + 'px';
  
  container.appendChild(popup);
  
  // アニメーション終了後に削除
  setTimeout(() => {
    if (popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }
  }, 1000);
}

// ダメージフラッシュ
function showDamageFlash() {
  const flash = document.getElementById('damage-flash');
  if (!flash) return;
  
  flash.classList.add('active');
  
  setTimeout(() => {
    flash.classList.remove('active');
  }, 300);
}

// 画面表示制御ヘルパー関数
function showScreen(screenId) {
  const screen = document.getElementById(screenId);
  if (screen) {
    if (screenId === 'pauseScreen') {
      screen.classList.remove('hidden');
    } else {
      screen.style.display = (screenId === 'endingScreen' || screenId === 'startScreen' || screenId === 'gameOverScreen') ? 'flex' : 'block';
    }
    if (screenId === 'gameOverScreen') updateGameOverStats();
  }
}

function hideScreen(screenId) {
  const screen = document.getElementById(screenId);
  if (screen) {
    if (screenId === 'pauseScreen') {
      screen.classList.add('hidden');
    } else {
      screen.style.display = 'none';
    }
  }
}

function hideAllScreens() {
  hideScreen('startScreen');
  hideScreen('gameOverScreen');
  hideScreen('endingScreen');
  hideScreen('pauseScreen');
}

function setGameplayUIVisible(visible) {
  const bar = document.getElementById('statusBar');
  const controls = document.getElementById('touch-controls');
  if (bar) bar.style.display = visible ? 'flex' : 'none';
  if (controls) controls.style.display = visible ? 'block' : 'none';
}

// エンディングパーティクル管理
let endingParticles = [];

// パーティクル生成（花吹雪・光）
function createEndingParticle(type) {
  const particle = {
    x: Math.random() * window.innerWidth,
    y: -10,
    vx: (Math.random() - 0.5) * 2,
    vy: Math.random() * 2 + 1,
    size: type === 'flower' ? Math.random() * 8 + 4 : Math.random() * 6 + 3,
    type: type,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.1,
    opacity: Math.random() * 0.5 + 0.5,
    color: type === 'flower' 
      ? ['#FFB6C1', '#FF69B4', '#FF1493', '#FFC0CB'][Math.floor(Math.random() * 4)]
      : ['#FFD700', '#FFFF00', '#FFA500', '#FFF'][Math.floor(Math.random() * 4)]
  };
  endingParticles.push(particle);
}

// パーティクル更新
function updateEndingParticles() {
  for (let i = endingParticles.length - 1; i >= 0; i--) {
    const p = endingParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotationSpeed;
    
    // 画面外に出たら削除
    if (p.y > window.innerHeight + 50 || p.x < -50 || p.x > window.innerWidth + 50) {
      endingParticles.splice(i, 1);
    }
  }
}

// パーティクル描画
function drawEndingParticles() {
  const container = document.getElementById('endingParticles');
  if (!container) return;
  
  container.innerHTML = '';
  
  endingParticles.forEach(p => {
    const particleEl = document.createElement('div');
    particleEl.style.position = 'absolute';
    particleEl.style.left = p.x + 'px';
    particleEl.style.top = p.y + 'px';
    particleEl.style.width = p.size + 'px';
    particleEl.style.height = p.size + 'px';
    particleEl.style.opacity = p.opacity;
    particleEl.style.transform = `rotate(${p.rotation}rad)`;
    particleEl.style.pointerEvents = 'none';
    particleEl.style.transition = 'none';
    particleEl.style.zIndex = '201';
    
    if (p.type === 'flower') {
      // 花びらの形
      particleEl.style.background = p.color;
      particleEl.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
      particleEl.style.boxShadow = '0 0 5px rgba(255, 182, 193, 0.8)';
    } else {
      // 光の形（星型）
      particleEl.style.background = `radial-gradient(circle, ${p.color}, transparent)`;
      particleEl.style.borderRadius = '50%';
      particleEl.style.boxShadow = `0 0 10px ${p.color}, 0 0 20px ${p.color}`;
    }
    
    container.appendChild(particleEl);
  });
}

// パーティクルアニメーションループ
let endingParticleInterval = null;
function startEndingParticles() {
  endingParticles = [];
  
  if (endingParticleInterval) {
    clearInterval(endingParticleInterval);
  }
  
  // 定期的にパーティクルを生成
  endingParticleInterval = setInterval(() => {
    if (Math.random() < 0.7) {
      createEndingParticle('flower');
    }
    if (Math.random() < 0.3) {
      createEndingParticle('light');
    }
  }, 200);
  
  // パーティクル更新ループ
  function animateParticles() {
    if (document.getElementById('endingScreen')?.style.display === 'flex') {
      updateEndingParticles();
      drawEndingParticles();
      requestAnimationFrame(animateParticles);
    } else {
      if (endingParticleInterval) {
        clearInterval(endingParticleInterval);
        endingParticleInterval = null;
      }
      endingParticles = [];
    }
  }
  
  animateParticles();
}
