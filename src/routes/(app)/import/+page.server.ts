import { redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';

export async function load(event) {
	await requireAdmin(event.locals);

	const [{ data: kamar }, { data: kelas }] = await Promise.all([
		event.locals.supabase.from('kamar').select('id,nomor').eq('aktif', true),
		event.locals.supabase.from('kelas').select('id,tingkat,rombel').eq('aktif', true)
	]);

	return {
		kamar: kamar ?? [],
		kelas: kelas ?? []
	};
}