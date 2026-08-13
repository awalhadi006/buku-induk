import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { user } = locals;
	if (!user) throw redirect(303, '/login');
	return {};
}
