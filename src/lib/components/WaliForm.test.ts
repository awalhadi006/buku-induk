import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import WaliForm from '$lib/components/WaliForm.svelte';

describe('WaliForm', () => {
  const defaultProps = {
    submitLabel: 'Simpan',
    cancelHref: '/cancel',
    values: {}
  };

  it('renders form with all field groups', () => {
    render(WaliForm, { props: defaultProps });
    expect(screen.getByText('Data ayah')).toBeInTheDocument();
    expect(screen.getByText('Data ibu')).toBeInTheDocument();
    expect(screen.getByText('Wali & kontak')).toBeInTheDocument();
  });

  it('renders all ayah fields', () => {
    render(WaliForm, { props: defaultProps });
    expect(screen.getByLabelText('Nama ayah')).toBeInTheDocument();
    expect(screen.getByLabelText('Pekerjaan ayah')).toBeInTheDocument();
  });

  it('renders all ibu fields', () => {
    render(WaliForm, { props: defaultProps });
    expect(screen.getByLabelText('Nama ibu')).toBeInTheDocument();
    expect(screen.getByLabelText('Pekerjaan ibu')).toBeInTheDocument();
  });

  it('renders all wali & kontak fields', () => {
    render(WaliForm, { props: defaultProps });
    expect(screen.getByLabelText('Nama wali')).toBeInTheDocument();
    expect(screen.getByLabelText('Penghasilan keluarga')).toBeInTheDocument();
    expect(screen.getByLabelText('No. HP')).toBeInTheDocument();
    expect(screen.getByLabelText('Alamat')).toBeInTheDocument();
  });

  it('prefills values when provided', () => {
    render(WaliForm, {
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
    expect(screen.getByLabelText('Nama ayah')).toHaveValue('Budi');
    expect(screen.getByLabelText('Pekerjaan ayah')).toHaveValue('Guru');
    expect(screen.getByLabelText('Nama ibu')).toHaveValue('Siti');
    expect(screen.getByLabelText('Pekerjaan ibu')).toHaveValue('Dokter');
    expect(screen.getByLabelText('Nama wali')).toHaveValue('Pak Budi');
    expect(screen.getByLabelText('Penghasilan keluarga')).toHaveValue('5000000');
    expect(screen.getByLabelText('No. HP')).toHaveValue('081234567890');
    expect(screen.getByLabelText('Alamat')).toHaveValue('Jl. Test No. 123');
  });

  it('renders textarea for alamat field', () => {
    render(WaliForm, { props: defaultProps });
    const alamat = screen.getByLabelText('Alamat');
    expect(alamat.tagName).toBe('TEXTAREA');
    expect(alamat).toHaveAttribute('rows', '3');
  });

  it('renders input for other fields', () => {
    render(WaliForm, { props: defaultProps });
    expect(screen.getByLabelText('Nama ayah').tagName).toBe('INPUT');
    expect(screen.getByLabelText('Pekerjaan ayah').tagName).toBe('INPUT');
  });

  it('renders submit button with label', () => {
    render(WaliForm, { props: defaultProps });
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeInTheDocument();
  });

  it('renders cancel link', () => {
    render(WaliForm, { props: defaultProps });
    const cancelLink = screen.getByRole('link', { name: 'Batal' });
    expect(cancelLink).toHaveAttribute('href', '/cancel');
  });

  it('renders error alert when error prop provided', () => {
    render(WaliForm, { props: { ...defaultProps, error: 'Validation error' } });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Validation error')).toBeInTheDocument();
  });

  it('shows loading state when submitting', () => {
    render(WaliForm, { props: { ...defaultProps, submitting: true } });
    const submitButton = screen.getByRole('button', { name: 'Simpan' });
    expect(submitButton).toHaveClass('loading');
    expect(submitButton).toBeDisabled();
  });

  it('renders extra snippet when provided', () => {
    render(WaliForm, {
      props: {
        ...defaultProps,
        extra: () => '<div class="extra">Extra field</div>'
      }
    });
    expect(screen.getByText('Extra field')).toBeInTheDocument();
  });

  it('uses action attribute when provided and no onSubmit', () => {
    render(WaliForm, { props: { ...defaultProps, action: '/wali' } });
    const form = document.querySelector('form');
    expect(form).toHaveAttribute('action', '/wali');
  });

  it('calls onSubmit when form submitted', async () => {
    const onSubmit = vi.fn();
    render(WaliForm, { props: { ...defaultProps, onSubmit } });
    const form = document.querySelector('form');
    const submitButton = screen.getByRole('button', { name: 'Simpan' });
    submitButton.click();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('has correct form enctype for file uploads', () => {
    render(WaliForm, { props: defaultProps });
    const form = document.querySelector('form');
    expect(form).toHaveAttribute('enctype', 'multipart/form-data');
  });

  it('passes accessibility test', async () => {
    const { container } = render(WaliForm, { props: defaultProps });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with values', async () => {
    const { container } = render(WaliForm, {
      props: {
        ...defaultProps,
        values: {
          nama_ayah: 'Budi',
          alamat: 'Jl. Test'
        }
      }
    });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });

  it('passes accessibility test with error', async () => {
    const { container } = render(WaliForm, { props: { ...defaultProps, error: 'Error' } });
    const results = await global.axe.run(container);
    expect(results).toHaveNoViolations();
  });
});