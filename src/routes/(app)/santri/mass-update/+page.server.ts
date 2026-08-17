import { fail, redirect } from '@sveltejs/kit';

const ADMIN_ROLES = ['superadmin', 'admin_tu'];

export async function load({ locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: profile } = await supabase
		.from('profiles')
		.select('peran')
		.eq('id', user.id)
		.maybeSingle();

	if (!ADMIN_ROLES.includes(profile?.peran ?? '')) throw redirect(303, '/santri');

	const { data: kelas } = await supabase
		.from('kelas')
		.select('id,tingkat,rombel,tahun_ajaran')
		.order('tahun_ajaran', { ascending: false, nullsFirst: false })
		.order('tingkat')
		.order('rombel');

	return { kelas: kelas ?? [] };
}

export const actions = {
	promote: async ({ locals, request }) => {
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		const fd = await request.formData();
		const fromId = Number(fd.get('from'));
		const toId = Number(fd.get('to'));
		if (!fromId || !toId || fromId === toId)
			return fail(400, { error: 'Pilih kelas asal dan tujuan yang berbeda.' });

		const [{ data: santri }, { data: targetKelas }] = await Promise.all([
			supabase.from('santri').select('id').eq('kelas_id', fromId).eq('status_santri', 'aktif'),
			supabase.from('kelas').select('tingkat,rombel,tahun_ajaran').eq('id', toId).maybeSingle()
		]);
		if (!santri?.length) return fail(400, { error: 'Tidak ada santri aktif di kelas asal.' });

		const ids = santri.map((s: { id: string }) => s.id);
		const { error } = await supabase.from('santri').update({ kelas_id: toId }).in('id', ids);
		if (error) return fail(400, { error: error.message });

		const label = targetKelas ? `${targetKelas.tingkat} ${targetKelas.rombel}` : toId;
		return { success: true, message: `${ids.length} santri dipindahkan ke kelas ${label}.` };
	},

	graduate: async ({ locals, request }) => {
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		const fd = await request.formData();
		const kelasId = Number(fd.get('kelas_id'));
		if (!kelasId) return fail(400, { error: 'Pilih kelas terlebih dahulu.' });

		const { data: santri } = await supabase
			.from('santri')
			.select('id')
			.eq('kelas_id', kelasId)
			.eq('status_santri', 'aktif');
		if (!santri?.length) return fail(400, { error: 'Tidak ada santri aktif di kelas ini.' });

		const ids = santri.map((s: { id: string }) => s.id);
		const { error } = await supabase.from('santri').update({ status_santri: 'lulus' }).in('id', ids);
		if (error) return fail(400, { error: error.message });

		return { success: true, message: `${ids.length} santri ditandai sebagai alumni (lulus).` };
	}
};
