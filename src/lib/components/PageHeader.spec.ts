import { test, expect } from '@playwright/experimental-ct-svelte';
import PageHeader from './PageHeader.svelte';

test.describe('PageHeader', () => {
  test('renders title and description', async ({ mount }) => {
    await mount(PageHeader, { props: { title: 'Test Title', desc: 'Test description' } });
    await expect(test.locator('h1')).toHaveText('Test Title');
    await expect(test.locator('text=Test description')).toBeVisible();
  });

  test('renders without description when not provided', async ({ mount }) => {
    await mount(PageHeader, { props: { title: 'Test Title' } });
    await expect(test.locator('h1')).toHaveText('Test Title');
    await expect(test.locator('text=Test description')).not.toBeVisible();
  });

  test('renders back link when backHref is provided', async ({ mount }) => {
    await mount(PageHeader, { props: { title: 'Test Title', backHref: '/back' } });
    const backLink = test.locator('a[aria-label="Kembali"]');
    await expect(backLink).toHaveAttribute('href', '/back');
  });

  test('does not render back link when backHref is not provided', async ({ mount }) => {
    await mount(PageHeader, { props: { title: 'Test Title' } });
    await expect(test.locator('a[aria-label="Kembali"]')).not.toBeVisible();
  });

  test('renders actions snippet when provided', async ({ mount }) => {
    await mount(PageHeader, {
      props: {
        title: 'Test Title',
        actions: () => '<button class="btn btn-primary">Action</button>'
      }
    });
    await expect(test.locator('button:has-text("Action")')).toBeVisible();
  });

  test('has correct daisyUI card classes', async ({ mount }) => {
    await mount(PageHeader, { props: { title: 'Test Title' } });
    const card = test.locator('.card');
    await expect(card).toHaveClass('card');
    await expect(card).toHaveClass('card-border');
    await expect(card).toHaveClass('sm:card-side');
  });

  test('passes accessibility test', async ({ mount }) => {
    await mount(PageHeader, { props: { title: 'Test Title', desc: 'Test description', backHref: '/back' } });
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