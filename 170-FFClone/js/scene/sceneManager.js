let currentScene = null;

export function setScene(scene) {
  if (currentScene?.destroy) currentScene.destroy();
  currentScene = scene;
  if (currentScene?.init) currentScene.init();
}

export function updateScene(dt) {
  currentScene?.update(dt);
}

export function drawScene() {
  currentScene?.draw();
}

export function getCurrentScene() {
  return currentScene;
}
