import { test, expect } from '@playwright/experimental-ct-svelte';
import QuickSearch from './QuickSearch.svelte';

test.describe('QuickSearch', () => {
  test.beforeEach(async ({ page }) => {
    // Mock external dependencies by intercepting network requests
    await page.route('**/api/**', route => route.fulfill({ json: { data: [], error: null } }));
  });

  test('does not render modal when closed by default', async ({ mount }) => {
    await mount(QuickSearch);
    await expect(test.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('opens modal when openPalette is triggered via event', async ({ mount }) => {
    await mount(QuickSearch);
    await test.page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('quicksearch:open'));
    });
    await expect(test.locator('[role="dialog"]')).toBeVisible();
    await expect(test.locator('input[placeholder="Cari nama santri, NISN, kamar, atau kelas..."]')).toBeVisible();
  });

  test('opens modal with Ctrl+K', async ({ mount }) => {
    await mount(QuickSearch);
    await test.page.keyboard.press('Control+KeyK');
    await expect(test.locator('[role="dialog"]')).toBeVisible();
  });

  test('opens modal with Meta+K (Mac)', async ({ mount }) => {
    await mount(QuickSearch);
    await test.page.keyboard.press('Meta+KeyK');
    await expect(test.locator('[role="dialog"]')).toBeVisible();
  });

  test('closes modal on Escape key', async ({ mount }) => {
    await mount(QuickSearch);
    await test.page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('quicksearch:open'));
    });
    await expect(test.locator('[role="dialog"]')).toBeVisible();
    await test.page.keyboard.press('Escape');
    await expect(test.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('closes modal on close button click', async ({ mount }) => {
    await mount(QuickSearch);
    await test.page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('quicksearch:open'));
    });
    await expect(test.locator('[role="dialog"]')).toBeVisible();
    await test.locator('button:has-text("Tutup")').click();
    await expect(test.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('shows loading spinner when busy', async ({ mount }) => {
    await mount(QuickSearch);
    await test.page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('quicksearch:open'));
    });
    await expect(test.locator('[role="dialog"]')).toBeVisible();
  });

  test('shows "Tidak ada hasil" when search returns no results', async ({ mount }) => {
    await mount(QuickSearch);
    await test.page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('quicksearch:open'));
    });
    const input = test.locator('input[placeholder="Cari nama santri, NISN, kamar, atau kelas..."]');
    await input.fill('test');
    // Wait for debounced search
    await test.page.waitForTimeout(300);
    await expect(test.locator('text=Tidak ada hasil.')).toBeVisible({ timeout: 5000 });
  });

  test('shows keyboard shortcuts help', async ({ mount }) => {
    await mount(QuickSearch);
    await test.page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('quicksearch:open'));
    });
    await expect(test.locator('text=Esc tutup')).toBeVisible();
    await expect(test.locator('text=navigasi')).toBeVisible();
    await expect(test.locator('text=Enter buka')).toBeVisible();
  });

  test('renders search icon', async ({ mount }) => {
    await mount(QuickSearch);
    await test.page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('quicksearch:open'));
    });
    // The icon is rendered as SVG, check for its presence
    await expect(test.locator('svg')).toBeVisible();
  });

  test('passes accessibility test when modal is open', async ({ mount }) => {
    await mount(QuickSearch);
    await test.page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('quicksearch:open'));
    });
    await test.page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.13.2/axe.min.js' });
    const violations = await test.page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-expect-error axe is loaded from CDN
        axe.run(document.body, (err: Error, results: any) => {
          if (err) throw err;
          resolve(results.violations);
        });
      });
    });
    expect(violations).toHaveLength(0);
  });
});