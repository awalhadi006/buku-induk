import { error, fail, redirect } from '@sveltejs/kit';
import { parseWaliForm } from '$lib/wali';

export async function load({ params, locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: wali } = await supabase
		.from('wali_santri')
		.select('*')
		.eq('id', params.id)
		.maybeSingle();
	if (!wali) throw error(404, 'Wali santri tidak ditemukan');

	const { data: santri } = await supabase
		.from('santri')
		.select('id,nama_lengkap,nisn,status_santri,kamar(nomor),kelas(tingkat,rombel)')
		.eq('wali_santri_id', params.id)
		.order('nama_lengkap');

	return {
		wali,
		santri: (santri ?? []).map((s: any) => ({
			id: s.id,
			nama_lengkap: s.nama_lengkap,
			nisn: s.nisn,
			status_santri: s.status_santri,
			kamar: Array.isArray(s.kamar) ? (s.kamar[0] ?? null) : (s.kamar ?? null),
			kelas: Array.isArray(s.kelas) ? (s.kelas[0] ?? null) : (s.kelas ?? null)
		}))
	};
}

export const actions = {
	update: async ({ params, locals, request }) => {
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		const payload = parseWaliForm(await request.formData());
		if (!payload.nama_ayah && !payload.nama_ibu && !payload.nama_wali) {
			return fail(400, { error: 'Isi minimal satu nama: ayah, ibu, atau wali.' });
		}

		const { error: err } = await supabase
			.from('wali_santri')
			.update(payload)
			.eq('id', params.id);
		if (err) return fail(400, { error: err.message });

		throw redirect(303, `/wali/${params.id}`);
	},
	delete: async ({ params, locals }) => {
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		const { error: err } = await supabase
			.from('wali_santri')
			.delete()
			.eq('id', params.id);
		if (err) return fail(400, { error: err.message });

		throw redirect(303, '/wali');
	}
};
