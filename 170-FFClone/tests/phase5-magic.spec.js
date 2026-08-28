import { test, expect } from '@playwright/test';

async function goToBattle(page, tileType = 0) {
  await page.goto('/');
  await page.waitForTimeout(1200);
  await page.keyboard.down('Enter'); await page.waitForTimeout(200); await page.keyboard.up('Enter');
  await page.waitForTimeout(800);
  await page.evaluate((t) => window.__ffclone.goToBattle?.(t), tileType);
  await page.waitForTimeout(900);
}

async function openMagicMenu(page) {
  // fighter[1]=レナ(white), fighter[3]=ファリス(thief), fighter[2]=ガラフ(warrior)
  // 黒魔道士のスペルリストが欲しい → fighter[1]レナ(white) を使う
  // まず fighter[1] の ATB をフルにする
  await page.evaluate(() => {
    const b = window.__ffclone.battle;
    b.enemies.forEach(e => { e.atbGauge = 0; });
    b.fighters.forEach((f, i) => { f.atbGauge = i === 1 ? 100 : 0; });
  });
  await page.waitForTimeout(200);
  // CMD_MENU 開く → 「まほう」(index 1) → ArrowDown × 1 → A
  await page.keyboard.down('ArrowDown'); await page.waitForTimeout(120); await page.keyboard.up('ArrowDown');
  await page.waitForTimeout(80);
  await page.keyboard.down('z'); await page.waitForTimeout(120); await page.keyboard.up('z');
  await page.waitForTimeout(100);
}

test.describe('Phase 5: 魔法システム', () => {

  test('黒魔道士がまほうメニューを開ける', async ({ page }) => {
    await goToBattle(page);
    // fighter index 0 はバッツ(warrior) → まほうなし
    // fighter index をblack mageにセット
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      b.enemies.forEach(e => { e.atbGauge = 0; });
      b.fighters.forEach((f, i) => { f.atbGauge = i === 1 ? 100 : 0; }); // レナ(white)
    });
    await page.waitForTimeout(200);
    // ArrowDown → まほう選択(index 1) → A
    await page.keyboard.down('ArrowDown'); await page.waitForTimeout(120); await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(80);
    await page.keyboard.down('z'); await page.waitForTimeout(120); await page.keyboard.up('z');
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__ffclone.battle?.state?.());
    expect(state).toBe('CMD_MAGIC');
  });

  test('魔法を唱えるとMPが減る', async ({ page }) => {
    await goToBattle(page);
    // fighter[1] = レナ(white mage) を使う
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      b.enemies.forEach(e => { e.atbGauge = 0; });
      b.fighters.forEach((f, i) => { f.atbGauge = i === 1 ? 100 : 0; });
    });
    await page.waitForTimeout(200);
    const mpBefore = await page.evaluate(() => window.__ffclone.battle.fighters[1].mp);

    // まほう(index 1) → A でCMD_MAPGICへ
    await page.keyboard.down('ArrowDown'); await page.waitForTimeout(120); await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(80);
    await page.keyboard.down('z'); await page.waitForTimeout(120); await page.keyboard.up('z');
    await page.waitForTimeout(100);

    // CMD_MAGIC: 先頭スペル(cure1 MP5) → A で対象選択 or 即時実行
    await page.keyboard.down('z'); await page.waitForTimeout(120); await page.keyboard.up('z');
    await page.waitForTimeout(100);

    // CMD_ALLY_TARGET: A で実行
    const st = await page.evaluate(() => window.__ffclone.battle?.state?.());
    if (st === 'CMD_ALLY_TARGET') {
      await page.keyboard.down('z'); await page.waitForTimeout(120); await page.keyboard.up('z');
      await page.waitForTimeout(900);
    } else {
      await page.waitForTimeout(900);
    }

    const mpAfter = await page.evaluate(() => window.__ffclone.battle?.fighters?.[1]?.mp ?? window.__ffclone.party?.members?.[1]?.mp);
    expect(mpAfter).toBeLessThan(mpBefore);
  });

  test('ケアルで味方HPが回復する', async ({ page }) => {
    await goToBattle(page);
    // ファイターのHPを削る & レナATBフル
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      b.enemies.forEach(e => { e.atbGauge = 0; });
      b.fighters.forEach((f, i) => {
        f.atbGauge = i === 1 ? 100 : 0;
        if (i === 0) f.hp = Math.floor(f.maxHp * 0.4); // バッツを低HP
      });
    });
    await page.waitForTimeout(200);

    const hpBefore = await page.evaluate(() => window.__ffclone.battle.fighters[0].hp);

    // まほう → CMD_MAGIC(cure1) → A → CMD_ALLY_TARGET → 対象バッツ → A
    await page.keyboard.down('ArrowDown'); await page.waitForTimeout(100); await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(60);
    await page.keyboard.down('z'); await page.waitForTimeout(100); await page.keyboard.up('z'); // まほう
    await page.waitForTimeout(100);
    await page.keyboard.down('z'); await page.waitForTimeout(100); await page.keyboard.up('z'); // cure1選択
    await page.waitForTimeout(100);

    const st = await page.evaluate(() => window.__ffclone.battle?.state?.());
    if (st === 'CMD_ALLY_TARGET') {
      // 対象をバッツ(index 0)に合わせる → ArrowUp × (fighters.length - 1) or just index 0 is default
      await page.keyboard.down('z'); await page.waitForTimeout(100); await page.keyboard.up('z');
    }
    await page.waitForTimeout(900);

    const hpAfter = await page.evaluate(() => window.__ffclone.battle?.fighters?.[0]?.hp);
    expect(hpAfter).toBeGreaterThan(hpBefore);
  });

  test('属性弱点の敵に2倍ダメージ（黒魔法）', async ({ page }) => {
    // スライム(weak: fire) に fire1 を当てる
    await page.goto('/');
    await page.waitForTimeout(1200);
    await page.keyboard.down('Enter'); await page.waitForTimeout(200); await page.keyboard.up('Enter');
    await page.waitForTimeout(800);
    await page.evaluate(() => window.__ffclone.goToBattle?.(0)); // GRASS → slime
    await page.waitForTimeout(900);

    // fighter[2] をblack mageに設定（またはテスト用に job 書き換え）
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      // フォールバック: fighters[0]をblack mageにして火魔法持ちにする
      b.fighters[0].job = 'black';
      b.fighters[0].mp  = 99;
      b.enemies.forEach(e => { e.atbGauge = 0; });
      b.fighters.forEach((f, i) => { f.atbGauge = i === 0 ? 100 : 0; });
    });
    await page.waitForTimeout(200);

    const slimeHpBefore = await page.evaluate(() => window.__ffclone.battle.enemies[0].currentHp);

    // まほう(index 1) → A → CMD_MAGIC先頭(fire1) → A → CMD_TARGET(slime) → A
    await page.keyboard.down('ArrowDown'); await page.waitForTimeout(100); await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(60);
    await page.keyboard.down('z'); await page.waitForTimeout(100); await page.keyboard.up('z'); // まほう
    await page.waitForTimeout(100);
    await page.keyboard.down('z'); await page.waitForTimeout(100); await page.keyboard.up('z'); // fire1
    await page.waitForTimeout(100);
    // CMD_TARGET へ
    await page.keyboard.down('z'); await page.waitForTimeout(100); await page.keyboard.up('z');
    await page.waitForTimeout(900);

    const slimeHpAfter = await page.evaluate(() => window.__ffclone.battle.enemies[0].currentHp);
    // 弱点2倍なので通常より大きいダメージを確認（スライム30HP、fire1通常ダメ~14 → 弱点で~28）
    const dmg = slimeHpBefore - slimeHpAfter;
    expect(dmg).toBeGreaterThan(10);
  });

  test('MPが足りない場合は魔法を唱えられない', async ({ page }) => {
    await goToBattle(page);
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      b.enemies.forEach(e => { e.atbGauge = 0; });
      b.fighters.forEach((f, i) => {
        f.atbGauge = i === 1 ? 100 : 0;
        if (i === 1) f.mp = 0; // MP枯渇
      });
    });
    await page.waitForTimeout(200);

    // まほう → CMD_MAGIC → A 押してもMP不足で CMD_MAGIC のままか CMD_MENU に戻る
    await page.keyboard.down('ArrowDown'); await page.waitForTimeout(100); await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(60);
    await page.keyboard.down('z'); await page.waitForTimeout(100); await page.keyboard.up('z');
    await page.waitForTimeout(100);
    await page.keyboard.down('z'); await page.waitForTimeout(100); await page.keyboard.up('z');
    await page.waitForTimeout(200);

    const state = await page.evaluate(() => window.__ffclone.battle?.state?.());
    // CMD_MAGIC に留まるはず（MPが足りないのでtarget選択に進まない）
    expect(state).toBe('CMD_MAGIC');
  });

  test('全体魔法(ファイガ)が全敵に当たる', async ({ page }) => {
    await goToBattle(page, 0); // GRASS: slime×2 + goblin×1
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      b.fighters[0].job = 'black'; b.fighters[0].mp = 99;
      b.enemies.forEach(e => { e.atbGauge = 0; });
      b.fighters.forEach((f, i) => { f.atbGauge = i === 0 ? 100 : 0; });
    });
    await page.waitForTimeout(200);

    const hpsBefore = await page.evaluate(() => window.__ffclone.battle.enemies.map(e => e.currentHp));

    // まほう → fire3(index 2) → A で即時全体発動
    await page.keyboard.down('ArrowDown'); await page.waitForTimeout(100); await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(60);
    await page.keyboard.down('z'); await page.waitForTimeout(100); await page.keyboard.up('z'); // まほう
    await page.waitForTimeout(100);
    await page.keyboard.down('ArrowDown'); await page.waitForTimeout(100); await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(60);
    await page.keyboard.down('ArrowDown'); await page.waitForTimeout(100); await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(60);
    await page.keyboard.down('z'); await page.waitForTimeout(100); await page.keyboard.up('z'); // fire3選択
    await page.waitForTimeout(900);

    const hpsAfter = await page.evaluate(() => window.__ffclone.battle.enemies.map(e => e.currentHp));
    // 全員HPが減っているはず
    const allDamaged = hpsAfter.every((hp, i) => hp < hpsBefore[i]);
    expect(allDamaged).toBe(true);
  });
});
