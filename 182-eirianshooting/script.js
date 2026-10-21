(() => {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const INVINCIBLE_FRAMES = 60;
    const PU_DROP_RATE = 0.28;
    const MAX_WEAPON = 10;
    const MUTE_KEY = 'eirian-mute';

    // ── Sound (WebAudio, no asset files) ──
    let audioCtx = null;
    let muted = false;
    let bgmNodes = null;
    let bgmStep = 0;
    let bgmTimer = null;
    let shootBeepGate = 0;

    try {
        muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch (_) { /* ignore */ }

    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function unlockAudio() {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        // silent buffer unlock for iOS
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
    }

    function beep(freq, dur, type, vol, slideTo) {
        if (muted || !audioCtx) return;
        const ctx = audioCtx;
        if (ctx.state === 'suspended') ctx.resume();
        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, t0);
        if (slideTo != null) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
        }
        gain.gain.setValueAtTime(vol || 0.08, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
    }

    function playSE(name) {
        if (muted) return;
        unlockAudio();
        if (name === 'shoot') {
            // throttle auto-fire SE
            if (performance.now() - shootBeepGate < 90) return;
            shootBeepGate = performance.now();
            beep(880, 0.04, 'square', 0.035, 440);
        } else if (name === 'explode') {
            beep(180, 0.18, 'sawtooth', 0.1, 40);
        } else if (name === 'hit') {
            beep(120, 0.12, 'triangle', 0.12, 60);
        } else if (name === 'power') {
            beep(520, 0.08, 'square', 0.08, 1040);
            setTimeout(() => beep(780, 0.1, 'square', 0.07), 70);
        } else if (name === 'boss') {
            beep(200, 0.25, 'sawtooth', 0.1, 100);
            setTimeout(() => beep(150, 0.3, 'square', 0.08, 80), 120);
        } else if (name === 'clear') {
            beep(440, 0.1, 'square', 0.08);
            setTimeout(() => beep(660, 0.1, 'square', 0.08), 100);
            setTimeout(() => beep(880, 0.18, 'square', 0.09), 200);
        }
    }

    // Simple 3-voice loop BGM (melody + bass + noise tick)
    const BGM_MELODY = [392, 440, 494, 523, 494, 440, 392, 330, 349, 392, 440, 392, 330, 294, 330, 392];
    const BGM_BASS = [98, 98, 110, 110, 123, 123, 98, 98, 87, 87, 98, 98, 110, 98, 87, 98];

    function stopBGM() {
        if (bgmTimer) {
            clearInterval(bgmTimer);
            bgmTimer = null;
        }
        bgmNodes = null;
    }

    function startBGM() {
        stopBGM();
        if (muted) return;
        unlockAudio();
        bgmStep = 0;
        bgmTimer = setInterval(() => {
            if (muted || !audioCtx || gameState !== 'playing') return;
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const t0 = audioCtx.currentTime;
            const mel = BGM_MELODY[bgmStep % BGM_MELODY.length];
            const bas = BGM_BASS[bgmStep % BGM_BASS.length];

            const o1 = audioCtx.createOscillator();
            const g1 = audioCtx.createGain();
            o1.type = 'square';
            o1.frequency.value = mel;
            g1.gain.setValueAtTime(0.04, t0);
            g1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
            o1.connect(g1);
            g1.connect(audioCtx.destination);
            o1.start(t0);
            o1.stop(t0 + 0.2);

            const o2 = audioCtx.createOscillator();
            const g2 = audioCtx.createGain();
            o2.type = 'triangle';
            o2.frequency.value = bas;
            g2.gain.setValueAtTime(0.05, t0);
            g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
            o2.connect(g2);
            g2.connect(audioCtx.destination);
            o2.start(t0);
            o2.stop(t0 + 0.24);

            if (bgmStep % 4 === 0) {
                const o3 = audioCtx.createOscillator();
                const g3 = audioCtx.createGain();
                o3.type = 'square';
                o3.frequency.value = 80;
                g3.gain.setValueAtTime(0.03, t0);
                g3.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);
                o3.connect(g3);
                g3.connect(audioCtx.destination);
                o3.start(t0);
                o3.stop(t0 + 0.06);
            }

            bgmStep++;
        }, 160);
    }

    function updateMuteUI() {
        const btn = document.getElementById('muteBtn');
        if (btn) btn.textContent = muted ? '🔇' : '🔊';
    }

    function toggleMute() {
        muted = !muted;
        try {
            localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
        } catch (_) { /* ignore */ }
        updateMuteUI();
        if (muted) stopBGM();
        else if (gameState === 'playing') startBGM();
        if (navigator.vibrate) navigator.vibrate(10);
    }

    document.getElementById('muteBtn').addEventListener('click', (e) => {
        e.preventDefault();
        unlockAudio();
        toggleMute();
    });
    updateMuteUI();

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopBGM();
        } else if (gameState === 'playing' && !muted) {
            unlockAudio();
            startBGM();
        }
    });
    window.addEventListener('pageshow', () => {
        if (gameState === 'playing' && !muted) {
            unlockAudio();
            startBGM();
        }
    });

    function resizeCanvas() {
        const aspectRatio = 9 / 16;
        let width = window.innerWidth;
        let height = window.innerHeight;
        if (width / height > aspectRatio) width = height * aspectRatio;
        else height = width / aspectRatio;
        canvas.width = Math.min(width, 600) | 0;
        canvas.height = Math.min(height, 800) | 0;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));

    let gameState = 'start';
    let score = 0;
    let stage = 1;
    let playerHP = 100;
    let weaponLevel = 1;
    let lastTime = 0;
    let invincible = 0;
    let shake = 0;
    let waveKillsNeeded = 0;
    let waveKills = 0;
    let phase = 'wave';
    let boss = null;
    let bossPattern = 'straight';
    let bossPatternTimer = 0;
    let clearTimer = 0;
    let spawnQueue = 0;
    let spawnCooldown = 0;

    const planets = [
        { name: '水星', color: '#8c7853', enemyType: 'octopus', enemyColor: '#ff6b9d' },
        { name: '金星', color: '#ffd700', enemyType: 'squid', enemyColor: '#00ffff' },
        { name: '地球', color: '#4169e1', enemyType: 'snake', enemyColor: '#00ff00' },
        { name: '火星', color: '#cd5c5c', enemyType: 'human', enemyColor: '#ff4500' },
        { name: '木星', color: '#daa520', enemyType: 'machine', enemyColor: '#c0c0c0' },
        { name: '土星', color: '#f4a460', enemyType: 'octopus', enemyColor: '#9370db' },
        { name: '天王星', color: '#40e0d0', enemyType: 'squid', enemyColor: '#ff1493' },
        { name: '海王星', color: '#1e90ff', enemyType: 'snake', enemyColor: '#ffd700' }
    ];

    const player = {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        speed: 6,
        shootCooldown: 0
    };

    function resetPlayerPosition() {
        player.x = canvas.width / 2;
        player.y = canvas.height - 120;
    }
    resetPlayerPosition();

    let bullets = [];
    let enemies = [];
    let enemyBullets = [];
    let powerups = [];
    let particles = [];
    let stars = [];
    let currentPlanet = null;

    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * 600,
            y: Math.random() * 800,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.2
        });
    }

    const keys = {};

    window.addEventListener('keydown', e => {
        if (['ArrowLeft', 'ArrowRight', ' ', 'Enter', 'a', 'A', 'd', 'D', 'm', 'M'].includes(e.key)) {
            e.preventDefault();
        }
        if (e.key === 'm' || e.key === 'M') {
            unlockAudio();
            toggleMute();
            return;
        }
        keys[e.key] = true;
        unlockAudio();
    });
    window.addEventListener('keyup', e => {
        keys[e.key] = false;
    });

    function bindHold(el, key) {
        const on = (e) => {
            e.preventDefault();
            if (e.pointerId != null && el.setPointerCapture) {
                try { el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
            }
            keys[key] = true;
            el.classList.add('pressed');
            unlockAudio();
            if (navigator.vibrate) navigator.vibrate(12);
        };
        const off = (e) => {
            e.preventDefault();
            keys[key] = false;
            el.classList.remove('pressed');
        };
        el.addEventListener('pointerdown', on);
        el.addEventListener('pointerup', off);
        el.addEventListener('pointercancel', off);
        el.addEventListener('pointerleave', off);
    }
    bindHold(document.getElementById('leftBtn'), 'ArrowLeft');
    bindHold(document.getElementById('rightBtn'), 'ArrowRight');

    let lastTap = 0;
    document.addEventListener('touchstart', (e) => {
        const now = Date.now();
        if (now - lastTap < 300) e.preventDefault();
        lastTap = now;
    }, { passive: false });
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTap <= 300) e.preventDefault();
    }, { passive: false });
    document.addEventListener('dblclick', (e) => e.preventDefault());
    document.addEventListener('selectstart', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('gesturestart', (e) => e.preventDefault());

    function updateHUD() {
        document.getElementById('stage').textContent = stage;
        document.getElementById('planetName').textContent = currentPlanet ? currentPlanet.name : '-';
        document.getElementById('score').textContent = score;
        document.getElementById('hp').textContent = Math.max(0, playerHP);
        document.getElementById('weapon').textContent = weaponLevel;
        const waveEl = document.getElementById('waveInfo');
        if (phase === 'wave') {
            waveEl.textContent = `ウェーブ ${waveKills}/${waveKillsNeeded}`;
        } else if (phase === 'boss') {
            waveEl.textContent = 'BOSS戦';
        } else {
            waveEl.textContent = 'クリア';
        }
        const wrap = document.getElementById('bossBarWrap');
        if (boss && phase === 'boss') {
            wrap.style.display = 'block';
            document.getElementById('bossLabel').textContent = `${currentPlanet.name}のボス`;
            const pct = Math.max(0, boss.hp / boss.maxHp);
            document.getElementById('bossBarFill').style.transform = `scaleX(${pct})`;
        } else {
            wrap.style.display = 'none';
        }
    }

    function startGame() {
        unlockAudio();
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('stageClearScreen').style.display = 'none';
        gameState = 'playing';
        score = 0;
        stage = 1;
        playerHP = 100;
        weaponLevel = 1;
        invincible = 0;
        shake = 0;
        bullets = [];
        enemies = [];
        enemyBullets = [];
        powerups = [];
        particles = [];
        boss = null;
        resetPlayerPosition();
        loadStage();
        startBGM();
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('retryBtn').addEventListener('click', () => {
        document.getElementById('gameOverScreen').style.display = 'none';
        startGame();
    });

    function loadStage() {
        enemies = [];
        enemyBullets = [];
        powerups = [];
        boss = null;
        phase = 'wave';
        waveKills = 0;
        waveKillsNeeded = 5 + stage;
        spawnQueue = waveKillsNeeded;
        spawnCooldown = 0;
        currentPlanet = planets[(stage - 1) % planets.length];
        updateHUD();
    }

    function spawnEnemy() {
        enemies.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: -60,
            width: 60,
            height: 60,
            speed: (1 + stage * 0.25) * 1.15,
            hp: 2 + Math.floor(stage / 2),
            maxHp: 2 + Math.floor(stage / 2),
            type: currentPlanet.enemyType,
            color: currentPlanet.enemyColor,
            shootTimer: Math.random() * 90 + 45,
            hitFlash: 0,
            isBoss: false
        });
    }

    function spawnBoss() {
        phase = 'boss';
        enemies = [];
        const maxHp = 40 + stage * 18;
        boss = {
            x: canvas.width / 2,
            y: Math.max(160, canvas.height * 0.22),
            width: 90,
            height: 90,
            speed: 1.6 + stage * 0.08,
            hp: maxHp,
            maxHp: maxHp,
            type: currentPlanet.enemyType,
            color: currentPlanet.enemyColor,
            shootTimer: 40,
            hitFlash: 0,
            isBoss: true,
            dir: 1,
            patternIndex: 0
        };
        enemies.push(boss);
        bossPattern = 'straight';
        bossPatternTimer = 180;
        playSE('boss');
        updateHUD();
    }

    function spawnParticles(x, y, color, count, speed) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = speed * (0.4 + Math.random());
            particles.push({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life: 20 + (Math.random() * 16 | 0),
                maxLife: 36,
                color,
                r: 2 + Math.random() * 4
            });
        }
    }

    function maybeDropPowerup(x, y) {
        if (Math.random() > PU_DROP_RATE) return;
        if (weaponLevel >= MAX_WEAPON) return;
        powerups.push({ x, y, vy: 1.8, width: 22, height: 22 });
    }

    function damagePlayer(amount) {
        if (invincible > 0 || gameState !== 'playing') return;
        playerHP -= amount;
        invincible = INVINCIBLE_FRAMES;
        shake = 10;
        spawnParticles(player.x, player.y, '#ffffff', 8, 3);
        playSE('hit');
        updateHUD();
        if (playerHP <= 0) gameOver();
    }

    function killEnemy(enemy, index) {
        spawnParticles(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 40 : 14, enemy.isBoss ? 7 : 4);
        playSE('explode');
        maybeDropPowerup(enemy.x, enemy.y);
        score += enemy.isBoss ? 1000 * stage : 100 * stage;
        enemies.splice(index, 1);

        if (enemy.isBoss) {
            boss = null;
            phase = 'clear';
            clearTimer = 90;
            playSE('clear');
            document.getElementById('clearMsg').textContent =
                `${currentPlanet.name}クリア！ 次は ${planets[stage % planets.length].name}`;
            document.getElementById('stageClearScreen').style.display = 'flex';
            updateHUD();
            return;
        }

        if (phase === 'wave') {
            waveKills++;
            if (waveKills >= waveKillsNeeded && enemies.length === 0 && spawnQueue <= 0) {
                spawnBoss();
            }
        }
        updateHUD();
    }

    function shoot() {
        if (player.shootCooldown > 0) return;
        const bulletSpeed = 9;
        const damage = weaponLevel;
        if (weaponLevel === 1) {
            bullets.push({ x: player.x, y: player.y - 30, speed: bulletSpeed, damage, angle: 0 });
        } else if (weaponLevel <= 3) {
            bullets.push({ x: player.x - 10, y: player.y - 25, speed: bulletSpeed, damage, angle: 0 });
            bullets.push({ x: player.x + 10, y: player.y - 25, speed: bulletSpeed, damage, angle: 0 });
        } else if (weaponLevel <= 6) {
            bullets.push({ x: player.x, y: player.y - 30, speed: bulletSpeed, damage, angle: 0 });
            bullets.push({ x: player.x - 15, y: player.y - 20, speed: bulletSpeed, damage, angle: -0.08 });
            bullets.push({ x: player.x + 15, y: player.y - 20, speed: bulletSpeed, damage, angle: 0.08 });
        } else {
            for (let i = -2; i <= 2; i++) {
                bullets.push({
                    x: player.x + i * 10,
                    y: player.y - 25,
                    speed: bulletSpeed,
                    damage,
                    angle: i * 0.1
                });
            }
        }
        player.shootCooldown = Math.max(6, 14 - weaponLevel);
        playSE('shoot');
    }

    function bossFire(enemy) {
        const patterns = ['straight', 'aimed', 'spread'];
        bossPatternTimer--;
        if (bossPatternTimer <= 0) {
            enemy.patternIndex = (enemy.patternIndex + 1) % patterns.length;
            bossPattern = patterns[enemy.patternIndex];
            bossPatternTimer = 150 + Math.random() * 60;
        }

        if (bossPattern === 'straight') {
            enemyBullets.push({ x: enemy.x, y: enemy.y + 40, vx: 0, vy: 4.5, dmg: 15 });
        } else if (bossPattern === 'aimed') {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const len = Math.hypot(dx, dy) || 1;
            const sp = 4.2;
            enemyBullets.push({
                x: enemy.x, y: enemy.y + 30,
                vx: (dx / len) * sp, vy: (dy / len) * sp, dmg: 15
            });
        } else {
            for (let i = -1; i <= 1; i++) {
                const ang = Math.PI / 2 + i * 0.35;
                enemyBullets.push({
                    x: enemy.x, y: enemy.y + 35,
                    vx: Math.cos(ang) * 4,
                    vy: Math.sin(ang) * 4,
                    dmg: 15
                });
            }
        }
    }

    function checkCollision(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    }

    function update() {
        if (gameState !== 'playing') return;

        if (phase === 'clear') {
            clearTimer--;
            if (clearTimer <= 0) {
                document.getElementById('stageClearScreen').style.display = 'none';
                stage++;
                loadStage();
            }
        }

        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            player.x = Math.max(40, player.x - player.speed);
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            player.x = Math.min(canvas.width - 40, player.x + player.speed);
        }

        if (phase !== 'clear') shoot();
        if (player.shootCooldown > 0) player.shootCooldown--;
        if (invincible > 0) invincible--;
        if (shake > 0) shake--;

        stars.forEach(star => {
            star.y += star.speed;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });

        if (phase === 'wave' && spawnQueue > 0) {
            spawnCooldown--;
            if (spawnCooldown <= 0) {
                spawnEnemy();
                spawnQueue--;
                spawnCooldown = Math.max(25, 55 - stage * 3);
            }
        }

        bullets = bullets.filter(b => {
            b.y -= b.speed;
            if (b.angle) b.x += Math.sin(b.angle) * 3;
            return b.y > -12;
        });

        enemies.forEach(enemy => {
            if (enemy.hitFlash > 0) enemy.hitFlash--;
            if (enemy.isBoss) {
                enemy.x += enemy.speed * enemy.dir;
                if (enemy.x < 50 || enemy.x > canvas.width - 50) enemy.dir *= -1;
                const bossBaseY = Math.max(160, canvas.height * 0.22);
                enemy.y = bossBaseY + Math.sin(performance.now() / 500) * 14;
                enemy.shootTimer--;
                if (enemy.shootTimer <= 0) {
                    bossFire(enemy);
                    enemy.shootTimer = Math.max(18, 36 - stage);
                }
            } else {
                enemy.y += enemy.speed;
                enemy.shootTimer--;
                if (enemy.shootTimer <= 0) {
                    enemyBullets.push({
                        x: enemy.x, y: enemy.y + 30,
                        vx: 0, vy: 4, dmg: 10
                    });
                    enemy.shootTimer = 55 + Math.random() * 50;
                }
                if (enemy.y > canvas.height + 60) {
                    enemy.y = -60;
                    enemy.x = Math.random() * (canvas.width - 60) + 30;
                }
            }
        });

        enemyBullets = enemyBullets.filter(b => {
            b.x += b.vx || 0;
            b.y += b.vy || b.speed || 0;
            return b.y < canvas.height + 20 && b.y > -20 && b.x > -20 && b.x < canvas.width + 20;
        });

        powerups = powerups.filter(p => {
            p.y += p.vy;
            return p.y < canvas.height + 30;
        });

        particles = particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life--;
            return p.life > 0;
        });

        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            const bullet = bullets[bi];
            for (let ei = enemies.length - 1; ei >= 0; ei--) {
                const enemy = enemies[ei];
                const hw = enemy.isBoss ? 45 : 30;
                const hh = enemy.isBoss ? 45 : 30;
                if (checkCollision(
                    { x: bullet.x - 5, y: bullet.y - 5, width: 10, height: 10 },
                    { x: enemy.x - hw, y: enemy.y - hh, width: hw * 2, height: hh * 2 }
                )) {
                    enemy.hp -= bullet.damage;
                    enemy.hitFlash = 6;
                    bullets.splice(bi, 1);
                    if (enemy.hp <= 0) killEnemy(enemy, ei);
                    else if (enemy.isBoss) updateHUD();
                    break;
                }
            }
        }

        for (let bi = enemyBullets.length - 1; bi >= 0; bi--) {
            const bullet = enemyBullets[bi];
            if (checkCollision(
                { x: bullet.x - 5, y: bullet.y - 5, width: 10, height: 10 },
                { x: player.x - 22, y: player.y - 22, width: 44, height: 44 }
            )) {
                enemyBullets.splice(bi, 1);
                damagePlayer(bullet.dmg || 10);
            }
        }

        if (invincible <= 0) {
            for (let ei = 0; ei < enemies.length; ei++) {
                const enemy = enemies[ei];
                const hw = enemy.isBoss ? 40 : 28;
                if (checkCollision(
                    { x: player.x - 20, y: player.y - 20, width: 40, height: 40 },
                    { x: enemy.x - hw, y: enemy.y - hw, width: hw * 2, height: hw * 2 }
                )) {
                    damagePlayer(enemy.isBoss ? 20 : 12);
                    break;
                }
            }
        }

        for (let i = powerups.length - 1; i >= 0; i--) {
            const p = powerups[i];
            if (checkCollision(
                { x: player.x - 25, y: player.y - 25, width: 50, height: 50 },
                { x: p.x - 11, y: p.y - 11, width: 22, height: 22 }
            )) {
                powerups.splice(i, 1);
                if (weaponLevel < MAX_WEAPON) {
                    weaponLevel++;
                    spawnParticles(player.x, player.y - 20, '#ffff00', 10, 3);
                    playSE('power');
                    updateHUD();
                }
            }
        }

        if (phase === 'wave' && waveKills >= waveKillsNeeded && enemies.length === 0 && spawnQueue <= 0) {
            spawnBoss();
        }
    }

    function drawPlayer() {
        if (invincible > 0 && (invincible % 6 < 3)) return;
        ctx.save();
        ctx.translate(player.x, player.y);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 30, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0099ff';
        ctx.beginPath();
        ctx.moveTo(-35, 10);
        ctx.lineTo(-15, -5);
        ctx.lineTo(-15, 15);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(35, 10);
        ctx.lineTo(15, -5);
        ctx.lineTo(15, 15);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#00ffff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(-25, 20);
        ctx.lineTo(25, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0066cc';
        ctx.beginPath();
        ctx.arc(0, -5, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const flame = Math.random() * 8;
        ctx.fillStyle = '#ff6b00';
        ctx.beginPath();
        ctx.moveTo(-15, 20);
        ctx.lineTo(-10, 30 + flame);
        ctx.lineTo(-20, 20);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(15, 20);
        ctx.lineTo(10, 30 + flame);
        ctx.lineTo(20, 20);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    function drawEnemy(enemy) {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        if (enemy.hitFlash > 0) ctx.filter = 'brightness(3)';
        const scale = enemy.isBoss ? 1.5 : 1;
        ctx.scale(scale, scale);
        ctx.fillStyle = enemy.color;

        if (enemy.type === 'octopus') {
            ctx.beginPath();
            ctx.arc(0, -10, 20, 0, Math.PI * 2);
            ctx.fill();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * 15, Math.sin(angle) * 15 - 10);
                ctx.lineTo(Math.cos(angle) * 25, Math.sin(angle) * 25 + 20);
                ctx.lineWidth = 4;
                ctx.strokeStyle = enemy.color;
                ctx.stroke();
            }
        } else if (enemy.type === 'squid') {
            ctx.beginPath();
            ctx.ellipse(0, -5, 18, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 12, 20);
                ctx.lineTo(i * 15, 35);
                ctx.lineWidth = 5;
                ctx.strokeStyle = enemy.color;
                ctx.stroke();
            }
        } else if (enemy.type === 'snake') {
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(0, i * 8 - 15, 12 - i, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (enemy.type === 'human') {
            ctx.beginPath();
            ctx.arc(0, -15, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-8, -3, 16, 25);
            ctx.fillRect(-18, 0, 10, 4);
            ctx.fillRect(8, 0, 10, 4);
        } else {
            ctx.fillRect(-15, -15, 30, 30);
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(-8, -8, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(8, -8, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        if (enemy.isBoss) {
            ctx.filter = 'none';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(-28, -28, 56, 56);
        }

        ctx.filter = 'none';
        ctx.restore();
    }

    function drawPlanet() {
        if (!currentPlanet) return;
        ctx.save();
        const planetX = canvas.width / 2;
        // 画面上部のHUD・ノッチを避け、惑星全体がキャンバス内に収まる位置
        const planetSize = Math.min(70, canvas.height * 0.1);
        const planetY = Math.max(planetSize + 24, canvas.height * 0.28);
        const gradient = ctx.createRadialGradient(
            planetX - 20, planetY - 20, 10,
            planetX, planetY, planetSize
        );
        gradient.addColorStop(0, currentPlanet.color);
        gradient.addColorStop(1, '#000');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetSize, 0, Math.PI * 2);
        ctx.fill();
        if (currentPlanet.name === '土星') {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.ellipse(planetX, planetY, planetSize + 30, 15, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    function draw() {
        ctx.save();
        if (shake > 0) {
            ctx.translate((Math.random() - 0.5) * shake * 2, (Math.random() - 0.5) * shake * 2);
        }

        ctx.fillStyle = 'rgba(0, 4, 40, 0.35)';
        ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

        stars.forEach(star => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(star.x % canvas.width, star.y % canvas.height, star.size, 0, Math.PI * 2);
            ctx.fill();
        });

        drawPlanet();

        const colors = ['#00ffff', '#00ff00', '#ffff00', '#ff00ff', '#ff0000'];
        bullets.forEach(bullet => {
            ctx.fillStyle = colors[Math.min(4, Math.floor((weaponLevel - 1) / 2))];
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
            ctx.fill();
            if (weaponLevel >= 5) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y + 10, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        enemies.forEach(drawEnemy);

        enemyBullets.forEach(bullet => {
            ctx.fillStyle = bullet.dmg >= 15 ? '#ff66ff' : '#ff0000';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.dmg >= 15 ? 7 : 5, 0, Math.PI * 2);
            ctx.fill();
        });

        powerups.forEach(p => {
            ctx.fillStyle = '#ffd700';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('P', p.x, p.y + 1);
        });

        particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * (p.life / p.maxLife), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        drawPlayer();
        ctx.restore();
    }

    function gameLoop(currentTime) {
        lastTime = currentTime;
        update();
        draw();
        if (gameState === 'playing') requestAnimationFrame(gameLoop);
    }

    function gameOver() {
        gameState = 'gameover';
        boss = null;
        stopBGM();
        document.getElementById('bossBarWrap').style.display = 'none';
        document.getElementById('finalScore').textContent = score;
        document.getElementById('gameOverScreen').style.display = 'flex';
    }
})();
