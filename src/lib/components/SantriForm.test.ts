import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import SantriForm from '$lib/components/SantriForm.svelte';

describe('SantriForm', () => {
  const defaultProps = {
    values: {},
    kamar: [{ id: 1, nomor: 1 }],
    kelas: [{ id: 1, tingkat: '1', rombel: 'A', tahun_ajaran: '2024/2025' }],
    wali: [{ id: '1', label: 'Wali Test' }],
    submitLabel: 'Simpan',
    cancelHref: '/cancel',
    customFields: []
  };

  it('renders all static field groups', () => {
    render(SantriForm, { props: defaultProps });
    expect(screen.getByText('Identitas')).toBeInTheDocument();
    expect(screen.getByText('Alamat & kontak')).toBeInTheDocument();
    expect(screen.getByText('Status & keaktifan')).toBeInTheDocument();
    expect(screen.getByText('Penempatan')).toBeInTheDocument();
  });

  it('renders all identitas fields', () => {
    render(SantriForm, { props: defaultProps });
    expect(screen.getByLabelText('Nama lengkap *')).toBeInTheDocument();
    expect(screen.getByLabelText('Nama panggilan')).toBeInTheDocument();
    expect(screen.getByLabelText('NISN')).toBeInTheDocument();
    expect(screen.getByLabelText('NIK')).toBeInTheDocument();
    expect(screen.getByLabelText('NIS')).toBeInTheDocument();
    expect(screen.getByLabelText('Tempat lahir')).toBeInTheDocument();
    expect(screen.getByLabelText('Tanggal lahir')).toBeInTheDocument();
    expect(screen.getByLabelText('Jenis kelamin')).toBeInTheDocument();
    expect(screen.getByLabelText('Agama')).toBeInTheDocument();
  });

  it('renders all alamat & kontak fields', () => {
    render(SantriForm, { props: defaultProps });
    expect(screen.getByLabelText('Alamat')).toBeInTheDocument();
    expect(screen.getByLabelText('RT')).toBeInTheDocument();
    expect(screen.getByLabelText('RW')).toBeInTheDocument();
    expect(screen.getByLabelText('Desa/kelurahan')).toBeInTheDocument();
    expect(screen.getByLabelText('Kecamatan')).toBeInTheDocument();
    expect(screen.getByLabelText('Kabupaten')).toBeInTheDocument();
    expect(screen.getByLabelText('No. HP')).toBeInTheDocument();
    expect(screen.getByLabelText('Tempat tinggal')).toBeInTheDocument();
    expect(screen.getByLabelText('Transportasi ke sekolah')).toBeInTheDocument();
    expect(screen.getByLabelText('Anak ke')).toBeInTheDocument();
  });

  it('renders all status & keaktifan fields', () => {
    render(SantriForm, { props: defaultProps });
    expect(screen.getByLabelText('Status santri *')).toBeInTheDocument();
    expect(screen.getByLabelText('Status keluarga')).toBeInTheDocument();
    expect(screen.getByLabelText('Tanggal masuk')).toBeInTheDocument();
    expect(screen.getByLabelText('Asal sekolah')).toBeInTheDocument();
    expect(screen.getByLabelText('Jalur masuk')).toBeInTheDocument();
    expect(screen.getByLabelText('Penerima bantuan (KIP/PIP/KPS/PKH)')).toBeInTheDocument();
  });

  it('renders penempatan fields with kamar, kelas, wali options', () => {
    render(SantriForm, { props: defaultProps });
    const kamarSelect = screen.getByLabelText('Kamar');
    expect(kamarSelect).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Kamar 1' })).toBeInTheDocument();

    const kelasSelect = screen.getByLabelText('Kelas');
    expect(screen.getByRole('option', { name: '1 A (2024/2025)' })).toBeInTheDocument();

    const waliSelect = screen.getByLabelText('Wali santri');
    expect(screen.getByRole('option', { name: 'Wali Test' })).toBeInTheDocument();
  });

  it('renders foto file input when gdrive is true', () => {
    render(SantriForm, { props: { ...defaultProps, gdrive: true } });
    const fotoInput = screen.getByLabelText('Foto profil');
    expect(fotoInput).toHaveAttribute('type', 'file');
    expect(fotoInput).toHaveAttribute('accept', 'image/*');
  });

  it('renders foto URL input when gdrive is false', () => {
    render(SantriForm, { props: { ...defaultProps, gdrive: false } });
    const fotoInput = screen.getByLabelText('Foto (URL)');
    expect(fotoInput).toHaveAttribute('type', 'text');
  });

  it('prefills values when provided', () => {
    render(SantriForm, {
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
    expect(screen.getByLabelText('Nama lengkap *')).toHaveValue('Test Santri');
    expect(screen.getByLabelText('NISN')).toHaveValue('1234567890');
    expect(screen.getByLabelText('Jenis kelamin')).toHaveValue('L');
    expect(screen.getByLabelText('Status santri *')).toHaveValue('aktif');
  });

  it('renders custom fields group when customFields provided', () => {
    render(SantriForm, {
      props: {
        ...defaultProps,
        customFields: [
          { id: 1, nama: 'cita_cita', label: 'Cita-cita', tipe: 'text', opsi: [] },
          { id: 2, nama: 'hobi', label: 'Hobi', tipe: 'select', opsi: [{ value: '1', label: 'Membaca' }] }
        ]
      }
    });
    expect(screen.getByText('Field tambahan')).toBeInTheDocument();
    expect(screen.getByLabelText('Cita-cita')).toBeInTheDocument();
    expect(screen.getByLabelText('Hobi')).toBeInTheDocument();
  });

  it('renders select for custom field with select type', () => {
    render(SantriForm, {
      props: {
        ...defaultProps,
        customFields: [
          { id: 1, nama: 'hobi', label: 'Hobi', tipe: 'select', opsi: [{ value: '1', label: 'Membaca' }] }
        ],
        values: { custom: JSON.stringify({ hobi: 'Membaca' }) }
      }
    });
    const hobiSelect = screen.getByLabelText('Hobi');
    expect(hobiSelect.tagName).toBe('SELECT');
    expect(screen.getByRole('option', { name: 'Membaca' })).toBeInTheDocument();
  });

  it('renders textarea for custom field with textarea type', () => {
    render(SantriForm, {
      props: {
        ...defaultProps,
        customFields: [
          { id: 1, nama: 'catatan', label: 'Catatan', tipe: 'textarea', opsi: [] }
        ]
      }
    });
    const catatan = screen.getByLabelText('Catatan');
    expect(catatan.tagName).toBe('TEXTAREA');
  });

  it('renders date input for custom field with date type', () => {
    render(SantriForm, {
      props: {
        ...defaultProps,
        customFields: [
          { id: 1, nama: 'tanggal_lulus', label: 'Tanggal Lulus', tipe: 'date', opsi: [] }
        ]
      }
    });
    const dateInput = screen.getByLabelText('Tanggal Lulus');
    expect(dateInput).toHaveAttribute('type', 'date');
  });

  it('renders number input for custom field with number type', () => {
    render(SantriForm, {
      props: {
        ...defaultProps,
        customFields: [
          { id: 1, nama: 'nilai', label: 'Nilai', tipe: 'number', opsi: [] }
        ]
      }
    });
    const numberInput = screen.getByLabelText('Nilai');
    expect(numberInput).toHaveAttribute('type', 'number');
  });

  it('renders submit button with label', () => {
    render(SantriForm, { props: defaultProps });
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeInTheDocument();
  });

  it('renders cancel link', () => {
    render(SantriForm, { props: defaultProps });
    const cancelLink = screen.getByRole('link', { name: 'Batal' });
    expect(cancelLink).toHaveAttribute('href', '/cancel');
  });

  it('renders error alert when error prop provided', () => {
    render(SantriForm, { props: { ...defaultProps, error: 'Validation error' } });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Validation error')).toBeInTheDocument();
  });

  it('shows loading state when submitting', () => {
    render(SantriForm, { props: { ...defaultProps, submitting: true } });
    const submitButton = screen.getByRole('button', { name: 'Simpan' });
    expect(submitButton).toHaveClass('loading');
    expect(submitButton).toBeDisabled();
  });

  it('renders extra snippet when provided', () => {
    render(SantriForm, {
      props: {
        ...defaultProps,
        extra: () => '<div class="extra">Extra field</div>'
      }
    });
    expect(screen.getByText('Extra field')).toBeInTheDocument();
  });

  it('uses action attribute when provided and no onSubmit', () => {
    render(SantriForm, { props: { ...defaultProps, action: '/santri' } });
    const form = document.querySelector('form');
    expect(form).toHaveAttribute('action', '/santri');
  });

  it('has correct form enctype for file uploads', () => {
    render(SantriForm, { props: { ...defaultProps, gdrive: true } });
    const form = document.querySelector('form');
    expect(form).toHaveAttribute('enctype', 'multipart/form-data');
  });

  it('passes accessibility test', async () => {
    const { container } = render(SantriForm, { props: defaultProps });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with gdrive true', async () => {
    const { container } = render(SantriForm, { props: { ...defaultProps, gdrive: true } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with custom fields', async () => {
    const { container } = render(SantriForm, {
      props: {
        ...defaultProps,
        customFields: [
          { id: 1, nama: 'test', label: 'Test', tipe: 'text', opsi: [] }
        ]
      }
    });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with error', async () => {
    const { container } = render(SantriForm, { props: { ...defaultProps, error: 'Error' } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });
});