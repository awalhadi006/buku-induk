import { error, fail, redirect } from '@sveltejs/kit';
import { hasRole, getProfile, ADMIN_ROLES } from '$lib/server/auth';

export async function load(event) {
	const { profile } = await event.parent();
	const isAdmin = hasRole(profile, ADMIN_ROLES);

	const { data: wali } = await event.locals.supabase.from('wali_santri').select('*').eq('id', event.params.id).maybeSingle();
	if (!wali) throw error(404, 'Wali santri tidak ditemukan');

	const { data: santri } = await event.locals.supabase
		.from('santri')
		.select('id,nama_lengkap,nisn,kamar(nomor),kelas(tingkat,rombel)')
		.eq('wali_santri_id', event.params.id)
		.order('nama_lengkap');

	return {
		wali,
		isAdmin,
		santri: (santri ?? []).map((s: any) => ({
			id: s.id,
			nama_lengkap: s.nama_lengkap,
			nisn: s.nisn,
			kamar: s.kamar ? `Kamar ${s.kamar.nomor}` : '-',
			kelas: s.kelas ? `${s.kelas.tingkat} ${s.kelas.rombel}` : '-'
		}))
	};
}

export const actions = {
	delete: async ({ locals, params }) => {
		const profile = await getProfile(locals);
		if (!hasRole(profile, ADMIN_ROLES)) {
			return fail(403, { error: 'Tidak punya izin menghapus wali santri.' });
		}

		const { count } = await locals.supabase
			.from('santri')
			.select('id', { count: 'exact', head: true })
			.eq('wali_santri_id', params.id);

		if (count && count > 0) {
			return fail(400, {
				error: `Wali masih terhubung ke ${count} santri. Hapus atau pindahkan santri terlebih dahulu.`
			});
		}

		const { error: delErr } = await locals.supabase.from('wali_santri').delete().eq('id', params.id);
		if (delErr) return fail(500, { error: delErr.message });

		throw redirect(303, '/wali');
	}
};
