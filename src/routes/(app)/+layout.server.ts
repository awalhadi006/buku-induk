import { redirect } from '@sveltejs/kit';
import { parseSidebarNav } from '$lib/nav';

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

	const { data: sidebarSetting } = await supabase
		.from('settings')
		.select('value')
		.eq('key', 'sidebar_nav')
		.maybeSingle();

	const sidebarNav = parseSidebarNav(sidebarSetting?.value);

	return { user, profile: profile ?? null, pendingRequests, sidebarNav };
}