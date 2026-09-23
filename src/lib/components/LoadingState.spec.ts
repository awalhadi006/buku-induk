import { test, expect } from '@playwright/experimental-ct-svelte';
import LoadingState from './LoadingState.svelte';

test.describe('LoadingState', () => {
  test('renders skeleton while promise is pending', async ({ mount }) => {
    const promise = new Promise(resolve => setTimeout(() => resolve('data'), 100));
    await mount(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text', rows: 2, count: 1 },
        children: (data) => `<div>${data}</div>`
      }
    });
    await expect(test.locator('[role="status"]')).toBeVisible();
    await expect(test.locator('text=data')).not.toBeVisible();
  });

  test('renders children when promise resolves with data', async ({ mount }) => {
    const promise = Promise.resolve('loaded data');
    await mount(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text', rows: 1 },
        children: (data) => `<div class="result">${data}</div>`
      }
    });
    await expect(test.locator('text=loaded data')).toBeVisible({ timeout: 5000 });
  });

  test('renders empty snippet when promise resolves with null', async ({ mount }) => {
    const promise = Promise.resolve(null);
    await mount(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text' },
        empty: () => '<div class="empty">No data</div>',
        children: () => '<div>Has data</div>'
      }
    });
    await expect(test.locator('text=No data')).toBeVisible({ timeout: 5000 });
    await expect(test.locator('text=Has data')).not.toBeVisible();
  });

  test('renders empty snippet when promise resolves with empty array', async ({ mount }) => {
    const promise = Promise.resolve([]);
    await mount(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text' },
        empty: () => '<div class="empty">No items</div>',
        children: () => '<div>Has items</div>'
      }
    });
    await expect(test.locator('text=No items')).toBeVisible({ timeout: 5000 });
  });

  test('renders error alert when promise rejects', async ({ mount }) => {
    const promise = Promise.reject(new Error('Failed to load'));
    await mount(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text' },
        children: () => '<div>Data</div>'
      }
    });
    await expect(test.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(test.locator('text=Gagal memuat: Failed to load')).toBeVisible();
  });

  test('renders error alert with unknown error message when error has no message', async ({ mount }) => {
    const promise = Promise.reject('string error');
    await mount(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text' },
        children: () => '<div>Data</div>'
      }
    });
    await expect(test.locator('text=Gagal memuat: string error')).toBeVisible({ timeout: 5000 });
  });

  test('renders text variant skeleton correctly', async ({ mount }) => {
    const promise = new Promise(() => {});
    await mount(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text', rows: 3, count: 2 },
        children: () => '<div>Data</div>'
      }
    });
    const skeletons = test.locator('.skeleton.skeleton-text');
    await expect(skeletons).toHaveCount(6);
  });

  test('renders card variant skeleton correctly', async ({ mount }) => {
    const promise = new Promise(() => {});
    await mount(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'card', count: 3 },
        children: () => '<div>Data</div>'
      }
    });
    const skeletons = test.locator('.skeleton.h-32');
    await expect(skeletons).toHaveCount(3);
  });

  test('renders table variant skeleton correctly', async ({ mount }) => {
    const promise = new Promise(() => {});
    await mount(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'table', rows: 2, cols: 4 },
        children: () => '<div>Data</div>'
      }
    });
    const rowContainers = test.locator('[style*="grid-template-columns"]');
    await expect(rowContainers).toHaveCount(2);
    const skeletons = test.locator('.skeleton.h-10');
    await expect(skeletons).toHaveCount(8);
  });

  test('renders stat variant skeleton correctly', async ({ mount }) => {
    const promise = new Promise(() => {});
    await mount(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'stat', count: 4 },
        children: () => '<div>Data</div>'
      }
    });
    const skeletons = test.locator('.skeleton.h-16');
    await expect(skeletons).toHaveCount(4);
  });

  test('does not render skeleton when no skeleton config provided', async ({ mount }) => {
    const promise = new Promise(() => {});
    await mount(LoadingState, {
      props: {
        data: promise,
        children: () => '<div>Data</div>'
      }
    });
    await expect(test.locator('[role="status"]')).not.toBeVisible();
  });

  test('passes accessibility test with skeleton', async ({ mount }) => {
    const promise = new Promise(() => {});
    await mount(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text', rows: 1 },
        children: () => '<div>Data</div>'
      }
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

  test('passes accessibility test with error state', async ({ mount }) => {
    const promise = Promise.reject(new Error('Error'));
    await mount(LoadingState, {
      props: {
        data: promise,
        skeleton: { variant: 'text' },
        children: () => '<div>Data</div>'
      }
    });
    await expect(test.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
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