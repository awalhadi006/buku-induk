import { redirect } from '@sveltejs/kit';
import type { Rekap } from '$lib/types';

export async function load({ locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data } = await supabase.rpc('fn_rekap');
	return { rekap: data as Rekap | null };
}
