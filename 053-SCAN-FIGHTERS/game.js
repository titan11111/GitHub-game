// ゲーム要素の取得
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

// コントロールボタン
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');

// ゲーム状態
let gameState = {
    score: 0,
    lives: 3,
    gameOver: false,
    keys: {
        left: false,
        right: false,
        jump: false
    }
};

// プレイヤー
const player = {
    x: 50,
    y: 300,
    width: 40,
    height: 40,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpPower: 15,
    onGround: false,
    color: '#FF0000'
};

// 敵の配列
let enemies = [];
let platforms = [];
let coins = [];

// 重力
const gravity = 0.8;
const groundY = canvas.height - 40;

// ゲーム初期化
function initGame() {
    // キャンバスサイズをレスポンシブに調整
    resizeCanvas();
    
    // プレイヤー初期位置
    player.x = 50;
    player.y = groundY - player.height;
    player.velocityX = 0;
    player.velocityY = 0;
    player.onGround = true;
    
    // 敵の初期化
    enemies = [];
    for (let i = 0; i < 5; i++) {
        enemies.push({
            x: 200 + i * 150,
            y: groundY - 30,
            width: 30,
            height: 30,
            velocityX: -2,
            color: '#800080',
            alive: true
        });
    }
    
    // プラットフォームの初期化
    platforms = [
        { x: 150, y: 250, width: 100, height: 20 },
        { x: 350, y: 200, width: 100, height: 20 },
        { x: 550, y: 150, width: 100, height: 20 }
    ];
    
    // コインの初期化
    coins = [];
    for (let i = 0; i < 8; i++) {
        coins.push({
            x: 100 + i * 90,
            y: groundY - 60,
            width: 20,
            height: 20,
            collected: false,
            color: '#FFD700'
        });
    }
    
    // ゲーム状態リセット
    gameState.score = 0;
    gameState.lives = 3;
    gameState.gameOver = false;
    updateUI();
    
    gameOverElement.style.display = 'none';
}

// キャンバスサイズ調整
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = Math.min(800, container.clientWidth - 40);
    canvas.width = maxWidth;
    canvas.height = maxWidth * 0.5; // 16:8の比率
}

// プレイヤー描画
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // 顔を描画
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(player.x + 8, player.y + 8, 8, 8);
    ctx.fillRect(player.x + 24, player.y + 8, 8, 8);
    
    // 帽子
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(player.x + 5, player.y - 5, 30, 10);
}

// 敵描画
function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.alive) {
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // 目を描画
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(enemy.x + 5, enemy.y + 8, 6, 6);
            ctx.fillRect(enemy.x + 19, enemy.y + 8, 6, 6);
        }
    });
}

// プラットフォーム描画
function drawPlatforms() {
    ctx.fillStyle = '#8B4513';
    platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // プラットフォームの装飾
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(platform.x, platform.y, platform.width, 5);
        ctx.fillStyle = '#8B4513';
    });
}

// コイン描画
function drawCoins() {
    coins.forEach(coin => {
        if (!coin.collected) {
            ctx.fillStyle = coin.color;
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // コインの模様
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// 地面描画
function drawGround() {
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    
    // 草の模様
    ctx.fillStyle = '#32CD32';
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillRect(i, groundY, 10, 5);
    }
}

// 背景描画
function drawBackground() {
    // 空のグラデーション
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#98FB98');
    gradient.addColorStop(1, '#32CD32');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 雲を描画
    ctx.fillStyle = '#FFFFFF';
    drawCloud(100, 50);
    drawCloud(300, 30);
    drawCloud(500, 70);
}

// 雲描画
function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y - 15, 15, 0, Math.PI * 2);
    ctx.fill();
}

// プレイヤー更新
function updatePlayer() {
    // 左右移動
    if (gameState.keys.left) {
        player.velocityX = -player.speed;
    } else if (gameState.keys.right) {
        player.velocityX = player.speed;
    } else {
        player.velocityX *= 0.8; // 摩擦
    }
    
    // ジャンプ
    if (gameState.keys.jump && player.onGround) {
        player.velocityY = -player.jumpPower;
        player.onGround = false;
    }
    
    // 重力適用
    if (!player.onGround) {
        player.velocityY += gravity;
    }
    
    // 位置更新
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // 画面端の制限
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    
    // 地面との衝突
    if (player.y + player.height >= groundY) {
        player.y = groundY - player.height;
        player.velocityY = 0;
        player.onGround = true;
    }
    
    // プラットフォームとの衝突
    checkPlatformCollision();
}

// プラットフォーム衝突チェック
function checkPlatformCollision() {
    platforms.forEach(platform => {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {
            
            // 上から落ちてきた場合
            if (player.velocityY > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.onGround = true;
            }
        }
    });
}

// 敵更新
function updateEnemies() {
    enemies.forEach(enemy => {
        if (enemy.alive) {
            enemy.x += enemy.velocityX;
            
            // 画面端で方向転換
            if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
                enemy.velocityX *= -1;
            }
        }
    });
}

// 衝突チェック
function checkCollisions() {
    // 敵との衝突
    enemies.forEach(enemy => {
        if (enemy.alive && 
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            // 上から踏んだ場合
            if (player.velocityY > 0 && player.y < enemy.y) {
                enemy.alive = false;
                player.velocityY = -8; // 小さなジャンプ
                gameState.score += 100;
            } else {
                // ダメージを受ける
                takeDamage();
            }
        }
    });
    
    // コインとの衝突
    coins.forEach(coin => {
        if (!coin.collected &&
            player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {
            
            coin.collected = true;
            gameState.score += 50;
        }
    });
}

// ダメージ処理
function takeDamage() {
    gameState.lives--;
    if (gameState.lives <= 0) {
        endGame();
    } else {
        // プレイヤーを初期位置に戻す
        player.x = 50;
        player.y = groundY - player.height;
        player.velocityX = 0;
        player.velocityY = 0;
        player.onGround = true;
    }
}

// ゲーム終了
function endGame() {
    gameState.gameOver = true;
    finalScoreElement.textContent = gameState.score;
    gameOverElement.style.display = 'block';
}

// UI更新
function updateUI() {
    scoreElement.textContent = gameState.score;
    livesElement.textContent = gameState.lives;
}

// メインゲームループ
function gameLoop() {
    if (!gameState.gameOver) {
        // 画面クリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 描画
        drawBackground();
        drawGround();
        drawPlatforms();
        drawCoins();
        drawEnemies();
        drawPlayer();
        
        // 更新
        updatePlayer();
        updateEnemies();
        checkCollisions();
        updateUI();
    }
    
    requestAnimationFrame(gameLoop);
}

// イベントリスナー
// キーボード操作
document.addEventListener('keydown', (e) => {
    switch(e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            gameState.keys.left = true;
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'KeyD':
            gameState.keys.right = true;
            e.preventDefault();
            break;
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
            gameState.keys.jump = true;
            e.preventDefault();
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            gameState.keys.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            gameState.keys.right = false;
            break;
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
            gameState.keys.jump = false;
            break;
    }
});

// タッチ操作
leftBtn.addEventListener('touchstart', (e) => {
    gameState.keys.left = true;
    e.preventDefault();
});
leftBtn.addEventListener('touchend', (e) => {
    gameState.keys.left = false;
    e.preventDefault();
});
leftBtn.addEventListener('mousedown', (e) => {
    gameState.keys.left = true;
    e.preventDefault();
});
leftBtn.addEventListener('mouseup', (e) => {
    gameState.keys.left = false;
    e.preventDefault();
});

rightBtn.addEventListener('touchstart', (e) => {
    gameState.keys.right = true;
    e.preventDefault();
});
rightBtn.addEventListener('touchend', (e) => {
    gameState.keys.right = false;
    e.preventDefault();
});
rightBtn.addEventListener('mousedown', (e) => {
    gameState.keys.right = true;
    e.preventDefault();
});
rightBtn.addEventListener('mouseup', (e) => {
    gameState.keys.right = false;
    e.preventDefault();
});

jumpBtn.addEventListener('touchstart', (e) => {
    gameState.keys.jump = true;
    e.preventDefault();
});
jumpBtn.addEventListener('touchend', (e) => {
    gameState.keys.jump = false;
    e.preventDefault();
});
jumpBtn.addEventListener('mousedown', (e) => {
    gameState.keys.jump = true;
    e.preventDefault();
});
jumpBtn.addEventListener('mouseup', (e) => {
    gameState.keys.jump = false;
    e.preventDefault();
});

// リスタートボタン
restartBtn.addEventListener('click', initGame);

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    resizeCanvas();
});

// ゲーム開始
initGame();
gameLoop();