import { redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';

export async function load(event) {
	await requireAdmin(event.locals);
	return {};
}