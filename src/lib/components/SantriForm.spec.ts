import { test, expect } from '@playwright/experimental-ct-svelte';
import SantriForm from './SantriForm.svelte';

test.describe('SantriForm', () => {
  const defaultProps = {
    values: {},
    kamar: [{ id: 1, nomor: 1 }],
    kelas: [{ id: 1, tingkat: '1', rombel: 'A', tahun_ajaran: '2024/2025' }],
    wali: [{ id: '1', label: 'Wali Test' }],
    submitLabel: 'Simpan',
    cancelHref: '/cancel',
    customFields: []
  };

  test('renders all static field groups', async ({ mount }) => {
    await mount(SantriForm, { props: defaultProps });
    await expect(test.locator('text=Identitas')).toBeVisible();
    await expect(test.locator('text=Alamat & kontak')).toBeVisible();
    await expect(test.locator('text=Status & keaktifan')).toBeVisible();
    await expect(test.locator('text=Penempatan')).toBeVisible();
  });

  test('renders all identitas fields', async ({ mount }) => {
    await mount(SantriForm, { props: defaultProps });
    await expect(test.locator('label:has-text("Nama lengkap *")')).toBeVisible();
    await expect(test.locator('label:has-text("Nama panggilan")')).toBeVisible();
    await expect(test.locator('label:has-text("NISN")')).toBeVisible();
    await expect(test.locator('label:has-text("NIK")')).toBeVisible();
    await expect(test.locator('label:has-text("NIS")')).toBeVisible();
    await expect(test.locator('label:has-text("Tempat lahir")')).toBeVisible();
    await expect(test.locator('label:has-text("Tanggal lahir")')).toBeVisible();
    await expect(test.locator('label:has-text("Jenis kelamin")')).toBeVisible();
    await expect(test.locator('label:has-text("Agama")')).toBeVisible();
  });

  test('renders all alamat & kontak fields', async ({ mount }) => {
    await mount(SantriForm, { props: defaultProps });
    await expect(test.locator('label:has-text("Alamat")')).toBeVisible();
    await expect(test.locator('label:has-text("RT")')).toBeVisible();
    await expect(test.locator('label:has-text("RW")')).toBeVisible();
    await expect(test.locator('label:has-text("Desa/kelurahan")')).toBeVisible();
    await expect(test.locator('label:has-text("Kecamatan")')).toBeVisible();
    await expect(test.locator('label:has-text("Kabupaten")')).toBeVisible();
    await expect(test.locator('label:has-text("No. HP")')).toBeVisible();
    await expect(test.locator('label:has-text("Tempat tinggal")')).toBeVisible();
    await expect(test.locator('label:has-text("Transportasi ke sekolah")')).toBeVisible();
    await expect(test.locator('label:has-text("Anak ke")')).toBeVisible();
  });

  test('renders all status & keaktifan fields', async ({ mount }) => {
    await mount(SantriForm, { props: defaultProps });
    await expect(test.locator('label:has-text("Status santri *")')).toBeVisible();
    await expect(test.locator('label:has-text("Status keluarga")')).toBeVisible();
    await expect(test.locator('label:has-text("Tanggal masuk")')).toBeVisible();
    await expect(test.locator('label:has-text("Asal sekolah")')).toBeVisible();
    await expect(test.locator('label:has-text("Jalur masuk")')).toBeVisible();
    await expect(test.locator('label:has-text("Penerima bantuan (KIP/PIP/KPS/PKH)")')).toBeVisible();
  });

  test('renders penempatan fields with kamar, kelas, wali options', async ({ mount }) => {
    await mount(SantriForm, { props: defaultProps });
    const kamarSelect = test.locator('label:has-text("Kamar") ~ select');
    await expect(kamarSelect).toHaveValue('');
    await expect(test.locator('option:has-text("Kamar 1")')).toBeVisible();

    const kelasSelect = test.locator('label:has-text("Kelas") ~ select');
    await expect(test.locator('option:has-text("1 A (2024/2025)")')).toBeVisible();

    const waliSelect = test.locator('label:has-text("Wali santri") ~ select');
    await expect(test.locator('option:has-text("Wali Test")')).toBeVisible();
  });

  test('renders foto file input when gdrive is true', async ({ mount }) => {
    await mount(SantriForm, { props: { ...defaultProps, gdrive: true } });
    const fotoInput = test.locator('label:has-text("Foto profil") ~ input[type="file"]');
    await expect(fotoInput).toBeVisible();
    await expect(fotoInput).toHaveAttribute('accept', 'image/*');
  });

  test('renders foto URL input when gdrive is false', async ({ mount }) => {
    await mount(SantriForm, { props: { ...defaultProps, gdrive: false } });
    const fotoInput = test.locator('label:has-text("Foto (URL)") ~ input[type="text"]');
    await expect(fotoInput).toBeVisible();
  });

  test('prefills values when provided', async ({ mount }) => {
    await mount(SantriForm, {
      props: {
        ...defaultProps,
        values: {
          nama_lengkap: 'Test Santri',
          nisn: '1234567890',
          jenis_kelamin: 'L',
          status_santri: 'aktif'
        }
      }
    });
    await expect(test.locator('input[name="nama_lengkap"]')).toHaveValue('Test Santri');
    await expect(test.locator('input[name="nisn"]')).toHaveValue('1234567890');
    await expect(test.locator('select[name="jenis_kelamin"]')).toHaveValue('L');
    await expect(test.locator('select[name="status_santri"]')).toHaveValue('aktif');
  });

  test('renders custom fields group when customFields provided', async ({ mount }) => {
    await mount(SantriForm, {
      props: {
        ...defaultProps,
        customFields: [
          { id: 1, nama: 'cita_cita', label: 'Cita-cita', tipe: 'text', opsi: [] },
          { id: 2, nama: 'hobi', label: 'Hobi', tipe: 'select', opsi: [{ value: '1', label: 'Membaca' }] }
        ]
      }
    });
    await expect(test.locator('text=Field tambahan')).toBeVisible();
    await expect(test.locator('label:has-text("Cita-cita")')).toBeVisible();
    await expect(test.locator('label:has-text("Hobi")')).toBeVisible();
  });

  test('renders select for custom field with select type', async ({ mount }) => {
    await mount(SantriForm, {
      props: {
        ...defaultProps,
        customFields: [
          { id: 1, nama: 'hobi', label: 'Hobi', tipe: 'select', opsi: [{ value: '1', label: 'Membaca' }] },
        ],
        values: { custom: JSON.stringify({ hobi: 'Membaca' }) }
      }
    });
    const hobiSelect = test.locator('label:has-text("Hobi") ~ select');
    await expect(hobiSelect).toBeVisible();
    await expect(test.locator('option:has-text("Membaca")')).toBeVisible();
  });

  test('renders textarea for custom field with textarea type', async ({ mount }) => {
    await mount(SantriForm, {
      props: {
        ...defaultProps,
        customFields: [
          { id: 1, nama: 'catatan', label: 'Catatan', tipe: 'textarea', opsi: [] }
        ]
      }
    });
    const catatan = test.locator('label:has-text("Catatan") ~ textarea');
    await expect(catatan).toBeVisible();
  });

  test('renders date input for custom field with date type', async ({ mount }) => {
    await mount(SantriForm, {
      props: {
        ...defaultProps,
        customFields: [
          { id: 1, nama: 'tanggal_lulus', label: 'Tanggal Lulus', tipe: 'date', opsi: [] }
        ]
      }
    });
    const dateInput = test.locator('label:has-text("Tanggal Lulus") ~ input[type="date"]');
    await expect(dateInput).toBeVisible();
  });

  test('renders number input for custom field with number type', async ({ mount }) => {
    await mount(SantriForm, {
      props: {
        ...defaultProps,
        customFields: [
          { id: 1, nama: 'nilai', label: 'Nilai', tipe: 'number', opsi: [] }
        ]
      }
    });
    const numberInput = test.locator('label:has-text("Nilai") ~ input[type="number"]');
    await expect(numberInput).toBeVisible();
  });

  test('renders submit button with label', async ({ mount }) => {
    await mount(SantriForm, { props: defaultProps });
    await expect(test.locator('button:has-text("Simpan")')).toBeVisible();
  });

  test('renders cancel link', async ({ mount }) => {
    await mount(SantriForm, { props: defaultProps });
    const cancelLink = test.locator('a:has-text("Batal")');
    await expect(cancelLink).toHaveAttribute('href', '/cancel');
  });

  test('renders error alert when error prop provided', async ({ mount }) => {
    await mount(SantriForm, { props: { ...defaultProps, error: 'Validation error' } });
    await expect(test.locator('[role="alert"]')).toBeVisible();
    await expect(test.locator('text=Validation error')).toBeVisible();
  });

  test('shows loading state when submitting', async ({ mount }) => {
    await mount(SantriForm, { props: { ...defaultProps, submitting: true } });
    const submitButton = test.locator('button:has-text("Simpan")');
    await expect(submitButton).toHaveClass('loading');
    await expect(submitButton).toBeDisabled();
  });

  test('renders extra snippet when provided', async ({ mount }) => {
    await mount(SantriForm, {
      props: {
        ...defaultProps,
        extra: () => '<div class="extra">Extra field</div>'
      }
    });
    await expect(test.locator('text=Extra field')).toBeVisible();
  });

  test('uses action attribute when provided and no onSubmit', async ({ mount }) => {
    await mount(SantriForm, { props: { ...defaultProps, action: '/santri' } });
    const form = test.locator('form');
    await expect(form).toHaveAttribute('action', '/santri');
  });

  test('has correct form enctype for file uploads', async ({ mount }) => {
    await mount(SantriForm, { props: { ...defaultProps, gdrive: true } });
    const form = test.locator('form');
    await expect(form).toHaveAttribute('enctype', 'multipart/form-data');
  });

  test('passes accessibility test', async ({ mount }) => {
    await mount(SantriForm, { props: defaultProps });
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

  test('passes accessibility test with gdrive true', async ({ mount }) => {
    await mount(SantriForm, { props: { ...defaultProps, gdrive: true } });
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

  test('passes accessibility test with custom fields', async ({ mount }) => {
    await mount(SantriForm, {
      props: {
        ...defaultProps,
        customFields: [
          { id: 1, nama: 'test', label: 'Test', tipe: 'text', opsi: [] }
        ]
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
    await mount(SantriForm, { props: { ...defaultProps, error: 'Error' } });
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