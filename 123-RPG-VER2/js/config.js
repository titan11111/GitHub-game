/* ============================================
   定数定義
   ============================================ */
const TILE = {
    WALL: 1,
    ENEMY: 2,
    CASTLE: 3,
    BOSS: 4,
    ALLY_DOG: 5,
    ALLY_BIRD: 6,
    ALLY_MONKEY: 7,
    SHOP: 8,
    EMPTY: 0,
    PLAIN: 10,
    FOREST: 11,
    LAVA: 12,
    MOUNTAIN: 13,
    TREASURE_GOLD: 14,
    NPC: 15,
    DOOR: 16,
    TREASURE_KEY: 17,
    TREASURE_OPENED: 19,
    WASTELAND: 20,
    DESERT: 21,
    RUINS: 22,
    GHOST: 23,
    MOMO: 24,
    VILLAGE_ENTRANCE: 25,
    GOLDEN_CAT: 26,
    SEA: 27,   // 南国フィールドの海（進入不可）
    PALM: 28,  // 南国フィールドのヤシの木🌴（上を通れる）
    BRIDGE: 29, // 南国・浜と村を繋ぐ橋（歩行可）
    BEACH: 30,  // 🏖️（上を通れる）
    HIBISCUS: 31, // 🌺（上を通れる）
    COCONUT: 32,  // 🥥（上を通れる）
    MANGO: 33,    // 🥭（上を通れる）
    COFFIN: 34,   // ⚰️（上を通れる）
    COBWEB: 35,   // 🕸️（上を通れる）
    CANDLE: 36,   // 🕯️（上を通れる）
    WATER_SPIRIT: 37,  // 水の精霊（話すと戦闘）
    FOREST_WITCH: 38   // 森の魔女（魔物の森の強敵・話すと戦闘）
};

const MAP_SIZE = {
    WIDTH: 10,
    HEIGHT: 10,
    MAX_X: 9,
    MAX_Y: 9
};

const BATTLE = {
    TURN_DELAY: 800,
    BGM_START_DELAY_MS: 50,      // 戦闘BGM再生までの待機（停止確実化）
    BATTLE_START_ANIMATION_MS: 1000,
    ESCAPE_SUCCESS_RATE: 0.5,
    ENCOUNTER_RATE: 0.15,
    DAMAGE_VARIANCE: 10,
    DEFENSE_REDUCTION: 5,
    CRITICAL_RATE: 0.1,        // クリティカル発生率（10%）
    CRITICAL_MULTIPLIER: 1.5   // クリティカルダメージ倍率
};

/** 戦闘コマンドの表示ラベル（data-command → 表示文言） */
const COMMAND_LABELS = {
    attack: 'たたかう',
    magic: 'まほう',
    item: 'アイテム',
    escape: 'にげる'
};

/** BGM要素がないときのフォールバック先（id → 代替id） */
const BGM_FALLBACK_MAP = {
    'bgm-lastboss': 'bgm-boss',
    'bgm-boss': 'bgm-battle',
    'bgm-catgod': 'bgm-boss',
    'bgm-ending': 'bgm-title',
    'bgm-town': 'bgm-field'  // ポチの村のBGMが読み込めない場合のフォールバック
};

/** 画面・音声まわりの遅延（ms） */
const TIMING = {
    AUDIO_UNLOCK_RETRY_MS: 100,
    TITLE_BGM_BEFORE_PROLOGUE_MS: 500,
    PROLOGUE_BGM_AFTER_SCREEN_MS: 150,
    AUDIO_PLAY_DELAY_MS: 200,
    AUDIO_RETRY_MS: 300,
    LEVEL_UP_ANIMATION_MS: 2500,
    ESCAPE_RESULT_MS: 1000,
    NO_MAGIC_HIDE_MS: 1000
};

// 経験値テーブル（成長曲線）
// レベルNに到達するために必要な累積経験値
const EXP_TABLE = [
    0,      // レベル1（開始時）
    100,    // レベル2
    250,    // レベル3
    450,    // レベル4
    700,    // レベル5
    1000,   // レベル6
    1350,   // レベル7
    1750,   // レベル8
    2200,   // レベル9
    2700,   // レベル10
    3250,   // レベル11
    3850,   // レベル12
    4500,   // レベル13
    5200,   // レベル14
    5950,   // レベル15
    6750,   // レベル16
    7600,   // レベル17
    8500,   // レベル18
    9450,   // レベル19
    10450,  // レベル20
    11500,  // レベル21
    12600,  // レベル22
    13750,  // レベル23
    14950,  // レベル24
    16200,  // レベル25
    17500,  // レベル26
    18850,  // レベル27
    20250,  // レベル28
    21700,  // レベル29
    23200,  // レベル30
    24750,  // レベル31
    26350,  // レベル32
    28000,  // レベル33
    29700,  // レベル34
    31450,  // レベル35
    33250,  // レベル36
    35100,  // レベル37
    37000,  // レベル38
    38950,  // レベル39
    40950,  // レベル40
    43000,  // レベル41
    45100,  // レベル42
    47250,  // レベル43
    49450,  // レベル44
    51700,  // レベル45
    54000,  // レベル46
    56350,  // レベル47
    58750,  // レベル48
    61200,  // レベル49
    63700   // レベル50
];

// 経験値テーブルから必要な経験値を取得する関数
function getRequiredExp(level) {
    if (level < 1) return 0;
    if (level > EXP_TABLE.length) {
        // レベル50以降は指数関数的に増加
        const baseExp = EXP_TABLE[EXP_TABLE.length - 1];
        const levelDiff = level - EXP_TABLE.length;
        return baseExp + (levelDiff * levelDiff * 500);
    }
    return EXP_TABLE[level - 1];
}

const LEVEL_UP = {
    ATK_BONUS: 10,
    HP_BONUS: 20,
    MGC_BONUS: 5,  // 魔法力の成長
    MP_BONUS: 5    // MPの成長（既にui.jsで実装済み）
};

/** 仲間（犬・猿・きじ）のレベルアップ時の成長量（主人公より控えめにして主人公を主役に） */
const ALLY_LEVEL_UP = {
    ATK_BONUS: 3,
    HP_BONUS: 8
};

const MAGIC = {
    BASE_DAMAGE_MULTIPLIER: 1.5,  // 魔法力に対するダメージ倍率
    MIN_DAMAGE_MULTIPLIER: 0.8,   // 最小ダメージ倍率（魔法力が低い場合の保証）
    MAX_DAMAGE_MULTIPLIER: 1.2    // 最大ダメージ倍率（ランダム要素）
};

const TREASURE = {
    GOLD_AMOUNT: 100
};

const IMAGE_EXTENSIONS = ['.jpg', '.png'];
