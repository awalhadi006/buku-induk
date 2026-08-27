import { fail, redirect } from '@sveltejs/kit';
import { parseWaliForm } from '$lib/wali';
import { humanizeError } from '$lib/errors';

export async function load({ locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: profile } = await supabase
		.from('profiles')
		.select('peran')
		.eq('id', user.id)
		.maybeSingle();
	if (!['superadmin', 'admin_tu'].includes(profile?.peran ?? '')) throw redirect(303, '/wali');

	return {};
}

export const actions = {
	create: async ({ locals, request }) => {
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		const payload = parseWaliForm(await request.formData());
		if (!payload.nama_ayah && !payload.nama_ibu && !payload.nama_wali) {
			return fail(400, { error: 'Isi minimal satu nama: ayah, ibu, atau wali.' });
		}

		const { data, error: err } = await supabase
			.from('wali_santri')
			.insert(payload)
			.select('id')
			.single();
		if (err) return fail(400, { error: humanizeError(err) });

		throw redirect(303, `/wali/${data.id}`);
	}
};
