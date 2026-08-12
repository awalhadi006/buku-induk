import { fail, redirect } from '@sveltejs/kit';
import * as XLSX from 'xlsx';
import { IMPORT_COLUMNS } from '$lib/excel';

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
		const d = new Date(v);
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
	template: async ({ locals }) => {
		if (!(await isAdmin(locals))) return fail(403, { error: 'Tidak punya izin.' });
		const ws = XLSX.utils.aoa_to_sheet([IMPORT_COLUMNS.map((c) => c.header)]);
		const guide = XLSX.utils.aoa_to_sheet([
			['Panduan import data santri'],
			[''],
			['1. Isi sheet "santri". Baris pertama adalah header — jangan diubah. Data mulai baris 2.'],
			['2. Kolom "Nama lengkap" wajib diisi; kolom lain opsional.'],
			['3. Jenis kelamin: L atau P'],
			['4. Status santri: aktif, khusus, mutasi_keluar, lulus, wafat, drop_out'],
			['5. Status keluarga: yatim, yatim_piatu, dhuafa, umum'],
			['6. Kamar: nomor kamar (contoh: 3). Kelas: tingkat+rombel (contoh: 7A).'],
			['7. Isi nama ayah/ibu/wali agar wali santri ikut tercatat.'],
			[''],
			['Contoh:'],
			['Nama lengkap', 'NISN', 'Jenis kelamin (L/P)', 'Status santri', 'Kamar (nomor)', 'Kelas (mis. 7A)', 'Nama ayah'],
			['Ahmad Fauzi', '0012345678', 'L', 'aktif', '3', '7A', 'Haji Salim']
		]);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'santri');
		XLSX.utils.book_append_sheet(wb, guide, 'Panduan');
		const buf = new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
		return new Response(buf, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': 'attachment; filename="template-import-santri.xlsx"'
			}
		});
	},

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
		const ws = wb.Sheets[wb.SheetNames[0]];
		if (!ws) return fail(400, { error: 'Sheet tidak ditemukan.' });
		const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, string>[];
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

		const errors: { row: number; nama: string; reason: string }[] = [];
		let berhasil = 0;

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const line = i + 2;
			const s: Record<string, unknown> = {};
			const w: Record<string, unknown> = {};
			let kamarNomor = '';
			let kelasKey = '';

			for (const c of IMPORT_COLUMNS) {
				const val = toText(row[c.header]);
				if (!val) continue;
				if (c.group === 'santri') s[c.field] = val;
				else if (c.group === 'wali') w[c.field] = val;
				else if (c.group === 'kamar') kamarNomor = val;
				else if (c.group === 'kelas') kelasKey = val;
			}

			const nama = String(s.nama_lengkap ?? '');
			const recordErr = (reason: string) => errors.push({ row: line, nama, reason });

			if (!nama) {
				recordErr('Nama lengkap kosong');
				continue;
			}
			if (s.jenis_kelamin && !['L', 'P'].includes(String(s.jenis_kelamin))) {
				recordErr('Jenis kelamin harus L atau P');
				continue;
			}
			if (s.status_santri && !STATUS_SANTRI_VALUES.has(String(s.status_santri))) {
				recordErr(`Status santri tidak dikenal: ${s.status_santri}`);
				continue;
			}
			if (s.status_keluarga && !STATUS_KELUARGA_VALUES.has(String(s.status_keluarga))) {
				recordErr(`Status keluarga tidak dikenal: ${s.status_keluarga}`);
				continue;
			}

			for (const f of ['tanggal_lahir', 'tanggal_masuk']) {
				if (!s[f]) continue;
				const iso = toIsoDate(s[f]);
				if (iso === 'invalid') {
					recordErr(`${f} tidak valid`);
					continue;
				}
				s[f] = iso;
			}

			const kamarId = kamarNomor ? kamarIdByNomor.get(Number(kamarNomor)) : null;
			if (kamarNomor && !kamarId) {
				recordErr(`Kamar ${kamarNomor} tidak ditemukan`);
				continue;
			}
			const kelasId = kelasKey ? kelasIdByKey.get(kelasKey.replace(/\s+/g, '').toUpperCase()) : null;
			if (kelasKey && !kelasId) {
				recordErr(`Kelas ${kelasKey} tidak ditemukan`);
				continue;
			}

			let waliId: string | null = null;
			try {
				waliId = await findOrCreateWali(supabase, w);
			} catch (e) {
				recordErr(e instanceof Error ? e.message : 'Gagal mencatat wali santri');
				continue;
			}

			const payload: Record<string, unknown> = { ...s, custom: {} };
			if (kamarId) payload.kamar_id = kamarId;
			if (kelasId) payload.kelas_id = kelasId;
			if (waliId) payload.wali_santri_id = waliId;

			const { error } = await supabase.from('santri').insert(payload);
			if (error) {
				recordErr(error.message);
			} else {
				berhasil++;
			}
		}

		await supabase.from('audit_logs').insert({
			action: 'import',
			entity: 'santri',
			after: { rows: rows.length, berhasil, gagal: errors.length }
		});

		return { berhasil, gagal: errors.length, errors: errors.slice(0, 50) };
	}
};