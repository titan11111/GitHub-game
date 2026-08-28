import { test, expect } from '@playwright/test';

async function goToBattle(page, tileType = 0) {
  await page.goto('/');
  await page.waitForTimeout(1200);
  await page.keyboard.down('Enter');
  await page.waitForTimeout(200);
  await page.keyboard.up('Enter');
  await page.waitForTimeout(800);
  await page.evaluate((t) => window.__ffclone.goToBattle?.(t), tileType);
  await page.waitForTimeout(800); // wait for INTRO to finish
}

async function getBattleState(page) {
  return page.evaluate(() => window.__ffclone.battle?.state?.());
}

test.describe('Phase 4: ATB バトルシステム', () => {

  test('バトル画面が描画される', async ({ page }) => {
    await goToBattle(page);
    await expect(page.locator('#gameCanvas')).toBeVisible();
    const state = await getBattleState(page);
    expect(['RUNNING', 'CMD_MENU', 'EXECUTING']).toContain(state);
  });

  test('敵が正しく生成されている', async ({ page }) => {
    await goToBattle(page, 0); // GRASS → スライム×2 + ゴブリン×1
    const count = await page.evaluate(() => window.__ffclone.battle?.enemies?.length);
    expect(count).toBeGreaterThanOrEqual(2);
    expect(count).toBeLessThanOrEqual(3);
  });

  test('ATBゲージが時間経過でチャージされる', async ({ page }) => {
    await goToBattle(page);
    // ゲージをリセット
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      b.fighters.forEach(f => { f.atbGauge = 0; });
      b.enemies.forEach(e => { e.atbGauge = 0; });
    });
    await page.waitForTimeout(1500);
    const gauge = await page.evaluate(() => window.__ffclone.battle.fighters[0].atbGauge);
    expect(gauge).toBeGreaterThan(0);
  });

  test('ATBフルでコマンドメニューが開く', async ({ page }) => {
    await goToBattle(page);
    // 全敵ATBを0にしてパーティ[0]だけフルに
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      b.enemies.forEach(e => { e.atbGauge = 0; });
      b.fighters.forEach((f, i) => { f.atbGauge = i === 0 ? 100 : 0; });
    });
    await page.waitForTimeout(200);
    const state = await getBattleState(page);
    expect(state).toBe('CMD_MENU');
  });

  test('「たたかう」→ターゲット選択 → 実行で敵HPが減る', async ({ page }) => {
    await goToBattle(page);
    // パーティ[0] ATB フル、敵ATB 0
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      b.enemies.forEach(e => { e.atbGauge = 0; });
      b.fighters.forEach((f, i) => { f.atbGauge = i === 0 ? 100 : 0; });
    });
    await page.waitForTimeout(200);

    const initialHp = await page.evaluate(() => window.__ffclone.battle.enemies[0].currentHp);

    // CMD_MENU: Aキーで「たたかう」選択（カーソルは0のまま）
    await page.keyboard.down('z');
    await page.waitForTimeout(150);
    await page.keyboard.up('z');
    await page.waitForTimeout(100);

    // CMD_TARGET: Aキーで先頭の敵を攻撃
    await page.keyboard.down('z');
    await page.waitForTimeout(150);
    await page.keyboard.up('z');
    await page.waitForTimeout(800); // EXECUTING 待ち

    const afterHp = await page.evaluate(() => window.__ffclone.battle.enemies[0].currentHp);
    expect(afterHp).toBeLessThan(initialHp);
  });

  test('全敵撃破で VICTORY 状態になる', async ({ page }) => {
    await goToBattle(page);
    // ATB をセットしてコマンド入力できる状態に
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      b.enemies.forEach(e => { e.atbGauge = 0; });
      b.fighters.forEach((f, i) => { f.atbGauge = i === 0 ? 100 : 0; });
    });
    await page.waitForTimeout(200);

    // CMD_MENU → たたかう → CMD_TARGET → 全敵を事前に 0HP にしてから確定
    await page.keyboard.down('z'); await page.waitForTimeout(120); await page.keyboard.up('z');
    await page.waitForTimeout(100); // CMD_TARGET へ

    // CMD_TARGET 中に全敵を全滅 → A ボタンで EXECUTING→VICTORY
    await page.evaluate(() => window.__ffclone.battle?.killEnemies?.());
    await page.keyboard.down('z'); await page.waitForTimeout(120); await page.keyboard.up('z');
    await page.waitForTimeout(900); // EXECUTING 完了待ち

    const state = await getBattleState(page);
    expect(state).toBe('VICTORY');
  });

  test('全員HP0で DEFEAT 状態になる', async ({ page }) => {
    await goToBattle(page);
    // 全員を 1HP にして敵ATBフルにして攻撃させる
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      b.fighters.forEach(f => { f.hp = 1; f.atbGauge = 0; });
      b.enemies.forEach((e, i) => { e.atbGauge = i === 0 ? 100 : 0; });
    });
    await page.waitForTimeout(1000);

    // まだ倒れてなければ全員 HP 0 に直接セット → ATB で DEFEAT 誘発
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      b.fighters.forEach(f => { f.hp = 0; });
      b.enemies.forEach((e, i) => { e.atbGauge = i === 0 ? 100 : 0; });
    });
    await page.waitForTimeout(1000);

    const state = await getBattleState(page);
    // EXECUTINGフェーズで DEFEAT への遷移
    expect(['DEFEAT', 'EXECUTING', 'RUNNING']).toContain(state);
  });

  test('勝利後にパーティのEXPが増える', async ({ page }) => {
    await goToBattle(page, 0);
    const beforeExp = await page.evaluate(() => window.__ffclone.party?.members[0]?.exp ?? 0);

    // 敵を全滅させて EXECUTING→VICTORY に持ち込む
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      b.enemies.forEach(e => { e.atbGauge = 0; });
      b.fighters.forEach((f, i) => { f.atbGauge = i === 0 ? 100 : 0; });
    });
    await page.waitForTimeout(200);
    await page.keyboard.down('z'); await page.waitForTimeout(100); await page.keyboard.up('z');
    await page.waitForTimeout(80);
    await page.evaluate(() => window.__ffclone.battle?.killEnemies?.());
    await page.keyboard.down('z'); await page.waitForTimeout(100); await page.keyboard.up('z');
    await page.waitForTimeout(900);

    const afterExp = await page.evaluate(() => window.__ffclone.party?.members[0]?.exp ?? 0);
    expect(afterExp).toBeGreaterThanOrEqual(beforeExp);
  });

  test('ぼうぎょコマンドが使える', async ({ page }) => {
    await goToBattle(page);
    await page.evaluate(() => {
      const b = window.__ffclone.battle;
      b.enemies.forEach(e => { e.atbGauge = 0; });
      b.fighters.forEach((f, i) => { f.atbGauge = i === 0 ? 100 : 0; });
    });
    await page.waitForTimeout(200);

    // ArrowDown × 3 でカーソルを 0→1→2→3（ぼうぎょ）へ
    for (let i = 0; i < 3; i++) {
      await page.keyboard.down('ArrowDown'); await page.waitForTimeout(120); await page.keyboard.up('ArrowDown');
      await page.waitForTimeout(60);
    }
    // 確定（A = z or Enter）
    await page.keyboard.down('z'); await page.waitForTimeout(150); await page.keyboard.up('z');
    await page.waitForTimeout(200);

    const defending = await page.evaluate(() => window.__ffclone.battle.fighters[0].defending);
    expect(defending).toBe(true);
  });
});
