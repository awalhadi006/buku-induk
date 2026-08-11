import type { Rekap } from '$lib/types';

export async function load({ locals }) {
	const { data } = await locals.supabase.rpc('fn_rekap');
	return { rekap: data as Rekap | null };
}