import { test, expect } from '@playwright/experimental-ct-svelte';
import Select from './Select.svelte';

test.describe('Select', () => {
  const defaultOptions = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' }
  ];

  const defaultProps = {
    name: 'test-select',
    options: defaultOptions
  };

  test('renders select with placeholder option', async ({ mount }) => {
    await mount(Select, { props: defaultProps });
    const select = test.locator('select[aria-label="— Pilih —"]');
    await expect(select).toBeVisible();
    await expect(test.locator('option:has-text("— Pilih —")')).toBeVisible();
  });

  test('renders all options', async ({ mount }) => {
    await mount(Select, { props: defaultProps });
    await expect(test.locator('option:has-text("Option 1")')).toBeVisible();
    await expect(test.locator('option:has-text("Option 2")')).toBeVisible();
    await expect(test.locator('option:has-text("Option 3")')).toBeVisible();
  });

  test('binds value correctly', async ({ mount }) => {
    await mount(Select, { props: { ...defaultProps, value: '2' } });
    const select = test.locator('select');
    await expect(select).toHaveValue('2');
  });

  test('calls onChange when value changes', async ({ mount }) => {
    const handleChange = test.fn();
    await mount(Select, { props: { ...defaultProps, onChange: handleChange } });
    const select = test.locator('select');
    await select.selectOption('3');
    expect(handleChange).toHaveBeenCalledWith('3');
  });

  test('applies required attribute when required is true', async ({ mount }) => {
    await mount(Select, { props: { ...defaultProps, required: true } });
    const select = test.locator('select');
    await expect(select).toBeRequired();
  });

  test('does not apply required attribute when required is false', async ({ mount }) => {
    await mount(Select, { props: { ...defaultProps, required: false } });
    const select = test.locator('select');
    await expect(select).not.toBeRequired();
  });

  test('disables select when disabled is true', async ({ mount }) => {
    await mount(Select, { props: { ...defaultProps, disabled: true } });
    const select = test.locator('select');
    await expect(select).toBeDisabled();
  });

  test('enables select when disabled is false', async ({ mount }) => {
    await mount(Select, { props: { ...defaultProps, disabled: false } });
    const select = test.locator('select');
    await expect(select).not.toBeDisabled();
  });

  test('applies custom class', async ({ mount }) => {
    await mount(Select, { props: { ...defaultProps, class: 'custom-class' } });
    const select = test.locator('select');
    await expect(select).toHaveClass('custom-class');
  });

  test('renders with custom placeholder', async ({ mount }) => {
    await mount(Select, { props: { ...defaultProps, placeholder: 'Choose...' } });
    await expect(test.locator('option:has-text("Choose...")')).toBeVisible();
  });

  test('has correct daisyUI select classes', async ({ mount }) => {
    await mount(Select, { props: defaultProps });
    const select = test.locator('select');
    await expect(select).toHaveClass('select');
    await expect(select).toHaveClass('select-bordered');
    await expect(select).toHaveClass('w-full');
  });

  test('has label associated with select via for/id', async ({ mount }) => {
    await mount(Select, { props: defaultProps });
    const label = test.locator('label');
    const select = test.locator('select');
    await expect(label).toHaveAttribute('for', 'test-select');
    await expect(select).toHaveAttribute('id', 'test-select');
  });

  test('handles empty options array', async ({ mount }) => {
    await mount(Select, { props: { name: 'empty', options: [] } });
    const select = test.locator('select');
    await expect(select).toBeVisible();
    const options = select.locator('option');
    await expect(options).toHaveCount(1);
  });

  test('passes accessibility test', async ({ mount }) => {
    await mount(Select, { props: defaultProps });
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

  test('passes accessibility test when disabled', async ({ mount }) => {
    await mount(Select, { props: { ...defaultProps, disabled: true } });
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

  test('passes accessibility test when required', async ({ mount }) => {
    await mount(Select, { props: { ...defaultProps, required: true } });
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