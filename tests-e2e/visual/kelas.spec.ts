import { test, expect } from '@playwright/test';
import { gotoAndWait, tryLogin } from './utils';

test.describe('Visual Regression: Kelas Page', () => {
  test('kelas list', async ({ page }) => {
    const loggedIn = await tryLogin(page);
    if (!loggedIn) {
      test.skip(true, 'Login failed - valid test credentials required');
      return;
    }
    
    await gotoAndWait(page, '/kelas');
    
    // Wait for kelas content
    await expect(page.locator('main#main-content')).toBeVisible();
    
    // Take screenshot
    await expect(page).toHaveScreenshot('kelas.png', {
      fullPage: true,
    });
  });
});