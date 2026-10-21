/* ============================================
   NPC管理モジュール
   ============================================
   
   役割: マップ上のNPC（非プレイヤーキャラクター）の管理を担当する
   
   責務:
   - NPCの位置更新（ランダム移動）
   - NPCの向き更新
   
   含まれる処理:
   - updateNPCs() - NPCの位置を更新（ランダム移動）、移動方向に応じてNPCの向きも更新
   
   依存関係:
   - hero, gameState, worldMaps, TILE, MAP_SIZE - gameState.js, config.js で定義
   
   検索性:
   - NPCの移動を探す: このファイル
   - NPCの動作を変更: このファイル内の updateNPCs()
   ============================================ */

/**
 * NPCの位置を更新（ランダム移動）
 * 移動方向に応じてNPCの向きも更新する
 */
function updateNPCs() {
    const map = worldMaps[hero.currentArea];
    if (map.npcs) {
        map.npcs.forEach(npc => {
            // 方向と移動量のマッピング
            const directions = [
                { move: [0, 1], dir: 'down' },   // 下
                { move: [0, -1], dir: 'up' },    // 上
                { move: [1, 0], dir: 'right' },  // 右
                { move: [-1, 0], dir: 'left' }   // 左
            ];
            const selected = directions[Math.floor(Math.random() * directions.length)];
            const tx = npc.x + selected.move[0];
            const ty = npc.y + selected.move[1];
            
            // 他のNPCの位置をチェック（NPC同士が重ならないように）
            const isOtherNPC = map.npcs.some(otherNpc => 
                otherNpc !== npc && otherNpc.x === tx && otherNpc.y === ty
            );
            
            if (tx >= 0 && tx <= MAP_SIZE.MAX_X && 
                ty >= 0 && ty <= MAP_SIZE.MAX_Y && 
                map.data[ty][tx] === TILE.EMPTY && 
                !(tx === hero.x && ty === hero.y) &&
                !isOtherNPC) {
                // 移動可能な場合：位置と向きを更新
                npc.x = tx;
                npc.y = ty;
                npc.direction = selected.dir;
            } else {
                // 移動できない場合でも、ランダムに方向を変える（50%の確率）
                // これにより、NPCが壁に当たっても向きが変わり、SVGが正しく表示される
                if (Math.random() < 0.5) {
                    npc.direction = selected.dir;
                }
            }
        });
    }
}
