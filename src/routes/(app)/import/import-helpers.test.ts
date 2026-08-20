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
		const d = new Date(v);
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
