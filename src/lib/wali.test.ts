import { describe, it, expect } from 'vitest';
import { waliLabel, parseWaliForm } from './wali';
import { WALI_COLUMNS } from './wali';

describe('waliLabel', () => {
  it('returns nama_wali if available', () => {
    expect(waliLabel({ nama_wali: 'Wali Utama', nama_ayah: 'Ayah', nama_ibu: 'Ibu' })).toBe('Wali Utama');
  });

  it('falls back to nama_ayah if nama_wali is null', () => {
    expect(waliLabel({ nama_wali: null, nama_ayah: 'Ayah Utama', nama_ibu: 'Ibu' })).toBe('Ayah Utama');
  });

  it('falls back to nama_ibu if nama_wali and nama_ayah are null', () => {
    expect(waliLabel({ nama_wali: null, nama_ayah: null, nama_ibu: 'Ibu Utama' })).toBe('Ibu Utama');
  });

  it('returns default label if all names are null', () => {
    expect(waliLabel({ nama_wali: null, nama_ayah: null, nama_ibu: null })).toBe('(wali tanpa nama)');
  });
});

describe('parseWaliForm', () => {
  it('parses form data correctly', () => {
    const fd = new FormData();
    fd.set('nama_ayah', '  Ayah Baru  ');
    fd.set('nama_ibu', 'Ibu Baru');
    const result = parseWaliForm(fd);
    expect(result.nama_ayah).toBe('Ayah Baru');
    expect(result.nama_ibu).toBe('Ibu Baru');
  });

  it('ignores empty fields', () => {
    const fd = new FormData();
    fd.set('nama_ayah', '');
    fd.set('pekerjaan', '   ');
    const result = parseWaliForm(fd);
    expect(result).not.toHaveProperty('nama_ayah');
    expect(result).not.toHaveProperty('pekerjaan');
  });
});
