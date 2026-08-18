import { error, redirect } from '@sveltejs/kit';

export async function load({ params, locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: kelas } = await supabase
		.from('kelas')
		.select('*')
		.eq('id', params.id)
		.maybeSingle();
	if (!kelas) throw error(404, 'Kelas tidak ditemukan');

	const [{ data: santri }, { data: kamar }, { data: wali }] = await Promise.all([
		supabase
			.from('santri')
			.select('id,nama_lengkap,nis,nisn,tempat_lahir,tanggal_lahir,status_santri,foto_url,kamar_id,wali_santri_id,alamat')
			.eq('kelas_id', params.id)
			.in('status_santri', ['aktif', 'khusus'])
			.order('nama_lengkap'),
		supabase.from('kamar').select('id,nomor'),
		supabase.from('wali_santri').select('id,nama_ayah,nama_ibu,nama_wali,no_hp,alamat')
	]);

	const kamarMap = Object.fromEntries((kamar ?? []).map((k) => [k.id, k.nomor]));
	const waliMap = Object.fromEntries(
		(wali ?? []).map((w) => [
			w.id,
			{
				label: w.nama_wali || w.nama_ayah || w.nama_ibu || '—',
				no_hp: w.no_hp || '—',
				alamat: w.alamat || '—'
			}
		])
	);

	return {
		kelas,
		santri: (santri ?? []).map((s) => ({
			...s,
			kamar_nomor: s.kamar_id ? kamarMap[s.kamar_id] ?? null : null,
			wali: s.wali_santri_id ? waliMap[s.wali_santri_id] ?? null : null
		}))
	};
}
