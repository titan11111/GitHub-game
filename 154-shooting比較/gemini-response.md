# Gemini - 縦型シューティングゲーム（ステップバイステップ）

## 回答特性
- アプローチ: 段階的・教育的（3ファイル分割）
- 完成度: ステップ1のみ（基本セットアップ）
- スタイル: 丁寧な解説付き、選択肢を提示してから次へ進む

---

承知いたしました。ゲームエンジニアとして、ブラウザで動作するJavaScriptの縦型シューティングゲーム作成をお手伝いします。

一度にすべてを作るのは難しいので、ステップバイステップで進めていきましょう。まずはゲームの土台となる基本的なプログラムを作成し、そこから機能を追加していく方法はいかがでしょうか？

**ステップ1：基本のセットアップとプレイヤーの表示**

まずは、ゲームを表示するための画面（HTML）と、プレイヤーを動かすためのプログラム（JavaScript）の基本的な構造を作成します。

以下の3つのファイルを作成してください。

1.  `index.html` （ゲーム画面の土台）
2.  `style.css` （見た目を整える）
3.  `game.js` （ゲームの本体プログラム）

---

### 1. `index.html`

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSシューティングゲーム</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>JS縦型シューティング</h1>
    <canvas id="gameCanvas"></canvas>
    <script src="game.js"></script>
</body>
</html>
```

### 2. `style.css`

```css
body {
    background-color: #f0f0f0;
    text-align: center;
}

canvas {
    background-color: #000;
    border: 2px solid #333;
}
```

### 3. `game.js`

```javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 480;
canvas.height = 640;

const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    color: 'white',
    speed: 5,
};

let rightPressed = false;
let leftPressed = false;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = true;
    else if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = false;
    else if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = false;
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    if (rightPressed && player.x < canvas.width - player.width) player.x += player.speed;
    else if (leftPressed && player.x > 0) player.x -= player.speed;
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

gameLoop();
```

---

**次のステップ選択肢**

- **A. 弾を発射する機能**
- **B. 敵を出現させる機能**
- **C. プレイヤーの見た目を画像にする**

ご希望のものを教えてください。
