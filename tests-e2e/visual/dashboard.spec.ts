import { test, expect } from '@playwright/test';
import { gotoAndWait, tryLogin } from './utils';

test.describe('Visual Regression: Dashboard Page', () => {
  test('dashboard', async ({ page }) => {
    const loggedIn = await tryLogin(page);
    if (!loggedIn) {
      test.skip(true, 'Login failed - valid test credentials required');
      return;
    }
    
    await gotoAndWait(page, '/');
    
    // Wait for dashboard content
    await expect(page.locator('main#main-content')).toBeVisible();
    
    // Take screenshot
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
    });
  });
});