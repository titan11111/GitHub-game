# CollisionEngine実装完了報告

## 実装日
2025-01-XX

## 実装概要

CollisionEngine（当たり判定エンジン）を実装し、矩形・円形による高度な当たり判定と、判定時のコールバック（イベント）機能を追加しました。

---

## 実装内容

### 1. 新規作成ファイル

#### `js/collision-engine.js`
- **CollisionEngineクラス**: 当たり判定を一元管理
  - `checkRectCollision()`: 矩形同士の当たり判定
  - `checkCircleCollision()`: 円形同士の当たり判定
  - `checkRectCircleCollision()`: 矩形と円形の当たり判定
  - `checkCollision()`: 汎用的な当たり判定（自動判定）
  - `checkAreaCollision()`: 範囲内の衝突判定（範囲攻撃用）
  - `onCollision()`: 衝突時のコールバックを登録
  - `removeCollisionCallback()`: コールバックを削除
- **collisionEngine**: グローバルなCollisionEngineインスタンス
- **checkCollision()**: 後方互換性のためのグローバル関数

### 2. 修正したファイル

#### `js/main.js`
- `createExplosionDamage()`: CollisionEngineの範囲攻撃機能を使用
- `checkCollision()`: 既存の関数定義を削除（collision-engine.jsに移動）

#### `index.html`
- `js/collision-engine.js` の読み込みを追加（`state-machine.js` の後）

---

## 機能詳細

### 1. 矩形判定（既存機能の維持）

```javascript
// 基本的な矩形判定
const collision = collisionEngine.checkRectCollision(objectA, objectB);

// または汎用関数を使用
const collision = collisionEngine.checkCollision(objectA, objectB, 'rect');
```

**使用例**:
```javascript
const player = { x: 100, y: 200, w: 36, h: 48 };
const enemy = { x: 120, y: 210, w: 30, h: 30 };

if (collisionEngine.checkRectCollision(player, enemy)) {
  // 衝突している
}
```

### 2. 円形判定（新機能）

```javascript
// 円形判定
const collision = collisionEngine.checkCircleCollision(circleA, circleB);

// または汎用関数を使用
const collision = collisionEngine.checkCollision(circleA, circleB, 'circle');
```

**使用例**:
```javascript
// radiusプロパティを使用
const circleA = { x: 100, y: 200, radius: 20 };
const circleB = { x: 120, y: 210, radius: 15 };

if (collisionEngine.checkCircleCollision(circleA, circleB)) {
  // 衝突している
}

// w/hプロパティから自動計算（w/2を半径として使用）
const circleC = { x: 100, y: 200, w: 40, h: 40 }; // 半径20として扱われる
const circleD = { x: 120, y: 210, w: 30, h: 30 }; // 半径15として扱われる
```

### 3. 矩形と円形の判定（新機能）

```javascript
const collision = collisionEngine.checkRectCircleCollision(rect, circle);
```

**使用例**:
```javascript
const rect = { x: 100, y: 200, w: 50, h: 50 };
const circle = { x: 120, y: 210, radius: 20 };

if (collisionEngine.checkRectCircleCollision(rect, circle)) {
  // 衝突している
}
```

### 4. 範囲攻撃判定（新機能）

```javascript
const hitTargets = collisionEngine.checkAreaCollision(center, radius, targets);
```

**使用例**:
```javascript
// 爆発ダメージの計算
const explosionCenter = { x: 500, y: 300 };
const explosionRadius = 60;
const targets = [...enemies, boss];

const hitTargets = collisionEngine.checkAreaCollision(
  explosionCenter,
  explosionRadius,
  targets
);

hitTargets.forEach(target => {
  target.hp -= 20;
});
```

### 5. コールバック機能（新機能）

```javascript
// 衝突時のコールバックを登録
collisionEngine.onCollision((a, b) => {
  console.log('Collision detected:', a, b);
});

// 衝突判定時に自動的にコールバックが実行される
collisionEngine.checkCollision(objectA, objectB);
```

**使用例**:
```javascript
// グローバルな衝突イベントを監視
collisionEngine.onCollision((a, b) => {
  // 衝突時の処理（ログ、エフェクトなど）
  if (a.type === 'player' && b.type === 'enemy') {
    console.log('Player hit enemy!');
  }
});

// 特定の衝突判定時にコールバックを指定
collisionEngine.checkCollision(
  player,
  enemy,
  'rect',
  (a, b) => {
    // この衝突時のみ実行されるコールバック
    a.hp -= 10;
  }
);
```

---

## 後方互換性

既存のコードとの互換性を保つため、以下の対応を行いました：

1. **既存の`checkCollision()`関数を維持**
   - `collision-engine.js`でグローバル関数として提供
   - 既存のコードは変更なしで動作

2. **段階的移行**
   - 既存のコードは動作し続ける
   - 新しいコードは`collisionEngine.checkCollision()`を使用することを推奨

3. **フォールバック処理**
   - CollisionEngineが読み込まれていない場合のフォールバック処理を追加
   - `createExplosionDamage()`で既存のロジックを維持

---

## 使用例

### 基本的な使用

```javascript
// 既存のコード（そのまま動作）
if (checkCollision(player, enemy)) {
  // 衝突処理
}

// 新しいコード（推奨）
if (collisionEngine.checkCollision(player, enemy)) {
  // 衝突処理
}
```

### 円形判定の使用

```javascript
// 円形の敵と円形の弾の判定
const enemy = { x: 100, y: 200, radius: 20 };
const bullet = { x: 110, y: 210, radius: 5 };

if (collisionEngine.checkCircleCollision(enemy, bullet)) {
  enemy.hp -= 10;
}
```

### 範囲攻撃の使用

```javascript
// 爆発範囲内の敵を検出
const explosion = { x: 500, y: 300 };
const radius = 60;
const allEnemies = [...enemies, boss];

const hitEnemies = collisionEngine.checkAreaCollision(
  explosion,
  radius,
  allEnemies
);

hitEnemies.forEach(enemy => {
  enemy.hp -= 20;
  // エフェクトを表示
  showExplosionEffect(enemy.x, enemy.y);
});
```

### コールバックの使用

```javascript
// すべての衝突を監視
collisionEngine.onCollision((a, b) => {
  // 衝突統計を記録
  collisionStats.totalCollisions++;
  
  // デバッグ用ログ
  if (DEBUG_MODE) {
    console.log(`Collision: ${a.type} vs ${b.type}`);
  }
});
```

---

## 改善点

### Before（実装前）

```javascript
// 矩形判定のみ
function checkCollision(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// 範囲攻撃は手動計算
function createExplosionDamage(p) {
  targets.forEach(e => {
    const dist = Math.sqrt(Math.pow(e.x - p.x, 2) + Math.pow(e.y - p.y, 2));
    if (dist < 60) {
      e.hp -= 20;
    }
  });
}
```

### After（実装後）

```javascript
// 複数の判定タイプに対応
collisionEngine.checkRectCollision(a, b);
collisionEngine.checkCircleCollision(a, b);
collisionEngine.checkRectCircleCollision(rect, circle);

// 範囲攻撃が簡単に
const hitTargets = collisionEngine.checkAreaCollision(center, radius, targets);

// コールバック機能でイベント処理
collisionEngine.onCollision((a, b) => {
  // 衝突時の処理
});
```

---

## メリット

### 1. 判定タイプの拡張
- 矩形判定（既存）
- 円形判定（新規）
- 矩形と円形の判定（新規）

### 2. 範囲攻撃の簡素化
- `checkAreaCollision()`で範囲内の対象を簡単に検出
- 手動計算が不要

### 3. イベント駆動の実現
- コールバック機能で衝突イベントを処理
- デバッグ、統計、エフェクト表示などに活用可能

### 4. コードの可読性向上
- 当たり判定ロジックが一元化
- 判定タイプが明確

### 5. 拡張性
- 新しい判定タイプを追加しやすい
- コールバックで柔軟な処理が可能

---

## 今後の拡張

### 1. より高度な判定
- 多角形判定
- 回転した矩形の判定
- 3D判定（将来の拡張用）

### 2. パフォーマンス最適化
- 空間分割（Spatial Partitioning）
- ブロードフェーズとナローフェーズの分離

### 3. 物理演算との統合
- 衝突応答（Collision Response）
- 反発係数、摩擦係数の設定

---

## テスト項目

以下の項目をテストしてください：

- [ ] 矩形判定が正しく動作する（既存機能）
- [ ] 円形判定が正しく動作する
- [ ] 矩形と円形の判定が正しく動作する
- [ ] 範囲攻撃が正しく動作する
- [ ] コールバックが正しく実行される
- [ ] 既存のコードが動作し続ける（後方互換性）
- [ ] 爆発ダメージが正しく計算される

---

## まとめ

CollisionEngineの実装により、当たり判定が高度化され、範囲攻撃やイベント処理が容易になりました。既存のコードとの互換性を保ちながら、段階的に移行できる設計になっています。
