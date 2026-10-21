/* ============================================
   仲間SVG生成
   ============================================
   
   役割: 仲間キャラクター（犬・猿・きじ）のSVGスプライトを生成
   
   含まれる処理:
   - generateAllySVG() - 仲間のSVG生成（犬・猿・きじ、4方向対応）
   
   検索性:
   - 仲間の見た目を変更: generateAllySVG()
   ============================================ */

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
