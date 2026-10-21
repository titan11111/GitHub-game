// プレイヤークラスモジュール
// Actorを継承したPlayerクラス

/**
 * Playerクラス（Actorを継承）
 * プレイヤーの状態と動作を管理
 */
class Player extends Actor {
  constructor(x, y) {
    // Actor基底クラスのコンストラクタを呼び出し
    super(x, y, CONFIG.PLAYER.width, CONFIG.PLAYER.height);
    
    // HP
    this.hp = CONFIG.PLAYER.initialHp;
    this.maxHp = CONFIG.PLAYER.maxHp;
    
    // 移動・ジャンプ
    this.speed = CONFIG.PLAYER.speed;
    this.jumpPower = CONFIG.PLAYER.jumpPower;
    this.onGround = false;
    
    // 攻撃
    this.attacking = false;
    this.attackCooldown = 0;
    
    // 無敵時間
    this.invincible = 0;

    // ジャンプ操作感（コヨーテタイム・バッファ）
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.wasJumpHeld = false;
    this.recoilX = 0;
    this.aBtnWasPressed = false;
    this.targetVx = 0;
    this.prevX = x;
    this.prevY = y;
    this.facing = 1;
  }
  
  /**
   * 更新処理
   */
  update() {
    // Actor基底クラスのupdateを呼び出し（位置更新）
    super.update();
    
    // 無敵時間を減らす
    if (this.invincible > 0) {
      this.invincible--;
    }
    
    // 攻撃クールダウンを減らす
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
  }
  
  /**
   * ダメージを受ける
   * @param {number} damage - ダメージ量
   */
  takeDamage(damage) {
    if (this.invincible > 0) {
      return; // 無敵時間中はダメージを受けない
    }
    
    this.hp -= damage;
    this.invincible = CONFIG.PLAYER.invincibleDuration;
    
    if (this.hp <= 0) {
      this.hp = 0;
    }
  }
  
  /**
   * HPを回復
   * @param {number} amount - 回復量
   */
  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }
  
  /**
   * リセット（ゲーム開始時など）
   */
  reset() {
    this.x = CONFIG.PLAYER.initialX;
    this.y = CONFIG.PLAYER.initialY;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.onGround = false;
    this.attacking = false;
    this.attackCooldown = 0;
    this.invincible = 0;
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.wasJumpHeld = false;
    this.recoilX = 0;
    this.aBtnWasPressed = false;
    this.targetVx = 0;
    this.facing = 1;
  }
  
  /**
   * 無敵かどうかを取得
   * @returns {boolean} 無敵かどうか
   */
  isInvincible() {
    return this.invincible > 0;
  }
  
  /**
   * 攻撃可能かどうかを取得
   * @returns {boolean} 攻撃可能かどうか
   */
  canAttack() {
    return this.attackCooldown <= 0;
  }
}
