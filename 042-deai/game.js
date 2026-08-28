// Deai - 出会いゲーム
// ゲーム開発中...

const app = document.getElementById('app');

function initGame() {
  app.innerHTML = `
    <h1 class="game-title">Deai</h1>
    <div class="game-content">
      <p style="font-size: 18px; color: #666; text-align: center;">
        出会いのストーリーゲーム<br>
        <br>
        開発中...
      </p>
      <button onclick="startGame()">ゲーム開始</button>
    </div>
  `;
}

function startGame() {
  alert('ゲームロジックを実装してください！');
}

document.addEventListener('DOMContentLoaded', initGame);
