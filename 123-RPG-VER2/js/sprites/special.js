/* ============================================
   特殊オブジェクトSVG生成
   ============================================
   
   役割: 特殊オブジェクト（金色の猫、猫NPC）のHTML/SVGを生成
   
   含まれる処理:
   - generateGoldenCatSVG() - 金色の猫のSVG生成
   - generateCatNPCHTML() - 猫NPCのHTML生成（4コマアニメ）
   
   検索性:
   - 金色の猫の見た目を変更: generateGoldenCatSVG()
   - 猫NPCの見た目を変更: generateCatNPCHTML()
   ============================================ */

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
