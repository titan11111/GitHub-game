/* ============================================
   村人・おばあさんSVG生成
   ============================================
   
   役割: 村人とおばあさん（村の長老）のSVGスプライトを生成
   
   含まれる処理:
   - generateVillagerSVG() - 村人のSVG生成（4方向対応）
   - generateElderSVG() - おばあさんのSVG生成（4方向対応）
   
   検索性:
   - 村人の見た目を変更: generateVillagerSVG()
   - おばあさんの見た目を変更: generateElderSVG()
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
