import { test, expect } from '@playwright/test';

async function goToTown(page) {
  await page.goto('/');
  await page.waitForTimeout(1200);
  await page.keyboard.down('Enter');
  await page.waitForTimeout(200);
  await page.keyboard.up('Enter');
  await page.waitForTimeout(800);

  // 強制エンカウントではなく、特定座標（街）に移動させる
  // START_X=37, START_Y=38 → SPECIAL at (37,37) TOWN
  // プレイヤーを特殊座標で街に入れる代わりに __ffclone.goToTown() を使う
  await page.evaluate(() => window.__ffclone.goToTown?.());
  await page.waitForTimeout(400);
}

test.describe('Phase 3: 街 + NPC + ショップ + 宿屋', () => {

  test('フィールドから街に遷移できる', async ({ page }) => {
    await goToTown(page);
    const townState = await page.evaluate(() => window.__ffclone.townState?.());
    expect(['MAP', 'DIALOGUE', 'INN', 'SHOP']).toContain(townState);
  });

  test('街内でプレイヤーが移動できる', async ({ page }) => {
    await goToTown(page);

    // 初期位置を記録する test hook を作成
    const before = await page.evaluate(() => window.__ffclone.townPos?.());
    // 移動
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(100);
    const after = await page.evaluate(() => window.__ffclone.townPos?.());
    expect(after).not.toBeNull();
    await expect(page.locator('#gameCanvas')).toBeVisible();
  });

  test('NPC に話しかけるとダイアログが開く', async ({ page }) => {
    await goToTown(page);
    await page.evaluate(() => window.__ffclone.triggerNpc?.());
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__ffclone.townState?.());
    expect(state).toBe('DIALOGUE');
  });

  test('ダイアログを進めると MAP 状態に戻る', async ({ page }) => {
    await goToTown(page);
    await page.evaluate(() => window.__ffclone.triggerNpc?.());
    await page.waitForTimeout(100);
    // Aキーで進める（2行分）
    await page.keyboard.down('z');
    await page.waitForTimeout(150);
    await page.keyboard.up('z');
    await page.waitForTimeout(100);
    await page.keyboard.down('z');
    await page.waitForTimeout(150);
    await page.keyboard.up('z');
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__ffclone.townState?.());
    expect(state).toBe('MAP');
  });

  test('宿屋でHP/MPが全回復する', async ({ page }) => {
    await goToTown(page);
    // HP を削る
    await page.evaluate(() => {
      window.__ffclone.party.members[0].hp = 10;
      window.__ffclone.party.members[1].mp = 5;
    });
    // 宿屋トリガー → はい（innCursor=0 で Enter）
    await page.evaluate(() => window.__ffclone.triggerInn?.());
    await page.waitForTimeout(100);
    await page.keyboard.down('z');
    await page.waitForTimeout(150);
    await page.keyboard.up('z');
    await page.waitForTimeout(200);

    const result = await page.evaluate(() => ({
      hp:    window.__ffclone.party.members[0].hp,
      maxHp: window.__ffclone.party.members[0].maxHp,
      mp:    window.__ffclone.party.members[1].mp,
      maxMp: window.__ffclone.party.members[1].maxMp,
    }));
    expect(result.hp).toBe(result.maxHp);
    expect(result.mp).toBe(result.maxMp);
  });

  test('宿屋で所持金が INN_COST 分減る', async ({ page }) => {
    await goToTown(page);
    const before = await page.evaluate(() => window.__ffclone.party.gold);
    await page.evaluate(() => window.__ffclone.triggerInn?.());
    await page.waitForTimeout(100);
    await page.keyboard.down('z');
    await page.waitForTimeout(150);
    await page.keyboard.up('z');
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => window.__ffclone.party.gold);
    expect(after).toBe(before - 50);
  });

  test('ゴールド不足時は宿屋に泊まれない', async ({ page }) => {
    await goToTown(page);
    await page.evaluate(() => { window.__ffclone.party.gold = 10; });
    await page.evaluate(() => window.__ffclone.triggerInn?.());
    await page.waitForTimeout(100);
    await page.keyboard.down('z');
    await page.waitForTimeout(150);
    await page.keyboard.up('z');
    await page.waitForTimeout(200);
    const state = await page.evaluate(() => window.__ffclone.townState?.());
    expect(state).toBe('INN_NOMONEY');
  });

  test('ショップでアイテムを購入すると所持金が減る', async ({ page }) => {
    await goToTown(page);
    await page.evaluate(() => { window.__ffclone.party.gold = 500; });
    const before = await page.evaluate(() => window.__ffclone.party.gold);
    await page.evaluate(() => window.__ffclone.triggerShop?.());
    await page.waitForTimeout(100);
    // ポーション（50G）を購入
    await page.keyboard.down('z');
    await page.waitForTimeout(150);
    await page.keyboard.up('z');
    await page.waitForTimeout(100);
    const after = await page.evaluate(() => window.__ffclone.party.gold);
    expect(after).toBe(before - 50);
  });

  test('ショップでカーソル移動できる', async ({ page }) => {
    await goToTown(page);
    await page.evaluate(() => window.__ffclone.triggerShop?.());
    await page.waitForTimeout(100);
    const state = await page.evaluate(() => window.__ffclone.townState?.());
    expect(state).toBe('SHOP');
    // Bキーで閉じる
    await page.keyboard.down('x');
    await page.waitForTimeout(150);
    await page.keyboard.up('x');
    await page.waitForTimeout(100);
    const stateAfter = await page.evaluate(() => window.__ffclone.townState?.());
    expect(stateAfter).toBe('MAP');
  });
});
