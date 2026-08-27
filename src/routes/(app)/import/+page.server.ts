import { fail, redirect } from '@sveltejs/kit';
import * as XLSX from 'xlsx';
import { IMPORT_COLUMNS, normalizeHeader, mergeSheetRows } from '$lib/excel';

const ADMIN_ROLES = ['superadmin', 'admin_tu'];

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

async function findOrCreateWali(supabase: App.Locals['supabase'], w: Record<string, unknown>) {
	const hasName = ['nama_ayah', 'nama_ibu', 'nama_wali'].some((k) => w[k]);
	if (!hasName) return null;

	const { data: existing } = await supabase
		.from('wali_santri')
		.select('id')
		.eq('nama_ayah', w.nama_ayah ?? null)
		.eq('nama_ibu', w.nama_ibu ?? null)
		.eq('nama_wali', w.nama_wali ?? null)
		.limit(1)
		.maybeSingle();
	if (existing) return existing.id;

	const { data, error } = await supabase.from('wali_santri').insert(w).select('id').single();
	if (error) throw error;
	return data.id;
}

async function isAdmin(locals: App.Locals): Promise<boolean> {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');
	const { data: profile } = await supabase.from('profiles').select('peran').eq('id', user.id).maybeSingle();
	return ADMIN_ROLES.includes(profile?.peran ?? '');
}

export async function load({ locals }) {
	if (!(await isAdmin(locals))) throw redirect(303, '/');
	return {};
}

export const actions = {
	upload: async ({ locals, request }) => {
		if (!(await isAdmin(locals))) return fail(403, { error: 'Tidak punya izin import.' });
		const supabase = locals.supabase;

		const fd = await request.formData();
		const file = fd.get('file');
		if (!(file instanceof File)) return fail(400, { error: 'Pilih file Excel dulu.' });
		if (!/\.(xlsx|xls)$/i.test(file.name)) {
			return fail(400, { error: 'Hanya file .xlsx atau .xls yang didukung.' });
		}

		const buf = await file.arrayBuffer();
		const wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true });

		const sheetRows = (needle: string) => {
			const name = wb.SheetNames.find((n) => n.toLowerCase().trim() === needle);
			if (!name) return null;
			return XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' }) as Record<string, string>[];
		};

		const pickByHeader = (row: Record<string, string>, header: string) => {
			const key = Object.keys(row).find((k) => normalizeHeader(k) === header);
			return key ? toText(row[key]) : '';
		};

		const wajibRows = sheetRows('data wajib');
		const opsionalRows = sheetRows('data opsional');

		// Build NIS map from opsional sheet (only rows that actually have NIS filled)
		const opsionalByNis = new Map<string, Record<string, string>>();
		if (opsionalRows) {
			for (const row of opsionalRows) {
				const nis = pickByHeader(row, 'nis');
				if (nis) opsionalByNis.set(nis, row);
			}
		}

		// Merge: each wajib row + matching opsional row by NIS (if any)
		const mergedRows: Record<string, string>[] = [];
		if (wajibRows) {
			for (const wrow of wajibRows) {
				const nis = pickByHeader(wrow, 'nis');
				const orow = nis ? opsionalByNis.get(nis) : null;
				mergedRows.push({ ...(orow ?? {}), ...wrow }); // wajib wins on collision
			}
		}

		let rows = mergedRows;
		if (rows.length === 0) {
			// ponytail: fallback file lama satu-sheet "data"
			const ws = wb.Sheets[wb.SheetNames[0]];
			if (!ws) return fail(400, { error: 'Sheet tidak ditemukan.' });
			rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, string>[];
		}
		if (rows.length === 0) return fail(400, { error: 'File kosong.' });

		const [{ data: kamar }, { data: kelas }] = await Promise.all([
			supabase.from('kamar').select('id,nomor').eq('aktif', true),
			supabase.from('kelas').select('id,tingkat,rombel').eq('aktif', true)
		]);
		const kamarIdByNomor = new Map<number, string>((kamar ?? []).map((k) => [k.nomor, k.id]));
		const kelasIdByKey = new Map<string, string>();
		for (const k of kelas ?? []) {
			kelasIdByKey.set(`${k.tingkat}${k.rombel}`.replace(/\s+/g, '').toUpperCase(), k.id);
		}

		const errors: { row: number; nama: string; reason: string; kategori: string }[] = [];
		const peringatan: { row: number; nama: string; warnings: string[] }[] = [];
		let berhasil = 0;

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const line = i + 2;
			const s: Record<string, unknown> = {};
			const w: Record<string, unknown> = {};
			let kamarNomor = '';
			let kelasKey = '';

			const normKeyByNorm = new Map<string, string>();
			for (const k of Object.keys(row)) normKeyByNorm.set(normalizeHeader(k), k);

			for (const c of IMPORT_COLUMNS) {
				const key = normKeyByNorm.get(normalizeHeader(c.header));
				const val = toText(key ? row[key] : undefined);
				if (!val) continue;
				if (c.group === 'santri') s[c.field] = val;
				else if (c.group === 'wali') w[c.field] = val;
				else if (c.group === 'kamar') kamarNomor = val;
				else if (c.group === 'kelas') kelasKey = val;
			}

			const nama = String(s.nama_lengkap ?? '');
			const rowWarnings: string[] = [];

			if (s.rt) {
				const n = Number(s.rt);
				s.rt = Number.isFinite(n) ? String(n).padStart(3, '0') : String(s.rt).padStart(3, '0');
			}
			if (s.rw) {
				const n = Number(s.rw);
				s.rw = Number.isFinite(n) ? String(n).padStart(3, '0') : String(s.rw).padStart(3, '0');
			}

			// REQUIRED (gagal): nama_lengkap, tempat_lahir, tanggal_lahir
			if (!nama) {
				errors.push({ row: line, nama, reason: 'Nama lengkap kosong', kategori: 'wajib' });
				continue;
			}
			if (!s.tempat_lahir) {
				errors.push({ row: line, nama, reason: 'Tempat lahir kosong', kategori: 'wajib' });
				continue;
			}
			if (!s.tanggal_lahir) {
				errors.push({ row: line, nama, reason: 'Tanggal lahir kosong', kategori: 'wajib' });
				continue;
			}

			// Required tanggal_lahir must be valid
			{
				const iso = toIsoDate(s.tanggal_lahir);
				if (iso === 'invalid') {
					errors.push({ row: line, nama, reason: 'Tanggal lahir tidak valid', kategori: 'format' });
					continue;
				}
				s.tanggal_lahir = iso;
			}

// KOLOM WAJIB: warning jika belum lengkap, tetap disimpan
			if (!s.nis) rowWarnings.push('NIS belum diisi');
			if (!s.nisn) rowWarnings.push('NISN belum diisi');
			if (!s.jenis_kelamin) rowWarnings.push('Jenis kelamin belum diisi');
			if (!s.alamat) rowWarnings.push('Alamat belum diisi');
			if (!w.nama_ayah) rowWarnings.push('Nama ayah belum diisi');
			if (!w.nama_ibu) rowWarnings.push('Nama ibu belum diisi');

			// Convert & validate tanggal_masuk
			if (s.tanggal_masuk) {
				const iso = toIsoDate(s.tanggal_masuk);
				if (iso === 'invalid') {
					rowWarnings.push('Tanggal masuk tidak valid, data tidak disimpan');
					delete s.tanggal_masuk;
				} else {
					s.tanggal_masuk = iso;
				}
			}

			// Validate jenis_kelamin
			if (s.jenis_kelamin && !['L', 'P'].includes(String(s.jenis_kelamin))) {
				rowWarnings.push('Jenis kelamin harus L atau P, data tidak disimpan');
				delete s.jenis_kelamin;
			}

			// Validate status_santri
			if (s.status_santri && !STATUS_SANTRI_VALUES.has(String(s.status_santri))) {
				rowWarnings.push(`Status santri "${s.status_santri}" tidak dikenal, menggunakan default`);
				delete s.status_santri;
			}

			// Validate status_keluarga
			if (s.status_keluarga && !STATUS_KELUARGA_VALUES.has(String(s.status_keluarga))) {
				rowWarnings.push(`Status keluarga "${s.status_keluarga}" tidak dikenal, data tidak disimpan`);
				delete s.status_keluarga;
			}

			// Resolve kamar
			let kamarId: string | null = null;
			if (kamarNomor) {
				kamarId = kamarIdByNomor.get(Number(kamarNomor)) ?? null;
				if (!kamarId) {
					rowWarnings.push(`Kamar ${kamarNomor} tidak ditemukan, santri tanpa kamar`);
				}
			}

			// Resolve kelas
			let kelasId: string | null = null;
			if (kelasKey) {
				kelasId = kelasIdByKey.get(kelasKey.replace(/\s+/g, '').toUpperCase()) ?? null;
				if (!kelasId) {
					rowWarnings.push(`Kelas ${kelasKey} tidak ditemukan, santri tanpa kelas`);
				}
			}

			// Resolve wali
			let waliId: string | null = null;
			try {
				waliId = await findOrCreateWali(supabase, w);
			} catch (e) {
				rowWarnings.push('Gagal mencatat wali santri, santri tanpa wali');
			}

			const payload: Record<string, unknown> = { ...s, custom: {} };
			if (kamarId) payload.kamar_id = kamarId;
			if (kelasId) payload.kelas_id = kelasId;
			if (waliId) payload.wali_santri_id = waliId;

			const { error } = await supabase.from('santri').insert(payload);
			if (error) {
				errors.push({ row: line, nama, reason: error.message, kategori: 'database' });
			} else {
				berhasil++;
				if (rowWarnings.length > 0) {
					peringatan.push({ row: line, nama, warnings: rowWarnings });
				}
			}
		}

		await supabase.from('audit_logs').insert({
			action: 'import',
			entity: 'santri',
			after: { rows: rows.length, berhasil, gagal: errors.length }
		});

		return { total: rows.length, berhasil, gagal: errors.length, errors, peringatan };
	}
};
