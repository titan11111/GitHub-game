// Actor基底クラスモジュール
// Player, Enemy, Obstacle の基底クラス
// 座標、速度、当たり判定を持つ

/**
 * Actor基底クラス（抽象クラス）
 * ゲーム内のすべての動的オブジェクトの基底クラス
 */
class Actor {
  /**
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} w - 幅
   * @param {number} h - 高さ
   */
  constructor(x, y, w, h) {
    // 座標
    this.x = x;
    this.y = y;
    
    // サイズ
    this.w = w;
    this.h = h;
    
    // 速度
    this.vx = 0;
    this.vy = 0;
    
    // アクティブ状態
    this.active = true;
  }
  
  /**
   * 更新処理（サブクラスでオーバーライド）
   */
  update() {
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx;
    this.y += this.vy;
  }
  
  /**
   * 描画処理（サブクラスでオーバーライド）
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   */
  draw(ctx) {
    // 基底クラスでは何も描画しない
    // サブクラスで実装
  }
  
  /**
   * 当たり判定用の矩形を取得
   * @returns {Object} {x, y, w, h}
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h
    };
  }
  
  /**
   * 当たり判定用の中心座標を取得
   * @returns {Object} {x, y}
   */
  getCenter() {
    return {
      x: this.x + this.w / 2,
      y: this.y + this.h / 2
    };
  }
  
  /**
   * 当たり判定用の半径を取得（円形判定用）
   * @returns {number} 半径
   */
  getRadius() {
    return Math.max(this.w, this.h) / 2;
  }
  
  /**
   * 他のActorとの当たり判定（矩形）
   * @param {Actor} other - 他のActor
   * @returns {boolean} 衝突しているかどうか
   */
  checkCollision(other) {
    if (!this.active || !other.active) {
      return false;
    }
    
    if (typeof collisionEngine !== 'undefined') {
      return collisionEngine.checkRectCollision(this, other);
    } else {
      // フォールバック（CollisionEngineが読み込まれていない場合）
      return this.x < other.x + other.w &&
             this.x + this.w > other.x &&
             this.y < other.y + other.h &&
             this.y + this.h > other.y;
    }
  }
  
  /**
   * 他のActorとの当たり判定（円形）
   * @param {Actor} other - 他のActor
   * @returns {boolean} 衝突しているかどうか
   */
  checkCircleCollision(other) {
    if (!this.active || !other.active) {
      return false;
    }
    
    if (typeof collisionEngine !== 'undefined') {
      return collisionEngine.checkCircleCollision(this, other);
    } else {
      // フォールバック
      const centerA = this.getCenter();
      const centerB = other.getCenter();
      const radiusA = this.getRadius();
      const radiusB = other.getRadius();
      
      const dx = centerA.x - centerB.x;
      const dy = centerA.y - centerB.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance < (radiusA + radiusB);
    }
  }
  
  /**
   * 画面外かどうかを判定
   * @param {number} cameraX - カメラのX座標
   * @param {number} margin - マージン（画面外の余白）
   * @returns {boolean} 画面外かどうか
   */
  isOffScreen(cameraX = 0, margin = 100) {
    return this.x + this.w < cameraX - margin ||
           this.x > cameraX + (typeof canvas !== 'undefined' ? canvas.width : 800) + margin;
  }
  
  /**
   * 位置を設定
   * @param {number} x - X座標
   * @param {number} y - Y座標
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  
  /**
   * 速度を設定
   * @param {number} vx - X方向の速度
   * @param {number} vy - Y方向の速度
   */
  setVelocity(vx, vy) {
    this.vx = vx;
    this.vy = vy;
  }
  
  /**
   * アクティブ状態を設定
   * @param {boolean} active - アクティブかどうか
   */
  setActive(active) {
    this.active = active;
  }
  
  /**
   * アクティブかどうかを取得
   * @returns {boolean} アクティブかどうか
   */
  isActive() {
    return this.active;
  }
}
