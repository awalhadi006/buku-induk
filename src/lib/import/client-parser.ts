import * as XLSX from 'xlsx';
import { IMPORT_COLUMNS, normalizeHeader, type ImportColumn } from '$lib/excel';

export interface ParsedRow {
	santri: Record<string, unknown>;
	wali: Record<string, unknown>;
	kamar: string;
	kelas: string;
	rawRow: Record<string, string>;
	rowNumber: number;
}

export interface ParseResult {
	rows: ParsedRow[];
	totalRows: number;
	errors: { row: number; reason: string }[];
	warnings: { row: number; warnings: string[] }[];
}

const STATUS_SANTRI_VALUES = new Set(['aktif', 'khusus', 'mutasi_keluar', 'lulus', 'wafat', 'drop_out']);
const STATUS_KELUARGA_VALUES = new Set(['yatim', 'yatim_piatu', 'dhuafa', 'umum']);

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

function pickByHeader(row: Record<string, string>, header: string): string {
	const key = Object.keys(row).find((k) => normalizeHeader(k) === header);
	return key ? toText(row[key]) : '';
}

function pickAllHeaders(row: Record<string, string>, headers: string[]): Record<string, string> {
	const result: Record<string, string> = {};
	for (const header of headers) {
		const key = Object.keys(row).find((k) => normalizeHeader(k) === normalizeHeader(header));
		if (key) result[header] = toText(row[key]);
	}
	return result;
}

async function findOrCreateWaliSupabase(waliData: Record<string, unknown>): Promise<string | null> {
	const hasName = ['nama_ayah', 'nama_ibu', 'nama_wali'].some((k) => waliData[k]);
	if (!hasName) return null;

	// This will be done on server-side via bulk insert with foreign key
	// For now, return null and let server handle wali creation
	return null;
}

export async function parseExcelFile(file: File): Promise<ParseResult> {
	const buffer = await file.arrayBuffer();
	const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true });

	const sheetRows = (needle: string): Record<string, string>[] | null => {
		const name = wb.SheetNames.find((n) => n.toLowerCase().trim() === needle);
		if (!name) return null;
		return XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' }) as Record<string, string>[];
	};

	const wajibRows = sheetRows('data wajib');
	const opsionalRows = sheetRows('data opsional');

	// Build opsional map by NIS
	const opsionalByNis = new Map<string, Record<string, string>>();
	if (opsionalRows) {
		for (const row of opsionalRows) {
			const nis = pickByHeader(row, 'nis');
			if (nis) opsionalByNis.set(nis, row);
		}
	}

	// Merge rows
	const mergedRows: Record<string, string>[] = [];
	if (wajibRows) {
		for (const wrow of wajibRows) {
			const nis = pickByHeader(wrow, 'nis');
			const orow = nis ? opsionalByNis.get(nis) : null;
			mergedRows.push({ ...(orow ?? {}), ...wrow });
		}
	}

	let rows = mergedRows;
	if (rows.length === 0) {
		const ws = wb.Sheets[wb.SheetNames[0]];
		if (!ws) {
			return { rows: [], totalRows: 0, errors: [{ row: 0, reason: 'Sheet tidak ditemukan.' }], warnings: [] };
		}
		rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, string>[];
	}
	if (rows.length === 0) {
		return { rows: [], totalRows: 0, errors: [{ row: 0, reason: 'File kosong.' }], warnings: [] };
	}

	const parsedRows: ParsedRow[] = [];
	const errors: { row: number; reason: string }[] = [];
	const warnings: { row: number; warnings: string[] }[] = [];

	// Build header mapping
	const normKeyByNorm = new Map<string, string>();
	const allHeaders = [...new Set(rows.flatMap((r) => Object.keys(r)))];
	for (const h of allHeaders) {
		normKeyByNorm.set(normalizeHeader(h), h);
	}

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const line = i + 2; // 1-based, accounting for header

		const s: Record<string, unknown> = {};
		const w: Record<string, unknown> = {};
		let kamarNomor = '';
		let kelasKey = '';
		const rowWarnings: string[] = [];

		// Map columns
		for (const col of IMPORT_COLUMNS) {
			const key = normKeyByNorm.get(normalizeHeader(col.header));
			const val = toText(key ? row[key] : undefined);
			if (!val) continue;

			if (col.group === 'santri') s[col.field] = val;
			else if (col.group === 'wali') w[col.field] = val;
			else if (col.group === 'kamar') kamarNomor = val;
			else if (col.group === 'kelas') kelasKey = val;
		}

		const nama = String(s.nama_lengkap ?? '');

		if (!nama) {
			errors.push({ row: line, reason: 'Nama lengkap kosong' });
			continue;
		}

		// RT/RW padding
		if (s.rt) {
			const n = Number(s.rt);
			s.rt = Number.isFinite(n) ? String(n).padStart(3, '0') : String(s.rt).padStart(3, '0');
		}
		if (s.rw) {
			const n = Number(s.rw);
			s.rw = Number.isFinite(n) ? String(n).padStart(3, '0') : String(s.rw).padStart(3, '0');
		}

		// Date validation
		if (s.tanggal_lahir) {
			const iso = toIsoDate(s.tanggal_lahir);
			if (iso === 'invalid') {
				rowWarnings.push('Tanggal lahir tidak valid, data tidak disimpan');
				delete s.tanggal_lahir;
			} else {
				s.tanggal_lahir = iso;
			}
		}

		// Required field warnings
		if (!s.nis) rowWarnings.push('NIS belum diisi');
		if (!s.nisn) rowWarnings.push('NISN belum diisi');
		if (!s.tempat_lahir) rowWarnings.push('Tempat lahir belum diisi');
		if (!s.tanggal_lahir) rowWarnings.push('Tanggal lahir belum diisi');
		if (!s.jenis_kelamin) rowWarnings.push('Jenis kelamin belum diisi');
		if (!s.alamat) rowWarnings.push('Alamat belum diisi');
		if (!w.nama_ayah) rowWarnings.push('Nama ayah belum diisi');
		if (!w.nama_ibu) rowWarnings.push('Nama ibu belum diisi');

		if (s.tanggal_masuk) {
			const iso = toIsoDate(s.tanggal_masuk);
			if (iso === 'invalid') {
				rowWarnings.push('Tanggal masuk tidak valid, data tidak disimpan');
				delete s.tanggal_masuk;
			} else {
				s.tanggal_masuk = iso;
			}
		}

		if (s.jenis_kelamin && !['L', 'P'].includes(String(s.jenis_kelamin))) {
			rowWarnings.push('Jenis kelamin harus L atau P, data tidak disimpan');
			delete s.jenis_kelamin;
		}

		if (s.status_santri && !STATUS_SANTRI_VALUES.has(String(s.status_santri))) {
			rowWarnings.push(`Status santri "${s.status_santri}" tidak dikenal, menggunakan default`);
			delete s.status_santri;
		}

		if (s.status_keluarga && !STATUS_KELUARGA_VALUES.has(String(s.status_keluarga))) {
			rowWarnings.push(`Status keluarga "${s.status_keluarga}" tidak dikenal, data tidak disimpan`);
			delete s.status_keluarga;
		}

		if (rowWarnings.length > 0) {
			warnings.push({ row: line, warnings: rowWarnings });
		}

		parsedRows.push({
			santri: s,
			wali: w,
			kamar: kamarNomor,
			kelas: kelasKey,
			rawRow: row,
			rowNumber: line
		});
	}

	return { rows: parsedRows, totalRows: parsedRows.length, errors, warnings };
}

export function chunkRows(rows: ParsedRow[], chunkSize: number): ParsedRow[][] {
	const chunks: ParsedRow[][] = [];
	for (let i = 0; i < rows.length; i += chunkSize) {
		chunks.push(rows.slice(i, i + chunkSize));
	}
	return chunks;
}

// Convert parsed rows to bulk insert format for server
export function toBulkInsertPayload(rows: ParsedRow[], kamarIdByNomor: Map<number, string>, kelasIdByKey: Map<string, string>): Record<string, unknown>[] {
	return rows.map((r) => {
		const payload: Record<string, unknown> = { ...r.santri, custom: {} };

		if (r.kamar) {
			const kamarId = kamarIdByNomor.get(Number(r.kamar));
			if (kamarId) payload.kamar_id = kamarId;
		}

		if (r.kelas) {
			const kelasId = kelasIdByKey.get(r.kelas.replace(/\s+/g, '').toUpperCase());
			if (kelasId) payload.kelas_id = kelasId;
		}

		// Wali data will be sent separately for server to handle
		payload._wali = r.wali;

		return payload;
	});
}