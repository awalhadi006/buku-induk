import { fail, redirect } from '@sveltejs/kit';
import { hasRole, getProfile, ADMIN_ROLES } from '$lib/server/auth';
import { humanizeError, validationMessages } from '$lib/errors';

export async function load(event) {
	const { profile } = await event.parent();
	const isAdmin = hasRole(profile, ADMIN_ROLES);

	const [{ data }, { data: settings }] = await Promise.all([
		event.locals.supabase
			.from('kelas')
			.select('*')
			.order('tahun_ajaran', { ascending: false, nullsFirst: false })
			.order('tingkat')
			.order('rombel'),
		event.locals.supabase.from('settings').select('key,value')
	]);
	const taAktif = (settings ?? []).find((s) => s.key === 'tahun_ajaran_aktif')?.value ?? '';
	return { kelas: data ?? [], isAdmin, tahunAjaranAktif: taAktif };
}

export const actions = {
	add: async ({ locals, request }) => {
		const profile = await getProfile(locals);
		if (!hasRole(profile, ADMIN_ROLES)) return fail(403, { error: 'Tidak punya izin menambah kelas.' });
		const fd = await request.formData();
		const tingkat = (fd.get('tingkat') as string | null)?.trim() ?? '';
		const rombel = (fd.get('rombel') as string | null)?.trim() ?? '';
		const tahun = (fd.get('tahun_ajaran') as string | null)?.trim() || null;
		if (!tingkat || !rombel) return fail(400, { error: 'Tingkat dan rombel wajib diisi.' });

		const { data: settings } = await locals.supabase
			.from('settings')
			.select('value')
			.eq('key', 'tahun_ajaran_aktif')
			.maybeSingle();
		const tahunAjaranAktif = settings?.value ?? '';
		const payload = { tingkat, rombel, tahun_ajaran: tahun ?? tahunAjaranAktif, aktif: fd.get('aktif') === 'on' };
		const { error } = await locals.supabase.from('kelas').insert(payload);
		if (error) return fail(400, { error: humanizeError(error) });
		throw redirect(303, '/kelas');
	},
	update: async ({ locals, request }) => {
		const profile = await getProfile(locals);
		if (!hasRole(profile, ADMIN_ROLES)) return fail(403, { error: 'Tidak punya izin mengubah kelas.' });
		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		const tingkat = (fd.get('tingkat') as string | null)?.trim() ?? '';
		const rombel = (fd.get('rombel') as string | null)?.trim() ?? '';
		const tahun = (fd.get('tahun_ajaran') as string | null)?.trim() || null;
		if (!Number.isInteger(id) || !tingkat || !rombel)
			return fail(400, { error: 'Data kelas tidak valid.' });

		const payload = { tingkat, rombel, tahun_ajaran: tahun, aktif: fd.get('aktif') === 'on' };
		const { error } = await locals.supabase.from('kelas').update(payload).eq('id', id);
		if (error) return fail(400, { error: humanizeError(error) });
		throw redirect(303, '/kelas');
	},
	delete: async ({ locals, request }) => {
		const profile = await getProfile(locals);
		if (!hasRole(profile, ADMIN_ROLES)) return fail(403, { error: 'Tidak punya izin menghapus kelas.' });
		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		const { error } = await locals.supabase.from('kelas').delete().eq('id', id);
		if (error) return fail(400, { error: humanizeError(error) });
		throw redirect(303, '/kelas');
	}
};
