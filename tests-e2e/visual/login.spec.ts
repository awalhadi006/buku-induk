import { test, expect } from '@playwright/test';
import { gotoAndWait } from './utils';

test.describe('Visual Regression: Login Page', () => {
  test('login page', async ({ page }) => {
    await gotoAndWait(page, '/login');
    
    // Wait for form to be visible
    await expect(page.locator('#login-form')).toBeVisible();
    
    // Take screenshot
    await expect(page).toHaveScreenshot('login.png', {
      fullPage: true,
    });
  });
});