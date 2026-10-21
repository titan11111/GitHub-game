// CollisionEngine（当たり判定エンジン）モジュール
// 矩形・円形による高度な当たり判定と、判定時のコールバック（イベント）を処理

/**
 * CollisionEngine クラス
 * 当たり判定を一元管理し、コールバック機能を提供
 */
class CollisionEngine {
  constructor() {
    this.collisionCallbacks = []; // 衝突時のコールバック
  }
  
  /**
   * 矩形同士の当たり判定
   * @param {Object} a - オブジェクトA {x, y, w, h}
   * @param {Object} b - オブジェクトB {x, y, w, h}
   * @returns {boolean} 衝突しているかどうか
   */
  checkRectCollision(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  }
  
  /**
   * 円形同士の当たり判定
   * @param {Object} a - オブジェクトA {x, y, radius} または {x, y, w, h} (w/2を半径として使用)
   * @param {Object} b - オブジェクトB {x, y, radius} または {x, y, w, h} (w/2を半径として使用)
   * @returns {boolean} 衝突しているかどうか
   */
  checkCircleCollision(a, b) {
    // 半径を取得（radiusプロパティがある場合はそれを使用、ない場合はw/2を使用）
    const radiusA = a.radius !== undefined ? a.radius : (a.w ? a.w / 2 : 0);
    const radiusB = b.radius !== undefined ? b.radius : (b.w ? b.w / 2 : 0);
    
    // 中心座標を計算
    const centerAX = a.x + (a.w ? a.w / 2 : 0);
    const centerAY = a.y + (a.h ? a.h / 2 : 0);
    const centerBX = b.x + (b.w ? b.w / 2 : 0);
    const centerBY = b.y + (b.h ? b.h / 2 : 0);
    
    // 距離を計算
    const dx = centerAX - centerBX;
    const dy = centerAY - centerBY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 半径の合計と比較
    return distance < (radiusA + radiusB);
  }
  
  /**
   * 矩形と円形の当たり判定
   * @param {Object} rect - 矩形オブジェクト {x, y, w, h}
   * @param {Object} circle - 円形オブジェクト {x, y, radius} または {x, y, w, h}
   * @returns {boolean} 衝突しているかどうか
   */
  checkRectCircleCollision(rect, circle) {
    // 円の半径を取得
    const radius = circle.radius !== undefined ? circle.radius : (circle.w ? circle.w / 2 : 0);
    
    // 円の中心座標
    const circleX = circle.x + (circle.w ? circle.w / 2 : 0);
    const circleY = circle.y + (circle.h ? circle.h / 2 : 0);
    
    // 矩形の最も近い点を計算
    const closestX = Math.max(rect.x, Math.min(circleX, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(circleY, rect.y + rect.h));
    
    // 距離を計算
    const dx = circleX - closestX;
    const dy = circleY - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < radius;
  }
  
  /**
   * 汎用的な当たり判定（自動的に矩形または円形を判定）
   * @param {Object} a - オブジェクトA
   * @param {Object} b - オブジェクトB
   * @param {string} type - 判定タイプ ('rect', 'circle', 'auto')
   * @param {Function} callback - 衝突時のコールバック関数（オプション）
   * @returns {boolean} 衝突しているかどうか
   */
  checkCollision(a, b, type = 'auto', callback = null) {
    let collision = false;
    
    // 判定タイプを自動判定
    if (type === 'auto') {
      // 両方にradiusプロパティがある場合は円形判定
      if ((a.radius !== undefined || (a.w && a.h)) && 
          (b.radius !== undefined || (b.w && b.h))) {
        // 両方が円形判定可能な場合
        if (a.radius !== undefined && b.radius !== undefined) {
          type = 'circle';
        } else {
          // デフォルトは矩形判定
          type = 'rect';
        }
      } else {
        // デフォルトは矩形判定
        type = 'rect';
      }
    }
    
    // 判定タイプに応じて判定
    switch(type) {
      case 'circle':
        collision = this.checkCircleCollision(a, b);
        break;
      case 'rect':
      default:
        collision = this.checkRectCollision(a, b);
        break;
    }
    
    // 衝突している場合、コールバックを実行
    if (collision && callback && typeof callback === 'function') {
      callback(a, b);
    }
    
    // グローバルなコールバックも実行
    if (collision) {
      this.triggerCollisionCallbacks(a, b);
    }
    
    return collision;
  }
  
  /**
   * 衝突時のコールバックを登録
   * @param {Function} callback - コールバック関数 (a, b) => {}
   */
  onCollision(callback) {
    if (typeof callback === 'function') {
      this.collisionCallbacks.push(callback);
    }
  }
  
  /**
   * コールバックを削除
   * @param {Function} callback - 削除するコールバック関数
   */
  removeCollisionCallback(callback) {
    const index = this.collisionCallbacks.indexOf(callback);
    if (index > -1) {
      this.collisionCallbacks.splice(index, 1);
    }
  }
  
  /**
   * 衝突時のコールバックを実行
   * @param {Object} a - オブジェクトA
   * @param {Object} b - オブジェクトB
   */
  triggerCollisionCallbacks(a, b) {
    this.collisionCallbacks.forEach(callback => {
      try {
        callback(a, b);
      } catch (error) {
        console.error('Error in collision callback:', error);
      }
    });
  }
  
  /**
   * 範囲内の衝突判定（範囲攻撃用）
   * @param {Object} center - 中心オブジェクト {x, y}
   * @param {number} radius - 範囲の半径
   * @param {Array} targets - 対象オブジェクトの配列
   * @returns {Array} 衝突しているオブジェクトの配列
   */
  checkAreaCollision(center, radius, targets) {
    const hitTargets = [];
    
    targets.forEach(target => {
      // 円形判定を使用
      const circleA = { x: center.x, y: center.y, radius: radius };
      const circleB = target.radius !== undefined 
        ? { x: target.x, y: target.y, radius: target.radius }
        : { x: target.x + target.w / 2, y: target.y + target.h / 2, radius: (target.w || target.h) / 2 };
      
      if (this.checkCircleCollision(circleA, circleB)) {
        hitTargets.push(target);
      }
    });
    
    return hitTargets;
  }
}

// グローバルなCollisionEngineインスタンスを作成
let collisionEngine = new CollisionEngine();

// 後方互換性のため、既存のcheckCollision関数を提供
// 既存のコードが動作し続けるようにする
function checkCollision(a, b) {
  return collisionEngine.checkCollision(a, b, 'rect');
}
