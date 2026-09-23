import { test, expect } from '@playwright/experimental-ct-svelte';
import WaliForm from './WaliForm.svelte';

test.describe('WaliForm', () => {
  const defaultProps = {
    submitLabel: 'Simpan',
    cancelHref: '/cancel',
    values: {}
  };

  test('renders form with all field groups', async ({ mount }) => {
    await mount(WaliForm, { props: defaultProps });
    await expect(test.locator('text=Data ayah')).toBeVisible();
    await expect(test.locator('text=Data ibu')).toBeVisible();
    await expect(test.locator('text=Wali & kontak')).toBeVisible();
  });

  test('renders all ayah fields', async ({ mount }) => {
    await mount(WaliForm, { props: defaultProps });
    await expect(test.locator('label:has-text("Nama ayah")')).toBeVisible();
    await expect(test.locator('label:has-text("Pekerjaan ayah")')).toBeVisible();
  });

  test('renders all ibu fields', async ({ mount }) => {
    await mount(WaliForm, { props: defaultProps });
    await expect(test.locator('label:has-text("Nama ibu")')).toBeVisible();
    await expect(test.locator('label:has-text("Pekerjaan ibu")')).toBeVisible();
  });

  test('renders all wali & kontak fields', async ({ mount }) => {
    await mount(WaliForm, { props: defaultProps });
    await expect(test.locator('label:has-text("Nama wali")')).toBeVisible();
    await expect(test.locator('label:has-text("Penghasilan keluarga")')).toBeVisible();
    await expect(test.locator('label:has-text("No. HP")')).toBeVisible();
    await expect(test.locator('label:has-text("Alamat")')).toBeVisible();
  });

  test('prefills values when provided', async ({ mount }) => {
    await mount(WaliForm, {
      props: {
        ...defaultProps,
        values: {
          nama_ayah: 'Budi',
          pekerjaan_ayah: 'Guru',
          nama_ibu: 'Siti',
          pekerjaan_ibu: 'Dokter',
          nama_wali: 'Pak Budi',
          penghasilan: '5000000',
          no_hp: '081234567890',
          alamat: 'Jl. Test No. 123'
        }
      }
    });
    await expect(test.locator('input[name="nama_ayah"]')).toHaveValue('Budi');
    await expect(test.locator('input[name="pekerjaan_ayah"]')).toHaveValue('Guru');
    await expect(test.locator('input[name="nama_ibu"]')).toHaveValue('Siti');
    await expect(test.locator('input[name="pekerjaan_ibu"]')).toHaveValue('Dokter');
    await expect(test.locator('input[name="nama_wali"]')).toHaveValue('Pak Budi');
    await expect(test.locator('input[name="penghasilan"]')).toHaveValue('5000000');
    await expect(test.locator('input[name="no_hp"]')).toHaveValue('081234567890');
    await expect(test.locator('textarea[name="alamat"]')).toHaveValue('Jl. Test No. 123');
  });

  test('renders textarea for alamat field', async ({ mount }) => {
    await mount(WaliForm, { props: defaultProps });
    const alamat = test.locator('textarea[name="alamat"]');
    await expect(alamat).toBeVisible();
    await expect(alamat).toHaveAttribute('rows', '3');
  });

  test('renders input for other fields', async ({ mount }) => {
    await mount(WaliForm, { props: defaultProps });
    await expect(test.locator('input[name="nama_ayah"]')).toBeVisible();
    await expect(test.locator('input[name="pekerjaan_ayah"]')).toBeVisible();
  });

  test('renders submit button with label', async ({ mount }) => {
    await mount(WaliForm, { props: defaultProps });
    await expect(test.locator('button:has-text("Simpan")')).toBeVisible();
  });

  test('renders cancel link', async ({ mount }) => {
    await mount(WaliForm, { props: defaultProps });
    const cancelLink = test.locator('a:has-text("Batal")');
    await expect(cancelLink).toHaveAttribute('href', '/cancel');
  });

  test('renders error alert when error prop provided', async ({ mount }) => {
    await mount(WaliForm, { props: { ...defaultProps, error: 'Validation error' } });
    await expect(test.locator('[role="alert"]')).toBeVisible();
    await expect(test.locator('text=Validation error')).toBeVisible();
  });

  test('shows loading state when submitting', async ({ mount }) => {
    await mount(WaliForm, { props: { ...defaultProps, submitting: true } });
    const submitButton = test.locator('button:has-text("Simpan")');
    await expect(submitButton).toHaveClass('loading');
    await expect(submitButton).toBeDisabled();
  });

  test('renders extra snippet when provided', async ({ mount }) => {
    await mount(WaliForm, {
      props: {
        ...defaultProps,
        extra: () => '<div class="extra">Extra field</div>'
      }
    });
    await expect(test.locator('text=Extra field')).toBeVisible();
  });

  test('uses action attribute when provided and no onSubmit', async ({ mount }) => {
    await mount(WaliForm, { props: { ...defaultProps, action: '/wali' } });
    const form = test.locator('form');
    await expect(form).toHaveAttribute('action', '/wali');
  });

  test('calls onSubmit when form submitted', async ({ mount }) => {
    const onSubmit = test.fn();
    await mount(WaliForm, { props: { ...defaultProps, onSubmit } });
    const submitButton = test.locator('button:has-text("Simpan")');
    await submitButton.click();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('has correct form enctype for file uploads', async ({ mount }) => {
    await mount(WaliForm, { props: defaultProps });
    const form = test.locator('form');
    await expect(form).toHaveAttribute('enctype', 'multipart/form-data');
  });

  test('passes accessibility test', async ({ mount }) => {
    await mount(WaliForm, { props: defaultProps });
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

  test('passes accessibility test with values', async ({ mount }) => {
    await mount(WaliForm, {
      props: {
        ...defaultProps,
        values: {
          nama_ayah: 'Budi',
          alamat: 'Jl. Test'
        }
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

  test('passes accessibility test with error', async ({ mount }) => {
    await mount(WaliForm, { props: { ...defaultProps, error: 'Error' } });
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