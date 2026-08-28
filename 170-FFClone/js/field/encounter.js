import { getEncounterRate } from './tilemap.js';

// window.__ffclone.forceEncounter = true で強制エンカウント（テスト用）
function shouldEncounter(tile) {
  if (typeof window !== 'undefined' && window.__ffclone?.forceEncounter) return true;
  const rate = getEncounterRate(tile);
  return rate > 0 && Math.random() < rate;
}

export function createEncounterSystem() {
  let stepsSinceLast = 0;

  return {
    check(tile) {
      stepsSinceLast++;
      // 最低3歩は連続エンカウントしない
      if (stepsSinceLast < 3) return false;
      if (shouldEncounter(tile)) {
        stepsSinceLast = 0;
        return true;
      }
      return false;
    },
    reset() { stepsSinceLast = 0; },
  };
}
