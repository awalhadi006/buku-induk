import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (locals.user) throw redirect(303, '/');
}

export const actions = {
	default: async ({ request, locals }) => {
		// Debug logging sebelum semua logic
		console.log('Login: Starting (Server ID:', request.headers.get('x-cloudflare-request-id') || 'unknown', ')');
		console.log('Login: locals.user exists?', !!locals.user);
		console.log('Login: locals.supabase exists?', !!locals.supabase);

		if (!locals.supabase) {
			throw new Error('locals.supabase is not defined');
		}

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
				const errorDetail = {
					type: 'RPC_ERROR',
					identifier: identifier,
					message: lookupError.message || lookupError.toString(),
					code: lookupError.code,
					stack: lookupError.stack?.substring(0, 500),
					cliError: lookupError.toString()
				};
				console.error('Login: Lookup error:', errorDetail);
				return fail(500, { error: errorDetail });
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
			const errorDetail = {
				type: 'SYSTEM_ERROR',
				message: err.message || err.toString(),
				name: err.name,
				stack: err.stack?.substring(0, 500),
				cliError: err.toString(),
				request: {
					identifier: identifier ?? 'N/A',
					passwordProvided: !!password
				}
			};
			console.error('Login: Error:', JSON.stringify(errorDetail, null, 2));
			return fail(500, { error: errorDetail });
		}
	}
};
