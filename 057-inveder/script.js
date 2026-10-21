// ゲームの設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ゲーム状態
let gameRunning = true;
let score = 0;
let lives = 3;

// プレイヤー（自機）
const player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 60,
    width: 30,
    height: 20,
    speed: 10, // 操作性を200%向上（5→10）
    color: '#00ff00'
};

// 弾丸配列
let bullets = [];
let enemyBullets = [];

// インベーダー配列
let invaders = [];

// ゲーム初期化
function initGame() {
    // インベーダーを作成（5行×8列）
    invaders = [];
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
            const isFast = row === 0; // 最上段の敵は高速で移動
            invaders.push({
                x: col * 45 + 50,
                y: row * 35 + 50,
                width: 25,
                height: 20,
                alive: true,
                speedMultiplier: isFast ? 2 : 1,
                color: isFast ? '#ff00ff' : row < 2 ? '#ff0000' : row < 4 ? '#ffff00' : '#00ffff'
            });
        }
    }
    
    // 弾丸をリセット
    bullets = [];
    enemyBullets = [];
    
    // プレイヤー位置をリセット
    player.x = canvas.width / 2 - 15;
    
    // スコア表示更新
    updateDisplay();
}

// 表示更新
function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
}

// プレイヤー描画
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // プレイヤーを三角形っぽく見せる
    ctx.fillRect(player.x + 10, player.y - 5, 10, 5);
}

// インベーダー描画
function drawInvaders() {
    invaders.forEach(invader => {
        if (invader.alive) {
            ctx.fillStyle = invader.color;
            ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
            
            // 目を描画
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(invader.x + 5, invader.y + 5, 3, 3);
            ctx.fillRect(invader.x + 17, invader.y + 5, 3, 3);
        }
    });
}

// 弾丸描画
function drawBullets() {
    // プレイヤーの弾丸
    ctx.fillStyle = '#ffffff';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // 敵の弾丸
    ctx.fillStyle = '#ff0000';
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

// 弾丸移動
function moveBullets() {
    // プレイヤーの弾丸を上に移動
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > 0;
    });
    
    // 敵の弾丸を下に移動
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.y += bullet.speed;
        return bullet.y < canvas.height;
    });
}

// インベーダー移動
let invaderDirection = 1;
let invaderSpeed = 0.6; // 60%に減速

function moveInvaders() {
    let shouldMoveDown = false;
    
    // 左右の端に到達したかチェック
    invaders.forEach(invader => {
        if (invader.alive) {
            if (invader.x <= 0 || invader.x >= canvas.width - invader.width) {
                shouldMoveDown = true;
            }
        }
    });
    
    if (shouldMoveDown) {
        invaderDirection *= -1;
        invaders.forEach(invader => {
            if (invader.alive) {
                invader.y += 12; // 下向きの移動も60%に（20→12）
            }
        });
    }
    
    // 横移動
    invaders.forEach(invader => {
        if (invader.alive) {
            invader.x += invaderSpeed * invaderDirection * (invader.speedMultiplier || 1);
        }
    });
}

// 敵の弾丸発射
function enemyShoot() {
    if (Math.random() < 0.001) { // 低確率で発射
        const aliveInvaders = invaders.filter(invader => invader.alive);
        if (aliveInvaders.length > 0) {
            const randomInvader = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
            enemyBullets.push({
                x: randomInvader.x + randomInvader.width / 2 - 2,
                y: randomInvader.y + randomInvader.height,
                width: 4,
                height: 8,
                speed: 1.8 // 敵の弾速も60%に（3→1.8）
            });
        }
    }
}

// 当たり判定
function checkCollisions() {
    // プレイヤーの弾丸とインベーダー
    bullets.forEach((bullet, bulletIndex) => {
        invaders.forEach((invader, invaderIndex) => {
            if (invader.alive &&
                bullet.x < invader.x + invader.width &&
                bullet.x + bullet.width > invader.x &&
                bullet.y < invader.y + invader.height &&
                bullet.y + bullet.height > invader.y) {
                
                // ヒット！
                invader.alive = false;
                bullets.splice(bulletIndex, 1);
                score += 10;
                updateDisplay();
            }
        });
    });
    
    // 敵の弾丸とプレイヤー
    enemyBullets.forEach((bullet, bulletIndex) => {
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            
            // プレイヤーがヒット
            enemyBullets.splice(bulletIndex, 1);
            lives--;
            updateDisplay();
            
            if (lives <= 0) {
                gameOver();
            }
        }
    });
    
    // インベーダーがプレイヤーに到達
    invaders.forEach(invader => {
        if (invader.alive && invader.y + invader.height >= player.y) {
            gameOver();
        }
    });
}

// ゲームオーバー
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
}

// 勝利判定
function checkWin() {
    const aliveInvaders = invaders.filter(invader => invader.alive);
    if (aliveInvaders.length === 0) {
        score += 100; // ボーナス
        updateDisplay();
        setTimeout(() => {
            initGame(); // 新しいステージ
        }, 1000);
    }
}

// メインゲームループ
function gameLoop() {
    if (!gameRunning) return;
    
    // 画面クリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 描画
    drawPlayer();
    drawInvaders();
    drawBullets();
    
    // 移動
    moveBullets();
    moveInvaders();
    
    // 敵の攻撃
    enemyShoot();
    
    // 当たり判定
    checkCollisions();
    
    // 勝利判定
    checkWin();
    
    // 次のフレーム
    requestAnimationFrame(gameLoop);
}

// プレイヤー移動
function movePlayer(direction) {
    if (direction === 'left' && player.x > 0) {
        player.x -= player.speed;
    }
    if (direction === 'right' && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

// 弾丸発射
function shoot() {
    if (bullets.length < 3) { // 最大3発まで
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: 8
        });
    }
}

// キーボード操作
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.code) {
        case 'ArrowLeft':
            movePlayer('left');
            break;
        case 'ArrowRight':
            movePlayer('right');
            break;
        case 'Space':
            e.preventDefault();
            shoot();
            break;
    }
});

// タッチボタン操作
let moveInterval;
function startMoving(direction) {
    movePlayer(direction);
    moveInterval = setInterval(() => movePlayer(direction), 50);
}
function stopMoving() {
    clearInterval(moveInterval);
}

let shootInterval;
function startShooting() {
    shoot();
    shootInterval = setInterval(shoot, 100);
}
function stopShooting() {
    clearInterval(shootInterval);
}

const leftBtn = document.getElementById('leftBtn');
leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) startMoving('left');
});
leftBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (gameRunning) startMoving('left');
});
['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(evt => {
    leftBtn.addEventListener(evt, (e) => {
        e.preventDefault();
        stopMoving();
    });
});

const rightBtn = document.getElementById('rightBtn');
rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) startMoving('right');
});
rightBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (gameRunning) startMoving('right');
});
['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(evt => {
    rightBtn.addEventListener(evt, (e) => {
        e.preventDefault();
        stopMoving();
    });
});

const shootBtn = document.getElementById('shootBtn');
shootBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) startShooting();
});
shootBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (gameRunning) startShooting();
});
['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(evt => {
    shootBtn.addEventListener(evt, (e) => {
        e.preventDefault();
        stopShooting();
    });
});

// リスタートボタン
document.getElementById('restartBtn').addEventListener('click', () => {
    gameRunning = true;
    score = 0;
    lives = 3;
    document.getElementById('gameOver').classList.add('hidden');
    initGame();
    gameLoop();
});

// ゲーム開始
initGame();
gameLoop();
