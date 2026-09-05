import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (locals.user) throw redirect(303, '/');
}

export const actions = {
	default: async ({ request, locals }) => {
		try {
			if (locals.user) {
				console.log('Login: User already logged in, redirecting');
				throw redirect(303, '/');
			}

			const fd = await request.formData();
			const identifier = (fd.get('username') as string)?.trim().toLowerCase() ?? '';
			const password = (fd.get('password') as string) ?? '';

			if (!identifier || !password) {
				console.log('Login: Missing identifier or password');
				return fail(400, { error: 'Username/email dan password wajib diisi.' });
			}

			// Lookup email via security-definer function (bypasses RLS)
			console.log('Login: Looking up email for identifier:', identifier);
			const { emailResult, error: lookupError } = await locals.supabase
				.rpc('login_lookup', { p_identifier: identifier });

			if (lookupError) {
				console.error('Login: Lookup error:', loginError);
				throw lookupError;
			}

			if (!emailResult) {
				console.log('Login: Email not found for identifier:', identifier);
				return fail(400, { error: 'Akun tidak ditemukan.' });
			}

			console.log('Login: Email found:', emailResult);

			// Sign in with the resolved email
			const { error: signInError } = await locals.supabase.auth.signInWithPassword({
				email: emailResult,
				password
			});

			if (signInError) {
				console.error('Login: Sign-in error:', signInError);
				return fail(400, { error: 'Password salah.' });
			}

			console.log('Login: Success, redirecting to /');
			throw redirect(303, '/');
		} catch (err) {
			console.error('Login: Error:', err);
			throw err;
		}
	}
};
