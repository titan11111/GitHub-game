// 障害物チャンク設計（WarmUp → Flow → SkillCheck → Pressure → Breather → PreBoss）

const OBSTACLE_PHASES = ['WarmUp', 'Flow', 'SkillCheck', 'Pressure', 'Breather'];

const STAGE_CHUNK_WIDTHS = {
  1: [420, 520, 480, 520, 380],
  2: [450, 540, 500, 560, 400],
  3: [480, 560, 520, 580, 420],
  4: [500, 580, 540, 600, 440],
  5: [520, 600, 560, 620, 460],
  6: [540, 620, 580, 640, 480],
  7: [560, 640, 600, 660, 500]
};

function patternJitter(seed) {
  return (seededRandom(seed) - 0.5) * CONFIG.OBSTACLE.patternJitter * 2;
}

function obsY(groundY, elev, h) {
  return groundY - elev;
}

function makeObstacle(type, x, groundY, stageNum, spec) {
  const h = spec.h || 20;
  const w = spec.w || 60;
  const elev = spec.elev != null ? spec.elev : h;
  const y = spec.y != null ? spec.y : obsY(groundY, elev, h);
  const ox = x + patternJitter(x + stageNum * 100 + (spec.seed || 0));
  return new Obstacle(ox, y, w, h, type, stageNum);
}

function getWarmUpElements(stageNum, groundY) {
  const s = stageNum;
  if (s === 1) return [
    { type: 'platform', x: 0, elev: 45, w: 75 },
    { type: 'spike', x: 110, elev: 20, w: 35 },
    { type: 'platform', x: 200, elev: 60, w: 85 }
  ];
  if (s === 2) return [
    { type: 'platform', x: 0, elev: 40, w: 70 },
    { type: 'movingPlatform', x: 130, elev: 50, w: 65 },
    { type: 'platform', x: 280, elev: 45, w: 80 }
  ];
  if (s === 3) return [
    { type: 'platform', x: 0, elev: 42, w: 72 },
    { type: 'spike', x: 120, elev: 20, w: 38 },
    { type: 'platform', x: 220, elev: 55, w: 88 }
  ];
  if (s === 4) return [
    { type: 'platform', x: 0, elev: 40, w: 68 },
    { type: 'jumpPad', x: 110, elev: 20, w: 42 },
    { type: 'platform', x: 210, elev: 70, w: 75 }
  ];
  if (s >= 5) return [
    { type: 'platform', x: 0, elev: 42, w: 70 },
    { type: 'platform', x: 140, elev: 48, w: 75 },
    { type: 'spike', x: 260, elev: 20, w: 36 }
  ];
  return [];
}

function getFlowElements(stageNum, groundY) {
  const items = [];
  const step = stageNum <= 2 ? 130 : 120;
  const count = stageNum >= 6 ? 5 : 4;
  for (let i = 0; i < count; i++) {
    const bx = i * step;
    if (i % 2 === 0) {
      items.push({ type: 'platform', x: bx, elev: 40 + (i % 3) * 15, w: 60 + i * 5 });
    } else {
      items.push({ type: stageNum >= 3 ? 'spike' : 'spike', x: bx, elev: 20, w: 32 + (i % 2) * 8 });
    }
  }
  if (stageNum >= 2 && stageNum <= 4) {
    items.push({ type: 'pendulum', x: step * count, elev: 80, w: 50, h: 50, y: groundY - 130 });
  }
  return items;
}

function getSkillCheckElements(stageNum, groundY) {
  const jh = CONFIG.OBSTACLE.jumpPlatformHeight;
  if (stageNum === 1) {
    return [
      { type: 'crumblingPlatform', x: 0, elev: 50, w: 70 },
      { type: 'spike', x: 100, elev: 20, w: 40 },
      { type: 'platform', x: 180, elev: 65, w: 80 },
      { type: 'crumblingPlatform', x: 300, elev: 45, w: 65 }
    ];
  }
  if (stageNum === 2) {
    return [
      { type: 'movingPlatform', x: 0, elev: 55, w: 60 },
      { type: 'pendulum', x: 120, elev: 90, w: 50, h: 50, y: groundY - 140 },
      { type: 'crumblingPlatform', x: 240, elev: 50, w: 70 }
    ];
  }
  if (stageNum === 3) {
    return [
      { type: 'fallingRock', x: 80, y: -40, w: 32, h: 32 },
      { type: 'crumblingPlatform', x: 0, elev: 48, w: 68 },
      { type: 'spike', x: 160, elev: 20, w: 42 },
      { type: 'platform', x: 250, elev: 60, w: 82 }
    ];
  }
  if (stageNum === 4) {
    return [
      { type: 'jumpPad', x: 0, elev: 20, w: 44 },
      { type: 'crumblingPlatform', x: 90, elev: jh, w: 72 },
      { type: 'movingPlatform', x: 210, elev: 55, w: 62 },
      { type: 'pendulum', x: 330, elev: 95, w: 50, h: 50, y: groundY - 150 }
    ];
  }
  if (stageNum === 5) {
    return [
      { type: 'crumblingPlatform', x: 0, elev: 52, w: 70 },
      { type: 'electric', x: 110, y: 110, w: 22, h: 180 },
      { type: 'hammer', x: 260, elev: 60, w: 50, h: 18, y: groundY - 140 }
    ];
  }
  if (stageNum === 6) {
    return [
      { type: 'jumpPad', x: 0, elev: 20, w: 44 },
      { type: 'crumblingPlatform', x: 80, elev: jh, w: 74 },
      { type: 'electric', x: 200, y: 100, w: 20, h: 200 },
      { type: 'movingPlatform', x: 320, elev: 58, w: 64 }
    ];
  }
  return [
    { type: 'lava', x: 0, elev: 20, w: 90 },
    { type: 'crumblingPlatform', x: 120, elev: jh, w: 76 },
    { type: 'laser', x: 260, y: 130, w: 20, h: 170 },
    { type: 'platform', x: 380, elev: 62, w: 85 }
  ];
}

function getPressureElements(stageNum, groundY) {
  const items = [];
  if (stageNum <= 2) {
    items.push(
      { type: 'spike', x: 0, elev: 20, w: 38 },
      { type: 'movingPlatform', x: 90, elev: 52, w: 58 },
      { type: 'spike', x: 190, elev: 20, w: 42 },
      { type: 'crumblingPlatform', x: 280, elev: 48, w: 68 }
    );
    if (stageNum === 2) {
      items.push({ type: 'pendulum', x: 390, elev: 85, w: 50, h: 50, y: groundY - 135 });
    }
  } else if (stageNum <= 4) {
    items.push(
      { type: 'spike', x: 0, elev: 20, w: 40 },
      { type: 'jumpPad', x: 80, elev: 20, w: 42 },
      { type: 'crumblingPlatform', x: 170, elev: CONFIG.OBSTACLE.jumpPlatformHeight, w: 70 },
      { type: 'spike', x: 290, elev: 20, w: 44 }
    );
    if (stageNum === 3) {
      items.push({ type: 'fallingRock', x: 380, y: -50, w: 34, h: 34 });
    }
    if (stageNum === 4) {
      items.push({ type: 'pendulum', x: 380, elev: 100, w: 52, h: 52, y: groundY - 155 });
    }
  } else if (stageNum <= 6) {
    items.push(
      { type: 'electric', x: 0, y: 105, w: 20, h: 190 },
      { type: 'crumblingPlatform', x: 100, elev: 55, w: 72 },
      { type: 'hammer', x: 220, elev: 58, w: 52, h: 20, y: groundY - 145 },
      { type: 'movingPlatform', x: 340, elev: 54, w: 66 }
    );
    if (stageNum === 6) {
      items.push({ type: 'laser', x: 450, y: 125, w: 18, h: 165 });
    }
  } else {
    items.push(
      { type: 'lava', x: 0, elev: 20, w: 95 },
      { type: 'laser', x: 130, y: 140, w: 20, h: 160 },
      { type: 'crumblingPlatform', x: 250, elev: CONFIG.OBSTACLE.jumpPlatformHeight, w: 78 },
      { type: 'pendulum', x: 380, elev: 105, w: 52, h: 52, y: groundY - 160 }
    );
  }
  return items;
}

function getBreatherElements(stageNum) {
  return [
    { type: 'platform', x: 0, elev: 38, w: 90 },
    { type: 'platform', x: 140, elev: 42, w: 100 },
    { type: 'platform', x: 290, elev: 36, w: 85 }
  ];
}

function getPhaseElements(phase, stageNum, groundY) {
  switch (phase) {
    case 'WarmUp': return getWarmUpElements(stageNum, groundY);
    case 'Flow': return getFlowElements(stageNum, groundY);
    case 'SkillCheck': return getSkillCheckElements(stageNum, groundY);
    case 'Pressure': return getPressureElements(stageNum, groundY);
    case 'Breather': return getBreatherElements(stageNum);
    default: return [];
  }
}

function getThemeHazards(stageNum, baseX, groundY) {
  if (stageNum === 1) {
    return [
      makeObstacle('randoseru', baseX + 90, groundY, stageNum, { w: 34, h: 24, elev: 24 }),
      makeObstacle('puddle', baseX + 210, groundY, stageNum, { w: 70, h: 10, elev: 10 }),
      makeObstacle('crow', baseX + 320, groundY, stageNum, { w: 36, h: 24, y: groundY - 130 })
    ];
  }
  if (stageNum === 2) {
    return [
      makeObstacle('bicycle', baseX + 110, groundY, stageNum, { w: 66, h: 30, elev: 30 }),
      makeObstacle('clubBall', baseX + 240, groundY, stageNum, { w: 26, h: 26, elev: 26 })
    ];
  }
  if (stageNum === 3) {
    return [
      makeObstacle('book', baseX + 130, groundY, stageNum, { w: 34, h: 26, y: groundY - 150 }),
      makeObstacle('disciplineWall', baseX + 280, groundY, stageNum, { w: 26, h: 70, elev: 70 })
    ];
  }
  if (stageNum === 4) {
    return [
      makeObstacle('paperBundle', baseX + 140, groundY, stageNum, { w: 40, h: 22, y: groundY - 135 }),
      makeObstacle('can', baseX + 300, groundY, stageNum, { w: 24, h: 18, elev: 18 })
    ];
  }
  if (stageNum === 5) {
    return [
      makeObstacle('copyPaper', baseX + 120, groundY, stageNum, { w: 36, h: 22, y: groundY - 140 }),
      makeObstacle('namecard', baseX + 280, groundY, stageNum, { w: 34, h: 20, y: groundY - 120 })
    ];
  }
  if (stageNum === 6) {
    return [
      makeObstacle('coffeeCup', baseX + 120, groundY, stageNum, { w: 26, h: 24, elev: 24 }),
      makeObstacle('crowd', baseX + 250, groundY, stageNum, { w: 58, h: 40, elev: 40 })
    ];
  }
  return [
    makeObstacle('magicFlame', baseX + 120, groundY, stageNum, { w: 46, h: 24, elev: 24 }),
    makeObstacle('floatingRock', baseX + 280, groundY, stageNum, { w: 42, h: 26, y: groundY - 150 })
  ];
}

function placeChunk(obstacles, baseX, phase, stageNum, groundY) {
  const elements = getPhaseElements(phase, stageNum, groundY);
  elements.forEach(spec => {
    obstacles.push(makeObstacle(spec.type, baseX + spec.x, groundY, stageNum, spec));
  });
  if (phase === 'Flow' || phase === 'Pressure') {
    const themed = getThemeHazards(stageNum, baseX, groundY);
    themed.forEach(obs => obstacles.push(obs));
  }
}

function placeElements(obstacles, baseX, stageNum, groundY, elements) {
  elements.forEach(spec => {
    obstacles.push(makeObstacle(spec.type, baseX + spec.x, groundY, stageNum, spec));
  });
}

function generateRebuiltStageObstacles(stageNum) {
  const groundY = CONFIG.PHYSICS.groundY;
  const stageLen = getStageLength(stageNum);
  const safeEnd = stageLen - CONFIG.OBSTACLE.bossClearZone;
  let cursor = 260;

  const zoneBuilder = {
    1: [
      {
        width: 900,
        elements: [
          { type: 'platform', x: 20, elev: 42, w: 90 },
          { type: 'randoseru', x: 180, elev: 24, w: 32, h: 24 },
          { type: 'puddle', x: 290, elev: 10, w: 78, h: 10 },
          { type: 'platform', x: 460, elev: 52, w: 80 },
          { type: 'crow', x: 640, y: groundY - 130, w: 34, h: 22 }
        ]
      },
      {
        width: 1100,
        elements: [
          { type: 'platform', x: 40, elev: 44, w: 80 },
          { type: 'spike', x: 170, elev: 20, w: 40 },
          { type: 'jumpPad', x: 255, elev: 20, w: 42 },
          { type: 'platform', x: 320, elev: 120, w: 76 },
          { type: 'platform', x: 430, elev: 62, w: 86 },
          { type: 'puddle', x: 610, elev: 10, w: 72, h: 10 },
          { type: 'platform', x: 760, elev: 48, w: 78 },
          { type: 'randoseru', x: 900, elev: 24, w: 32, h: 24 }
        ]
      },
      {
        width: 1200,
        elements: [
          { type: 'movingPlatform', x: 10, elev: 54, w: 62 },
          { type: 'spike', x: 120, elev: 20, w: 42 },
          { type: 'crow', x: 250, y: groundY - 150, w: 38, h: 24 },
          { type: 'platform', x: 360, elev: 116, w: 74 },
          { type: 'crumblingPlatform', x: 510, elev: 55, w: 70 },
          { type: 'spike', x: 640, elev: 20, w: 46 },
          { type: 'platform', x: 760, elev: 63, w: 84 },
          { type: 'crow', x: 940, y: groundY - 135, w: 34, h: 24 }
        ]
      }
    ],
    2: [
      {
        width: 980,
        elements: [
          { type: 'platform', x: 20, elev: 40, w: 88 },
          { type: 'bicycle', x: 160, elev: 30, w: 68, h: 30 },
          { type: 'clubBall', x: 300, elev: 26, w: 24, h: 24 },
          { type: 'platform', x: 430, elev: 50, w: 82 },
          { type: 'movingPlatform', x: 590, elev: 60, w: 64 }
        ]
      },
      {
        width: 1200,
        elements: [
          { type: 'platform', x: 20, elev: 42, w: 80 },
          { type: 'pendulum', x: 145, elev: 90, w: 50, h: 50, y: groundY - 140 },
          { type: 'jumpPad', x: 250, elev: 20, w: 44 },
          { type: 'platform', x: 320, elev: 130, w: 80 },
          { type: 'bicycle', x: 500, elev: 30, w: 68, h: 30 },
          { type: 'spike', x: 670, elev: 20, w: 40 },
          { type: 'clubBall', x: 820, elev: 26, w: 24, h: 24 },
          { type: 'platform', x: 980, elev: 56, w: 88 }
        ]
      },
      {
        width: 1300,
        elements: [
          { type: 'movingPlatform', x: 10, elev: 60, w: 64 },
          { type: 'spike', x: 120, elev: 20, w: 42 },
          { type: 'pendulum', x: 250, elev: 95, w: 52, h: 52, y: groundY - 150 },
          { type: 'platform', x: 390, elev: 120, w: 78 },
          { type: 'clubBall', x: 550, elev: 26, w: 24, h: 24 },
          { type: 'spike', x: 700, elev: 20, w: 44 },
          { type: 'bicycle', x: 850, elev: 30, w: 68, h: 30 },
          { type: 'platform', x: 1040, elev: 62, w: 86 }
        ]
      }
    ],
    3: [
      {
        width: 1050,
        elements: [
          { type: 'platform', x: 30, elev: 42, w: 90 },
          { type: 'book', x: 190, y: groundY - 150, w: 34, h: 24 },
          { type: 'disciplineWall', x: 330, elev: 70, w: 24, h: 70 },
          { type: 'platform', x: 450, elev: 56, w: 84 },
          { type: 'fallingRock', x: 640, y: -48, w: 34, h: 34 }
        ]
      },
      {
        width: 1300,
        elements: [
          { type: 'platform', x: 20, elev: 46, w: 82 },
          { type: 'spike', x: 150, elev: 20, w: 42 },
          { type: 'jumpPad', x: 230, elev: 20, w: 44 },
          { type: 'platform', x: 300, elev: 130, w: 78 },
          { type: 'book', x: 460, y: groundY - 145, w: 34, h: 24 },
          { type: 'disciplineWall', x: 620, elev: 74, w: 24, h: 74 },
          { type: 'platform', x: 760, elev: 58, w: 84 },
          { type: 'fallingRock', x: 940, y: -50, w: 34, h: 34 },
          { type: 'platform', x: 1060, elev: 54, w: 84 }
        ]
      },
      {
        width: 1450,
        elements: [
          { type: 'movingPlatform', x: 20, elev: 62, w: 64 },
          { type: 'spike', x: 140, elev: 20, w: 44 },
          { type: 'disciplineWall', x: 280, elev: 72, w: 24, h: 72 },
          { type: 'book', x: 400, y: groundY - 150, w: 34, h: 24 },
          { type: 'crumblingPlatform', x: 540, elev: 60, w: 72 },
          { type: 'spike', x: 690, elev: 20, w: 46 },
          { type: 'fallingRock', x: 850, y: -54, w: 34, h: 34 },
          { type: 'platform', x: 980, elev: 64, w: 86 },
          { type: 'book', x: 1140, y: groundY - 140, w: 34, h: 24 }
        ]
      }
    ]
  };

  const zones = zoneBuilder[stageNum] || [];
  zones.forEach((zone, idx) => {
    if (cursor >= safeEnd) return;
    placeElements(obstacles, cursor, stageNum, groundY, zone.elements);
    if (idx === 0) {
      // 導入から中盤の間に一度だけ安全地帯を作る
      cursor += zone.width + 180;
    } else {
      cursor += zone.width + 140;
    }
  });
}

function generateObstaclesFromPatterns(stageNum) {
  if (stageNum <= 3) {
    generateRebuiltStageObstacles(stageNum);
    return;
  }

  const groundY = CONFIG.PHYSICS.groundY;
  const stageLen = getStageLength(stageNum);
  const maxX = stageLen - CONFIG.OBSTACLE.bossClearZone;
  const widths = STAGE_CHUNK_WIDTHS[stageNum] || STAGE_CHUNK_WIDTHS[1];
  let cursor = 280;

  OBSTACLE_PHASES.forEach((phase, i) => {
    if (cursor >= maxX) return;
    placeChunk(obstacles, cursor, phase, stageNum, groundY);
    const gap = CONFIG.OBSTACLE.minGap + Math.floor(seededRandom(cursor + stageNum) * 40);
    cursor += widths[i] + gap;
  });
}
