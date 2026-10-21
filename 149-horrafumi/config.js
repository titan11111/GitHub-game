/* Horrafumi 3D — 定数のみ（const / Math は使用可。代入はしない） */
const HORROR_CELL = 2.2,
  HORROR_WALL_H = 3.4,
  HORROR_EYE_Y = 1.55,
  HORROR_MOVE_SPEED = 3.2,
  HORROR_MONSTER_SPEED = 2.45,
  HORROR_CATCH_R = 0.85,
  HORROR_EXIT_R = 1.1,
  HORROR_PLAYER_R = 0.28,
  HORROR_MOUSE_SENS = 0.0022,
  HORROR_TOUCH_SENS = 0.0055;

const HORROR_MONSTER_TEX = '372e80c8-9b12-4788-8b9b-8ce87b713ca6.png';

const HORROR_MAP = [
  '################',
  '#S.....#.......#',
  '#.###..#..####.#',
  '#.....##.....#.#',
  '###.#....##..#.#',
  '#...#.M...#..#.#',
  '#.###.###.#..#.#',
  '#...........#..#',
  '#..####....E...#',
  '################',
];

const HorrorKey = { MUTE: 'horrafumi_mute_v1' };
