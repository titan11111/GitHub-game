import { initCanvas } from './engine/canvas.js';
import { initInput } from './engine/input.js';
import { initAudio } from './engine/audio.js';
import { startLoop } from './engine/gameLoop.js';
import { setScene, updateScene, drawScene } from './scene/sceneManager.js';
import { createTitleScene } from './scene/titleScene.js';
import { createFieldScene } from './scene/fieldScene.js';
import { createTownScene } from './scene/townScene.js';
import { createBattleScene } from './scene/battleScene.js';

// テスト用グローバル
window.__ffclone = { forceEncounter: false };

function init() {
  initCanvas();
  initInput();
  initAudio();

  setScene(createTitleScene(() => {
    setScene(createFieldScene());
  }));

  // テスト用: 直接街シーンに遷移
  window.__ffclone.goToTown = () => {
    setScene(createTownScene(() => setScene(createFieldScene())));
  };
  // テスト用: 直接バトルシーンに遷移
  window.__ffclone.goToBattle = (tileType = 0) => {
    setScene(createBattleScene(
      () => setScene(createFieldScene()),
      tileType
    ));
  };

  startLoop(updateScene, drawScene);
}

window.addEventListener('DOMContentLoaded', init);
