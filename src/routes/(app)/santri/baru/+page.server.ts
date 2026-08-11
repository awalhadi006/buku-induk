import { fail, redirect } from '@sveltejs/kit';
import { parseSantriForm } from '$lib/santri';

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

export const actions = {
	create: async ({ locals, request }) => {
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		const payload = parseSantriForm(await request.formData());
		if (!payload.nama_lengkap) return fail(400, { error: 'Nama lengkap wajib diisi.' });

		const { error: err } = await supabase.from('santri').insert(payload);
		if (err) return fail(400, { error: err.message });

		throw redirect(303, '/santri');
	}
};
