// ゲーム設定・定数管理

const CONFIG = {
  // Canvas設定
  CANVAS: {
    width: 800,
    height: 450
  },

  // パフォーマンス設定
  PERFORMANCE: {
    mobileFPS: 60,
    desktopFPS: 60,
    maxFrameSkip: 2,
    mobileMaxFrameSkip: 3
  },

  // BGM設定
  AUDIO: {
    bgmVolume: 0.7 // 70%音量
  },

  // キャラクター共通スケール（200%）
  CHARACTER: {
    scale: 2.0,
    playerBaseW: 36,
    playerBaseH: 48,
    enemyBaseW: 30,
    enemyBaseH: 30,
    bossBaseW: 100,
    bossBaseH: 100,
    drawAnchor: 30,
    visualGroundOffset: 10,
    enemyGroundOffset: 18,
    enemyAirOffset: 8,
    bossGroundOffset: 18
  },

  // プレイヤー設定
  PLAYER: {
    initialX: 100,
    initialY: 254,
    width: 72,
    height: 96,
    speed: 5,
    jumpPower: 12,
    maxHp: 100,
    initialHp: 100,
    invincibleDuration: 60, // 無敵時間（フレーム）
    maxAttackLevel: 5 // 最大攻撃レベル（0-5）
  },

  // 物理設定
  PHYSICS: {
    gravity: 0.5,
    groundY: 350,
    coyoteFrames: 8,
    jumpBufferFrames: 10,
    variableJumpCut: 0.55,
    acceleration: 0.85,
    friction: 0.78,
    maxSpeed: 6,
    airControl: 0.45,
    cameraLerp: 0.12
  },

  // ステージ設定
  STAGE: {
    defaultLength: 4000,
    longStageLength: 6000, // ステージ6,7の長さ
    longStageStart: 6 // このステージから長いステージ
  },

  // オメガビーム設定
  OMEGA_BEAM: {
    initialCharges: 3,
    chargeDuration: 3000, // ミリ秒
    activeDuration: 120, // フレーム
    damageInterval: 10, // ダメージを与える間隔（フレーム）
    enemyDamage: 5,
    bossDamage: 10
  },

  // カメラ設定
  CAMERA: {
    offsetX: 240
  },

  OBSTACLE: {
    patternJitter: 30,
    minGap: 120,
    bossClearZone: 200,
    crumbleDuration: 180,
    jumpPlatformHeight: 120
  },

  // 敵生成設定
  ENEMY_SPAWN: {
    interval: 60, // デフォルト生成間隔（フレーム）
    maxCount: 8, // デフォルト最大同時出現数
    spawnXOffset: 850, // カメラからの生成位置オフセット
    stageSettings: {
      1: { interval: 75, maxCount: 5 },
      2: { interval: 75, maxCount: 5 },
      3: { interval: 65, maxCount: 6 },
      4: { interval: 65, maxCount: 6 },
      5: { interval: 55, maxCount: 8 },
      6: { interval: 55, maxCount: 8 },
      7: { interval: 45, maxCount: 10 }
    }
  },

  // 攻撃設定
  ATTACK: {
    cooldown: 15 // 攻撃クールダウン（フレーム）
  },

  // ジャンプパッド設定
  JUMP_PAD: {
    power: 18 // ジャンプパワー
  },

  // ゲーム設定
  GAME: {
    scorePerLevel: 500 // 攻撃レベルが上がるスコア間隔
  },

  // 弾設定
  PROJECTILE: {
    light: {
      speed: 8,
      width: 12,
      height: 12,
      damage: 5,
      cooldown: 15
    },
    fire: {
      speed: 10,
      width: 16,
      height: 16,
      damage: 8,
      cooldown: 12
    },
    exploding: {
      speedX: 6,
      speedY: -8,
      gravity: 0.3,
      width: 20,
      height: 20,
      damage: 15,
      cooldown: 20
    },
    axe: {
      speedX: 7,
      speedY: -10,
      gravity: 0.4,
      width: 24,
      height: 24,
      damage: 25,
      maxPierce: 3,
      cooldown: 25
    },
    pierce: {
      speed: 12,
      width: 14,
      height: 14,
      damage: 10,
      maxPierce: 5,
      cooldown: 15
    },
    beam: {
      speed: 15,
      width: 18,
      height: 18,
      damage: 12,
      maxPierce: 10,
      cooldown: 8
    }
  },

  NEGOTIATION: {
    healOnSuccess: 40,
    fallbackSuccessRate: 0.35,
    introFrames: 75
  }
};

// ステージ定義
const STAGES = [
  { name: '小学生', bg: '#87CEEB', ground: '#90EE90', boss: '学級委員' },
  { name: '中学生', bg: '#F4A460', ground: '#8B7355', boss: '先輩' },
  { name: '高校生', bg: '#2F4F7F', ground: '#696969', boss: '番長' },
  { name: '大学生', bg: '#4B0082', ground: '#708090', boss: '教授' },
  { name: '新社会人', bg: '#1C1C1C', ground: '#A9A9A9', boss: '上司' },
  { name: 'サラリーマン', bg: '#000000', ground: '#696969', boss: '部長' },
  { name: '勇者', bg: '#8B0000', ground: '#2F4F4F', boss: '魔王' }
];

const NEGOTIATION_DIALOGS = {
  1: {
    boss: '学級委員',
    line: '廊下は走らないって言ったよね？',
    hint: '素直な態度が通じそうです。',
    choices: ['走ってない', 'ごめんなさい', '先生に言う！'],
    correctIndex: 1
  },
  2: {
    boss: '先輩',
    line: 'おい、挨拶は？',
    hint: 'まずは礼儀を示すのが近道です。',
    choices: ['チッ', 'お疲れ様です！', 'なんですか？'],
    correctIndex: 1
  },
  3: {
    boss: '番長',
    line: '俺の縄張りに入ったな。',
    hint: '衝突より対話を選ぶと道が開きます。',
    choices: ['勝負しろ', '道を間違えました', '話し合いましょう'],
    correctIndex: 2
  },
  4: {
    boss: '教授',
    line: 'レポートは出したか？',
    hint: '事実を丁寧に伝える選択が有効です。',
    choices: ['明日出します', '出しました！', '何のことですか？'],
    correctIndex: 1
  },
  5: {
    boss: '上司',
    line: 'まだ帰るのか？',
    hint: '配慮を示しつつ落としどころを作るべきです。',
    choices: ['仕事は終わりました', 'すみません残ります', '有給です'],
    correctIndex: 0
  },
  6: {
    boss: '部長',
    line: 'お前の将来、俺が決めてやろうか。',
    hint: '主導権は静かに取り返してください。',
    choices: ['お願いします', '自分で決めます', '考えます'],
    correctIndex: 1
  },
  7: {
    boss: '魔王',
    line: '勇者よ、何故戦う？',
    hint: '戦いの動機より、旅の目的を語るほうが刺さります。',
    choices: ['世界を守るため', '帰りたいから', 'あなたを倒すため'],
    correctIndex: 1
  }
};

// ステージ長さを取得する関数
function getStageLength(stageNum) {
  if (stageNum >= CONFIG.STAGE.longStageStart) {
    return CONFIG.STAGE.longStageLength;
  }
  return CONFIG.STAGE.defaultLength;
}
