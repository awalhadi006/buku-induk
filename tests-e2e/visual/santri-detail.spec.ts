import { test, expect } from '@playwright/test';
import { gotoAndWait, tryLogin } from './utils';

test.describe('Visual Regression: Santri Detail Page', () => {
  test('santri detail', async ({ page }) => {
    const loggedIn = await tryLogin(page);
    if (!loggedIn) {
      test.skip(true, 'Login failed - valid test credentials required');
      return;
    }
    
    // Navigate to santri list first to find a santri to view
    await gotoAndWait(page, '/santri');
    
    // Find first santri link and click it
    const firstSantriLink = page.locator('tbody tr:first-child td:first-child a').first();
    
    if (await firstSantriLink.count() > 0) {
      await firstSantriLink.click();
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await expect(page).toHaveScreenshot('santri-detail.png', {
        fullPage: true,
      });
    } else {
      // No santri data - test empty state
      await expect(page).toHaveScreenshot('santri-detail-empty.png', {
        fullPage: true,
      });
    }
  });
});