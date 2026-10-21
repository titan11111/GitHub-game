# Actor基底クラス実装完了報告

## 実装日
2025-01-XX

## 実装概要

Actor基底クラスを実装し、Player、Enemy、Obstacleの共通化を行いました。オブジェクト指向の設計により、コードの再利用性と保守性が向上しました。

---

## 実装内容

### 1. 新規作成ファイル

#### `js/actor.js`
- **Actor基底クラス**: すべての動的オブジェクトの基底クラス
  - 座標（x, y）
  - サイズ（w, h）
  - 速度（vx, vy）
  - アクティブ状態（active）
  - `update()`: 更新処理（サブクラスでオーバーライド）
  - `draw()`: 描画処理（サブクラスでオーバーライド）
  - `getBounds()`: 当たり判定用の矩形を取得
  - `getCenter()`: 中心座標を取得
  - `getRadius()`: 半径を取得（円形判定用）
  - `checkCollision()`: 矩形当たり判定
  - `checkCircleCollision()`: 円形当たり判定
  - `isOffScreen()`: 画面外判定
  - `setPosition()`, `setVelocity()`, `setActive()`: セッター

#### `js/player.js`
- **Playerクラス**: Actorを継承したプレイヤークラス
  - HP管理（hp, maxHp）
  - 移動・ジャンプ（speed, jumpPower, onGround）
  - 攻撃（attacking, attackCooldown）
  - 無敵時間（invincible）
  - `takeDamage()`: ダメージを受ける
  - `heal()`: HPを回復
  - `reset()`: リセット
  - `isInvincible()`: 無敵かどうか
  - `canAttack()`: 攻撃可能かどうか

### 2. 修正したファイル

#### `js/enemy.js`
- `Enemy`クラスを`Actor`を継承するように変更
- コンストラクタで`super(x, y, w, h)`を呼び出し
- `update()`メソッドで`super.update()`を呼び出し

#### `js/obstacle.js`
- `Obstacle`クラスを`Actor`を継承するように変更
- コンストラクタで`super(x, y, w, h)`を呼び出し
- `update()`メソッドで`super.update()`を呼び出し

#### `js/game-state.js`
- `player`を`let player = null;`に変更
- `initPlayer()`関数を追加（Playerクラスの初期化）

#### `js/main.js`
- Playerクラスのメソッドを使用するように修正
  - `player.update()`: 位置更新
  - `player.takeDamage()`: ダメージ処理
  - `player.heal()`: HP回復
  - `player.canAttack()`: 攻撃可能判定
- 後方互換性のためのフォールバック処理を追加

#### `js/init.js`
- `initPlayer()`を呼び出してプレイヤーを初期化

#### `index.html`
- `js/actor.js`と`js/player.js`の読み込みを追加

---

## クラス階層

```
Actor (基底クラス)
├── Player (プレイヤー)
├── Enemy (敵)
└── Obstacle (障害物)
```

---

## 使用方法

### Playerクラス

```javascript
// プレイヤーの作成（initPlayer()で自動的に作成される）
// player = new Player(CONFIG.PLAYER.initialX, CONFIG.PLAYER.initialY);

// ダメージを受ける
player.takeDamage(10);

// HPを回復
player.heal(30);

// リセット
player.reset();

// 無敵かどうか
if (player.isInvincible()) {
  // 無敵中の処理
}

// 攻撃可能かどうか
if (player.canAttack()) {
  // 攻撃処理
}
```

### Enemyクラス（Actorを継承）

```javascript
// 敵の作成（既存のコードと同じ）
const enemy = new Enemy(x, y, 'normal', 'normal', 1);

// Actorのメソッドを使用可能
enemy.getBounds(); // 当たり判定用の矩形
enemy.getCenter(); // 中心座標
enemy.checkCollision(player); // プレイヤーとの当たり判定
enemy.isOffScreen(camera.x); // 画面外かどうか
```

### Obstacleクラス（Actorを継承）

```javascript
// 障害物の作成（既存のコードと同じ）
const obstacle = new Obstacle(x, y, w, h, 'platform', 1);

// Actorのメソッドを使用可能
obstacle.getBounds();
obstacle.checkCollision(player);
```

---

## 後方互換性

既存のコードとの互換性を保つため、以下の対応を行いました：

1. **Playerオブジェクトの段階的移行**
   - Playerクラスが読み込まれていない場合は、オブジェクトリテラルとして作成
   - 既存のコードは変更なしで動作

2. **フォールバック処理**
   - Playerクラスのメソッドが存在しない場合は、既存のロジックを使用
   - `player.update()`, `player.takeDamage()`, `player.heal()`などのメソッドをチェック

3. **既存のプロパティアクセス**
   - `player.x`, `player.y`, `player.hp`などのプロパティは引き続きアクセス可能

---

## メリット

### 1. コードの再利用性
- 共通の機能（座標、速度、当たり判定）を基底クラスに集約
- サブクラスで個別の機能を追加

### 2. 保守性の向上
- 共通のバグ修正が基底クラスで一度で済む
- 新しい機能の追加が容易

### 3. 型安全性（将来的にTypeScript導入時）
- クラスベースの設計により、型チェックが容易

### 4. 拡張性
- 新しいActor派生クラス（Item、Projectileなど）を簡単に追加可能

### 5. 一貫性
- すべての動的オブジェクトが同じインターフェースを持つ

---

## 改善点

### Before（実装前）

```javascript
// Player: オブジェクトリテラル
const player = {
  x: 100, y: 200, w: 36, h: 48,
  vx: 0, vy: 0, hp: 100, ...
};

// Enemy: クラス（独自実装）
class Enemy {
  constructor(x, y, ...) {
    this.x = x;
    this.y = y;
    // ...
  }
}

// Obstacle: クラス（独自実装）
class Obstacle {
  constructor(x, y, w, h, ...) {
    this.x = x;
    this.y = y;
    // ...
  }
}
```

### After（実装後）

```javascript
// Actor基底クラス
class Actor {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    // 共通の機能
  }
}

// Player: Actorを継承
class Player extends Actor {
  constructor(x, y) {
    super(x, y, CONFIG.PLAYER.width, CONFIG.PLAYER.height);
    // プレイヤー固有の機能
  }
}

// Enemy: Actorを継承
class Enemy extends Actor {
  constructor(x, y, ...) {
    super(x, y, w, h);
    // 敵固有の機能
  }
}

// Obstacle: Actorを継承
class Obstacle extends Actor {
  constructor(x, y, w, h, ...) {
    super(x, y, w, h);
    // 障害物固有の機能
  }
}
```

---

## 今後の拡張

### 1. Itemクラスの追加
```javascript
class Item extends Actor {
  constructor(x, y, type) {
    super(x, y, 20, 20);
    this.type = type;
  }
}
```

### 2. Projectileクラスの追加
```javascript
class Projectile extends Actor {
  constructor(x, y, vx, vy, type) {
    super(x, y, 10, 10);
    this.vx = vx;
    this.vy = vy;
    this.type = type;
  }
}
```

### 3. 物理演算の統合
- Actor基底クラスに物理演算の機能を追加
- 重力、摩擦、反発などの処理

---

## テスト項目

以下の項目をテストしてください：

- [ ] プレイヤーが正しく初期化される
- [ ] プレイヤーの移動が正常に動作する
- [ ] プレイヤーのダメージ処理が正常に動作する
- [ ] プレイヤーのHP回復が正常に動作する
- [ ] 敵が正しく生成される
- [ ] 敵の移動が正常に動作する
- [ ] 障害物が正しく生成される
- [ ] 障害物の動作が正常に動作する
- [ ] 当たり判定が正常に動作する
- [ ] 既存のコードが動作し続ける（後方互換性）

---

## まとめ

Actor基底クラスの実装により、オブジェクト指向の設計が導入され、コードの再利用性と保守性が向上しました。既存のコードとの互換性を保ちながら、段階的に移行できる設計になっています。
