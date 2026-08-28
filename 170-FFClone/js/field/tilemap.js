import { ctx, LOGICAL_W, LOGICAL_H } from '../engine/canvas.js';

export const TILE = {
  GRASS: 0, FOREST: 1, MOUNTAIN: 2, SEA: 3,
  WATER: 4, BRIDGE: 5, TOWN: 6, CAVE: 7, DESERT: 8, SNOW: 9
};

export const TILE_SIZE = 32;
export const MAP_W = 75;
export const MAP_H = 75;

const TILE_BG = [
  '#5a9a42',  // GRASS
  '#1b3e18',  // FOREST
  '#6b5a4a',  // MOUNTAIN
  '#0b2c5c',  // SEA
  '#1a5282',  // WATER
  '#a07840',  // BRIDGE
  '#5a9a42',  // TOWN (草地ベース)
  '#2a1a1a',  // CAVE
  '#d4a84e',  // DESERT
  '#c4d8ea',  // SNOW
];

// Encounter rates (chance per step, 0 = safe)
const ENCOUNTER_RATE = [0.06, 0.09, 0.10, 0, 0, 0, 0, 0, 0.07, 0.05];

// Can player walk on this tile?
const WALKABLE = [true, true, false, false, false, true, true, true, true, true];

export let map = [];

// Fixed special locations
const SPECIALS = [
  { x: 37, y: 37, tile: TILE.TOWN },   // 開始村
  { x: 24, y: 24, tile: TILE.TOWN },   // 港町
  { x: 48, y: 28, tile: TILE.TOWN },   // 砂漠の街
  { x: 15, y: 55, tile: TILE.TOWN },   // 雪の村
  { x: 58, y: 56, tile: TILE.CAVE },   // 洞窟
  { x: 62, y: 18, tile: TILE.TOWN },   // 東の街
];

export const START_X = 37;
export const START_Y = 38;  // 開始村の1マス下

function seededRng(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return () => {
    h ^= h << 13; h ^= h >> 17; h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

export function generateMap() {
  const rng = seededRng('170-FFClone-World-V1');
  const WEIGHTS = [
    [TILE.GRASS, 35], [TILE.FOREST, 18], [TILE.SEA, 14],
    [TILE.MOUNTAIN, 12], [TILE.WATER, 5], [TILE.DESERT, 8],
    [TILE.SNOW, 4], [TILE.BRIDGE, 1]
  ];
  const total = WEIGHTS.reduce((s, [, w]) => s + w, 0);

  map = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => {
      let r = rng() * total;
      for (const [t, w] of WEIGHTS) { r -= w; if (r <= 0) return t; }
      return TILE.GRASS;
    })
  );

  // セルオートマトン平滑化（2パス）
  for (let pass = 0; pass < 2; pass++) {
    const next = map.map(r => [...r]);
    for (let y = 1; y < MAP_H - 1; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        const cnt = {};
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const t = map[y + dy][x + dx];
          cnt[t] = (cnt[t] || 0) + 1;
        }
        next[y][x] = +Object.keys(cnt).reduce((a, b) => cnt[a] > cnt[b] ? a : b);
      }
    }
    map = next;
  }

  // 特殊地点を配置（周囲の海を草に変換して確実に歩けるようにする）
  for (const sp of SPECIALS) {
    if (sp.x < 1 || sp.x >= MAP_W - 1 || sp.y < 1 || sp.y >= MAP_H - 1) continue;
    map[sp.y][sp.x] = sp.tile;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (dx === 0 && dy === 0) continue;
      const ny = sp.y + dy, nx = sp.x + dx;
      if (ny >= 0 && ny < MAP_H && nx >= 0 && nx < MAP_W) {
        if (map[ny][nx] === TILE.SEA || map[ny][nx] === TILE.MOUNTAIN || map[ny][nx] === TILE.WATER) {
          map[ny][nx] = TILE.GRASS;
        }
      }
    }
  }

  // 外周を海で囲む
  for (let x = 0; x < MAP_W; x++) { map[0][x] = TILE.SEA; map[MAP_H - 1][x] = TILE.SEA; }
  for (let y = 0; y < MAP_H; y++) { map[y][0] = TILE.SEA; map[y][MAP_W - 1] = TILE.SEA; }
}

export function getTile(x, y) {
  if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return TILE.SEA;
  return map[y]?.[x] ?? TILE.SEA;
}

export function isWalkable(x, y) {
  return WALKABLE[getTile(x, y)] ?? false;
}

export function getEncounterRate(tile) {
  return ENCOUNTER_RATE[tile] ?? 0;
}

export function getSpecialAt(x, y) {
  return SPECIALS.find(s => s.x === x && s.y === y) ?? null;
}

export function drawTilemap(camX, camY) {
  const startCol = Math.floor(camX / TILE_SIZE);
  const startRow = Math.floor(camY / TILE_SIZE);
  const endCol = Math.min(MAP_W - 1, startCol + Math.ceil(LOGICAL_W / TILE_SIZE) + 1);
  const endRow = Math.min(MAP_H - 1, startRow + Math.ceil(LOGICAL_H / TILE_SIZE) + 1);
  const offX = -(camX % TILE_SIZE);
  const offY = -(camY % TILE_SIZE);

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const tile = map[row]?.[col] ?? TILE.SEA;
      const px = offX + (col - startCol) * TILE_SIZE;
      const py = offY + (row - startRow) * TILE_SIZE;
      ctx.fillStyle = TILE_BG[tile];
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      _drawDetail(tile, px, py, col, row);
    }
  }
}

// タイル座標から決定論的なバラつき値を得る（アニメなし・軽量）
function _tv(col, row, mod = 8) {
  return ((col * 13 + row * 17 + col ^ row * 3) >>> 0) % mod;
}

function _drawDetail(tile, px, py, col, row) {
  const cx = px + TILE_SIZE / 2;
  const cy = py + TILE_SIZE / 2;
  const v  = _tv(col, row);      // 0-7 のバラつき値
  const S  = TILE_SIZE;

  switch (tile) {

    // ── 草原 ──────────────────────────────────────────────────
    case TILE.GRASS: {
      // タイルごとに微妙に色が違う草の模様
      const shades = ['#4a8a38','#528e40','#468636','#4e8c3c'];
      ctx.fillStyle = shades[v & 3];
      // 短い草の束 2〜3 か所
      const positions = [[cx-8,cy+4],[cx+4,cy-3],[cx-2,cy-6],[cx+8,cy+2]];
      for (let i = 0; i < 2 + (v & 1); i++) {
        const [bx, by] = positions[(v + i) & 3];
        ctx.fillRect(bx - 1, by - 3, 2, 5);
        ctx.fillRect(bx + 2, by - 4, 2, 4);
        ctx.fillRect(bx - 3, by - 2, 2, 4);
      }
      break;
    }

    // ── 森 ────────────────────────────────────────────────────
    case TILE.FOREST: {
      // タイルによって 1 本大木 or 2 本構成
      const twoTree = (v & 1) === 0;

      if (twoTree) {
        // --- 左の木 ---
        // 影
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(cx - 7, cy + 10, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
        // 幹
        ctx.fillStyle = '#5a3210';
        ctx.fillRect(cx - 9, cy + 4, 4, 8);
        // 葉（暗→中→明の3層）
        ctx.fillStyle = '#14390e'; ctx.beginPath(); ctx.arc(cx - 7, cy + 4, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#245a1a'; ctx.beginPath(); ctx.arc(cx - 7, cy + 1, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#38803a'; ctx.beginPath(); ctx.arc(cx - 7, cy - 2, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#50a045'; ctx.beginPath(); ctx.arc(cx - 9, cy - 4, 3, 0, Math.PI * 2); ctx.fill();

        // --- 右の小木 ---
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(cx + 6, cy + 9, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a3210'; ctx.fillRect(cx + 4, cy + 3, 3, 7);
        ctx.fillStyle = '#14390e'; ctx.beginPath(); ctx.arc(cx + 6, cy + 3, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#245a1a'; ctx.beginPath(); ctx.arc(cx + 6, cy,     5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#50a045'; ctx.beginPath(); ctx.arc(cx + 4, cy - 3, 2, 0, Math.PI * 2); ctx.fill();
      } else {
        // --- 中央1本の大木 ---
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(cx, cy + 11, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a3210'; ctx.fillRect(cx - 2, cy + 5, 5, 9);
        ctx.fillStyle = '#143a0c'; ctx.beginPath(); ctx.arc(cx, cy + 4, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1e5a18'; ctx.beginPath(); ctx.arc(cx, cy,     10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2e7828'; ctx.beginPath(); ctx.arc(cx + 1, cy - 4, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#48a042'; ctx.beginPath(); ctx.arc(cx - 2, cy - 7, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#68c055'; ctx.beginPath(); ctx.arc(cx - 3, cy - 9, 2, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }

    // ── 山 ────────────────────────────────────────────────────
    case TILE.MOUNTAIN: {
      const hasPeak2 = (v & 3) > 1; // 一部タイルに二峰

      if (hasPeak2) {
        // 後ろの小峰（奥の山）
        ctx.fillStyle = '#4a4035';
        ctx.beginPath();
        ctx.moveTo(cx + 6, py + 8); ctx.lineTo(px + S - 3, cy + 8); ctx.lineTo(cx + 2, cy + 8);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#6a5a48';
        ctx.beginPath();
        ctx.moveTo(cx + 6, py + 8); ctx.lineTo(px + S - 3, cy + 8); ctx.lineTo(cx + 10, cy + 8);
        ctx.closePath(); ctx.fill();
        // 雪（小）
        ctx.fillStyle = '#e8f0f8';
        ctx.beginPath();
        ctx.moveTo(cx + 6, py + 8); ctx.lineTo(cx + 10, py + 14); ctx.lineTo(cx + 2, py + 14);
        ctx.closePath(); ctx.fill();
      }

      // 岩肌ベース
      ctx.fillStyle = '#3e3028';
      ctx.fillRect(px + 2, cy + 4, S - 4, py + S - cy - 6);

      // メイン峰・影側（左）
      ctx.fillStyle = '#4a4035';
      ctx.beginPath();
      ctx.moveTo(cx - 2, py + 3); ctx.lineTo(cx + 10, cy + 6); ctx.lineTo(px + 3, cy + 6);
      ctx.closePath(); ctx.fill();

      // メイン峰・光側（右）
      ctx.fillStyle = '#7a6850';
      ctx.beginPath();
      ctx.moveTo(cx - 2, py + 3); ctx.lineTo(px + S - 3, cy + 6); ctx.lineTo(cx + 10, cy + 6);
      ctx.closePath(); ctx.fill();

      // 岩肌テクスチャ（少し明るい線）
      ctx.strokeStyle = 'rgba(180,160,130,0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 2; i++) {
        const ry = cy + 2 + i * 5;
        ctx.beginPath(); ctx.moveTo(px + 5 + i * 3, ry); ctx.lineTo(cx - 3, ry - 2); ctx.stroke();
      }

      // 雪（山頂）
      ctx.fillStyle = '#eef4fc';
      ctx.beginPath();
      ctx.moveTo(cx - 2, py + 3);
      ctx.lineTo(cx + 7, py + 11);
      ctx.lineTo(cx - 2, py + 14);
      ctx.lineTo(cx - 10, py + 11);
      ctx.closePath(); ctx.fill();
      // 雪の影
      ctx.fillStyle = 'rgba(100,130,180,0.3)';
      ctx.beginPath();
      ctx.moveTo(cx - 2, py + 3); ctx.lineTo(cx - 2, py + 14); ctx.lineTo(cx - 10, py + 11);
      ctx.closePath(); ctx.fill();
      break;
    }

    // ── 海 ────────────────────────────────────────────────────
    case TILE.SEA: {
      // 深海グラデーション（上が暗め）
      const grad = ctx.createLinearGradient(px, py, px, py + S);
      grad.addColorStop(0, 'rgba(0,20,60,0.5)');
      grad.addColorStop(1, 'rgba(0,40,100,0.2)');
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, S, S);

      // 波の白い稜線（タイルごとにオフセット）
      const wo = (v * 4) % S;
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        const wy = py + 6 + i * 10 + (v % 4);
        const wx = px + ((wo + i * 8) % S) - 4;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.bezierCurveTo(wx + 5, wy - 3, wx + 9, wy - 3, wx + 14, wy);
        ctx.stroke();
      }

      // 光の反射（キラキラ）
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      const sparks = [(v + 1) % S, (v * 3 + 7) % S];
      for (const sx of sparks) {
        ctx.beginPath();
        ctx.arc(px + sx % (S - 4) + 2, py + (sx * 2) % (S - 4) + 2, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // ── 川・湖水 ──────────────────────────────────────────────
    case TILE.WATER: {
      // 浅い水の明るめグラデーション
      const wg = ctx.createLinearGradient(px, py, px + S, py + S);
      wg.addColorStop(0, 'rgba(40,120,200,0.3)');
      wg.addColorStop(1, 'rgba(20,80,160,0.15)');
      ctx.fillStyle = wg;
      ctx.fillRect(px, py, S, S);

      // 流れ：斜めの波線
      ctx.strokeStyle = 'rgba(180,220,255,0.35)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const ox = (v * 5 + i * 10) % S;
        const oy = (v * 3 + i * 9) % S;
        ctx.beginPath();
        ctx.moveTo(px + ox % (S - 8), py + oy % (S - 4));
        ctx.quadraticCurveTo(
          px + ox % (S - 8) + 6, py + oy % (S - 4) - 2,
          px + ox % (S - 8) + 12, py + oy % (S - 4) + 1
        );
        ctx.stroke();
      }

      // 水面の反射点
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(px + 5 + v * 3 % (S - 10), py + 4 + v * 2 % (S - 10), 1.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    // ── 砂漠 ──────────────────────────────────────────────────
    case TILE.DESERT: {
      // 砂丘の陰影
      ctx.fillStyle = 'rgba(180,120,30,0.3)';
      ctx.beginPath();
      ctx.moveTo(px, cy + 4 + v);
      ctx.quadraticCurveTo(cx - 4, cy - 2, cx + 10, cy + 2);
      ctx.quadraticCurveTo(cx + 16, cy + 5, px + S, cy + 6 + v);
      ctx.lineTo(px + S, py + S); ctx.lineTo(px, py + S);
      ctx.closePath(); ctx.fill();

      // 砂丘の明るい稜線
      ctx.strokeStyle = 'rgba(255,220,120,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px + 2, cy + 4 + v);
      ctx.quadraticCurveTo(cx - 2, cy - 3, cx + 10, cy + 1);
      ctx.quadraticCurveTo(cx + 16, cy + 4, px + S - 2, cy + 5 + v);
      ctx.stroke();

      // サボテン（3タイルに1本）
      if (v % 3 === 0) {
        const tx = cx + (v & 1 ? 5 : -6);
        ctx.fillStyle = '#5a8a30';
        ctx.fillRect(tx - 2, cy - 8, 4, 14);  // 幹
        ctx.fillRect(tx - 7, cy - 4, 5, 3);   // 左腕
        ctx.fillRect(tx + 2, cy - 6, 5, 3);   // 右腕
        ctx.fillRect(tx - 7, cy - 7, 3, 4);   // 左腕 上段
        ctx.fillRect(tx + 4, cy - 9, 3, 4);   // 右腕 上段
        // 花（黄）
        ctx.fillStyle = '#f0d020';
        ctx.beginPath(); ctx.arc(tx, cy - 9, 2, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }

    // ── 雪原 ──────────────────────────────────────────────────
    case TILE.SNOW: {
      // 積雪の質感（ランダムな白い凹凸）
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      const bumps = [
        [cx - 8, cy - 2, 5, 3], [cx + 4, cy + 3, 6, 3],
        [cx - 3, cy + 5, 4, 2], [cx + 7, cy - 5, 4, 3],
      ];
      for (const [bx, by, rw, rh] of bumps) {
        ctx.beginPath(); ctx.ellipse(bx, by, rw, rh, 0, 0, Math.PI * 2); ctx.fill();
      }

      // 雪の結晶（小さな星形 / タイルによって位置が違う）
      const sx = px + 4 + (v * 6) % (S - 14);
      const sy = py + 4 + (v * 5) % (S - 14);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;
      for (let a = 0; a < 6; a++) {
        const angle = (a / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle) * 4, sy + Math.sin(angle) * 4);
        ctx.stroke();
      }

      // 氷のきらめき
      const glints = [(v + 2) * 7 % (S - 4), (v + 5) * 5 % (S - 4)];
      ctx.fillStyle = 'rgba(200,230,255,0.7)';
      for (const g of glints) {
        ctx.beginPath();
        ctx.arc(px + g % (S - 4) + 2, py + (g * 3) % (S - 4) + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // ── 街 ────────────────────────────────────────────────────
    case TILE.TOWN: {
      // 街のシルエット（複数の建物）
      // 建物 A（大）
      ctx.fillStyle = '#8a6a4a';
      ctx.fillRect(cx - 11, cy - 1, 13, 11);   // 壁
      ctx.fillStyle = '#c04030';
      ctx.beginPath();
      ctx.moveTo(cx - 13, cy - 1); ctx.lineTo(cx + 1, cy - 12); ctx.lineTo(cx + 2, cy - 1);
      ctx.closePath(); ctx.fill();
      // 屋根の影
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy - 1); ctx.lineTo(cx + 2, cy - 12); ctx.lineTo(cx + 2, cy - 1);
      ctx.closePath(); ctx.fill();
      // 扉
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(cx - 4, cy + 4, 5, 6);
      // 窓
      ctx.fillStyle = '#f0c060';
      ctx.fillRect(cx - 9, cy + 1, 4, 3);

      // 建物 B（小・右）
      ctx.fillStyle = '#9a7a5a';
      ctx.fillRect(cx + 3, cy + 1, 9, 9);
      ctx.fillStyle = '#a03828';
      ctx.beginPath();
      ctx.moveTo(cx + 2, cy + 1); ctx.lineTo(cx + 7, cy - 7); ctx.lineTo(cx + 13, cy + 1);
      ctx.closePath(); ctx.fill();
      // 窓（小）
      ctx.fillStyle = '#f0c060';
      ctx.fillRect(cx + 5, cy + 3, 3, 2);
      break;
    }

    // ── 洞窟 ──────────────────────────────────────────────────
    case TILE.CAVE: {
      // 岩山シルエット
      ctx.fillStyle = '#5a4040';
      ctx.beginPath();
      ctx.moveTo(px + 2, py + S - 3);
      ctx.lineTo(cx - 6, py + 6);
      ctx.lineTo(cx + 2, py + 3);
      ctx.lineTo(cx + 10, py + 8);
      ctx.lineTo(px + S - 2, py + S - 3);
      ctx.closePath(); ctx.fill();
      // 岩の光面
      ctx.fillStyle = '#7a5a58';
      ctx.beginPath();
      ctx.moveTo(cx + 2, py + 3);
      ctx.lineTo(cx + 10, py + 8);
      ctx.lineTo(cx + 4, py + S - 3);
      ctx.lineTo(cx + 2, py + 3);
      ctx.closePath(); ctx.fill();
      // 洞窟の入口（アーチ型の暗闇）
      ctx.fillStyle = '#0a0808';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4, 9, 11, 0, Math.PI, Math.PI * 2);
      ctx.lineTo(cx + 9, cy + 4); ctx.lineTo(cx - 9, cy + 4);
      ctx.closePath(); ctx.fill();
      // 入口のアーチ岩縁
      ctx.strokeStyle = '#6a4040';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 9, Math.PI, Math.PI * 2);
      ctx.stroke();
      // 内部の薄い光（神秘感）
      ctx.fillStyle = 'rgba(80,20,20,0.4)';
      ctx.beginPath(); ctx.ellipse(cx, cy + 2, 5, 6, 0, Math.PI, Math.PI * 2); ctx.fill();
      break;
    }
  }
}
