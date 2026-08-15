import { error, redirect } from '@sveltejs/kit';

export async function load({ params, locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: kamar } = await supabase.from('kamar').select('*').eq('id', params.id).maybeSingle();
	if (!kamar) throw error(404, 'Kamar tidak ditemukan');

	const { data: santri } = await supabase
		.from('santri')
		.select('id,nama_lengkap,nisn,status_santri,jenis_kelamin,kelas(tingkat,rombel)')
		.eq('kamar_id', params.id)
		.order('nama_lengkap');

	const laki = (santri ?? []).filter((s: any) => s.jenis_kelamin === 'L').length;
	const perempuan = (santri ?? []).filter((s: any) => s.jenis_kelamin === 'P').length;

	return {
		kamar,
		santri: (santri ?? []).map((s: any) => ({
			id: s.id,
			nama_lengkap: s.nama_lengkap,
			nisn: s.nisn,
			status_santri: s.status_santri,
			jenis_kelamin: s.jenis_kelamin,
			kelas: s.kelas ? `${s.kelas.tingkat} ${s.kelas.rombel}` : null
		})),
		rekap: { total: santri?.length ?? 0, laki, perempuan }
	};
}
