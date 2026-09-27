import { test, expect } from '@playwright/experimental-ct-svelte';
import FormShell from './FormShell.svelte';

test.describe('FormShell', () => {
  const defaultProps = {
    submitLabel: 'Simpan',
    cancelHref: '/cancel',
    children: () => '<input name="test" class="input input-bordered" />'
  };

  test('renders form with children', async ({ mount }) => {
    await mount(FormShell, { props: defaultProps });
    await expect(test.locator('input[name="test"]')).toBeVisible();
  });

  test('renders submit button with label', async ({ mount }) => {
    await mount(FormShell, { props: defaultProps });
    await expect(test.locator('button:has-text("Simpan")')).toBeVisible();
  });

  test('renders cancel link with href', async ({ mount }) => {
    await mount(FormShell, { props: defaultProps });
    const cancelLink = test.locator('a:has-text("Batal")');
    await expect(cancelLink).toHaveAttribute('href', '/cancel');
  });

  test('renders error alert when error prop is provided', async ({ mount }) => {
    await mount(FormShell, { props: { ...defaultProps, error: 'Something went wrong' } });
    await expect(test.locator('[role="alert"]')).toBeVisible();
    await expect(test.locator('text=Something went wrong')).toBeVisible();
  });

  test('does not render error alert when error is null', async ({ mount }) => {
    await mount(FormShell, { props: { ...defaultProps, error: null } });
    await expect(test.locator('[role="alert"]')).not.toBeVisible();
  });

  test('does not render error alert when error is undefined', async ({ mount }) => {
    await mount(FormShell, { props: { ...defaultProps, error: undefined } });
    await expect(test.locator('[role="alert"]')).not.toBeVisible();
  });

  test('shows loading state on submit button when submitting', async ({ mount }) => {
    await mount(FormShell, { props: { ...defaultProps, submitting: true } });
    const submitButton = test.locator('button:has-text("Simpan")');
    await expect(submitButton).toHaveClass('loading');
    await expect(submitButton).toBeDisabled();
  });

  test('sets form action when action prop provided and no onSubmit', async ({ mount }) => {
    await mount(FormShell, { props: { ...defaultProps, action: '/submit' } });
    const form = test.locator('form');
    await expect(form).toHaveAttribute('action', '/submit');
  });

  test('does not set form action when onSubmit is provided', async ({ mount }) => {
    const onSubmit = test.fn();
    await mount(FormShell, { props: { ...defaultProps, action: '/submit', onSubmit } });
    const form = test.locator('form');
    await expect(form).not.toHaveAttribute('action');
  });

  test('calls onSubmit handler and prevents default when onSubmit provided', async ({ mount }) => {
    const onSubmit = test.fn();
    await mount(FormShell, { props: { ...defaultProps, onSubmit } });
    const form = test.locator('form');
    await form.evaluate((el: HTMLFormElement) => el.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('renders extra snippet when provided', async ({ mount }) => {
    await mount(FormShell, {
      props: {
        ...defaultProps,
        extra: () => '<div class="extra">Extra content</div>'
      }
    });
    await expect(test.locator('text=Extra content')).toBeVisible();
  });

  test('has correct form enctype for file uploads', async ({ mount }) => {
    await mount(FormShell, { props: defaultProps });
    const form = test.locator('form');
    await expect(form).toHaveAttribute('enctype', 'multipart/form-data');
  });

  test('has correct daisyUI card classes', async ({ mount }) => {
    await mount(FormShell, { props: defaultProps });
    const card = test.locator('.card');
    await expect(card).toHaveClass('card');
    await expect(card).toHaveClass('card-border');
  });

  test('passes accessibility test with no error', async ({ mount }) => {
    await mount(FormShell, { props: defaultProps });
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

  test('passes accessibility test with error', async ({ mount }) => {
    await mount(FormShell, { props: { ...defaultProps, error: 'Error message' } });
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

  test('passes accessibility test with submitting state', async ({ mount }) => {
    await mount(FormShell, { props: { ...defaultProps, submitting: true } });
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

  test('passes accessibility test with extra content', async ({ mount }) => {
    await mount(FormShell, {
      props: {
        ...defaultProps,
        extra: () => '<div class="extra">Extra</div>'
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