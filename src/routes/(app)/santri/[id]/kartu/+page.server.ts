import { error, redirect } from '@sveltejs/kit';

export async function load({ params, locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: santri } = await supabase
		.from('santri')
		.select('*')
		.eq('id', params.id)
		.maybeSingle();
	if (!santri) throw error(404, 'Santri tidak ditemukan');

	const [{ data: kamar }, { data: kelas }, { data: wali }] = await Promise.all([
		supabase.from('kamar').select('id,nomor'),
		supabase.from('kelas').select('id,tingkat,rombel'),
		supabase.from('wali_santri').select('id,nama_ayah,nama_ibu,nama_wali,no_hp,alamat')
	]);

	return {
		santri,
		kamar: kamar ?? [],
		kelas: kelas ?? [],
		wali: (wali ?? []).map((w) => ({
			id: w.id,
			label: w.nama_wali || w.nama_ayah || w.nama_ibu || '(wali tanpa nama)',
			no_hp: w.no_hp,
			alamat: w.alamat
		}))
	};
}
