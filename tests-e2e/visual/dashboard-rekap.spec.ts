import { test, expect } from '@playwright/test';
import { gotoAndWait, tryLogin, takeSnapshot } from './visual-utils';

test.describe('Visual Regression: Dashboard Page', () => {
  test('dashboard', async ({ page }) => {
    const loggedIn = await tryLogin(page);
    if (!loggedIn) {
      test.skip(true, 'Login failed - valid test credentials required');
      return;
    }

    await gotoAndWait(page, '/');

    // Wait for main content
    await expect(page.locator('main#main-content')).toBeVisible();

    // Take screenshot with full page
    await takeSnapshot(page, 'dashboard', { fullPage: true });
  });
});

test.describe('Visual Regression: Rekap Page', () => {
  test('rekap', async ({ page }) => {
    const loggedIn = await tryLogin(page);
    if (!loggedIn) {
      test.skip(true, 'Login failed - valid test credentials required');
      return;
    }

    await gotoAndWait(page, '/rekap');

    // Wait for main content
    await expect(page.locator('main#main-content')).toBeVisible();

    // Take screenshot with full page
    await takeSnapshot(page, 'rekap', { fullPage: true });
  });
});