import { test, expect } from '@playwright/test';
import { gotoAndWait, takeSnapshot } from './visual-utils';

test.describe('Visual Regression: Dashboard Page (Unauthorized)', () => {
  test('dashboard unauthorized', async ({ page }) => {
    await gotoAndWait(page, '/');
    
    // Wait for main content or error message
    await expect(page.locator('main#main-content, [role="alert"], .card, .empty-state')).toBeVisible({ timeout: 10000 });
    
    // Take screenshot with full page
    await takeSnapshot(page, 'dashboard-unauthorized', { fullPage: true });
  });
});

test.describe('Visual Regression: Rekap Page (Unauthorized)', () => {
  test('rekap unauthorized', async ({ page }) => {
    await gotoAndWait(page, '/rekap');
    
    // Wait for main content or error message
    await expect(page.locator('main#main-content, [role="alert"], .card, .empty-state')).toBeVisible({ timeout: 10000 });
    
    // Take screenshot with full page
    await takeSnapshot(page, 'rekap-unauthorized', { fullPage: true });
  });
});