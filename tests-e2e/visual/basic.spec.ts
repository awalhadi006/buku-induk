import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('#login-form')).toBeVisible();
});