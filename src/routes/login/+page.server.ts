import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (locals.user) throw redirect(303, '/');

	const { data: settings } = await locals.supabase
		.from('settings')
		.select('key,value')
		.in('key', ['school_name', 'school_logo_url']);

	const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));

	return {
		schoolName: settingsMap.school_name ?? null,
		schoolLogoUrl: settingsMap.school_logo_url ?? null
	};
}

export const actions = {
	submit: async ({ request, locals }) => {
		if (!locals.supabase) {
			throw new Error('locals.supabase is not defined');
		}

		const fd = await request.formData();
		const identifier = (fd.get('username') as string)?.trim().toLowerCase() ?? '';
		const password = (fd.get('password') as string) ?? '';

		if (!identifier || !password) {
			return fail(400, { error: 'Username/email dan password wajib diisi.' });
		}

		try {
			if (locals.user) throw redirect(303, '/');

			const result = await locals.supabase
				.rpc('login_lookup', { p_identifier: identifier });

			if (result.error) {
				return fail(500, { error: result.error.message || 'Gagal login' });
			}

			const email = result.data as string | null;
			if (!email) {
				return fail(400, { error: 'Akun tidak ditemukan.' });
			}

			const { error: signInError } = await locals.supabase.auth.signInWithPassword({
				email,
				password
			});

			if (signInError) {
				return fail(400, { error: 'Password salah.' });
			}

			throw redirect(303, '/');
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && (err.status === 303 || err.status === 302)) {
				throw err;
			}
			console.error('Login error:', err);
			return fail(500, { error: 'Terjadi kesalahan sistem.' });
		}
	}
};
