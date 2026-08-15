import { error, redirect } from '@sveltejs/kit';

export async function load({ params, locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: wali } = await supabase.from('wali_santri').select('*').eq('id', params.id).maybeSingle();
	if (!wali) throw error(404, 'Wali santri tidak ditemukan');

	const { data: santri } = await supabase
		.from('santri')
		.select('id,nama_lengkap,nisn,kamar(nomor),kelas(tingkat,rombel)')
		.eq('wali_santri_id', params.id)
		.order('nama_lengkap');

	return {
		wali,
		santri: (santri ?? []).map((s: any) => ({
			id: s.id,
			nama_lengkap: s.nama_lengkap,
			nisn: s.nisn,
			kamar: s.kamar ? `Kamar ${s.kamar.nomor}` : '-',
			kelas: s.kelas ? `${s.kelas.tingkat} ${s.kelas.rombel}` : '-'
		}))
	};
}
