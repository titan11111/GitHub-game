// ============================================================
//  config.js — 数値の一元管理
//  時刻はすべて「その日の 0:00 からの分」で持つ（index.tsx の arrive_min と同じ単位）
// ============================================================

export const CONFIG = {
  // ---- 時間 ----
  START_MIN: 6 * 60 + 30,   // 06:30 起床
  DEADLINE_MIN: 9 * 60,     // 09:00 出社期限
  LIMIT_MIN: 10 * 60,       // 10:00 ここまで来たら強制終了（遅刻確定）
  SEC_PER_MIN: 2.2,         // 実時間 2.2秒 = ゲーム内1分（6:30→9:00 で約5分30秒）

  // ---- プレイヤー ----
  WALK: 4.0,
  RUN: 7.6,
  ACCEL: 26,
  FRICTION: 14,
  JUMP: 7.2,
  GRAVITY: 20,
  PLAYER_R: 0.42,

  // ---- カメラ ----
  CAM_BACK: 7.2,
  CAM_UP: 4.4,
  CAM_LERP: 0.10,

  // ---- 調べる ----
  REACH: 2.3,

  // ---- 得点 ----
  SCORE: {
    ALARM: 50,          // 目覚ましを止めた
    DRESS: 80,          // 着替えた
    BAG: 120,           // 鞄を取った
    BREAKFAST: 150,     // 朝食
    COFFEE: 120,        // コーヒーミニゲーム成功
    CAT: 90,            // 猫をなでた
    PIGEON: 140,        // 鳩を追い払った
    ONIGIRI: 110,       // コンビニでおにぎり
    TETRIS_LINE: 40,    // テトリス1ライン
    TRAIN: 200,         // 電車に乗った
    STAND: 60,          // 立って耐えた
    ARRIVE: 800,        // 出社成功
    PER_MIN_EARLY: 12,  // 9:00 までの余裕1分あたり
    LATE_PENALTY: 25,   // 遅刻1分あたり
  },

  // ---- 時間消費（ゲーム内分） ----
  COST: {
    ALARM: 2,
    DRESS: 6,
    BREAKFAST: 12,
    COFFEE: 8,
    BAG: 1,
    CAT: 5,
    PIGEON: 3,
    ONIGIRI: 7,
    GATE: 1,
    BOARD: 3,
    RIDE: 22,          // 乗車時間
    ELEVATOR: 4,
    STAIRS: 9,
    GREET: 1,
  },

  // ---- localStorage（鉄則: tg.<番号>.<key>） ----
  LS: {
    MUTE: 'tg.272.mute',
    BEST: 'tg.272.best',
    RESULTS: 'tg.272.results',
    RUNS: 'tg.272.runs',
  },

  // ---- ランク境界（スコア） ----
  RANK: [
    { min: 2200, rank: 'S' },
    { min: 1700, rank: 'A' },
    { min: 1200, rank: 'B' },
    { min: 700, rank: 'C' },
    { min: 0, rank: 'D' },
  ],

  ENDING_LABEL: {
    clear: '★出社成功',
    late: '遅刻',
    sick: '仮病',
    missstop: '乗り過ごし',
    tetris: 'テトリス',
  },
}

export function rankOf(score) {
  for (const r of CONFIG.RANK) if (score >= r.min) return r.rank
  return 'D'
}
