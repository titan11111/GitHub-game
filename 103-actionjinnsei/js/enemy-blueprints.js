// 敵ブループリント拡充（7ステージ × 3タイプ = 21種）

(function registerEnemyBlueprints() {
  const body = (fill, stroke) => ({
    d: 'M4 10 Q15 4 26 10 L24 28 Q15 32 6 28 Z',
    fill, stroke: stroke || '#333', strokeWidth: 1,
    gradient: [{ offset: 0, color: fill }, { offset: 1, color: stroke || fill }]
  });
  const head = () => ({
    d: 'M8 0 Q15 -4 22 0 L20 12 Q15 16 10 12 Z',
    fill: '#FFE4B5', gradient: [{ offset: 0, color: '#FFF5E6' }, { offset: 1, color: '#E8C9A0' }], gradientType: 'radial', gradR: 10
  });
  const eyes = () => ({ d: 'M11 4 L13 6 L11 6 Z M17 4 L19 6 L17 6 Z', fill: '#222' });

  const extras = {
    '2_normal': { parts: [body('#FF4500', '#CC2200'), head(), eyes(), { d: 'M8 2 L22 2 L20 6 L10 6 Z', fill: '#FF6347' }] },
    '2_jumping': { parts: [body('#FFB6C1'), head(), eyes(), { d: 'M6 18 L12 18 L10 26 L6 26 Z M18 18 L24 18 L22 26 L18 26 Z', fill: '#FFF', stroke: '#CCC' }] },
    '2_zigzag': { parts: [body('#696969'), head(), eyes(), { d: 'M6 2 L24 2 L22 8 L8 8 Z', fill: '#8B4513' }, { d: 'M-2 12 L0 32 L2 12 Z', fill: '#654321' }] },

    '3_normal': { parts: [body('#4B0082', '#2F0050'), head(), { d: 'M10 4 L12 6 L10 6 Z M18 4 L20 6 L18 6 Z', fill: '#FFD700' }] },
    '3_flying': { parts: [body('#2F2F2F'), head(), eyes(), { d: 'M0 14 L8 14 L8 22 L0 22 Z M22 14 L30 14 L30 22 L22 22 Z', fill: '#1C1C1C' }, { d: 'M8 6 L22 6 L20 12 L10 12 Z', fill: '#000' }] },
    '3_bouncing': { parts: [body('#4169E1'), head(), eyes(), { d: 'M-4 24 L34 24 L32 28 L-2 28 Z', fill: '#333' }, { d: 'M8 28 A8 8 0 1 1 22 28', fill: 'none', stroke: '#111', strokeWidth: 2 }] },

    '4_normal': { parts: [body('#8B4513', '#5C2E0A'), head(), eyes(), { d: 'M8 12 L22 12 L20 20 L10 20 Z', fill: '#FF0000' }] },
    '4_fast': { parts: [body('#FF4500', '#CC0000'), head(), { d: 'M9 5 L11 3 L13 5 Z M17 5 L19 3 L21 5 Z', fill: '#000' }, { d: 'M12 14 L18 14 L16 18 L14 18 Z', fill: '#FF0000' }] },
    '4_tracking': { parts: [body('#333'), head(), eyes(), { d: 'M0 20 L34 20 L30 26 L4 26 Z', fill: '#111' }, { d: 'M6 26 A10 10 0 1 1 26 26', fill: '#000', stroke: '#444', strokeWidth: 2 }] },

    '5_normal': { parts: [body('#2F2F2F', '#1a1a1a'), head(), eyes(), { d: 'M8 2 L22 2 L20 7 L10 7 Z', fill: '#1C1C1C' }] },
    '5_zigzag': { parts: [body('#4169E1'), head(), eyes(), { d: 'M0 18 L36 18 L32 26 L4 26 Z', fill: '#1a3a7a' }, { d: 'M8 10 L28 10 L26 16 L10 16 Z', fill: '#87CEEB', stroke: '#FFF' }] },
    '5_fast': { parts: [body('#FF4500'), head(), eyes(), { d: 'M0 14 L40 14 L36 24 L4 24 Z', fill: '#CC3300' }, { d: 'M34 20 L38 20 L38 24 L34 24 Z', fill: '#FFD700' }] },

    '6_normal': { parts: [body('#1C1C1C'), head(), { d: 'M8 6 L22 6 L20 14 L10 14 Z', fill: '#000' }] },
    '6_tracking': { parts: [body('#FF0000'), head(), eyes(), { d: 'M2 16 L6 26 L10 16 Z M12 10 L16 26 L20 10 Z M22 18 L26 26 L30 18 Z', fill: '#00CC00' }] },
    '6_bouncing': { parts: [body('#00FF00', '#00AA00'), head(), { d: 'M6 4 Q15 0 24 4 Q20 12 15 14 Q10 12 6 4', fill: '#32CD32' }, eyes()] },

    '7_normal': { parts: [body('#8B0000', '#5A0000'), head(), { d: 'M10 12 L20 12 L18 18 L12 18 Z', fill: '#000' }] },
    '7_flying': { parts: [body('#696969'), head(), eyes(), { d: 'M-6 10 L6 18 L6 10 Z M24 10 L36 18 L36 10 Z', fill: '#4B0082' }, { d: 'M8 2 L16 -2 L24 2 Z', fill: '#2F2F2F' }] },
    '7_tracking': { parts: [body('#00FF00', '#00AA00'), head(), { d: 'M8 6 L22 6 L20 14 L10 14 Z', fill: '#FFFF00' }, { d: 'M11 8 L13 10 L11 10 Z M17 8 L19 10 L17 10 Z', fill: '#000' }] }
  };

  Object.keys(extras).forEach(k => { extras[k].shadow = true; });
  Object.assign(ENEMY_BLUEPRINTS, extras);

  [1, 2, 3, 4, 5, 6, 7].forEach(n => {
    if (BOSS_BLUEPRINTS[n]) BOSS_BLUEPRINTS[n].shadow = true;
  });
})();
