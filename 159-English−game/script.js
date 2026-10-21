// --- 状態管理 ---
let currentScreen = 'start-screen';
let selectedChar = 'lion'; // デフォルト: 獅子(レオ)
let globalStars = 0;
let isSoundEnabled = true;

// ミニゲーム共通ステート
let currentGameType = '';
let currentQuestionIndex = 0;
let score = 0;
let quizStarsEarned = 0;
let lastTouchEnd = 0;
let talkSpeechTimerId = null;
let talkSpeechSequence = 0;
let hasUserInteracted = false;

const STORAGE_KEYS = {
    stars: 'englishQuest.globalStars',
    sound: 'englishQuest.soundEnabled',
    bestPrefix: 'englishQuest.bestScore.'
};

const gameMeta = {
    wordQuiz: { label: 'たんごクイズ', bestId: 'best-wordQuiz' },
    wordBuilder: { label: 'つづりならべかえ', bestId: 'best-wordBuilder' },
    sentenceTalk: { label: 'おしゃべりトーク', bestId: 'best-sentenceTalk' }
};

// #region agent log
function debugLog(hypothesisId, location, message, data = {}) {
    fetch('http://127.0.0.1:7474/ingest/e4d9a0c6-8ab4-4f7e-ab71-107834751227', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6c85fc' },
        body: JSON.stringify({ sessionId: '6c85fc', runId: 'initial', hypothesisId, location, message, data, timestamp: Date.now() })
    }).catch(() => {});
}
// #endregion

// --- データ定義 ---
// 1. 単語クイズ問題 (小学5年生に最適な単語)
const wordQuizQuestions = [
    {
        emoji: '🍎',
        japanese: 'りんご',
        english: 'apple',
        options: ['apple', 'orange', 'banana', 'grape'],
        meaning: 'くだもの「りんご」'
    },
    {
        emoji: '🐼',
        japanese: 'パンダ',
        english: 'panda',
        options: ['dog', 'panda', 'cat', 'rabbit'],
        meaning: 'どうぶつ「パンダ」'
    },
    {
        emoji: '⚽',
        japanese: 'サッカー',
        english: 'soccer',
        options: ['baseball', 'basketball', 'soccer', 'tennis'],
        meaning: 'スポーツ「サッカー」'
    },
    {
        emoji: '🎨',
        japanese: '図工・美術',
        english: 'art',
        options: ['math', 'science', 'art', 'music'],
        meaning: '学校のきょうか「図工・美術」'
    },
    {
        emoji: '👨‍⚕️',
        japanese: '医者 (いしゃ)',
        english: 'doctor',
        options: ['teacher', 'doctor', 'driver', 'cook'],
        meaning: 'お仕事「いしゃ（医者）」'
    },
    {
        emoji: '🌙',
        japanese: '月曜日',
        english: 'Monday',
        options: ['Monday', 'Friday', 'Sunday', 'October'],
        meaning: '曜日「月曜日」'
    },
    {
        emoji: '🍛',
        japanese: 'カレー',
        english: 'curry',
        options: ['rice', 'curry', 'bread', 'salad'],
        meaning: '食べ物「カレー」'
    },
    {
        emoji: '🧪',
        japanese: '理科',
        english: 'science',
        options: ['English', 'music', 'science', 'math'],
        meaning: '学校のきょうか「理科」'
    },
    {
        emoji: '🇨🇦',
        japanese: 'カナダ',
        english: 'Canada',
        options: ['Japan', 'Canada', 'Australia', 'China'],
        meaning: '国の名前「カナダ」'
    },
    {
        emoji: '🚌',
        japanese: 'バス',
        english: 'bus',
        options: ['train', 'bike', 'bus', 'plane'],
        meaning: '乗り物「バス」'
    }
];

// 2. スペルならべかえ問題
const wordBuilderQuestions = [
    {
        emoji: '🐱',
        japanese: 'ねこ',
        english: 'cat',
        meaning: 'ねこ'
    },
    {
        emoji: '🥛',
        japanese: '牛乳 (ミルク)',
        english: 'milk',
        meaning: 'ミルク'
    },
    {
        emoji: '🏫',
        japanese: '学校 (がっこう)',
        english: 'school',
        meaning: '学校'
    },
    {
        emoji: '🎹',
        japanese: '音楽 (おんがく)',
        english: 'music',
        meaning: '音楽の教科や音楽そのもの'
    },
    {
        emoji: '☀️',
        japanese: '晴れ (はれ)',
        english: 'sunny',
        meaning: '晴れたお天気'
    },
    {
        emoji: '📚',
        japanese: '本',
        english: 'book',
        meaning: '本'
    },
    {
        emoji: '🏃',
        japanese: '走る',
        english: 'run',
        meaning: '走る'
    },
    {
        emoji: '💧',
        japanese: '水',
        english: 'water',
        meaning: '水'
    },
    {
        emoji: '🐯',
        japanese: 'トラ',
        english: 'tiger',
        meaning: 'トラ'
    },
    {
        emoji: '🛝',
        japanese: '公園',
        english: 'park',
        meaning: '公園'
    }
];

// 3. おしゃべりトーク会話データ
const sentenceTalkQuestions = [
    {
        partnerEmoji: '🐰',
        partnerName: 'ミミちゃん',
        questionText: 'What color do you like?',
        questionHint: '「なんの色がすき？」ときいているよ',
        replyPattern: 'I like [ANSWER].',
        replyHint: '「わたしは◯◯がすきです」とこたえよう',
        correctWord: 'blue',
        options: ['blue', 'soccer', 'carrot', 'sunny'],
        playerSpeech: 'I like blue.',
        partnerSpeech: 'What color do you like?'
    },
    {
        partnerEmoji: '🦉',
        partnerName: 'ホー博士',
        questionText: 'Can you play tennis?',
        questionHint: '「テニスはできるかい？」ときいているよ',
        replyPattern: 'Yes, I [ANSWER].',
        replyHint: '「はい、できます」とこたえよう',
        correctWord: 'can',
        options: ['can', 'do', 'am', 'like'],
        playerSpeech: 'Yes, I can.',
        partnerSpeech: 'Can you play tennis?'
    },
    {
        partnerEmoji: '🐰',
        partnerName: 'ミミちゃん',
        questionText: 'What do you want to be?',
        questionHint: '「しょうらい何になりたい？」ときいているよ',
        replyPattern: 'I want to be a [ANSWER].',
        replyHint: '「わたしは先生になりたいです」とこたえよう',
        correctWord: 'teacher',
        options: ['apple', 'doctor', 'teacher', 'tennis'],
        playerSpeech: 'I want to be a teacher.',
        partnerSpeech: 'What do you want to be?'
    },
    {
        partnerEmoji: '🦉',
        partnerName: 'ホー博士',
        questionText: 'When is your birthday?',
        questionHint: '「きみの誕生日はいつだい？」ときいているよ',
        replyPattern: 'It is in [ANSWER].',
        replyHint: '「10月です」とこたえよう',
        correctWord: 'October',
        options: ['October', 'Sunday', 'Japanese', 'math'],
        playerSpeech: 'It is in October.',
        partnerSpeech: 'When is your birthday?'
    },
    {
        partnerEmoji: '🐰',
        partnerName: 'ミミちゃん',
        questionText: 'Where do you want to go?',
        questionHint: '「どこにいきたい？」ときいているよ',
        replyPattern: 'I want to go to [ANSWER].',
        replyHint: '「オーストラリアにいきたい」とこたえよう',
        correctWord: 'Australia',
        options: ['banana', 'Australia', 'baseball', 'Monday'],
        playerSpeech: 'I want to go to Australia.',
        partnerSpeech: 'Where do you want to go?'
    },
    {
        partnerEmoji: '🦁',
        partnerName: 'レオくん',
        questionText: 'What food do you like?',
        questionHint: '「どんな食べ物がすき？」ときいているよ',
        replyPattern: 'I like [ANSWER].',
        replyHint: '「カレーがすきです」とこたえよう',
        correctWord: 'curry',
        options: ['curry', 'Monday', 'run', 'Canada'],
        playerSpeech: 'I like curry.',
        partnerSpeech: 'What food do you like?'
    },
    {
        partnerEmoji: '🐰',
        partnerName: 'ミミちゃん',
        questionText: 'What subject do you like?',
        questionHint: '「どの教科がすき？」ときいているよ',
        replyPattern: 'I like [ANSWER].',
        replyHint: '「理科がすきです」とこたえよう',
        correctWord: 'science',
        options: ['science', 'doctor', 'water', 'tiger'],
        playerSpeech: 'I like science.',
        partnerSpeech: 'What subject do you like?'
    },
    {
        partnerEmoji: '🦉',
        partnerName: 'ホー博士',
        questionText: 'Can you swim?',
        questionHint: '「泳げるかな？」ときいているよ',
        replyPattern: 'Yes, I [ANSWER].',
        replyHint: '「はい、できます」とこたえよう',
        correctWord: 'can',
        options: ['am', 'can', 'like', 'go'],
        playerSpeech: 'Yes, I can.',
        partnerSpeech: 'Can you swim?'
    },
    {
        partnerEmoji: '🦁',
        partnerName: 'レオくん',
        questionText: 'What do you have on Monday?',
        questionHint: '「月曜日には何がある？」ときいているよ',
        replyPattern: 'I have [ANSWER].',
        replyHint: '「英語があります」とこたえよう',
        correctWord: 'English',
        options: ['English', 'Australia', 'apple', 'park'],
        playerSpeech: 'I have English.',
        partnerSpeech: 'What do you have on Monday?'
    },
    {
        partnerEmoji: '🐰',
        partnerName: 'ミミちゃん',
        questionText: 'Where are you from?',
        questionHint: '「どこの出身？」ときいているよ',
        replyPattern: 'I am from [ANSWER].',
        replyHint: '「日本の出身です」とこたえよう',
        correctWord: 'Japan',
        options: ['Japan', 'soccer', 'music', 'teacher'],
        playerSpeech: 'I am from Japan.',
        partnerSpeech: 'Where are you from?'
    }
];

// キャラクター設定
const characters = {
    lion: { emoji: '🦁', name: 'レオくん', welcome: '「英語のぼうけんに出発だ！がおー！」', success: '「きみは英語の天才だね！ぼくもハッピーだよ！」', normal: '「すごいすごい！次もいっしょにがんばろう！」' },
    rabbit: { emoji: '🐰', name: 'ミミちゃん', welcome: '「えいご大好き！いっしょにたくさん遊ぼうね♪」', success: '「きゃー、すごすぎる！パーフェクトだよ！」', normal: '「がんばったね！もっとたくさんの単語を覚えちゃおう！」' },
    owl: { emoji: '🦉', name: 'ホー博士', welcome: '「ふむ、英語の知識を深めよう。準備はよいかな？」', success: '「実に見事な知性じゃ！英語マスターは目の前じゃぞ。」', normal: '「よく勉強しておる。一歩一歩、確実に進むのじゃ。」' }
};

function safeGetStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

function safeSetStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        // 保存できない環境でもゲーム本体は続行します。
    }
}

function getQuestionSet(gameType = currentGameType) {
    if (gameType === 'wordQuiz') return wordQuizQuestions;
    if (gameType === 'wordBuilder') return wordBuilderQuestions;
    if (gameType === 'sentenceTalk') return sentenceTalkQuestions;
    return [];
}

function getQuestionTotal(gameType = currentGameType) {
    return getQuestionSet(gameType).length;
}

function updateQuestionProgress() {
    const total = getQuestionTotal();
    document.querySelectorAll('.current-q-num').forEach(el => el.textContent = currentQuestionIndex + 1);
    document.querySelectorAll('.current-q-total').forEach(el => el.textContent = total);
}

function getBestScore(gameType) {
    const saved = Number(safeGetStorage(STORAGE_KEYS.bestPrefix + gameType));
    return Number.isFinite(saved) ? saved : 0;
}

function saveBestScore(gameType, value) {
    const best = Math.max(getBestScore(gameType), value);
    safeSetStorage(STORAGE_KEYS.bestPrefix + gameType, String(best));
    return best;
}

function updateBestScoreDisplays() {
    Object.entries(gameMeta).forEach(([gameType, meta]) => {
        const el = document.getElementById(meta.bestId);
        if (!el) return;
        el.textContent = `ベスト: ${getBestScore(gameType)}/${getQuestionTotal(gameType)}`;
    });
}

function applySoundButtonState() {
    const icon = document.getElementById('sound-icon');
    const btn = document.getElementById('sound-btn');
    if (!icon || !btn) return;

    if (isSoundEnabled) {
        icon.className = 'fa-solid fa-volume-high text-lg text-emerald-600';
        btn.classList.remove('bg-rose-100');
        btn.classList.add('bg-emerald-100');
    } else {
        icon.className = 'fa-solid fa-volume-xmark text-lg text-rose-600';
        btn.classList.remove('bg-emerald-100');
        btn.classList.add('bg-rose-100');
    }
}

function getResultBadge(scoreValue, total) {
    const ratio = total > 0 ? scoreValue / total : 0;
    if (ratio === 1) {
        return { title: '🏆 English Master', message: '全問正解です。これはもう堂々としていいです。' };
    }
    if (ratio >= 0.8) {
        return { title: '⭐ Great Challenger', message: 'かなり良いペースです。あと少しで満点ですね。' };
    }
    return { title: '🌱 Nice Try', message: '最後までやり切れました。次はベスト更新を狙いましょう。' };
}

function preventDoubleTapZoom() {
    document.addEventListener('touchend', (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    document.addEventListener('dblclick', event => event.preventDefault());
    document.addEventListener('contextmenu', event => event.preventDefault());
}

function initUserGestureTracking() {
    const markInteracted = event => {
        hasUserInteracted = true;
        resetSpeechQueue('first-user-gesture');
        // #region agent log
        debugLog('H7', 'script.js:initUserGestureTracking', 'first user gesture detected', {
            type: event.type,
            currentScreen,
            currentGameType,
            currentQuestionIndex
        });
        // #endregion
    };
    document.addEventListener('pointerdown', markInteracted, { once: true });
    document.addEventListener('keydown', markInteracted, { once: true });
}

function resetSpeechQueue(reason) {
    if (!window.speechSynthesis) return;
    // #region agent log
    debugLog('H7', 'script.js:resetSpeechQueue', 'speech synthesis queue cleared', {
        reason,
        currentScreen,
        currentGameType,
        currentQuestionIndex,
        speakingBefore: window.speechSynthesis.speaking,
        pendingBefore: window.speechSynthesis.pending,
        pausedBefore: window.speechSynthesis.paused
    });
    // #endregion
    window.speechSynthesis.cancel();
}

// --- 画面遷移関数 ---
function showScreen(screenId) {
    // 全ての画面を非表示にする
    const screens = ['start-screen', 'map-screen', 'wordQuiz-screen', 'wordBuilder-screen', 'sentenceTalk-screen', 'result-screen'];
    screens.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.add('hidden');
    });
    // 対象の画面を表示
    const target = document.getElementById(screenId);
    if (target) target.classList.remove('hidden');
    currentScreen = screenId;
}

// --- 音声読み上げ (Text-to-Speech) ---
function playSpeech(text, lang = 'en-US') {
    const speechDebugId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let speechStarted = false;
    let speechFinished = false;
    // #region agent log
    debugLog('H1,H2,H3', 'script.js:playSpeech:entry', 'playSpeech called', {
        speechDebugId,
        text,
        lang,
        isSoundEnabled,
        hasUserInteracted,
        currentScreen,
        currentGameType,
        currentQuestionIndex,
        hasSpeechSynthesis: Boolean(window.speechSynthesis),
        speaking: Boolean(window.speechSynthesis && window.speechSynthesis.speaking),
        pending: Boolean(window.speechSynthesis && window.speechSynthesis.pending),
        paused: Boolean(window.speechSynthesis && window.speechSynthesis.paused)
    });
    // #endregion
    if (!hasUserInteracted) {
        // #region agent log
        debugLog('H7', 'script.js:playSpeech:skip-no-gesture', 'speech skipped before first user gesture', {
            speechDebugId,
            text,
            currentScreen,
            currentGameType,
            currentQuestionIndex
        });
        // #endregion
        return;
    }
    if (!isSoundEnabled) {
        // #region agent log
        debugLog('H1', 'script.js:playSpeech:skip-disabled', 'speech skipped because sound is disabled', {
            speechDebugId,
            text,
            currentScreen,
            currentGameType
        });
        // #endregion
        return;
    }
    // 前の音声を止める
    if (window.speechSynthesis) {
        resetSpeechQueue('before-playSpeech');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.85; // 子供向けに少しゆっくり
        // #region agent log
        utterance.onstart = () => {
            speechStarted = true;
            debugLog('H2,H3,H7', 'script.js:playSpeech:onstart', 'utterance started', {
            speechDebugId,
            text,
            currentScreen,
            currentGameType,
            currentQuestionIndex
        });
        };
        utterance.onend = () => {
            speechFinished = true;
            debugLog('H2,H3,H7', 'script.js:playSpeech:onend', 'utterance ended', {
            speechDebugId,
            text,
            currentScreen,
            currentGameType,
            currentQuestionIndex,
            speaking: Boolean(window.speechSynthesis && window.speechSynthesis.speaking),
            pending: Boolean(window.speechSynthesis && window.speechSynthesis.pending)
        });
        };
        utterance.onerror = event => {
            speechFinished = true;
            debugLog('H2,H7', 'script.js:playSpeech:onerror', 'utterance error', {
            speechDebugId,
            text,
            error: event.error,
            currentScreen,
            currentGameType,
            currentQuestionIndex
        });
        };
        debugLog('H2,H3', 'script.js:playSpeech:before-speak', 'calling speechSynthesis.speak after cancel', {
            speechDebugId,
            text,
            speaking: window.speechSynthesis.speaking,
            pending: window.speechSynthesis.pending,
            paused: window.speechSynthesis.paused
        });
        // #endregion
        window.speechSynthesis.speak(utterance);
        // #region agent log
        debugLog('H2,H3', 'script.js:playSpeech:after-speak', 'speechSynthesis.speak returned', {
            speechDebugId,
            text,
            speaking: window.speechSynthesis.speaking,
            pending: window.speechSynthesis.pending,
            paused: window.speechSynthesis.paused
        });
        window.setTimeout(() => {
            debugLog('H7', 'script.js:playSpeech:watchdog-1200', 'speech watchdog after 1200ms', {
                speechDebugId,
                text,
                speechStarted,
                speechFinished,
                currentScreen,
                currentGameType,
                currentQuestionIndex,
                speaking: Boolean(window.speechSynthesis && window.speechSynthesis.speaking),
                pending: Boolean(window.speechSynthesis && window.speechSynthesis.pending),
                paused: Boolean(window.speechSynthesis && window.speechSynthesis.paused)
            });
        }, 1200);
        // #endregion
    } else {
        // #region agent log
        debugLog('H2', 'script.js:playSpeech:no-api', 'speechSynthesis API is unavailable', {
            text,
            currentScreen,
            currentGameType
        });
        // #endregion
    }
}

function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    safeSetStorage(STORAGE_KEYS.sound, String(isSoundEnabled));
    applySoundButtonState();

    if (isSoundEnabled) {
        playSpeech('Sound On!');
    } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    // #region agent log
    debugLog('H1', 'script.js:toggleSound', 'sound toggled by user action', {
        isSoundEnabled,
        currentScreen,
        currentGameType,
        currentQuestionIndex
    });
    // #endregion
}

// --- キャラクター選択 ---
function selectCharacter(charKey) {
    selectedChar = charKey;
    // スタイル更新
    const cards = ['lion', 'rabbit', 'owl'];
    cards.forEach(key => {
        const card = document.getElementById(`char-${key}`);
        if (key === charKey) {
            card.className = 'char-btn p-3 rounded-2xl border-2 border-indigo-500 bg-indigo-50 transition flex flex-col items-center gap-1 scale-105 shadow-md';
        } else {
            card.className = 'char-btn p-3 rounded-2xl border-2 border-transparent hover:bg-slate-50 transition flex flex-col items-center gap-1';
        }
    });
    playSpeech(characters[charKey].name);
}

function startQuest() {
    // #region agent log
    debugLog('H6', 'script.js:startQuest', 'start quest pressed', {
        currentScreen,
        selectedChar,
        isSoundEnabled,
        speaking: Boolean(window.speechSynthesis && window.speechSynthesis.speaking),
        pending: Boolean(window.speechSynthesis && window.speechSynthesis.pending),
        paused: Boolean(window.speechSynthesis && window.speechSynthesis.paused)
    });
    // #endregion
    cancelPendingTalkSpeech('startQuest');
    // パートナーの情報をマップ画面に反映
    const partner = characters[selectedChar];
    document.getElementById('partner-emoji').textContent = partner.emoji;
    document.getElementById('partner-message').textContent = partner.welcome;
    updateBestScoreDisplays();
    showScreen('map-screen');
    playSpeech("Let's go!");
}

function backToMap() {
    cancelPendingTalkSpeech('backToMap');
    updateBestScoreDisplays();
    showScreen('map-screen');
}

// --- ミニゲーム開始時の分岐 ---
function launchGame(gameType) {
    // #region agent log
    debugLog('H6', 'script.js:launchGame', 'launch game pressed', {
        gameType,
        currentScreen,
        isSoundEnabled,
        speaking: Boolean(window.speechSynthesis && window.speechSynthesis.speaking),
        pending: Boolean(window.speechSynthesis && window.speechSynthesis.pending),
        paused: Boolean(window.speechSynthesis && window.speechSynthesis.paused)
    });
    // #endregion
    cancelPendingTalkSpeech('launchGame');
    currentGameType = gameType;
    currentQuestionIndex = 0;
    score = 0;
    quizStarsEarned = 0;

    if (gameType === 'wordQuiz') {
        initWordQuiz();
    } else if (gameType === 'wordBuilder') {
        initWordBuilder();
    } else if (gameType === 'sentenceTalk') {
        initSentenceTalk();
    }
}

// ==========================================
// ■ ゲーム1: たんごクイズのロジック
// ==========================================
function initWordQuiz() {
    // #region agent log
    debugLog('H6', 'script.js:initWordQuiz', 'word quiz init', {
        currentScreen,
        currentQuestionIndex,
        total: wordQuizQuestions.length
    });
    // #endregion
    showScreen('wordQuiz-screen');
    setupWordQuizQuestion();
}

function setupWordQuizQuestion() {
    const data = wordQuizQuestions[currentQuestionIndex];
    updateQuestionProgress();

    // 表示の更新
    document.getElementById('quiz-emoji').textContent = data.emoji;
    document.getElementById('quiz-hint-japanese').textContent = `「${data.japanese}」はえいごで何という？`;

    // フィードバック画面を隠す
    document.getElementById('quiz-feedback').classList.add('hidden');

    // 4つの選択肢をセット
    const container = document.getElementById('quiz-options-container');
    container.textContent = '';

    // シャッフルした選択肢
    const shuffledOptions = [...data.options].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach(opt => {
        const button = document.createElement('button');
        button.className = 'pop-button p-4 bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-400 rounded-2xl text-xl font-bold text-slate-700 hover:text-indigo-700 transition shadow-sm flex justify-between items-center';

        const label = document.createElement('span');
        label.className = 'tracking-wider';
        label.textContent = opt;
        button.appendChild(label);

        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-volume-high text-sm text-slate-300 group-hover:text-indigo-400';
        button.appendChild(icon);

        button.onclick = () => selectQuizAnswer(opt, button);
        container.appendChild(button);
    });

    // 問題が出たら自動で単語を発音
    setTimeout(() => {
        speakCurrentWord();
    }, 300);
}

function speakCurrentWord() {
    const data = wordQuizQuestions[currentQuestionIndex];
    playSpeech(data.english);
}

function selectQuizAnswer(selectedOpt, buttonElement) {
    const data = wordQuizQuestions[currentQuestionIndex];
    const isCorrect = selectedOpt === data.english;

    // 視覚的エフェクトの付与
    if (isCorrect) {
        buttonElement.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
        score++;
        quizStarsEarned += 2;
        showQuizFeedback(true, '正解！ 素晴らしい！');
    } else {
        buttonElement.classList.add('border-rose-400', 'bg-rose-50', 'text-rose-600');
        // 間違えた場合でも、正解を伝えるフィードバックを表示
        showQuizFeedback(false, `おしい！ こたえは 「${data.english}」 だよ。`);
    }
}

function showQuizFeedback(isCorrect, text) {
    const data = wordQuizQuestions[currentQuestionIndex];
    const fbModal = document.getElementById('quiz-feedback');
    const fbIcon = document.getElementById('feedback-icon');
    const fbTitle = document.getElementById('feedback-title');
    const fbDetail = document.getElementById('feedback-detail');
    const fbWord = document.getElementById('feedback-word');
    const fbMeaning = document.getElementById('feedback-meaning');

    fbIcon.textContent = isCorrect ? '🎉' : '💡';
    fbTitle.textContent = isCorrect ? '正解！ Great job!' : 'どんまい！ Keep going!';
    fbTitle.className = isCorrect ? 'text-3xl font-black text-emerald-600' : 'text-3xl font-black text-amber-500';
    fbDetail.textContent = text;
    fbWord.textContent = data.english;
    fbMeaning.textContent = data.meaning;

    fbModal.classList.remove('hidden');

    if (isCorrect) {
        playSpeech('Perfect!');
    } else {
        playSpeech('Nice try!');
    }
}

function nextQuizQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < wordQuizQuestions.length) {
        setupWordQuizQuestion();
    } else {
        finishGame();
    }
}

// ==========================================
// ■ ゲーム2: スペルならべかえのロジック
// ==========================================
let builderSelectedLetters = []; // 現在選んだアルファベット
let builderCorrectWord = '';

function initWordBuilder() {
    showScreen('wordBuilder-screen');
    setupWordBuilderQuestion();
}

function setupWordBuilderQuestion() {
    const data = wordBuilderQuestions[currentQuestionIndex];
    builderCorrectWord = data.english;
    builderSelectedLetters = [];

    updateQuestionProgress();

    // 表示の更新
    document.getElementById('builder-emoji').textContent = data.emoji;
    document.getElementById('builder-japanese').textContent = data.japanese;
    document.getElementById('builder-feedback').classList.add('hidden');

    // ターゲットスロットの作成 (何文字か分かる空欄)
    const slotsContainer = document.getElementById('builder-slots-container');
    slotsContainer.textContent = '';
    for (let i = 0; i < builderCorrectWord.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'w-12 h-12 md:w-14 md:h-14 border-4 border-dashed border-slate-300 bg-white rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black text-slate-800 shadow-inner';
        slot.id = `builder-slot-${i}`;
        slotsContainer.appendChild(slot);
    }

    // シャッフルされた文字ブロックの作成
    const lettersContainer = document.getElementById('builder-letters-container');
    lettersContainer.textContent = '';
    const letters = builderCorrectWord.split('').sort(() => Math.random() - 0.5);

    letters.forEach(letter => {
        const block = document.createElement('button');
        block.className = 'pop-button w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-pink-400 to-rose-500 text-white hover:brightness-105 rounded-xl font-black text-xl md:text-2xl shadow-md transition transform active:scale-95 flex items-center justify-center';
        block.textContent = letter;
        block.onclick = () => selectBuilderLetter(letter, block);
        lettersContainer.appendChild(block);
    });

    // 単語の音声を発音
    setTimeout(() => {
        speakBuilderWord();
    }, 300);
}

function speakBuilderWord() {
    playSpeech(builderCorrectWord);
}

function selectBuilderLetter(letter, blockElement) {
    // もしすでに全てのスロットが埋まっていたら何もしない
    if (builderSelectedLetters.length >= builderCorrectWord.length) return;

    // 文字を追加
    builderSelectedLetters.push({
        letter: letter,
        element: blockElement
    });

    // 手元のブロックを非活性にする
    blockElement.classList.add('opacity-30', 'pointer-events-none');

    // スロットを更新
    updateBuilderSlots();
}

function updateBuilderSlots() {
    for (let i = 0; i < builderCorrectWord.length; i++) {
        const slot = document.getElementById(`builder-slot-${i}`);
        if (builderSelectedLetters[i]) {
            slot.textContent = builderSelectedLetters[i].letter;
            slot.className = 'w-12 h-12 md:w-14 md:h-14 border-2 border-pink-500 bg-pink-50 text-pink-700 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black shadow-md transform scale-105 transition-all';
        } else {
            slot.textContent = '';
            slot.className = 'w-12 h-12 md:w-14 md:h-14 border-4 border-dashed border-slate-300 bg-white rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black text-slate-800 shadow-inner';
        }
    }
}

function resetBuilder() {
    // 全ての文字の非活性を解除
    builderSelectedLetters.forEach(item => {
        item.element.classList.remove('opacity-30', 'pointer-events-none');
    });
    builderSelectedLetters = [];
    updateBuilderSlots();
}

function checkBuilderAnswer() {
    // 文字数が合っているか確認
    if (builderSelectedLetters.length < builderCorrectWord.length) {
        playSpeech('Oops!');
        return;
    }

    const currentSpelling = builderSelectedLetters.map(i => i.letter).join('');
    const isCorrect = currentSpelling === builderCorrectWord;

    if (isCorrect) {
        score++;
        quizStarsEarned += 2;
        showBuilderFeedback(true);
    } else {
        showBuilderFeedback(false);
    }
}

function showBuilderFeedback(isCorrect) {
    const data = wordBuilderQuestions[currentQuestionIndex];
    const fbModal = document.getElementById('builder-feedback');
    const fbIcon = document.getElementById('builder-feedback-icon');
    const fbTitle = document.getElementById('builder-feedback-title');
    const fbDetail = document.getElementById('builder-feedback-detail');
    const fbWord = document.getElementById('builder-feedback-word');
    const fbMeaning = document.getElementById('builder-feedback-meaning');

    fbIcon.textContent = isCorrect ? '🎉' : '💡';
    fbTitle.textContent = isCorrect ? '正解！ Perfect!' : 'おしい！ Try again!';
    fbTitle.className = isCorrect ? 'text-3xl font-black text-emerald-600' : 'text-3xl font-black text-amber-500';
    fbDetail.textContent = isCorrect ? '正しいスペルで作れたね！素晴らしい！' : `正しいスペルは 「${data.english}」 だよ。`;
    fbWord.textContent = data.english;
    fbMeaning.textContent = `いみ: ${data.meaning}`;

    fbModal.classList.remove('hidden');

    if (isCorrect) {
        playSpeech('Congratulations! ' + data.english);
    } else {
        playSpeech('Good effort! The answer is ' + data.english);
    }
}

function nextBuilderQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < wordBuilderQuestions.length) {
        setupWordBuilderQuestion();
    } else {
        finishGame();
    }
}

// ==========================================
// ■ ゲーム3: おしゃべりトークのロジック
// ==========================================
function initSentenceTalk() {
    showScreen('sentenceTalk-screen');
    setupSentenceTalkQuestion();
}

function setupSentenceTalkQuestion() {
    const data = sentenceTalkQuestions[currentQuestionIndex];

    updateQuestionProgress();

    // パートナーのキャラクター絵文字を変更
    const partnerEmojiEl = document.querySelector('#sentenceTalk-screen .w-12.h-12');
    partnerEmojiEl.textContent = data.partnerEmoji;

    document.getElementById('talk-partner-name').textContent = data.partnerName;
    document.getElementById('talk-question-text').textContent = data.questionText;
    document.getElementById('talk-question-hint').textContent = data.questionHint;

    // プレイヤーアバターの設定
    const playerAvatar = characters[selectedChar];
    document.getElementById('player-avatar-emoji').textContent = playerAvatar.emoji;

    // プレイヤーの解答プレースホルダーをリセット
    const formattedReply = data.replyPattern.replace('[ANSWER]', '<span class="border-b-4 border-amber-500 px-4 text-amber-600 font-black animate-pulse">( ? )</span>');
    document.getElementById('talk-reply-text').innerHTML = formattedReply;
    document.getElementById('talk-reply-hint').textContent = data.replyHint;

    document.getElementById('talk-feedback').classList.add('hidden');

    // 4つの選択肢をセット
    const container = document.getElementById('talk-options-container');
    container.textContent = '';

    const shuffledOptions = [...data.options].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach(opt => {
        const button = document.createElement('button');
        button.className = 'pop-button p-4 bg-white hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-400 rounded-2xl text-xl font-bold text-slate-700 hover:text-amber-700 transition shadow-sm';
        button.textContent = opt;
        button.onclick = () => selectTalkAnswer(opt, button);
        container.appendChild(button);
    });

    // 登場キャラの声を自動再生
    setTimeout(() => {
        speakTalkQuestion();
    }, 300);
}

function speakTalkQuestion() {
    const data = sentenceTalkQuestions[currentQuestionIndex];
    playSpeech(data.partnerSpeech);
}

function selectTalkAnswer(selectedOpt, buttonElement) {
    const data = sentenceTalkQuestions[currentQuestionIndex];
    const isCorrect = selectedOpt === data.correctWord;

    if (isCorrect) {
        buttonElement.className = 'pop-button p-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-700 rounded-2xl text-xl font-bold transition shadow-md';
        score++;
        quizStarsEarned += 2;
        showTalkFeedback(true);
    } else {
        buttonElement.className = 'pop-button p-4 bg-rose-50 border-2 border-rose-400 text-rose-600 rounded-2xl text-xl font-bold transition shadow-md';
        showTalkFeedback(false);
    }
}

function showTalkFeedback(isCorrect) {
    const data = sentenceTalkQuestions[currentQuestionIndex];
    const fbModal = document.getElementById('talk-feedback');
    const fbIcon = document.getElementById('talk-feedback-icon');
    const fbTitle = document.getElementById('talk-feedback-title');

    fbIcon.textContent = isCorrect ? '🎉' : '💡';
    fbTitle.textContent = isCorrect ? 'せいかい！ Perfect!' : 'おしい！ Try again!';
    fbTitle.className = isCorrect ? 'text-3xl font-black text-emerald-600' : 'text-3xl font-black text-amber-500';

    // 会話サマリーの構築
    document.getElementById('summary-partner').textContent = data.partnerEmoji;
    document.getElementById('summary-q').textContent = data.questionText;
    document.getElementById('summary-player').textContent = characters[selectedChar].emoji;

    const fullAnswerSentence = data.replyPattern.replace('[ANSWER]', data.correctWord);
    document.getElementById('summary-a').textContent = fullAnswerSentence;

    fbModal.classList.remove('hidden');

    if (isCorrect) {
        playSpeech('Great conversation!');
        cancelPendingTalkSpeech('showTalkFeedback');
        const scheduledQuestionIndex = currentQuestionIndex;
        const scheduledSequence = ++talkSpeechSequence;
        talkSpeechTimerId = window.setTimeout(() => {
            if (
                scheduledSequence !== talkSpeechSequence ||
                currentQuestionIndex !== scheduledQuestionIndex ||
                currentGameType !== 'sentenceTalk' ||
                currentScreen !== 'sentenceTalk-screen'
            ) {
                // #region agent log
                debugLog('H4', 'script.js:showTalkFeedback:stale-conversation-skip', 'stale delayed conversation speech skipped', {
                    scheduledSequence,
                    talkSpeechSequence,
                    scheduledQuestionIndex,
                    currentQuestionIndex,
                    currentGameType,
                    currentScreen
                });
                // #endregion
                return;
            }
            speakFullConversation(scheduledQuestionIndex, scheduledSequence);
        }, 1200);
    } else {
        playSpeech('Nice try!');
    }
}

function cancelPendingTalkSpeech(reason) {
    talkSpeechSequence++;
    if (talkSpeechTimerId !== null) {
        window.clearTimeout(talkSpeechTimerId);
        talkSpeechTimerId = null;
        // #region agent log
        debugLog('H4', 'script.js:cancelPendingTalkSpeech', 'pending delayed conversation speech cleared', {
            reason,
            talkSpeechSequence,
            currentQuestionIndex,
            currentScreen,
            currentGameType
        });
        // #endregion
    }
}

function speakFullConversation(questionIndex = currentQuestionIndex, sequence = talkSpeechSequence) {
    const data = sentenceTalkQuestions[questionIndex];
    if (!data) return;
    // #region agent log
    debugLog('H4', 'script.js:speakFullConversation:start', 'full conversation speech started', {
        currentQuestionIndex,
        questionIndex,
        sequence,
        partnerSpeech: data.partnerSpeech,
        playerSpeech: data.playerSpeech
    });
    // #endregion
    // 相手の発言を言ってからプレイヤーの発言を言う
    playSpeech(data.partnerSpeech);
    setTimeout(() => {
        if (
            sequence !== talkSpeechSequence ||
            currentQuestionIndex !== questionIndex ||
            currentGameType !== 'sentenceTalk' ||
            currentScreen !== 'sentenceTalk-screen'
        ) {
            // #region agent log
            debugLog('H4', 'script.js:speakFullConversation:stale-player-skip', 'stale delayed player speech skipped', {
                sequence,
                talkSpeechSequence,
                questionIndex,
                currentQuestionIndex,
                currentScreen,
                currentGameType
            });
            // #endregion
            return;
        }
        // #region agent log
        debugLog('H4', 'script.js:speakFullConversation:delayed-player', 'delayed player speech firing', {
            currentQuestionIndex,
            questionIndex,
            sequence,
            playerSpeech: data.playerSpeech,
            currentScreen,
            currentGameType
        });
        // #endregion
        playSpeech(data.playerSpeech);
    }, 1800);
}

function nextTalkQuestion() {
    cancelPendingTalkSpeech('nextTalkQuestion');
    currentQuestionIndex++;
    if (currentQuestionIndex < sentenceTalkQuestions.length) {
        setupSentenceTalkQuestion();
    } else {
        finishGame();
    }
}

// ==========================================
// ■ ゲーム終了・リザルト
// ==========================================
function finishGame() {
    cancelPendingTalkSpeech('finishGame');
    const total = getQuestionTotal();
    const badge = getResultBadge(score, total);

    // スターの獲得をグローバルに加算
    globalStars += quizStarsEarned;
    safeSetStorage(STORAGE_KEYS.stars, String(globalStars));
    document.getElementById('global-stars').textContent = globalStars;

    // ベストスコアを保存
    saveBestScore(currentGameType, score);
    updateBestScoreDisplays();

    // リザルトにスコアを表示
    document.getElementById('result-correct').textContent = score;
    document.getElementById('result-total').textContent = total;
    document.getElementById('result-stars').textContent = quizStarsEarned;
    document.getElementById('result-badge').textContent = badge.title;
    document.getElementById('result-badge-message').textContent = badge.message;

    // キャラクターからの褒めメッセージ
    const partner = characters[selectedChar];
    let msg = '';
    if (score === total) {
        msg = partner.success;
        playSpeech('You are super! You got a perfect score!');
    } else {
        msg = partner.normal;
        playSpeech('Great job! You finished the game!');
    }
    document.getElementById('result-partner-message').textContent = msg;

    showScreen('result-screen');
}

function loadSavedState() {
    const savedStars = Number(safeGetStorage(STORAGE_KEYS.stars));
    globalStars = Number.isFinite(savedStars) ? savedStars : 0;
    document.getElementById('global-stars').textContent = globalStars;

    const savedSound = safeGetStorage(STORAGE_KEYS.sound);
    isSoundEnabled = savedSound === null ? true : savedSound === 'true';
    applySoundButtonState();
    updateBestScoreDisplays();
    // #region agent log
    debugLog('H1', 'script.js:loadSavedState', 'saved sound state loaded', {
        savedSound,
        isSoundEnabled,
        globalStars
    });
    // #endregion
}

// 初期ロード
window.onload = function() {
    preventDoubleTapZoom();
    initUserGestureTracking();
    loadSavedState();
    selectCharacter('lion');
};

// #region agent log
document.addEventListener('visibilitychange', () => {
    debugLog('H5', 'script.js:visibilitychange', 'document visibility changed', {
        visibilityState: document.visibilityState,
        currentScreen,
        currentGameType,
        currentQuestionIndex,
        isSoundEnabled,
        speaking: Boolean(window.speechSynthesis && window.speechSynthesis.speaking),
        pending: Boolean(window.speechSynthesis && window.speechSynthesis.pending),
        paused: Boolean(window.speechSynthesis && window.speechSynthesis.paused)
    });
    if (document.visibilityState === 'hidden') {
        resetSpeechQueue('visibility-hidden');
    }
});
window.addEventListener('pagehide', () => resetSpeechQueue('pagehide'));
// #endregion
