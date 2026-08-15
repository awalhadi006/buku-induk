import { redirect, fail } from '@sveltejs/kit';

export async function load({ locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: profile } = await supabase.from('profiles').select('peran').eq('id', user.id).maybeSingle();
	if (!['superadmin', 'admin_tu'].includes(profile?.peran ?? '')) {
		throw redirect(303, '/');
	}

	const { data: requests, error } = await supabase
		.from('santri_change_requests')
		.select(`
			id,
			field,
			old_value,
			new_value,
			status,
			created_at,
			santri:santri_id (id, nama_lengkap),
			applicant:requested_by (id, nama)
		`)
		.order('created_at', { ascending: false });

	if (error) {
		return { requests: [], error: error.message };
	}

	return { requests: requests ?? [] };
}

export const actions = {
	approve: async ({ locals, request }) => {
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		if (!Number.isInteger(id)) return fail(400, { error: 'ID tidak valid.' });

		// Fetch request detail
		const { data: reqData } = await supabase
			.from('santri_change_requests')
			.select('*')
			.eq('id', id)
			.maybeSingle();

		if (!reqData || reqData.status !== 'pending') {
			return fail(400, { error: 'Permintaan tidak ditemukan atau sudah diproses.' });
		}

		// Apply update to santri table
		const { error: updateErr } = await supabase
			.from('santri')
			.update({ [reqData.field]: reqData.new_value })
			.eq('id', reqData.santri_id as string);

		if (updateErr) return fail(400, { error: `Gagal memperbarui santri: ${updateErr.message}` });

		// Mark request as approved
		const { error: reqErr } = await supabase
			.from('santri_change_requests')
			.update({
				status: 'approved',
				reviewed_by: user.id,
				reviewed_at: new Date().toISOString()
			})
			.eq('id', id);

		if (reqErr) return fail(400, { error: reqErr.message });

		return { success: true };
	},

	reject: async ({ locals, request }) => {
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		if (!Number.isInteger(id)) return fail(400, { error: 'ID tidak valid.' });

		const { error } = await supabase
			.from('santri_change_requests')
			.update({
				status: 'rejected',
				reviewed_by: user.id,
				reviewed_at: new Date().toISOString()
			})
			.eq('id', id);

		if (error) return fail(400, { error: error.message });

		return { success: true };
	}
};
