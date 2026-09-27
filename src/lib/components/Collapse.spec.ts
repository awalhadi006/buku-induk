import { test, expect } from '@playwright/experimental-ct-svelte';
import Collapse from './Collapse.svelte';

test.describe('Collapse', () => {
  test('renders children when open is true', async ({ mount }) => {
    await mount(Collapse, {
      props: {
        open: true,
        children: () => '<div class="content">Hidden content</div>'
      }
    });
    await expect(test.locator('text=Hidden content')).toBeVisible();
  });

  test('does not render children when open is false', async ({ mount }) => {
    await mount(Collapse, {
      props: {
        open: false,
        children: () => '<div class="content">Hidden content</div>'
      }
    });
    await expect(test.locator('text=Hidden content')).not.toBeVisible();
  });

  test('toggles open state when checkbox is clicked', async ({ mount }) => {
    await mount(Collapse, {
      props: {
        open: false,
        children: () => '<div class="content">Hidden content</div>'
      }
    });
    const checkbox = test.locator('[role="checkbox"]');
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(test.locator('text=Hidden content')).toBeVisible();

    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
    await expect(test.locator('text=Hidden content')).not.toBeVisible();
  });

  test('binds open prop correctly', async ({ mount }) => {
    await mount(Collapse, {
      props: {
        open: false,
        children: () => '<div class="content">Hidden content</div>'
      }
    });
    await expect(test.locator('text=Hidden content')).not.toBeVisible();

    // Remount with open: true to test reactivity
    await mount(Collapse, {
      props: {
        open: true,
        children: () => '<div class="content">Hidden content</div>'
      }
    });
    await expect(test.locator('text=Hidden content')).toBeVisible();
  });

  test('uses custom duration', async ({ mount }) => {
    await mount(Collapse, {
      props: {
        open: true,
        duration: 500,
        children: () => '<div class="content">Hidden content</div>'
      }
    });
    const collapse = test.locator('.collapse');
    await expect(collapse).toBeVisible();
  });

  test('has correct daisyUI collapse classes', async ({ mount }) => {
    await mount(Collapse, {
      props: {
        open: false,
        children: () => '<div>Content</div>'
      }
    });
    const collapse = test.locator('.collapse');
    await expect(collapse).toHaveClass('collapse');
    await expect(collapse).toHaveClass('collapse-arrow');
  });

  test('renders checkbox input', async ({ mount }) => {
    await mount(Collapse, {
      props: {
        open: false,
        children: () => '<div>Content</div>'
      }
    });
    const checkbox = test.locator('[role="checkbox"]');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  test('renders collapse-content div', async ({ mount }) => {
    await mount(Collapse, {
      props: {
        open: true,
        children: () => '<div>Content</div>'
      }
    });
    const content = test.locator('.collapse-content');
    await expect(content).toBeVisible();
  });

  test('passes accessibility test when closed', async ({ mount }) => {
    await mount(Collapse, {
      props: {
        open: false,
        children: () => '<div>Content</div>'
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

  test('passes accessibility test when open', async ({ mount }) => {
    await mount(Collapse, {
      props: {
        open: true,
        children: () => '<div>Content</div>'
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

  test('passes accessibility test with complex children', async ({ mount }) => {
    await mount(Collapse, {
      props: {
        open: true,
        children: () => `
          <div>
            <h3>Title</h3>
            <p>Some paragraph</p>
            <button>Action</button>
          </div>
        `
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