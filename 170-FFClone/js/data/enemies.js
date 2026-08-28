export const ENEMY_DEF = {
  slime:    { name: 'スライム',    hp: 30,  mp: 0,  atk: 8,  def: 4,  mag: 0,  mdf: 4,  spd: 8,  exp: 10, ap: 3,  gold: 5,  weak: ['fire', 'thunder'] },
  goblin:   { name: 'ゴブリン',   hp: 55,  mp: 10, atk: 12, def: 6,  mag: 4,  mdf: 5,  spd: 10, exp: 20, ap: 5,  gold: 12, weak: [] },
  orc:      { name: 'オーク',     hp: 90,  mp: 0,  atk: 18, def: 10, mag: 0,  mdf: 6,  spd: 7,  exp: 40, ap: 8,  gold: 20, weak: [] },
  sandworm: { name: 'サンドワーム', hp: 120, mp: 20, atk: 22, def: 8,  mag: 12, mdf: 8,  spd: 9,  exp: 60, ap: 12, gold: 30, weak: ['ice'] },
  icewolf:  { name: 'アイスウルフ', hp: 70,  mp: 0,  atk: 15, def: 8,  mag: 8,  mdf: 10, spd: 13, exp: 35, ap: 7,  gold: 18, weak: ['fire'] },
};

// TILE type → enemy group [[id, count], ...]
const GROUPS = {
  0: [['slime', 2], ['goblin', 1]],    // GRASS
  1: [['goblin', 2], ['orc', 1]],      // FOREST
  2: [['orc', 2], ['slime', 1]],       // MOUNTAIN
  8: [['sandworm', 1], ['goblin', 2]], // DESERT
  9: [['icewolf', 2]],                  // SNOW
};

export function buildEnemyGroup(tileType) {
  const group = GROUPS[tileType] ?? GROUPS[0];
  const result = [];
  for (const [id, count] of group) {
    const d = ENEMY_DEF[id];
    for (let i = 0; i < count; i++) {
      result.push({
        id, name: d.name,
        hp: d.hp, currentHp: d.hp,
        mp: d.mp, currentMp: d.mp,
        atk: d.atk, def: d.def, mag: d.mag, mdf: d.mdf, spd: d.spd,
        exp: d.exp, ap: d.ap, gold: d.gold,
        weak: d.weak ?? [],
        atbGauge: Math.random() * 30,
        defending: false,
        uid: `${id}_${i}`,
      });
    }
  }
  return result;
}
