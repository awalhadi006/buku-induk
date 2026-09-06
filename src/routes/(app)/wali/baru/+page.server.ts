import { fail, redirect } from '@sveltejs/kit';
import { parseWaliForm } from '$lib/wali';
import { humanizeError } from '$lib/errors';
import { requireAdmin } from '$lib/server/auth';

export async function load(event) {
	await requireAdmin(event.locals, '/wali');
	return {};
}

export const actions = {
	create: async ({ locals, request }) => {
		const profile = await requireAdmin(locals);
		const fd = await request.formData();
		const payload = parseWaliForm(fd);
		if (!payload.nama_ayah && !payload.nama_ibu && !payload.nama_wali) {
			return fail(400, { error: 'Isi minimal satu nama: ayah, ibu, atau wali.' });
		}

		const { data, error: err } = await locals.supabase
			.from('wali_santri')
			.insert(payload)
			.select('id')
			.single();
		if (err) return fail(400, { error: humanizeError(err) });

		throw redirect(303, `/wali/${data.id}`);
	}
};
