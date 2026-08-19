import { error, fail, redirect } from '@sveltejs/kit';

export async function load({ params, locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: wali } = await supabase.from('wali_santri').select('*').eq('id', params.id).maybeSingle();
	if (!wali) throw error(404, 'Wali santri tidak ditemukan');

	const { data: profile } = await supabase
		.from('profiles')
		.select('peran')
		.eq('id', user.id)
		.maybeSingle();
	const isAdmin = ['superadmin', 'admin_tu'].includes(profile?.peran ?? '');

	const { data: santri } = await supabase
		.from('santri')
		.select('id,nama_lengkap,nisn,kamar(nomor),kelas(tingkat,rombel)')
		.eq('wali_santri_id', params.id)
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
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		// Check if admin (superadmin or admin_tu)
		const { data: profile } = await supabase
			.from('profiles')
			.select('peran')
			.eq('id', user.id)
			.maybeSingle();
		if (!['superadmin', 'admin_tu'].includes(profile?.peran ?? '')) {
			return fail(403, { error: 'Tidak punya izin menghapus wali santri.' });
		}

		// Check relations
		const { count } = await supabase
			.from('santri')
			.select('id', { count: 'exact', head: true })
			.eq('wali_santri_id', params.id);

		if (count && count > 0) {
			return fail(400, {
				error: `Wali masih terhubung ke ${count} santri. Hapus atau pindahkan santri terlebih dahulu.`
			});
		}

		const { error: delErr } = await supabase.from('wali_santri').delete().eq('id', params.id);
		if (delErr) return fail(500, { error: delErr.message });

		throw redirect(303, '/wali');
	}
};
