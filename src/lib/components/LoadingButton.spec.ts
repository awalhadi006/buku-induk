import { test, expect } from '@playwright/experimental-ct-svelte';
import LoadingButton from './LoadingButton.svelte';

test.describe('LoadingButton', () => {
  test('renders button with children when not loading', async ({ mount }) => {
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        loading: false
      }
    });
    const button = test.locator('button:has-text("Submit")');
    await expect(button).toBeVisible();
    await expect(button).not.toHaveClass('loading');
    await expect(test.locator('[role="status"]')).not.toBeVisible();
  });

  test('shows loading spinner when loading is true', async ({ mount }) => {
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        loading: true
      }
    });
    const button = test.locator('button:has-text("Submit")');
    await expect(button).toHaveClass('loading');
    await expect(test.locator('[role="status"]')).toBeVisible();
  });

  test('disables button when loading', async ({ mount }) => {
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        loading: true
      }
    });
    const button = test.locator('button:has-text("Submit")');
    await expect(button).toBeDisabled();
  });

  test('disables button when disabled prop is true', async ({ mount }) => {
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        disabled: true,
        loading: false
      }
    });
    const button = test.locator('button:has-text("Submit")');
    await expect(button).toBeDisabled();
  });

  test('applies variant classes correctly', async ({ mount }) => {
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        variant: 'secondary'
      }
    });
    const button = test.locator('button');
    await expect(button).toHaveClass('btn-secondary');
  });

  test('applies size classes correctly', async ({ mount }) => {
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        size: 'lg'
      }
    });
    const button = test.locator('button');
    await expect(button).toHaveClass('btn-lg');
  });

  test('applies custom class', async ({ mount }) => {
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        class: 'custom-class'
      }
    });
    const button = test.locator('button');
    await expect(button).toHaveClass('custom-class');
  });

  test('sets type attribute correctly', async ({ mount }) => {
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        type: 'button'
      }
    });
    const button = test.locator('button:has-text("Submit")');
    await expect(button).toHaveAttribute('type', 'button');
  });

  test('sets aria-label when provided', async ({ mount }) => {
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        ariaLabel: 'Submit form'
      }
    });
    const button = test.locator('button[aria-label="Submit form"]');
    await expect(button).toBeVisible();
  });

  test('sets aria-busy when loading', async ({ mount }) => {
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        loading: true
      }
    });
    const button = test.locator('button:has-text("Submit")');
    await expect(button).toHaveAttribute('aria-busy', 'true');
  });

  test('calls onClick handler when clicked', async ({ mount }) => {
    const handleClick = test.fn();
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        onclick: handleClick
      }
    });
    await test.locator('button:has-text("Submit")').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when disabled', async ({ mount }) => {
    const handleClick = test.fn();
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        disabled: true,
        onclick: handleClick
      }
    });
    await test.locator('button:has-text("Submit")').click();
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('does not call onClick when loading', async ({ mount }) => {
    const handleClick = test.fn();
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        loading: true,
        onclick: handleClick
      }
    });
    await test.locator('button:has-text("Submit")').click();
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('passes accessibility test in default state', async ({ mount }) => {
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit'
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

  test('passes accessibility test in loading state', async ({ mount }) => {
    await mount(LoadingButton, {
      props: {
        children: () => 'Submit',
        loading: true
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

  test('passes accessibility test with all variants', async ({ mount }) => {
    const variants = ['primary', 'secondary', 'success', 'warning', 'error', 'outline', 'ghost'] as const;
    for (const variant of variants) {
      await mount(LoadingButton, {
        props: {
          children: () => 'Submit',
          variant
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
    }
  });
});