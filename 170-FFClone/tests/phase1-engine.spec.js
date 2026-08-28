import { test, expect } from '@playwright/test';

test.describe('Phase 1: エンジン + タイトル画面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('Canvas が存在し表示されている', async ({ page }) => {
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('Canvas にピクセルが描画されている（真っ黒でない）', async ({ page }) => {
    await page.waitForTimeout(1200);
    const screenshot = await page.screenshot();
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('タイトル画面でページタイトルが FFClone', async ({ page }) => {
    await expect(page).toHaveTitle('FFClone');
  });

  test('プレイエリアとコントローラーパネルが分離されている', async ({ page }) => {
    const gameArea  = page.locator('#game-area');
    const ctrl      = page.locator('#controller');
    await expect(gameArea).toBeVisible();
    await expect(ctrl).toBeVisible();

    const gameBox = await gameArea.boundingBox();
    const ctrlBox = await ctrl.boundingBox();

    // コントローラーはゲームエリアの下にある
    expect(ctrlBox.y).toBeGreaterThan(gameBox.y);
    // コントローラーはゲームエリアより小さい（高さ）
    expect(ctrlBox.height).toBeLessThan(gameBox.height);
  });

  test('ファミコン配置: 十字キー・SELECT・START・A・B が表示されている', async ({ page }) => {
    await expect(page.locator('#dpad-up')).toBeVisible();
    await expect(page.locator('#dpad-down')).toBeVisible();
    await expect(page.locator('#dpad-left')).toBeVisible();
    await expect(page.locator('#dpad-right')).toBeVisible();
    await expect(page.locator('#btn-select')).toBeVisible();
    await expect(page.locator('#btn-start')).toBeVisible();
    await expect(page.locator('#btn-a')).toBeVisible();
    await expect(page.locator('#btn-b')).toBeVisible();
  });

  test('SELECT と START が十字キーと A/B の間（水平中央寄り）にある', async ({ page }) => {
    const dpadBox   = await page.locator('#dpad').boundingBox();
    const selectBox = await page.locator('#btn-select').boundingBox();
    const abBox     = await page.locator('#btn-a').boundingBox();

    // SELECT は D-pad より右にある
    expect(selectBox.x).toBeGreaterThan(dpadBox.x + dpadBox.width);
    // A ボタンは SELECT より右にある
    expect(abBox.x).toBeGreaterThan(selectBox.x + selectBox.width);
  });

  test('Enter キーでフィールドシーンに遷移する', async ({ page }) => {
    await page.waitForTimeout(1200);
    await page.keyboard.down('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.up('Enter');
    await page.waitForTimeout(800);
    await expect(page.locator('#gameCanvas')).toBeVisible();
  });

  test('STARTボタン（タッチ）でフィールドシーンに遷移する', async ({ page }) => {
    await page.waitForTimeout(1200);
    await page.locator('#btn-start').click();
    await page.waitForTimeout(800);
    await expect(page.locator('#gameCanvas')).toBeVisible();
  });
});
