// 障害物クラス（Actorを継承）
class Obstacle extends Actor {
  constructor(x, y, w, h, type, stageNum) {
    // Actor基底クラスのコンストラクタを呼び出し
    super(x, y, w, h);
    
    this.type = type; // 'spike', 'platform', 'crumblingPlatform', 'movingPlatform', ...
    this.stageNum = stageNum;
    this.originalY = y;
    this.originalX = x;
    this.vx = 0;
    this.vy = 0;
    this.timer = 0;
    this.damage = 10; // ダメージ量
    this.speed = 1;
    
    // タイプごとの初期化
    if (type === 'movingPlatform') {
      this.vx = stageNum <= 2 ? 1 : stageNum <= 4 ? 1.5 : 2;
      this.range = 100;
    } else if (type === 'pendulum') {
      this.angle = 0;
      this.angleSpeed = stageNum <= 2 ? 0.03 : stageNum <= 4 ? 0.05 : 0.07;
      this.length = 60;
      this.radius = 15;
    } else if (type === 'fallingRock') {
      this.vy = 0;
      this.fallTimer = Math.random() * 60;
    } else if (type === 'hammer') {
      this.originalY = y;
      this.hammerY = y;
      this.direction = 1;
    } else if (type === 'laser') {
      this.laserOn = true;
      this.laserTimer = 0;
    } else if (type === 'crumblingPlatform') {
      this.crumbling = false;
      this.crumbleTimer = 0;
    } else if (type === 'clubBall' || type === 'can' || type === 'floatingRock') {
      this.vx = -1.2;
    } else if (type === 'crow' || type === 'book' || type === 'copyPaper' || type === 'namecard' || type === 'paperBundle') {
      this.vx = -1.8;
      this.wavePhase = Math.random() * Math.PI * 2;
      this.waveAmp = 24;
    } else if (type === 'bicycle') {
      this.vx = -2.6;
    } else if (type === 'crowd') {
      this.vx = -0.8;
    }
  }

  update() {
    // Actor基底クラスのupdateを呼び出し（位置更新）
    super.update();
    
    this.timer++;
    
    switch(this.type) {
      case 'movingPlatform':
        // 左右に動く台
        this.x += this.vx;
        if (this.x > this.originalX + this.range || this.x < this.originalX - this.range) {
          this.vx = -this.vx;
        }
        break;
        
      case 'pendulum':
        // 振り子
        this.angle += this.angleSpeed;
        this.x = this.originalX + Math.sin(this.angle) * this.length;
        break;
        
      case 'fallingRock':
        // 落石
        this.fallTimer--;
        if (this.fallTimer <= 0 && this.vy === 0) {
          this.vy = 2;
        }
        if (this.vy > 0) {
          this.y += this.vy;
          this.vy += 0.3; // 重力
          if (this.y > 400) {
            this.y = 400;
            this.vy = 0;
            this.fallTimer = 120 + Math.random() * 60;
            this.y = this.originalY;
          }
        }
        break;
        
      case 'hammer':
        // ハンマー（上下に動く）
        this.hammerY += this.direction * 2;
        if (this.hammerY > this.originalY + 40 || this.hammerY < this.originalY) {
          this.direction = -this.direction;
        }
        break;
        
      case 'laser':
        this.laserTimer++;
        if (this.laserTimer > 60) {
          this.laserOn = !this.laserOn;
          this.laserTimer = 0;
        }
        break;

      case 'crumblingPlatform':
        if (this.crumbling) {
          this.crumbleTimer--;
          if (this.crumbleTimer <= 0) {
            this.active = false;
            this.vy = 1.5;
          }
        }
        if (!this.active && this.vy > 0) {
          this.y += this.vy;
          this.vy += 0.15;
        }
        break;

      case 'clubBall':
      case 'can':
      case 'floatingRock':
        this.x += this.vx;
        break;

      case 'bicycle':
      case 'crowd':
        this.x += this.vx;
        if (this.x < camera.x - 120) this.x = camera.x + 920;
        break;

      case 'crow':
      case 'book':
      case 'copyPaper':
      case 'namecard':
      case 'paperBundle':
        this.x += this.vx;
        this.wavePhase += 0.08;
        this.y = this.originalY + Math.sin(this.wavePhase) * this.waveAmp;
        if (this.x < camera.x - 120) this.x = camera.x + 920;
        break;
    }
  }

  draw() {
    if (typeof drawObstacleVector === 'function') {
      drawObstacleVector(this);
      return;
    }
    const px = this.x - camera.x;
    const py = this.y;
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(px, py, this.w, this.h);
  }
}
