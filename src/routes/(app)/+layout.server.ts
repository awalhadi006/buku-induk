import { redirect } from '@sveltejs/kit';

export async function load(event) {
	const { user, supabase } = event.locals;
	if (!user) throw redirect(303, '/login');

	const { data: profile } = await supabase
		.from('profiles')
		.select('peran,nama,kamar_id,kelas_id')
		.eq('id', user.id)
		.maybeSingle();

	return { user, profile: profile ?? null };
}