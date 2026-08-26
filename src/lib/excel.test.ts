import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
	IMPORT_COLUMNS,
	IMPORT_HEADERS,
	WAJIB_COLUMNS,
	OPSIONAL_COLUMNS,
	buildTemplateBuffer,
	mergeSheetRows
} from './excel';

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

describe('WAJIB_COLUMNS / OPSIONAL_COLUMNS', () => {
	it('splits IMPORT_COLUMNS into disjoint halves', () => {
		expect(WAJIB_COLUMNS.length + OPSIONAL_COLUMNS.length).toBe(IMPORT_COLUMNS.length);
		const wajibSet = new Set(WAJIB_COLUMNS);
		expect(OPSIONAL_COLUMNS.every((c) => !wajibSet.has(c))).toBe(true);
	});

	it('has the 9 required columns in order', () => {
		expect(WAJIB_COLUMNS.map((c) => c.field)).toEqual([
			'nama_lengkap',
			'nis',
			'nisn',
			'tempat_lahir',
			'tanggal_lahir',
			'jenis_kelamin',
			'alamat',
			'nama_ayah',
			'nama_ibu'
		]);
	});
});

describe('buildTemplateBuffer', () => {
	it('produces a workbook with data wajib, data opsional, and panduan sheets', () => {
		const wb = XLSX.read(buildTemplateBuffer(), { type: 'array' });
		expect(wb.SheetNames).toEqual(['data wajib', 'data opsional', 'panduan']);
	});

	it('sheet headers match the column split', () => {
		const wb = XLSX.read(buildTemplateBuffer(), { type: 'array' });
		const wajib = XLSX.utils.sheet_to_json<string[]>(wb.Sheets['data wajib'], { header: 1 });
		const opsional = XLSX.utils.sheet_to_json<string[]>(wb.Sheets['data opsional'], { header: 1 });
		expect(wajib[0]).toEqual(WAJIB_COLUMNS.map((c) => c.header));
		expect(opsional[0]).toEqual(OPSIONAL_COLUMNS.map((c) => c.header));
	});
});

describe('mergeSheetRows', () => {
	it('merges by row position, wajib wins on collision', () => {
		const merged = mergeSheetRows(
			[{ 'Nama lengkap *': 'A', NIS: '1' }, { 'Nama lengkap *': 'B' }],
			[{ Agama: 'islam' }, {}, { Alamat: 'x' }]
		);
		expect(merged).toEqual([
			{ 'Nama lengkap *': 'A', NIS: '1', Agama: 'islam' },
			{ 'Nama lengkap *': 'B' },
			{ Alamat: 'x' }
		]);
	});

	it('returns empty array when both empty', () => {
		expect(mergeSheetRows([], [])).toEqual([]);
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
