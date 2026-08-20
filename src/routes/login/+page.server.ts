import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (locals.user) throw redirect(303, '/');
}

export const actions = {
	default: async ({ request, locals }) => {
		if (locals.user) throw redirect(303, '/');

		const fd = await request.formData();
		const identifier = (fd.get('username') as string)?.trim().toLowerCase() ?? '';
		const password = (fd.get('password') as string) ?? '';

		if (!identifier || !password) {
			return fail(400, { error: 'Username/email dan password wajib diisi.' });
		}

		// Lookup email via security-definer function (bypasses RLS)
		const { data: email } = await locals.supabase
			.rpc('login_lookup', { p_identifier: identifier });

		if (!email) {
			return fail(400, { error: 'Akun tidak ditemukan.' });
		}

		// Sign in with the resolved email
		const { error } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			return fail(400, { error: 'Password salah.' });
		}

		throw redirect(303, '/');
	}
};
