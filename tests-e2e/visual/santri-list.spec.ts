import { test, expect } from '@playwright/test';
import { gotoAndWait, tryLogin } from './utils';

test.describe('Visual Regression: Santri List Page', () => {
  test('santri list', async ({ page }) => {
    const loggedIn = await tryLogin(page);
    if (!loggedIn) {
      test.skip(true, 'Login failed - valid test credentials required');
      return;
    }
    
    await gotoAndWait(page, '/santri');
    
    // Wait for santri table or empty state
    await expect(page.locator('main#main-content')).toBeVisible();
    
    // Take screenshot
    await expect(page).toHaveScreenshot('santri-list.png', {
      fullPage: true,
    });
  });
});