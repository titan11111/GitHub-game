/* ============================================
   建物SVG生成
   ============================================
   
   役割: 建物（宿屋・道具屋）のSVGスプライトを生成
   
   含まれる処理:
   - generateInnSVG() - 宿屋のSVG生成
   - generateItemShopSVG() - 道具屋のSVG生成
   
   検索性:
   - 宿屋の見た目を変更: generateInnSVG()
   - 道具屋の見た目を変更: generateItemShopSVG()
   ============================================ */

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
