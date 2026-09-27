import { test, expect } from '@playwright/experimental-ct-svelte';
import Skeleton from './Skeleton.svelte';

test.describe('Skeleton', () => {
  test('renders text variant by default', async ({ mount }) => {
    await mount(Skeleton, { props: {} });
    await expect(test.locator('[role="status"]')).toBeVisible();
    await expect(test.locator('[role="status"]')).toHaveAttribute('aria-busy', 'true');
    await expect(test.locator('[role="status"]')).toHaveAttribute('aria-label', 'Memuat konten...');
    const skeletons = test.locator('.skeleton.skeleton-text');
    await expect(skeletons).toHaveCount(1);
  });

  test('renders text variant with custom rows and count', async ({ mount }) => {
    await mount(Skeleton, { props: { variant: 'text', rows: 3, count: 2 } });
    const skeletons = test.locator('.skeleton.skeleton-text');
    await expect(skeletons).toHaveCount(6);
  });

  test('renders card variant', async ({ mount }) => {
    await mount(Skeleton, { props: { variant: 'card', count: 3 } });
    const skeletons = test.locator('.skeleton.h-32');
    await expect(skeletons).toHaveCount(3);
  });

  test('renders table variant', async ({ mount }) => {
    await mount(Skeleton, { props: { variant: 'table', rows: 2, cols: 4 } });
    const rowContainers = test.locator('[style*="grid-template-columns"]');
    await expect(rowContainers).toHaveCount(2);
    const skeletons = test.locator('.skeleton.h-10');
    await expect(skeletons).toHaveCount(8);
  });

  test('renders stat variant', async ({ mount }) => {
    await mount(Skeleton, { props: { variant: 'stat', count: 4 } });
    const skeletons = test.locator('.skeleton.h-16');
    await expect(skeletons).toHaveCount(4);
  });

  test('applies custom class', async ({ mount }) => {
    await mount(Skeleton, { props: { class: 'custom-skeleton' } });
    const wrapper = test.locator('.space-y-3');
    await expect(wrapper).toHaveClass('custom-skeleton');
  });

  test('uses custom ariaLabel', async ({ mount }) => {
    await mount(Skeleton, { props: { ariaLabel: 'Loading data...' } });
    await expect(test.locator('[role="status"]')).toHaveAttribute('aria-label', 'Loading data...');
  });

  test('has correct role and aria attributes', async ({ mount }) => {
    await mount(Skeleton, { props: {} });
    const status = test.locator('[role="status"]');
    await expect(status).toHaveAttribute('role', 'status');
    await expect(status).toHaveAttribute('aria-busy', 'true');
    await expect(status).toHaveAttribute('aria-label');
  });

  test('passes accessibility test for text variant', async ({ mount }) => {
    await mount(Skeleton, { props: { variant: 'text', rows: 2, count: 2 } });
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

  test('passes accessibility test for card variant', async ({ mount }) => {
    await mount(Skeleton, { props: { variant: 'card', count: 2 } });
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

  test('passes accessibility test for table variant', async ({ mount }) => {
    await mount(Skeleton, { props: { variant: 'table', rows: 2, cols: 3 } });
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

  test('passes accessibility test for stat variant', async ({ mount }) => {
    await mount(Skeleton, { props: { variant: 'stat', count: 3 } });
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

  test('passes accessibility test with custom ariaLabel', async ({ mount }) => {
    await mount(Skeleton, { props: { ariaLabel: 'Custom loading message' } });
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