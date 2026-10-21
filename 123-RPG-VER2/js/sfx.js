/* ============================================
   効果音管理システム（Web Audio API）
   ============================================ */

const SFX_VOLUME = 0.3; // 効果音の音量（30%）
let audioContext = null;

/**
 * AudioContextを初期化（ユーザー操作後に確実に動作する）
 */
function initAudioContext() {
    if (audioContext) return audioContext;
    
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContextClass();
    } catch (error) {
        console.error('AudioContext初期化エラー:', error);
    }
    return audioContext;
}

/**
 * 短い音を生成して再生
 * @param {number} frequency - 周波数（Hz）
 * @param {number} duration - 持続時間（秒）
 * @param {string} type - 波形タイプ（'sine', 'square', 'sawtooth', 'triangle'）
 * @param {number} volume - 音量（0.0-1.0、省略時はSFX_VOLUME）
 */
function playTone(frequency, duration, type = 'sine', volume = null) {
    const ctx = initAudioContext();
    if (!ctx) return;
    
    const vol = volume !== null ? Math.min(1.0, Math.max(0.0, volume)) : SFX_VOLUME;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    // エンベロープ（フェードアウト）
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
}

/**
 * 複数の音を連続再生
 * @param {Array<{freq: number, dur: number, type?: string}>} tones - 音の配列
 * @param {number} interval - 音の間隔（秒）
 */
function playToneSequence(tones, interval = 0.05) {
    tones.forEach((tone, index) => {
        setTimeout(() => {
            playTone(
                tone.freq,
                tone.dur || 0.1,
                tone.type || 'sine',
                tone.volume
            );
        }, index * (tone.dur || 0.1 + interval) * 1000);
    });
}

/**
 * 魔法発動効果音
 */
function playSfxMagic() {
    // 上昇する音階（魔法っぽい）
    playToneSequence([
        { freq: 440, dur: 0.1, type: 'sine' },
        { freq: 554, dur: 0.1, type: 'sine' },
        { freq: 659, dur: 0.15, type: 'sine' },
        { freq: 880, dur: 0.2, type: 'sine' }
    ], 0.05);
}

/**
 * レベルアップ効果音
 */
function playSfxLevelUp() {
    // 明るいファンファーレ風
    playToneSequence([
        { freq: 523, dur: 0.1, type: 'sine' },  // C
        { freq: 659, dur: 0.1, type: 'sine' },  // E
        { freq: 784, dur: 0.1, type: 'sine' },  // G
        { freq: 1047, dur: 0.3, type: 'sine' } // C（高音）
    ], 0.05);
}

/**
 * 宝箱を開ける効果音
 */
function playSfxTreasure() {
    // キラキラした音
    playToneSequence([
        { freq: 880, dur: 0.08, type: 'sine' },
        { freq: 1108, dur: 0.08, type: 'sine' },
        { freq: 1319, dur: 0.12, type: 'sine' }
    ], 0.03);
}

/**
 * 街に入る効果音
 */
function playSfxTownIn() {
    // 温かい音（低→高）
    playToneSequence([
        { freq: 330, dur: 0.1, type: 'sine' },
        { freq: 440, dur: 0.15, type: 'sine' }
    ], 0.05);
}

/**
 * 街から出る効果音
 */
function playSfxTownOut() {
    // 少し寂しい音（高→低）
    playToneSequence([
        { freq: 440, dur: 0.1, type: 'sine' },
        { freq: 330, dur: 0.15, type: 'sine' }
    ], 0.05);
}

/**
 * 犬が仲間になる効果音（ワン）
 */
function playSfxAllyDog() {
    // 犬の鳴き声風（低めの音を短く2回）
    playTone(200, 0.08, 'sawtooth', SFX_VOLUME * 0.8);
    setTimeout(() => {
        playTone(180, 0.1, 'sawtooth', SFX_VOLUME * 0.8);
    }, 100);
}

/**
 * 猿が仲間になる効果音（キーキー）
 */
function playSfxAllyMonkey() {
    // 猿の鳴き声風（高めの音を短く連続）
    playToneSequence([
        { freq: 800, dur: 0.06, type: 'sawtooth' },
        { freq: 900, dur: 0.06, type: 'sawtooth' },
        { freq: 800, dur: 0.08, type: 'sawtooth' }
    ], 0.03);
}

/**
 * きじが仲間になる効果音（ケンケン）
 */
function playSfxAllyBird() {
    // 鳥の鳴き声風（短く2回）
    playTone(600, 0.06, 'sine', SFX_VOLUME * 0.7);
    setTimeout(() => {
        playTone(700, 0.08, 'sine', SFX_VOLUME * 0.7);
    }, 80);
}

/**
 * 扉を開ける効果音
 */
function playSfxDoorOpen() {
    // 重い扉が開く音（低音→中音）
    playToneSequence([
        { freq: 150, dur: 0.1, type: 'sawtooth' },
        { freq: 200, dur: 0.15, type: 'sawtooth' },
        { freq: 250, dur: 0.1, type: 'sine' }
    ], 0.05);
}

/**
 * 戦闘開始効果音
 */
function playSfxBattleStart() {
    // 緊張感のある警告音
    playToneSequence([
        { freq: 400, dur: 0.08, type: 'square' },
        { freq: 500, dur: 0.08, type: 'square' },
        { freq: 600, dur: 0.12, type: 'square' }
    ], 0.03);
}

/**
 * 攻撃効果音（たたかう）
 */
function playSfxAttack() {
    // 短く鋭い打撃音
    playTone(300, 0.05, 'square', SFX_VOLUME * 0.6);
    setTimeout(() => {
        playTone(250, 0.08, 'sawtooth', SFX_VOLUME * 0.5);
    }, 30);
}

/**
 * 戦闘勝利効果音
 */
function playSfxVictory() {
    // 明るい勝利ファンファーレ
    playToneSequence([
        { freq: 523, dur: 0.12, type: 'sine' },  // C
        { freq: 659, dur: 0.12, type: 'sine' },  // E
        { freq: 784, dur: 0.12, type: 'sine' },  // G
        { freq: 1047, dur: 0.15, type: 'sine' }, // C（高音）
        { freq: 1319, dur: 0.2, type: 'sine' }   // E（高音）
    ], 0.06);
}

/**
 * 逃走成功効果音
 */
function playSfxEscape() {
    // 軽快な逃走音（高→低、短く）
    playToneSequence([
        { freq: 600, dur: 0.06, type: 'sine' },
        { freq: 500, dur: 0.06, type: 'sine' },
        { freq: 400, dur: 0.08, type: 'sine' }
    ], 0.04);
}

/**
 * ゲームオーバー効果音
 */
function playSfxGameOver() {
    // 暗い下降音
    playToneSequence([
        { freq: 440, dur: 0.15, type: 'sine' },
        { freq: 330, dur: 0.2, type: 'sine' },
        { freq: 220, dur: 0.3, type: 'sine' }
    ], 0.1);
}

/**
 * 宿屋で休む効果音
 */
function playSfxRest() {
    // 安らかな回復音（柔らかい音階）
    playToneSequence([
        { freq: 330, dur: 0.1, type: 'sine' },
        { freq: 392, dur: 0.1, type: 'sine' },
        { freq: 440, dur: 0.15, type: 'sine' },
        { freq: 523, dur: 0.2, type: 'sine' }
    ], 0.08);
}

/**
 * アイテム購入効果音
 */
function playSfxPurchase() {
    // 軽快な成功音（キラキラ）
    playToneSequence([
        { freq: 659, dur: 0.08, type: 'sine' },
        { freq: 784, dur: 0.08, type: 'sine' },
        { freq: 988, dur: 0.1, type: 'sine' }
    ], 0.04);
}

/**
 * エンディング効果音
 */
function playSfxEnding() {
    // 壮大な達成感のある音
    playToneSequence([
        { freq: 262, dur: 0.15, type: 'sine' },  // C（低音）
        { freq: 330, dur: 0.15, type: 'sine' },  // E
        { freq: 392, dur: 0.15, type: 'sine' },  // G
        { freq: 523, dur: 0.2, type: 'sine' },   // C
        { freq: 659, dur: 0.2, type: 'sine' },   // E
        { freq: 784, dur: 0.25, type: 'sine' }   // G（高音）
    ], 0.1);
}

/**
 * 敵エンカウント効果音
 */
function playSfxEncounter() {
    // 警告音（短く緊張感のある音）
    playToneSequence([
        { freq: 500, dur: 0.06, type: 'square' },
        { freq: 600, dur: 0.08, type: 'square' }
    ], 0.02);
}
