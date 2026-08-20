import { fail, redirect } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/supabase-admin';

export async function load({ locals }) {
	if (locals.user) throw redirect(303, '/');
}

export const actions = {
	default: async ({ request, locals }) => {
		if (locals.user) throw redirect(303, '/');

		const fd = await request.formData();
		const username = (fd.get('username') as string)?.trim().toLowerCase() ?? '';
		const password = (fd.get('password') as string) ?? '';

		if (!username || !password) {
			return fail(400, { error: 'Username dan password wajib diisi.' });
		}

		// Lookup email from profiles by username (admin bypasses RLS)
		const admin = getSupabaseAdmin();
		const { data: profile } = await admin
			.from('profiles')
			.select('email')
			.eq('username', username)
			.maybeSingle();

		if (!profile?.email) {
			return fail(400, { error: 'Username tidak ditemukan.' });
		}

		// Sign in with the resolved email
		const { error } = await locals.supabase.auth.signInWithPassword({
			email: profile.email,
			password
		});

		if (error) {
			return fail(400, { error: 'Password salah.' });
		}

		throw redirect(303, '/');
	}
};
