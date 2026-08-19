import { fail, redirect } from '@sveltejs/kit';
import { ROLES } from '$lib/permissions';
import { ALL_METRIC_KEYS } from '$lib/types';
import { parseSidebarNav } from '$lib/nav';

function parseMetricKeys(v: string | null): string[] {
	if (!v) return ALL_METRIC_KEYS;
	try {
		const arr = JSON.parse(v);
		if (Array.isArray(arr)) return arr.length ? arr.filter((k) => ALL_METRIC_KEYS.includes(k)) : ALL_METRIC_KEYS;
	} catch {}
	return ALL_METRIC_KEYS;
}

function parseOptInt(v: FormDataEntryValue | null): number | null {
	const s = typeof v === 'string' ? v.trim() : '';
	if (!s) return null;
	const n = Number(s);
	return Number.isFinite(n) ? Math.floor(n) : null;
}

async function requireAdmin(locals: App.Locals) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');
	const { data: profile } = await supabase.from('profiles').select('peran').eq('id', user.id).maybeSingle();
	if (!profile || !['superadmin', 'admin_tu'].includes(profile.peran)) throw redirect(303, '/');
	return profile.peran as string;
}

async function requireSuperadmin(locals: App.Locals) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');
	const { data: profile } = await supabase.from('profiles').select('peran').eq('id', user.id).maybeSingle();
	if (profile?.peran !== 'superadmin') throw redirect(303, '/');
}

export async function load({ locals }) {
	const peran = await requireAdmin(locals);
	const { supabase } = locals;

	const [
		{ data: profiles },
		{ data: kamar },
		{ data: kelas },
		{ data: permissions },
		{ data: fields },
		{ data: settings },
		{ data: auditLogs },
		{ data: tahunAjaran },
		{ data: gdrive }
	] = await Promise.all([
		supabase.from('profiles').select('*').order('created_at'),
		supabase.from('kamar').select('id,nomor').order('nomor'),
		supabase.from('kelas').select('id,tingkat,rombel').order('tingkat').order('rombel'),
		supabase.from('permissions').select('role,abilities').order('role'),
		supabase.from('custom_fields').select('*').order('urutan').order('id'),
		supabase.from('settings').select('key,value'),
		peran === 'superadmin' ? supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100) : Promise.resolve({ data: null }),
		supabase.from('tahun_ajaran').select('id,nama,aktif').order('nama', { ascending: false }),
		supabase.from('gdrive_creds').select('*').eq('id', 1).maybeSingle()
	]);

	const settingsObj = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value ?? '']));

	return {
		isSuperadmin: peran === 'superadmin',
		profiles: profiles ?? [],
		kamar: kamar ?? [],
		kelas: kelas ?? [],
		permissions: permissions ?? [],
		fields: fields ?? [],
		settings: settingsObj,
		auditLogs: auditLogs ?? [],
		tahunAjaran: tahunAjaran ?? [],
		gdrive: gdrive ?? null,
		enabledMetrics: parseMetricKeys(settingsObj['dashboard_metrics'] ?? null),
		sidebarNav: parseSidebarNav(settingsObj['sidebar_nav'])
	};
}

export const actions = {
	updateProfile: async ({ locals, request }) => {
		await requireSuperadmin(locals);
		const fd = await request.formData();
		const id = fd.get('id') as string;
		const peran = (fd.get('peran') as string) ?? '';
		if (!id || !ROLES.includes(peran)) return fail(400, { error: 'Data pengguna tidak valid.' });

		const payload = {
			peran,
			nama: (fd.get('nama') as string | null)?.trim() || null,
			kamar_id: peran === 'wali_kamar' ? parseOptInt(fd.get('kamar_id')) : null,
			kelas_id: peran === 'wali_kelas' ? parseOptInt(fd.get('kelas_id')) : null
		};
		const { error } = await locals.supabase.from('profiles').update(payload).eq('id', id);
		if (error) return fail(400, { error: error.message });
	},

	updatePermissions: async ({ locals, request }) => {
		await requireSuperadmin(locals);
		const fd = await request.formData();
		const role = (fd.get('role') as string) ?? '';
		if (!ROLES.includes(role)) return fail(400, { error: 'Peran tidak valid.' });
		const abilities = fd.getAll('ability').map(String);
		const { error } = await locals.supabase.from('permissions').update({ abilities }).eq('role', role);
		if (error) return fail(400, { error: error.message });
	},

	createField: async ({ locals, request }) => {
		await requireAdmin(locals);
		const field = parseField(await request.formData());
		if (!field.nama || !field.label) return fail(400, { error: 'Nama dan label field wajib diisi.' });
		if (field.tipe === 'select' && field.opsi.length === 0)
			return fail(400, { error: 'Field pilihan memerlukan minimal satu opsi.' });
		const { error } = await locals.supabase.from('custom_fields').insert(field);
		if (error) return fail(400, { error: error.message });
	},

	updateField: async ({ locals, request }) => {
		await requireAdmin(locals);
		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		const field = parseField(fd);
		if (!Number.isInteger(id) || !field.nama || !field.label)
			return fail(400, { error: 'Data field tidak valid.' });
		if (field.tipe === 'select' && field.opsi.length === 0)
			return fail(400, { error: 'Field pilihan memerlukan minimal satu opsi.' });
		const { error } = await locals.supabase.from('custom_fields').update(field).eq('id', id);
		if (error) return fail(400, { error: error.message });
	},

	deleteField: async ({ locals, request }) => {
		await requireAdmin(locals);
		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		if (!Number.isInteger(id)) return fail(400, { error: 'Data field tidak valid.' });
		const { error } = await locals.supabase.from('custom_fields').delete().eq('id', id);
		if (error) return fail(400, { error: error.message });
	},

	updateSetting: async ({ locals, request }) => {
		await requireAdmin(locals);
		const fd = await request.formData();
		const key = (fd.get('key') as string) ?? '';
		if (key !== 'tahun_ajaran_aktif') return fail(400, { error: 'Key tidak valid.' });
		const value = (fd.get('value') as string | null)?.trim() ?? '';
		const { error } = await locals.supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
		if (error) return fail(400, { error: error.message });
	},

	createTahunAjaran: async ({ locals, request }) => {
		await requireAdmin(locals);
		const fd = await request.formData();
		const nama = (fd.get('nama') as string | null)?.trim() ?? '';
		if (!nama) return fail(400, { error: 'Nama tahun ajaran wajib diisi.' });
		const { error } = await locals.supabase.from('tahun_ajaran').insert({ nama, aktif: true });
		if (error) return fail(400, { error: error.message });
	},

	toggleTahunAjaran: async ({ locals, request }) => {
		await requireAdmin(locals);
		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		const aktif = fd.get('aktif') === 'true';
		if (!Number.isInteger(id)) return fail(400, { error: 'Data tidak valid.' });
		const { error } = await locals.supabase.from('tahun_ajaran').update({ aktif }).eq('id', id);
		if (error) return fail(400, { error: error.message });
	},

	deleteTahunAjaran: async ({ locals, request }) => {
		await requireAdmin(locals);
		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		if (!Number.isInteger(id)) return fail(400, { error: 'Data tidak valid.' });
		const { error } = await locals.supabase.from('tahun_ajaran').delete().eq('id', id);
		if (error) return fail(400, { error: error.message });
	},

	updateDashboardMetrics: async ({ locals, request }) => {
		await requireAdmin(locals);
		const fd = await request.formData();
		const metrics = fd.getAll('metrics').map(String);
		const { error } = await locals.supabase
			.from('settings')
			.upsert({ key: 'dashboard_metrics', value: JSON.stringify(metrics) }, { onConflict: 'key' });
		if (error) return fail(400, { error: error.message });
	},

	updateGDriveFolder: async ({ locals, request }) => {
		await requireAdmin(locals);
		const fd = await request.formData();
		const folder_id = (fd.get('folder_id') as string | null)?.trim() ?? '';
		const { error } = await locals.supabase.from('gdrive_creds').update({ folder_id }).eq('id', 1);
		if (error) return fail(400, { error: error.message });
	},

	updateNisPattern: async ({ locals, request }) => {
		await requireAdmin(locals);
		const fd = await request.formData();
		const pattern = (fd.get('pattern') as string | null)?.trim() ?? '';
		const jenjangRaw = (fd.get('jenjang_map') as string | null)?.trim() ?? '';

		if (!pattern) return fail(400, { error: 'Pola NIS wajib diisi.' });
		if (!pattern.includes('{NO}')) return fail(400, { error: 'Pola harus mengandung token {NO}.' });

		const jenjangEntries: [string, string][] = [];
		if (jenjangRaw) {
			for (const line of jenjangRaw.split('\n')) {
				const [k, v] = line.split('=').map((s) => s.trim());
				if (k && v) jenjangEntries.push([k, v]);
			}
		}
		const jenjangMap = Object.fromEntries(jenjangEntries);

		const { error: e1 } = await locals.supabase
			.from('settings')
			.upsert({ key: 'nis_pattern', value: pattern }, { onConflict: 'key' });
		if (e1) return fail(400, { error: e1.message });

		const { error: e2 } = await locals.supabase
			.from('settings')
			.upsert({ key: 'nis_jenjang_map', value: JSON.stringify(jenjangMap) }, { onConflict: 'key' });
		if (e2) return fail(400, { error: e2.message });
	},

	bulkGenerateNis: async ({ locals, request }) => {
		await requireAdmin(locals);
		const fd = await request.formData();
		const pattern = (fd.get('pattern') as string | null)?.trim() ?? '';
		if (!pattern) return fail(400, { error: 'Pola NIS belum dikonfigurasi.' });

		const { data, error } = await locals.supabase.rpc('bulk_generate_nis', { p_pattern: pattern });
		if (error) return fail(400, { error: error.message });
		return { nisGenerated: data as number };
	},

	updateSchoolIdentity: async ({ locals, request }) => {
		await requireSuperadmin(locals); // Only superadmin can change school identity
		const supabase = locals.supabase;
		const fd = await request.formData();
		const schoolName = (fd.get('school_name') as string | null)?.trim() ?? '';
		const logoFile = fd.get('school_logo') as File | null;

		// Update nama sekolah
		const { error: nameErr } = await supabase.from('settings').upsert({ key: 'school_name', value: schoolName }, { onConflict: 'key' });
		if (nameErr) return fail(400, { error: nameErr.message });

		// Upload logo ke Google Drive jika ada file
		if (logoFile && logoFile.size > 0) {
			const { uploadSchoolLogo } = await import('$lib/gdrive');
			try {
				const logoUrl = await uploadSchoolLogo(supabase, logoFile);
				const { error: logoErr } = await supabase.from('settings').upsert({ key: 'school_logo_url', value: logoUrl }, { onConflict: 'key' });
				if (logoErr) return fail(400, { error: logoErr.message });
			} catch (e) {
				return fail(400, { error: e instanceof Error ? e.message : 'Gagal mengunggah logo sekolah ke Google Drive.' });
			}
		}

		return { success: true };
	},

	updateSidebarNav: async ({ locals, request }) => {
		await requireAdmin(locals);
		const fd = await request.formData();
		const sidebarNav: Record<string, string[]> = {};

		for (const href of Object.keys(parseSidebarNav(null))) {
			const roles = fd.getAll(`nav:${href}`).map(String).filter(r => ROLES.includes(r));
			sidebarNav[href] = roles;
		}

		const { error } = await locals.supabase
			.from('settings')
			.upsert({ key: 'sidebar_nav', value: JSON.stringify(sidebarNav) }, { onConflict: 'key' });
		if (error) return fail(400, { error: error.message });
		return { sidebarNav };
	}
};

function parseField(fd: FormData) {
	const tipe = (fd.get('tipe') as string) ?? 'text';
	let opsi: string[] = [];
	if (tipe === 'select') {
		opsi = (fd.get('opsi') as string)
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
	}
	return {
		nama: (fd.get('nama') as string | null)?.trim() ?? '',
		label: (fd.get('label') as string | null)?.trim() ?? '',
		tipe,
		opsi,
		aktif: fd.get('aktif') === 'on',
		urutan: parseOptInt(fd.get('urutan')) ?? 0
	};
}