import { redirect } from '@sveltejs/kit';
import type { Profile } from '$lib/types';

export const ADMIN_ROLES: readonly string[] = ['superadmin', 'admin_tu'];
export const UPLOAD_ROLES: readonly string[] = ['superadmin', 'admin_tu', 'wali_kamar', 'wali_kelas'];

export function hasRole(profile: Profile | null | undefined, roles: readonly string[]): boolean {
	return profile != null && roles.includes(profile.peran);
}

export async function getProfile(locals: App.Locals): Promise<Profile | null> {
	const { user, supabase } = locals;
	if (!user) return null;
	const { data, error } = await supabase
		.from('profiles')
		.select('peran,nama,kamar_id,kelas_id')
		.eq('id', user.id)
		.maybeSingle();
	if (error) return null;
	return data as Profile | null;
}

export async function requireAdmin(locals: App.Locals, fallbackPath = '/'): Promise<Profile> {
	const { user } = locals;
	if (!user) throw redirect(303, '/login');
	const profile = await getProfile(locals);
	if (!profile || !hasRole(profile, ADMIN_ROLES)) throw redirect(303, fallbackPath);
	return profile;
}

export async function requireSuperadmin(locals: App.Locals): Promise<Profile> {
	const { user } = locals;
	if (!user) throw redirect(303, '/login');
	const profile = await getProfile(locals);
	if (!profile || profile.peran !== 'superadmin') throw redirect(303, '/');
	return profile;
}
