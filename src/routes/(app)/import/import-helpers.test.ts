import { describe, it, expect } from 'vitest';
import { normalizeHeader } from '$lib/excel';

function toText(v: unknown): string {
	if (v == null) return '';
	return String(v).trim();
}

function toIsoDate(v: unknown): string {
	if (v instanceof Date && !Number.isNaN(v.getTime())) {
		return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
	}
	if (typeof v === 'number' && Number.isFinite(v)) {
		const d = new Date(Math.round((v - 25569) * 86400 * 1000));
		if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
	}
	if (typeof v === 'string' && v.trim()) {
		const raw = v.trim();
		const months: Record<string, number> = {
			januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
			juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
		};
		const m = raw.toLowerCase().match(/^(\d{1,2})\s+(\w+)\s+(\d{2,4})$/);
		if (m) {
			const day = Number(m[1]);
			const mi = months[m[2]];
			if (mi != null) {
				let yr = Number(m[3]);
				if (yr < 100) yr += yr < 50 ? 2000 : 1900;
				const d = new Date(yr, mi, day);
				if (!Number.isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			}
		}
		const numMatch = raw.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
		if (numMatch) {
			const day = Number(numMatch[1]);
			const month = Number(numMatch[2]) - 1;
			let yr = Number(numMatch[3]);
			if (yr < 100) yr += yr < 50 ? 2000 : 1900;
			if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
				const d = new Date(yr, month, day);
				if (!Number.isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			}
		}
		const d = new Date(raw);
		if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
	}
	return 'invalid';
}

describe('toText', () => {
	it('trims strings', () => {
		expect(toText(' hello ')).toBe('hello');
	});

	it('returns empty string for null/undefined', () => {
		expect(toText(null)).toBe('');
		expect(toText(undefined)).toBe('');
	});

	it('converts numbers to string', () => {
		expect(toText(123)).toBe('123');
	});

	it('converts boolean to string', () => {
		expect(toText(true)).toBe('true');
	});
});

describe('toIsoDate', () => {
	it('formats Date object to YYYY-MM-DD', () => {
		expect(toIsoDate(new Date(2025, 0, 15))).toBe('2025-01-15');
	});

	it('handles Excel serial date number (45658 = 2025-01-01)', () => {
		expect(toIsoDate(45658)).toBe('2025-01-01');
	});

	it('handles Excel serial date for 2024-12-26 (45652)', () => {
		expect(toIsoDate(45652)).toBe('2024-12-26');
	});

	it('handles valid date string', () => {
		expect(toIsoDate('2025-06-15')).toBe('2025-06-15');
	});

	it('handles Date with time component', () => {
		const d = new Date(2025, 5, 15, 14, 30);
		expect(toIsoDate(d)).toBe('2025-06-15');
	});

	it('returns invalid for bad string', () => {
		expect(toIsoDate('not-a-date')).toBe('invalid');
	});

	it('returns invalid for empty string', () => {
		expect(toIsoDate('')).toBe('invalid');
	});

	it('returns invalid for NaN date object', () => {
		expect(toIsoDate(new Date('invalid'))).toBe('invalid');
	});

	it('returns invalid for Infinity', () => {
		expect(toIsoDate(Infinity)).toBe('invalid');
	});

	it('parses Indonesian month names', () => {
		expect(toIsoDate('14 Mei 2014')).toBe('2014-05-14');
		expect(toIsoDate('23 Februari 2014')).toBe('2014-02-23');
		expect(toIsoDate('18 Desember 2013')).toBe('2013-12-18');
		expect(toIsoDate('1 Januari 2020')).toBe('2020-01-01');
	});

	it('parses slash-separated dates', () => {
		expect(toIsoDate('24/11/2013')).toBe('2013-11-24');
	});

	it('parses dash-separated dates', () => {
		expect(toIsoDate('18-12-2013')).toBe('2013-12-18');
	});
});

describe('normalizeHeader', () => {
	it('lowercases and strips non-alphanumerics', () => {
		expect(normalizeHeader('Nama lengkap *')).toBe('namalengkap');
		expect(normalizeHeader('Nama lengkap')).toBe('namalengkap');
	});

	it('ignores case differences', () => {
		expect(normalizeHeader('Tanggal Lahir')).toBe(normalizeHeader('Tanggal lahir'));
		expect(normalizeHeader('Rt')).toBe(normalizeHeader('RT'));
		expect(normalizeHeader('asal sekolah')).toBe(normalizeHeader('Asal sekolah'));
	});

	it('strips parenthetical hints', () => {
		expect(normalizeHeader('Jenis kelamin (L/P)')).toBe('jeniskelamin');
		expect(normalizeHeader('Jenis Kelamin')).toBe('jeniskelamin');
	});
});
