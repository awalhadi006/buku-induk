import { fail, redirect } from '@sveltejs/kit';
import { hasRole, getProfile, ADMIN_ROLES } from '$lib/server/auth';
import { humanizeError } from '$lib/errors';

export async function load(event) {
	const { profile } = await event.parent();
	const isAdmin = hasRole(profile, ADMIN_ROLES);

	const { data } = await event.locals.supabase.from('kamar').select('*, santri(count)').order('nomor');
	const kamar = (data ?? []).map((k: any) => ({
		...k,
		jumlah_santri: k.santri?.[0]?.count ?? 0,
	}));
	return { kamar, isAdmin };
}

export const actions = {
	add: async ({ locals, request }) => {
		const profile = await getProfile(locals);
		if (!hasRole(profile, ADMIN_ROLES)) return fail(403, { error: 'Tidak punya izin menambah kamar.' });
		const fd = await request.formData();
		const nomor = Number(fd.get('nomor') ?? '');
		if (!Number.isInteger(nomor) || nomor <= 0)
			return fail(400, { error: 'Nomor kamar wajib diisi angka lebih dari 0.' });

		const payload = {
			nomor,
			asrama: (fd.get('asrama') as string | null)?.trim() || null,
			aktif: fd.get('aktif') === 'on'
		};
		const { error } = await locals.supabase.from('kamar').insert(payload);
		if (error) return fail(400, { error: humanizeError(error) });
		throw redirect(303, '/kamar');
	},
	update: async ({ locals, request }) => {
		const profile = await getProfile(locals);
		if (!hasRole(profile, ADMIN_ROLES)) return fail(403, { error: 'Tidak punya izin mengubah kamar.' });
		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		const nomor = Number(fd.get('nomor') ?? '');
		if (!Number.isInteger(id) || !Number.isInteger(nomor) || nomor <= 0)
			return fail(400, { error: 'Data kamar tidak valid.' });

		const payload = {
			nomor,
			asrama: (fd.get('asrama') as string | null)?.trim() || null,
			aktif: fd.get('aktif') === 'on'
		};
		const { error } = await locals.supabase.from('kamar').update(payload).eq('id', id);
		if (error) return fail(400, { error: humanizeError(error) });
		throw redirect(303, '/kamar');
	},
	delete: async ({ locals, request }) => {
		const profile = await getProfile(locals);
		if (!hasRole(profile, ADMIN_ROLES)) return fail(403, { error: 'Tidak punya izin menghapus kamar.' });
		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		const { error } = await locals.supabase.from('kamar').delete().eq('id', id);
		if (error) return fail(400, { error: humanizeError(error) });
		throw redirect(303, '/kamar');
	}
};
