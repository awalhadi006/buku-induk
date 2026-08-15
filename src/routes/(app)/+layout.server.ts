import { redirect } from '@sveltejs/kit';

export async function load(event) {
	const { user, supabase } = event.locals;
	if (!user) throw redirect(303, '/login');

	const { data: profile } = await supabase
		.from('profiles')
		.select('peran,nama,kamar_id,kelas_id')
		.eq('id', user.id)
		.maybeSingle();

	let pendingRequests = 0;
	if (profile && ['superadmin', 'admin_tu'].includes(profile.peran)) {
		const { count } = await supabase
			.from('santri_change_requests')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'pending');
		pendingRequests = count ?? 0;
	}

	return { user, profile: profile ?? null, pendingRequests };
}