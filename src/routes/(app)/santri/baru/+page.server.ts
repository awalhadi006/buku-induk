import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: profile } = await supabase
		.from('profiles')
		.select('peran')
		.eq('id', user.id)
		.maybeSingle();
	if (!['superadmin', 'admin_tu'].includes(profile?.peran ?? '')) throw redirect(303, '/santri');

	const [{ data: kamar }, { data: kelas }, { data: wali }] = await Promise.all([
		supabase.from('kamar').select('id,nomor').eq('aktif', true).order('nomor'),
		supabase.from('kelas').select('id,tingkat,rombel').eq('aktif', true).order('tingkat').order('rombel'),
		supabase.from('wali_santri').select('id,nama_ayah,nama_ibu,nama_wali').order('created_at')
	]);

	return {
		kamar: kamar ?? [],
		kelas: kelas ?? [],
		wali: (wali ?? []).map((w) => ({
			id: w.id,
			label: w.nama_wali || w.nama_ayah || w.nama_ibu || '(wali tanpa nama)'
		}))
	};
}
