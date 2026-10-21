// 敵クラス（Actorを継承）
class Enemy extends Actor {
  constructor(x, y, type = 'normal', enemyType = 'normal', stageNum = 1) {
    const scale = CONFIG.CHARACTER.scale;
    let w, h;
    if (type === 'boss') {
      const stageBossScale = [1.0, 1.06, 1.12, 1.18, 1.25, 1.3, 1.4];
      const bossScale = stageBossScale[Math.max(0, stageNum - 1)] || 1.0;
      w = CONFIG.CHARACTER.bossBaseW * scale * bossScale;
      h = CONFIG.CHARACTER.bossBaseH * scale * bossScale;
    } else {
      w = CONFIG.CHARACTER.enemyBaseW * scale;
      h = CONFIG.CHARACTER.enemyBaseH * scale;
    }
    
    // Actor基底クラスのコンストラクタを呼び出し
    super(x, y, w, h);
    
    // HP設定
    if (type === 'boss') {
      // HP計算: 基礎200 + (ステージ数 × 100)
      // ステージ1: 300 HP (通常弾で約30発、斧なら約8発)
      // ステージ7: 900 HP
      this.hp = 200 + (stageNum * 100);
    } else {
      this.hp = 20; // 雑魚は2発くらいで倒せる
    }
    // ---------------------------------------------

    this.maxHp = this.hp;
    this.vx = type === 'boss' ? 0 : -2;
    this.vy = 0;
    this.type = type; // 'normal' or 'boss'
    this.enemyType = enemyType; 
    this.stageNum = stageNum;
    this.shootTimer = 0;
    this.timer = 0;
    this.onGround = false;
    this.originalY = y;
    this.originalX = x;
    this.jumpTimer = 0;
    this.zigzagPhase = 0;
    this.spawnMode = 'ground';
    this.spawnTargetY = y;
    this.spawnRiseSpeed = 2;
    
    // ボス専用の変数初期化
    if (type === 'boss') {
      this.attackPhase = 0;
      this.attackTimer = 0;
      this.movePattern = 0;
      this.teleportTimer = 0;
      this.dashTimer = 0;
      this.dashDirection = 0;
      this.dashCooldown = 0;
      this.originalX = x;
      this.originalY = y;
      this.spiralAngle = 0;
    }
    
    // 敵タイプごとの挙動初期化
    if (enemyType === 'jumping') {
      this.jumpPower = -10;
      this.jumpTimer = 60 + Math.random() * 60;
    } else if (enemyType === 'flying') {
      this.vx = -1.5;
      this.flySpeed = 1.5;
      this.flyPhase = Math.random() * Math.PI * 2;
    } else if (enemyType === 'zigzag') {
      this.vx = -2;
      this.zigzagSpeed = 0.1;
      this.zigzagAmplitude = 30;
    } else if (enemyType === 'fast') {
      this.vx = -4;
    } else if (enemyType === 'tracking') {
      this.vx = -1.5;
      this.trackingSpeed = 1;
    } else if (enemyType === 'bouncing') {
      this.vx = -2.5;
      this.vy = -8;
      this.bounceTimer = 0;
    } else if (enemyType === 'hovering') {
      this.vx = -1;
      this.hoverPhase = Math.random() * Math.PI * 2;
      this.hoverAmplitude = 26;
      this.hoverAmplitude2 = 8;
      this.hoverFreq1 = 0.065;
      this.hoverFreq2 = 0.13;
      this.hoverXWave = Math.random() * Math.PI * 2;
      this.hoverXAmplitude = 0.65;
    }
  
   }

  update() {
    // Actor基底クラスのupdateを呼び出し（位置更新）
    super.update();
    
    if (this.type === 'boss') {
      // ボスの行動パターン（ステージごと）
      this.timer++;
      this.attackTimer++;
      
      // ステージごとの行動パターン
      switch(this.stageNum) {
        case 1:
          this.updateBossStage1();
          break;
        case 2:
          this.updateBossStage2();
          break;
        case 3:
          this.updateBossStage3();
          break;
        case 4:
          this.updateBossStage4();
          break;
        case 5:
          this.updateBossStage5();
          break;
        case 6:
          this.updateBossStage6();
          break;
        case 7:
          this.updateBossStage7();
          break;
        default:
          this.updateBossStage1();
          break;
      }
    } else {
      if (this.spawnMode === 'underground' && this.y > this.spawnTargetY) {
        this.y = Math.max(this.spawnTargetY, this.y - this.spawnRiseSpeed);
      }
      // 通常敵の動き（タイプごと）
      this.timer++;
      
      switch(this.enemyType) {
        case 'normal':
          // 通常：左に移動
          this.x += this.vx;
          break;
          
        case 'jumping':
          // ジャンプ敵：定期的にジャンプ
          this.x += this.vx;
          this.jumpTimer--;
          
          // 重力
          if (!this.onGround) {
            this.vy += 0.5;
          }
          
          // 地面判定
          const groundY = 350;
          if (this.y + this.h >= groundY) {
            this.y = groundY - this.h;
            this.vy = 0;
            this.onGround = true;
            
            // ジャンプ
            if (this.jumpTimer <= 0) {
              this.vy = this.jumpPower;
              this.onGround = false;
              this.jumpTimer = 80 + Math.random() * 60;
            }
          }
          
          this.y += this.vy;
          break;
          
        case 'flying':
          // 飛行敵：上下に浮遊しながら移動
          this.x += this.vx;
          this.flyPhase += 0.05;
          this.y = this.originalY + Math.sin(this.flyPhase) * 40;
          break;
          
        case 'zigzag':
          // ジグザグ敵：上下にジグザグ移動
          this.x += this.vx;
          this.zigzagPhase += this.zigzagSpeed;
          this.y = this.originalY + Math.sin(this.zigzagPhase) * this.zigzagAmplitude;
          break;
          
        case 'fast':
          // 高速敵：速く移動
          this.x += this.vx;
          break;
          
        case 'tracking':
          // トラッキング敵：プレイヤーを追いかける（上下方向）
          this.x += this.vx;
          const playerCenterY = player.y + player.h / 2;
          const enemyCenterY = this.y + this.h / 2;
          if (playerCenterY > enemyCenterY + 5) {
            this.y += this.trackingSpeed;
          } else if (playerCenterY < enemyCenterY - 5) {
            this.y -= this.trackingSpeed;
          }
          // 画面内に制限
          if (this.y < 50) this.y = 50;
          if (this.y + this.h > 340) this.y = 340 - this.h;
          break;
          
        case 'bouncing':
          // バウンス敵：跳ねながら移動
          this.x += this.vx;
          this.bounceTimer++;
          
          // 重力
          this.vy += 0.3;
          
          // 地面で跳ね返る
          const groundY2 = 350;
          if (this.y + this.h >= groundY2) {
            this.y = groundY2 - this.h;
            this.vy = -8;
          }
          
          this.y += this.vy;
          break;
          
        case 'hovering':
          // ホバー敵：ドローンらしくふわふわ浮遊
          this.x += this.vx;
          this.hoverPhase += this.hoverFreq1;
          this.hoverXWave += this.hoverFreq2;
          this.y = this.originalY
            + Math.sin(this.hoverPhase) * this.hoverAmplitude
            + Math.sin(this.hoverPhase * 2.1) * this.hoverAmplitude2;
          this.x += Math.sin(this.hoverXWave) * this.hoverXAmplitude;
          break;
      }
    }
  }

  // ボス攻撃パターン（ステージ1: 学級委員 - 単発ショット）
  updateBossStage1() {
    // ゆっくり上下移動
    this.y = this.originalY + Math.sin(this.timer * 0.03) * 20;
    
    // 60フレームごとに単発ショット
    if (this.attackTimer > 60) {
      this.shootSingle();
      this.attackTimer = 0;
    }
  }

  // ボス攻撃パターン（ステージ2: 先輩 - 3WAY弾）
  updateBossStage2() {
    // 少し速く上下移動
    this.y = this.originalY + Math.sin(this.timer * 0.04) * 30;
    
    // 50フレームごとに3WAY弾
    if (this.attackTimer > 50) {
      this.shoot3Way();
      this.attackTimer = 0;
    }
  }

  // ボス攻撃パターン（ステージ3: 番長 - 突進 + 3WAY弾）
  updateBossStage3() {
    // 突進パターン
    this.dashCooldown--;
    if (this.dashCooldown <= 0 && this.dashTimer <= 0) {
      // 突進開始
      this.dashTimer = 90;
      this.dashDirection = player.x > this.x ? 1 : -1;
      this.dashCooldown = 180;
    }
    
    if (this.dashTimer > 0) {
      // 突進中
      this.x += this.dashDirection * 6;
      this.dashTimer--;
      // 画面端で停止
      if (this.x < camera.x + 50 || this.x > camera.x + canvas.width - 110) {
        this.dashTimer = 0;
      }
    } else {
      // 通常時: 上下移動
      this.y = this.originalY + Math.sin(this.timer * 0.04) * 25;
    }
    
    // 40フレームごとに3WAY弾
    if (this.attackTimer > 40) {
      this.shoot3Way();
      this.attackTimer = 0;
    }
  }

  // ボス攻撃パターン（ステージ4: 教授 - 5WAY弾 + テレポート + 円形弾幕）
  updateBossStage4() {
    // テレポートパターン
    this.teleportTimer++;
    if (this.teleportTimer > 150) {
      // ランダムな位置にテレポート
      this.x = camera.x + 300 + Math.random() * 300;
      this.y = 150 + Math.random() * 150;
      this.originalY = this.y;
      this.teleportTimer = 0;
    }
    
    // ゆっくり移動
    this.y = this.originalY + Math.sin(this.timer * 0.03) * 20;
    
    // 攻撃パターン切り替え
    const pattern = Math.floor(this.attackTimer / 60) % 3;
    if (this.attackTimer % 60 === 0) {
      if (pattern === 0) {
        this.shoot5Way();
      } else if (pattern === 1) {
        this.shootCircle();
      } else {
        this.shoot3Way();
      }
    }
  }

  // ボス攻撃パターン（ステージ5: 上司 - 全方位弾 + 突進 + 追尾弾）
  updateBossStage5() {
    // 突進パターン
    this.dashCooldown--;
    if (this.dashCooldown <= 0 && this.dashTimer <= 0) {
      this.dashTimer = 60;
      this.dashDirection = player.x > this.x ? 1 : -1;
      this.dashCooldown = 120;
    }
    
    if (this.dashTimer > 0) {
      this.x += this.dashDirection * 8;
      this.dashTimer--;
      if (this.x < camera.x + 50 || this.x > camera.x + canvas.width - 110) {
        this.dashTimer = 0;
      }
    } else {
      this.y = this.originalY + Math.sin(this.timer * 0.05) * 35;
    }
    
    // 攻撃パターン切り替え
    const pattern = Math.floor(this.attackTimer / 45) % 3;
    if (this.attackTimer % 45 === 0) {
      if (pattern === 0) {
        this.shootAllDirections();
      } else if (pattern === 1) {
        this.shootHoming();
      } else {
        this.shoot5Way();
      }
    }
  }

  // ボス攻撃パターン（ステージ6: 部長 - フェーズ変化）
  updateBossStage6() {
    const hpPercent = this.hp / this.maxHp;
    
    // HPに応じたフェーズ
    if (hpPercent > 0.7) {
      // フェーズ1: ゆっくり移動 + 3WAY弾
      this.y = this.originalY + Math.sin(this.timer * 0.03) * 20;
      if (this.attackTimer > 50) {
        this.shoot3Way();
        this.attackTimer = 0;
      }
    } else if (hpPercent > 0.4) {
      // フェーズ2: 速く移動 + 5WAY弾 + 突進
      this.y = this.originalY + Math.sin(this.timer * 0.05) * 30;
      this.dashCooldown--;
      if (this.dashCooldown <= 0 && this.dashTimer <= 0) {
        this.dashTimer = 60;
        this.dashDirection = player.x > this.x ? 1 : -1;
        this.dashCooldown = 100;
      }
      if (this.dashTimer > 0) {
        this.x += this.dashDirection * 7;
        this.dashTimer--;
        if (this.x < camera.x + 50 || this.x > camera.x + canvas.width - 110) {
          this.dashTimer = 0;
        }
      }
      if (this.attackTimer > 40) {
        this.shoot5Way();
        this.attackTimer = 0;
      }
    } else {
      // フェーズ3: 超速移動 + 全方位弾幕 + 追尾弾
      this.y = this.originalY + Math.sin(this.timer * 0.07) * 40;
      this.dashCooldown--;
      if (this.dashCooldown <= 0 && this.dashTimer <= 0) {
        this.dashTimer = 45;
        this.dashDirection = player.x > this.x ? 1 : -1;
        this.dashCooldown = 80;
      }
      if (this.dashTimer > 0) {
        this.x += this.dashDirection * 9;
        this.dashTimer--;
        if (this.x < camera.x + 50 || this.x > camera.x + canvas.width - 110) {
          this.dashTimer = 0;
        }
      }
      const pattern = Math.floor(this.attackTimer / 30) % 2;
      if (this.attackTimer % 30 === 0) {
        if (pattern === 0) {
          this.shootAllDirections();
        } else {
          this.shootHoming();
        }
      }
    }
  }

  // ボス攻撃パターン（ステージ7: 魔王 - 全方位弾幕 + 雑魚召喚 + 突進 + レーザー）
  updateBossStage7() {
    const hpPercent = this.hp / this.maxHp;
    
    // フェーズ1: 全方位 + 突進
    if (hpPercent > 0.5) {
      this.y = this.originalY + Math.sin(this.timer * 0.06) * 35;
      this.dashCooldown--;
      if (this.dashCooldown <= 0 && this.dashTimer <= 0) {
        this.dashTimer = 50;
        this.dashDirection = player.x > this.x ? 1 : -1;
        this.dashCooldown = 90;
      }
      if (this.dashTimer > 0) {
        this.x += this.dashDirection * 10;
        this.dashTimer--;
        if (this.x < camera.x + 50 || this.x > camera.x + canvas.width - 110) {
          this.dashTimer = 0;
        }
      }
      if (this.attackTimer > 35) {
        this.shootAllDirections();
        this.attackTimer = 0;
      }
    } else {
      // フェーズ2: 全方位 + 雑魚召喚 + レーザー
      this.teleportTimer++;
      if (this.teleportTimer > 120) {
        this.x = camera.x + 300 + Math.random() * 300;
        this.y = 150 + Math.random() * 150;
        this.originalY = this.y;
        this.teleportTimer = 0;
        // 雑魚召喚
        this.summonMinions();
      }
      this.y = this.originalY + Math.sin(this.timer * 0.08) * 40;
      const pattern = Math.floor(this.attackTimer / 25) % 3;
      if (this.attackTimer % 25 === 0) {
        if (pattern === 0) {
          this.shootAllDirections();
        } else if (pattern === 1) {
          this.shootLaser();
        } else {
          this.shootCircle();
        }
      }
    }
  }

  // 攻撃メソッド
  shootSingle() {
    const centerY = this.y + this.h / 2;
    projectiles.push({
      x: this.x,
      y: centerY,
      vx: -5,
      vy: 0,
      enemy: true,
      w: 8,
      h: 8
    });
  }

  shoot3Way() {
    const centerY = this.y + this.h / 2;
    const angles = [-Math.PI / 6, 0, Math.PI / 6];
    angles.forEach(angle => {
      projectiles.push({
        x: this.x,
        y: centerY,
        vx: -5 * Math.cos(angle),
        vy: -5 * Math.sin(angle),
        enemy: true,
        w: 8,
        h: 8
      });
    });
  }

  shoot5Way() {
    const centerY = this.y + this.h / 2;
    const angles = [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3];
    angles.forEach(angle => {
      projectiles.push({
        x: this.x,
        y: centerY,
        vx: -6 * Math.cos(angle),
        vy: -6 * Math.sin(angle),
        enemy: true,
        w: 8,
        h: 8
      });
    });
  }

  shootCircle() {
    const centerY = this.y + this.h / 2;
    const bulletCount = 8;
    for (let i = 0; i < bulletCount; i++) {
      const angle = (Math.PI * 2 * i) / bulletCount;
      projectiles.push({
        x: this.x,
        y: centerY,
        vx: -4 * Math.cos(angle),
        vy: -4 * Math.sin(angle),
        enemy: true,
        w: 8,
        h: 8
      });
    }
  }

  shootAllDirections() {
    const centerY = this.y + this.h / 2;
    const bulletCount = 16;
    for (let i = 0; i < bulletCount; i++) {
      const angle = (Math.PI * 2 * i) / bulletCount;
      projectiles.push({
        x: this.x,
        y: centerY,
        vx: -5 * Math.cos(angle),
        vy: -5 * Math.sin(angle),
        enemy: true,
        w: 8,
        h: 8
      });
    }
  }

  shootHoming() {
    const centerY = this.y + this.h / 2;
    const dx = player.x - this.x;
    const dy = (player.y + player.h / 2) - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const vx = (dx / dist) * -4;
    const vy = (dy / dist) * -4;
    projectiles.push({
      x: this.x,
      y: centerY,
      vx: vx,
      vy: vy,
      enemy: true,
      w: 8,
      h: 8,
      homing: true
    });
  }

  shootLaser() {
    const centerY = this.y + this.h / 2;
    // 太いビーム
    projectiles.push({
      x: this.x,
      y: centerY - 15,
      vx: -8,
      vy: 0,
      enemy: true,
      w: 20,
      h: 30,
      laser: true
    });
  }

  summonMinions() {
    // 雑魚を2体召喚
    if (enemies.length < 3) {
      enemies.push(new Enemy(camera.x + 800, 300, 'normal', 'normal', this.stageNum));
      enemies.push(new Enemy(camera.x + 850, 320, 'normal', 'normal', this.stageNum));
    }
  }

  shoot() {
    // 後方互換性のため残す
    this.shootSingle();
  }

  draw(stageNum) {
    // SVG風描画関数を使用（ステージ×敵タイプごと）
    const facing = this.vx > 0 ? 1 : -1;
    drawEnemySVG(this.x, this.y, this.type, stageNum, this.enemyType, facing);
    
    // HPバー（ボス用）
    if (this.type === 'boss') {
      const hpWidth = 80;
      const hpPercent = this.hp / this.maxHp;
      const px = this.x - camera.x;
      
      // HPバーの背景
      ctx.fillStyle = '#000';
      ctx.fillRect(px - 10, this.y - 15, hpWidth, 8);
      // HPバーの枠
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 10, this.y - 15, hpWidth, 8);
      // HPバー
      ctx.fillStyle = hpPercent > 0.5 ? '#00FF00' : hpPercent > 0.25 ? '#FFFF00' : '#FF0000';
      ctx.fillRect(px - 9, this.y - 14, (hpWidth - 2) * hpPercent, 6);
    }
  }
}
