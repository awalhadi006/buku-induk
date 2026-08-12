import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data } = await supabase
		.from('wali_santri')
		.select('id,nama_ayah,nama_ibu,nama_wali,no_hp,alamat,santri(nama_lengkap)')
		.order('created_at')
		.limit(100);

	const wali = (data ?? []).map((w: any) => ({
		id: w.id,
		nama_ayah: w.nama_ayah,
		nama_ibu: w.nama_ibu,
		nama_wali: w.nama_wali,
		no_hp: w.no_hp,
		alamat: w.alamat,
		jumlah_santri: Array.isArray(w.santri) ? w.santri.length : 0
	}));

	return { wali };
}
