import { test, expect } from '@playwright/test';

// not sure if this is failing because iframes are hidden.
// need to investigate

test.describe('Iframes are created test', () => {

  test('Check for hidden iframes', async ({ page }) => {
    await page.goto('/store/catalog');
    await page.waitForTimeout(6000);

    // check that frames are in place and reframed
    const iframes = await page.frameLocator('iframe').locator('hidden');
    // await expect(iframes).toHaveCount(2);


    for (let i = 0; i < 2; i++) {
      const frame = await iframes.nth(i).contentFrame();
      console.log(frame, '### frame');
      expect(frame).not.toBeNull();
      // const headTitle = await frame.locator('head > title');
      // const bodyScripts = await frame.locator('body > script').count();
      // await expect(headTitle).toHaveText('');
      // await expect(bodyScripts).toBeGreaterThan(0);
    }
  });
});
