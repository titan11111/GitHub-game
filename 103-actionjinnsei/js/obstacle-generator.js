// 障害物生成（チャンクパターン駆動）
function generateObstacles(stageNum) {
  obstacles = [];
  if (typeof generateObstaclesFromPatterns === 'function') {
    generateObstaclesFromPatterns(stageNum);
  }
}
