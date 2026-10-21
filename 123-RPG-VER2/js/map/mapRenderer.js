/* ============================================
   マップ描画モジュール
   ============================================
   
   役割: マップの描画処理を担当する
   
   責務:
   - マップグリッドの生成と描画
   - 地形タイプに応じたセルのスタイル設定
   - 主人公・仲間・NPC・オブジェクトの配置と描画
   - エリアタイトルの表示
   - フィールドごとのCSSクラス設定
   
   含まれる処理:
   - drawMap() - マップ全体の描画処理（地形、キャラクター、オブジェクトの配置）
   
   依存関係:
   - hero, gameState, party, allyData, worldMaps, TILE - gameState.js, config.js で定義
   - getAllyPosition(), getPreviousMemberPosition() - map/allyManager.js で定義
   - isValidMapPosition() - map/movement.js で定義
   - generateAllySVG(), generateVillagerSVG(), generateElderSVG(), generateInnSVG(), generateItemShopSVG(), generateGoldenCatSVG(), generateCatNPCHTML() - sprites/svgGenerator.js で定義
   
   検索性:
   - マップ描画を探す: このファイル
   - マップの見た目を変更: このファイル内の drawMap()
   - 新しい地形タイプを追加: このファイル内の drawMap() に追加
   ============================================ */

/**
 * マップを描画
 */
function drawMap() {
    // hero.currentAreaが未定義の場合のエラーチェック
    if (!hero.currentArea) {
        console.error('[drawMap] hero.currentAreaが未定義です。デフォルト値を設定します。');
        hero.currentArea = 'town_inside'; // デフォルトエリア
    }
    
    let mapInfo = worldMaps[hero.currentArea];
    if (!mapInfo) {
        console.error(`[drawMap] worldMaps[${hero.currentArea}]が見つかりません。デフォルトエリアを使用します。`);
        hero.currentArea = 'town_inside';
        mapInfo = worldMaps[hero.currentArea];
        if (!mapInfo) {
            console.error('[drawMap] デフォルトエリアも見つかりません。マップを描画できません。');
            return;
        }
    }
    if (!mapInfo.data || !Array.isArray(mapInfo.data)) {
        console.error(`[drawMap] mapInfo.dataが存在しないか、配列ではありません。currentArea=${hero.currentArea}`, mapInfo);
        return;
    }
    
    document.getElementById('area-title').innerText = mapInfo.name;
    
    const grid = document.getElementById('map-grid');
    const gameContainer = document.getElementById('game-container');
    if (!grid || !gameContainer) {
        console.error('[drawMap] map-gridまたはgame-containerが見つかりません。');
        return;
    }
    grid.innerHTML = '';
    
    
    // フィールドごとのクラスを設定（既存のクラスを削除してから追加）
    const fieldClasses = [
        'field-town_inside', 'field-green_field', 'field-wasteland', 
        'field-lonely_desert', 'field-lava_cave', 'field-demon_castle',
        'field-ruined_village', 'field-dark_forest', 'field-tropical_south', 'field-tropical_village',
        'field-water_spirit_dwelling', 'field-monster_forest'
    ];
    fieldClasses.forEach(cls => {
        grid.classList.remove(cls);
        gameContainer.classList.remove(cls);
    });
    grid.classList.add(`field-${hero.currentArea}`);
    gameContainer.classList.add(`field-${hero.currentArea}`);

    // 仲間がパーティにいるのにallyPositionsが初期化されていない場合、初期化する
    // 配列の長さを確保（主人公を除いた仲間の数）
    const requiredLength = party.length - 1;
    while (gameState.allyPositions.length < requiredLength) {
        gameState.allyPositions.push(null);
    }
    
    // 各仲間の位置を初期化または更新
    for (let i = 1; i < party.length; i++) {
        const allyIndex = i - 1;
        
        // 位置が未初期化の場合のみ初期化する（エリアが異なる場合も再初期化）
        if (!gameState.allyPositions[allyIndex] || gameState.allyPositions[allyIndex].area !== hero.currentArea) {
            // 前のメンバーの位置を取得
            const prevPos = getPreviousMemberPosition(i);
            const behindPos = getBehindPosition(prevPos);
            
            // 有効な位置かチェック
            if (isValidMapPosition(behindPos.x, behindPos.y) && 
                worldMaps[hero.currentArea].data[behindPos.y][behindPos.x] !== TILE.WALL) {
                gameState.allyPositions[allyIndex] = { 
                    x: behindPos.x, 
                    y: behindPos.y, 
                    area: hero.currentArea, 
                    direction: prevPos.direction 
                };
            } else {
                // 後ろの位置が無効な場合は前のメンバーの位置に配置
                gameState.allyPositions[allyIndex] = { 
                    x: prevPos.x, 
                    y: prevPos.y, 
                    area: hero.currentArea, 
                    direction: prevPos.direction 
                };
            }
        } else {
            // 既に位置が設定されている場合、方向を更新（主人公の方向に合わせる）
            if (i === 1) {
                gameState.allyPositions[allyIndex].direction = gameState.heroDirection;
            } else {
                // 2番目以降の仲間は前の仲間の方向に合わせる
                const prevAllyIndex = i - 2;
                if (gameState.allyPositions[prevAllyIndex]) {
                    gameState.allyPositions[allyIndex].direction = gameState.allyPositions[prevAllyIndex].direction;
                }
            }
        }
    }

    mapInfo.data.forEach((row, y) => {
        row.forEach((type, x) => {
            const cell = document.createElement('div');
            cell.className = 'cell';

            // 地形タイプのクラス設定
            if (type === TILE.WALL) cell.classList.add('wall');
            if (type === TILE.PLAIN) cell.classList.add('plain');
            if (type === TILE.FOREST) cell.classList.add('forest');
            if (type === TILE.LAVA) cell.classList.add('lava');
            if (type === TILE.MOUNTAIN) cell.classList.add('mountain');
            if (type === TILE.WASTELAND) cell.classList.add('wasteland');
            if (type === TILE.DESERT) cell.classList.add('desert');
            if (type === TILE.RUINS) cell.classList.add('ruins');
            if (type === TILE.SEA) cell.classList.add('sea');
            if (type === TILE.PALM) cell.classList.add('palm');
            if (type === TILE.BRIDGE) cell.classList.add('bridge');
            if (type === TILE.BEACH) cell.classList.add('beach');
            if (type === TILE.HIBISCUS) cell.classList.add('hibiscus');
            if (type === TILE.COCONUT) cell.classList.add('coconut');
            if (type === TILE.MANGO) cell.classList.add('mango');
            if (type === TILE.COFFIN) cell.classList.add('coffin');
            if (type === TILE.COBWEB) cell.classList.add('cobweb');
            if (type === TILE.CANDLE) cell.classList.add('candle');

            // 仲間の位置をチェック（パーティの順番に基づく）
            let allyFound = false;
            for (let i = 1; i < party.length; i++) {
                const allyPos = getAllyPosition(i);
                const ally = party[i];
                
                if (!allyPos) continue;
                
                // 位置が一致するかチェック
                const positionMatches = (x === allyPos.x && y === allyPos.y);
                const areaMatches = (allyPos.area === hero.currentArea);
                const notOnHero = !(x === hero.x && y === hero.y);
                
                if (positionMatches && areaMatches && notOnHero) {
                    // 他の仲間と同じ位置でないかチェック
                    let isUnique = true;
                    for (let j = 1; j < i; j++) {
                        const prevAllyPos = getAllyPosition(j);
                        if (prevAllyPos && x === prevAllyPos.x && y === prevAllyPos.y) {
                            isUnique = false;
                            break;
                        }
                    }
                    
                    if (isUnique) {
                        const svgHTML = generateAllySVG(ally.name, allyPos.direction || 'down', i);
                        if (svgHTML && svgHTML.length > 0) {
                            cell.innerHTML = svgHTML;
                            cell.classList.add('hero');
                            allyFound = true;
                            cell.setAttribute('data-ally', 'true');
                            break;
                        }
                    }
                }
            }
            
            // ヒーローの位置
            if (!allyFound && x === hero.x && y === hero.y) {
                // SVGキャラクターを表示（参考HTMLの動作に合わせる）
                const direction = gameState.heroDirection || 'down';
                const isLeft = direction === 'left';
                
                // 各ビューの表示/非表示を決定
                const showDown = direction === 'down';
                const showUp = direction === 'up';
                const showRight = direction === 'right' || direction === 'left';
                
                cell.innerHTML = `
                    <div class="hero-svg-container" style="transform: scale(1.2) scaleX(${isLeft ? '-1' : '1'});">
                        <div class="hero-animating">
                            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="hero-svg">
                            <defs>
                                <linearGradient id="hatGradient" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#48BB78"/>
                                    <stop offset="1" stop-color="#2F855A"/>
                                </linearGradient>
                                <linearGradient id="clothesGradient" x1="50" y1="40" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#A0AEC0"/>
                                    <stop offset="1" stop-color="#718096"/>
                                </linearGradient>
                            </defs>
                            <g id="view-down" style="display: ${showDown ? 'block' : 'none'};">
                                <path d="M30 40 Q50 35 70 40 L75 80 Q50 85 25 80 Z" fill="#2D3748"/>
                                <rect x="35" y="75" width="10" height="20" rx="3" fill="#4A5568"/>
                                <rect x="55" y="75" width="10" height="20" rx="3" fill="#4A5568"/>
                                <path d="M33 90 H47 V93 Q47 98 40 98 Q33 98 33 93 Z" fill="#744210"/>
                                <path d="M53 90 H67 V93 Q67 98 60 98 Q53 98 53 93 Z" fill="#744210"/>
                                <path d="M30 45 L70 45 L72 78 Q50 82 28 78 Z" fill="url(#clothesGradient)"/>
                                <rect x="29" y="65" width="42" height="6" fill="#744210"/>
                                <rect x="45" y="64" width="10" height="8" fill="#F6E05E" stroke="#B7791F" stroke-width="1"/>
                                <circle cx="50" cy="35" r="20" fill="#F6E05E"/>
                                <circle cx="50" cy="35" r="20" fill="#FBD38D"/>
                                <ellipse cx="43" cy="38" rx="2.5" ry="4" fill="#1A202C"/>
                                <ellipse cx="57" cy="38" rx="2.5" ry="4" fill="#1A202C"/>
                                <circle cx="38" cy="45" r="2.5" fill="#F687B3" opacity="0.6"/>
                                <circle cx="62" cy="45" r="2.5" fill="#F687B3" opacity="0.6"/>
                                <path d="M20 30 Q50 5 80 30 L90 35 Q50 25 10 35 Z" fill="url(#hatGradient)"/>
                                <path d="M30 30 Q50 0 70 30" fill="url(#hatGradient)"/>
                                <path d="M85 32 Q88 20 82 10 L80 12 L85 32" fill="#E53E3E"/>
                            </g>
                            <g id="view-up" style="display: ${showUp ? 'block' : 'none'};">
                                <rect x="35" y="75" width="10" height="20" rx="3" fill="#4A5568"/>
                                <rect x="55" y="75" width="10" height="20" rx="3" fill="#4A5568"/>
                                <path d="M33 92 H47 V95 Q47 98 40 98 Q33 98 33 95 Z" fill="#5D350D"/>
                                <path d="M53 92 H67 V95 Q67 98 60 98 Q53 98 53 95 Z" fill="#5D350D"/>
                                <path d="M25 40 Q50 35 75 40 L80 85 Q50 90 20 85 Z" fill="#2F855A"/>
                                <rect x="35" y="45" width="30" height="30" rx="5" fill="#975A16"/>
                                <rect x="35" y="45" width="30" height="10" rx="2" fill="#744210"/>
                                <rect x="45" y="55" width="10" height="15" rx="1" fill="#744210" opacity="0.5"/>
                                <path d="M15 35 Q50 25 85 35 L80 25 Q50 0 20 25 Z" fill="url(#hatGradient)"/>
                            </g>
                            <g id="view-right" style="display: ${showRight ? 'block' : 'none'};">
                                <path d="M40 75 L35 95 L45 95 L48 75 Z" fill="#2D3748"/>
                                <path d="M32 95 H48 V96 Q48 98 40 98 Q32 98 32 96 Z" fill="#5D350D"/>
                                <path d="M50 75 L55 95 L65 95 L60 75 Z" fill="#4A5568"/>
                                <path d="M52 95 H68 V96 Q68 98 60 98 Q52 98 52 96 Z" fill="#744210"/>
                                <path d="M35 40 Q55 40 60 45 L62 80 Q45 82 38 78 Z" fill="url(#clothesGradient)"/>
                                <path d="M45 45 Q55 60 65 55" stroke="#FBD38D" stroke-width="8" stroke-linecap="round"/>
                                <circle cx="65" cy="55" r="5" fill="#FBD38D"/>
                                <path d="M25 45 Q35 45 35 75 L25 70 Z" fill="#975A16"/>
                                <circle cx="50" cy="35" r="18" fill="#FBD38D"/>
                                <ellipse cx="60" cy="38" rx="2" ry="3.5" fill="#1A202C"/>
                                <circle cx="63" cy="45" r="2.5" fill="#F687B3" opacity="0.6"/>
                                <path d="M25 30 Q50 5 75 30 L85 35 Q50 25 15 35 Z" fill="url(#hatGradient)"/>
                                <path d="M80 32 Q83 20 77 10 L75 12 L80 32" fill="#E53E3E"/>
                            </g>
                            </svg>
                        </div>
                    </div>
                `;
                cell.classList.add('hero');
            } else if (type >= TILE.ALLY_DOG && type <= TILE.ALLY_MONKEY) {
                // 仲間キャラクター（まだパーティに加わっていない場合のみ表示）→ SVGで表示
                const ally = allyData[type];
                if (!party.find(m => m.name === ally.name)) {
                    const uniqueId = x * 100 + y;
                    cell.innerHTML = generateAllySVG(ally.name, 'down', uniqueId);
                    cell.classList.add('obj-ally');
                }
            } else {
                // 仲間が描画されたセルは上書きしない
                if (cell.getAttribute('data-ally') === 'true') {
                    grid.appendChild(cell);
                    return;
                }
                
                // その他のオブジェクト
                const icons = { 
                    [TILE.ENEMY]: '👾', 
                    [TILE.CASTLE]: '🏰', 
                    [TILE.BOSS]: '👹', 
                    [TILE.SHOP]: '🏬', 
                    [TILE.TREASURE_GOLD]: '🎁', 
                    [TILE.NPC]: '👳', 
                    [TILE.DOOR]: '🚪', 
                    [TILE.TREASURE_KEY]: '🎁', 
                    [TILE.TREASURE_OPENED]: '🗃️',
                    [TILE.GHOST]: '👻', 
                    [TILE.MOMO]: '🍑', 
                    [TILE.VILLAGE_ENTRANCE]: '🏚️',
                    [TILE.GOLDEN_CAT]: '🐈',
                    [TILE.BEACH]: '🏖️',
                    [TILE.HIBISCUS]: '🌺',
                    [TILE.COCONUT]: '🥥',
                    [TILE.MANGO]: '🥭',
                    [TILE.COFFIN]: '⚰️',
                    [TILE.COBWEB]: '🕸️',
                    [TILE.CANDLE]: '🕯️',
                    [TILE.WATER_SPIRIT]: '💧',
                    [TILE.FOREST_WITCH]: '🧙‍♀️'
                };
                
                // ショップチェック（SVGを使用）
                // 街の中・火山のフィールド＝道具屋、水の山＝宿屋
                if (type === TILE.SHOP) {
                    const uniqueId = x * 100 + y;
                    const area = hero.currentArea;
                    if (area === 'demon_castle') {
                        cell.innerHTML = generateInnSVG(uniqueId); // 水の山：宿屋
                    } else {
                        cell.innerHTML = generateItemShopSVG(uniqueId); // 街・火山：道具屋
                    }
                    cell.classList.add('obj-shop');
                    grid.appendChild(cell);
                    return;
                }
                
                // NPCチェック
                if (mapInfo.npcs) {
                    const npcIndex = mapInfo.npcs.findIndex(n => n.x === x && n.y === y);
                    if (npcIndex !== -1) {
                        const npc = mapInfo.npcs[npcIndex];
                        // NPCの現在の向きを取得（デフォルトは'down'）
                        const direction = npc.direction || 'down';
                        const uniqueId = x * 100 + y; // 位置に基づいた一意のID
                        
                        // npc.type === 'cat' のときは猫キャラ。南国の村は男3・女3、他は村人/おばあさん
                        if (npc.type === 'cat') {
                            cell.innerHTML = generateCatNPCHTML(direction, uniqueId);
                        } else if (mapInfo.name === "南国の村") {
                            cell.innerHTML = npcIndex < 3 ? generateVillagerSVG(direction, uniqueId) : generateElderSVG(direction, uniqueId);
                        } else if (npcIndex < 2) {
                            cell.innerHTML = generateVillagerSVG(direction, uniqueId);
                        } else {
                            cell.innerHTML = generateElderSVG(direction, uniqueId);
                        }
                        cell.classList.add('obj-npc');
                        grid.appendChild(cell);
                        return;
                    }
                }
                
                // 金色の🐈チェック（SVGを使用）
                if (type === TILE.GOLDEN_CAT) {
                    cell.innerHTML = generateGoldenCatSVG();
                    cell.classList.add('obj-golden-cat');
                    grid.appendChild(cell);
                    return;
                }
                
                // 水の精霊：戦闘時と同じ画像（水龍.png）をマップ上に表示
                if (type === TILE.WATER_SPIRIT) {
                    cell.innerHTML = '<img src="images/水龍.png" alt="水の精霊" style="width:100%;height:100%;object-fit:contain;display:block">';
                    cell.classList.add('obj-water-spirit');
                    grid.appendChild(cell);
                    return;
                }
                
                // オブジェクトのクラスを追加
                const objClassMap = {
                    [TILE.ENEMY]: 'obj-enemy',
                    [TILE.CASTLE]: 'obj-castle',
                    [TILE.BOSS]: 'obj-boss',
                    [TILE.SHOP]: 'obj-shop',
                    [TILE.TREASURE_GOLD]: 'obj-treasure',
                    [TILE.TREASURE_KEY]: 'obj-treasure',
                    [TILE.DOOR]: 'obj-door',
                    [TILE.GHOST]: 'obj-ghost',
                    [TILE.MOMO]: 'obj-momo',
                    [TILE.VILLAGE_ENTRANCE]: 'obj-village-entrance',
                    [TILE.GOLDEN_CAT]: 'obj-golden-cat',
                    [TILE.WATER_SPIRIT]: 'obj-water-spirit',
                    [TILE.FOREST_WITCH]: 'obj-forest-witch'
                };
                
                if (objClassMap[type]) {
                    cell.classList.add(objClassMap[type]);
                }
                
                cell.innerText = icons[type] || '';
            }
            grid.appendChild(cell);
        });
    });
}
