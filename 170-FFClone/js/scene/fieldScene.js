import { ctx, LOGICAL_W, LOGICAL_H } from '../engine/canvas.js';
import { keys } from '../engine/input.js';
import {
  generateMap, drawTilemap, TILE, getSpecialAt,
  START_X, START_Y
} from '../field/tilemap.js';
import { createPlayer, calcCamera } from '../field/player.js';
import { createEncounterSystem } from '../field/encounter.js';
import { setScene } from './sceneManager.js';
import { createBattleScene } from './battleScene.js';
import { createTownScene } from './townScene.js';

let player = null;
let encounter = null;
let camX = 0, camY = 0;
let mapReady = false;
let labelTimer = 0;

export function createFieldScene() {
  return {
    init() {
      if (!mapReady) {
        generateMap();
        mapReady = true;
      }

      player = createPlayer(START_X, START_Y);
      encounter = createEncounterSystem();
      labelTimer = 3000;

      const cam = calcCamera(player);
      camX = cam.x;
      camY = cam.y;

      // テスト用: 座標をグローバルに公開
      const updateDebug = () => {
        window.__ffclone.playerPos = { x: player.tileX, y: player.tileY };
      };
      updateDebug();

      player.setStepCallback((tile) => {
        updateDebug();
        // 街・洞窟チェック
        const sp = getSpecialAt(player.tileX, player.tileY);
        if (sp) {
          setScene(createTownScene(() => setScene(createFieldScene())));
          return;
        }
        // ランダムエンカウント
        if (encounter.check(tile)) {
          setScene(createBattleScene(
            () => { encounter.reset(); setScene(createFieldScene()); },
            tile
          ));
        }
      });
    },

    update(dt) {
      if (!player) return;
      player.update(dt, keys);

      // プレイヤー座標を常時同期（移動中も）
      window.__ffclone.playerPos = { x: player.tileX, y: player.tileY };

      // カメラはスプライトの描画位置に直追従（lerp なし）
      // → tileX ベースで先行していた分のガクつきを解消
      const cam = calcCamera(player);
      camX = cam.x;
      camY = cam.y;

      labelTimer -= dt;
    },

    draw() {
      if (!player) return;
      drawTilemap(camX, camY);
      player.draw(camX, camY);
      _drawHUD();
    },

    destroy() { player = null; },
  };
}

function _drawHUD() {
  // WORLD MAP ラベル（最初の3秒）
  if (labelTimer > 0) {
    const alpha = Math.min(1, labelTimer / 500);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(6, 6, 116, 22);
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('WORLD MAP', 12, 22);
    ctx.restore();
  }

  // 座標表示（開発中 debug）
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(LOGICAL_W - 84, 6, 78, 18);
  ctx.fillStyle = '#888';
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`(${player.tileX}, ${player.tileY})`, LOGICAL_W - 8, 19);
}
