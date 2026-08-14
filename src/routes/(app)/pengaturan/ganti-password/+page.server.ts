import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const { user } = locals;
	if (!user) throw redirect(303, '/login');
	return {};
}

export const actions = {
	changePassword: async ({ request, locals }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const password = formData.get('password') as string;
		const passwordConfirm = formData.get('passwordConfirm') as string;

		if (!password || !passwordConfirm) {
			return fail(400, { error: 'Semua field wajib diisi.' });
		}

		if (password !== passwordConfirm) {
			return fail(400, { error: 'Kata sandi baru tidak cocok.' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Kata sandi minimal 6 karakter.' });
		}

		const { error } = await supabase.auth.updateUser({ password });

		if (error) {
			return fail(500, { error: error.message });
		}
		// Log out user after password change for security reasons
		await supabase.auth.signOut();
		throw redirect(303, '/login?message=password_changed');
	}
};
