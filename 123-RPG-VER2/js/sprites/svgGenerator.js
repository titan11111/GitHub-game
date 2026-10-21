/* ============================================
   SVGスプライト生成モジュール
   ============================================
   
   役割: ゲーム内で使用する各種キャラクター・オブジェクトのSVGスプライトを生成する
   
   責務:
   - 村人、おばあさん、仲間（犬・猿・きじ）のSVG生成
   - 建物（宿屋・道具屋）のSVG生成
   - 特殊オブジェクト（金色の猫、猫NPC）のHTML/SVG生成
   
   含まれる処理:
   - generateVillagerSVG() - 村人のSVG生成（4方向対応）
   - generateElderSVG() - おばあさんのSVG生成（4方向対応）
   - generateAllySVG() - 仲間のSVG生成（犬・猿・きじ、4方向対応）
   - generateInnSVG() - 宿屋のSVG生成
   - generateItemShopSVG() - 道具屋のSVG生成
   - generateGoldenCatSVG() - 金色の猫のSVG生成
   - generateCatNPCHTML() - 猫NPCのHTML生成（4コマアニメ）
   
   検索性:
   - SVG生成を探す: このファイル
   - キャラクターの見た目を変更: このファイル内の該当関数
   - 新しいキャラクターを追加: このファイルに新しい生成関数を追加
   ============================================ */
/**
 * 村人のSVGを生成（提供されたSVGを参考）
 * @param {string} direction - 方向（'up', 'down', 'left', 'right'）
 * @param {number} uniqueId - 一意のID
 * @returns {string} SVGのHTML文字列
 */
function generateVillagerSVG(direction = 'down', uniqueId = 0) {
    const showDown = direction === 'down';
    const showUp = direction === 'up';
    const showLeft = direction === 'left';
    const showRight = direction === 'right';
    const isLeft = direction === 'left';
    const idSuffix = uniqueId;
    
    return `
        <div class="villager-svg-container" style="width: 100%; height: 100%; transform: scaleX(${isLeft ? '-1' : '1'});">
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                <defs>
                    <style>
                        .skin-${idSuffix} { fill: #f0c0a0; }
                        .hair-${idSuffix} { fill: #5d4037; }
                        .tunic-${idSuffix} { fill: #3498db; }
                        .pants-${idSuffix} { fill: #5d4037; }
                        .shoes-${idSuffix} { fill: #2c3e50; }
                        .belt-${idSuffix} { fill: #e67e22; }
                    </style>
                </defs>

                <!-- GROUP: DOWN (Front) -->
                <g id="villager-down-${idSuffix}" style="display: ${showDown ? 'block' : 'none'};">
                    <!-- Body -->
                    <rect x="10" y="14" width="12" height="10" rx="1" class="tunic-${idSuffix}" />
                    <!-- Legs -->
                    <rect x="11" y="24" width="4" height="6" class="pants-${idSuffix}" />
                    <rect x="17" y="24" width="4" height="6" class="pants-${idSuffix}" />
                    <!-- Shoes -->
                    <rect x="10" y="28" width="5" height="4" rx="1" class="shoes-${idSuffix}" />
                    <rect x="17" y="28" width="5" height="4" rx="1" class="shoes-${idSuffix}" />
                    <!-- Belt -->
                    <rect x="10" y="20" width="12" height="2" class="belt-${idSuffix}" />
                    <rect x="14.5" y="19.5" width="3" height="3" fill="#f1c40f" rx="0.5"/>
                    <!-- Head -->
                    <rect x="10" y="4" width="12" height="11" rx="2" class="skin-${idSuffix}" />
                    <!-- Hair -->
                    <path d="M9,4 L23,4 L23,8 L9,8 Z" class="hair-${idSuffix}" />
                    <rect x="9" y="4" width="14" height="4" rx="2" class="hair-${idSuffix}" />
                    <rect x="8" y="5" width="2" height="6" rx="1" class="hair-${idSuffix}" />
                    <rect x="22" y="5" width="2" height="6" rx="1" class="hair-${idSuffix}" />
                    <!-- Face Details -->
                    <rect x="12" y="9" width="2" height="3" fill="#222" /> <!-- Eye L -->
                    <rect x="18" y="9" width="2" height="3" fill="#222" /> <!-- Eye R -->
                    <rect x="14.5" y="12" width="3" height="1" fill="#cc8e69" /> <!-- Mouth/Nose shadow -->
                </g>

                <!-- GROUP: UP (Back) -->
                <g id="villager-up-${idSuffix}" style="display: ${showUp ? 'block' : 'none'};">
                     <!-- Body -->
                     <rect x="10" y="14" width="12" height="10" rx="1" class="tunic-${idSuffix}" />
                     <!-- Legs -->
                     <rect x="11" y="24" width="4" height="6" class="pants-${idSuffix}" />
                     <rect x="17" y="24" width="4" height="6" class="pants-${idSuffix}" />
                     <!-- Shoes -->
                     <rect x="10" y="28" width="5" height="4" rx="1" class="shoes-${idSuffix}" />
                     <rect x="17" y="28" width="5" height="4" rx="1" class="shoes-${idSuffix}" />
                     <!-- Belt -->
                     <rect x="10" y="20" width="12" height="2" class="belt-${idSuffix}" />
                     <!-- Head -->
                     <rect x="10" y="4" width="12" height="11" rx="2" class="skin-${idSuffix}" />
                     <!-- Hair (Full Back) -->
                     <path d="M9,4 Q16,2 23,4 L23,12 Q16,13 9,12 Z" class="hair-${idSuffix}" />
                </g>

                <!-- GROUP: RIGHT (Side) -->
                <g id="villager-right-${idSuffix}" style="display: ${showRight ? 'block' : 'none'};">
                     <!-- Body -->
                     <rect x="12" y="14" width="8" height="10" rx="1" class="tunic-${idSuffix}" />
                     <!-- Arm -->
                     <rect x="14" y="15" width="4" height="9" rx="1" class="tunic-${idSuffix}" />
                     <rect x="14" y="22" width="4" height="3" rx="1" class="skin-${idSuffix}" /> <!-- Hand -->
                     <!-- Legs -->
                     <rect x="13" y="24" width="5" height="6" class="pants-${idSuffix}" />
                     <!-- Shoes -->
                     <rect x="12" y="28" width="7" height="4" rx="1" class="shoes-${idSuffix}" />
                     <!-- Head -->
                     <rect x="11" y="4" width="10" height="11" rx="2" class="skin-${idSuffix}" />
                     <!-- Hair -->
                     <path d="M10,4 L20,4 L21,9 L10,9 Z" class="hair-${idSuffix}" />
                     <rect x="10" y="4" width="6" height="10" class="hair-${idSuffix}" /> <!-- Back hair -->
                     <!-- Face Profile -->
                     <rect x="20" y="9" width="2" height="3" fill="#222" /> <!-- Eye -->
                     <rect x="21" y="11" width="1" height="1" fill="#f0c0a0" /> <!-- Nose bump -->
                </g>
            </svg>
        </div>
    `;
}

/**
 * 宿屋のSVGを生成（提供されたSVGを参考）
 * @param {number} uniqueId - 一意のID
 * @returns {string} SVGのHTML文字列
 */
function generateInnSVG(uniqueId = 0) {
    const idSuffix = uniqueId;
    
    return `
        <div class="inn-svg-container" style="width: 100%; height: 100%;">
            <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                <!-- Sky/Background Circle (Optional) -->
                <circle cx="200" cy="200" r="190" fill="#e6f7ff" stroke="#b3d9ff" stroke-width="2"/>

                <!-- Ground -->
                <path d="M40 340 Q200 360 360 340 L360 380 L40 380 Z" fill="#8Bc34a"/>

                <!-- Main Building Body -->
                <rect x="100" y="180" width="200" height="160" fill="#f3e5ab" stroke="#5d4037" stroke-width="2"/>
                
                <!-- Wood Beams (Vertical) -->
                <rect x="100" y="180" width="15" height="160" fill="#5d4037"/>
                <rect x="285" y="180" width="15" height="160" fill="#5d4037"/>
                <rect x="192" y="180" width="15" height="160" fill="#5d4037"/>
                
                <!-- Wood Beams (Horizontal/Cross) -->
                <rect x="100" y="250" width="200" height="10" fill="#5d4037"/>

                <!-- Door -->
                <g transform="translate(165, 270)">
                    <path d="M0 0 H70 V70 H0 Z" fill="#3e2723"/> <!-- Frame -->
                    <path d="M5 5 H65 V70 H5 Z" fill="#5d4037"/> <!-- Door -->
                    <path d="M5 5 H65 V35 H5 Z" fill="#6d4c41"/> <!-- Upper panel -->
                    <circle cx="12" cy="35" r="3" fill="#ffb74d"/> <!-- Handle -->
                </g>

                <!-- Window Left -->
                <g transform="translate(125, 200)">
                    <rect x="0" y="0" width="40" height="40" fill="#4e342e"/>
                    <rect x="3" y="3" width="34" height="34" fill="#ffecb3"/> <!-- Light -->
                    <rect x="18" y="0" width="4" height="40" fill="#4e342e"/>
                    <rect x="0" y="18" width="40" height="4" fill="#4e342e"/>
                </g>

                <!-- Window Right -->
                <g transform="translate(235, 200)">
                    <rect x="0" y="0" width="40" height="40" fill="#4e342e"/>
                    <rect x="3" y="3" width="34" height="34" fill="#ffecb3"/> <!-- Light -->
                    <rect x="18" y="0" width="4" height="40" fill="#4e342e"/>
                    <rect x="0" y="18" width="40" height="4" fill="#4e342e"/>
                </g>

                <!-- Roof -->
                <path d="M80 180 L200 80 L320 180 Z" fill="#8d6e63" stroke="#3e2723" stroke-width="3"/>
                <path d="M95 168 L200 80 L305 168" fill="none" stroke="#a1887f" stroke-width="4" stroke-linecap="round"/>
                
                <!-- Chimney -->
                <rect x="260" y="100" width="30" height="50" fill="#795548"/>
                <rect x="255" y="95" width="40" height="10" fill="#5d4037"/>
                
                <!-- Smoke -->
                <circle cx="280" cy="80" r="10" fill="rgba(200,200,200,0.6)">
                    <animate attributeName="cy" values="80;60;40" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.6;0.3;0" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="290" cy="70" r="8" fill="rgba(200,200,200,0.5)">
                    <animate attributeName="cy" values="70;50;30" dur="3s" begin="1s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.5;0.2;0" dur="3s" begin="1s" repeatCount="indefinite"/>
                </circle>

                <!-- Signboard (The essential RPG Inn element) -->
                <g transform="translate(80, 210)">
                    <!-- Support bracket -->
                    <path d="M20 0 L-20 0 L-20 10 L20 10 Z" fill="#3e2723"/>
                    <path d="M-15 10 L15 30" stroke="#3e2723" stroke-width="3"/>
                    
                    <!-- Chain -->
                    <line x1="-10" y1="10" x2="-10" y2="30" stroke="#555" stroke-width="2"/>
                    <line x1="10" y1="10" x2="10" y2="30" stroke="#555" stroke-width="2"/>

                    <!-- Board -->
                    <rect x="-25" y="30" width="50" height="40" rx="3" fill="#5d4037" stroke="#3e2723" stroke-width="2"/>
                    <rect x="-22" y="33" width="44" height="34" rx="2" fill="#8d6e63"/>
                    
                    <!-- Bed Icon on Sign -->
                    <g transform="translate(-15, 45) scale(0.6)">
                        <path d="M5 10 L5 25 M45 10 L45 25 M5 20 L45 20" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
                        <path d="M5 20 Q15 10 25 20 Q35 10 45 20" fill="#ffecb3"/> <!-- Blanket/Pillow hint -->
                        <rect x="5" y="20" width="40" height="10" fill="#fff"/>
                    </g>
                </g>
            </svg>
        </div>
    `;
}

/**
 * 道具屋のSVGを生成（提供されたSVGを参考）
 * @param {number} uniqueId - 一意のID
 * @returns {string} SVGのHTML文字列
 */
function generateItemShopSVG(uniqueId = 0) {
    return `
        <div class="item-shop-svg-container" style="width: 100%; height: 100%;">
            <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                <!-- Ground Shadow -->
                <ellipse cx="200" cy="360" rx="160" ry="20" fill="#000000" fill-opacity="0.2"/>

                <!-- Base Foundation -->
                <rect x="80" y="330" width="240" height="30" rx="4" fill="#78909C"/>
                <path d="M80 330H320V340H80V330Z" fill="#546E7A"/>

                <!-- Main Building Body -->
                <rect x="90" y="180" width="220" height="150" fill="#FDF3E3"/>
                
                <!-- Wood Beams (Vertical) -->
                <rect x="90" y="180" width="15" height="150" fill="#5D4037"/>
                <rect x="295" y="180" width="15" height="150" fill="#5D4037"/>
                <rect x="192" y="180" width="15" height="150" fill="#5D4037"/>

                <!-- Wood Beams (Horizontal) -->
                <rect x="90" y="180" width="220" height="10" fill="#5D4037"/>
                <rect x="90" y="250" width="220" height="10" fill="#5D4037"/>
                <rect x="90" y="320" width="220" height="10" fill="#5D4037"/>

                <!-- Door -->
                <path d="M120 330V240C120 228.954 128.954 220 140 220H160C171.046 220 180 228.954 180 240V330H120Z" fill="#8D6E63"/>
                <rect x="120" y="330" width="60" height="5" fill="#5D4037"/>
                <rect x="125" y="230" width="50" height="90" rx="2" stroke="#5D4037" stroke-width="2"/>
                <circle cx="170" cy="280" r="3" fill="#FFD700"/>

                <!-- Window -->
                <rect x="225" y="260" width="50" height="50" fill="#81D4FA" stroke="#5D4037" stroke-width="4"/>
                <line x1="250" y1="260" x2="250" y2="310" stroke="#5D4037" stroke-width="3"/>
                <line x1="225" y1="285" x2="275" y2="285" stroke="#5D4037" stroke-width="3"/>
                <rect x="220" y="305" width="60" height="12" rx="2" fill="#5D4037"/>
                <circle cx="230" cy="305" r="4" fill="#E91E63"/>
                <circle cx="240" cy="303" r="4" fill="#FFEB3B"/>
                <circle cx="250" cy="306" r="4" fill="#9C27B0"/>
                <circle cx="260" cy="304" r="4" fill="#E91E63"/>
                <circle cx="270" cy="305" r="4" fill="#FFEB3B"/>

                <!-- Roof -->
                <path d="M200 80L350 190H50L200 80Z" fill="#C62828"/>
                <path d="M200 80L350 190H330L200 95L70 190H50L200 80Z" fill="#B71C1C"/>
                <rect x="175" y="110" width="50" height="40" fill="#8D6E63"/>
                <path d="M170 110L200 85L230 110H170Z" fill="#C62828"/>
                <circle cx="200" cy="130" r="10" fill="#4FC3F7" stroke="#5D4037" stroke-width="2"/>

                <!-- Chimney -->
                <rect x="260" y="100" width="30" height="60" fill="#795548"/>
                <rect x="255" y="90" width="40" height="10" fill="#5D4037"/>
                <path d="M265 90V70C265 70 270 60 280 65C290 70 290 50 300 45" stroke="#CFD8DC" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 4"/>

                <!-- Signboard (The Item Shop Sign) -->
                <g transform="translate(310, 200)">
                    <path d="M0 0H40" stroke="#3E2723" stroke-width="4"/>
                    <path d="M0 30L30 0" stroke="#3E2723" stroke-width="3"/>
                    <line x1="10" y1="0" x2="10" y2="20" stroke="#9E9E9E" stroke-width="1"/>
                    <line x1="30" y1="0" x2="30" y2="20" stroke="#9E9E9E" stroke-width="1"/>
                    <rect x="0" y="20" width="40" height="40" rx="2" fill="#8D6E63" stroke="#3E2723" stroke-width="2"/>
                    <path d="M20 28V32C20 32 12 34 12 45C12 50 16 55 20 55C24 55 28 50 28 45C28 34 20 32 20 32V28" fill="#F44336"/>
                    <rect x="18" y="26" width="4" height="2" fill="#FFCC80"/>
                </g>
            </svg>
        </div>
    `;
}

/**
 * 金色の🐈のSVGを生成
 * @returns {string} SVGのHTML文字列
 */
function generateGoldenCatSVG() {
    return `
        <div class="golden-cat-svg-container" style="width: 100%; height: 100%;">
            <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                <!-- 背景 -->
                <rect width="400" height="400" fill="#1a1a1a" />

                <defs>
                    <!-- 金色のベースグラデーション -->
                    <linearGradient id="goldBase" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#fff2ae;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#ffd700;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#b8860b;stop-opacity:1" />
                    </linearGradient>

                    <!-- 三毛模様用の赤金 -->
                    <radialGradient id="patternRedGold">
                        <stop offset="20%" style="stop-color:#ff8c00;stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:#8b4513;stop-opacity:0.6" />
                    </radialGradient>

                    <!-- 三毛模様用の白金 -->
                    <radialGradient id="patternWhiteGold">
                        <stop offset="20%" style="stop-color:#ffffff;stop-opacity:0.9" />
                        <stop offset="100%" style="stop-color:#fff2ae;stop-opacity:0.4" />
                    </radialGradient>

                    <!-- 発光エフェクト -->
                    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="10" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <!-- 後光 -->
                <circle cx="200" cy="220" r="130" fill="#ffd700" opacity="0.1" filter="url(#softGlow)">
                    <animate attributeName="r" values="120;140;120" dur="4s" repeatCount="indefinite" />
                </circle>

                <!-- 猫の本体グループ -->
                <g transform="translate(110, 120)" filter="url(#softGlow)">
                    <!-- 尻尾（短めのカギ尻尾風で可愛く） -->
                    <path d="M150,150 Q180,120 160,100" fill="none" stroke="url(#goldBase)" stroke-width="15" stroke-linecap="round" />
                    
                    <!-- 丸い体（香箱座り風） -->
                    <path d="M20,160 Q20,80 90,80 Q160,80 160,160 Q160,190 90,190 Q20,190 20,160 Z" fill="url(#goldBase)" />
                    
                    <!-- 三毛模様：赤金スポット -->
                    <ellipse cx="60" cy="110" rx="25" ry="15" fill="url(#patternRedGold)" />
                    <ellipse cx="140" cy="130" rx="15" ry="20" fill="url(#patternRedGold)" />
                    
                    <!-- 三毛模様：白金スポット -->
                    <ellipse cx="100" cy="160" rx="35" ry="20" fill="url(#patternWhiteGold)" />
                    <circle cx="45" cy="145" r="10" fill="url(#patternWhiteGold)" />

                    <!-- 丸い頭 -->
                    <circle cx="90" cy="70" r="45" fill="url(#goldBase)" />
                    
                    <!-- 耳（少し内側に寄せて可愛く） -->
                    <path d="M55,45 L45,10 L80,35 Z" fill="url(#goldBase)" />
                    <path d="M125,45 L135,10 L100,35 Z" fill="url(#goldBase)" />
                    
                    <!-- 目（ぱっちりした形） -->
                    <circle cx="75" cy="65" r="6" fill="#1a1a1a" />
                    <circle cx="105" cy="65" r="6" fill="#1a1a1a" />
                    <!-- 瞳のハイライト -->
                    <circle cx="73" cy="63" r="2" fill="#ffffff" />
                    <circle cx="103" cy="63" r="2" fill="#ffffff" />
                    
                    <!-- 鼻と口（ωの形） -->
                    <path d="M82,85 Q90,92 98,85" fill="none" stroke="#6d4c11" stroke-width="2.5" stroke-linecap="round" />
                </g>

                <!-- 舞い上がる光の粉 -->
                <g>
                    <circle cx="100" cy="300" r="2" fill="#fff2ae">
                        <animate attributeName="cy" values="300;200" dur="3s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="300" cy="350" r="1.5" fill="#ffd700">
                        <animate attributeName="cy" values="350;250" dur="4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite" />
                    </circle>
                </g>
            </svg>
        </div>
    `;
}

/**
 * 南国フィールド用・三毛猫NPCの4コマアニメを生成（125-猫アニメの猫キャラ）
 * @param {string} direction - 方向（'up','down','left','right'）※表示は常に下向きでアニメ
 * @param {number} uniqueId - 一意のID
 * @returns {string} HTML文字列
 */
function generateCatNPCHTML(direction, uniqueId) {
    const paths = ['images/neko1.png', 'images/neko2.png', 'images/neko3.png', 'images/neko4.png'];
    const frames = paths.map((p, i) => 
        `<img src="${p}" alt="F${i+1}" class="cat-npc-frame cat-npc-f${i+1} pixelated" data-src="${p}">`
    ).join('');
    return `
        <div class="cat-npc-container" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
            <div class="cat-npc-bounce">
                ${frames}
            </div>
        </div>
    `;
}

/**
 * おばあさん（村の長老）のSVGを生成（提供されたSVGを参考）
 * @param {string} direction - 方向（'up', 'down', 'left', 'right'）
 * @param {number} uniqueId - 一意のID
 * @returns {string} SVGのHTML文字列
 */
function generateElderSVG(direction = 'down', uniqueId = 0) {
    const showDown = direction === 'down';
    const showUp = direction === 'up';
    const showLeft = direction === 'left';
    const showRight = direction === 'right';
    const isLeft = direction === 'left';
    const idSuffix = uniqueId;
    
    return `
        <div class="elder-svg-container" style="width: 100%; height: 100%; transform: scaleX(${isLeft ? '-1' : '1'});">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                <defs>
                    <linearGradient id="skin-elder-${idSuffix}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#fbd3b6;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#eac0a0;stop-opacity:1" />
                    </linearGradient>
                    <linearGradient id="dress-elder-${idSuffix}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#48bb78;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#38a169;stop-opacity:1" />
                    </linearGradient>
                    <linearGradient id="hair-elder-${idSuffix}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#e2e8f0;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#cbd5e0;stop-opacity:1" />
                    </linearGradient>
                </defs>

                <!-- Shadow -->
                <ellipse cx="50" cy="95" rx="30" ry="5" fill="rgba(0,0,0,0.3)" />

                <!-- GROUP: DOWN (Front View) -->
                <g id="elder-down-${idSuffix}" style="display: ${showDown ? 'block' : 'none'};">
                    <!-- Body/Dress -->
                    <path d="M30,90 L25,60 Q20,40 50,40 Q80,40 75,60 L70,90 Z" fill="url(#dress-elder-${idSuffix})" />
                    <!-- Apron -->
                    <path d="M35,90 L33,60 Q33,50 50,50 Q67,50 67,60 L65,90 Z" fill="#fff" />
                    <!-- Head -->
                    <circle cx="50" cy="35" r="18" fill="url(#skin-elder-${idSuffix})" />
                    <!-- Hair (Bun) -->
                    <circle cx="50" cy="22" r="12" fill="url(#hair-elder-${idSuffix})" />
                    <path d="M32,35 Q32,20 50,20 Q68,20 68,35" fill="none" stroke="url(#hair-elder-${idSuffix})" stroke-width="6" />
                    <!-- Face Details -->
                    <circle cx="43" cy="38" r="2" fill="#2d3748" /> <!-- Eye L -->
                    <circle cx="57" cy="38" r="2" fill="#2d3748" /> <!-- Eye R -->
                    <path d="M42,32 Q45,30 48,32" fill="none" stroke="#a0aec0" stroke-width="1" /> <!-- Brow L -->
                    <path d="M52,32 Q55,30 58,32" fill="none" stroke="#a0aec0" stroke-width="1" /> <!-- Brow R -->
                    <path d="M48,45 Q50,48 52,45" fill="none" stroke="#e53e3e" stroke-width="1.5" /> <!-- Mouth -->
                    <circle cx="40" cy="42" r="3" fill="rgba(255,0,0,0.1)" /> <!-- Blush L -->
                    <circle cx="60" cy="42" r="3" fill="rgba(255,0,0,0.1)" /> <!-- Blush R -->
                    <!-- Glasses -->
                    <circle cx="43" cy="38" r="4" fill="none" stroke="#718096" stroke-width="0.5" />
                    <circle cx="57" cy="38" r="4" fill="none" stroke="#718096" stroke-width="0.5" />
                    <line x1="47" y1="38" x2="53" y2="38" stroke="#718096" stroke-width="0.5" />
                </g>

                <!-- GROUP: UP (Back View) -->
                <g id="elder-up-${idSuffix}" style="display: ${showUp ? 'block' : 'none'};">
                     <!-- Body/Dress -->
                     <path d="M30,90 L25,60 Q20,40 50,40 Q80,40 75,60 L70,90 Z" fill="url(#dress-elder-${idSuffix})" />
                     <!-- Apron Strings -->
                     <path d="M40,55 L60,55" stroke="#fff" stroke-width="2" />
                     <path d="M45,55 L45,80" stroke="#fff" stroke-width="2" />
                     <path d="M55,55 L55,80" stroke="#fff" stroke-width="2" />
                     <path d="M45,60 Q50,70 55,60" fill="none" stroke="#fff" stroke-width="2" /> <!-- Bow -->
                     <!-- Head -->
                     <circle cx="50" cy="35" r="18" fill="url(#skin-elder-${idSuffix})" />
                     <!-- Hair (Back Full) -->
                     <circle cx="50" cy="35" r="19" fill="url(#hair-elder-${idSuffix})" />
                     <!-- Big Bun -->
                     <circle cx="50" cy="25" r="14" fill="url(#hair-elder-${idSuffix})" />
                     <circle cx="50" cy="25" r="10" fill="none" stroke="#a0aec0" stroke-width="1" stroke-dasharray="2,2" />
                </g>

                <!-- GROUP: RIGHT (Side View) -->
                <g id="elder-right-${idSuffix}" style="display: ${showRight ? 'block' : 'none'};">
                    <!-- Body/Dress -->
                    <path d="M40,90 L35,60 Q35,40 50,40 Q65,40 65,60 L60,90 Z" fill="url(#dress-elder-${idSuffix})" />
                    <!-- Apron Side -->
                    <path d="M50,90 L50,50 Q66,50 66,60 L61,90 Z" fill="#fff" />
                    <!-- Head -->
                    <circle cx="50" cy="35" r="17" fill="url(#skin-elder-${idSuffix})" />
                    <!-- Hair Side -->
                    <path d="M35,35 Q35,20 50,20 Q65,20 65,35" fill="url(#hair-elder-${idSuffix})" />
                    <circle cx="38" cy="25" r="10" fill="url(#hair-elder-${idSuffix})" /> <!-- Bun at back -->
                    <!-- Face Profile -->
                    <circle cx="62" cy="38" r="2" fill="#2d3748" /> <!-- Eye -->
                    <path d="M66,45 L64,45" stroke="#e53e3e" stroke-width="1.5" /> <!-- Mouth -->
                     <!-- Glasses Side -->
                     <line x1="55" y1="38" x2="62" y2="38" stroke="#718096" stroke-width="0.5" />
                     <circle cx="62" cy="38" r="4" fill="none" stroke="#718096" stroke-width="0.5" />
                    <!-- Cane -->
                    <path d="M60,90 L70,60" stroke="#8d6e63" stroke-width="3" stroke-linecap="round" />
                    <circle cx="71" cy="59" r="3" fill="#5d4037" />
                </g>

                <!-- GROUP: LEFT (Side View - flipped via transform) -->
                <g id="elder-left-${idSuffix}" style="display: ${showLeft ? 'block' : 'none'};" transform="scale(-1, 1) translate(-100, 0)">
                    <!-- Body/Dress -->
                    <path d="M40,90 L35,60 Q35,40 50,40 Q65,40 65,60 L60,90 Z" fill="url(#dress-elder-${idSuffix})" />
                    <!-- Apron Side -->
                    <path d="M50,90 L50,50 Q66,50 66,60 L61,90 Z" fill="#fff" />
                    <!-- Head -->
                    <circle cx="50" cy="35" r="17" fill="url(#skin-elder-${idSuffix})" />
                    <!-- Hair Side -->
                    <path d="M35,35 Q35,20 50,20 Q65,20 65,35" fill="url(#hair-elder-${idSuffix})" />
                    <circle cx="38" cy="25" r="10" fill="url(#hair-elder-${idSuffix})" /> <!-- Bun at back -->
                    <!-- Face Profile -->
                    <circle cx="62" cy="38" r="2" fill="#2d3748" /> <!-- Eye -->
                    <path d="M66,45 L64,45" stroke="#e53e3e" stroke-width="1.5" /> <!-- Mouth -->
                     <!-- Glasses Side -->
                     <line x1="55" y1="38" x2="62" y2="38" stroke="#718096" stroke-width="0.5" />
                     <circle cx="62" cy="38" r="4" fill="none" stroke="#718096" stroke-width="0.5" />
                    <!-- Cane -->
                    <path d="M60,90 L70,60" stroke="#8d6e63" stroke-width="3" stroke-linecap="round" />
                    <circle cx="71" cy="59" r="3" fill="#5d4037" />
                </g>
            </svg>
        </div>
    `;
}

/**
 * 仲間のSVGを生成
 * @param {string} allyName - 仲間の名前（"犬", "猿", "きじ"）
 * @param {string} direction - 方向（'up', 'down', 'left', 'right'）
 * @param {number} uniqueId - 一意のID（複数の同じ仲間がいる場合のため）
 * @returns {string} SVGのHTML文字列
 */
function generateAllySVG(allyName, direction, uniqueId = 0) {
    const showDown = direction === 'down';
    const showUp = direction === 'up';
    const showLeft = direction === 'left';
    const showRight = direction === 'right';
    const idSuffix = uniqueId;
    
    if (allyName === "犬") {
        return `
            <div class="hero-svg-container" style="width: 100%; height: 100%;">
                <svg class="dog-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: ${showDown ? 'block' : 'none'};">
                    <g>
                        <rect x="22" y="30" width="20" height="24" rx="10" fill="#D97706" />
                        <path d="M26 30 L38 30 L38 45 L26 45 Z" fill="#FDE68A" />
                        <rect x="22" y="45" width="6" height="12" rx="3" fill="#D97706" />
                        <rect x="36" y="45" width="6" height="12" rx="3" fill="#D97706" />
                        <rect x="18" y="10" width="28" height="26" rx="12" fill="#D97706" />
                        <path d="M18 16 L10 24 L18 24 Z" fill="#92400E" />
                        <path d="M46 16 L54 24 L46 24 Z" fill="#92400E" />
                        <ellipse cx="32" cy="28" rx="8" ry="6" fill="#FDE68A" />
                        <circle cx="26" cy="22" r="2" fill="#1F2937" />
                        <circle cx="38" cy="22" r="2" fill="#1F2937" />
                        <ellipse cx="32" cy="26" rx="3" ry="2" fill="#4B5563" />
                        <path d="M30 30 Q32 34 34 30" stroke="#EF4444" stroke-width="2" fill="none" />
                    </g>
                </svg>
                <svg class="dog-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: ${showUp ? 'block' : 'none'};">
                    <g>
                        <path class="tail" d="M30 40 Q32 25 34 40" stroke="#FDE68A" stroke-width="4" fill="none" stroke-linecap="round" style="transform-origin: 32px 40px;" />
                        <rect x="22" y="30" width="20" height="24" rx="10" fill="#D97706" />
                        <rect x="18" y="10" width="28" height="26" rx="12" fill="#D97706" />
                        <path d="M18 16 L10 24 L18 24 Z" fill="#78350F" />
                        <path d="M46 16 L54 24 L46 24 Z" fill="#78350F" />
                        <rect x="22" y="34" width="20" height="4" fill="#EF4444" />
                    </g>
                </svg>
                <svg class="dog-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: ${showLeft ? 'block' : 'none'};">
                    <g transform="scale(-1, 1) translate(-64, 0)">
                        <path class="tail" d="M16 38 Q10 30 16 34" stroke="#FDE68A" stroke-width="3" fill="none" stroke-linecap="round" style="transform-origin: 16px 36px;" />
                        <rect x="20" y="32" width="24" height="20" rx="8" fill="#D97706" />
                        <rect x="22" y="48" width="6" height="10" rx="3" fill="#B45309" />
                        <rect x="36" y="48" width="6" height="10" rx="3" fill="#D97706" />
                        <rect x="34" y="12" width="22" height="24" rx="10" fill="#D97706" />
                        <rect x="50" y="24" width="8" height="10" rx="4" fill="#FDE68A" />
                        <circle cx="56" cy="26" r="2" fill="#1F2937" />
                        <path d="M40 16 L34 26 L44 22 Z" fill="#92400E" />
                        <circle cx="46" cy="20" r="2" fill="#1F2937" />
                    </g>
                </svg>
                <svg class="dog-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: ${showRight ? 'block' : 'none'};">
                    <g>
                        <path class="tail" d="M16 38 Q10 30 16 34" stroke="#FDE68A" stroke-width="3" fill="none" stroke-linecap="round" style="transform-origin: 16px 36px;" />
                        <rect x="20" y="32" width="24" height="20" rx="8" fill="#D97706" />
                        <rect x="22" y="48" width="6" height="10" rx="3" fill="#B45309" />
                        <rect x="36" y="48" width="6" height="10" rx="3" fill="#D97706" />
                        <rect x="34" y="12" width="22" height="24" rx="10" fill="#D97706" />
                        <rect x="50" y="24" width="8" height="10" rx="4" fill="#FDE68A" />
                        <circle cx="56" cy="26" r="2" fill="#1F2937" />
                        <path d="M40 16 L34 26 L44 22 Z" fill="#92400E" />
                        <circle cx="46" cy="20" r="2" fill="#1F2937" />
                    </g>
                </svg>
            </div>
        `;
    } else if (allyName === "猿") {
        return `
            <div class="hero-svg-container" style="width: 100%; height: 100%;">
                <svg class="monkey-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: ${showDown ? 'block' : 'none'};">
                    <defs>
                        <filter id="monkey-shadow-${idSuffix}" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
                            <feOffset dx="0" dy="2" result="offsetblur"/>
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.3"/>
                            </feComponentTransfer>
                            <feMerge> 
                                <feMergeNode/>
                                <feMergeNode in="SourceGraphic"/> 
                            </feMerge>
                        </filter>
                        <radialGradient id="monkey-faceGradient-${idSuffix}" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" style="stop-color:#fce4b8;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#e6c288;stop-opacity:1" />
                        </radialGradient>
                    </defs>
                    <ellipse cx="32" cy="58" rx="16" ry="6" fill="rgba(0,0,0,0.3)" />
                    <g filter="url(#monkey-shadow-${idSuffix})">
                        <circle cx="14" cy="28" r="7" fill="#8B4513" />
                        <circle cx="50" cy="28" r="7" fill="#8B4513" />
                        <circle cx="14" cy="28" r="4" fill="#fce4b8" />
                        <circle cx="50" cy="28" r="4" fill="#fce4b8" />
                        <rect x="22" y="38" width="20" height="20" rx="5" fill="#8B4513" />
                        <rect x="26" y="40" width="12" height="14" rx="3" fill="#e6c288" />
                        <circle cx="32" cy="26" r="16" fill="#8B4513" />
                        <ellipse cx="32" cy="28" rx="12" ry="10" fill="url(#monkey-faceGradient-${idSuffix})" />
                        <ellipse cx="32" cy="33" rx="6" ry="4" fill="#fce4b8" />
                        <circle cx="28" cy="26" r="2" fill="black" />
                        <circle cx="36" cy="26" r="2" fill="black" />
                        <path d="M 30 34 Q 32 36 34 34" stroke="black" stroke-width="1" fill="none" />
                    </g>
                </svg>
                <svg class="monkey-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: ${showUp ? 'block' : 'none'};">
                    <defs>
                        <filter id="monkey-shadow-up-${idSuffix}" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
                            <feOffset dx="0" dy="2" result="offsetblur"/>
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.3"/>
                            </feComponentTransfer>
                            <feMerge> 
                                <feMergeNode/>
                                <feMergeNode in="SourceGraphic"/> 
                            </feMerge>
                        </filter>
                    </defs>
                    <ellipse cx="32" cy="58" rx="16" ry="6" fill="rgba(0,0,0,0.3)" />
                    <g filter="url(#monkey-shadow-up-${idSuffix})">
                        <path d="M 32 50 Q 10 40 12 25" stroke="#8B4513" stroke-width="4" fill="none" stroke-linecap="round">
                            <animate attributeName="d" values="M 32 50 Q 10 40 12 25;M 32 50 Q 14 40 16 28;M 32 50 Q 10 40 12 25" dur="1s" repeatCount="indefinite" />
                        </path>
                        <circle cx="14" cy="28" r="6" fill="#6d360f" />
                        <circle cx="50" cy="28" r="6" fill="#6d360f" />
                        <rect x="22" y="38" width="20" height="20" rx="5" fill="#8B4513" />
                        <circle cx="32" cy="26" r="16" fill="#8B4513" />
                        <path d="M 28 15 Q 32 20 36 15" stroke="#6d360f" stroke-width="2" fill="none"/>
                    </g>
                </svg>
                <svg class="monkey-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: ${showLeft ? 'block' : 'none'};">
                    <defs>
                        <filter id="monkey-shadow-left-${idSuffix}" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
                            <feOffset dx="0" dy="2" result="offsetblur"/>
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.3"/>
                            </feComponentTransfer>
                            <feMerge> 
                                <feMergeNode/>
                                <feMergeNode in="SourceGraphic"/> 
                            </feMerge>
                        </filter>
                    </defs>
                    <ellipse cx="32" cy="58" rx="16" ry="6" fill="rgba(0,0,0,0.3)" />
                    <g transform="scale(-1, 1) translate(-64, 0)" filter="url(#monkey-shadow-left-${idSuffix})">
                        <path class="monkey-tail" d="M 22 48 Q 10 45 12 35" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round" />
                        <rect x="28" y="50" width="6" height="8" rx="2" fill="#6d360f" />
                        <ellipse cx="30" cy="45" rx="10" ry="12" fill="#8B4513" />
                        <rect x="34" y="52" width="6" height="8" rx="2" fill="#8B4513" />
                        <path d="M 35 40 Q 45 45 42 35" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round"/>
                        <circle cx="30" cy="28" r="5" fill="#8B4513" />
                        <circle cx="36" cy="24" r="14" fill="#8B4513" />
                        <path d="M 36 14 Q 52 14 52 28 Q 52 40 40 36" fill="#fce4b8" />
                        <circle cx="46" cy="24" r="2" fill="black" />
                    </g>
                </svg>
                <svg class="monkey-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: ${showRight ? 'block' : 'none'};">
                    <defs>
                        <filter id="monkey-shadow-right-${idSuffix}" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
                            <feOffset dx="0" dy="2" result="offsetblur"/>
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.3"/>
                            </feComponentTransfer>
                            <feMerge> 
                                <feMergeNode/>
                                <feMergeNode in="SourceGraphic"/> 
                            </feMerge>
                        </filter>
                    </defs>
                    <ellipse cx="32" cy="58" rx="16" ry="6" fill="rgba(0,0,0,0.3)" />
                    <g filter="url(#monkey-shadow-right-${idSuffix})">
                        <path class="monkey-tail" d="M 22 48 Q 10 45 12 35" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round" />
                        <rect x="28" y="50" width="6" height="8" rx="2" fill="#6d360f" />
                        <ellipse cx="30" cy="45" rx="10" ry="12" fill="#8B4513" />
                        <rect x="34" y="52" width="6" height="8" rx="2" fill="#8B4513" />
                        <path d="M 35 40 Q 45 45 42 35" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round"/>
                        <circle cx="30" cy="28" r="5" fill="#8B4513" />
                        <circle cx="36" cy="24" r="14" fill="#8B4513" />
                        <path d="M 36 14 Q 52 14 52 28 Q 52 40 40 36" fill="#fce4b8" />
                        <circle cx="46" cy="24" r="2" fill="black" />
                    </g>
                </svg>
            </div>
        `;
    } else if (allyName === "きじ") {
        return `
            <div class="hero-svg-container" style="width: 100%; height: 100%;">
                <svg class="bird-svg" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: ${showDown ? 'block' : 'none'};">
                    <ellipse cx="16" cy="30" rx="8" ry="2" fill="rgba(0,0,0,0.3)" />
                    <g>
                        <path d="M12 20 L6 28 L10 32 L16 28 L22 32 L26 28 L20 20 Z" fill="#8B4513" />
                        <rect x="10" y="14" width="12" height="14" rx="4" fill="#2E8B57" />
                        <path d="M10 14 Q16 22 22 14" fill="#225533" opacity="0.5" />
                        <circle cx="16" cy="10" r="5" fill="#2E8B57" />
                        <path d="M13 8 L19 8 L18 12 L14 12 Z" fill="#E53E3E" />
                        <path d="M15 10 L17 10 L16 12 Z" fill="#F6E05E" />
                        <circle cx="14" cy="9" r="0.5" fill="black" />
                        <circle cx="18" cy="9" r="0.5" fill="black" />
                        <path d="M12 28 L12 30 M20 28 L20 30" stroke="#F6E05E" stroke-width="2" />
                    </g>
                </svg>
                <svg class="bird-svg" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: ${showUp ? 'block' : 'none'};">
                    <ellipse cx="16" cy="30" rx="8" ry="2" fill="rgba(0,0,0,0.3)" />
                    <g>
                        <path d="M14 20 L8 32 L16 36 L24 32 L18 20 Z" fill="#A0522D" />
                        <path d="M16 20 L16 36" stroke="#5D4037" stroke-width="1" />
                        <rect x="10" y="14" width="12" height="12" rx="4" fill="#225533" />
                        <circle cx="16" cy="10" r="5" fill="#2E8B57" />
                        <path d="M12 13 Q16 15 20 13" stroke="white" stroke-width="1" fill="none" />
                    </g>
                </svg>
                <svg class="bird-svg" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: ${showLeft ? 'block' : 'none'};">
                    <ellipse cx="16" cy="30" rx="8" ry="2" fill="rgba(0,0,0,0.3)" />
                    <g transform="scale(-1, 1) translate(-32, 0)">
                        <path d="M8 22 L0 26 L2 28 L10 26 Z" fill="#8B4513" />
                        <path d="M14 26 L12 30 L14 30" stroke="#F6E05E" stroke-width="2" fill="none" />
                        <ellipse cx="16" cy="20" rx="7" ry="5" fill="#2E8B57" />
                        <path d="M12 18 Q16 18 18 22 Q14 24 12 22 Z" fill="#8B4513" />
                        <path d="M18 26 L18 30 L20 30" stroke="#F6E05E" stroke-width="2" fill="none" />
                        <path d="M18 16 L20 8 L24 8 L24 12 L20 18 Z" fill="#2E8B57" />
                        <circle cx="23" cy="10" r="2.5" fill="#E53E3E" />
                        <path d="M25 9 L28 10 L25 11 Z" fill="#F6E05E" />
                        <circle cx="23" cy="9.5" r="0.5" fill="black" />
                    </g>
                </svg>
                <svg class="bird-svg" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; display: ${showRight ? 'block' : 'none'};">
                    <ellipse cx="16" cy="30" rx="8" ry="2" fill="rgba(0,0,0,0.3)" />
                    <g>
                        <path d="M8 22 L0 26 L2 28 L10 26 Z" fill="#8B4513" />
                        <path d="M14 26 L12 30 L14 30" stroke="#F6E05E" stroke-width="2" fill="none" />
                        <ellipse cx="16" cy="20" rx="7" ry="5" fill="#2E8B57" />
                        <path d="M12 18 Q16 18 18 22 Q14 24 12 22 Z" fill="#8B4513" />
                        <path d="M18 26 L18 30 L20 30" stroke="#F6E05E" stroke-width="2" fill="none" />
                        <path d="M18 16 L20 8 L24 8 L24 12 L20 18 Z" fill="#2E8B57" />
                        <circle cx="23" cy="10" r="2.5" fill="#E53E3E" />
                        <path d="M25 9 L28 10 L25 11 Z" fill="#F6E05E" />
                        <circle cx="23" cy="9.5" r="0.5" fill="black" />
                    </g>
                </svg>
            </div>
        `;
    }
    return '';
}
