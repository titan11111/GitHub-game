export const SPELLS = {
  fire1:     { name: 'ファイア',  mp: 5,  power: 14, element: 'fire',    target: 'enemy', scope: 'single' },
  fire2:     { name: 'ファイラ',  mp: 12, power: 28, element: 'fire',    target: 'enemy', scope: 'single' },
  fire3:     { name: 'ファイガ',  mp: 24, power: 52, element: 'fire',    target: 'enemy', scope: 'all'    },
  blizzard1: { name: 'ブリザド', mp: 5,  power: 14, element: 'ice',     target: 'enemy', scope: 'single' },
  blizzard2: { name: 'ブリザラ', mp: 12, power: 28, element: 'ice',     target: 'enemy', scope: 'single' },
  blizzard3: { name: 'ブリザガ', mp: 24, power: 52, element: 'ice',     target: 'enemy', scope: 'all'    },
  thunder1:  { name: 'サンダー', mp: 5,  power: 14, element: 'thunder', target: 'enemy', scope: 'single' },
  thunder2:  { name: 'サンダラ', mp: 12, power: 28, element: 'thunder', target: 'enemy', scope: 'single' },
  thunder3:  { name: 'サンダガ', mp: 24, power: 52, element: 'thunder', target: 'enemy', scope: 'all'    },
  cure1:     { name: 'ケアル',   mp: 5,  power: 30, element: null,      target: 'ally',  scope: 'single' },
  cure2:     { name: 'ケアルラ', mp: 12, power: 70, element: null,      target: 'ally',  scope: 'single' },
  cure3:     { name: 'ケアルガ', mp: 24, power: 120,element: null,      target: 'ally',  scope: 'all'    },
  esna:      { name: 'エスナ',   mp: 8,  power: 0,  element: null,      target: 'ally',  scope: 'single', effect: 'esna'  },
  raise:     { name: 'レイズ',   mp: 20, power: 0,  element: null,      target: 'ally',  scope: 'single', effect: 'raise' },
};

export const JOB_SPELLS = {
  warrior: [],
  white:   ['cure1', 'cure2', 'cure3', 'esna', 'raise'],
  black:   ['fire1', 'fire2', 'fire3', 'blizzard1', 'blizzard2', 'blizzard3', 'thunder1', 'thunder2', 'thunder3'],
  thief:   [],
};
