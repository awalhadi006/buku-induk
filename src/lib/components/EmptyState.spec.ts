import { test, expect } from '@playwright/experimental-ct-svelte';
import EmptyState from './EmptyState.svelte';

test.describe('EmptyState', () => {
  test('renders title', async ({ mount }) => {
    await mount(EmptyState, { props: { title: 'No data found' } });
    await expect(test.locator('text=No data found')).toBeVisible();
  });

  test('renders description when provided', async ({ mount }) => {
    await mount(EmptyState, { props: { title: 'No data', desc: 'Try adjusting your filters' } });
    await expect(test.locator('text=Try adjusting your filters')).toBeVisible();
  });

  test('does not render description when not provided', async ({ mount }) => {
    await mount(EmptyState, { props: { title: 'No data' } });
    await expect(test.locator('text=Try adjusting your filters')).not.toBeVisible();
  });

  test('renders children snippet when provided', async ({ mount }) => {
    await mount(EmptyState, {
      props: {
        title: 'No data',
        children: () => '<button class="btn btn-primary">Add new</button>'
      }
    });
    await expect(test.locator('button:has-text("Add new")')).toBeVisible();
  });

  test('has correct daisyUI classes and role', async ({ mount }) => {
    await mount(EmptyState, { props: { title: 'No data' } });
    const container = test.locator('[role="status"]');
    await expect(container).toHaveClass('card');
    await expect(container).toHaveClass('card-dash');
    await expect(container).toHaveClass('card-border');
    await expect(container).toHaveClass('bg-base-200/40');
    await expect(container).toHaveClass('empty-state');
  });

  test('passes accessibility test', async ({ mount }) => {
    await mount(EmptyState, { props: { title: 'No data', desc: 'Try again' } });
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

  test('passes accessibility test with children', async ({ mount }) => {
    await mount(EmptyState, {
      props: {
        title: 'No data',
        children: () => '<button class="btn btn-primary">Add</button>'
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
});