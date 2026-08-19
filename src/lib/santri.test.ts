import { describe, it, expect } from 'vitest';
import {
	parseSantriForm,
	GENDER_OPTIONS,
	STATUS_SANTRI_OPTIONS,
	STATUS_KELUARGA_OPTIONS,
	STATUS_SANTRI_LABEL,
	STATUS_KELUARGA_LABEL,
	GENDER_LABEL,
	EMPTY_SANTRI,
	SANTRI_COLUMNS
} from './santri';

describe('parseSantriForm', () => {
	it('parses basic fields and trims strings', () => {
		const fd = new FormData();
		fd.set('nama_lengkap', '  Budi Santoso  ');
		fd.set('anak_ke', '3');
		fd.set('kamar_id', '5');
		const result = parseSantriForm(fd);
		expect(result.nama_lengkap).toBe('Budi Santoso');
		expect(result.anak_ke).toBe(3);
		expect(result.kamar_id).toBe(5);
	});

	it('skips empty and whitespace-only fields', () => {
		const fd = new FormData();
		fd.set('nama_lengkap', '');
		fd.set('nisn', '   ');
		const result = parseSantriForm(fd);
		expect(result).toEqual({});
	});

	it('coerces non-numeric anak_ke to null', () => {
		const fd = new FormData();
		fd.set('anak_ke', 'abc');
		const result = parseSantriForm(fd);
		expect(result.anak_ke).toBeNull();
	});

	it('coerces Infinity kamar_id to null', () => {
		const fd = new FormData();
		fd.set('kamar_id', 'Infinity');
		const result = parseSantriForm(fd);
		expect(result.kamar_id).toBeNull();
	});

	it('handles custom fields as nested object', () => {
		const fd = new FormData();
		fd.set('custom_cita_cita', 'Dokter');
		fd.set('custom_alamat', 'Jakarta');
		const result = parseSantriForm(fd, ['cita_cita', 'alamat']);
		expect(result.custom).toEqual({ cita_cita: 'Dokter', alamat: 'Jakarta' });
	});

	it('skips empty custom fields', () => {
		const fd = new FormData();
		fd.set('custom_cita_cita', '');
		const result = parseSantriForm(fd, ['cita_cita']);
		expect(result).not.toHaveProperty('custom');
	});
});

describe('constants', () => {
	it('GENDER_OPTIONS contains Laki-laki and Perempuan', () => {
		const labels = GENDER_OPTIONS.map((o) => o.label);
		expect(labels).toContain('Laki-laki');
		expect(labels).toContain('Perempuan');
	});

	it('SANTRI_COLUMNS starts with nisn and contains nama_lengkap', () => {
		expect(SANTRI_COLUMNS[0]).toBe('nisn');
		expect(SANTRI_COLUMNS).toContain('nama_lengkap');
		expect(SANTRI_COLUMNS).toContain('foto_url');
	});

	it('EMPTY_SANTRI maps every column to empty string', () => {
		for (const col of SANTRI_COLUMNS) {
			expect(EMPTY_SANTRI[col]).toBe('');
		}
	});

	it('STATUS_SANTRI_LABEL maps values to labels', () => {
		expect(STATUS_SANTRI_LABEL['aktif']).toBe('Aktif');
		expect(STATUS_SANTRI_LABEL['drop_out']).toBe('Drop Out');
	});

	it('STATUS_KELUARGA_LABEL maps values to labels', () => {
		expect(STATUS_KELUARGA_LABEL['yatim']).toBe('Yatim');
		expect(STATUS_KELUARGA_LABEL['dhuafa']).toBe('Dhuafa');
	});

	it('GENDER_LABEL maps L/P to labels', () => {
		expect(GENDER_LABEL['L']).toBe('Laki-laki');
		expect(GENDER_LABEL['P']).toBe('Perempuan');
	});
});
