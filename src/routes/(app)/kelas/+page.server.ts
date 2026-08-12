import { fail, redirect } from '@sveltejs/kit';

const ADMIN_ROLES = ['superadmin', 'admin_tu'];

async function isAdmin(locals: App.Locals): Promise<boolean> {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');
	const { data: profile } = await supabase
		.from('profiles')
		.select('peran')
		.eq('id', user.id)
		.maybeSingle();
	return ADMIN_ROLES.includes(profile?.peran ?? '');
}

export async function load({ locals }) {
	const admin = await isAdmin(locals);
	const { data } = await locals.supabase
		.from('kelas')
		.select('*')
		.order('tingkat')
		.order('rombel');
	return { kelas: data ?? [], isAdmin: admin };
}

export const actions = {
	add: async ({ locals, request }) => {
		if (!(await isAdmin(locals))) return fail(403, { error: 'Tidak punya izin menambah kelas.' });
		const fd = await request.formData();
		const tingkat = (fd.get('tingkat') as string | null)?.trim() ?? '';
		const rombel = (fd.get('rombel') as string | null)?.trim() ?? '';
		if (!tingkat || !rombel) return fail(400, { error: 'Tingkat dan rombel wajib diisi.' });

		const payload = { tingkat, rombel, aktif: fd.get('aktif') === 'on' };
		const { error } = await locals.supabase.from('kelas').insert(payload);
		if (error) return fail(400, { error: error.message });
		throw redirect(303, '/kelas');
	},
	update: async ({ locals, request }) => {
		if (!(await isAdmin(locals))) return fail(403, { error: 'Tidak punya izin mengubah kelas.' });
		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		const tingkat = (fd.get('tingkat') as string | null)?.trim() ?? '';
		const rombel = (fd.get('rombel') as string | null)?.trim() ?? '';
		if (!Number.isInteger(id) || !tingkat || !rombel)
			return fail(400, { error: 'Data kelas tidak valid.' });

		const payload = { tingkat, rombel, aktif: fd.get('aktif') === 'on' };
		const { error } = await locals.supabase.from('kelas').update(payload).eq('id', id);
		if (error) return fail(400, { error: error.message });
		throw redirect(303, '/kelas');
	},
	delete: async ({ locals, request }) => {
		if (!(await isAdmin(locals))) return fail(403, { error: 'Tidak punya izin menghapus kelas.' });
		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		const { error } = await locals.supabase.from('kelas').delete().eq('id', id);
		if (error) return fail(400, { error: error.message });
		throw redirect(303, '/kelas');
	}
};