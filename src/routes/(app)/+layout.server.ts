import { redirect } from '@sveltejs/kit';
import { parseSidebarNav } from '$lib/nav';
import { ADMIN_ROLES } from '$lib/server/auth';

export async function load(event) {
	const { user, supabase } = event.locals;
	if (!user) throw redirect(303, '/login');

	const { data: profile } = await supabase
		.from('profiles')
		.select('peran,nama,kamar_id,kelas_id')
		.eq('id', user.id)
		.maybeSingle();

	let pendingRequests = 0;
	if (profile && ADMIN_ROLES.includes(profile.peran)) {
		const { count } = await supabase
			.from('santri_change_requests')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'pending');
		pendingRequests = count ?? 0;
	}

	const { data: settings } = await supabase
		.from('settings')
		.select('key,value')
		.in('key', ['sidebar_nav', 'school_name', 'school_logo_url', 'tahun_ajaran_aktif']);

	const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));

	const sidebarNav = parseSidebarNav(settingsMap.sidebar_nav);

	return {
		user,
		profile: profile ?? null,
		pendingRequests,
		sidebarNav,
		schoolName: settingsMap.school_name ?? null,
		schoolLogoUrl: settingsMap.school_logo_url ?? null,
		tahunAjaranAktif: settingsMap.tahun_ajaran_aktif ?? null
	};
}