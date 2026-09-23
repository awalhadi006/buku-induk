import { test, expect } from '@playwright/experimental-ct-svelte';
import BarList from './BarList.svelte';

test.describe('BarList', () => {
  const defaultRows = [
    { label: 'Label 1', value: 50 },
    { label: 'Label 2', value: 30 },
    { label: 'Label 3', value: 20 }
  ];

  test('renders all rows with labels and values', async ({ mount }) => {
    await mount(BarList, { props: { rows: defaultRows, max: 100 } });
    await expect(test.locator('text=Label 1')).toBeVisible();
    await expect(test.locator('text=Label 2')).toBeVisible();
    await expect(test.locator('text=Label 3')).toBeVisible();
    await expect(test.locator('text=50')).toBeVisible();
    await expect(test.locator('text=30')).toBeVisible();
    await expect(test.locator('text=20')).toBeVisible();
  });

  test('calculates bar widths correctly based on max', async ({ mount }) => {
    await mount(BarList, { props: { rows: defaultRows, max: 100 } });
    const bars = test.locator('.bg-primary');
    await expect(bars).toHaveCount(3);
    await expect(bars.nth(0)).toHaveCSS('width', '50%');
    await expect(bars.nth(1)).toHaveCSS('width', '30%');
    await expect(bars.nth(2)).toHaveCSS('width', '20%');
  });

  test('handles zero max value', async ({ mount }) => {
    await mount(BarList, { props: { rows: defaultRows, max: 0 } });
    const bars = test.locator('.bg-primary');
    await expect(bars).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(bars.nth(i)).toHaveCSS('width', '0%');
    }
  });

  test('renders empty state message when rows array is empty', async ({ mount }) => {
    await mount(BarList, { props: { rows: [], max: 100 } });
    await expect(test.locator('text=Belum ada data.')).toBeVisible();
  });

  test('handles single row', async ({ mount }) => {
    await mount(BarList, { props: { rows: [{ label: 'Single', value: 42 }], max: 100 } });
    await expect(test.locator('text=Single')).toBeVisible();
    await expect(test.locator('text=42')).toBeVisible();
  });

  test('handles values exceeding max', async ({ mount }) => {
    await mount(BarList, { props: { rows: [{ label: 'Over', value: 150 }], max: 100 } });
    const bar = test.locator('.bg-primary');
    await expect(bar).toHaveCSS('width', '150%');
  });

  test('has correct structure with flex layout', async ({ mount }) => {
    await mount(BarList, { props: { rows: defaultRows, max: 100 } });
    const rowElements = test.locator('.flex.items-center.gap-3.py-1\\.5');
    await expect(rowElements).toHaveCount(3);
  });

  test('passes accessibility test', async ({ mount }) => {
    await mount(BarList, { props: { rows: defaultRows, max: 100 } });
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

  test('passes accessibility test with empty rows', async ({ mount }) => {
    await mount(BarList, { props: { rows: [], max: 100 } });
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