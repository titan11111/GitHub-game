# 262-eto-keshi — 回転机制のみ（プロンプト + プログラム）

抽出日: 2026-10-03  
更新: 2026-10-03 — **262ベース統合後**は盤 **9列×12行**（交点 1≤R≤11, 1≤C≤8）。実装は `index.html` 内。

## 再現用プロンプト（回転だけ）

```text
パズル盤（7列×8行の grid[r][c]）に、回転操作を追加する。

【回転の定義】
- 盤の「交点」(R,C)（1≤R≤ROWS-1, 1≤C≤COLS-1）を軸にする。
- 軸に接する4マスは、左上→右上→右下→左下の順で時計回り:
  (R-1,C-1), (R-1,C), (R,C), (R,C-1)
- 時計回り1回: grid 上の参照を (i - dir + 4) % 4 で循環（dir=1 CW, -1 CCW）。

【操作フロー】
1. 浮上: 交点◇タップ → axis, lifted=true, orig に4駒スナップショット
2. 回転: ボタン左/右 または 軸周りドラッグ（累積角 |Δ| > 0.75 rad で1手）
3. 収める: 軸再タップ or「収める」 → lifted=false
4. 4駒配置が orig と違えば手数-1（消去は別実装）

【描画】
- lift 0→1 で4マス浮上。枠を ang で rotate、駒は rotate(-ang) で正立。
- ロジック更新時 ang ±= π/2、毎フレーム ang を 0 に減衰。

【状態】
axis, lifted, lift(0-1), ang, orig[4], busy
```

UI文言（ゲーム内）: ◇を押すと4駒が浮いて回転、もう一度軸を押して収める。

## プログラム（コア）

### 状態・4マス定義

```javascript
let axis = null, lifted = false, lift = 0, ang = 0, orig = [], pick = null;

function groupCells() {
  const { R, C } = axis;
  return [[R - 1, C - 1], [R - 1, C], [R, C], [R, C - 1]];
}
function inGroup(t) {
  return axis && lift > 0.01 &&
    (t.r === axis.R - 1 || t.r === axis.R) &&
    (t.c === axis.C - 1 || t.c === axis.C);
}
```

### doLift / rotate / commit

```javascript
function doLift(R, C) {
  if (busy || moves <= 0) return;
  axis = { R, C }; lifted = true; ang = 0; pick = null;
  orig = groupCells().map(([r, c]) => grid[r][c]);
  sfx.lift(); setButtons();
}

function rotate(dir) { // 1=CW, -1=CCW
  if (!lifted || busy) return;
  const cells = groupCells(), ts = cells.map(([r, c]) => grid[r][c]);
  cells.forEach(([r, c], i) => {
    const t = ts[(i - dir + 4) % 4];
    grid[r][c] = t; t.r = r; t.c = c; t.x = c; t.y = r;
  });
  ang -= dir * Math.PI / 2;
  pick = null;
  sfx.turn(dir);
}

async function commit() {
  if (!lifted || busy) return;
  lifted = false; busy = true; setButtons(); sfx.drop();
  await waitSettle();
  const changed = groupCells().some(([r, c], i) => grid[r][c] !== orig[i]);
  // changed → moves--, resolve() …
  axis = null; busy = false; setButtons();
}
```

### アニメ

```javascript
function step(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  const target = lifted ? 1 : 0;
  lift += (target - lift) * Math.min(1, dt * 16);
  ang -= Math.sign(ang) * Math.min(Math.abs(ang), dt * 11);
  // …
}
```

### 描画要点

- 浮上ブロック: `ctx.rotate(ang)` で枠、`drawTile(..., liftL)` 内で `if (liftL) ctx.rotate(-ang)`。
- 入力: `$('bL').onclick = () => rotate(-1)` / `bR` は `rotate(1)`。
- ドラッグ: 軸からの角度差が ±0.75 rad 超で `rotate(±1)`（`index.html` pointermove）。

## 依存（回転単体で必要なもの）

`grid`, `tiles[]`（r,c,x,y）, `busy`, `moves`, `step`+`draw`, `waitSettle` / `settled`

## 参照行番号（現行 index.html）

- 軸操作: 263–305 行付近
- step ang/lift: 385–405
- 描画: 457–505
- 入力: 566–621
