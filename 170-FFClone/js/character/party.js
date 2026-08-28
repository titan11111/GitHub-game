export const party = {
  gold: 500,
  items: [],
  members: [
    { name: 'バッツ',   job: 'warrior', hp: 120, maxHp: 120, mp: 30, maxMp: 30,  atk: 18, def: 12, mag: 8,  mdf: 8,  spd: 10, level: 1, exp: 0, ap: 0 },
    { name: 'レナ',     job: 'white',   hp: 80,  maxHp: 80,  mp: 60, maxMp: 60,  atk: 8,  def: 8,  mag: 16, mdf: 14, spd: 10, level: 1, exp: 0, ap: 0 },
    { name: 'ガラフ',   job: 'black',   hp: 80,  maxHp: 80,  mp: 50, maxMp: 50,  atk: 8,  def: 8,  mag: 18, mdf: 10, spd: 9,  level: 1, exp: 0, ap: 0 },
    { name: 'ファリス', job: 'thief',   hp: 90,  maxHp: 90,  mp: 20, maxMp: 20,  atk: 12, def: 10, mag: 10, mdf: 10, spd: 14, level: 1, exp: 0, ap: 0 },
  ],
};

export function restoreAll() {
  for (const m of party.members) { m.hp = m.maxHp; m.mp = m.maxMp; }
}

export function addItem(itemId) {
  const existing = party.items.find(i => i.id === itemId);
  if (existing) existing.count++;
  else party.items.push({ id: itemId, count: 1 });
}

export function addExpAp(exp, ap) {
  let leveledUp = false;
  for (const m of party.members) {
    if (m.hp <= 0) continue;
    m.exp += exp;
    m.ap  += ap;
    if (_checkLevelUp(m)) leveledUp = true;
  }
  return leveledUp;
}

function _checkLevelUp(m) {
  if (m.exp < m.level * 100) return false;
  m.level++;
  m.maxHp += 15; m.hp = m.maxHp;
  m.maxMp += 5;  m.mp = Math.min(m.mp + 5, m.maxMp);
  m.atk += 2; m.def += 1; m.mag += 2; m.mdf += 1;
  return true;
}
