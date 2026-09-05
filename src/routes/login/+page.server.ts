import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (locals.user) throw redirect(303, '/');
}

export const actions = {
	submit: async ({ request, locals }) => {
		// Debug logging sebelum semua logic
		console.log('Login: Starting (Server ID:', request.headers.get('x-cloudflare-request-id') || 'unknown', ')');
		console.log('Login: locals.user exists?', !!locals.user);
		console.log('Login: locals.supabase exists?', !!locals.supabase);

		if (!locals.supabase) {
			throw new Error('locals.supabase is not defined');
		}

		const fd = await request.formData();
		const identifier = (fd.get('username') as string)?.trim().toLowerCase() ?? '';
		const password = (fd.get('password') as string) ?? '';

		try {
			if (locals.user) {
				console.log('Login: User already logged in, redirecting');
				throw redirect(303, '/');
			}

			if (!identifier || !password) {
				console.log('Login: Missing identifier or password');
				return fail(400, { error: 'Username/email dan password wajib diisi.' });
			}

			// Lookup email via security-definer function (bypasses RLS)
			console.log('Login: Looking up email for identifier:', identifier);

			// Cek apakah input itu email atau username (cek format email)
			const isEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

			console.log('Login: Is email format?', isEmailFormat);

			if (isEmailFormat) {
				console.log('Login: Trying query directly for email:', identifier);
				const { profile, error: queryError } = await locals.supabase
					.from('profiles')
					.select('email')
					.eq('email', identifier)
					.maybeSingle();

				console.log('Login: Email query result:', profile, 'error:', queryError);
				if (queryError) {
					console.error('Login: Email query error:', queryError);
					return fail(500, { error: queryError.message || 'Query database gagal' });
				}
				if (!profile) {
					return fail(400, { error: 'Akun tidak ditemukan.' });
				}
			}

// Atau cari lewat RPC untuk username
		console.log('Login: Calling RPC "login_lookup" with identifier:', identifier);

		const result = await locals.supabase
			.rpc('login_lookup', { p_identifier: identifier });

		console.log('Login: RPC raw result:', result);
		console.log('Login: RPC data:', result.data);
		console.log('Login: RPC error:', result.error);

		const emailResult = result.data as string | null;
		const rpcError = result.error;

		console.log('Login: Parsed result - emailResult:', emailResult, 'rpcError:', rpcError);

			if (rpcError && !isEmailFormat) {
				console.error('Login: RPC error (and not email format):', rpcError);
				return fail(500, { error: rpcError.message || 'Gagal login' });
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
