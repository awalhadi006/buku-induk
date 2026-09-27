import { test, expect } from '@playwright/test';
import { gotoAndWait, tryLogin } from './utils';

test.describe('Visual Regression: Wali Santri Page', () => {
  test('wali list', async ({ page }) => {
    const loggedIn = await tryLogin(page);
    if (!loggedIn) {
      test.skip(true, 'Login failed - valid test credentials required');
      return;
    }
    
    await gotoAndWait(page, '/wali');
    
    // Wait for wali content
    await expect(page.locator('main#main-content')).toBeVisible();
    
    // Take screenshot
    await expect(page).toHaveScreenshot('wali.png', {
      fullPage: true,
    });
  });
});