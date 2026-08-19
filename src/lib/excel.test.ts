import { describe, it, expect } from 'vitest';
import { IMPORT_COLUMNS, IMPORT_HEADERS } from './excel';

describe('IMPORT_COLUMNS', () => {
	it('starts with nama_lengkap as the first column', () => {
		expect(IMPORT_COLUMNS[0]).toEqual({
			header: 'Nama lengkap *',
			field: 'nama_lengkap',
			group: 'santri'
		});
	});

	it('every column has header, field, and group', () => {
		for (const col of IMPORT_COLUMNS) {
			expect(col.header).toBeTruthy();
			expect(col.field).toBeTruthy();
			expect(['santri', 'wali', 'kamar', 'kelas']).toContain(col.group);
		}
	});

	it('contains all four groups', () => {
		const groups = new Set(IMPORT_COLUMNS.map((c) => c.group));
		expect(groups).toEqual(new Set(['santri', 'wali', 'kamar', 'kelas']));
	});
});

describe('IMPORT_HEADERS', () => {
	it('maps IMPORT_COLUMNS headers in order', () => {
		expect(IMPORT_HEADERS).toEqual(IMPORT_COLUMNS.map((c) => c.header));
	});

	it('first header is "Nama lengkap *"', () => {
		expect(IMPORT_HEADERS[0]).toBe('Nama lengkap *');
	});
});
