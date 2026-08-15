import { error, redirect } from '@sveltejs/kit';

export async function load({ params, locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: kelas } = await supabase.from('kelas').select('*').eq('id', params.id).maybeSingle();
	if (!kelas) throw error(404, 'Kelas tidak ditemukan');

	const { data: santri } = await supabase
		.from('santri')
		.select('id,nama_lengkap,nisn,status_santri,jenis_kelamin,kamar(nomor)')
		.eq('kelas_id', params.id)
		.order('nama_lengkap');

	const laki = (santri ?? []).filter((s: any) => s.jenis_kelamin === 'L').length;
	const perempuan = (santri ?? []).filter((s: any) => s.jenis_kelamin === 'P').length;

	return {
		kelas,
		santri: (santri ?? []).map((s: any) => ({
			id: s.id,
			nama_lengkap: s.nama_lengkap,
			nisn: s.nisn,
			status_santri: s.status_santri,
			jenis_kelamin: s.jenis_kelamin,
			kamar: s.kamar ? `Kamar ${s.kamar.nomor}` : null
		})),
		rekap: { total: santri?.length ?? 0, laki, perempuan }
	};
}
