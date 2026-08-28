import { ctx, LOGICAL_W, LOGICAL_H } from '../engine/canvas.js';
import { keys } from '../engine/input.js';
import { sfxClick, sfxLevelUp } from '../engine/audio.js';
import { party, restoreAll, addItem } from '../character/party.js';
import { saveGame } from '../engine/save.js';

const T = { FLOOR: 0, WALL: 1, INN: 2, SHOP: 3, EXIT: 4 };

const MAP_DATA = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,2,0,0,0,3,0,0,0,0,0,4,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];
const MAP_W = 20, MAP_H = 12, TS = 22;
const OX = (LOGICAL_W - MAP_W * TS) / 2;
const OY = (LOGICAL_H - MAP_H * TS) / 2;

const NPCS = [
  { x: 3, y: 3, dialogue: ['ようこそ、アデルの街へ！', '旅人よ、気をつけて行くがよい。'] },
  { x: 3, y: 7, dialogue: ['北の洞窟には魔物が潜む。', '宿屋でしっかり休んでいくことだ。'] },
];

const SHOP_ITEMS = [
  { id: 'potion',    name: 'ポーション',    price: 50  },
  { id: 'hi-potion', name: 'ハイポーション', price: 200 },
  { id: 'ether',     name: 'エーテル',      price: 150 },
];
const INN_COST = 50;

export function createTownScene(onExit) {
  let px = 9, py = 5;
  let state = 'MAP';
  let dlgLines = [], dlgIdx = 0;
  let innCursor = 0, shopCursor = 0;
  let innSleepTimer = 0, innMsg = '';

  function expose() {
    window.__ffclone.party       = party;
    window.__ffclone.townState   = () => state;
    window.__ffclone.townPos     = () => ({ x: px, y: py });
    window.__ffclone.triggerInn  = () => { state = 'INN'; innCursor = 0; };
    window.__ffclone.triggerShop = () => { state = 'SHOP'; shopCursor = 0; };
    window.__ffclone.triggerNpc  = () => {
      dlgLines = NPCS[0].dialogue; dlgIdx = 0; state = 'DIALOGUE';
    };
  }

  function interact() {
    const adj = [[px, py - 1], [px, py + 1], [px - 1, py], [px + 1, py]];
    for (const npc of NPCS) {
      if (adj.some(([ax, ay]) => ax === npc.x && ay === npc.y)) {
        dlgLines = npc.dialogue; dlgIdx = 0;
        state = 'DIALOGUE'; sfxClick(); return;
      }
    }
    for (const [cx, cy] of adj) {
      if (cy < 0 || cy >= MAP_H || cx < 0 || cx >= MAP_W) continue;
      const t = MAP_DATA[cy][cx];
      if (t === T.INN)  { state = 'INN';  innCursor = 0;  sfxClick(); return; }
      if (t === T.SHOP) { state = 'SHOP'; shopCursor = 0; sfxClick(); return; }
    }
  }

  // ── Drawing helpers (closured over state) ─────────────────

  function drawWindow(x, y, w, h, title) {
    ctx.fillStyle = 'rgba(0,0,30,0.93)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    if (title) {
      ctx.fillStyle = '#d4af37'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
      ctx.fillText(title, x + 8, y + 14);
    }
  }

  function drawMap() {
    ctx.fillStyle = '#1a1408';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    const COLORS = {
      [T.FLOOR]: '#3a2e1e', [T.WALL]: '#5a4030',
      [T.INN]:   '#1a3a5a', [T.SHOP]: '#1a4020', [T.EXIT]: '#443010',
    };
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const t = MAP_DATA[y][x];
        const dx = OX + x * TS, dy = OY + y * TS;
        ctx.fillStyle = COLORS[t]; ctx.fillRect(dx, dy, TS, TS);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.5;
        ctx.strokeRect(dx, dy, TS, TS);
        ctx.textAlign = 'center';
        if (t === T.INN)  { ctx.fillStyle = '#88ccff'; ctx.font = '7px monospace'; ctx.fillText('INN',  dx + TS/2, dy + TS/2 + 3); }
        if (t === T.SHOP) { ctx.fillStyle = '#88ff88'; ctx.font = '7px monospace'; ctx.fillText('SHOP', dx + TS/2, dy + TS/2 + 3); }
        if (t === T.EXIT) { ctx.fillStyle = '#ffcc44'; ctx.font = '7px monospace'; ctx.fillText('EXIT', dx + TS/2, dy + TS/2 + 3); }
      }
    }
  }

  function drawNpcs() {
    for (const npc of NPCS) {
      const dx = OX + npc.x * TS, dy = OY + npc.y * TS;
      ctx.fillStyle = '#ff9944'; ctx.fillRect(dx + 7, dy + 3, 8, 8);
      ctx.fillStyle = '#cc4422'; ctx.fillRect(dx + 8, dy + 11, 6, 7);
    }
  }

  function drawPlayer() {
    const dx = OX + px * TS, dy = OY + py * TS;
    ctx.fillStyle = '#ff4444'; ctx.fillRect(dx + 6, dy + 2, 10, 4);
    ctx.fillStyle = '#ffcc88'; ctx.fillRect(dx + 7, dy + 5, 8, 6);
    ctx.fillStyle = '#4466ff'; ctx.fillRect(dx + 6, dy + 11, 10, 7);
  }

  function drawDialogue() {
    const bx = 8, by = LOGICAL_H - 60, bw = LOGICAL_W - 16, bh = 52;
    drawWindow(bx, by, bw, bh, null);
    ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.textAlign = 'left';
    ctx.fillText(dlgLines[dlgIdx] || '', bx + 10, by + 22);
    if (Math.floor(Date.now() / 400) % 2 === 0) {
      ctx.fillStyle = '#d4af37'; ctx.fillText('▼', bx + bw - 18, by + bh - 8);
    }
  }

  function drawInnMenu() {
    drawWindow(60, 55, LOGICAL_W - 120, 105, '宿屋');
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`一泊 ${INN_COST}G。お泊まりになりますか？`, 70, 82);
    ctx.fillText(`所持金: ${party.gold}G`, 70, 98);
    ['はい', 'いいえ'].forEach((opt, i) => {
      ctx.fillStyle = innCursor === i ? '#ffff44' : '#aaa';
      ctx.fillText((innCursor === i ? '▶ ' : '  ') + opt, 70, 116 + i * 18);
    });
  }

  function drawInnSleep() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
    ctx.fillText('おやすみなさい...', LOGICAL_W / 2, LOGICAL_H / 2 - 8);
    ctx.fillStyle = '#80ff80'; ctx.font = '12px monospace';
    ctx.fillText('HP・MP 全回復！', LOGICAL_W / 2, LOGICAL_H / 2 + 14);
  }

  function drawMsg(msg) {
    drawWindow(60, 100, LOGICAL_W - 120, 50, null);
    ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
    ctx.fillText(msg, LOGICAL_W / 2, 132);
  }

  function drawShop() {
    drawWindow(38, 38, LOGICAL_W - 76, 145, 'ショップ');
    ctx.fillStyle = '#ccc'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`所持金: ${party.gold}G`, 48, 62);
    SHOP_ITEMS.forEach((item, i) => {
      ctx.fillStyle = shopCursor === i ? '#ffff44' : '#fff';
      ctx.fillText(`${shopCursor === i ? '▶' : ' '} ${item.name}`, 48, 80 + i * 20);
      ctx.textAlign = 'right';
      ctx.fillText(`${item.price}G`, LOGICAL_W - 44, 80 + i * 20);
      ctx.textAlign = 'left';
    });
    ctx.fillStyle = '#888'; ctx.font = '10px monospace';
    ctx.fillText('Aキー: 購入  Bキー: 閉じる', 48, 80 + SHOP_ITEMS.length * 20 + 12);
  }

  function drawHUD() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(6, 6, 88, 16);
    ctx.fillStyle = '#d4af37'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
    ctx.fillText('アデルの街', 10, 18);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(LOGICAL_W - 72, 6, 66, 16);
    ctx.fillStyle = '#ffcc44'; ctx.font = '10px monospace'; ctx.textAlign = 'right';
    ctx.fillText(`${party.gold}G`, LOGICAL_W - 8, 18);
  }

  // ── Scene interface ────────────────────────────────────────

  return {
    init() { px = 9; py = 5; state = 'MAP'; expose(); },

    update(dt) {
      if (state === 'MAP') {
        if (MAP_DATA[py][px] === T.EXIT || keys.bP) { sfxClick(); onExit?.(); return; }
        let nx = px, ny = py;
        if (keys.upP)    ny--;
        if (keys.downP)  ny++;
        if (keys.leftP)  nx--;
        if (keys.rightP) nx++;
        if ((nx !== px || ny !== py) && nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H) {
          if (MAP_DATA[ny][nx] !== T.WALL) {
            px = nx; py = ny;
            if (MAP_DATA[py][px] === T.EXIT) { sfxClick(); onExit?.(); return; }
          }
        }
        if (keys.aP) interact();

      } else if (state === 'DIALOGUE') {
        if (keys.aP || keys.bP) {
          dlgIdx++;
          if (dlgIdx >= dlgLines.length) state = 'MAP';
          sfxClick();
        }

      } else if (state === 'INN') {
        if (keys.upP || keys.downP) { innCursor = innCursor === 0 ? 1 : 0; sfxClick(); }
        if (keys.aP) {
          if (innCursor === 0) {
            if (party.gold >= INN_COST) {
              party.gold -= INN_COST; restoreAll();
              innMsg = 'HP・MP全回復！'; state = 'INN_SLEEP'; innSleepTimer = 1500;
              saveGame(0, { gold: party.gold, members: party.members.map(m => ({ ...m })) });
            } else {
              innMsg = 'ゴールドが足りません'; state = 'INN_NOMONEY';
            }
          } else { state = 'MAP'; }
          sfxClick();
        }
        if (keys.bP) { state = 'MAP'; sfxClick(); }

      } else if (state === 'INN_SLEEP') {
        innSleepTimer -= dt;
        if (innSleepTimer <= 0) { state = 'MAP'; sfxLevelUp(); }

      } else if (state === 'INN_NOMONEY') {
        if (keys.aP || keys.bP) { state = 'MAP'; sfxClick(); }

      } else if (state === 'SHOP') {
        if (keys.upP)   { shopCursor = Math.max(0, shopCursor - 1); sfxClick(); }
        if (keys.downP) { shopCursor = Math.min(SHOP_ITEMS.length - 1, shopCursor + 1); sfxClick(); }
        if (keys.aP) {
          const item = SHOP_ITEMS[shopCursor];
          if (party.gold >= item.price) { party.gold -= item.price; addItem(item.id); sfxLevelUp(); }
        }
        if (keys.bP) { state = 'MAP'; sfxClick(); }
      }
    },

    draw() {
      drawMap(); drawNpcs(); drawPlayer();
      if (state === 'DIALOGUE')   drawDialogue();
      else if (state === 'INN')   drawInnMenu();
      else if (state === 'INN_SLEEP')   drawInnSleep();
      else if (state === 'INN_NOMONEY') drawMsg(innMsg);
      else if (state === 'SHOP')  drawShop();
      drawHUD();
    },

    destroy() {
      window.__ffclone.party = window.__ffclone.townState =
      window.__ffclone.townPos = window.__ffclone.triggerInn =
      window.__ffclone.triggerShop = window.__ffclone.triggerNpc = null;
    },
  };
}
